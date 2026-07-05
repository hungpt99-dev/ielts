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

### Implement Configuration State Management in src/features/configuration/configSlice.ts

Create a Redux slice or equivalent state management module to hold user configuration state, including actions and reducers for updating basic and advanced settings. Initialize with default values and support loading/saving from persistent storage.

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

## Acceptance Criteria

- State slice manages all configuration options
- Actions exist to update individual settings and reset to defaults
- Initial state matches default configuration values

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/features/configuration/configSlice.ts`
  - Redux slice managing user configuration state with actions and reducers
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
