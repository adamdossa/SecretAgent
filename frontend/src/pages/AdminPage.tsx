import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/client'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function AdminPage() {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState<'end' | 'restart' | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminStatus'],
    queryFn: adminApi.getStatus,
    refetchInterval: 5000,
  })

  const startMutation = useMutation({
    mutationFn: adminApi.startGame,
    onSuccess: () => refetch(),
  })

  const endMutation = useMutation({
    mutationFn: adminApi.endGame,
    onSuccess: () => {
      refetch()
      navigate('/prizes')
    },
  })

  const restartMutation = useMutation({
    mutationFn: adminApi.restart,
    onSuccess: () => {
      refetch()
      setShowConfirm(null)
    },
  })

  if (isLoading) {
    return (
      <PageLayout title="Admin Panel">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  const { gameState, players, stats } = data!

  // Show Christmas loading screen during AI transitions
  if (startMutation.isPending) {
    return (
      <PageLayout title="Admin Panel">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-6 animate-bounce">🎄</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Santa's Picking Team Names...</h2>
          <p className="text-gray-600 text-center mb-6">
            The elves are judging all the team name suggestions!
          </p>
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-christmas-red rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-christmas-green rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-christmas-gold rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (endMutation.isPending) {
    return (
      <PageLayout title="Admin Panel">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-6 animate-bounce">🎅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Santa's Judging the Results...</h2>
          <p className="text-gray-600 text-center mb-6">
            Checking who's been naughty and nice with their guesses!
          </p>
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-christmas-red rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-christmas-green rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-christmas-gold rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Admin Panel">
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Game Status</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameState.status === 'setup'
                  ? 'bg-yellow-100 text-yellow-800'
                  : gameState.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {gameState.status.charAt(0).toUpperCase() + gameState.status.slice(1)}
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">Progress</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-christmas-red">{stats.loggedIn}</p>
              <p className="text-xs text-gray-500">Logged In</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-christmas-red">{stats.totalPlayers}</p>
              <p className="text-xs text-gray-500">Total Players</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-christmas-green">{stats.hasTell}</p>
              <p className="text-xs text-gray-500">Have Tell</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-christmas-green">{stats.hasMission}</p>
              <p className="text-xs text-gray-500">Have Mission</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">Players</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {players.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      p.isLoggedIn ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-sm">{p.name}</span>
                </div>
                <div className="flex gap-1">
                  {p.hasTell ? (
                    <span className="text-xs bg-christmas-red/10 text-christmas-red px-2 py-0.5 rounded">
                      Tell
                    </span>
                  ) : null}
                  {p.hasMission ? (
                    <span className="text-xs bg-christmas-green/10 text-christmas-green px-2 py-0.5 rounded">
                      Mission
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">Game Controls</h3>
          <div className="space-y-3">
            {gameState.status === 'setup' && (
              <Button
                onClick={() => startMutation.mutate()}
                loading={startMutation.isPending}
                variant="secondary"
                className="w-full"
              >
                Start Game
              </Button>
            )}

            {gameState.status === 'active' && (
              <Button
                onClick={() => setShowConfirm('end')}
                variant="primary"
                className="w-full"
              >
                End Game & Show Results
              </Button>
            )}

            {gameState.status === 'finished' && (
              <a
                href="/api/admin/pdf-summary"
                download
                className="block w-full py-2.5 px-4 rounded-lg font-medium text-center transition-colors bg-christmas-green text-white hover:bg-christmas-green/90"
              >
                Download PDF Summary
              </a>
            )}

            <Button
              onClick={() => setShowConfirm('restart')}
              variant="danger"
              className="w-full"
            >
              Restart Game
            </Button>
          </div>
        </Card>

        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {showConfirm === 'end' ? 'End Game?' : 'Restart Game?'}
              </h3>
              <p className="text-gray-600 mb-4">
                {showConfirm === 'end'
                  ? 'This will end the game and show results to everyone. This cannot be undone.'
                  : 'This will clear all data and start fresh. This cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirm(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (showConfirm === 'end') {
                      endMutation.mutate()
                    } else {
                      restartMutation.mutate()
                    }
                  }}
                  loading={endMutation.isPending || restartMutation.isPending}
                  variant={showConfirm === 'end' ? 'primary' : 'danger'}
                  className="flex-1"
                >
                  Confirm
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
