import { useState, useCallback, useRef, useEffect } from 'react'
import DateRangeSelector from './DateRangeSelector'
import type { DateRange } from './DateRangeSelector'
import { useProgressReview } from '../hooks/useProgressReview'
import {
  SummarySection,
  StrengthsWeaknessesSection,
  RepeatedMistakesList,
  VocabSection,
  SkillProgressTable,
  RecommendationsList,
  TutorFeedbackCard,
} from './ProgressReviewPanel'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ErrorDisplay from '../../../components/ui/ErrorDisplay'
import { EmptyState } from '@ielts/ui/components/EmptyState'
import { LoadingSkeleton } from '@ielts/ui/components/LoadingSkeleton'
import {
  IconAITutor, IconProgress, IconChevronDown,
} from '@ielts/ui'

type GenerationPhase = 'idle' | 'collecting' | 'analyzing' | 'building' | 'complete'

function GenerationProgress({ phase }: { phase: GenerationPhase }) {
  const steps = [
    { key: 'collecting', label: 'Reading your learning data' },
    { key: 'analyzing', label: 'Analyzing mistake patterns' },
    { key: 'building', label: 'Building your report' },
  ]
  const currentIdx = steps.findIndex(s => s.key === phase)

  return (
    <div
      style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <IconProgress size={20} style={{ color: 'var(--color-tutor-accent)' }} aria-hidden="true" />
        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
          {phase === 'collecting' ? 'Collecting your study data...' :
           phase === 'analyzing' ? 'AI Tutor is analyzing your progress...' :
           phase === 'building' ? 'Building your report...' :
           'Report ready!'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {steps.map((step, i) => {
          const isDone = i < currentIdx
          const isActive = i === currentIdx
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'var(--weight-bold)',
                  background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  color: isDone || isActive ? '#fff' : 'var(--color-muted)',
                  flexShrink: 0,
                }}
              >
                {isDone ? '\u2713' : isActive ? '\u25CF' : (i + 1).toString()}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: isDone ? 'var(--color-success)' : isActive ? 'var(--color-text)' : 'var(--color-muted)',
                  fontWeight: isActive ? 'var(--weight-medium)' : 'var(--weight-normal)',
                }}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
      {phase !== 'idle' && phase !== 'complete' && (
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <div
            style={{
              height: '4px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary)',
                width: `${((currentIdx + 1) / steps.length) * 100}%`,
                transition: 'width var(--transition-slow)',
              }}
            />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 'var(--spacing-xs)', textAlign: 'right' }}>
            This usually takes 5-10 seconds
          </p>
        </div>
      )}
    </div>
  )
}

function ReportSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <LoadingSkeleton variant="card" height="80px" />
      <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: '1fr 1fr' }}>
        <LoadingSkeleton variant="card" height="120px" />
        <LoadingSkeleton variant="card" height="120px" />
      </div>
      <LoadingSkeleton variant="card" height="100px" />
      <LoadingSkeleton variant="chart" height="150px" />
      <LoadingSkeleton variant="card" height="80px" />
    </div>
  )
}

