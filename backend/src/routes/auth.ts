import { Router } from 'express'
import { db } from '../config/database.js'
import { GAME_PASSWORD } from '../config/constants.js'

const router = Router()

interface Player {
  id: number
  name: string
  team_number: number
  is_admin: number
  is_logged_in: number
  team_name_suggestion: string | null
}

router.post('/login', (req, res) => {
  const { name, password, teamNameSuggestion } = req.body

  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password required' })
  }

  if (password !== GAME_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const player = db.prepare('SELECT * FROM players WHERE name = ?').get(name) as Player | undefined

  if (!player) {
    return res.status(404).json({ error: 'Player not found' })
  }

  // Update login status
  // Only update team_name_suggestion if a new one is provided (don't wipe existing)
  if (teamNameSuggestion) {
    db.prepare(`
      UPDATE players
      SET is_logged_in = 1,
          logged_in_at = datetime('now'),
          team_name_suggestion = ?
      WHERE id = ?
    `).run(teamNameSuggestion, player.id)
  } else {
    db.prepare(`
      UPDATE players
      SET is_logged_in = 1,
          logged_in_at = datetime('now')
      WHERE id = ?
    `).run(player.id)
  }

  res.json({
    success: true,
    player: {
      id: player.id,
      name: player.name,
      team: player.team_number,
      isAdmin: Boolean(player.is_admin),
    },
  })
})

router.post('/logout', (req, res) => {
  const { playerId } = req.body

  if (!playerId) {
    return res.status(400).json({ error: 'Player ID required' })
  }

  db.prepare('UPDATE players SET is_logged_in = 0 WHERE id = ?').run(playerId)

  res.json({ success: true })
})

router.get('/session/:playerId', (req, res) => {
  const { playerId } = req.params

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId) as Player | undefined

  if (!player || !player.is_logged_in) {
    return res.json({ loggedIn: false })
  }

  res.json({
    loggedIn: true,
    player: {
      id: player.id,
      name: player.name,
      team: player.team_number,
      isAdmin: Boolean(player.is_admin),
    },
  })
})

router.get('/players', (req, res) => {
  const players = db.prepare('SELECT id, name, team_number as team FROM players ORDER BY name').all()
  res.json({ players })
})

export default router
