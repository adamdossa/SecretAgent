import { Router } from 'express'
import { db } from '../config/database.js'

const router = Router()

interface GameState {
  id: number
  status: 'setup' | 'active' | 'finished'
  started_at: string | null
  ended_at: string | null
  team_name_winners: string | null
}

router.get('/state', (req, res) => {
  const state = db.prepare('SELECT * FROM game_state WHERE id = 1').get() as GameState

  // Parse team name winners
  let teamNames: Record<number, string> = {}
  if (state.team_name_winners) {
    try {
      const winners = JSON.parse(state.team_name_winners) as { team: number; suggestion: string }[]
      for (const w of winners) {
        teamNames[w.team] = w.suggestion
      }
    } catch (e) {
      console.error('Failed to parse team_name_winners:', e)
    }
  }

  res.json({
    status: state.status,
    startedAt: state.started_at,
    endedAt: state.ended_at,
    teamNames,
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
