import type { GrammarCorrection } from '../types'

interface GrammarFeedbackProps {
  corrections: GrammarCorrection[]
}

export default function GrammarFeedback({ corrections }: GrammarFeedbackProps) {
  if (corrections.length === 0) return null

  return (
    <div className="space-y-3">
      {corrections.map((correction, idx) => (
        <div
          key={idx}
          className="space-y-2 rounded-lg border p-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-danger)' }}>
              Original
            </span>
            <p
              className="mt-0.5 rounded-md px-2.5 py-1.5 text-sm leading-relaxed line-through"
              style={{
                color: 'var(--color-danger)',
                backgroundColor: 'var(--color-danger-light)',
              }}
            >
              {correction.original}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <svg className="h-4 w-4" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-success)' }}>
              Corrected
            </span>
            <p
              className="mt-0.5 rounded-md px-2.5 py-1.5 text-sm leading-relaxed"
              style={{
                color: 'var(--color-success)',
                backgroundColor: 'var(--color-success-light)',
              }}
            >
              {correction.corrected}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Explanation
            </span>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {correction.explanation}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
