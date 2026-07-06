# IELTS Journey — Settings Page Specification

## Page Purpose

The Settings page is the central configuration hub for the entire IELTS Journey experience. It allows users to manage their learning goals, AI Tutor preferences, appearance, notifications, data, and advanced configurations. The settings page should feel clean, organized, and approachable — never overwhelming — so users can quickly find and adjust what they need without friction.

## User Goal

Users should be able to:

- Set and update their IELTS goal (target band, exam date, study time)
- Configure AI Tutor provider and connection
- Adjust appearance (theme, accent color)
- Manage notification preferences and study reminders
- Export, import, or reset their learning data
- Access advanced configuration for power users
- Understand that all data is stored locally and privately

The settings page should not feel like a technical configuration panel. It should feel like a personal preferences dashboard where users tune their learning companion.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/pages/Settings.tsx:1-519`, `apps/web/src/features/settings/AISettings.tsx:1-214`, `apps/web/src/features/settings/Settings.tsx:1-651`, `apps/web/src/pages/Settings/DataManagement.tsx:1-415`, `packages/settings/src/schemas.ts:1-24`):

1. **Single long scroll page** — All settings are on one vertically scrolling page. Goal settings, weak skills, topics, schedule, AI settings, appearance, notifications, deep config, and data management are stacked in cards with no section navigation. Users must scroll through everything to find one setting.

2. **No settings categorization in UI** — The current page mixes IELTS goal settings (target band, exam date), study preferences (weak skills, topics, schedule), AI configuration, appearance, and data management in a flat list of cards. There is no visual grouping or tab-based navigation to help users mentally organize settings.

3. **Dual settings implementations** — There are two separate Settings components (`apps/web/src/pages/Settings.tsx` and `apps/web/src/features/settings/Settings.tsx`) with different approaches. This creates confusion about which is the canonical settings page and leads to inconsistent UX.

4. **AI settings hidden behind card** — AI settings are embedded as a sub-component (`AISettings.tsx`). There is no dedicated AI settings section or separate page. The API key input, provider selection, and model configuration are in a single card with no visual separation between sensitive credential fields and general preferences.

5. **No unsaved changes warning** — Changes are applied on "Save Settings" button click, but there is no visual indicator that unsaved changes exist beyond a boolean `dirty` flag that disables the save button. Users can navigate away and lose changes without warning.

6. **Reset confirmation uses browser confirm()** — The reset action uses `window.confirm()` which is visually jarring and inconsistent with the app's design language. No styled confirmation dialog is used.

7. **Deep Configuration panel is complex** — The "Deep Configuration" section embeds a full `ConfigProvider` with Basic/Advanced tabs. This adds significant complexity but has no visual connection to the rest of settings. Power user features are mixed with everyday settings.

8. **Data Management is on a separate route** — `/settings/data` is a separate page with its own component (`DataManagement.tsx`). This breaks the unified settings experience and forces users to navigate away from settings to manage data.

9. **No search or filter** — With many settings sections, there is no search functionality to help users quickly find a specific setting.

10. **Mobile experience is stacked** — On mobile, the single-column layout works, but there is no collapsible section behavior or accordion pattern. Every section is expanded by default, creating a very long scroll.

11. **No settings preview** — Changes to appearance (theme, accent color) are not previewed in real-time within the settings page. Users must save and navigate elsewhere to see the effect.

12. **Settings context is global but not segmented** — The `useSettings` context provides all settings in one object. There is no granularity for partial saves or section-specific validation.

---

## Proposed Layout

The redesigned Settings page should use a **tabbed or sidebar-section layout** with clear visual categories:

### Desktop Layout (≥ 1024px)

```
┌─────────────────────────────────────────────────┐
│  Settings                      [Search settings] │
│  ─────────────────────────────────────────────── │
│  ┌──────────┬──────────────────────────────────┐ │
│  │ Profile  │  ← Active section content        │ │
│  │ Goal     │                                  │ │
│  │ AI Tutor │  [Form fields / toggles /         │ │
│  │ Study    │   configuration for the           │ │
│  │ Notifications │  selected section]           │ │
│  │ Appearance│                                  │ │
│  │ Advanced  │                                  │ │
│  │ Data      │                                  │ │
│  │          │  [Save / Reset buttons]           │ │
│  └──────────┴──────────────────────────────────┘ │
│                                                  │
│  [Save all changes]  [Reset to defaults]         │
└─────────────────────────────────────────────────┘
```

### Mobile Layout (< 1024px)

```
┌─────────────────────┐
│ Settings    [Search] │
│ ─────────────────── │
│ [Section tabs]      │
│ Profile │ Goal │ AI │ ...
│ ─────────────────── │
│                      │
│ ← Active section     │
│   content            │
│                      │
│                      │
│ [Save] [Reset]       │
└─────────────────────┘
```

### Section Navigation (Sidebar / Tab Bar)

| Section | Icon | Description |
|---------|------|-------------|
| Profile | User icon | Name, avatar, language preference |
| Goal | Target icon | Target band, current band, exam date, study time |
| AI Tutor | Sparkle/robot | Provider, API key, model, test connection |
| Study Plan | Calendar/plan | Study schedule, preferred topics, weak skills, study goal |
| Notifications | Bell icon | Enable/disable, reminder time, channels |
| Appearance | Theme/palette | Theme mode (light/dark/system), accent color |
| Advanced | Gear/cog | Deep configuration, CORS proxy, experimental features |
| Data | Database/backup | Export, import, reset, storage info |

---

## Main Sections

### 1. Profile Settings

| Field | Type | Description |
|-------|------|-------------|
| Display Name | Text input | User's preferred name (used for greeting on dashboard) |
| Language | Select | App interface language (English default, Vietnamese option) |
| Time Zone | Select | For accurate study reminders and streak tracking |

**Visual**: Clean card with avatar placeholder, name input, and language picker. The language setting should be prominently placed to signal global-friendliness.

### 2. Goal Settings

| Field | Type | Description |
|-------|------|-------------|
| Target Band | Select (1.0–9.0 in 0.5 steps) | Goal band score |
| Current Band | Select (1.0–9.0 in 0.5 steps) | Estimated current level |
| Exam Date | Date picker | Scheduled exam date (optional) |
| Daily Study Time | Number input (min) | Minutes per day |
| Study Goal | Toggle (Academic / General) | IELTS test type |

**Visual**: Two-column grid on desktop, stacked on mobile. Band selectors should show visual band indicators (colored bars between 1–9). Exam date should show countdown preview when selected.

### 3. AI Tutor Settings

| Field | Type | Description |
|-------|------|-------------|
| Enable AI Features | Toggle | Master switch for all AI functionality |
| Provider | Select (OpenAI / Custom) | AI provider selection |
| API Key | Password input (masked) | API key with partial visibility toggle |
| Base URL | Text input | Custom endpoint URL (shown for Custom provider) |
| Model | Text input + preset dropdown | Model name with common presets |
| Test Connection | Action button | Tests the current AI configuration |
| Connection Status | Status indicator | Shows success/failure after test |

**Visual**: This section should clearly separate the master toggle from credential configuration. The API key should be masked with a show/hide toggle. Test connection should show inline status (green check or red X) without navigation. A colored banner should explain local storage privacy as in the current implementation.

### 4. Study Plan Settings

| Field | Type | Description |
|-------|------|-------------|
| Weak Skills | Multi-select pills | Skills the user wants to focus on |
| Preferred Topics | Multi-select pills | IELTS topics the user prefers |
| Study Schedule | Day-of-week pills | Which days the user plans to study |
| Study Reminder | Text input | Custom reminder message |
| Preferred Study Time | Time picker | Preferred daily study time |

**Visual**: Use pill/tag selectors for skills and topics (as currently implemented, but with better visual feedback). Study schedule should show day buttons with active states. The reminder text should have a character counter.

### 5. Notification Settings

| Field | Type | Description |
|-------|------|-------------|
| Enable Notifications | Toggle | Master notification switch |
| Reminder Time | Time picker | Daily study reminder time |
| Browser Notifications | Toggle | Browser push notification permission |
| Quiet Hours Start | Time picker | Do not disturb start |
| Quiet Hours End | Time picker | Do not disturb end |
| Max Messages Per Day | Number input (1–50) | AI Tutor proactive message limit |
| Notification Channels | Checkbox group | In-app, browser, extension |

**Visual**: Group notification settings in a dedicated card with clear toggles. Show browser permission status. Quiet hours should be shown as a time range with visual separator.

### 6. Appearance Settings

| Field | Type | Description |
|-------|------|-------------|
| Theme Mode | Select (Light / Dark / System) | Color scheme preference |
| Accent Color | Color swatch picker | Primary accent color from presets |

**Visual**: Theme select with a live mini-preview. Accent color picker showing preset swatches in a row. Selected swatch should have a ring indicator and scale animation.

### 7. Advanced Settings

| Field | Type | Description |
|-------|------|-------------|
| CORS Proxy Enable | Toggle | Proxy toggle for external API access |
| CORS Proxy URL | URL input | Custom proxy endpoint |
| Deep Configuration | Tab panel (Basic / Advanced) | Full configuration form from ConfigProvider |

**Visual**: This section is collapsed by default with a disclosure indicator. Contains power-user controls that most users will never need to touch. The deep config panel should be nested but visually separated.

### 8. Data Management

| Field | Type | Description |
|-------|------|-------------|
| Export Backup | Button | Downloads all data as JSON |
| Import Backup | Button + file input | Uploads and restores JSON backup |
| Clear All Data | Danger button | Destructive action with confirmation |
| Storage Info | Info banner | Shows storage status and privacy note |

**Visual**: This section should be visually separated (border or background tint) to clearly indicate it is a sensitive/destructive area. Import should show a preview modal before executing. Clear data requires a multi-step confirmation.

---

## Primary Actions

- **Save Changes** — Primary button, saves all modified settings sections at once
- **Section Auto-Save** — Optional pattern: individual sections save on change with a success indicator
- **Test Connection** — Tests AI provider connectivity inline
- **Export Backup** — Downloads JSON backup file
- **Import Backup** — Opens file picker, then shows preview + confirmation

## Secondary Actions

- **Reset to Defaults** — Ghost/danger button, resets all settings to factory defaults with confirmation
- **Show/Hide API Key** — Toggle password visibility on API key field
- **Cancel Import** — Dismiss import preview without applying
- **Dismiss Success Message** — Close feedback toast
- **Collapse/Expand Advanced** — Toggle advanced section visibility

---

## Empty State

Settings always has content because it shows the current configuration. However, some states apply:

- **No API Key**: Shows empty API key field with "No API key set" helper text. AI features are disabled until a key is configured.
- **No Exam Date**: Date field shows empty with helper text "Leave empty if not yet scheduled"
- **No Weak Skills Selected**: All skill pills are unselected. Helper text suggests selecting weak areas.
- **No Notifications** (before permission): Shows inactive state with "Enable notifications" prompt.

---

## Loading State

- **Page load**: Skeleton cards matching the section layout (one skeleton per settings section)
- **AI Test Connection**: Spinner on the test button, disabled state during test
- **Export in progress**: Spinner on export button, "Exporting..." label
- **Import in progress**: Progress bar on import modal, "Importing..." label
- **Save in progress**: Save button shows spinner, sections become read-only during save

---

## Error State

- **Validation errors**: Inline error messages below specific fields (red text + icon). Section scrolls into view. Save button remains enabled but shows error count.
- **AI Connection failure**: Red status badge with error message. "Test Connection" shows failure reason inline.
- **Export failure**: Toast notification with error message. Button re-enables.
- **Import failure**: Modal shows error details. File format validation message.
- **Storage failure**: Banner at top of page explaining storage issue with recovery action.

---

## Mobile Layout

On mobile (< 768px):

- **Section tabs** → Horizontal scrollable tab bar at top
- **Sidebar navigation** → Collapses to a hamburger menu or bottom sheet section picker
- **Two-column grids** → Single column, full-width
- **Multi-select pills** → Wrap naturally, touch targets ≥ 44px
- **Date/time pickers** → Use native mobile pickers
- **Save button** → Fixed at bottom of viewport or in the tab bar
- **Card padding** → Reduced to 16px from desktop 24px
- **API key field** → Full width, no layout shift on mask toggle

---

## Responsive Behavior

| Breakpoint | Layout | Navigation | Cards |
|------------|--------|------------|-------|
| < 768px (mobile) | Single column, stacked | Horizontal scrollable tabs | Compact padding, stacked |
| 768–1024px (tablet) | Single column, wider | Sidebar icons + labels | Normal padding |
| ≥ 1024px (desktop) | Sidebar + content | Full sidebar with labels | Grid layouts where appropriate |

- Sidebar collapses to icon-only at 1024px breakpoint
- Forms use responsive grid (1 col mobile, 2 col desktop)
- Save/reset buttons are sticky at bottom on mobile, inline on desktop
- Search bar visible at all breakpoints but collapses to icon on mobile

---

## AI Tutor Integration

Settings has a reciprocal relationship with AI Tutor:

- **AI Provider section** is the primary AI configuration point
- **Test Connection** validates the AI setup before the user can use AI features elsewhere
- **Save feedback** after configuring AI should offer to navigate to AI Tutor: "AI is ready! Try asking a question."
- **Proactive message settings** (from `useProactiveSettings`) should have a dedicated sub-section within AI Tutor settings or Notifications
- **Tone selection** (friendly, strict, motivational, simple) should appear in AI Tutor settings
- **Automation level** (manual, semi-automatic, automatic) should appear in AI Tutor settings as a visual slider

---

## Accessibility Notes

- All form fields must have associated `<label>` elements
- Toggle switches must use `role="switch"` with `aria-checked`
- Color swatches must have `aria-label` with color name
- Section navigation must use `role="tablist"` and `role="tab"` with proper `aria-controls`
- Error messages must use `aria-live="polite"` or `role="alert"`
- Tab panels must use `role="tabpanel"` with `aria-labelledby`
- Keyboard navigation: Tab through fields, Arrow keys for tab switching
- Focus must be managed when sections change
- Color contrast: All text meets WCAG AA (4.5:1 normal, 3:1 large)
- Do not rely only on color for status indicators (use icons + text)

---

## Components Needed

From the Component System Spec:

| Component | Usage |
|-----------|-------|
| Button | Save, Reset, Export, Import actions |
| Input | Text, number, URL, password fields |
| Select | Provider, theme mode, band selectors |
| Toggle | Enable/disable switches for AI, notifications |
| Card | Settings section containers |
| Badge | Connection status indicator |
| Toast | Save/error feedback notifications |
| Modal | Import preview, reset confirmation |
| Tabs | Section navigation (mobile), deep config tabs |
| Search input | Settings search |
| Loading skeleton | Page load placeholder |
| Confirm dialog | Destructive action confirmation |

---

## Data Displayed

| Data | Source | Display |
|------|--------|---------|
| Target Band | SettingsContext | Select dropdown with band options |
| Current Band | SettingsContext | Select dropdown with band options |
| Exam Date | SettingsContext | Date input |
| Daily Study Time | SettingsContext | Number input |
| Weak Skills | SettingsContext | Multi-select pill buttons |
| Preferred Topics | SettingsContext | Multi-select pill buttons |
| Study Schedule | SettingsContext | Day-of-week toggle buttons |
| Study Goal | SettingsContext | Two-option toggle (Academic/General) |
| AI Provider | SettingsContext | Select dropdown |
| AI API Key | SettingsContext | Masked password input |
| AI Model | SettingsContext | Text input with presets |
| Theme Mode | ThemeContext | Select dropdown |
| Accent Color | ThemeContext | Color swatch picker |
| Notification Prefs | SettingsStorage | Toggle + time picker |
| CORS Proxy | localStorage | Toggle + URL input |
| Storage Info | Static text | Info banner |
| Backup Data | DatabaseService | File export/import |

---

## Design Notes

1. **Settings should not feel like a control panel** — Use warm colors, rounded cards, and friendly labels. Each section should feel like a conversation, not a form.

2. **Progressive disclosure** — Common settings (goal, profile) are always visible. Advanced settings are collapsed. Data management is visually separated as a sensitive area.

3. **Section grouping** — Related settings live together. AI provider and API key are one section. Study schedule, weak skills, and preferred topics are another.

4. **Privacy first** — The API key local storage notice from the current implementation should be retained and visually promoted. Users should always feel in control of their data.

5. **Save feedback** — After saving, show a brief success animation (checkmark + "Settings saved"). On error, show the specific section that failed.

6. **Color-coded sections** — Each section can use a subtle accent border or icon color to aid visual scanning. IELTS goal = blue, AI = purple, appearance = green, data = red (caution).

7. **No navigation away** — Data export/import should happen within the settings page (inline or modal) rather than navigating to `/settings/data`.

8. **Global-first language** — The language setting should default to English and be prominently placed in the Profile section, not hidden in Advanced.

9. **Mobile-first section navigation** — On mobile, horizontal scrollable tabs should use short labels (Profile, Goal, AI, Plan, Notif, Theme, Advanced, Data) with icons.

10. **Deep config isolation** — The deep configuration panel from `ConfigProvider` should be visually separated with a notice: "Only change these if you know what you're doing."
