import { Router } from 'express'
import { db } from '../config/database.js'
import { requireOpenAI, MODELS } from '../config/openai.js'

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
    team_name_winners: string | null
  }

  if (gameState.status !== 'finished') {
    return res.status(400).json({ error: 'Game not finished yet' })
  }

  // Parse team name winners (one per team, 2 points each)
  let teamNameWinners: { playerId: number; playerName: string; team: number; suggestion: string; reasoning: string }[] = []
  if (gameState.team_name_winners) {
    try {
      teamNameWinners = JSON.parse(gameState.team_name_winners)
    } catch (e) {
      console.error('Failed to parse team_name_winners:', e)
    }
  }
  const winnerPlayerIds = new Set(teamNameWinners.map(w => w.playerId))

  // Get all team name suggestions grouped by team
  const allTeamNameSuggestions = db.prepare(`
    SELECT p.name, p.team_number as team, p.team_name_suggestion as suggestion
    FROM players p
    WHERE p.team_name_suggestion IS NOT NULL AND p.team_name_suggestion != ''
    ORDER BY p.team_number, p.name
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
      console.log("Lizzy look at me!!! ", wrongGuesses)

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

    // 4. Team name bonus (2 points per team winner)
    if (winnerPlayerIds.has(player.id)) {
      teamNamePoints = 2
      breakdown.push(`+2 winning team name`)
    }
    console.log(player.name, breakdown);

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
    teamNameWinners,
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

// Get fun awards (reads stored awards generated at game end)
router.get('/fun-awards', (req, res) => {
  const gameState = db.prepare('SELECT status, fun_awards FROM game_state WHERE id = 1').get() as {
    status: string
    fun_awards: string | null
  }

  if (gameState.status !== 'finished') {
    return res.status(400).json({ error: 'Game not finished yet' })
  }

  if (!gameState.fun_awards) {
    return res.json({ awards: [] })
  }

  try {
    const awards = JSON.parse(gameState.fun_awards)
    res.json({ awards })
  } catch (error) {
    console.error('Error parsing fun awards:', error)
    res.json({ awards: [] })
  }
})

// Judge team names - one winner per team, 2 points each
router.post('/judge-team-names', async (req, res) => {
  try {
    const suggestions = db.prepare(`
      SELECT p.id, p.name, p.team_number as team, p.team_name_suggestion as suggestion
      FROM players p
      WHERE p.team_name_suggestion IS NOT NULL AND p.team_name_suggestion != ''
    `).all() as { id: number; name: string; team: number; suggestion: string }[]

    if (suggestions.length === 0) {
      return res.json({ winners: [], message: 'No team name suggestions were made' })
    }

    // Group suggestions by team
    const teamSuggestions: Record<number, typeof suggestions> = { 1: [], 2: [], 3: [] }
    for (const s of suggestions) {
      teamSuggestions[s.team].push(s)
    }

    const winners: { playerId: number; playerName: string; team: number; suggestion: string; reasoning: string }[] = []

    // Judge each team separately
    for (const teamNum of [1, 2, 3]) {
      const teamEntries = teamSuggestions[teamNum]
      if (teamEntries.length === 0) continue

      // If only one suggestion for the team, they win by default
      if (teamEntries.length === 1) {
        winners.push({
          playerId: teamEntries[0].id,
          playerName: teamEntries[0].name,
          team: teamNum,
          suggestion: teamEntries[0].suggestion,
          reasoning: 'The only suggestion for this team - winner by default!'
        })
        continue
      }

      // Multiple suggestions - let AI judge
      const prompt = `You are a fun, fair judge for a family Christmas game.

Team ${teamNum} has these team name suggestions:
${teamEntries.map((s) => `- "${s.suggestion}" (by ${s.name})`).join('\n')}

Pick the BEST team name based on:
- Creativity and originality
- How festive/Christmas-y it is
- How fun and memorable it is
- Cleverness or wordplay

Respond with valid JSON:
{
  "winnerName": "<exact name of the winner: ${teamEntries.map(s => s.name).join(' or ')}>",
  "reasoning": "<A fun, humorous 1-2 sentence explanation of why this name won and why the others didn't quite make the cut>"
}`

      const response = await requireOpenAI().chat.completions.create({
        model: MODELS.text,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0].message.content
      if (content) {
        const result = JSON.parse(content)
        const winner = teamEntries.find((s) => s.name === result.winnerName)
        if (winner) {
          winners.push({
            playerId: winner.id,
            playerName: winner.name,
            team: teamNum,
            suggestion: winner.suggestion,
            reasoning: result.reasoning
          })
        }
      }
    }

    // Store winners in game_state
    db.prepare('UPDATE game_state SET team_name_winners = ? WHERE id = 1').run(JSON.stringify(winners))

    // Also return all suggestions grouped by team for display
    res.json({
      winners,
      allSuggestions: teamSuggestions
    })
  } catch (error) {
    console.error('Error judging team names:', error)
    res.status(500).json({ error: 'Failed to judge team names' })
  }
})

export default router
