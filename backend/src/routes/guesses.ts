import { Router } from 'express'
import { db } from '../config/database.js'

const router = Router()

// Submit or update a guess (no AI judging - that happens at game end)
router.post('/submit', (req, res) => {
  const { guesserId, targetPlayerId, guessText } = req.body

  if (!guesserId || !targetPlayerId || !guessText) {
    return res.status(400).json({ error: 'All fields required' })
  }

  if (guesserId === targetPlayerId) {
    return res.status(400).json({ error: 'Cannot guess your own tell' })
  }

  // Verify target player has selected their tell
  const selectedTell = db.prepare(
    'SELECT id FROM selected_tells WHERE player_id = ?'
  ).get(targetPlayerId)

  if (!selectedTell) {
    return res.status(400).json({ error: 'Target player has not selected their tell yet' })
  }

  // Check if guess already exists
  const existing = db.prepare(
    'SELECT id FROM tell_guesses WHERE guesser_id = ? AND target_player_id = ?'
  ).get(guesserId, targetPlayerId) as { id: number } | undefined

  if (existing) {
    // Update existing guess (clear any previous AI judgment)
    db.prepare(`
      UPDATE tell_guesses
      SET free_text_guess = ?, guessed_tell_option_id = NULL, ai_reasoning = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(guessText, existing.id)
  } else {
    // Insert new guess
    db.prepare(`
      INSERT INTO tell_guesses (guesser_id, target_player_id, free_text_guess)
      VALUES (?, ?, ?)
    `).run(guesserId, targetPlayerId, guessText)
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
      t.option_text as matchedOptionText,
      tg.free_text_guess as guessText,
      tg.ai_reasoning as aiReasoning,
      tg.guessed_at as guessedAt,
      tg.updated_at as updatedAt
    FROM tell_guesses tg
    JOIN players p ON tg.target_player_id = p.id
    LEFT JOIN tell_options t ON tg.guessed_tell_option_id = t.id
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
      tg.free_text_guess as guessText,
      t.option_text as matchedText,
      tg.guessed_tell_option_id IS NOT NULL as wasMatched,
      COUNT(*) as count
    FROM tell_guesses tg
    LEFT JOIN tell_options t ON tg.guessed_tell_option_id = t.id
    WHERE tg.target_player_id = ?
    GROUP BY tg.free_text_guess
    ORDER BY count DESC
  `).all(playerId)

  res.json({ guesses })
})

export default router
