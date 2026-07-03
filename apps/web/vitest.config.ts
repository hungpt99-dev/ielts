import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@ielts/ai': resolve(__dirname, '../../packages/ai/src'),
      '@ielts/ai-tutor': resolve(__dirname, '../../packages/ai-tutor/src'),
      '@ielts/content': resolve(__dirname, '../../packages/content/src'),
      '@ielts/exercises': resolve(__dirname, '../../packages/exercises/src'),
      '@ielts/learning-engine': resolve(__dirname, '../../packages/learning-engine/src'),
      '@ielts/storage': resolve(__dirname, '../../packages/storage/src'),
      '@ielts/theme': resolve(__dirname, '../../packages/theme/src'),
      '@ielts/ui': resolve(__dirname, '../../packages/ui/src'),
      '@ielts/utils': resolve(__dirname, '../../packages/utils/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
      '../../packages/storage/src/**/*.{test,spec}.{ts,tsx}',
      '../../packages/ai/src/**/*.{test,spec}.{ts,tsx}',
      '../../packages/content/src/**/*.{test,spec}.{ts,tsx}',
      '../../packages/exercises/src/**/*.{test,spec}.{ts,tsx}',
      '../../packages/learning-engine/src/**/*.{test,spec}.{ts,tsx}',
      '../../packages/ai-tutor/src/**/*.{test,spec}.{ts,tsx}',
      '../../apps/extension/src/**/*.{test,spec}.{ts,tsx}',
    ],

    watch: false,

    pool: 'forks',
    minWorkers: 1,
    maxWorkers: 1,

    isolate: false,
    fileParallelism: false,

    passWithNoTests: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
})
