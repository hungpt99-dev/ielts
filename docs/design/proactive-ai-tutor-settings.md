# Proactive AI Tutor Settings — Design Document

## 1. Overview

This document describes the user interface, data model, and integration plan for configuring the Proactive AI Tutor in IELTS Journey. The settings system determines *when*, *how often*, *in what tone*, *through which channels*, and *for which triggers* the AI Tutor sends proactive messages.

The design extends the existing settings infrastructure:
- `ProactiveMessageSettings` in `packages/ai-tutor/src/types/index.ts` → replaced by the richer `ProactivePreferences`
- `AiTutorConfig` in `apps/web/src/features/configuration/models.ts` → gains proactive-specific fields
- `AppSettings` in `apps/web/src/models/index.ts` → references the new config
- `ExtensionSettings` in `apps/extension/src/background/settingsStorage.ts` → gains proactive fields

---

## 2. Data Model Schema

### 2.1 Core Type: `ProactivePreferences`

This replaces `ProactiveMessageSettings` (defined in `packages/ai-tutor/src/types/index.ts:46`). It lives in the same file alongside the existing `ProactiveMessageCategory` and `ProactiveMessage` types.

```typescript
// packages/ai-tutor/src/types/index.ts

export type TutorTone = 'friendly' | 'strict' | 'motivational' | 'simple' | 'vietnamese'

export type ProactiveAutomationLevel = 'manual' | 'semi-automatic' | 'automatic'

export type ReminderFrequency = 'off' | 'low' | 'normal' | 'high'

export type WeakSkillPriority = ('writing' | 'speaking' | 'reading' | 'listening' | 'grammar' | 'vocabulary')[]

export interface ProactivePreferences {
  // ── Master toggle ──
  enabled: boolean

  // ── Frequency & timing ──
  maxMessagesPerDay: number                    // 1–20, default 5
  reminderFrequency: ReminderFrequency          // off / low / normal / high
  reminderTime: string                         // HH:mm, default "09:00"
  preferredStudyTime: string                   // HH:mm, user's preferred study hour
  quietHoursStart: string                      // HH:mm, default "22:00"
  quietHoursEnd: string                        // HH:mm, default "08:00"

  // ── Tutor personality ──
  tutorTone: TutorTone                         // friendly / strict / motivational / simple / vietnamese

  // ── Notification channels ──
  browserNotifications: boolean
  inAppNotifications: boolean                  // notification center
  extensionNotifications: boolean              // extension popup

  // ── Skill focus ──
  weakSkillPriority: WeakSkillPriority         // ordered list; first = highest priority

  // ── Automation ──
  automationLevel: ProactiveAutomationLevel    // manual / semi-automatic / automatic
  autoSuggestExercises: boolean                // AI auto-generates exercises
  autoGenerateProgressReview: boolean          // AI auto-generates weekly/30-day reviews
  autoContinueUnfinished: boolean              // suggest continuing unfinished lesson

  // ── Category toggles (one per trigger category) ──
  categories: Record<string, boolean>

  // ── AI enhancement ──
  aiEnhanced: boolean                          // use AI to enrich top-1 message daily
}
```

### 2.2 Defaults

```typescript
// packages/ai-tutor/src/services/proactiveMessageService.ts

export const DEFAULT_PROACTIVE_PREFERENCES: ProactivePreferences = {
  enabled: true,
  maxMessagesPerDay: 5,
  reminderFrequency: 'normal',
  reminderTime: '09:00',
  preferredStudyTime: '09:00',
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  tutorTone: 'friendly',
  browserNotifications: false,
  inAppNotifications: true,
  extensionNotifications: true,
  weakSkillPriority: ['writing', 'speaking', 'reading', 'listening', 'grammar', 'vocabulary'],
  automationLevel: 'semi-automatic',
  autoSuggestExercises: false,
  autoGenerateProgressReview: false,
  autoContinueUnfinished: true,
  categories: {
    'daily-plan-ready': true,
    'vocabulary-review-due': true,
    'vocabulary-saved-recent': true,
    'mistake-pattern': true,
    'weak-skill-practice': true,
    'exam-countdown-urgent': true,
    'exam-countdown-normal': true,
    'streak-milestone': true,
    'streak-at-risk': true,
    'low-activity-return': true,
    'missed-tasks': true,
    'unfinished-lesson': true,
    'saved-content-ready': true,
    'daily-tip': true,
    'mock-test-ready': true,
  },
  aiEnhanced: false,
}
```

