# Contribution Guide

> How to contribute to the IELTS Learning Journey project.

---

## 1. Code of Conduct

This project is open to contributions from everyone. Please:
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn

---

## 2. Getting Started

### 2.1 Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8

### 2.2 Setup

```bash
# Fork and clone
git clone https://github.com/<your-username>/ielts-journey
cd ielts-journey

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 2.3 Verify Setup

```bash
# Run type check
pnpm typecheck

# Run tests
pnpm test

# Run lint
pnpm lint
```

All should pass before making changes.

---

## 3. Project Structure

```
ielts-journey/
├── apps/
│   ├── web/                # React SPA (PWA)
│   └── extension/          # Chrome extension (MV3)
├── packages/               # Shared libraries
│   ├── ui/                 # UI component library
│   ├── theme/              # Design tokens
│   ├── types/              # Domain entities & schemas
│   ├── storage/            # IndexedDB repositories
│   ├── ai/                 # AI adapters & prompts
│   ├── learning-engine/    # Business logic engine
│   ├── content/            # Built-in content
│   ├── exercises/          # Exercise system
│   ├── import-export/      # Data portability
│   ├── config/             # Constants
│   └── utils/              # Utilities
├── features/               # Feature modules
│   ├── ai-tutor/           # AI Tutor widget
│   └── ...                 # (more features)
├── src/                    # Main web app source
└── docs/                   # Documentation
```

See [architecture.md](architecture.md) for a detailed explanation.

---

## 4. Development Workflow

### 4.1 Branch Strategy

```
main          ← Production-ready code
  └── feature/*    ← New features
  └── fix/*        ← Bug fixes
  └── docs/*       ← Documentation
  └── refactor/*   ← Code improvements
```

### 4.2 Making Changes

1. Create a branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes following the conventions in [Architecture](architecture.md)

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

### 4.3 Pull Request Guidelines

- Title follows conventional commits
- Description explains the change and motivation
- References related issues
- Includes tests for new code
- All CI checks pass
- Screenshots for UI changes

---

## 5. Coding Standards

### 5.1 TypeScript

- Strict mode enabled
- Avoid `any` — use proper types or `unknown`
- Use Zod schemas for all data validation at boundaries
- Prefer interfaces over type aliases for object shapes
- Use `const` assertions for literal types

### 5.2 Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `vocabulary-service.ts` |
| React components | PascalCase | `VocabularyCard.tsx` |
| Interfaces | PascalCase | `IVocabularyRepository` |
| Types | PascalCase | `VocabularyWord` |
| Functions | camelCase | `createVocabularyWord()` |
| Constants | UPPER_SNAKE | `DEFAULT_BAND_SCORE` |
| CSS classes | kebab-case | `vocab-card-title` |

### 5.3 File Organization

- One primary export per file
- Files under 300 lines
- Barrel exports in `index.ts`
- Tests co-located in `__tests__/` or `tests/`

### 5.4 React Component Structure

```typescript
// 1. Imports
import { useState } from 'react'
import type { VocabularyWord } from '@ielts/types'

// 2. Types (if not in a separate file)
interface VocabularyCardProps {
  word: VocabularyWord
  onSave: (id: string) => void
}

// 3. Component
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

### 5.5 Clean Architecture Rules

- **Components** never call IndexedDB or AI directly
- **Hooks** bridge components to services
- **Services** contain application logic and orchestration
- **Domain packages** have no framework dependencies
- **Repositories** implement domain interfaces with Zod validation

---

## 6. Adding a New Feature

1. Create `features/<feature-name>/` with:
   - `components/` — React UI
   - `hooks/` — Custom hooks
   - `services/` — Feature services
   - `schemas/` — Zod schemas
   - `types/` — Feature-specific types
   - `utils/` — Utilities
   - `tests/` — Tests

2. Add routes in `apps/web/src/router.tsx`

3. Add navigation in sidebar/headbar

4. Write tests

---

## 7. Adding a New AI Provider

1. Implement `IAiAdapter` interface
2. Create adapter in `packages/ai/src/adapters/`
3. Register in the adapter factory
4. Add provider option to settings schema
5. Write adapter tests

---

## 8. Adding a New Exercise Type

1. Add `QuestionType` to `packages/exercises/src/types.ts`
2. Implement `ScoringStrategy`
3. Register in `ScoringEngine`
4. Create UI renderer in `features/exercises/components/`
5. Write tests

---

## 9. Adding New Built-in Content

1. Create file in `packages/content/src/built-in/`
2. Add content array with proper IDs
3. Register in `built-in/index.ts`
4. Add schema in `packages/content/src/schemas.ts`
5. Update seeding logic if needed
6. Write tests

---

## 10. Documentation

- Update docs when changing behavior
- Use Mermaid for architecture diagrams
- Keep `docs/architecture.md` current with actual folder structure
- Add ADR entries for significant decisions
- Document public APIs with JSDoc

---

## 11. Testing

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

## 12. Review Process

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

## 13. Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full build and test suite
4. Create GitHub release with tag
5. Deploy web app
6. Submit extension update to Chrome Web Store

---

## 14. Getting Help

- Open a [GitHub Issue](https://github.com/<your-username>/ielts-journey/issues)
- Check [Troubleshooting Guide](troubleshooting.md)
- Review existing documentation in `docs/`
