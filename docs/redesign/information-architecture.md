# IELTS Journey — Information Architecture

## Overview

This document defines the information architecture for the IELTS Journey redesign. It maps the current route structure, proposes a reorganized page hierarchy, and documents the primary user flows. The goal is a clean, prioritized navigation that guides users toward their next learning action without overwhelming them with choices.

---

## Current Route Structure

The current React Router v7 structure has 25+ routes inside the authenticated `AppLayout` shell, plus the landing page at the root level.

```
[Public / Unauthenticated]
  /                          LandingPage (redirects to /dashboard if onboarding complete)

[Authenticated App Shell]
  /onboarding                OnboardingForm
  /dashboard                 Dashboard
  /plan                      StudyPlan
  /roadmap                   → redirects to /plan
  /vocabulary                Vocabulary
  /review                    VocabularyReview (spaced repetition)
  /review-center             ReviewCenter
  /reading                   ReadingPractice
  /listening                 ListeningPractice
  /writing                   WritingPractice
  /speaking                  SpeakingPractice
  /grammar                   GrammarNotes
  /mistakes                  MistakeNotebook
  /mock-tests                MockTests
  /topics                    TopicsProgress
  /progress                  Progress
  /progress-review           ProgressReviewPage (AI review)
  /artifacts                 ArtifactsPage
  /search                    SearchPage
  /public-api                PublicApiImportPage
  /settings                  Settings
  /settings/data             DataManagement
  /import-export             ImportExport
  /info                      PublicTabPage (tabbed: about, donate, recruit, feedback)
  /website-info              → redirects to /info#about-website
  /about-me                  → redirects to /info#about-me
  /recruit                   → redirects to /info#recruit
  /donate                    → redirects to /info#donate
  /feedback                  → redirects to /info#feedback
  *                          → redirects to /onboarding or /dashboard
```

### Current IA Problems

1. **Flat hierarchy with no prioritization**: 17 items sit at the same level in the sidebar. "Dashboard" is listed alongside "Public API" and "Import/Export" with equal visual weight.

2. **Multiple review destinations confuse users**: `/review` (vocabulary review), `/review-center` (review hub), `/mistakes` (mistake notebook), and `/progress-review` (AI progress review) all serve different review functions but the names overlap.

3. **Practice skills are scattered**: Reading, Listening, Writing, Speaking, and Grammar are individual nav items. There is no "Practice" grouping to reduce cognitive load.

4. **Mobile bottom nav is incomplete**: Only 5 of 17 items appear in mobile navigation. Critical tools like AI Tutor, Speaking, Writing, and Mistake Review are missing from quick access.

5. **Utility pages compete with learning pages**: Public API, Backup, Info, and Search are sidebar peers to core learning features.

6. **No visual section grouping**: The sidebar renders a flat list of `<NavLink>` items with no visual separation between core features, practice skills, tracking, tools, and settings.

7. **AI Tutor lacks a dedicated route**: AI Tutor exists only as a floating widget/chat popup. There is no full-page AI Tutor experience.

---

## Recommended New Page Structure

The redesigned IA organizes pages into clear groups with hierarchy levels:

### Level 1 — Primary Navigation (visible everywhere)

These are the user's main destinations. They appear in desktop sidebar and mobile bottom navigation.

| Priority | Page | Route | Purpose |
|----------|------|-------|---------|
| 1 | **Dashboard** | `/dashboard` | Daily home: what to study today, progress snapshot, AI recommendation |
| 2 | **Today's Plan** | `/plan` | Today's specific study tasks with checklist |
| 3 | **Study Roadmap** | `/roadmap` | Full journey from today to exam day with phases and weeks |
| 4 | **AI Tutor** | `/tutor` | Full AI Tutor chat page (complements floating widget) |
| 5 | **Vocabulary** | `/vocabulary` | Notebook, review, and word management |
| 6 | **Practice** | `/practice` | Hub for all skill practice (reading, listening, writing, speaking, grammar) |
| 7 | **Progress** | `/progress` | Analytics, charts, band progress, AI review |
| 8 | **Settings** | `/settings` | Profile, AI provider, language, theme, data |

### Level 2 — Sub-pages (accessed from Level 1 pages)

