# Bidirectional Real-Time Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every data save in the extension immediately appears in the web app, and vice versa, with reactive UI updates.

**Architecture:** A shared `DataSyncBridge` in `@ielts/storage` defines a generic CRUD message protocol over `window.postMessage`. Each side (extension, web app) has a `SyncManager` that hooks into all save operations to push changes and listens for incoming changes to save locally. A lightweight `DataChangeEvent` system notifies UI components to refresh.

**Tech Stack:** TypeScript, IndexedDB, chrome.storage.local, postMessage, Dexie, Repository pattern

---

### Task 1: Shared data sync protocol

**Files:**
- Modify: `packages/storage/src/syncService.ts`

- [ ] **Step 1: Add entity types and sync message types**

Add to `packages/storage/src/syncService.ts`:

```typescript
export const SYNC_ENTITY_TYPES = [
  'vocabulary',
  'article',
  'mistake',
  'video',
  'learningEntry',
  'dailyProgress',
] as const
export type SyncEntityType = typeof SYNC_ENTITY_TYPES[number]

export const SYNC_OPERATIONS = ['created', 'updated', 'deleted'] as const
export type SyncOperation = typeof SYNC_OPERATIONS[number]

export interface DataSyncPayload {
  entityType: SyncEntityType
  operation: SyncOperation
  entityId: string
  entity: Record<string, unknown>
  timestamp: string
}

export const DATA_SYNC_ACTION = 'DATA_CHANGED'

export function isDataSyncMessage(data: unknown): data is { source: 'ielts-extension' | 'ielts-page'; action: typeof DATA_SYNC_ACTION; data: DataSyncPayload } {
  if (!data || typeof data !== 'object') return false
  const msg = data as Record<string, unknown>
  if (msg.source !== 'ielts-extension' && msg.source !== 'ielts-page') return false
  if (msg.action !== DATA_SYNC_ACTION) return false
  if (!msg.data || typeof msg.data !== 'object') return false
  const payload = msg.data as Record<string, unknown>
  return (
    typeof payload.entityType === 'string' &&
    SYNC_ENTITY_TYPES.includes(payload.entityType as SyncEntityType) &&
    typeof payload.operation === 'string' &&
    SYNC_OPERATIONS.includes(payload.operation as SyncOperation) &&
    typeof payload.entityId === 'string' &&
    typeof payload.entity === 'object' &&
    typeof payload.timestamp === 'string'
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/storage/src/syncService.ts
git commit -m "feat: add shared data sync protocol types and validation"
```

---

### Task 2: Extension SyncManager — outbound push

**Files:**
- Create: `apps/extension/src/services/syncManager.ts`

- [ ] **Step 1: Create extension SyncManager**

Create `apps/extension/src/services/syncManager.ts`:

```typescript
import { DATA_SYNC_ACTION, isDataSyncMessage, type DataSyncPayload, type SyncEntityType, type SyncOperation } from '@ielts/storage'

const BRIDGE_SOURCE = 'ielts-extension'

function postToPage(payload: DataSyncPayload): void {
  try {
    window.postMessage(
      { source: BRIDGE_SOURCE, action: DATA_SYNC_ACTION, data: payload },
      window.location.origin,
    )
  } catch {
    // content script may not be on the web app page
  }
}

function postToBackground(payload: DataSyncPayload): void {
  try {
    chrome.runtime.sendMessage({ type: 'DATA_SYNC', payload }).catch(() => {})
  } catch {
    // popup context may not have runtime
  }
}

export function pushSync(entityType: SyncEntityType, operation: SyncOperation, entityId: string, entity: Record<string, unknown>): void {
  const payload: DataSyncPayload = {
    entityType,
    operation,
    entityId,
    entity,
    timestamp: new Date().toISOString(),
  }
  postToPage(payload)
  postToBackground(payload)
}

// Inbound handler (receives from web app via content script bridge)

const inboundHandlers: Array<(payload: DataSyncPayload) => void> = []

export function onDataSync(handler: (payload: DataSyncPayload) => void): () => void {
  inboundHandlers.push(handler)
  return () => {
    const idx = inboundHandlers.indexOf(handler)
    if (idx >= 0) inboundHandlers.splice(idx, 1)
  }
}

export function initSyncListener(): void {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (!isDataSyncMessage(event.data)) return
    if (event.data.source === 'ielts-extension') return // ignore self

    for (const handler of inboundHandlers) {
      try { handler(event.data.data) } catch { /* skip bad handler */ }
    }
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/extension/src/services/syncManager.ts
git commit -m "feat: add extension SyncManager for outbound push and inbound listen"
```

