Refactor the IELTS Journey repo into a clean pnpm monorepo.

Move the main web app from the root source folder into apps web.

Keep the Chrome extension inside apps extension.

Move shared reusable logic into packages.

Remove the unclear top level features folder.

Use this rule.

Apps are runnable products.

Packages are shared reusable code.

Docs are documentation.

Scripts are repo tooling.

The website should be in apps web.

The Chrome extension should be in apps extension.

AI provider logic and prompt logic should be in packages ai.

Shared AI Tutor logic should be in packages ai tutor.

Text article and transcript processing should be in packages content.

IELTS exercise generation and checking should be in packages exercises.

Study plan progress weak skill and learning logic should be in packages learning engine.

IndexedDB and local storage wrappers should be in packages storage.

Shared React components should be in packages ui.

Theme and design tokens should be in packages theme.

Generic helper functions should be in packages utils.

Update all imports and path aliases.

Update TypeScript config files.

Update Vite config files.

Update package names.

Update pnpm workspace config.

Update root package scripts.

The root package file should only orchestrate workspace commands.

Do not create a root dev command that starts every app.

Add separate dev commands for web and extension.

Use port 5173 for web.

Use port 5174 for extension.

Use strict port for both apps.

Add safe AI validation commands for typecheck lint test ai and build.

The AI agent must not run dev commands during validation.

The AI agent must not run Vite directly during validation.

The AI agent must not run watch mode commands during validation.

The AI agent must only run one time validation commands.

Limit Vitest workers for AI validation.

Make sure every app and package has correct scripts for build test lint and typecheck.

Keep the refactor incremental and safe.

Do not change product behavior.

After the refactor run pnpm install pnpm typecheck pnpm lint pnpm test ai and pnpm build.

Fix all broken imports config paths and package references.

Expected result.

The repo becomes a clean pnpm monorepo.

The website is inside apps web.

The Chrome extension is inside apps extension.

Shared reusable logic is inside packages.

Root package file is only for workspace orchestration.

AI agents can validate safely without spawning many Vite processes.

No duplicate or confusing feature locations remain.
