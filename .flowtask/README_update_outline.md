# Updated README.md — Outline

> **Goal**: Transform the current README into an industry-standard open-source project document that clearly communicates the project's value, architecture, and developer experience — including explicit AI coding agent guidance.

---

## 1. Project Overview

### 1.1 Title & Badges
- **Title**: IELTS Learning Journey (or reconsidered project name)
- **Badge row**: build status, test coverage, TypeScript version, license, pnpm version, PRs welcome

### 1.2 Tagline / Hero Section
- One-sentence value proposition: "A local-first, offline-capable IELTS preparation system — no backend, full privacy, optional AI."
- Key differentiators (local-first, privacy, PWA, no backend)

### 1.3 Screenshot / Demo GIF
- Placeholder for a screenshot of the dashboard or a demo recording

### 1.4 Table of Contents
- Quick-links to all major sections (collapsible or inline)

---

## 2. Features

### 2.1 Core Study Features
| Feature | Description |
|---------|-------------|
| Vocabulary Management | SM-2 spaced repetition, tagging, filtering |
| Reading Practice | Session logging, passage saving, comprehension tracking |
| Listening Practice | Session logging, transcript saving, score tracking |
| Writing Practice | Task 1 & Task 2 essay practice with band estimation |
| Speaking Practice | Parts 1–3 session logging |
| Grammar Notes | Topic organization with examples and corrections |
| Mistake Notebook | Record, categorize, and review mistakes |
| Mock Test Tracker | Band score logging and progress over time |

### 2.2 Intelligence & Planning
- **Learning Journey Engine**: Weakness detection, review scheduling, next-best-action recommendations
- **Daily Study Planner**: Task planning across all skills with progress tracking
- **Progress Analytics**: Charts for study days, hours, skill balance, band trends

### 2.3 AI-Powered Features (Opt-In)
- **AI Tutor Chat**: Messenger-style assistant with context-aware suggestions
- **AI Exercise Generator**: AI-powered and rule-based exercise generation
- **AI Explanations**: For selected text via browser extension
- **Proactive Messages**: Local rule-based study reminders and tips

### 2.4 Platform Features
- **PWA Support**: Install as standalone app, works fully offline
- **Dark Mode**: Light/dark/system theme with design tokens
- **Data Import/Export**: Full JSON backup/restore with merge and replace modes
- **Content Library**: Built-in IELTS content with versioned seeding
- **Browser Extension**: Chrome Manifest V3 extension for collecting content from any webpage

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | TypeScript 5.8+ (strict mode) | End-to-end type safety |
| UI Framework | React 19 | Component model |
| Build | Vite 6 | Fast dev/build for web + extension |
| Styling | Tailwind CSS 4 + CSS custom properties | Utility-first with design tokens |
| Routing | React Router v7 | Client-side routing |
| Database | IndexedDB (via `idb`) | Local-first persistent storage |
| Validation | Zod 4 | Runtime schema validation |
| AI | OpenAI-compatible REST API (adapter pattern) | Optional AI integration |
| Charts | Recharts | Analytics visualizations |
| Testing | Vitest + React Testing Library | Unit + integration tests |
| PWA | vite-plugin-pwa | Offline capability |
| Package Manager | pnpm workspaces | Monorepo management |

---

## 4. Code Architecture

### 4.1 Monorepo Structure

#### `apps/`
| Directory | Description |
|-----------|-------------|
| `web/` | React SPA — main PWA application |
| `extension/` | Chrome extension (Manifest V3) |

#### `packages/`
| Directory | Description |
|-----------|-------------|
| `storage/` | IndexedDB repositories, schema, migrations, seeding |
| `ai/` | AI provider adapters, prompt builders, response validation |
| `learning-engine/` | Business rules, progress calculations, weakness detection, daily plans |
| `content/` | Built-in IELTS content library with versioned seeding |
| `exercises/` | Exercise models, scoring/generation strategies, review scheduling |
| `ui/` | Shared reusable UI components |
| `theme/` | Design tokens, CSS variables, ThemeProvider |
| `utils/` | Pure utility functions, error types |

#### `src/` (Web Application — Presentation + Application Layers)
| Directory | Description |
|-----------|-------------|
| `features/` | Feature modules (vocabulary, analytics, planner, etc.) |
| `pages/` | Route-level page components |
| `hooks/` | Shared custom React hooks |
| `services/` | Application services (AI, storage, chat) |
| `components/` | Shared UI components |
| `context/` | React contexts (settings, theme) |
| `models/` | Domain model definitions |
| `app/` | App entry point |
| `data/` | Data seeding definitions |
| `styles/` | Global styles |

### 4.2 Clean Architecture Layers

