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
    refetchInterval: 3000,
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

  const handleGenerate = () => {
    generateMutation.mutate()
  }

  const handleSelect = () => {
    if (selectedOption) {
      selectMutation.mutate(selectedOption)
    }
  }

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
          <Card className="text-center">
            {selectedData.selected.imageUrl ? (
              <img
                src={selectedData.selected.imageUrl}
                alt="Tell reminder"
                className="w-32 h-32 mx-auto rounded-xl object-cover mb-4"
              />
            ) : (
              <div className="w-32 h-32 mx-auto bg-christmas-red/10 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center">
                  <Spinner size="md" />
                  <p className="text-xs text-gray-500 mt-2">Generating image...</p>
                </div>
              </div>
            )}
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Remember to:</h2>
            <p className="text-gray-700">{selectedData.selected.tellText}</p>
          </Card>

          <Card className="bg-christmas-green/5">
            <h3 className="font-semibold text-gray-800 mb-2">Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>- Be subtle! Don't make it too obvious</li>
              <li>- Do it consistently when triggered</li>
              <li>- Others are watching and trying to guess!</li>
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
          <div className="w-20 h-20 bg-christmas-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-christmas-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Generate Your Secret Tells</h2>
          <p className="text-gray-600 mb-6">
            The AI will create 3 unique secret tells for you to choose from.
          </p>
          <Button
            onClick={handleGenerate}
            loading={generateMutation.isPending}
            size="lg"
          >
            Generate Options
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
                    ? 'border-christmas-red bg-christmas-red'
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
          onClick={handleSelect}
          loading={selectMutation.isPending}
          disabled={!selectedOption}
          className="w-full"
          size="lg"
        >
          Confirm Selection
        </Button>
      </div>
    </PageLayout>
  )
}
