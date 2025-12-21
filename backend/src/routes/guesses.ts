import { Router } from 'express'
import { db } from '../config/database.js'

const router = Router()

// Submit or update a guess
router.post('/submit', (req, res) => {
  const { guesserId, targetPlayerId, guessedOptionId } = req.body

  if (!guesserId || !targetPlayerId || !guessedOptionId) {
    return res.status(400).json({ error: 'All fields required' })
  }

  if (guesserId === targetPlayerId) {
    return res.status(400).json({ error: 'Cannot guess your own tell' })
  }

  // Verify the option belongs to the target player
  const option = db.prepare('SELECT player_id FROM tell_options WHERE id = ?').get(guessedOptionId) as { player_id: number } | undefined
  if (!option || option.player_id !== targetPlayerId) {
    return res.status(400).json({ error: 'Invalid option for this player' })
  }

  // Check if guess already exists
  const existing = db.prepare(
    'SELECT id FROM tell_guesses WHERE guesser_id = ? AND target_player_id = ?'
  ).get(guesserId, targetPlayerId) as { id: number } | undefined

  if (existing) {
    db.prepare(`
      UPDATE tell_guesses
      SET guessed_tell_option_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(guessedOptionId, existing.id)
  } else {
    db.prepare(`
      INSERT INTO tell_guesses (guesser_id, target_player_id, guessed_tell_option_id)
      VALUES (?, ?, ?)
    `).run(guesserId, targetPlayerId, guessedOptionId)
  }

  res.json({ success: true })
})

// Get all guesses made by a player
router.get('/mine/:playerId', (req, res) => {
  const { playerId } = req.params

  const guesses = db.prepare(`
    SELECT
      tg.id,
      tg.target_player_id as targetPlayerId,
      p.name as targetPlayerName,
      tg.guessed_tell_option_id as guessedOptionId,
      t.option_text as guessedText,
      tg.guessed_at as guessedAt,
      tg.updated_at as updatedAt
    FROM tell_guesses tg
    JOIN players p ON tg.target_player_id = p.id
    JOIN tell_options t ON tg.guessed_tell_option_id = t.id
    WHERE tg.guesser_id = ?
    ORDER BY p.name
  `).all(playerId)

  res.json({ guesses })
})

// Get guesses others made about a player (anonymous - don't show who guessed)
router.get('/about-me/:playerId', (req, res) => {
  const { playerId } = req.params

  const guesses = db.prepare(`
    SELECT
      t.option_text as guessedText,
      COUNT(*) as count
    FROM tell_guesses tg
    JOIN tell_options t ON tg.guessed_tell_option_id = t.id
    WHERE tg.target_player_id = ?
    GROUP BY tg.guessed_tell_option_id
    ORDER BY count DESC
  `).all(playerId)

  res.json({ guesses })
})

export default router
