import type { LearningProfile } from '../types/aiTutor.types'
import { IconTarget, IconCalendar, IconStreak, IconTimer, IconVocabulary, IconMistakes, IconProgress, IconStudyPlan } from '@ielts/ui'

interface LearningProfileCardProps {
  profile: LearningProfile
  onSetTargetBand: () => void
  onSetExamDate: () => void
}

export default function LearningProfileCard({ profile, onSetTargetBand, onSetExamDate }: LearningProfileCardProps) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        Learning Profile
      </h2>

      <div className="space-y-2">
        <ProfileRow
          icon={<IconTarget size={14} />}
          label="Target Band"
          value={profile.targetBand || 'Not set'}
          onClick={onSetTargetBand}
          highlight={!!profile.targetBand}
        />
        <ProfileRow
          icon={<IconCalendar size={14} />}
          label="Exam Date"
          value={profile.examDate
            ? `${profile.examDate}${profile.examCountdown > 0 ? ` (${profile.examCountdown}d)` : ''}`
            : 'Not set'}
          onClick={onSetExamDate}
          highlight={!!profile.examDate}
          urgent={profile.examCountdown > 0 && profile.examCountdown <= 30}
        />
      </div>

      <StatGrid profile={profile} />

      <div className="space-y-1.5">
        <InfoLine label="Weak skills" value={profile.weakSkills} />
        <InfoLine label="Daily study" value={profile.dailyStudyMinutes > 0 ? `${profile.dailyStudyMinutes} min` : 'Not set'} />
        <InfoLine label="Roadmap" value={profile.roadmapProgress > 0 ? `${profile.roadmapProgress}% complete` : 'Not started'} />
        <InfoLine label="Vocabulary" value={`${profile.vocabMastered} mastered · ${profile.vocabDueReview} due review · ${profile.savedWords} total`} />
        <InfoLine label="Mistakes to review" value={`${profile.mistakesToReview} unresolved`} />
      </div>
    </div>
  )
}

function ProfileRow({ icon, label, value, onClick, highlight, urgent }: {
  icon: React.ReactNode; label: string; value: string; onClick: () => void; highlight?: boolean; urgent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl p-3 text-left transition-colors hover:opacity-90"
      style={{
        backgroundColor: urgent ? 'var(--color-danger-light)' : 'var(--color-surface-alt)',
        border: urgent ? '1px solid var(--color-danger)' : 'none',
      }}
    >
      <span style={{ color: urgent ? 'var(--color-danger)' : 'var(--color-tutor-accent)' }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{label}</p>
        <p className="text-xs" style={{ color: highlight ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
          {value}
        </p>
      </div>
    </button>
  )
}

function StatGrid({ profile }: { profile: LearningProfile }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {profile.studyStreak > 0 && (
        <MiniStat icon={<IconStreak size={12} />} label="Streak" value={`${profile.studyStreak}d`} />
      )}
      {profile.weeklyTasksTotal > 0 && (
        <MiniStat icon={<IconProgress size={12} />} label="Weekly" value={`${profile.weeklyTasksDone}/${profile.weeklyTasksTotal}`} />
      )}
      {profile.totalStudyHours > 0 && (
        <MiniStat icon={<IconTimer size={12} />} label="Study" value={`${profile.totalStudyHours}h`} />
      )}
      {profile.currentBand > 0 && (
        <MiniStat icon={<IconStudyPlan size={12} />} label="Current" value={`Band ${profile.currentBand}`} />
      )}
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
      <span style={{ color: 'var(--color-tutor-accent)' }}>{icon}</span>
      <div>
        <p className="text-[11px] font-medium" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-[9px]" style={{ color: 'var(--color-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string | number }) {
  return (
    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}:</span> {value}
    </p>
  )
}
