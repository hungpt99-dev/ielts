# IELTS Journey — Accessibility Specification

## Overview

This document specifies accessibility requirements for the redesigned IELTS Journey website. Accessibility is not a separate concern — it is embedded into every component, page, and interaction pattern defined across the design system.

### Principles

| Principle | Description |
|-----------|-------------|
| **Built-in, not bolted on** | Every component spec and page layout already includes accessibility requirements. This document consolidates them into a single reference. |
| **WCAG 2.2 AA minimum** | All interfaces must meet WCAG 2.2 Level AA success criteria. AAA compliance is targeted for color contrast and focus indicators where feasible. |
| **Native semantics first** | Use semantic HTML elements before ARIA. Only add ARIA when native semantics are insufficient. |
| **Keyboard operable** | All functionality must be operable through a keyboard interface without specific timings for individual keystrokes. |
| **Respect user preferences** | Honor `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`, and `forced-colors` OS-level settings. |
| **Test with real assistive tech** | All flows must be tested with VoiceOver (macOS/iOS), NVDA (Windows), and TalkBack (Android) before release. |
| **Don't rely on color alone** | Every status, state, and category communicated via color must have an equivalent non-color indicator (icon, text, pattern). |

---

## 1. Semantic HTML Guidance

### 1.1 Document Structure

Every page must follow a semantic document outline:

```html
<!-- Page structure pattern -->
<body>
  <header role="banner">
    <!-- Site header / top navigation -->
  </header>

  <nav aria-label="Main navigation">
    <!-- Primary navigation -->
  </nav>

  <main id="main-content">
    <h1>Page Title</h1>
    <!-- Page-specific content -->
  </main>

  <aside aria-label="Related information">
    <!-- Sidebar content when present -->
  </aside>

  <footer role="contentinfo">
    <!-- Page footer -->
  </footer>
</body>
```

### 1.2 Heading Hierarchy

| Requirement | Implementation |
|-------------|----------------|
| Single `<h1>` per page | Every page has exactly one `<h1>` matching the page title |
| Hierarchical order | Headings descend in order (`h1` -> `h2` -> `h3` -> `h4`) without skipping levels |
| Descriptive headings | All headings describe the content that follows (e.g., "Today's Study Plan" not "Section 1") |
| Dashboard sections | Dashboard cards use `<h2>` or `<h3>` for section titles within the `<main>` element |
| Card titles | Cards within sections use `<h3>` or `<h4>` depending on nesting depth |

### 1.3 Landmark Regions

| Landmark | Usage | ARIA Fallback |
|----------|-------|---------------|
| `<header>` | Site header, top navigation bar | `role="banner"` |
| `<nav>` | Main navigation, breadcrumbs, pagination | `aria-label` to distinguish multiple nav elements |
| `<main>` | Primary page content (one per page) | `id="main-content"` for skip link target |
| `<aside>` | Complementary sidebar content, AI Tutor panel | `aria-label="Related content"` |
| `<footer>` | Page footer with copyright, links | `role="contentinfo"` |
| `<form>` | All input forms | `aria-label` or `<legend>` for fieldset |
| `<section>` | Thematic grouping of content | `aria-label` when the heading is visually hidden |

### 1.4 Lists

Use semantic list elements for all list-like content:

| Pattern | Element | Example |
|---------|---------|---------|
| Navigation items | `<ul>` with `<li>` | Bottom nav, sidebar nav |
| Task checklist | `<ul>` with `<li>` | Today's study tasks |
| Word list | `<ul>` with `<li>` | Vocabulary notebook list |
| Mistake list | `<ul>` with `<li>` | Mistake review items |
| Steps/progress | `<ol>` with `<li>` | Study plan phases, onboarding steps |
| Description lists | `<dl>` with `<dt>`/`<dd>` | Word definitions, grammar rules |

### 1.5 Buttons vs Links

| Element | When to Use |
|---------|-------------|
| `<button>` | Actions that change state on the current page (start study, save word, mark complete, open modal) |
| `<a>` | Navigation to a different page or URL (go to dashboard, open settings, link to external resource) |
| `<button>` with `aria-haspopup` | Triggers that open menus, drawers, modals, or popups |

---

## 2. Keyboard Navigation

### 2.1 Tab Order

| Requirement | Specification |
|-------------|---------------|
| Logical tab order | Tab order follows visual reading order (top-to-bottom, left-to-right). Never use `tabindex` values greater than 0. |
| Visible focus indicator | Every interactive element shows a 2px-3px focus ring using `border.focus` token value. |
| Skip to content | A "Skip to main content" link is the first focusable element on every page. |
| No keyboard traps | Focus never gets trapped in a region without a documented method to exit (Escape closes modals, drawers, popups). |
| Tab stops reduced | Long lists (vocabulary, mistakes, saved articles) use arrow keys for inner navigation — Tab enters/exits the list container. |

