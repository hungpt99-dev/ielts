/**
 * Security Audit & Manifest V3 Compliance
 *
 * This file documents the security posture, permission justification,
 * privacy measures, and data flow for the IELTS Learning Journey extension.
 *
 * ============================================================================
 * 1. DATA FLOW — No Unauthorized Transmission
 * ============================================================================
 * - All user data (vocabulary, articles, mistakes, settings) is stored locally
 *   in chrome.storage.local or IndexedDB. No data is sent to any server
 *   except when the user explicitly triggers an AI feature.
 * - AI API requests go ONLY to the user-configured endpoint (baseUrl + "/chat/completions")
 *   using the user's own API key. The extension never sends data to any
 *   hard-coded third-party endpoint.
 * - No telemetry, analytics, or usage tracking exists anywhere in the codebase.
 * - No browsing history or webpage content is read or transmitted without
 *   explicit user action (selecting text and choosing a save/explain action).
 *
 * ============================================================================
 * 2. API KEY SECURITY
 * ============================================================================
 * - API keys are NEVER hard-coded in the source code.
 * - API keys are stored in chrome.storage.local (NOT chrome.storage.sync),
 *   keeping them off cloud sync and local to the device.
 * - Non-sensitive settings (model, baseUrl, theme, toggles) are stored in
 *   chrome.storage.sync for convenience roaming.
 * - API keys are only read from storage when the user explicitly triggers an
 *   AI feature (explain, enrich, translate, quiz, etc.).
 * - The AI client library (@ielts/ai) receives the key via a getConfig()
 *   callback that the caller supplies — the library never persists the key.
 *
 * ============================================================================
 * 3. PERMISSION JUSTIFICATION (manifest.json)
 * ============================================================================
 * - "storage" — Required for chrome.storage.local (settings, progress, saved
 *   items with AI data) and chrome.storage.sync (non-sensitive settings).
 * - "contextMenus" — Required for the right-click context menu to save
 *   selected text and trigger AI explain actions on any webpage.
 * - "activeTab" — Grants temporary tab access when the user clicks the
 *   toolbar icon (popup) or uses a context menu item. Used to:
 *     - Send messages to the active tab (content scripts)
 *     - Read the current tab's URL and title for saving
 *   This is more privacy-preserving than the broader "tabs" permission.
 * - "<all_urls>" in host_permissions — Required because the content script
 *   must run on any webpage the user visits, so they can collect learning
 *   material from any website. Content scripts are isolated from the page
 *   (world: ISOLATED) and only execute in response to user actions.
 *
 * REMOVED permissions (from earlier drafts):
 * - "scripting" — Not used. All script injection is via manifest-declared
 *   content scripts, not programmatic chrome.scripting.executeScript.
 * - "tabs" — Not needed. activeTab covers tab access during user-invoked
 *   actions. Popup uses chrome.tabs.query({active:true, currentWindow:true})
 *   which works with activeTab when the popup is opened.
 * - "web_accessible_resources" — Not needed. No content script or web page
 *   loads extension resources. Popup/options pages access their own assets
 *   natively.
 *
 * ============================================================================
 * 4. CONTENT SCRIPT ISOLATION
 * ============================================================================
 * - All content scripts run in ISOLATED world ("world": "ISOLATED").
 * - They cannot be accessed by the host page's JavaScript.
 * - They create their own DOM elements (panels, toolbars) that are styled
 *   independently via inline styles (no external CSS loaded).
 * - Style injection uses unique prefixed IDs to avoid collision.
 * - Event listeners are added to the injected DOM only, not the page's
 *   elements (except document-level listeners for selection detection).
 * - The MutationObserver in videoHelper.ts only watches for URL changes
 *   on YouTube — it does not read or exfiltrate page content.
 *
 * ============================================================================
 * 5. MANIFEST V3 COMPLIANCE
 * ============================================================================
 * - manifest_version: 3 ✓
 * - Background service worker (type: module) ✓
 * - Host permissions in separate "host_permissions" key ✓
 * - Content scripts use ISOLATED world ✓
 * - No remote code / eval() — bundled with esbuild and Vite ✓
 * - No chrome.scripting.executeScript with arbitrary code ✓
 * - Minimum Chrome version: 88 (MV3 baseline) ✓
 *
 * ============================================================================
 * 6. PRIVACY CONSIDERATIONS
 * ============================================================================
 * - The Settings page contains a clear "Your Data Stays Local" privacy notice.
 * - Users can export/delete all data at any time from the Settings page.
 * - Dictionary results are cached in memory (Map) to reduce AI API calls;
 *   cache is cleared on extension reload. No persistent cache of AI responses.
 * - The video helper badge on YouTube only sends the video title/URL to the
 *   background script (for storage in the popup) — it does not access or
 *   transmit the video content or comments.
 *
 * ============================================================================
 * 7. CONSOLE ERRORS & WARNINGS CHECK
 * ============================================================================
 * - All content script panels are created with controlled mounting/cleanup
 *   sequences to avoid orphaned elements.
 * - Toast elements are removed before new ones are created.
 * - chrome.storage errors are caught silently with fallback defaults.
 * - All fetch() calls to AI APIs have try/catch with user-friendly error
 *   messages (no raw exception exposure).
 * - Zod schemas validate all extension-internal data before storage.
 */

export {} // Module-scoped to prevent TypeScript global pollution
