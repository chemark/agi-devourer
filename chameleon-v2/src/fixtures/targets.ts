import type { TargetDefinition } from '../app/types'

export const TARGETS: TargetDefinition[] = [
  {
    kind: 'openai',
    label: 'OpenAI',
    color: '#0f766e',
    baseScore: 280,
    radius: 24,
  },
  {
    kind: 'claude',
    label: 'Claude',
    color: '#9a3412',
    baseScore: 240,
    radius: 22,
  },
  {
    kind: 'gemini',
    label: 'Gemini',
    color: '#1d4ed8',
    baseScore: 260,
    radius: 23,
  },
  {
    kind: 'qwen',
    label: 'Qwen',
    color: '#7c3aed',
    baseScore: 210,
    radius: 21,
  },
  {
    kind: 'kimi',
    label: 'Kimi',
    color: '#c2410c',
    baseScore: 200,
    radius: 20,
  },
]
