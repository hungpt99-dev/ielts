# FlowTask Context Pack

## Original User Prompt

Implement a feature called **AI Study Plan Generator from Today to Exam Day** for IELTS Journey.

The goal is to generate a complete IELTS study plan from today until the user’s exam day, even when the AI model cannot generate the full plan in one response.

For example, if the user has 30 days until the exam but the AI can only generate 3 days at a time, the system must automatically continue generating the remaining days until all 30 days are created.

The user should not need to manually ask AI again and again.

## Main Requirement

AI must generate a complete daily study plan from today to the exam date.

The final result must include every day in the range.

There must be:

* No missing days
* No duplicate days
* No random date jumps
* No stopping after only a few days

## User Inputs

The user can configure:

* Current IELTS band
* Target IELTS band
* Exam date
* Available study time per day
* Preferred study days
* Rest days
* Weak skills
* Strong skills
* Main focus skills
* Study intensity
* Preferred language
* Whether to include mock tests
* Whether to include vocabulary review
* Whether to include grammar review
* Whether to include weekly progress review
* Whether to include final exam preparation week

## Plan Generation Logic

The system should calculate:

* Today’s date
* Exam date
* Total number of days
* Number of study days
* Number of rest days
* Number of weeks
* Final review period
* Mock test schedule
* Skill priority

The AI should generate the plan in chunks instead of trying to generate the full plan in one response.

For example:

* First AI call generates days 1 to 3
* Second AI call generates days 4 to 6
* Third AI call generates days 7 to 9
* The system continues until every day is generated

The chunk size should be flexible depending on the selected AI model.

Small models can generate fewer days per call. Larger models can generate more days per call.

## Important Loop Behavior

The system should:

1. Create a high-level study strategy first.
2. Calculate all required dates from today to exam day.
3. Start with an empty daily plan.
4. Ask AI to generate the next missing chunk.
5. Validate the AI response.
6. Save valid generated days.
7. Detect missing or invalid days.
8. Continue generating the next missing days.
9. Stop only when every date from today to exam day has a valid daily plan.
10. Return the complete plan to the user.

The system must not trust AI blindly.

After every AI response, validate:

* Correct date
* Correct day number
* Correct phase
* Correct estimated study time
* Required tasks exist
* No duplicate dates
* No skipped dates
* No invalid response format
* No plan beyond exam date
* No plan before today

If validation fails, retry only the broken or missing days.

## AI Generation Strategy

Do not ask AI to generate the whole long plan in one response.

Use AI in two steps.

## Step 1: Generate Global Study Strategy

AI should first create a high-level roadmap with:

* Plan summary
* Phase breakdown
* Main focus for each phase
* Weekly goals
* Mock test schedule
* Final week strategy
* Adjustment rules

Example phases:

* Foundation Phase
* Skill Improvement Phase
* Weakness Fixing Phase
* Mock Test Phase
* Final Review Phase

## Step 2: Generate Daily Plan in Chunks

After the global strategy is created, generate daily plans chunk by chunk.

Each AI chunk request should include:

* User profile
* Target band
* Exam date
* Total days
* Global strategy
* Already generated days summary
* Current chunk start date
* Current chunk end date
* Required day numbers
* Required exact dates
* Skill balance rules
* Previous chunk summary

The AI must only generate the requested date range.

For example:

Generate only Day 4 to Day 6. Do not generate Day 1 to Day 3 again. Do not generate Day 7 or later.

## Daily Plan Content

Each day should include:

* Date
* Day number
* Week number
* Phase name
* Main goal
* Listening task
* Reading task
* Writing task
* Speaking task
* Vocabulary task
* Grammar task
* Review task
* Estimated minutes
* Priority
* Difficulty level
* Completion checklist
* AI Tutor note

## Missing Day Recovery

If the AI skips some days or returns invalid data, the system should generate only the missing or invalid dates.

The system should not regenerate or overwrite valid existing days unless the user explicitly chooses to regenerate the full plan.

## Validation Rules

After each AI response, validate the result.

The system must check:

