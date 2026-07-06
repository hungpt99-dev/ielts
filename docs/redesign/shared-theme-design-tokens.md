# IELTS Journey — Shared Theme Design Tokens

## Overview

This document defines the shared design token system for the redesigned IELTS Journey website. The token system builds on the existing foundation in `packages/theme/src/tokens.ts` and `packages/theme/src/types.ts` but proposes a more comprehensive, semantically-named set of tokens aligned with the soft, modern, mobile-first design direction.

The token system follows these principles:

- **Semantic naming**: Token names describe purpose, not value (e.g., `color.surface.card` instead of `color.white`)
- **Hierarchical organization**: Tokens are grouped by domain (color, typography, spacing, etc.)
- **Dark mode parity**: Every color token has a light and dark variant
- **Extensibility**: The system allows adding new tokens without breaking existing usage
- **Design system alignment**: Tokens map to the proposed component system and page layouts

The token system described here is a **specification only**. No code changes should be made based on this document. Implementation will happen after all design files are approved.

---

## Color Tokens

### Brand Colors

The brand palette shifts from the current cool-blue (`#2563eb`) toward a warmer, more friendly primary while retaining the existing accent color customization system.

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `color.brand.primary` | #2563eb | #3b82f6 | Primary actions, links, active states |
| `color.brand.primaryHover` | #1d4ed8 | #60a5fa | Hover state for primary elements |
| `color.brand.primaryActive` | #1e40af | #93c5fd | Pressed/active state for primary elements |
| `color.brand.primaryLight` | #dbeafe | #1e3a5f | Tinted backgrounds for primary elements |
| `color.brand.primarySubtle` | #eff6ff | #172554 | Very subtle primary tint for large areas |
| `color.brand.onPrimary` | #ffffff | #ffffff | Text/icon on primary backgrounds |
| `color.brand.accent` | User-defined | User-defined | User-selected accent color (see `ACCENT_COLOR_PRESETS`) |

### Background Colors

The background palette shifts from a cool gray (`#f8fafc`) to a warmer off-white that feels more inviting and premium.

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `color.background.primary` | #faf9f6 | #0f172a | Main page background |
| `color.background.secondary` | #f5f4f1 | #0a0f1e | Alternate section background (landing page, hero sections) |
| `color.background.tertiary` | #eeedea | #060a14 | Footer, less prominent sections |

### Surface Colors

Surfaces are card-like containers that sit on top of the background.

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `color.surface.card` | #ffffff | #1e293b | Default card background |
| `color.surface.cardHover` | #fafafa | #263548 | Card hover state |
| `color.surface.elevated` | #ffffff | #1e293b | Modals, dropdowns, popovers (sits above cards) |
| `color.surface.sidebar` | #ffffff | #1e293b | Sidebar background |
| `color.surface.header` | rgba(255,255,255,0.85) | rgba(30,41,59,0.85) | Glass-header background (with backdrop blur) |
| `color.surface.bottomNav` | rgba(255,255,255,0.92) | rgba(30,41,59,0.92) | Mobile bottom nav background (with backdrop blur) |
| `color.surface.overlay` | rgba(0,0,0,0.4) | rgba(0,0,0,0.6) | Modal/drawer backdrop |
| `color.surface.skeleton` | #e2e8f0 | #334155 | Loading skeleton base |
| `color.surface.skeletonShine` | #f1f5f9 | #475569 | Loading skeleton shimmer highlight |

### Text Colors

| Token | Purpose |
|-------|---------|
| `color.text.primary` | Primary body text (headings, important content) |
| `color.text.secondary` | Secondary text (descriptions, metadata) |
| `color.text.muted` | Muted text (placeholders, disabled, hints) |
| `color.text.inverse` | Text on dark/primary backgrounds |
| `color.text.link` | Hyperlink text |
| `color.text.linkHover` | Hyperlink hover state |
| `color.text.onColor` | White text on any colored background |
| `color.text.brand` | Brand-colored text (highlights, badges) |

**Light values** (proposed refinement of current tokens):

| Token | Value |
|-------|-------|
| `color.text.primary` | #1a1a2e |
| `color.text.secondary` | #5c5c6e |
| `color.text.muted` | #9ca3af |
| `color.text.inverse` | #ffffff |
| `color.text.link` | #2563eb |
| `color.text.linkHover` | #1d4ed8 |
| `color.text.onColor` | #ffffff |
| `color.text.brand` | #2563eb |