### 2.2 Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `Tab` | Move focus to next focusable element | Global |
| `Shift + Tab` | Move focus to previous focusable element | Global |
| `Enter` / `Space` | Activate button, toggle checkbox, submit form | Global |
| `Escape` | Close modal, drawer, popup, dropdown | Modal, Drawer, Popup, Dropdown |
| `Arrow Up/Down` | Navigate list items, adjust slider, select options | Lists, Sliders, Selects |
| `Arrow Left/Right` | Navigate tabs, carousel, date picker calendar | Tabs, Carousel, Date Picker |
| `Home/End` | Jump to first/last item in a list or slider | Lists, Sliders |
| `Ctrl + K` / `Cmd + K` | Open command palette or search | Global |
| `?` | Show keyboard shortcuts help | Global (settings toggle) |

### 2.3 Focus Management

| Pattern | Behavior |
|---------|----------|
| Page navigation | Focus moves to `<main id="main-content">` after route change |
| Modal opens | Focus is trapped inside modal, set to first focusable element or modal title |
| Modal closes | Focus returns to the triggering element |
| Drawer opens | Focus is trapped inside drawer, set to drawer title or close button |
| Drawer closes | Focus returns to the triggering element |
| Dynamic content | New content (toast, alert, live region update) announces via `role="alert"` or `aria-live="polite"` |
| Tab panel | `tabindex="-1"` on the currently selected tabpanel for programmatic focus |
| Skeleton loading | Container has `aria-busy="true"` during loading, removed when content renders |

### 2.4 Study Plan Roadmap Keyboard Navigation

The study plan roadmap is a long scrollable timeline. Keyboard navigation:

| Key | Action |
|-----|--------|
| `Tab` | Enter/exit the roadmap container |
| `Arrow Down` | Scroll to next plan day/week |
| `Arrow Up` | Scroll to previous plan day/week |
| `Enter` | Open selected day's detail |
| `Home` | Jump to current/today's plan item |
| `Escape` | Collapse expanded day detail |

---

## 3. Focus States

### 3.1 Focus Ring Design

| Property | Value |
|----------|-------|
| Width | 2px (minimum), 3px preferred |
| Style | Solid |
| Color | `color.border.focus` from theme tokens |
| Offset | 2px from element edge |
| Border radius | Matches element's `radius` value |
| Box shadow | `0 0 0 2px color.border.focus` + `0 0 0 4px color.border.focusRing` for high contrast |
| Transition | `box-shadow 150ms ease` |

### 3.2 Focus States by Element

| Element | Focus Indicator |
|---------|----------------|
| Button | Outer focus ring, 3px offset |
| Link | Underline + focus ring, or focus ring only |
| Input / Textarea | Input border changes to `color.border.focus` + focus ring on container |
| Select | Focus ring on the select element |
| Checkbox / Radio | Focus ring on the label or the input itself |
| Card (interactive) | Focus ring on the card container |
| Badge (clickable) | Focus ring, compact |
| Icon button | Focus ring, same dimensions as the button |
| Tab | Focus ring on the tab element |
| Slider | Focus ring on the thumb |
| Date picker | Focus ring on selected day cell |

### 3.3 Focus Visible

- Never use `outline: none` or `:focus-visible { outline: none }` without providing a visible alternative
- Use `:focus-visible` for mouse click suppression: show focus ring only for keyboard focus
- Always show focus ring for `:focus` on form inputs (users need to know where they are typing)

### 3.4 Focus Within

Interactive card containers (clickable cards, study task cards) use `:focus-within` to highlight the entire card when any child element receives focus:

```css
.study-task-card:focus-within {
  box-shadow: var(--focus-ring);
  border-color: var(--color-border-focus);
}
```

---

## 4. Color Contrast

### 4.1 Contrast Ratios

| Token Category | AA Requirement | AAA Target | Notes |
|----------------|----------------|------------|-------|
| Normal text (< 18px) | 4.5:1 | 7:1 | Body text, labels, descriptions |
| Large text (>= 18px bold / >= 24px regular) | 3:1 | 4.5:1 | Section titles, card headings |
| UI components (icons, borders) | 3:1 | 4.5:1 | Icon buttons, border indicators |
| Placeholder text | No minimum (WCAG exempt) | 4.5:1 | Should not be the only way to convey information |
| Disabled text | No minimum | 3:1 | Disabled state should not rely solely on opacity |
| Link text | 3:1 (large) / 4.5:1 (normal) from surrounding text | 7:1 | Contrast against body text, not just background |

### 4.2 Token Contrast Verification

