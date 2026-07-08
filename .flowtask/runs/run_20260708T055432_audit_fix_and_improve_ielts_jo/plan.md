# Plan: Audit and Improve IELTS Journey for Mobile and PWA Experience

## Summary

Audit, fix, and enhance IELTS Journey frontend for full mobile responsiveness and PWA readiness

## Tasks

1. Audit current responsive design, app shell, routes, pages, components, CSS, Tailwind config, PWA config, and storage usage
2. Fix root HTML viewport meta tag and app shell layout for mobile responsiveness (depends on: Audit current responsive design, app shell, routes, pages, components, CSS, Tailwind config, PWA config, and storage usage)
3. Fix and enhance PWA manifest and mobile meta tags for full mobile and iOS support (depends on: Fix root HTML viewport meta tag and app shell layout for mobile responsiveness)
4. Fix global page container and safe area handling with reusable responsive components (depends on: Fix and enhance PWA manifest and mobile meta tags for full mobile and iOS support)
5. Fix mobile navigation behavior with bottom navigation, hamburger drawer, and floating AI Tutor button (depends on: Fix global page container and safe area handling with reusable responsive components)
6. Fix onboarding page mobile layout with single column, large touch targets, and sticky bottom navigation (depends on: Fix mobile navigation behavior with bottom navigation, hamburger drawer, and floating AI Tutor button)
7. Fix dashboard mobile layout with single column cards and readable spacing (depends on: Fix onboarding page mobile layout with single column, large touch targets, and sticky bottom navigation)
8. Fix Today Plan page mobile width and layout with full width task cards and readable progress (depends on: Fix dashboard mobile layout with single column cards and readable spacing)
9. Fix AI Tutor mobile chat layout and floating button with accessible message bubbles and input (depends on: Fix Today Plan page mobile width and layout with full width task cards and readable progress)
10. Fix Vocabulary Notebook mobile layout and word family dropdown with clean wrapping and stacking (depends on: Fix AI Tutor mobile chat layout and floating button with accessible message bubbles and input)
11. Fix practice pages mobile layout for reading, listening, writing, speaking, grammar, and vocabulary (depends on: Fix Vocabulary Notebook mobile layout and word family dropdown with clean wrapping and stacking)
12. Fix Progress and Settings pages mobile layout with single column forms and touch friendly controls (depends on: Fix practice pages mobile layout for reading, listening, writing, speaking, grammar, and vocabulary)
13. Fix extension popup responsiveness if browser extension exists (depends on: Fix Progress and Settings pages mobile layout with single column forms and touch friendly controls)
14. Fix storage persistence and offline behavior on mobile browsers (depends on: Fix extension popup responsiveness if browser extension exists)
15. Fix accessibility issues on mobile including font sizes, color contrast, focus states, and aria labels (depends on: Fix storage persistence and offline behavior on mobile browsers)
16. Fix mobile performance issues including code splitting, lazy loading, image optimization, and virtualization (depends on: Fix accessibility issues on mobile including font sizes, color contrast, focus states, and aria labels)
17. Test all mobile viewport sizes and user flows for responsiveness and usability (depends on: Fix mobile performance issues including code splitting, lazy loading, image optimization, and virtualization)
18. Run typecheck, lint, tests, and build to verify code quality and readiness (depends on: Test all mobile viewport sizes and user flows for responsiveness and usability)
19. Generate final report summarizing mobile issues found, fixes applied, tests performed, and PWA readiness (depends on: Run typecheck, lint, tests, and build to verify code quality and readiness)