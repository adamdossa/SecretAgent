import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { missionsApi } from '../api/client'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function MissionsPage() {
  const { player } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)

  const { data: optionsData, isLoading: optionsLoading } = useQuery({
    queryKey: ['missionOptions', player?.id],
    queryFn: () => missionsApi.getOptions(player!.id),
    enabled: !!player,
  })

  const { data: selectedData, isLoading: selectedLoading } = useQuery({
    queryKey: ['selectedMission', player?.id],
    queryFn: () => missionsApi.getSelected(player!.id),
    enabled: !!player,
    refetchInterval: 3000,
  })

  const { data: completionsData, refetch: refetchCompletions } = useQuery({
    queryKey: ['missionCompletions', player?.id],
    queryFn: () => missionsApi.getCompletions(player!.id),
    enabled: !!player,
  })

  const { data: availablePlayers } = useQuery({
    queryKey: ['availablePlayers', player?.id],
    queryFn: () => missionsApi.getAvailablePlayers(player!.id),
    enabled: !!player && !!selectedData?.selected,
  })

  const generateMutation = useMutation({
    mutationFn: () => missionsApi.generate(player!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missionOptions', player?.id] })
    },
  })

  const selectMutation = useMutation({
    mutationFn: (optionId: number) => missionsApi.select(player!.id, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selectedMission', player?.id] })
    },
  })

  const completeMutation = useMutation({
    mutationFn: (involvedPlayerId: number) => missionsApi.complete(player!.id, involvedPlayerId),
    onSuccess: () => {
      setSelectedPlayer(null)
      refetchCompletions()
      queryClient.invalidateQueries({ queryKey: ['availablePlayers', player?.id] })
    },
  })

  const isLoading = optionsLoading || selectedLoading

  if (isLoading) {
    return (
      <PageLayout title="Secret Mission" showBack>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  // If already selected, show the mission and completion recording
  if (selectedData?.selected) {
    return (
      <PageLayout title="Your Secret Mission" showBack>
        <div className="space-y-4">
          <Card className="text-center">
            {selectedData.selected.imageUrl ? (
              <img
                src={selectedData.selected.imageUrl}
                alt="Mission reminder"
                className="w-32 h-32 mx-auto rounded-xl object-cover mb-4"
              />
            ) : (
              <div className="w-32 h-32 mx-auto bg-christmas-green/10 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center">
                  <Spinner size="md" />
                  <p className="text-xs text-gray-500 mt-2">Generating image...</p>
                </div>
              </div>
            )}
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Your Mission:</h2>
            <p className="text-gray-700">{selectedData.selected.missionText}</p>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">Record Completion</h3>
            <p className="text-sm text-gray-600 mb-3">
              Who did you complete this mission with?
            </p>

            {availablePlayers?.players && availablePlayers.players.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {availablePlayers.players.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlayer(p.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedPlayer === p.id
                          ? 'border-christmas-green bg-christmas-green/10'
                          : 'border-gray-200 hover:border-christmas-green/50'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => selectedPlayer && completeMutation.mutate(selectedPlayer)}
                  loading={completeMutation.isPending}
                  disabled={!selectedPlayer}
                  variant="secondary"
                  className="w-full"
                >
                  Record Completion
                </Button>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">
                You've completed missions with everyone!
              </p>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">
              Completions ({completionsData?.completions.length || 0})
            </h3>
            {completionsData?.completions && completionsData.completions.length > 0 ? (
              <ul className="space-y-2">
                {completionsData.completions.map((c: any) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="text-christmas-green">+1</span>
                    <span>with {c.involved_player_name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No completions yet</p>
            )}
          </Card>
        </div>
      </PageLayout>
    )
  }

  // If no options generated yet
  if (!optionsData?.options || optionsData.options.length === 0) {
    return (
      <PageLayout title="Secret Mission" showBack>
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-christmas-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-christmas-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Generate Your Secret Missions</h2>
          <p className="text-gray-600 mb-6">
            The AI will create 3 unique secret missions for you to choose from.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
            size="lg"
            variant="secondary"
          >
            Generate Options
          </Button>
        </div>
      </PageLayout>
    )
  }

  // Show options to choose from
  return (
    <PageLayout title="Choose Your Mission" showBack>
      <div className="space-y-4">
        <p className="text-gray-600 text-center">
          Select one secret mission to complete throughout the game:
        </p>

        {optionsData.options.map((option: any) => (
          <Card
            key={option.id}
            hoverable
            selected={selectedOption === option.id}
            onClick={() => setSelectedOption(option.id)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  selectedOption === option.id
                    ? 'border-christmas-green bg-christmas-green'
                    : 'border-gray-300'
                }`}
              >
                {selectedOption === option.id && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-gray-700">{option.option_text}</p>
            </div>
          </Card>
        ))}

        <Button
          onClick={() => selectedOption && selectMutation.mutate(selectedOption)}
          loading={selectMutation.isPending}
          disabled={!selectedOption}
          className="w-full"
          size="lg"
          variant="secondary"
        >
          Confirm Selection
        </Button>
      </div>
    </PageLayout>
  )
}
