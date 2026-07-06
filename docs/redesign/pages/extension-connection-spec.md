# IELTS Journey — Extension Connection Page Specification

## Page Purpose

The Extension Connection page is the central hub for managing the relationship between the IELTS Journey website and the IELTS Journey browser extension. It educates users about the extension's capabilities, guides them through installation, displays connection and sync status, and explains how the extension enhances their learning workflow. The page serves as both a marketing tool (convincing users to install the extension) and a utility page (monitoring sync health and troubleshooting connection issues).

## User Goal

Users should feel, when using the Extension Connection page:

- **Informed** — They understand exactly what the extension does and how it fits into their IELTS study workflow
- **Empowered** — They can install, connect, and verify the extension is working correctly
- **Connected** — They see real-time sync status and know their data is flowing between the extension and website
- **Motivated** — They understand how browsing the web becomes an IELTS learning activity with the extension
- **Troubleshooted** — If something is not working, they can diagnose and fix the connection quickly

The page should feel like a helpful onboarding experience for the extension ecosystem, not a technical status dashboard.

---

## Current UX/UI Problems

Based on analysis of the current codebase (`apps/web/src/pages/landing/ExtensionSection.tsx:1-57`, `apps/web/src/components/FeatureSection.tsx:82-91`, `apps/web/src/components/ui/EmptyState.tsx:56-60,85,139-143`, `apps/web/src/services/storage/VocabularySync.ts:1-165`, `apps/extension/src/popup/components/SyncStatusBadge.tsx:1-147`, `packages/ui/src/components/ExtensionSyncStatusBadge.tsx:1-76`, `packages/ui/src/components/ExtensionActionMenu.tsx:1-127`, `apps/extension/src/popup/components/ImportExportSection.tsx:534-622`):

1. **No dedicated extension connection page exists** — The extension is currently mentioned only on the landing page (`ExtensionSection.tsx`), in `FeatureSection`, in `EmptyState` messages (`no-extension-connected`), and in the settings import/export section. There is no dedicated settings sub-page or standalone page for managing the extension connection.

2. **Connection status is only shown in extension popup** — The `SyncStatusBadge` component in the extension popup shows sync status (`synced`, `syncing`, `error`, `disconnected`) but this information is not surfaced in the web app. Users visiting the website have no way to verify their extension is connected and syncing.

3. **No installation guidance** — The landing page has a single "Install Extension" CTA (`ExtensionSection.tsx:29`) with a link to the Chrome Web Store. There is no step-by-step installation guide, browser-specific instructions, or post-install setup walkthrough.

4. **Sync explanation is buried** — The `ImportExportSection.tsx:534-622` explains that the extension and website store data separately and need to be logged into the same account to sync. This critical information is hidden deep in a settings section many users never visit.

5. **Vocabulary sync is implicit** — The `VocabularySync.ts` service handles bi-directional vocabulary sync via `window.postMessage` bridge, but there is no UI that explains to users that vocabulary saved in the extension automatically appears in the web app's vocabulary notebook.

6. **Article and text sync gap** — Content saved via the extension's `ArticleCollector` and `SaveTextForm` is stored in the extension's IndexedDB and does not automatically appear in the web app's artifacts page. Users may be confused about where their saved content went.

7. **No extension features preview** — Users who have not installed the extension have no way to see screenshots or feature demos of vocabulary highlighting, text selection saving, article collection, or the mini-tutor within the extension.

8. **Troubleshooting is absent** — When sync fails or the extension is not connected, there is no guidance on how to fix the issue (check login, reinstall, check permissions, etc.).

9. **No browser compatibility info** — The current implementation assumes Chrome. There is no information about Firefox, Edge, or other browser support.

10. **Extension capabilities undocumented** — Features like auto-highlighting saved words on web pages, the mini-tutor in the popup, mistake notebook, and video helper are not documented anywhere in the web app. Users discover them only after installing.

---

## Proposed Layout

The Extension Connection page should serve as a comprehensive extension management hub, designed as a settings sub-page at `/settings/extension`.

### Desktop Layout (>= 768px)

