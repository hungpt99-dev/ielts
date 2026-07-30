import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import type { SessionStats } from '../types'

interface SessionSummaryProps {
  stats: SessionStats
  questionTopic: string
  questionText: string
  transcript: string
  improvedAnswer?: string
  audioUrl?: string | null
}

function getBandColor(band: number): string {
  if (band >= 7.5) return 'var(--color-success)'
  if (band >= 6) return 'var(--color-primary)'
  if (band >= 5) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export default function SessionSummary({
  stats,
  questionTopic,
  questionText,
  transcript,
  improvedAnswer,
  audioUrl,
}: SessionSummaryProps) {
  return (
    <div className="space-y-6">
      <Card variant="elevated" padding="lg">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Your Estimated Band
          </p>
          <p
            className="mt-2 text-6xl font-bold"
            style={{ color: getBandColor(stats.bandScore.overall) }}
          >
            {stats.bandScore.overall.toFixed(1)}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            {questionTopic || 'Speaking Practice'}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Duration', value: `${Math.floor(stats.durationSeconds / 60)}:${String(stats.durationSeconds % 60).padStart(2, '0')}`, icon: '⏱' },
          { label: 'Words Spoken', value: stats.wordsSpoken.toString(), icon: '📝' },
          { label: 'Words/Min', value: stats.wordsPerMinute.toString(), icon: '⚡' },
          { label: 'Fillers Used', value: stats.fillersUsed.toString(), icon: '🫧' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent>
              <div className="text-center">
                <span className="text-lg">{stat.icon}</span>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Vocabulary Richness', value: stats.vocabularyRichness },
                { label: 'Grammar Accuracy', value: stats.grammarAccuracy },
                { label: 'Longest Pause', value: `${(stats.longestPause / 1000).toFixed(1)}s` },
              ].map(metric => (
                <div key={metric.label} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{metric.label}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{metric.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="max-h-48 overflow-y-auto rounded-lg border p-3 text-sm leading-relaxed"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-alt)',
                color: 'var(--color-text)',
              }}
            >
              {transcript || 'No transcript recorded.'}
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              Question: {questionText}
            </p>
          </CardContent>
        </Card>
      </div>

      {audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Recording Playback</CardTitle>
          </CardHeader>
          <CardContent>
            <audio
              controls
              src={audioUrl}
              className="w-full"
              style={{ height: '40px' }}
              aria-label="Recording playback"
            />
            <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              Listen to your recording to self-evaluate pronunciation and fluency.
            </p>
          </CardContent>
        </Card>
      )}

      {improvedAnswer && (
        <Card>
          <CardHeader>
            <CardTitle>AI Improved Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-lg border p-4 text-sm leading-relaxed"
              style={{
                borderColor: 'var(--color-success)',
                backgroundColor: 'var(--color-success-light)',
                color: 'var(--color-text)',
              }}
            >
              {improvedAnswer}
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              This is how a higher-band response might sound. Compare it with your version above.
            </p>
          </CardContent>
        </Card>
      )}

      {stats.improvementTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {stats.improvementTips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border p-3"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
