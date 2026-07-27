import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      'zod/v4/core': resolve(__dirname, '../../node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/index.js'),
      '@ielts/config': resolve(__dirname, '../../packages/config/src'),
      '@ielts/theme': resolve(__dirname, '../../packages/theme/src'),
      '@ielts/ui': resolve(__dirname, '../../packages/ui/src'),
    },
  },
})