```
┌──────────────────────────────────────────────────────────────┐
│  Settings > Extension Connection                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Connection Status Card                                   │ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  [Extension Icon]  Status: ● Connected (Chrome)    │  │ │
│  │  │  Last synced: 2 minutes ago                        │  │ │
│  │  │  [Sync Now]  [Disconnect]                          │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Install Extension (shown when not connected)             │ │
│  │                                                          │ │
│  │  ┌──────────────────────────┐  ┌──────────────────────┐  │ │
│  │  │  Chrome Extension        │  │  Edge Extension       │  │ │
│  │  │  [Install from Chrome    │  │  [Install from Edge   │  │ │
│  │  │   Web Store]             │  │   Add-ons]            │  │ │
│  │  └──────────────────────────┘  └──────────────────────┘  │ │
│  │                                                          │ │
│  │  Step-by-step installation guide with screenshots        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  How the Extension Helps    [ section ]                   │ │
│  │                                                          │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐        │ │
│  │  │ Save │ │ Save │ │Explain│ │High- │ │Mini    │        │ │
│  │  │Words │ │Articles│ │Text  │ │light │ │Tutor   │        │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └────────┘        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Sync & Data Flow Explanation                             │ │
│  │                                                          │ │
│  │  [Diagram showing how extension ↔ website sync works]    │ │
│  │                                                          │ │
│  │  What syncs: Vocabulary, Articles (manual import),       │ │
│  │  Learning progress (future)                              │ │
│  │                                                          │ │
│  │  What does not sync automatically: Saved articles         │ │
│  │  (use import/export)                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Data Import from Extension                               │ │
│  │                                                          │ │
│  │  [Import Vocabulary from Extension]  [Import Articles]   │ │
│  │  [Export for Extension]                                  │ │
│  │                                                          │ │
│  │  Last import: May 20, 2026                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Troubleshooting                                          │ │
│  │                                                          │ │
│  │  ▸ Extension not showing in browser toolbar              │ │
│  │  ▸ Vocabulary not syncing                                │ │
│  │  ▸ Saved articles not appearing in website               │ │
│  │  ▸ Auto-highlight not working                            │ │
│  │  ▸ Extension needs update                                │ │
│  │                                                          │ │
│  │  [Contact Support]                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Not Connected Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Settings > Extension Connection                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Extension Not Detected                                   │ │
│  │                                                          │ │
│  │  [Puzzle piece icon]                                      │ │
│  │                                                          │ │
│  │  Install the IELTS Journey browser extension to:          │ │
│  │  • Save vocabulary from any webpage                       │ │
│  │  • Collect articles for reading practice                  │ │
│  │  • Highlight saved words while browsing                   │ │
│  │  • Get quick AI explanations for selected text            │ │
│  │                                                          │ │
│  │  ┌─────────────────────────────┐                          │ │
│  │  │  Install for Chrome         │                          │ │
│  │  └─────────────────────────────┘                          │ │
│  │  ┌─────────────────────────────┐                          │ │
│  │  │  Install for Edge           │                          │ │
│  │  └─────────────────────────────┘                          │ │
│  │                                                          │ │
│  │  [Already installed? Refresh this page]                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  What You're Missing                                      │ │
│  │  (Feature preview cards — same as "How the Extension      │ │
│  │   Helps" section but with CTA to install)                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌──────────────────────────────┐
│  ← Settings                  │
│  Extension Connection        │
├──────────────────────────────┤
│  Connection Status           │
│  ┌────────────────────────┐  │
│  │ ● Connected            │  │
│  │ Chrome · Synced 2m ago │  │
│  │ [Sync Now]             │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  [Install Extension]         │
│  (shown when not connected)  │
├──────────────────────────────┤
│  How It Helps                │
│  ┌────────────────────────┐  │
│  │ Save Vocabulary   [>]  │  │
│  ├────────────────────────┤  │
│  │ Save Articles    [>]   │  │
│  ├────────────────────────┤  │
│  │ Explain Text     [>]   │  │
│  ├────────────────────────┤  │
│  │ Auto-Highlight   [>]   │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  Import Extension Data       │
│  [Import Vocabulary]         │
│  [Import Articles]           │
├──────────────────────────────┤
│  Need Help?                  │
│  [Troubleshooting Guide]     │
├──────────────────────────────┤
│  Bottom Navigation           │
└──────────────────────────────┘
```

---

## Main Sections

### 1. Extension Connection Status Card

- **Content:** Real-time display of extension connection state
- **When connected:**
  - Extension icon (puzzle piece with checkmark)
  - Status indicator: "● Connected" in green, "● Syncing" in blue (spinning), "● Error" in red
  - Browser name (Chrome, Edge, etc.) — detected via user agent or extension bridge
  - Last sync time: "Synced 2 minutes ago" or "Not synced today"
  - "Sync Now" button — triggers manual sync via `VocabularySync.sendLatestVocabToExtension()`
  - "Disconnect" secondary link — clears connection flag (rarely used)
