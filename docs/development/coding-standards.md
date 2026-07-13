# Coding Standards

## TypeScript

- **Strict mode** enabled in all `tsconfig.json` files. `noUnusedLocals` and `noUnusedParameters` are enforced.
- **No `any`** — lint rule `@typescript-eslint/no-explicit-any` at `warn` level. Prefer `unknown` + type narrowing.
- **Zod v4** is used for ALL storage schemas (in `@ielts/storage`) and AI response validation (in `@ielts/ai`).
- Date handling uses **ISO 8601 strings** (`new Date().toISOString()`) throughout; avoid `Date` objects in entities.

## React

- **Function components and hooks** only. No class components except `ErrorBoundary`.
- **React Router v7** — `BrowserRouter` in `apps/web`, `MemoryRouter` in `apps/extension`.
- Components are **PascalCase**; functions and variables are **camelCase**.
- Hooks follow `use*` naming convention. Custom hooks return plain objects, not tuples.

## Error Handling

- Use `try/catch` with meaningful fallbacks. Silent failures (`catch {}`) are only allowed with `no-empty` allowEmptyCatch.
- AI calls never `fetch()` directly — always route through `@ielts/ai`'s `callAI` or engine wrappers.
- Error types: `AIError`, `AIAuthError`, `AIRateLimitError`, `AINetworkError`, `AIEmptyResponseError`, `AIConfigError` (all in `@ielts/ai`).
- The `AICallResult` pattern (`{ content, error }`) is preferred over exceptions for recoverable failures.
- Engine operations return `LearningOperationResult<T>` with typed success/error branches.

## Architecture

- **Repository pattern** for all storage access. Repositories extend `BaseRepository` from `@ielts/storage`.
- **AI calls through `@ielts/ai` only** — never call external APIs directly from app code.
- **Engines follow hexagonal architecture** (ports-and-adapters) in `@ielts/learning-engine` and `@ielts/ai-tutor-engine`.
- **Web and extension apps are pure consumers** — they depend on engines, not the reverse.
- **Events** for cross-cutting concerns (learning events flow from engine to tutor engine).

## Testing

- **Vitest 3** with `jsdom` for web component tests.
- **fake-indexeddb** for storage tests.
- Test files live in `__tests__/` directories adjacent to source, or in `src/tests/` root.
- Per-package test commands: `pnpm --filter <package> test`.
- Workspace-wide: `pnpm ai` runs all tests with verbose reporter.

## Accessibility

- Use semantic HTML elements (`<nav>`, `<main>`, `<button>`, `<select>`, etc.).
- Interactive elements require `aria-label` if the meaning is not conveyed by text content.
- Theme tokens (`--color-*` CSS variables) control color contrast. Dark mode is supported via token switching.
- Focus management is required in `Modal` and `Drawer` components (trap focus, restore on close).
