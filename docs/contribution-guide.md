# Contribution Guide

> How to contribute to the IELTS Journey project.

---

## 1. New Member Onboarding

Welcome! This section guides you through everything you need to start contributing.

### 1.1 Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8
- **Git** with SSH or HTTPS configured
- A code editor (VS Code recommended)

### 1.2 Setup

```bash
# Fork and clone
git clone https://github.com/<your-username>/ielts-journey
cd ielts-journey

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 1.3 First-Time Reading List

Read these in order to understand the project before making changes:

1. **[Product Overview](product-overview.md)** — What the project is, its philosophy, features, and tech stack
2. **[Architecture](architecture.md)** — Clean Architecture layers, monorepo structure, and data flow
3. **This Guide** — Conventions, workflow, and coding standards
4. **[AI Coding Agent Guide](ai-agent.md)** — How AI agents interact with the codebase (useful for human contributors too)

### 1.4 Quick Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
```

All must pass before you begin making changes.

### 1.5 Communication Channels

- **GitHub Issues** — Report bugs and request features
- **GitHub Discussions** — Ask questions, suggest ideas, and discuss the project

### 1.6 Where to Start

- Look for issues labeled `good first issue` or `help wanted`
- Start with documentation fixes or small bug fixes to learn the codebase
- Read existing pull requests to understand review expectations

---

## 2. Code of Conduct

This project is open to contributions from everyone. Please:
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn

---

## 3. Development Workflow

### 3.1 Branch Strategy

```
main          ← Production-ready code
  └── feature/*    ← New features
  └── fix/*        ← Bug fixes
  └── docs/*       ← Documentation
  └── refactor/*   ← Code improvements
```

### 3.2 Making Changes

1. Create a branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes following conventions in [Architecture](architecture.md)

3. Run quality checks:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```

4. Commit using conventional commits:
   ```
   feat(vocabulary): add batch import feature
   fix(storage): handle missing userContentEdits field
   docs(ai): update adapter documentation
   ```

5. Push and create a Pull Request

### 3.3 Pull Request Guidelines

- Title follows conventional commits
- Description explains the change and motivation
- References related issues
- Includes tests for new code
- All CI checks pass
- Screenshots for UI changes

---

## 4. Coding Standards

### 4.1 TypeScript

- Strict mode enabled
- Avoid `any` — use proper types or `unknown`
- Use Zod schemas for all data validation at boundaries
- Prefer interfaces over type aliases for object shapes
- Use `const` assertions for literal types

### 4.2 Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `vocabulary-service.ts` |
| React components | PascalCase | `VocabularyCard.tsx` |
| Interfaces | PascalCase | `IVocabularyRepository` |
| Types | PascalCase | `VocabularyWord` |
| Functions | camelCase | `createVocabularyWord()` |
| Constants | UPPER_SNAKE | `DEFAULT_BAND_SCORE` |
| CSS classes | kebab-case | `vocab-card-title` |

### 4.3 File Organization

- One primary export per file
- Files under 300 lines
- Barrel exports in `index.ts`
- Tests co-located in `__tests__/` or `tests/`

### 4.4 React Component Structure

```typescript
import { useState } from 'react'
import type { VocabularyWord } from '@ielts/types'

interface VocabularyCardProps {
  word: VocabularyWord
  onSave: (id: string) => void
}

export function VocabularyCard({ word, onSave }: VocabularyCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card" onClick={() => setExpanded(!expanded)}>
      <h3>{word.word}</h3>
      {expanded && <p>{word.meaning}</p>}
    </div>
  )
}
```

### 4.5 Clean Architecture Rules

- **Components** never call IndexedDB or AI directly
- **Hooks** bridge components to services
- **Services** contain application logic and orchestration
- **Domain packages** have no framework dependencies
- **Repositories** implement domain interfaces with Zod validation

---

## 5. Adding Features & Content

### 5.1 New Feature

1. Create `features/<feature-name>/` with `components/`, `hooks/`, `services/`, `schemas/`, `types/`, `utils/`, `tests/`
2. Add routes in `apps/web/src/router.tsx`
3. Add navigation in sidebar/headbar
4. Write tests

### 5.2 New AI Provider

1. Implement `IAiAdapter` interface
2. Create adapter in `packages/ai/src/adapters/`
3. Register in the adapter factory
4. Add provider option to settings schema
5. Write adapter tests

### 5.3 New Exercise Type

1. Add `QuestionType` to `packages/exercises/src/types.ts`
2. Implement `ScoringStrategy`
3. Register in `ScoringEngine`
4. Create UI renderer in `features/exercises/components/`
5. Write tests

### 5.4 New Built-in Content

1. Create file in `packages/content/src/built-in/`
2. Add content array with proper IDs
3. Register in `built-in/index.ts`
4. Add schema in `packages/content/src/schemas.ts`
5. Update seeding logic if needed
6. Write tests

---

## 6. Documentation

- Update docs when changing behavior
- Use Mermaid for architecture diagrams
- Keep `docs/architecture.md` current with actual folder structure
- Add ADR entries for significant decisions
- Document public APIs with JSDoc

---

## 7. Testing

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run specific file
pnpm test -- path/to/test.test.ts

# With coverage
pnpm test -- --coverage
```

- Write tests for new code
- Update tests when behavior changes
- Aim for high coverage in business logic
- Components need at least smoke tests

---

## 8. Review Process

1. Code is reviewed by at least one maintainer
2. Review focuses on:
   - Correctness and edge cases
   - Adherence to clean architecture
   - Test coverage
   - Documentation
   - No hard-coded values (colors, API keys)
   - No business logic in components
3. All CI checks must pass before merge

---

## 9. Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full build and test suite
4. Create GitHub release with tag
5. Deploy web app
6. Submit extension update to Chrome Web Store

---

## 10. AI Coding Agent Integration

This codebase is designed to be **AI coding agent-friendly**. The repository includes a **CodeGraph** index (`.codegraph/`) that provides pre-computed structural knowledge — symbol search, caller/callee analysis, and blast radius computation.

### Key Conventions for AI Agents

| Rule | Rationale |
|------|-----------|
| Never import from `packages/` directly in components | Use hooks and services as intermediaries |
| Never call IndexedDB directly from components | Use repository pattern |
| Never hard-code API keys | User-provided, stored in localStorage |
| Never place shared logic in `apps/` | Belongs in `packages/` for reuse by extension |
| Never skip Zod validation at data boundaries | Prevents data corruption |
| Never import React into `packages/` domain code | Keeps domain logic framework-agnostic |

### Before Submitting Changes

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test:unit` passes
- [ ] No new `any` types introduced
- [ ] Data boundaries are validated with Zod schemas
- [ ] New features follow the feature module pattern
- [ ] Shared logic is placed in `packages/`, not in `apps/`
- [ ] No React imports in domain packages
- [ ] Layer dependency rules are respected

See the full [AI Coding Agent Guide](ai-agent.md) for detailed workflows, CodeGraph commands, and architecture rules.

---

## 11. Getting Help

- Open a [GitHub Issue](https://github.com/<your-username>/ielts-journey/issues)
- Check [Troubleshooting Guide](troubleshooting.md)
- Review existing documentation in `docs/`
