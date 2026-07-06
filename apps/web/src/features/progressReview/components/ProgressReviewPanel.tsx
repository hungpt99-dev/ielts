import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DateRangeSelector from './DateRangeSelector'
import type { DateRange } from './DateRangeSelector'
import Card, { CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import ErrorDisplay from '../../../components/ui/ErrorDisplay'
import { EmptyState } from '@ielts/ui/components/EmptyState'
import { LoadingSkeleton } from '@ielts/ui/components/LoadingSkeleton'
import { ProgressBar } from '@ielts/ui/components/ProgressBar'
import {
  IconAITutor, IconCheckCircle, IconAlertCircle, IconInfo,
  IconProgress, IconBack, IconAIProgressReview,
} from '@ielts/ui'
import PageHeader from '../../../components/layout/PageHeader'

interface RepeatedMistake {
  pattern: string
  skill: string
  frequency: number
  analysis: string
}

interface VocabReviewStatus {
  summary: string
  totalSaved: number
  mastered: number
  stillLearning: number
  recommendation: string
}

interface SkillProgressItem {
  skill: string
  status: string
  sessions: number
  accuracy: number
  trend: string
  analysis: string
}

export interface ProgressReviewReport {
  overallSummary: string
  improvements: string[]
  struggles: string[]
  repeatedMistakes: RepeatedMistake[]
  vocabularyReviewStatus: VocabReviewStatus
  skillProgress: SkillProgressItem[]
  studyPlanAdherence: string
  recommendedFocus: string[]
  tutorFeedback: string
}

interface ProgressReviewPanelProps {
  report: ProgressReviewReport | null
  loading: boolean
  error: string | null
  onGenerate: (range: DateRange) => void
}

type GenerationPhase = 'idle' | 'collecting' | 'analyzing' | 'building' | 'complete'

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  improving: 'success',
  'needs work': 'warning',
  strong: 'success',
  developing: 'warning',
  stable: 'default',
}

function TrendArrow({ trend }: { trend: string }) {
  const color = trend === 'improving' ? 'var(--color-success)' : trend === 'declining' ? 'var(--color-danger)' : 'var(--color-muted)'
  const arrow = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→'
  return (
    <span style={{ color, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }} aria-label={`Trend: ${trend}`}>
      {arrow}
    </span>
  )
}

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
        boxShadow: 'var(--shadow-sm)',
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
                {isDone ? <IconCheckCircle size={12} /> : isActive ? <IconProgress size={12} /> : (i + 1).toString()}
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

function SummarySection({ report, isAiGenerated }: { report: ProgressReviewReport; isAiGenerated: boolean }) {
  return (
    <div
      style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-tutor-background)',
        border: `1px solid ${isAiGenerated ? 'var(--color-tutor-border)' : 'var(--color-border-light)'}`,
        borderLeft: `4px solid var(--color-tutor-accent)`,
        boxShadow: 'var(--shadow-tutor)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
        <IconAITutor size={20} style={{ color: 'var(--color-tutor-accent)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-tutor-accent)',
              }}
            >
              AI Tutor Says
            </span>
            {isAiGenerated ? (
              <Badge variant="info" size="sm">AI-Powered</Badge>
            ) : (
              <Badge variant="default" size="sm">Data Summary</Badge>
            )}
          </div>
          <p
            style={{
              margin: 'var(--spacing-xs) 0 0',
              fontSize: 'var(--text-sm)',
              lineHeight: '1.7',
              color: 'var(--color-text-secondary)',
            }}
          >
            {report.overallSummary}
          </p>
        </div>
      </div>
    </div>
  )
}

