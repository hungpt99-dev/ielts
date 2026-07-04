# Automation Design: Review Starting & Pending Review Management

## Current State Summary

Review sessions require **4-6 manual steps**: open app → navigate to review page → wait for queue load → start flashcard session → complete → manually navigate back. Pending review counts are polled every 120s, but notifications only fire when the app tab is open. There is no auto-start, no session resumption (leaving mid-review loses progress), no push notifications, no smart prioritization across review types (vocabulary, mistakes, grammar, exercises), and no adaptive queue sizing — all due items are loaded at once regardless of available time.

---

## Proposed Automation Enhancements

### 1. Auto-Trigger Review Session on App Open

| Change | Location | Description |
|--------|----------|-------------|
| Auto-open review on app launch with due items | `app.tsx` / `router.ts` | When user opens the app and has 3+ due items across any review type, automatically navigate to `/review` with a brief "You have items due for review" toast. Skip if a specific deep link was opened. |
| Smart landing redirect | `Dashboard.tsx` `onMount()` | If `dueCount >= 5` and user has been absent >24h, redirect to review page instead of dashboard. Show a 3-second countdown with "Skip to Dashboard" link. |
| Review-on-return from extension | `ProactiveMessageEngine.ts` | When user clicks "Review Now" on an extension notification, the web app opens directly to `/review` with the due queue preloaded — no intermediate navigation. |

**Implementation pattern** — modify app entry:

```typescript
// app.tsx — on mount
async function checkAndRedirect(): Promise<void> {
  const stats = await getCombinedReviewStats()
  if (stats.totalDue >= 3 && !hasDeepLink()) {
    const lastVisit = getLastVisitTimestamp()
    const hoursAway = (Date.now() - lastVisit) / 3_600_000
    if (stats.totalDue >= 5 && hoursAway >= 24) {
      showCountdownToast({
        message: `${stats.totalDue} items due for review. Starting review session...`,
        action: { label: 'Skip', handler: () => navigate('/dashboard') },
        duration: 3000,
      })
      await delay(3000)
      navigate('/review', { state: { autoStart: true } })
    } else {
      showReviewBadge(stats.totalDue)
    }
  }
  setLastVisitTimestamp()
}
```

### 2. Smart Notification Scheduling Based on Review Load

| Change | Location | Description |
|--------|----------|-------------|
| Dynamic reminder scheduling | `ReminderService.ts` | Instead of fixed 9:00/19:00 reminders, schedule based on review load. If `dueCount > 10`, fire an immediate high-priority reminder. If `dueCount > 0`, schedule at user's preferred review window. If 0, skip. |
| Push notification support | `ReminderService.ts` | Add Service Worker push subscription for when app is closed. Register `pushManager.subscribe()` on first review load. Backend-sent push when `dueCount > 0` and user hasn't opened app in 24h. |
| Graduated urgency | `ProactiveMessageEngine.ts` | Reminder message escalates: Day 1 → "3 words due" (low), Day 3 → "15 words piling up" (medium), Day 7 → "47 words overdue! Catch up" (high). |
| Quiet hours awareness | `ProactiveMessageEngine.ts` | Respect existing quiet hours. If next available window is within 4h, defer. If user has no upcoming window, suggest scheduling a dedicated review block. |

**Implementation pattern** — dynamic reminder calculation:

```typescript
// ReminderService.ts — calculateNextReminderTime
function calculateNextReminder(stats: CombinedReviewStats, prefs: NotificationPrefs): Date | null {
  if (stats.totalDue === 0) return null

  const now = new Date()

  // Immediate: high urgency
  if (stats.totalDue >= 10) {
    return now // fire immediately
  }

  // Within preferred window today
  const [hours, minutes] = (prefs.reminderTime || '09:00').split(':').map(Number)
  const todayWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
  if (todayWindow > now) return todayWindow

  // Tomorrow at preferred time
  todayWindow.setDate(todayWindow.getDate() + 1)
  return todayWindow
}
```

### 3. Unified Pending Review Dashboard with Smart Prioritization

