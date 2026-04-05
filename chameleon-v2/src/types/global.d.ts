import type { FlyWord, RoundState } from './game';

declare global {
  interface Window {
    __agiRoundState?: RoundState;
    __agiGameControls?: {
      fire: () => void;
      setManualAim: (x: number, y: number) => void;
      resetAim: () => void;
      getSnapshot: () => string;
      advanceTime: (ms: number) => string;
    };
    onScoreUpdated?: (score: number) => void;
    onFlyDigested?: (word: FlyWord) => void;
    onComboTriggered?: () => void;
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => string;
    __agiDebugV2?: {
      startRound: () => void;
      forceLose: () => Promise<void>;
      forceWin: () => Promise<void>;
      saveProfile: (nickname?: string) => void;
    };
  }
}

export {};
