import { Router } from 'express'
import { db } from '../config/database.js'
import { generateTellOptions, generateTellImage } from '../services/tellGenerator.js'

const router = Router()

interface TellOption {
  id: number
  player_id: number
  option_text: string
  option_number: number
  is_selected: number
}

interface SelectedTell {
  id: number
  player_id: number
  tell_option_id: number
  image_url: string | null
}

// Get tell options for a player
router.get('/options/:playerId', (req, res) => {
  const { playerId } = req.params

  const options = db
    .prepare('SELECT * FROM tell_options WHERE player_id = ? ORDER BY option_number')
    .all(playerId) as TellOption[]

  res.json({ options })
})

// Generate new tell options via AI
router.post('/generate/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params

    const player = db.prepare('SELECT name FROM players WHERE id = ?').get(playerId) as { name: string } | undefined
    if (!player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    // Check if options already exist
    const existing = db.prepare('SELECT COUNT(*) as count FROM tell_options WHERE player_id = ?').get(playerId) as { count: number }
    if (existing.count > 0) {
      const options = db.prepare('SELECT * FROM tell_options WHERE player_id = ? ORDER BY option_number').all(playerId)
      return res.json({ options, cached: true })
    }

    // Generate new options
    const tells = await generateTellOptions(player.name, parseInt(playerId))

    // Store options
    const insertOption = db.prepare(
      'INSERT INTO tell_options (player_id, option_text, option_number) VALUES (?, ?, ?)'
    )

    const options: TellOption[] = []
    tells.forEach((text, index) => {
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
    console.error('Error generating tells:', error)
    res.status(500).json({ error: 'Failed to generate tells' })
  }
})

// Select a tell option
router.post('/select', async (req, res) => {
  try {
    const { playerId, optionId } = req.body

    if (!playerId || !optionId) {
      return res.status(400).json({ error: 'Player ID and option ID required' })
    }

    // Get the option text for image generation
    const option = db.prepare('SELECT * FROM tell_options WHERE id = ?').get(optionId) as TellOption | undefined
    if (!option) {
      return res.status(404).json({ error: 'Option not found' })
    }

    // Mark option as selected
    db.prepare('UPDATE tell_options SET is_selected = 0 WHERE player_id = ?').run(playerId)
    db.prepare('UPDATE tell_options SET is_selected = 1 WHERE id = ?').run(optionId)

    // Check if already selected
    const existing = db.prepare('SELECT * FROM selected_tells WHERE player_id = ?').get(playerId) as SelectedTell | undefined

    if (existing) {
      db.prepare('UPDATE selected_tells SET tell_option_id = ?, selected_at = datetime("now") WHERE player_id = ?').run(optionId, playerId)
    } else {
      db.prepare('INSERT INTO selected_tells (player_id, tell_option_id) VALUES (?, ?)').run(playerId, optionId)
    }

    // Generate image in background
    generateTellImage(option.option_text)
      .then((imageUrl) => {
        db.prepare('UPDATE selected_tells SET image_url = ? WHERE player_id = ?').run(imageUrl, playerId)
      })
      .catch((err) => console.error('Image generation failed:', err))

    res.json({ success: true, message: 'Image generating in background' })
  } catch (error) {
    console.error('Error selecting tell:', error)
    res.status(500).json({ error: 'Failed to select tell' })
  }
})

// Get player's selected tell
router.get('/selected/:playerId', (req, res) => {
  const { playerId } = req.params

  const selected = db.prepare(`
    SELECT st.*, t.option_text as tell_text
    FROM selected_tells st
    JOIN tell_options t ON st.tell_option_id = t.id
    WHERE st.player_id = ?
  `).get(playerId) as (SelectedTell & { tell_text: string }) | undefined

  if (!selected) {
    return res.json({ selected: null })
  }

  res.json({
    selected: {
      id: selected.id,
      tellText: selected.tell_text,
      imageUrl: selected.image_url,
    },
  })
})

// Get all players' tell options for guessing
router.get('/all-options/:playerId', (req, res) => {
  const { playerId } = req.params

  // Get all players except the current one who have selected tells
  const players = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.team_number as team
    FROM players p
    JOIN selected_tells st ON p.id = st.player_id
    WHERE p.id != ?
    ORDER BY p.name
  `).all(playerId) as { id: number; name: string; team: number }[]

  // Get options for each player
  const playersWithOptions = players.map((player) => {
    const options = db.prepare(`
      SELECT id, option_text as text, option_number as number
      FROM tell_options
      WHERE player_id = ?
      ORDER BY option_number
    `).all(player.id)

    return { ...player, options }
  })

  res.json({ players: playersWithOptions })
})

export default router