### 2.3 Integration with existing `AiTutorConfig`

The `AiTutorConfig` interface in `apps/web/src/features/configuration/models.ts:57` gains a new field:

```typescript
export interface AiTutorConfig {
  // ... existing fields (mode, explanationStyle, correctionStrictness, etc.)
  mode: AiTutorMode
  explanationStyle: ExplanationStyle
  correctionStrictness: CorrectionStrictness
  responseLanguage: AiResponseLanguage
  exerciseDifficulty: ExerciseDifficulty
  feedbackDepth: FeedbackDepth
  automationLevel: AutomationLevel
  studyReminderFrequency: StudyReminderFrequency
  customSystemPrompt: string

  // NEW: proactive tutor settings
  proactive: ProactivePreferences
}
```

### 2.4 Extension synchronization

The `ExtensionSettings` schema in `apps/extension/src/background/settingsStorage.ts:25` gains proactive fields:

```typescript
const extensionSettingsSchema = sharedSettingsSchema.extend({
  // ... existing fields
  floatingToolbar: z.boolean().default(true),
  autoSaveSelected: z.boolean().default(false),
  autoHighlightSavedVocabulary: z.boolean().default(true),
  defaultCategory: z.enum(SAVE_CATEGORIES).default('vocabulary'),
  defaultTopic: z.string().default('general'),

  // NEW: proactive tutor settings (subset relevant to extension)
  proactiveEnabled: z.boolean().default(true),
  extensionNotifications: z.boolean().default(true),
})
```

### 2.5 Storage key

Proactive preferences are stored in localStorage under a dedicated key, separate from the general app settings for clean isolation:

```typescript
const STORAGE_KEYS = {
  PROACTIVE_PREFERENCES: 'ielts_proactive_preferences',
} as const
```

The existing `ProactiveMessageEngine` already has `getSettings()` / `updateSettings()` — these are updated to use the new `ProactivePreferences` type.

---

## 3. UI Specification

The settings UI consists of **three surfaces**:

### 3.1 Settings Page Section (Web App)

**Location:** Settings page → "Proactive AI Tutor" section

Appears on the main Settings page at `/settings`, between the existing "Notifications" card and the "Deep Configuration" card. When `proactive.enabled === false`, the section collapses to show only the master toggle with a brief description.

