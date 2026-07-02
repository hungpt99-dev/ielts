# FlowTask Context Pack

## Original User Prompt

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


## Current Task

### Remove top-level features folder and relocate contents to packages

Delete the top-level features folder. Move its contents into appropriate packages according to domain: ai tutor logic to packages/ai-tutor, shared logic to packages as per rules. Remove features folder after move.

## Project Rules

## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/mode.md

# Development Mode Rules

This project is in **development** mode.

## Behavior
- Inspect the project before editing.
- Make focused, small code changes.
- Follow existing code style and project conventions.
- Do not make unrelated changes.
- Validate with lint/typecheck/test when configured.
- Do not claim success without evidence.
- Risky actions (install dependency, delete files, git push) require approval.

## Validation
- Code validation is enabled by default.
- Run configured quality commands when available.
- Validation runs serially and safely by default.
- Avoid spawning many test workers at once.
- Use narrow, focused test commands when possible.
- Do not run expensive full test suites repeatedly.
- Git diff may be required for changes.


## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/project.md

# Project Rules

FlowTask manages one project at a time.

## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/workflow.md

# Workflow Rules

Tasks execute sequentially by default.


## Previous Completed Tasks

- Move main web app source from root src/ to apps/web/src/ (done)
- Move Chrome extension source to apps/extension/ (done)

## Acceptance Criteria

- features folder no longer exists
- All feature code relocated into appropriate packages folders
- No duplicate or unclear feature locations remain

## Validation Commands

```bash
test ! -d features
```
```bash
test -d packages/ai-tutor
```
```bash
test ! -d features && test -d packages/ai-tutor
```

## Expected Outputs

- **Delete** `features/`
  - Top-level features folder removed
  - Validation: file_exists

- **Modify** `packages/ai-tutor/`
  - AI Tutor logic moved here
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
