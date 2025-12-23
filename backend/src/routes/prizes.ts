import { Router } from 'express'
import { db } from '../config/database.js'
import { requireOpenAI, MODELS } from '../config/openai.js'
import { YOUNG_PLAYERS } from '../config/constants.js'

const router = Router()

interface PlayerScore {
  id: number
  name: string
  team: number
  tellPoints: number
  missionPoints: number
  teamNamePoints: number
  totalPoints: number
  breakdown: string[]
}

// Calculate all scores
router.get('/scores', (req, res) => {
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get() as {
    status: string
    ended_at: string | null
    winning_team_name_player_id: number | null
  }

  if (gameState.status !== 'finished') {
    return res.status(400).json({ error: 'Game not finished yet' })
  }

  // Get team name winner info
  let teamNameWinner = null
  if (gameState.winning_team_name_player_id) {
    teamNameWinner = db.prepare(`
      SELECT p.id, p.name, p.team_number as team, p.team_name_suggestion as suggestion
      FROM players p WHERE p.id = ?
    `).get(gameState.winning_team_name_player_id) as { id: number; name: string; team: number; suggestion: string } | undefined
  }

  // Get all team name suggestions
  const allTeamNameSuggestions = db.prepare(`
    SELECT p.name, p.team_number as team, p.team_name_suggestion as suggestion
    FROM players p
    WHERE p.team_name_suggestion IS NOT NULL AND p.team_name_suggestion != ''
  `).all() as { name: string; team: number; suggestion: string }[]

  const players = db.prepare('SELECT id, name, team_number as team FROM players').all() as {
    id: number
    name: string
    team: number
  }[]

  const scores: PlayerScore[] = players.map((player) => {
    const breakdown: string[] = []
    let tellPoints = 0
    let missionPoints = 0
    let teamNamePoints = 0

    // 1. Points for correct guesses
    const correctGuesses = db.prepare(`
      SELECT tg.*, st.tell_option_id as correct_option_id
      FROM tell_guesses tg
      JOIN selected_tells st ON tg.target_player_id = st.player_id
      WHERE tg.guesser_id = ?
      AND tg.guessed_tell_option_id = st.tell_option_id
    `).all(player.id) as any[]

    for (const guess of correctGuesses) {
      tellPoints += 1
      breakdown.push(`+1 for correctly guessing a tell`)

      // Early bonus: hours before game end
      if (gameState.ended_at) {
        const guessTime = new Date(guess.updated_at).getTime()
        const endTime = new Date(gameState.ended_at).getTime()
        const hoursEarly = Math.floor((endTime - guessTime) / (1000 * 60 * 60))
        if (hoursEarly > 0) {
          tellPoints += hoursEarly
          breakdown.push(`+${hoursEarly} early guess bonus`)
        }
      }
    }

    // 2. Points for people who didn't guess your tell correctly
    const selectedTell = db.prepare('SELECT tell_option_id FROM selected_tells WHERE player_id = ?').get(player.id) as { tell_option_id: number } | undefined

    if (selectedTell) {
      const wrongGuesses = db.prepare(`
        SELECT COUNT(*) as count FROM tell_guesses
        WHERE target_player_id = ?
        AND guessed_tell_option_id != ?
      `).get(player.id, selectedTell.tell_option_id) as { count: number }

      const stealthBonus = Math.ceil(wrongGuesses.count / 2)
      if (stealthBonus > 0) {
        tellPoints += stealthBonus
        breakdown.push(`+${stealthBonus} stealth bonus (${wrongGuesses.count} wrong guesses)`)
      }
    }

    // 3. Mission completions
    const missionCount = db.prepare(
      'SELECT COUNT(*) as count FROM mission_completions WHERE player_id = ?'
    ).get(player.id) as { count: number }

    missionPoints = missionCount.count
    if (missionPoints > 0) {
      breakdown.push(`+${missionPoints} mission completions`)
    }

    // 4. Team name bonus
    if (gameState.winning_team_name_player_id === player.id) {
      teamNamePoints = 1
      breakdown.push(`+1 winning team name`)
    }

    return {
      id: player.id,
      name: player.name,
      team: player.team,
      tellPoints,
      missionPoints,
      teamNamePoints,
      totalPoints: tellPoints + missionPoints + teamNamePoints,
      breakdown,
    }
  })

  // Sort by total points descending
  scores.sort((a, b) => b.totalPoints - a.totalPoints)

  // Calculate team scores
  const teamScores = [1, 2, 3].map((teamNum) => {
    const teamPlayers = scores.filter((s) => s.team === teamNum)
    const totalPoints = teamPlayers.reduce((sum, p) => sum + p.totalPoints, 0)
    return {
      team: teamNum,
      totalPoints,
      players: teamPlayers,
    }
  })

  teamScores.sort((a, b) => b.totalPoints - a.totalPoints)

  res.json({
    players: scores,
    teams: teamScores,
    teamNameWinner,
    allTeamNameSuggestions
  })
})

