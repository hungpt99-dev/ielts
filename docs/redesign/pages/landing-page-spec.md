# IELTS Journey — Landing Page Specification

## Page Purpose

The landing page is the public face of IELTS Journey. It serves as the primary conversion point — turning visitors into active learners. It must communicate the product's value proposition, build trust, and motivate users to begin their IELTS journey.

## User Goal

Visitors should understand within 5 seconds that IELTS Journey is a personal IELTS learning companion that provides a clear daily study roadmap. They should feel confident that this app will help them achieve their target band score without the guesswork of self-study.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/pages/LandingPage.tsx`, `HeroSection.tsx`, `FeatureSection.tsx`, `AITutorSection.tsx`, `DashboardPreviewSection.tsx`, `FinalCTASection.tsx`, `Footer.tsx`):

1. **Generic SaaS layout** — The page follows a standard hero-features-preview-cta-footer pattern. Nothing about it says "IELTS" or "personal tutor" within the first few seconds.

2. **No emotional hook** — The hero heading "Learn IELTS with a Clear Daily Roadmap" is functional but not emotionally compelling. It doesn't address the fear, anxiety, or aspiration of IELTS test-takers.

3. **Static preview image** — `DashboardPreviewSection` renders a fake dashboard with hardcoded data. It's a static mockup, not an interactive preview. Users cannot imagine themselves using the app.

4. **Weak visual hierarchy** — Sections stack vertically with equal visual weight. No clear distinction between primary message, supporting features, and call to action.

5. **Vietnamese orientation** — The default SEO title "IELTS Journey - Learn IELTS with a Clear Daily Roadmap" is in English, but the footer includes "Built for IELTS learners who want a clear daily study path" and the overall tone does not feel globally premium.

6. **No social proof** — No testimonials, user counts, or credibility indicators. The footer shows "Built by Phạm Thanh Hưng" (in the simpler landing) which creates a personal project feel rather than a global product.

7. **Feature section is skimmable but not memorable** — 9 features in a 3-column grid with identical card styling. No visual differentiation between core features and supplementary ones.

8. **AI Tutor section feels disconnected** — The AI Tutor is presented as one feature among many, not as the core differentiator. The section uses the same card layout as the features section.

9. **No mobile-first design** — The layout uses `sm:`, `lg:` breakpoints from a desktop-first approach. Mobile experience is a compressed version of desktop.

10. **CTA repetition without urgency** — "Start Your IELTS Journey" and "Start Learning" are similar CTAs in hero and final CTA section. No urgency, no "limited time" or "start free" angle.

11. **No demo or trial option** — There is no way for visitors to experience the app without committing to onboarding. No demo mode, no preview of what the dashboard looks like with their own data.

12. **Footer contains dead links** — Social links point to placeholder URLs (`https://example.com/donate`). "Contact the Creator" button links to `#contact` which doesn't exist.

---

## Proposed Layout

The redesigned landing page follows a narrative structure: Problem → Solution → How It Works → AI Magic → Social Proof → Final CTA. Each section builds on the previous one to create a compelling story.

```
┌──────────────────────────────────────────────────┐
│  HEADER (sticky, glass effect)                    │
│  [Logo] IELTS Journey         Features AI Tutor   │
│                                Dashboard [Start]  │
├──────────────────────────────────────────────────┤
│                                                   │
│  HERO                                              │
│  "Your personal IELTS tutor that plans            │
│   your study, every single day."                  │
│  Subhead: AI-powered daily study plans for        │
│  IELTS self-learners. No more guessing.           │
│                                                   │
│  [Start Your Journey] [See How It Works]          │
│                                                   │
│  ┌────────────── Dashboard Preview ─────────────┐ │
│  │  (animated/interactive preview of dashboard)  │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  PROBLEM (The IELTS Self-Study Problem)            │
│  "You're studying hard. But are you studying      │
│   the right thing?"                               │
│  - Too many resources, no structure               │
│  - Don't know what to study each day              │
│  - Can't track real progress                      │
│  - No feedback on mistakes                        │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  SOLUTION (How IELTS Journey Solves It)            │
│  Three-column: AI Roadmap, Daily Plan, Progress    │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  HOW IT WORKS (Visual Step-by-Step)                │
│  1. Set your goal (target band + exam date)        │
│  2. AI builds your roadmap (today → exam day)      │
│  3. Study daily (open app, see tasks, start)       │
│  4. Track progress (know when you're ready)        │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  AI TUTOR (The Star Feature)                       │
│  Full-width hero-like section with tutor           │
│  personality, capabilities, and live demo          │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  DASHBOARD PREVIEW (Interactive Mockup)             │
│  A more detailed preview showing real-looking      │
│  dashboard components: tasks, progress, vocab      │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  EXTENSION + MOBILE (Learn Anywhere)               │
│  Browser extension and PWA support                 │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  TESTIMONIALS / SOCIAL PROOF                       │
│  "Join 10,000+ IELTS learners using IELTS Journey" │
│                                                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  FINAL CTA                                         │
│  "Start your IELTS journey today."                 │
│  [Start Free] (no credit card required)            │
│                                                   │
├──────────────────────────────────────────────────┤
│  FOOTER                                            │
│  Product, Features, Resources, Legal               │
└──────────────────────────────────────────────────┘
```

