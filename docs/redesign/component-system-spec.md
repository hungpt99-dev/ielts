# IELTS Journey — Component System Specification

## Overview

This document specifies the reusable UI component system for the redesigned IELTS Journey website. It builds on the existing component foundation in `packages/ui/src/components/` and `apps/web/src/components/ui/`, extending and refining the system for the soft, modern, mobile-first redesign direction.

The component system follows these principles:

- **Semantic building blocks**: Each component serves a clear, single purpose
- **Consistent API**: Props follow predictable patterns across components (variant, size, className, style)
- **Accessible by default**: All components include appropriate ARIA attributes, keyboard support, and focus management
- **Responsive by design**: Components adapt to viewport changes without separate mobile variants
- **Theme-aware**: All visual properties reference CSS custom properties from the design token system
- **Progressive enhancement**: Core functionality works without JavaScript where possible

---

## Component Inventory

### 1. Button

**Existing in**: `packages/ui/src/components/Button.tsx`, `apps/web/src/components/ui/Button.tsx`

**Purpose**: Primary action trigger across the website — CTAs, form submissions, navigation actions.

**Visual Style**: Rounded (`radius.lg`), semibold text, inline-flex with icon support. Feels tactile with subtle scale-down on press.

**States**:
| State | Behavior |
|-------|----------|
| Default | Variant-specific background, text, and border |
| Hover | Darker background (primary, danger, success, warning) or outline emphasis (secondary, ghost) |
| Active/Pressed | Scale down to 0.98, darker background |
| Focus | Ring shadow using `border.focus` token |
| Disabled | Opacity 0.6, cursor not-allowed, no hover effects |
| Loading | Spinner replaces icon, content hidden, disabled behavior |

**Variants**:
| Variant | Use Case |
|---------|----------|
| `primary` | Main CTAs, form submit, "Start", "Continue" |
| `secondary` | Secondary actions, "Cancel", "Back" |
| `ghost` | Subtle actions in dense areas, "Skip", "Dismiss" |
| `danger` | Destructive actions, "Delete", "Remove" |
| `success` | Completion actions, "Save", "Confirm" |
| `warning` | Cautionary actions |

**Sizes**: `xs` | `sm` | `md` | `lg`
- `xs`: Dense inline actions (table rows, cards)
- `sm`: Compact buttons, card actions
- `md`: Default button size
- `lg`: Hero/landing page CTAs, full-width primary actions on mobile

**Props**: variant, size, loading, icon, iconPosition (left/right), fullWidth, plus standard button HTML attributes.

**Responsive**: `lg` size on desktop, `md` or `sm` on mobile for the same button. `fullWidth` on mobile for primary CTAs.

**Accessibility**: Proper `type="button"` default, `aria-label` for icon-only buttons, `disabled` attribute, loading state communicated via `aria-busy`.

**Usage**: Every interactive surface — dashboard, study plan, practice, settings, modals.

---

### 2. Icon Button

**Existing in**: `packages/ui/src/components/IconButton.tsx`

**Purpose**: Compact circular/square button for icon-only actions — close, back, edit, menu toggle.

**Visual Style**: Square/circular, centered icon, no visible text. Matches Button variant styling but in compact form.

**States**: Same as Button — hover darkens, active scales down, focus shows ring, disabled dims.

**Variants**: `primary` | `secondary` | `ghost`

**Sizes**: `xs` (32px) | `sm` (36px) | `md` (44px)

**Props**: variant, size, label (required aria-label), icon (ReactNode), plus standard button attributes.

**Responsive**: `sm` as default on desktop, `md` on mobile for larger touch targets (44px minimum).

**Accessibility**: Requires `label` prop which becomes `aria-label` and `title`. Focus visible ring.

**Usage**: Modal/drawer close buttons, vocabulary play button, settings action icons, AI Tutor action buttons.

**New recommendation**: Add `xs` size variant for inline use in cards and tables.

---

### 3. Card

**Existing in**: `packages/ui/src/components/Card.tsx`, `apps/web/src/components/ui/Card.tsx`

**Purpose**: Primary content container — groups related information and actions. The fundamental building block of the dashboard.

**Visual Style**: White/light surface (`surface.card`), rounded (`radius.xl`), subtle border and shadow. Elevated variant has larger shadow. Tutor variant has distinct background/border.

**States**: Default (static), hoverable (cursor pointer, shadow elevation on hover), disabled (reduced opacity).

**Variants**:
| Variant | Styling | Use Case |
|---------|---------|----------|
| `default` | White bg, sm shadow | Standard content cards |
| `elevated` | White bg, md shadow | Modals, hero cards, feature highlights |
| `outlined` | Transparent bg, border only | Settings sections, bordered groups |
| `tutor` | Tutor-colored bg/border | AI Tutor messages, recommendations |
| `skill` | White bg with skill accent | Skill progress cards |

**Padding**: `none` | `xs` | `sm` | `md` | `lg`

**Props**: variant, padding, header (ReactNode), footer (ReactNode), hoverable (boolean), children.

**Responsive**: Full width by default on mobile, constrained width on desktop depending on grid context. Padding reduces from `lg` to `md` on mobile.

**Accessibility**: `article` or `section` role appropriate for semantic structure. `aria-label` when card is clickable. Keyboard enter/space triggers hoverable click.

**Usage**: Dashboard sections, skill cards, study tasks, vocabulary words, practice items, settings sections, modals.

**Enhancement for redesign**: Add left-accent border variant for skill-typed cards. Add `tint` variant with subtle gradient background for hero sections.

---

### 4. Badge

**Existing in**: `packages/ui/src/components/Badge.tsx`, `apps/web/src/components/ui/Badge.tsx`

**Purpose**: Short label indicating status, category, difficulty, or count. Used for skill tags, review status, difficulty level, notification counts.

**Visual Style**: Compact pill/small tag, filled background with contrasting text, rounded full. Optional icon prefix.

**States**: Static visual only (not interactive directly, but can be within a parent).

**Variants**:
| Variant | Use Case |
|---------|----------|
| `default` | Generic label |
| `primary` | Feature badge, active filter |
| `success` | Completed, mastered, correct |
| `warning` | Needs review, medium difficulty |
| `danger` | Weak skill, hard difficulty, urgent |
| `info` | Informational label |
| `listening` | Listening skill tag |
| `reading` | Reading skill tag |
| `writing` | Writing skill tag |
| `speaking` | Speaking skill tag |

