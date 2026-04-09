import { act, fireEvent, render, screen } from '@testing-library/react'
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
      rank: 4,
      entry: {
        id: 'entry-4',
        nickname: '手机试玩员',
        score: 520,
        summary: '胃袋热机',
        createdAt: '2026-04-06T00:00:00.000Z',
      },
    }),
  },
}))

vi.mock('../services/reportService', () => ({
  reportService: {
    buildResultCopy: vi
      .fn()
      .mockResolvedValue('胃袋热机：本局 520 分，吞下了 openai、claude。'),
  },
}))

vi.mock('../features/game/GameCanvas', () => ({
  default: ({
    compact = false,
    onComplete,
  }: {
    compact?: boolean
    onComplete: (summary: unknown) => void
  }) => (
    <section
      data-testid="mock-game-canvas"
      data-layout={compact ? 'compact' : 'regular'}
    >
      <button
        type="button"
        onClick={() =>
          onComplete({
            score: 520,
            hits: 2,
            durationMs: 60000,
            defeatedKinds: ['openai', 'claude'],
          })
        }
      >
        结束测试局
      </button>
    </section>
  ),
}))

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('compact landscape layout', () => {
  it('switches gameplay and result flow into compact layout on short landscape screens', async () => {
    act(() => {
      setViewport(844, 390)
    })

    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: '立即挑战' }))
    fireEvent.click(screen.getByRole('button', { name: '开始挑战' }))

    expect(screen.getByTestId('mock-game-canvas')).toHaveAttribute(
      'data-layout',
      'compact',
    )

    fireEvent.click(screen.getByRole('button', { name: '结束测试局' }))

    const resultMain = (await screen.findByRole('heading', { name: '本局战报' }))
      .closest('main')

    expect(resultMain).toHaveAttribute('data-layout', 'compact')
  })

  it('keeps the login sheet in compact layout on short landscape screens', async () => {
    act(() => {
      setViewport(844, 390)
    })

    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: '立即挑战' }))
    fireEvent.click(screen.getByRole('button', { name: '开始挑战' }))
    fireEvent.click(screen.getByRole('button', { name: '结束测试局' }))
    fireEvent.click(await screen.findByRole('button', { name: '登录后上榜' }))

    expect(screen.getByLabelText('Mock 微信登录')).toHaveAttribute(
      'data-layout',
      'compact',
    )
  })
})
