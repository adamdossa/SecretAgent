import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/client'
import { FAMILY_MEMBERS } from '../utils/constants'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [teamNameSuggestion, setTeamNameSuggestion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const playerOptions = FAMILY_MEMBERS.map((m) => ({
    value: m.name,
    label: `${m.emoji} ${m.name}`,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name) {
      setError('Please select your name')
      return
    }

    if (!password) {
      setError('Please enter the password')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.login(name, password, teamNameSuggestion)
      login(response.player, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-christmas-red to-christmas-red-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-pulse">✨</div>
      <div className="absolute top-20 right-16 text-4xl opacity-20 animate-pulse delay-300">🎄</div>
      <div className="absolute bottom-32 left-8 text-5xl opacity-20 animate-pulse delay-500">🎁</div>
      <div className="absolute bottom-20 right-12 text-4xl opacity-20 animate-pulse delay-700">⭐</div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🕵️</div>
          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">
            Silver Leigh
          </h1>
          <h2 className="text-2xl font-semibold text-christmas-gold">
            Secret Agents
          </h2>
          <p className="text-white/80 mt-3 text-sm">
            Christmas 2025
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
          <Select
            label="Who are you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            options={playerOptions}
            placeholder="Select your name..."
          />

          <div>
            <Input
              label="Suggest a Team Name"
              placeholder="e.g. The Mince Pie Spies..."
              value={teamNameSuggestion}
              onChange={(e) => setTeamNameSuggestion(e.target.value)}
            />
            <p className="text-xs text-christmas-green mt-1 font-medium">
              🏆 Best team name wins a bonus point!
            </p>
          </div>

          <Input
            label="Secret Password"
            type="password"
            placeholder="Enter the password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
          >
            🎅 Join the Game
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-xs">
            Complete secret missions • Spot secret tells • Win prizes!
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-white/40 text-xs tracking-wide">
          Made with <span className="text-red-300">♥</span> by Lizzy & Adam 🎄
        </p>
      </div>
    </div>
  )
}