**Sizes**: `xs` (2px padding) | `sm` (standard) | `md` (larger for emphasis)

**Props**: variant, size, icon (ReactNode), removable (boolean), onRemove (callback), children.

**Responsive**: Badges scale with font. `xs` for dense lists, `sm` as default, `md` for prominent display.

**Accessibility**: Already includes `aria-label` on remove button. Ensure color is not the only differentiator — add icon or text distinction.

**Usage**: Vocabulary word difficulty, skill labels, study task metadata, review status indicators, notification badges.

**Enhancement for redesign**: Add grammar and vocabulary skill variants. Add `outlined` variant for secondary badges.

---

### 5. Input

**Existing in**: `packages/ui/src/components/Input.tsx`, `apps/web/src/components/ui/Input.tsx`

**Purpose**: Text input for forms, settings, search, and data entry.

**Visual Style**: Clean bordered input with rounded corners (`radius.md`), subtle border. Label above, helper/error text below. Optional icon inside.

**States**:
| State | Behavior |
|-------|----------|
| Default | Border `color.border.default`, bg `color.surface.card` |
| Focus | Border `color.border.focus`, colored focus ring |
| Error | Border `color.border.danger`, danger-colored ring |
| Disabled | Reduced opacity, muted background |
| Filled/Valid | Default border, no special state |

**Variants**: Size only — `sm` | `md` | `lg`

**Sizes**: `sm` (compact), `md` (default), `lg` (large, for landing page forms).

**Props**: inputSize, label, helperText, error, icon (ReactNode), iconPosition (left/right), fullWidth.

**Responsive**: Full width by default. On mobile, ensure adequate touch target height (44px minimum for `md` size).

**Accessibility**: Label associated via `htmlFor`/`id`. Error state uses `aria-describedby` linking to error text. `aria-invalid` when error prop is set.

**Usage**: Settings forms, onboarding, study plan configuration, vocabulary input, profile editing.

---

### 6. Search Input

**Existing in**: `packages/ui/src/components/SearchInput.tsx`

**Purpose**: Specialized input for search/filter — includes search icon, clear button, and optional debounced value.

**Visual Style**: Input with search icon (SVG magnifying glass) on the left, clear button (×) appears when value is non-empty.

**States**: Same as Input with additional "has value" state showing clear button.

**Variants**: Size only — `sm` (compact lists), `md` (standard), `lg` (full-page search).

**Props**: inputSize, onClear, value, onChange, plus standard input attributes.

**Responsive**: Full width on mobile, constrained width on desktop (typically within a section layout).

**Accessibility**: Clear button has `aria-label="Clear search"`. Search icon is decorative (`aria-hidden="true"`/`pointerEvents: none`).

**Usage**: Vocabulary search/filter, saved articles search, practice history filter, mistake review filter.

---

### 7. Select

**Existing in**: `apps/web/src/components/ui/Select.tsx` (native HTML select)

**Purpose**: Choose from a list of options — language selection, study time, skill level, settings.

**Visual Style**: Native HTML `<select>` styled to match Input appearance — rounded border, same spacing/font system. Currently implemented as a native select in the web app. No custom dropdown component exists.

**States**: Default, focus (colored ring), error (danger border), disabled.

**Props** (current): label, error, options (value/label array), placeholder, plus standard select attributes.

**Gap**: Current implementation is a basic native `<select>`. For the redesign, consider a custom Select component with:
- Search filtering within options
- Keyboard navigation (arrow keys, type to jump)
- Grouped options
- Custom dropdown with animation
- Multi-select support

**Responsive**: Full width on mobile. Native select behavior is acceptable and preferred for mobile (platform-native behavior).

**Accessibility**: Native `<select>` with associated label. Use `<optgroup>` for grouped options. `aria-describedby` for error text.

**Usage**: Onboarding form (level, target band, exam date), settings (language, theme), study plan configuration.

**Proposed enhancement**: Create a custom Select in `packages/ui` matching the design system pattern with dropdown, search, and keyboard support.

---

### 8. Date Picker

**Not existing yet** — new component needed.

**Purpose**: Select exam date, set study schedule dates, filter progress by date range.

**Visual Style**: Clean calendar view inside a dropdown or modal. Minimalist design with clear month navigation. Selected date highlighted with primary color. Today indicated with subtle dot or ring.

**States**:
| State | Behavior |
|-------|----------|
| Default | Calendar grid, all dates available |
| Selected | Primary fill on chosen date |
| Today | Ring/badge on current date |
| Past | Muted, non-clickable (for exam date selection context) |
| Weekend/Disabled | Greyed out (if applicable) |
| Hover | Light tint on hovered date |

**Variants**: `input` (trigger + dropdown calendar) | `inline` (always-visible calendar) | `range` (start/end date selection).

**Props**: value (Date), onChange, minDate, maxDate, placeholder, label, error, disabled, variant.

**Responsive**: On mobile, use a full-screen modal/overlay with larger touch targets (minimum 44px date cells). On desktop, show dropdown calendar.

**Accessibility**: Full keyboard navigation — arrow keys move between dates, Enter/Space selects, Escape closes. `aria-label` on each date cell. Month/year announced with `aria-live`. Role="grid" with proper gridcell/row markup.

**Usage**: Exam date setting in onboarding, study plan configuration, progress period filter, AI Progress Review date range.

---

### 9. Modal

**Existing in**: `packages/ui/src/components/Modal.tsx`, `apps/web/src/components/ui/Modal.tsx`

**Purpose**: Overlay dialog for focused tasks — confirmations, forms, detail views, vocabulary word detail.

**Visual Style**: Centered card on dark overlay backdrop. Transition: backdrop fades in, modal slides up. Rounded corners (`radius.2xl`), elevated shadow.

**States**: Open (animated in) / Closed (removed from DOM). Body scroll locked when open.

**Variants**: Size — `sm` (400px, confirm dialogs), `md` (520px, default), `lg` (680px, forms), `xl` (900px, content heavy), `full` (full-width, mobile).

