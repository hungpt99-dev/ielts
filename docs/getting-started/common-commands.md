# Common Commands

## Root Workspace

| Command | Description |
|---|---|
| `pnpm dev:web` | Start web dev server at `127.0.0.1:5173` |
| `pnpm dev:extension` | Start extension dev server at `127.0.0.1:5174` |
| `pnpm build` | Build all packages and apps |
| `pnpm build:web` | Build web app only |
| `pnpm build:extension` | Build extension only |
| `pnpm typecheck` | Type-check all packages and apps |
| `pnpm typecheck:web` | Type-check web app only |
| `pnpm typecheck:extension` | Type-check extension only |
| `pnpm lint` | Lint all packages and apps |
| `pnpm lint:web` | Lint web app only |
| `pnpm lint:extension` | Lint extension only |
| `pnpm ai` | Run AI-focused tests across all packages |
| `pnpm deploy:web` | Build and deploy to Cloudflare Pages (branch) |
| `pnpm deploy:web:prod` | Build and deploy to Cloudflare Pages (production) |
| `pnpm clean` | Clean all build artifacts |

## Web App (`apps/web`)

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm dev:debug` | Start Vite dev server with debug logging |
| `pnpm build` | Type-check then build with Vite |
| `pnpm preview` | Preview production build at `127.0.0.1:4173` |
| `pnpm test` | Run Vitest tests |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm cap:sync` | Sync Capacitor with web build |
| `pnpm cap:open:ios` | Open iOS Xcode project |
| `pnpm cap:open:android` | Open Android Studio project |
| `pnpm cap:dev:ios` | Build and run iOS with live reload |
| `pnpm cap:dev:android` | Build and run Android with live reload |
| `pnpm cap:build:ios` | Full iOS production build |
| `pnpm cap:build:android` | Full Android production build |

## Chrome Extension (`apps/extension`)

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server for HTML pages |
| `pnpm build` | Build extension (Vite + esbuild) to `dist/` |
| `pnpm build:production` | Production build with minification |
| `pnpm package` | Build and create a `.zip` package |
| `pnpm preview` | Preview built HTML pages |
| `pnpm test` | Run Vitest tests |
| `pnpm clean` | Remove `dist/` |
| `pnpm clean:all` | Remove `dist/` and `.zip` files |

## Packages

| Command | Description |
|---|---|
| `pnpm typecheck` | Run TypeScript type-checking |
| `pnpm test` | Run Vitest tests |
| `pnpm ai` | Run tests with `VITEST_MAX_WORKERS=2` |
| `pnpm lint` | Run linting (where configured) |