* The response is valid
* Every required date exists
* No extra date exists
* No duplicate date exists
* Date format is valid
* Day number is correct
* Week number is correct
* Tasks are not empty
* Estimated minutes is reasonable
* Phase is valid
* Priority is valid
* Difficulty is valid

If validation fails:

* Retry the chunk
* Or ask AI to regenerate only invalid days
* Do not discard the whole completed plan if only a few days are broken

## Storage Requirements

Because IELTS Journey is currently frontend-only, store the generated plan locally first.

Use local-first storage for full daily plan data.

Each plan and daily item should have stable IDs, created date, updated date, and status.

Each daily plan should support these statuses:

* Not started
* In progress
* Completed
* Skipped
* Partially completed

Later, this data should be ready for backend sync.

## User Experience

The user should see progress while the plan is being generated.

Example progress messages:

* Creating global study strategy
* Generating days 1 to 3 of 30
* Generating days 4 to 6 of 30
* Checking missing days
* Finalizing your IELTS study plan

If generation fails halfway, the system should not lose completed chunks.

The user should be able to:

* Continue generation
* Retry failed chunk
* Regenerate full plan
* Edit daily plan
* Mark day as completed
* Mark day as skipped
* Adjust the remaining plan
* Ask AI Tutor why a task was recommended

## Important UX Rule

Do not show only 3 days if the exam plan needs 30 days.

If only 3 days are generated, clearly show that the plan is still incomplete and continue generating the remaining days automatically.

The final state should be shown only when all days are generated and validated.

## Best Practice Requirements

* Do not generate the entire plan in one AI call for long plans
* Use chunk generation
* Use validation after each chunk
* Use retry logic
* Use missing-day repair logic
* Prevent duplicate days
* Prevent skipped dates
* Keep generated chunks consistent with the global strategy
* Save progress during generation
* Support cancel and resume
* Support local-first storage
* Prepare for future backend sync
* Keep code clean, typed, and production-ready
* Do not hard-code fake daily plans
* Do not create random placeholder data
* Do not let AI overwrite valid existing days by accident

## Final Goal

The feature should behave like a real IELTS tutor creating a complete roadmap.

If the user has 30 days before the exam, the system must generate all 30 days.

If AI only returns a few days at a time, the app must automatically continue until the full study plan is complete.

The user should receive a complete, editable, personalized daily IELTS study plan from today to exam day.


## Current Task

### Implement AI Tutor Note Feature for Daily Plan Items

Add support in daily plan item model and UI to include AI Tutor notes explaining why a task was recommended. Extend daily plan item type and update `DailyPlanList.tsx` to display AI Tutor notes. Provide a button to ask AI Tutor for explanation on any task, triggering an AI call and showing the response inline.

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

- Define TypeScript Types for Study Plan and User Profile (done)
- Implement Utility Functions to Calculate Date Ranges and Plan Metrics (done)
- Design and Implement Global Study Strategy Generator Service (done)
- Implement Local-First Storage Layer for Study Plan Data (done)
- Implement AI Chunked Daily Plan Generator Service (done)
- Implement Validation Logic for AI Responses and Daily Plan Data (done)
- Implement Study Plan Generation Orchestrator with Chunked AI Calls and Validation (done)
- Create React Context and Hooks for Study Plan State Management (done)
- Implement Daily Plan List React Component with Progress and Status Display (done)
- Implement Progress Messaging and User Feedback UI During Plan Generation (done)
- Implement User Controls for Plan Generation: Cancel, Resume, Retry, Regenerate (done)

## Acceptance Criteria

- Daily plan items include AI Tutor note field
- UI displays AI Tutor notes clearly
- User can request AI Tutor explanation per task
- AI call returns explanation and updates UI

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/features/studyPlan/types.ts`
  - Add AI Tutor note field to daily plan item type
  - Validation: file_diff

- **Modify** `src/features/studyPlan/components/DailyPlanList.tsx`
  - Display AI Tutor notes and add button to request explanations
  - Validation: file_diff

- **Modify** `src/features/studyPlan/services/dailyPlanService.ts`
  - Add AI Tutor explanation call logic
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