**Dark values** (proposed refinement):

| Token | Value |
|-------|-------|
| `color.text.primary` | #f1f5f9 |
| `color.text.secondary` | #94a3b8 |
| `color.text.muted` | #64748b |
| `color.text.inverse` | #0f172a |
| `color.text.link` | #60a5fa |
| `color.text.linkHover` | #93c5fd |
| `color.text.onColor` | #ffffff |
| `color.text.brand` | #60a5fa |

### Border Colors

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `color.border.default` | #e5e7eb | #334155 | Standard borders on cards, inputs |
| `color.border.light` | #f3f4f6 | #1e293b | Subtle borders, dividers |
| `color.border.focus` | #2563eb | #3b82f6 | Focus ring on inputs, interactive elements |
| `color.border.danger` | #ef4444 | #ef4444 | Error state borders |
| `color.border.success` | #22c55e | #22c55e | Success state borders |

### AI Tutor Colors

The AI Tutor has its own distinct color palette to create visual separation from the main app UI. This reinforces the feeling of a separate "person" helping the user.

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `color.tutor.background` | #f0f9ff | #0c4a6e | Chat bubble background (tutor side) |
| `color.tutor.userBubble` | #2563eb | #3b82f6 | Chat bubble background (user side) |
| `color.tutor.text` | #0c4a6e | #e0f2fe | Tutor message text |
| `color.tutor.userText` | #ffffff | #ffffff | User message text |
| `color.tutor.border` | #bae6fd | #0e7490 | Tutor card/bubble borders |
| `color.tutor.accent` | #0ea5e9 | #38bdf8 | Tutor buttons, highlights, active elements |
| `color.tutor.accentLight` | #e0f2fe | #0c4a6e | Subtle tutor tinted backgrounds |
| `color.tutor.accentDark` | #0369a1 | #7dd3fc | Pressed states, darker accents |
| `color.tutor.floating` | #0ea5e9 | #38bdf8 | Floating AI Tutor button |
| `color.tutor.proactive` | #8b5cf6 | #a78bfa | Proactive AI suggestion accent (distinct from chat) |
| `color.tutor.proactiveLight` | #f5f3ff | #2e1065 | Proactive card background |

### IELTS Skill Colors

Each IELTS skill has a dedicated color for progress indicators, skill cards, and category badges.

| Token | Skill | Light Value | Light Tint | Dark Value | Dark Tint |
|-------|-------|-------------|------------|------------|-----------|
| `color.skill.listening.*` | Listening | #06b6d4 | #cffafe | #22d3ee | #164e63 |
| `color.skill.reading.*` | Reading | #8b5cf6 | #ede9fe | #a78bfa | #3b0764 |
| `color.skill.writing.*` | Writing | #f59e0b | #fef3c7 | #fbbf24 | #78350f |
| `color.skill.speaking.*` | Speaking | #ec4899 | #fce7f3 | #f472b6 | #831843 |
| `color.skill.grammar.*` | Grammar | #10b981 | #d1fae5 | #34d399 | #064e3b |
| `color.skill.vocabulary.*` | Vocabulary | #f97316 | #ffedd5 | #fb923c | #7c2d12 |

Each skill token is used in a suffix pattern:

| Suffix | Purpose |
|--------|---------|
| `primary` | Main skill color (icons, progress fill, active indicators) |
| `light` | Tinted background (skill cards, progress track backgrounds) |
| `dark` | Dark variant for dark mode or pressed states |
| `text` | Skill-colored text (badges, labels) |
| `border` | Skill-colored borders (card left accent, dividers) |

### Vocabulary-Specific Colors

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `color.vocab.new` | #3b82f6 | #60a5fa | Word status: newly saved |
| `color.vocab.learning` | #f59e0b | #fbbf24 | Word status: currently learning |
| `color.vocab.reviewing` | #8b5cf6 | #a78bfa | Word status: in review cycle |
| `color.vocab.mastered` | #22c55e | #4ade80 | Word status: mastered |
| `color.vocab.difficultyEasy` | #22c55e | #4ade80 | Easy difficulty badge |
| `color.vocab.difficultyMedium` | #f59e0b | #fbbf24 | Medium difficulty badge |
| `color.vocab.difficultyHard` | #ef4444 | #f87171 | Hard difficulty badge |

