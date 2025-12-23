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
      <PageLayout title="Secret Agents">
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
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-christmas-red mb-4">
            The Game Has Ended!
          </h2>
          <p className="text-gray-600 mb-6">
            Time to see the results...
          </p>
          <Link
            to="/prizes"
            className="inline-block bg-gradient-to-r from-christmas-red to-christmas-red-dark text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95"
          >
            🏆 View Results
          </Link>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Secret Agents">
      <div className="space-y-4">
        {/* Welcome card */}
        <Card className="text-center bg-gradient-to-br from-white to-gray-50 border border-gray-100">
          <p className="text-gray-500 mb-1">Hello,</p>
          <h2 className="text-2xl font-bold text-christmas-red">{player?.name}! 👋</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-3 py-1 bg-christmas-red/10 text-christmas-red text-sm font-medium rounded-full">
              Team {player?.team}
            </span>
          </div>
        </Card>

        {/* Tell section */}
        {!hasTell ? (
          <Link to="/tells">
            <Card hoverable className="border-2 border-dashed border-christmas-red/40 hover:border-christmas-red transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-christmas-red/10 rounded-xl flex items-center justify-center text-2xl">
                  👁️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">Choose Your Secret Tell</h3>
                  <p className="text-sm text-gray-500">Tap to select your secret behavior</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        ) : (
          <Card className="border border-christmas-red/20 bg-gradient-to-br from-christmas-red/5 to-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-christmas-red/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                👁️
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-christmas-red text-sm mb-1">Your Secret Tell</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{tellData.selected.tellText}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Mission section */}
        {!hasMission ? (
          <Link to="/missions">
            <Card hoverable className="border-2 border-dashed border-christmas-green/40 hover:border-christmas-green transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-christmas-green/10 rounded-xl flex items-center justify-center text-2xl">
                  🎯
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">Choose Your Secret Mission</h3>
                  <p className="text-sm text-gray-500">Tap to select your secret task</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        ) : (
          <Card className="border border-christmas-green/20 bg-gradient-to-br from-christmas-green/5 to-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-christmas-green/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                🎯
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-christmas-green text-sm mb-1">Your Secret Mission</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{missionData.selected.missionText}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-christmas-green/10 text-christmas-green text-xs font-bold rounded-full">
                    ✓ {completionsData?.completions.length || 0} completed
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Guessing prompt - show when both tell and mission are selected */}
        {hasTell && hasMission && (
          <Link to="/guessing">
            <Card hoverable className="border-2 border-dashed border-christmas-gold/40 hover:border-christmas-gold transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-christmas-gold/10 rounded-xl flex items-center justify-center text-2xl">
                  🔍
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">Guess Other Players' Tells</h3>
                  <p className="text-sm text-gray-500">Watch and guess what others are doing!</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        )}

        {/* Instructions */}
        {hasTell && hasMission && (
          <Card className="bg-gradient-to-br from-christmas-gold/10 to-white border border-christmas-gold/20">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-lg">📋</span> Your Mission Briefing
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-christmas-red/10 text-christmas-red rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Perform your secret tell whenever triggered - be subtle!</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-christmas-green/10 text-christmas-green rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Complete your mission with different family members</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-christmas-gold/20 text-christmas-gold rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Try to spot and guess other players' secret tells</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <span>Watch out - they're trying to guess yours too!</span>
              </li>
            </ul>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
