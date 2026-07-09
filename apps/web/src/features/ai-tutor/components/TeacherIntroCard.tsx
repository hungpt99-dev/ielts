interface TeacherIntroCardProps {
  name?: string
  streak?: number
  isNewUser?: boolean
}

export default function TeacherIntroCard({ name, streak, isNewUser }: TeacherIntroCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, var(--color-tutor-accent-light), var(--color-surface))',
        border: '1px solid var(--color-tutor-border)',
      }}
    >
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {isNewUser
          ? `Welcome${name ? `, ${name}` : ''}! I'm your personal AI IELTS Tutor. I'll help you plan lessons, review mistakes, build vocabulary, and track your progress. Let's start your IELTS journey together!`
          : streak && streak >= 7
            ? `Great to see you${name ? `, ${name}` : ''}! You're on a ${streak}-day streak — your consistency is impressive. Let's make today's session count and keep building on your progress.`
            : `Welcome back${name ? `, ${name}` : ''}! Your personal IELTS teacher is ready to help you with lessons, feedback, mistake review, and study planning. Let's make progress today.`}
      </p>
    </div>
  )
}
