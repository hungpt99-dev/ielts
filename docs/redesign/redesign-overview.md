# IELTS Journey — Redesign Overview

## Current UX/UI Problems

The current IELTS Journey website is functional but lacks the polish, motivation, and personality that a modern learning product needs. Key problems identified through codebase analysis:

### Visual & Aesthetic Problems
- **Utilitarian card design**: Cards use `rounded-xl`, `border`, and `shadow-sm` but feel generic — no visual hierarchy, soft shadows, or depth to guide the eye.
- **Dense data display**: The dashboard shows streak, band, weekly progress, and study hours in identical stat cards with no visual priority. Users cannot immediately find what matters.
- **Monochromatic information**: Skill progress cards use thin progress bars and subtle color tints. The difference between skills (reading, listening, writing, speaking) is visible but not celebratory.
- **No visual breathing room**: Spacing is consistent (`space-y-6`, `p-4 sm:p-6`) but content feels packed. Sections blend into each other without clear visual separation.
- **Inconsistent header treatment**: The dashboard hero has a gradient background (`--color-primary-light` to `--color-tutor-background`) but other pages use plain backgrounds with no hero or welcoming element.
- **Dark mode is functional, not crafted**: Dark tokens exist (in `packages/theme/src/tokens.ts`) but the experience feels like inverted light mode, not a thoughtfully designed dark environment.

### Navigation & Information Architecture Problems
- **Overloaded sidebar**: 17 nav items listed in a single sidebar (`Layout.tsx:32-52`), including secondary pages like "Public API", "Backup", "Info". This overwhelms users.
- **No prioritized navigation**: Dashboard, Study Plan, Vocabulary, and Practice skills sit alongside Backup, Public API, and Info at the same level.
- **Mobile bottom nav is incomplete**: Only 5 items (Home, Plan, Vocab, Review, Progress) in the bottom navigation, while the sidebar has 17. Critical pages like AI Tutor, Speaking, Writing are missing from mobile quick access.
- **Multiple review destinations**: `/review` (vocabulary review), `/review-center` (review center), and `/mistakes` (mistake notebook) create confusion about where to review.

### Onboarding Problems
- **Form-based, not experience-based**: The onboarding (`OnboardingForm.tsx:1`) is a multi-step HTML form with Select and Input components. It asks but does not excite.
- **No visual feedback**: Band selection, skill selection, and schedule picking are plain form controls. Users don't feel "wow, this app understands me" — they feel "I filled out another form."
- **No AI magic moment**: After completing onboarding, users are redirected to the dashboard. There is no "generating your personalized plan" moment that demonstrates AI value.

### Dashboard Problems
- **Static greeting**: "Good morning, IELTS Learner" (`Dashboard.tsx:201`) is generic. No user name, no personalization beyond data.
- **Today's Mission is buried**: The mission appears inside the hero gradient card, but the real estate is shared with stats, greeting, date, and badges. The most important question ("What should I study today?") is not the hero.
- **AI Tutor suggestion feels optional**: `aiSuggestion` from `useDashboard` hook is available but the AI recommendation is not a central UI element — it's a text line in the mission card.
- **Skill progress is computed, not measured**: `computeSkillProgress` (`Dashboard.tsx:51`) derives progress from session counts (each session = 20%), not from actual IELTS skill assessment. Users may not trust artificial progress numbers.
- **No exam countdown urgency**: The exam countdown badge changes color when <= 30 days, but there is no visual shift in the overall dashboard urgency or focus.

### Study Plan Problems
- **Task-oriented, not journey-oriented**: The study plan (`StudyPlan.tsx`) shows tasks, phases, and a calendar. It does not tell a story of progress toward the exam.
- **AI generation is hidden**: Plan generation appears in a modal with `generatedCount` and `generatingPhase` tracking, but there is no beautiful progress animation or preview experience.
- **No roadmap visualization**: Despite a `RoadmapPage` feature (`apps/web/src/features/roadmap/RoadmapPage.tsx`), the main study plan page does not show a visual roadmap from today to exam day.

### Vocabulary Problems
- **List-focused, not learning-focused**: The vocabulary feature (`Vocabulary.tsx`) presents words in lists and cards. There is no suggested review flow, no spaced repetition visualization, no "learn 5 words today" prompt.
- **Review feels disconnected**: Vocabulary Review (`VocabularyReview.tsx`) is a separate page, not integrated into the daily learning flow.