// Get all reveals
router.get('/reveals', (req, res) => {
  const gameState = db.prepare('SELECT status FROM game_state WHERE id = 1').get() as { status: string }

  if (gameState.status !== 'finished') {
    return res.status(400).json({ error: 'Game not finished yet' })
  }

  // Get all tells
  const tells = db.prepare(`
    SELECT
      p.id as playerId,
      p.name as playerName,
      t.option_text as tellText,
      st.image_url as imageUrl
    FROM players p
    LEFT JOIN selected_tells st ON p.id = st.player_id
    LEFT JOIN tell_options t ON st.tell_option_id = t.id
    ORDER BY p.name
  `).all()

  // Get all missions
  const missions = db.prepare(`
    SELECT
      p.id as playerId,
      p.name as playerName,
      m.option_text as missionText,
      sm.image_url as imageUrl,
      (SELECT COUNT(*) FROM mission_completions WHERE player_id = p.id) as completionCount
    FROM players p
    LEFT JOIN selected_missions sm ON p.id = sm.player_id
    LEFT JOIN mission_options m ON sm.mission_option_id = m.id
    ORDER BY p.name
  `).all()

  // Get all guesses with correctness
  const guesses = db.prepare(`
    SELECT
      g.name as guesserName,
      t.name as targetName,
      tg.free_text_guess as guessText,
      o.option_text as matchedOptionText,
      actual.option_text as actualTellText,
      CASE WHEN st.tell_option_id = tg.guessed_tell_option_id THEN 1 ELSE 0 END as isCorrect
    FROM tell_guesses tg
    JOIN players g ON tg.guesser_id = g.id
    JOIN players t ON tg.target_player_id = t.id
    LEFT JOIN tell_options o ON tg.guessed_tell_option_id = o.id
    LEFT JOIN selected_tells st ON tg.target_player_id = st.player_id
    LEFT JOIN tell_options actual ON st.tell_option_id = actual.id
    ORDER BY t.name, g.name
  `).all()

  res.json({ tells, missions, guesses })
})

// Get fun awards for all players
router.get('/fun-awards', async (req, res) => {
  try {
    const gameState = db.prepare('SELECT status FROM game_state WHERE id = 1').get() as { status: string }

    if (gameState.status !== 'finished') {
      return res.status(400).json({ error: 'Game not finished yet' })
    }

    // Get all player stats
    const players = db.prepare('SELECT id, name, team_number as team FROM players').all() as {
      id: number
      name: string
      team: number
    }[]

    const playerStats = players.map(player => {
      // Get mission completions
      const missionCount = db.prepare(
        'SELECT COUNT(*) as count FROM mission_completions WHERE player_id = ?'
      ).get(player.id) as { count: number }

      // Get correct guesses
      const correctGuesses = db.prepare(`
        SELECT COUNT(*) as count
        FROM tell_guesses tg
        JOIN selected_tells st ON tg.target_player_id = st.player_id
        WHERE tg.guesser_id = ? AND tg.guessed_tell_option_id = st.tell_option_id
      `).get(player.id) as { count: number }

      // Get how many people guessed their tell correctly
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

    // Generate fun awards
    const prompt = `You are awarding fun, silly prizes at a family Christmas game night. Here are the player stats:

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

    const response = await requireOpenAI().chat.completions.create({
      model: MODELS.text,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No response from OpenAI')

    const result = JSON.parse(content)
    res.json(result)
  } catch (error) {
    console.error('Error generating fun awards:', error)
    res.status(500).json({ error: 'Failed to generate fun awards' })
  }
})

// Judge team names
router.post('/judge-team-names', async (req, res) => {
  try {
    const suggestions = db.prepare(`
      SELECT p.id, p.name, p.team_number as team, p.team_name_suggestion as suggestion
      FROM players p
      WHERE p.team_name_suggestion IS NOT NULL AND p.team_name_suggestion != ''
    `).all() as { id: number; name: string; team: number; suggestion: string }[]

    if (suggestions.length === 0) {
      return res.json({ winner: null, reasoning: 'No team name suggestions were made' })
    }

    const playerNames = suggestions.map(s => s.name)
    const prompt = `You are a fun, fair judge for a family Christmas game.

The family has suggested team names. Pick the BEST one based on:
- Creativity and originality
- How festive/Christmas-y it is
- How fun and memorable it is
- Cleverness or wordplay

Suggestions:
${suggestions.map((s) => `- "${s.suggestion}" (suggested by ${s.name} for Team ${s.team})`).join('\n')}

You MUST respond with valid JSON containing exactly these fields:
- "winnerName": Must be exactly one of these names: ${playerNames.join(', ')}
- "reasoning": A 1-2 sentence explanation

Example response: {"winnerName": "${playerNames[0]}", "reasoning": "This name was chosen because..."}`

    const response = await requireOpenAI().chat.completions.create({
      model: MODELS.text,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No response from OpenAI')

    const result = JSON.parse(content)
    const winner = suggestions.find((s) => s.name === result.winnerName)

    if (winner) {
      db.prepare('UPDATE game_state SET winning_team_name_player_id = ? WHERE id = 1').run(winner.id)
    }

    res.json({
      winner: winner || null,
      reasoning: result.reasoning,
    })
  } catch (error) {
    console.error('Error judging team names:', error)
    res.status(500).json({ error: 'Failed to judge team names' })
  }
})

export default router
