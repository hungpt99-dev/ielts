# Transcript Playback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add segment-by-segment transcript playback with auto-stop, navigation controls (Previous/Next/Play Segment/Continue), and accurate timing for YouTube learning videos.

**Architecture:** A `TranscriptPlaybackController` class runs in the content script context alongside `YouTubePlayerController`, using `requestAnimationFrame` for sub-250ms time checks and `onscroll`/`onplay`/`onpause` event hooks. The React iframe panel sends playback commands via `postMessage`, receives segment index updates, and renders playback toolbar controls.

**Tech Stack:** TypeScript, React (iframe panel), YouTubePlayerController (existing), postMessage bridge, requestAnimationFrame

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `apps/extension/src/youtube-learning/infrastructure/youtube/TranscriptPlaybackController.ts` | **Create** | Playback logic: navigation, auto-stop, mode, cleanup |
| `apps/extension/src/youtube-learning/youtube-learning-content.ts` | **Modify** | Wire controller, add message handlers |
| `apps/extension/src/youtube-learning/App.tsx` | **Modify** | Add playback toolbar UI to TranscriptPanel, handle ACTIVE_SEGMENT messages |
| `apps/extension/src/youtube-learning/schemas/messages.ts` | **Modify** | Add new message types |

---

### Task 1: Define new message types

**Files:**
- Modify: `apps/extension/src/youtube-learning/schemas/messages.ts`

- [ ] **Step 1: Add playback message type constants and schemas**

Add these types to the `contentScriptMessageSchema` union (after the existing `type` patterns around line 40-50):

```typescript
// Add to the type enum values (around line 44):
| 'TRANSCRIPT_PLAY_SEGMENT'
| 'TRANSCRIPT_PREVIOUS'
| 'TRANSCRIPT_NEXT'
| 'TRANSCRIPT_CONTINUE'
| 'TRANSCRIPT_ACTIVE_SEGMENT_INDEX'

// Add payload schemas for each (add before contentScriptMessageSchema):
const playSegmentPayloadSchema = z.object({
  segmentIndex: z.number().int().min(0),
})

const activeSegmentIndexPayloadSchema = z.object({
  activeSegmentIndex: z.number().int().min(0),
})
```

Then update the discriminated union in `contentScriptMessageSchema` to include these types with their schemas. The pattern already exists for types like `TRANSCRIPT_DATA`, `TRANSCRIPT_AVAILABLE`, etc. Add:

```typescript
{ type: z.literal('TRANSCRIPT_PLAY_SEGMENT'), payload: playSegmentPayloadSchema },
{ type: z.literal('TRANSCRIPT_PREVIOUS'), payload: z.number().optional() },
{ type: z.literal('TRANSCRIPT_NEXT'), payload: z.number().optional() },
{ type: z.literal('TRANSCRIPT_CONTINUE'), payload: z.null().optional() },
{ type: z.literal('TRANSCRIPT_ACTIVE_SEGMENT_INDEX'), payload: activeSegmentIndexPayloadSchema },
```

Also add these to the `type` field union in `contentScriptMessageSchema` shape.

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project apps/extension/tsconfig.json 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/extension/src/youtube-learning/schemas/messages.ts
git commit -m "feat: add transcript playback message types"
```

---

### Task 2: Create TranscriptPlaybackController

**Files:**
- Create: `apps/extension/src/youtube-learning/infrastructure/youtube/TranscriptPlaybackController.ts`

- [ ] **Step 1: Create the controller file with full implementation**

```typescript
import type { TranscriptSegmentData } from '../../domain/types'
import type { YouTubePlayerController } from './YouTubePlayerController'

export type PlaybackMode = 'segment' | 'continuous'

export interface TranscriptPlaybackCallbacks {
  onActiveSegmentChange: (index: number) => void
}

export class TranscriptPlaybackController {
  private player: YouTubePlayerController
  private segments: TranscriptSegmentData[] = []
  private activeSegmentIndex = -1
  private mode: PlaybackMode = 'segment'
  private rafId: number | null = null
  private callbacks: TranscriptPlaybackCallbacks
  private lastCheckTime = 0
  private readonly STOP_TOLERANCE_MS = 150