### Grammar-Specific Colors

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `color.grammar.correct` | #22c55e | #4ade80 | Correct grammar highlight |
| `color.grammar.incorrect` | #ef4444 | #f87171 | Incorrect grammar highlight |
| `color.grammar.suggestion` | #3b82f6 | #60a5fa | Grammar suggestion text |
| `color.grammar.explanation` | #8b5cf6 | #a78bfa | Grammar rule explanation |

### Status / Semantic Colors

| Token | Light Value | Light Tint | Dark Value | Dark Tint | Purpose |
|-------|-------------|------------|------------|-----------|---------|
| `color.status.success.*` | #22c55e | #dcfce7 | #4ade80 | #14532d | Success states |
| `color.status.warning.*` | #f59e0b | #fef3c7 | #fbbf24 | #78350f | Warning states |
| `color.status.danger.*` | #ef4444 | #fee2e2 | #f87171 | #7f1d1d | Error/danger states |
| `color.status.info.*` | #3b82f6 | #dbeafe | #60a5fa | #1e3a5f | Informational states |

Each status color uses suffix pattern: `primary`, `light`, `dark`, `text`, `border` (same as skill colors).

### Misc Colors

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `color.highlight` | #fef9c3 | #713f12 | Highlighted text (search results, selected vocabulary) |
| `color.streak` | #f97316 | #fb923c | Streak indicator (flame icon, streak count) |
| `color.band.low` | #ef4444 | #f87171 | Band score 0.0–4.5 |
| `color.band.medium` | #f59e0b | #fbbf24 | Band score 5.0–6.5 |
| `color.band.high` | #22c55e | #4ade80 | Band score 7.0–8.0 |
| `color.band.perfect` | #8b5cf6 | #a78bfa | Band score 8.5–9.0 |
| `color.examUrgent` | #ef4444 | #f87171 | Exam ≤ 14 days away |
| `color.examSoon` | #f59e0b | #fbbf24 | Exam 15–30 days away |
| `color.examNormal` | #22c55e | #4ade80 | Exam > 30 days away |

---

## Typography Tokens

### Font Family

| Token | Value | Purpose |
|-------|-------|---------|
| `font.family.sans` | `"Inter", system-ui, -apple-system, sans-serif` | Primary UI font |
| `font.family.mono` | `"JetBrains Mono", "Fira Code", monospace` | Code, scores, numbers |
| `font.family.heading` | `"Inter", system-ui, -apple-system, sans-serif` | Headings (same as sans, can swap to display font later) |
| `font.family.brand` | `"Inter", system-ui, -apple-system, sans-serif` | Brand typography (logo, tagline) |

### Font Size Scale

The proposed scale adds `5xl` and `6xl` for more dramatic hierarchy on dashboard hero sections and landing page.

| Token | Value | HTML Equivalent | Used For |
|-------|-------|-----------------|----------|
| `font.size.xs` | 0.75rem (12px) | `<small>` | Captions, metadata, timestamps |
| `font.size.sm` | 0.875rem (14px) | — | Body text secondary, nav items |
| `font.size.base` | 1rem (16px) | `<p>` | Primary body text |
| `font.size.lg` | 1.125rem (18px) | `<h4>` | Card titles, section subtitles |
| `font.size.xl` | 1.25rem (20px) | `<h3>` | Section headings |
| `font.size.2xl` | 1.5rem (24px) | `<h2>` | Page subtitles, hero subtitle |
| `font.size.3xl` | 1.875rem (30px) | `<h1>` | Page titles |
| `font.size.4xl` | 2.25rem (36px) | — | Dashboard hero title, landing feature title |
| `font.size.5xl` | 3rem (48px) | — | Landing page hero heading (desktop) |
| `font.size.6xl` | 3.75rem (60px) | — | Landing page hero display text (desktop, large screens) |

### Font Weight

| Token | Value | Used For |
|-------|-------|----------|
| `font.weight.normal` | 400 | Body text, descriptions |
| `font.weight.medium` | 500 | Navigation items, buttons |
| `font.weight.semibold` | 600 | Subheadings, card titles |
| `font.weight.bold` | 700 | Page titles, hero headings, band scores |

### Line Height

| Token | Value | Used For |
|-------|-------|----------|
| `font.leading.tight` | 1.15 | Headings, hero text |
| `font.leading.normal` | 1.5 | Body text |
| `font.leading.relaxed` | 1.75 | Long-form reading content |
| `font.leading.display` | 1.05 | Large display text (hero headings 4xl+) |