```
┌─────────────────────────────────────────────────┐
│  Proactive AI Tutor                       [ON]  │
│                                                 │
│  Let the AI Tutor send helpful suggestions      │
│  based on your learning activity and progress.  │
│                                                 │
│  When enabled, expand to show all options...    │
├─────────────────────────────────────────────────┤
│  (shown only when enabled)                      │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  TUTOR PERSONALITY                      │    │
│  │                                         │    │
│  │  Tutor Tone: [Friendly  v]              │    │
│  │  Automation Level: [Semi-Automatic  v]  │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  FREQUENCY & TIMING                     │    │
│  │                                         │    │
│  │  Max Messages/Day: [5]   [1 ──── 20]   │    │
│  │  Reminder Frequency: [Normal  v]       │    │
│  │  Reminder Time:         [09:00  🕐]    │    │
│  │  Preferred Study Time:  [09:00  🕐]    │    │
│  │  Quiet Hours:  [22:00] to [08:00]     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  NOTIFICATION CHANNELS                  │    │
│  │                                         │    │
│  │  ☑ In-App Notifications                │    │
│  │  ☐ Browser Notifications               │    │
│  │  ☑ Extension Notifications             │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  SKILL FOCUS                            │    │
│  │                                         │    │
│  │  Priority order (drag to reorder):      │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │ ☰ Writing                       │    │    │
│  │  │ ☰ Speaking                      │    │    │
│  │  │ ☰ Reading                       │    │    │
│  │  │ ☰ Listening                     │    │    │
│  │  │ ☰ Grammar                       │    │    │
│  │  │ ☰ Vocabulary                    │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  AUTOMATION                              │    │
│  │                                         │    │
│  │  ☐ Auto-suggest exercises               │    │
│  │  ☐ Auto-generate progress reviews       │    │
│  │  ☑ Auto-suggest continue unfinished     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  MESSAGE CATEGORIES (15 toggles)        │    │
│  │                                         │    │
│  │  ☑ Study Plan Reminders                 │    │
│  │  ☑ Vocabulary Review                    │    │
│  │  ☐ Recently Saved Vocabulary            │    │
│  │  ☑ Mistake Patterns                     │    │
│  │  ☑ Weak Skill Practice                  │    │
│  │  ☑ Exam Countdown                       │    │
│  │  ... (all 15 categories)                │    │
│  │                                         │    │
│  │  [Select All]  [Deselect All]           │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  AI ENHANCEMENT                         │    │
│  │                                         │    │
│  │  ☐ AI-Enhanced Messages                 │    │
│  │  (uses AI to make messages smarter)     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [Save Changes]                        [Reset]  │
└─────────────────────────────────────────────────┘
```

### 3.2 Quick Settings Panel (Chat Popup + Dashboard Card)

A condensed version is accessible directly from the AI Tutor chat widget and the "Tutor Says" dashboard card. This panel shows only the most commonly adjusted settings:

```
┌─────────────────────┐
│ Proactive Tutor     │
│                     │
│ ○ Enabled           │
│ ○ Tutor Tone        │
│   [Friendly  v]     │
│ ○ Max Messages/Day  │
│   [5]               │
│ ○                    │
│ [Open Full Settings] │
└─────────────────────┘
```

### 3.3 Extension Settings (Popup)

The Chrome extension options page (`apps/extension/src/options/SettingsPage.tsx`) gains a new section. Because the extension has limited screen space, only the extension-relevant fields are exposed:

```
┌─────────────────────────────┐
│ PROACTIVE TUTOR             │
│                             │
│ Enable on Extension  [ON]   │
│ Show notifications   [ON]   │
│                             │
│ 🔗 Synced from website      │
│   settings for advanced     │
│   options.                  │
└─────────────────────────────┘
```

---

## 4. UI Components

### 4.1 New Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ProactiveTutorSettings` | `apps/web/src/features/ai-tutor/ProactiveTutorSettings.tsx` | Full settings form for the main Settings page |
| `ToneSelector` | `apps/web/src/components/aiTutor/ToneSelector.tsx` | Radio/select for tutor tone with preview |
| `SkillPriorityReorder` | `apps/web/src/components/aiTutor/SkillPriorityReorder.tsx` | Drag-to-reorder list of skills |
| `CategoryToggleList` | `apps/web/src/components/aiTutor/CategoryToggleList.tsx` | List with 15 category toggles + category descriptions |
| `ProactiveQuickSettings` | `apps/web/src/components/aiTutor/ProactiveQuickSettings.tsx` | Condensed settings for chat popup |
| `ExtensionProactiveSettings` | `apps/extension/src/options/components/ProactiveSettings.tsx` | Extension-specific proactive settings |

### 4.2 Existing Components to Modify

| Component | Change |
|-----------|--------|
| `ProactiveSettings` (apps/web/src/components/aiTutor/ProactiveSettings.tsx) | Replace its simple form with a link to the full `ProactiveTutorSettings` in the main Settings page, or keep as lightweight quick-settings panel |
| `Settings.tsx` (apps/web/src/features/settings/Settings.tsx) | Add `ProactiveTutorSettings` card after Notifications |
| `DeepConfigPanel` (apps/web/src/features/settings/Settings.tsx) | Remove proactive settings if moved to dedicated card |
| `AiTutorConfig` (apps/web/src/features/configuration/models.ts) | Add `proactive: ProactivePreferences` field |
| `ProactiveMessageEngine` (apps/web/src/services/ProactiveMessageEngine.ts) | Use `ProactivePreferences` type instead of `ProactiveMessageSettings` |

