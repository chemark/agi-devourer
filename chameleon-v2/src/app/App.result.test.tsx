import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { App } from './App'

vi.mock('../services/authService', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({ status: 'guest' }),
  },
}))

vi.mock('../services/leaderboardService', () => ({
  leaderboardService: {
    listTopEntries: vi.fn().mockResolvedValue([]),
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
          defeatedKinds: ['openai', 'gemini'],
        })
      }
    >
      结束测试局
    </button>
  ),
}))

function setLandscape() {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 844,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 390,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('result flow', () => {
  it('shows result summary and guest login call-to-action after a run', async () => {
    setLandscape()

    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: '立即挑战' }))
    fireEvent.click(screen.getByRole('button', { name: '开始挑战' }))
    fireEvent.click(screen.getByRole('button', { name: '结束测试局' }))

    expect(
      await screen.findByRole('heading', { name: '本局战报' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1280 分')).toBeInTheDocument()
    expect(
      screen.getByText('算力过载：本局 1280 分，吞下了 OpenAI。'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '登录后上榜' }),
    ).toBeInTheDocument()
  })
})