**Props**: open (boolean), onClose, title, size, footer (ReactNode), closeOnOverlay (boolean), showCloseButton (boolean), children.

**Enhancement for redesign**:
- Add `portal` rendering (render to `document.body`)
- Add `preventScroll` (body scroll lock with scrollbar compensation)
- Add `onOpen` callback
- Add animation variants (slideUp, scaleIn, fadeIn)
- Add `role="alertdialog"` for confirm variants

**Responsive**: On mobile < 640px, modal should become full-screen or bottom-sheet style. Padding reduces, title size reduces. Use `drawer` behavior on mobile where appropriate.

**Accessibility**: Focus trap within modal. Focus first focusable element on open. Restore focus on close. Escape key closes. `aria-modal="true"`. Overlay click dismisses (if enabled). Close button has `aria-label="Close modal"`.

**Usage**: Vocabulary word detail, vocabulary save form, confirm delete, settings sub-forms, onboarding steps.

---

### 10. Drawer

**Existing in**: `packages/ui/src/components/Drawer.tsx`

**Purpose**: Side panel for secondary content — vocabulary detail sidebar, settings sub-panel, navigation menu (mobile), AI Tutor side panel.

**Visual Style**: Overlay panel sliding from left, right, or bottom. Dark backdrop. Slide-in animation with easing. Border-light separator from edge.

**States**: Open (slide in) / Closed (slide out/destroyed). Body scroll locked when open.

**Variants**:
| Side | Use Case |
|------|----------|
| `left` | Mobile navigation menu, content index |
| `right` | Vocabulary detail, settings panel, info sidebar |
| `bottom` | Bottom sheet on mobile, quick actions |

**Sizes**: `sm` (280px), `md` (360px), `lg` (480px), `full` (100%).

For bottom drawer: `sm` (30vh), `md` (50vh), `lg` (70vh), `full` (100vh).

**Props**: open, onClose, title, side, size, children, footer, closeOnOverlay, showCloseButton.

**Enhancement for redesign**:
- Add drag-to-dismiss for bottom drawer (swipe down to close)
- Add backdrop blur (`backdrop-filter: blur(4px)`)
- Add `preventScroll` with scrollbar compensation
- Add focus trap (when drawer is open, focus cycles within drawer)

**Responsive**: On mobile, right panel becomes bottom drawer or full-screen overlay. On desktop, side panels maintain pinned position.

**Accessibility**: Focus trap. Escape key closes. Overlay click dismisses. `role="dialog"`, `aria-modal="true"`. Focus moves to drawer title or first element on open.

**Usage**: Vocabulary detail panel (right, md), mobile nav menu (left, full), AI Tutor extended content (right, lg), quick settings (bottom, sm).

---

### 11. Toast

**Existing in**: `packages/ui/src/components/Toast.tsx`, `apps/web/src/components/ui/Toast.tsx`

**Purpose**: Non-blocking notification for action feedback — vocabulary saved, plan generated, error occurred, settings updated.

**Visual Style**: Compact colored pill/bar at top-right or bottom-right. Auto-dismiss after 3 seconds. Slide-in from right, fade-out on dismiss. Color-coded by type.

**States**:
| State | Behavior |
|-------|----------|
| Entering | Slide in from right, opacity 0→1 |
| Visible | Full opacity, static position |
| Exiting | Slide right, opacity 1→0 |
| Hover | Pause auto-dismiss timer |

**Variants**:
| Variant | Icon | Background | Use Case |
|---------|------|------------|----------|
| `success` | ✓ | `color.status.success.primary` | Action completed successfully |
| `error` | ✕ | `color.status.danger.primary` | Action failed |
| `info` | ℹ | `color.status.info.primary` | General information |
| `warning` | ⚠ | `color.status.warning.primary` | Warning/caution |

**Props** (current): type (success/error/info/warning), message (string), autoHideDuration (number, default 2800).

**Enhancement for redesign**:
- Add `action` (ReactNode) for actionable toasts (e.g., "Undo")
- Add `position` prop (top-right, top-left, bottom-right, bottom-left, top-center)
- Add `stack` behavior — multiple toasts stack with gap
- Convert icon from text to SVG for better visual quality
- Add `onClose` callback

**Responsive**: On mobile, toasts should be full-width at bottom (above safe area) for easier tap access.

**Accessibility**: `role="alert"`, `aria-live="polite"`. Keyboard dismissible (tab to close button, Enter/Space to dismiss). Not auto-dismissing for error variants (user must manually dismiss).

**Usage**: "Vocabulary saved" confirmation, "Study plan generated" success, "Connection lost" error, "Settings updated" feedback.

---

### 12. Tabs

**Not existing** — new component needed.

**Purpose**: Switch between related content sections — practice skill tabs (Listening/Reading/Writing/Speaking), settings categories, progress views.

**Visual Style**: Horizontal tab bar with active indicator line. Clean, minimal. Active tab has colored text and underline accent. Inactive tabs are muted.

**States**:
| State | Behavior |
|-------|----------|
| Default (inactive) | Muted text, no underline |
| Active | Primary color text, underline accent |
| Hover | Slight background tint (on non-active tabs) |
| Focus | Focus ring |
| Disabled | Grayed out, no pointer |

**Variants**:
| Variant | Style | Use Case |
|---------|-------|----------|
| `underline` | Active tab has bottom border | Settings, vocabulary sections |
| `pills` | Active tab has filled pill bg | Practice skill selector |
| `cards` | Each tab is a small card | Dashboard section switcher |

**Sizes**: `sm` (compact, for dense areas), `md` (default).

**Props**: tabs (array of {id, label, icon?, badge?}), activeTab (string), onChange (tabId), variant, size.

**Responsive**: On mobile, tabs may scroll horizontally (`overflow-x: auto`, no scrollbar). For very few tabs (2-3), use full-width equal distribution.

**Accessibility**: `role="tablist"`, each tab `role="tab"` with `aria-selected`, `aria-controls` pointing to panel. Panel has `role="tabpanel"`, `aria-labelledby`. Arrow keys navigate between tabs (left/right).

**Usage**: Practice page skill tabs, settings category tabs, vocabulary section tabs, progress view tabs, AI Tutor mode selector.

---

### 13. Progress Bar

