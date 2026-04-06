import { beforeEach, describe, expect, it } from 'vitest'

import { authService } from './authService'
import { leaderboardService } from './leaderboardService'
import { reportService } from './reportService'
import { resetStorage } from './storage'

describe('authService', () => {
  beforeEach(() => {
    resetStorage()
  })

  it('starts as a guest and logs in via mock wechat', async () => {
    expect(await authService.getSession()).toEqual({ status: 'guest' })

    const session = await authService.loginWithWeChatMock({ nickname: '阿浩' })

    expect(session.status).toBe('member')

    if (session.status === 'member') {
      expect(session.user.nickname).toBe('阿浩')
      expect(session.user.provider).toBe('wechat-mock')
    }
  })
})

describe('leaderboardService', () => {
  beforeEach(() => {
    resetStorage()
  })

  it('returns seeded entries and inserts a new score at the correct rank', async () => {
    const seeded = await leaderboardService.listTopEntries()
    expect(seeded.length).toBeGreaterThanOrEqual(3)

    const result = await leaderboardService.submitScore({
      nickname: '阿浩',
      score: 1880,
      summary: '吞下了 OpenAI 和 Gemini',
    })

    expect(result.rank).toBe(1)

    const after = await leaderboardService.listTopEntries()
    expect(after[0].id).toBe(result.entry.id)
  })
})

describe('reportService', () => {
  it('builds a result line from score tiers', async () => {
    const line = await reportService.buildResultCopy({
      score: 1280,
      hits: 6,
      durationMs: 60000,
      defeatedKinds: ['openai', 'gemini'],
    })

    expect(line).toContain('1280')
    expect(line.length).toBeGreaterThan(10)
  })
})