### 4.3 Component Tree

```
Settings.tsx
├── ... existing cards (IELTS Goal, Weak Skills, etc.)
├── NotificationPrefs
├── ProactiveTutorSettings        ← NEW
│   ├── EnabledToggle
│   ├── (collapsed section if disabled)
│   ├── ToneSelector              ← NEW
│   ├── FrequencyTimingSection
│   ├── NotificationChannels
│   ├── SkillPriorityReorder      ← NEW
│   ├── AutomationSection
│   ├── CategoryToggleList        ← NEW
│   └── AIEnhancementToggle
├── DeepConfigPanel (existing)
│   ├── BasicSettingsForm
│   └── AdvancedSettingsForm (updated)
└── DataManagement
```

---

## 5. Integration Plan

### 5.1 Persistence

| Step | File | Action |
|------|------|--------|
| 1 | `packages/ai-tutor/src/types/index.ts` | Add `ProactivePreferences` interface and `TutorTone` type |
| 2 | `packages/ai-tutor/src/services/proactiveMessageService.ts` | Add `DEFAULT_PROACTIVE_PREFERENCES`, update `loadSettings`/`saveSettings` |
| 3 | `apps/web/src/features/configuration/models.ts` | Add `proactive: ProactivePreferences` to `AiTutorConfig` |
| 4 | `apps/web/src/features/configuration/storage.ts` | Update default config creation, migration, and serialization |
| 5 | `packages/ai-tutor/src/services/proactiveMessageService.ts` | Change storage key from `ielts_proactive_settings` to `ielts_proactive_preferences` or add migration |

### 5.2 UI Integration

| Step | File / Component | Action |
|------|------------------|--------|
| 6 | `ProactiveTutorSettings.tsx` | Create full settings form component |
| 7 | `ToneSelector.tsx` | Create tone selector with preview examples |
| 8 | `SkillPriorityReorder.tsx` | Create drag-to-reorder skill list |
| 9 | `CategoryToggleList.tsx` | Create categorized toggle list |
| 10 | `Settings.tsx` | Add `ProactiveTutorSettings` card after Notifications card |
| 11 | `ProactiveQuickSettings.tsx` | Create condensed quick-settings for chat popup |
| 12 | `ProactiveSettings.tsx` (existing) | Refactor to use `ProactivePreferences` and link to full settings |
| 13 | `ProactiveMessageEngine.ts` | Update to read from `ProactivePreferences` |

### 5.3 Extension Sync

| Step | File | Action |
|------|------|--------|
| 14 | `apps/extension/src/background/settingsStorage.ts` | Add proactive fields to schema + defaults |
| 15 | `apps/extension/src/options/components/ProactiveSettings.tsx` | Create extension proactive settings form |
| 16 | `apps/extension/src/options/SettingsPage.tsx` | Add ProactiveSettings section |

### 5.4 Message Engine Update

| Step | File | Action |
|------|------|--------|
| 17 | `apps/web/src/services/ProactiveMessageEngine.ts` | Replace `ProactiveMessageSettings` with `ProactivePreferences` across engine |
| 18 | `packages/ai-tutor/src/services/proactiveMessageService.ts` | Update `isInQuietHours`, `canSendNow`, `loadSettings`, `saveSettings` |

### 5.5 Data Migration

A one-time migration function reads the old `ProactiveMessageSettings` from localStorage and converts it to the new `ProactivePreferences` format:

