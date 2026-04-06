import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { App } from './App'

vi.mock('../services/authService', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({ status: 'guest' }),
    loginWithWeChatMock: vi
      .fn()
      .mockImplementation(async ({ nickname }: { nickname: string }) => ({
        status: 'member',
        user: { id: 'user-1', nickname, provider: 'wechat-mock' },
      })),
  },
}))

vi.mock('../services/leaderboardService', () => ({
  leaderboardService: {
    listTopEntries: vi.fn().mockResolvedValue([]),
    submitScore: vi.fn().mockResolvedValue({
      rank: 1,
      entry: {
        id: 'entry-1',
        nickname: '阿浩',
        score: 1280,
        summary: '算力过载',
        createdAt: '2026-04-06T00:00:00.000Z',
      },
    }),
  },
}))

vi.mock('../services/reportService', () => ({
  reportService: {
    buildResultCopy: vi
      .fn()
      .mockResolvedValue('算力过载：本局 1280 分，吞下了 OpenAI。'),
  },
}))

vi.mock('../features/game/GameCanvas', () => ({
  default: ({ onComplete }: { onComplete: (summary: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onComplete({
          score: 1280,
          hits: 6,
          durationMs: 60000,
          defeatedKinds: ['openai'],
        })
      }
    >
      结束测试局
    </button>
  ),
}))

function setLandscape() {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 390,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('login ranking flow', () => {
  it('submits the held score after mock wechat login', async () => {
    setLandscape()

    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: '立即挑战' }))
    fireEvent.click(screen.getByRole('button', { name: '开始挑战' }))
    fireEvent.click(screen.getByRole('button', { name: '结束测试局' }))
    await screen.findByRole('heading', { name: '本局战报' })
    fireEvent.click(screen.getByRole('button', { name: '登录后上榜' }))

    fireEvent.change(screen.getByLabelText('昵称输入框'), {
      target: { value: '阿浩' },
    })
    fireEvent.click(screen.getByRole('button', { name: '微信一键登录' }))

    expect(await screen.findByText('当前排名 #1')).toBeInTheDocument()
    expect(screen.getByText('阿浩，成绩已成功上榜。')).toBeInTheDocument()
  })
})
