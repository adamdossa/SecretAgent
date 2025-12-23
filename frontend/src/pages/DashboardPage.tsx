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
  const isSetup = gameState?.status === 'setup'
  const isFinished = gameState?.status === 'finished'
  const teamName = gameState?.teamNames?.[player?.team || 0]

  // Game finished - show results prompt
  if (isFinished) {
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

  // SETUP PHASE - Focus on preparation
  if (isSetup) {
    const isReady = hasTell && hasMission

    return (
      <PageLayout title="Get Ready">
        <div className="space-y-4">
          {/* Welcome */}
          <Card className="text-center bg-gradient-to-br from-white to-gray-50 border border-gray-100">
            <p className="text-gray-500 mb-1">Welcome,</p>
            <h2 className="text-2xl font-bold text-christmas-red">{player?.name}! 👋</h2>
            <span className="inline-block mt-2 px-3 py-1 bg-christmas-red/10 text-christmas-red text-sm font-medium rounded-full">
              Team {player?.team}
            </span>
          </Card>

          {/* Setup Briefing */}
          <Card className="bg-gradient-to-br from-christmas-gold/10 to-white border border-christmas-gold/20">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-lg">📋</span> Preparation Checklist
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Complete these steps before the game begins:
            </p>
            <div className="space-y-2">
              <div className={`flex items-center gap-3 p-2 rounded-lg ${hasTell ? 'bg-christmas-green/10' : 'bg-gray-50'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasTell ? 'bg-christmas-green text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {hasTell ? '✓' : '1'}
                </span>
                <span className={`text-sm ${hasTell ? 'text-christmas-green font-medium' : 'text-gray-600'}`}>
                  Choose your secret tell
                </span>
              </div>
              <div className={`flex items-center gap-3 p-2 rounded-lg ${hasMission ? 'bg-christmas-green/10' : 'bg-gray-50'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasMission ? 'bg-christmas-green text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {hasMission ? '✓' : '2'}
                </span>
                <span className={`text-sm ${hasMission ? 'text-christmas-green font-medium' : 'text-gray-600'}`}>
                  Choose your secret mission
                </span>
              </div>
            </div>
          </Card>

          {/* Action Cards */}
          <div className="space-y-3">
            {/* Select Tell */}
            {!hasTell ? (
              <Link to="/tells">
                <Card hoverable className="border-2 border-christmas-red/40 hover:border-christmas-red transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-christmas-red/10 rounded-xl flex items-center justify-center text-xl">
                      👁️
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">Select Your Secret Tell</h3>
                      <p className="text-xs text-gray-500">A subtle behavior you'll perform</p>
                    </div>
                    <svg className="w-5 h-5 text-christmas-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="border border-christmas-green/30 bg-christmas-green/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-christmas-green/20 rounded-xl flex items-center justify-center text-xl">
                    ✓
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-christmas-green text-sm">Tell Selected</h3>
                    <p className="text-xs text-gray-600 line-clamp-1">{tellData.selected.tellText}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Select Mission */}
            {!hasMission ? (
              <Link to="/missions">
                <Card hoverable className="border-2 border-christmas-green/40 hover:border-christmas-green transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-christmas-green/10 rounded-xl flex items-center justify-center text-xl">
                      🎯
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">Select Your Secret Mission</h3>
                      <p className="text-xs text-gray-500">A task to complete with others</p>
                    </div>
                    <svg className="w-5 h-5 text-christmas-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="border border-christmas-green/30 bg-christmas-green/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-christmas-green/20 rounded-xl flex items-center justify-center text-xl">
                    ✓
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-christmas-green text-sm">Mission Selected</h3>
                    <p className="text-xs text-gray-600 line-clamp-1">{missionData.selected.missionText}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Ready Status */}
          {isReady && (
            <Card className="text-center border-2 border-dashed border-christmas-gold/50 bg-gradient-to-br from-christmas-gold/10 to-white">
              <div className="text-4xl mb-2">🎄</div>
              <h3 className="font-bold text-christmas-gold">You're Ready!</h3>
              <p className="text-sm text-gray-600 mt-1">
                Waiting for the host to start the game...
              </p>
            </Card>
          )}
        </div>
      </PageLayout>
    )
  }

  // ACTIVE PHASE - Focus on gameplay
  return (
    <PageLayout title="Game On!">
      <div className="space-y-4">
        {/* Welcome with Team Name */}
        <Card className="text-center bg-gradient-to-br from-white to-gray-50 border border-gray-100">
          <p className="text-gray-500 mb-1">Agent</p>
          <h2 className="text-2xl font-bold text-christmas-red">{player?.name}</h2>
          {teamName ? (
            <span className="inline-block mt-2 px-4 py-2 bg-gradient-to-r from-christmas-gold/20 to-christmas-gold/10 text-christmas-gold border border-christmas-gold/30 text-sm font-bold rounded-full">
              {teamName}
            </span>
          ) : (
            <span className="inline-block mt-2 px-3 py-1 bg-christmas-red/10 text-christmas-red text-sm font-medium rounded-full">
              Team {player?.team}
            </span>
          )}
        </Card>

        {/* Game Briefing */}
        <Card className="bg-gradient-to-br from-christmas-gold/10 to-white border border-christmas-gold/20">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-lg">🕵️</span> Your Mission Briefing
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-christmas-red">👁️</span>
              <span>Perform your tell subtly - don't get caught!</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-christmas-green">🎯</span>
              <span>Complete your mission with family members</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-christmas-gold">🔍</span>
              <span>Watch others and guess their tells</span>
            </li>
          </ul>
        </Card>

        {/* Your Secrets - Compact Reminders */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/tells">
            <Card className="h-full border border-christmas-red/20 bg-gradient-to-br from-christmas-red/5 to-white hover:border-christmas-red/40 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-1">👁️</div>
                <h4 className="text-xs font-bold text-christmas-red mb-1">Your Tell</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{tellData?.selected?.tellText}</p>
              </div>
            </Card>
          </Link>
          <Link to="/missions">
            <Card className="h-full border border-christmas-green/20 bg-gradient-to-br from-christmas-green/5 to-white hover:border-christmas-green/40 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-1">🎯</div>
                <h4 className="text-xs font-bold text-christmas-green mb-1">Your Mission</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{missionData?.selected?.missionText}</p>
                <div className="mt-1">
                  <span className="text-xs font-bold text-christmas-green">
                    {completionsData?.completions.length || 0} done
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Actions</p>

          {/* Guess Tells */}
          <Link to="/guessing">
            <Card hoverable className="border-2 border-christmas-gold/40 hover:border-christmas-gold transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-christmas-gold/10 rounded-xl flex items-center justify-center text-xl">
                  🔍
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">Guess Other Tells</h3>
                  <p className="text-xs text-gray-500">Watch and guess what others are doing</p>
                </div>
                <svg className="w-5 h-5 text-christmas-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>

          {/* Complete Mission */}
          <Link to="/missions">
            <Card hoverable className="border-2 border-christmas-green/40 hover:border-christmas-green transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-christmas-green/10 rounded-xl flex items-center justify-center text-xl">
                  ✓
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">Record Mission Completion</h3>
                  <p className="text-xs text-gray-500">Log when you complete your mission</p>
                </div>
                <svg className="w-5 h-5 text-christmas-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
