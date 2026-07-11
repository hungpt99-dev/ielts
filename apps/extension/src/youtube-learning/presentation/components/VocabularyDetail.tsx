import { useCallback, useEffect, useState } from 'react'
import { formatTime } from '../utils/tokenizeTranscript'

export interface VocabDetailProps {
  word: string
  normalized: string
  sourceSentence: string
  startTime: number
  videoTitle: string
  onClose: () => void
  onSave: (data: VocabSaveData) => void
  onSeek: (time: number) => void
}

export interface VocabSaveData {
  word: string
  normalizedWord: string
  definition: string
  partOfSpeech: string
  pronunciation?: string
  translation?: string
  exampleSentence: string
  sourceSentence: string
  startTime: number
  videoTitle: string
}

interface VocabExplanation {
  word: string
  normalizedWord: string
  lemma: string
  pronunciation?: string
  partOfSpeech: string
  contextualDefinition: string
  translation?: string
  cefrLevel?: string
  ieltsRelevance?: string
  collocations: Array<{ phrase: string; example?: string }>
  synonyms: string[]
  wordFamily: Array<{ word: string; partOfSpeech: string }>
  simpleExample: string
  ieltsExample?: string
  sourceSentence: string
  startTime: number
}

export function VocabularyDetail({
  word,
  normalized,
  sourceSentence,
  startTime,
  videoTitle,
  onClose,
  onSave,
  onSeek,
}: VocabDetailProps) {
  const [explanation, setExplanation] = useState<VocabExplanation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      if (event.data?.type === 'VOCAB_EXPLANATION') {
        const payload = event.data.payload as VocabExplanation | { error: string }
        if ('error' in payload) {
          setError((payload as { error: string }).error)
        } else {
          setExplanation(payload as VocabExplanation)
        }
        setLoading(false)
      }
    }
    window.addEventListener('message', handler)
    window.parent.postMessage(
      { source: 'ielts-youtube-learning', type: 'REQUEST_VOCAB_EXPLANATION', payload: { word, normalized, sentence: sourceSentence, startTime } },
      '*',
    )
    return () => window.removeEventListener('message', handler)
  }, [word, normalized, sourceSentence, startTime])

  const handleSave = useCallback(() => {
    if (!explanation) return
    onSave({
      word: explanation.word,
      normalizedWord: explanation.normalizedWord,
      definition: explanation.contextualDefinition,
      partOfSpeech: explanation.partOfSpeech,
      pronunciation: explanation.pronunciation,
      translation: explanation.translation,
      exampleSentence: explanation.simpleExample,
      sourceSentence: explanation.sourceSentence,
      startTime: explanation.startTime,
      videoTitle,
    })
    setSaved(true)
  }, [explanation, onSave, videoTitle])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-background)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      role="dialog"
      aria-label={`Vocabulary detail for ${word}`}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
          {word}
        </span>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}
          aria-label="Close vocabulary detail"
        >
          &times;
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-md)' }}>
        {loading && (
          <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            Looking up word details...
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: 'var(--spacing-md)' }}>
            {error}
          </div>
        )}

        {explanation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>{explanation.word}</span>
              {explanation.pronunciation && (
                <span style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)' }}>{explanation.pronunciation}</span>
              )}
              <span style={{
                padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 500,
                background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary-hover)',
              }}>
                {explanation.partOfSpeech}
              </span>
              {explanation.cefrLevel && (
                <span style={{
                  padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 500,
                  background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)',
                }}>
                  {explanation.cefrLevel}
                </span>
              )}
              {explanation.ieltsRelevance && (
                <span style={{
                  padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 500,
                  background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)',
                }}>
                  IELTS: {explanation.ieltsRelevance}
                </span>
              )}
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.5, margin: 0 }}>
              {explanation.contextualDefinition}
            </p>

            {explanation.translation && (
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', fontStyle: 'italic', margin: 0 }}>
                {explanation.translation}
              </p>
            )}

            <div style={{
              padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-xs)',
              background: 'rgba(255,255,255,0.03)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
              borderLeft: '2px solid var(--color-primary)',
            }}>
              <div style={{ color: 'var(--color-muted)', fontSize: '10px', marginBottom: '2px' }}>In this video</div>
              {sourceSentence}
            </div>

            {explanation.synonyms.length > 0 && (
              <div>
                <div style={{ color: 'var(--color-muted)', fontSize: '10px', marginBottom: '4px' }}>Synonyms</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {explanation.synonyms.map((s, i) => (
                    <span key={i} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {explanation.collocations.length > 0 && (
              <div>
                <div style={{ color: 'var(--color-muted)', fontSize: '10px', marginBottom: '4px' }}>Common Collocations</div>
                {explanation.collocations.map((c, i) => (
                  <div key={i} style={{ padding: '4px 8px', marginBottom: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontStyle: 'italic' }}>{c.phrase}</span>
                    {c.example && <span style={{ color: 'var(--color-muted)', marginLeft: '4px' }}>— {c.example}</span>}
                  </div>
                ))}
              </div>
            )}

            <div>
              <div style={{ color: 'var(--color-muted)', fontSize: '10px', marginBottom: '4px' }}>Examples</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                <div style={{ padding: '4px 8px', marginBottom: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Simple: </span>{explanation.simpleExample}
                </div>
                {explanation.ieltsExample && (
                  <div style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ color: 'var(--color-muted)' }}>IELTS: </span>{explanation.ieltsExample}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onSeek(startTime)}
              style={{
                padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '11px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Jump to {formatTime(startTime)}
            </button>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-sm) var(--spacing-md)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <button
          onClick={handleSave}
          disabled={!explanation || saved}
          style={{
            flex: 1, padding: '6px 12px', borderRadius: '4px', border: 'none',
            background: saved ? 'rgba(16,185,129,0.2)' : 'var(--color-primary)',
            color: saved ? 'var(--color-success)' : 'var(--color-on-primary)',
            cursor: saved ? 'default' : 'pointer', fontSize: '12px', fontWeight: 500,
            fontFamily: 'var(--font-sans)',
          }}
          aria-label={saved ? 'Word saved' : 'Save word to vocabulary'}
        >
          {saved ? 'Saved' : 'Save Word'}
        </button>
      </div>
    </div>
  )
}


