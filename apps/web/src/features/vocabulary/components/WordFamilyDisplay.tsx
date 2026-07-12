import { useMemo } from 'react'
import PronounceButton from '../../../components/ui/PronounceButton'

interface VerbConjugation {
  base: string
  pastSimple: string
  pastParticiple: string
  presentParticiple: string
  thirdPersonSingular: string
}

interface ParsedWordForm {
  word: string
  pos: string | null
  meaning: string
  pronunciation: string
  verbConjugation?: VerbConjugation
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
  noun: 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]',
  verb: 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]',
  adjective: 'bg-[var(--color-skill-reading-light)] text-[var(--color-skill-reading-dark)]',
  adverb: 'bg-[var(--color-skill-listening-light)] text-[var(--color-skill-listening-dark)]',
  preposition: 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]',
  conjunction: 'bg-[var(--color-info-light)] text-[var(--color-info-dark)]',
}

function isEncodedJson(s: string): boolean {
  return s.startsWith('{') && s.includes('"word"') && s.includes('"pos"')
}

function parseEntry(s: string, word: string): ParsedWordForm {
  if (isEncodedJson(s)) {
    try {
      const parsed = JSON.parse(s)
      if (parsed.word && parsed.pos) {
        const rawVc = parsed.verbConjugation
        const verbConjugation = rawVc && typeof rawVc === 'object' && !Array.isArray(rawVc)
          ? {
              base: String(rawVc.base || ''),
              pastSimple: String(rawVc.pastSimple || ''),
              pastParticiple: String(rawVc.pastParticiple || ''),
              presentParticiple: String(rawVc.presentParticiple || ''),
              thirdPersonSingular: String(rawVc.thirdPersonSingular || ''),
            }
          : undefined
        return {
          word: parsed.word,
          pos: parsed.pos,
          meaning: parsed.meaning || '',
          pronunciation: parsed.pronunciation || '',
          verbConjugation,
        }
      }
    } catch { /* ignore */ }
  }
  const match = s.match(/^(.+?)\s*\((.+?)\)\s*$/)
  if (match) {
    return { word: match[1].trim(), pos: match[2].trim().toLowerCase(), meaning: '', pronunciation: '' }
  }
  return { word: s.trim(), pos: null, meaning: '', pronunciation: '' }
}

function formatPosLabel(pos: string | null): string {
  if (!pos) return 'Other'
  return pos.charAt(0).toUpperCase() + pos.slice(1)
}

export default function WordFamilyDisplay({ wordFamily, onGenerate, generating }: WordFamilyDisplayProps) {
  const hasAnyData = wordFamily.length > 0
  const hasRichData = wordFamily.some(isEncodedJson)

  const grouped = useMemo(() => {
    if (wordFamily.length === 0) return null

    const groups = new Map<string, ParsedWordForm[]>()
    for (const entry of wordFamily) {
      const parsed = parseEntry(entry, entry)
      if (!parsed.pos) continue
      if (!groups.has(parsed.pos)) groups.set(parsed.pos, [])
      groups.get(parsed.pos)!.push(parsed)
    }
    if (groups.size === 0) return null

    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        const orderA = POS_ORDER[a] ?? 99
        const orderB = POS_ORDER[b] ?? 99
        return orderA - orderB
      })
  }, [wordFamily])

  if (!hasAnyData && !onGenerate) return null

  return (
    <div className="w-full">
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
              backgroundColor: generating ? 'transparent' : 'var(--color-primary-light)',
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
                Generate
              </>
            )}
          </button>
        )}
      </div>

      {generating && !hasAnyData && (
        <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Generating word forms...</span>
        </div>
      )}

      {grouped && (
        <div className="space-y-3">
          {grouped.map(([pos, forms]) => (
            <div key={pos}>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
                {formatPosLabel(pos)}
              </p>
              <div className="space-y-2">
                {forms.map((form, i) => (
                  <div
                    key={i}
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: 'var(--color-surface-alt)' }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium break-words" style={{ color: 'var(--color-text)' }}>
                        {form.word}
                      </span>
                      <PronounceButton word={form.word} size="sm" />
                      {form.pos && (
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${POS_COLORS[form.pos] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                          {form.pos}
                        </span>
                      )}
                      {form.pronunciation && (
                        <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                          {form.pronunciation}
                        </span>
                      )}
                    </div>
                    {form.meaning && (
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {form.meaning}
                      </p>
                    )}
                    {form.pos === 'verb' && form.verbConjugation?.base && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          { label: 'V1', value: form.verbConjugation.base },
                          { label: 'V2', value: form.verbConjugation.pastSimple },
                          { label: 'V3', value: form.verbConjugation.pastParticiple },
                          { label: '-ing', value: form.verbConjugation.presentParticiple },
                          { label: '-s', value: form.verbConjugation.thirdPersonSingular },
                        ].filter(f => f.value).map(f => (
                          <span
                            key={f.label}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}
                          >
                            <span style={{ opacity: 0.7 }}>{f.label}</span>
                            <span>{f.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!grouped && hasAnyData && (
        <div className="flex flex-wrap gap-2">
          {wordFamily.map((wf, i) => {
            const parsed = parseEntry(wf, wf)
            return (
              <div
                key={i}
                className="flex flex-col gap-1 rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-surface-alt)' }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium break-words" style={{ color: 'var(--color-text)' }}>
                    {parsed.word}
                  </span>
                  <PronounceButton word={parsed.word} size="sm" />
                  {parsed.pos && (
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${POS_COLORS[parsed.pos] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {parsed.pos}
                    </span>
                  )}
                </div>
                {parsed.meaning && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {parsed.meaning}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!hasAnyData && !generating && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          No word forms yet.
        </p>
      )}
    </div>
  )
}
