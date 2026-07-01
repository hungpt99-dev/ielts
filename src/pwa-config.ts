// ============================================================
// PWA Configuration — vite-plugin-pwa setup plan
// ============================================================
// This file documents the PWA settings. The actual injection
// happens via vite-plugin-pwa in vite.config.ts.
//
// Key principles:
//   - App shell (HTML, JS, CSS) is precached
//   - All user data lives in IndexedDB (never cached externally)
//   - Offline-first: after first load the app works without network
//   - No network requests for content; API key usage is optional

export const pwaConfig = {
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
    // No runtime caching — all dynamic data is from IndexedDB
    // No CDN resources to cache — all assets are bundled
  },
}

// ── Implementation steps ─────────────────────────────────────
//
// 1. Install dependency:
//    npm install -D vite-plugin-pwa
//
// 2. In vite.config.ts:
//    import { VitePWA } from 'vite-plugin-pwa'
//    plugins: [..., VitePWA(pwaConfig)]
//
// 3. Create public/icons/ with icon-192x192.png and icon-512x512.png
//    (generate from a 512x512 source using a tool like `npx pwa-asset-generator`)
//
// 4. Add manifest link in index.html:
//    <link rel="manifest" href="/manifest.webmanifest">
//
// 5. Register service worker in main.tsx:
//    import { registerSW } from 'virtual:pwa-register'
//    registerSW({ onNeedRefresh() { ... }, onOfflineReady() { ... } })
//
// 6. After build, verify:
//    - dist/ contains sw.js, workbox-*.js, manifest.webmanifest
//    - Go to Lighthouse → PWA audit → all checks pass
//    - Load page, disconnect network → app still works
