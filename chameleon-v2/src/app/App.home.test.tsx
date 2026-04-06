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
    listTopEntries: vi.fn().mockResolvedValue([
      {
        id: '1',
        nickname: '吞噬者A',
        score: 1460,
        summary: '热身成功',
        createdAt: '2026-04-06T00:00:00.000Z',
      },
      {
        id: '2',
        nickname: '奇点猎手',
        score: 1280,
        summary: '差一点暴走',
        createdAt: '2026-04-06T00:01:00.000Z',
      },
    ]),
  },
}))

describe('App home flow', () => {
  it('renders a portrait product home and moves to the rotate step', async () => {
    render(<App />)

    expect(await screen.findByText('全服算力榜')).toBeInTheDocument()
    expect(
      screen.getByText('游客可直接开玩，登录后才能上榜。'),
    ).toBeInTheDocument()
    expect(screen.getByText('今日战报')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '立即挑战' }))

    expect(
      screen.getByRole('heading', { name: '准备横屏开局' }),
    ).toBeInTheDocument()
  })
})