export default function AIReviewSection() {
  const { report, loading, error, generate } = useProgressReview()
  const [expanded, setExpanded] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    }
  })
  const [hasGenerated, setHasGenerated] = useState(false)
  const [genPhase, setGenPhase] = useState<GenerationPhase>('idle')
  const genTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleRangeChange = useCallback((range: DateRange) => {
    setDateRange(range)
  }, [])

  const handleGenerate = useCallback(() => {
    setHasGenerated(true)
    setGenPhase('collecting')
    genTimeoutRef.current = setTimeout(() => setGenPhase('analyzing'), 800)
    setTimeout(() => {
      if (genTimeoutRef.current) setGenPhase('building')
    }, 3000)
    generate(dateRange)
  }, [generate, dateRange])

  const handleRetry = useCallback(() => {
    generate(dateRange)
  }, [generate, dateRange])

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (report && !loading && !error) {
      setGenPhase('complete')
      setTimeout(() => reportRef.current?.focus(), 100)
    }
    if (!loading && !report && error) {
      setGenPhase('idle')
    }
    return () => {
      if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)
    }
  }, [report, loading, error])

  const isAiGenerated = !error || !error.includes('data-driven')

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          width: '100%',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-xl)',
          border: `1px solid ${expanded ? 'var(--color-tutor-border)' : 'var(--color-border-light)'}`,
          background: expanded ? 'var(--color-tutor-background)' : 'var(--color-surface)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-text)',
          transition: 'all 0.2s ease',
        }}
        aria-expanded={expanded}
        aria-controls="ai-review-content"
      >
        <IconAITutor size={20} style={{ color: 'var(--color-tutor-accent)', flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>
          AI Progress Review
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontWeight: 'var(--weight-normal)' }}>
          {hasGenerated ? 'View report' : 'Analyze your learning'}
        </span>
        <IconChevronDown
          size={16}
          style={{
            color: 'var(--color-muted)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      {expanded && (
        <div
          id="ai-review-content"
          style={{
            marginTop: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-md)',
          }}
        >
          {/* Period & Generation Controls */}
          <Card>
            <div style={{ padding: 'var(--spacing-md)' }}>
              <DateRangeSelector value={dateRange} onChange={handleRangeChange} />
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <Button
                  variant="primary"
                  size="md"
                  loading={loading}
                  onClick={handleGenerate}
                  aria-label={hasGenerated ? 'Regenerate progress report for current period' : 'Generate progress report for current period'}
                >
                  {hasGenerated ? 'Regenerate Report' : 'Generate AI Progress Report'}
                </Button>
              </div>
              {dateRange.start && dateRange.end && (
                <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>
                  Analyzing data from {new Date(dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </Card>

          {/* Generation Progress */}
          {loading && genPhase !== 'idle' && genPhase !== 'complete' && (
            <GenerationProgress phase={genPhase} />
          )}

          {/* Loading State */}
          {loading && genPhase === 'idle' && <ReportSkeleton />}

          {/* Error State */}
          {!loading && error && !report && (
            <Card>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <ErrorDisplay
                  variant="card"
                  title="Couldn't Generate Your Review"
                  message={error}
                  onRetry={handleRetry}
                  retryLabel="Try Again"
                />
              </div>
            </Card>
          )}

          {/* Warning when AI failed but fallback exists */}
          {!loading && error && report && (
            <div
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-warning-light)',
                border: '1px solid var(--color-warning)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
              role="alert"
            >
              {error.includes('Failed to parse') ? 'Showing data summary instead of AI-powered analysis.' : error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && !report && !hasGenerated && (
            <Card>
              <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                <EmptyState
                  icon={<IconProgress size={48} />}
                  title="Ready for Your Progress Review?"
                  description="Generate an AI-powered analysis of your recent study data. Your AI Tutor will analyze your practice sessions, vocabulary learning, and mistake patterns to create a personalized progress report."
                  action={
                    <Button variant="primary" size="md" onClick={handleGenerate}>
                      Generate Your First Report
                    </Button>
                  }
                  tip="For the most useful review, we recommend at least 7 days of study with a few practice sessions."
                />
              </div>
            </Card>
          )}

          {/* Report Content */}
          {!loading && report && (
            <div
              ref={reportRef}
              tabIndex={-1}
              className="focus:outline-none"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}
            >
              <SummarySection report={report} isAiGenerated={isAiGenerated && genPhase === 'complete'} />

              <Card>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    Strengths & Weaknesses
                  </h3>
                  <StrengthsWeaknessesSection improvements={report.improvements} struggles={report.struggles} />
                </div>
              </Card>

              <Card>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    Repeated Mistake Patterns
                  </h3>
                  <RepeatedMistakesList mistakes={report.repeatedMistakes} />
                </div>
              </Card>

              <Card>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    Vocabulary Review Status
                  </h3>
                  <VocabSection vocab={report.vocabularyReviewStatus} />
                </div>
              </Card>

              <Card>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    Skill-by-Skill Progress
                  </h3>
                  <SkillProgressTable skills={report.skillProgress} />
                </div>
              </Card>

              <Card>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    Study Plan Adherence
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', lineHeight: '1.7', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {report.studyPlanAdherence}
                  </p>
                </div>
              </Card>

              <Card>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    Recommended Focus for Next Period
                  </h3>
                  <RecommendationsList items={report.recommendedFocus} />
                </div>
              </Card>

              <Card>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    Tutor's Feedback
                  </h3>
                  <TutorFeedbackCard feedback={report.tutorFeedback} />
                </div>
              </Card>

              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-md) 0' }}>
                <Button
                  variant="outline"
                  size="md"
                  loading={loading}
                  onClick={handleRetry}
                >
                  Regenerate Report
                </Button>
              </div>
            </div>
          )}

          {/* No data state */}
          {!loading && !error && !report && hasGenerated && (
            <Card>
              <div style={{ padding: 'var(--spacing-lg)' }}>
                <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
                  No study data found for the selected period. Try a different time range.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
