# Performance

## PWA Caching

Workbox controls caching via `vite-plugin-pwa` configuration in `apps/web/vite.config.ts`:

```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,  // 4 MB per file
  navigateFallback: '/',
  navigateFallbackDenylist: [/^\/api\//],
}
```

- All build assets are precached on first visit (`autoUpdate` register type).
- No runtime caching configured yet (dynamic API responses are not cached by the service worker).

## Manual Chunk Splitting

Defined in `apps/web/vite.config.ts`:

| Chunk name | Contents |
|---|---|
| `vendor-react` | `react`, `react-dom`, `react-router-dom` |
| `vendor-charts` | `recharts` |
| `vendor-ui` | `lucide-react`, `react-hook-form`, `@hookform/resolvers` |
| `vendor-ai` | `@ielts/ai`, `@ielts/ai-tutor-engine` |

The `chunkSizeWarningLimit` is set to 1000 KB.

## IndexedDB

- Queries are optimized via Dexie indexes defined in repository classes.
- Key tables (`vocabulary`, `mistakes`, `sessions`) have indexed fields for common query patterns (`findByVideoId`, `queryByIndex`).
- Avoid loading entire tables into memory; use Dexie's cursor-based iteration for large datasets.

## Rendering

- Avoid large re-renders — use `useCallback` and `useMemo` for expensive computations.
- State management uses React Context (`ConfigProvider`) per feature; no global state library.
- List components should use keys from stable IDs, not array indices.
