# FlowTask Context Pack

## Original User Prompt

Explain, simplify, and learn from any text | Collect Vocabulary: Save new words with AI enrichment | Save Selected Text: Categorize and save text from the web | Save Article: Save pages as reading materials | Video Helper: Save YouTube and video content | Start Review: 0 pending reviews | Public API: Search and import open content | I want these features to work more automatically and require less manual effort from users, without requiring too much copying and pasting.

## Current Task

### Analyze current vocabulary collection and enrichment feature

Examine the code handling vocabulary collection and AI enrichment, focusing on how new words are saved with meanings, examples, synonyms, and collocations. Identify integration points with AI explain services and storage mechanisms.

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

- Analyze current explain and simplify text feature implementations in packages/ai (done)

## Acceptance Criteria

- Detailed understanding of vocabulary collection and enrichment flow
- Identification of AI enrichment usage and storage methods

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `docs/feature-analysis/vocabulary-collection.md`
  - Documentation of vocabulary collection and AI enrichment implementation
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