| Change | Location | Description |
|--------|----------|-------------|
| Combined review stats service | `packages/learning-engine/src/review-scheduler/CombinedReviewService.ts` (new) | Queries all review sources (vocab, exercises, mistakes, grammar, writing, speaking) and returns unified `CombinedReviewStats`. Single source of truth for due counts. |
| Priority scoring | `CombinedReviewService.ts` | Each due item gets a score: `priority = (daysOverdue * 10) + (repetitions < 2 ? 20 : 0) + (examInDays < 30 ? 15 : 0) + (mistakeSeverity * 5)`. Queue is sorted by score descending. |
| Review type weighting | `CombinedReviewService.ts` | User-configurable weights per type. Default: vocabulary ×1.0, mistakes ×1.5, grammar ×1.2, exercises ×1.0, writing ×0.8, speaking ×0.8. |
| Cross-type session | `ReviewCenter.tsx` | New "Smart Review" mode that mixes items from different types in one session (e.g., 5 vocab + 3 mistakes + 2 grammar). Each type transition shows a brief header card. |

**Implementation pattern** — new file `CombinedReviewService.ts`:

```typescript
interface DueItem {
  id: string
  reviewType: 'vocabulary' | 'exercise' | 'mistake' | 'grammar' | 'writing' | 'speaking'
  sourceId: string
  title: string
  dueDate: string
  daysOverdue: number
  repetitions: number
  priorityScore: number
  metadata?: Record<string, unknown>
}

interface CombinedReviewStats {
  totalDue: number
  byType: Record<string, number>
  priorityQueue: DueItem[]
  mastered: number
  learning: number
}

class CombinedReviewService {
  async getStats(): Promise<CombinedReviewStats> {
    const [vocabDue, exerciseDue, mistakes, grammar, writing, speaking] =
      await Promise.all([
        getDueVocabReviews(),
        getDueExerciseReviews(),
        getDueMistakes(),
        getDueGrammarNotes(),
        getDueWritingSessions(),
        getDueSpeakingSessions(),
      ])

    const allItems: DueItem[] = [
      ...vocabDue.map(i => this.scoreItem(i, 'vocabulary')),
      ...exerciseDue.map(i => this.scoreItem(i, 'exercise')),
      ...mistakes.map(i => this.scoreItem(i, 'mistake', 1.5)),
      ...grammar.map(i => this.scoreItem(i, 'grammar', 1.2)),
      ...writing.map(i => this.scoreItem(i, 'writing', 0.8)),
      ...speaking.map(i => this.scoreItem(i, 'speaking', 0.8)),
    ]

    allItems.sort((a, b) => b.priorityScore - a.priorityScore)

    return {
      totalDue: allItems.length,
      byType: {
        vocabulary: vocabDue.length,
        exercise: exerciseDue.length,
        mistake: mistakes.length,
        grammar: grammar.length,
        writing: writing.length,
        speaking: speaking.length,
      },
      priorityQueue: allItems,
      mastered: await getMasteredCount(),
      learning: await getLearningCount(),
    }
  }

  private scoreItem(item: DueItem, type: string, weight = 1.0): DueItem {
    const daysOverdue = Math.max(0, Math.floor(
      (Date.now() - new Date(item.dueDate).getTime()) / 86_400_000
    ))
    const examBoost = this.isExamSoon() ? 15 : 0
    const lowRepPenalty = (item.repetitions ?? 0) < 2 ? 20 : 0
    item.priorityScore = Math.round((daysOverdue * 10 + lowRepPenalty + examBoost) * weight)
    item.daysOverdue = daysOverdue
    return item
  }
}
```

### 4. Session Resumption with Checkpoint Saving

| Change | Location | Description |
|--------|----------|-------------|
| Review session checkpoint | `VocabularyReview.tsx` `ReviewSession.tsx` | Every time user rates a card, save session state to IndexedDB: `{ sessionId, completedIds[], remainingIds[], startedAt, progress }`. On mount, check for saved session — offer "Continue where you left off (5 of 15 done)" or "Start fresh". |
| Session auto-save on tab close | `ReviewSession.tsx` | Register `beforeunload` handler to checkpoint current state. On return, restore the exact card position. |
| Session timeout | `ReviewSession.tsx` | If session was idle >2h, mark as stale — continue option still available but warns "Items may have been reviewed elsewhere." |
| Cross-device session sync | `CombinedReviewService.ts` | If backend sync is configured, persist `reviewSession` to remote storage keyed by `userId`. Allows starting on extension, continuing on web app. |

**Implementation pattern** — checkpoint type and save:

```typescript
interface ReviewSessionCheckpoint {
  id: string
  reviewType: 'vocabulary' | 'exercise' | 'mixed'
  startedAt: ISOString
  updatedAt: ISOString
  completedIds: string[]
  remainingQueue: DueItem[]
  currentIndex: number
  progress: { completed: number; total: number }
}

async function saveCheckpoint(session: ReviewSessionCheckpoint): Promise<void> {
  await DatabaseService.put('reviewSessions', session)
}

async function loadCheckpoint(): Promise<ReviewSessionCheckpoint | null> {
  const sessions = await DatabaseService.getAll<ReviewSessionCheckpoint>('reviewSessions')
  const active = sessions.find(s => {
    const elapsed = Date.now() - new Date(s.updatedAt).getTime()
    return elapsed < 7_200_000 // < 2 hours
  })
  return active ?? null
}
```