**Existing in**: `packages/ui/src/components/ProgressBar.tsx`

**Purpose**: Horizontal progress indicator — study plan completion, skill level progress, task progress, vocabulary retention.

**Visual Style**: Thin rounded track with colored fill. Optional label row above showing name and percentage. Smooth width transition on value change.

**States**: Default (animated fill), complete (100% fill with variant color), empty (0% fill, track only), indeterminate (loading state with animated shimmer).

**Variants**: `primary` | `success` | `warning` | `danger` | `info`

**Sizes**: `xs` (4px, dense), `sm` (6px, default), `md` (10px, emphasized).

**Props**: value (number), max (number, default 100), variant, size, showLabel (boolean), label (string), animated (boolean).

**Enhancement for redesign**:
- Add skill-specific variants using skill color tokens
- Add striped/patterned fill for visual interest
- Add `indeterminate` mode for loading states
- Add transition duration control

**Responsive**: Full width by default. On mobile, `md` size for better visibility.

**Accessibility**: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. Label row provides visible text alternative.

**Usage**: Study plan daily completion, skill band progress, vocabulary retention rate, task list progress, exam countdown.

---

### 14. Progress Ring

**Existing in**: `packages/ui/src/components/ProgressRing.tsx`

**Purpose**: Circular progress indicator — skill scores, overall progress, completion percentage, band score visualization.

**Visual Style**: SVG circle with colored stroke. Track (background) is light, fill is colored. Percentage label centered. Smooth stroke-dashoffset animation.

**States**: Default (partial fill), complete (full circle), empty (no fill), animated fill transition.

**Variants**: `primary` | `success` | `warning` | `danger` | `info`

**Props**: value (number), max (number, default 100), size (number, default 48), strokeWidth (number, default 4), variant, showLabel (boolean).

**Enhancement for redesign**:
- Add skill-specific variants using skill color tokens
- Add `label` prop for custom centered content
- Add `thickness` variants (thin/medium/thick) mapped to strokeWidth
- Support multi-ring (overlapping progress rings for overall band with skill breakdown)

**Responsive**: Ring size should scale on mobile. Default 48px, can go to 64px for emphasis, 32px for compact areas.

**Accessibility**: `role="progressbar"` on SVG container with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. The centered percentage text provides visible alternative.

**Usage**: Dashboard overall progress, skill band scores, vocabulary mastery rate, study plan completion.

---

### 15. Empty State

**Existing in**: `packages/ui/src/components/EmptyState.tsx`, `apps/web/src/components/ui/EmptyState.tsx` (extends with variants: Default, Inline, Card, Illustrated)

**Purpose**: Communicate absence of content with guidance — no vocabulary saved, no study plan, no practice history, etc.

**Visual Style**: Centered content with optional icon/illustration, title, description, and action button. Soft, friendly tone. The web app has a rich system with app-specific variants.

**States**: Single state — displays when a data container has no content.

**Variants** (reusing web patterns):
| Variant | Container | Use Case |
|---------|-----------|----------|
| `default` | Card with padding | Page-level empty state |
| `inline` | Dashed border box | Section-level empty state |
| `card` | Gradient background, rounded | Featured empty state |
| `illustrated` | Large illustration, dual action | Onboarding, first-time user |

**Props**: icon (ReactNode), title (string), description (string), action (ReactNode or {label, onClick}), secondaryAction, compact (boolean).

**Context-specific messages**: The web app already has a rich `STATUS_MESSAGES` mapping (no-vocabulary, no-study-plan, no-progress, no-mistakes, no-articles, no-tasks, no-ai-chat, etc.) that should be reused.

**Responsive**: Compact on mobile (smaller padding, smaller icon). Full spacing on desktop.

**Accessibility**: Semantic heading (`<h3>`) for title. Clear action button with descriptive label. Icon is decorative (`aria-hidden="true"`).

**Usage**: Every page/feature that displays a list or collection of user data.

---

### 16. Loading Skeleton

**Existing in**: `packages/ui/src/components/LoadingSkeleton.tsx` (base), `apps/web/src/components/ui/LoadingSkeleton.tsx` (extended with domain-specific skeletons)

**Purpose**: Placeholder UI while content loads — prevents layout shift, communicates loading state clearly.

**Visual Style**: Animated pulse/shimmer effect on gray rounded rectangles. Matches the shape and size of actual content.

**States**: Single animation state (shimmering pulse).

**Variants** (base):
| Variant | Shape | Use Case |
|---------|-------|----------|
| `text` | Thin rectangle (14px height) | Paragraph lines |
| `card` | Large rectangle (120px) | Card loading |
| `circle` | Circle (40px) | Avatar loading |
| `avatar` | Small circle (32px) | Compact avatar |
| `rect` | Medium rectangle (80px) | Generic block |

**Domain-specific skeletons** (web app):
| Skeleton | Use Case |
|----------|----------|
| `DashboardSkeleton` | Full dashboard loading |
| `TaskListSkeleton` | Study plan task list |
| `SkillProgressSkeleton` | Skill progress cards |
| `StudyPlanSkeleton` | Study plan page |
| `VocabListSkeleton` | Vocabulary list |
| `StatsRowSkeleton` | Statistics row |

**Props**: variant, width, height, count (repeat count), gap (spacing between repeated items).

**Enhancement for redesign**:
- Add `shimmer` animation direction (left-to-right, top-to-bottom)
- Add skeleton for new page types: AI Tutor chat, practice pages, progress charts, mistake review list
- Add color animation that uses `skeleton` and `skeletonShine` tokens

**Responsive**: Skeletons should match responsive layout — full width on mobile, grid-compatible on desktop.

**Accessibility**: `role="status"`, `aria-label="Loading"`. Content inside skeleton should not be announced.

**Usage**: Pages with async data — dashboard, study plan, vocabulary, practice results, progress, settings.

---

### 17. Error State

**Existing in**: `apps/web/src/components/ui/EmptyState.tsx` (ErrorState export), `apps/web/src/components/ui/ErrorDisplay.tsx`

**Purpose**: Communicate errors clearly — network failure, AI generation failed, data load error, permission denied.

**Visual Style**: Similar to Empty State but with danger icon/theme. Shows error message, optional retry button. Inline variant for compact areas.

