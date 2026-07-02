# IELTS Learning Journey — Product Overview

> A local-first, offline-capable IELTS preparation system that runs entirely in the browser with no backend required.

---

## 1. What It Is

IELTS Learning Journey is a comprehensive study tool for IELTS exam preparation. It helps learners manage vocabulary, practice all four IELTS skills (Reading, Listening, Writing, Speaking), track mistakes, monitor progress, and optionally use AI for feedback — all while keeping data private and local.

### Core Philosophy

- **Local-first**: All data lives in your browser. You own it.
- **Privacy-safe**: No cloud, no telemetry, no data leaving your device unless you explicitly use AI features with your own API key.
- **Offline-capable**: Works without internet for core features. AI features require internet but are entirely optional.
- **Production quality**: Built with clean architecture, strong typing, and industry-standard design patterns.

---

## 2. Key Features

| Feature | Description |
|---------|-------------|
| **Vocabulary Management** | Add, tag, filter, and review words with SM-2 spaced repetition |
| **Reading Practice** | Log reading sessions, track comprehension, save passages |
| **Listening Practice** | Log listening sessions, track scores, save transcripts |
| **Writing Practice** | Practice Task 1 & 2 essays, track band estimates |
| **Speaking Practice** | Log speaking sessions across Parts 1-3 |
| **Grammar Notes** | Organize grammar topics with examples and corrections |
| **Mistake Notebook** | Record and review mistakes with correction tracking |
| **Mock Test Tracker** | Log mock test band scores and track progress over time |
| **Daily Study Plan** | Plan and track daily study tasks across all skills |
| **Progress Analytics** | Charts for study days, hours, skill balance, and band trends |
| **AI Tutor Chat** | Messenger-style AI assistant with context-aware suggestions |
| **Proactive Messages** | Local rule-based study reminders and tips |
| **Content Library** | Built-in IELTS content with versioned updates |
| **Exercise Generator** | AI-powered and rule-based exercise generation |
| **Import/Export** | Full JSON backup and restore with merge/replace modes |
| **Browser Extension** | Collect content from any webpage and save to your study database |
| **PWA Support** | Install as a standalone app, works offline |
| **Dark Mode** | Light/dark/system theme with design tokens |

---

## 3. Target Users

- **IELTS self-learners** preparing for the exam independently
- **Students** who want a structured, trackable study system
- **Privacy-conscious users** who do not want their learning data on a cloud server
- **Users with limited internet** who need offline study capability

---

## 4. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | TypeScript 5.8+ | Strict typing across the entire codebase |
| UI Framework | React 19 | Component model |
| Bundler | Vite 6 | Fast dev/build for web and extension |
| Styling | Tailwind CSS 4 + CSS custom properties | Utility-first styling with design tokens |
| Routing | React Router v7 | Client-side routing |
| Database | IndexedDB (via `idb`) | Local-first persistent storage |
| Settings | localStorage | Simple key-value settings |
| Validation | Zod 4 | Runtime schema validation |
| AI | OpenAI-compatible REST API | Optional user-provided AI integration |
| Charts | Recharts | Analytics visualizations |
| Testing | Vitest + Testing Library | Unit + integration tests |
| PWA | vite-plugin-pwa | Offline capability |
| Package Manager | pnpm | Monorepo workspace management |

---

## 5. Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  React Components · Pages · Widgets · Popups            │
├─────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                     │
│  Use Cases · Feature Services · Commands · Workflows    │
├─────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                         │
│  Entities · Business Rules · Value Objects · Interfaces │
├─────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                   │
│  IndexedDB Repos · AI Adapters · Browser APIs           │
└─────────────────────────────────────────────────────────┘
```

The application follows Clean Architecture principles with four distinct layers, organized as a pnpm monorepo. See [architecture.md](architecture.md) for details.

---

## 6. Project Structure

```
ielts-journey/
├── apps/
│   ├── web/                   # React SPA (PWA)
│   └── extension/             # Chrome extension (Manifest V3)
├── packages/
│   ├── ui/                    # Shared UI component library
│   ├── theme/                 # Design tokens & CSS variables
│   ├── types/                 # Domain entities, Zod schemas
│   ├── storage/               # IndexedDB repositories & migrations
│   ├── ai/                    # AI provider adapters & prompts
│   ├── learning-engine/       # Business rules & calculations
│   ├── content/               # Built-in content library
│   ├── exercises/             # Exercise models & strategies
│   ├── import-export/         # Backup/restore logic
│   ├── config/                # Centralized constants
│   └── utils/                 # Pure utility functions
├── features/
│   ├── ai-tutor/              # AI Tutor chat widget
│   ├── dashboard/             # Dashboard overview
│   ├── vocabulary/            # Vocabulary management
│   ├── reading/               # Reading practice
│   ├── listening/             # Listening practice
│   ├── writing/               # Writing practice
│   ├── speaking/              # Speaking practice
│   ├── grammar/               # Grammar notes
│   ├── mistakes/              # Mistake notebook
│   ├── exercises/             # Exercise system
│   ├── content-library/       # Content library
│   ├── analytics/             # Progress analytics
│   ├── settings/              # App settings
│   ├── planner/               # Daily study planner
│   ├── onboarding/            # First-run onboarding
│   └── import-export/         # Import/export UI
├── docs/                      # Documentation
└── (config files)
```

---

## 7. Data Flow

```
User Input → React Component → Custom Hook → Feature Service
    → Repository Interface → IndexedDB Repository → IndexedDB
```

Data flows unidirectionally. Components never call the database or AI directly. All business logic lives in services and domain packages.

---

## 8. AI Integration

AI is entirely optional and user-controlled:

1. User provides their own OpenAI-compatible API key
2. Key is stored locally in `localStorage` or `chrome.storage.local`
3. All AI requests go directly from the browser to the configured API endpoint
4. No user data is ever sent to any third-party service except the user-configured AI endpoint
5. Users can configure custom base URL, model, temperature, and max tokens

See [ai-architecture.md](ai-architecture.md) for details.

---

## 9. Privacy & Security

- **No backend**: All data stays in the browser
- **No telemetry**: No analytics, no tracking, no data collection
- **No hard-coded API keys**: Keys are user-provided and stored locally
- **No data exfiltration**: Data is only sent to the user-configured AI endpoint
- **Full data control**: Export, import, and delete data at any time
- **Minimal extension permissions**: Only what is needed for core functionality

See [security-privacy.md](security-privacy.md) for details.

---

## 10. Getting Started

```bash
# Prerequisites: Node.js >= 18, pnpm >= 8

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open in browser
open http://localhost:5173

# Build for production
pnpm build
```

See [deployment.md](deployment.md) for build and deployment instructions.
