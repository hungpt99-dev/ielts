import { useState, useCallback, useRef, useEffect } from 'react'
import DateRangeSelector from './DateRangeSelector'
import type { DateRange } from './DateRangeSelector'
import ReportSection from './ReportSection'
import Card, { CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import ErrorDisplay from '../../../components/ui/ErrorDisplay'

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

const SKILL_ACCENT_COLORS: Record<string, string> = {
  reading: 'var(--color-primary)',
  listening: 'var(--color-success)',
  writing: 'var(--color-warning)',
  speaking: 'var(--color-danger)',
}

const TREND_LABELS: Record<string, { label: string; variant: 'success' | 'danger' | 'default' }> = {
  improving: { label: '↑ Improving', variant: 'success' },
  declining: { label: '↓ Declining', variant: 'danger' },
  stable: { label: '→ Stable', variant: 'default' },
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  improving: 'success',
  'needs work': 'warning',
  strong: 'success',
  'insufficient practice': 'default',
}

function TrendBadge({ trend }: { trend: string }) {
  const info = TREND_LABELS[trend] ?? { label: trend, variant: 'default' as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function RepeatedMistakesCard({ mistakes }: { mistakes: RepeatedMistake[] }) {
  if (mistakes.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        No repeated mistakes detected in this period.
      </p>
    )
  }
  return (
    <ul className="space-y-3" role="list" aria-label="Repeated mistakes">
      {mistakes.map((m, i) => (
        <li
          key={i}
          className="rounded-lg border p-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  "{m.pattern}"
                </span>
                <Badge size="sm" variant="warning">{m.skill}</Badge>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  ×{m.frequency}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {m.analysis}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function SkillProgressSection({ skills }: { skills: SkillProgressItem[] }) {
  if (skills.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        No skill practice recorded in this period.
      </p>
    )
  }
  return (
    <div className="space-y-4">
      {skills.map((s) => (
        <div key={s.skill}>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: SKILL_ACCENT_COLORS[s.skill] ?? 'var(--color-muted)' }}
              />
              <span className="text-sm font-medium capitalize" style={{ color: 'var(--color-text)' }}>
                {s.skill}
              </span>
              <Badge
                size="sm"
                variant={STATUS_VARIANTS[s.status] ?? 'default'}
              >
                {s.status}
              </Badge>
              <TrendBadge trend={s.trend} />
            </div>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {s.sessions} session{s.sessions !== 1 ? 's' : ''}
            </span>
          </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--color-border)' }}
              role="progressbar"
              aria-valuenow={s.accuracy}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${s.skill} accuracy: ${s.accuracy}%`}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${s.accuracy}%`,
                  backgroundColor: SKILL_ACCENT_COLORS[s.skill] ?? 'var(--color-primary)',
                }}
              />
            </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {s.analysis}
            </p>
            <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
              {s.accuracy}% accuracy
            </span>
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
  const learningPercent = total > 0 ? Math.round((learning / total) * 100) : 0

  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {vocab.summary}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: 'var(--color-surface-alt)' }}
          aria-label={`Total Saved: ${total}`}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {total}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Total Saved
          </p>
        </div>
        <div
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: 'var(--color-success-light)' }}
          aria-label={`Mastered: ${mastered}`}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
            {mastered}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Mastered
          </p>
        </div>
        <div
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: 'var(--color-warning-light)' }}
          aria-label={`Still Learning: ${learning}`}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
            {learning}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Still Learning
          </p>
        </div>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--color-border)' }}
        role="progressbar"
        aria-valuenow={masteredPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Vocabulary mastery: ${masteredPercent}%`}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${masteredPercent}%`,
            background: `linear-gradient(90deg, var(--color-success) 0%, var(--color-primary) 100%)`,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
        <span>{masteredPercent}% mastered</span>
        <span>{learningPercent}% in progress</span>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {vocab.recommendation}
      </p>
    </div>
  )
}