**States**:
| Variant | Size | Use Case |
|---------|------|----------|
| `card` | Full card with icon | Page-level error |
| `inline` | Compact bar with retry | Inline, section-level error |
| `fullscreen` | Centered with back button | Full page error |

**Props**: message (string), error (unknown, for error extraction), onRetry (callback), retryLabel (string, default "Try Again"), variant, title (string), compact (boolean).

**Responsive**: Full page on mobile for card/fullscreen variants. Inline variant stays compact.

**Accessibility**: `role="alert"`. Error message is descriptive, not technical. Retry button is clearly labeled. Error detail (from error object) is visually hidden but available to screen readers.

**Usage**: AI generation failures, network errors, data load failures, empty search results, permission errors.

---

### 18. Skill Card

**Existing in**: `packages/ui/src/components/SkillCard.tsx`

**Purpose**: Display IELTS skill progress — each of the four skills (Listening, Reading, Writing, Speaking) with band score and progress bar.

**Visual Style**: Card with skill-colored left accent, skill icon in tinted circle, score prominently displayed, thin progress bar. "Needs work" tag for weak skills.

**States**: Default, weak (highlighted border), hover (slight elevation).

**Props**: skill (listening/reading/writing/speaking), label (string), score (number), maxScore (number, default 9), icon (ReactNode), trend (up/down/stable), weak (boolean), children.

**Skill type currently missing**: The existing `SkillType` does not include `grammar` or `vocabulary`. For the redesign, add grammar and vocabulary to the skill type system.

**Responsive**: Full width in single column on mobile (stacked). 2-column grid on tablet, 4-column on desktop.

**Accessibility**: Score is text (not image). Progress bar has `role="progressbar"`. Trend indicator uses arrow symbols (supplemented by color).

**Usage**: Dashboard skill progress section, study plan skill breakdown, progress page skill comparison.

**Enhancement for redesign**: Add grammar and vocabulary variants. Add `action` slot for quick-study button. Make the progress bar clickable for detail drill-down.

---

### 19. Study Task Card

**Existing in**: `packages/ui/src/components/StudyTaskCard.tsx`

**Purpose**: Display a single study task in a plan — listening exercise, reading passage, writing prompt, speaking practice, vocabulary review, grammar lesson.

**Visual Style**: Compact horizontal card with status icon (○ pending, ◷ in-progress, ✓ completed, – skipped), skill-colored left border accent, title, description, duration, and action button.

**States**:
| Status | Icon | Color | Visual |
|--------|------|-------|--------|
| `pending` | ○ | Muted | Default appearance |
| `in_progress` | ◷ | Primary | Accent border emphasized |
| `completed` | ✓ | Success | Muted text, strikethrough optional |
| `skipped` | – | Secondary | Dimmed |

**Props**: title, description, skill (SkillType), status (TaskStatus), duration (string like "15 min"), icon, action (ReactNode).

**Responsive**: Full width in list. On mobile, duration text may be hidden and shown as icon tooltip.

**Accessibility**: Status icon has `aria-label` or is described by adjacent text. Task is focusable as a list item. Action button has descriptive label.

**Usage**: Today's study plan, daily task list in roadmap, generated study plan preview.

---

### 20. AI Tutor Message Card

**Existing in**: `packages/ui/src/components/AITutorMessageCard.tsx`

**Purpose**: Display a single chat message in AI Tutor conversation — supports both tutor and user messages with distinct styling.

**Visual Style**: Chat bubble layout — tutor on left, user on right. Tutor messages: tinted background (tutor color), rounded corners with left-ear flattened. User messages: primary color background, rounded corners with right-ear flattened. Optional avatar, timestamp, and action buttons.

**States**:
| Role | Background | Border | Border Radius |
|------|-----------|--------|---------------|
| Tutor (standard) | Tutor accent light | Tutor border | `lg-lg-lg-2xs` |
| Tutor (proactive) | Tutor background | Tutor border | `lg-lg-lg-2xs` |
| User | Primary light | Primary light | `lg-lg-2xs-lg` |

**Extra variants**: `proactive` (distinct visual for unsolicited AI suggestions), `correction` (writing correction with edit markup), `explanation` (vocabulary/grammar explanation with distinct styling).

**Props**: message (string), role ("tutor" | "user"), avatar (ReactNode), actions (ReactNode), timestamp (string), proactive (boolean).

**Enhancement for redesign**:
- Add `typing` state — animated dots when AI is generating
- Add `markdown` support for rich responses (lists, code, bold)
- Add `correction` variant for writing feedback
- Add suggestion chips at bottom of tutor messages
- Add `role="correction"` with edit markup rendering

**Responsive**: Message max-width adjusts — 80% on desktop, 90% on mobile. Avatar hides on very small screens.

**Accessibility**: `role="log"` on chat container. `aria-live="polite"` for new messages. `aria-label` on avatar images. Keyboard navigable action buttons.

**Usage**: AI Tutor chat page, floating AI Tutor popup, AI Progress Review, writing correction feedback.

---

### 21. AI Tutor Recommendation Card

**Not existing** — new compound component needed.

**Purpose**: Display AI Tutor's proactive recommendations on dashboard — "You should review weak skills", "Practice speaking today", "Review vocabulary from yesterday".

**Visual Style**: Distinct card with proactive tutor accent (purple gradient or icon). Shows tutor avatar/icon, recommendation text, reason/context, and action button. Less dense than a chat message — more like a suggestion card.

**States**:
| State | Behavior |
|-------|----------|
| Default | Card with recommendation |
| Dismissed | Fade out animation, slides away |
| Accepted | Brief confirmation animation |
| Loading | Skeleton placeholder while AI generates |

**Props**: recommendation (string), reason (string), action ({label, onClick}), icon (ReactNode), onDismiss (callback), loading (boolean).

**Responsive**: Full width on mobile. Side-by-side with other cards on desktop.

**Accessibility**: Dismissible with button (`aria-label="Dismiss recommendation"`). Action button has clear label. Card is not auto-focusing (placed in reading order).

**Usage**: Dashboard AI recommendation section, study plan AI suggestions, progress page AI insights.

---

### 22. Vocabulary Word Card