- **When not connected:**
  - Extension icon (puzzle piece with plus)
  - "● Not Connected" gray status
  - "Last synced: 3 days ago" or "Never synced" (if previously connected)
  - "Connect" button → scrolls to Install section
  - "Why is this important?" dismissible info banner
- **When error:**
  - "● Sync Error" in red with error message
  - "Try Again" button
  - "Troubleshoot" link → scrolls to Troubleshooting section
- **Implementation note:** Connection detection via `window.postMessage` bridge handshake (extending the existing `VocabularySync.ts` pattern). Extension sends a heartbeat message; website listens and updates status. Fallback to detecting extension by checking if a specific DOM element or global variable exists.

### 2. Install Extension Section

- **Content:** Installation guidance for users without the extension
- **Conditional display:** Only shown when extension is not detected OR shown as a "Need to reinstall?" collapsed section when connected
- **Browser cards:**
  - Chrome: "Install from Chrome Web Store" button → `EXTENSION_URL` (`https://chromewebstore.google.com/detail/ielts-journey`)
  - Edge: "Install from Edge Add-ons" button → Edge store URL
  - Firefox (future): "Coming soon" ghost state
- **Step-by-step guide:**
  1. "Click the 'Install' button above"
  2. "Click 'Add to Chrome' in the store popup"
  3. "The extension icon should appear in your browser toolbar"
  4. "Click the extension icon to open IELTS Journey popup"
  5. "Log in with your IELTS Journey account (same as website)"
- **Visual:** Small illustration or screenshot showing the extension icon in the browser toolbar
- **After install:** "Refresh this page after installing" prominent note with refresh button

### 3. How the Extension Helps

- **Content:** Feature cards explaining each extension capability
- **Card: Save Vocabulary from Any Webpage**
  - Icon: Book + highlight marker
  - Title: "Save Vocabulary While You Read"
  - Description: "Select any word or phrase on a webpage and save it directly to your IELTS Journey vocabulary notebook. The word, its context, and the page URL are saved automatically."
  - Detail action: "See how it works" → expandable demo or opens modal with screenshot sequence
  - Bridge: Links to the vocabulary sync mechanism (`VocabularySync.ts`) to explain that saved words appear in `/vocabulary` immediately
- **Card: Save Articles for Later Reading**
  - Icon: Newspaper + save icon
  - Title: "Collect Articles for IELTS Practice"
  - Description: "Save full articles from news sites, blogs, and online content. Articles are stored in the extension and can be imported to the web app for reading practice and exercise generation."
  - Note: Explains that articles are currently imported manually (not auto-synced like vocabulary)
  - Bridge: Links to Saved Content page spec for import flow
- **Card: Explain Selected Text with AI**
  - Icon: Sparkle + text bubble
  - Title: "AI Explanations for Any Text"
  - Description: "Select any sentence or passage on a webpage and ask AI Tutor to explain it in the context of IELTS. Get vocabulary breakdowns, grammar analysis, and IELTS topic connections."
  - Detail: Shows example: selecting "The rapid industrialization of developing nations" → AI explains IELTS Writing Task 2 usage
- **Card: Auto-Highlight Saved Words**
  - Icon: Highlighter pen
  - Title: "Auto-Highlight Words You're Learning"
  - Description: "When you visit a webpage, the extension automatically highlights words from your vocabulary notebook. Words you're currently studying appear in yellow, mastered words appear in green, new words appear in blue."
  - Detail: Color legend and "How highlighting works" explanation
  - Bridge: Uses the `VOCAB_LIST_SYNC` message from `VocabularySync.ts` — extension maintains a local cache of vocabulary for highlighting
- **Card: Mini Tutor in Extension Popup**
  - Icon: Robot head
  - Title: "Quick AI Tutor in Your Browser"
  - Description: "Open the extension popup to access a mini version of AI Tutor. Ask quick questions, get word explanations, or check your grammar without leaving your current page."
  - Bridge: Links to the existing `MiniTutor.tsx` component in extension popup
- **Card: Video Helper for YouTube/Online Courses**
  - Icon: Play button + captions
  - Title: "Learn from Videos"
  - Description: "Save subtitles and transcripts from YouTube videos and online courses. Extract vocabulary, sentences, and IELTS-relevant content from video-based learning."
  - Bridge: Links to `VideoHelper.tsx` in extension

### 4. Sync & Data Flow Explanation

