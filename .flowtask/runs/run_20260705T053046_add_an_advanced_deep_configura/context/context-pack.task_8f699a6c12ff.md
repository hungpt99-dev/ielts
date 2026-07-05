# FlowTask Context Pack

## Original User Prompt

Add an advanced **Deep Configuration System** for IELTS Journey.

The goal is to let users customize IELTS Journey deeply based on their own learning style, AI preferences, study goals, and privacy needs.

Users should be able to configure how the AI Tutor works, which AI provider to use, how strict or friendly the tutor should be, how exercises are generated, how feedback is given, and how much automation the system should perform.

The configuration should make IELTS Journey feel flexible, powerful, and personal for each learner.

Key configuration ideas:

* AI provider selection
* Custom AI API key
* AI model selection
* AI response language
* AI tutor personality
* AI explanation style
* AI correction strictness
* AI exercise difficulty
* AI feedback depth
* AI study reminder frequency
* AI automation level
* Daily study time
* Target IELTS band
* Exam date
* Weak skill priority
* Preferred learning topics
* Vocabulary review settings
* Speaking feedback settings
* Writing correction settings
* Privacy and data usage settings

Users should be able to choose between built-in AI and their own AI provider, such as OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Groq, local AI, or custom API-compatible providers.

Example AI provider settings:

* Provider name
* API key
* Base URL
* Model name
* Temperature
* Max tokens
* System prompt
* Cost limit
* Usage limit
* Fallback provider

The system should also support different AI Tutor modes:

* Friendly tutor
* Strict IELTS examiner
* Simple English teacher
* Vietnamese explanation tutor
* Motivation coach
* Grammar-focused tutor
* Vocabulary-focused tutor
* Writing correction tutor
* Speaking practice tutor

The purpose of this feature is to give users full control over their IELTS learning experience, while still keeping the app simple for normal users.

There should be two levels of settings:

1. **Basic Settings**
   For normal users who only want to set target band, exam date, language, tutor style, and study time.

2. **Advanced Settings**
   For power users who want to configure AI provider, model, API key, prompt behavior, generation quality, cost control, and automation level.

The feature should help IELTS Journey become more customizable, more powerful, and more suitable for different types of learners.


## Current Task

### Add Unit and Integration Tests for Configuration System in tests/configuration/

Write comprehensive unit tests for configuration data models, state management, storage utilities, and UI components. Add integration tests to verify configuration persistence and AI Tutor integration. Cover edge cases and validation errors.

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

- Design Configuration Data Models in src/features/configuration/models.ts (done)
- Implement Configuration State Management in src/features/configuration/configSlice.ts (done)
- Create Basic Settings UI Component in src/features/configuration/components/BasicSettingsForm.tsx (done)
- Create Advanced Settings UI Component in src/features/configuration/components/AdvancedSettingsForm.tsx (done)
- Integrate Configuration UI into Settings Page in src/features/settings/SettingsPage.tsx (done)
- Implement Persistent Storage for User Configuration in src/features/configuration/storage.ts (done)
- Extend AI Tutor Service to Use User Configuration in packages/ai-tutor/src/aiTutorService.ts (done)

## Acceptance Criteria

- All configuration modules have unit tests with >80% coverage
- Integration tests verify end-to-end configuration usage
- Tests cover validation, error handling, and edge cases

## Validation Commands

```bash
pnpm test -- --coverage
```

## Expected Outputs

- **Create** `tests/configuration/configModels.test.ts`
  - Unit tests for configuration data models
  - Validation: file_exists

- **Create** `tests/configuration/configSlice.test.ts`
  - Unit tests for configuration state management
  - Validation: file_exists

- **Create** `tests/configuration/storage.test.ts`
  - Unit tests for configuration persistent storage
  - Validation: file_exists

- **Create** `tests/configuration/BasicSettingsForm.test.tsx`
  - UI tests for BasicSettingsForm component
  - Validation: file_exists

- **Create** `tests/configuration/AdvancedSettingsForm.test.tsx`
  - UI tests for AdvancedSettingsForm component
  - Validation: file_exists

- **Create** `tests/integration/configurationIntegration.test.ts`
  - Integration tests for configuration persistence and AI Tutor usage
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