| Parent | Sub-page | Route |
|--------|----------|-------|
| Dashboard | — | — |
| Today's Plan | Study Roadmap | `/roadmap` |
| Study Roadmap | — | — |
| AI Tutor | — | — |
| Vocabulary | Word Detail (modal/panel) | (in-page) |
| Vocabulary | Vocabulary Review | `/vocabulary/review` |
| Practice | Reading Practice | `/practice/reading` |
| Practice | Listening Practice | `/practice/listening` |
| Practice | Writing Practice | `/practice/writing` |
| Practice | Speaking Practice | `/practice/speaking` |
| Practice | Grammar Practice | `/practice/grammar` |
| Practice | Mistake Review | `/practice/mistakes` |
| Progress | AI Progress Review | `/progress/review` |
| Progress | Mock Tests | `/progress/tests` |
| Progress | Topics | `/progress/topics` |
| Settings | Profile | `/settings/profile` |
| Settings | AI Provider | `/settings/ai` |
| Settings | Language | `/settings/language` |
| Settings | Theme | `/settings/theme` |
| Settings | Data Management | `/settings/data` |
| Settings | Extension Connection | `/settings/extension` |
| Settings | About | `/settings/about` |

### Level 3 — Tools & Utilities (less prominent, no sidebar link)

| Page | Route | Access |
|------|-------|--------|
| Search | `/search` | Header search icon |
| Saved Content | `/saved` | Vocabulary or Practice context |
| Artifacts | `/artifacts` | Settings or Progress context |

### Level 4 — Public & Auxiliary Pages

| Page | Route | Access |
|------|-------|--------|
| Landing | `/` | Unauthenticated |
| Onboarding | `/onboarding` | First visit |
| Info / About | `/info` | Footer |
| Public API | `/public-api` | Developer docs |

### Removed or Relocated Routes

| Current Route | Action | Reason |
|---------------|--------|--------|
| `/roadmap` (redirect) | Keep redirect but also serve `/roadmap` directly | Users think in terms of "roadmap" |
| `/review` | Move to `/vocabulary/review` | Group vocabulary review under Vocabulary |
| `/review-center` | Merge into `/practice/mistakes` or `/vocabulary` | Reduce review confusion |
| `/reading` | Move to `/practice/reading` | Group under Practice hub |
| `/listening` | Move to `/practice/listening` | Group under Practice hub |
| `/writing` | Move to `/practice/writing` | Group under Practice hub |
| `/speaking` | Move to `/practice/speaking` | Group under Practice hub |
| `/grammar` | Move to `/practice/grammar` | Group under Practice hub |
| `/mistakes` | Move to `/practice/mistakes` | Group under Practice hub |
| `/mock-tests` | Move to `/progress/tests` | Group under Progress |
| `/topics` | Move to `/progress/topics` | Group under Progress |
| `/progress-review` | Move to `/progress/review` | Group under Progress |
| `/settings/data` | Keep as `/settings/data` | Settings sub-page |
| `/import-export` | Move to `/settings/data` | Group under Settings |
| `/public-api` | Keep as `/public-api` | Developer utility, footer link |
| `/info` | Keep as `/info` | Footer link |
| `/search` | Keep as `/search` | Header search icon |

---

## Page Hierarchy Diagram

```
Landing Page (/)
  └── Onboarding (/onboarding)
       └── Dashboard (/dashboard) ──────────────────────────────────────┐
            │                                                           │
            ├── Today's Plan (/plan) → Study Roadmap (/roadmap)        │
            │                                                           │
            ├── AI Tutor (/tutor)                                       │
            │    └── (floating popup available on all pages)            │
            │                                                           │
            ├── Vocabulary (/vocabulary)                                │
            │    └── Vocabulary Review (/vocabulary/review)             │
            │    └── Word Detail (in-page panel)                        │
            │                                                           │
            ├── Practice (/practice)                                    │
            │    ├── Reading (/practice/reading)                        │
            │    ├── Listening (/practice/listening)                    │
            │    ├── Writing (/practice/writing)                        │
            │    ├── Speaking (/practice/speaking)                      │
            │    ├── Grammar (/practice/grammar)                        │
            │    └── Mistakes (/practice/mistakes)                      │
            │                                                           │
            ├── Progress (/progress)                                    │
            │    ├── AI Review (/progress/review)                       │
            │    ├── Mock Tests (/progress/tests)                       │
            │    └── Topics (/progress/topics)                          │
            │                                                           │
            ├── Settings (/settings)                                    │
            │    ├── Profile (/settings/profile)                        │
            │    ├── AI Provider (/settings/ai)                         │
            │    ├── Language (/settings/language)                      │
            │    ├── Theme (/settings/theme)                            │
            │    ├── Data (/settings/data)                              │
            │    ├── Extension (/settings/extension)                    │
            │    └── About (/settings/about)                            │
            │                                                           │
            ├── Saved Content (/saved)                                  │
            ├── Search (/search)                                        │
            ├── Artifacts (/artifacts)                                  │
            │                                                           │
            └── Info (/info) / Public API (/public-api)                 │
                 (footer-only links)                                    │
                                                                        │
[AI Tutor Floating Widget — persistent across all authenticated pages]──┘
```

