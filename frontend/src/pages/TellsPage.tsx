import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { tellsApi } from '../api/client'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function TellsPage() {
  const { player } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const { data: optionsData, isLoading: optionsLoading } = useQuery({
    queryKey: ['tellOptions', player?.id],
    queryFn: () => tellsApi.getOptions(player!.id),
    enabled: !!player,
  })

  const { data: selectedData, isLoading: selectedLoading } = useQuery({
    queryKey: ['selectedTell', player?.id],
    queryFn: () => tellsApi.getSelected(player!.id),
    enabled: !!player,
  })

  const generateMutation = useMutation({
    mutationFn: () => tellsApi.generate(player!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tellOptions', player?.id] })
    },
  })

  const selectMutation = useMutation({
    mutationFn: (optionId: number) => tellsApi.select(player!.id, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selectedTell', player?.id] })
    },
  })

  const isLoading = optionsLoading || selectedLoading

  if (isLoading) {
    return (
      <PageLayout title="Secret Tell" showBack>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  // If already selected, show the selected tell
  if (selectedData?.selected) {
    return (
      <PageLayout title="Your Secret Tell" showBack>
        <div className="space-y-4">
          <Card className="text-center bg-gradient-to-br from-christmas-red/5 to-white border border-christmas-red/20">
            <div className="text-6xl mb-4">👁️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Remember to:</h2>
            <p className="text-gray-700 leading-relaxed">{selectedData.selected.tellText}</p>
          </Card>

          <Card className="bg-gradient-to-br from-christmas-gold/10 to-white border border-christmas-gold/20">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>💡</span> Tips for Success
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-christmas-green">•</span>
                <span>Be subtle! Don't make it too obvious</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-christmas-green">•</span>
                <span>Do it consistently when triggered</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-christmas-green">•</span>
                <span>Others are watching and trying to guess!</span>
              </li>
            </ul>
          </Card>
        </div>
      </PageLayout>
    )
  }

  // If no options generated yet
  if (!optionsData?.options || optionsData.options.length === 0) {
    return (
      <PageLayout title="Secret Tell" showBack>
        <div className="text-center py-8">
          <div className="text-6xl mb-6">👁️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Generate Your Secret Tells</h2>
          <p className="text-gray-600 mb-6">
            The AI will create 3 unique secret tells for you to choose from.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
            size="lg"
          >
            🎲 Generate Options
          </Button>
        </div>
      </PageLayout>
    )
  }

  // Show options to choose from
  return (
    <PageLayout title="Choose Your Tell" showBack>
      <div className="space-y-4">
        <p className="text-gray-600 text-center">
          Select one secret tell to perform throughout the game:
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
                    ? 'border-christmas-red bg-christmas-red text-white'
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
        >
          ✓ Confirm Selection
        </Button>
      </div>
    </PageLayout>
  )
}
