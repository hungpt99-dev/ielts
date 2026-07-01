# FlowTask Context Pack

## Original User Prompt

Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of application/octet-stream. Strict MIME type checking is enforced for module scripts per HTML spec.
manifest.webmanifest:1 Manifest: Line: 1, column: 1, Syntax error. i deploy cloudflare and then so much bug please fix all bug then sefltest

## Current Task

### Fix syntax errors in manifest.webmanifest file

Correct the syntax errors in manifest.webmanifest file by fixing JSON formatting issues at line 1, column 1. Validate the manifest file with a JSON validator and web manifest validator to ensure compliance.

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

- Investigate manifest.webmanifest syntax error (done)
- Fix Cloudflare deployment to serve JavaScript module scripts with correct MIME type (done)

## Acceptance Criteria

- manifest.webmanifest is valid JSON
- Manifest passes web manifest validation without errors

## Expected Outputs

- **Modify** `manifest.webmanifest`
  - Fix JSON syntax errors and ensure valid manifest content
  - Validation: file_content


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