---

## Feature Grouping

### Core Learning (always accessible)

| Group | Pages | Purpose |
|-------|-------|---------|
| Home | Dashboard | Daily overview, mission, streak, quick actions |
| Planning | Today's Plan, Study Roadmap | What to study, day-by-day journey |
| Tutoring | AI Tutor (page + floating) | Personalized guidance, explanations, corrections |
| Vocabulary | Notebook, Review | Word management, spaced repetition |
| Practice | Hub + 6 skill pages | Full skill practice (reading, listening, writing, speaking, grammar) |
| Tracking | Progress hub + 3 sub-pages | Analytics, AI review, test tracking |

### Support (accessible but not primary)

| Group | Pages | Purpose |
|-------|-------|---------|
| Settings | Profile, AI, Language, Theme, Data, Extension, About | App configuration |
| Tools | Saved Content, Search, Artifacts | Supplementary features |
| Public | Landing, Onboarding, Info, Public API | Entry points & info |

---

## Primary Navigation Components

### Desktop Sidebar

```
┌─────────────────────────────┐
│  [Logo] IELTS Journey       │
│                             │
│  ◇  Dashboard               │ ← active state highlight
│  ☐  Today's Plan            │
│  ☐  Study Roadmap           │
│                             │
│  ◆  AI Tutor                │ ← distinct color/accent
│                             │
│  ☐  Vocabulary              │
│  ☐  Practice                │ → expandable / click to hub
│       Reading               │
│       Listening             │
│       Writing               │
│       Speaking              │
│       Grammar               │
│       Mistakes              │
│  ☐  Progress                │ → expandable / click to hub
│       AI Review             │
│       Mock Tests            │
│       Topics                │
│                             │
│  ⚙  Settings                │
│                             │
│  [User avatar + name]       │
└─────────────────────────────┘
```

### Mobile Bottom Navigation

```
┌──────┬──────┬──────┬──────┬──────┐
│ Home │ Plan │  AI  │ Vocab│Progress│
│  ◇   │  ☐   │  ◆   │  ☐   │  ☐    │
└──────┴──────┴──────┴──────┴──────┘
  /dash   /plan  /tutor  /vocab  /progress
```

Mobile shows 5 priority items matching the user's most frequent daily interactions: checking what to study, following the plan, asking the AI Tutor, reviewing vocabulary, and tracking progress. Practice and Settings are accessible via a "+" expand action or the header menu.

### Header Bar (desktop + mobile)

```
┌──────────────────────────────────────────────┐
│  ← (mobile: back)   [Page Title]    🔍  ◆ 🌙│
│                                        AI    │
│                                        Tutor │
└──────────────────────────────────────────────┘
```

- **Search icon** (🔍): opens `/search` overlay/page
- **AI Tutor quick button** (◆): toggles floating chat popup
- **Dark mode toggle** (🌙): instant theme switch
- **User avatar**: dropdown menu for settings, profile, logout

---

## Main User Flows

### 1. First-Time User Flow (Onboarding → Dashboard)

```
Landing Page
  │
  ├── "Start Learning" CTA
  │     └── Onboarding Flow
  │           ├── Step 1: Welcome + Language selection
  │           ├── Step 2: Current IELTS level (select band)
  │           ├── Step 3: Target band score
  │           ├── Step 4: Exam date (date picker)
  │           ├── Step 5: Study time per day (slider 15-180 min)
  │           ├── Step 6: Weak skills (multi-select: reading, listening, writing, speaking, grammar)
  │           ├── Step 7: Strong skills (multi-select)
  │           ├── Step 8: Tutor style preference (encouraging / strict / detailed)
  │           ├── "Generate My Study Plan" action
  │           │     └── AI generation progress screen (animated)
  │           └── Complete → Dashboard
  │
  └── "Try Demo" CTA
        └── Dashboard with sample data (read-only preview)
```

