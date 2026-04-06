export {}

declare module 'vite' {
  interface UserConfig {
    test?: {
      environment?: 'jsdom' | 'node' | 'happy-dom' | 'edge-runtime'
      globals?: boolean
      setupFiles?: string[]
    }
  }
}
