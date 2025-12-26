import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { prizesApi, gameApi } from '../api/client'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

type Tab = 'scores' | 'tells' | 'missions' | 'guesses' | 'awards'

export default function PrizesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('scores')
  const [showJudging, setShowJudging] = useState(true)

  const { data: gameState } = useQuery({
    queryKey: ['gameState'],
    queryFn: gameApi.getState,
  })

  const { data: scoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ['scores'],
    queryFn: prizesApi.getScores,
    enabled: gameState?.status === 'finished',
  })

  const { data: revealsData, isLoading: revealsLoading } = useQuery({
    queryKey: ['reveals'],
    queryFn: prizesApi.getReveals,
    enabled: gameState?.status === 'finished',
  })

  const { data: awardsData, isLoading: awardsLoading } = useQuery({
    queryKey: ['funAwards'],
    queryFn: prizesApi.getFunAwards,
    enabled: gameState?.status === 'finished' && !showJudging,
  })

  // Show judging animation for a few seconds
  useEffect(() => {
    if (gameState?.status === 'finished' && showJudging) {
      const timer = setTimeout(() => setShowJudging(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState?.status, showJudging])

  if (gameState?.status !== 'finished') {
    return (
      <PageLayout title="Results" showNav={false}>
        <Card className="text-center py-8">
          <div className="text-4xl mb-3">🎮</div>
          <p className="text-gray-600 font-medium">The game hasn't ended yet!</p>
          <p className="text-gray-500 text-sm mt-2">Check back when the host ends the game.</p>
        </Card>
      </PageLayout>
    )
  }

  // Judging animation screen
  if (showJudging || scoresLoading || revealsLoading) {
    return (
      <PageLayout title="Results" showNav={false}>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-6 animate-bounce">🎅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Santa's Judging...</h2>
          <p className="text-gray-600 text-center mb-6">
            Calculating who's been naughty and nice!
          </p>
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-christmas-red rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-christmas-green rounded-full animate-pulse delay-100"></div>
            <div className="w-3 h-3 bg-christmas-gold rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </PageLayout>
    )
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'scores', label: 'Scores', icon: '🏆' },
    { key: 'awards', label: 'Awards', icon: '🎖️' },
    { key: 'tells', label: 'Tells', icon: '👁️' },
    { key: 'missions', label: 'Missions', icon: '🎯' },
    { key: 'guesses', label: 'Guesses', icon: '🔍' },
  ]

  // Group guesses by target for compact display
  const groupedGuesses = revealsData?.guesses?.reduce((acc: any, guess: any) => {
    if (!acc[guess.targetName]) {
      acc[guess.targetName] = {
        targetName: guess.targetName,
        actualTell: guess.actualTellText,
        guesses: []
      }
    }
    acc[guess.targetName].guesses.push(guess)
    return acc
  }, {}) || {}

  return (
    <PageLayout title="Results" showNav={false}>
      <div className="space-y-4">
        {/* Tab navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-christmas-red shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scores Tab */}
        {activeTab === 'scores' && scoresData && (
          <div className="space-y-4">
            {/* Team Name Winners - one per team */}
            {scoresData.teamNameWinners && scoresData.teamNameWinners.length > 0 && (
              <Card className="bg-gradient-to-br from-christmas-gold/20 to-white border border-christmas-gold/30">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏆</span> Best Team Name Awards (+2 pts each)
                </h3>
                <div className="space-y-4">
                  {scoresData.teamNameWinners.map((winner: any) => (
                    <div key={winner.team} className="border-b border-christmas-gold/20 last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 bg-christmas-gold/20 text-christmas-gold rounded">
                          Team {winner.team}
                        </span>
                        <span className="font-bold text-gray-800">{winner.playerName}</span>
                      </div>
                      <p className="text-christmas-gold font-semibold">
                        "{winner.suggestion}"
                      </p>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {winner.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* All Team Name Suggestions */}
            {scoresData.allTeamNameSuggestions && scoresData.allTeamNameSuggestions.length > 0 && (
              <Card className="border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📝</span> All Team Name Suggestions
                </h4>
                <div className="space-y-3">
                  {[1, 2, 3].map(teamNum => {
                    const teamSuggestions = scoresData.allTeamNameSuggestions.filter((s: any) => s.team === teamNum)
                    const winner = scoresData.teamNameWinners?.find((w: any) => w.team === teamNum)
                    if (teamSuggestions.length === 0) return null
                    return (
                      <div key={teamNum}>
                        <p className="text-xs font-bold text-gray-500 mb-1">Team {teamNum}</p>
                        {teamSuggestions.map((s: any, i: number) => {
                        const isWinner = winner?.playerName === s.name
                        return (
                          <div key={i} className={`flex items-center justify-between py-1 ${
                            isWinner ? 'text-christmas-gold font-medium' : 'text-gray-600'
                          }`}>
                            <span className="text-sm">
                              {isWinner && '🏆 '}"{s.suggestion}"
                            </span>
                            <span className="text-xs text-gray-500">{s.name}</span>
                          </div>
                        )
                      })}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Team Scores */}
            <Card className="bg-gradient-to-br from-christmas-green/5 to-white border border-christmas-green/20">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🏅</span> Team Standings
              </h3>
              <div className="space-y-3">
                {scoresData.teams.map((team: any, index: number) => (
                  <div
                    key={team.team}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-christmas-gold/20' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${index === 0 ? '' : 'grayscale opacity-50'}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <span className="font-bold text-gray-800">Team {team.team}</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-christmas-gold' : 'text-gray-600'
                    }`}>
                      {team.totalPoints}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Individual Scores */}
            <Card>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>👑</span> Individual Leaderboard
              </h3>
              <div className="space-y-2">
                {scoresData.players.map((player: any, index: number) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      index < 3 ? 'bg-gradient-to-r from-christmas-gold/10 to-transparent' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{player.name}</p>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>👁️ {player.tellPoints}</span>
                        <span>🎯 {player.missionPoints}</span>
                        {player.teamNamePoints > 0 && <span>📝 2</span>}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-christmas-red">
                      {player.totalPoints}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Awards Tab */}
        {activeTab === 'awards' && (
          <div className="space-y-3">
            {awardsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : awardsData?.awards ? (
              awardsData.awards.map((award: any, index: number) => (
                <Card key={index} className="bg-gradient-to-br from-christmas-gold/10 to-white border border-christmas-gold/20">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🏆</div>
                    <div>
                      <p className="font-bold text-gray-800">{award.name}</p>
                      <p className="text-christmas-red font-semibold text-sm">{award.award}</p>
                      <p className="text-gray-600 text-sm mt-1">{award.reason}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-center py-8">
                <p className="text-gray-500">Loading fun awards...</p>
              </Card>
            )}
          </div>
        )}

        {/* Tells Tab */}
        {activeTab === 'tells' && revealsData && (
          <div className="space-y-3">
            {revealsData.tells.map((tell: any) => (
              <Card key={tell.playerId} className="border border-christmas-red/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-christmas-red/10 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                    👁️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800">{tell.playerName}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {tell.tellText || <span className="italic text-gray-400">No tell selected</span>}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Missions Tab */}
        {activeTab === 'missions' && revealsData && (
          <div className="space-y-3">
            {revealsData.missions.map((mission: any) => (
              <Card key={mission.playerId} className="border border-christmas-green/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-christmas-green/10 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                    🎯
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-800">{mission.playerName}</h4>
                      <span className="text-christmas-green font-bold text-sm">
                        {mission.completionCount}x
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {mission.missionText || <span className="italic text-gray-400">No mission selected</span>}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Guesses Tab - Compact grouped display */}
        {activeTab === 'guesses' && revealsData && (
          <div className="space-y-4">
            {Object.values(groupedGuesses).map((group: any) => (
              <Card key={group.targetName} className="border border-gray-100">
                <div className="mb-3">
                  <h4 className="font-bold text-gray-800">{group.targetName}'s Tell</h4>
                  <p className="text-sm text-christmas-red italic">
                    {group.actualTell || 'No tell selected'}
                  </p>
                </div>
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  {group.guesses.map((guess: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`flex-shrink-0 ${guess.isCorrect ? 'text-christmas-green' : 'text-gray-400'}`}>
                        {guess.isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">{guess.guesserName}</span>
                        {guess.guessText && (
                          <span className="italic text-gray-500"> "{guess.guessText}"</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
