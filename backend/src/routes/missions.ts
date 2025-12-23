import { Router } from 'express'
import { db } from '../config/database.js'
import { generateMissionOptions, generateMissionImage } from '../services/missionGenerator.js'

const router = Router()

interface MissionOption {
  id: number
  player_id: number
  option_text: string
  option_number: number
  is_selected: number
}

interface SelectedMission {
  id: number
  player_id: number
  mission_option_id: number
  image_url: string | null
}

// Get mission options for a player
router.get('/options/:playerId', (req, res) => {
  const { playerId } = req.params

  const options = db
    .prepare('SELECT * FROM mission_options WHERE player_id = ? ORDER BY option_number')
    .all(playerId) as MissionOption[]

  res.json({ options })
})

// Generate new mission options via AI
router.post('/generate/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params

    const player = db.prepare('SELECT name FROM players WHERE id = ?').get(playerId) as { name: string } | undefined
    if (!player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    // Check if options already exist
    const existing = db.prepare('SELECT COUNT(*) as count FROM mission_options WHERE player_id = ?').get(playerId) as { count: number }
    if (existing.count > 0) {
      const options = db.prepare('SELECT * FROM mission_options WHERE player_id = ? ORDER BY option_number').all(playerId)
      return res.json({ options, cached: true })
    }

    // Generate new options
    const missions = await generateMissionOptions(player.name, parseInt(playerId))

    // Store options
    const insertOption = db.prepare(
      'INSERT INTO mission_options (player_id, option_text, option_number) VALUES (?, ?, ?)'
    )

    const options: MissionOption[] = []
    missions.forEach((text, index) => {
      const result = insertOption.run(playerId, text, index + 1)
      options.push({
        id: result.lastInsertRowid as number,
        player_id: parseInt(playerId),
        option_text: text,
        option_number: index + 1,
        is_selected: 0,
      })
    })

    res.json({ options })
  } catch (error) {
    console.error('Error generating missions:', error)
    res.status(500).json({ error: 'Failed to generate missions' })
  }
})

// Select a mission option
router.post('/select', async (req, res) => {
  try {
    const { playerId, optionId } = req.body

    if (!playerId || !optionId) {
      return res.status(400).json({ error: 'Player ID and option ID required' })
    }

    // Get the option text for image generation
    const option = db.prepare('SELECT * FROM mission_options WHERE id = ?').get(optionId) as MissionOption | undefined
    if (!option) {
      return res.status(404).json({ error: 'Option not found' })
    }

    // Mark option as selected
    db.prepare('UPDATE mission_options SET is_selected = 0 WHERE player_id = ?').run(playerId)
    db.prepare('UPDATE mission_options SET is_selected = 1 WHERE id = ?').run(optionId)

    // Check if already selected
    const existing = db.prepare('SELECT * FROM selected_missions WHERE player_id = ?').get(playerId) as SelectedMission | undefined

    if (existing) {
      db.prepare('UPDATE selected_missions SET mission_option_id = ?, selected_at = datetime("now") WHERE player_id = ?').run(optionId, playerId)
    } else {
      db.prepare('INSERT INTO selected_missions (player_id, mission_option_id) VALUES (?, ?)').run(playerId, optionId)
    }

    // Generate image in background
    generateMissionImage(option.option_text)
      .then((imageUrl) => {
        db.prepare('UPDATE selected_missions SET image_url = ? WHERE player_id = ?').run(imageUrl, playerId)
      })
      .catch((err) => console.error('Image generation failed:', err))

    res.json({ success: true, message: 'Image generating in background' })
  } catch (error) {
    console.error('Error selecting mission:', error)
    res.status(500).json({ error: 'Failed to select mission' })
  }
})

// Get player's selected mission
router.get('/selected/:playerId', (req, res) => {
  const { playerId } = req.params

  const selected = db.prepare(`
    SELECT sm.*, m.option_text as mission_text
    FROM selected_missions sm
    JOIN mission_options m ON sm.mission_option_id = m.id
    WHERE sm.player_id = ?
  `).get(playerId) as (SelectedMission & { mission_text: string }) | undefined

  if (!selected) {
    return res.json({ selected: null })
  }

  res.json({
    selected: {
      id: selected.id,
      missionText: selected.mission_text,
      imageUrl: selected.image_url,
    },
  })
})

// Record mission completion
router.post('/complete', (req, res) => {
  const { playerId, involvedPlayerId } = req.body

  // Check game state - only allow completions during active game
  const gameState = db.prepare('SELECT status FROM game_state WHERE id = 1').get() as { status: string }
  if (gameState.status !== 'active') {
    return res.status(400).json({ error: 'Mission completions are only allowed during an active game' })
  }

  if (!playerId || !involvedPlayerId) {
    return res.status(400).json({ error: 'Player ID and involved player ID required' })
  }

  if (playerId === involvedPlayerId) {
    return res.status(400).json({ error: 'Cannot complete mission with yourself' })
  }

  // Check if already completed with this person
  const existing = db.prepare(
    'SELECT * FROM mission_completions WHERE player_id = ? AND involved_player_id = ?'
  ).get(playerId, involvedPlayerId)

  if (existing) {
    return res.status(400).json({ error: 'Already completed mission with this person' })
  }

  db.prepare(
    'INSERT INTO mission_completions (player_id, involved_player_id) VALUES (?, ?)'
  ).run(playerId, involvedPlayerId)

  // Get total completions
  const count = db.prepare(
    'SELECT COUNT(*) as count FROM mission_completions WHERE player_id = ?'
  ).get(playerId) as { count: number }

  res.json({ success: true, totalCompletions: count.count })
})

// Get all completions for player
router.get('/completions/:playerId', (req, res) => {
  const { playerId } = req.params

  const completions = db.prepare(`
    SELECT mc.*, p.name as involved_player_name
    FROM mission_completions mc
    JOIN players p ON mc.involved_player_id = p.id
    WHERE mc.player_id = ?
    ORDER BY mc.completed_at DESC
  `).all(playerId)

  res.json({ completions })
})

// Get available players to complete mission with
router.get('/available-players/:playerId', (req, res) => {
  const { playerId } = req.params

  const players = db.prepare(`
    SELECT p.id, p.name
    FROM players p
    WHERE p.id != ?
    AND p.id NOT IN (
      SELECT involved_player_id FROM mission_completions WHERE player_id = ?
    )
    ORDER BY p.name
  `).all(playerId, playerId)

  res.json({ players })
})

export default router