### Letter Spacing

| Token | Value | Used For |
|-------|-------|----------|
| `font.tracking.tight` | -0.025em | Headings, display text |
| `font.tracking.normal` | 0 | Body text |
| `font.tracking.wide` | 0.05em | Uppercase labels, badges |
| `font.tracking.wider` | 0.1em | Small caps, overline labels |

---

## Spacing Tokens

The existing spacing scale in `packages/theme/src/tokens.ts` uses named steps (`3xs` through `3xl`). The proposed refinement adds more granularity at the medium-to-large range for the spacious redesign.

| Token | Rem | Pixels (16px base) | Used For |
|-------|-----|---------------------|----------|
| `spacing.3xs` | 0.125rem | 2px | Stacked icon/avatar gaps |
| `spacing.2xs` | 0.25rem | 4px | Dense spacing, icon inset |
| `spacing.xs` | 0.5rem | 8px | Tight spacing, button padding |
| `spacing.sm` | 0.75rem | 12px | Compact padding, small card padding |
| `spacing.md` | 1rem | 16px | Standard padding, card padding |
| `spacing.lg` | 1.5rem | 24px | Section spacing, card groups |
| `spacing.xl` | 2rem | 32px | Large section spacing |
| `spacing.2xl` | 2.5rem | 40px | Page section separators |
| `spacing.3xl` | 3rem | 48px | Hero section padding |
| `spacing.4xl` | 4rem | 64px | Landing page section gaps |
| `spacing.5xl` | 5rem | 80px | Major page section breaks |
| `spacing.6xl` | 6rem | 96px | Landing page hero vertical padding |

The current scale (`3xs` through `3xl`) maps directly to the first 9 steps. The new `4xl` through `6xl` tokens are added for the more spacious landing page and dashboard hero sections.

---

## Border Radius Tokens

The existing radius scale should be retained but used more deliberately. Each component should consistently use the same radius step (e.g., all cards use `radius.xl`, all buttons use `radius.lg`).

| Token | Value | Used For |
|-------|-------|----------|
| `radius.none` | 0 | Images, full-bleed elements |
| `radius.xs` | 0.25rem (4px) | Small badges, tags, progress track |
| `radius.sm` | 0.375rem (6px) | Input fields, small UI elements |
| `radius.md` | 0.5rem (8px) | Buttons, small cards |
| `radius.lg` | 0.75rem (12px) | Standard cards, modals |
| `radius.xl` | 1rem (16px) | Feature cards, dashboard skill cards |
| `radius.2xl` | 1.25rem (20px) | Hero cards, AI Tutor chat cards |
| `radius.3xl` | 1.5rem (24px) | Dashboard hero section, landing page cards |
| `radius.full` | 9999px | Avatars, pill badges, circular elements |

**Consistency rules** (proposed):
- All interactive cards (skill, task, vocab word, practice) → `radius.xl`
- All cards with primary CTA → `radius.lg`
- Decorative/hero cards → `radius.2xl` or `radius.3xl`
- Avatar and status dots → `radius.full`
- Buttons → `radius.md` (standard) or `radius.lg` (large/primary CTA)

---

## Shadow Tokens

The existing shadow tokens should be refined to feel softer and more premium. The proposed shadows use longer blur radius with lower opacity for a gentle floating effect.

