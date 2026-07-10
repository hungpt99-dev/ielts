# Security & Privacy

> Security and privacy considerations for the local-first IELTS Journey application.

---

## 1. Core Principles

| Principle | How It Is Achieved |
|-----------|-------------------|
| **No Backend** | Zero server-side infrastructure. All code runs in the browser. |
| **Data Ownership** | All user data stays in the browser's IndexedDB and localStorage. |
| **No Telemetry** | No analytics scripts, no tracking pixels, no data collection. |
| **User-Controlled AI** | AI features are opt-in, require user-provided API key, and only send explicitly selected text. |
| **Minimal Permissions** | Browser extension requests only the permissions it actually needs. |
| **Transparency** | Users can see, export, and delete all of their data at any time. |

---

## 2. Data Storage Security

### 2.1 IndexedDB

- Data is stored in the browser's IndexedDB, which is **origin-bound** — other websites cannot access it
- IndexedDB data is sandboxed by the browser and cannot be read by other browser extensions or websites
- No encryption is applied at the application layer (IndexedDB inherits the browser's built-in protections)
- On browser data clearing, IndexedDB is deleted along with other site data

### 2.2 localStorage

- App settings (including API key) are stored in localStorage under a single `app-settings` key
- localStorage is also **origin-bound** and sandboxed
- API keys are stored as plain text in localStorage — users are advised not to use shared devices
- Future enhancement: optional encryption of sensitive localStorage values

### 2.3 Chrome Extension Storage

- Extension settings (including AI API key) are stored in `chrome.storage.local`
- API key is stored in `chrome.storage.local` (not `sync` which might be sent to Google's servers)
- Non-sensitive settings use `chrome.storage.sync` for cross-device preference sync

---

## 3. AI API Key Safety

```
┌───────────────────────────────────────────────────────────┐
│  API Key Handling                                          │
│                                                            │
│  1. User enters API key in Settings or Options page        │
│  2. Key is stored ONLY in localStorage/chrome.storage.local│
│  3. Service worker (extension) reads key from storage      │
│  4. Key is included in fetch() header to user-configured   │
│     AI endpoint only                                       │
│  5. Key is NEVER:                                          │
│     • Hard-coded in source code                            │
│     • Sent to any server other than user's AI endpoint     │
│     • Logged or exposed in error messages                  │
│     • Included in export/import backup files               │
│     • Sent in telemetry                                    │
│  6. Content scripts NEVER access the API key               │
└───────────────────────────────────────────────────────────┘
```

### 3.1 Key Validation

When a user configures an API key, the app can optionally test the connection:
1. Read key from storage
2. Send minimal request (ping) to AI endpoint
3. If authentication fails, show error prompting user to check their key
4. If successful, confirm the key is valid
5. The key itself is never displayed in error messages

---

## 4. AI Data Privacy

### 4.1 What Is Sent to AI

Only the text the user explicitly selects or triggers:
- Selected text on a webpage (extension)
- Vocabulary word + optional context (AI enrichment)
- Exercise response (AI feedback)
- Chat message in AI Tutor

### 4.2 What Is NOT Sent

- Full browsing history
- All vocabulary words (only the one being analyzed)
- All study data (only relevant context)
- API key (as part of visible content)
- Personal information not relevant to the query

### 4.3 Opt-In Model

- AI features are **disabled by default**
- User must:
  1. Obtain their own API key from an AI provider
  2. Enter the key in settings
  3. Optionally configure endpoint and model
- Without an API key, all AI features show appropriate fallback UI (e.g., "Configure AI in settings")

---

## 5. Extension Security (Manifest V3)

### 5.1 Permissions

| Permission | Why Needed | Risk |
|------------|------------|------|
| `activeTab` | Read current tab URL/title when user saves content | Low — only on user action |
| `contextMenus` | Add right-click save option | None — single menu item |
| `storage` | Store settings and AI cache | None — local only |
| `alarms` | Daily review reminder check | None — infrequent |
| `scripting` | Inject content scripts | Low — only on user action |
| `host_permissions` | YouTube.com for video helper | Low — URL pattern only |

### 5.2 Content Script Isolation

- Content scripts run in an **isolated world** (Manifest V3 requirement)
- Cannot access page's JavaScript variables or be accessed by page scripts
- Cannot be manipulated by the host page
- The injected bridge script that communicates with the website uses `window.postMessage` with source validation

### 5.3 AI API Key in Extension

The service worker is the only extension component that accesses the AI API key:
```
Content Script:  never sees the key
Popup:          never sees the key
Options Page:   writes key to storage, does not display it
Service Worker: reads key from storage, uses it in API calls
```

---

## 6. Data Export & Deletion

### 6.1 Export

Users can export all their data at any time via:
- **Web app:** Settings → Data Management → Export Backup
- **Extension:** Options page → Export Data
- Export format: Validated JSON with full schema (Zod)
- Export includes all user data EXCEPT the AI API key

### 6.2 Import

Users can import previously exported data:
- File picker accepts `.json` files
- Validate against Zod schema before writing
- Choose between **replace** and **merge** modes
- Dry-run validation available without writing

### 6.3 Deletion

Users can delete all data:
- **Web app:** Settings → Data Management → Clear All Data
- **Extension:** Options page → Clear Extension Data
- Clearing data triggers a confirmation dialog
- Data deletion removes all IndexedDB stores and localStorage keys
- After deletion, the app returns to first-run state

---

## 7. Third-Party Dependencies

All dependencies are open-source libraries that run client-side:

| Dependency | Purpose | Data Access |
|------------|---------|-------------|
| React | UI framework | None |
| Dexie / idb | IndexedDB wrapper | Local DB only |
| Tailwind CSS | Styling | None |
| Recharts | Charts | None |
| Vite | Build tool | Dev only |
| Vitest | Testing | Dev only |
| Zod | Schema validation | None |

No dependency sends data off-device. All network requests are to the user-configured AI API endpoint only.

---

## 8. Privacy-First Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| No backend | Eliminates server-side data storage, breach risk, and compliance overhead |
| No user accounts | No email, password, or personal information collected |
| No cookies | No tracking, no third-party cookies |
| No CDN fonts | Self-hosted to avoid external requests |
| Local-first | Core features work offline without any network |
| Optional AI | AI features require explicit opt-in |
| Open source | Code is inspectable; no obfuscation in extension build |

---

## 9. Recommendations for Users

- Use a dedicated AI API key with usage limits (not your primary key)
- Regularly export backups
- Do not use on shared devices if security is a concern
- Keep your browser updated for the latest IndexedDB and extension security
- Review permissions before installing the extension