**Existing in**: `packages/ui/src/components/VocabularyWordCard.tsx`

**Purpose**: Display a vocabulary word in list/grid format — word, meaning, part of speech, difficulty, review status, and actions.

**Visual Style**: Horizontal card with review status dot, word prominently displayed, meaning as secondary text, difficulty badge, part of speech in italic, and action buttons (pronounce, detail, save).

**States**:
| Review Status | Icon | Color |
|---------------|------|-------|
| `new` | ● | Muted |
| `learning` | ◐ | Primary |
| `reviewing` | ◑ | Warning |
| `mastered` | ★ | Success |

**Difficulty variants**: `easy` (green badge), `medium` (amber badge), `hard` (red badge).

**Props**: word (string), meaning (string), difficulty (easy/medium/hard), reviewStatus (new/learning/reviewing/mastered), partOfSpeech (string), onPlay (callback), onDetail (callback), actions (ReactNode), compact (boolean).

**Enhancement for redesign**:
- Add `selected` state for multi-select mode
- Add `saved` context label (e.g., "Saved from 'Climate Change Article'")
- Add swipe-to-delete on mobile
- Add word forms display (e.g., "plural: analyses")
- Add `highlighted` state for search results

**Responsive**: Compact on mobile (`compact` mode). Full detail with more spacing on tablet/desktop. Grid layout for desktop (2-3 columns).

**Accessibility**: Card is focusable and clickable (opens detail). Pronounce button has `aria-label="Pronounce {word}"`. Review status icon has tooltip/text alternative.

**Usage**: Vocabulary notebook list, vocabulary review results, saved content word list.

---

### 23. Vocabulary Detail Panel

**Not existing as standalone** — new component needed. Currently vocabulary detail is handled via modal.

**Purpose**: Full detail view of a vocabulary word — definitions, examples, pronunciation, word forms, synonyms, IELTS usage context, AI Tutor link.

**Visual Style**: Rich content card/panel with sections: word header (large, pronunciation button, part of speech), difficulty badge and review status, meaning section, examples section, word forms, synonyms/antonyms, IELTS usage notes, and action bar (edit, delete, ask AI, save to review).

**States**:
| State | Behavior |
|-------|----------|
| Default | Full word detail |
| Edit mode | Inline editing of meaning, examples |
| Saving | Brief loading state on save button |
| Saved | Brief success toast after save |

**Variants**: `modal` (opens as centered modal), `drawer` (opens as side panel), `fullscreen` (mobile full screen).

**Props**: word object (full vocabulary data), onEdit (callback), onDelete (callback), onAskAI (callback), onPlay (callback), onBack (callback), variant.

**Responsive**: On mobile, opens as full-screen view with back button at top. On tablet/desktop, opens as right-side drawer or modal.

**Accessibility**: Focus management (focus word header on open). Back button for mobile. Escape to close. `aria-label` on all action buttons.

**Usage**: Vocabulary detail page, vocabulary notebook word tap on desktop.

---

### 24. Practice Card

**Not existing** — new component needed.

**Purpose**: Display a practice exercise in a list or as a start card — quick-start practice for each IELTS skill.

**Visual Style**: Card with skill-colored left gradient/bar, exercise type label, estimated time, brief description, difficulty indicator, and "Start" button. More prominent than study tasks — designed as entry points.

**States**: Default (available), completed (checkmark overlay), locked (future exercise), loading (generating).

**Props**: skill (SkillType), title (string), description (string), duration (string), difficulty (easy/medium/hard), status (available/completed/locked), onStart (callback), onContinue (callback).

**Responsive**: Full width stacked on mobile. 2-column grid on tablet. 3-column grid on desktop dashboard.

**Accessibility**: Focusable card with `role="button"` or nested button for start. Locked state communicated with `aria-disabled`.

**Usage**: Practice landing page, reading/listening/writing/speaking practice lists, grammar practice, vocabulary practice.

---

### 25. Mistake Card

**Not existing** — new component needed.

**Purpose**: Display a recorded mistake in mistake review — question/user answer/correct answer/explanations.

**Visual Style**: Card with danger-colored left accent. Shows:
- Question/exercise type badge
- User's answer (marked as incorrect)
- Correct answer
- Explanation/skill tip
- Tags: skill category, repeated count, date
- Actions: "Practice Similar", "Ask AI Tutor", "Dismiss"

**States**: Default, repeated (highlighted with warning icon), dismissed (reduced opacity, hidden with option to restore).

**Props**: mistake data (question, userAnswer, correctAnswer, explanation, skill, repeated, date), onPracticeSimilar (callback), onAskAI (callback), onDismiss (callback).

**Responsive**: Full width in vertical list. On mobile, compact view with expandable detail.

**Accessibility**: Error state communicated clearly. Color not the only differentiator — question type badge and icon supplement.

**Usage**: Mistake review page, progress AI review, practice results.

---

### 26. Progress Summary Card

**Not existing** — new component needed.

**Purpose**: Display a summary metric on dashboard or progress page — study streak, completed tasks, vocabulary mastered, practice sessions completed.

**Visual Style**: Compact card with large metric number/icon, label, and optional trend indicator. Clean, minimal. Can include mini progress ring or sparkline.

**Variants**:
| Variant | Visual | Use Case |
|---------|--------|----------|
| `stat` | Large number, label, icon | Streak count, tasks done |
| `progress` | Number + mini bar | Band progress, completion % |
| `chart` | Mini sparkline | Weekly trend |

**States**: Default, loading (skeleton rectangle), zero (show 0 with "None yet" tone).

**Props**: label (string), value (string/number), icon (ReactNode), trend (up/down/stable), trendValue (string), variant, onClick (optional, for navigation).

**Responsive**: Equal-width cards in a row (2 per row on mobile, 4 per row on desktop).

**Accessibility**: Value is text (not image). Trend communicated with both icon and color.

**Usage**: Dashboard streak card, weekly tasks completed, vocabulary mastered count, study time today, progress page stats.

---

### 27. Dashboard Section

**Existing in**: `packages/ui/src/components/DashboardSection.tsx`

**Purpose**: Section container for dashboard — groups related cards/content with heading, description, optional action link.

**Visual Style**: Section with left icon, title, optional description, and right-side action link. Content area below with cards or list.

