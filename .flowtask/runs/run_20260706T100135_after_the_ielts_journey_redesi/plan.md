# Plan: IELTS Journey Redesign Audit and Fix Plan

## Summary

Audit and fix UI inconsistencies, CSS bugs, layout issues, missing features, and modernize the IELTS Journey app and extension

## Tasks

1. Audit all routes, pages, page headers, navigation, layout wrappers, color usage, modern design consistency, and extension UI
2. Fix shared layout and container system for consistent page width and no overflow (depends on: Audit all routes, pages, page headers, navigation, layout wrappers, color usage, modern design consistency, and extension UI)
3. Create or improve shared PageTitleWithIcon component and semantic icon mapping (depends on: Fix shared layout and container system for consistent page width and no overflow)
4. Clean up color usage and reduce visual noise across all pages and extension UI (depends on: Create or improve shared PageTitleWithIcon component and semantic icon mapping)
5. Fix navigation active menu style and hamburger menu responsive behavior (depends on: Clean up color usage and reduce visual noise across all pages and extension UI)
6. Merge or remove duplicate Listening Practice UI, cards, and routes (depends on: Fix navigation active menu style and hamburger menu responsive behavior)
7. Replace progress review page with main progress page and merge AI Progress Review content (depends on: Merge or remove duplicate Listening Practice UI, cards, and routes)
8. Complete full AI Tutor page with polished chat UI and functionality (depends on: Replace progress review page with main progress page and merge AI Progress Review content)
9. Add word family dropdown to Vocabulary Notebook items and simplify list item styling (depends on: Complete full AI Tutor page with polished chat UI and functionality)
10. Fix line break and text wrapping issues across all UI elements (depends on: Add word family dropdown to Vocabulary Notebook items and simplify list item styling)
11. Restore missing functionality and remove or disable fake UI elements (depends on: Fix line break and text wrapping issues across all UI elements)
12. Fix extension popup UI and selected text menu functionality (depends on: Restore missing functionality and remove or disable fake UI elements)
13. Audit theme tokens and remove random hard coded CSS (depends on: Fix extension popup UI and selected text menu functionality)
14. Test desktop, mobile, and extension flows for responsiveness and UI consistency (depends on: Audit theme tokens and remove random hard coded CSS)
15. Run typecheck, lint, tests, and build for final validation (depends on: Test desktop, mobile, and extension flows for responsiveness and UI consistency)
16. Return final report summarizing all fixes, improvements, and remaining issues (depends on: Run typecheck, lint, tests, and build for final validation)