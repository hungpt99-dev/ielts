<p align="center">
  <br/>
  <h1 align="center">IELTS Journey</h1>
  <p align="center">
    A fully client-side, offline-first personal IELTS study system.
    <br/>
    Track vocabulary, reading, listening, writing, speaking, grammar, and mock tests —
    all in your browser with no backend required.
  </p>
  <p align="center">
    <a href="#features"><strong>Explore Features</strong></a> ·
    <a href="#architecture"><strong>Architecture</strong></a> ·
    <a href="#getting-started"><strong>Getting Started</strong></a> ·
    <a href="#ai-integration"><strong>AI Integration</strong></a>
  </p>
</p>

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript 5.8"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4"/>
  <img src="https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm" alt="pnpm workspaces"/>
  <img src="https://img.shields.io/badge/PWA-✓-5A0FC8" alt="PWA"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome"/>
</p>

---

## Features

### 📚 Vocabulary Management
SM-2 spaced repetition system with tagging, filtering, and review queues. Track vocabulary from multiple sources — manual entry, browser extension, or AI-assisted enrichment.

### 📖 Skill Tracking
Log practice sessions across all four IELTS skills (Reading, Listening, Writing, Speaking) plus Grammar. Each session is timestamped and tagged by skill for progress analytics.

### 📅 Daily Study Plan
Auto-generated daily plans based on weaknesses, due reviews, and user preferences. Plans adapt to available study time and exam proximity.

### 📓 Mistake Notebook
Record mistakes with corrections and explanations. Mistakes are tracked by skill and surfaced for review based on frequency and recency.

### 🎯 Mock Test Tracker
Log mock test scores (overall band + skill bands) and track progress over time with trend visualizations.

### 📊 Progress Analytics
Charts and stats for total study days, hours per skill, skill balance distribution, band trends, study streak, and weekly reflections.

### 🧠 Learning Journey Engine
Core business logic engine that drives:
- **Weakness detection** — Identifies lowest-accuracy skills
- **Review scheduling** — SM-2 for vocabulary, frequency-based for mistakes
- **Next-best-action** — Priority-ranked study recommendations
- **Daily plan generation** — Personalized daily study task lists

### 🤖 AI Tutor Chat
Messenger-style AI assistant with:
- Chat interface with conversation memory
- Proactive local messages (due reviews, weak skills, exam countdown, study streak)
- Context-aware responses using learning engine data
- Configurable AI provider (OpenAI-compatible)

### ✍️ Exercise Generator
AI-powered and rule-based exercise generation for grammar and vocabulary practice. Exercises are scored and mistakes are automatically saved to the Mistake Notebook.

### 📖 Content Library
Built-in IELTS reading passages, listening transcripts, and vocabulary lists. Content is versioned and seeded on first run with incremental updates.

### 🌐 Browser Extension
Chrome extension (Manifest V3) for collecting learning material from any webpage:
- Save vocabulary, phrases, sentences via right-click or floating toolbar
- YouTube transcript helper for listening practice
- AI explanations for selected text
- Mini AI tutor popup
- Bridge protocol for syncing with the web app

### 🔄 Import / Export
Full JSON backup and restore with merge and replace modes. Schema validation on import prevents data corruption.

### 📱 PWA Support
Installable as a standalone app. Works offline with IndexedDB persistence.