function StrengthsWeaknessesSection({ improvements, struggles }: { improvements: string[]; struggles: string[] }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      <div
        style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          borderLeft: '3px solid var(--color-success)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
          <IconCheckCircle size={16} style={{ color: 'var(--color-success)' }} />
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-success)' }}>
            Strengths & Improvements
          </h3>
        </div>
        {improvements.length === 0 ? (
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
            No significant improvements detected in this period.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }} role="list" aria-label="Improvements">
            {improvements.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                <IconCheckCircle size={14} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div
        style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          borderLeft: '3px solid var(--color-warning)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
          <IconAlertCircle size={16} style={{ color: 'var(--color-warning)' }} />
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-warning)' }}>
            Areas Needing Attention
          </h3>
        </div>
        {struggles.length === 0 ? (
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
            No particular struggles identified.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }} role="list" aria-label="Struggles">
            {struggles.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                <IconAlertCircle size={14} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function RepeatedMistakesList({ mistakes }: { mistakes: RepeatedMistake[] }) {
  if (mistakes.length === 0) {
    return (
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
        No repeated mistakes detected in this period.
      </p>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {mistakes.map((m, i) => (
        <div
          key={i}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-light)',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>
                  "{m.pattern}"
                </span>
                <Badge variant="warning" size="sm">{m.skill}</Badge>
                <Badge variant="danger" size="sm">×{m.frequency}</Badge>
              </div>
              <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {m.analysis}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VocabSection({ vocab }: { vocab: VocabReviewStatus }) {
  const total = vocab.totalSaved || 0
  const mastered = vocab.mastered || 0
  const learning = vocab.stillLearning || 0
  const masteredPercent = total > 0 ? Math.round((mastered / total) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
        <div
          style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-alt)' }}
          aria-label={`Total Saved: ${total}`}
        >
          <p style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{total}</p>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Total Saved</p>
        </div>
        <div
          style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-lg)', background: 'var(--color-success-light)' }}
          aria-label={`Mastered: ${mastered}`}
        >
          <p style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>{mastered}</p>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Mastered</p>
        </div>
        <div
          style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-lg)', background: 'var(--color-warning-light)' }}
          aria-label={`Still Learning: ${learning}`}
        >
          <p style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-warning)' }}>{learning}</p>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Still Learning</p>
        </div>
      </div>
      <div>
        <ProgressBar value={masteredPercent} variant="success" size="sm" showLabel label={`${masteredPercent}% mastered`} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: '2px' }}>
          <span>{masteredPercent}% mastered</span>
          <span>{learning > 0 ? `${Math.round((learning / total) * 100)}% in progress` : ''}</span>
        </div>
      </div>
      <div
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-tutor-background)',
          border: '1px solid var(--color-tutor-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <IconAITutor size={14} style={{ color: 'var(--color-tutor-accent)' }} />
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-tutor-accent)' }}>
            AI Tutor's Vocabulary Tip
          </p>
        </div>
        <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {vocab.recommendation}
        </p>
      </div>
    </div>
  )
}

function SkillProgressTable({ skills }: { skills: SkillProgressItem[] }) {
  if (skills.length === 0) {
    return (
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
        No skill practice recorded in this period.
      </p>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {skills.map((s) => (
        <div key={s.skill} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', textTransform: 'capitalize' }}>
                {s.skill}
              </span>
              <Badge variant={STATUS_BADGE[s.status] ?? 'default'} size="sm">{s.status}</Badge>
              <TrendArrow trend={s.trend} />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
              {s.sessions} session{s.sessions !== 1 ? 's' : ''}
            </span>
          </div>
          <ProgressBar value={s.accuracy} variant={s.trend === 'improving' ? 'success' : s.trend === 'declining' ? 'danger' : 'primary'} size="xs" />
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {s.analysis}
          </p>
        </div>
      ))}
    </div>
  )
}

function RecommendationsList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
        No specific recommendations available.
      </p>
    )
  }
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }} role="list" aria-label="Recommended focus areas">
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
          <span
            style={{
              display: 'flex',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-bold)',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}
          >
            {i + 1}
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', paddingTop: '2px' }}>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function TutorFeedbackCard({ feedback }: { feedback: string }) {
  return (
    <div
      style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-tutor-background)',
        border: '1px solid var(--color-tutor-border)',
        borderLeft: '4px solid var(--color-tutor-accent)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
        <IconInfo size={20} style={{ color: 'var(--color-tutor-accent)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-tutor-accent)' }}>
            AI Tutor's Final Note
          </p>
          <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-sm)', lineHeight: '1.7', color: 'var(--color-text-secondary)' }}>
            {feedback}
          </p>
        </div>
      </div>
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