| Token | Value (Light) | Value (Dark) | Used For |
|-------|---------------|--------------|----------|
| `shadow.xs` | `0 1px 2px rgba(0,0,0,0.04)` | `0 1px 2px rgba(0,0,0,0.2)` | Subtle depth (input focus) |
| `shadow.sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | `0 1px 3px rgba(0,0,0,0.3)` | Small cards, stat cards |
| `shadow.md` | `0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)` | `0 4px 6px rgba(0,0,0,0.3)` | Standard cards, dropdowns |
| `shadow.lg` | `0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.03)` | `0 10px 15px rgba(0,0,0,0.35)` | Elevated cards, modals |
| `shadow.xl` | `0 20px 25px rgba(0,0,0,0.06), 0 8px 10px rgba(0,0,0,0.03)` | `0 20px 25px rgba(0,0,0,0.4)` | Modals, drawers |
| `shadow.2xl` | `0 25px 50px rgba(0,0,0,0.08)` | `0 25px 50px rgba(0,0,0,0.45)` | Large modals, hero cards |
| `shadow.inner` | `inset 0 2px 4px rgba(0,0,0,0.04)` | `inset 0 2px 4px rgba(0,0,0,0.15)` | Inner shadows (inputs) |
| `shadow.colored` | `0 4px 14px rgba(37,99,235,0.15)` | `0 4px 14px rgba(59,130,246,0.25)` | Primary button glow, card accent |
| `shadow.tutor` | `0 4px 14px rgba(14,165,233,0.15)` | `0 4px 14px rgba(56,189,248,0.25)` | AI Tutor floating button, chat card |
| `shadow.card` | `0 2px 8px rgba(0,0,0,0.05)` | `0 2px 8px rgba(0,0,0,0.25)` | Default card shadow (used consistently) |
| `shadow.cardHover` | `0 8px 20px rgba(0,0,0,0.08)` | `0 8px 20px rgba(0,0,0,0.35)` | Card hover elevated state |

**Why softer shadows?** The current shadows use `rgb(0 0 0 / 0.1)` which creates noticeable gray shadows. The proposed approach uses lower opacity with longer blur radius — this creates a gentler, more premium floating effect that aligns with the soft design direction.

---

## Z-Index Tokens

The current z-index system in `packages/theme/src/tokens.ts` is functional. The proposed refinement adds a few more layers and standardizes the naming.

| Token | Value | Used For |
|-------|-------|----------|
| `zIndex.base` | 0 | Page content, static elements |
| `zIndex.dropdown` | 100 | Dropdown menus, autocomplete suggestions |
| `zIndex.sticky` | 200 | Sticky headers, section headers |
| `zIndex.header` | 300 | Main header bar |
| `zIndex.sidebar` | 350 | Sidebar overlay (mobile) |
| `zIndex.bottomNav` | 375 | Mobile bottom navigation |
| `zIndex.fixed` | 400 | Fixed-position elements |
| `zIndex.modalBackdrop` | 500 | Modal/drawer backdrop overlay |
| `zIndex.modal` | 600 | Modal content |
| `zIndex.popover` | 700 | Popovers, tooltips |
| `zIndex.drawer` | 550 | Drawer panel (between backdrop and modal) |
| `zIndex.toast` | 800 | Toast notifications |
| `zIndex.tooltip` | 900 | Tooltips (above toasts) |
| `zIndex.aiTutorChat` | 950 | AI Tutor floating chat popup |
| `zIndex.aiTutorButton` | 960 | AI Tutor floating button |
| `zIndex.extensionMenu` | 1000 | Browser extension menu |
| `zIndex.highlight` | 2147483647 | Text highlight overlay (extension) |

Key additions vs. current:
- `sidebar` and `bottomNav` — new layers for mobile navigation
- `header` — explicitly defined (was implicit)
- `drawer` — between backdrop and modal for side panels
- `aiTutorChat` and `aiTutorButton` — separated from generic `aiTutor`

---

## Breakpoint Tokens

The existing breakpoint scale is retained. No changes needed.

| Token | Value | Device Target |
|-------|-------|---------------|
| `breakpoint.sm` | 640px | Large phones, small tablets (portrait) |
| `breakpoint.md` | 768px | Tablets (portrait), small desktops |
| `breakpoint.lg` | 1024px | Tablets (landscape), standard desktops |
| `breakpoint.xl` | 1280px | Large desktops |
| `breakpoint.2xl` | 1536px | Extra-wide screens |

**Usage convention**: All responsive layouts should use min-width (mobile-first) breakpoints:
- `sm:` — above 640px
- `md:` — above 768px
- `lg:` — above 1024px
- `xl:` — above 1280px
- `2xl:` — above 1536px

---

## Animation & Transition Tokens

### Duration

| Token | Value | Used For |
|-------|-------|----------|
| `transition.duration.instant` | 50ms | Micro-interactions (button press) |
| `transition.duration.fast` | 150ms | Hover states, color transitions |
| `transition.duration.normal` | 200ms | Standard UI transitions |
| `transition.duration.slow` | 300ms | Page transitions, panel slides |
| `transition.duration.slower` | 400ms | Modal open/close, drawer |
| `transition.duration.slowest` | 500ms | Page load animations, celebratory effects |

### Easing

| Token | Value | Used For |
|-------|-------|----------|
| `transition.easing.linear` | `linear` | Color/opacity transitions |
| `transition.easing.in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements moving out |
| `transition.easing.out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements appearing |
| `transition.easing.inOut` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard UI motion |
| `transition.easing.bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Celebratory animations, streak effects |
| `transition.easing.spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Playful spring-like motion |

### Animation Types

| Animation | Use Case |
|-----------|----------|
| `fadeIn 200ms ease-out` | Elements appearing, modal backdrops |
| `slideUp 300ms ease-out` | Drawers, bottom sheets |
| `slideInLeft 250ms ease-out` | Sidebar, mobile nav |
| `scaleIn 200ms ease-out` | Popovers, tooltips, badges |
| `shimmer 1.5s infinite` | Loading skeletons |
| `pulse 2s infinite` | AI Tutor proactive message indicator |
| `bounceIn 400ms spring` | Achievement unlocks, celebration badges |

---

## Component-Specific Token Mappings

This section describes how tokens should be used consistently across components. This is a usage guide, not an implementation.

### Card Surface Mapping

| Component | Background | Border | Radius | Shadow |
|-----------|-----------|--------|--------|--------|
| Dashboard stat card | `surface.card` | `border.default` | `xl` | `shadow.card` |
| Skill progress card | `surface.card` | Skill `border` left accent | `xl` | `shadow.card` |
| Study task card | `surface.card` | `border.default` | `lg` | `shadow.card` |
| AI Tutor message | `tutor.background` | `tutor.border` | `xl` | `shadow.sm` |
| Vocabulary word card | `surface.card` | `border.default` | `xl` | `shadow.card` |
| Practice card | `surface.card` | `border.default` | `xl` | `shadow.card` |
| Mistake card | `surface.card` | `status.danger.border` | `lg` | `shadow.card` |
| Settings section | `surface.card` | `border.default` | `xl` | `shadow.sm` |
| Modal | `surface.elevated` | `border.default` | `xl` | `shadow.xl` |
| Bottom sheet (mobile) | `surface.elevated` | None (rounded top) | `2xl` top | `shadow.2xl` |

### Interactive State Mapping

| Component | Default | Hover | Active/Pressed | Focus/Selected | Disabled |
|-----------|---------|-------|----------------|----------------|----------|
| Primary Button | `brand.primary` bg, `text.onColor` | `brand.primaryHover` bg | `brand.primaryActive` bg, `scale(0.98)` | Focus ring `border.focus` | `text.muted` bg, no pointer |
| Secondary Button | Transparent, `brand.primary` border | `brand.primarySubtle` bg | `brand.primaryLight` bg | Focus ring `border.focus` | `text.muted` border |
| Ghost Button | Transparent text `text.secondary` | `surface.cardHover` bg | `border.light` bg | Focus ring `border.focus` | `text.muted` |
| Card (clickable) | `surface.card`, `shadow.card` | `surface.cardHover`, `shadow.cardHover`, `translateY(-2px)` | `scale(0.98)` | Focus ring `border.focus` | — |
| Input | `surface.card`, `border.default` | `border.focus` (on focus) | — | `border.focus`, `shadow.xs` colored | `text.muted` bg, `text.muted` |
| Badge | Status/skill `light` bg, `primary` text | — | — | — | `text.muted` bg |

---

## Dark Mode Guidelines

The existing `DARK_TOKENS` in `packages/theme/src/tokens.ts:142` provide a good foundation. Key refinements for the redesign:

1. **Reduce contrast ratio slightly** — Dark mode should be comfortable for reading in low light, not punishingly high-contrast. Text should be `#f1f5f9` (not pure white) on `#1e293b` surfaces.