### 5. Adaptive Queue Sizing

| Change | Location | Description |
|--------|----------|-------------|
| Time-aware queue limit | `getDailyReviewQueue()` | Accept optional `maxMinutes` parameter. Estimate 30s per vocabulary card, 2min per exercise. Truncate queue to fit within session budget. Return queue + overflow count. |
| Session length prompt | `VocabularyReview.tsx` | On "Start Review", prompt: "How much time do you have? 5min / 15min / 30min / All items". Adjust queue size accordingly. |
| Overflow spillover | `ReviewSummary.tsx` | After completing truncated queue, show: "Session complete! 8 more items not yet reviewed. Continue or finish for now?" |
| Spaced queue loading | `VocabularyReview.tsx` | For sessions >15 items, load in 10-item batches. When user reaches card 8 of 10, prefetch next batch — eliminates load time while keeping initial render fast. |

**Implementation pattern** — time-aware queue:

```typescript
interface QueueConfig {
  maxMinutes: number
  includeOverflow: boolean
}

const CARD_TIME_ESTIMATES: Record<string, number> = {
  vocabulary: 0.5,    // 30s per vocab card
  exercise: 2,        // 2min per exercise
  mistake: 0.75,      // 45s per mistake review
  grammar: 1,         // 1min per grammar note
  writing: 5,         // 5min per writing review
  speaking: 5,        // 5min per speaking review
}

async function buildTimeAwareQueue(
  items: DueItem[],
  config: QueueConfig,
): Promise<{ queue: DueItem[]; overflow: DueItem[]; estimatedMinutes: number }> {
  let remainingBudget = config.maxMinutes
  const queue: DueItem[] = []
  const overflow: DueItem[] = []

  for (const item of items) {
    const estimate = CARD_TIME_ESTIMATES[item.reviewType] ?? 1
    if (estimate <= remainingBudget) {
      queue.push(item)
      remainingBudget -= estimate
    } else {
      overflow.push(item)
    }
  }

  return {
    queue,
    overflow,
    estimatedMinutes: config.maxMinutes - remainingBudget,
  }
}
```

### 6. Proactive Review Badge & Mini-Review Widget

| Change | Location | Description |
|--------|----------|-------------|
| Persistent review badge | `App.tsx` / `Layout.tsx` | Floating badge in app header showing total due count across all types. Shows breakdown on hover: "Vocab: 5 | Mistakes: 3 | Exercises: 2". Click navigates to smart review. |
| Mini-review sidebar | `Dashboard.tsx` | Collapsible "Quick Review" panel that shows the top 3 priority due items with one-click "Review" action. No full page navigation needed for quick vocab lookups. |
| Review streak indicator | `Dashboard.tsx` | Show current review streak (consecutive days with at least one review completed). Reset if no review in 48h. Streak milestone badges at 7, 14, 30, 60, 90 days. |
| Zero-state guidance | `VocabularyReview.tsx` | When no items are due, show "All caught up! Come back tomorrow." with a countdown to next due item. Or offer to review recently-mastered items (last 7 days). |

**Implementation pattern** — persistent badge component:

```typescript
// components/ReviewBadge.tsx
function ReviewBadge({ stats }: { stats: CombinedReviewStats }) {
  const [open, setOpen] = useState(false)

  if (stats.totalDue === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => navigate('/review')}
        className="relative flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white"
      >
        <ClockIcon className="h-3.5 w-3.5" />
        <span>{stats.totalDue} due</span>
      </button>

      {/* Hover breakdown */}
      <div
        className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-[var(--color-surface)] p-3 shadow-lg"
        hidden={!open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {Object.entries(stats.byType).map(([type, count]) => (
          count > 0 && (
            <div key={type} className="flex justify-between py-1 text-xs">
              <span className="capitalize text-[var(--color-text-secondary)]">{type}</span>
              <span className="font-medium text-[var(--color-text)]">{count}</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
```

### 7. Review Completion Feedback & Next-Session Optimization

