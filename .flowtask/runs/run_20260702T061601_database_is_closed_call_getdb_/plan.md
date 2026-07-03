# Plan: Fix 'Database is closed' error by ensuring proper DB connection management

## Summary

Investigate root cause of 'Database is closed' error and fix all occurrences by enforcing getDb() connection usage

## Tasks

1. Analyze Database connection lifecycle in apps/web/src/services/storage/Database.ts
2. Identify all usages of database access in the project to find improper getDb() calls (depends on: Analyze Database connection lifecycle in apps/web/src/services/storage/Database.ts)
3. Fix improper database usage by enforcing getDb() call before any DB access (depends on: Identify all usages of database access in the project to find improper getDb() calls)
4. Add defensive checks in Database.ts to prevent DB usage when closed (depends on: Fix improper database usage by enforcing getDb() call before any DB access)
5. Add unit tests to verify getDb() opens DB and prevents closed DB usage (depends on: Add defensive checks in Database.ts to prevent DB usage when closed)
6. Run full test suite to validate no regressions after DB connection fixes (depends on: Add unit tests to verify getDb() opens DB and prevents closed DB usage)