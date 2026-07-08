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
    id: '/',
    name: 'IELTS Journey',
    short_name: 'IELTS Journey',
    description: 'Learn IELTS with AI Tutor',
    theme_color: '#2563eb',
    background_color: '#f8fafc',
    display: 'standalone' as const,
    orientation: 'portrait-primary' as const,
    start_url: '/',
    scope: '/',
    categories: ['education', 'productivity'],
    prefer_related_applications: false,
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
    navigateFallback: '/',
    navigateFallbackDenylist: [/^\/api\//],
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
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['lucide-react', 'react-hook-form', '@hookform/resolvers'],
          'vendor-ai': ['@ielts/ai', '@ielts/ai-tutor'],
        },
      },
    },
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
