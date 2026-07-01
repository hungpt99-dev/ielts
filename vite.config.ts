import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

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
    runtimeCaching: [],
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA(pwaConfig)],
})