---

### Task 3: Hook extension saves into SyncManager

**Files:**
- Modify: `apps/extension/src/popup/components/SaveTextForm.tsx`
- Modify: `apps/extension/src/popup/components/VocabularyCollector.tsx`
- Modify: `apps/extension/src/popup/components/ArticleCollector.tsx`
- Modify: `apps/extension/src/popup/components/VideoHelper.tsx`
- Modify: `apps/extension/src/popup/components/MistakeNotebook.tsx`
- Modify: `apps/extension/src/background/messaging.ts`

- [ ] **Step 1: Import and call pushSync after each save**

For each component, after the save completes, push a sync message. Example pattern for `VocabularyCollector.tsx`:

```typescript
import { pushSync } from '../../services/syncManager'

// After saveVocabularyEntry succeeds:
pushSync('vocabulary', 'created', savedEntry.id, savedEntry as unknown as Record<string, unknown>)
```

Map of entity types:
| Component | Entity Type | Entity |
|---|---|---|
| SaveTextForm | `vocabulary` (if vocab), `article` (if reading+long), `learningEntry` (always) | savedEntry |
| VocabularyCollector | `vocabulary` | savedEntry |
| ArticleCollector | `article` | savedEntry |
| VideoHelper | `video`, `vocabulary` (each word) | savedEntry |
| MistakeNotebook | `mistake` | savedEntry |
| background/messaging.ts | `vocabulary` or `learningEntry` | savedEntry |

Wrap each pushSync call in a try/catch to avoid breaking the save flow. Only push on successful save (after the IndexedDB write resolves).

- [ ] **Step 2: Commit**

```bash
git add apps/extension/src/popup/components/SaveTextForm.tsx apps/extension/src/popup/components/VocabularyCollector.tsx apps/extension/src/popup/components/ArticleCollector.tsx apps/extension/src/popup/components/VideoHelper.tsx apps/extension/src/popup/components/MistakeNotebook.tsx apps/extension/src/popup/src/background/messaging.ts
git commit -m "feat: hook extension save operations into SyncManager push"
```

---

### Task 4: Extension background inbound handler

**Files:**
- Modify: `apps/extension/src/background/messaging.ts`

- [ ] **Step 1: Handle incoming DATA_SYNC messages in background**

In `apps/extension/src/background/messaging.ts`, add a handler for `DATA_SYNC` messages that routes to the appropriate store:

```typescript
import type { DataSyncPayload } from '@ielts/storage'
import { saveVocabularyEntry } from '../storage/vocabularyStore'
import { saveArticleEntry } from '../storage/articleStore'
import { saveVideoEntry } from '../storage/videoStore'
import { saveMistakeEntry } from '../storage/mistakeStore'
import { saveEntry } from '../storage/indexedDB'

async function handleDataSync(payload: DataSyncPayload): Promise<void> {
  try {
    switch (payload.entityType) {
      case 'vocabulary':
        await saveVocabularyEntry(payload.entity as any)
        break
      case 'article':
        await saveArticleEntry(payload.entity as any)
        break
      case 'video':
        await saveVideoEntry(payload.entity as any)
        break
      case 'mistake':
        await saveMistakeEntry(payload.entity as any)
        break
      case 'learningEntry':
        await saveEntry(payload.entity as unknown as any)
        break
    }
  } catch (err) {
    console.error('[DataSync] Failed to save:', payload.entityType, err)
  }
}
```

Register it in the message listener alongside existing handlers.

- [ ] **Step 2: Commit**

