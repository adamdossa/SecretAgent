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
    label: `${m.name} (${m.role})`,
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
      login(response.player)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-christmas-red flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Silver Leigh
          </h1>
          <h2 className="text-xl text-white/90">
            Secret Agents
          </h2>
          <p className="text-white/70 mt-2 text-sm">
            Christmas 2024
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          <Select
            label="Who are you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            options={playerOptions}
            placeholder="Select your name..."
          />

          <Input
            label="Team Name Suggestion"
            placeholder="Your creative team name idea..."
            value={teamNameSuggestion}
            onChange={(e) => setTeamNameSuggestion(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter the secret password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
          >
            Join the Game
          </Button>
        </form>
      </div>
    </div>
  )
}
