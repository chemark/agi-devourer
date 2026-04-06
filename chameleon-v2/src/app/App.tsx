import { useEffect, useState } from 'react'

import HomeScreen from '../features/home/HomeScreen'
import { authService } from '../services/authService'
import { leaderboardService } from '../services/leaderboardService'
import type { LeaderboardEntry, SessionState } from './types'
import { useAppMachine } from './useAppMachine'

export function App() {
  const [session, setSession] = useState<SessionState>({ status: 'guest' })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    void authService.getSession().then(setSession)
    void leaderboardService.listTopEntries().then(setLeaderboard)
  }, [])

  const machine = useAppMachine({ session, leaderboard })

  if (machine.screen === 'rotate') {
    return (
      <main className="app-shell">
        <section className="hero-card">
          <h1>准备横屏开局</h1>
          <p className="hero-copy">下一步会检查横屏状态，再进入正式挑战。</p>
        </section>
      </main>
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
