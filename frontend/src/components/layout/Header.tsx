import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface HeaderProps {
  title: string
  showBack?: boolean
  showLogout?: boolean
}

export default function Header({ title, showBack = false, showLogout = true }: HeaderProps) {
  const navigate = useNavigate()
  const { player, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-gradient-to-r from-christmas-red to-christmas-red-dark text-white px-4 py-4 safe-top sticky top-0 z-10 shadow-lg">
      <div className="flex items-center justify-between max-w-lg mx-auto relative">
        {/* Left side - Back button or spacer */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Center - Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">{title}</h1>
        </div>

        {/* Right side - Player name and logout */}
        <div className="flex items-center gap-2">
          {player && (
            <span className="text-sm font-medium opacity-90 hidden sm:block">
              {player.name}
            </span>
          )}
          {showLogout && (
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
