import { useEffect, useState } from 'react'

import HomeScreen from '../features/home/HomeScreen'
import RotateScreen from '../features/rotate/RotateScreen'
import { useOrientation } from '../hooks/useOrientation'
import { authService } from '../services/authService'
import { leaderboardService } from '../services/leaderboardService'
import type { LeaderboardEntry, SessionState } from './types'
import { useAppMachine } from './useAppMachine'

export function App() {
  const [session, setSession] = useState<SessionState>({ status: 'guest' })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const orientation = useOrientation()

  useEffect(() => {
    void authService.getSession().then(setSession)
    void leaderboardService.listTopEntries().then(setLeaderboard)
  }, [])

  const machine = useAppMachine({ session, leaderboard })

  if (machine.screen === 'rotate') {
    return (
      <RotateScreen
        orientation={orientation}
        onConfirm={machine.enterGame}
        onBack={machine.returnHome}
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
