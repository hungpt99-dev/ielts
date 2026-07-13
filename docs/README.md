# IELTS Journey Documentation

> Documentation index  
> Last verified against source: 2026-07-13

## For new contributors

| Document | Purpose |
|----------|---------|
| [Prerequisites](getting-started/prerequisites.md) | Required tools and setup |
| [Local development](getting-started/local-development.md) | How to run the project |
| [Environment variables](getting-started/environment-variables.md) | Required and optional config |
| [Common commands](getting-started/common-commands.md) | Dev, test, build, deploy |
| [Architecture overview](architecture/overview.md) | High-level system design |
| [Monorepo structure](architecture/monorepo-structure.md) | Every package and app explained |
| [Coding standards](development/coding-standards.md) | TypeScript, React, and project conventions |
| [Testing](development/testing.md) | Test strategy and commands |

## For feature developers

| Document | Purpose |
|----------|---------|
| [Learning Engine](engine/learning-engine.md) | Session, exercise, attempt, evaluation lifecycle |
| [AI Tutor Engine](engine/ai-tutor-engine.md) | Chat, context, memory, proactive system |
| [Study Plan Engine](engine/study-plan-engine.md) | DailyPlanEngine, AiPlanOrchestrator |
| [Engine integration](engine/engine-integration.md) | How the three engines interact |
| [Learning lifecycle](engine/learning-lifecycle.md) | End-to-end learning flow |
| [Learner context](engine/learner-context.md) | Context building, freshness, scope |
| [Proactive Tutor](engine/proactive-tutor.md) | Triggers, candidates, scoring, cooldown |
| [Adding a skill module](development/adding-skill-module.md) | How to create a new skill |
| [Adding a learning feature](development/adding-learning-feature.md) | End-to-end feature guide |
| [Adding an AI provider](development/adding-ai-provider.md) | Provider-neutral adapter guide |
| [Adding a proactive trigger](development/adding-proactive-trigger.md) | Trigger policy and candidate generation |

## For maintainers

| Document | Purpose |
|----------|---------|
| [Data ownership](data/data-ownership.md) | Entity ownership table |
| [Persistence](data/persistence.md) | Repository boundaries and transactions |
| [IndexedDB/Dexie](data/indexeddb-dexie.md) | Database names, tables, migrations |
| [Migrations](data/migrations.md) | Schema version history and safety |
| [Import/Export](data/import-export.md) | Backup and restore behavior |
| [Extension storage](data/extension-storage.md) | Chrome storage and web compatibility |
| [Public API reference](reference/public-api-reference.md) | Intentionally public APIs |
| [Event reference](reference/event-reference.md) | Learning and tutor events |
| [Error reference](reference/error-reference.md) | Error categories and recovery |
| [Package reference](reference/package-reference.md) | Every workspace package |
| [Glossary](reference/glossary.md) | Terminology policy |

## For refactoring work

| Document | Purpose |
|----------|---------|
| [Current state analysis](refactoring/current-state-analysis.md) | Source-code analysis |
| [Target architecture](refactoring/target-architecture.md) | Desired architecture |
| [Gap analysis](refactoring/gap-analysis.md) | Current vs target gaps |
| [Migration plan](refactoring/migration-plan.md) | Incremental migration phases |
| [File migration map](refactoring/file-migration-map.md) | Per-file actions |
| [Risk register](refactoring/risk-register.md) | Identified risks |
| [Acceptance criteria](refactoring/acceptance-criteria.md) | Measurable completion |

## For reviewers

| Document | Purpose |
|----------|---------|
| [Architecture overview](architecture/overview.md) | Current and target architecture |
| [Dependency rules](architecture/dependency-rules.md) | Allowed dependency directions |
| [Runtime data flow](architecture/runtime-data-flow.md) | Actual flows traced through code |
| [Engine docs](engine/README.md) | All three engines with responsibility matrix |

## Terminology policy

Use consistent naming throughout documentation and code:

| Canonical term | Avoid |
|----------------|-------|
| Study Plan Engine | Plan engine, daily plan engine (when referring to the concept) |
| Learning Engine | Session engine, exercise engine |
| AI Tutor Engine | Tutor engine, AI engine |
| Learning session | Session alone (ambiguous) |
| Exercise attempt | Attempt alone (ambiguous) |
| Learning outcome | Outcome, result |
| Learner context | User context, student context |
| Tutor memory | AI memory, chat memory |
| Study roadmap | Study plan, learning roadmap |
| Proactive Tutor | Proactive AI, notifications |
| Skill module | Skill strategy, skill adapter |
| Learning event | Telemetry, analytics event |
