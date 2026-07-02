# README & Documentation Improvement Analysis

> Analysis of current README.md and docs/ files for updates needed to align with software industry standards, project features, code structure, and AI coding agent usage.

---

## 1. README.md

### 1.1 Structural & Inaccuracies

| # | Issue | Detail |
|---|-------|--------|
| 1 | **Scripts mismatch** | Lists `pnpm dev`, `pnpm dev:vite`, `pnpm kill:dev` but actual `package.json` has no such scripts. Real scripts: `pnpm dev:web`, `pnpm build`, `pnpm build:web`, `pnpm build:extension`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, etc. |
| 2 | **Wrong project structure** | Describes `src/` and `features/` as separate root-level directories. In reality, features live under `apps/web/src/features/`. The `features/` directory at repo root does not exist. |
| 3 | **Non-existent packages** | Lists `packages/types`, `packages/config`, `packages/import-export`, `packages/testing` — none of these exist. Types, config, import/export logic live inside existing packages (`packages/storage`, `packages/content`, `packages/utils`). |
| 4 | **Missing packages** | `packages/ai-tutor` (package name `@ielts/ai-tutor`) exists but is not listed in the tech stack or packages overview. |
| 5 | **Outdated monorepo layout** | Section shows features like `ai-tutor`, `dashboard`, `vocabulary` etc. under root `features/` and `src/` as web app source — actual layout is `apps/web/src/features/` containing all features. |
| 6 | **No project status/version badge** | No badges (build, license, version) — standard for OSS industry practice. |
| 7 | **No AI coding agent section** | Missing instructions for AI coding agents (e.g., opencode, Cursor, Copilot) on how to work with the codebase (architecture conventions, testing, linting). |
| 8 | **No CHANGELOG or CONTRIBUTING links** | References no changelog; contribution links point to `docs/contribution-guide.md` but root-level `CONTRIBUTING.md` and `CHANGELOG.md` are absent (industry conventions). |
| 9 | **No environment setup section** | No `.env.example` or environment variable configuration guide. |
| 10 | **No CI/CD status badge** | No link to CI pipeline or status. |

### 1.2 Missing Content (Industry Standard Sections)

| Section | Description |
|---------|-------------|
| **Quick Start (minimal)** | Should provide a single-block copy-paste to get running (clone, install, dev). |
| **Project Status** | Indicate maturity level, active development, or stable release. |
| **Configuration** | Document env variables, TypeScript strict mode implications, build configuration. |
| **FAQ / Common Questions** | Reduce troubleshooting section noise; link to full docs. |
| **Roadmap** | Show planned features or direction. |
| **Support Channels** | How to get help (issues, discussions, etc.). |

---

## 2. docs/architecture.md

| # | Issue | Detail |
|---|-------|--------|
| 1 | **Duplicate section number** | Two sections numbered "9" (9. Adding a New Feature + 9. Documentation Index). |
| 2 | **Non-existent packages** | References `packages/types`, `packages/config`, `packages/import-export`, `packages/testing` — none exist. |
| 3 | **Missing `packages/ai-tutor`** | Not included in module dependency graph or package listing. |
| 4 | **Wrong feature location** | Section 3.2 describes `features/<feature-name>/` at root level — actual path is `apps/web/src/features/<feature-name>/`. |
| 5 | **`src/` directory outdated** | Section still references a top-level `src/` as web application source, but the app is at `apps/web/src/`. |
| 6 | **Installation instructions** | Section references `pnpm dev` which doesn't exist. |
| 7 | **Missing event pattern implementation** | Section 7.5 describes Event pattern interface but should note actual implementation location. |
| 8 | **Validation boundaries** | Section 11 references `packages/import-export/` which doesn't exist. |

---

## 3. docs/product-overview.md

| # | Issue | Detail |
|---|-------|--------|
| 1 | **Non-existent packages** | Lists `types/`, `config/`, `import-export/`, `testing/` under packages. |
| 2 | **Wrong feature location** | Section 6 lists `features/` at root level. Actual: `apps/web/src/features/`. |
| 3 | **Missing `ai-tutor` package** | Not listed. |
| 4 | **Missing features** | Section 6 omits `notes/` and `publicApiIntegration/` which exist in `apps/web/src/features/`. |
| 5 | **Outdated getting started** | References `pnpm dev` which doesn't exist. Should be `pnpm dev:web`. |

---

## 4. docs/contribution-guide.md

