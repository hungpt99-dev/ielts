import type { RoadmapData } from '../roadmapService'
import PageHeader from '../../../components/layout/PageHeader'
import { IconStudyPlan } from '@ielts/ui'

interface RoadmapHeaderProps {
  roadmap: RoadmapData
  profile: {
    targetBand: number
    currentBand: number
    examDate: string
    dailyStudyMinutes: number
    weakSkills: string[]
    studyGoal: string
  } | null
  onScrollToToday: () => void
  onAskAITutor: () => void
}

function getExamCountdown(examDate: string): number {
  const exam = new Date(examDate.slice(0, 10) + 'T00:00:00.000Z')
  if (isNaN(exam.getTime())) return 0
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diff = exam.getTime() - today.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function RoadmapHeader({ roadmap, profile, onScrollToToday, onAskAITutor }: RoadmapHeaderProps) {
  const examCountdown = profile?.examDate ? getExamCountdown(profile.examDate) : 0
  const bandGap = profile ? profile.targetBand - profile.currentBand : 0
  const currentPhase = roadmap.phases[roadmap.currentPhaseIndex]
  const weeksRemaining = roadmap.phases.slice(roadmap.currentPhaseIndex)
    .reduce((sum, p) => sum + p.weeks.filter(w => !w.isComplete).length, 0)

  const isComplete = roadmap.overallProgress >= 100

  function getExamUrgencyColor(): string {
    if (examCountdown <= 14) return 'var(--color-danger)'
    if (examCountdown <= 30) return 'var(--color-warning)'
    return 'var(--color-success)'
  }

  return (
    <section className="space-y-4" aria-label="Roadmap overview">
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <PageHeader
          icon={<IconStudyPlan size={22} />}
          title="Your IELTS Journey"
          description={profile ? `From Band ${profile.currentBand} → Band ${profile.targetBand}${bandGap > 0 ? ` · ${bandGap.toFixed(1)} band gap` : ''} · ${roadmap.phases.length} phases` : undefined}
          badge={isComplete ? (
            <div
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-success-light)',
                color: 'var(--color-success)',
              }}
            >
              <span>🎉</span>
              <span>Journey Complete!</span>
            </div>
          ) : undefined}
        />

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Overall Progress
              </span>
              <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                {roadmap.overallProgress}%
              </span>
            </div>
            <div
              className="relative h-3 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--color-surface-alt)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${roadmap.overallProgress}%`,
                  background: roadmap.overallProgress >= 100
                    ? 'var(--color-success)'
                    : `linear-gradient(90deg, var(--color-primary), var(--color-primary-light))`,
                }}
                role="progressbar"
                aria-valuenow={roadmap.overallProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall roadmap progress"
              />
              {[25, 50, 75].map(marker => (
                <div
                  key={marker}
                  className="absolute top-0 h-full w-0.5"
                  style={{
                    left: `${marker}%`,
                    backgroundColor: 'var(--color-border)',
                    opacity: roadmap.overallProgress >= marker ? 0 : 0.5,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
              <span>{roadmap.completedTasks} of {roadmap.totalTasks} tasks completed</span>
              <span>{weeksRemaining} weeks remaining</span>
            </div>
          </div>

          {!isComplete && currentPhase && (
            <div
              className="flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              <span>📍</span>
              <span className="font-medium">
                You are here: {currentPhase.name} · Week {roadmap.currentWeekIndex + 1}
              </span>
              <span className="text-xs opacity-75">
                · {currentPhase.completedTasks}/{currentPhase.totalTasks} tasks
              </span>
            </div>
          )}

          {profile?.examDate && examCountdown > 0 && (
            <div className="flex items-center gap-2 text-sm" style={{ color: getExamUrgencyColor() }}>
              <span>📅</span>
              <span className="font-medium">
                Exam: {formatDate(profile.examDate)} ({examCountdown} days away)
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={onScrollToToday}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:brightness-95 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 13 12 18 17 13" />
              <polyline points="7 6 12 11 17 6" />
            </svg>
            Scroll to Today
          </button>
          <button
            onClick={onAskAITutor}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:brightness-95 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-tutor-accent-light)',
              color: 'var(--color-tutor-accent)',
              border: '1px solid var(--color-tutor-border)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Ask AI Tutor about Plan
          </button>
        </div>
      </div>
    </section>
  )
}
