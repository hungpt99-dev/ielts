# Proactive AI Tutor UI Integration — Design Document

## 1. Overview

This document specifies how proactive AI Tutor messages are displayed across all surfaces of the IELTS Journey app. It covers UI components, message display logic, user interaction patterns, component hierarchy, accessibility, and anti-annoyance UX.

The design builds on two prior documents:
- **Proactive Message Generation Engine** (`proactive-message-engine.md`) — defines the 15 trigger types, priority system, and message `ProactiveMessage` shape.
- **Proactive AI Tutor Settings** (`proactive-ai-tutor-settings.md`) — defines `ProactivePreferences` and the settings UI.

---

## 2. Integration Surfaces Overview

| # | Surface | Location | What Shows | Primary Entry Point |
|---|---------|----------|------------|-------------------|
| 1 | Dashboard "Tutor Says" card | `/dashboard`, right sidebar | Top 1–2 pending messages with CTA | Page load |
| 2 | Header chat icon | `Headbar`, top-right | Unread badge count | Click → opens chat popup |
| 3 | Chat widget notification center | `ChatWidget` notification modal | Full list with category filters | Toggle from chat header bell icon |
| 4 | Chat widget inline suggestions | `ChatWidget` suggestion area | 1–3 pending proactive message cards | Auto-shown when chat opens |
| 5 | Messenger-style floating bubble | `FloatingTutorButton` | Latest unread title + expand to chat | Click floating bubble |
| 6 | Extension popup | `PopupDashboard` → proactive section | Unread count badge + mini list | Open extension popup |
| 7 | Extension ChatButton overlay | `ChatButton` in popup | Unread badge + inline preview cards | Click Chat button in popup |
| 8 | Text selection popup | Content script selection menu | "Ask AI Tutor" + proactive hint | Select text on any webpage |
| 9 | After-lesson completion | Lesson page callback toast | One-time encouragement + next step | Lesson marked complete |
| 10 | After-mistake detection | Mistake notebook / practice page | Suggestion banner with practice CTA | 3+ same-skill mistakes logged |
| 11 | Inactivity return prompt | Dashboard banner | Lighter-review suggestion | App opened after 2+ inactive days |
| 12 | Weekly progress review | `/progress-review` or dashboard | Auto-generated review card | 7-day / 30-day interval |

---

## 3. Component Tree

```
AppLayout
├── Headbar
│   └── ChatToggleButton (unread badge)
│       └── ChatIcon
│           └── AITutorChat
│               └── ChatPopup
│                   └── ChatWidget
│                       ├── ChatHeader (with bell → NotificationCenter)
│                       ├── ChatMessagesArea
│                       ├── ProactiveMessageList (inline suggestions)
│                       │   └── ProactiveMessagePreview × N
│                       ├── QuickActionsRow
│                       └── ChatInput
│
├── Dashboard (route: /dashboard)
│   ├── ... summary cards ...
│   └── Sidebar
│       ├── TutorSaysCard           ← NEW
│       │   └── ProactiveMessagePreview × 1–2
│       ├── WeakSkillsCard
│       └── QuickStatsCard
│
├── FloatingTutorButton             (persistent floating bubble)
│   └── FloatingTutorPreview
│       └── ProactiveMessagePreview × 1 (latest)
│
├── NotificationCenter              (full page / modal)
│   ├── CategoryFilterBar
│   └── MessageList
│       └── ProactiveMessageItem × N
│
├── ProactiveBanner                 ← NEW (for inactivity, lesson complete, mistakes)
│   └── ProactiveMessagePreview × 1
│
├── ProgressReviewPage
│   └── WeeklyReviewCard            ← NEW
│
└── Settings
    └── ProactiveTutorSettings
        ├── ToneSelector
        ├── SkillPriorityReorder
        ├── CategoryToggleList
        └── ... (per settings design doc)

Extension (separate app tree)
├── PopupDashboard
│   └── ProactivePopupSection       ← NEW
│       ├── UnreadCountBadge
│       └── ProactiveMiniList
│           └── ProactiveMiniMessage × 2–3
├── ChatButton
│   └── ChatButtonOverlay
│       └── ProactiveMessagePreview × 1–3
└── Options SettingsPage
    └── ExtensionProactiveSettings
```