```typescript
function migrateProactiveSettings(): ProactivePreferences {
  const oldKey = 'ielts_proactive_settings'
  const newKey = STORAGE_KEYS.PROACTIVE_PREFERENCES
  const existing = localStorage.getItem(oldKey)
  if (!existing) return { ...DEFAULT_PROACTIVE_PREFERENCES }

  try {
    const old = JSON.parse(existing)
    const migrated: ProactivePreferences = {
      ...DEFAULT_PROACTIVE_PREFERENCES,
      enabled: old.enabled ?? true,
      browserNotifications: old.browserNotifications ?? false,
      aiEnhanced: old.aiEnhanced ?? false,
      quietHoursStart: old.quietHoursStart ?? '22:00',
      quietHoursEnd: old.quietHoursEnd ?? '08:00',
      reminderTime: old.reminderTime ?? '09:00',
      maxMessagesPerDay: old.maxMessagesPerDay ?? 5,
      categories: { ...DEFAULT_PROACTIVE_PREFERENCES.categories, ...old.categories },
    }
    localStorage.setItem(newKey, JSON.stringify(migrated))
    localStorage.removeItem(oldKey)
    return migrated
  } catch {
    return { ...DEFAULT_PROACTIVE_PREFERENCES }
  }
}
```

---

## 6. Edge Cases & Behaviors

| Edge Case | Behavior |
|-----------|----------|
| User disables proactive tutor | All pending messages hidden. No new messages generated. Engine exits early at the Gatekeeper step. A single "I've been turned off" message in chat UI. |
| User switches tone mid-day | Next message generated uses new tone. Already-queued messages stay in their original tone (not retroactively modified). |
| User sets maxMessagesPerDay to 0 | Automatically clamped to 1. Proactive tutor behaves as if disabled. |
| User changes quiet hours to overlap all day | No messages delivered. A notice appears in settings: "Your quiet hours cover the entire day. Proactive messages will be paused." |
| User clears all settings | Proactive preferences reset to defaults. One-time explanation toast shown. |
| User has both browser + extension notifications off | Messages only visible in in-app notification center and dashboard card. |
| User never opens settings | Defaults apply: enabled, 5 messages/day, friendly tone, quiet hours 22:00–08:00, all categories on. |
| User is on first launch | Migration function handles absence of old settings gracefully. |
| Skill priority list is reordered but empty | Falls back to default order. |
| All categories disabled | No messages generated. Engine skips all triggers. A note appears: "All message categories are disabled. Enable at least one category to receive proactive messages." |
| Extension settings conflict with web settings | Web settings take precedence. Extension uses `syncFromWebsite` bridge to sync. |
| Category toggle changed while messages are queued | Queued messages of the disabled category are removed from queue on next engine tick. |
| User sets `reminderFrequency` to "off" | The scheduled daily reminder timer is cancelled. Other triggers (mistake pattern, exam countdown, etc.) still fire if their conditions are met. |

---

## 7. Validation

- File existence: `docs/design/proactive-ai-tutor-settings.md`
- UI components render without error (React component smoke test)
- Data model matches ProactivePreferences interface
- Settings persist to localStorage and reload correctly
- Migration function correctly converts old ProactiveMessageSettings format
- Extension settings sync correctly from web bridge

---

## Appendix A: UI Wireframe (Text Mockup)

