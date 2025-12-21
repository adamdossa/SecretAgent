export const FAMILY_MEMBERS = [
  { name: 'David', team: 1, role: 'Grandpa' },
  { name: 'Rosanne', team: 2, role: 'Grandma' },
  { name: 'Elaine', team: 3, role: 'Granty' },
  { name: 'Katherine', team: 2, role: 'Daughter' },
  { name: 'Vicky', team: 3, role: 'Daughter' },
  { name: 'Emily', team: 1, role: 'Daughter' },
  { name: 'Adam', team: 2, role: 'Husband', isAdmin: true },
  { name: 'Alex', team: 3, role: 'Husband' },
  { name: 'Neal', team: 1, role: 'Husband' },
  { name: 'Ben', team: 2, role: 'Grandchild' },
  { name: 'Lizzy', team: 1, role: 'Grandchild' },
  { name: 'Jemima', team: 3, role: 'Grandchild' },
  { name: 'Olivia', team: 3, role: 'Grandchild' },
] as const

export const TEAMS = {
  1: { name: 'Team 1', members: ['David', 'Neal', 'Emily', 'Lizzy'] },
  2: { name: 'Team 2', members: ['Rosanne', 'Adam', 'Katherine', 'Ben'] },
  3: { name: 'Team 3', members: ['Elaine', 'Alex', 'Vicky', 'Jemima', 'Olivia'] },
} as const

export type PlayerName = typeof FAMILY_MEMBERS[number]['name']
export type TeamNumber = 1 | 2 | 3
