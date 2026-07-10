# Deployment Guide

> How to build, deploy, and distribute the IELTS Journey web app and browser extension.

---

## 1. Overview

The project produces two deployable artifacts:

| Artifact | Type | Distribution |
|----------|------|-------------|
| **Web App** | React SPA (PWA) | Static hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages) |
| **Browser Extension** | Chrome Extension (MV3) | Chrome Web Store or unpacked |

Both are built from the same monorepo source.

---

## 2. Prerequisites

```bash
# Required
- Node.js >= 18
- pnpm >= 8

# Verify
node --version   # >= 18
pnpm --version   # >= 8
```

---

## 3. Build Commands

```bash
# Install dependencies
pnpm install

# Full build (typecheck + build web + build extension)
pnpm build

# Build only web app
pnpm build:web

# Build only extension
pnpm build:extension

# Type-check only
pnpm typecheck

# Run tests
pnpm test

# Lint
pnpm lint

# Clean build artifacts
pnpm clean
```

---

## 4. Web App Deployment

### 4.1 Production Build

```bash
pnpm build
```

Output: `dist/` — static files ready for hosting.

Key outputs:
```
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
├── manifest.webmanifest      # PWA manifest
├── sw.js                     # Service worker (PWA)
└── icons/                    # PWA icons
```

### 4.2 Hosting Options

#### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

**Configuration:** No special config needed — Vercel detects Vite.

**Environment variables:** None required (client-side only).

#### Netlify

```bash
# Build
pnpm build

# Deploy dist/ folder via Netlify UI or CLI
netlify deploy --prod --dir=dist
```

**Netlify.toml:**
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Cloudflare Pages

```bash
# Build
pnpm build

# Deploy dist/ folder
npx wrangler pages deploy dist/
```

#### GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 4.3 PWA Considerations

- The web app is a **Progressive Web App** (PWA) via `vite-plugin-pwa`
- After deployment, users can install it as a standalone app
- Offline support works after the initial visit
- Service worker caches app shell for offline access
- Data (IndexedDB) is always available offline

---

## 5. Extension Deployment

### 5.1 Build for Distribution

```bash
pnpm build:extension
```

Output: `apps/extension/dist/`

### 5.2 Chrome Web Store

1. **Prepare assets:**
   - Icons: 16x16, 48x48, 128x128 PNG
   - Screenshots: 1280x800 or 640x400
   - Promotional tiles (optional)
   - Privacy policy document

2. **Create ZIP:**
   ```bash
   cd apps/extension
   pnpm build
   zip -r extension.zip dist/
   ```

3. **Submit to Chrome Web Store:**
   - Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay one-time registration fee ($5 USD)
   - Upload `extension.zip`
   - Fill in:
     - Name and description
     - Screenshots (at least 1)
     - Promotional images
     - Privacy policy URL
     - Permissions justification
   - Submit for review

### 5.3 Load Unpacked (Development)

1. Build: `pnpm build:extension`
2. Open `chrome://extensions/`
3. Enable **Developer mode** (toggle top right)
4. Click **Load unpacked**
5. Select `apps/extension/dist/`

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Example

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test

  deploy-web:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 7. Environment Configuration

The web app runs entirely client-side. No environment variables are required for deployment.

Optional environment variables (for CI/CD):

| Variable | Purpose |
|----------|---------|
| `PUBLIC_URL` | Base URL for the app (default: `/`) |

---

## 8. Build Verification

Before deployment, run the full verification suite:

```bash
# 1. Type check
pnpm typecheck

# 2. Lint
pnpm lint

# 3. Run tests
pnpm test

# 4. Build
pnpm build

# 5. Preview build
pnpm preview
```

### 8.1 Smoke Test Checklist

- [ ] Web app loads without errors
- [ ] All routes navigate correctly
- [ ] Vocabulary CRUD works
- [ ] Data persists across page reloads
- [ ] Dark mode toggle works
- [ ] PWA install prompt appears
- [ ] Extension loads without errors
- [ ] Extension popup displays
- [ ] Context menu appears on right-click
- [ ] Import/export functions
- [ ] AI settings save and load

---

## 9. Versioning

The project uses [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR:** Breaking changes (schema migration, API changes)
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

Version is tracked in `package.json` and content packs have their own versioning.

---

## 10. Monitoring & Maintenance

Since there is no backend, traditional server monitoring does not apply. Maintenance focuses on:

- **Browser compatibility:** Test on latest Chrome, Firefox, Edge
- **IndexedDB storage limits:** Warn users when storage approaches browser limits
- **Schema migrations:** Test migrations between versions
- **Dependency updates:** Regular `pnpm update` with typecheck + test validation
- **Accessibility:** Periodic a11y audits
