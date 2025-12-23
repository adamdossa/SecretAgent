import { db, initializeDatabase } from '../config/database.js'

const FAMILY_MEMBERS = [
  { name: 'David', team: 1, isAdmin: false },
  { name: 'Rosanne', team: 2, isAdmin: false },
  { name: 'Elaine', team: 3, isAdmin: false },
  { name: 'Katherine', team: 2, isAdmin: false },
  { name: 'Vicky', team: 3, isAdmin: false },
  { name: 'Emily', team: 1, isAdmin: false },
  { name: 'Adam', team: 2, isAdmin: true },
  { name: 'Alex', team: 3, isAdmin: false },
  { name: 'Neal', team: 1, isAdmin: false },
  { name: 'Ben', team: 2, isAdmin: false },
  { name: 'Lizzy', team: 1, isAdmin: true },
  { name: 'Jemima', team: 3, isAdmin: false },
  { name: 'Olivia', team: 3, isAdmin: false },
]

function seed() {
  console.log('Initializing database...')
  initializeDatabase()

  // Check if players already exist
  const existingPlayers = db.prepare('SELECT COUNT(*) as count FROM players').get() as { count: number }

  if (existingPlayers.count === 0) {
    console.log('Seeding players...')
    const insertPlayer = db.prepare(
      'INSERT INTO players (name, team_number, is_admin) VALUES (?, ?, ?)'
    )

    for (const member of FAMILY_MEMBERS) {
      insertPlayer.run(member.name, member.team, member.isAdmin ? 1 : 0)
    }
    console.log(`Seeded ${FAMILY_MEMBERS.length} players`)
  } else {
    console.log('Players already exist, skipping seed')
  }

  // Initialize game state if not exists
  const gameState = db.prepare('SELECT COUNT(*) as count FROM game_state').get() as { count: number }
  if (gameState.count === 0) {
    db.prepare("INSERT INTO game_state (id, status) VALUES (1, 'setup')").run()
    console.log('Game state initialized')
  }

  console.log('Database seeding complete!')
}

seed()