### AI Tutor Problems
- **Too many entry points**: FloatingTutorButton + ChatIcon + AI Tutor button in dashboard. Users may not understand the difference.
- **Chat-based, not tutor-based**: The AI Tutor (`AITutorChat.tsx`) is a chat interface. It feels like a chatbot, not a personal tutor. No avatar, no personality, no teaching moments.
- **Context awareness is text-only**: `ChatContext.ts` provides context-aware suggestions, but they appear as plain text suggestions rather than proactive tutor nudges.

### Landing Page Problems
- **Generic SaaS landing**: The landing page (`LandingPage.tsx`) follows a standard hero-features-cta pattern. It does not communicate the emotional benefit of a personal IELTS companion.
- **No demo or interactive preview**: `DashboardPreviewSection` shows a static preview. Users cannot feel what using the app is like.
- **Vietnamese orientation**: `LandingPage.tsx:23` default SEO title "IELTS Journey" is in English, but some content and the overall feel lean toward a Vietnamese audience. The product needs to feel global from the first impression.

### Extension Connection
- **No UI for extension sync**: The extension (`apps/extension/`) saves articles and vocabulary from the web, but the web app has no dedicated page showing extension connection status or synced content from the browser.

### Mobile Experience Problems
- **Bottom nav is an afterthought**: The mobile navigation is rendered below `<main>` in `Layout.tsx:171` as a separate `<nav>`. It is not integrated into the app shell.
- **No mobile-first layouts**: Pages use responsive grid utilities (`sm:grid-cols-2 lg:grid-cols-4`) but the layout is desktop-first with mobile as a breakpoint.
- **Touch targets**: Buttons use `px-3 py-1.5` on small sizes, which may not meet 44px minimum touch target on mobile.

### Global & Localization Problems
- **Vietnamese-centric defaults**: Some UI strings, default values, and date formatting assume Vietnamese users. `formatDate` uses `en-US` locale but the app does not support dynamic locale switching.
- **No language selector in UI**: There is no visible language switcher in the app header or settings.

---

## New Design Direction

### Soft
The redesign should feel visually gentle. Use soft shadows (`0 4px 20px rgba(0,0,0,0.06)`), rounded corners (`radius-xl` to `radius-3xl`), subtle gradients, and muted colors. Cards should appear to float gently rather than sit rigidly on the page.

### Clean
Remove visual noise. Each section should have one primary purpose. Navigation should be reduced to what matters most. Secondary actions should be hidden behind context menus or placed below the fold. Use ample white/negative space.

### Modern
Follow 2025-2026 design patterns: glassmorphism for overlays and cards, micro-animations for state changes, soft color grading, large typography for hierarchy, and generous use of whitespace. Reference the Dribbble concept's modern card-based layouts.

### Friendly
Use warm language, smiling/approachable illustration style (if illustrated), and encouraging microcopy. Error states should apologize and help, not blame. Empty states should encourage, not feel empty.

### Motivating
Every UI element should push the user toward their next action. Progress indicators should celebrate milestones. Streak should feel rewarding, not punishing. The dashboard should make users feel "I can do this today."

### Premium
Use refined typography, consistent spacing, and deliberate color choices. The app should feel like a paid learning product even though it is free. Avoid anything that looks "hobby project" — no harsh borders, no inconsistent alignment, no unexplained UI.

### Mobile-first
Design for mobile screens first, then expand to desktop. Bottom navigation should be the primary navigation. Cards should stack vertically on mobile and form grids on desktop. Touch targets must be at least 44px.

### Personal
Replace generic "IELTS Learner" with the user's actual name (or a friendly default like "Champion"). Show their target band, their weak skills, their exam date prominently. Every page should feel like it belongs to this specific user.

### Global
Remove all Vietnamese-first assumptions. Default language should be English. Date formats, number formats, and content should be locale-aware. The product name and tagline should work internationally.

### IELTS-focused
Every design decision should answer: "Does this help someone pass the IELTS exam?" If a UI element does not directly support exam preparation, it should be secondary or removed. The exam date, band score, and skill breakdown should be central.

---

## Product Feeling

The new IELTS Journey should feel like:

- **A personal IELTS tutor in your pocket** — not a study tool, but a study companion.
- **A daily learning ritual** — opening the app should feel like starting a productive habit, not doing homework.
- **A clear path to exam day** — every screen should communicate progress toward the target band.
- **A premium education app** — polished, intentional, and worthy of daily use.
- **A warm and encouraging space** — learning IELTS is stressful. The app should reduce anxiety, not add to it.

