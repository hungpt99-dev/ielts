# Accessibility & UX Review: Configuration UI Components

**Audit date:** 2026-07-05
**Scope:** `BasicSettingsForm.tsx` and `AdvancedSettingsForm.tsx`
**WCAG target:** AA

---

## 1. Keyboard Navigation

### Issues Found

| # | Component | Issue | Severity | WCAG |
|---|-----------|-------|----------|------|
| K01 | BasicSettingsForm | Tutor Personality buttons have no `focus-visible` ring styles. Browser default outline may be clipped by `rounded-xl` border-radius. | Medium | 2.4.7 |
| K02 | BasicSettingsForm | Tutor Personality container (`<div>`) has no `role="radiogroup"` and buttons lack `role="radio"` + `aria-checked`. The `<label>` above it has no `htmlFor` association. Users cannot navigate options as a radio group with arrow keys. | High | 4.1.2 |
| K03 | AdvancedSettingsForm | Provider type "Remove" button is conditionally rendered — keyboard users may be confused when it disappears after removing the last remaining provider. | Low | — |
| K04 | Both | No skip-to-content or skip-to-section link. Long forms require tabbing through all fields to reach action buttons. | Low | 2.4.1 |

### Verdict

**K02 is the most impactful:** the tutor mode selector presents itself as a button grid but offers none of the keyboard semantics users expect for mutually exclusive choices. Sighted keyboard users can tab to each button individually, but screen reader users get no grouping cue and cannot arrow-key between options.

---

## 2. Screen Reader Compatibility

### Issues Found

