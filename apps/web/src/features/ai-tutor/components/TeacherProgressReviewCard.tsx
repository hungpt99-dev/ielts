import { IconAITutor, IconTarget, IconStreak, IconTimer, IconVocabulary, IconMistakes } from '@ielts/ui'

export interface SkillBreakdown {
  skill: string; accuracy: number; mistakeCount: number; trend: 'improving' | 'declining' | 'stable'; daysSincePractice: number; taskCount: number; isWeak: boolean
}

export interface ProgressReview {
  summary: string; improvements: string[]; struggles: string[]; focusAreas: string[]; streak: number;
  weeklyCompletion: number; totalStudyHours: number; mistakesReviewed: number; vocabLearned: number;
  weakSkills: string[]; examCountdown: number; skillBreakdown: SkillBreakdown[];
  weeklyTasksDone: number; weeklyTasksTotal: number; vocabDueReview: number; vocabMastered: number;
  mistakesUnresolved: number; mistakesRecent: number; todayUnfinished: number; isExamUrgent: boolean;
  skillProgress: { skill: string; status: string; sessions: number; accuracy: number; trend: string; analysis: string }[];
  studyPlanAdherence: string; tutorFeedback: string; generatedAt: string | null;
}

interface TeacherProgressReviewCardProps {
  review: ProgressReview
  onRefresh?: () => void
  refreshing?: boolean
}

function agoLabel(iso: string | null): string | null {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function TeacherProgressReviewCard({ review, onRefresh, refreshing }: TeacherProgressReviewCardProps) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'linear-gradient(135deg, var(--color-tutor-accent-light), var(--color-surface))',
        border: '1px solid var(--color-tutor-border)',
      }}
    >
      <Header onRefresh={onRefresh} refreshing={refreshing} generatedAt={review.generatedAt} />

      <SummaryText text={review.summary} />

      <StatsGrid review={review} />

      {review.skillBreakdown.length > 0 && (
        <SkillBreakdownSection skills={review.skillBreakdown} />
      )}

      {review.improvements.length > 0 && (
        <ListSection title="What improved" color="var(--color-success)" icon="✓" items={review.improvements} />
      )}

      {review.struggles.length > 0 && (
        <ListSection title="What still needs work" color="var(--color-danger)" icon="!" items={review.struggles} />
      )}

      {review.skillProgress.length > 0 && (
        <SkillAnalysisSection skills={review.skillProgress} />
      )}

      {review.studyPlanAdherence && (
        <TipCard title="Study Plan" text={review.studyPlanAdherence} />
      )}

      {review.focusAreas.length > 0 && (
        <ListSection title="Recommended focus" color="var(--color-warning)" icon="→" items={review.focusAreas} />
      )}

      {review.tutorFeedback && (
        <TipCard title="Tutor's Note" text={review.tutorFeedback} />
      )}
    </div>
  )
}

function Header({ onRefresh, refreshing, generatedAt }: { onRefresh?: () => void; refreshing?: boolean; generatedAt?: string | null }) {
  const label = agoLabel(generatedAt ?? null)
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: 'var(--color-tutor-accent)' }}
      >
        <IconAITutor size={18} style={{ color: 'var(--color-on-primary, #fff)' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          Teacher's Progress Review
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {label ? `Analysis from ${label}` : 'AI-powered analysis of your recent performance'}
        </p>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: 'var(--color-tutor-accent)', background: 'none', border: '1px solid var(--color-tutor-border)', cursor: 'pointer' }}
          aria-label={refreshing ? 'Refreshing analysis...' : 'Refresh AI analysis'}
          title="Regenerate AI analysis with latest data"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={refreshing ? 'animate-spin' : ''}
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      )}
    </div>
  )
}

function SummaryText({ text }: { text: string }) {
  return (
    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
      {text}
    </p>
  )
}

