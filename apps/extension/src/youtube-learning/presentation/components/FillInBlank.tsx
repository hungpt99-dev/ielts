import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeWord, formatTime } from '../utils/tokenizeTranscript'

interface BlankSegment {
  id: string
  textBefore: string
  textAfter: string
  answer: string
  normalizedAnswer: string
  startTime: number
}

type Phase = 'loading' | 'ready' | 'playing' | 'answering' | 'submitted'

export function FillInBlankPanel({ videoId, sendToParent, onClose }: {
  videoId: string
  sendToParent: (type: string, payload?: unknown) => void
  onClose: () => void
}) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [items, setItems] = useState<BlankSegment[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const sectionStart = 0
  const sectionEnd = 45

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      if (event.data?.type === 'TRANSCRIPT_DATA') {
        const segments = event.data.payload as Array<{ id: string; start: number; end: number; text: string }> | undefined
        if (!segments || segments.length === 0) {
          setError('No transcript available')
          setPhase('ready')
          return
        }
        const section = segments.filter(s => s.start >= sectionStart && s.end <= sectionEnd)
        if (section.length < 3) {
          setError('Not enough transcript content for this section')
          setPhase('ready')
          return
        }
        const blanked: BlankSegment[] = []
        const taken = new Set<string>()
        for (const seg of section) {
          const words = seg.text.split(/\s+/).filter(w => w.length > 3)
          if (words.length === 0) continue
          const pick = words[Math.floor(Math.random() * words.length)]
          const norm = normalizeWord(pick)
          if (!norm || taken.has(norm) || norm.length < 3) continue
          taken.add(norm)
          const idx = seg.text.indexOf(pick)
          if (idx === -1) continue
          blanked.push({
            id: `fb-${seg.id}-${blanked.length}`,
            textBefore: seg.text.slice(0, idx).trim(),
            textAfter: seg.text.slice(idx + pick.length).trim(),
            answer: pick,
            normalizedAnswer: norm,
            startTime: seg.start,
          })
          if (blanked.length >= 8) break
        }
        setItems(blanked)
        setPhase('ready')
      }
    }
    window.addEventListener('message', handler)
    sendToParent('REQUEST_TRANSCRIPT')
    return () => window.removeEventListener('message', handler)
  }, [videoId, sendToParent])

  useEffect(() => {
    sendToParent('ENTER_EXERCISE_MODE')
    return () => { sendToParent('EXIT_EXERCISE_MODE') }
  }, [sendToParent])

  const handleStart = useCallback(() => {
    setPhase('playing')
    sendToParent('SEEK_TO', sectionStart)
  }, [sendToParent])

  const handleStartAnswering = useCallback(() => {
    setPhase('answering')
  }, [])

  const handleCheck = useCallback(() => {
    const res: Record<string, boolean> = {}
    for (const item of items) {
      const userNorm = normalizeWord(answers[item.id] || '')
      res[item.id] = userNorm === item.normalizedAnswer
    }
    setResults(res)
    setPhase('submitted')
  }, [items, answers])

  const score = useMemo(() => {
    if (phase !== 'submitted') return null
    const correct = Object.values(results).filter(Boolean).length
    return { correct, total: items.length, pct: Math.round((correct / items.length) * 100) }
  }, [phase, results, items.length])

  const btnPrimary: React.CSSProperties = { padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'var(--color-on-primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-sans)' }
  const btnOutline: React.CSSProperties = { ...btnPrimary, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }
  const container: React.CSSProperties = { height: '100%', padding: 'var(--spacing-md)', overflow: 'auto' }

  if (phase === 'loading') {
    return <div style={container}><div style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px', padding: '32px' }}>Loading transcript...</div></div>
  }

  if (error) {
    return (
      <div style={container}>
        <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{error}</div>
        <button onClick={onClose} style={btnPrimary}>Back</button>
      </div>
    )
  }

  if (phase === 'ready') {
    return (
      <div style={{ ...container, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
        <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-text)', marginBottom: '4px' }}>Fill in the Blank</div>
        <div style={{ fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: '20px', maxWidth: '280px' }}>
          Listen to the first {sectionEnd}s of the video, then type the missing words.
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'left', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}><span style={{ color: '#818cf8', fontWeight: 600 }}>1.</span><span>Listen to the video section carefully</span></div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}><span style={{ color: '#818cf8', fontWeight: 600 }}>2.</span><span>Fill in {items.length} missing words from memory</span></div>
          <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#818cf8', fontWeight: 600 }}>3.</span><span>Check your answers with timestamps</span></div>
        </div>
        <button onClick={handleStart} style={btnPrimary}>Start Listening</button>
        <button onClick={onClose} style={{ ...btnOutline, marginTop: '8px' }}>Cancel</button>
      </div>
    )
  }

  if (phase === 'playing') {
    return (
      <div style={{ ...container, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Playing 0:00 – 0:45...</div>
        <button onClick={handleStartAnswering} style={btnPrimary}>I'm done — show blanks</button>
      </div>
    )
  }

  if (phase === 'answering' && items.length === 0) {
    return (
      <div style={container}>
        <div style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px', padding: '32px' }}>No blanks generated for this section.</div>
        <button onClick={onClose} style={btnPrimary}>Back</button>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>Fill in the Blank</div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{items.length} blanks · Type from memory</div>
        </div>
        {phase === 'answering' && <button onClick={handleCheck} disabled={Object.keys(answers).length === 0} style={{ ...btnPrimary, fontSize: '13px', padding: '6px 16px', opacity: Object.keys(answers).length === 0 ? 0.5 : 1 }}>Check</button>}
      </div>

      {score && (
        <div style={{ textAlign: 'center', padding: '12px', marginBottom: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: score.pct >= 80 ? 'var(--color-success)' : score.pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
            {score.correct}/{score.total}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{score.pct}% accuracy</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
            <button onClick={() => { setPhase('answering'); setAnswers({}); setResults({}) }} style={btnOutline}>Try Again</button>
            <button onClick={onClose} style={btnOutline}>Close</button>
          </div>
        </div>
      )}

      {items.map((item, i) => {
        const isCorrect = phase === 'submitted' ? results[item.id] : undefined
        return (
          <div key={item.id} style={{
            padding: '10px 12px', marginBottom: '8px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            borderLeft: `3px solid ${phase === 'submitted' ? (isCorrect ? 'var(--color-success)' : 'var(--color-danger)') : 'transparent'}`,
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {item.textBefore}{' '}
              <span style={{ display: 'inline-block', minWidth: '80px', borderBottom: phase === 'submitted' ? (isCorrect ? '2px solid var(--color-success)' : '2px solid var(--color-danger)') : '2px dashed var(--color-primary)', padding: '0 4px' }}>
                {phase === 'submitted' ? (
                  <span style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {answers[item.id] || '___'}
                    {!isCorrect && <span style={{ color: 'var(--color-muted)', marginLeft: '4px' }}>({item.answer})</span>}
                  </span>
                ) : (
                  <input
                    value={answers[item.id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="..."
                    style={{ border: 'none', background: 'transparent', color: 'var(--color-primary)', fontSize: '12px', outline: 'none', fontFamily: 'var(--font-sans)', width: Math.max(60, item.answer.length * 10) }}
                    autoFocus={i === 0}
                    aria-label={`Blank ${i + 1}`}
                    onKeyDown={e => { if (e.key === 'Enter' && i === items.length - 1) handleCheck() }}
                  />
                )}
              </span>
              {' '}{item.textAfter}
            </div>
            <button onClick={() => sendToParent('SEEK_TO', item.startTime)} style={{ border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '10px', padding: '2px 0', marginTop: '4px' }}>
              ⏵ {formatTime(item.startTime)}
            </button>
          </div>
        )
      })}

      {phase === 'answering' && items.length > 0 && (
        <button onClick={handleCheck} disabled={Object.keys(answers).length === 0} style={{ ...btnPrimary, width: '100%', marginTop: '4px', opacity: Object.keys(answers).length === 0 ? 0.5 : 1 }}>
          Check Answers
        </button>
      )}
    </div>
  )
}

function fmt(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
