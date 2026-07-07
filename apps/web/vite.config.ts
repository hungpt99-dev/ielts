import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const pwaConfig = {
  registerType: 'autoUpdate' as const,
  includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
  manifest: {
    name: 'IELTS Learning Journey',
    short_name: 'IELTS',
    description: 'Personal IELTS study system — offline-first, no backend needed.',
    theme_color: '#1e293b',
    background_color: '#0f172a',
    display: 'standalone' as const,
    orientation: 'portrait-primary' as const,
    start_url: '/',
    icons: [
      {
        src: 'icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    runtimeCaching: [],
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA(pwaConfig)],
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  optimizeDeps: {
    include: ['@hookform/resolvers/zod'],
  },
  resolve: {
    alias: {
      'zod/v4/core': resolve(__dirname, '../../node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/index.js'),
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
})
