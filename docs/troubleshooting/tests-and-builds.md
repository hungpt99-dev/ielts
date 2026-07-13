# Tests and Builds Troubleshooting

## Tests

### fake-indexeddb Not Clearing Between Tests

- **Symptom**: Tests fail due to leftover data from previous tests.
- **Fix**: Call `resetMocks()` or re-create the database in `beforeEach`:

```typescript
import { resetMocks } from 'fake-indexeddb'

beforeEach(() => {
  resetMocks() // or new IDBFactory()
})
```

### jsdom Limitations

- **Symptom**: Tests using `recharts` throw "canvas is not available" or similar.
- **Cause**: `jsdom` does not implement the Canvas API.
- **Fix**: Mock chart components: `vi.mock('recharts', () => ({ /* mock components */ }))`.
- **Alternative**: Test chart-adjacent logic (data transformation, user interactions) separately from rendering.

### ESLint Config Errors

- **Symptom**: `ESLint: Error processing file` with `FlatConfigArray` errors.
- **Cause**: The project uses ESLint flat config (`eslint.config.js`). Older ESLint versions or editors may not support flat config.
- **Fix**: Ensure ESLint extension is v8.40+ or v9+. Run `pnpm lint` from CLI to verify config validity.
- **Config location**: `apps/web/eslint.config.js` — this is the only ESLint config file. Packages without their own config inherit nothing.

## Builds

### Vite Build Failures

- **Symptom**: `Build failed with errors`.
- **Check path aliases**: `vite.config.ts` defines `resolve.alias` for `@ielts/*` packages. If a package is moved or renamed, update aliases.
- **Check dependencies**: `pnpm install` must be run after any `package.json` changes. The `pnpm-lock.yaml` must be committed.
- **Check TypeScript**: Run `pnpm typecheck` first. Many build errors are type errors in disguise.
- **Check `optimizeDeps`**: `@hookform/resolvers/zod` is pre-bundled. If Zod v4 resolver changes, update the entry.

### Extension Build

- **Symptom**: Extension doesn't load or shows `manifest.json` errors.
- **Fix**: Run `cd apps/extension && pnpm build` and check `dist/` output for missing files.
- **Check**: `manifest.json` is generated from `vite.config.ts` (or static). Ensure required fields (`version`, `name`, `permissions`) are present.
- **Check**: Content script paths in `manifest.json` match the built output in `dist/`.
- **Check**: `service_worker` path is relative to the extension root.

### General Build Commands

| Command | Purpose |
|---|---|
| `pnpm build` | Build all packages and apps |
| `pnpm build:web` | Build web app only |
| `pnpm build:extension` | Build extension only |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm clean` | Clean all build artifacts |