---

## 4. Surface Specifications

### 4.1 Dashboard — TutorSaysCard

**Purpose:** Show the top 1–2 highest-priority pending proactive messages on the main dashboard. Gives immediate value when the user lands on the page.

**Location:** Right sidebar in the dashboard (lg:col-span-1, currently holds AI Tutor Suggestion, Weak Skills, Quick Stats, Today's Focus cards). Inserted as the **first** card in the sidebar, replacing or supplementing the existing "AI Tutor Suggestion" card.

**Component: `TutorSaysCard`**

```
┌─────────────────────────────────┐
│ 🎓 Tutor Says               [🔔]│
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📚 Vocabulary Review Due    │ │
│ │ You have 12 words due for   │ │
│ │ review today. Most are from │ │
│ │ the "Environment" topic.    │ │
│ │                             │ │
│ │ [Review Now]    [⏰] [✕]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📝 Exam Countdown           │ │
│ │ 20 days until your exam.   │ │
│ │ Focus on Writing this week. │ │
│ │                             │ │
│ │ [View Plan]     [✕]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ [View All Messages →]           │
└─────────────────────────────────┘
```

**Behavior:**
- Shows **0–2** pending messages (not read, not dismissed, not snoozed).
- Messages are sorted by priority (high first), then by `createdAt` descending.
- If no pending messages exist, the card is **hidden completely** (not shown with empty state).
- Each message card uses `ProactiveMessagePreview` with dismiss and action button.
- Clicking **"View All Messages →"** opens the full Notification Center (or scrolls to it).
- The bell icon in the header shows the total unread count across all pending messages.

**Interaction:**
- **Action button:** Executes the message's `action` (navigate to route, or trigger quick action).
- **Dismiss (✕):** Calls `proactive.dismissMessage(id)`. Card fades out with animation.
- **Snooze (⏰):** Snoozes for 1 hour. Card fades out.
- **Click the bell:** Opens Notification Center.

**Data Source:**
```typescript
// Consumed from useProactiveMessages() or ProactiveMessageEngine singleton
const pending = messages.filter(m => !m.isRead && !m.isDismissed && !m.isSnoozed)
  .sort(byPriority)
  .slice(0, 2)
```

---

### 4.2 Header Chat Icon — ChatToggleButton

**Existing component:** `Headbar.tsx` already has a chat toggle button with an unread badge and online indicator.

**Changes needed:**
- The unread count should come from `ProactiveMessageEngine.getUnreadCount()` instead of localStorage parsing.
- Subscribe to message change events to keep the badge live.

```
              ┌─────┐
              │  3  │  ← unread count badge (red, white text, min-width 18px)
  [💬]        └─────┘
   ↑            ↑
 chat icon   green dot (online)
```

**Behavior:**
- Unread count reflects **all pending, non-dismissed, non-snoozed messages**.
- Count capped at 99+ visually.
- Clicking opens `ChatIcon` → `AITutorChat` → `ChatPopup`.
- The badge updates in real time when messages arrive or are dismissed elsewhere.

**Interaction:**
- Click → toggle chat widget open/closed.
- Keyboard: Enter or Space to toggle. Escape to close.
- The chat widget opens with the Notification Center tab if there are unread messages; otherwise opens to the chat messages area.

---

### 4.3 Chat Widget — Notification Center

**Existing:** `NotificationCenter.tsx` in both `packages/ai-tutor/src/components/` and `apps/web/src/components/aiTutor/`. The web app version is more feature-rich with category filters.

**Location:** Inside the `ChatWidget` — accessible via a bell icon in the `ChatHeader`. The notification panel replaces the chat messages area when active.

**Component: `NotificationCenter`**

```
┌──────────────────────────────────────┐
│ 🔔 Notifications              [3]   ✕│
├──────────────────────────────────────┤
│ [All] [Vocab] [Mistake] [Exam] ...   │ ← horizontal scrollable filter chips
├──────────────────────────────────────┤
│ ○ 📚 Vocabulary Review Due           │ ← unread dot + category badge
│   🏷 Vocabulary       High  ● 2m ago │
│   You have 12 words due for review.  │
│   [Review Now] [Mark Read] [⏰] [✕] [🗑]│
├──────────────────────────────────────┤
│   📝 Exam Countdown                  │ ← read = no dot
│   🏷 Exam             Med   1h ago   │
│   20 days until your exam.           │
│   [View Plan]         [⏰] [✕] [🗑]  │
├──────────────────────────────────────┤
│             ... more ...             │
├──────────────────────────────────────┤
│ [Mark All Read]          [Clear All] │
└──────────────────────────────────────┘
```

**Behavior:**
- Category filter chips show counts per category (e.g., "Vocab (2)").
- Active filter highlighted with primary color.
- Messages grouped by date: "Today", "Yesterday", "This Week", "Earlier".
- **Unread messages** have a subtle primary-colored background and a filled dot.
- **High priority** messages have a "High" label in danger color.
- Empty state: illustration + "No notifications yet" text + description.

**Actions per message:**
1. **Action button** (primary): navigates or triggers quick action
2. **Mark Read**: marks single message as read
3. **Snooze**: snoozes 1 hour (shows clock icon)
4. **Dismiss**: removes from list (shows X icon)
5. **Delete**: permanently removes (shows trash icon, danger color)
6. **Bulk**: Mark All Read, Clear All at bottom

---

### 4.4 Chat Widget — Inline Proactive Suggestions

**Existing:** `ChatWidget.tsx` already renders `pendingProactive` messages in a "Tutor Suggestions" section when the chat is open.

**Component: `ProactiveMessageList`** (already partially implemented in `ChatWidget.tsx:224-241`)

```
┌──────────────────────────────────┐
│  TUTOR SUGGESTIONS               │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📚 12 vocab words due today  │ │
│ │ Review the Environment set.  │ │
│ │ [Review Now]          [✕]   │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 📝 20 days to exam           │ │
│ │ Focus on Writing this week.  │ │
│ │ [View Plan]          [✕]    │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Behavior:**
- Shows up to **3** pending messages inside the chat widget, above the input area.
- Only visible when the chat is open and there are pending messages.
- Each message is a `ProactiveMessagePreview` component.
- Dismissing a message removes it from this view and updates the unread count.
- The section has a header "Tutor Suggestions" with muted styling.

---

### 4.5 Floating Tutor Bubble — Messenger Style

**Existing:** `FloatingTutorButton` in `apps/web/src/components/aiTutor/`. Currently a simple floating button.

**Changes:** Add a small preview popup that shows the latest unread proactive message before expanding to the full chat.

**Component: `FloatingTutorButton`** (modified)

```
                          ┌──────────────────────┐
                          │ 🎓 You have 2 updates │  ← tooltip on hover
                          │ 📚 "12 vocab words..."│
                          │ 📝 "20 days to exam..."│
                          │ [Open Chat →]          │
                          └──────────────────────┘
                                    ↑
                        ┌───────────┴───────────┐
                        │   💬                   │ ← floating button, bottom-right
                        └───────────────────────┘
```

**Behavior:**
- The floating button is visible on all pages (persistent).
- Shows unread count as a badge overlay.
- **Click** → opens the full `ChatPopup` (via `ChatIcon`).
- **Hover** → small preview tooltip showing latest unread message title.
- On mobile, the floating button is smaller and the preview is not shown (tap → opens chat).

---

### 4.6 Extension Popup — Proactive Section

**Existing:** `PopupDashboard.tsx` in `apps/extension/src/popup/components/`.

**Changes:** Add a "Tutor" section at the top of the popup dashboard showing unread count and mini message previews.

**Component: `ProactivePopupSection`**

```
┌──────────────────────────────┐
│ 🎓 AI Tutor      [3 unread] │
│                              │
│ ┌──────────────────────────┐ │
│ │ 📚 12 vocab words due    │ │
│ │ [Review]            [✕]  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 📝 20 days to exam       │ │
│ │ [View]             [✕]   │ │
│ └──────────────────────────┘ │
│                              │
│ [Open Chat →]                │
└──────────────────────────────┘
```

**Behavior:**
- Shows at the top of the extension popup, before the stats cards.
- Displays up to **2** pending messages.
- "Open Chat →" navigates to the MiniTutor/AITutorEntry view within the popup.
- Extension loads messages from IndexedDB (not API) — see Section 6.

---

### 4.7 Extension ChatButton Overlay

**Existing:** `ChatButton.tsx` in `apps/extension/src/popup/components/`.

**Changes:** The chat button overlay (shown when user clicks "Chat" in extension popup) should show proactive message previews alongside the current welcome/placeholder text.

```
┌──────────────────────────────┐
│ 💬 Chat                  [✕] │
│                              │
│ ┌──────────────────────────┐ │
│ │ 📚 12 vocab words due    │ │
│ │ [Review]          [✕]   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 📝 20 days to exam       │ │
│ │ [View]            [✕]   │ │
│ └──────────────────────────┘ │
│                              │
│ Welcome to the chat! ...     │ ← existing text
└──────────────────────────────┘
```

---

### 4.8 Text Selection Popup

**Existing:** Content scripts in `apps/extension/src/content-script/` handle text selection and show a popup.

**Changes:** When the user selects text on any webpage, the selection popup gains a proactive tutor hint section.

```
┌──────────────────────────────────┐
│ ℹ️  AI Tutor suggests...         │  ← only if a relevant message is pending
│ "You saved 5 words this week.    │
│  Would you like to review them?" │
│ [Review Vocab] [✕]              │
├──────────────────────────────────┤
│ 📝 Explain Selected Text         │  ← existing action
│ 📖 Save to Vocabulary            │  ← existing action
│ 📰 Save Article                  │  ← existing action
│ 🎓 Ask AI Tutor                  │  ← existing action
└──────────────────────────────────┘
```

**Behavior:**
- The proactive section appears **above** the existing action buttons.
- Only shows if there are pending non-dismissed proactive messages.
- Tapping "Review Vocab" opens the extension popup to saved words view.
- The proactive section is collapsible (can be dismissed for this selection interaction).

---

### 4.9 After-Lesson Completion Toast

**Entry point:** When a lesson or task is marked as complete (`todayTasks` → `isDone = true`).

**Component: `CompletionToastMessage`** (reuses existing `Toast` component)

```
┌──────────────────────────────────┐
│ ✅ Great job completing "Writing │
│ Task 2 Outline"!                 │
│                                  │
│ 🎓 Next: Review 8 vocabulary     │
│ words to reinforce today's topic.│
│                                  │
│ [Review Now]     [✕]            │
└──────────────────────────────────┘
```

**Behavior:**
- Shown as a toast notification (auto-dismiss after 8 seconds).
- Contains the next logical study step based on current state.
- Generated by the message engine's `daily-plan-ready` or `unfinished-lesson` trigger.
- The toast is **non-intrusive** — it appears and auto-hides.
- A "Review Now" button navigates to the relevant page.

---

### 4.10 After-Mistake Detection Banner

**Entry point:** Mistake notebook page, or when the 3rd+ same-skill mistake is logged.

**Component: `MistakePatternBanner`**

```
┌────────────────────────────────────────────────────┐
│ ⚠️ I've noticed you often make mistakes with     │
│ articles ('a', 'an', 'the'). Let's fix that!      │
│                                                    │
│ [Practice Articles] [Dismiss]                      │
└────────────────────────────────────────────────────┘
```

**Behavior:**
- Appears as a banner at the top of the mistake notebook page.
- Also appears as a dismissible banner on the dashboard when a pattern is detected.
- Based on `checkMistakePattern` trigger (≥3 same-skill mistakes unresolved).
- "Practice Articles" navigates to a relevant exercise or opens the AI Tutor with a pre-seeded prompt.

---

### 4.11 Inactivity Return Prompt

**Entry point:** App opened after ≥2 days of inactivity (detected by `lastStudyDate` vs current date).

**Component: `InactivityBanner`** — rendered on the dashboard only.

```
┌────────────────────────────────────────────────────┐
│ 👋 Welcome back! You missed 3 study days.          │
│ No problem — I've prepared a lighter 30-minute     │
│ review session to ease you back in.                │
│                                                    │
│ [Start Light Review] [✕]                           │
└────────────────────────────────────────────────────┘
```

**Behavior:**
- Shown as a prominent banner **above** the dashboard greeting.
- Only shown once per inactive period (not on every page load).
- Dismissing it hides it for the remainder of the day.
- The banner adjusts messaging based on inactive days (2, 3, 7+).
- Based on `checkLowActivityReturn` trigger.

---

### 4.12 Weekly Progress Review Card

**Entry point:** Progress review page (`/progress-review`) or dashboard on 7-day / 30-day intervals.

**Component: `WeeklyReviewCard`**

```
┌────────────────────────────────────────────────────┐
│ 📊 Your Weekly Review is Ready                     │
│                                                    │
│ ┌────┬────┬────┬────┬────┬────┬────┐               │
│ │Mon │Tue │Wed │Thu │Fri │Sat │Sun │               │
│ │ 45m│ 30m│ 0m │ 60m│ 45m│ 0m │ 0m │               │
│ └────┴────┴────┴────┴────┴────┴────┘               │
│                                                    │
│ • You studied 3 out of 7 days (43% consistency)   │
│ • Reviewed 24 vocabulary words                      │
│ • Made 8 mistakes (mostly grammar articles)        │
│ • Target focus: Writing and Speaking               │
│                                                    │
│ [View Full Progress] [✕]                            │
└────────────────────────────────────────────────────┘
```

**Behavior:**
- Auto-generated by the engine when `autoGenerateProgressReview` is enabled and 7 days have passed since the last review.
- Shows a compact weekly activity chart + key stats.
- Links to the `/progress-review` page for the full review.
- Can be dismissed and will re-generate after another 7 days.

---

## 5. Message Lifecycle & Display Rules

### 5.1 Lifecycle State Machine

```
Generated → [Gatekeeper] → Enqueued → Delivered → Seen → Dismissed/Expired
                                                 → Snoozed → Delivered again
```

- **Generated:** Created by a trigger function in the message engine.
- **Gatekeeper:** Quiet hours, daily cap, duplicate check, category toggle, cooldown.
- **Enqueued:** Stored in IndexedDB (persistent across sessions).
- **Delivered:** Shown on at least one surface (dashboard, chat widget, etc.).
- **Seen:** User has viewed the message (scrolled into viewport or tapped).
- **Dismissed:** User explicitly dismissed — permanently removed after 7 days.
- **Snoozed:** Hidden for N hours, then reverts to "Delivered".
- **Expired:** Auto-removed after 14 days (configurable in settings).

### 5.2 Read vs. Unread Tracking

- A message is **unread** if `isRead === false` and `isDismissed === false` and `isSnoozed === false`.
- The global unread count is the sum of all unread messages (any surface).
- Marking as read on **any surface** syncs to all surfaces (IndexedDB singleton).
- Actions that mark as read: tapping action button, tapping "Mark Read", viewing in Notification Center (auto-mark-read after 3 seconds in viewport).

### 5.3 Cross-Surface Sync

Because the app is local-first, all surfaces read from the same IndexedDB store (`proactiveMessages` object store):

```
IndexedDB: proactiveMessages
├── id (string, PK)
├── ... all ProactiveMessage fields
├── isRead (boolean)
├── isDismissed (boolean)
├── isSnoozed (boolean)
└── snoozedUntil (string | null)

Web App → reads/writes from IndexedDB directly
Extension → reads/writes from IndexedDB (same origin via chrome.storage.local sync bridge)
Content Script → reads from chrome.storage.local
```

When the user dismisses a message on the dashboard, the `ProactiveMessageEngine` updates IndexedDB and emits a custom event (`proactive-message-update`). All open surfaces listen for this event and re-render.

---

## 6. Event-Driven Message Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Timer Tick  │────▶│ ProactiveMessage │────▶│ IndexedDB       │
│ (30 min)    │     │ Engine           │     │ (persist)       │
└─────────────┘     └────────┬─────────┘     └────────┬────────┘
                             │                        │
                             ▼                        ▼
                      ┌──────────────┐       ┌──────────────────┐
                      │ Custom Event │       │ React Components │
                      │ 'proactive-  │       │ re-render from   │
                      │ message-     │──────▶│ useProactiveMsgs │
                      │ update'      │       │ hook             │
                      └──────────────┘       └──────────────────┘
```

**Trigger sources:**
1. **Timer tick:** Every 30 minutes (configurable), the engine checks all triggers.
2. **Event-driven:** Lesson completion, mistake saved, vocabulary saved, study session start/end.
3. **App open:** Full trigger check on app load (dashboard mount).
4. **Extension alarm:** Chrome alarm fires every 30 minutes to generate messages even when popup is closed.

---

## 7. Accessibility (a11y) Considerations

| Requirement | Implementation |
|---|---|
| **Screen reader announcements** | New proactive messages trigger `aria-live="polite"` region updates. The dashboard card and notifications panel use `role="region"` with `aria-label`. |
| **Keyboard navigation** | All message cards are keyboard-focusable. Dismiss (X), snooze, and action buttons are reachable via Tab. Escape closes floating panels. |
| **Focus management** | When Notification Center opens, focus moves to the first filter chip. When it closes, focus returns to the trigger button. |
| **Color contrast** | Priority labels ("High", "Med") use semantic colors with sufficient contrast. The unread indicator uses a filled dot, not just color. |
| **Motion sensitivity** | Animations (fade-in, slide-up) respect `prefers-reduced-motion`. When enabled, messages appear instantly. |
| **Touch targets** | All interactive elements in message cards have minimum 44×44px touch targets on mobile. |
| **Screen reader message text** | Each `ProactiveMessagePreview` has `aria-label` combining title + message text so users can navigate by message. |

---

## 8. Anti-Annoyance UI Patterns

| Pattern | How It Works |
|---|---|
| **Snooze** | Snooze button (⏰) hides message for 1 hour. User can choose duration in expanded menu (1h / 3h / tomorrow). |
| **Dismiss** | X button permanently removes from all surfaces. Re-queuing the same trigger type requires a new trigger cycle. |
| **Category opt-out** | Settings toggle per category. Disabled categories never generate messages. Instant removal of queued messages when toggled off. |
| **Daily cap** | Progress bar in quick settings: "Messages today: 3/5". At cap, new messages are queued for next day. |
| **Quiet hours visual** | During quiet hours, the chat header shows "🔕 Quiet hours — new messages paused". Messages generated during quiet hours are queued and delivered at quiet-hours end. |
| **Rate limit feedback** | If a trigger fires too often, the engine shows an info message in debug: "⏸️ Mistake pattern: next check at 2:00 PM (cooldown)". |
| **Smart frequency** | If user dismisses same category >3 times in a row, the engine auto-lowers that category's priority to "low" and shows a tooltip: "I'll send fewer of these. Adjust in Settings." |
| **Single message per trigger** | The same trigger type cannot appear twice in the same day (deduplication by `triggerType + date`). |

---

## 9. Component Specifications

### 9.1 New Components to Create

| Component | File Location | Description |
|---|---|---|
| `TutorSaysCard` | `apps/web/src/components/aiTutor/TutorSaysCard.tsx` | Dashboard sidebar card showing top 1–2 messages |
| `ProactivePopupSection` | `apps/extension/src/popup/components/ProactivePopupSection.tsx` | Extension popup proactive message section |
| `ProactiveMiniMessage` | `apps/extension/src/popup/components/ProactiveMiniMessage.tsx` | Compact message card for extension (no snooze, smaller) |
| `InactivityBanner` | `apps/web/src/components/aiTutor/InactivityBanner.tsx` | Welcome-back banner for inactive users |
| `MistakePatternBanner` | `apps/web/src/components/aiTutor/MistakePatternBanner.tsx` | Mistake pattern suggestion banner |
| `CompletionToastMessage` | `apps/web/src/components/aiTutor/CompletionToastMessage.tsx` | After-lesson toast with next-step CTA |
| `WeeklyReviewCard` | `apps/web/src/components/aiTutor/WeeklyReviewCard.tsx` | Weekly progress review card |
| `ProactiveFloatingPreview` | `apps/web/src/components/aiTutor/ProactiveFloatingPreview.tsx` | Hover tooltip for floating tutor button |
| `ProactiveTextSelectionHint` | `apps/extension/src/content-script/ProactiveTextSelectionHint.tsx` | Proactive hint in text selection popup |

### 9.2 Existing Components to Modify

| Component | File | Change |
|---|---|---|
| `ChatWidget` | `packages/ai-tutor/src/components/ChatWidget.tsx` | Already has proactive integration — verify anti-annoyance rules |
| `ChatButton` | `apps/extension/src/popup/components/ChatButton.tsx` | Add proactive message previews inside overlay |
| `PopupDashboard` | `apps/extension/src/popup/components/PopupDashboard.tsx` | Add `ProactivePopupSection` at top |
| `Dashboard` | `apps/web/src/features/dashboard/Dashboard.tsx` | Add `TutorSaysCard` to sidebar, add `InactivityBanner` at top |
| `FloatingTutorButton` | `apps/web/src/components/aiTutor/FloatingTutorButton.tsx` | Add unread badge + hover preview |
| `Headbar` | `apps/web/src/components/layout/Headbar.tsx` | Wire unread count to `ProactiveMessageEngine` instead of localStorage |
| `useChatWidget` | `packages/ai-tutor/src/hooks/useChatWidget.ts` | Expose proactive messages from `useProactiveMessages` |
| `useProactiveMessages` | `packages/ai-tutor/src/hooks/useProactiveMessages.ts` | Ensure cross-surface sync via custom events |
| `AITutorChat` | `apps/web/src/features/ai-tutor/AITutorChat.tsx` | Ensure context suggestions work alongside proactive messages |
| `NotificationCenter` (web) | `apps/web/src/components/aiTutor/NotificationCenter.tsx` | Update category labels to match 15-category system from engine doc |
| `NotificationCenter` (package) | `packages/ai-tutor/src/components/NotificationCenter.tsx` | Add snooze, delete, clear-all actions (match web version) |

---

## 10. Interaction Flow Diagrams

### 10.1 User Opens Dashboard

```
Page load /dashboard
       │
       ▼
  ┌──────────┐
  │ Load      │
  │ Dashboard │
  └─────┬────┘
        │
        ▼
  ┌──────────────┐     ┌─────────────────┐
  │ Render        │────▶│ TutorSaysCard   │
  │ Dashboard     │     │ (0–2 msgs)      │
  └──────┬───────┘     └─────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ Check inactivity  │
  │ (lastStudyDate)   │ ─── inactive ≥ 2 days?
  └──────┬───────────┘        │
         │                    ├─ Yes ─▶ Render InactivityBanner
         │                    └─ No  ─▶ (nothing)
         ▼
  ┌──────────────────┐
  │ Check weekly      │
  │ review due        │ ─── 7 days since last review?
  └──────────────────┘        │
                              ├─ Yes ─▶ Show WeeklyReviewCard
                              └─ No  ─▶ (nothing)
```

### 10.2 User Dismisses a Message

```
User taps ✕ on TutorSaysCard message
       │
       ▼
  ┌────────────────────┐
  │ proactive.dismiss  │
  │ Message(msgId)     │
  └──────┬─────────────┘
         │
         ▼
  ┌────────────────────┐
  │ Update IndexedDB   │
  │ isDismissed = true │
  └──────┬─────────────┘
         │
         ▼
  ┌──────────────────────────────┐
  │ Dispatch custom event        │
  │ 'proactive-message-update'   │
  └──────┬───────────────────────┘
         │
         ▼
  ┌──────────────────────────────┐
  │ All surfaces re-read from    │
  │ IndexedDB and re-render      │
  │ (TutorSaysCard removes msg,  │
  │  Headbar badge decrements,   │
  │  Notification Center removes)│
  └──────────────────────────────┘
```

### 10.3 New Message Arrives (Timer Tick)

```
Timer fires (30-min interval)
       │
       ▼
  ┌─────────────┐
  │ Gatekeeper   │ ← checks enabled, quiet hours, daily cap
  └──────┬──────┘
         │ pass
         ▼
  ┌──────────────┐
  │ Compute State │
  │ (EngineInput) │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────┐
  │ Run all triggers │ ← 15 trigger functions
  └──────┬───────────┘
         │
         ▼
  ┌─────────────────┐
  │ Priority Sorter  │
  │ + deduplication  │
  └──────┬──────────┘
         │
         ▼
  ┌──────────────────┐
  │ AI Enhancement   │ ← optional (top-1 message)
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │ Enqueue messages │
  │ to IndexedDB     │
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │ Dispatch 'proactive-message-     │
  │ update' event                    │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │ All surfaces re-render           │
  │ TutorSaysCard shows new msg      │
  │ Headbar badge updates            │
  │ Notification Center shows new    │
  │ Browser notification (if opt-in) │
  └──────────────────────────────────┘
```

---

## 11. UX Principles Summary

1. **Progressive disclosure:** The dashboard shows only 1–2 messages. The full list is one click away in the Notification Center.
2. **Contextual placement:** Each message appears where it's most relevant — mistake patterns on the mistake page, completion suggestions after lessons, inactivity banners on the dashboard.
3. **User control:** Every message has dismiss and snooze. Settings allow fine-grained control over categories, frequency, and tone.
4. **Zero empty states:** If no messages are pending, proactive UI elements are hidden entirely — no "No messages" placeholders on the dashboard.
5. **Respect user state:** Quiet hours suppress all delivery. Streak-at-risk messages only fire after 3-day streaks. Low-activity messages scale intensity with inactivity duration.
6. **Single source of truth:** All surfaces read from `IndexedDB.proactiveMessages`. The `ProactiveMessageEngine` singleton is the only writer. Cross-surface sync uses custom DOM events.
7. **Performance:** The trigger engine runs as a Web Worker or idle callback. Message rendering is lazy (only visible surfaces render). The 30-minute timer is a reasonable balance between freshness and battery/cpu.

---

## 12. Validation

- File existence: `docs/design/proactive-ai-tutor-ui-integration.md`
- Design review: Cover all 12 surfaces listed in Section 2
- Component drill: Every new component listed in Section 9.1 has props derived from the `ProactiveMessage` type
- Accessibility: All interactive elements meet WCAG 2.1 AA (keyboard, screen reader, contrast, motion)
- Cross-surface sync: Dismiss on one surface hides on all surfaces (test with IndexedDB + custom events)