| Change | Location | Description |
|--------|----------|-------------|
| Session summary with recommendations | `ReviewSummary.tsx` | After session ends, show: "Reviewed 12 items. 7 mastered, 3 learning, 2 need attention." Highlight items rated 'again' most often. Suggest reviewing those immediately. |
| Performance-based scheduling feedback | `ReviewScheduler.ts` | If a user consistently rates items 'again', auto-tighten the initial interval (1d → 0.5d). If consistently 'easy', loosen it (1d → 2d). Adjust per user, not globally. |
| Optimal next-review-time prediction | `CombinedReviewService.ts` | Based on past review patterns (user reviews most often at 8pm on weekdays), predict the best time to schedule the next reminder. Show: "Next review recommended: tomorrow 8pm (your usual time)." |

---

## Backend Changes Summary

| File | Change |
|------|--------|
| `packages/learning-engine/src/review-scheduler/CombinedReviewService.ts` (new) | Unified review stats across all 6 types; priority scoring algorithm; cross-type smart review queue builder |
| `packages/learning-engine/src/review-scheduler/ReviewSessionManager.ts` (new) | Session checkpoint CRUD (save/load/clear); stale session detection; cross-device sync key management |
| `apps/web/src/services/ProactiveMessageEngine.ts` | Add graduated urgency escalation; add dynamic reminder scheduling based on `CombinedReviewStats`; add review-streak detection |
| `apps/web/src/services/aiTutor/ReminderService.ts` | Add `calculateNextReminderTime()` using review load; add push notification subscription and handler; add "no items due" skip logic |
| `apps/web/src/features/review/VocabularyReview.tsx` | Add checkpoint auto-save on each card rating; add session resumption prompt on mount; add time-aware queue config; add batch prefetch |
| `apps/web/src/features/review/ReviewSummary.tsx` | Add performance-based feedback; add overflow spillover prompt; add optimal next-review-time prediction |
| `apps/web/src/features/review/ReviewSession.tsx` (new) | Shared session component extracted from `VocabularyReview.tsx` — supports mixed-type review sessions; `beforeunload` checkpoint; progress tracking |
| `apps/web/src/features/review/components/ReviewBadge.tsx` (new) | Persistent due-count badge with type breakdown on hover |
| `apps/web/src/features/review/components/QuickReviewPanel.tsx` (new) | Mini-review widget for dashboard — top 3 priority items, one-click review |
| `apps/web/src/features/review/ReviewCenter.tsx` | Add "Smart Review" mode (mixed types); add time-aware queue prompt |
| `apps/web/src/pages/LandingPage.tsx` (auto-redirect) | Add `checkAndRedirect()` on mount — auto-navigate to review if overdue |
| `apps/web/src/App.tsx` | Register persistent `ReviewBadge` in layout header; add `beforeunload` checkpoint save |

## User-Facing Behavior Changes

| Before | After |
|--------|-------|
| Open app → see dashboard → manually navigate to /review | Open app with 5+ overdue items → auto-redirect to review with toast countdown |
| Fixed 9:00/19:00 reminders regardless of due items | Dynamic reminders that fire only when items are due, with urgency escalation |
| All due items loaded at once regardless of time available | Time-aware queue: "5min? Here are 8 cards." Overflow shown at end |
| Leaving mid-review loses all progress | Auto-save checkpoint on each card — resume exactly where you left off |
| Vocab, mistakes, grammar reviewed on separate pages | Smart Review mixes all types in one prioritized session |
| No persistent due-count indicator | Floating badge in header showing live due count with type breakdown |
| No review streak tracking | Streak indicator with milestone badges; review-completion streak tracked |
| Single flat queue sorted by due date | Priority-scored queue: overdue ×10 + low-rep penalty + exam proximity boost |
| No feedback on review performance trends | Session summary shows mastery trends; scheduler auto-tunes intervals per user |

## Performance & Data Considerations

- **Checkpoint size**: ~1KB per session (IDs + index). Auto-cleaned after session completion or 2h stale.
- **CombinedReviewStats query**: Aggregates 6 IndexedDB tables — use `Promise.all` for parallel reads. Target: <50ms for 1000 items.
- **Priority scoring**: Computed on-the-fly, not stored. Sorting 500 items is sub-millisecond.
- **Push notifications**: Service Worker push payload is <1KB. Subscription stored in IndexedDB. Unsubscribe on opt-out.
- **Queue prefetching**: Load next batch when 2 cards remain in current batch. Prevents visible loading in fast review sessions.
- **Review streak**: Stored as single localStorage entry `{ currentStreak, lastReviewDate, longestStreak }`. Updated on each review completion.
- **Session checkpoint cleanup**: IndexedDB entries older than 24h are purged on app start.
