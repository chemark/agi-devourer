import type { LeaderboardEntry } from '../app/types'
import { readJson, writeJson } from './storage'

const LEADERBOARD_KEY = 'agi-v2-leaderboard'

const seededEntries: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    nickname: '吞噬者A',
    score: 1460,
    summary: '把 OpenAI 吞成了热身菜',
    createdAt: '2026-04-06T00:00:00.000Z',
  },
  {
    id: 'seed-2',
    nickname: '奇点猎手',
    score: 1280,
    summary: 'Claude 和 Qwen 在胃里打架',
    createdAt: '2026-04-06T00:01:00.000Z',
  },
  {
    id: 'seed-3',
    nickname: 'AI 饕餮',
    score: 980,
    summary: '勉强吞下 Kimi 与 Gemini',
    createdAt: '2026-04-06T00:02:00.000Z',
  },
]

type SubmitScoreInput = {
  nickname: string
  score: number
  summary: string
}

function loadEntries() {
  return readJson<LeaderboardEntry[]>(LEADERBOARD_KEY, seededEntries)
}

export const leaderboardService = {
  async listTopEntries(): Promise<LeaderboardEntry[]> {
    return [...loadEntries()].sort((a, b) => b.score - a.score).slice(0, 10)
  },

  async submitScore(input: SubmitScoreInput) {
    const nextEntry: LeaderboardEntry = {
      id: `entry-${Date.now()}`,
      nickname: input.nickname,
      score: input.score,
      summary: input.summary,
      createdAt: new Date().toISOString(),
    }

    const entries = [...loadEntries(), nextEntry].sort((a, b) => b.score - a.score)
    writeJson(LEADERBOARD_KEY, entries)

    return {
      entry: nextEntry,
      rank: entries.findIndex((item) => item.id === nextEntry.id) + 1,
    }
  },
}
