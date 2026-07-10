# Testing Strategy

> The testing approach for the IELTS Journey, covering unit, integration, and component tests.

---

## 1. Overview

The project uses **Vitest** with **Testing Library** for all tests. The strategy follows a **test pyramid** approach with heavy unit testing at the base, moderate integration testing, and targeted component testing.

**Test runner:** Vitest 3
**Environment:** jsdom
**Setup:** `src/test/setup.ts` (globals, cleanup)

### 1.1 Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'features/**/*.{test,spec}.{ts,tsx}',
      'packages/**/*.{test,spec}.{ts,tsx}',
      'apps/extension/src/**/*.{test,spec}.{ts,tsx}',
    ],
    pool: 'forks',
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
})
```

---

## 2. Test Categories

### 2.1 Unit Tests (Primary Focus)

Test pure business logic in isolation. No DOM, no database, no network.

**What we test:**
| Module | Coverage Focus | Test Count |
|--------|---------------|------------|
| `packages/learning-engine/` | All 7 services, LearningEngine orchestrator | ~8 files |
| `packages/ai/` | Adapters, client, prompt builders, response validation, caching | ~6 files |
| `packages/exercises/` | Scoring strategies, generation strategies, difficulty, review scheduling | ~5 files |
| `packages/storage/` | Repositories, backup, review service, sync service, errors | ~11 files |
| `packages/content/` | Seeding, search, import/export, user content | ~4 files |
| `packages/theme/` | Token logic, utility functions | TBD |
| `packages/utils/` | Error classes and helpers | TBD |

### 2.2 Integration Tests

Test interactions between layers — e.g., service + repository.

**What we test:**
| Test | What It Verifies |
|------|-----------------|
| Database migration | Schema upgrades work correctly |
| Repository + Service | Data flows through validation to storage |
| Import/Export | Full round-trip: export → validate → import |
| Content seeding | Seed → verify data in DB |
| Sync service | Extension ↔ web bridge protocol |

### 2.3 Component Tests (React)

Test UI components with user interactions.

**What we test:**
| Category | Examples |
|----------|---------|
| Shared UI | Button, Card, Toast |
| AI Tutor | ChatBubble, ChatIcon, ChatWidget, QuickActions, ProactiveMessagePreview |
| Feature hooks | useProactiveMessages |
| Extension | saveSelectedText |

### 2.4 E2E Tests (Target)

End-to-end tests for critical user flows (using Playwright or similar):

| Flow | Description |
|------|-------------|
| **Onboarding** | First-run → seed data → reach dashboard |
| **Add vocabulary** | Form → validate → save → display in list |
| **Generate exercise** | Select skill → generate → answer → score |
| **Save mistake** | Form → save → appear in mistake notebook |
| **Export/import backup** | Export → validate JSON → import → verify |
| **Open AI Tutor chat** | Click icon → see messages → send message |
| **Extension save text** | Select text → right-click → save → verify in DB |

---

## 3. Test Patterns

### 3.1 Repository Tests

Use `fake-indexeddb` to simulate IndexedDB without a browser:

```typescript
import 'fake-indexeddb/auto'
import { getDb, resetDb } from '../db'

beforeEach(async () => {
  await resetDb()
})

test('creates and reads vocabulary', async () => {
  const repo = new VocabularyRepository()
  const created = await repo.create({ word: 'analyze', meaning: '...' })
  const found = await repo.findById(created.id)
  expect(found?.word).toBe('analyze')
})
```

### 3.2 Service Tests

Mock repository interfaces to test service logic in isolation:

```typescript
const mockRepo = {
  findAll: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockImplementation((input) => ({ id: '1', ...input })),
}

const service = new VocabularyService(mockRepo)
```

### 3.3 Component Tests

Use Testing Library for user-centric testing:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('renders vocabulary card', async () => {
  render(<VocabularyCard word={mockWord} />)
  expect(screen.getByText('analyze')).toBeInTheDocument()
})

test('toggles meaning visibility on click', async () => {
  render(<VocabularyCard word={mockWord} />)
  await userEvent.click(screen.getByText('analyze'))
  expect(screen.getByText('to examine carefully')).toBeVisible()
})
```