### 2. Daily Learning Flow

```
Dashboard (morning entry)
  │
  ├── "Good morning, [Name]"
  ├── Today's Mission card: "Study 3 tasks • 45 min"
  ├── AI Recommendation: "Focus on Reading — it's your weakest skill"
  │
  ├── [Continue Learning] → Today's Plan (/plan)
  │     ├── Task 1: Reading passage (20 min)  ──→ /practice/reading
  │     ├── Task 2: Vocabulary review (10 min) ──→ /vocabulary/review
  │     ├── Task 3: Writing task (15 min)      ──→ /practice/writing
  │     ├── ✅ Mark complete as you finish
  │     └── 🎉 "Today's plan complete!" celebration
  │
  ├── [Ask AI Tutor] → /tutor or floating popup
  │     ├── "Explain this reading passage vocabulary"
  │     ├── "Correct my writing"
  │     └── "What should I focus on today?"
  │
  └── [View Progress] → /progress
        ├── Band progress chart
        ├── Weekly study time
        └── Skill breakdown
```

### 3. AI Tutor Entry Points

| Entry Point | Location | Behavior |
|-------------|----------|----------|
| Floating button | Bottom-right, all pages | Opens chat popup (non-intrusive, resizable) |
| Navigation link | Sidebar (desktop) / Bottom nav (mobile) | Opens full-page AI Tutor (`/tutor`) |
| Dashboard AI card | Dashboard hero | Quick suggestion with "Ask AI Tutor" action |
| Contextual button | Vocabulary word detail | "Ask AI to explain this word" |
| Writing correction | Writing practice result | "Get AI feedback on your essay" |
| Speaking feedback | Speaking practice result | "Get AI feedback on your response" |
| Study plan generation | Onboarding / Plan page | "AI is creating your personalized plan" |
| Progress review | Progress page | "Generate AI Progress Review" |
| Mistake insight | Mistake Review | "Ask AI why this mistake happened" |

### 4. Study Plan Flow

```
Dashboard
  │
  ├── Today's Mission card
  │     └── [View Full Plan] → /plan
  │
  └── /plan (Today's Plan)
        ├── Today's goal: "Complete 4 of 6 tasks"
        ├── Task checklist with timers
        ├── Progress bar: tasks completed / total
        │
        ├── [View Roadmap] → /roadmap
        │     ├── Timeline from today to exam day
        │     ├── Phase 1: Foundation (weeks 1-4)
        │     ├── Phase 2: Skill Building (weeks 5-8)
        │     ├── Phase 3: Intensive Practice (weeks 9-12)
        │     ├── Phase 4: Final Review (weeks 13-14)
        │     └── Today highlighted, completed phases checked
        │
        ├── [Adjust Plan] → opens plan settings
        │     ├── Change exam date
        │     ├── Adjust study intensity
        │     ├── Change weak skill focus
        │     └── [Regenerate Plan] → AI progress screen
        │
        └── [Ask AI Tutor about plan]
              └── "Why was this task assigned?"
              └── "Can I swap today's Reading for Listening?"
```

### 5. Vocabulary Flow

```
Dashboard
  │
  ├── "Review 5 words today" reminder card
  │     └── [Start Review] → /vocabulary/review
  │
  └── /vocabulary (Notebook)
        ├── Word list (searchable, filterable)
        ├── Topic groupings (Education, Technology, Environment, etc.)
        ├── Difficulty badges (Easy / Medium / Hard / IELTS Band 7+)
        │
        ├── [Word Card click] → Word Detail Panel
        │     ├── Word, pronunciation, audio button
        │     ├── Part of speech, word forms
        │     ├── Synonyms, antonyms
        │     ├── Example sentences (IELTS context)
        │     ├── "This word appeared in IELTS Reading Passage X"
        │     ├── Review status (new / learning / reviewed / mastered)
        │     ├── [Ask AI Tutor] "Show me more examples"
        │     ├── [Save to review] → adds to next review session
        │     └── [Remove / Archive]
        │
        ├── [Start Review] → /vocabulary/review
        │     ├── Flashcard mode (front: word, back: definition + example)
        │     ├── Quiz mode (multiple choice, fill-in-the-blank)
        │     ├── Remember / Forgot buttons → spaced repetition update
        │     ├── Session progress: "5 / 15 words reviewed"
        │     ├── Completion summary: "You remembered 12/15 words"
        │     └── "3 words need more practice — review again tomorrow"
        │
        └── [Import Vocabulary]
              ├── From extension (synced from browser)
              ├── From saved articles
              └── Manual add
```

