# Local Development

## Setup

```bash
git clone <repo-url>
pnpm install
```

## Web App

```bash
pnpm dev:web
```

Starts Vite dev server at `http://127.0.0.1:5173`. Hot module replacement is enabled. The app loads IndexedDB and bootstraps both the AI Tutor and Learning engines on startup.

## Chrome Extension

```bash
pnpm dev:extension
```

Starts Vite dev server at `http://127.0.0.1:5174` for HTML pages (popup, options, YouTube learning). Content scripts and background service worker are built separately via esbuild.

To load in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select `apps/extension/dist/`

For production build:

```bash
pnpm build:extension
```

Output is in `apps/extension/dist/` with minified scripts.

## Native Mobile (Capacitor)

```bash
# Sync Capacitor config with web build
pnpm cap:sync

# Open native project
pnpm cap:open:ios   # Requires Xcode
pnpm cap:open:android  # Requires Android Studio
```

For live-reload on device:

```bash
pnpm cap:dev:ios
pnpm cap:dev:android
```