---

## Main Sections

### 1. Header (Sticky Navigation)

**Purpose**: Provide navigation to sections, brand identity, and quick access to the primary CTA.

**Content**: Logo ("IELTS Journey" with a small compass/roadmap icon), nav links (Features, AI Tutor, Dashboard), [Get Started] button.

**Behavior**: Sticky at top with glass effect (`backdrop-filter: blur(12px)`). On mobile, hamburger menu opens full-screen overlay. Background shifts from transparent to glass on scroll.

**States**:
- Top of page: Fully transparent background, white text
- Scrolled: Glass background with border-bottom
- Mobile: Hamburger icon instead of full nav

**Components needed**: `Button` (lg, primary for CTA, ghost for nav), responsive hamburger menu.

### 2. Hero Section

**Purpose**: The emotional hook. Within 5 seconds, visitors should understand what IELTS Journey does and feel motivated to try it.

**Content**:
- **Tagline**: "Your Personal IELTS Tutor" or similar badge
- **Headline**: Bold, aspirational. Example: *"Your daily study plan, built by AI. Your IELTS goal, actually achievable."*
- **Subheadline**: Clear value proposition. Example: *"IELTS Journey creates a personalized daily study plan from today to your exam day. Open the app, see what to study, and learn with real content."*
- **Primary CTA**: "Start Your Journey" — large, prominent, pill-shaped button
- **Secondary CTA**: "Watch How It Works" — ghost/link button
- **Hero visual**: Animated/interactive preview of the dashboard showing today's tasks, or an illustrative hero graphic showing the concept of a guided learning path

**Design notes**:
- Large typography (`font.size.5xl` to `font.size.6xl` for headline)
- Soft gradient background (warm off-white `#faf9f6` to subtle primary blue tint)
- Decorative floating elements (abstract shapes, soft blobs) for visual interest
- The dashboard preview should feel alive — animated progress bars, simulated typing, gentle transitions
- On mobile, stack vertically: headline → subhead → CTAs → preview image

**Empty state**: Not applicable (always shown, no data dependency).

**Loading state**: Skeleton for preview if dynamically loaded (unlikely — static section).

**Error state**: Not applicable (static, no data fetching).

**Mobile layout**: Headline reduces to `font.size.4xl`. CTAs stack vertically. Preview image shrinks proportionally.

**Components needed**: `Button` (lg, primary + secondary), `Card` (elevated, for preview), `Badge` (for tagline).

### 3. Problem Section ("The IELTS Self-Study Problem")

**Purpose**: Acknowledge the visitor's pain points. This builds empathy and validates their frustration with unstructured self-study.

**Content**:
- **Headline**: "Studying for IELTS alone is hard."
- **Pain points** (3-4 cards):
  1. *"Too many resources"* — You've downloaded 10 apps, saved 50 websites, but still don't know what to study today.
  2. *"No structure"* — You study randomly — reading today, grammar tomorrow — without a clear progression.
  3. *"No feedback"* — You practice writing and speaking, but nobody tells you if you're improving.
  4. *"No progress visibility"* — You feel like you're studying, but you can't see if you're actually getting closer to your target band.

**Design notes**:
- Use muted/warm background to contrast with hero
- Cards with subtle danger/warning accents to evoke the pain
- Friendly, empathetic tone — not fear-mongering
- Each card has an icon and a short, punchy description

**Components needed**: `Card` (with icon + left accent).

