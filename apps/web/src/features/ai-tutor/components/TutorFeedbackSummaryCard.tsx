import type { FeedbackSummary } from '../types/aiTutor.types'
import type { ProgressReview } from '../services/teacherProgressReviewService'
import { IconPlay, IconStreak, IconTimer, IconVocabulary, IconMistakes, IconTarget } from '@ielts/ui'

interface TutorFeedbackSummaryCardProps {
  feedback: FeedbackSummary
  progressReview: ProgressReview
  onAction: () => void
}

export default function TutorFeedbackSummaryCard({ feedback, progressReview, onAction }: TutorFeedbackSummaryCardProps) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        Tutor Feedback Summary
      </h2>

      <div className="grid grid-cols-2 gap-1.5">
        {feedback.streak > 0 && <MiniStat icon={<IconStreak size={12} />} label="Streak" value={`${feedback.streak}d`} />}
        {progressReview.weeklyCompletion > 0 && <MiniStat icon={<IconTarget size={12} />} label="Weekly" value={`${progressReview.weeklyCompletion}%`} />}
        {progressReview.totalStudyHours > 0 && <MiniStat icon={<IconTimer size={12} />} label="Study" value={`${progressReview.totalStudyHours}h`} />}
        <MiniStat icon={<IconVocabulary size={12} />} label="Words" value={`${progressReview.vocabLearned}`} />
        {progressReview.mistakesReviewed > 0 && <MiniStat icon={<IconMistakes size={12} />} label="Mistakes" value={`${progressReview.mistakesReviewed}`} />}
        {feedback.examCountdown > 0 && (
          <MiniStat
            icon={<IconTimer size={12} />}
            label="Exam in"
            value={`${feedback.examCountdown}d`}
            urgent={feedback.isExamUrgent}
          />
        )}
      </div>

      <div className="space-y-2">
        <FeedbackBlock
          title="Main Weakness"
          text={feedback.mainWeakness}
          color="var(--color-danger)"
        />
        <FeedbackBlock
          title="Most Common Issue"
          text={feedback.mostCommonIssue}
          color="var(--color-muted)"
        />
      </div>

      {progressReview.studyPlanAdherence && (
        <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
          <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--color-tutor-accent)' }}>
            Study Plan Adherence
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {progressReview.studyPlanAdherence}
          </p>
        </div>
      )}

      <button
        onClick={onAction}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-white transition-all hover:brightness-110"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <IconPlay size={14} />
        {feedback.recommendedNextStep}
      </button>
    </div>
  )
}

function MiniStat({ icon, label, value, urgent }: { icon: React.ReactNode; label: string; value: string; urgent?: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
      style={{
        backgroundColor: 'var(--color-surface-alt)',
        ...(urgent ? { border: '1px solid var(--color-danger)', backgroundColor: 'var(--color-danger-light)' } : {}),
      }}
    >
      <span style={{ color: urgent ? 'var(--color-danger)' : 'var(--color-tutor-accent)' }}>{icon}</span>
      <div>
        <p className="text-[11px] font-medium" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-[9px]" style={{ color: 'var(--color-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function FeedbackBlock({ title, text, color }: { title: string; text: string; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
      <p className="text-[10px] font-medium" style={{ color }}>{title}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
    </div>
  )
}
