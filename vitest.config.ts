import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    unstubEnvs: true,
    unstubGlobals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.output/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
    projects: [
      'apps/web/vitest.config.ts',
      'apps/extension/vitest.config.ts',
      'packages/ai-tutor-engine/vitest.config.ts',
      'packages/learning-engine/vitest.config.ts',
      'packages/storage/vitest.config.ts',
      'packages/ai/vitest.config.ts',
      'packages/settings/vitest.config.ts',
    ],
  },
})