### 🌙 Dark Mode
Light, dark, and system theme with CSS custom property design tokens.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 19](https://react.dev/) |
| Language | [TypeScript 5.8](https://www.typescriptlang.org/) (strict mode) |
| Build | [Vite 6](https://vitejs.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + CSS custom properties (design tokens) |
| Routing | [React Router v7](https://reactrouter.com/) |
| Database | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via [`idb`](https://github.com/jakearchibald/idb)) — Repository pattern |
| Settings | `localStorage` |
| Charts | [Recharts](https://recharts.org/) |
| PWA | [`vite-plugin-pwa`](https://github.com/vite-pwa/vite-plugin-pwa) |
| Testing | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| Validation | [Zod 4](https://zod.dev/) |
| AI (optional) | OpenAI-compatible REST API via adapter pattern |
| Package Manager | [pnpm](https://pnpm.io/) workspaces |

---

## Architecture

The project follows **Clean Architecture** with four layers (Presentation, Application, Domain, Infrastructure), organized as a pnpm monorepo:

```
ielts-journey/
├── apps/
│   ├── web/                    # React SPA (PWA) — main application
│   └── extension/              # Chrome extension (Manifest V3)
│
├── packages/
│   ├── ai/                     # AI provider adapters, prompt builders, response validation (Zod)
│   ├── ai-tutor/               # AI Tutor domain models, conversation logic, memory
│   ├── content/                # Built-in IELTS content library with versioned seeding
│   ├── exercises/              # Exercise models, scoring/generation strategies, review scheduling
│   ├── learning-engine/        # Business rules: progress, weakness detection, daily plans, analytics
│   ├── storage/                # IndexedDB repositories, migrations, data seeding
│   ├── theme/                  # Design tokens, CSS variables, ThemeProvider
│   ├── ui/                     # Reusable shared UI components (buttons, cards, inputs, modals)
│   └── utils/                  # Pure utility functions, error types, ID generation
│
├── docs/                       # Architecture decisions, design docs, contribution guides
│   ├── adr/                    # Architecture Decision Records
│   ├── architecture.md
│   ├── ai-architecture.md
│   ├── learning-journey-engine.md
│   ├── local-first-design.md
│   └── ... (20+ documents)
│
├── scripts/                    # Build and utility scripts
├── public/                     # Static assets
└── ...config files
```

### Web Application Structure (`apps/web/src/`)

```
src/
├── app/                  # App entry point, providers, router setup
├── features/             # Feature modules (dashboard, vocabulary, analytics, grammar, etc.)
│   ├── ai-tutor/         # AI Tutor chat widget (standalone feature module)
│   ├── vocabulary/       # Vocabulary management feature
│   ├── analytics/        # Charts and statistics
│   ├── daily-plan/       # Study plan feature
│   ├── mock-test/        # Mock test tracking
│   └── ...               # Other features
├── pages/                # Route-level page components
├── hooks/                # Shared custom React hooks
├── services/             # Application services (AI, storage, chat, proactive messages)
├── components/           # Shared UI components
├── context/              # React contexts (settings, theme)
├── models/               # Domain model type definitions
├── types/                # Shared TypeScript types
├── data/                 # Data seeding definitions
├── utils/                # App-level utilities
└── styles/               # Global styles
```

### Data Flow

```
Component → Custom Hook → Feature Service → Repository (IndexedDB/localStorage)
                                                      ↕
                                              Learning Engine
                                              (Pure domain logic)
```

The monorepo allows the **extension** (`apps/extension/`) to import shared packages (`ai/`, `storage/`, `theme/`, `utils/`) without code duplication, while the web app uses a traditional feature-folder structure.

---

## AI Integration

### User-Facing AI Features

AI features are **optional** and require a user-provided API key:

1. Go to **Settings → AI Configuration**
2. Enter your OpenAI API key (or custom provider config)
3. Choose model, temperature, max tokens
4. Click **Test Connection** to verify

**Supported providers:**
- OpenAI (default)
- Any OpenAI-compatible API (custom base URL)

**AI-powered features:**
- **AI Tutor Chat** — Conversational assistant with study context
- **Exercise Generation** — AI-generated grammar and vocabulary exercises
- **Vocabulary Enrichment** — AI-generated examples, synonyms, and usage notes
- **Text Explanations** — AI-powered definitions and explanations for selected text
- **Proactive Messages** — AI-driven study reminders and suggestions (optional)

### AI Architecture (for Developers)

The AI system uses the **Adapter Pattern** for provider-agnostic access:

```
Component → Feature Service → AI Package → Adapter → OpenAI-compatible API
```

Key design principles:
- **No hard-coded API keys** — User-provided, stored in `localStorage`
- **No direct AI calls from UI** — Components go through service layer
- **Provider-agnostic** — Implement `IAiAdapter` interface to add providers
- **Prompt separation** — Prompts are versioned and modular in `packages/ai/src/prompts/`
- **Response validation** — All AI responses validated with Zod schemas
- **Privacy-safe** — Only send data to AI on explicit user action

See [docs/ai-architecture.md](docs/ai-architecture.md) for complete documentation.

---

## AI Coding Agent Integration

This codebase is designed to be AI coding agent-friendly. The following conventions help AI assistants understand and modify the code reliably.

### Codebase Conventions for AI Agents

| Convention | Description |
|-----------|-------------|
| **Clean Architecture** | Presentation / Application / Domain / Infrastructure layers are strictly separated |
| **Monorepo** | `apps/` for runnable applications, `packages/` for shared libraries |
| **Strict TypeScript** | `strict: true` in `tsconfig.json` — leverage types for safe refactoring |
| **Zod Validation** | All data at system boundaries is validated with Zod schemas |
| **Repository Pattern** | Data access goes through repository interfaces in `packages/storage/` |
| **Feature Modules** | Each feature in `src/features/` owns its components, hooks, and services |
| **Pure Domain Logic** | Packages like `learning-engine` have zero framework dependencies |
| **Design Tokens** | All colors, spacing, typography use CSS custom properties from `packages/theme/` |

### How AI Agents Should Approach This Codebase

1. **Explore the architecture** — Start with this README and `docs/architecture.md` to understand the layer separation
2. **Follow the data flow** — UI → Hook → Service → Repository. Never call IndexedDB directly from components
3. **Use existing patterns** — New features should mirror existing feature modules in `src/features/`
4. **Add to the right package** — Shared logic goes in `packages/`, app-specific logic stays in `apps/web/src/`
5. **Validate with Zod** — Any new data boundary should have a Zod schema
6. **Test the domain logic** — Pure business logic belongs in `packages/` with unit tests
7. **Respect the codegraph** — Use `codegraph explore` before editing to understand blast radius

### Available AI Agent Tools

The repository includes a **CodeGraph** index (`.codegraph/`) that provides:
- Symbol search and navigation
- Caller/callee analysis
- Dependency graph traversal
- Blast radius calculation for changes

Run `codegraph explore "<question>"` for AI-assisted code exploration.

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8

### Installation

```bash
git clone <repo-url>
cd ielts-journey
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Open in browser
open http://localhost:5173
```

### Production Build

```bash
pnpm build           # Type-check + build all packages and apps
pnpm preview         # Preview production build locally
```

---

## New Member Onboarding

Welcome! This section helps you get oriented and start contributing quickly.

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8
- **Git** configured with SSH or HTTPS
- A code editor (VS Code recommended)

### Setup

```bash
git clone <repo-url>
cd ielts-journey
pnpm install
pnpm dev          # Start development server
```

Open [http://localhost:5173](http://localhost:5173) to explore the app.

### First Steps

1. **Read the docs** — Start with [Product Overview](docs/product-overview.md) and [Architecture](docs/architecture.md) to understand the system
2. **Run quality checks** — Verify your environment:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```
3. **Explore the codebase** — Use `codegraph explore "<question>"` to navigate symbols and understand dependencies
4. **Find a starting issue** — Look for `good first issue` or `help wanted` labels on GitHub
5. **Review the [Contribution Guide](docs/contribution-guide.md)** — Read conventions, PR process, and coding standards

### Communication

- **GitHub Issues** — Report bugs and request features
- **GitHub Discussions** — Ask questions and suggest ideas

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web development server |
| `pnpm dev:extension` | Build extension with watch mode |
| `pnpm build` | Type-check and build all packages |
| `pnpm build:web` | Build web app only |
| `pnpm build:extension` | Build extension only |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Run unit tests with Vitest |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:ai` | Run AI-related tests (2 workers) |
| `pnpm lint` | Lint all source code |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm clean` | Clean all build outputs |

---

## Browser Extension

The Chrome extension (Manifest V3) allows collecting learning material from any webpage:

- Save vocabulary, phrases, and sentences via right-click context menu or floating toolbar
- YouTube transcript helper for listening practice
- AI explanations for selected text (with configured API key)
- Mini AI tutor popup for quick lookups
- Bridge protocol for syncing data with the web app

### Load Extension Locally

```bash
cd apps/extension
pnpm build
```

Then load `apps/extension/dist/` at `chrome://extensions/` with **Developer mode** enabled.

See [docs/extension-architecture.md](docs/extension-architecture.md) for details.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture.md) | Clean architecture, layers, folder structure |
| [Product Overview](docs/product-overview.md) | Features, tech stack, project structure |
| [Local-First Design](docs/local-first-design.md) | Offline strategy, storage architecture |
| [AI Architecture](docs/ai-architecture.md) | Adapter pattern, prompts, validation |
| [Learning Journey Engine](docs/learning-journey-engine.md) | Business rules, engines, calculations |
| [Storage Design](docs/storage-design.md) | IndexedDB repositories, migrations |
| [Database Schema](docs/database-schema.md) | Complete schema documentation |
| [Import/Export](docs/import-export.md) | Backup, restore, merge/replace modes |
| [Exercise System](docs/exercise-system.md) | Strategy pattern, scoring, generation |
| [Content Library](docs/content-library.md) | Built-in content, versioning, seeding |
| [Extension Architecture](docs/extension-architecture.md) | MV3, bridge protocol, data sync |
| [Theme System](docs/theme-system.md) | Design tokens, light/dark/system mode |
| [Security & Privacy](docs/security-privacy.md) | Data protection, AI privacy, permissions |
| [Testing Strategy](docs/testing-strategy.md) | Test types, patterns, coverage targets |
| [Deployment Guide](docs/deployment.md) | Build, deploy, CI/CD, PWA setup |
| [Contribution Guide](docs/contribution-guide.md) | How to contribute, conventions, PR checklist |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |
| [ADR 0001](docs/adr/0001-local-first-no-backend.md) | Local-first, no backend decision |
| [ADR 0002](docs/adr/0002-indexeddb-storage.md) | IndexedDB storage decision |
| [ADR 0003](docs/adr/0003-openai-compatible-ai-provider.md) | OpenAI-compatible AI provider |
| [ADR 0004](docs/adr/0004-browser-extension-manifest-v3.md) | Manifest V3 extension decision |
| [ADR 0005](docs/adr/0005-design-token-theme-system.md) | Design token theme system |

---

## Testing & Quality

Run these checks regularly — all must pass before merging:

```bash
pnpm test          # Run all tests
pnpm test:unit     # Run unit tests with Vitest
pnpm test:watch    # Watch mode
pnpm lint          # ESLint
pnpm typecheck     # TypeScript type checking (tsc -b --noEmit)
```

**Testing**: Vitest with `fake-indexeddb` (repository tests), React Testing Library (component tests), `jsdom` (browser simulation), and per-package configs in `packages/*/vitest.config.ts`.

**Linting**: ESLint configured for consistent code style.

**Type Checking**: TypeScript strict mode (`tsc -b --noEmit`).

---

## Deployment

The web app builds to static files deployable on any static host:

| Host | Notes |
|------|-------|
| Vercel | Zero-config, automatic deploys from GitHub |
| Netlify | Drag-and-drop `dist/` or connect git repo |
| Cloudflare Pages | Direct upload or git integration |
| GitHub Pages | Deploy from `dist/` via Actions |

```bash
pnpm build        # Outputs to dist/
pnpm preview      # Preview production build locally
```

The extension is distributed via [Chrome Web Store](https://chrome.google.com/webstore/) or loaded unpacked during development.

See [docs/deployment.md](docs/deployment.md) for complete deployment and CI/CD instructions.

---

## Troubleshooting

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Blank screen on load | Corrupted IndexedDB | Clear site data in DevTools → Application → IndexedDB |
| AI features not working | API key not configured | Settings → AI Configuration → add key |
| Port 5173 in use | Another dev server running | `pnpm kill:dev` or use `--port 5174` |
| Extension won't load | Not built yet | `cd apps/extension && pnpm build` first |
| Data lost after browser clear | IndexedDB cleared | Export backup regularly via Settings → Data Management |

See [docs/troubleshooting.md](docs/troubleshooting.md) for the complete guide.

---

## Contributing

We welcome contributions! New to the project? Start with the [Onboarding section](#new-member-onboarding) above. For detailed guidelines see [docs/contribution-guide.md](docs/contribution-guide.md) covering:

- Coding conventions and style guide
- Pull request process
- How to add new features
- How to add new AI providers
- How to add new exercise types
- Commit message conventions

---

## Privacy

- **No backend** — all data stays in your browser
- **No analytics, telemetry, or tracking** — zero data leaves your device
- **AI features are opt-in** — you must provide your own API key
- **Only explicitly selected text** is sent to the AI API
- **Full data export and deletion** available via Settings → Data Management
- **API key** is stored in `localStorage` only, never sent anywhere except the configured AI endpoint
- **Extension permissions** are minimal — only what's needed for collecting text and optional YouTube transcript access

---

## License

[MIT](LICENSE)