```
┌─────────────────────────────────────────────────┐
│               PRESENTATION LAYER                  │
│  React Components · Pages · Widgets · Hooks      │
├─────────────────────────────────────────────────┤
│               APPLICATION LAYER                   │
│  Feature Services · Use Cases · Commands         │
├─────────────────────────────────────────────────┤
│                DOMAIN LAYER                       │
│  Entities · Business Rules · Value Objects       │
├─────────────────────────────────────────────────┤
│              INFRASTRUCTURE LAYER                 │
│  IndexedDB Repos · AI Adapters · Browser APIs    │
└─────────────────────────────────────────────────┘
```

### 4.3 Data Flow
```
User Input → React Component → Custom Hook → Feature Service
    → Repository Interface → IndexedDB Repository → IndexedDB
```
- Unidirectional data flow
- Components never access database or AI directly
- All business logic in services and domain packages

### 4.4 Key Design Patterns
- **Repository Pattern**: Data access abstraction over IndexedDB
- **Adapter Pattern**: Pluggable AI providers (OpenAI-compatible)
- **Strategy Pattern**: Exercise generation and scoring strategies
- **Custom Hooks**: Encapsulated state and side-effect logic
- **Repository Pattern**: Schema-validated data access layer

### 4.5 AI Architecture
- **Adapter Pattern**: `AiProvider` interface → OpenAI / custom provider implementations
- **Prompt Builder**: Template-based prompt construction with validation
- **Response Validation**: Zod schemas for AI response parsing
- **All AI features are opt-in** — user provides their own API key

---

## 5. AI Coding Agent Capabilities

> This section is specifically designed for AI coding agents (like Cursor, Copilot, Codeium, etc.) to understand how to work with this codebase.

### 5.1 Codebase Conventions
- **Language**: TypeScript 5.8+ with strict mode enabled
- **Style**: ESLint + Prettier configuration provided
- **Testing**: Vitest + React Testing Library; tests co-located with source as `*.test.ts` / `*.test.tsx`
- **Validation**: Zod schemas used for runtime validation of data at boundary edges
- **Package Manager**: pnpm workspaces — always use `pnpm` not `npm` or `yarn`

### 5.2 Key Commands for Agents

| Command | Purpose |
|---------|---------|
| `pnpm typecheck` | Run TypeScript compiler check |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm test` | Run all tests (single-instance) |
| `pnpm build` | Type-check and build everything |
| `pnpm dev` | Start development server |

### 5.3 Architecture Rules for Agents
- **Don't break Clean Architecture layers**: presentation → application → domain → infrastructure
- **Don't import across layers**: e.g., no IndexedDB code in React components
- **Use Zod schemas at boundaries**: validate external data (AI responses, imports, storage reads) with Zod
- **Feature modules are isolated**: each feature under `src/features/` has its own components, hooks, types, and services
- **Packages are shared infrastructure**: never duplicate code across apps — extend shared packages instead

### 5.4 Common Modification Patterns
- **Adding a new feature**: Create `src/features/<name>/` with components, hooks, types, services
- **Adding a new AI provider**: Implement `AiProvider` interface in `packages/ai/src/providers/`
- **Adding a new data entity**: Define Zod schema in `packages/storage/src/schema.ts`, create Repository class
- **Adding a new exercise type**: Implement exercise strategy in `packages/exercises/src/strategies/`

### 5.5 Testing Expectations
- Every new feature or package should have tests
- Repository tests use `fake-indexeddb`
- Component tests use React Testing Library + `jsdom`
- Test files are co-located: `src/features/x/Component.test.tsx`

---

## 6. Getting Started

### 6.1 Prerequisites
- Node.js >= 18
- pnpm >= 8

### 6.2 Installation

```bash
git clone <repo-url>
cd ielts-journey
pnpm install
```

### 6.3 Development

```bash
# Start web app dev server
pnpm dev:web

# Build extension with watch mode
pnpm dev:extension
```

### 6.4 Production Build

```bash
# Web app (typecheck + build)
pnpm build

# Preview production build
pnpm preview
```

### 6.5 Available Scripts
| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Start web development server |
| `pnpm dev:extension` | Build extension in watch mode |
| `pnpm build` | Type-check and build all packages |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run all tests (single-instance) |
| `pnpm test:unit` | Run unit tests with Vitest |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Lint source code with ESLint |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm clean` | Clean all build artifacts |

---

## 7. Browser Extension

- **Platform**: Chrome (Manifest V3)
- **Capabilities**: Save vocabulary via context menu / floating toolbar, YouTube transcript helper, AI explanations, mini AI tutor popup
- **Data Sync**: Bridge protocol for syncing with web app
- **Build & Load**: `cd apps/extension && pnpm build`, then load `dist/` at `chrome://extensions/`
- **Link**: See [docs/extension-architecture.md](docs/extension-architecture.md)

