# Monorepo Structure

## pnpm Workspace Layout

```
IELTS/
├── apps/
│   ├── web/          # Main web application
│   └── extension/    # Chrome extension (MV3)
├── packages/
│   ├── ai/           # AI client & prompt library
│   ├── ai-tutor-engine/  # AI tutor domain engine
│   ├── learning-engine/  # Learning activities domain engine
│   ├── settings/     # Settings schemas & validation
│   ├── shared/       # Shared domain types & utilities
│   ├── storage/      # IndexedDB schema, migrations, repositories
│   ├── theme/        # CSS theme tokens & context
│   └── ui/           # Shared React components & icons
```

## Application Details

### `apps/web` — @ielts/web

| Attribute | Description |
|---|---|
| **Purpose** | Main SPA: dashboard, practice, study planning, AI tutor, progress tracking |
| **Entry** | `src/main.tsx` → `src/app/App.tsx` |
| **Consumers** | End users (browser, PWA, mobile via Capacitor) |
| **Internal** | Pages (25+ routes), features (dashboard, roadmap, vocab, etc.), shared components, layout with sidebar + mobile bottom nav, context providers (Theme, Settings), services (engineBootstrap, storage, feedback, nativePlatform), hooks, utils, voice |
| **Tests** | `src/test/`, `src/tests/`, `*.test.tsx` |
| **Key deps** | React 19, Vite 6, Tailwind v4, React Router v7, Capacitor 8, recharts, vite-plugin-pwa |

### `apps/extension` — @ielts/extension

| Attribute | Description |
|---|---|
| **Purpose** | Chrome MV3 extension: save content, AI explain, YouTube learning, context menus |
| **Entry** | `background/index.ts` (SW), `content-script/index.ts`, `popup/`, `options/`, `youtube-learning/main.tsx` |
| **Consumers** | Chrome users browsing the web; YouTube learners |
| **Internal** | Background message handlers, content script services (highlighter, selection panel, AI explain, video helper, bridge client), storage adapters, YouTube learning module (layered: infrastructure/application/domain/presentation) |
| **Tests** | `__tests__/` |
| **Build** | Vite (HTML pages) + esbuild (background/content scripts) |
| **Key deps** | React 19, Vite 6, esbuild, Chrome APIs |

## Package Details

### `@ielts/learning-engine`

| Attribute | Description |
|---|---|
| **Purpose** | Domain engine for learning activities, sessions, exercises, evaluation, and progress |
| **Entry** | `src/index.ts` (re-exports facade, application services, domain types, ports, skill modules) |
| **Consumers** | `apps/web`, `apps/extension` |
| **Internal** | Hexagonal architecture: `domain/` (entities, policies, services, value-objects, events), `application/` (sessions, attempts, activities, adaptation, review), `ports/` (9 port interfaces), `infrastructure/` (in-memory defaults, cache, adapters, migrations), `skills/` (6 skill modules: reading, writing, listening, speaking, vocabulary, grammar), `daily-plan/` (sub-engine for study plan generation), `content/` (content adapters and normalization), `orchestration/` (engine facade and creation) |
| **Tests** | `src/**/__tests__/` |
| **Key deps** | `@ielts/ai`, `@ielts/shared`, `zod` |

### `@ielts/ai-tutor-engine`

| Attribute | Description |
|---|---|
| **Purpose** | Domain engine for AI tutoring: chat, proactive messages, memory, recommendations, context building |
| **Entry** | `src/index.ts` (re-exports engine creator, application services, domain types, ports, utilities) |
| **Consumers** | `apps/web`, `apps/extension` |
| **Internal** | Hexagonal architecture: `domain/` (entities, policies, services, value-objects, events), `application/` (chat, memory, proactive, progress, recommendations, reminders, roadmap), `ports/` (13 port interfaces), `context/` (LearnerContextBuilder, ContextSourceRegistry), `memory/` (TutorMemoryManager, de/compaction), `proactive/` (ProactiveTutorOrchestrator, trigger/generator registries, caching evaluator), `ai/` (TutorAIClient interface, prompt builders, fallback), `infrastructure/` (storage adapters), `skill-modules/` (6 skill tutor interfaces), `services/` (MessageStorage, ProactiveEventBus) |
| **Tests** | `src/test/`, `src/tests/`, `src/**/__tests__/` |
| **Key deps** | `@ielts/ai`, `@ielts/shared`, `zod` |

