# IELTS Journey

> Status: Active development — 0.1.0  
> Last verified against source: 2026-07-13

IELTS Journey is a **local-first, AI-enhanced IELTS preparation application** delivered as a Progressive Web App (PWA) and Chrome Extension. It provides a structured study roadmap, skill-specific practice, spaced-repetition vocabulary review, AI-powered tutoring, and offline-capable learning — all stored locally in IndexedDB with no backend server required.

## Core capabilities

| Capability | Status | Notes |
|-----------|--------|-------|
| Study roadmap | Stable | Multi-phase study plan with weekly tasks |
| Daily learning | Stable | Skill-specific practice sessions |
| AI Tutor | Stable | Chat, progress review, proactive messages |
| Vocabulary notebook | Stable | CRUD + spaced repetition + AI enrichment |
| Mistake review | Stable | Mistake tracking and review |
| Reading practice | Stable | Passage-based with AI question generation |
| Listening practice | Stable | Transcript and audio-based exercises |
| Writing practice | Stable | Task 1 / Task 2 with AI evaluation |
| Speaking practice | Stable | Part 1/2/3 with self-evaluation |
| Grammar exercises | Stable | Grammar skill exercises |
| Mock test tracking | Stable | Score logging and progress charting |
| Saved content | Stable | Public API content import (Wikipedia, Wiktionary, Datamuse) |
| YouTube learning | Stable (experimental) | In-extension transcript, vocabulary, quiz generation |
| Browser extension | Stable | Save words/sentences/articles, auto-highlight, AI explain |
| Proactive Tutor | Partial | Notification center; cross-engine pipeline in progress |
| Study Plan Engine | Partial | `DailyPlanEngine` / `AiPlanOrchestrator` in learning-engine package |
| PWA mobile support | Stable | Capacitor iOS/Android builds, PWA install |
| Data export/import | Stable | Full backup and restore with merge/replace modes |

## Architecture summary

```
Web Application (React 19 / PWA)    Browser Extension (Chrome MV3)
              │                              │
              └──────────┬───────────────────┘
                         │
              Application features
              (reading, listening, writing, speaking, grammar, vocabulary)
                         │
         ┌───────────────┼───────────────────┐
         ▼               ▼                   ▼
  Study Plan     Learning Engine      AI Tutor Engine
  (daily-plan)   (sessions, exercises,  (chat, context,
                 attempts, evaluation)   memory, proactive)
         │               │                   │
         └───────────────┼───────────────────┘
                         ▼
         @ielts/storage (IndexedDB / Dexie)
         @ielts/ai (AI provider adapters)
         @ielts/shared (cross-engine types)
```

- **Study Plan Engine** — Schedules study objectives and generates weekly plans (`DailyPlanEngine` in `packages/learning-engine/src/daily-plan/`).
- **Learning Engine** — Creates and evaluates learning sessions with exercises, attempts, and outcomes (`packages/learning-engine/`).
- **AI Tutor Engine** — Maintains learner context, manages tutor memory, generates proactive interventions (`packages/ai-tutor-engine/`).

All three engines are workspace packages that can be used independently by both the web app and the extension.

## Repository structure

```
apps/
  web/           — React 19 PWA (Vite, Tailwind v4, Capacitor)
  extension/     — Chrome MV3 extension (Vite + esbuild)
packages/
  ai/            — AI client, provider adapters (OpenAI), prompt builders, schemas
  ai-tutor-engine/  — Hexagonal AI Tutor engine: context, memory, proactive, chat
  learning-engine/  — Hexagonal Learning engine: sessions, exercises, skill modules
  shared/        — Cross-engine types, schemas, mappers
  storage/       — Dexie/IndexedDB database, 47 tables, migrations v1-v8
  settings/      — AI and shared settings schemas and defaults
  theme/         — Design tokens, ThemeProvider, CSS variables
  ui/            — 22 React components + 180+ icons (lucide-react)
```

## Quick start

```sh
# Install dependencies
pnpm install

# Start web app (http://127.0.0.1:5173)
pnpm dev:web

# Start extension (http://127.0.0.1:5174)
pnpm dev:extension

# Run all tests
pnpm ai

# Type-check all packages
pnpm typecheck

# Lint web app
pnpm lint:web

# Build for production
pnpm build

# Build web only
pnpm build:web

# Build extension only
pnpm build:extension
```

All commands run from the repo root. Individual workspace scripts are in each `package.json`.

## Environment configuration

Copy and review `apps/web/.env.example` — it only documents Capacitor settings. No API keys are required for local development; the AI provider is configured at runtime through the Settings UI.

| Variable | Required | Scope | Purpose |
|----------|----------|-------|---------|
| `CAPACITOR_APP_ID` | No | Web | Native app bundle ID (`com.ieltsjourney.app`) |
| `CAPACITOR_APP_NAME` | No | Web | Native app name (`IELTS Journey`) |

AI provider configuration (OpenAI or custom) is stored in localStorage under `ielts-settings` and set through the Settings > AI Provider page.

## Documentation

| Section | Description |
|---------|-------------|
| [Getting started](docs/getting-started/prerequisites.md) | Prerequisites, setup, environment |
| [Architecture](docs/architecture/overview.md) | System architecture, monorepo structure |
| [Engine overview](docs/engine/README.md) | Study Plan, Learning, AI Tutor engines |
| [Data and persistence](docs/data/persistence.md) | IndexedDB, migrations, import/export |
| [Development guides](docs/development/coding-standards.md) | Coding standards, adding features |
| [Testing](docs/development/testing.md) | Test commands and strategy |
| [Refactoring plan](docs/refactoring/current-state-analysis.md) | Current analysis, migration plan |
| [Troubleshooting](docs/troubleshooting/README.md) | Common issues by area |
| [Full docs index](docs/README.md) | All documentation by audience |

## Project status

**Stable**: Local-first vocabulary, practice sessions (reading, listening, writing, speaking, grammar), study roadmap, AI chat, data export/import, PWA, Chrome extension content capture.

**Work in progress**: Proactive Tutor cross-engine pipeline, YouTube learning, Writing/Speaking AI evaluation integration, extension-web sync, Learning Engine adoption across the web app.

**Known architectural duplication**: Multiple exercise models, AI client wrappers, and storage adapters exist across the web app and extension. The engine packages (`@ielts/learning-engine`, `@ielts/ai-tutor-engine`) define the target architecture but are not yet fully adopted. See [Current state analysis](docs/refactoring/current-state-analysis.md) and [Migration plan](docs/refactoring/migration-plan.md).