### 6. Practice Flow

```
Dashboard / Today's Plan
  │
  ├── Practice task card
  │     └── [Start Practice] → /practice/{skill}
  │
  └── /practice (Practice Hub)
        ├── Skill cards (Reading, Listening, Writing, Speaking, Grammar)
        │     ├── Skill name + icon
        │     ├── Current level / progress
        │     ├── Last practiced: "2 days ago"
        │     └── [Start] / [Continue]
        │
        └── Practice Types:
              ├── Reading: Passage with questions, timed
              ├── Listening: Audio + questions
              ├── Writing: Task 1 / Task 2 prompt + editor
              ├── Speaking: Part 1/2/3 prompt + record + transcript
              ├── Grammar: Interactive exercises
              └── Mistake Review: Past mistake practice

/practice/{skill}
  ├── Objective and estimated time
  ├── Instructions (collapsible)
  │
  ├── [Start Practice]
  │     ├── Main practice interface
  │     │     ├── Reading: passage + question panel
  │     │     ├── Listening: audio player + transcript + questions
  │     │     ├── Writing: prompt + text editor + timer
  │     │     ├── Speaking: prompt + record button + transcript
  │     │     └── Grammar: question + options / fill-in
  │     │
  │     ├── [Ask AI Tutor for help] → contextual hint (without leaving page)
  │     └── [Submit] → Results
  │
  ├── Results
  │     ├── Score / correct answers
  │     ├── Feedback breakdown
  │     ├── [Save Mistakes] → adds to mistake notebook
  │     ├── [Save Vocabulary] → adds new words to vocabulary
  │     ├── [Practice Similar] → retry with similar questions
  │     └── [AI Feedback] → detailed AI analysis (writing/speaking)
  │
  └── [View Mistake History] → /practice/mistakes
        ├── Mistake list by category (grammar, vocabulary, comprehension)
        ├── Repeated mistakes highlighted
        ├── Explanation card for each mistake
        ├── [Practice Similar Question] action
        └── [Ask AI Tutor] "Why do I keep making this mistake?"
```

### 7. Progress Review Flow

```
Dashboard
  │
  ├── Weekly progress summary card
  │     └── [View Full Progress] → /progress
  │
  └── /progress (Progress Hub)
        ├── Band progress chart (line chart over time)
        │     ├── Current estimated band
        │     ├── Target band
        │     └── Trend arrow (↑ improving / → stable / ↓ declining)
        │
        ├── Skill breakdown (radar chart or bar chart)
        │     ├── Reading: 6.5
        │     ├── Listening: 7.0
        │     ├── Writing: 6.0 (weakest)
        │     ├── Speaking: 6.5
        │     └── Grammar: 65% accuracy
        │
        ├── Study statistics
        │     ├── Weekly study time (hours)
        │     ├── Completed tasks (count)
        │     ├── Study streak (days)
        │     ├── Vocabulary retention rate
        │     └── Mistake trends (declining or increasing)
        │
        ├── Exam countdown
        │     └── "45 days until your IELTS exam"
        │
        ├── [Generate AI Progress Review] → /progress/review
        │     ├── Period selector (last week / last month / full journey)
        │     ├── AI generation progress
        │     ├── AI Review summary (strengths, weaknesses, trends)
        │     ├── Repeated mistake analysis
        │     ├── Study plan comparison (on track / falling behind)
        │     ├── Next recommendations
        │     ├── [Save Report] → PDF or shareable link
        │     └── [Follow-up Questions] → opens AI Tutor with context
        │
        └── [View Mock Tests] → /progress/tests
              └── [View Topics] → /progress/topics
```

### 8. Settings Flow

