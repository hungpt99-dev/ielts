# AI Coding Agent Integration

> Guidelines and conventions for AI coding agents working with the IELTS Learning Journey codebase.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Codebase Conventions](#2-codebase-conventions)
3. [Exploring the Codebase](#3-exploring-the-codebase)
4. [Making Changes](#4-making-changes)
5. [Architecture Rules](#5-architecture-rules)
6. [Available Tools](#6-available-tools)
7. [Common Workflows](#7-common-workflows)
8. [Validation Checklist](#8-validation-checklist)

---

## 1. Overview

This codebase is designed to be **AI coding agent-friendly**. The conventions, architecture, and tooling are chosen to make the code predictable, statically analyzable, and safe to modify through automated tooling.

The repository includes a **CodeGraph** index (`.codegraph/`) that provides AI agents with pre-computed structural knowledge of the entire codebase, enabling accurate symbol resolution and blast radius analysis without reading every file.

---

## 2. Codebase Conventions

### 2.1 Architecture

| Convention | Description |
|-----------|-------------|
| **Clean Architecture** | Presentation → Application → Domain → Infrastructure layers are strictly separated |
| **Monorepo** | `apps/` for runnable applications, `packages/` for shared libraries |
| **Feature Modules** | Each feature in `apps/web/src/features/` owns its components, hooks, and services |
| **Repository Pattern** | Data access goes through repository interfaces in `packages/storage/` |
| **Dependency Direction** | Outer layers depend on inner layers; Domain has zero dependencies |

### 2.2 TypeScript & Validation

| Convention | Description |
|-----------|-------------|
| **Strict Mode** | `strict: true` in all `tsconfig.json` files — leverage types for safe refactoring |
| **Zod Validation** | All data at system boundaries is validated with Zod schemas |
| **No `any`** | Avoid `any` type; use `unknown` with type guards when necessary |
| **Explicit Exports** | Barrel files (`index.ts`) re-export public API surfaces |

### 2.3 Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Packages | `kebab-case` | `learning-engine`, `ai-tutor` |
| Components | `PascalCase` | `VocabularyCard`, `StudyPlanView` |
| Hooks | `camelCase` prefixed with `use` | `useVocabulary`, `useStudySession` |
| Services | `PascalCase` suffixed with `Service` | `VocabularyService`, `ChatService` |
| Engines | `PascalCase` suffixed with `Engine` | `DailyPlanEngine`, `ProgressEngine` |
| Models | `PascalCase` | `VocabularyEntry`, `StudySession` |

### 2.4 File Organization Per Feature Module

```
features/<feature-name>/
├── components/     # UI components (React)
├── hooks/          # Custom React hooks
├── services/       # Feature-specific business logic
└── types/          # Feature-specific type definitions
```

### 2.5 Package Organization

```
packages/<package-name>/
├── src/
│   ├── models/     # Domain entities and value objects
│   ├── services/   # Service classes (facades, orchestrators)
│   ├── engines/    # Pure computation/algorithm modules
│   ├── utils/      # Utility functions
│   └── index.ts    # Public API
├── __tests__/      # Vitest tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 3. Exploring the Codebase

### 3.1 Preferred Exploration Flow

1. **Start with the README** — Understand architecture, features, and conventions
2. **Use CodeGraph** — Run `codegraph explore` to answer structural questions
3. **Inspect relevant files** — Use `codegraph node <file>` to read files with line numbers
4. **Check tests** — Look at `__tests__/` to understand expected behavior

### 3.2 CodeGraph Commands

```bash
# Explore a module or feature
codegraph explore "VocabularyService how it works"

# Find callers of a function (blast radius)
codegraph explore "what calls addVocabularyEntry"

# Read a file with line numbers
codegraph node packages/learning-engine/src/engines/daily-plan-engine.ts

# Search for a symbol
codegraph explore "DailyPlan"
```

### 3.3 Understanding Data Flow

Always trace the data flow before making changes:

```
Component (UI) → Custom Hook → Feature Service → Repository → IndexedDB
                                                        ↕
                                                Learning Engine
                                                (Pure domain logic)
```

- **Components** should never call repositories or IndexedDB directly
- **Hooks** bridge React lifecycle with service methods
- **Services** orchestrate business logic and data access
- **Repositories** abstract IndexedDB operations
- **Engines** contain pure domain logic with zero framework dependencies

---

## 4. Making Changes

### 4.1 General Rules

1. **Read before editing** — Use CodeGraph to understand the existing implementation and its callers
2. **Follow existing patterns** — New features should mirror existing feature modules in `apps/web/src/features/`
3. **Add to the right package** — Shared logic goes in `packages/`, app-specific logic stays in `apps/web/src/`
4. **Validate with Zod** — Any new data boundary must have a Zod schema
5. **Maintain layer isolation** — Domain packages must not import from Presentation or Infrastructure layers

### 4.2 Adding a New Feature

```bash
# 1. Explore the architecture and choose the right location
codegraph explore "how are features organized"

# 2. Create the feature module
apps/web/src/features/<feature-name>/
├── components/
│   └── <FeatureName>Card.tsx
├── hooks/
│   └── use<FeatureName>.ts
└── services/
    └── <FeatureName>Service.ts

# 3. If shared logic is needed, add a package
packages/<feature-name>/
└── src/
    ├── models/
    ├── services/
    └── index.ts

# 4. Register the route in apps/web/src/app/router.tsx

# 5. Add the feature to the navigation
```

### 4.3 Adding a New AI Provider

1. Implement the `IAiAdapter` interface in `packages/ai/src/adapters/`
2. Register the adapter in `packages/ai/src/adapter-registry.ts`
3. Add provider configuration UI in `apps/web/src/features/settings/`
4. Add Zod validation for provider-specific config
5. See [ai-architecture.md](ai-architecture.md) for detailed guidance

### 4.4 Adding a New Exercise Type

1. Define the exercise model in `packages/exercises/src/models/`
2. Implement a generation strategy in `packages/exercises/src/strategies/`
3. Register the strategy in `packages/exercises/src/services/exercise-generator.ts`
4. Create the scoring logic in `packages/exercises/src/services/exercise-scorer.ts`
5. Build the UI component in `apps/web/src/features/exercises/`

---

## 5. Architecture Rules

### 5.1 Dependency Direction

```
Presentation Layer (React components, hooks)
    ↓ depends on
Application Layer (services, use cases)
    ↓ depends on
Domain Layer (entities, business rules) ← Core, zero framework deps
    ↓ depends on
Infrastructure Layer (IndexedDB, AI adapters, browser APIs)
```

### 5.2 Rules AI Agents Must Follow

| Rule | Rationale |
|------|-----------|
| Never import from `packages/` directly in components | Use hooks and services as intermediaries |
| Never call IndexedDB directly from components | Use repository pattern |
| Never hard-code API keys | User-provided, stored in localStorage |
| Never place shared logic in `apps/web/` | Belongs in `packages/` for reuse by extension |
| Never skip Zod validation at data boundaries | Prevents data corruption |
| Never import React into `packages/` domain code | Keeps domain logic framework-agnostic |

### 5.3 What Belongs Where

| Concern | Location |
|---------|----------|
| React components | `apps/web/src/features/*/components/` or `packages/ui/` |
| Custom hooks | `apps/web/src/features/*/hooks/` or `apps/web/src/hooks/` |
| Route pages | `apps/web/src/pages/` |
| Feature services | `apps/web/src/features/*/services/` or `apps/web/src/services/` |
| Shared UI components | `packages/ui/` |
| Domain entities | `packages/*/src/models/` |
| Business logic | `packages/*/src/engines/` or `packages/*/src/services/` |
| Data repositories | `packages/storage/src/repositories/` |
| AI adapters | `packages/ai/src/adapters/` |
| Design tokens | `packages/theme/src/tokens.css` |
| Extension code | `apps/extension/src/` |

---

## 6. Available Tools

### 6.1 CodeGraph (`.codegraph/`)

The repository includes a pre-built code intelligence index:

| Feature | Capability |
|---------|-----------|
| Symbol Search | Find any symbol by name across the codebase |
| Caller Analysis | List every call site of a function |
| Callee Traversal | Show what a function calls internally |
| Blast Radius | Determine what would be affected by a change |
| File Reading | Read files with line numbers (faster than direct file read) |

### 6.2 Development Tools

| Tool | Usage |
|------|-------|
| `pnpm dev` | Start web development server |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Run unit tests (fastest) |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm build` | Full production build |

### 6.3 Testing Tools

| Tool | When to Use |
|------|-------------|
| Vitest | Unit and integration tests |
| React Testing Library | Component tests |
| `fake-indexeddb` | Repository tests without browser |
| `jsdom` | Browser environment simulation |

---

## 7. Common Workflows

### 7.1 Fixing a Bug

```bash
# 1. Understand the feature
codegraph explore "<feature name> how it works"

# 2. Find the bug location
codegraph explore "what does <suspected component/service> do"

# 3. Check callers to understand blast radius
codegraph explore "callers of <suspected function>"

# 4. Read the implementation
codegraph node <relevant file>

# 5. Fix and validate
pnpm test:unit
pnpm typecheck
pnpm lint
```

### 7.2 Adding a New Feature

```bash
# 1. Explore existing feature patterns
codegraph explore "how are features organized in web app"

# 2. Check existing packages for reusable logic
codegraph explore "packages available"

# 3. Implement following the pattern
#    (Create feature module under apps/web/src/features/)

# 4. Add tests
#    (Create __tests__/ alongside implementation)

# 5. Validate
pnpm typecheck
pnpm lint
pnpm test:unit
```

### 7.3 Refactoring

```bash
# 1. Map the full blast radius
codegraph explore "what calls <function/module to refactor>"

# 2. Read all affected files
codegraph explore "<all affected symbols>"

# 3. Refactor step by step, validating after each step
pnpm typecheck
pnpm test:unit
pnpm lint

# 4. Run full test suite before finishing
pnpm test
```

---

## 8. Validation Checklist

Before considering a change complete, an AI agent should verify:

- [ ] `pnpm typecheck` passes (no type errors)
- [ ] `pnpm lint` passes (no lint violations)
- [ ] `pnpm test:unit` passes (unit tests green)
- [ ] No new `any` types introduced
- [ ] Data boundaries are validated with Zod schemas
- [ ] New features follow the feature module pattern
- [ ] Shared logic is placed in `packages/`, not in `apps/`
- [ ] No React imports in domain packages
- [ ] No direct IndexedDB calls from components
- [ ] Layer dependency rules are respected

---

## See Also

- [Architecture Overview](architecture.md) — Clean architecture and layer separation
- [AI Architecture](ai-architecture.md) — AI provider adapters and prompt design
- [Contribution Guide](contribution-guide.md) — Human contributor conventions
- [Testing Strategy](testing-strategy.md) — Test types and patterns
- [Local-First Design](local-first-design.md) — Offline-first architecture
