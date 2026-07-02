# Plan: Refactor IELTS Journey repo into clean pnpm monorepo

## Summary

Incrementally refactor the repo structure, move apps and packages, update configs and scripts, and validate correctness

## Tasks

1. Move main web app source from root src/ to apps/web/src/
2. Move Chrome extension source to apps/extension/ (depends on: Move main web app source from root src/ to apps/web/src/)
3. Remove top-level features folder and relocate contents to packages (depends on: Move Chrome extension source to apps/extension/)
4. Create packages folders and move shared reusable logic accordingly (depends on: Remove top-level features folder and relocate contents to packages)
5. Update all import paths and path aliases for moved files (depends on: Create packages folders and move shared reusable logic accordingly)
6. Update Vite config files for apps web and extension (depends on: Update all import paths and path aliases for moved files)
7. Update package.json names and scripts in all apps and packages (depends on: Update Vite config files for apps web and extension)
8. Update pnpm-workspace.yaml to include apps and packages folders (depends on: Update package.json names and scripts in all apps and packages)
9. Add separate dev commands for web and extension apps in root package.json (depends on: Update pnpm-workspace.yaml to include apps and packages folders)
10. Add safe AI validation commands for typecheck, lint, test, ai, and build (depends on: Add separate dev commands for web and extension apps in root package.json)
11. Fix all broken imports, config paths, and package references after refactor (depends on: Add safe AI validation commands for typecheck, lint, test, ai, and build)
12. Run full validation: pnpm install, typecheck, lint, test, ai, and build (depends on: Fix all broken imports, config paths, and package references after refactor)