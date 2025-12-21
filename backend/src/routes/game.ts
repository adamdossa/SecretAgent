import { Router } from 'express'
import { db } from '../config/database.js'

const router = Router()

interface GameState {
  id: number
  status: 'setup' | 'active' | 'finished'
  started_at: string | null
  ended_at: string | null
  winning_team_name_player_id: number | null
}

router.get('/state', (req, res) => {
  const state = db.prepare('SELECT * FROM game_state WHERE id = 1').get() as GameState

  res.json({
    status: state.status,
    startedAt: state.started_at,
    endedAt: state.ended_at,
  })
})

router.get('/players', (req, res) => {
  const players = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.team_number as team,
      p.is_logged_in as isLoggedIn,
      CASE WHEN st.id IS NOT NULL THEN 1 ELSE 0 END as hasTell,
      CASE WHEN sm.id IS NOT NULL THEN 1 ELSE 0 END as hasMission
    FROM players p
    LEFT JOIN selected_tells st ON p.id = st.player_id
    LEFT JOIN selected_missions sm ON p.id = sm.player_id
    ORDER BY p.name
  `).all()

  res.json({ players })
})

export default router