---

## Design Inspiration

**"Personalized Learning App – UI Concept for Modern Education" by Anastasia Golovko on Dribbble** provides the primary inspiration:

### What to take from the reference
- **Soft rounded cards** with subtle shadows and colored accents
- **Gradient hero sections** with gentle color transitions
- **Progress visualization** that feels organic and friendly (curved progress rings, soft bars)
- **Card-based learning dashboard** where each skill/task gets its own visual card
- **AI tutor integration** as a friendly, present character/button, not just a chat
- **Color-coded skills** with distinctive but harmonious palettes
- **Mobile-first card layouts** that stack vertically on small screens
- **Large typography hierarchy** with clear size jumps between title, subtitle, and body

### What NOT to copy
- Do not replicate exact layout or component placement
- Do not copy colors exactly — adapt to IELTS Journey's existing design token system (`packages/theme/src/tokens.ts`)
- Do not copy iconography — use IELTS-appropriate icons (book, microphone, ear, pencil, etc.)
- Do not copy the exact onboarding flow — IELTS Journey has unique requirements (band selection, exam date, etc.)
- The reference shows a generic education app — IELTS Journey is specifically for IELTS exam preparation, so all UI must serve that purpose
- Maintain IELTS Journey's existing dark mode support — the reference shows light mode only

### Visual Direction Summary
- Background: warm off-white (`#faf9f6` or similar) instead of cool gray (`#f8fafc`)
- Cards: white with soft shadow, rounded-2xl, subtle left border accent for skills
- AI Tutor: dedicated accent color (existing `--color-tutor-accent`) with a friendly floating presence
- Progress: circular rings for skills, horizontal bars for daily tasks, timeline for roadmap
- Typography: existing Inter/system font stack but with larger headings (up to `2.5rem` on desktop)
- Spacing: increase vertical rhythm — `space-y-8` for sections instead of `space-y-6`

---

## Before/After UX Goals

| Aspect | Before | After |
|---|---|---|
| First impression | "Another study app" | "This feels like my personal tutor" |
| Dashboard clarity | Data-dense with equal-weight stats | Clear visual hierarchy answering "What should I study today?" |
| Navigation | 17 items in sidebar, overwhelming | 6-8 priority items, context-sensitive |
| Onboarding | Form-based, transactional | Experience-based, exciting, personalized |
| Study plan | Task list with calendar | Visual roadmap from today to exam day |
| AI Tutor | Chatbot with floating button | Proactive tutor with contextual suggestions |
| Vocabulary | Static list of saved words | Spaced repetition learning system |
| Progress | Numbers and percentages | Visual celebrations and clear growth trajectory |
| Mobile experience | Squeezed desktop layout | Mobile-first with native-feeling interactions |
| Global readiness | Vietnamese-oriented defaults | English-first with full localization support |
| Dark mode | Inverted light colors | Crafted dark environment with proper contrast |

---

## Main Design Principles

1. **Progress is visible everywhere** — every screen should show some aspect of the user's journey toward their target band score.

2. **One primary action per screen** — every page should have one clear thing the user should do next. Secondary actions are available but not prominent.

3. **The exam date is the north star** — countdown, urgency, and phase progression should reference the exam date consistently.

4. **AI Tutor is a companion, not a feature** — the AI Tutor should be present, proactive, and personalized, not hidden behind a chat button.

5. **Data is beautiful** — progress, skill levels, and study statistics should be visualized in an appealing, glanceable way.

6. **Mobile-first, desktop-enhanced** — design for the smallest screen first, then add layout columns and sidebars for desktop.

7. **Empty states are opportunities** — instead of showing blank pages, use empty states to guide the user toward their first action.

8. **Mistakes are learning moments** — error states and mistake reviews should feel constructive, not punitive.

9. **Consistency over creativity** — use the theme token system consistently. Avoid one-off colors, radiuses, or spacing.

10. **Celebrate effort, not just results** — streaks, daily completions, and consistency should be visually rewarded alongside band progress.

---

## Target Users

### Primary: IELTS Self-Learners (Global)
- Age: 18–35
- Preparing for IELTS Academic or General Training
- Studying alone without a tutor or class
- Have 30–90 minutes per day for study
- Need structure and guidance
- English level: Intermediate to Upper-Intermediate (IELTS 4.5–6.5)
- Target band: 6.5–8.0
- Tech-savvy, uses mobile apps daily