export default function ProgressReviewPanel({
  report,
  loading,
  error,
  onGenerate,
}: ProgressReviewPanelProps) {
  const navigate = useNavigate()
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
      if (genTimeoutRef.current) {
        setGenPhase('building')
      }
    }, 3000)
    onGenerate(dateRange)
  }, [onGenerate, dateRange])

  const handleRetry = useCallback(() => {
    onGenerate(dateRange)
  }, [onGenerate, dateRange])

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (report && !loading && !error) {
      setGenPhase('complete')
      setTimeout(() => {
        reportRef.current?.focus()
      }, 100)
    }
    if (!loading && !report && error) {
      setGenPhase('idle')
    }
    return () => {
      if (genTimeoutRef.current) {
        clearTimeout(genTimeoutRef.current)
      }
    }
  }, [report, loading, error])

  const isAiGenerated = !error || !error.includes('data-driven')

  return (
    <div
      style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}
      role="region"
      aria-label="AI Progress Review"
    >
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: 'var(--spacing-xs)',
          }}
          aria-label="Go back to previous page"
        >
          <IconBack size={14} />
          Back
        </button>
        <PageHeader
          icon={<IconAIProgressReview size={22} />}
          title="AI Progress Review"
          description="Your personalized learning analysis from your AI Tutor"
        />
      </div>

      {/* Screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading && 'Generating your progress report...'}
        {!loading && !error && report && 'Progress report is ready. Scroll down to view.'}
        {!loading && error && 'Failed to generate report.'}
      </div>

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

      {/* Error State (no report fallback) */}
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

      {/* Warning banner when AI failed but fallback report exists */}
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

      {/* Empty State - No Report Yet */}
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
          {/* Section 1: AI Tutor Summary */}
          <SummarySection report={report} isAiGenerated={isAiGenerated && genPhase === 'complete'} />

          {/* Section 2: Strengths & Weaknesses */}
          <Card>
            <CardHeader>
              <CardTitle>Strengths & Weaknesses</CardTitle>
            </CardHeader>
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
              <StrengthsWeaknessesSection improvements={report.improvements} struggles={report.struggles} />
            </div>
          </Card>

          {/* Section 3: Repeated Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle>Repeated Mistake Patterns</CardTitle>
            </CardHeader>
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
              <RepeatedMistakesList mistakes={report.repeatedMistakes} />
            </div>
          </Card>

          {/* Section 4: Vocabulary Review Status */}
          <Card>
            <CardHeader>
              <CardTitle>Vocabulary Review Status</CardTitle>
            </CardHeader>
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
              <VocabSection vocab={report.vocabularyReviewStatus} />
            </div>
          </Card>

          {/* Section 5: Skill-by-Skill Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Skill-by-Skill Progress</CardTitle>
            </CardHeader>
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
              <SkillProgressTable skills={report.skillProgress} />
            </div>
          </Card>

          {/* Section 6: Study Plan Adherence */}
          <Card>
            <CardHeader>
              <CardTitle>Study Plan Adherence</CardTitle>
            </CardHeader>
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: '1.7', color: 'var(--color-text-secondary)', margin: 0 }}>
                {report.studyPlanAdherence}
              </p>
            </div>
          </Card>

          {/* Section 7: Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Focus for Next Period</CardTitle>
            </CardHeader>
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
              <RecommendationsList items={report.recommendedFocus} />
            </div>
          </Card>

          {/* Section 8: Tutor's Final Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Tutor's Feedback</CardTitle>
            </CardHeader>
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
              <TutorFeedbackCard feedback={report.tutorFeedback} />
            </div>
          </Card>

          {/* Regenerate */}
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

      {/* No data empty state */}
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
  )
}

export { TrendArrow, SummarySection, StrengthsWeaknessesSection, RepeatedMistakesList, VocabSection, SkillProgressTable, RecommendationsList, TutorFeedbackCard }
