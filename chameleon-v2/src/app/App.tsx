import { useEffect, useState } from 'react'

import GameCanvas from '../features/game/GameCanvas'
import HomeScreen from '../features/home/HomeScreen'
import ResultScreen from '../features/result/ResultScreen'
import RotateScreen from '../features/rotate/RotateScreen'
import { useOrientation } from '../hooks/useOrientation'
import { authService } from '../services/authService'
import { leaderboardService } from '../services/leaderboardService'
import { reportService } from '../services/reportService'
import type { LeaderboardEntry, RunSummary, SessionState } from './types'
import { useAppMachine } from './useAppMachine'

export function App() {
  const [session, setSession] = useState<SessionState>({ status: 'guest' })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [latestSummary, setLatestSummary] = useState<RunSummary | null>(null)
  const [resultCopy, setResultCopy] = useState('')
  const [rank, setRank] = useState<number | null>(null)
  const orientation = useOrientation()

  useEffect(() => {
    void authService.getSession().then(setSession)
    void leaderboardService.listTopEntries().then(setLeaderboard)
  }, [])

  const machine = useAppMachine({ session, leaderboard })

  async function handleGameComplete(summary: RunSummary) {
    setLatestSummary(summary)
    setRank(null)
    setResultCopy(await reportService.buildResultCopy(summary))
    machine.showResult()
  }

  if (machine.screen === 'rotate') {
    return (
      <RotateScreen
        orientation={orientation}
        onConfirm={machine.enterGame}
        onBack={machine.returnHome}
      />
    )
  }

  if (machine.screen === 'playing') {
    return <GameCanvas onComplete={handleGameComplete} />
  }

  if (machine.screen === 'result' && latestSummary) {
    return (
      <ResultScreen
        summary={latestSummary}
        resultCopy={resultCopy}
        rank={rank}
        isGuest={session.status === 'guest'}
        onLogin={() => undefined}
        onReplay={machine.startChallenge}
        onHome={machine.returnHome}
      />
    )
  }

  return (
    <main className="app-shell">
      <HomeScreen
        session={session}
        entries={leaderboard}
        onStart={machine.startChallenge}
      />
    </main>
  )
}

export default App