- **Content:** Clear diagram and text explaining how data moves between extension and website
- **Visual:** Simple flow diagram (can be CSS-drawn or SVG):
  ```
  Web Browser ──→ Extension Popup ──→ IndexedDB (Extension)
       │                                      │
       │  postMessage bridge                  │  chrome.storage.local
       ▼                                      ▼
  Website App ──→ VocabularySync.ts ──→ IndexedDB (Website)
                      │
                      ▼
               Vocabulary Notebook
               Saved Articles
  ```
- **What syncs automatically:**
  - Vocabulary entries (bi-directional, via `window.postMessage` bridge)
  - Vocabulary status changes (website ↔ extension)
  - Done/learning status updates
- **What requires manual import:**
  - Saved articles (use "Import from Extension" button)
  - Saved text passages (use "Import from Extension" button)
  - Mistake entries (future: auto-sync)
- **Explanation text:**
  - "The extension and website store data in separate databases. Vocabulary is synced automatically when both are open. Other content (articles, text) can be imported manually using the buttons below."
  - "For the best experience, keep the extension installed and logged in to the same account. All your data stays on your device — it is never sent to external servers except when using AI features."

### 5. Data Import from Extension

- **Content:** Actions for manually importing extension data into the website
- **"Import Vocabulary from Extension" button:**
  - Triggers `sendLatestVocabToExtension()` and `REQUEST_EXTENSION_VOCAB` from `VocabularySync.ts`
  - Shows progress: "Importing vocabulary..." with count
  - Result toast: "12 new words imported from extension"
  - De-duplicates against existing vocabulary (check by word + meaning)
- **"Import Articles from Extension" button:**
  - Opens a modal/list showing articles stored in the extension that have not been imported
  - User can select which articles to import
  - Imported articles appear in the Saved Content page
  - Result toast: "3 articles imported"
- **"Export for Extension" button:**
  - Exports website vocabulary as a JSON file that can be imported into the extension's Backup & Restore
  - Format matches the extension's `extensionVocabSchema`
  - Result toast: "Vocabulary exported. Open the extension and use Backup & Restore to import."

### 6. Troubleshooting Section

- **Content:** Expandable FAQ-style troubleshooting entries
- **Entries:**
  - "Extension icon not showing in browser toolbar"
    - Solution: Reinstall, check extensions page, pin the extension
  - "Vocabulary not syncing between extension and website"
    - Solution: Refresh both, check login state, ensure same account
    - Link to `"sync-now"` action
  - "Saved articles not appearing on the website"
    - Solution: Use the "Import from Extension" button (articles do not auto-sync)
  - "Auto-highlight not working"
    - Solution: Check that vocabulary list is not empty, refresh page, reinstall
  - "Extension needs update"
    - Solution: Chrome updates extensions automatically; check `chrome://extensions` for updates
  - "Connection says disconnected but extension is installed"
    - Solution: Refresh this page, re-login, reinstall extension
- **"Contact Support" link:** Opens feedback/info page

---

## Primary Actions

1. **Install Extension** — Navigate to Chrome Web Store (or Edge Add-ons) to install
2. **Sync Now** — Trigger manual sync between extension and website
3. **Import Vocabulary from Extension** — Import extension's vocabulary into website database
4. **Import Articles from Extension** — Select and import articles from extension
5. **Export for Extension** — Download website vocabulary for extension import
6. **Refresh Connection** — Recheck extension connection state
7. **Try Again (error state)** — Retry failed sync/connection

## Secondary Actions

1. **Troubleshoot** — Scroll to or expand troubleshooting FAQ
2. **Contact Support** — Navigate to help/info page
3. **Disconnect** — Clear connection state (rare use)
4. **Learn More (feature card)** — Expand feature detail or open demo screen
5. **Refresh Page** — After installation, refresh to detect extension
6. **View Import History** — Show list of past imports from extension
7. **Clear All Filters (empty state)** — Reset any active filters

---

## Empty State

### Extension Not Installed

- **Icon:** Puzzle piece with plus sign (extension icon from `EmptyState.tsx:56-60`)
- **Title:** "Browser extension not detected"
- **Description:** "Install the IELTS Journey browser extension to save vocabulary, collect articles, and highlight words while you browse the web. The extension works with Chrome and Edge browsers."
- **Primary Action:** "Install for Chrome" (opens Chrome Web Store)
- **Secondary Action:** "Install for Edge" (opens Edge Add-ons)
- **Extra:** "Already installed? Refresh this page" with refresh button
- **Note:** This is the default state for users visiting Settings > Extension without the extension installed

### Extension Installed but Not Connected