### 4. Solution Section ("How IELTS Journey Helps")

**Purpose**: After acknowledging the pain, present the solution. Three-column layout showing the core transformation.

**Content**:
- **Headline**: "IELTS Journey gives you what's missing."
- **Three solution cards**:
  1. *"AI Study Roadmap"* — Set your target band and exam date. Our AI builds a day-by-day plan from today to exam day.
  2. *"Daily Learning Missions"* — Every morning, your dashboard shows exactly what to study. No planning, no deciding — just start.
  3. *"Visible Progress"* — See your estimated band score improve, track completed tasks, and know when you're ready for the exam.

**Design notes**:
- Opposite of Problem section — use success/green accents
- Cards should feel hopeful and clear
- Each card links to the corresponding app feature

**Components needed**: `Card` (elevated, with success accent), `Button` (ghost, "Learn more").

### 5. How It Works Section

**Purpose**: A simple, visual step-by-step explanation of what happens when a user signs up.

**Content**:
- **Headline**: "Start learning in 4 simple steps."
- **Steps** (horizontal timeline or numbered cards):
  1. **Set Your Goal** — Select your current level, target band, and exam date. (Icon: target/bullseye)
  2. **AI Builds Your Plan** — Our AI generates a complete study roadmap from today to exam day, with daily tasks. (Icon: sparkles/AI)
  3. **Study Daily** — Open the app, see today's mission, complete tasks. Reading, listening, writing, speaking, vocabulary, grammar — all in one place. (Icon: calendar check)
  4. **Track & Improve** — Watch your progress, review mistakes, and adjust your plan as you get closer to the exam. (Icon: chart up)

**Design notes**:
- Visual timeline or numbered card flow
- Each step has a large icon, short title, and 1-sentence description
- Connecting line or arrow between steps (hidden on mobile)
- On mobile, steps stack vertically with numbers

**Components needed**: `Card` (numbered), `Badge` (step numbers).

### 6. AI Tutor Section

**Purpose**: Position the AI Tutor as the core differentiator — not just a chatbot, but a real learning companion.

**Content**:
- **Section label**: "AI Tutor"
- **Headline**: "A personal AI tutor that actually knows you."
- **Subheadline**: "Not a generic chatbot. Your AI Tutor knows your target band, weak skills, saved vocabulary, and study history."
- **Capability cards** (3-4):
  1. *"Knows Your Journey"* — Remembers your target, progress, and mistakes
  2. *"Suggests Daily Focus"* — Recommends what to practice based on weak areas
  3. *"Explains Anything"* — Vocabulary, grammar, writing — ask and get clear answers
  4. *"Creates Exercises"* — Generates practice from your saved content
- **Visual**: A large chat preview showing an AI Tutor conversation with contextual recommendations (e.g., "I noticed you struggled with Writing Task 2 yesterday. Let's practice essay structure today.")

**Design notes**:
- Distinct visual identity — use tutor accent colors (sky blue/teal, `color.tutor.*` tokens)
- Chat preview should look like the real AI Tutor chat, not a generic image
- Consider a subtle animated avatar or icon for the tutor (sparkle + graduation cap)
- The preview should show the AI being proactive, not just reactive

**Components needed**: `AI Tutor Message Card`, `Card` (tutor variant), `Button` (tutor variant), `Badge`.

### 7. Dashboard Preview Section

**Purpose**: Show a realistic, detailed preview of the app's dashboard to help visitors imagine themselves using the product.

**Content**:
- **Headline**: "See what your dashboard looks like."
- **Subheadline**: "Everything you need — today's tasks, skill progress, vocabulary review, AI recommendations — in one beautiful screen."
- **Preview**: A more detailed and realistic version of the current `DashboardPreviewSection`. Should show:
  - Greeting + streak + exam countdown
  - Today's tasks (checklist)
  - Skill progress (4 skill cards)
  - AI recommendation
  - Quick stats (vocabulary count, completed tasks, study time)

**Design notes**:
- Use actual component layout that matches the redesigned dashboard spec
- Preview should be interactive enough to feel real (hover effects, but no real navigation)
- "Window frame" styling (as currently done) is good — keep the macOS traffic light dots
- On mobile, show the mobile version of the dashboard (with bottom navigation)

**Components needed**: `DashboardSection`, `SkillCard`, `StudyTaskCard`, `ProgressSummaryCard`, `AI Tutor Recommendation Card`, `Badge`.