```bash
git add apps/extension/src/background/messaging.ts
git commit -m "feat: handle incoming DATA_SYNC in extension background"
```

---

### Task 5: Web app DataSyncManager — receiver

**Files:**
- Create: `apps/web/src/services/storage/DataSyncManager.ts`

- [ ] **Step 1: Create web app DataSyncManager**

```typescript
import { DATA_SYNC_ACTION, isDataSyncMessage, type DataSyncPayload, type SyncEntityType } from '@ielts/storage'
import { DatabaseService } from './Database'

type DataChangeCallback = (entityType: SyncEntityType, operation: string, entityId: string) => void

const listeners = new Set<DataChangeCallback>()

export function onDataChange(cb: DataChangeCallback): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notifyListeners(entityType: SyncEntityType, operation: string, entityId: string): void {
  for (const cb of listeners) {
    try { cb(entityType, operation, entityId) } catch { /* skip */ }
  }
}

async function saveToDatabase(payload: DataSyncPayload): Promise<void> {
  const { entityType, operation, entity } = payload
  if (operation === 'deleted') return // deletes handled separately

  switch (entityType) {
    case 'vocabulary':
      await DatabaseService.addVocabulary(entity as any)
      break
    case 'article':
      await DatabaseService.add('readingPassages', entity)
      break
    case 'mistake':
      await DatabaseService.addMistake(entity as any)
      break
    case 'video':
      await DatabaseService.add('listeningTranscripts', entity)
      break
    case 'learningEntry':
      // Learning entries are tracked via the event system, skip direct save
      break
    case 'dailyProgress':
      // Daily progress is computed, not synced directly
      break
  }
}

function handleDataSync(payload: DataSyncPayload): void {
  saveToDatabase(payload).then(() => {
    notifyListeners(payload.entityType, payload.operation, payload.entityId)
  }).catch(err => {
    console.error('[DataSync] Save failed:', err)
  })
}

let initialized = false

export function initDataSyncManager(): void {
  if (initialized) return
  initialized = true

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (!isDataSyncMessage(event.data)) return
    if (event.data.source === 'ielts-page') return // ignore self

    handleDataSync(event.data.data)
  })
}
```

- [ ] **Step 2: Initialize in SettingsContext or App.tsx**

In `apps/web/src/App.tsx`, add:
```typescript
import { initDataSyncManager } from './services/storage/DataSyncManager'

// Inside useEffect alongside initProactiveTutor:
initDataSyncManager()
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/storage/DataSyncManager.ts apps/web/src/App.tsx
git commit -m "feat: add web app DataSyncManager to receive and persist extension data"
```

---

### Task 6: Web app outbound push hook

**Files:**
- Modify: `apps/web/src/services/storage/DataSyncManager.ts`

- [ ] **Step 1: Add pushSync function to DataSyncManager**

```typescript
const BRIDGE_SOURCE = 'ielts-page'

export function pushDataSync(entityType: SyncEntityType, operation: SyncOperation, entityId: string, entity: Record<string, unknown>): void {
  const payload: DataSyncPayload = {
    entityType,
    operation,
    entityId,
    entity,
    timestamp: new Date().toISOString(),
  }
  try {
    window.postMessage(
      { source: BRIDGE_SOURCE, action: DATA_SYNC_ACTION, data: payload },
      window.location.origin,
    )
  } catch {
    // extension may not be present
  }
}
```

- [ ] **Step 2: Hook into DatabaseService add operations**

In `apps/web/src/services/storage/Database.ts`, after successful saves in `addVocabulary`, `addMistake`, etc., call `pushDataSync`. Add after each `safeAdd` call:

```typescript
import { pushDataSync } from './DataSyncManager'

// Inside addVocabulary:
const result = await safeAdd('vocabulary', entry)
pushDataSync('vocabulary', 'created', result.id, result as unknown as Record<string, unknown>)
return result
```

