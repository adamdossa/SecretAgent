import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { tellsApi, guessesApi } from '../api/client'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

export default function GuessingPage() {
  const { player } = useAuthStore()
  const queryClient = useQueryClient()
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null)

  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['allTellOptions', player?.id],
    queryFn: () => tellsApi.getAllOptions(player!.id),
    enabled: !!player,
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
    mutationFn: ({ targetPlayerId, guessedOptionId }: { targetPlayerId: number; guessedOptionId: number }) =>
      guessesApi.submit(player!.id, targetPlayerId, guessedOptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGuesses', player?.id] })
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

  const getMyGuessForPlayer = (targetId: number) => {
    return myGuesses?.guesses.find((g: any) => g.targetPlayerId === targetId)
  }

  return (
    <PageLayout title="Guess Tells" showBack>
      <div className="space-y-4">
        <p className="text-gray-600 text-center text-sm">
          Try to guess what each player's secret tell is!
        </p>

        {playersData?.players && playersData.players.length > 0 ? (
          playersData.players.map((targetPlayer: any) => {
            const myGuess = getMyGuessForPlayer(targetPlayer.id)
            const isExpanded = expandedPlayer === targetPlayer.id

            return (
              <Card key={targetPlayer.id}>
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedPlayer(isExpanded ? null : targetPlayer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-christmas-red/10 rounded-full flex items-center justify-center">
                        <span className="text-christmas-red font-semibold">
                          {targetPlayer.name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{targetPlayer.name}</h3>
                        <p className="text-xs text-gray-500">Team {targetPlayer.team}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {myGuess && (
                        <span className="text-xs bg-christmas-green/10 text-christmas-green px-2 py-1 rounded">
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
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <p className="text-sm text-gray-600 mb-3">
                      Which do you think is {targetPlayer.name}'s secret tell?
                    </p>
                    {targetPlayer.options.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          submitMutation.mutate({
                            targetPlayerId: targetPlayer.id,
                            guessedOptionId: option.id,
                          })
                        }}
                        disabled={submitMutation.isPending}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          myGuess?.guessedOptionId === option.id
                            ? 'border-christmas-green bg-christmas-green/10'
                            : 'border-gray-200 hover:border-christmas-red/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              myGuess?.guessedOptionId === option.id
                                ? 'border-christmas-green bg-christmas-green'
                                : 'border-gray-300'
                            }`}
                          >
                            {myGuess?.guessedOptionId === option.id && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-gray-700">{option.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )
          })
        ) : (
          <Card className="text-center py-8">
            <p className="text-gray-500">
              No other players have selected their tells yet.
            </p>
          </Card>
        )}

        <Card className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Guesses About You</h3>
          {guessesAboutMe?.guesses && guessesAboutMe.guesses.length > 0 ? (
            <ul className="space-y-2">
              {guessesAboutMe.guesses.map((g: any, i: number) => (
                <li key={i} className="text-sm text-gray-600">
                  <span className="text-christmas-red font-medium">{g.count}</span>
                  {' '}player{g.count > 1 ? 's' : ''} think{g.count === 1 ? 's' : ''} your tell is:
                  <br />
                  <span className="italic">"{g.guessedText}"</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No guesses about you yet</p>
          )}
        </Card>
      </div>
    </PageLayout>
  )
}
