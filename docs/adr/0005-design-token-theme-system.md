# ADR 0005: Design Token Theme System

**Date:** 2026-07-01
**Status:** Accepted
**Decision:** Use a design token-based theme system with CSS custom properties, supporting light/dark mode and configurable accent colors.

---

## Context

The app needs a maintainable theming system that:
- Supports **light and dark** modes
- Allows **accent color** customization
- Uses **semantic color names** (not hard-coded hex values)
- Works with **Tailwind CSS**
- Can be shared between the web app and browser extension

### Before This Decision

Components had hard-coded colors:
```css
/* Before */
.button { background-color: #2563eb; color: white; }
```

This made it impossible to:
- Switch to dark mode
- Change accent colors
- Maintain consistent styling

## Decision

Use **design tokens** as CSS custom properties with semantic naming:

```css
:root {
  --color-primary: #2563eb;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  /* ... */
}

[data-theme="dark"] {
  --color-primary: #3b82f6;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  /* ... */
}
```

### Token Categories

| Category | Example Tokens |
|----------|---------------|
| Colors (28) | `--color-background`, `--color-primary`, `--color-danger` |
| Spacing (6) | `--spacing-xs` through `--spacing-2xl` |
| Radius (5) | `--radius-sm` through `--radius-full` |
| Shadows (3) | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Fonts (8) | `--font-sans`, `--font-size-base`, etc. |

### Accent Colors

8 preset accent colors, configurable via settings:
- Blue, Green, Purple, Rose, Orange, Teal, Indigo, Pink

When an accent is selected, the system generates hover, muted, background, and border variants.

## Consequences

### Positive

- **No hard-coded colors** in components — all reference CSS variables
- **Dark mode** works automatically by switching CSS variable values
- **Accent color** customization is trivial
- **Shared between apps:** Web app and extension use the same token definitions
- **Compatible with Tailwind:** CSS variables can be referenced in Tailwind config
- **Type-safe:** TypeScript types enforce correct token usage

### Negative

- **CSS variable overhead:** Browsers must resolve variables at runtime (negligible perf impact)
- **Bundle size:** Token definitions add ~2KB to the CSS bundle
- **Complexity for new developers:** Must understand the token system before styling

## Usage

```tsx
// Components use semantic tokens via CSS variables
<button className="bg-primary text-white rounded-md">
  Click me
</button>

/* CSS */
.bg-primary { background-color: var(--color-primary); }
.text-white { color: var(--color-text); }
```

## Related

- [Theme System](../theme-system.md)
- [Architecture](../architecture.md)
