# Accessibility

## Semantic HTML

- Use `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>` elements for landmark regions.
- Interactive controls use `<button>`, `<a>`, `<select>`, `<input>` — never `div` with click handlers.
- Headings follow a logical hierarchy (`h1` → `h2` → `h3`).

## ARIA Labels

- `Button` and `Icon` components accept `aria-label` when the visual content alone is insufficient.
- Audio player controls (`Play`, `Pause`, `Stop`, `Seek`, `Volume`) all have `aria-label`.
- Custom form controls include `aria-describedby` linking to error messages.

## Focus Management

- `Modal` component traps focus and restores it on close.
- `Drawer` component returns focus to the trigger element on close.
- Skip-to-content link is available at the top of the page.

## Color & Contrast

- Theme tokens (`--color-text`, `--color-muted`, `--color-primary`, `--color-border`, `--color-surface`) control all text and background colors.
- Dark mode is supported via CSS variable switching (`.dark` class on `<html>`).
- Interactive elements have visible focus outlines (browser default or custom ring).

## Testing

- Run manual checks: keyboard navigation (Tab), screen reader (VoiceOver/NVDA), zoom (200%).
- No automated a11y testing configured yet.
