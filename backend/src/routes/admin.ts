import { Router } from 'express'
import { db } from '../config/database.js'
import { requireOpenAI, MODELS } from '../config/openai.js'

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

// End the game and judge all guesses
router.post('/end-game', async (req, res) => {
  // First, mark game as finished
  db.prepare(`
    UPDATE game_state
    SET status = 'finished', ended_at = datetime('now')
    WHERE id = 1
  `).run()

  // Get all guesses that need judging
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

  // Judge each guess with AI
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
  res.json({ success: true, judgedGuesses: judgedCount })
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
    UPDATE game_state SET status = 'setup', started_at = NULL, ended_at = NULL, winning_team_name_player_id = NULL WHERE id = 1;
  `)

  res.json({ success: true })
})

export default router