---

## 8. AI Integration (Optional)

### 8.1 Setup
1. Go to Settings → AI Configuration
2. Enter your OpenAI API key (or custom provider config)
3. Choose model, temperature, max tokens
4. Click "Test Connection"

### 8.2 Supported Providers
- OpenAI (default)
- Any OpenAI-compatible API (custom base URL)

### 8.3 Privacy
- All AI features are **opt-in**
- **Only explicitly selected text** is sent to the AI API
- API key stored in `localStorage` — never sent anywhere except the configured AI endpoint
- [docs/ai-architecture.md](docs/ai-architecture.md)

---

## 9. Data Architecture

### 9.1 Storage Layers
| Storage | Contents |
|---------|----------|
| **IndexedDB** | Vocabulary, study sessions, logs, grammar notes, mistakes, progress, chat history |
| **localStorage** | Settings (theme, target band, AI API key, preferences) |

### 9.2 Data Flow
```
Component → Custom Hook → Feature Service → Repository → IndexedDB
```

### 9.3 Import / Export
- Full JSON backup and restore via Settings → Data Management
- **Merge mode**: Adds imported data alongside existing (skips duplicates by ID)
- **Replace mode**: Clears all existing data before importing
- Schema validation on import (Zod) prevents corrupted data

---

## 10. Testing

```bash
pnpm test          # Run all tests
pnpm test:unit     # Run unit tests
pnpm test:watch    # Watch mode
```

### Testing Stack
- **Vitest** — test runner
- **React Testing Library** — component tests
- **fake-indexeddb** — storage repository tests
- **jsdom** — browser environment simulation
- Per-package test configs (`packages/*/vitest.config.ts`)

---

## 11. Linting & Type Checking

```bash
pnpm lint       # ESLint
pnpm typecheck  # TypeScript type checking (tsc -b --noEmit)
```

---

## 12. Deployment

- Web app builds to static files → deployable on Vercel, Netlify, Cloudflare Pages, GitHub Pages
- Extension → Chrome Web Store or unpacked for development

---

## 13. Troubleshooting

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Blank screen on load | Corrupted IndexedDB | Clear site data in DevTools → Application → IndexedDB |
| AI features not working | API key not configured | Settings → AI Configuration → add key |
| Port 5173 in use | Another dev server running | `pnpm kill:dev` or use different port |
| Extension won't load | Not built yet | `cd apps/extension && pnpm build` first |
| Data lost after browser clear | IndexedDB cleared | Export backup regularly |

---

## 14. Contributing

### 14.1 Getting Started
- See [docs/contribution-guide.md](docs/contribution-guide.md) for full guidelines
- Follow coding conventions (ESLint + Prettier)
- Open a PR with a clear description

### 14.2 How to Contribute
- Report bugs via GitHub Issues
- Feature requests welcome
- Code contributions: fork → branch → PR
- Adding new AI providers
- Adding new exercise types
- Extending content library

### 14.3 PR Checklist
- [ ] TypeScript compiles with `pnpm typecheck`
- [ ] ESLint passes with `pnpm lint`
- [ ] Tests pass with `pnpm test`
- [ ] New code follows Clean Architecture conventions
- [ ] Zod schemas added/updated for data boundaries
- [ ] Documentation updated if needed

---

## 15. Privacy & Security

- **No backend** — all data stays in your browser
- **No analytics, telemetry, or tracking** — zero data leaves your device
- **AI features are opt-in** — you must provide your own API key
- **Only explicitly selected text** is sent to the AI API
- **Full data export and deletion** available via Settings
- **API key** stored in `localStorage` only
- **Extension permissions** are minimal

---

## 16. License

MIT — see [LICENSE](LICENSE)

---

## 17. Additional Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture.md) | Clean architecture, layers, folder structure |
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
| [ADRs](docs/adr/) | Architecture Decision Records |

---

## Outline Rationale

This outline follows industry-standard README conventions (see GitHub's recommended pattern, Stripe's open-source docs, and Next.js README structure):

1. **Top-down narrative**: Overview → Features → Architecture → Getting Started → Development → Contributing
2. **AI coding agent section**: Explicitly added for LLM-based tools to understand conventions, commands, and architecture rules — a pattern becoming standard in modern open-source repos
3.**Feature-first**: Features are organized by user value (core study → intelligence → AI → platform) rather than by implementation detail
4. **Quick-reference tables**: Badges, script commands, troubleshooting, and docs index for skimmability
5. **Progressive disclosure**: High-level overview → links to detailed docs for those who need depth
