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
  login: (player: Player) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      player: null,
      isLoggedIn: false,
      login: (player) => set({ player, isLoggedIn: true }),
      logout: () => set({ player: null, isLoggedIn: false }),
    }),
    {
      name: 'secret-agents-auth',
    }
  )
)
