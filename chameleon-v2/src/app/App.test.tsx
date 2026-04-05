import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App shell', () => {
  it('renders the Chinese V2 shell copy', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '变色龙 V2' })).toBeInTheDocument()
    expect(screen.getByText('新的前端底座已就位，后续功能会在这里逐步补齐。')).toBeInTheDocument()
  })
})
