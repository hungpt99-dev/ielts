# IELTS Journey — Onboarding Page Specification

## Page Purpose

The onboarding page is a multi-step flow that converts a first-time visitor into an active IELTS learner. It captures essential user data (current level, target band, exam date, study preferences, weak/strong skills) and generates the user's first AI study plan. The onboarding is the user's first experience inside the product — it must feel motivating, personalized, and frictionless, not like filling out a long boring form.

## User Goal

Users should complete onboarding feeling:

- **Understood** — The app knows their level, goal, and challenges
- **Confident** — The AI-powered study plan makes their goal feel achievable
- **Motivated** — They can't wait to start today's learning mission
- **Informed** — They understand what IELTS Journey does and how it helps

The onboarding should take less than 3 minutes. Every step should feel like progress toward their exam goal, not data entry.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/features/onboarding/OnboardingForm.tsx`, `apps/web/src/features/onboarding/onboardingService.ts`):

1. **Form-based, not experience-based** — The current onboarding is a standard multi-step HTML form (`<select>`, `<input>`, toggle buttons). It feels like filling out a survey, not starting a learning journey.

2. **No visual progress indication** — Users cannot see how many steps remain or how far they've come. No progress bar, stepper, or step indicator.

3. **Step 1 overloads the user** — "Set Your IELTS Goal" asks for IELTS type (Academic/General), current band, target band, and exam date — all on one screen with no visual hierarchy. Too many decisions at once.

4. **No emotional onboarding design** — The form is functional but cold. No illustrations, no animations, no congratulatory moments when entering data.

5. **No AI Tutor introduction** — The AI Tutor is never mentioned during onboarding. Users discover it later in the dashboard. A critical feature is buried.

6. **Summary step is static** — Step 3 presents a static summary review. No opportunity to visualize the study plan, see estimated band improvement trajectory, or generate excitement about the AI roadmap.

7. **Exam date is buried** — The exam date picker is a simple HTML date input inside Step 1. No countdown preview, no urgency visualization.

8. **Study preference days are tedious** — The current UI uses toggle buttons for each day (Mon-Sun) instead of a simpler "how many days per week" slider or a weekly calendar visualization.

9. **No weak skills explanation** — Users select weak skills from a list but receive no guidance on what each skill entails or why it matters.

10. **No strong skills capture** — The current flow only asks for weak skills. It doesn't capture what the user is already good at, missing an opportunity for balanced planning and encouragement.

11. **No tutor style preference** — The current flow doesn't ask about preferred teaching style (strict, encouraging, detailed, concise), which would help personalize AI Tutor interactions.

12. **Study plan generation is invisible** — When `generateRoadmapTasks()` is called, there's no loading UI or progress indication. Users click "Start Learning" and wait with no feedback.

13. **Desktop-only layout** — The form uses `max-w-lg mx-auto` with default input sizing. No mobile-first responsive adaptation.

14. **No onboarding skip option** — First-time users must complete all 3 steps. No "Start with minimal data" option or "Skip, I'll set it up later" pathway.

15. **No language preference step** — The current flow doesn't ask for preferred UI language, making the initial experience English-only by default even if the user prefers Vietnamese.

---

## Proposed Layout

The redesigned onboarding follows a **progressive step-by-step wizard** with a visual stepper, celebratory micro-interactions, and an AI-generating preview at the end.

```
┌──────────────────────────────────────────────────────┐
│  [Logo] IELTS Journey                          [Skip] │
│  Step ① · ② · ③ · ④ · ⑤ · ⑥                        │
├──────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │       [Illustration: Friendly Tutor Avatar]       │  │
│  │                                                  │  │
│  │   Step Title (e.g., "What band do you need?")    │  │
│  │   Helper text guiding the user                   │  │
│  │                                                  │  │
│  │   [Input / Select / Slider / Picker]             │  │
│  │                                                  │  │
│  │   [Back]  [Continue →]                           │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [Trust note: "Your data stays on your device"]        │
├──────────────────────────────────────────────────────┤
│  [Footer: Privacy-first, open source]                  │
└──────────────────────────────────────────────────────┘
```

### Step Flow Summary

```
STEP 1        STEP 2        STEP 3        STEP 4        STEP 5        STEP 6
Language →  Current Band → Target Band → Exam Date → Study Time → Weak/Strong Skills
                                                                      ↓
                                                               STEP 7        STEP 8
                                                           Tutor Style → AI Generating
                                                                              ↓
                                                                       DASHBOARD
