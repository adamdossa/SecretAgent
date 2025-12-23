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
          <Card className="text-center bg-gradient-to-br from-christmas-green/5 to-white border border-christmas-green/20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Your Mission:</h2>
            <p className="text-gray-700 leading-relaxed">{selectedData.selected.missionText}</p>
          </Card>

          <Card className="border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>📝</span> Record Completion
            </h3>
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
                      className={`p-3 rounded-lg border-2 transition-all font-medium ${
                        selectedPlayer === p.id
                          ? 'border-christmas-green bg-christmas-green/10 text-christmas-green'
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
                  ✓ Record Completion
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-gray-600 font-medium">
                  You've completed missions with everyone!
                </p>
              </div>
            )}
          </Card>

          <Card className="border border-christmas-gold/20 bg-gradient-to-br from-christmas-gold/10 to-white">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>⭐</span> Completions ({completionsData?.completions.length || 0})
            </h3>
            {completionsData?.completions && completionsData.completions.length > 0 ? (
              <ul className="space-y-2">
                {completionsData.completions.map((c: any) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-christmas-green/20 text-christmas-green rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <span className="text-gray-700">with {c.involved_player_name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No completions yet - get started!</p>
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
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Generate Your Secret Missions</h2>
          <p className="text-gray-600 mb-6">
            The AI will create 3 unique secret missions for you to choose from.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
            size="lg"
            variant="secondary"
          >
            🎲 Generate Options
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

        {optionsData.options.map((option: any, index: number) => (
          <Card
            key={option.id}
            hoverable
            selected={selectedOption === option.id}
            onClick={() => setSelectedOption(option.id)}
            className="transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedOption === option.id
                    ? 'border-christmas-green bg-christmas-green text-white'
                    : 'border-gray-300'
                }`}
              >
                {selectedOption === option.id ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-gray-400 font-medium text-sm">{index + 1}</span>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed">{option.option_text}</p>
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
          ✓ Confirm Selection
        </Button>
      </div>
    </PageLayout>
  )
}
