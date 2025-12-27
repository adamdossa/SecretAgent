import { useAuthStore } from '../stores/authStore'

const API_BASE = '/api'

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, options),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
}

// Auth API
export const authApi = {
  login: (name: string, password: string, teamNameSuggestion: string) =>
    api.post<{ success: boolean; player: { id: number; name: string; team: number; isAdmin: boolean } }>(
      '/auth/login',
      { name, password, teamNameSuggestion },
      { headers: { Authorization: `Bearer ${password}` } }
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
  downloadPdfSummary: async () => {
    const token = useAuthStore.getState().token
    const response = await fetch(`${API_BASE}/admin/pdf-summary`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }))
      throw new Error(error.error || 'Download failed')
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'silver-leigh-secret-agents-2025.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  },
}

// Prizes API
export const prizesApi = {
  getScores: () => api.get<{ players: any[]; teams: any[]; teamNameWinners: any[]; allTeamNameSuggestions: any[] }>('/prizes/scores'),
  getReveals: () => api.get<{ tells: any[]; missions: any[]; guesses: any[] }>('/prizes/reveals'),
  judgeTeamNames: () => api.post<{ winners: any[]; allSuggestions: any }>('/prizes/judge-team-names'),
  getFunAwards: () => api.get<{ awards: { name: string; award: string; reason: string }[] }>('/prizes/fun-awards'),
}
