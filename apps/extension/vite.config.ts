import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@ielts/web-app': resolve(__dirname, '../web/src'),
      'zod/v4/core': resolve(__dirname, '../../node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/index.js'),
      'recharts': resolve(__dirname, 'node_modules/recharts/es6/index.js'),
      'react-hook-form': resolve(__dirname, 'node_modules/react-hook-form/dist/index.esm.mjs'),
      'dexie': resolve(__dirname, 'node_modules/dexie/dist/dexie.mjs'),
      '@hookform/resolvers/zod': resolve(__dirname, 'node_modules/@hookform/resolvers/zod/dist/zod.mjs'),
      '@hookform/resolvers': resolve(__dirname, 'node_modules/@hookform/resolvers/dist/resolvers.mjs'),
      'zod': resolve(__dirname, 'node_modules/zod/index.js'),
      'zod/v4': resolve(__dirname, '../../node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/index.js'),
      '@ielts/ai': resolve(__dirname, '../../packages/ai/src'),
      '@ielts/ai-tutor-engine': resolve(__dirname, '../../packages/ai-tutor-engine/src'),
      '@ielts/config': resolve(__dirname, '../../packages/config/src'),
      '@ielts/settings': resolve(__dirname, '../../packages/settings/src'),
      '@ielts/storage': resolve(__dirname, '../../packages/storage/src'),
      '@ielts/shared': resolve(__dirname, '../../packages/shared/src'),
      '@ielts/learning-engine': resolve(__dirname, '../../packages/learning-engine/src'),
      '@ielts/theme': resolve(__dirname, '../../packages/theme/src'),
      '@ielts/ui': resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        youtubeLearning: resolve(__dirname, 'youtube-learning.html'),
        app: resolve(__dirname, 'app/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/chunk-[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