function RecommendationsList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        No specific recommendations available.
      </p>
    )
  }
  return (
    <ol className="space-y-2" role="list" aria-label="Recommended focus areas">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            {i + 1}
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function TutorFeedbackCard({ feedback }: { feedback: string }) {
  return (
    <div
      className="rounded-xl border-l-4 p-4 sm:p-5"
      style={{
        borderLeftColor: 'var(--color-primary)',
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ color: 'var(--color-primary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
            AI Tutor Says
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {feedback}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ProgressReviewPanel({
  report,
  loading,
  error,
  onGenerate,
}: ProgressReviewPanelProps) {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    }
  })

  const [hasGenerated, setHasGenerated] = useState(false)

  const handleRangeChange = useCallback((range: DateRange) => {
    setDateRange(range)
  }, [])

  const handleGenerate = useCallback(() => {
    setHasGenerated(true)
    onGenerate(dateRange)
  }, [onGenerate, dateRange])

  const handleRetry = useCallback(() => {
    onGenerate(dateRange)
  }, [onGenerate, dateRange])

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (report && !loading && !error) {
      reportRef.current?.focus()
    }
  }, [report, loading, error])

  return (
    <div className="mx-auto max-w-6xl space-y-6" role="region" aria-label="AI Learning Progress Review">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          AI Learning Progress Review
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Get a detailed analysis of your study progress with personalized tutor feedback.
        </p>
      </div>

      {/* Live region for screen reader announcements */}
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

      {/* Date Range Selector */}
      <Card>
        <CardContent>
          <DateRangeSelector value={dateRange} onChange={handleRangeChange} />
          <div className="mt-4">
            <Button size="md" loading={loading} onClick={handleGenerate}>
              Generate Progress Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner
          size="lg"
          fullPage
          message="Analyzing your study data and generating your personalized progress report..."
        />
      )}

      {/* Error State */}
      {!loading && error && (
        <Card>
          <CardContent>
            <ErrorDisplay
              variant="card"
              title="Failed to Generate Report"
              message={error}
              onRetry={handleRetry}
              retryLabel="Try Again"
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && !report && !hasGenerated && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                className="mb-4 h-16 w-16"
                style={{ color: 'var(--color-muted)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                No Progress Report Yet
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                Select a period and click "Generate Progress Report" to see your AI-powered learning review.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {!loading && !error && report && (
        <div
          ref={reportRef}
          tabIndex={-1}
          className="space-y-6 focus:outline-none"
        >
          {/* Overall Summary */}
          <ReportSection
            title="Overall Learning Summary"
            accentColor="var(--color-primary)"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            }
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {report.overallSummary}
            </p>
          </ReportSection>

          {/* Improvements */}
          <ReportSection
            title="What You Improved"
            accentColor="var(--color-success)"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            {report.improvements.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                No significant improvements detected in this period.
              </p>
            ) : (
              <ul className="space-y-2" role="list" aria-label="Improvements">
                {report.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0" style={{ color: 'var(--color-success)' }} aria-hidden="true">✓</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </ReportSection>

          {/* Struggles */}
          <ReportSection
            title="What You Still Struggle With"
            accentColor="var(--color-danger)"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            }
          >
            {report.struggles.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                No particular struggles identified.
              </p>
            ) : (
              <ul className="space-y-2" role="list" aria-label="Struggles">
                {report.struggles.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0" style={{ color: 'var(--color-danger)' }} aria-hidden="true">!</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </ReportSection>

          {/* Repeated Mistakes */}
          <ReportSection
            title="Repeated Mistakes"
            accentColor="var(--color-warning)"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          >
            <RepeatedMistakesCard mistakes={report.repeatedMistakes} />
          </ReportSection>

          {/* Vocabulary Review Status */}
          <ReportSection
            title="Vocabulary Review Status"
            accentColor="#8b5cf6"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            }
          >
            <VocabSection vocab={report.vocabularyReviewStatus} />
          </ReportSection>

          {/* Skill-by-Skill Progress */}
          <ReportSection
            title="Skill-by-Skill Progress"
            accentColor="var(--color-info)"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          >
            <SkillProgressSection skills={report.skillProgress} />
          </ReportSection>

          {/* Study Plan Adherence */}
          <ReportSection
            title="Study Plan Adherence"
            accentColor="var(--color-info)"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            }
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {report.studyPlanAdherence}
            </p>
          </ReportSection>

          {/* Recommended Focus */}
          <ReportSection
            title="Recommended Focus for Next Period"
            accentColor="var(--color-primary)"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          >
            <RecommendationsList items={report.recommendedFocus} />
          </ReportSection>

          {/* Tutor Feedback */}
          <ReportSection
            title="Tutor's Feedback"
            accentColor="var(--color-primary)"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            }
          >
            <TutorFeedbackCard feedback={report.tutorFeedback} />
          </ReportSection>

          {/* Re-generate */}
          <div className="flex justify-center pb-4">
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
    </div>
  )
}

export { TrendBadge, SkillProgressSection, VocabSection, RepeatedMistakesCard, RecommendationsList, TutorFeedbackCard }
