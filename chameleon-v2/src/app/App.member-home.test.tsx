import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { App } from './App'

vi.mock('../services/authService', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({
      status: 'member',
      user: { id: 'user-1', nickname: '阿浩', provider: 'wechat-mock' },
    }),
  },
}))

vi.mock('../services/leaderboardService', () => ({
  leaderboardService: {
    listTopEntries: vi.fn().mockResolvedValue([]),
  },
}))

describe('member home state', () => {
  it('shows connected wechat status and activity copy on the home screen', async () => {
    render(<App />)

    expect(await screen.findByText('阿浩，欢迎回来')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '微信已连接' })).toBeInTheDocument()
    expect(screen.getByText('今日战报')).toBeInTheDocument()
  })
})
