# IELTS Journey — AI Tutor Chat Page Specification

## Page Purpose

The AI Tutor page is the central interface for interacting with the AI-powered IELTS tutor. It serves as a personalized learning companion that answers questions, provides explanations, corrects writing, practices speaking, teaches vocabulary and grammar, and offers proactive guidance. The AI Tutor should feel like a real IELTS tutor — not a generic chatbot — with personality, context awareness, and teaching capability across all 11 assistant modes.

Two surfaces exist: the **full AI Tutor page** (`/tutor`) for immersive sessions, and a **floating chat popup** accessible from any page for quick questions and contextual help.

---

## User Goal

Users should feel, within seconds of opening the AI Tutor:

- **Guided** — The tutor understands their IELTS goal, current level, and weak skills
- **Capable** — The tutor can explain, correct, practice, and teach across all skills
- **Context-aware** — The tutor knows what the user was studying and references it naturally
- **Proactive** — The tutor suggests useful actions without being asked
- **Human** — Personality, encouragement, and teaching style make it feel like a real tutor

The AI Tutor should not feel like a search engine or a command-line. It should feel like a dedicated tutor who knows the user's IELTS journey.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/pages/AITutorChat.tsx:1-2916`, `packages/ai-tutor/src/components/ChatWidget.tsx:1-524`, `apps/web/src/features/ai-tutor/AITutorChat.tsx:1-166`):

1. **No dedicated route** — The full-page `AITutorChat` component exists (2916 lines) with all 11 modes but is not connected to any route. The floating popup is the only accessible surface.

2. **Chatbot feel, not tutor feel** — The floating popup (`ChatWidget`) looks and behaves like a standard chat widget (header + messages + input). No tutor avatar, personality, or teaching moments differentiate it from any generic AI chatbot.

3. **Monolithic full-page component** — The full-page tutor (`pages/AITutorChat.tsx`) is 2916 lines of inline state management, topic detection, and teaching flows. It is difficult to maintain, extend, or redesign without significant refactoring.

4. **Dual codebases create inconsistency** — The floating popup (`@ielts/ai-tutor` package) and full-page (`pages/AITutorChat.tsx`) are independent implementations with their own message types, storage, and styling. UX behavior differs between the two.

5. **Mode switching is buried** — Mode selection (`ModeSelector.tsx`) opens in a grid overlay from the header. Users may not discover or switch modes easily. The default mode is always the same.

6. **No teaching moments** — The AI responds to questions but does not proactively teach. For example, after answering a vocabulary question, the tutor does not offer a follow-up exercise or suggest related words to learn.

7. **Context awareness is invisible** — The `ContextManager` and `MemoryService` maintain rich context about the user's weak points and study history, but this context is not surfaced to the user. Users do not know the tutor "remembers" them.

8. **Proactive messages feel like notifications** — Proactive messages (`ProactiveMessagePreview`) appear above the chat input but look like notification banners, not like a tutor proactively engaging the user.

9. **Writing/Speaking integration is separate** — The `WritingTutor` (1207 lines) and `SpeakingPartner` components exist alongside the main AITutorChat but are launched from separate flows. The chat experience does not seamlessly transition into a writing correction or speaking practice session.

10. **No visual personality** — The tutor has no avatar, no name, no consistent visual identity across the app. The `TutorAvatar` component exists but is not prominent.

11. **Suggested prompts are hidden** — Quick actions appear as a horizontal scrollable row of small chips below the chat. Users may not notice or use them. No prompts are suggested based on the current conversation context.

12. **No full-page to popup continuity** — If a user is having a conversation on the full page and navigates away, the floating popup does not continue the same session. Sessions are tied to the surface they were started on.

13. **Scroll behavior on mobile** — The floating popup on mobile takes full viewport. Chat messages scroll behind the input area on some screen sizes. Keyboard handling during input is not optimized.

14. **No voice input** — The AI Tutor supports speaking practice but does not support voice-to-text for general chat input, which would be valuable for speaking practice mode.

15. **Save actions are hidden** — The ability to save AI answers as notes, vocabulary, grammar, or exercises (`AITutorChat.tsx:1726-1759`) is available but not surfaced as inline actions beneath AI messages.

---

## Proposed Layout