2. **Warmer dark background** — Instead of pure dark `#0f172a`, consider a very slightly warm dark `#0f141e` to match the warm-light direction.

3. **Surface card differentiation** — In dark mode, cards should be subtly lighter than the background but not so light that they lose the "card floating on dark" effect. Current `#1e293b` on `#0f172a` (10% difference) is appropriate.

4. **Glass effects** — Use `backdrop-filter: blur(12px)` with semi-transparent surface colors for overlays, headers, and bottom nav in both modes. In dark mode, the glass effect is more noticeable and creates visual interest.

5. **Colored shadows in dark mode** — Colored shadows (like `shadow.colored` and `shadow.tutor`) should have higher opacity in dark mode to remain visible against the dark background.

6. **Skeleton loading in dark mode** — Use `#334155` base with `#475569` shimmer for adequate visibility.

---

## Semantic Token Naming Convention

All tokens should follow this naming pattern:

```
<domain>.<category>.<modifier>.<state>
```

Where:

| Part | Example | Required |
|------|---------|----------|
| `domain` | `color`, `font`, `spacing`, `shadow`, `radius`, `zIndex`, `breakpoint`, `transition` | Yes |
| `category` | `surface`, `text`, `skill`, `tutor`, `brand`, `status` | Yes |
| `modifier` | `card`, `primary`, `listening`, `success` | Yes |
| `state` (optional) | `hover`, `active`, `light`, `dark` | No |