```
Dashboard / Any page
  │
  └── ⚙ Settings → /settings
        │
        ├── Profile (/settings/profile)
        │     ├── Name, email, avatar
        │     ├── Target band, exam date
        │     └── IELTS variant (Academic / General Training)
        │
        ├── AI Provider (/settings/ai)
        │     ├── Provider selection (OpenAI, custom)
        │     ├── API key input (masked)
        │     ├── Model selection
        │     └── Connection test button
        │
        ├── Language (/settings/language)
        │     ├── App language selector
        │     └── Locale preview
        │
        ├── Theme (/settings/theme)
        │     ├── Light / Dark / System
        │     └── Accent color preference (future)
        │
        ├── Study Plan (/settings/plan) — (optional, may be in /plan)
        │     ├── Daily study time default
        │     ├── Study intensity (light / moderate / intensive)
        │     └── Skill focus priority
        │
        ├── Notifications (/settings/notifications)
        │     ├── Daily study reminder
        │     ├── Streak reminder
        │     └── Review reminder
        │
        ├── Data Management (/settings/data)
        │     ├── Storage usage
        │     ├── Export all data
        │     ├── Import data
        │     └── Reset all data (with confirmation)
        │
        ├── Extension (/settings/extension)
        │     ├── Connection status
        │     ├── Install extension link
        │     ├── Sync status
        │     └── Last sync time
        │
        └── About (/settings/about)
              ├── App version
              ├── Licenses
              ├── Privacy policy
              └── Feedback / Support
```

---

## Feature Grouping & Prioritization Matrix

| Feature | Frequency | Importance | Mobile Priority | Current Status |
|---------|-----------|------------|-----------------|----------------|
| Dashboard | Daily | Critical | Bottom nav #1 | ✅ Exists |
| Today's Plan | Daily | Critical | Bottom nav #2 | ✅ Exists (as Study Plan) |
| AI Tutor | Daily | High | Bottom nav #3 | ✅ Exists (floating only) |
| Vocabulary Review | Daily | High | Bottom nav #4 | ✅ Exists |
| Progress | Weekly | High | Bottom nav #5 | ✅ Exists |
| Reading Practice | Weekly | High | Practice hub | ✅ Exists |
| Listening Practice | Weekly | High | Practice hub | ✅ Exists |
| Writing Practice | Weekly | High | Practice hub | ✅ Exists |
| Speaking Practice | Weekly | High | Practice hub | ✅ Exists |
| Grammar Practice | Weekly | Medium | Practice hub | ✅ Exists |
| Study Roadmap | Weekly | High | Plan sub-page | ✅ Exists (as feature, not routed) |
| Mistake Review | Weekly | Medium | Practice hub | ✅ Exists |
| Mock Tests | Monthly | Medium | Progress sub-page | ✅ Exists |
| Saved Content | Weekly | Medium | Tools | ⚠️ No dedicated page |
| Settings | Once | Low | Header menu | ✅ Exists |
| Search | As needed | Low | Header icon | ✅ Exists |

---

## Navigation Priority Rules

1. **Primary navigation** (sidebar + bottom nav) shows only the 8 most important destinations: Dashboard, Today's Plan, Study Roadmap, AI Tutor, Vocabulary, Practice, Progress, Settings.

2. **Practice is a hub, not a list**: The sidebar shows "Practice" as one item. Hover/click reveals a popover or sub-menu with the 6 skill pages. Mobile shows Practice as a gate that opens to skill selection.

3. **Settings is demoted**: Settings moves to the bottom of the sidebar (below a separator) and is absent from the bottom nav. Accessible via header avatar menu or sidebar.

4. **Secondary pages hide from global nav**: Artifacts, Search, Saved Content, Public API, Info, Import/Export are accessible through context menus, header icons, footer links, or direct URL entry. They are not in the primary sidebar.

5. **Info pages move to footer**: About, Donate, Recruit, Feedback move to a footer link on the Landing Page and a "Help & Info" section in Settings. They do not appear in the app navigation.

6. **AI Tutor gets a dedicated route**: `/tutor` is a full-page experience, in addition to the floating popup available on all pages.

7. **Today's Plan vs Roadmap**: `/plan` shows the current day's tasks. `/roadmap` shows the full journey. Both are primary nav items (or `/roadmap` is a sub-section of `/plan`).

8. **Mobile navigation is identical across devices**: The bottom nav always shows the same 5 items. No variant per screen size.

---

## Cross-Linking Strategy

