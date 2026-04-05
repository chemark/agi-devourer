export type GamePhase = 'start' | 'playing' | 'gameover';

export type ContactChannel = 'wechat' | 'phone' | 'email';

export type LeaderboardSource = 'local' | 'supabase';

export interface FlyWord {
  text: string;
  name: string;
  value: number;
  hue: number;
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  channel: ContactChannel;
  contact: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  playerId?: string;
  nickname: string;
  score: number;
  story: string;
  summary: string;
  createdAt: string;
  models: string[];
  source: LeaderboardSource;
}

export interface ComboResult {
  description: string;
  score: number;
  ingredients: string[];
  createdAt: number;
}

export interface GameSummary {
  score: number;
  didWin: boolean;
  story: string;
  models: string[];
  comboCount: number;
  maxDifficulty: number;
  durationSeconds: number;
}

export interface RoundState {
  phase: GamePhase;
  score: number;
  timeLeft: number;
  duration: number;
  elapsedMs: number;
}