- **Icon:** Puzzle piece with disconnected link
- **Title:** "Extension detected but not connected"
- **Description:** "The extension is installed but not connected to your account. Open the extension popup and log in with the same IELTS Journey account you use on this website."
- **Primary Action:** "Open Extension Popup" (instructional — "Click the puzzle icon in your browser toolbar")
- **Secondary Action:** "Refresh Connection" (recheck connection status)
- **Extra:** "After logging in, return here and click 'Refresh Connection'"

### No Data to Import

- **Icon:** Empty box with arrow down
- **Title:** "No new data in extension"
- **Description:** "Your extension database is empty or all data has already been imported. Start using the extension to save vocabulary and articles from web pages."
- **Primary Action:** "Open Extension Guide" (scroll to How It Helps section)
- **Secondary Action:** "Go to Vocabulary" (if vocabulary was synced)

### Previously Connected but Now Disconnected

- **Icon:** Clock with warning
- **Title:** "Connection was lost"
- **Description:** "IELTS Journey extension was previously connected but is now unreachable. This may happen after browser restart or extension update."
- **Primary Action:** "Refresh Connection"
- **Secondary Action:** "Troubleshoot" (scroll to troubleshooting section)
- **Extra:** Shows "Last connected: 3 days ago" timestamp

---

## Loading State

### Initial Page Load

- **Skeleton pattern:**
  - Page title skeleton (short line)
  - Connection status card skeleton (rounded rectangle with two line placeholders)
  - Feature cards skeleton (3-4 card placeholders with icon circle + text lines)
  - Bottom troubleshooting section skeleton
- **Animation:** Subtle shimmer/pulse effect
- **Duration:** Until connection check resolves (via `window.postMessage` timeout or storage check)

### Syncing State

- **Connection status card:** Badge changes to "Syncing..." with spinning icon animation
- **Disable:** "Sync Now" button disabled during sync
- **Timeout:** If sync takes > 10 seconds, show "Sync is taking longer than expected" message with option to cancel and retry

### Importing Data

- **Button state:** Import button shows spinner + "Importing X items..."
- **Progress:** Optional inline progress bar for article import (if multiple articles selected)
- **Result:** Success toast with count; if duplicates exist, show "12 imported, 3 already in library"

### Checking Connection

- **During page mount:** Brief "Checking connection..." state (max 3 seconds before timeout)
- **Timeout fallback:** If no heartbeat received from extension within 3 seconds, show "Not connected" state with "Install" or "Refresh" options

---

## Error State

### Connection Check Failed

- **Icon:** Warning triangle or disconnected puzzle piece
- **Title:** "Unable to check extension status"
- **Description:** "The connection check timed out. This does not necessarily mean the extension is not working — try refreshing or checking manually."
- **Action:** "Try Again" (recheck)
- **Secondary:** "Manual Check Guide" (instructional: "Open your browser extensions page and verify IELTS Journey is enabled")

### Sync Failed

- **Status badge:** "● Sync Error" on the connection status card
- **Error detail:** Brief error message (e.g., "Data could not be saved to both databases")
- **Action:** "Try Again" on the status card
- **Guidance:** "If this persists, try refreshing both the website and extension popup"

### Import Failed

- **Feedback:** Toast error: "Import failed. The extension data may be corrupted or in an unexpected format."
- **Fallback:** "Try exporting from extension and importing manually using the JSON file"
- **Action:** "Export from Extension First" guide link

### Extension Bridge Error

- **Feedback:** Inline banner at the top of the page
- **Message:** "The communication channel to the extension encountered an error. This is usually temporary."
- **Action:** "Refresh Connection" button on the banner
- **Dismissible:** User can dismiss the banner

### Storage Limits

- **Feedback:** Warning when attempting to import large datasets
- **Message:** "The imported data exceeds the available storage. Try importing fewer items at a time."
- **Action:** "Import in Batches" guide or selective import modal

---

## Mobile Layout

### Screen Adaptation

- **Header:** "Settings" back button + "Extension Connection" title
- **Connection Status:** Compact card with icon, status dot, browser name, and time — "Sync Now" button below
- **Install Section:** Full-width install cards (Chrome and Edge stack vertically); step-by-step guide is collapsible
- **How It Helps:** List of feature items (accordion style) instead of grid cards — tap to expand detail
- **Sync & Data Flow:** Simplified diagram (stacked vertically, readable on small screen)
- **Import Actions:** Full-width buttons stacked vertically
- **Troubleshooting:** Expandable accordion items with plus/minus icons
- **Empty state in full view:** Centered with icon, title, description, and CTA buttons

### Touch Behavior

