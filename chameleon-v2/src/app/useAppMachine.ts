import { useState } from 'react'

import type { LeaderboardEntry, SessionState } from './types'

export type ScreenState = 'home' | 'rotate' | 'playing' | 'result'

type AppMachineArgs = {
  session: SessionState
  leaderboard: LeaderboardEntry[]
}

export function useAppMachine({ session, leaderboard }: AppMachineArgs) {
  const [screen, setScreen] = useState<ScreenState>('home')

  return {
    screen,
    session,
    leaderboard,
    startChallenge() {
      setScreen('rotate')
    },
    enterGame() {
      setScreen('playing')
    },
    returnHome() {
      setScreen('home')
    },
  }
}
