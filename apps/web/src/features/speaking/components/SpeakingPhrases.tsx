import { useState } from 'react'
import type { SpeakingPhrase } from '../types'

interface SpeakingPhrasesProps {
  isOpen: boolean
  onClose: () => void
  phrases: SpeakingPhrase[]
  savedPhrases: string[]
  onToggleSave: (phrase: string) => void
}

const CATEGORIES = [
  { key: 'opinion', label: 'Giving Opinions', icon: '💭' },
  { key: 'comparing', label: 'Comparing', icon: '⚖️' },
  { key: 'examples', label: 'Giving Examples', icon: '📋' },
  { key: 'speculating', label: 'Speculating', icon: '🔮' },
  { key: 'agreeing', label: 'Agreeing', icon: '👍' },
  { key: 'disagreeing', label: 'Disagreeing', icon: '🤔' },
  { key: 'conclusion', label: 'Conclusion', icon: '🏁' },
  { key: 'clarifying', label: 'Clarifying', icon: '💡' },
]

export default function SpeakingPhrases({
  isOpen,
  onClose,
  phrases,
  savedPhrases,
  onToggleSave,
}: SpeakingPhrasesProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  if (!isOpen) return null

  const filtered = phrases
    .map(group => ({
      ...group,
      phrases: group.phrases.filter(p =>
        !search.trim() || p.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(group => group.phrases.length > 0)

  return (
    <>
      <div
        className="fixed inset-0 z-[500] bg-black/40 transition-opacity"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-[600] flex h-full w-full max-w-md flex-col bg-[var(--color-surface)] shadow-2xl transition-transform"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Speaking Phrases
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface-alt)]"
            aria-label="Close phrases panel"
          >
            <svg className="h-5 w-5" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b p-4" style={{ borderColor: 'var(--color-border)' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search phrases..."
            className="w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface-alt)',
              color: 'var(--color-text)',
            }}
            aria-label="Search phrases"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {savedPhrases.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Bookmarked ({savedPhrases.length})
              </h3>
              <div className="space-y-1.5">
                {savedPhrases.map((phrase, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary-light)' }}
                  >
                    <span style={{ color: 'var(--color-text)' }}>{phrase}</span>
                    <button
                      onClick={() => onToggleSave(phrase)}
                      className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-red-100"
                      aria-label={`Remove ${phrase} from bookmarks`}
                    >
                      <svg className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtered.map((group) => (
            <div key={group.category} className="mb-4">
              <button
                onClick={() => setActiveCategory(activeCategory === group.category ? null : group.category)}
                className="mb-2 flex w-full items-center justify-between text-left"
              >
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  {group.category}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                  {group.phrases.length}
                </span>
              </button>
              <div className="space-y-1.5">
                {group.phrases.map((phrase, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <span style={{ color: 'var(--color-text)' }}>{phrase}</span>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(phrase)
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-blue-100"
                        title="Copy to clipboard"
                      >
                        <svg className="h-3.5 w-3.5" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onToggleSave(phrase)}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-blue-100"
                        title={savedPhrases.includes(phrase) ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill={savedPhrases.includes(phrase) ? 'var(--color-primary)' : 'none'}
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
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                No phrases found
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                Try a different search term.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
