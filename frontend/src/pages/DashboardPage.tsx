import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { tellsApi, missionsApi, gameApi } from '../api/client'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

export default function DashboardPage() {
  const { player } = useAuthStore()

  const { data: tellData, isLoading: tellLoading } = useQuery({
    queryKey: ['selectedTell', player?.id],
    queryFn: () => tellsApi.getSelected(player!.id),
    enabled: !!player,
  })

  const { data: missionData, isLoading: missionLoading } = useQuery({
    queryKey: ['selectedMission', player?.id],
    queryFn: () => missionsApi.getSelected(player!.id),
    enabled: !!player,
  })

  const { data: completionsData } = useQuery({
    queryKey: ['missionCompletions', player?.id],
    queryFn: () => missionsApi.getCompletions(player!.id),
    enabled: !!player,
  })

  const { data: gameState } = useQuery({
    queryKey: ['gameState'],
    queryFn: gameApi.getState,
    refetchInterval: 5000,
  })

  if (tellLoading || missionLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  const hasTell = !!tellData?.selected
  const hasMission = !!missionData?.selected

  if (gameState?.status === 'finished') {
    return (
      <PageLayout title="Game Over!">
        <Card className="text-center py-8">
          <h2 className="text-2xl font-bold text-christmas-red mb-4">
            The Game Has Ended!
          </h2>
          <p className="text-gray-600 mb-6">
            Time to see the results...
          </p>
          <Link
            to="/prizes"
            className="inline-block bg-christmas-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-christmas-red-dark transition-colors"
          >
            View Results
          </Link>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Secret Agents">
      <div className="space-y-4">
        <Card className="text-center">
          <p className="text-gray-600 mb-1">Welcome back,</p>
          <h2 className="text-2xl font-bold text-christmas-red">{player?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Team {player?.team}</p>
        </Card>

        {!hasTell && (
          <Link to="/tells">
            <Card hoverable className="border-2 border-dashed border-christmas-red/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-christmas-red/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-christmas-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Choose Your Secret Tell</h3>
                  <p className="text-sm text-gray-500">Tap to select your secret behavior</p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {hasTell && (
          <Card>
            <div className="flex items-start gap-4">
              {tellData.selected.imageUrl ? (
                <img
                  src={tellData.selected.imageUrl}
                  alt="Tell reminder"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-christmas-red/10 rounded-lg flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-christmas-green text-sm mb-1">Your Secret Tell</h3>
                <p className="text-gray-700 text-sm">{tellData.selected.tellText}</p>
              </div>
            </div>
          </Card>
        )}

        {!hasMission && (
          <Link to="/missions">
            <Card hoverable className="border-2 border-dashed border-christmas-green/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-christmas-green/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-christmas-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Choose Your Secret Mission</h3>
                  <p className="text-sm text-gray-500">Tap to select your secret task</p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {hasMission && (
          <Card>
            <div className="flex items-start gap-4">
              {missionData.selected.imageUrl ? (
                <img
                  src={missionData.selected.imageUrl}
                  alt="Mission reminder"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-christmas-green/10 rounded-lg flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-christmas-green text-sm mb-1">Your Secret Mission</h3>
                <p className="text-gray-700 text-sm">{missionData.selected.missionText}</p>
                <p className="text-christmas-red font-semibold mt-2">
                  Completed: {completionsData?.completions.length || 0} times
                </p>
              </div>
            </div>
          </Card>
        )}

        {hasTell && hasMission && (
          <Card className="bg-christmas-green/5">
            <h3 className="font-semibold text-gray-800 mb-2">What to do now?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-christmas-green">1.</span>
                Perform your secret tell whenever triggered
              </li>
              <li className="flex items-center gap-2">
                <span className="text-christmas-green">2.</span>
                Complete your secret mission with different people
              </li>
              <li className="flex items-center gap-2">
                <span className="text-christmas-green">3.</span>
                Try to guess other players' secret tells
              </li>
              <li className="flex items-center gap-2">
                <span className="text-christmas-green">4.</span>
                Watch out - others are guessing yours!
              </li>
            </ul>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
