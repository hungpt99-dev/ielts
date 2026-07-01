# IELTS Learning Journey

A fully client-side, offline-first personal IELTS study system. Track vocabulary, reading, listening, writing, speaking, grammar, and mock tests — all in your browser with no backend required.

## Features

- **Vocabulary Management** — Add, tag, filter, and review words with spaced repetition (SM-2)
- **Skill Tracking** — Log reading, listening, writing, and speaking practice sessions
- **Daily Plan** — Plan and track daily study tasks across all IELTS skills
- **Mistake Notebook** — Record and review mistakes with correction tracking
- **Mock Test Tracker** — Log mock test scores and track band progress over time
- **Progress Analytics** — Charts and stats for study days, hours, skill balance, and band trends
- **Grammar Notes** — Organize grammar topics with examples and common mistakes
- **Global Search** — Full-text search across all your data
- **Offline-First PWA** — Works offline after initial load; data stored in IndexedDB
- **Dark Mode** — Light/dark theme toggle
- **Import/Export** — JSON import/export for backup and migration
- **AI Assistant** — Optional OpenAI-compatible API integration for feedback and suggestions

## Tech Stack

| Layer          | Choice                         |
|----------------|--------------------------------|
| Framework      | React 19                       |
| Language       | TypeScript                     |
| Build          | Vite                           |
| Styling        | Tailwind CSS 4                 |
| Routing        | React Router v7                |
| Database       | IndexedDB (via `idb`)          |
| Settings       | localStorage                   |
| Charts         | Recharts                       |
| PWA            | vite-plugin-pwa                |
| Testing        | Vitest + Testing Library       |
| Linting        | ESLint                         |
| AI (optional)  | Fetch to OpenAI-compatible API |

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8 (recommended package manager)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd ielts-journey

# Install dependencies
pnpm install
```

## Usage

```bash
# Start development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Development

### Project Structure

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Root component (Router + Layout)
├── index.css                 # Tailwind imports + global styles
├── models/                   # TypeScript interfaces & enums
├── services/                 # Data access layer (IndexedDB operations)
├── hooks/                    # Custom React hooks
├── context/                  # React contexts (theme, settings)
├── components/               # Reusable UI components
│   ├── layout/               # App shell (sidebar, header, mobile nav)
│   ├── ui/                   # Generic primitives (Card, Button, Modal, etc.)
│   ├── forms/                # Data entry forms
│   ├── charts/               # Recharts-based charts
│   ├── review/               # Spaced repetition review components
│   ├── plan/                 # Daily plan components
│   ├── vocabulary/           # Vocabulary-specific components
│   └── dashboard/            # Dashboard widgets
├── pages/                    # Route-level page components
├── utils/                    # Pure utility functions
├── pwa-config.ts             # PWA configuration
└── router.tsx                # Route definitions
```

### Scripts

| Command               | Description                        |
|-----------------------|------------------------------------|
| `pnpm dev`            | Start development server           |
| `pnpm build`          | Type-check and build for production|
| `pnpm preview`        | Preview production build           |
| `pnpm test`           | Run tests (Vitest)                 |
| `pnpm test:watch`     | Run tests in watch mode            |
| `pnpm lint`           | Lint source code (ESLint)          |
| `pnpm typecheck`      | Run TypeScript type checking       |

### Data Architecture

All user data is stored client-side:

- **IndexedDB** — Vocabulary, tasks, journal entries, mock tests, reviews, grammar notes, mistakes, and topic progress
- **localStorage** — App settings (theme, target band, API key, etc.)

Data flows through a layered architecture:

```
Component → Custom Hook → Service (IndexedDB CRUD) → idb → Browser IndexedDB
```

See [docs/architecture.md](docs/architecture.md) for detailed documentation.

## Testing

```bash
pnpm test
```

Tests use Vitest with jsdom and Testing Library for component tests.

## Linting & Type Checking

```bash
pnpm lint       # ESLint
pnpm typecheck  # TypeScript type checking (tsc --noEmit)
```

## Project Documentation

- [Architecture Overview](docs/architecture.md) — Folder structure, component hierarchy, data flow, routing
- [Database Schema](docs/schema.md) — IndexedDB stores, indexes, and TypeScript models

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes linting and tests before submitting.

## Contact

Project Link: [https://github.com/<your-username>/ielts-journey](https://github.com/<your-username>/ielts-journey)

Report bugs or suggest features via [GitHub Issues](https://github.com/<your-username>/ielts-journey/issues).

## License

[MIT](LICENSE)
