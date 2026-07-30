interface BandVisualizationProps {
  fluency: number
  vocabulary: number
  grammar: number
  pronunciation: number
  coherence: number
}

const BANDS = [
  { key: 'fluency', label: 'Fluency', color: 'var(--color-primary)' },
  { key: 'vocabulary', label: 'Vocabulary', color: 'var(--color-success)' },
  { key: 'grammar', label: 'Grammar', color: 'var(--color-warning)' },
  { key: 'pronunciation', label: 'Pronunciation', color: 'var(--color-skill-speaking)' },
  { key: 'coherence', label: 'Coherence', color: 'var(--color-info)' },
] as const

export default function BandVisualization({
  fluency,
  vocabulary,
  grammar,
  pronunciation,
  coherence,
}: BandVisualizationProps) {
  const scores: Record<string, number> = { fluency, vocabulary, grammar, pronunciation, coherence }
  const maxBand = 9

  return (
    <div className="space-y-4">
      {BANDS.map(band => {
        const score = scores[band.key]
        const percentage = Math.min((score / maxBand) * 100, 100)
        const segments = 9
        return (
          <div key={band.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {band.label}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: band.color }}>
                {score.toFixed(1)}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: segments }, (_, i) => (
                <div
                  key={i}
                  className="h-2 flex-1 rounded-sm transition-all"
                  style={{
                    backgroundColor:
                      i < Math.round((percentage / 100) * segments)
                        ? band.color
                        : 'var(--color-border)',
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