| Token Pair | Expected Ratio | Status |
|------------|----------------|--------|
| `color.text.primary` on `color.background.primary` | >= 7:1 (AAA) | Verify |
| `color.text.secondary` on `color.background.primary` | >= 4.5:1 (AA) | Verify |
| `color.text.muted` on `color.background.primary` | >= 4.5:1 (AA) | Verify |
| `color.text.inverse` on `color.brand.primary` | >= 4.5:1 (AA) | Verify |
| `color.text.link` (not underlined) on `color.background.primary` | >= 4.5:1 (AA) | Verify |
| `color.border.default` on `color.background.primary` | >= 3:1 (AA) | Verify |
| Status colors on their backgrounds | >= 4.5:1 (AA) | Verify |
| Skill colors on their backgrounds | >= 4.5:1 (AA) | Verify |

> **Note**: Every token value in `shared-theme-design-tokens.md` must be verified against these ratios before implementation. If a proposed token pair fails, the token value must be adjusted.

### 4.3 Dark Mode Contrast

Dark mode must maintain equal or stricter contrast ratios than light mode. Specific concerns:

| Concern | Guidance |
|---------|----------|
| Blue light reduction | Pure white (`#ffffff`) on dark backgrounds can cause eye strain. Use `off-white` (`#f1f5f9`) for text on dark surfaces. |
| Saturated colors | Reduce saturation of status colors in dark mode to avoid vibration effect. |
| Surface distinction | Dark surfaces must have sufficient contrast between stacked layers (card on background). Minimum 3:1 between `color.surface.card` and `color.background.primary` in dark mode. |
| Background elevation | Use lighter backgrounds (higher luminance) for higher elevation layers (modals, drawers, popups) to create depth. |

### 4.4 Forced Colors Mode

The website must support Windows High Contrast Mode and `forced-colors` media query:

| Element | Behavior in Forced Colors |
|---------|--------------------------|
| Buttons | Use `ButtonText` / `ButtonFace` system colors |
| Links | Use `LinkText` system color |
| Cards | Border instead of background to distinguish surfaces |
| Progress bars | Use `Highlight` color for filled portion |
| Badges | Use border + text color, not background color |
| Focus indicators | Use `CanvasText` or `Highlight` for visible outline |
| SVG icons | Ensure `currentColor` fills so icons adapt to system color scheme |

---

## 5. Screen Reader Labels

### 5.1 ARIA Label Patterns