Target methods: `addVocabulary`, `addMistake`, `addReadingPassage`, `addListeningTranscript`, etc.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/storage/DataSyncManager.ts apps/web/src/services/storage/Database.ts
git commit -m "feat: add web app outbound push on data save"
```

---

### Task 7: UI reactivity — data change events

**Files:**
- Create: `apps/web/src/hooks/useDataRefresh.ts`
- Modify: `apps/web/src/features/dashboard/Dashboard.tsx`

- [ ] **Step 1: Create useDataRefresh hook**

```typescript
import { useEffect, useCallback, useState } from 'react'
import { onDataChange, type SyncEntityType } from '../services/storage/DataSyncManager'

interface RefreshState {
  version: number
  changedTypes: Set<SyncEntityType>
}

export function useDataRefresh(): { refreshKey: number; refresh: () => void } {
  const [state, setState] = useState<RefreshState>({ version: 0, changedTypes: new Set() })

  useEffect(() => {
    return onDataChange((entityType) => {
      setState(prev => {
        const next = new Set(prev.changedTypes)
        next.add(entityType)
        return { version: prev.version + 1, changedTypes: next }
      })
    })
  }, [])

  const refresh = useCallback(() => {
    setState(prev => ({ version: prev.version + 1, changedTypes: new Set() }))
  }, [])

  return { refreshKey: state.version, refresh }
}
```

- [ ] **Step 2: Update Dashboard to use refreshKey**

In `apps/web/src/features/dashboard/Dashboard.tsx`:

```typescript
const { refreshKey } = useDataRefresh()

// Pass refreshKey as dependency to loadDashboardData or useDashboard
const { data, loading, error, refresh } = useDashboard()
```

The `useDashboard` hook or `loadDashboardData` should re-run when `refreshKey` changes (add it as a dependency to the useEffect that loads data).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useDataRefresh.ts apps/web/src/features/dashboard/Dashboard.tsx
git commit -m "feat: add useDataRefresh hook and wire into Dashboard for live updates"
```

---

### Task 8: Content script bridge forwarding

**Files:**
- Modify: `apps/extension/src/content-script/bridge-client.ts` or create forwarding in content script

- [ ] **Step 1: Forward DATA_CHANGED from background to page**

The extension background receives `DATA_SYNC` messages from the popup (via `chrome.runtime.sendMessage`). It needs to forward them to all tabs via the content script bridge.

In `apps/extension/src/background/messaging.ts`, add a forwarder:

```typescript
// When handling DATA_SYNC from popup:
chrome.tabs.query({}, (tabs) => {
  for (const tab of tabs) {
    if (!tab.id) continue
    chrome.tabs.sendMessage(tab.id, { type: 'FORWARD_DATA_SYNC', payload }).catch(() => {})
  }
})
```

In the content script listener, handle `FORWARD_DATA_SYNC` by posting to the page:

```typescript
// In content script message listener:
if (message.type === 'FORWARD_DATA_SYNC') {
  window.postMessage(
    { source: 'ielts-extension', action: DATA_SYNC_ACTION, data: message.payload },
    window.location.origin,
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/extension/src/background/messaging.ts apps/extension/src/content-script/
git commit -m "feat: forward DATA_SYNC from background to page via content script"
```

---

### Task 9: Initialize sync on both sides

**Files:**
- Modify: `apps/extension/src/popup/App.tsx`
- Modify: `apps/extension/src/content-script/index.ts`

- [ ] **Step 1: Initialize inbound listener in extension content script**

In `apps/extension/src/content-script/index.ts`, add:
```typescript
import { initSyncListener } from '../services/syncManager'

initSyncListener()
```

- [ ] **Step 2: Commit**

```bash
git add apps/extension/src/content-script/index.ts
git commit -m "feat: initialize extension sync listener in content script"
```

---

### Task 10: Verify and test

- [ ] **Step 1: Run type check**

```bash
cd apps/extension && npx tsc --noEmit 2>&1 | head -30
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 2: Run lint**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npm run lint 2>&1 | tail -20
```

Fix any issues.

- [ ] **Step 3: Commit final fixes**

```bash
git add -A && git commit -m "fix: type and lint fixes for sync system"
git push
```
