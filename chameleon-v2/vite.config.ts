import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'

const baseConfig = defineConfig({
  plugins: [react()],
})

export default mergeConfig(baseConfig, {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
} as any)
