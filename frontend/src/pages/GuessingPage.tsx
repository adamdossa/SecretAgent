import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { guessesApi, gameApi } from '../api/client'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Input from '../components/ui/Input'

interface Player {
  id: number
  name: string
  team: number
  hasTell: boolean
}

export default function GuessingPage() {
  const { player } = useAuthStore()
  const queryClient = useQueryClient()
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null)
  const [guessInputs, setGuessInputs] = useState<Record<number, string>>({})
  const [justSubmitted, setJustSubmitted] = useState<number | null>(null)

  const { data: gameState } = useQuery({
    queryKey: ['gameState'],
    queryFn: gameApi.getState,
  })

  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['gamePlayers'],
    queryFn: gameApi.getPlayers,
  })

  const { data: myGuesses } = useQuery({
    queryKey: ['myGuesses', player?.id],
    queryFn: () => guessesApi.getMine(player!.id),
    enabled: !!player,
  })

  const { data: guessesAboutMe } = useQuery({
    queryKey: ['guessesAboutMe', player?.id],
    queryFn: () => guessesApi.getAboutMe(player!.id),
    enabled: !!player,
  })

  const submitMutation = useMutation({
    mutationFn: ({ targetPlayerId, guessText }: { targetPlayerId: number; guessText: string }) =>
      guessesApi.submit(player!.id, targetPlayerId, guessText),
    onSuccess: (_, variables) => {
      setJustSubmitted(variables.targetPlayerId)
      queryClient.invalidateQueries({ queryKey: ['myGuesses', player?.id] })
      setGuessInputs(prev => ({ ...prev, [variables.targetPlayerId]: '' }))
      // Clear the "just submitted" indicator after a few seconds
      setTimeout(() => setJustSubmitted(null), 3000)
    },
  })

  if (playersLoading) {
    return (
      <PageLayout title="Guess Tells" showBack>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  // Show message if game hasn't started yet
  if (gameState?.status === 'setup') {
    return (
      <PageLayout title="Guess Tells" showBack>
        <Card className="text-center py-8">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-600 font-medium">The game hasn't started yet!</p>
          <p className="text-gray-500 text-sm mt-2">
            Guessing will be available once the host starts the game.
          </p>
        </Card>
      </PageLayout>
    )
  }

  // Show message if game has ended
  if (gameState?.status === 'finished') {
    return (
      <PageLayout title="Guess Tells" showBack>
        <Card className="text-center py-8">
          <div className="text-4xl mb-3">🎄</div>
          <p className="text-gray-600 font-medium">The game has ended!</p>
          <p className="text-gray-500 text-sm mt-2">
            Check out the results page to see how everyone did.
          </p>
        </Card>
      </PageLayout>
    )
  }

  // Filter to other players, separate by whether they have a tell
  const otherPlayers = playersData?.players?.filter((p: Player) => p.id !== player?.id) || []
  const readyPlayers = otherPlayers.filter((p: Player) => p.hasTell)
  const notReadyPlayers = otherPlayers.filter((p: Player) => !p.hasTell)

  const getMyGuessForPlayer = (targetId: number) => {
    return myGuesses?.guesses?.find((g: any) => g.targetPlayerId === targetId)
  }

  const handleSubmit = (targetPlayerId: number) => {
    const guessText = guessInputs[targetPlayerId]?.trim()
    if (guessText) {
      submitMutation.mutate({ targetPlayerId, guessText })
    }
  }

  return (
    <PageLayout title="Guess Tells" showBack>
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-christmas-red/5 to-white border border-christmas-red/20">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🔍</div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">How to Guess</h3>
              <p className="text-sm text-gray-600">
                Watch other players and describe what you think their secret tell is. Results are revealed when the game ends!
              </p>
            </div>
          </div>
        </Card>

        {/* Players ready to be guessed */}
        {readyPlayers.length > 0 ? (
          readyPlayers.map((targetPlayer: Player) => {
            const myGuess = getMyGuessForPlayer(targetPlayer.id)
            const isExpanded = expandedPlayer === targetPlayer.id
            const wasJustSubmitted = justSubmitted === targetPlayer.id

            return (
              <Card key={targetPlayer.id} className="overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedPlayer(isExpanded ? null : targetPlayer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-christmas-red to-christmas-red-dark rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {targetPlayer.name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{targetPlayer.name}</h3>
                        <p className="text-xs text-gray-500">Team {targetPlayer.team}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {myGuess && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-christmas-green/10 text-christmas-green">
                          Guessed
                        </span>
                      )}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {myGuess && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Your current guess:</p>
                        <p className="text-sm text-gray-700 italic">"{myGuess.guessText}"</p>
                      </div>
                    )}

                    <div>
                      <Input
                        label={myGuess ? 'Update your guess' : `What is ${targetPlayer.name}'s secret tell?`}
                        placeholder="e.g. They scratch their nose when..."
                        value={guessInputs[targetPlayer.id] || ''}
                        onChange={(e) => setGuessInputs(prev => ({
                          ...prev,
                          [targetPlayer.id]: e.target.value
                        }))}
                      />
                    </div>

                    <Button
                      onClick={() => handleSubmit(targetPlayer.id)}
                      loading={submitMutation.isPending && submitMutation.variables?.targetPlayerId === targetPlayer.id}
                      disabled={!guessInputs[targetPlayer.id]?.trim()}
                      className="w-full"
                    >
                      🎯 {myGuess ? 'Update Guess' : 'Submit Guess'}
                    </Button>

                    {wasJustSubmitted && (
                      <div className="rounded-lg p-3 bg-christmas-green/10 border border-christmas-green/30 text-center">
                        <p className="text-sm text-christmas-green font-medium">
                          ✓ Guess saved! Results revealed at game end.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        ) : (
          <Card className="text-center py-6">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-gray-600 font-medium">No players ready yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Waiting for others to select their secret tells...
            </p>
          </Card>
        )}

        {/* Players not ready */}
        {notReadyPlayers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide px-1">
              Not ready yet ({notReadyPlayers.length})
            </p>
            {notReadyPlayers.map((targetPlayer: Player) => (
              <Card key={targetPlayer.id} className="opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 font-bold">
                      {targetPlayer.name[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-500">{targetPlayer.name}</h3>
                    <p className="text-xs text-gray-400">Hasn't selected their tell yet</p>
                  </div>
                  <span className="text-xs text-gray-400">⏳</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Guesses about you */}
        <Card className="border border-gray-100 bg-gradient-to-br from-gray-50 to-white">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>👁️</span> Guesses About You
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Others are trying to figure out your secret tell...
          </p>
          {guessesAboutMe?.guesses && guessesAboutMe.guesses.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-8 h-8 bg-christmas-red/10 text-christmas-red rounded-full flex items-center justify-center font-bold">
                  {guessesAboutMe.guesses.length}
                </span>
                <span>player(s) have guessed your tell</span>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {guessesAboutMe.guesses.map((guess: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 flex-shrink-0">🔮</span>
                    <span className="text-gray-600 italic">"{guess.guessText}"</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 italic">
                Who guessed what is revealed when the game ends!
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No one has guessed your tell yet - stay mysterious! 🕵️</p>
          )}
        </Card>
      </div>
    </PageLayout>
  )
}