**Props**: title (string), description (string), action (ReactNode, typically a "See all" link/button), icon (ReactNode), children.

**Responsive**: Section header collapses on mobile — title and action on same line. Content area goes from multi-column to single column.

**Accessibility**: Section uses semantic `<section>` element. Title is `<h2>`. Action link has descriptive text (not just "See all").

**Usage**: Dashboard layout — "Your Skills", "Today's Tasks", "Vocabulary Review", "Recent Practice", "AI Recommendations".

---

### 28. Mobile Bottom Navigation

**Existing in**: `packages/ui/src/components/MobileBottomNavigation.tsx`

**Purpose**: Primary navigation on mobile — provides quick access to main sections: Dashboard, Today, AI Tutor, Vocabulary, Progress.

**Visual Style**: Fixed bottom bar with glass effect (backdrop blur). Centered icons with labels. Active state highlighted with primary color. Badge for notifications. Safe area handling for notched devices.

**States**:
| State | Visual |
|-------|--------|
| Inactive | Muted icon color, medium weight label |
| Active | Primary color icon, semibold label |
| Pressed | Scale down to 0.92 |
| Badge | Red notification dot/count on icon |

**Props**: items (MobileNavItem[] — each with id, label, icon, active, badge, onClick).

**Props per item**: id, label, icon, active (boolean), badge (number), onClick.

**Responsive**: Only visible on mobile (< 768px). Hidden on tablet/desktop (replaced by sidebar or top navigation). Height: 72px with `padding-bottom: env(safe-area-inset-bottom)`.

**Accessibility**: `role="navigation"`, `aria-label="Mobile navigation"`. Each item `aria-current="page"` when active. Minimum touch target 48px height, 56px width.

**Usage**: All authenticated pages on mobile. Items: Dashboard, Today/Tasks, AI Tutor, Vocabulary, Progress.

**Enhancement for redesign**: Add subtle active indicator line above icon. Add haptic feedback simulation on press. Ensure glass effect with backdrop blur.

---

### 29. Settings Section Card

**Not existing** — new compound component needed.

**Purpose**: Group related settings into cards — profile info, preferences, AI provider config, notification toggles.

**Visual Style**: Card with title, optional description, and list of settings items. Each setting row has label, control (toggle, select, input, button), and optional description. Clean, spacious rows with clear separation.

**Variants**:
| Variant | Content Type |
|---------|-------------|
| `info` | Avatar, name, email (profile header) |
| `toggles` | List of toggle switches |
| `fields` | List of labeled inputs |
| `actions` | List of action buttons (export, delete) |
| `mixed` | Combination of above |

**Props**: title (string), description (string), icon (ReactNode), children (settings items), variant.

**Responsive**: Full width card on mobile. Side-by-side cards on tablet/desktop in a 2-column grid.

**Accessibility**: Card is `<section>` with `<h2>` title. Each settings row has proper form label association.

**Usage**: Profile settings, AI provider settings, language settings, notification settings, data management, theme settings.

---

### 30. Extension Popup Card

**Existing in**: `packages/ui/src/components/ExtensionPopupCard.tsx`

**Purpose**: Display content within the browser extension popup — compact versions of vocabulary, article saving, text selection menu.

**Visual Style**: Compact card optimized for extension's fixed width (350px). Smaller padding, tighter spacing. Inherits design system tokens.

**States**: Default, selected, saving, saved.

**Props**: Depends on context (vocabulary, article, text).

**Responsive**: Extension has fixed width — components adapt to 350px width. No responsive breakpoints needed.

**Usage**: Extension popup for vocabulary saving, article saving, selected text actions.

---

### 31. Extension Action Menu

**Existing in**: `packages/ui/src/components/ExtensionActionMenu.tsx`

**Purpose**: Context menu for selected text — shows actions like "Save to Vocabulary", "Explain with AI", "Save to Notes", "Simplify".

**Visual Style**: Floating menu near selected text with icon+label action buttons. Compact, minimal, with shadow and rounded corners.

**States**: Visible (near selection), hidden, loading.

**Usage**: Extension text selection menu, explain panel.

---

### 32. Extension Sync Status Badge

**Existing in**: `packages/ui/src/components/ExtensionSyncStatusBadge.tsx`

**Purpose**: Show connection/sync status between extension and web app.

**Visual Style**: Small badge with sync icon and text: "Connected", "Syncing...", "Disconnected", "Error".

**States**: connected, syncing, disconnected, error.

**Usage**: Extension popup header, extension connection page in web app.

---

## Component Usage Mapping

This table maps components to pages/sections in the redesign:

| Page/Section | Key Components |
|---|---|
| Landing Page | Button (lg), Card (elevated), ProgressRing, SkillCard |
| Onboarding | Input, Select, DatePicker, Button, ProgressBar |
| Dashboard | DashboardSection, SkillCard, StudyTaskCard, ProgressSummaryCard, AI Tutor Recommendation Card, ProgressRing, Badge |
| Today's Study Plan | StudyTaskCard (list), ProgressBar, Button, Checkbox, AI Tutor Message Card |
| AI Study Plan Generator | Select, Input, DatePicker, ProgressBar, Button, Card |
| Full Study Roadmap | Card, ProgressBar, Badge, StudyTaskCard, Button |
| AI Tutor Chat | AI Tutor Message Card, Input, Button, IconButton |
| Vocabulary Notebook | VocabularyWordCard, SearchInput, Badge, VocabularyDetailPanel, Tabs |
| Vocabulary Review | Card, ProgressRing, Button, ProgressBar, Badge |
| Saved Content | Card, VocabularyWordCard, SearchInput, EmptyState, Badge |
| Practice Pages | PracticeCard, ProgressBar, Button, Badge, AI Tutor Message Card |
| Mistake Review | MistakeCard, Select, Badge, Button, AI Tutor Message Card |
| Learning Progress | ProgressRing, ProgressBar, Card, Badge, ProgressSummaryCard, SkillCard |
| AI Progress Review | Card, Button, ProgressRing, AI Tutor Message Card, Badge |
| Settings | SettingsSectionCard, Input, Select, Toggle Switch, Button |
| Extension Connection | Card, Button, Badge, EmptyState |
| Loading States | LoadingSkeleton (all variants) |
| Empty States | EmptyState (all variants) |
| Error States | ErrorState (all variants), ErrorBoundary |

