import { useEffect, useState } from 'react'
import { formatTime } from '../utils/tokenizeTranscript'

interface SentenceExplanationData {
  simpleMeaning: string
  translation?: string
  sentenceStructure: string
  grammarPoints: Array<{ name: string; explanation: string; sourceText?: string }>
  vocabulary: Array<{ word: string; meaningInContext: string }>
  listeningNotes: string[]
  simplifiedVersion: string
  academicAlternative?: string
  practiceQuestion?: { prompt: string; answer: string }
}

export function SentenceExplanationPanel({ sentence, startTime, onClose, onSeek }: {
  sentence: string
  startTime: number
  onClose: () => void
  onSeek: (time: number) => void
}) {
  const [explanation, setExplanation] = useState<SentenceExplanationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      if (event.data?.type === 'SENTENCE_EXPLANATION') {
        const payload = event.data.payload as SentenceExplanationData | { error: string }
        if ('error' in payload) {
          setError((payload as { error: string }).error)
        } else {
          setExplanation(payload as SentenceExplanationData)
        }
        setLoading(false)
      }
    }
    window.addEventListener('message', handler)
    window.parent.postMessage(
      { source: 'ielts-youtube-learning', type: 'EXPLAIN_SENTENCE', payload: { sentence, startTime } },
      '*',
    )
    return () => window.removeEventListener('message', handler)
  }, [sentence, startTime])

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--color-background)', zIndex: 10,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }} role="dialog" aria-label="Sentence explanation">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Sentence Explanation
        </span>
        <button onClick={onClose} style={{ border: 'none', background: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }} aria-label="Close">&times;</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-md)' }}>
        {loading && <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>Generating explanation...</div>}
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: 'var(--spacing-md)' }}>{error}</div>}
        {explanation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-xs)', background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid var(--color-primary)', fontSize: 'var(--text-xs)' }}>
              {sentence}
            </div>
            <Section title="Simple Meaning">{explanation.simpleMeaning}</Section>
            {explanation.translation && <Section title="Translation">{explanation.translation}</Section>}
            <Section title="Sentence Structure">{explanation.sentenceStructure}</Section>
            {explanation.grammarPoints.length > 0 && (
              <div><div style={{ color: 'var(--color-muted)', fontSize: '10px', marginBottom: '4px' }}>Grammar</div>
                {explanation.grammarPoints.map((g, i) => (
                  <div key={i} style={{ padding: '6px 8px', marginBottom: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px' }}>{g.name}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>{g.explanation}</div>
                    {g.sourceText && <div style={{ color: 'var(--color-muted)', fontStyle: 'italic', marginTop: '2px' }}>"{g.sourceText}"</div>}
                  </div>
                ))}
              </div>
            )}
            {explanation.vocabulary.length > 0 && (
              <div><div style={{ color: 'var(--color-muted)', fontSize: '10px', marginBottom: '4px' }}>Key Vocabulary</div>
                {explanation.vocabulary.map((v, i) => (
                  <div key={i} style={{ padding: '4px 8px', marginBottom: '2px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{v.word}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{v.meaningInContext}</span>
                  </div>
                ))}
              </div>
            )}
            {explanation.listeningNotes.length > 0 && (
              <div><div style={{ color: 'var(--color-muted)', fontSize: '10px', marginBottom: '4px' }}>Listening Tips</div>
                {explanation.listeningNotes.map((n, i) => (
                  <div key={i} style={{ padding: '4px 8px', marginBottom: '2px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>• {n}</div>
                ))}
              </div>
            )}
            <Section title="Simplified Version">{explanation.simplifiedVersion}</Section>
            {explanation.academicAlternative && <Section title="IELTS Version">{explanation.academicAlternative}</Section>}
            {explanation.practiceQuestion && (
              <div style={{ padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-xs)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ color: 'var(--color-warning)', fontSize: '10px', marginBottom: '4px', fontWeight: 600 }}>Practice Question</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', marginBottom: '6px' }}>{explanation.practiceQuestion.prompt}</div>
                <details>
                  <summary style={{ fontSize: '11px', color: 'var(--color-primary)', cursor: 'pointer' }}>Show answer</summary>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{explanation.practiceQuestion.answer}</div>
                </details>
              </div>
            )}
            <button onClick={() => onSeek(startTime)} style={{
              padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--color-border)',
              background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-sans)',
            }}>Jump to {formatTime(startTime)}</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: 'var(--color-muted)', fontSize: '10px', marginBottom: '2px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{children}</div>
    </div>
  )
}