### Full AI Tutor Page (`/tutor`)

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌────────────────────────────────────────────────┐ │
│  │  Modes   │  │                  Chat Area                    │ │
│  │  Panel   │  │                                                │ │
│  │          │  │  ┌──────────────────────────────────────────┐ │ │
│  │  ◆ IELTS │  │  │            AI Tutor Header              │ │ │
│  │    Tutor │  │  │  [Tutor Avatar] IELTS Tutor · mode name │ │ │
│  │          │  │  │  "Your personal IELTS guide"            │ │ │
│  │  ○ Speak │  │  └──────────────────────────────────────────┘ │ │
│  │  ○ Write │  │                                                │ │
│  │  ○ Gram  │  │  ┌──────────────────────────────────────────┐ │ │
│  │  ○ Vocab │  │  │        Welcome / Empty State             │ │ │
│  │  ○ Read  │  │  │  [Tutor illustration]                    │ │ │
│  │  ○ Listen│  │  │  "Hi, I'm your IELTS Tutor! How can I    │ │ │
│  │  ○ Study │  │  │   help you today?"                       │ │ │
│  │  ○ Motiv │  │  │  Suggested: [Quiz me] [Check my writing] │ │ │
│  │  ○ Socra │  │  │            [Explain vocabulary]          │ │ │
│  │  ○ Chat  │  │  └──────────────────────────────────────────┘ │ │
│  │          │  │                                                │ │
│  │          │  │  ┌──────────────────────────────────────────┐ │ │
│  │          │  │  │  Proactive Tutor Message                 │ │ │
│  │          │  │  │  "I noticed your Writing task 2 score   │ │ │
│  │          │  │  │   dropped. Want to practice? →"          │ │ │
│  │          │  │  └──────────────────────────────────────────┘ │ │
│  │          │  │                                                │ │
│  │          │  │  ┌──────────────────────────────────────────┐ │ │
│  │          │  │  │  [Assistant] Hello, Alex! Ready for your  │ │ │
│  │          │  │  │  today's Reading practice? I found a      │ │ │
│  │          │  │  │  great passage on climate change.          │ │ │
│  │          │  │  │                        [Save note] [⋯]   │ │ │
│  │          │  │  └──────────────────────────────────────────┘ │ │
│  │          │  │                                                │ │
│  │          │  │  ┌──────────────────────────────────────────┐ │ │
│  │          │  │  │  [User] Can you explain the word         │ │ │
│  │          │  │  │  "mitigate" with IELTS examples?          │ │ │
│  │          │  │  └──────────────────────────────────────────┘ │ │
│  │          │  │                                                │ │
│  │          │  │  ┌──────────────────────────────────────────┐ │ │
│  │          │  │  │  [Assistant] Great question! "Mitigate"  │ │ │
│  │          │  │  │  means to make less severe.              │ │ │
│  │          │  │  │  IELTS example: "Governments should      │ │ │
│  │          │  │  │  implement policies to mitigate climate  │ │ │
│  │          │  │  │  change."                                │ │ │
│  │          │  │  │  [Save word]  [More examples]  [Quiz me] │ │ │
│  │          │  │  └──────────────────────────────────────────┘ │ │
│  │          │  │                                                │ │
│  │          │  │  ┌──────────────────────────────────────────┐ │ │
│  │          │  │  │  Context Suggestions                       │ │ │
│  │          │  │  │  [Continue writing correction]            │ │ │
│  │          │  │  │  [Review vocabulary from today's plan]    │ │ │
│  │          │  │  └──────────────────────────────────────────┘ │ │
│  │          │  │                                                │ │
│  │          │  │  ┌──────────────────────────────────────────┐ │ │
│  │          │  │  │  Quick Prompts                            │ │ │
│  │          │  │  │  [Teach me] [Quiz me] [Explain simply]   │ │ │
│  │          │  │  │  [Give examples] [Practice with me]      │ │ │
│  │          │  │  └──────────────────────────────────────────┘ │ │
│  │          │  │                                                │ │
│  │          │  │  ┌──────────────────────────────────────────┐ │ │
│  │          │  │  │  Chat Input                              │ │ │
│  │          │  │  │  ┌────────────────────────────────┐ [🎤] │ │ │
│  │          │  │  │  │  Type your message...          │ [📎] │ │ │
│  │          │  │  │  └────────────────────────────────┘ [➤]  │ │ │
│  │          │  └──────────────────────────────────────────┘ │ │
│  └─────────┘  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Floating Chat Popup

```
┌─────────────────────────────┐
│  [Tutor Avatar] IELTS Tutor  [🔔] [×] │
│  "Your personal IELTS guide" │
├─────────────────────────────┤
│                             │
│  Proactive message banner   │
│                             │
│  ┌───────────────────────┐  │
│  │ Assistant message     │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ User message           │  │
│  └───────────────────────┘  │
│                             │
│  Context suggestion card    │
│                             │
│  Quick prompts row          │
│  [Teach] [Quiz] [Explain]   │
│                             │
├─────────────────────────────┤
│  ┌─────────────────────┐ ➤ │
│  │ Type a message...   │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
  Position: fixed bottom-right
  Desktop: 380px × 560px
  Mobile: 100vw × 100dvh
  Z-index: 9999
```

---

## Main Sections

### 1. Mode Selection Panel (Full Page Only)

**Purpose:** Allow users to switch between the 11 assistant modes to context-shift the AI Tutor's behavior.

**Content:**
- Vertical list or grid of mode buttons on the left side (collapsible on mobile)
- Each mode shows: icon (skill-colored), name, short description
- Active mode highlighted with `--color-primary` accent and subtle background
- Mode icons: friendly-chat (💬), ielts-tutor (🎓), speaking-partner (🎤), writing-coach (✍️), grammar-teacher (📚), vocabulary-coach (📖), reading-explainer (📄), listening-coach (🎧), study-planner (📅), motivation-coach (🔥), socratic-tutor (❓)

**States:**
- Default: Selects `ielts-tutor` mode for new users
- Active mode changes the header label, tutor greeting, and suggested prompts to match the mode
- Mode switch resets the conversation context to the new mode but preserves history

**Mobile behavior:**
- Mode panel becomes a horizontal scrollable strip at the top, or a slide-out drawer triggered by a mode name chip in the header

### 2. AI Tutor Header

**Purpose:** Establish the tutor's identity and convey current mode context.

**Content:**
- Tutor avatar (circular, with `--color-tutor-accent` glow/border, showing a friendly AI illustration or letter "AI")
- Tutor name: "IELTS Tutor" (or user-customizable name)
- Current mode label with mode-specific icon
- Subtitle: "Your personal IELTS guide" or mode-specific tagline
- Notification bell (🔔): shows unread proactive message count, opens notification center
- Action buttons (full page): [Clear conversation] [View history] [Settings]
- Action buttons (popup): Close (×) collapses popup back to FAB

**States:**
- Typing: subtle pulse animation on avatar
- Speaking mode: microphone indicator on avatar
- Error: neutral expression on avatar (no change, just continue)

### 3. Welcome / Empty State

**Purpose:** Guide new users to start their first conversation with confidence.

**Content (full page):**
- Larger tutor illustration or avatar (friendly, approachable)
- Personalized greeting: "Hi, [Name]! I'm your IELTS Tutor. How can I help you today?"
- Mode-specific welcome message (e.g., "I'll help you practice IELTS Speaking Part 2" in speaking mode)
- Suggested starter prompts as clickable chips (3-4 prominent ones):
  - "Quiz me on vocabulary"
  - "Check my writing"
  - "Explain IELTS Reading tips"
  - "Create a study plan for this week"
  - Mode-specific first prompts

**Content (popup mini):**
- Compact version: smaller avatar, 1-line greeting, 2-3 suggested prompt chips

### 4. Chat Messages Area

**Purpose:** Display the conversation flow between user and AI Tutor.

**Message types:**

| Type | Role | Visual Style |
|------|------|-------------|
| User message | user | Right-aligned, `--color-primary` bg, `--color-on-primary` text, rounded-2xl with `border-bottom-right-radius: 4px` |
| Assistant message | assistant | Left-aligned, `--color-surface-alt` bg, `--color-text` text, rounded-2xl with `border-bottom-left-radius: 4px`, optional tutor avatar beside message |
| System message | system | Centered, muted text, small font, divider lines (e.g., "Mode changed to Speaking Partner") |
| Typing indicator | — | Three animated dots with bounce animation, shown while AI is generating |

**Message content types (within assistant messages):**

- **Text response**: Standard markdown-rendered text (bold, italic, lists, code for IELTS examples)
- **Vocabulary card**: Inline card showing word, definition, example, pronunciation button, [Save] action
- **Grammar explanation**: Card with rule, examples, and [Practice exercise] action
- **Writing correction**: Shows original text with corrections highlighted (diff-style), band estimate, and suggestions
- **Speaking feedback**: Shows transcript, fluency score, pronunciation notes, and suggestions
- **Exercise**: Interactive fill-in-the-blank or multiple-choice question with inline answer checking
- **Study plan**: Card showing generated plan summary with [View full plan] action
- **Progress review**: Card showing period summary with strengths, weaknesses, and recommendations
- **Recommendation card**: Proactive suggestion with [Apply] [Dismiss] [Snooze] actions

**Each assistant message has an action bar:**

| Action | Icon | Behavior |
|--------|------|----------|
| Save as note | 📝 | Saves message content as a note in `savedAiNotes` |
| Save vocabulary | 📖 | Shows if message contains vocabulary; saves selected words |
| Copy | 📋 | Copies message text to clipboard |
| Rate feedback | 👍👎 | User rating for quality (trains future responses) |
| More (⋯) | ⋯ | Additional options: share, report, regenerate |

**States:**
- Streaming: Text appears character by character with cursor blink animation (optional, based on AI response speed)
- Long message: Collapsible with "Show more" / "Show less" for messages over 500 characters
- Code/example block: Syntax-highlighted block with copy button
- Error message: Distinct style with error icon and retry button

### 5. Proactive Tutor Messages

**Purpose:** The AI Tutor proactively engages the user with contextual suggestions without waiting for a question.

**Types (from `packages/ai-tutor/src/services/`):**

| Trigger | Example Message | Priority |
|---------|----------------|----------|
| `due_review` | "You have 8 vocabulary words due for review. Want to quiz yourself?" | High |
| `missed_task` | "You missed yesterday's Writing task. Want to catch up now?" | High |
| `weak_skill` | "Your Listening score dropped to 5.5. I recommend 3 focused practices." | Medium |
| `streak_milestone` | "Amazing! You've studied for 7 days in a row. Ready to make it 8?" | Medium |
| `exam_approaching` | "Your exam is 14 days away. Let's focus on your weakest areas." | High |
| `new_content` | "I found a great Reading passage about Technology. Want to try it?" | Low |
| `achievement` | "You completed 10 Writing tasks! You're improving steadily." | Medium |

**Visual treatment:**
- Appears between messages (or above the chat input area)
- Distinct card background: `--color-tutor-background` with `--color-tutor-border` border
- Tutor avatar thumbnail on the left
- Title (bold), message text, and action buttons
- Dismiss (×) and Snooze (clock icon) options
- Animation: slides in from top with gentle fade

**Behavior:**
- High-priority messages: Show immediately, may interrupt current flow with gentle nudge
- Medium priority: Show after current message completes or at idle
- Low priority: Show at session start or when user appears to be waiting
- User can dismiss, snooze (1h / 4h / tomorrow), or accept the suggestion
- Accepted suggestions trigger navigation or context injection

### 6. Context Suggestions

**Purpose:** Surface relevant past context so the AI Tutor feels like it remembers the user.

**Content:**
- Cards or chips showing contextual links based on:
  - Current study plan tasks
  - Recently viewed vocabulary words
  - Last practice session results
  - Saved mistakes
  - Ongoing writing/speaking session
- Examples:
  - "Continue your Writing Task 2 correction"
  - "Review vocabulary from today's Reading passage"
  - "Practice the grammar point you missed yesterday"

**Behavior:**
- Appear after a few seconds of inactivity in the chat
- Disappear when user starts typing
- Clicking sets the conversation context: opens a pre-filled message like "Let's continue with my Writing Task 2"

### 7. Quick Prompts Row

**Purpose:** Provide one-tap starting points for common learning actions.

**Content:**
- Horizontal scrollable chips (8 quick actions from current implementation):
  - [Teach me] — "Please teach me something new about [current topic]"
  - [Quiz me] — "Test me with a quick quiz question"
  - [Correct English] — "Check my English and correct mistakes gently"
  - [Explain simply] — "Explain this in a simpler way"
  - [Give examples] — "Give me more IELTS examples"
  - [Make exercise] — "Turn this into a small exercise"
  - [Remind later] — "Remind me to review this later"
  - [Practice with me] — "Let's practice this together"

**Contextual adaption:**
- In `writing-coach` mode: [Check my essay] [Help me outline] [Estimate band]
- In `speaking-partner` mode: [Part 1 practice] [Part 2 practice] [Part 3 practice]
- In `vocabulary-coach` mode: [Teach new words] [Test me] [Topic list]
- In `grammar-teacher` mode: [Explain tense] [Fix my sentence] [Exercises]

**Behavior:**
- Tapping a chip sends the corresponding prompt as a user message
- Chips reorder based on usage frequency
- "More" expandable row reveals additional prompts

### 8. Chat Input Area

**Purpose:** Primary input for asking questions and interacting with the AI Tutor.

**Content:**
- Text input: auto-resizing textarea (1-4 lines), placeholder changes per mode
- Send button (→): primary color, disabled when input is empty
- Voice input button (🎤, future): starts speech-to-text (particularly useful in `speaking-partner` mode)
- Attachment button (📎): future — attach images, documents, audio recordings for AI analysis
- Character count or token estimate (optional, for long inputs)

**States:**
- Empty: Placeholder text like "Ask me anything about IELTS..."
- Typing: Show send button active
- Sending: Send button transforms to loading spinner
- Disabled: When AI is generating, input is disabled with "Waiting for response..." placeholder

### 9. Notification Center (Drawer/Overlay)

**Purpose:** Centralized view of all proactive messages, recommendations, and reminders.

**Content:**
- List of proactive messages grouped by category
- Each message shows: icon, title, message, timestamp, priority badge
- Actions: Mark as read, Dismiss, Snooze, Accept
- "Mark all as read" action at top
- Empty state: "No new notifications. You're all caught up!"

**Access:**
- Bell icon in chat header
- Also accessible from header bar bell icon across the app

---

## Primary Actions

| Action | Surface | Behavior |
|--------|---------|----------|
| Send message | Chat input | Sends user message, triggers AI response |
| Switch mode | Mode panel (full page) | Changes assistant behavior, resets conversation context |
| Accept suggestion | Proactive message | Triggers the suggested action (navigate, start practice, etc.) |
| Save message content | Message action bar | Saves as note, vocabulary, grammar, or exercise |
| Rate response | Message action bar | 👍/👎 feedback for response quality |
| Clear conversation | Header action | Confirms then clears current session messages |
| Open notification center | Bell icon (header) | Opens centralized proactive message list |
| Regenerate response | Error state / message menu | Retries the last AI response |
| Attach content | Input attachment button | Future: upload images/text for AI analysis |

---

## Secondary Actions

| Action | Surface | Behavior |
|--------|---------|----------|
| Copy message | Message action bar | Copies assistant message to clipboard |
| View session history | Header menu (full page) | Shows past sessions organized by date |
| Tutor settings | Header gear icon | Opens AI Provider settings, voice preferences, etc. |
| Report response | Message "More" menu | Reports inappropriate or incorrect response |
| Dismiss suggestion | Proactive message × | Hides the suggestion permanently |
| Snooze suggestion | Proactive message clock | Hides temporarily (1h / 4h / tomorrow) |
| Close popup | Popup header × | Collapses floating chat back to FAB |
| Expand to full page | Popup header (future) | Opens current session in `/tutor` full page |

---

## Empty State

**When:** First visit to AI Tutor (no conversation history).

**Full page:**
```
┌────────────────────────────────────────────────┐
│                                                │
│           [Large Tutor Illustration]           │
│                                                │
│   Hi, Alex! I'm your IELTS Tutor.              │
│   I can help you with reading, writing,        │
│   listening, speaking, grammar, vocabulary,    │
│   study plans, and more.                       │
│                                                │
│   What would you like to do today?             │
│                                                │
│   ┌────────────────────────────────────┐       │
│   │ [Quiz me] [Teach me] [Check my    ]│       │
│   │ [writing] [Create a study plan]   │       │
│   └────────────────────────────────────┘       │
│                                                │
│   ── or ask me anything ──                     │
│                                                │
└────────────────────────────────────────────────┘
```

**Floating popup:**
```
┌─────────────────────────────┐
│  [Small avatar]             │
│  Hi, Alex! Ready to study?  │
│                             │
│  [Quiz me] [Teach me]       │
│                             │
│  ─ ask me anything ─        │
└─────────────────────────────┘
```

**Sub-states:**
- **After clearing conversation**: "Conversation cleared. What would you like to talk about?"
- **Mode first visit**: "Switched to Speaking Partner mode. Let's practice IELTS Speaking!"

---

## Loading State

**When:** AI is generating a response.

**Pattern:**
- Three animated dots (typing indicator) with smooth bounce animation
- Tutor avatar shows subtle glow/pulse while generating
- Input area disabled with "AI Tutor is thinking..." placeholder
- For long generation (>5s): show a brief status like "Analyzing your writing..." or "Generating practice exercise..."

**Animation** (from `ChatStyles.tsx`):
```css
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
```

**States:**
- Quick response (<2s): Brief typing indicator, response appears
- Medium response (2-5s): Typing indicator with mode-specific "thinking" message
- Long generation (5-15s): Progress suggestion like "Creating a personalized exercise for you..."
- Very long (15s+): Status updates showing stage (e.g., "Evaluating your essay... Done. Generating feedback...")

---

## Error State

**Visual:**
- Inline error banner at the top of the chat area (not replacing messages)
- Error icon + message text
- Variants based on error type

**Error types:**

| Error | Message | Recovery |
|-------|---------|----------|
| Network error | "Connection lost. Check your internet." | [Retry] auto-retries after 5s |
| AI generation failed | "I had trouble with that. Could you rephrase?" | [Retry] [Send differently] |
| API key missing | "AI Tutor needs an API key to work." | [Go to Settings] |
| Rate limit | "I'm talking too fast! Give me a moment." | Auto-resume after cooldown |
| Content blocked | "I can't help with that request." | Show alternative suggestion |
| Timeout | "That took too long. Let's try again." | [Retry] |

**Behavior:**
- Error messages do not scroll the chat; they appear inline
- Previous conversation remains visible below the error
- User can retry (resends same message) or type a new message
- Persistent errors (API key) redirect to settings with a clear explanation

---

## Mobile Layout

### Full Page on Mobile

| Section | Behavior |
|---------|----------|
| Mode Panel | Collapsed into a horizontal scrollable chip row below the header. Active mode shown as a prominent chip. Tap to open a bottom sheet with all 11 modes. |
| Header | Compact (56px). Shows back button, tutor avatar (small), mode name, and notification bell. Page title "AI Tutor" hidden or shown as breadcrumb. |
| Chat Messages | Full width, `padding: 12px 16px`. Message bubbles optimized for mobile width. |
| Quick Prompts | Horizontal scrollable row with fade edges. 4-5 visible chips. Swipe to see more. |
| Chat Input | Fixed at bottom above keyboard. Auto-focuses on tap. Keyboard pushes input up properly (no scroll issues). |
| Proactive Messages | Full-width cards with dismiss. May be hidden when keyboard is open. |

### Floating Popup on Mobile

- **Full viewport** (`100vw × 100dvh`) — no rounded corners, no offset
- Positioned at bottom edge with `env(safe-area-inset-bottom)` respect
- When keyboard opens: chat area shrinks, input stays above keyboard
- Close button prominent in top-right corner
- FAB hidden when popup is open

### Touch Targets

| Element | Minimum Size |
|---------|-------------|
| Send button | 48×48px |
| Quick prompt chips | 44px height |
| Message action buttons | 44×44px |
| Mode chips (mobile) | 44px height |
| Dismiss/Snooze buttons | 44×44px |
| Voice input button | 48×48px |

---

## Responsive Behavior

| Breakpoint | Full Page Layout | Popup Layout |
|------------|-----------------|--------------|
| < 640px (mobile) | Mode as bottom sheet, full-width chat | Full viewport |
| 640-768px (tablet portrait) | Collapsed mode drawer, wider messages | 380px fixed, bottom-right |
| 768-1024px (tablet) | Side-by-side mode + chat | 380px fixed |
| ≥ 1024px (desktop) | Full sidebar mode + chat area | 380px × 560px |
| ≥ 1280px (large) | Wider chat area, larger avatars | 420px optional increase |

- Full page max-width: `max-w-5xl` (64rem / 1024px) centered
- Mode panel width: 220px (collapsible to 48px icon-only)
- Chat area: remaining width after mode panel

---

## AI Tutor Integration

### Entry Points Across the App

| Entry Point | Location | Opens |
|-------------|----------|-------|
| Sidebar nav | Desktop sidebar | Full `/tutor` page |
| Bottom nav | Mobile bottom nav #3 | Full `/tutor` page |
| Floating FAB | Bottom-right, all pages | Chat popup |
| Header button | Header bar | Chat popup |
| Dashboard AI card | Dashboard | Chat popup with context |
| Word detail panel | Vocabulary | Chat popup with word context |
| Writing result | Writing practice | Chat popup with essay context |
| Speaking result | Speaking practice | Chat popup with speech context |
| Mistake card | Mistake Review | Chat popup with mistake context |
| Study plan page | Today's Plan | "[Ask AI Tutor]" button |
| Progress page | Progress | "Ask about my progress" |

### What Each Entry Point Passes as Context

| Entry Source | Context Injected |
|-------------|------------------|
| Dashboard AI card | Current weak skills, today's incomplete tasks |
| Vocabulary word | Word, definition, topic, example sentences |
| Writing result | Essay text, task type, word count, band estimate |
| Speaking result | Transcript, fluency score, pronunciation notes |
| Mistake card | Mistake text, skill, category, frequency |
| Study plan | Today's tasks, plan phase, exam date |
| Progress | Period, skill breakdown, trends |

### Tutor Personality & Teaching Style

The AI Tutor should adopt different personalities based on user preference (set during onboarding):

| Style | Tone | Example |
|-------|------|---------|
| Encouraging | Warm, supportive, celebrates small wins | "Great effort! Your conclusion is much stronger this time." |
| Strict | Direct, focused on improvement, no sugar-coating | "Your introduction lacks a clear thesis. Rewrite it." |
| Detailed | Deep explanations, thorough, academic | "Let's break down this grammar rule with 5 examples." |

Default: Encouraging (most IELTS learners need motivation, not pressure).

### Proactive Tutor Behavior

The tutor should initiate conversation without being asked:

**At session start:**
- "Good morning, Alex! Ready for your Reading practice? I found a passage on urban development that matches your study plan."

**After user completes a task (detected via study plan):**
- "I see you finished your Writing task. Want me to review it?"

**When user has been inactive:**
- "You haven't studied in 2 days. Want to do a quick 10-minute review to keep your streak?"

**After mistake patterns detected:**
- "I noticed you've been making similar grammar mistakes in your last 3 writing tasks. Let's fix this."

---

## Accessibility Notes

- **Semantic structure**: Messages use `<article>` with `role="log"` and `aria-live="polite"` for the chat area. New messages are announced by screen readers.
- **Message roles**: User messages `role="comment"`, assistant messages `role="status"` or `role="article"` with `aria-label="AI Tutor says"`
- **Input labeling**: Chat input has `<label>` or `aria-label="Message to AI Tutor"`
- **Send button**: `aria-label="Send message"`
- **Mode switching**: Mode buttons use `role="tab"` with `aria-selected`; mode panel uses `role="tablist"`
- **Quick prompts**: `<button>` elements with descriptive `aria-label`
- **Proactive messages**: `role="alert"` or `aria-live="assertive"` for high-priority messages
- **Typing indicator**: `aria-label="AI Tutor is typing"` with `role="status"`
- **Error messages**: `role="alert"` with clear, helpful text
- **Keyboard navigation**: Full chat operable via keyboard. Tab order: input → send → quick prompts → messages → mode panel. Enter to send, Shift+Enter for newline.
- **Focus management**: After sending, focus remains on input. After clearing conversation, focus moves to the first suggested prompt.
- **Color contrast**: All text meets WCAG AA. Message bubbles use sufficient contrast between bg and text.
- **Touch targets**: All interactive elements minimum 44×44px on mobile.
- **Reduce motion**: Respect `prefers-reduced-motion` — disable typing bounce animation, message slide-in animation.
- **Screen reader announcements**: New assistant messages announced via `aria-live="polite"`. Mode changes announced: "Switched to Speaking Partner mode."

---

## Components Needed

| Component | Variants | Purpose |
|-----------|----------|---------|
| ChatMessage | user, assistant, system | Individual message bubble |
| ChatMessageActionBar | with save, copy, rate, more | Action buttons on assistant messages |
| ChatMessageContent | text, vocabulary-card, grammar-card, writing-correction, speaking-feedback, exercise, study-plan, progress-review | Rich content types within messages |
| TutorAvatar | default, speaking, typing, error | Avatar for the AI Tutor |
| ModeSelector | full-panel, mobile-drawer, compact-chips | Mode switching UI |
| ModeChip | with icon, active/inactive | Mode selection chip/tab |
| QuickPromptChip | default, active, context-adaptive | Suggested prompt buttons |
| ContextSuggestionCard | vocabulary, writing, study-plan, mistake | Contextual suggestion cards |
| ProactiveMessageCard | high, medium, low priority | Proactive tutor message display |
| NotificationCenter | opened, closed | Proactive message list |
| ChatHeader | full-page, popup | Header with avatar, mode, actions |
| ChatInput | default, disabled, voice-active | Message input with send button |
| ChatWelcome | full-page, popup | Empty state with suggested prompts |
| ChatTypingIndicator | default | Three-dot typing animation |
| ErrorBanner | api-key, network, timeout, content-blocked | Inline error display |
| VoiceInputButton | default, recording | Voice-to-text input trigger |
| AttachButton | default | File/attachment upload trigger |
| SaveConfirmationToast | note, vocabulary, grammar, exercise | Confirmation after saving AI content |

**Reuse existing components from `@ielts/ui`:**
- `AITutorMessageCard` (`packages/ui/src/components/AITutorMessageCard.tsx`) — shared message card styling
- `Button`, `IconButton` — layout actions
- `Badge` — mode badges, notification counts
- `Toast` — save confirmations
- `Drawer` — mobile mode selector, notification center
- `Modal` — session history, settings

---

## Data Displayed

Referencing `ChatMessage`, `ChatSession`, and `ProactiveMessage` models (`apps/web/src/models/aiTutorModels.ts`, `packages/ai-tutor/src/types/index.ts`):

| Data Field | Display Location | Display Format |
|------------|-----------------|----------------|
| `role` | Message bubble | Determines alignment (user left/right) and background color |
| `content` | Message body | Rendered as markdown text with inline components |
| `mode` | Header + mode panel | Displayed as active mode label |
| `metadata.correctedText` | Writing correction messages | Diff-style highlighted comparison |
| `metadata.bandEstimate` | Writing/Speaking feedback | Band badge with trend indicator |
| `metadata.tokens` | Message footer (optional) | Small muted text "Tokens used: X" |
| `savedAsNoteId` | Message action bar | "Saved as note" checkmark icon |
| `sessionId` | Session history | Grouping identifier |
| `session.title` | Session history list | Title derived from first user message |
| `session.isPinned` | Session history | Pin icon for pinned sessions |
| `session.tags` | Session history | Tag badges |
| `messageCount` | Session list item | "X messages" subtitle |
| `proactiveMessage.title` | Proactive message card | Bold title |
| `proactiveMessage.message` | Proactive message card | Body text |
| `proactiveMessage.priority` | Proactive message card | Priority badge (high=red, medium=amber, low=gray) |
| `proactiveMessage.action` | Proactive message card | Action button from the message |
| `totalInteractions` | Settings/Tutor stats | "X total conversations" |

### Computed/Additional Display Data

| Data | Source | Display |
|------|--------|---------|
| Unread message count | `chatSessions` | Badge on bottom nav AI Tutor icon |
| Conversation duration | session timestamps | "45 min session" in history |
| Response time | AI generation time | Small muted "Response in 3s" for feedback |
| Today's AI interactions | Daily count | "Asked AI 5 times today" in dashboard |
| Current context | ContextManager / MemoryService | Context suggestion cards referencing weak points |

---

## Design Notes (Inspired by Golovko's Reference)

1. **Tutor avatar with glow**: Give the AI Tutor a distinct circular avatar with a soft `--color-tutor-accent` glow/halo. The reference uses a friendly assistant figure — translate this to a clean AI avatar that appears consistently across all touchpoints.

2. **Mode colors**: Each assistant mode should have a subtle accent color that tints the header, avatar, and welcome message when that mode is active. The reference color-codes different subjects — apply this to the 11 modes.

3. **Card-based responses**: Rich responses (vocabulary cards, grammar explanations, writing corrections) should use the same soft rounded card style (`--radius-xl`, `--shadow-sm`) as other app cards. The reference shows information in beautiful grouped cards — follow this pattern.

4. **Warm background**: The chat area should use a warm off-white (`--color-background` adjusted slightly warmer) rather than stark white. Diminishes the "chat app" feel and increases the "learning environment" feel.

5. **Gentle animations**: Messages should fade in with a slight upward translation (as defined in `ChatStyles.tsx`). The reference uses smooth micro-interactions — apply the same polish to message appearance, mode switching, and proactive message slides.

6. **Suggested prompts as pills**: The reference uses rounded pill buttons for quick actions. The quick prompts should be soft, rounded pills with subtle hover states — not boxy chips.

7. **Tutor personality in copy**: Replace neutral labels with warm, encouraging copy. "Ask me anything" becomes "What would you like to learn today?" The reference uses friendly, inviting language throughout.

8. **Visual breathing room**: The current chat is dense. Add padding between messages (16px gap), generous padding inside message bubbles (16px), and clear visual separation between sections (proactive messages, chat, quick prompts, input).

9. **Mode transition animation**: When switching modes, subtly animate the header color shift and show a brief system message ("Switched to Speaking Partner mode"). The reference uses smooth state transitions between sections.

10. **Proactive message card design**: Proactive messages should look like a tutor leaning in, not a notification banner. Use a slightly elevated card style with the tutor avatar on the left and a friendly, inviting tone. The reference's suggestion cards provide the right model.

11. **Save actions as subtle buttons**: The reference avoids cluttered UI. Save/copy/rate actions should appear as subtle icon buttons on hover (desktop) or always visible but low-contrast (mobile), revealed fully on interaction.

12. **Voice-first hint**: Even if not immediately implemented, the input area should hint at voice capability with a subtle microphone icon. The reference shows voice interfaces as natural — prepare the design for this direction.