| From | Link To | Context |
|------|---------|---------|
| Dashboard | Today's Plan | "Continue Learning" card |
| Dashboard | Vocabulary Review | "Review 5 words" reminder |
| Dashboard | AI Tutor | AI Recommendation card |
| Dashboard | Progress | Weekly summary card |
| Today's Plan | Practice skill | Task card → `/practice/{skill}` |
| Today's Plan | Vocabulary Review | Vocabulary task |
| Today's Plan | Study Roadmap | "View Full Roadmap" |
| Vocabulary | AI Tutor | Word detail → "Ask AI" |
| Vocabulary | Vocabulary Review | "Start Review" button |
| Practice (skill) | Mistake Review | After result → "Save Mistake" |
| Practice (skill) | Vocabulary | After result → "Save Vocabulary" |
| Practice (skill) | AI Tutor | "Get AI Feedback" button |
| Practice (Mistakes) | Practice (skill) | "Practice Similar" action |
| Progress | AI Tutor | "Ask about my progress" |
| Progress | AI Progress Review | "Generate Review" action |
| Settings | Extension | "Connect Extension" |
| AI Tutor | Today's Plan | "Update my plan" suggestion |

---

## Search Strategy

The current `/search` page provides full-text search across all app data. In the redesign:

- **Search icon** in the header bar opens an overlay (desktop) or full page (mobile)
- **Search scope**: vocabulary, saved articles, practice history, mistakes, study plan notes
- **AI-enhanced search**: "Ask AI Tutor" option for natural language queries about past content
- **Keyboard shortcut**: `Ctrl/Cmd + K` to open search overlay from any page

---

## Empty State Navigation Strategy

When a user lands on a page with no data, the navigation should guide them toward content creation:

| Page | Empty State Action | Navigates To |
|------|-------------------|--------------|
| Dashboard | "Start your IELTS journey" | Onboarding |
| Today's Plan | "Generate your first study plan" | Plan generator |
| AI Tutor | "Ask your first question" | Pre-filled prompt |
| Vocabulary | "Save your first word" | Extension or manual add |
| Practice | "Take your first practice test" | Practice hub → skill |
| Progress | "Complete your first study session" | Today's Plan |
| Mistakes | "Practice first to find mistakes" | Practice hub |
| Saved Content | "Save articles while browsing" | Extension download |

---

## Responsive IA Behavior

| Screen Width | Navigation Mode | Behavior |
|-------------|----------------|----------|
| < 640px (mobile) | Bottom nav (5 items) + header | Bottom nav always visible. Sidebar hidden behind hamburger menu. Pages stack vertically. |
| 640px - 1023px (tablet) | Collapsed sidebar + bottom nav | Sidebar shows icons only (collapsed), labels on hover. Bottom nav visible. Layout uses 2-column grids. |
| ≥ 1024px (desktop) | Full sidebar + header | Sidebar shows icons + labels. No bottom nav. Layout uses multi-column grids with sidebar fixed width (~240px). |

---

## Breadcrumb Strategy

Breadcrumbs appear on sub-pages (not on primary pages) to show location within the hierarchy.

Examples:
- `Dashboard > Practice > Reading`
- `Dashboard > Progress > AI Progress Review`
- `Dashboard > Settings > AI Provider`

Breadcrumbs are hidden on mobile or replaced by the header back button.

---

## IA Principles Applied

1. **Three-click rule**: Any page is reachable within 3 clicks/taps from the dashboard.
2. **Dashboard is home**: Every flow starts from or returns to the dashboard. It is the user's base.
3. **AI Tutor is everywhere**: AI Tutor entry points exist on every page contextually, not just its own page.
4. **Practice hub reduces noise**: Grouping 6 skills under "Practice" reduces sidebar items from 17 to 8 primary + 1 expandable group.
5. **Settings is utility, not feature**: Settings is available but out of the way. Users access it rarely.
6. **Mobile-first prioritization**: The 5 bottom nav items represent the highest-frequency daily actions.
7. **Exam goal visibility**: The exam countdown and target band appear in the dashboard header, visible on every page through the sidebar.
8. **Clear page titles**: Route names match what users say aloud ("Today's Plan", not "Study Plan"; "Vocabulary", not "Word Manager").
9. **One primary action per page**: Each page has one clear next step. The navigation supports but does not compete with it.
10. **Future-ready**: The IA supports adding new practice types (e.g., "Vocabulary Practice" as a distinct page), new settings, and content types without restructuring.
