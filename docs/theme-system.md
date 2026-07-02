# Theme System

> The design token-based theme system with light/dark mode, accent color support, and CSS custom properties.

---

## 1. Overview

The theme system provides a maintainable, token-based approach to styling. All visual design decisions (colors, spacing, typography, shadows) are captured in design tokens and exposed as CSS custom properties. Components reference only semantic tokens, never hard-coded color values.

**Package:** `packages/theme/src/`

### 1.1 Principles

- **No hard-coded colors in components** — Components use CSS variables
- **Semantic tokens** — Named by purpose (e.g., `--color-primary`, `--color-surface`)
- **Dark mode** — Automatic via `prefers-color-scheme` or manual toggle
- **Accent colors** — 8 preset accent colors, fully swappable
- **System preference** — Respects OS-level dark/light setting

---

## 2. Architecture

```
packages/theme/src/
├── index.ts                  # Public API barrel
├── tokens.ts                 # Design token definitions (light + dark)
├── types.ts                  # Theme-related TypeScript types
├── ThemeProvider.tsx          # React context provider
├── utils.ts                  # Theme utility functions
└── cssVariables.css           # CSS custom properties
```

---

## 3. Design Tokens

### 3.1 Color Tokens

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-background` | White | Dark gray | Page background |
| `--color-surface` | Light gray | Darker gray | Card/surface backgrounds |
| `--color-primary` | Blue (accent) | Blue (accent) | Primary actions, links |
| `--color-primary-hover` | Darker blue | Lighter blue | Hover states |
| `--color-text` | Near black | Near white | Primary text |
| `--color-text-secondary` | Gray | Light gray | Secondary/muted text |
| `--color-border` | Light gray | Dark border | Dividers, borders |
| `--color-success` | Green | Green | Success states |
| `--color-warning` | Amber | Amber | Warning states |
| `--color-danger` | Red | Red | Error/danger states |
| `--color-muted` | Muted gray | Muted dark | Disabled, placeholder |

### 3.2 Spacing Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--spacing-xs` | 0.25rem | Smallest gaps |
| `--spacing-sm` | 0.5rem | Tight spacing |
| `--spacing-md` | 1rem | Default spacing |
| `--spacing-lg` | 1.5rem | Section spacing |
| `--spacing-xl` | 2rem | Large sections |
| `--spacing-2xl` | 3rem | Page sections |

### 3.3 Radius Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--radius-sm` | 0.375rem | Small buttons, inputs |
| `--radius-md` | 0.5rem | Cards, modals |
| `--radius-lg` | 0.75rem | Large surfaces |
| `--radius-xl` | 1rem | Dialogs, popups |
| `--radius-full` | 9999px | Pills, badges |

### 3.4 Shadow Tokens

| Token | Light Shadow | Dark Shadow | Purpose |
|-------|-------------|-------------|---------|
| `--shadow-sm` | Subtle | Subtle dark | Small elevations |
| `--shadow-md` | Medium | Medium dark | Cards, dropdowns |
| `--shadow-lg` | Large | Large dark | Modals, dialogs |

### 3.5 Font Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--font-sans` | System sans-serif | Body text |
| `--font-mono` | Monospace | Code examples |
| `--font-size-sm` | 0.875rem | Small text |
| `--font-size-base` | 1rem | Body text |
| `--font-size-lg` | 1.125rem | Large text |
| `--font-size-xl` | 1.25rem | Headings |
| `--font-size-2xl` | 1.5rem | Section headings |

---

## 4. Accent Colors

Users can choose from 8 preset accent colors:

| Preset | Hex | Token |
|--------|-----|-------|
| Blue (default) | `#2563eb` | `--color-accent` |
| Green | `#059669` | `--color-accent` |
| Purple | `#7c3aed` | `--color-accent` |
| Rose | `#e11d48` | `--color-accent` |
| Orange | `#ea580c` | `--color-accent` |
| Teal | `#0d9488` | `--color-accent` |
| Indigo | `#4f46e5` | `--color-accent` |
| Pink | `#db2777` | `--color-accent` |

When an accent color is selected, the `applyAccentColor()` utility generates:
- Hover variant (lighter/darker)
- Muted variant (with opacity)
- Background variant
- Border variant

All these are set as CSS custom properties dynamically:

```
--color-primary:        <accent>
--color-primary-hover:  <adjusted>
--color-primary-muted:  <opacity>
--color-primary-bg:     <light>
--color-primary-border: <adjusted>
```

---

## 5. Theme Modes

### 5.1 Three Modes

| Mode | Behavior |
|------|----------|
| `light` | Always light theme |
| `dark` | Always dark theme |
| `system` | Follows OS preference (`prefers-color-scheme`) |

### 5.2 Toggle

Users can toggle via:
- Settings page toggle
- Keyboard shortcut (if implemented)
- System preference (in `system` mode)

### 5.3 Persistence

Theme preference is persisted in localStorage:

```typescript
localStorage.setItem('theme-mode', 'dark')
localStorage.setItem('accent-color', '#7c3aed')  // Purple
```

---

## 6. ThemeProvider

```typescript
// packages/theme/src/ThemeProvider.tsx
function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Reads persisted theme mode and accent color
  // Listens to system prefers-color-scheme changes
  // Applies CSS variables to document root
  // Provides context: mode, dark, accentColor, setMode(), toggle(), setAccentColor()
}
```

### 6.1 Usage

```typescript
import { ThemeProvider, useTheme } from '@ielts/theme'

// Wrap app root
<ThemeProvider>
  <App />
</ThemeProvider>

// Use in any component
function MyComponent() {
  const { mode, dark, accentColor, toggle } = useTheme()
  return <button onClick={toggle}>Toggle {dark ? 'Light' : 'Dark'}</button>
}
```

### 6.2 CSS Variable Application

The provider sets all tokens on the `:root` element:

```css
:root {
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-primary: #2563eb;
  /* ... */
}

:root[data-theme="dark"] {
  --color-background: #0f172a;
  --color-surface: #1e293b;
  /* ... */
}
```

---

## 7. Integration with Tailwind CSS

The theme tokens are used alongside Tailwind CSS. Tailwind's `theme()` function references the CSS variables:

```css
@layer base {
  :root {
    --color-background: #ffffff;
    --color-surface: #f8fafc;
  }
}

/* Use in components */
.bg-surface {
  background-color: var(--color-surface);
}
.text-primary {
  color: var(--color-primary);
}
```

---

## 8. CSS Custom Properties File

`cssVariables.css` defines all variables for both themes:

```css
:root {
  /* Colors */
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-muted: rgba(37, 99, 235, 0.1);
  --color-primary-bg: #eff6ff;
  --color-text: #0f172a;
  --color-text-secondary: #64748b;
  --color-border: #e2e8f0;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-muted: #94a3b8;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Font */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
}

[data-theme="dark"] {
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-primary: #3b82f6;
  /* ... dark variants ... */
}
```

---

## 9. Adding a New Token

1. Add the token key and value to `tokens.ts` in both light and dark objects
2. Add the CSS variable to `cssVariables.css` in both `:root` and `[data-theme="dark"]`
3. Use the variable in components via `var(--token-name)`
4. Never reference raw hex values in component code
