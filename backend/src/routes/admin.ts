import { Router } from 'express'
import { db } from '../config/database.js'
import { requireOpenAI, MODELS } from '../config/openai.js'
import { YOUNG_PLAYERS } from '../config/constants.js'

const router = Router()

// Get full game status
router.get('/status', (req, res) => {
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get() as {
    status: string
    started_at: string | null
    ended_at: string | null
  }

  const players = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.team_number as team,
      p.is_admin as isAdmin,
      p.is_logged_in as isLoggedIn,
      p.team_name_suggestion as teamNameSuggestion,
      CASE WHEN st.id IS NOT NULL THEN 1 ELSE 0 END as hasTell,
      CASE WHEN sm.id IS NOT NULL THEN 1 ELSE 0 END as hasMission,
      (SELECT COUNT(*) FROM tell_guesses WHERE guesser_id = p.id) as guessCount,
      (SELECT COUNT(*) FROM mission_completions WHERE player_id = p.id) as missionCount
    FROM players p
    LEFT JOIN selected_tells st ON p.id = st.player_id
    LEFT JOIN selected_missions sm ON p.id = sm.player_id
    ORDER BY p.name
  `).all()

  const stats = {
    totalPlayers: players.length,
    loggedIn: players.filter((p: any) => p.isLoggedIn).length,
    hasTell: players.filter((p: any) => p.hasTell).length,
    hasMission: players.filter((p: any) => p.hasMission).length,
  }

  res.json({
    gameState: {
      status: gameState.status,
      startedAt: gameState.started_at,
      endedAt: gameState.ended_at,
    },
    players,
    stats,
  })
})

// Start the game
router.post('/start-game', (req, res) => {
  db.prepare(`
    UPDATE game_state
    SET status = 'active', started_at = datetime('now')
    WHERE id = 1
  `).run()

  res.json({ success: true })
})

// End the game and judge everything (guesses, team names, fun awards)
router.post('/end-game', async (req, res) => {
  try {
    // First, mark game as finished
    db.prepare(`
      UPDATE game_state
      SET status = 'finished', ended_at = datetime('now')
      WHERE id = 1
    `).run()

    // 1. JUDGE ALL GUESSES
    const guesses = db.prepare(`
      SELECT
        tg.id as guessId,
        tg.free_text_guess as guessText,
        tg.target_player_id as targetPlayerId,
        p.name as targetName,
        t.option_text as actualTell,
        st.tell_option_id as correctOptionId
      FROM tell_guesses tg
      JOIN players p ON tg.target_player_id = p.id
      JOIN selected_tells st ON tg.target_player_id = st.player_id
      JOIN tell_options t ON st.tell_option_id = t.id
      WHERE tg.free_text_guess IS NOT NULL
    `).all() as {
      guessId: number
      guessText: string
      targetPlayerId: number
      targetName: string
      actualTell: string
      correctOptionId: number
    }[]

    const updateGuess = db.prepare(`
      UPDATE tell_guesses
      SET guessed_tell_option_id = ?, ai_reasoning = ?
      WHERE id = ?
    `)

    let judgedCount = 0
    for (const guess of guesses) {
      try {
        const prompt = `You are a judge in a fun family Christmas game. A player guessed what another player's secret "tell" (subtle behavior) is.

${guess.targetName}'s ACTUAL secret tell was: "${guess.actualTell}"

The guesser wrote: "${guess.guessText}"

Determine if the guess correctly identifies the same behavior/action. It doesn't need to be word-for-word - look for whether they've identified the core behavior.

Respond with valid JSON:
{
  "isCorrect": <true or false>,
  "reasoning": "<Brief, fun 1-sentence explanation>"
}

Be fair but generous - if they captured the essence, count it as correct.`

        const response = await requireOpenAI().chat.completions.create({
          model: MODELS.text,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        })

        const content = response.choices[0].message.content
        if (content) {
          const result = JSON.parse(content)
          const matchedOptionId = result.isCorrect ? guess.correctOptionId : null
          updateGuess.run(matchedOptionId, result.reasoning || '', guess.guessId)
          judgedCount++
        }
      } catch (error) {
        console.error(`Error judging guess ${guess.guessId}:`, error)
        updateGuess.run(null, 'AI judging failed', guess.guessId)
      }
    }
    console.log(`Judged ${judgedCount} guesses`)

    // 2. JUDGE TEAM NAMES (one winner per team, 2 points each)
    const suggestions = db.prepare(`
      SELECT p.id, p.name, p.team_number as team, p.team_name_suggestion as suggestion
      FROM players p
      WHERE p.team_name_suggestion IS NOT NULL AND p.team_name_suggestion != ''
    `).all() as { id: number; name: string; team: number; suggestion: string }[]

    const teamSuggestions: Record<number, typeof suggestions> = { 1: [], 2: [], 3: [] }
    for (const s of suggestions) {
      teamSuggestions[s.team].push(s)
    }

    const teamNameWinners: { playerId: number; playerName: string; team: number; suggestion: string; reasoning: string }[] = []

    for (const teamNum of [1, 2, 3]) {
      const teamEntries = teamSuggestions[teamNum]
      if (teamEntries.length === 0) continue

      if (teamEntries.length === 1) {
        teamNameWinners.push({
          playerId: teamEntries[0].id,
          playerName: teamEntries[0].name,
          team: teamNum,
          suggestion: teamEntries[0].suggestion,
          reasoning: 'The only suggestion for this team - winner by default!'
        })
        continue
      }

      try {
        const prompt = `You are a fun, fair judge for a family Christmas game.

Team ${teamNum} has these team name suggestions:
${teamEntries.map((s) => `- "${s.suggestion}" (by ${s.name})`).join('\n')}

Pick the BEST team name based on:
- Creativity and originality
- How festive/Christmas-y it is
- How fun and memorable it is
- Cleverness or wordplay

Respond with valid JSON:
{
  "winnerName": "<exact name of the winner: ${teamEntries.map(s => s.name).join(' or ')}>",
  "reasoning": "<A fun, humorous 1-2 sentence explanation of why this name won and why the others didn't quite make the cut>"
}`

        const response = await requireOpenAI().chat.completions.create({
          model: MODELS.text,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        })

        const content = response.choices[0].message.content
        if (content) {
          const result = JSON.parse(content)
          const winner = teamEntries.find((s) => s.name === result.winnerName)
          if (winner) {
            teamNameWinners.push({
              playerId: winner.id,
              playerName: winner.name,
              team: teamNum,
              suggestion: winner.suggestion,
              reasoning: result.reasoning
            })
          }
        }
      } catch (error) {
        console.error(`Error judging team ${teamNum} names:`, error)
      }
    }
    console.log(`Judged team names, ${teamNameWinners.length} winners`)

    // 3. GENERATE FUN AWARDS
    const players = db.prepare('SELECT id, name, team_number as team FROM players').all() as {
      id: number
      name: string
      team: number
    }[]

    const playerStats = players.map(player => {
      const missionCount = db.prepare(
        'SELECT COUNT(*) as count FROM mission_completions WHERE player_id = ?'
      ).get(player.id) as { count: number }

      const correctGuesses = db.prepare(`
        SELECT COUNT(*) as count
        FROM tell_guesses tg
        JOIN selected_tells st ON tg.target_player_id = st.player_id
        WHERE tg.guesser_id = ? AND tg.guessed_tell_option_id = st.tell_option_id
      `).get(player.id) as { count: number }

      const selectedTell = db.prepare('SELECT tell_option_id FROM selected_tells WHERE player_id = ?').get(player.id) as { tell_option_id: number } | undefined
      let fooledCount = 0
      if (selectedTell) {
        const wrongGuesses = db.prepare(`
          SELECT COUNT(*) as count FROM tell_guesses
          WHERE target_player_id = ? AND guessed_tell_option_id != ?
        `).get(player.id, selectedTell.tell_option_id) as { count: number }
        fooledCount = wrongGuesses.count
      }

      return {
        ...player,
        missionCount: missionCount.count,
        correctGuesses: correctGuesses.count,
        fooledCount,
        isYoungPlayer: YOUNG_PLAYERS.includes(player.name)
      }
    })

    let funAwards: { name: string; award: string; reason: string }[] = []
    try {
      const awardsPrompt = `You are awarding fun, silly prizes at a family Christmas game night. Here are the player stats:

${playerStats.map(p => `- ${p.name}: ${p.missionCount} missions completed, ${p.correctGuesses} correct guess(es), fooled ${p.fooledCount} people${p.isYoungPlayer ? ' (YOUNG PLAYER - give extra encouragement!)' : ''}`).join('\n')}

Create fun awards for EVERY player. Make them humorous, festive, and positive. Awards for lower performers should be funny and celebratory, not mean.

Young players (${YOUNG_PLAYERS.join(', ')}) should get especially encouraging awards.

Respond with valid JSON:
{
  "awards": [
    {"name": "PlayerName", "award": "Award Title", "reason": "Fun 1-sentence reason"}
  ]
}

Make sure EVERY player gets exactly one award. Be creative and funny!`

      const awardsResponse = await requireOpenAI().chat.completions.create({
        model: MODELS.text,
        messages: [{ role: 'user', content: awardsPrompt }],
        response_format: { type: 'json_object' },
      })

      const awardsContent = awardsResponse.choices[0].message.content
      if (awardsContent) {
        const result = JSON.parse(awardsContent)
        funAwards = result.awards || []
      }
    } catch (error) {
      console.error('Error generating fun awards:', error)
    }
    console.log(`Generated ${funAwards.length} fun awards`)

    // 4. STORE ALL RESULTS
    db.prepare(`
      UPDATE game_state
      SET team_name_winners = ?, fun_awards = ?
      WHERE id = 1
    `).run(JSON.stringify(teamNameWinners), JSON.stringify(funAwards))

    res.json({
      success: true,
      judgedGuesses: judgedCount,
      teamNameWinners: teamNameWinners.length,
      funAwards: funAwards.length
    })
  } catch (error) {
    console.error('Error ending game:', error)
    res.status(500).json({ error: 'Failed to end game' })
  }
})

// Restart the game
router.post('/restart', (req, res) => {
  // Clear all game data
  db.exec(`
    DELETE FROM tell_guesses;
    DELETE FROM mission_completions;
    DELETE FROM selected_tells;
    DELETE FROM selected_missions;
    DELETE FROM tell_options;
    DELETE FROM mission_options;
    UPDATE players SET is_logged_in = 0, team_name_suggestion = NULL, logged_in_at = NULL;
    UPDATE game_state SET status = 'setup', started_at = NULL, ended_at = NULL, team_name_winners = NULL, fun_awards = NULL WHERE id = 1;
  `)

  res.json({ success: true })
})

export default router
