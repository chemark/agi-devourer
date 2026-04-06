import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { App } from './App'

vi.mock('../services/authService', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({ status: 'guest' }),
  },
}))

vi.mock('../services/leaderboardService', () => ({
  leaderboardService: {
    listTopEntries: vi.fn().mockResolvedValue([
      {
        id: '1',
        nickname: '吞噬者A',
        score: 1460,
        summary: '热身成功',
        createdAt: '2026-04-06T00:00:00.000Z',
      },
    ]),
  },
}))

describe('App shell', () => {
  it('renders the portrait home shell after loading initial product data', async () => {
    render(<App />)

    await screen.findByText('吞噬者A')

    expect(screen.getByRole('heading', { name: '舌尖上的 AGI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '立即挑战' })).toBeInTheDocument()
  })
})
