import TeacherActionCard from './TeacherActionCard'
import { IconPlay, IconGrammar, IconVocabulary, IconStudyPlan } from '@ielts/ui'

interface TeacherLedPracticeSectionProps {
  isAiConfigured: boolean
  onStartLesson: () => void
  onReviewMistakes: () => void
  onPracticeVocabulary: () => void
  onUpdateStudyPlan: () => void
}

export default function TeacherLedPracticeSection({
  onStartLesson,
  onReviewMistakes,
  onPracticeVocabulary,
  onUpdateStudyPlan,
}: TeacherLedPracticeSectionProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        Teacher-Led Practice
      </h2>
      <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Let your AI Teacher guide you through focused practice sessions.
      </p>
      <div className="mt-4 space-y-2">
        <TeacherActionCard
          icon={<IconPlay size={18} style={{ color: 'var(--color-primary)' }} />}
          title="Start Today's Lesson"
          description="Continue your personalized learning path"
          actionLabel="Start"
          onAction={onStartLesson}
        />
        <TeacherActionCard
          icon={<IconGrammar size={18} style={{ color: 'var(--color-danger)' }} />}
          title="Review Mistakes"
          description="Go over your recent mistakes and improve"
          actionLabel="Review"
          onAction={onReviewMistakes}
        />
        <TeacherActionCard
          icon={<IconVocabulary size={18} style={{ color: 'var(--color-success)' }} />}
          title="Practice Vocabulary"
          description="Review and reinforce saved words"
          actionLabel="Practice"
          onAction={onPracticeVocabulary}
        />
        <TeacherActionCard
          icon={<IconStudyPlan size={18} style={{ color: 'var(--color-warning)' }} />}
          title="Update Study Plan"
          description="Adjust your study roadmap and goals"
          actionLabel="Update"
          onAction={onUpdateStudyPlan}
        />
      </div>
    </div>
  )
}