Examples:
- `color.surface.card` — card background color
- `color.skill.listening.primary` — listening skill main color
- `font.size.2xl` — 24px font size
- `shadow.cardHover` — card hover shadow
- `transition.duration.fast` — 150ms duration

---

## Token Category Summary

| Category | # Tokens (Light) | # Tokens (Dark) | Notes |
|----------|-----------------|-----------------|-------|
| Brand colors | 8 | 8 | Includes user accent color |
| Background colors | 3 | 3 | Warm off-white palette |
| Surface colors | 8 | 8 | Cards, nav, overlay |
| Text colors | 8 | 8 | Semantic text roles |
| Border colors | 5 | 5 | Interactive borders |
| AI Tutor colors | 10 | 10 | Distinct tutor identity |
| Skill colors | 30 | 30 | 6 skills × 5 tokens each |
| Vocabulary colors | 8 | 8 | Status and difficulty |
| Grammar colors | 4 | 4 | Correct/incorrect states |
| Status colors | 12 | 12 | 4 states × 3 tokens each |
| Misc colors | 8 | 8 | Highlight, streak, band |
| Typography | ~20 | — | Shared across modes |
| Spacing | 12 | — | Shared across modes |
| Radius | 9 | — | Shared across modes |
| Shadow | 12 | 12 | Softer, premium |
| Z-index | 17 | — | Shared across modes |
| Breakpoint | 5 | — | Shared across modes |
| Transition | ~15 | — | Duration + easing |

**Total**: approximately 190 tokens across light and dark modes.

---

## Relationship to Existing Token System

The existing token system in `packages/theme/src/tokens.ts` defines `TOKENS` and `DARK_TOKENS` objects with flat color, radius, spacing, shadow, font, zIndex, breakpoint, and transition keys. The proposed system:

- **Adds new categories** (vocabulary colors, grammar colors, band colors, exam urgency colors)
- **Sub-categorizes** flat tokens (e.g., `color.skillListening` → `color.skill.listening.primary`)
- **Adds new spacing values** (`spacing.4xl` through `spacing.6xl` for the spacious redesign)
- **Adds new shadow values** (`shadow.card`, `shadow.cardHover`, `shadow.xs`)
- **Adds new transition tokens** (duration variants, easing curves)
- **Refines existing values** (softer shadows, warmer backgrounds)
- **Adds z-index entries** for new UI layers (sidebar, bottomNav, header, drawer)

The existing type system in `packages/theme/src/types.ts` (`DesignTokens` interface) will need extension to accommodate new categories, but the existing property access patterns (e.g., `tokens.color.primary`, `tokens.shadow.md`) will continue to work.

---

## Usage in Design System

The token system should be consumed by:

1. **CSS custom properties** — Tokens are exposed as CSS variables on `:root` and `.dark` selectors for use in component styles
2. **Tailwind extension** — Custom Tailwind theme extends the default utility classes (e.g., `bg-surface-card`, `shadow-card`, `text-tutor-accent`)
3. **Component prop defaults** — React components use tokens as default values for visual props (e.g., `<Card shadow="card" radius="xl">`)
4. **Direct access** — Type-safe token access via `useTheme()` or import from the theme package

---

## Token Validation Checklist

When implementing the token system, verify:

- [ ] Every token has a light and dark value (color tokens only)
- [ ] Every token serves a documented purpose
- [ ] No hardcoded color values exist in component files (all use tokens)
- [ ] Contrast ratios meet WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- [ ] Token names are intuitive and consistent
- [ ] Tokens are used consistently across components (e.g., all cards use `surface.card`)
- [ ] Dark mode tokens provide adequate contrast without being harsh
- [ ] Token system supports the full component catalog
- [ ] User accent color overrides respect token system structure