```
Settings Page > Proactive AI Tutor

┌──────────────────────────────────────────────────────────────────┐
│ [ON] Proactive AI Tutor                                          │
│ AI Tutor sends helpful messages based on your learning activity  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TUTOR PERSONALITY                                               │
│  ┌──────────────────────────────────────────────┐               │
│  │ Tutor Tone: [Friendly  ▼]                    │               │
│  │   ↳ Preview: "Good morning! Let's review..." │               │
│  │ Automation: [Semi-Automatic  ▼]              │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  FREQUENCY & TIMING                                              │
│  ┌──────────────────────────────────────────────┐               │
│  │ Reminder Frequency: [Normal  ▼]              │               │
│  │ Max Messages/Day:      [5] [━━━●━━━━] 1-20   │               │
│  │ Reminder Time:         [09:00  🕐]           │               │
│  │ Preferred Study Time:  [09:00  🕐]           │               │
│  │ Quiet Hours:           [22:00] to [08:00]    │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  NOTIFICATION CHANNELS                                           │
│  ┌──────────────────────────────────────────────┐               │
│  │ ☑ In-App (notification center)               │               │
│  │ ☐ Browser (desktop notifications)            │               │
│  │ ☑ Extension (Chrome popup)                   │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  SKILL FOCUS                                                     │
│  ┌──────────────────────────────────────────────┐               │
│  │ Priority order (drag to reorder):            │               │
│  │ ┌ ☰ Writing ────────────────────────────┐   │               │
│  │ │   "You need to improve your writing."  │   │               │
│  │ └────────────────────────────────────────┘   │               │
│  │ ┌ ☰ Speaking ───────────────────────────┐   │               │
│  │ │   "Practice speaking to build fluency."│   │               │
│  │ └────────────────────────────────────────┘   │               │
│  │ ┌ ☰ Reading ────────────────────────────┐   │               │
│  │ └────────────────────────────────────────┘   │               │
│  │ ┌ ☰ Listening ──────────────────────────┐   │               │
│  │ └────────────────────────────────────────┘   │               │
│  │ ┌ ☰ Grammar ────────────────────────────┐   │               │
│  │ └────────────────────────────────────────┘   │               │
│  │ ┌ ☰ Vocabulary ─────────────────────────┐   │               │
│  │ └────────────────────────────────────────┘   │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  AUTOMATION                                                      │
│  ┌──────────────────────────────────────────────┐               │
│  │ ☐ Auto-suggest exercises from mistakes       │               │
│  │ ☐ Auto-generate weekly progress reviews      │               │
│  │ ☑ Auto-suggest continuing unfinished lessons  │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  MESSAGE CATEGORIES                                              │
│  ┌──────────────────────────────────────────────┐               │
│  │ [Select All]  [Deselect All]  (15 categories) │               │
│  │                                              │               │
│  │ ☑ Daily Plan Reminders    │ ☑ Streak at Risk │               │
│  │ ☑ Vocabulary Review       │ ☑ Low Activity   │               │
│  │ ☐ Recent Vocabulary       │ ☑ Missed Tasks   │               │
│  │ ☑ Mistake Patterns        │ ☐ Unfinished Lsn │               │
│  │ ☑ Weak Skill Practice     │ ☑ Saved Content  │               │
│  │ ☑ Exam Countdown          │ ☑ Daily Tip      │               │
│  │ ☑ Streak Milestones       │ ☑ Mock Test Ready│               │
│  │ ☑ Exam Countdown Urgent   │                  │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  AI ENHANCEMENT                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ ☐ AI-Enhanced Messages                       │               │
│  │   Uses AI to make messages more personal     │               │
│  │   (requires an API key in AI Provider settings)              │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  [Save Changes]                                    [Reset]      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Integration Points Map

| Integration Point | Location | What Changes |
|---|---|---|
| Settings page | `apps/web/src/features/settings/Settings.tsx` | Add `ProactiveTutorSettings` card |
| Deep Config | `apps/web/src/features/configuration/models.ts` | Add `proactive` field to `AiTutorConfig` |
| Deep Config Storage | `apps/web/src/features/configuration/storage.ts` | Serialize/deserialize `proactive` field |
| AI Tutor types | `packages/ai-tutor/src/types/index.ts` | Add `ProactivePreferences`, `TutorTone` |
| Proactive Service | `packages/ai-tutor/src/services/proactiveMessageService.ts` | Update defaults, load/save |
| Message Engine | `apps/web/src/services/ProactiveMessageEngine.ts` | Use `ProactivePreferences` |
| Chat popup | `packages/ai-tutor/src/components/ChatWidget.tsx` | Add quick-settings button |
| Dashboard card | `apps/web/src/features/dashboard/Dashboard.tsx` | Add "Tutor Says" card with link to settings |
| Extension options | `apps/extension/src/options/SettingsPage.tsx` | Add proactive section |
| Extension storage | `apps/extension/src/background/settingsStorage.ts` | Add proactive fields |
| Extension bridge | `apps/web/src/services/storage/SettingsStorage.ts` | Sync proactive subset to extension |
