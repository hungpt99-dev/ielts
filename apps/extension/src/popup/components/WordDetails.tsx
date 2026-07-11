import { useState } from 'react'
import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { speakText } from '../services/textToSpeech'
import { IconVolume, IconBack, IconVocabulary } from '@ielts/ui'

interface WordDetailsProps {
  entry: ExtensionVocabEntry
  onBack: () => void
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  new: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  learning: { bg: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' },
  reviewing: { bg: 'var(--color-skill-reading-light)', color: 'var(--color-skill-reading)' },
  mastered: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
}

const DIFFICULTY_STYLE: Record<string, { bg: string; color: string }> = {
  easy: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
  medium: { bg: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' },
  hard: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
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
        width: 'var(--spacing-xl)',
        height: 'var(--spacing-xl)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: playing ? 'var(--color-primary-light)' : 'var(--color-surface)',
        color: playing ? 'var(--color-primary)' : 'var(--color-muted)',
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
        flexShrink: 0,
        transition: 'var(--transition-fast)',
      }}
      onMouseEnter={e => {
        if (!playing) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-alt)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)' }
      }}
      onMouseLeave={e => {
        if (!playing) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)' }
      }}
    >
      <IconVolume size={14} />
    </button>
  )
}

export default function WordDetails({ entry, onBack }: WordDetailsProps) {
  return (
    <div style={{ minHeight: '500px', display: 'flex', flexDirection: 'column', width: 'var(--ext-width)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'var(--spacing-xl)',
            height: 'var(--spacing-xl)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--spacing-2xs)',
            color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-lg)',
          }}
          aria-label="Back"
        >
          <IconBack size={16} />
        </button>
        <IconVocabulary size={16} style={{ color: 'var(--color-skill-reading)' }} />
        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
          Word Details
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          background: 'var(--color-surface-alt)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border-light)',
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text)',
              margin: 0,
              lineHeight: 1.2,
            }}>
                {entry.word}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
              {entry.partOfSpeech && (
                <span style={{
                  padding: 'var(--spacing-3xs) var(--spacing-xs)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                }}>
                  {entry.partOfSpeech}
                </span>
              )}
              {entry.pronunciation && (
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  /{entry.pronunciation}/
                </span>
              )}
              {entry.difficulty && DIFFICULTY_STYLE[entry.difficulty] && (
                <span style={{
                  padding: 'var(--spacing-3xs) var(--spacing-xs)',
                  borderRadius: 'var(--radius-full)',
                  background: DIFFICULTY_STYLE[entry.difficulty].bg,
                  color: DIFFICULTY_STYLE[entry.difficulty].color,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                }}>
                  {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
                </span>
              )}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--spacing-3xs) var(--spacing-xs)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                background: STATUS_STYLE[entry.status]?.bg || 'var(--color-surface-alt)',
                color: STATUS_STYLE[entry.status]?.color || 'var(--color-text-secondary)',
              }}>
                {entry.status}
              </span>
              {entry.topic && (
                <span style={{
                  padding: 'var(--spacing-3xs) var(--spacing-xs)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-surface-alt)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                }}>
                  #{entry.topic}
                </span>
              )}
            </div>
          </div>
          <PronounceButton word={entry.word} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {entry.meaning && (
            <DetailSection title="Meaning">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                {entry.meaning}
              </p>
            </DetailSection>
          )}

          {entry.translation && (
            <DetailSection title="Translation">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {entry.translation}
              </p>
            </DetailSection>
          )}

          {entry.exampleSentence && (
            <DetailSection title="Example">
              <div style={{
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                borderLeft: '3px solid var(--color-primary)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text)',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}>
                "{entry.exampleSentence}"
              </div>
            </DetailSection>
          )}

          {Array.isArray(entry.synonyms) && entry.synonyms.length > 0 && (
            <DetailSection title="Synonyms">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                {entry.synonyms.map((s, i) => (
                  <span key={i} style={{
                    padding: 'var(--spacing-3xs) var(--spacing-xs)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-success-light)',
                    color: 'var(--color-success)',
                    fontSize: 'var(--text-xs)',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {Array.isArray(entry.antonyms) && entry.antonyms.length > 0 && (
            <DetailSection title="Antonyms">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                {entry.antonyms.map((a, i) => (
                  <span key={i} style={{
                    padding: 'var(--spacing-3xs) var(--spacing-xs)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    fontSize: 'var(--text-xs)',
                  }}>
                    {a}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {Array.isArray(entry.wordFamily) && entry.wordFamily.length > 0 && (
            <DetailSection title="Word Family">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                {entry.wordFamily.map((wf, i) => (
                  <span key={i} style={{
                    padding: 'var(--spacing-3xs) var(--spacing-xs)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    fontSize: 'var(--text-xs)',
                  }}>
                    {wf}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {entry.verbConjugation && entry.verbConjugation.base && (
            <DetailSection title="Verb Conjugation">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                {[
                  { label: 'V1', value: entry.verbConjugation.base },
                  { label: 'V2', value: entry.verbConjugation.pastSimple },
                  { label: 'V3', value: entry.verbConjugation.pastParticiple },
                  { label: '-ing', value: entry.verbConjugation.presentParticiple },
                  { label: '-s', value: entry.verbConjugation.thirdPersonSingular },
                ].filter(f => f.value).map((f, i) => (
                  <span key={i} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: 'var(--spacing-3xs) var(--spacing-xs)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-success-light)',
                    color: 'var(--color-success-dark)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-medium)',
                  }}>
                    <span style={{ opacity: 0.7 }}>{f.label}</span>
                    {f.value}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {Array.isArray(entry.collocations) && entry.collocations.length > 0 && (
            <DetailSection title="Collocations">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
                {entry.collocations.map((c, i) => (
                  <div key={i} style={{
                    padding: 'var(--spacing-2xs) var(--spacing-xs)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-xs)',
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
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                "{entry.sourceSentence}"
              </p>
            </DetailSection>
          )}

          {entry.personalNote && (
            <DetailSection title="Personal Note">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                {entry.personalNote}
              </p>
            </DetailSection>
          )}

          {entry.tags.length > 0 && (
            <DetailSection title="Tags">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
                {entry.tags.map((tag, i) => (
                  <span key={i} style={{
                    padding: 'var(--spacing-3xs) var(--spacing-xs)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-medium)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {entry.pageTitle && (
            <DetailSection title="Source">
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <div>{entry.pageTitle}</div>
                {entry.pageUrl && (
                  <a
                    href={entry.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      fontSize: 'var(--text-xs)',
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
          marginTop: 'var(--spacing-md)',
          padding: 'var(--spacing-xs) 0',
          borderTop: '1px solid var(--color-border)',
          fontSize: 'var(--text-xs)',
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
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--color-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: '0 0 var(--spacing-2xs)',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