- **Tap targets:** Minimum 44x44px for all interactive elements (install buttons, sync buttons, feature cards)
- **Feature cards:** Tap to expand details; tap again to collapse
- **Troubleshooting entries:** Tap question to expand answer; tap again to collapse
- **Install buttons:** Direct tap opens Chrome Web Store or Edge Add-ons in new tab
- **Pull to refresh:** Swipe down at the top to recheck connection status
- **Swipe left:** On import history items to reveal delete/unlink action (future feature)

### Bottom Navigation on Mobile

- **Visible:** Bottom navigation remains visible with standard items
- **Header back:** Tapping back returns to Settings main page

---

## Responsive Behavior

| Breakpoint | Connection Card | Install Section | Feature Cards | Data Import | Troubleshooting |
|---|---|---|---|---|---|
| < 480px (small phone) | Compact card, stacked | Full-width stacked | List accordion | Stacked buttons | Accordion |
| 480–767px (large phone) | Compact card, stacked | Full-width stacked | List accordion | Stacked buttons | Accordion |
| 768–1023px (tablet) | Card with inline status | 2-column browser cards | 2-column grid | Inline button row | Side-by-side FAQ |
| 1024px+ (desktop) | Full card with sync button | 2-column browser cards + guide | 3-column grid | Inline button row | 2-column FAQ grid |

- **Install guide:** Desktop shows step-by-step guide inline next to browser cards; mobile shows it below as collapsible
- **Feature card details:** Desktop shows truncated preview with "Learn more" link; mobile shows first sentence only with expand
- **Sync & Data Flow diagram:** Desktop shows horizontal flow chart; mobile shows vertical step diagram
- **Import buttons:** Desktop shows inline row; mobile shows stacked full-width buttons
- **Transition animations:** Cards fade in; accordion expands with smooth height transitions

---

## AI Tutor Integration

### Entry Points

1. **"Explain Selected Text" Feature Card:**
   - Explains that the extension's AI explanation feature works with AI Tutor
   - "Try it in extension" action opens the extension popup guide

2. **Troubleshooting AI Features:**
   - FAQ entry: "AI explanations not working in extension?"
   - Solution: "Ensure AI provider is configured in Settings > AI Provider. The extension uses the same AI configuration as the website."

3. **Smart Import Suggestions (Future):**
   - After importing articles from extension, AI Tutor could suggest: "I see you imported 3 articles about climate change. Would you like to generate reading exercises from them?"

### Proactive Messages

- **When extension is not installed:** AI Tutor could proactively suggest: "Did you know you can save vocabulary from any webpage? Install the browser extension to learn while you browse."
- **After installing extension:** "Great! Your browser extension is connected. Start browsing and saving words — they will appear in your vocabulary notebook automatically."

---

## Accessibility Notes

- **Connection status:** `role="status"` with `aria-live="polite"` for live status updates; `aria-label="Connection status: connected"` on the status badge
- **Install buttons:** `aria-label="Install IELTS Journey extension for Chrome browser"` — each browser button has unique, specific label
- **Feature cards:** Each card uses `role="region"` with `aria-labelledby` pointing to the card title; expandable details use `aria-expanded` state
- **Sync Now button:** `aria-label="Sync extension data now"` with loading state announced via `aria-live`
- **Import buttons:** `aria-label="Import vocabulary from browser extension"` with progress announced via `aria-live="polite"`
- **Troubleshooting accordion:** Each entry uses `<button>` with `aria-expanded` controlling the answer panel; panel uses `role="region"` with `aria-labelledby`
- **Status indicators:** Use both color and text (not color alone) — "● Connected" in green text, "● Syncing" with spinner icon, "● Error" in red with icon
- **Error announcements:** Toast errors use `role="alert"`; inline errors use `aria-live="polite"`
- **Focus management:** After "Refresh Connection" or "Sync Now", focus moves to the status card to announce updated state
- **Keyboard navigation:** Tab through all interactive elements; Arrow keys within accordion groups; Enter/Space to expand accordion items
- **Touch targets:** Minimum 44x44px for all interactive elements on mobile
- **Color contrast:** Status indicators meet WCAG AA (green on surface, red on surface)
- **Screen reader labels for browser icons:** Each browser icon has `aria-hidden="true"` with text label alongside

---

## Components Needed

### From Component System (Existing or New)

