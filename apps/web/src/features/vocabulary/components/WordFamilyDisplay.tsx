import { useMemo } from 'react'
import PronounceButton from '../../../components/ui/PronounceButton'

interface ParsedWordForm {
  word: string
  pos: string | null
}

interface WordFamilyDisplayProps {
  wordFamily: string[]
  onGenerate?: () => void
  generating?: boolean
}

const POS_ORDER: Record<string, number> = {
  noun: 0,
  verb: 1,
  adjective: 2,
  adverb: 3,
  preposition: 4,
  conjunction: 5,
  determiner: 6,
  pronoun: 7,
}

const POS_COLORS: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  verb: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  adjective: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  adverb: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  preposition: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  conjunction: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
}

function parseFamilyEntry(entry: string): ParsedWordForm {
  const match = entry.match(/^(.+?)\s*\((.+?)\)\s*$/)
  if (match) {
    return { word: match[1].trim(), pos: match[2].trim().toLowerCase() }
  }
  return { word: entry.trim(), pos: null }
}

function formatPosLabel(pos: string | null): string {
  if (!pos) return 'Other'
  return pos.charAt(0).toUpperCase() + pos.slice(1)
}

export default function WordFamilyDisplay({ wordFamily, onGenerate, generating }: WordFamilyDisplayProps) {
  const grouped = useMemo(() => {
    const hasLabels = wordFamily.some(e => /\(.+\)/.test(e))
    if (!hasLabels) {
      return null
    }

    const groups = new Map<string, ParsedWordForm[]>()
    for (const entry of wordFamily) {
      const parsed = parseFamilyEntry(entry)
      const key = parsed.pos || 'other'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(parsed)
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        const orderA = POS_ORDER[a] ?? 99
        const orderB = POS_ORDER[b] ?? 99
        return orderA - orderB
      })
  }, [wordFamily])

  if (wordFamily.length === 0 && !onGenerate) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          Word Forms
        </p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              border: 'none',
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.6 : 1,
            }}
          >
            {generating ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                Generating...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Forms
              </>
            )}
          </button>
        )}
      </div>

      {grouped ? (
        <div className="space-y-3">
          {grouped.map(([pos, forms]) => (
            <div key={pos}>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
                {formatPosLabel(pos)}
              </p>
              <div className="flex flex-wrap gap-2">
                {forms.map((form, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
                    style={{
                      backgroundColor: 'var(--color-surface-alt)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <span className="font-medium">{form.word}</span>
                    <PronounceButton word={form.word} size="sm" />
                    {form.pos && (
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${POS_COLORS[form.pos] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {form.pos}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : wordFamily.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {wordFamily.map((wf, i) => {
            const parsed = parseFamilyEntry(wf)
            return (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text)',
                }}
              >
                <span className="font-medium">{parsed.word}</span>
                <PronounceButton word={parsed.word} size="sm" />
                {parsed.pos && (
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${POS_COLORS[parsed.pos] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {parsed.pos}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          No word forms yet. Click "Generate Forms" to find related word forms.
        </p>
      )}
    </div>
  )
}
