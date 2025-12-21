import { Router } from 'express'
import { db } from '../config/database.js'

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

// End the game
router.post('/end-game', (req, res) => {
  db.prepare(`
    UPDATE game_state
    SET status = 'finished', ended_at = datetime('now')
    WHERE id = 1
  `).run()

  res.json({ success: true })
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