function StatsGrid({ review }: { review: ProgressReview }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatBadge icon={<IconStreak size={14} />} label="Streak" value={`${review.streak}d`} highlight={review.streak >= 7} />
      <StatBadge icon={<IconTarget size={14} />} label="Weekly" value={`${review.weeklyCompletion}%`} highlight={review.weeklyCompletion >= 80} />
      <StatBadge icon={<IconTimer size={14} />} label="Study" value={`${review.totalStudyHours}h`} />
      <StatBadge icon={<IconVocabulary size={14} />} label="Words" value={`${review.vocabLearned}`} />
      {review.vocabDueReview > 0 && <StatBadge icon={<IconVocabulary size={14} />} label="Due review" value={`${review.vocabDueReview}`} />}
      {review.mistakesUnresolved > 0 && <StatBadge icon={<IconMistakes size={14} />} label="To review" value={`${review.mistakesUnresolved}`} />}
      {review.todayUnfinished > 0 && <StatBadge icon={<IconTarget size={14} />} label="Unfinished" value={`${review.todayUnfinished}`} />}
      {review.examCountdown > 0 && <StatBadge icon={<IconTimer size={14} />} label="Exam in" value={`${review.examCountdown}d`} highlight={review.isExamUrgent} />}
    </div>
  )
}

function SkillBreakdownSection({ skills }: { skills: SkillBreakdown[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        Skill breakdown
      </p>
      <div className="space-y-1.5">
        {skills.map((s) => <SkillRow key={s.skill} skill={s} />)}
      </div>
    </div>
  )
}

function SkillRow({ skill }: { skill: SkillBreakdown }) {
  const trendColor = skill.trend === 'improving' ? 'var(--color-success)' : skill.trend === 'declining' ? 'var(--color-danger)' : 'var(--color-muted)'

  const trendIcon = skill.trend === 'improving'
    ? <TrendUpSvg />
    : skill.trend === 'declining'
      ? <TrendDownSvg />
      : <MinusSvg />

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
      style={{
        backgroundColor: skill.isWeak ? 'var(--color-danger-light)' : 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{skill.skill}</span>
          {skill.isWeak && (
            <span className="rounded px-1 py-0.5 text-[9px] font-medium" style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-on-danger, #fff)' }}>
              weak
            </span>
          )}
        </div>
      </div>

      <AccuracyBar accuracy={skill.accuracy} />

      <div className="flex items-center gap-1.5 shrink-0">
        {skill.mistakeCount > 0 && (
          <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{skill.mistakeCount} err</span>
        )}
        <span style={{ color: trendColor, display: 'flex' }}>{trendIcon}</span>
      </div>
    </div>
  )
}

function AccuracyBar({ accuracy }: { accuracy: number }) {
  const color = accuracy >= 80 ? 'var(--color-success)' : accuracy >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, accuracy))}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>{accuracy}%</span>
    </div>
  )
}

function SkillAnalysisSection({ skills }: { skills: ProgressReview['skillProgress'] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        AI skill analysis
      </p>
      <div className="space-y-1.5">
        {skills.map((s) => (
          <div key={s.skill} className="rounded-lg px-2.5 py-1.5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{s.skill}</span>
              <span className="text-[10px]" style={{ color: s.status === 'improving' ? 'var(--color-success)' : s.status === 'needs work' ? 'var(--color-danger)' : 'var(--color-muted)' }}>
                {s.status}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {s.analysis}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TipCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <p className="mb-0.5 text-xs font-medium" style={{ color: 'var(--color-tutor-accent)' }}>{title}</p>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
    </div>
  )
}

function StatBadge({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        ...(highlight ? { borderColor: 'var(--color-tutor-accent)' } : {}),
      }}
    >
      <span style={{ color: highlight ? 'var(--color-tutor-accent)' : 'var(--color-muted)' }}>{icon}</span>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function ListSection({ title, color, icon, items }: { title: string; color: string; icon: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium" style={{ color }}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="shrink-0 mt-px" style={{ color }}>{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TrendUpSvg() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function TrendDownSvg() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

function MinusSvg() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
