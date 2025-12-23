const API_BASE = '/api'

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
}

// Auth API
export const authApi = {
  login: (name: string, password: string, teamNameSuggestion: string) =>
    api.post<{ success: boolean; player: { id: number; name: string; team: number; isAdmin: boolean } }>(
      '/auth/login',
      { name, password, teamNameSuggestion }
    ),
  logout: (playerId: number) => api.post('/auth/logout', { playerId }),
  getPlayers: () => api.get<{ players: { id: number; name: string; team: number }[] }>('/auth/players'),
  checkSession: (playerId: number) =>
    api.get<{ loggedIn: boolean; player?: { id: number; name: string; team: number; isAdmin: boolean } }>(
      `/auth/session/${playerId}`
    ),
}

// Game API
export const gameApi = {
  getState: () => api.get<{ status: string; startedAt: string | null; endedAt: string | null; teamNames: Record<number, string> }>('/game/state'),
  getPlayers: () => api.get<{ players: any[] }>('/game/players'),
}

// Tells API
export const tellsApi = {
  getOptions: (playerId: number) => api.get<{ options: any[] }>(`/tells/options/${playerId}`),
  generate: (playerId: number) => api.post<{ options: any[]; cached?: boolean }>(`/tells/generate/${playerId}`),
  select: (playerId: number, optionId: number) => api.post('/tells/select', { playerId, optionId }),
  getSelected: (playerId: number) => api.get<{ selected: any | null }>(`/tells/selected/${playerId}`),
  getAllOptions: (playerId: number) => api.get<{ players: any[] }>(`/tells/all-options/${playerId}`),
}

// Missions API
export const missionsApi = {
  getOptions: (playerId: number) => api.get<{ options: any[] }>(`/missions/options/${playerId}`),
  generate: (playerId: number) => api.post<{ options: any[]; cached?: boolean }>(`/missions/generate/${playerId}`),
  select: (playerId: number, optionId: number) => api.post('/missions/select', { playerId, optionId }),
  getSelected: (playerId: number) => api.get<{ selected: any | null }>(`/missions/selected/${playerId}`),
  complete: (playerId: number, involvedPlayerId: number) =>
    api.post<{ success: boolean; totalCompletions: number }>('/missions/complete', { playerId, involvedPlayerId }),
  getCompletions: (playerId: number) => api.get<{ completions: any[] }>(`/missions/completions/${playerId}`),
  getAvailablePlayers: (playerId: number) => api.get<{ players: any[] }>(`/missions/available-players/${playerId}`),
}

// Guesses API
export const guessesApi = {
  submit: (guesserId: number, targetPlayerId: number, guessText: string) =>
    api.post<{ success: boolean }>('/guesses/submit', { guesserId, targetPlayerId, guessText }),
  getMine: (playerId: number) => api.get<{ guesses: any[] }>(`/guesses/mine/${playerId}`),
  getAboutMe: (playerId: number) => api.get<{ guesses: any[] }>(`/guesses/about-me/${playerId}`),
}

// Admin API
export const adminApi = {
  getStatus: () => api.get<{ gameState: any; players: any[]; stats: any }>('/admin/status'),
  startGame: () => api.post('/admin/start-game'),
  endGame: () => api.post('/admin/end-game'),
  restart: () => api.post('/admin/restart'),
}

// Prizes API
export const prizesApi = {
  getScores: () => api.get<{ players: any[]; teams: any[]; teamNameWinners: any[]; allTeamNameSuggestions: any[] }>('/prizes/scores'),
  getReveals: () => api.get<{ tells: any[]; missions: any[]; guesses: any[] }>('/prizes/reveals'),
  judgeTeamNames: () => api.post<{ winners: any[]; allSuggestions: any }>('/prizes/judge-team-names'),
  getFunAwards: () => api.get<{ awards: { name: string; award: string; reason: string }[] }>('/prizes/fun-awards'),
}
