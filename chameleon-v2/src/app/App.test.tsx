import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App shell', () => {
  it('renders the V2 headline and intro copy', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Chameleon V2' })).toBeInTheDocument()
    expect(screen.getByText('Fresh shell, ready for the rebuild.')).toBeInTheDocument()
  })
})
