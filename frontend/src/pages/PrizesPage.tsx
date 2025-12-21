import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { prizesApi, gameApi } from '../api/client'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

type Tab = 'scores' | 'tells' | 'missions' | 'guesses'

export default function PrizesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('scores')

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

  if (gameState?.status !== 'finished') {
    return (
      <PageLayout title="Results" showNav={false}>
        <Card className="text-center py-8">
          <p className="text-gray-500">The game hasn't ended yet!</p>
        </Card>
      </PageLayout>
    )
  }

  if (scoresLoading || revealsLoading) {
    return (
      <PageLayout title="Results" showNav={false}>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'scores', label: 'Scores' },
    { key: 'tells', label: 'Tells' },
    { key: 'missions', label: 'Missions' },
    { key: 'guesses', label: 'Guesses' },
  ]

  return (
    <PageLayout title="Results" showNav={false}>
      <div className="space-y-4">
        <Card className="text-center bg-christmas-red text-white">
          <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
          <p className="text-white/80">Here are the results...</p>
        </Card>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-christmas-red shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'scores' && scoresData && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-gray-800 mb-3">Individual Scores</h3>
              <div className="space-y-3">
                {scoresData.players.map((player: any, index: number) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : index === 1
                          ? 'bg-gray-300 text-gray-700'
                          : index === 2
                          ? 'bg-orange-300 text-orange-900'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{player.name}</p>
                      <p className="text-xs text-gray-500">
                        Tell: {player.tellPoints} | Mission: {player.missionPoints}
                        {player.teamNamePoints > 0 && ' | Team Name: 1'}
                      </p>
                    </div>
                    <div className="text-xl font-bold text-christmas-red">
                      {player.totalPoints}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-800 mb-3">Team Scores</h3>
              <div className="space-y-3">
                {scoresData.teams.map((team: any, index: number) => (
                  <div
                    key={team.team}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? 'bg-yellow-400 text-yellow-900'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <p className="font-medium text-gray-800">Team {team.team}</p>
                    </div>
                    <div className="text-xl font-bold text-christmas-green">
                      {team.totalPoints}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'tells' && revealsData && (
          <div className="space-y-3">
            {revealsData.tells.map((tell: any) => (
              <Card key={tell.playerId}>
                <div className="flex items-start gap-3">
                  {tell.imageUrl && (
                    <img
                      src={tell.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-800">{tell.playerName}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {tell.tellText || 'No tell selected'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'missions' && revealsData && (
          <div className="space-y-3">
            {revealsData.missions.map((mission: any) => (
              <Card key={mission.playerId}>
                <div className="flex items-start gap-3">
                  {mission.imageUrl && (
                    <img
                      src={mission.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">{mission.playerName}</h4>
                      <span className="text-christmas-green font-bold">
                        {mission.completionCount}x
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {mission.missionText || 'No mission selected'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'guesses' && revealsData && (
          <div className="space-y-3">
            {revealsData.guesses.map((guess: any, index: number) => (
              <Card
                key={index}
                className={guess.isCorrect ? 'border-2 border-christmas-green' : ''}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{guess.guesserName}</span>
                      {' '}guessed{' '}
                      <span className="font-medium">{guess.targetName}</span>'s tell:
                    </p>
                    <p className="text-sm text-gray-600 italic mt-1">
                      "{guess.guessedText}"
                    </p>
                  </div>
                  {guess.isCorrect ? (
                    <span className="text-christmas-green text-xl">+1</span>
                  ) : (
                    <span className="text-gray-300 text-xl">-</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