### `@ielts/ai`

| Attribute | Description |
|---|---|
| **Purpose** | AI integration layer: OpenAI client, prompt library, caching, Zod-validated services |
| **Entry** | `src/index.ts` |
| **Consumers** | `@ielts/learning-engine`, `@ielts/ai-tutor-engine`, `apps/web`, `apps/extension` |
| **Internal** | `client/` (AIClient, callAI, types), `adapters/` (OpenAI adapter), `prompts/` (PromptRegistry, explain labels, built-in prompts), `schemas/` (Zod schemas), `services/` (validated AI services), `errors/` (typed errors), `utils/` (cache) |
| **Tests** | `src/__tests__/` |
| **Key deps** | `zod` |

### `@ielts/storage`

| Attribute | Description |
|---|---|
| **Purpose** | IndexedDB layer: schema, migrations, typed repositories, backup/restore, sync protocol |
| **Entry** | `src/index.ts` |
| **Consumers** | `apps/web`, `apps/extension`, `@ielts/learning-engine`, `@ielts/ai-tutor-engine` |
| **Internal** | `db.ts` (Dexie DB class, 47 tables), `migrations.ts` (v1–v8, `APP_SCHEMA`), `repositories/` (26 repository classes), `youtube-repositories.ts` + `youtube-schemas.ts` (YouTube-specific), `backup/` (exportAllData, importBackup, merge/replace modes), `syncProtocol.ts` (bridge messaging protocol), `syncService.ts`, `errors.ts` |
| **Tests** | `src/__tests__/` (uses `fake-indexeddb`) |
| **Key deps** | `dexie`, `zod`, `fake-indexeddb` (dev) |

### `@ielts/shared`

| Attribute | Description |
|---|---|
| **Purpose** | Shared domain types, event definitions, mappers, and utilities |
| **Entry** | `src/index.ts` |
| **Consumers** | All apps and packages |
| **Internal** | `ielts-section.ts`, `evaluation-types.ts`, `exercise-question.ts`, `feedback-types.ts`, `learner-context.ts`, `learning-event.ts`, `learning-outcome.ts`, `mistake-evidence.ts`, `operation-result.ts`, `proactive-schemas.ts`, `attempt-types.ts`, `validation.ts`, `value-objects.ts`, `mappers/` |
| **Tests** | — |
| **Key deps** | `zod` |

### `@ielts/settings`

| Attribute | Description |
|---|---|
| **Purpose** | Settings schema definitions and validators |
| **Entry** | `src/index.ts` |
| **Consumers** | `apps/web`, `apps/extension`, `@ielts/settings` |
| **Internal** | Zod schemas for all user settings (band goal, AI provider, theme, schedule, proactive tutor, notifications, etc.) |
| **Tests** | — |
| **Key deps** | `zod` |

### `@ielts/theme`

| Attribute | Description |
|---|---|
| **Purpose** | CSS theme tokens and React ThemeProvider |
| **Entry** | `src/index.ts` |
| **Consumers** | `@ielts/ui`, `apps/web`, `apps/extension` |
| **Internal** | CSS custom properties (colors, spacing, typography), dark/light mode support, ThemeProvider context |
| **Tests** | — |
| **Key deps** | `react` |

### `@ielts/ui`

| Attribute | Description |
|---|---|
| **Purpose** | Shared UI component library |
| **Entry** | `src/index.ts` |
| **Consumers** | `apps/web`, `apps/extension` |
| **Internal** | 22 components (layout, navigation, form controls, feedback, overlay), 180 icons (re-exported from lucide-react), MobileBottomNavigation, loading states |
| **Tests** | — |
| **Key deps** | `@ielts/theme`, `lucide-react`, `react` |
