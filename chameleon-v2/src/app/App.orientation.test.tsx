import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

describe('orientation gate', () => {
  it('keeps the user on the rotate step until landscape is ready', async () => {
    act(() => {
      setViewport(390, 844)
    })

    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: '立即挑战' }))

    expect(screen.getByText('请先横屏再开始')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始挑战' })).toBeDisabled()

    act(() => {
      setViewport(844, 390)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '开始挑战' })).toBeEnabled()
    })
  })
})