| # | Component | Issue | Severity | WCAG |
|---|-----------|-------|----------|------|
| S01 | Both | Error messages are plain `<p>` elements with no `aria-live`, `role="alert"`, or `aria-atomic`. Screen readers may not announce dynamically appearing validation errors. | Medium | 4.1.3 |
| S02 | BasicSettingsForm | The "Current: {label} — {description}" paragraph (line 126) updates when selection changes but has no live region. Screen reader users won't hear the change. | Low | 4.1.3 |
| S03 | AdvancedSettingsForm | ToggleSwitch descriptions are `<p>` siblings of the button but not linked via `aria-describedby`. Screen readers see the label but not the description while focused on the switch. | Medium | 4.1.2 |
| S04 | Both | `Input`/`Select` components use `id` inferred from the label string (lowercased, space-replaced). If two fields have the same label text (doesn't happen currently), IDs would collide. | Low | 4.1.1 |
| S05 | AdvancedSettingsForm | Provider selector section heading `<h3>` has no `aria-label` to disambiguate which provider is being edited when an `id` is shown instead of a human-friendly name. | Low | 2.4.6 |

---

## 3. Color Contrast

### Analysis

Both components use CSS custom properties for all text and border colors:

| Token | Usage | Pass/Fail |
|-------|-------|-----------|
| `var(--color-text)` | Primary text, headings | ✅ *Depends on theme values* |
| `var(--color-text-secondary)` | Labels, descriptions | ✅ *Depends on theme values* |
| `var(--color-muted)` | Helper text, current selection | ⚠️ Must be ≥3:1 (large text) or 4.5:1 (small text) per WCAG 1.4.3 |
| `var(--color-danger)` | Error text | ⚠️ Must pass 4.5:1 on its background |
| `var(--color-primary)` / `var(--color-primary)/5` | Active button indicator | The `/5` opacity (5%) on background may fail 1.4.11 (non-text contrast) if the primary color is light |
| `var(--color-border)` | Borders | ⚠️ 3:1 minimum per WCAG 1.4.11 for active UI components |

### Issues Found

| # | Component | Issue | Severity | WCAG |
|---|-----------|-------|----------|------|
| C01 | BasicSettingsForm | Tutor mode button uses `bg-[var(--color-primary)]/5` (5% opacity) for the selected background — this may not meet 3:1 contrast against the page background for the active/selected state indicator. | Medium | 1.4.11 |
| C02 | Both | Helper text ("Leave empty if not yet scheduled", "Recommended: 30–120 minutes") uses `var(--color-muted)`. If this token is less than 4.5:1 against the background, small helper text fails. | Medium | 1.4.3 |
| C03 | Both | Error messages use `var(--color-danger)` — must be verified against the surface background, not just assumed to pass. | Medium | 1.4.3 |

---

## 4. Responsive Layout

### Issues Found

| # | Component | Issue | Severity |
|---|-----------|-------|----------|
| R01 | Both | No `--color-*` token fallback. If a theme variable is undefined, the text inherits no explicit color (falls to browser default) — could be unreadable on dark background. | Medium |
| R02 | BasicSettingsForm | Tutor mode grid uses `sm:grid-cols-2 lg:grid-cols-3` — on small mobile (<640px) all 9 buttons stack vertically. The grid is tall (~9 rows of buttons) before reaching the "Save" button. | Low |
| R03 | AdvancedSettingsForm | The 3-column grid `sm:grid-cols-3` for Temperature / Max Tokens / Cost Limit collapses to a single column below `sm`. Each field has a number input + helper text — single-column layout is fine but dense. | Low |
| R04 | AdvancedSettingsForm | 6 sections stacked vertically with borders between them. On mobile, the page scroll is very long. No collapsible sections or "sticky" save button. | Low |

---

## 5. UX Observations

| # | Component | Observation | Recommendation |
|---|-----------|-------------|---------------|
| U01 | BasicSettingsForm | **Inconsistent save model.** `updateField` (lines 57–68) calls `actions.updateBasicField(field, value)` on every change — an implicit auto-save. But the "Save Settings" button (line 156) calls `actions.updateBasic(form)` — a redundant bulk save. "Discard Changes" resets local state but the auto-save has already mutated the persisted config. | Remove auto-save from `updateField` OR replace the "Save Settings" button with a visual confirmation (checkmark). |
| U02 | AdvancedSettingsForm | **Contrasting save model.** The advanced form does NOT auto-save — all changes must be committed via "Save Settings". This is inconsistent with BasicSettingsForm's auto-save behavior. | Align the save model across both forms (prefer explicit save for both, given the sensitivity of provider configs). |
| U03 | AdvancedSettingsForm | "Add Provider" creates a new provider with a generic `providerId` (`provider-custom-{timestamp}`) but the active Select shows provider type label. When multiple providers of the same type exist, they're indistinguishable in the dropdown. | Show a human-readable name in the provider selector (e.g., "OpenAI (2)") or let the user name their providers. |
| U04 | Both | No "Reset to Defaults" button for individual fields or sections. Users who experiment may have to manually revert every field. | Add a reset button per section, or at least for the entire form. |
| U05 | Both | No confirmation dialog before "Discard Changes" — changes are silently lost. | Add a `window.confirm()` or inline warning when discarding unsaved changes. |
| U06 | AdvancedSettingsForm | The "Remove" button appears next to "Add Provider" but has `variant="danger"` — it deletes the currently active provider with no confirmation. | Add a confirmation step before removing a provider. |
| U07 | AdvancedSettingsForm | The form is very long (6 sections, ~50+ fields). No collapsible sections, no progress indicator, no scroll-to-top button. | Consider an accordion pattern for sections, or a sticky sidebar navigation. |

---

## 6. Summary of Priority Fixes

### High Priority (must fix)

| ID | Fix |
|----|-----|
| K02 | Convert tutor mode buttons to a proper radio group with `role="radiogroup"`, `role="radio"`, `aria-checked`, and keyboard arrow-key handling. |
| S01 | Wrap error messages in a container with `role="alert"` and `aria-live="polite"`. |
| S03 | Link ToggleSwitch descriptions via `aria-describedby`. |
| U01 | Resolve the inconsistent save model in BasicSettingsForm. |
| U02 | Align save models between both forms. |

### Medium Priority

| ID | Fix |
|----|-----|
| K01 | Add `focus-visible:ring-2` to tutor mode buttons. |
| C01 | Verify `var(--color-primary)/5` meets 3:1 non-text contrast; replace with a solid background if not. |
| C02 | Verify `var(--color-muted)` meets 4.5:1 for small helper text. |
| U06 | Add confirmation before provider removal. |

### Low Priority

| ID | Fix |
|----|-----|
| R02 | Consider reducing the number of tutor options shown at once on mobile, or use a Select as fallback. |
| R04 | Consider collapsible sections for the advanced form. |
| U03 | Show human-readable provider names in the dropdown. |
| U05 | Add unsaved-changes confirmation dialog. |
| U07 | Add section accordions or a sticky table of contents for the advanced form. |

---

## 7. Positive Highlights

- All form controls use `<label>` with proper `htmlFor`/`id` associations (Input, Select, Textarea).
- The `ToggleSwitch` component correctly implements `role="switch"` with `aria-checked`.
- The `Button` component has `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2` — a good focus indicator pattern.
- `AdvancedSettingsForm` uses semantic `<section>` elements with `<h3>` headings — good for screen reader navigation.
- Responsive grid classes (`sm:grid-cols-2`, `sm:grid-cols-3`) are used consistently.
- Input components use native HTML validation attributes (`min`, `max`, `step`, `type`).