| Component | Type | Usage |
|---|---|---|
| Button | Existing | Install, Sync Now, Import, Export, Try Again, Contact Support |
| Card | Existing | Connection status card, feature cards, install browser cards |
| Badge | New/Existing | Connection status badge (connected, syncing, error, disconnected) |
| Input | Existing | (Minimal usage — search or filter in import article list) |
| Modal | Existing | Article import selection modal |
| Toast | Existing | Success/error feedback for sync, import, export operations |
| LoadingSkeleton | New | Page load skeleton placeholders |
| ErrorState | Existing | Connection check failed, sync error states |
| EmptyState | Existing | Extension not installed, not connected states |
| EmptyStateCard | Existing | Feature preview cards in "What You're Missing" section |
| Accordion | New | Troubleshooting FAQ, feature card detail expansion |
| ProgressBar | Existing | Import progress indicator |

### New Components to Create

1. **ConnectionStatusCard** — Card displaying extension connection state with status badge, browser info, last sync time, and action buttons (Sync Now, Refresh, Troubleshoot). Variants: connected, syncing, error, disconnected, checking.

2. **InstallBrowserCard** — Card for a specific browser with store button, icon, and compatibility info. Variants: Chrome (available), Edge (available), Firefox (coming soon).

3. **ExtensionFeatureCard** — Feature explanation card with icon, title, description, expandable detail section, and contextual action. Variants: save vocabulary, save articles, explain text, auto-highlight, mini tutor, video helper.

4. **SyncFlowDiagram** — Visual SVG/CSS flow diagram showing how data moves between browser, extension, and website. Responsive: horizontal desktop, vertical mobile.

5. **ImportProgressModal** — Modal showing import progress with item count, progress bar, and per-item status for article imports.

6. **TroubleshootingAccordion** — Expandable FAQ section for diagnosing common extension connection issues.

7. **ConnectionBanner** — Inline banner shown at the top of other pages (Vocabulary, Saved Content, Settings) when extension is not connected. Dismissible with "Install Extension" CTA. Reuses the pattern from `EmptyState.tsx`'s `no-extension-connected` variant.

### Component States Matrix

| Component | Default | Active | Hover | Focus | Disabled | Loading | Error |
|---|---|---|---|---|---|---|---|
| ConnectionStatusCard | Shows current state | Sync Now clicked | — | Focus ring | Sync Now disabled | Spinning sync icon | Red border + error badge |
| InstallBrowserCard | Browser info + CTA | Store page opened | Elevation increase | Focus ring | Disabled (coming soon) | — | — |
| ExtensionFeatureCard | Collapsed preview | Expanded detail | Card lift | Focus ring | — | — | — |
| SyncFlowDiagram | Static diagram | — | — | — | — | — | — |
| ImportProgressModal | Hidden | Open with progress | — | Focus trap | Confirm disabled | Progress bar animating | Error row highlight |
| TroubleshootingAccordion | Closed entries | Open entry | Background tint | Focus ring | — | — | — |
| ConnectionBanner | Visible | Dismissed | — | Focus ring | — | — | — |

---

## Data Displayed

### Connection State

| Field | Source | Display |
|---|---|---|
| Connection status | `window.postMessage` bridge + storage flag | Badge: Connected / Syncing / Error / Disconnected |
| Browser name | User agent detection or extension handshake | Text: "Chrome", "Edge", "Firefox (coming soon)" |
| Last sync time | `chrome.storage.local` (lastSyncTime) or localStorage | Relative time: "2 minutes ago", "Today at 3:45 PM" |
| Last sync error | `chrome.storage.local` (lastSyncError) | Error message text |
| Extension version | Extension handshake message | "Version 1.2.0" (shown in expanded status) |
| Extension store URL | `EXTENSION_URL` from config | Link to: `https://chromewebstore.google.com/detail/ielts-journey` |
| Edge store URL | Config constant | Link to Edge Add-ons |
| Auth state | Auth context | "Logged in as user@email.com" (if authenticated) |

### Sync & Data Stats

| Field | Source | Display |
|---|---|---|
| Words in extension | Extension vocabulary count | "42 words in extension" |
| Words in website | Website vocabulary count | "156 words on website" |
| Last import date | Import history | "May 20, 2026" |
| Articles in extension | Extension article count | "8 articles in extension" |
| Articles imported | Import history | "5 articles imported" |
| Already synced | De-duplication check | "3 words already in library" |

### Feature Cards Content

| Feature | Key Description | Visual |
|---|---|---|
| Save Vocabulary | Select any word on any page — saved to your notebook instantly | Book + highlight icon |
| Save Articles | Full article collection for reading practice | Newspaper + bookmark icon |
| Explain Text | AI-powered IELTS explanations for any selected passage | Sparkle + chat bubble icon |
| Auto-Highlight | Saved words light up in yellow when you browse | Highlighter pen icon |
| Mini Tutor | Quick AI Tutor access from browser toolbar | Robot head icon |
| Video Helper | Learn from YouTube captions and transcripts | Play + captions icon |

