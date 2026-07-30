import { useState } from 'react'
import Button from '../../../components/ui/Button'
import type { VocabularySuggestion } from '../types'

interface VocabularyPanelProps {
  suggestions: VocabularySuggestion[]
}

const TYPE_LABELS: Record<VocabularySuggestion['type'], string> = {
  basic: 'Basic',
  advanced: 'Advanced',
  idiom: 'Idiom',
  collocation: 'Collocation',
  academic: 'Academic',
}

const TYPE_COLORS: Record<VocabularySuggestion['type'], string> = {
  basic: 'var(--color-muted)',
  advanced: 'var(--color-success)',
  idiom: 'var(--color-warning)',
  collocation: 'var(--color-primary)',
  academic: 'var(--color-skill-reading)',
}

const TYPE_BG_COLORS: Record<VocabularySuggestion['type'], string> = {
  basic: 'var(--color-surface-alt)',
  advanced: 'var(--color-success-light)',
  idiom: 'var(--color-warning-light)',
  collocation: 'var(--color-primary-light)',
  academic: 'var(--color-skill-reading-light)',
}

export default function VocabularyPanel({ suggestions }: VocabularyPanelProps) {
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())

  function toggleSave(word: string) {
    setSavedWords(prev => {
      const next = new Set(prev)
      if (next.has(word)) {
        next.delete(word)
      } else {
        next.add(word)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, idx) => (
        <div
          key={idx}
          className="rounded-lg border p-3 transition-colors"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {suggestion.word}
            </span>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: TYPE_BG_COLORS[suggestion.type],
                  color: TYPE_COLORS[suggestion.type],
                }}
              >
                {TYPE_LABELS[suggestion.type]}
              </span>
              <button
                onClick={() => toggleSave(suggestion.word)}
                className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-primary-light)]"
                aria-label={savedWords.has(suggestion.word) ? 'Remove from notebook' : 'Save to notebook'}
                title="Save to Vocabulary Notebook"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill={savedWords.has(suggestion.word) ? 'var(--color-primary)' : 'none'}
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestion.alternatives.map((alt, i) => (
              <span
                key={i}
                className="rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-blue-50"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {alt}
              </span>
            ))}
          </div>
        </div>
      ))}

      {savedWords.size > 0 && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
            {savedWords.size} word{savedWords.size > 1 ? 's' : ''} saved to Vocabulary Notebook
          </p>
        </div>
      )}
    </div>
  )
}
