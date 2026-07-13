# Web Application Architecture

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 6 | Build tool and dev server |
| Tailwind CSS | 4 | Utility-first styling |
| React Router | 7 | Client-side routing |
| Capacitor | 8 | Native mobile wrapper |
| Dexie | 4 | IndexedDB wrapper |
| recharts | 2 | Charts and data visualization |
| vite-plugin-pwa | 1 | PWA and service worker |
| React Hook Form | 7 | Form state management |
| Zod | 4 | Schema validation |
| Lucide React | — | Icon library |

## App Initialization

```
main.tsx
  ├── registerSW() — PWA service worker
  └── createRoot → <BrowserRouter><App /></BrowserRouter>

App.tsx
  └── useEffect bootstrap sequence:
      1. initNativePlatform() — Capacitor hooks
      2. ensureDbReady() — initDb(APP_SCHEMA), retries on failure
      3. InitializeAITutorEngine() — AI tutor engine bootstrap
      4. InitializeLearningEngine() — Learning engine bootstrap
  └── Render:
      └── ErrorBoundary
          └── ThemeProvider
              └── SettingsProvider
                  └── ToastProvider
                      ├── OfflineIndicator
                      ├── PwaUpdateBanner
                      └── Routes:
                          ├── / → redirect to /dashboard or /onboarding
                          ├── /landing → LandingPage
                          ├── /onboarding → OnboardingPage (9 steps)
                          └── /* → AppLayout (sidebar + routes)
```

## Layout Structure

```
AppLayout (apps/web/src/components/Layout.tsx)
├── Headbar (top bar with title + actions)
├── Sidebar (desktop: NavLinks for all routes)
├── MobileBottomNavigation (@ielts/ui)
├── ChatIcon (floating AI tutor trigger)
└── <Routes> (lazy-loaded pages):
    ├── /dashboard → Dashboard
    ├── /roadmap → FullStudyRoadmapPage
    ├── /vocabulary → NotebookPage
    ├── /review → VocabularyReview
    ├── /review-center → ReviewCenter
    ├── /reading → ReadingPracticePage
    ├── /listening → ListeningPracticePage
    ├── /writing → WritingPracticePage
    ├── /speaking → SpeakingPracticePage
    ├── /grammar → GrammarExercisePage
    ├── /mistakes → MistakeNotebook
    ├── /mock-tests → MockTests
    ├── /topics → TopicsProgress
    ├── /progress → Progress
    ├── /artifacts → ArtifactsPage
    ├── /search → SearchPage
    ├── /books → BooksPage
    ├── /public-api → PublicApiImportPage
    ├── /settings → Settings
    ├── /settings/ai → AIProviderSettingsPage
    ├── /settings/data → DataManagement
    ├── /settings/extension → ExtensionConnectionPage
    ├── /import-export → ImportExport
    ├── /info → PublicTabPage
    └── /privacy → PrivacyPage
```

## Key Architecture Decisions

### PWA

- Service worker registered via `vite-plugin-pwa` in `main.tsx`
- Update detection via `pwa-update-available` custom event → `PwaUpdateBanner`
- Offline ready detection via `pwa-offline-ready` event → `OfflineIndicator`

### Context Providers

- **ThemeProvider** (`@ielts/theme`): CSS variable management, light/dark mode
- **SettingsProvider** (`apps/web/src/context/SettingsContext.tsx`): User settings (band goal, AI provider, schedule, notifications, etc.) read from localStorage
- **ToastProvider**: Global notification toasts

### Error Handling

- `ErrorBoundary` wraps the entire app tree, catching render errors gracefully
- DB init failures show a persistent banner (not a blocking error screen)
- AI tutor and learning engine failures are non-blocking (caught silently, `engineBootstrap` returns null)

### Lazy Loading

All page components are loaded with `React.lazy()` + `Suspense` to keep the initial bundle small. Loading state shows `LoadingSpinner`.

### Mobile Adaptations

- `SafeAreaContainer` handles iOS notch/home indicator via `env(safe-area-inset-*)`
- `MobileBottomNavigation` replaces sidebar on small screens
- Capacitor plugins: **App** (back button handling), **Haptics** (haptic feedback), **Keyboard** (keyboard avoidance), **SplashScreen**, **StatusBar**
- `useNativeBackButton` and `useNativeAppState` hooks manage platform-specific behavior
- `initNativePlatform` detects Capacitor runtime for conditional rendering

### Feature Organization

Each feature lives in `src/features/<name>/` with its own components, services, hooks, and tests. Cross-feature communication happens via `LearningEventBus` (singleton event emitter). The `engineBootstrap.ts` wires both domain engines with IndexedDB adapters and makes them available globally via getter functions.