```

---

## Main Sections

### 1. Top Bar (Header)

**Purpose**: Provide brand identity, visual progress tracking, and an exit option.

**Content**: Logo (small, centered or left-aligned), step indicator (numbered pills with active/completed/upcoming states), [Skip] link (right-aligned, subtle).

**Behavior**:
- The step indicator shows 6 compact step dots on mobile and labeled step names on desktop
- Current step is highlighted with the primary color and a subtle pulse animation
- Completed steps show a checkmark
- [Skip] shows a confirmation tooltip: "You can set this up later in Settings. Are you sure?"
- On last step, the [Skip] link is hidden

**States**:
- Step 1: All future steps dimmed
- Step completed step: Animated checkmark fills the step circle
- Skip clicked: Confirmation modal

**Components needed**: `Badge` (step indicator, primary/completed/upcoming), `Button` (ghost, sm for Skip), `Stepper` component.

### 2. Step Content Area

**Purpose**: Display the current step's question, illustration, and input controls. Each step asks one clear question.

Each step follows a consistent visual pattern:
- **Illustration**: Friendly, soft illustration or icon (top, centered) — e.g., a graduation cap for "Target Band", a calendar for "Exam Date", a clock for "Study Time"
- **Title**: Single clear question (e.g., "What band score do you need?")
- **Helper text**: 1-2 sentences of context or guidance
- **Input control**: Tailored to the question (select card, slider, date picker, toggle group, pill selector)
- **Feedback**: Immediate validation or preview (e.g., "5 more days to exam" when date is selected)
- **[Back] button**: Left, ghost style — hidden on Step 1
- **[Continue] button**: Right, primary — disabled until input is valid

**Step 1 — Language Selection**

**Question**: "What language do you prefer?"

**Content**:
- Illustration: Globe with language characters
- Input: Large card-style radio group with flags/icons
- Options: English (default), Vietnamese, Japanese, Korean, Chinese, Hindi, Arabic, Spanish — scrollable if needed
- Selected card: Primary border + subtle background + checkmark

**Validation**: At least one language selected.

**Behavior**: Selecting a language immediately updates the UI locale text. This is the first personalization touchpoint.

**Step 2 — Current IELTS Level**

**Question**: "What is your current IELTS level?"

**Content**:
- Illustration: Bar chart or ladder showing bands 1.0 → 9.0
- Input: Visual band selector — a horizontal band scale or a large card-based picker with level descriptions
- Options: 1.0 (Beginner) through 9.0 (Expert) in 0.5 increments
- Each level shows a short description (e.g., "4.0 — Limited user. Can understand basic English in familiar situations.")
- Selected band: Highlighted on the scale with a friendly message ("That's a great starting point!")

**Validation**: A level must be selected.

**Behavior**: Selecting a level shows a brief encouraging message. The illustration animates to show the user's position on the IELTS band scale.

**Step 3 — Target Band**

**Question**: "What band score do you need?"

**Content**:
- Illustration: Target/bullseye with the flag of a common destination country (or generic goal icon)
- Input: Same band selector visual from Step 2, but target mode
- Options: 4.0 through 9.0 in 0.5 increments — values below current level are visually disabled but still visible for reference
- **Band gap visualization**: When selected, show a horizontal comparison: Current → Target with the gap highlighted. e.g., "You need to improve from 5.5 to 7.0 — that's 1.5 bands. IELTS Journey can help you get there!"
- **Difficulty indicator**: Based on gap size, show a gentle difficulty level (Easy: 0.5-1.0, Manageable: 1.0-2.0, Challenging: 2.0-3.0)

**Validation**: Target must be higher than current band.

**Behavior**: Band gap visualization appears on selection. Encouraging but honest message about the work required.

**Step 4 — Exam Date**

**Question**: "When is your IELTS exam?"

**Content**:
- Illustration: Calendar with a countdown clock
- Input: Date picker (styled, not native if possible) with quick options:
  - "1 month" → dates ~30 days from today
  - "3 months" → dates ~90 days from today
  - "6 months" → dates ~180 days from today
  - "Not sure yet" → skips/clears the date
- **Countdown preview**: When a date is selected, show: "X weeks away — that gives you Y study hours at Z minutes/day"
- **Warning**: If exam date is less than 2 weeks away and gap is large: "Your exam is soon. Let's focus on your highest-impact areas."

**Validation**: Optional field (can be set later). However, without a date, some features (countdown, roadmap end date) will be limited.

**Behavior**: Quick-select buttons set the date instantly. Custom date picker for precise selection. "Not sure yet" clears the date and shows: "No problem — you can set it later and AI will adjust your plan."

**Step 5 — Study Time Per Day**

**Question**: "How much time can you study each day?"

**Content**:
- Illustration: Clock with a relaxing study scene
- Input: Large slider (or picker) from 15 to 240 minutes with labeled anchors:
  - 15 min ("Quick practice")
  - 30 min ("Light")
  - 60 min ("Standard" — default)
  - 90 min ("Focused")
  - 120 min ("Intensive")
  - 180 min ("Dedicated")
- **Visual feedback**: As the user drags, show:
  - Estimated words learned per month
  - Number of practice questions per week
  - A small study scene illustration updating (e.g., more books appearing)

**Validation**: Must be at least 15 minutes.

**Behavior**: Slider allows free selection between anchors. Show encouraging stats on the right. "You can always adjust this later."

**Step 6 — Weak & Strong Skills**

**Question**: "Which skills need the most work? What are you good at?"

**Content**:
- Illustration: Four IELTS skill icons (Reading, Listening, Writing, Speaking) arranged in a square, plus two small icons for Vocabulary and Grammar
- **Two sections**:
  1. **"I need practice with:"** (Weak skills) — Tap to select. 6 pill/chip options: Reading, Listening, Writing, Speaking, Vocabulary, Grammar. Multiple selection allowed.
  2. **"I'm confident in:"** (Strong skills) — Tap to select. Same 6 options. Can overlap with weak? No — skills cannot be both weak and strong. Selecting in one removes from the other.
- Each skill shows a short description when tapped (e.g., "Writing — Task 1 diagrams and Task 2 essays")

**Validation**: At least one weak skill must be selected.

**Behavior**: The two sections are visually distinct (weak: warm/orange border group, strong: green/success border group). Skills animate when moved between sections. At least 1 weak → Continue enabled. If too many weak selected (>4): "That's a lot to work on! Let's prioritize. Which 2-3 are most urgent?"

**Step 7 — Preferred Tutor Style**

**Question**: "How would you like your AI Tutor to teach you?"

**Content**:
- Illustration: AI Tutor character with speech bubbles
- Input: 3 large card-style options with personality previews:
  1. **"Encouraging & Supportive"** — "You're doing great! Let's keep going step by step. Remember, every mistake is a learning opportunity."
  2. **"Direct & Efficient"** — "Here's what you need to improve. Let's focus on your weakest areas first. Time is limited."
  3. **"Detailed & Explanatory"** — "Let me explain why this answer is correct. When you understand the rule, you can apply it anywhere."
- Selected card: Primary border + background + checkmark + expanded personality preview (2-3 sentence sample)
- **Preview note**: "You can change this anytime in Settings."

**Validation**: One option must be selected.

**Behavior**: Selecting a card shows a larger preview of what conversation style looks like. This is a fun, light step that builds anticipation for the AI Tutor.

**Step 8 — AI Study Plan Generation**

**Question**: (No question — transitional state)

**Content**:
- Illustration: Animated AI loading (sparkle dots, brain scan, or progress rings)
- **Title**: "Creating your personal IELTS Journey..."
- **Progressive messages** (cycling every 2-3 seconds):
  1. "Analyzing your level from {currentBand} to {targetBand}..."
  2. "Planning {X} weeks of study..."
  3. "Building daily tasks for your weak skills..."
  4. "Preparing your vocabulary review system..."
  5. "Almost ready — setting up your AI Tutor..."
- **Progress bar**: Determinate (simulated) showing 20% → 100% over ~6-10 seconds
- **Tip**: A rotating study tip in the footer of the card (e.g., "Did you know? Consistent 30-minute daily practice improves 1 band in 3 months.")
- **Cancellation**: Subtle "Cancel" link in bottom-left (generated data is discarded, user returns to Step 7)

**Completion**: Progress reaches 100%, the card fades, and user is automatically redirected to `/dashboard`.

**Components needed**: `ProgressBar` (animated), `Card` (elevated, centered), `Spinner` or `Loading` animation.

### 3. Trust Footer

**Purpose**: Build trust and reduce abandonment anxiety.

**Content**: "Your data stays on your device · No account needed · Open source · Privacy first"

**Design notes**: Small, muted text, centered at the bottom of the viewport. Fixed position on mobile, static on desktop.

---

## Primary Actions

| Action | Location | Type |
|--------|----------|------|
| Continue to next step | Right side of step area | Primary button — "Continue →" or "Start Learning" (last step) |
| Go back to previous step | Left side of step area | Ghost button — "← Back" |
| Skip onboarding | Top-right corner | Ghost link — "Skip" |
| Select language | Step 1 | Card-style radio |
| Select current band | Step 2 | Band selector |
| Select target band | Step 3 | Band selector |
| Pick exam date | Step 4 | Date picker + quick-select pills |
| Set study time | Step 5 | Slider with labeled anchors |
| Choose weak/strong skills | Step 6 | Toggle pills (two groups) |
| Choose tutor style | Step 7 | Card radio with preview |
| Cancel generation | Step 8 | Subtle link |

## Secondary Actions

| Action | Location | Type |
|--------|----------|------|
| See privacy info | Footer | Link (or tooltip) |
| Change language selection | Step 1 selection persists header | Indicator/menu in settings after onboarding |
| Read about IELTS bands | Steps 2-3, info icon | Tooltip with band description |
| Retry generation | Step 8 (on failure) | "Try Again" button |

---

## Empty State

The onboarding page is a user-input flow with no data-dependent empty states. However, handle these edge cases:

- **No exam date**: If user skips exam date (Step 4), show "Not sure yet" as the persisted state. Dashboard and roadmap adapt with "Exam date not set — you can add it anytime."
- **No weak skills selected**: Continue is disabled until at least one weak skill is selected (Step 6). Helper text explains: "Select at least one skill you want to improve."
- **All skills marked strong (no weak)**: Show friendly error: "Even experts have areas to improve! Which skill do you want to practice most?"

---

## Loading State

| Element | Loading Behavior |
|---------|-----------------|
| Step transition | Subtle fade out / fade in (200ms crossfade) between steps |
| Band selector options | Static — no loading needed (client-side data) |
| Date picker options | Static — no loading needed |
| AI Plan Generation (Step 8) | Full-step loading with progress bar + rotating messages |
| Generation failure | Error state (see below) |
| First load of onboarding | Minimal — check `isOnboardingComplete` from localStorage (synchronous). If somehow async, show skeleton of Step 1. |

### Step 8 — Generation Progress Detail

The AI plan generation step uses a determinate progress bar with progressive status messages:

```
┌────────────────────────────────────────────────────┐
│                                                    │
│          ✨ Creating your personal                 │
│             IELTS Journey...                        │
│                                                    │
│  ┌────────────────────────────────────────────────┐│
│  │  ████████████████░░░░░░░░░░░░  45%            ││
│  └────────────────────────────────────────────────┘│
│                                                    │
│  Building daily tasks for your weak skills...      │
│                                                    │
│  💡 Tip: Consistent 30-minute daily practice       │
│     improves 1 band in 3 months.                   │
│                                                    │
│  [Cancel]                                          │
└────────────────────────────────────────────────────┘
```

**Behavior**:
- Progress is simulated (not real-time API progress) — but should feel realistic
- Messages rotate every 2-3 seconds
- Total duration: ~6-10 seconds
- After 100%, redirect to `/dashboard` with a brief "Welcome!" toast
- If using IndexedDB (current `onboardingService` uses `saveAppSettings` + `generateRoadmapTasks`), wrap the actual generation in the progress animation

---

## Error State

| Scenario | Error Behavior |
|----------|---------------|
| Generation fails | Step 8 shows error state: "Something went wrong. Your settings are saved, but the study plan couldn't be generated." → [Try Again] or [Go to Dashboard] |
| IndexedDB write failure | "Could not save your preferences. Please check your browser storage settings." → [Retry] |
| Browser storage quota exceeded | "Storage is full. Your preferences couldn't be saved. Free up space or use a different browser." → [Clear Old Data] |
| Invalid form data | Inline validation: red border + message below the input. Never show generic error toasts. |
| Network error (future — if AI generates server-side) | "AI generation failed due to a network issue. Your preferences are saved locally. You can regenerate your plan anytime." → [Try Again] or [Continue to Dashboard] |

### Generation Error Design

```
┌────────────────────────────────────────────────────┐
│                                                    │
│          ⚠️ Generation Failed                       │
│                                                    │
│  Your settings are saved. We couldn't create       │
│  your study plan right now.                        │
│                                                    │
│  [Try Again]      [Go to Dashboard]                │
│                                                    │
│  Your AI Tutor can help set up your plan later.    │
└────────────────────────────────────────────────────┘
```

---

## Mobile Layout

The onboarding is designed mobile-first. Key adaptations:

| Element | Desktop | Mobile (< 640px) |
|---------|---------|------------------|
| **Top bar** | Full logo + step labels + [Skip] | Compact logo (icon only) + step dots (no labels) + [Skip] |
| **Step content** | Centered card (max-w-lg) with illustration | Full-width with reduced padding. Illustration smaller (120px max) |
| **Input controls** | Normal size | Touch-optimized: 44px+ touch targets, larger fonts, full-width controls |
| **Step indicator** | Horizontal with names | Dots only (no names), positioned at top |
| **Buttons** | [Back] ghost + [Continue] primary side by side | Full-width [Continue] at bottom. [Back] as floating icon in top-left |
| **Date picker** | Inline calendar | Compact picker or action sheet style |
| **Band selector** | Horizontal scale with labels | Vertical list of cards (swipeable) |
| **Slider (study time)** | Horizontal with labeled anchors | Larger slider track, labeled anchors below |
| **Weak/strong skills** | Two-column layout | Two sections stacked vertically |
| **Tutor style cards** | 3-column horizontal | Vertical list (1 card per row) |
| **Generation step** | Centered card | Full screen with large progress indicator |
| **Trust footer** | Visible at bottom | Below the fold, or fixed at very bottom |

**Mobile-specific behaviors**:
- Keyboard opens for date picker? Avoid — use gesture-based picker
- Slider is touch-friendly with larger track height (8px → 12px)
- Bottom sheet for band selection? Better to keep inline for onboarding flow
- Swipe gesture to go back/forward between steps (future enhancement)

---

## Responsive Behavior

| Breakpoint | Layout | Navigation |
|------------|--------|------------|
| < 480px (small phone) | Single column, max touch targets, minimal illustration | Step dots only |
| 480-639px (large phone) | Single column, standard touch targets | Step dots only |
| 640-1023px (tablet) | Centered max-w card, side-by-side layout for Step 6 | Step dots with abbreviated labels |
| 1024px+ (desktop) | Centered card with full illustration, labeled stepper | Step labels visible |

**Key responsive rules**:
- The onboarding card should never exceed `max-w-xl` on any screen
- Padding scales: `p-4` (mobile) → `p-6` (tablet) → `p-8` (desktop)
- Typography scales: headings `text-2xl` (mobile) → `text-3xl` (desktop)
- All inputs must have minimum 44px touch target on mobile
- The [Continue] button should be the easiest element to tap on mobile — positioned within thumb reach

---

## AI Tutor Integration

The AI Tutor is introduced during onboarding — not discovered later:

1. **Step 7 (Tutor Style)**: The user explicitly chooses their AI Tutor's personality. This sets expectations and gives the user agency over their learning companion.

2. **Step 8 (Generation)**: The AI is described as "creating your personal journey." The tutor is positioned as the intelligent engine behind the plan.

3. **Post-onboarding welcome**: When the user reaches the dashboard, a welcome message from the AI Tutor appears:
   - "Welcome, [Name]! I've created your study plan based on your preferences. Your goal of [Target Band] by [Date] is achievable. Let's start with today's mission."

4. **Future personalization**: The tutor style selection (Step 7) feeds into the AI Tutor prompt system. An encouraging user gets warmer, more supportive messages. A direct user gets concise, task-focused guidance.

---

## Accessibility Notes

- **Focus management**: When transitioning between steps, focus moves to the first interactive element of the new step (or the step title for screen readers)
- **Form labels**: Every input has an explicit `<label>`. Placeholder-only labels are avoided
- **Error announcements**: Inline errors use `aria-live="polite"` to announce changes
- **Skip link**: "Skip to step content" — visible on first tab press
- **Step indicator**: Each step is `aria-current="step"` for the current step. Completed steps have `aria-label="Step X: completed"`
- **Slider (Step 5)**: Uses `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`. Has visible value label
- **Card radios (Step 1, 7)**: Use `role="radio"` with `aria-checked`. Arrow key navigation between options
- **Band selector (Steps 2-3)**: Navigable via arrow keys. `aria-label` includes band description
- **Date picker (Step 4)**: Keyboard navigable (Tab, Arrow keys, Enter). `aria-label` for each day
- **Toggle pills (Step 6)**: `role="checkbox"` with `aria-checked`. Two labeled groups with `aria-labelledby`
- **Progress bar (Step 8)**: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Generating your study plan"`
- **Color**: Step indicator uses shape + text in addition to color. Selected states show a checkmark, not just a color change
- **Animation**: Step transitions respect `prefers-reduced-motion`. The generation animation (Step 8) has a static fallback
- **Touch targets**: All interactive elements minimum 44x44px on mobile
- **Heading order**: Title `<h1>` per step (single `<h1>` per page), step section `<h2>`
- **Error clarity**: Error messages explain what went wrong and how to fix it, not just "Invalid input"