### 8. Browser Extension Section

**Purpose**: Introduce the browser extension as a unique value proposition — learning from real web content.

**Content**:
- **Headline**: "Learn from the real internet."
- **Subheadline**: "Save vocabulary, articles, and text from any website. Turn real content into IELTS study material."
- **Key points**:
  - Highlight words on any webpage and save to vocabulary
  - Save articles to read and practice with later
  - AI explains selected text in IELTS context
  - Auto-highlight previously saved words while browsing
- **Visual**: Browser mockup showing the extension in action — a floating action menu on selected text

**Design notes**:
- Browser frame mockup with the extension popup visible
- Show the "From web" source label on vocabulary items
- Extension macOS-style chrome frame

**Components needed**: `Card`, `Button`, `Extension Action Menu` concept visualization.

### 9. Mobile / PWA Section

**Purpose**: Communicate that IELTS Journey works on mobile devices (PWA), so users can study anywhere.

**Content**:
- **Headline**: "Your study plan, in your pocket."
- **Key points**:
  - Install as a PWA — no app store needed
  - Works offline — study without internet
  - Mobile-first design — native feel on any device
  - Sync across devices via browser
- **Visual**: Phone mockup showing the mobile dashboard with bottom navigation

**Design notes**:
- Phone frame mockup with the app running inside
- Show the bottom navigation bar (Home, Plan, AI, Vocab, Progress)
- On desktop, this section sits next to the extension section or below it

**Components needed**: `Card`, `Button`, `Badge`.

### 10. Social Proof / Testimonials Section

**Purpose**: Build trust through social proof. Show that real learners use and benefit from IELTS Journey.

**Content** (future — data-dependent):
- **Headline**: "Join 10,000+ IELTS learners."
- **Stats row**: Users count, study plans generated, vocabulary words saved, practice sessions completed
- **Testimonial cards** (2-3): Avatar, name, country, quote, target/achieved band
- **Trust badges**: "Free", "Open Source", "Privacy First", "No Account Required"

**Design notes**:
- Use real data if available (from analytics or database)
- If no real data yet, design the section to gracefully handle empty state
- Testimonials should feel genuine, not stock photos
- Trust badges at the bottom

**Empty state**: If no testimonials or stats available, show a simplified version with trust badges only and "Join the first wave of IELTS Journey learners" message.

**Components needed**: `Card` (testimonial), `Badge` (trust).

### 11. Final CTA Section

**Purpose**: The final conversion point. Clear, urgent, and risk-free.

**Content**:
- **Headline**: "Start your IELTS journey today."
- **Subheadline**: "No account required. No credit card. Your data stays in your browser."
- **Primary CTA**: "Start Learning Free" (large, prominent)
- **Secondary link**: "Explore the features"
- **Trust signals**: "100% Free · Open Source · Privacy First · Works Offline"

**Design notes**:
- Full-width section with gradient or colored background
- Large typography, centered
- The CTA button should be the most prominent element on the page
- Trust signals listed as small pills/badges below the CTA

**Components needed**: `Button` (lg, primary, full-width on mobile), `Badge` (trust).

### 12. Footer

**Purpose**: Provide supplementary navigation, legal links, and social proof.

**Content**:
- **Column 1**: Brand + description + social icons (GitHub, Contact, Support)
- **Column 2**: Product links (Features, AI Tutor, Dashboard, FAQ)
- **Column 3**: Resources (Blog, Extension, API, Documentation)
- **Column 4**: Legal (Privacy, Terms, Contact, About)
- **Bottom bar**: Copyright + "Built for IELTS learners worldwide"

**Design notes**:
- Clean, minimal, with section dividers
- Social icons should link to real pages (fix dead links from current implementation)
- Language selector (future): small dropdown in the bottom bar
- Dark mode footer respects theme tokens

**Components needed**: Link list, Icon Button (social), `Badge`.

---

## Primary Actions

| Action | Location | Type |
|--------|----------|------|
| Start Journey | Hero, Final CTA, Header | Primary CTA → `/onboarding` |
| See Features | Hero secondary, Header nav | Scroll to `#features` |
| Learn About AI Tutor | AI Tutor section link | Scroll to `#ai-tutor` or `/tutor` demo |
| View Dashboard Preview | Dashboard section | Scroll to `#dashboard-preview` |
| Install Extension | Extension section | Link to extension store page |
| Try as PWA | Mobile section | Info about PWA installation |