### Import History

| Field | Source | Display |
|---|---|---|
| Date | Import timestamps | "May 20, 2026 at 3:45 PM" |
| Type | Vocabulary / Articles | Badge: "Vocabulary" or "Articles" |
| Count | Number of items imported | "12 items imported" |
| Status | Success / Partial / Failed | Status badge |

---

## Design Notes

### Inspired by the Reference (Personalized Learning App by Anastasia Golovko)

1. **Extension connection as a friendly companion, not a technical dashboard** — The page should feel like meeting a helpful assistant, not reading a system status report. Use warm colors (teal/cyan gradients matching the existing `extension` variant in `EmptyState.tsx:85`), rounded cards, and friendly illustrations.

2. **Feature cards as visual previews** — Each extension feature should be presented as an attractive card with icon, title, and a short benefit-driven description. The reference uses card-based feature showcases — apply the same approach here. Cards should have subtle gradients, soft shadows, and inviting tap targets.

3. **Install CTA as a welcoming button** — The install button should feel like an invitation, not an advertisement. Use the primary accent color (teal from the extension theme), a download/plus icon, and a friendly label: "Add to Your Browser" or "Install Companion Extension". Avoid technical phrases like "Download Chrome Extension."

4. **Connection status as a friendly badge** — Instead of a cold "200 OK" status, use the existing `ExtensionSyncStatusBadge` pattern with a colored dot and human-readable label. Green dot = "Connected and learning together" (not "200 OK"). Red dot = "Having trouble connecting" (not "500 Server Error").

5. **Sync flow as a journey map** — The data flow diagram should look like a friendly journey map, not a server architecture diagram. Use icons for each step (webpage → bookmark icon → vocabulary notebook), curved paths instead of straight lines, and soft gradient backgrounds.

6. **Troubleshooting as a conversation** — Each FAQ entry should read like a friend helping another friend. "I saved words in the extension but they're not showing up on the website. What's going on?" Answer: "Don't worry! Usually this just means the two need a moment to sync. Try clicking 'Sync Now' above, or refresh both pages if that doesn't work."

7. **Empty state as encouragement** — The "Extension Not Installed" state should not feel like a missing feature. Frame it as "You're missing out on a superpower!" with an illustration showing someone browsing the web and words magically being saved. The reference uses playful empty states — match that energy.

8. **Mobile parity** — On mobile, the extension connection page should feel like a native app's "Linked Services" screen. Compact but informative, with clear CTAs and minimal technical detail.

### Extension as an Ecosystem Feature

The extension connection page should reinforce that IELTS Journey is a complete learning ecosystem spanning both the website and the browser:

- **Extension is the bridge between web browsing and IELTS learning** — Frame the extension as the tool that turns everyday browsing into IELTS practice material
- **Seamless vocabulary pipeline** — The existing `VocabularySync.ts` mechanism (bi-directional sync via `postMessage`) should be highlighted as a seamless experience: "Save a word in the extension → it appears in your vocabulary notebook instantly"
- **Content as learning material** — Articles saved via the extension become reading practice passages and exercise sources. The connection between browsing → saving → learning should be explicit
- **Local-first, sync-ready** — Emphasize that all data stays on the user's device. The extension and website sync locally without cloud dependency except for AI features
- **Cross-device continuity** — Users should understand they can save vocabulary during the day (extension) and review it in the evening (website)

### Visual References from the Codebase

- **Extension icon:** Use the existing puzzle piece SVG from `EmptyState.tsx:56-60` as the primary icon for the page and connection status card
- **Color scheme:** Teal/cyan gradient (`from-teal-50 to-cyan-50`) from `EmptyState.tsx:85` for the extension variant — use consistently across feature cards and status sections
- **SyncStatusBadge:** Extend the existing `SyncStatusBadge` component pattern from the extension popup (`SyncStatusBadge.tsx`) for the web-based connection status card
- **Feature section style:** Reference the `FeatureSection.tsx` card pattern for extension feature cards — icon + title + description with soft borders
- **Landing page copy:** Use the "Learn while you browse" messaging from `ExtensionSection.tsx:13-21` as the tagline for the page hero
- **Bridge mechanism:** The `VocabularySync.ts` `initVocabSync` and `sendLatestVocabToExtension` functions should be referenced in the sync explanation section with clear language
- **Import/Export pattern:** Reference `ImportExportSection.tsx:534-622` for the manual import flow between extension and website
