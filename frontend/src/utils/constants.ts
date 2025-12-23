export const FAMILY_MEMBERS = [
  { name: 'David', team: 1, emoji: '👴' },
  { name: 'Rosanne', team: 2, emoji: '👵' },
  { name: 'Elaine', team: 3, emoji: '👩‍🦳' },
  { name: 'Katherine', team: 2, emoji: '👩' },
  { name: 'Vicky', team: 3, emoji: '👩' },
  { name: 'Emily', team: 1, emoji: '👩' },
  { name: 'Adam', team: 2, emoji: '👨' },
  { name: 'Alex', team: 3, emoji: '👨' },
  { name: 'Neal', team: 1, emoji: '👨' },
  { name: 'Ben', team: 2, emoji: '👦' },
  { name: 'Lizzy', team: 1, emoji: '👧' },
  { name: 'Jemima', team: 3, emoji: '👧' },
  { name: 'Olivia', team: 3, emoji: '👧' },
] as const

export const TEAMS = {
  1: { name: 'Team 1', members: ['David', 'Neal', 'Emily', 'Lizzy'] },
  2: { name: 'Team 2', members: ['Rosanne', 'Adam', 'Katherine', 'Ben'] },
  3: { name: 'Team 3', members: ['Elaine', 'Alex', 'Vicky', 'Jemima', 'Olivia'] },
} as const

export type PlayerName = typeof FAMILY_MEMBERS[number]['name']
export type TeamNumber = 1 | 2 | 3