---

## Components Needed

| Component | Usage | Variant |
|-----------|-------|---------|
| Button | Continue, Back, Skip, Try Again | primary (Continue), ghost (Back/Skip), sm (Skip in header) |
| Card | Step container, Language cards (Step 1), Tutor style cards (Step 7) | default, elevated, selected |
| Badge | Step indicator dots/numbers | primary (active), success (completed), neutral (upcoming) |
| Input | Generic text input (not needed for current steps, but for future name input) | default |
| Select | Not used in proposed design (replaced by visual pickers) | — |
| Date Picker | Step 4 — exam date selection | custom styled, with quick-select pills |
| Progress Bar | Step 8 — generation progress | animated, determinate |
| Progress Ring | Not needed in onboarding | — |
| Slider | Step 5 — study time per day | custom styled, with labeled anchors |
| Modal | Skip confirmation | sm, with action buttons |
| Toast | Welcome message after onboarding | success |
| Loading Skeleton | First-load state (minimal) | rect, shimmer |
| Empty State | Not applicable (input flow) | — |
| Error State | Step 8 generation failure | with retry + go-to-dashboard actions |
| Tabs | Not needed in onboarding | — |
| Badge | Skill chips (Step 6) | selectable, primary for weak, success for strong |
| Icon Button | Back navigation on mobile | ghost, with chevron-left icon |
| Mobile Bottom Navigation | Not needed in onboarding | — |
| Drawer | Not needed in onboarding (keep flow inline) | — |