## Secondary Actions

| Action | Location | Type |
|--------|----------|------|
| Explore Features | Feature section cards | Scroll to section |
| Watch How It Works | Hero secondary | Video modal or animation |
| View on GitHub | Footer | External link |
| Contact | Footer | Email link |
| FAQ | Footer | Scroll or separate page |

---

## Empty State

The landing page is always fully populated (static content). Empty states only apply to dynamic data sections:

- **Testimonials section**: If no testimonials data available, show a simplified trust section with key stats and a "Be among the first" callout.
- **Stats counters**: If real numbers aren't available, remove counters and show a simpler version with descriptive text only.

---

## Loading State

The landing page is primarily static. Loading states apply to:

- **Hero preview image**: Show a skeleton frame matching the preview dimensions while the preview graphic loads.
- **Analytics counters** (if dynamically loaded): Show number skeleton with shimmer.
- **Font loading**: Use `font-display: swap` to prevent invisible text during font load.

---

## Error State

Errors on the landing page are unlikely (static content). Handle edge cases:

- **Preview image load failure**: Show a descriptive fallback (text description of the dashboard).
- **External resource failure** (social feed, GitHub stars): Gracefully hide the failed component; show remaining content.
- **Analytics failure**: Hides the dynamic counters; static content remains visible.

---

## Mobile Layout

The mobile layout follows a single-column vertical stack. Key adaptations:

- **Header**: Logo + hamburger menu. Full-screen overlay nav on toggle.
- **Hero**: Headline (`font.size.4xl`) + subhead + stacked CTAs. Preview image below, full-width.
- **Feature sections**: Single column. Cards stack vertically with reduced padding.
- **How It Works**: Vertical numbered steps with connecting lines. Steps are full-width.
- **AI Tutor**: Chat preview scales to full width with smaller font.
- **Dashboard Preview**: Full-width frame, scaled-down content inside.
- **Extension**: Browser mockup at full width, text below.
- **Mobile/PWA**: Phone mockup centered, text below.
- **Testimonials**: Single card, horizontally scrollable if multiple.
- **Final CTA**: Full-width padding, CTA button is full-width.
- **Footer**: Single column, sections stack.

## Responsive Behavior

| Breakpoint | Layout | Navigation |
|------------|--------|------------|
| < 640px (mobile) | Single column, stacked | Hamburger menu |
| 640-1023px (tablet) | 2-column grids for feature cards | Hamburger or inline nav |
| 1024-1279px (desktop) | Multi-column, 3-col feature grid | Full inline nav in header |
| 1280px+ (wide desktop) | Max-width 6xl container, centered | Full inline nav |

---

## AI Tutor Integration

The landing page introduces the AI Tutor as the product's star feature:

- **Dedicated section**: Full-width AI Tutor section (currently exists as `AITutorSection.tsx`, needs redesign)
- **Chat preview**: Shows the AI Tutor interface with a contextual conversation example
- **Proactive demonstration**: The preview should show the AI being *proactive* — e.g., "Good morning! I noticed you struggled with Listening Section 3 yesterday. Let's practice similar questions today."
- **Distinct styling**: Use tutor accent colors (`color.tutor.*`) to create visual separation from the rest of the landing page
- **CTA to try**: "Try AI Tutor" button that scrolls to the signup flow or opens a demo

---

## Accessibility Notes

- **Skip link**: First focusable element — "Skip to main content" (already present)
- **Semantic HTML**: Use `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>` with proper `aria-label`
- **Heading hierarchy**: Single `<h1>` in hero, `<h2>` for each section, `<h3>` for cards
- **Color contrast**: All text meets WCAG AA (4.5:1 ratio). Section backgrounds with text overlay use sufficient contrast
- **Focus states**: Visible focus ring on all interactive elements (buttons, links, nav items)
- **Keyboard navigation**: All sections reachable via tab. Smooth scroll with `scroll-behavior: smooth`
- **Screen readers**: Decorative images have `aria-hidden="true"` and `role="presentation"`. Preview sections have descriptive `aria-label` or `aria-describedby`
- **Motion**: Animations respect `prefers-reduced-motion`. No auto-playing video without user consent
- **Touch targets**: All buttons and links have minimum 44px touch target on mobile

---

## Components Needed

