import { useEffect, useRef, useState } from 'react'

import type { RunSummary } from '../../app/types'
import {
  createGameState,
  fireShot,
  setAim,
  tickGame,
  toRunSummary,
  type GameState,
} from './gameEngine'

type Props = {
  compact?: boolean
  onComplete: (summary: RunSummary) => void
}

function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, state.width, state.height)
  ctx.fillStyle = '#fff7ed'
  ctx.fillRect(0, 0, state.width, state.height)

  ctx.save()
  ctx.fillStyle = '#1f1a17'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`分数 ${state.score}`, 24, 32)
  ctx.fillText(`剩余 ${Math.ceil(state.remainingMs / 1000)} 秒`, 24, 60)

  ctx.strokeStyle = '#d85b30'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(state.aimX * state.width, state.height - 40)
  ctx.lineTo(state.aimX * state.width, 80)
  ctx.stroke()

  state.targets.forEach((target) => {
    ctx.fillStyle = '#d85b30'
    ctx.beginPath()
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(target.kind.toUpperCase(), target.x, target.y + 4)
  })

  ctx.restore()
}

export default function GameCanvas({ compact = false, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const stateRef = useRef<GameState>(createGameState())
  const [state, setState] = useState(() => createGameState())

  useEffect(() => {
    stateRef.current = state

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    drawGame(ctx, state)
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    completedRef.current = false
    lastTimeRef.current = null

    const loop = (time: number) => {
      if (completedRef.current) return

      if (lastTimeRef.current == null) {
        lastTimeRef.current = time
      }

      const delta = time - lastTimeRef.current
      lastTimeRef.current = time

      const nextState = tickGame(stateRef.current, delta)
      stateRef.current = nextState
      setState(nextState)

      drawGame(ctx, nextState)

      if (nextState.phase === 'finished') {
        completedRef.current = true
        onComplete(toRunSummary(nextState))
        return
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      completedRef.current = true

      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [onComplete])

  const seconds = Math.ceil(state.remainingMs / 1000)

  return (
    <section
      className={`game-shell${compact ? ' is-compact' : ''}`}
      data-layout={compact ? 'compact' : 'regular'}
    >
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={state.width}
        height={state.height}
      />
      <div className="game-controls">
        <label className="slider-group">
          <span>瞄准滑杆</span>
          <input
            aria-label="瞄准滑杆"
            type="range"
            min="0"
            max="100"
            value={Math.round(state.aimX * 100)}
            onChange={(event) =>
              setState((current) =>
                setAim(current, Number(event.target.value) / 100),
              )
            }
          />
        </label>
        <button
          className="primary-button"
          type="button"
          onClick={() => setState((current) => fireShot(current))}
        >
          发射舌头
        </button>
      </div>
      <p className="game-hint">剩余 {seconds} 秒，左手瞄准，右手发射。</p>
    </section>
  )
}
