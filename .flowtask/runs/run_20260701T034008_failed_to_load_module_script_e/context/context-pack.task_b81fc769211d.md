# FlowTask Context Pack

## Original User Prompt

Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of application/octet-stream. Strict MIME type checking is enforced for module scripts per HTML spec.
manifest.webmanifest:1 Manifest: Line: 1, column: 1, Syntax error. i deploy cloudflare and then so much bug please fix all bug then sefltest

## Current Task

### Investigate manifest.webmanifest syntax error

Examine the manifest.webmanifest file in the project root or public directory to identify syntax errors at line 1, column 1. Validate JSON syntax and ensure the manifest file conforms to web manifest specifications.

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


## Acceptance Criteria

- Syntax errors in manifest.webmanifest are identified
- Manifest file location and content are verified

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