---

## Data Displayed

| Element | Data Source | Notes |
|---------|-------------|-------|
| Current band | User input (Step 2) | Persisted to `AppSettings.currentBand` |
| Target band | User input (Step 3) | Persisted to `AppSettings.targetBand` |
| Band gap | Derived from Steps 2 & 3 | Target - Current. Displayed as visualization |
| Exam date | User input (Step 4) | Persisted to `AppSettings.examDate`. Optional |
| Study minutes/day | User input (Step 5) | Persisted to `AppSettings.dailyStudyMinutes` |
| Study days per week | Derived or input (future) | Current: Mon-Sun toggles. Proposed: slider or implied |
| Weak skills | User input (Step 6) | Persisted to `AppSettings.weakSkills[]` |
| Strong skills | User input (Step 6) | Proposed addition to `AppSettings` |
| Tutor style | User input (Step 7) | Proposed: encourage / direct / detailed |
| Preferred language | User input (Step 1) | Proposed: sets initial locale |
| IELTS type | Current Step 1 (Academic/General) | Persisted to `AppSettings` |
| Generation progress | Step 8 (UI only, simulated) | Determinate progress from 0-100% |
| Study topics | Current Step 2 options | Persisted to `AppSettings.preferredTopics` |

---

## Design Notes Inspired by the Reference