---

## Component Implementation Priority

| Phase | Components | Rationale |
|---|---|---|
| 1 — Foundation | Button, Card, Badge, Input, SearchInput, IconButton | Core building blocks, already exist, need refinement |
| 2 — Feedback | Toast, Modal, Drawer, ProgressBar, ProgressRing, LoadingSkeleton, EmptyState, ErrorState | User feedback and overlay systems |
| 3 — Navigation | Tabs, MobileBottomNavigation | Navigation for redesigned layout |
| 4 — Forms | Select (custom), DatePicker | Form inputs for study plan and settings |
| 5 — Domain Cards | SkillCard, StudyTaskCard, VocabularyWordCard, PracticeCard, MistakeCard, ProgressSummaryCard | Domain-specific content display |
| 6 — AI Features | AI Tutor Message Card, AI Tutor Recommendation Card, VocabularyDetailPanel | AI Tutor interaction surfaces |
| 7 — Layout | DashboardSection, SettingsSectionCard | Page structure components |

---

## Component Consistency Rules

### Styling Approach
All components should follow the existing `packages/ui` pattern: inline styles referencing CSS custom properties via `var(--...)` syntax. No Tailwind classes in `packages/ui`. The web app layer (`apps/web`) may continue using Tailwind for layout.

### Props Convention
```tsx
// Standard pattern
interface ComponentNameProps {
  variant?: VariantType  // visual variant
  size?: SizeType        // size variant
  disabled?: boolean     // interactive state
  children?: ReactNode   // content
  className?: string     // external styling override
  style?: CSSProperties  // inline style override
}
```

### Variant + Size Pattern
Use `Record<string, Record<string, string>>` dictionaries for variants and sizes (matching existing `Button`, `Card`, `Badge`, `Input` patterns).

### Event Handling
Hover/focus states use React event handlers (`onMouseEnter`, `onFocus`) to imperatively apply styles, matching existing pattern. Avoid CSS `:hover`/`:focus` in inline styles.

### Animation
Refer to CSS keyframes by name (defined globally in `packages/theme/src/cssVariables.css`). Common animations: `fadeIn`, `slideUp`, `slideInRight`, `pulse`, `shimmer`.

### Accessibility Baseline
- Interactive components: keyboard focusable, `aria-label` when icon-only
- Form controls: associated `<label>`, `aria-describedby` for errors
- Overlays: focus trap, Escape to close, `aria-modal="true"`
- Status: `role="progressbar"`, `role="alert"`, `aria-live="polite"`
- Color: no information conveyed through color alone

---

## New Components to Create

Based on gap analysis of the existing codebase vs. redesign requirements:

1. **Select (custom)** — Replace native select with custom dropdown in `packages/ui`
2. **DatePicker** — New calendar-based date selector
3. **Tabs** — Tab navigation component (not existing anywhere)
4. **PracticeCard** — Practice exercise card
5. **MistakeCard** — Mistake review card
6. **ProgressSummaryCard** — Metric display card with trend
7. **AI Tutor Recommendation Card** — Proactive AI suggestion card
8. **Vocabulary Detail Panel** — Rich vocabulary detail (merge with existing modal?)
9. **Settings Section Card** — Grouped settings container

## Components to Refine

Based on existing implementations that need updates for the redesign:

1. **Modal** — Add portal rendering, scrollbar compensation, animation options
2. **Drawer** — Add drag-to-dismiss for bottom variant, focus trap, backdrop blur
3. **Toast** — Add action button, position variants, SVG icons
4. **ProgressBar** — Add skill-specific variants, indeterminate mode
5. **ProgressRing** — Add skill-specific variants, label prop
6. **SkillCard** — Add grammar/vocabulary skill types, action slot
7. **AITutorMessageCard** — Add typing state, markdown rendering, correction variant
8. **VocabularyWordCard** — Add selected state, saved context, swipe support
9. **Button** — Add AI Tutor variant (tutor-colored)
10. **MobileBottomNavigation** — Add glass effect, active indicator

---

## Relationship to Existing Codebase

| Directory | Components | Action |
|-----------|-----------|--------|
| `packages/ui/src/components/` | 23 components (Button, Card, Badge, Input, SearchInput, IconButton, Modal, Drawer, Toast, ProgressBar, ProgressRing, LoadingSkeleton, EmptyState, DashboardSection, MobileBottomNavigation, SkillCard, AITutorMessageCard, StudyTaskCard, VocabularyWordCard, ExtensionPopupCard, ExtensionActionMenu, ExtensionSelectedTextMenu, ExtensionSyncStatusBadge) | Refine existing + create new ones here |
| `apps/web/src/components/ui/` | ~18 components (duplicates + extensions) | After redesign, consolidate — subset can be re-exports from `packages/ui` |

The redesign should consolidate components into `packages/ui` as the single source of truth, with `apps/web/src/components/ui/` either re-exporting or containing only app-specific compound components.

---

## Summary

The component system comprises **32 components** across 7 categories:

| Category | Components | Status |
|----------|-----------|--------|
| Core UI | Button, IconButton, Card, Badge, Input, SearchInput, Select, DatePicker | 6 exist, 2 new |
| Feedback | Toast, ProgressBar, ProgressRing, LoadingSkeleton, EmptyState, ErrorState | 5 exist, 1 refined |
| Overlay | Modal, Drawer | Both exist, need refinement |
| Navigation | Tabs, MobileBottomNavigation | 1 exists, 1 new |
| Domain Cards | SkillCard, StudyTaskCard, PracticeCard, MistakeCard, ProgressSummaryCard | 2 exist, 3 new |
| AI Features | AITutorMessageCard, AITutorRecommendationCard, VocabularyDetailPanel | 1 exists, 2 new |
| Layout | DashboardSection, SettingsSectionCard | 1 exists, 1 new |
| Extension | ExtensionPopupCard, ExtensionActionMenu, ExtensionSelectedTextMenu, ExtensionSyncStatusBadge | 4 exist |

All components use CSS custom properties from the design token system, follow consistent API patterns, support responsive behavior, and meet WCAG accessibility requirements.
