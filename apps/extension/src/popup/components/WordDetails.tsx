import { useState } from 'react'
import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { speakText } from '../services/textToSpeech'

interface WordDetailsProps {
  entry: ExtensionVocabEntry
  onBack: () => void
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  learning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  reviewing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  mastered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

function PronounceButton({ word }: { word: string }) {
  const [playing, setPlaying] = useState(false)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setPlaying(true)
        speakText(word, {
          rate: 0.85,
          lang: 'en-US',
          onEnd: () => setPlaying(false),
          onError: () => setPlaying(false),
        })
      }}
      title={`Pronounce "${word}"`}
      aria-label={`Listen to pronunciation of ${word}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: playing ? 'var(--color-primary-light)' : 'var(--color-surface)',
        color: playing ? 'var(--color-primary)' : 'var(--color-muted)',
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
        flexShrink: 0,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        if (!playing) (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'
      }}
      onMouseLeave={e => {
        if (!playing) (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
      </svg>
    </button>
  )
}

export default function WordDetails({ entry, onBack }: WordDetailsProps) {
  return (
    <div style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            color: 'var(--color-text-secondary)',
          }}
          aria-label="Back"
        >
          ←
        </button>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
          Word Details
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {entry.word}
          </h2>
          <PronounceButton word={entry.word} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {entry.partOfSpeech && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              {entry.partOfSpeech}
            </span>
          )}
          {entry.pronunciation && (
            <span style={{
              fontSize: '13px',
              color: 'var(--color-muted)',
              fontFamily: 'monospace',
            }}>
              /{entry.pronunciation}/
            </span>
          )}
          {entry.difficulty && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: entry.difficulty === 'hard' ? 'var(--color-danger-light)' :
                entry.difficulty === 'easy' ? 'var(--color-success-light)' : 'var(--color-surface-alt)',
              color: entry.difficulty === 'hard' ? 'var(--color-danger)' :
                entry.difficulty === 'easy' ? 'var(--color-success)' : 'var(--color-text-secondary)',
              fontSize: '11px',
              fontWeight: 500,
            }}>
              {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
            </span>
          )}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[entry.status] || ''}`}>
            {entry.status}
          </span>
          {entry.topic && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--color-surface-alt)',
              color: 'var(--color-text-secondary)',
              fontSize: '11px',
              fontWeight: 500,
            }}>
              #{entry.topic}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {entry.meaning && (
            <DetailSection title="Meaning">
              <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                {entry.meaning}
              </p>
            </DetailSection>
          )}

          {entry.meaningVi && (
            <DetailSection title="Vietnamese Meaning">
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {entry.meaningVi}
              </p>
            </DetailSection>
          )}

          {entry.exampleSentence && (
            <DetailSection title="Example">
              <div style={{
                padding: '10px 12px',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--color-primary)',
                fontSize: '13px',
                color: 'var(--color-text)',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}>
                "{entry.exampleSentence}"
              </div>
            </DetailSection>
          )}

          {entry.synonyms.length > 0 && (
            <DetailSection title="Synonyms">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {entry.synonyms.map((s, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--color-success-light)',
                    color: 'var(--color-success)',
                    fontSize: '12px',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {entry.antonyms.length > 0 && (
            <DetailSection title="Antonyms">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {entry.antonyms.map((a, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    fontSize: '12px',
                  }}>
                    {a}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {entry.wordFamily.length > 0 && (
            <DetailSection title="Word Family">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {entry.wordFamily.map((wf, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#f3e8ff',
                    color: '#7c3aed',
                    fontSize: '12px',
                  }}>
                    {wf}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {entry.collocations.length > 0 && (
            <DetailSection title="Collocations">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {entry.collocations.map((c, i) => (
                  <div key={i} style={{
                    padding: '4px 8px',
                    background: 'var(--color-surface)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                  }}>
                    {c}
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {entry.sourceSentence && (
            <DetailSection title="Source Sentence">
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                "{entry.sourceSentence}"
              </p>
            </DetailSection>
          )}

          {entry.personalNote && (
            <DetailSection title="Personal Note">
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                {entry.personalNote}
              </p>
            </DetailSection>
          )}

          {entry.tags.length > 0 && (
            <DetailSection title="Tags">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {entry.tags.map((tag, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {entry.pageTitle && (
            <DetailSection title="Source">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <div>{entry.pageTitle}</div>
                {entry.pageUrl && (
                  <a
                    href={entry.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      fontSize: '11px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {entry.pageUrl}
                  </a>
                )}
              </div>
            </DetailSection>
          )}
        </div>

        <div style={{
          marginTop: '16px',
          padding: '8px 0',
          borderTop: '1px solid var(--color-border)',
          fontSize: '11px',
          color: 'var(--color-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>Added: {new Date(entry.createdAt).toLocaleDateString()}</span>
          {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
            <span>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--color-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: '0 0 6px',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