### Secondary: IELTS Teachers & Tutors
- Age: 25–45
- Using the app to supplement their teaching
- Assigning study plans to students
- Monitoring student progress
- Need clear data and reporting

### Tertiary: IELTS Test Takers (Short-term)
- Have exam in 1–4 weeks
- Need intensive revision, not long-term learning
- Focused on mock tests, mistake review, and vocabulary cramming
- May not engage with the full study plan

---

## Global Product Direction

IELTS Journey serves learners worldwide. The redesign must reflect this:

- **Default language**: English (International)
- **Locale support**: Date/time/number formatting via user locale, not hardcoded `en-US`
- **Content neutrality**: Example sentences and vocabulary should not assume any specific cultural background (Vietnamese, Indian, Chinese, Arabic, etc.)
- **Right-to-left (RTL) readiness**: Design with `padding-inline-start/end` and logical properties where possible
- **IELTS variants**: Support both Academic and General Training clearly
- **No Vietnam-first assumptions**: Remove default Vietnamese content, Vietnamese-only example sentences, and culturally specific references
- **Localization infrastructure**: All user-facing strings should be externalized for future i18n

---

## Why the Current Website Feels Basic

1. **Design tokens exist but are not fully utilized** — the theme system (`packages/theme/src/tokens.ts`) defines beautiful tokens, but many pages use only basic colors, shadows, and radiuses. The tokens support a premium design that the UI does not deliver.

2. **No cohesive design system in practice** — while Button, Card, Badge, and other primitives exist, each page uses them without a consistent composition pattern. Some pages use bordered cards, others use shadow-only cards, others use no cards at all.

3. **Data-first, experience-second** — the priority has been on making the app work (data storage, AI integration, study plan logic) rather than making it feel good to use. The UX is functional but not delightful.

4. **No visual identity** — the app has no distinctive visual character. It could be any web app. The colors are generic blue (`#2563eb`), the cards are generic rounded rectangles, the typography is system default.

5. **Onboarding does not sell the experience** — the form-based onboarding gives no hint of the polished experience waiting inside. Users may not feel motivated to complete it.

6. **The AI Tutor is powerful but under-delivered** — the AI integration (`packages/ai-tutor/`, `packages/ai/`) is sophisticated, but the UI treats it as a side feature. The AI should be the star.

7. **Mobile experience is an afterthought** — the layout works on mobile but does not feel designed for mobile. No gesture support, no native-feeling interactions, no mobile-optimized touch targets.

8. **Too many features, not enough focus** — the sidebar includes Public API, Backup, and Info pages alongside core learning features. This dilutes the product identity.

9. **No emotional connection** — the app does not celebrate wins, encourage after failures, or build a relationship with the user.

10. **Dark mode is incomplete** — `DARK_TOKENS` in `packages/theme/src/tokens.ts:142` exist but some pages and components do not fully respect dark mode (e.g., hardcoded white backgrounds in some places).

---

## What the New Website Should Feel Like

### Emotional Response
- **"Finally, an app that understands my IELTS journey."** — The dashboard shows exactly what to study today.
- **"I can actually achieve my target band."** — The roadmap makes the path to exam day clear.
- **"My AI tutor knows me."** — Proactive suggestions reference the user's weak skills, saved vocabulary, and study history.
- **"This app is beautiful."** — Every screen is visually polished and intentional.
- **"I want to open this every day."** — Streaks, progress celebrations, and daily missions make the app a habit.

### Behavioral Changes
- Users open the app daily without reminders.
- Users trust the AI-generated study plan and follow it.
- Users save vocabulary while browsing the web (via extension) because the vocabulary notebook is delightful to review.
- Users feel confident walking into the IELTS exam because they have followed a clear, measurable path.
- Users recommend the app to friends because it feels premium and effective.

---

## Design Direction Summary

The redesign transforms IELTS Journey from a **functional study tool** into a **personal IELTS learning companion**. It retains all existing features (dashboard, study plan, vocabulary, AI tutor, practice, progress, settings) but presents them in a soft, modern, mobile-first UI that makes learners feel guided, motivated, and confident about their IELTS preparation.

The existing theme token system (`packages/theme/src/tokens.ts`) provides a strong foundation — the redesign will use these tokens more deliberately, adding visual hierarchy, emotional design, and mobile-native interactions on top of the existing infrastructure.