**"Personalized Learning App – UI Concept for Modern Education" by Anastasia Golovko:**

1. **Step-by-step with personality** — The reference uses a clean, card-based onboarding with avatars and friendly copy. IELTS Journey's onboarding should feel similarly conversational — each step asks one question with a supporting illustration, not a dense form.

2. **Progress as a visual stepper** — The reference shows clear step progress at the top. IELTS Journey should use numbered pills with checkmarks — compact enough for mobile but visible enough for orientation.

3. **Friendly character/tutor presence** — The reference includes a human or avatar element in the onboarding. IELTS Journey should introduce the AI Tutor character subtly throughout (small tutor icon in Step 7, celebration in Step 8).

4. **Card selection over dropdowns** — The reference uses tappable cards instead of `<select>` dropdowns. IELTS Journey's band selection, language selection, and tutor style should use card-style selectors — more visual, more engaging.

5. **Contextual statistics** — The reference shows real-time stats updates as users input data. IELTS Journey should show "X weeks until exam" when date is selected, "Y hours of study" when time is set — making data entry feel meaningful.

6. **Clean, generous spacing** — The reference uses lots of white space between elements. IELTS Journey's onboarding should not feel dense — each step is spacious with the input as the hero element.

7. **Soft color gradients** — The reference uses soft gradients for backgrounds and active states. Each onboarding step could have a subtle gradient shift (Step 1: soft blue, Step 3: soft green, Step 6: soft orange) to visually differentiate stages.