| Component | Usage | Variant |
|-----------|-------|---------|
| Button | Hero CTAs, section CTAs, header CTA | lg, primary + secondary |
| Icon Button | Social media links, hamburger menu | ghost, sm |
| Card | Feature cards, solution cards, pain point cards | default, elevated |
| Badge | Tagline, trust signals, step numbers | primary, success, info |
| Input | Newsletter/email capture (future) | lg |
| Modal | Video "How It Works" (future) | lg |
| Loading Skeleton | Preview image loading | rect |
| Progress Ring | Dashboard preview stats | primary |
| Skill Card | Dashboard preview skill cards | listening, reading, writing, speaking |
| Study Task Card | Dashboard preview task list | pending, completed |
| AI Tutor Message Card | AI Tutor chat preview | tutor |
| AI Tutor Recommendation Card | Dashboard preview AI recommendation | default |

---

## Data Displayed

The landing page primarily displays static/marketing content. Dynamic data (future):

| Element | Data Source | Display |
|---------|-------------|---------|
| User count | Analytics / Database | "10,000+ learners" |
| Study plans generated | Analytics | "50,000+ plans created" |
| Vocabulary words saved | Analytics | "250,000+ words saved" |
| Testimonials | CMS / Database | User quotes with avatars |
| GitHub stars | GitHub API | Star count in footer |

---

## Design Notes Inspired by the Reference

**"Personalized Learning App – UI Concept for Modern Education" by Anastasia Golovko:**

1. **Hero with personality** — The reference uses a gradient hero with a friendly illustration and clear value prop. IELTS Journey's hero should feel similarly warm and welcoming, using gradient backgrounds and soft decorative elements (abstract circles, blobs).

2. **Card-based features with icons** — The reference shows features in rounded cards with colored icon circles. The current `FeatureSection` already does this but can be refined with softer shadows (`shadow.card`), larger border radius (`radius.xl`), and more consistent icon styling.

3. **AI integration as a visual element** — In the reference, the AI/personalization aspect is visually prominent. IELTS Journey's AI Tutor section should be similarly prominent — using tutor accent colors, chat previews, and a sense of "intelligent companion."

4. **Progress visualization** — The reference uses ring progress and clean stats. The landing page preview should show similar progress indicators — clean, colorful, and encouraging.

5. **Mobile-first card layout** — The reference designs for mobile first. IELTS Journey's landing page should feel natural on mobile with stacked cards, full-width CTAs, and touch-friendly spacing.

6. **Soft, warm palette** — The reference uses warm neutrals and gentle colors. IELTS Journey should shift from cool gray (`#f8fafc`) to warm off-white (`#faf9f6`) for a more inviting feel.

7. **Spacious typography** — The reference uses large, clear typography with generous line height. IELTS Journey's landing page should increase vertical rhythm (`space-y-8` sections, larger hero text) for a premium feel.

8. **No feature overload** — The reference shows a focused set of capabilities. IELTS Journey's landing page should not try to show all 9 features equally — prioritize the top 3-4 value props and nest details under "See All Features."

**What NOT to copy:**
- Do not copy the exact illustration style — IELTS Journey is for IELTS exam prep, not generic education
- Do not copy the exact color palette — adapt to IELTS Journey's existing token system
- Do not copy the onboarding or dashboard layout — the reference shows a different app flow
- Maintain dark mode support — the reference shows light mode only
- Keep IELTS-specific context (band scores, exam date, skill types) — the reference is for general learning

---

## Implementation Notes for Future

- **Static sections** (Hero, Problem, Solution, How It Works, Final CTA): Pure React components with no data dependencies. Can be implemented first.
- **Dynamic sections** (Testimonials, Stats): Require data hooks or CMS integration. Implement as static placeholder first, add dynamic data later.
- **Dashboard preview**: Should match the actual dashboard component layout (future redesign). Build as a standalone preview component that can be updated when the dashboard changes.
- **AI Tutor preview**: Should match the actual AI Tutor chat component. Consider extracting a reusable `ChatPreview` component.
- **Browser extension section**: Coordinate with the extension implementation (`apps/extension/`) for accurate mockups.
- **Mobile/PWA section**: Reference the PWA manifest and service worker implementation for accurate description.

The landing page should be implemented after the theme token system is finalized, as it relies heavily on `color.*`, `shadow.*`, `radius.*`, and `font.*` tokens.
