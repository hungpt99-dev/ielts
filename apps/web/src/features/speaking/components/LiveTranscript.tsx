import { useEffect, useRef, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

interface LiveTranscriptProps {
  transcript: string
  editable?: boolean
  onEdit?: (text: string) => void
  highlights?: {
    fillers?: boolean
    repetitions?: boolean
    longPauses?: boolean
  }
  timestamps?: boolean
}

const FILLER_WORDS = /\b(um|uh|er|ah|like|you know|i mean|sort of|kind of|basically|actually|literally|honestly|right|okay|so)\b/gi
const COMMON_REPETITIONS = /\b(\w+)\s+\1\b/gi

export default function LiveTranscript({
  transcript,
  editable = false,
  onEdit,
  highlights = { fillers: true, repetitions: true },
  timestamps = false,
}: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(transcript)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  useEffect(() => {
    setEditValue(transcript)
  }, [transcript])

  function handleSaveEdit() {
    setIsEditing(false)
    onEdit?.(editValue)
  }

  function renderHighlightedText(text: string) {
    if (!text) return null

    const lines = text.split('\n').filter(Boolean)
    const segments: { text: string; isFiller?: boolean; isRepeated?: boolean; isLineBreak?: true }[] = []

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]

      const matches: { index: number; length: number; type: 'filler' | 'repeated' }[] = []

      if (highlights.fillers) {
        const regex = new RegExp(FILLER_WORDS.source, 'gi')
        let m
        while ((m = regex.exec(line)) !== null) {
          matches.push({ index: m.index, length: m[0].length, type: 'filler' })
        }
      }

      if (highlights.repetitions) {
        const regex = new RegExp(COMMON_REPETITIONS.source, 'gi')
        let m
        while ((m = regex.exec(line)) !== null) {
          matches.push({ index: m.index, length: m[0].length, type: 'repeated' })
        }
      }

      matches.sort((a, b) => a.index - b.index)

      let pos = 0
      for (const match of matches) {
        if (match.index > pos) {
          segments.push({ text: line.slice(pos, match.index) })
        }
        segments.push({
          text: line.slice(match.index, match.index + match.length),
          isFiller: match.type === 'filler',
          isRepeated: match.type === 'repeated',
        })
        pos = match.index + match.length
      }
      if (pos < line.length) {
        segments.push({ text: line.slice(pos) })
      }
      if (li < lines.length - 1) {
        segments.push({ text: '', isLineBreak: true })
      }
    }

    return segments.map((seg, i) => {
      if (seg.isLineBreak) return <br key={`br-${i}`} />
      let style: React.CSSProperties = {}
      if (seg.isFiller) {
        style = {
          backgroundColor: 'var(--color-warning-light)',
          color: 'var(--color-warning-dark)',
          borderBottom: '2px dotted var(--color-warning)',
          borderRadius: '2px',
          padding: '0 1px',
        }
      } else if (seg.isRepeated) {
        style = {
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger-dark)',
          borderBottom: '2px dotted var(--color-danger)',
          borderRadius: '2px',
          padding: '0 1px',
        }
      }
      return (
        <span key={i} style={style}>
          {seg.text}
        </span>
      )
    })
  }

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  const fillerCount = transcript.trim() ? (transcript.match(FILLER_WORDS) || []).length : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Transcript</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {wordCount} words
            </span>
            {fillerCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: 'var(--color-warning-light)',
                  color: 'var(--color-warning-dark)',
                }}
              >
                {fillerCount} filler{fillerCount > 1 ? 's' : ''}
              </span>
            )}
            {editable && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium transition-colors hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              rows={10}
              className="w-full rounded-xl border px-4 py-3 text-sm leading-relaxed transition-colors focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontFamily: 'Georgia, serif',
              }}
              aria-label="Edit transcript"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} size="sm">Save</Button>
              <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditValue(transcript) }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="max-h-64 overflow-y-auto rounded-xl border p-4 text-sm leading-relaxed"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: 'Georgia, serif',
            }}
          >
            {transcript.trim() ? (
              <p>{renderHighlightedText(transcript)}</p>
            ) : (
              <p className="italic" style={{ color: 'var(--color-muted)' }}>
                {editable
                  ? 'Start speaking and your words will appear here in real time...'
                  : 'No transcript available.'}
              </p>
            )}
          </div>
        )}

        {timestamps && transcript.trim() && (
          <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: 'var(--color-muted)' }}>
            <span>Recording started at {new Date().toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
