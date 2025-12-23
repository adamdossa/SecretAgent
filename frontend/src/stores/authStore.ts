import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Player {
  id: number
  name: string
  team: number
  isAdmin: boolean
}

interface AuthState {
  player: Player | null
  isLoggedIn: boolean
  token: string | null
  login: (player: Player, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      player: null,
      isLoggedIn: false,
      token: null,
      login: (player, token) => set({ player, isLoggedIn: true, token }),
      logout: () => set({ player: null, isLoggedIn: false, token: null }),
    }),
    {
      name: 'secret-agents-auth',
    }
  )
)
