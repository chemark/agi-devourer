export type AppUser = {
  id: string
  nickname: string
  provider: 'wechat-mock'
}

export type SessionState =
  | { status: 'guest' }
  | { status: 'member'; user: AppUser }

export type TargetKind = 'openai' | 'claude' | 'gemini' | 'qwen' | 'kimi'

export type TargetDefinition = {
  kind: TargetKind
  label: string
  color: string
  baseScore: number
  radius: number
}

export type LeaderboardEntry = {
  id: string
  nickname: string
  score: number
  summary: string
  createdAt: string
}

export type RunSummary = {
  score: number
  hits: number
  durationMs: number
  defeatedKinds: TargetKind[]
}
