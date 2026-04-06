import { describe, expect, it } from 'vitest'

import { createGameState, fireShot, setAim, tickGame, toRunSummary } from './gameEngine'

describe('gameEngine', () => {
  it('creates a 60 second round with three live targets', () => {
    const state = createGameState()

    expect(state.remainingMs).toBe(60000)
    expect(state.targets).toHaveLength(3)
  })

  it('adds score when a shot is aligned with a target', () => {
    let state = createGameState()
    state = setAim(state, state.targets[0].x / state.width)
    state = fireShot(state)

    expect(state.score).toBeGreaterThan(0)
    expect(state.hits).toBe(1)
    expect(state.defeatedKinds).toHaveLength(1)
  })

  it('finishes the round after 60 seconds of ticks', () => {
    const state = tickGame(createGameState(), 60000)

    expect(state.phase).toBe('finished')
    expect(state.remainingMs).toBe(0)
  })

  it('summarizes the finished run', () => {
    const summary = toRunSummary({
      ...createGameState(),
      score: 1280,
      hits: 6,
      remainingMs: 0,
      elapsedMs: 60000,
      phase: 'finished',
      defeatedKinds: ['openai', 'gemini'],
    })

    expect(summary).toEqual({
      score: 1280,
      hits: 6,
      durationMs: 60000,
      defeatedKinds: ['openai', 'gemini'],
    })
  })
})
