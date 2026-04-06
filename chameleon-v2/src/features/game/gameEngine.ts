import type { RunSummary, TargetKind } from '../../app/types'
import { TARGETS } from '../../fixtures/targets'

export type LiveTarget = {
  id: string
  kind: TargetKind
  x: number
  y: number
  vx: number
  radius: number
  value: number
}

export type GameState = {
  width: number
  height: number
  elapsedMs: number
  remainingMs: number
  score: number
  hits: number
  aimX: number
  phase: 'running' | 'finished'
  defeatedKinds: TargetKind[]
  targets: LiveTarget[]
}

const ROUND_MS = 60_000

function makeTarget(index: number): LiveTarget {
  const definition = TARGETS[index % TARGETS.length]

  return {
    id: `target-${index}`,
    kind: definition.kind,
    x: 120 + index * 90,
    y: 120 + (index % 2) * 70,
    vx: 0.06 + index * 0.01,
    radius: definition.radius,
    value: definition.baseScore,
  }
}

export function createGameState(): GameState {
  return {
    width: 844,
    height: 390,
    elapsedMs: 0,
    remainingMs: ROUND_MS,
    score: 0,
    hits: 0,
    aimX: 0.5,
    phase: 'running',
    defeatedKinds: [],
    targets: [makeTarget(0), makeTarget(1), makeTarget(2)],
  }
}

export function setAim(state: GameState, nextAimX: number): GameState {
  return {
    ...state,
    aimX: Math.min(1, Math.max(0, nextAimX)),
  }
}

export function tickGame(state: GameState, deltaMs: number): GameState {
  if (state.phase === 'finished') {
    return state
  }

  const elapsedMs = Math.min(ROUND_MS, state.elapsedMs + Math.max(0, deltaMs))
  const remainingMs = Math.max(0, ROUND_MS - elapsedMs)
  const difficulty = 1 + (elapsedMs / ROUND_MS) * 1.4

  const targets = state.targets.map((target) => {
    let nextX = target.x + target.vx * deltaMs * difficulty
    let nextVx = target.vx

    if (nextX >= state.width - target.radius || nextX <= target.radius) {
      nextVx = -nextVx
      nextX = Math.min(state.width - target.radius, Math.max(target.radius, nextX))
    }

    return {
      ...target,
      x: nextX,
      vx: nextVx,
    }
  })

  return {
    ...state,
    elapsedMs,
    remainingMs,
    phase: remainingMs === 0 ? 'finished' : 'running',
    targets,
  }
}

export function fireShot(state: GameState): GameState {
  if (state.phase === 'finished') {
    return state
  }

  const aimPixel = state.aimX * state.width
  const hitIndex = state.targets.findIndex(
    (target) => Math.abs(target.x - aimPixel) <= target.radius + 24,
  )

  if (hitIndex === -1) {
    return state
  }

  const hit = state.targets[hitIndex]
  const nextTargets = state.targets.filter((target) => target.id !== hit.id)
  nextTargets.push(makeTarget(state.hits + state.targets.length))

  return {
    ...state,
    score: state.score + hit.value,
    hits: state.hits + 1,
    defeatedKinds: [...state.defeatedKinds, hit.kind],
    targets: nextTargets,
  }
}

export function toRunSummary(state: GameState): RunSummary {
  return {
    score: state.score,
    hits: state.hits,
    durationMs: state.elapsedMs,
    defeatedKinds: state.defeatedKinds,
  }
}