  constructor(
    player: YouTubePlayerController,
    callbacks: TranscriptPlaybackCallbacks,
  ) {
    this.player = player
    this.callbacks = callbacks
  }

  setSegments(segments: TranscriptSegmentData[]): void {
    this.segments = segments
  }

  getActiveSegmentIndex(): number {
    return this.activeSegmentIndex
  }

  setActiveSegmentIndex(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.segments.length - 1))
    if (clamped !== this.activeSegmentIndex) {
      this.activeSegmentIndex = clamped
      this.callbacks.onActiveSegmentChange(clamped)
    }
  }

  playSegment(index?: number): void {
    this.cleanup()
    this.mode = 'segment'

    const idx = index ?? this.activeSegmentIndex
    if (idx < 0 || idx >= this.segments.length) return

    this.setActiveSegmentIndex(idx)
    const segment = this.segments[idx]
    this.player.seek(segment.start)
    this.player.play()
    this.startAutoStop(segment)
  }

  previous(): void {
    if (this.activeSegmentIndex <= 0) return
    this.playSegment(this.activeSegmentIndex - 1)
  }

  next(): void {
    if (this.activeSegmentIndex >= this.segments.length - 1) return
    this.playSegment(this.activeSegmentIndex + 1)
  }

  continuePlayback(): void {
    this.cleanup()
    this.mode = 'continuous'
    const currentTime = this.player.getCurrentTime()
    this.player.play()
    this.lastCheckTime = currentTime

    const idx = this.findSegmentAtTime(currentTime)
    if (idx >= 0) {
      this.setActiveSegmentIndex(idx)
    }
    this.startContinuousTracking()
  }

  togglePlayPause(): void {
    if (this.player.getState().isPlaying) {
      this.cleanup()
      this.player.pause()
    } else {
      if (this.mode === 'segment') {
        const currentSeg = this.segments[this.activeSegmentIndex]
        if (currentSeg) {
          this.playSegment(this.activeSegmentIndex)
        } else {
          this.player.play()
        }
      } else {
        this.continuePlayback()
      }
    }
  }

  disconnect(): void {
    this.cleanup()
    this.segments = []
    this.activeSegmentIndex = -1
  }

  private startAutoStop(segment: TranscriptSegmentData): void {
    const endTime = this.resolveEndTime(segment)
    if (endTime <= segment.start) {
      this.player.play()
      return
    }

    const check = (): void => {
      const currentTime = this.player.getCurrentTime()
      this.lastCheckTime = currentTime

      const activeIdx = this.findSegmentAtTime(currentTime)
      if (activeIdx >= 0 && activeIdx !== this.activeSegmentIndex) {
        this.setActiveSegmentIndex(activeIdx)
      }

      if (currentTime >= endTime - this.STOP_TOLERANCE_MS / 1000) {
        this.player.pause()
        this.rafId = null
        return
      }

      this.rafId = requestAnimationFrame(check)
    }

    this.lastCheckTime = this.player.getCurrentTime()
    this.rafId = requestAnimationFrame(check)
  }

  private startContinuousTracking(): void {
    const track = (): void => {
      const currentTime = this.player.getCurrentTime()
      if (Math.abs(currentTime - this.lastCheckTime) > 0.3) {
        this.lastCheckTime = currentTime
        const idx = this.findSegmentAtTime(currentTime)
        if (idx >= 0 && idx !== this.activeSegmentIndex) {
          this.setActiveSegmentIndex(idx)
        }
      }
      this.rafId = requestAnimationFrame(track)
    }
    this.rafId = requestAnimationFrame(track)
  }

  private resolveEndTime(segment: TranscriptSegmentData): number {
    if (segment.end > segment.start) return segment.end

    const idx = this.segments.findIndex(s => s.id === segment.id)
    if (idx >= 0 && idx < this.segments.length - 1) {
      return this.segments[idx + 1].start
    }

    const duration = this.player.getDuration()
    if (isFinite(duration) && duration > segment.start) return duration

    return segment.start + 5
  }

  private findSegmentAtTime(time: number): number {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i]
      const end = this.resolveEndTime(seg)
      if (time >= seg.start && time < end) return i
    }
    return -1
  }

  private cleanup(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project apps/extension/tsconfig.json 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/extension/src/youtube-learning/infrastructure/youtube/TranscriptPlaybackController.ts
git commit -m "feat: add TranscriptPlaybackController with segment playback, nav, and auto-stop"
```

---

### Task 3: Wire controller in content script

**Files:**
- Modify: `apps/extension/src/youtube-learning/youtube-learning-content.ts`

- [ ] **Step 1: Import TranscriptPlaybackController**

Add near the existing imports at the top of the file (around line 3-15, where other youtube-learning imports live):

```typescript
import { TranscriptPlaybackController } from './infrastructure/youtube/TranscriptPlaybackController'
```

- [ ] **Step 2: Declare controller variable**

Add near other module-level variables (around line 30-45, where `youtubeAdapter`, `focusMode` etc. are declared):

```typescript
let playbackController: TranscriptPlaybackController | null = null
```

- [ ] **Step 3: Initialize controller when YouTube adapter is ready**

Find where `youtubeAdapter = new YouTubeAdapter(...)` is initialized (around line 670-700 in the `initYouTubeLearning()` function). After the adapter is created, add:

```typescript
playbackController = new TranscriptPlaybackController(
  youtubeAdapter.getPlayer(),
  {
    onActiveSegmentChange: (index: number) => {
      postToParent('TRANSCRIPT_ACTIVE_SEGMENT_INDEX', { activeSegmentIndex: index })
    },
  },
)
```

- [ ] **Step 4: Feed segments to controller when transcript loads**

Find the `TRANSCRIPT_DATA` handler (around line 270-340 in `handleTranscriptRequest`). After posting `TRANSCRIPT_DATA` to the panel, add:

```typescript
// Feed segments to playback controller
if (playbackController && result.data.segments) {
  playbackController.setSegments(result.data.segments)
}
```

- [ ] **Step 5: Add message handlers for playback commands**

In the main message switch/case block (around line 100-230), add these new cases:

```typescript
case 'TRANSCRIPT_PLAY_SEGMENT': {
  const index = (payload as { segmentIndex: number })?.segmentIndex
  playbackController?.playSegment(index)
  sessionService?.markUserActive()
  break
}

case 'TRANSCRIPT_PREVIOUS':
  playbackController?.previous()
  sessionService?.markUserActive()
  break

case 'TRANSCRIPT_NEXT':
  playbackController?.next()
  sessionService?.markUserActive()
  break

case 'TRANSCRIPT_CONTINUE':
  playbackController?.continuePlayback()
  sessionService?.markUserActive()
  break
```

- [ ] **Step 6: Clean up controller on disconnect**

Find the cleanup/teardown function (search for `cleanup` or `disconnect` in the `initYouTubeLearning` function). Add:

```typescript
playbackController?.disconnect()
playbackController = null
```

- [ ] **Step 7: Run typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project apps/extension/tsconfig.json 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/extension/src/youtube-learning/youtube-learning-content.ts
git commit -m "feat: wire TranscriptPlaybackController in content script"
```

---

### Task 4: Add playback toolbar UI to TranscriptPanel

**Files:**
- Modify: `apps/extension/src/youtube-learning/App.tsx`

- [ ] **Step 1: Add state variables for playback**

Find the state initialization in `YouTubeLearningApp` (around line 25-45). Add:

```typescript
const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1)
const [playbackMode, setPlaybackMode] = useState<'segment' | 'continuous'>('segment')
```

- [ ] **Step 2: Handle ACTIVE_SEGMENT_INDEX messages**

Find the main message handler (the switch on `e.data.type`, around line 55-180). Add a case:

```typescript
case 'TRANSCRIPT_ACTIVE_SEGMENT_INDEX':
  setActiveSegmentIndex(payload.activeSegmentIndex)
  break
```

- [ ] **Step 3: Add helper function to send playback commands**

Add this helper function in the component, near other `sendToParent` callers:

```typescript
const sendPlaybackCommand = useCallback((command: string, payload?: unknown) => {
  window.parent.postMessage(
    { source: 'ielts-youtube-learning', type: command, payload },
    '*'
  )
}, [])
```

- [ ] **Step 4: Add playback toolbar to TranscriptPanel**

Inside the `TranscriptPanel` component (around line 387), add the toolbar between the translation toolbar and the transcript segments list. The toolbar should only show when `transcriptAvailable` is true.

Find where the translation toolbar ends (the `<div style={{ display: 'flex', ... }}>` with language selector). After it, insert:

```typescript
{/* Playback toolbar */}
{transcriptAvailable && segments.length > 0 && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-surface-alt)',
      border: '1px solid var(--color-border)',
    }}
  >
    <button
      onClick={() => sendPlaybackCommand('TRANSCRIPT_PREVIOUS')}
      disabled={activeSegmentIndex <= 0}
      title="Previous segment"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        backgroundColor: activeSegmentIndex <= 0 ? 'var(--color-surface)' : 'var(--color-surface)',
        color: activeSegmentIndex <= 0 ? 'var(--color-muted)' : 'var(--color-text)',
        cursor: activeSegmentIndex <= 0 ? 'default' : 'pointer',
        fontSize: '14px',
      }}
    >
      ⏮
    </button>

    <button
      onClick={() => sendPlaybackCommand('TRANSCRIPT_PLAY_SEGMENT', { segmentIndex: activeSegmentIndex >= 0 ? activeSegmentIndex : 0 })}
      disabled={activeSegmentIndex < 0}
      title="Play segment"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-primary)',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-on-primary)',
        cursor: activeSegmentIndex < 0 ? 'default' : 'pointer',
        opacity: activeSegmentIndex < 0 ? 0.5 : 1,
        fontSize: '13px',
        fontWeight: 500,
      }}
    >
      ▶ Play Segment
    </button>

    <button
      onClick={() => sendPlaybackCommand('TRANSCRIPT_NEXT')}
      disabled={activeSegmentIndex >= segments.length - 1}
      title="Next segment"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        backgroundColor: activeSegmentIndex >= segments.length - 1 ? 'var(--color-surface)' : 'var(--color-surface)',
        color: activeSegmentIndex >= segments.length - 1 ? 'var(--color-muted)' : 'var(--color-text)',
        cursor: activeSegmentIndex >= segments.length - 1 ? 'default' : 'pointer',
        fontSize: '14px',
      }}
    >
      ⏭
    </button>

    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

    <button
      onClick={() => {
        setPlaybackMode('continuous')
        sendPlaybackCommand('TRANSCRIPT_CONTINUE')
      }}
      title="Continue playback without auto-stop"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
      }}
    >
      ▶ Continue
    </button>
  </div>
)}
```

- [ ] **Step 5: Update active segment highlight to use playback controller's index**

Find where `activeIndex` is computed (around line 443-445):

```typescript
const activeIndex = useMemo(() => {
  return segments.findIndex(s => currentTime >= s.start && currentTime < s.end)
}, [segments, currentTime])
```

Replace with:

```typescript
const activeIndex = useMemo(() => {
  if (activeSegmentIndex >= 0 && activeSegmentIndex < segments.length) {
    return activeSegmentIndex
  }
  return segments.findIndex(s => currentTime >= s.start && currentTime < s.end)
}, [segments, currentTime, activeSegmentIndex])
```

This ensures the highlighted segment follows the playback controller's active index when in segment mode, and falls back to time-based detection in continuous mode.

- [ ] **Step 6: Add auto-scroll for active segment changes**

Find the existing `useEffect` for auto-scroll (around line 494-499). Keep it as-is - it already handles scrolling to `activeIndex`. Since we updated `activeIndex` to use `activeSegmentIndex`, it will now scroll when Previous/Next changes the index.

- [ ] **Step 7: Run typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project apps/extension/tsconfig.json 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/extension/src/youtube-learning/App.tsx
git commit -m "feat: add transcript playback toolbar UI with Previous/Next/PlaySegment/Continue"
```

---

### Task 5: Edge case handling

**Files:**
- Modify: `apps/extension/src/youtube-learning/infrastructure/youtube/TranscriptPlaybackController.ts`

- [ ] **Step 1: Handle user manual pause during segment mode**

In `TranscriptPlaybackController`, add a method that needs to be called when the user manually pauses. Create a `handlePlayerPause` method:

```typescript
handlePlayerPause(): void {
  if (this.mode === 'segment') {
    this.cleanup()
  }
}
```

- [ ] **Step 2: Handle user manual seek during segment mode**

Add `handlePlayerSeek`:

```typescript
handlePlayerSeek(): void {
  if (this.mode === 'segment') {
    this.cleanup()
    this.mode = 'continuous'
  }
}
```

- [ ] **Step 3: Wire pause/seek handlers in content script**

In `youtube-learning-content.ts`, find where `YouTubeAdapter` callbacks are set (its constructor or `onPause`/`onSeek` handlers). Add:

```typescript
// In YouTubeAdapter callback setup:
onPause: () => {
  playbackController?.handlePlayerPause()
},
onSeek: () => {
  playbackController?.handlePlayerSeek()
},
```

- [ ] **Step 4: Handle transcript language change**

In the content script, find where transcript language changes are handled (search for language-related message types). When segments are updated with a new language, call:

```typescript
playbackController?.setSegments(newSegments)
```

- [ ] **Step 5: Handle missing end timestamps in controller**

The `resolveEndTime` method already handles this case (checking `segment.end > segment.start`, falling back to next segment's start, then video duration, then +5s default). No changes needed.

- [ ] **Step 6: Run typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project apps/extension/tsconfig.json 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add apps/extension/src/youtube-learning/infrastructure/youtube/TranscriptPlaybackController.ts apps/extension/src/youtube-learning/youtube-learning-content.ts
git commit -m "feat: handle edge cases - manual pause/seek, language change, missing timestamps"
```

---

## Self-Review

1. **Spec coverage:**
   - ✅ Segment navigation (Previous/Next) — Task 4 toolbar + Task 2 controller methods
   - ✅ Play Segment with auto-stop — Task 2 `playSegment()` + `startAutoStop()`
   - ✅ Continue without auto-stop — Task 2 `continuePlayback()` + `startContinuousTracking()`
   - ✅ Auto Stop Mode (segment vs continuous) — Task 2 `mode` state
   - ✅ Accurate timing with tolerance — Task 2 `STOP_TOLERANCE_MS = 150`
   - ✅ missnig end timestamps — Task 2 `resolveEndTime()`
   - ✅ Player state handling (one timer, cleanup) — Task 2 `cleanup()` + `handlePlayerPause()` + `handlePlayerSeek()`
   - ✅ UI with toolbar — Task 4
   - ✅ Active segment highlight + auto-scroll — Task 4 step 5-6
   - ✅ Edge cases (first/last segment, manual pause, seek, language change) — Task 5
   - ✅ Separate playback logic from UI — Task 2 creates controller, Task 3 wires it
   - ✅ Modular, testable — Controller is pure logic with callbacks, no DOM dependencies beyond player API

2. **Placeholder scan:** No TBD, TODO, or incomplete code. All steps have real code.

3. **Type consistency:**
   - `TranscriptPlaybackController` methods match `App.tsx` sendPlaybackCommand calls
   - Message types in `messages.ts` match message handlers in `youtube-learning-content.ts`
   - `onActiveSegmentChange` callback signature matches `postToParent('TRANSCRIPT_ACTIVE_SEGMENT_INDEX', ...)` payload shape
   - `TranscriptSegmentData` imported from existing `domain/types.ts` — no new types needed
   - `YouTubePlayerController` API matches existing methods (`seek`, `play`, `pause`, `getCurrentTime`, `getDuration`, `getState`)