| Pattern | Implementation |
|---------|----------------|
| Icon buttons | `aria-label="Close dialog"` or `aria-label="Start study session"` |
| Navigation | `<nav aria-label="Main navigation">` |
| Page sections | `<section aria-labelledby="section-title-id">` |
| Progress bars | `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Tab panels | `role="tablist"`, `role="tab"` (with `aria-selected`, `aria-controls`), `role="tabpanel"` |
| Alerts | `role="alert"` or `aria-live="assertive"` |
| Dynamic updates | `aria-live="polite"` for non-critical updates (word count, search results) |
| Form errors | `aria-describedby` on input pointing to error message element |
| Required fields | `aria-required="true"` (in addition to `required` attribute) |
| Loading state | `aria-busy="true"` on container during loading |
| Disabled state | `aria-disabled="true"` in addition to `disabled` attribute |
| Current page | `aria-current="page"` on active navigation link |
| Expanded state | `aria-expanded="true/false"` on collapsible triggers |
| Has popup | `aria-haspopup="true"` + `aria-expanded` on menu/drawer/modal triggers |
| Description | `aria-describedby` for additional context (e.g., "Study plan generated on March 15") |

### 5.2 Screen Reader Announcements

| Event | Announcement | ARIA Region |
|-------|-------------|-------------|
| Study task completed | "Task 'Reading Passage 3' marked complete. 3 of 5 tasks remaining." | `aria-live="polite"` |
| Vocabulary saved | "Word 'ubiquitous' saved to your vocabulary list." | Toast with `role="status"` |
| Plan generated | "Your study plan has been generated. It includes 45 days of study until your exam." | `role="alert"` |
| Error occurred | "Unable to load your study plan. Please check your connection and try again." | `role="alert"` |
| AI response received | "Your AI Tutor has responded." | `aria-live="polite"` on chat area |
| Progress milestone | "Congratulations! You've completed 50% of your study plan." | `role="alert"` |
| Streak notification | "You're on a 7-day study streak. Keep going!" | Toast with `role="status"` |
| Countdown warning | "Your IELTS exam is in 30 days." | `aria-live="polite"` |

### 5.3 Dynamic Content Announcements

| Component | Announcement Strategy |
|-----------|----------------------|
| Toast notifications | `role="status"` with `aria-live="polite"`. Toast container has `aria-live="polite"` and `aria-relevant="additions"`. |
| AI Tutor streaming response | Each new message chunk uses `aria-live="polite"`. Complete message uses `role="log"`. |
| Search results updating | Container has `aria-live="polite"` and `aria-atomic="true"`. Announce: "Showing 12 results for '[query]'." |
| Progress bar updating | Value change announces via `aria-valuenow` change. Do not add `aria-live`. |
| Modal/drawer open | Focus moves inside. Screen reader announces dialog title via `aria-labelledby`. |
| Tab panel switch | No announcement needed if focus moves to panel. Use `aria-live="polite"` if content updates dynamically. |
| Sort/filter applied | Container announces: "Sorted by difficulty. Showing 20 words." |

### 5.4 Hidden Content

| Pattern | Usage |
|---------|-------|
| `visually-hidden` class | Visually hidden but screen reader accessible. Used for labels, skip links, descriptive text. |
| `aria-hidden="true"` | Decorative elements (illustrations, icons, dividers). Removes from accessibility tree. |
| `display: none` / `hidden` | Content not rendered and not in accessibility tree. Use for conditional rendering. |
| `inert` attribute | Content visible but not interactive. Use for overlay backdrops. |

```css
/* Visually hidden utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 6. Button and Input Accessibility

### 6.1 Button Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Semantic element | Use `<button>` not `<div>` or `<span>` with click handler |
| Type attribute | Always specify `type="button" | "submit" | "reset"` |
| Descriptive label | Visible text content. If icon-only, use `aria-label`. |
| Disabled state | `disabled` attribute (not just CSS class). Screen reader announces as dimmed/unavailable. |
| Loading state | Button content replaced with spinner. `aria-busy="true"` if button is a container. |
| Link as button | Use `<a>` with `role="button"` only when navigating. Prefer actual `<button>` for actions. |
| Icon buttons | Minimum 44x44px touch target. `aria-label` describing the action. |

### 6.2 Input Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Associated label | Every input has an explicit `<label>` or `aria-label`/`aria-labelledby` |
| Placeholder not label | Placeholder text is supplementary, not a replacement for a label |
| Required indicator | `required` attribute + `aria-required="true"` + visible asterisk/text |
| Error state | `aria-invalid="true"` on input + `aria-describedby` pointing to error message |
| Error message | Error `<span>` with `role="alert"` or `id` referenced by `aria-describedby` |
| Autocomplete | `autocomplete` attribute for common fields (name, email, password, language) |
| Input mode | `inputmode` attribute for virtual keyboard (text, email, url, numeric, search) |
| Password field | Show/hide password toggle. Masked by default. Toggle has `aria-pressed` or `aria-label`. |

### 6.3 Search Input

| Aspect | Specification |
|--------|---------------|
| Role | `<input type="search">` or `role="searchbox"` |
| Label | `<label>` or `aria-label="Search vocabulary"` |
| Autocomplete | `aria-autocomplete="list"` if search suggestions appear |
| Suggestions list | `role="listbox"` with `aria-activedescendant` on input |
| Clear button | Visible clear button when text is present. `aria-label="Clear search"` |
| Submit button | `aria-label="Search"` for icon-only variant |
| Live results | Container has `aria-live="polite"` or `role="status"` |

### 6.4 Checkbox and Radio

| Aspect | Specification |
|--------|---------------|
| Native elements | Use `<input type="checkbox">` and `<input type="radio">`, not custom styled divs |
| Custom styling | Visually hidden native input with custom styled `<label>` |
| Indeterminate | `aria-checked="mixed"` for tri-state checkboxes (e.g., select all in vocabulary) |
| Group label | `<fieldset>` with `<legend>` for radio groups and checkbox groups |
| Large touch target | Label is clickable and extends the touch target to minimum 44x44px |

### 6.5 Select and Combobox

| Aspect | Specification |
|--------|---------------|
| Native select | Use `<select>` for simple option lists (5-15 items) |
| Custom select | Build with `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-activedescendant` |
| Searchable select | `aria-autocomplete="list"` on the input within the combobox |
| Multi-select | Checkbox items inside listbox or tag-style with remove buttons |
| No auto-submit | Selecting an option does not automatically submit the form unless explicitly designed |

### 6.6 Slider (for study time, intensity, difficulty)

| Aspect | Specification |
|--------|---------------|
| Role | `role="slider"` |
| Tabindex | `tabindex="0"` on the thumb |
| ARIA | `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` (e.g., "30 minutes") |
| Orientation | `aria-orientation="horizontal"` (default) |
| Keyboard | Arrow keys adjust value. Page Up/Down for larger steps. Home/End for min/max. |
| Label | `<label>` or `aria-label` describing the control (e.g., "Daily study time") |

---

## 7. Mobile Touch Size

### 7.1 Touch Target Minimums

| Element | Minimum Size | Best Practice |
|---------|-------------|---------------|
| Bottom navigation items | 48x48px | 56x56px with 8px padding |
| Icon buttons | 44x44px | 48x48px |
| Buttons (all variants) | 44px height | 48px height with 16px horizontal padding |
| Links in content | 44x44px (extend via padding) | Use `display: inline-block` with padding |
| Checkbox/Radio + label | 44x44px combined | Label extends clickable area |
| Cards (tappable) | 44px minimum height | Cards are inherently large enough |
| Slider thumb | 44x44px | 48x48px for better grip |
| Form inputs | 44px height | 48px height with 12px padding |
| Close/dismiss buttons | 44x44px | 48x48px |
| Badge (tappable) | 44x44px | Not recommended — use icon button with badge instead |
| Pull to refresh | N/A (gesture) | Minimum 44px activation zone from top |
| Swipe actions | N/A (gesture) | Minimum 44px visible action button |

### 7.2 Touch Target Spacing

| Relationship | Minimum Gap |
|-------------|-------------|
| Between tappable elements | 8px |
| Between bottom nav items | 0px (items fill bar) |
| Between inline links | 16px (with padding extending targets) |
| Between card actions | 12px |
| Between form inputs | 16px |
| Between bottom nav and content | 12px from content edge |

### 7.3 Safe Area Handling

| Device Feature | CSS Environment Variable |
|----------------|--------------------------|
| Notch (top) | `env(safe-area-inset-top)` |
| Home indicator (bottom) | `env(safe-area-inset-bottom)` |
| Rounded corners | `env(safe-area-inset-left)`, `env(safe-area-inset-right)` |

Bottom navigation uses `padding-bottom: calc(8px + env(safe-area-inset-bottom))` to avoid home indicator collision.

### 7.4 Gesture Accessibility

| Gesture | Accessible Alternative |
|---------|----------------------|
| Swipe to delete | Long press context menu with "Delete" option, or edit mode with checkbox |
| Swipe to complete task | Tap checkbox or "Mark complete" button |
| Drag to reorder | Move up/down buttons in edit mode |
| Pull to refresh | Refresh button in header |
| Pinch to zoom | Font size controls in settings |
| Long press | Context menu via right-click (desktop) or `aria-haspup="menu"` button |

---

## 8. Error Message Clarity

### 8.1 Error Message Principles

| Principle | Application |
|-----------|-------------|
| Explain what happened | "Unable to save this word. Your vocabulary list is full." not "Error 429" |
| Offer a solution | "Try deleting some words first, or upgrade to save unlimited words." |
| Avoid technical jargon | No "null pointer", "HTTP 500", "unhandled rejection", or stack traces in user-facing messages |
| Be specific | "The study plan could not be generated because the exam date is in the past." not "Generation failed" |
| Stay calm and friendly | Use "Something went wrong" not "FATAL ERROR" or "CRASH" |
| Provide a next action | Every error message includes a primary action (retry, go back, contact support) |

### 8.2 Error Message Format

```
[Context] — What failed and why
[Solution] — What the user can do about it
[Action] — A button or link to take action
```

**Examples:**

| Scenario | Error Message |
|----------|---------------|
| Network failure loading dashboard | "Couldn't load your dashboard. Check your internet connection and try again." + Retry button |
| AI generation timeout | "The AI study plan took too long. This can happen with complex plans. Try a shorter date range or try again." + Try Again button |
| Save vocabulary failed | "We couldn't save this word right now. Your vocabulary is safe — please try again." + Retry button |
| Spelling error in practice | Input shows `aria-invalid="true"` with message: "The word doesn't match. Check the spelling and try again." + Show Hint button |
| Exam date validation | "Your exam date should be at least 14 days from today to generate a study plan." |
| File upload error | "The file couldn't be uploaded. Supported formats: PDF, DOCX, TXT. Maximum size: 10MB." + Choose Different File button |
| Offline action | "You're offline. Your progress will sync when you're back online." + Dismiss button |

### 8.3 Form Validation Messages

| Pattern | Message Style | Placement |
|---------|---------------|-----------|
| Required field | "Please enter your target band score." | Below the input, `aria-describedby` reference |
| Invalid format | "Enter a valid email address (e.g., name@example.com)." | Below the input, `aria-describedby` reference |
| Out of range | "Study time must be between 15 minutes and 8 hours per day." | Below the input, `aria-describedby` reference |
| Match failure | "Passwords do not match." | Below the confirmation input |
| Server validation | "This email is already registered. Try logging in instead." | Inline below input or as a page-level alert |

### 8.4 Error Message Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Role | Error message container has `role="alert"` |
| Association | Input has `aria-describedby` pointing to error message `id` |
| Invalid state | Input has `aria-invalid="true"` |
| Focus | On form submission with errors, focus moves to the first invalid input |
| Clear on input | Error message clears when user starts typing (input event), not on blur |
| Multiple errors | Error summary at top of form with `role="alert"` listing all errors as links |
| Toast errors | Errors that are not form-related use toast with `role="alert"` |

---

## 9. Do Not Rely on Color Alone

### 9.1 Color-Independent Indicators

Every piece of information communicated through color must have a parallel non-color indicator:

| Color Usage | Non-Color Indicator |
|-------------|---------------------|
| Badge status | Icon + text label (e.g., Check icon + "Completed", Clock icon + "In Progress") |
| Skill color (Reading, Listening, etc.) | Skill icon (book, headphone, pencil, microphone) + skill name text |
| Difficulty level | Label text ("Easy", "Medium", "Hard") or count of indicators |
| Progress level | Percentage text + progress bar |
| Error message | Text message + icon |
| Success state | Check icon + "Saved" or "Complete" text |
| Warning state | Warning icon + text description |
| AI Tutor presence | Robot/chat icon + "AI Tutor" label |
| Streak indicator | Flame icon + number + "day streak" text |
| Weak skill indicator | Arrow down icon + "Needs practice" label |
| Active tab | Underline or bold text (not just a colored indicator) |
| Selected state | Checkmark icon or visible border (not just background color change) |
| Required field | Asterisk `*` + `aria-required="true"` text |
| Reading status | Text label: "Unread", "In Progress", "Complete" |

### 9.2 IELTS Skill Non-Color Identification

| Skill | Icon | Text Label |
|-------|------|------------|
| Reading | Book icon (faBook) | "Reading" |
| Listening | Headphone icon (faHeadphones) | "Listening" |
| Writing | Pencil icon (faPen) | "Writing" |
| Speaking | Microphone icon (faMicrophone) | "Speaking" |
| Vocabulary | Book/Type icon | "Vocabulary" |
| Grammar | Paragraph/Text icon | "Grammar" |
| Pronunciation | Sound icon | "Pronunciation" |

Each skill card must display its icon + name label. Color is supplementary, never the sole identifier.

### 9.3 Chart and Graph Accessibility

| Chart Type | Non-Color Encoding |
|------------|-------------------|
| Line chart | Different dash patterns (solid, dashed, dotted) per line + direct labels |
| Bar chart | Patterns (hatching, dots, stripes) or different markers per bar + value labels |
| Pie/donut chart | Segment labels with percentage text outside or as tooltip + leader lines |
| Radar chart | Filled areas use different dash patterns + point markers |
| Progress bar | Percentage text label next to or on top of bar |
| Streak calendar | Day numbers visible. Completed/partial/missed shown with icons or text |

### 9.4 Color Blindness Considerations

| Concern | Mitigation |
|---------|------------|
| Red-green deficiency (most common) | Never use red and green as the sole differentiator. Use icons, patterns, and text. |
| Status indicators | Combine color with text label. "Good", "Fair", "Needs Work" are distinguishable by position and icon. |
| Chart data series | Use different dash patterns + direct labels, not colored legend matching. |
| Test result feedback | Correct/incorrect shown with checkmark/cross icons + "Correct" / "Incorrect" text, not only green/red. |
| Skill comparisons | Skill bars use distinct icons + labels. No requirement to match legend colors. |

---

## 10. Specific Component Accessibility

### 10.1 Bottom Navigation

| Aspect | Specification |
|--------|---------------|
| Element | `<nav aria-label="Main navigation">` |
| Role | `role="tablist"` or `role="navigation"` |
| Items | `<button>` elements with `role="tab"` (if they switch content) or `<a>` elements (if they navigate) |
| Active state | `aria-current="page"` for `<a>` or `aria-selected="true"` for `role="tab"` |
| Labels | Each item has visible text label + icon. In collapsed/compact mode, icon + `aria-label`. |
| No hidden overflow | Bottom nav does not scroll horizontally. Maximum 5 items (Dashboard, Today, Learn, Progress, Settings). |

### 10.2 AI Tutor Chat

| Aspect | Specification |
|--------|---------------|
| Chat region | `<section aria-label="AI Tutor chat" role="log">` |
| Message list | `<ul>` with list items for each message |
| Message element | `<article>` or `<div>` with `role="group"` |
| User message | `aria-label="You said: [message]"` |
| AI message | `aria-label="AI Tutor said: [message]"` |
| Input | `<input>` or `<textarea>` with `aria-label="Message to AI Tutor"` |
| Send button | `aria-label="Send message"` |
| Streaming response | Container has `aria-live="polite"` during generation. `aria-busy="true"` while streaming. |
| Suggested prompts | `<button>` elements with descriptive text labels |
| Typing indicator | `role="status"` with text "AI Tutor is typing..." |
| Empty state | "Start a conversation with your AI Tutor. Ask about vocabulary, study plans, or practice." |

### 10.3 Vocabulary Flashcard

| Aspect | Specification |
|--------|---------------|
| Card container | `<article>` with `aria-label="Vocabulary card for [word]"` |
| Front face | Content visible. Tab reaches card, then inner elements. |
| Back face | Hidden behind flip. `aria-hidden="true"` when not visible. |
| Flip button | `aria-label="Flip card to see definition"` |
| Remember button | `aria-label="Mark word as remembered"` |
| Forgot button | `aria-label="Mark word as needs review"` |
| Pronunciation button | `aria-label="Play pronunciation of [word]"` |
| Progress indicator | `role="progressbar"` with `aria-valuenow` for session progress |

### 10.4 Study Plan Timeline

| Aspect | Specification |
|--------|---------------|
| Timeline container | `<ol>` — ordered list of study days |
| Day item | `<li>` with `aria-label="Day 15 of study plan"` |
| Task list within day | `<ul>` of task items |
| Task item | `<li>` with checkbox. Checkbox has `aria-label="Task: [task description]"`. |
| Current day indicator | `aria-current="location"` on the current day item |
| Completed day | Check icon + aria-label "Completed" |
| Missed day | Warning icon + aria-label "Missed" — actionable with a retry option |
| Expandable detail | `aria-expanded` and `aria-controls` on the expand trigger |

### 10.5 Progress Charts

| Aspect | Specification |
|--------|---------------|
| Chart container | `role="figure"` with `aria-label="Chart showing [description]"` |
| Data accessible | Tabular data available in a `<table>` below or in an accessible off-screen element |
| Chart as image | `role="img"` with `aria-label="Line chart: IELTS band progress from 5.0 to 6.5 over 8 weeks"` |
| SVG fallback | All SVG `<path>` and `<rect>` elements have `<title>` or `<desc>` children |
| Canvas fallback | `aria-label` on canvas element. Provide fallback content between canvas tags. |

### 10.6 Modal / Drawer

| Aspect | Specification |
|--------|---------------|
| Modal | `role="dialog"` with `aria-modal="true"`, `aria-labelledby="modal-title-id"` |
| Drawer | `role="dialog"` with `aria-modal="true"` or `aria-hidden="false"` depending on implementation |
| Close button | `aria-label="Close [dialog title]"` |
| Focus trap | Tab cycles within dialog. Shift+Tab from first element goes to last. |
| Dismiss | Escape key closes dialog. Clicking backdrop closes (but with a confirmation if there is unsaved data). |
| Return focus | Focus returns to the trigger element when dialog closes. |

### 10.7 Tabs

| Aspect | Specification |
|--------|---------------|
| Tab list | `role="tablist"` on the container |
| Tab elements | `role="tab"` with `aria-selected`, `aria-controls="panel-id"` |
| Tab panels | `role="tabpanel"` with `aria-labelledby="tab-id"` |
| Orientation | `aria-orientation="horizontal"` (default) or `vertical` |
| Keyboard | Left/Right arrows for horizontal tabs, Up/Down for vertical. Home/End for first/last. |
| Focus | Focus stays on current tab. Panel content is focusable if it contains interactive elements. |

---

## 11. Testing Checklist

### 11.1 Automated Testing

| Test | Tool | Frequency |
|------|------|-----------|
| Color contrast | axe-core, Lighthouse | Every PR |
| ARIA validatity | axe-core | Every PR |
| Heading structure | axe-core | Every PR |
| Landmark structure | axe-core | Every PR |
| Label association | axe-core | Every PR |
| Tab order | axe-core | Every PR |
| Focus management | Custom Playwright tests | Every PR for modals, drawers, routes |
| Touch target size | Lighthouse | Every PR |
| HTML validation | W3C Nu Validator | Every release |
| Link accessibility | axe-core | Every PR |

### 11.2 Manual Testing

| Test | Tool | Frequency |
|------|------|-----------|
| VoiceOver navigation | macOS VoiceOver | Every feature |
| NVDA navigation | Windows NVDA | Every feature |
| TalkBack navigation | Android TalkBack | Every major release |
| Keyboard-only navigation | No tool (manual) | Every PR |
| Zoom to 200% | Browser zoom | Every feature |
| Forced colors mode | Windows High Contrast | Every major release |
| Reduced motion | OS accessibility setting | Every feature |
| Screen reader with dynamic content | VoiceOver/NVDA | Every feature |
| Mobile screen reader | iOS VoiceOver, Android TalkBack | Every major release |

### 11.3 Accessibility Regression Tests (Playwright)

```typescript
// Example Playwright accessibility test pattern for IELTS Journey

test('dashboard page passes axe-core checks', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // Inject and run axe-core
  const results = await page.evaluate(async () => {
    const axe = await import('@axe-core/playwright');
    return axe.default.run(page);
  });

  expect(results.violations).toHaveLength(0);
});

test('vocabulary flashcard keyboard navigation', async ({ page }) => {
  await page.goto('/vocabulary/review');
  const firstCard = page.locator('[role="article"]').first();

  // Tab to first card
  await page.keyboard.press('Tab');
  await expect(firstCard).toBeFocused();

  // Flip card
  await page.keyboard.press('Enter');
  await expect(page.locator('[aria-label="Flip card to see definition"]')).toBeVisible();

  // Navigate actions
  await page.keyboard.press('Tab');
  await expect(page.locator('[aria-label="Mark word as remembered"]')).toBeFocused();
});

test('modal focus trap', async ({ page }) => {
  await page.goto('/settings');
  await page.click('[aria-label="Delete account"]');

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  // Focus should be inside dialog
  const firstFocusable = dialog.locator('button, [tabindex]:not([tabindex="-1"])').first();
  await expect(firstFocusable).toBeFocused();

  // Tab should cycle within dialog
  await page.keyboard.press('Tab');
  // ... cycle through all focusable elements
  // Last Tab should wrap back to first (focus trap)
});
```

---

## 12. Redesign-Specific Accessibility Notes

### 12.1 What the Redesign Improves

| Current Issue | Redesign Improvement |
|---------------|---------------------|
| Color-only skill identification | Icons + labels always accompany skill colors |
| No skip-to-content link | Skip link is the first focusable element on every page |
| Modals with no focus trap | All modals and drawers implement proper focus trapping |
| No aria labels on icon buttons | Every icon-only button has descriptive `aria-label` |
| Keyboard navigation gaps | Full keyboard flow tested for every page |
| Generic error messages | Specific, human-readable error messages with recovery actions |
| Low contrast in some areas | All token pairs verified against WCAG AA minimum 4.5:1 |
| No reduced-motion support | All animations respect `prefers-reduced-motion` |
| Touch targets too small on mobile | Minimum 44x44px touch targets enforced |
| Dynamic content not announced | `aria-live` regions added for all dynamic updates |
| Form validation not associated | `aria-describedby` linking inputs to error messages |
| No visible focus on clickable cards | `:focus-within` ring on interactive cards |

### 12.2 Mobile-First Accessibility

The mobile-first redesign naturally improves accessibility because:

| Mobile-First Decision | Accessibility Benefit |
|----------------------|----------------------|
| One primary action per screen | Clear focus target, less cognitive load |
| Bottom navigation | Thumb-reachable, fewer tab stops |
| Large touch targets | Meets 44x44px minimum naturally |
| Sparse content layout | Clear heading hierarchy, easier scanning |
| Single column on mobile | Linear reading order, logical tab order |
| Fewer interactive elements per viewport | Reduced keyboard navigation distance |
| Prominent back/close buttons | Easy escape from any flow |
| Native scrolling | Preserves scroll-based assistive tech patterns |

### 12.3 AI Tutor Accessibility

| Feature | Accessibility Requirement |
|---------|--------------------------|
| Typing indicator | `role="status"` text "AI Tutor is typing..." (not just an animated dot) |
| Streaming message | `aria-live="polite"` on the streaming message container |
| Complete message | `role="log"` on the message thread for screen reader review |
| Code blocks | `role="code"` or wrapped in `<pre>` with `aria-label` |
| Suggested prompts | Semantic `<button>` elements, not clickable divs |
| Voice input (future) | Visual indicator of recording state + text "Listening..." |
| Writing correction | `role="insertion"` for added text, `role="deletion"` for removed text within marked suggestions |

---

## 13. Localization and Internationalization

### 13.1 Language-Specific Accessibility

| Concern | Guidance |
|---------|----------|
| Language attribute | `<html lang="en">` or dynamically set to user's selected language |
| Text direction | `dir="ltr"` for most languages. `dir="rtl"` for Arabic, Hebrew. All layouts must support both. |
| Font loading | `font-display: swap` to prevent invisible text during font loading |
| Character length | Support for longer text in German, shorter text in Vietnamese. Avoid fixed-width truncation. |
| Number formats | Locale-aware number formatting (commas, decimals, date formats) |
| Screen reader language | `lang` attribute on pages/sections for mixed-language content |

### 13.2 Multi-Language Navigation

| Pattern | Implementation |
|---------|----------------|
| Language switcher | `<button>` with `aria-label="Change language. Current: English"` |
| Translation scope | Navigation labels, page titles, error messages, empty states, AI Tutor messages |
| Untranslated content | `aria-label` in original language if translation is unavailable |
| Auto-detection | Respect browser language setting. User can override in settings. |

---

## 14. Resources and References

- WCAG 2.2 Specification: https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Inclusive Components (Heydon Pickering): https://inclusive-components.design/
- A11y Project Checklist: https://www.a11yproject.com/checklist/
- Apple VoiceOver Guide: https://support.apple.com/guide/voiceover/welcome/mac
- NVDA User Guide: https://www.nvaccess.org/files/nvda/documentation/userGuide.html
- Android TalkBack: https://support.google.com/accessibility/android/answer/6283677
- Microsoft Inclusive Design Toolkit: https://inclusive.microsoft.design/
