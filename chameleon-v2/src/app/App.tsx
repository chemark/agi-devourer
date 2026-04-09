import { useEffect, useState } from 'react'

import GameCanvas from '../features/game/GameCanvas'
import HomeScreen from '../features/home/HomeScreen'
import LoginSheet from '../features/auth/LoginSheet'
import ResultScreen from '../features/result/ResultScreen'
import RotateScreen from '../features/rotate/RotateScreen'
import { useViewportProfile } from '../hooks/useOrientation'
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
  const [loginOpen, setLoginOpen] = useState(false)
  const [successNote, setSuccessNote] = useState('')
  const { orientation, isCompactLandscape } = useViewportProfile()

  useEffect(() => {
    void authService.getSession().then(setSession)
    void leaderboardService.listTopEntries().then(setLeaderboard)
  }, [])

  const machine = useAppMachine({ session, leaderboard })

  async function handleGameComplete(summary: RunSummary) {
    setLatestSummary(summary)
    setRank(null)
    setSuccessNote('')
    setLoginOpen(false)
    setResultCopy(await reportService.buildResultCopy(summary))
    machine.showResult()
  }

  async function handleLoginAndSubmit(nickname: string) {
    const normalizedNickname = nickname.trim()
    const nextSession = await authService.loginWithWeChatMock({
      nickname: normalizedNickname,
    })
    setSession(nextSession)

    if (latestSummary) {
      const result = await leaderboardService.submitScore({
        nickname: normalizedNickname,
        score: latestSummary.score,
        summary: resultCopy,
      })

      setRank(result.rank)
      setSuccessNote(`${normalizedNickname}，成绩已成功上榜。`)
    }

    setLoginOpen(false)
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
    return (
      <GameCanvas
        compact={isCompactLandscape}
        onComplete={handleGameComplete}
      />
    )
  }

  if (machine.screen === 'result' && latestSummary) {
    return (
      <>
        <ResultScreen
          compact={isCompactLandscape}
          summary={latestSummary}
          resultCopy={resultCopy}
          rank={rank}
          isGuest={session.status === 'guest'}
          successNote={successNote}
          onLogin={() => setLoginOpen(true)}
          onReplay={() => {
            setSuccessNote('')
            setLoginOpen(false)
            machine.startChallenge()
          }}
          onHome={machine.returnHome}
        />
        {loginOpen ? (
          <LoginSheet
            compact={isCompactLandscape}
            onSubmit={handleLoginAndSubmit}
            onClose={() => setLoginOpen(false)}
          />
        ) : null}
      </>
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
