# Proactive Message Generation Engine — Design Document

## 1. Overview

The Proactive Message Generation Engine sits between the **Learning Engine** (which computes the user's full learning state) and the **AI Tutor delivery surface** (dashboard, chat icon, notification center, extension popup). It transforms raw learning data into contextual, non-annoying proactive messages that feel like a real personal IELTS tutor.

### Core principles

1. **Every message has a reason.** No random generic messages — each message is traceable to a specific user-data trigger.
2. **Priority-aware delivery.** Messages are ranked by urgency (high/medium/low) and capped per day. Urgent messages (exam < 7 days, high-volume mistake patterns) always take priority.
3. **Annoyance prevention by default.** Rate limits, quiet hours, deduplication, daily caps, category toggles, and snooze/dismiss are built in.
4. **Multi-surface, single source.** The engine produces a unified message queue consumed by all surfaces (dashboard, chat, notification center, extension).
5. **Template + AI hybrid.** Low-priority routine messages use templates. High-value contextual messages (weak skill analysis, progress reviews) use AI enhancement when the user has an API key.

---

## 2. Message Categories

Messages are organized into 15 categories, each with a specific trigger condition based on real user data.

| # | Category | Trigger Condition | Data Inputs | Priority |
|---|----------|-------------------|-------------|----------|
| 1 | **daily-plan-ready** | Day changes, plan generated | `DailyPlan`, `lastStudyDate` | medium |
| 2 | **vocabulary-review-due** | Due vocab count > 0 | `VocabReviewEntry.nextReviewDate` | medium→high* |
| 3 | **vocabulary-saved-recent** | New vocab saved in last 24h | `VocabularyEntry.createdAt` | low |
| 4 | **mistake-pattern** | Unresolved mistakes with same skill >= 3 | `MistakeEntry.skill`, `status` | medium→high* |
| 5 | **weak-skill-practice** | Skill accuracy < 60% or declining trend | `SkillProgress.accuracy`, `trend` | medium |
| 6 | **exam-countdown-urgent** | Exam <= 30 days | `ProfileData.examDate` | high |
| 7 | **exam-countdown-normal** | Exam 31–90 days | `ProfileData.examDate` | low |
| 8 | **streak-milestone** | Streak hit 3, 7, 14, 21, 30, 60, 90 days | `StudyConsistency.currentStreak` | low |
| 9 | **streak-at-risk** | Today not studied yet, streak >= 3 | `lastStudyDate`, `currentStreak` | medium |
| 10 | **low-activity-return** | Inactive 2+ days | `lastStudyDate` vs now | medium→high* |
| 11 | **missed-tasks** | Yesterday's tasks incomplete | `TaskEntry.date`, `isDone` | medium |
| 12 | **unfinished-lesson** | Lesson started but not completed | `TutorMemory.inProgressLesson` | low |
| 13 | **saved-content-ready** | New reading/listening content saved | `ReadingPassage.createdAt`, `ListeningTranscript.createdAt` | low |
| 14 | **daily-tip** | Once per day (random rotation) | `content/tips` pool | low |
| 15 | **mock-test-ready** | Study progress >= 70% + exam approaching | `profile.bandProgress`, `examCountdownDays` | low→medium |

*Priority escalates when count/severity crosses a threshold (see §5).

---

## 3. Trigger Architecture

### 3.1 Trigger Rules Engine

Each trigger is a pure function that receives the `EngineInput` state and returns zero or more `ProactiveMessage` objects.

```typescript
type TriggerFn = (input: EngineInput) => ProactiveMessage[]

const TRIGGERS: TriggerFn[] = [
  checkDailyPlanReady,
  checkVocabReviewDue,
  checkVocabSavedRecent,
  checkMistakePattern,
  checkWeakSkillPractice,
  checkExamCountdown,
  checkStreakMilestone,
  checkStreakAtRisk,
  checkLowActivityReturn,
  checkMissedTasks,
  checkUnfinishedLesson,
  checkSavedContentReady,
  checkDailyTip,
  checkMockTestReady,
]
```

### 3.2 Engine Input Shape

The engine receives a single `EngineInput` object — the union of all data needed by all triggers:

```typescript
interface EngineInput {
  // Profile
  targetBand: number
  currentBand: number
  bandProgress: number
  examDate: string | null
  examCountdownDays: number | null
  dailyStudyMinutes: number

  // Streak & consistency
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
  todayStudied: boolean
  inactiveDays: number

  // Vocabulary
  totalVocab: number
  dueVocabCount: number
  recentVocabCount: number  // saved in last 24h
  masteredVocabCount: number
  vocabByTopic: Record<string, number>

  // Mistakes
  totalMistakes: number
  unresolvedMistakes: MistakeEntry[]
  mistakesBySkill: Record<string, number>
  mistakePatterns: RepeatedMistake[]

  // Skills & progress
  skillProgress: SkillProgress[]
  weakSkills: WeakSkill[]
  exerciseAccuracy: ExerciseAccuracy[]

  // Daily plan & tasks
  dailyPlan: DailyPlan | null
  todayTasks: TaskEntry[]
  yesterdayTasksUnfinished: number
  totalStudyHours: number

  // Content
  recentReadingContent: number
  recentListeningContent: number

  // Learning state
  inProgressLesson: string | null
  planCompletionPercent: number
  weeklyActivityDays: number
  consistencyPercent: number

  // Preferences (from user settings)
  preferences: ProactivePreferences
}
```

### 3.3 Engine Pipeline

```
Timer tick / event trigger
       │
       ▼
 ┌─────────────┐
 │ Gatekeeper   │ ← checks: enabled, quiet hours, daily cap, last triggered
 └──────┬──────┘
        │ (pass)
        ▼
 ┌──────────────┐
 │ Compute State│ ← fetches EngineInput from LearningEngine + Storage
 └──────┬───────┘
        │
        ▼
 ┌──────────────────┐
 │ Run all triggers │ ← each trigger function receives EngineInput
 └──────┬───────────┘
        │
        ▼
 ┌─────────────────┐
 │ Priority Sorter  │ ← sort by priority, deduplicate by category per day
 └──────┬──────────┘
        │
        ▼
 ┌──────────────────┐
 │ AI Enhancement   │ ← (optional) enrich top-1 message with AI if API key set
 └──────┬───────────┘
        │
        ▼
 ┌─────────────────┐
 │ Enqueue & Notify │ ← store, notify listeners, browser notification (opt-in)
 └─────────────────┘
```

---

## 4. Trigger Definitions & Example Template Messages

### 4.1 `checkDailyPlanReady`

- **Condition:** `dailyPlan` exists AND `todayStudied === false`
- **Priority:** medium
- **Example:**
  - "Good morning! Today's study plan is ready. You have 45 minutes of focused practice — Writing Task 2 outlines and vocabulary review."
  - "Your daily plan is waiting. Today we're focusing on Speaking Part 1 and reviewing 8 vocabulary words."

### 4.2 `checkVocabReviewDue`

- **Condition:** `dueVocabCount > 0`
- **Priority:** `dueVocabCount > 20 ? 'high' : 'medium'`
- **Examples:**
  - "You have 12 vocabulary words due for review today. Most are from the 'Environment' topic — a quick 10-minute session can lock them in."
  - "You saved 15 new words from an article yesterday. Let's review the most important ones before you forget them."

### 4.3 `checkVocabSavedRecent`

- **Condition:** `recentVocabCount > 0` AND not yet triggered today
- **Priority:** low
- **Example:**
  - "I noticed you added 5 new words to your vocabulary list. Would you like to create a quick exercise with them?"

### 4.4 `checkMistakePattern`

- **Condition:** `mistakePatterns` has entries with `frequency >= 3`
- **Priority:** `max(frequency) >= 10 ? 'high' : 'medium'`
- **Examples:**
  - "You often make mistakes with articles like 'a', 'an', and 'the'. I can create a short practice exercise for you."
  - "I've noticed a pattern: you frequently use the wrong tense in Writing Task 1 descriptions. Let's work on that."
  - "You made 8 grammar mistakes this week. Most are about subject-verb agreement — want to practice?"

### 4.5 `checkWeakSkillPractice`

- **Condition:** `weakSkills` has entries with `severity === 'high'` OR `accuracy < 60%`
- **Priority:** medium
- **Examples:**
  - "Your Reading skill needs the most attention right now. Let's practice one passage with skimming and scanning techniques."
  - "Your recent essays show you need better idea development. How about practicing one Writing Task 2 outline today?"
  - "Based on your progress, Speaking is your weakest area. Try recording a Part 2 monologue for feedback."

### 4.6 `checkExamCountdown`

- **Condition:** `examCountdownDays` is between 1 and 90
- **Priority:** `<= 7 ? 'high' : <= 30 ? 'medium' : 'low'`
- **Examples:**
  - "Your IELTS exam is in 5 days! Focus on mock tests and reviewing your most common mistakes."
  - "You have 20 days until your exam. Since your target is band 6.5, I recommend focusing more on Writing and Speaking this week."
  - "Exam is in 2 months. You're making good progress — keep following your study plan consistently."

### 4.7 `checkStreakMilestone`

- **Condition:** `currentStreak` is a milestone (3, 7, 14, 21, 30, 60, 90)
- **Priority:** low (except 30+ day milestones → medium)
- **Examples:**
  - "🔥 7-day streak! You've been consistent for a full week. This is how band scores improve."
  - "Amazing — 30 days of consistent study! You've built a strong habit. Let's review your progress this week."
  - "Day 30 of studying! You've completed 85% of your planned tasks. That's real dedication."

### 4.8 `checkStreakAtRisk`

- **Condition:** `currentStreak >= 3` AND `todayStudied === false` AND not yet triggered today
- **Priority:** medium
- **Example:**
  - "You haven't studied yet today. A 10-minute vocabulary review is all it takes to keep your 7-day streak alive."

### 4.9 `checkLowActivityReturn`

- **Condition:** `inactiveDays >= 2`
- **Priority:** `>= 7 ? 'high' : >= 3 ? 'medium' : 'low'`
- **Examples:**
  - "You missed two study days this week. No problem — let's do a lighter 30-minute review today to get back on track."
  - "It's been 7 days since your last session. Even 15 minutes of vocabulary review can help pick up where you left off."
  - "Welcome back! I adjusted today's plan to be lighter so you can ease into studying again."

### 4.10 `checkMissedTasks`

- **Condition:** `yesterdayTasksUnfinished > 0`
- **Priority:** medium
- **Example:**
  - "You had 3 incomplete tasks yesterday. I've carried them forward to today — let's tackle the most important one first."

### 4.11 `checkUnfinishedLesson`

- **Condition:** `inProgressLesson !== null`
- **Priority:** low
- **Example:**
  - "You left a Writing Task 2 lesson unfinished. Want to continue where you stopped?"

### 4.12 `checkSavedContentReady`

- **Condition:** `recentReadingContent > 0` OR `recentListeningContent > 0`
- **Priority:** low
- **Examples:**
  - "You saved an article about climate change. I can turn it into Reading comprehension questions."
  - "I see you saved a YouTube transcript. Want me to create listening exercises from it?"

### 4.13 `checkDailyTip`

- **Condition:** tip not yet shown today (once per day)
- **Priority:** low
- **Examples:**
  - "💡 IELTS Tip: In Writing Task 2, always spend 2–3 minutes outlining your essay before you start writing."
  - "💡 Did you know? Using a variety of sentence structures can boost your Grammar score in Writing and Speaking."
  - "💡 Tip: For Listening, read the questions before the audio starts so you know what keywords to listen for."

### 4.14 `checkMockTestReady`

- **Condition:** `planCompletionPercent >= 70` AND `examCountdownDays <= 45` AND `examCountdownDays > 0`
- **Priority:** `examCountdownDays <= 14 ? 'high' : 'medium'`
- **Examples:**
  - "You've completed 75% of your study plan. Ready to try a full mock test to gauge your current band?"
  - "With 2 weeks to go, now is the perfect time for a mock test. It will show us exactly where to focus."

---

## 5. Priority System

| Priority | Meaning | Delivery Guarantee | Daily Cap Budget |
|----------|---------|--------------------|------------------|
| **high** | Urgent — exam close, many mistakes, long inactivity | Always delivered (overrides category toggle) | 2 of the daily cap |
| **medium** | Important — due review, weak skill, missed tasks | Delivered if category enabled | 2 of the daily cap |
| **low** | Nice-to-know — streak, tip, saved content | Delivered if category enabled and cap not hit by high/medium | Remaining |

### Priority escalation rules

- `vocabulary-review-due`: `dueCount > 20` → high; `dueCount > 0` → medium
- `mistake-pattern`: `max(frequency) >= 10` → high; `>= 5` → medium; `>= 3` → low
- `low-activity-return`: `inactiveDays >= 7` → high; `>= 3` → medium; `>= 2` → low
- `exam-countdown`: `days <= 7` → high; `<= 30` → medium; `<= 90` → low
- `streak-milestone`: `streak >= 30` → medium; else low

---

## 6. Anti-Annoyance & Rate-Limiting Rules

### 6.1 Daily message cap

Default: **5 messages per day** (configurable 1–20 by user).

The cap is enforced per trigger type — the same trigger cannot fire twice in the same day (deduplication by trigger type + date). This prevents "review your vocabulary" from repeating every 2 minutes.

### 6.2 Quiet hours

Default: 22:00–08:00. No messages delivered during quiet hours. Configurable by user.

### 6.3 Category toggles

Users can enable/disable each of the 15 categories individually. Disabled categories are skipped entirely.

### 6.4 Snooze & dismiss

- **Dismiss:** Message is permanently removed.
- **Snooze:** Message is hidden for 1 hour, 3 hours, or until tomorrow. The same trigger can re-fire after the snooze expires.

### 6.5 Cooldown per trigger

Each trigger type has a minimum cooldown:

| Trigger | Cooldown |
|---------|----------|
| daily-plan-ready | Once per day |
| vocabulary-review-due | Once per day |
| vocabulary-saved-recent | Once per 24h |
| mistake-pattern | Once per day (per skill) |
| weak-skill-practice | Once per 3 days |
| exam-countdown | Once per day |
| streak-milestone | Once per milestone |
| streak-at-risk | Once per day |
| low-activity-return | Once per 2 days |
| missed-tasks | Once per day |
| unfinished-lesson | Once per session |
| saved-content-ready | Once per 24h |
| daily-tip | Once per day |
| mock-test-ready | Once per 7 days |

### 6.6 Duplicate suppression

Before enqueueing, the engine checks:
1. Is a message with the same `triggerType` already in today's queue?
2. Is a message with similar content already queued (by text similarity)?
3. Was this exact message already shown in the last 7 days?

If any check passes, the new message is dropped.

### 6.7 Priority preemption

If the daily cap is reached and a new **high** priority message arrives, the lowest-priority unread message is evicted to make room.

---

## 7. User Data → Trigger Mapping

| Data Input | Triggers |
|------------|----------|
| Target band | weak-skill-practice, exam-countdown, mock-test-ready |
| Current band | weak-skill-practice |
| Exam date | exam-countdown (all variants), mock-test-ready |
| Study plan (DailyPlan) | daily-plan-ready, missed-tasks, mock-test-ready |
| Completed lessons | streak-milestone, streak-at-risk, daily-plan-ready |
| Saved vocabulary | vocabulary-review-due, vocabulary-saved-recent |
| Vocab review history | vocabulary-review-due |
| Mistake history | mistake-pattern |
| Writing feedback | weak-skill-practice (writing) |
| Speaking practice | weak-skill-practice (speaking) |
| Reading results | weak-skill-practice (reading) |
| Listening results | weak-skill-practice (listening) |
| Daily study activity | daily-plan-ready, streak-at-risk, low-activity-return |
| Streaks | streak-milestone, streak-at-risk |
| Inactive days | low-activity-return |
| Saved articles / transcripts | saved-content-ready |
| In-progress lesson | unfinished-lesson |
| Weekly consistency | low-activity-return, streak-milestone |

---

## 8. User Preferences (ProactivePreferences)

Extended beyond the current `ProactiveMessageSettings` to support the full feature set described in requirements:

```typescript
interface ProactivePreferences {
  // Master toggle
  enabled: boolean

  // Frequency & timing
  maxMessagesPerDay: number              // 1–20, default 5
  reminderTime: string                   // HH:mm, default "09:00"
  quietHoursStart: string                // HH:mm, default "22:00"
  quietHoursEnd: string                  // HH:mm, default "08:00"
  preferredStudyTime: string             // HH:mm, user's preferred study hour

  // Tone
  tutorTone: 'friendly' | 'strict' | 'motivational' | 'simple' | 'vietnamese'

  // Notification channels
  browserNotifications: boolean
  inAppNotifications: boolean            // notification center
  extensionNotifications: boolean        // extension popup

  // Automation
  automationLevel: 'manual' | 'semi-automatic' | 'automatic'
  autoSuggestExercises: boolean          // AI generates exercises automatically
  autoGenerateProgressReview: boolean    // AI generates weekly/30-day review automatically
  autoContinueUnfinished: boolean        // suggest continuing unfinished lesson

  // Skill priority
  weakSkillPriority: SkillType[]         // ordered list; first = most important

  // Category toggles
  categories: Record<string, boolean>    // all 15 categories toggleable

  // AI enhancement
  aiEnhanced: boolean                    // use AI to enrich top message daily
}
```

---

## 9. Output Format

Each generated message follows the existing `ProactiveMessage` interface (extended with `reason` for debugging):

```typescript
interface ProactiveMessage {
  id: string
  triggerType: string          // e.g., 'vocabulary-review-due'
  category: string             // e.g., 'vocabulary-review'
  title: string                // Short headline
  message: string              // Full proactive message
  priority: 'high' | 'medium' | 'low'
  reason: string               // Human-readable reason (for debugging UI)
  action?: {
    type: 'navigate' | 'practice' | 'action'
    label: string
    payload: Record<string, unknown>
  }
  metadata: {
    skill?: string             // Related skill
    vocabCount?: number        // Counts for context
    mistakeCount?: number
    inactiveDays?: number
    examDaysLeft?: number
    streakDays?: number
    savedContentId?: string
  }
  isRead: boolean
  isDismissed: boolean
  isSnoozed: boolean
  snoozedUntil?: string
  createdAt: string
}
```

---

## 10. AI Enhancement Strategy

When `aiEnhanced === true` and the user has an API key configured, the engine passes the **top-priority message** (after sorting) to the AI for enrichment once per check cycle.

The AI receives a compact prompt with:
- The template message (title + raw message)
- Relevant user context (target band, weak skills, streaking, exam countdown)
- The user's tutor tone preference

The AI returns an enriched version of the message that feels more personal and contextual. This is done asynchronously and does not block the main trigger pipeline.

### AI Enhancement Prompt Structure

```
You are an IELTS tutor assistant. Enhance the following proactive message
to make it feel more personal and supportive. Use the user's data below
to add specific, contextual details.

User context:
- Target band: {band}
- Weak skills: {skills}
- Study streak: {streak} days
- Exam in: {days} days
- Tutor tone: {tone}

Original message: "{title}: {message}"

Return a richer version of the message that incorporates the user's
specific situation. Keep it concise (2–3 sentences). Do NOT make up
facts — use only the provided data.
```

---

## 11. Extension Integration

The Chrome extension (`apps/extension`) can deliver proactive messages via:
- **Extension popup:** When the user opens the popup, it fetches pending messages from IndexedDB.
- **Extension badge:** Shows unread count on the extension icon.
- **Alarm-based check:** A Chrome alarm fires every 30 minutes (even when popup is closed) and generates messages, storing them in IndexedDB for next popup open.

Because the app is local-first, messages cannot be delivered when both the web app and extension are closed. This is documented as a known limitation.

---

## 12. Delivery Surfaces & Sourcing

| Surface | How Messages Are Consumed |
|---------|--------------------------|
| **Dashboard** | Top 2 pending messages displayed in a "Tutor Says" card. Clicking opens full chat. |
| **Chat Icon (header)** | Unread badge count. Click opens chat widget with pending messages. |
| **Notification Center** | Full list of all pending messages with category filters, mark-read, dismiss, snooze. |
| **Messenger-style popup** | Floating chat bubble shows latest unread message. Expand reveals conversation. |
| **Extension popup** | Fetches pending messages from local IndexedDB, shows as list with actions. |
| **Browser notification** | (Opt-in) Desktop toast for high-priority messages. |

---

## 13. Message Generation Rules Summary

| # | Rule | Implementation |
|---|------|----------------|
| 1 | No duplicate trigger types per day | `Set<triggerType + date>` check |
| 2 | Max N messages per day | Counter, configurable 1–20 |
| 3 | No messages during quiet hours | Time range check |
| 4 | Priority preemption | High-priority evicts low if cap reached |
| 5 | Category opt-out | Category toggle check per message |
| 6 | Cooldown per trigger type | Per-trigger minimum interval |
| 7 | Snooze respects cooldown | SnoozedUntil field checked before re-fire |
| 8 | AI enhancement once per cycle | Only top-priority message enriched |
| 9 | Every message has a reason | `reason` field populated by trigger fn |
| 10 | Streak at-risk only after 3 days | Prevents nagging new users |
| 11 | Low activity scales with days | Different message at 2, 3, 7+ days |
| 12 | Exam urgency scales with days | Different message at 30, 7, 1 day |

---

## 14. Implementation Roadmap

### Phase 1 — Core engine (current scope)
- [x] Define all 15 trigger functions in `ProactiveMessageEngine` (package)
- [x] Build `EngineInput` type and data assembly from `LearningEngine` + Storage
- [x] Implement priority sorter with preemption
- [x] Implement all anti-annoyance rules (dedup, cooldown, cap, quiet hours)
- [x] Extend `ProactivePreferences` schema in settings package
- [x] Wire triggers into the existing poll cycle

### Phase 2 — AI enhancement & delivery
- [ ] Build AI enhancement prompt and async enrichment pipeline
- [ ] Integrate with all delivery surfaces (dashboard card, chat popup, notification center, extension)
- [ ] Add "Tutor Says" dashboard card

### Phase 3 — Polish
- [ ] User testing for message frequency perception
- [ ] A/B test tone variants
- [ ] Analytics: track message read/dismiss/action rates per category
- [ ] Smart frequency adjustment: if user dismisses same category repeatedly, auto-lower its priority
