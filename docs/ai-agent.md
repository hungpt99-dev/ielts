# AI Coding Agent Guide

> Guidelines, conventions, and workflows for AI coding agents working with the IELTS Learning Journey codebase. Both AI agents and human contributors should read this before making changes.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started for New AI Agents](#2-getting-started-for-new-ai-agents)
3. [Codebase Conventions](#3-codebase-conventions)
4. [Exploring the Codebase](#4-exploring-the-codebase)
5. [Making Changes](#5-making-changes)
6. [Error Handling & Recovery](#6-error-handling--recovery)
7. [Communication Conventions](#7-communication-conventions)
8. [Architecture Rules](#8-architecture-rules)
9. [Available Tools](#9-available-tools)
10. [Common Workflows](#10-common-workflows)
11. [Validation Checklist](#11-validation-checklist)
12. [Tips for New AI Agents](#12-tips-for-new-ai-agents)

---

## 1. Overview

This codebase is designed to be **AI coding agent-friendly**. The conventions, architecture, and tooling are chosen to make code predictable, statically analyzable, and safe to modify through automated tooling.

The repository includes a **CodeGraph** index (`.codegraph/`) that provides AI agents with pre-computed structural knowledge — symbol search, caller/callee analysis, and blast radius computation — without needing to read every file.

### Who This Guide Is For

- **AI coding agents** making automated changes to the codebase
- **Human contributors** working alongside AI agents
- **New members** onboarding to the project

---

## 2. Getting Started for New AI Agents

### 2.1 First-Read Order

Read these documents in order before making any changes:

1. **[Product Overview](product-overview.md)** — Understand the project, its philosophy, features, and tech stack
2. **[Architecture](architecture.md)** — Clean Architecture layers, monorepo structure, and data flow
3. **[Contribution Guide](contribution-guide.md)** — Coding conventions, workflow, and PR process
4. **This Guide** — AI-specific workflows and validation rules

### 2.2 Setup Verification

After cloning and installing dependencies, run these commands to confirm the environment is healthy:

```bash
# Verify type checking
pnpm typecheck

# Verify linting
pnpm lint

# Verify tests pass
pnpm test:unit

# Build to verify no compilation errors
pnpm build
```

All must pass before making any changes. If any fail, report them to the user and ask whether to fix them first.

### 2.3 Explore Before Editing

Before touching any file, understand its role:

```bash
# Understand a feature area
codegraph explore "how does the vocabulary feature work"

# Find what calls a function (blast radius)
codegraph explore "what calls saveVocabularyEntry"

# Read a file with line numbers
codegraph node packages/learning-engine/src/engines/daily-plan-engine.ts

# Check tests for a module
codegraph node packages/learning-engine/__tests__/daily-plan-engine.test.ts
```

---

## 3. Codebase Conventions

### 3.1 Architecture

| Convention | Description |
|-----------|-------------|
| **Clean Architecture** | Presentation → Application → Domain → Infrastructure layers are strictly separated |
| **Monorepo** | `apps/` for runnable applications, `packages/` for shared libraries |
| **Feature Modules** | Each feature in `apps/web/src/features/` owns its components, hooks, and services |
| **Repository Pattern** | Data access goes through repository interfaces in `packages/storage/` |
| **Dependency Direction** | Outer layers depend on inner layers; Domain has zero dependencies |

### 3.2 TypeScript & Validation

| Convention | Description |
|-----------|-------------|
| **Strict Mode** | `strict: true` in all `tsconfig.json` files — leverage types for safe refactoring |
| **Zod Validation** | All data at system boundaries is validated with Zod schemas |
| **No `any`** | Avoid `any` type; use `unknown` with type guards when necessary |
| **Explicit Exports** | Barrel files (`index.ts`) re-export public API surfaces |

### 3.3 Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Packages | `kebab-case` | `learning-engine`, `ai-tutor` |
| Components | `PascalCase` | `VocabularyCard`, `StudyPlanView` |
| Hooks | `camelCase` prefixed with `use` | `useVocabulary`, `useStudySession` |
| Services | `PascalCase` suffixed with `Service` | `VocabularyService`, `ChatService` |
| Engines | `PascalCase` suffixed with `Engine` | `DailyPlanEngine`, `ProgressEngine` |
| Models | `PascalCase` | `VocabularyEntry`, `StudySession` |

### 3.4 File Organization Per Feature Module

```
features/<feature-name>/
├── components/     # UI components (React)
├── hooks/          # Custom React hooks
├── services/       # Feature-specific business logic
└── types/          # Feature-specific type definitions
```

### 3.5 Package Organization

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

## 4. Exploring the Codebase

### 4.1 Preferred Exploration Flow

1. **Start with documentation** — Understand architecture, features, and conventions from `docs/`
2. **Use CodeGraph** — Run `codegraph explore` to answer structural questions
3. **Inspect relevant files** — Use `codegraph node <file>` to read files with line numbers
4. **Check tests** — Look at `__tests__/` to understand expected behavior

### 4.2 CodeGraph Commands

```bash
# Explore a module or feature (natural language query)
codegraph explore "how does VocabularyService work"

# Find callers of a function (blast radius analysis)
codegraph explore "what calls addVocabularyEntry"

# Read a file with line numbers (faster than direct file read)
codegraph node packages/learning-engine/src/engines/daily-plan-engine.ts

# Search for a symbol
codegraph explore "DailyPlan"

# Trace an end-to-end data flow
codegraph explore "vocabulary entry flow from UI to IndexedDB"

# Find all implementations of an interface
codegraph explore "IAiAdapter implementations"

# Check what depends on a file before editing it
codegraph node packages/storage/src/repositories/vocabulary-repository.ts
```

### 4.3 Understanding Data Flow

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

### 4.4 Finding Related Tests

Tests are co-located with their source code:

```
packages/*/__tests__/          # Package-level tests
apps/web/src/features/*/tests/ # Feature-level tests
```

Use CodeGraph to find tests for a specific function:

```bash
codegraph explore "tests for DailyPlanEngine"
```

---

## 5. Making Changes

### 5.1 General Rules

1. **Read before editing** — Use CodeGraph to understand the existing implementation and its callers
2. **Follow existing patterns** — New features should mirror existing feature modules in `apps/web/src/features/`
3. **Add to the right package** — Shared logic goes in `packages/`, app-specific logic stays in `apps/web/src/`
4. **Validate with Zod** — Any new data boundary must have a Zod schema
5. **Maintain layer isolation** — Domain packages must not import from Presentation or Infrastructure layers
6. **Make focused changes** — Address one concern at a time; avoid large multi-file rewrites in a single step
7. **Verify after each change** — Run typecheck, lint, and tests after each logical change, not just at the end

### 5.2 Adding a New Feature

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

### 5.3 Adding a New AI Provider

1. Implement the `IAiAdapter` interface in `packages/ai/src/adapters/`
2. Register the adapter in `packages/ai/src/adapter-registry.ts`
3. Add provider configuration UI in `apps/web/src/features/settings/`
4. Add Zod validation for provider-specific config
5. See [ai-architecture.md](ai-architecture.md) for detailed guidance

### 5.4 Adding a New Exercise Type

1. Define the exercise model in `packages/exercises/src/models/`
2. Implement a generation strategy in `packages/exercises/src/strategies/`
3. Register the strategy in `packages/exercises/src/services/exercise-generator.ts`
4. Create the scoring logic in `packages/exercises/src/services/exercise-scorer.ts`
5. Build the UI component in `apps/web/src/features/exercises/`

### 5.5 Context Management

AI agents should be mindful of context limits:

- **Scope each change** — Do not edit more than 3-5 files in a single step unless the change is tightly coupled
- **Commit early, commit often** — After a logical group of changes is complete and verified, stage it
- **Report progress** — After each major step, summarize what was changed and the result of validation

---

## 6. Error Handling & Recovery

### 6.1 When Type Checking Fails

1. Read the first error message carefully — fix one error at a time
2. Check if the error is in a file you edited or a file that depends on your change
3. Use CodeGraph to find the relevant type definition if needed:

   ```bash
   codegraph explore "<TypeName>"
   ```

4. After fixing, run `pnpm typecheck` again

### 6.2 When Tests Fail

1. Run the failing test in isolation:

   ```bash
   pnpm test -- <failing-test-file>
   ```

2. Read the test to understand the expected behavior
3. Fix the implementation, not the test (unless the test is incorrect)
4. Re-run the full test suite to verify no regressions

### 6.3 When Lint Fails

1. Read the lint rule name and message
2. Fix according to the rule; do not disable the rule unless absolutely necessary and justified
3. Run `pnpm lint` again

### 6.4 When a Change Has Unexpected Blast Radius

If a change causes failures in files you did not edit:

1. Use CodeGraph to understand the dependency chain:

   ```bash
   codegraph explore "what changed between <function A> and <function B>"
   ```

2. If the blast radius is too large, ask the user before proceeding
3. Consider a different approach with narrower impact

### 6.5 Rolling Back

If a change introduces more problems than it solves:

1. Use `git checkout -- <file>` to revert individual files
2. Or `git reset --hard` to revert everything (ensure no unrelated changes exist)
3. Report what went wrong and propose an alternative approach

---

## 7. Communication Conventions

### 7.1 How to Report Progress

After each significant step, tell the user:

- **What was done** — Which files were changed and why
- **Validation result** — Whether typecheck, lint, and tests pass
- **Next step** — What you plan to do next

### 7.2 When to Ask Questions

Ask the user for clarification when:

- The task description is ambiguous or incomplete
- Multiple valid approaches exist with different trade-offs
- A change affects a system outside the scope of the current task
- You need access to external services or credentials
- A proposed change could break existing functionality

### 7.3 What to Include in Summaries

- File paths and line numbers for changes
- Any new dependencies added
- Any deprecations or removals
- Validation results (typecheck, lint, test output)

---

## 8. Architecture Rules

### 8.1 Dependency Direction

```
Presentation Layer (React components, hooks)
    ↓ depends on
Application Layer (services, use cases)
    ↓ depends on
Domain Layer (entities, business rules) ← Core, zero framework deps
    ↓ depends on
Infrastructure Layer (IndexedDB, AI adapters, browser APIs)
```

### 8.2 Rules AI Agents Must Follow

| Rule | Rationale |
|------|-----------|
| Never import from `packages/` directly in components | Use hooks and services as intermediaries |
| Never call IndexedDB directly from components | Use repository pattern |
| Never hard-code API keys | User-provided, stored in localStorage |
| Never place shared logic in `apps/` | Belongs in `packages/` for reuse by extension |
| Never skip Zod validation at data boundaries | Prevents data corruption |
| Never import React into `packages/` domain code | Keeps domain logic framework-agnostic |
| Never add new dependencies without asking | Avoids dependency bloat and security risk |
| Never modify public API surfaces without updating all callers | Prevents silent breakage |

### 8.3 What Belongs Where

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

## 9. Available Tools

### 9.1 CodeGraph (`.codegraph/`)

The repository includes a pre-built code intelligence index:

| Feature | Capability |
|---------|-----------|
| Symbol Search | Find any symbol by name across the codebase |
| Caller Analysis | List every call site of a function, including callback registrations |
| Callee Traversal | Show what a function calls internally |
| Blast Radius | Determine what would be affected by a change |
| File Reading | Read files with line numbers (faster than direct file read) |

### 9.2 Development Tools

| Tool | Usage |
|------|-------|
| `pnpm dev` | Start web development server |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Run unit tests (fastest) |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm build` | Full production build |

### 9.3 Testing Tools

| Tool | When to Use |
|------|-------------|
| Vitest | Unit and integration tests |
| React Testing Library | Component tests |
| `fake-indexeddb` | Repository tests without browser |
| `jsdom` | Browser environment simulation |

---

## 10. Common Workflows

### 10.1 Fixing a Bug

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

### 10.2 Adding a New Feature

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

### 10.3 Refactoring

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

### 10.4 Onboarding a New AI Agent to a Task

```bash
# 1. Understand the task scope
codegraph explore "<task area> architecture and data flow"

# 2. Read relevant documentation
#    (docs/ files related to the task)

# 3. Check existing tests for patterns
codegraph explore "tests for <area>"

# 4. Verify environment
pnpm typecheck && pnpm lint && pnpm test:unit
```

---

## 11. Validation Checklist

Before considering a change complete, an AI agent should verify:

### Core Checks

- [ ] `pnpm typecheck` passes (no type errors)
- [ ] `pnpm lint` passes (no lint violations)
- [ ] `pnpm test:unit` passes (unit tests green)
- [ ] `pnpm build` passes (full build succeeds)

### Code Quality

- [ ] No new `any` types introduced
- [ ] Data boundaries are validated with Zod schemas
- [ ] New features follow the feature module pattern
- [ ] Shared logic is placed in `packages/`, not in `apps/`
- [ ] No React imports in domain packages
- [ ] No direct IndexedDB calls from components
- [ ] Layer dependency rules are respected

### Documentation

- [ ] Relevant `docs/` files are updated if behavior changed
- [ ] Public API changes are reflected in documentation
- [ ] New exports are added to barrel (`index.ts`) files

### Testing

- [ ] New code has corresponding tests
- [ ] Existing tests still pass
- [ ] Edge cases are considered (empty state, error state, loading state)

---

## 12. Tips for New AI Agents

### 12.1 Before You Start

- **Always read first** — Understand the code before editing it. CodeGraph makes this fast.
- **Check the docs** — Documentation in `docs/` is the source of truth for architecture and conventions.
- **Run validation early** — Run `typecheck` and `test` before making changes to confirm a healthy baseline.
- **Know the blast radius** — Before changing a function, check its callers. A small change can break many consumers.

### 12.2 While Making Changes

- **One thing at a time** — Make one logical change, validate it, then move to the next.
- **Mirror, don't invent** — If adding a new feature, copy the structure and naming of an existing feature.
- **Use types as guardrails** — Strict TypeScript will catch many mistakes at compile time. Let it.
- **Keep changes minimal** — Prefer surgical edits over rewrites. Smaller diffs are safer and easier to review.

### 12.3 After Making Changes

- **Run the full validation suite** — Do not rely on a single check. Run typecheck, lint, and tests.
- **Check with `git diff`** — Review your changes before reporting completion to catch unintended modifications.
- **Report clearly** — Tell the user what changed, why, and what validation passed.

### 12.4 Common Pitfalls to Avoid

| Pitfall | How to Avoid |
|---------|-------------|
| Editing files before understanding their role | Use `codegraph explore` first |
| Making large multi-file changes at once | Break work into small, verifiable steps |
| Skipping validation between changes | Run `pnpm typecheck` after each logical step |
| Ignoring the blast radius | Always check callers before modifying public functions |
| Adding dependencies without asking | Propose the dependency and explain why it is needed |
| Modifying test expectations instead of fixing the real issue | Read the test to understand expected behavior |

---

## See Also

- [Architecture Overview](architecture.md) — Clean architecture and layer separation
- [AI Architecture](ai-architecture.md) — AI provider adapters and prompt design
- [Contribution Guide](contribution-guide.md) — Human contributor conventions
- [Testing Strategy](testing-strategy.md) — Test types and patterns
- [Local-First Design](local-first-design.md) — Offline-first architecture