| # | Issue | Detail |
|---|-------|--------|
| 1 | **Non-existent packages** | Lists `types/`, `config/`, `import-export/`, `testing/` under packages. |
| 2 | **Missing `ai-tutor` package** | Not listed. |
| 3 | **Wrong feature location** | Lists `features/` at root level. |
| 4 | **`pnpm dev` reference** | Should be `pnpm dev:web`. |
| 5 | **No AI coding agent guidelines** | Missing instructions for AI agents (which packages to check, conventions, test commands). |
| 6 | **No commit hooks or lint-staged** | No documentation about pre-commit hooks or automated formatting. |
| 7 | **No issue template reference** | No mention of issue/PR templates. |
| 8 | **Release process needs update** | References `CHANGELOG.md` which doesn't exist. |

---

## 5. docs/testing-strategy.md

| # | Issue | Detail |
|---|-------|--------|
| 1 | **Non-existent packages** | References `packages/testing/` which doesn't exist — shared test utilities may live elsewhere. |
| 2 | **Config mismatch** | Section 1.1 vitest config may not match actual configs across packages. |
| 3 | **Outdated test file listing** | Section 8 lists many test files — needs verification against actual filesystem. Tests may have been added/removed. |
| 4 | **No E2E setup** | Section 2.4 lists E2E as target but no concrete setup exists (no Playwright config). |

---

## 6. AI Coding Agent Documentation

### 6.1 Missing Items

| # | What's Missing | Why Important |
|---|----------------|---------------|
| 1 | **AI agent configuration** | No `.opencode/`, `.cursorrules`, `.clinerules`, or AI agent instructions file. Agents lack knowledge of project conventions. |
| 2 | **Agent-specific README section** | No "for AI coding agents" section explaining architecture, conventions, test/lint commands. |
| 3 | **Codebase map for agents** | No summary of which packages exist, which are source vs generated, dependency rules. |
| 4 | **Testing guidance for AI** | No prompt context telling agents to run `pnpm typecheck` and `pnpm test:web` before claiming success. |
| 5 | **Architecture summary for AI context** | Agents must read entire `docs/architecture.md` to understand structure — no concise context file exists. |
| 6 | **ADRs not AI-friendly** | ADRs are detailed but not summarized for quick AI ingestion. |

### 6.2 Required Additions

- Create an AI agent instructions file (e.g., `.opencode/instructions.md` or `AGENTS.md`) containing:
  - Monorepo structure overview (actual layout)
  - Package list with purposes
  - Command reference (dev, build, test, typecheck, lint)
  - Clean Architecture dependency rules
  - Code style conventions
  - Testing requirements

---

## 7. General Documentation Gaps

| # | Gap | Files Affected |
|---|-----|---------------|
| 1 | **No docs index/landing page** | Missing `docs/README.md` or `docs/index.md` to serve as entry point. |
| 2 | **No security policy** | Missing `SECURITY.md` for vulnerability reporting. |
| 3 | **No code of conduct** | Missing `CODE_OF_CONDUCT.md` (mentioned in contribution guide but not as a standalone file). |
| 4 | **No CHANGELOG** | Referenced in release process but doesn't exist. |
| 5 | **API key storage warning** | `docs/security-privacy.md` notes API keys stored as plain text in localStorage but no mitigation timeline documented. |
| 6 | **Stale ADRs** | ADR 0001-0005 exist but no ADR for more recent decisions (e.g., why features moved under `apps/web/src/`). |

---

## 8. Summary of Priority Actions

| Priority | Action | Files |
|----------|--------|-------|
| **P0** | Fix package listings to match actual codebase | README.md, product-overview.md, architecture.md, contribution-guide.md |
| **P0** | Fix feature directory paths | README.md, architecture.md, product-overview.md |
| **P1** | Fix script references (pnpm dev → pnpm dev:web) | README.md, architecture.md, product-overview.md, contribution-guide.md |
| **P1** | Create AI agent instructions file | New file (e.g., `AGENTS.md`) |
| **P1** | Add AI coding agent section to README | README.md |
| **P2** | Fix duplicate section numbering in architecture.md | architecture.md |
| **P2** | Add missing `packages/ai-tutor` to all docs | README.md, architecture.md, product-overview.md, contribution-guide.md |
| **P2** | Update testing-strategy.md to reflect actual test files | testing-strategy.md |
| **P3** | Add OSS-standard files (CHANGELOG, SECURITY, CODE_OF_CONDUCT) | New files |
| **P3** | Create docs index page | New file `docs/README.md` |
