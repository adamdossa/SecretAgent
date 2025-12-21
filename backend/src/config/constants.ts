export const GAME_PASSWORD = process.env.GAME_PASSWORD || 'Hughes2026'

export const YOUNG_PLAYERS = ['Ben', 'Lizzy', 'Jemima', 'Olivia']

export const TEAMS = {
  1: { name: 'Team 1', members: ['David', 'Neal', 'Emily', 'Lizzy'] },
  2: { name: 'Team 2', members: ['Rosanne', 'Adam', 'Katherine', 'Ben'] },
  3: { name: 'Team 3', members: ['Elaine', 'Alex', 'Vicky', 'Jemima', 'Olivia'] },
} as const