8. **Celebratory micro-interactions** — The reference uses subtle animations for completion. IELTS Journey should animate:
   - Checkmark on step completion
   - Band scale highlighting on selection
   - Countdown clock animation on date selection
   - Confetti or sparkle on generation complete (Step 8 → Dashboard redirect)

**What NOT to copy:**
- Do not copy the reference's color palette exactly — use IELTS Journey's theme tokens
- Do not copy the reference's educational content (IELTS Journey is exam-specific)
- Do not make the onboarding longer than 8 steps — the reference app may have a different scope
- Do not use heavy illustrations that increase page load time — use lightweight SVG or Lottie animations
- Do not hide the step count — users should always know how many steps remain

---

## Implementation Notes for Future

- **Step indicator component**: Extract a reusable `Stepper` component with horizontal and vertical variants. Used in onboarding and potentially in study plan wizard.
- **Band selector component**: A reusable band range selector (1.0-9.0 in 0.5 increments). Used in onboarding and potentially in settings/profile edit.
- **Tutor style selector**: Extract if settings page will also expose this selection.
- **Date picker**: Use or extend the existing date picker component with quick-select pills.
- **Generation progress overlay**: Could be reused for "Regenerate Plan" in study plan settings.
- **Animation system**: Define transition animations for step changes (slide left for forward, slide right for back). Respect `prefers-reduced-motion`.
- **Localization**: All onboarding text must be translatable. The language selection (Step 1) should dynamically switch UI locale immediately.
- **Data model changes needed**: Add `strongSkills`, `tutorStyle`, `preferredLanguage` to `AppSettings` type.
- **Storage**: Current implementation uses IndexedDB + localStorage. The redesign should keep the same storage approach but store new fields.
- **Onboarding completion**: The `completeOnboarding()` function needs to be updated to accept new fields and generate the study plan with tutor style preference included.
- **Post-onboarding flow**: After redirect to `/dashboard`, the dashboard should show a welcome state with AI Tutor greeting (based on selected tutor style). This requires dashboard changes in a future phase.
