# FlowTask Context Pack

## Original User Prompt

Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of application/octet-stream. Strict MIME type checking is enforced for module scripts per HTML spec.
manifest.webmanifest:1 Manifest: Line: 1, column: 1, Syntax error. i deploy cloudflare and then so much bug please fix all bug then sefltest

## Current Task

### Add automated self-test script for deployment validation

Create a shell script named scripts/selftest.sh that performs automated checks for MIME type correctness of JavaScript module scripts and manifest syntax validation by fetching relevant URLs and checking headers and content. The script should output pass/fail results for each check.

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
- Fix syntax errors in manifest.webmanifest file (done)
- Test Cloudflare deployment after MIME type and manifest fixes (done)

## Acceptance Criteria

- Self-test script exists and is executable
- Script checks MIME type of JS modules and manifest validity
- Script outputs clear pass/fail results

## Validation Commands

```bash
sh scripts/selftest.sh
```

## Expected Outputs

- **Create** `scripts/selftest.sh`
  - Shell script to validate MIME types and manifest correctness in deployment
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