### 3.4 AI Response Tests

Test Zod schema validation of AI responses:

```typescript
test('validates AI response schema', () => {
  const valid = vocabularyDetailsSchema.safeParse(aiResponse)
  expect(valid.success).toBe(true)
})

test('rejects invalid AI response', () => {
  const invalid = vocabularyDetailsSchema.safeParse({ badData: true })
  expect(invalid.success).toBe(false)
})
```

---

## 4. Test Coverage Goals

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| Learning Engine services | 90%+ | High |
| AI prompt builders & validators | 90%+ | High |
| Storage repositories | 85%+ | High |
| Exercise scoring strategies | 95%+ | High |
| Import/Export logic | 85%+ | High |
| Content seeding | 80%+ | Medium |
| React components | 70%+ | Medium |
| Extension content scripts | 60%+ | Low |

---

## 5. Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Watch mode
pnpm test:watch

# Run specific test file
pnpm test -- packages/learning-engine/src/__tests__/profile.test.ts

# Run with coverage
pnpm test -- --coverage
```

### 5.1 CI Integration

Tests run in CI on every push:
1. `pnpm install`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`

---

## 6. Testing Utilities

The `packages/testing/` package provides shared test utilities:

- **Factory functions:** Create mock entities (vocabulary words, exercises, mistakes)
- **Mock repositories:** Pre-built mock implementations of all repository interfaces
- **Test DB setup:** Helper to initialize fake IndexedDB for integration tests
- **AI mock server:** Mock HTTP server for AI adapter tests

---

## 7. Writing New Tests

### 7.1 File Convention

Test files sit next to the code they test:

```
packages/<name>/src/<module>.ts
packages/<name>/src/__tests__/<module>.test.ts
```

Or for features:

```
features/<name>/tests/<Component>.test.tsx
```

### 7.2 What to Test

- **Pure functions:** Test all code paths, edge cases, error states
- **Validation:** Test valid and invalid inputs to Zod schemas
- **Components:** Test user interactions, loading states, empty states, error states
- **Hooks:** Test state transitions, side effects, cleanup
- **Repositories:** Test CRUD operations, validation, error handling

### 7.3 What NOT to Test

- Implementation details (internal state, private methods)
- Third-party library behavior
- Configuration files
- CSS/styling

---

## 8. Current Test Files

```
packages/storage/src/__tests__/
├── repositories.test.ts
├── backup.test.ts
├── errors.test.ts
├── migrations.test.ts
├── reviewService.test.ts
├── syncService.test.ts
├── ...

packages/ai/src/__tests__/
├── adapters.test.ts
├── client.test.ts
├── errors.test.ts
├── prompts.test.ts
├── services.test.ts
├── utils.test.ts

packages/learning-engine/src/__tests__/
├── LearningEngine.test.ts
├── ProfileService.test.ts
├── ProgressService.test.ts
├── WeaknessDetection.test.ts
├── ReviewScheduler.test.ts
├── DailyPlanService.test.ts
├── NextBestAction.test.ts
├── AnalyticsService.test.ts

packages/exercises/src/__tests__/
├── difficulty.test.ts
├── generationStrategies.test.ts
├── generationStrategies.ai.test.ts
├── reviewScheduler.test.ts
├── scoringStrategies.test.ts

packages/content/src/__tests__/
├── importExport.test.ts
├── search.test.ts
├── seeding.test.ts
├── userContent.test.ts

features/ai-tutor/tests/
├── ChatBubble.test.tsx
├── ChatIcon.test.tsx
├── ChatWidget.test.tsx
├── QuickActions.test.tsx
├── useProactiveMessages.test.ts
├── messageStorage.test.ts
├── proactiveEventBus.test.ts
├── proactiveMessageEngine.test.ts
├── proactiveMessageService.test.ts
├── chatHelpers.test.ts

src/test/ + src/tests/
├── setup.ts
├── Button.test.tsx
├── DatabaseMigration.test.ts

apps/extension/src/__tests__/
├── saveSelectedText.test.ts
```
