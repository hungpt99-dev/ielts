import { type ReactNode } from 'react'
import { IconExplain, IconTarget, IconTimer, IconAward, IconChevronRight } from '@ielts/ui'

interface AITutorCardProps {
  greeting?: string
  recommendation?: string
  userName?: string
  currentBand?: number
  targetBand?: number
  examDaysLeft?: number | null
  streakDays?: number
  icon?: ReactNode
  action?: ReactNode
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function AITutorCard({
  greeting,
  recommendation,
  userName,
  currentBand,
  targetBand,
  examDaysLeft,
  streakDays = 0,
  icon,
  action,
}: AITutorCardProps) {
  const timeGreeting = greeting || (userName ? `${getTimeBasedGreeting()}, ${userName}!` : 'Hi, IELTS Learner!')

  const defaultRecommendation = recommendation || 'I can help you plan your study, review mistakes, build vocabulary, and stay motivated. Ask me anything about IELTS!'

  return (
    <div
      style={{
        borderRadius: 'var(--radius-2xl)',
        background: 'linear-gradient(135deg, var(--color-tutor-background) 0%, var(--color-surface) 100%)',
        border: '1px solid var(--color-tutor-border)',
        boxShadow: 'var(--shadow-tutor)',
        padding: 'var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        transition: 'all var(--transition-normal)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-tutor-accent)',
          opacity: '0.06',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
        <div
          style={{
            flexShrink: 0,
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--color-tutor-accent), var(--color-tutor-accent-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-on-primary)',
            fontSize: 'var(--text-lg)',
          }}
          aria-hidden="true"
        >
          {icon || <IconExplain size={22} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-tutor-text)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-tight)',
              margin: 0,
            }}
          >
            {timeGreeting}
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-tutor-text)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-relaxed)',
              margin: 'var(--spacing-2xs) 0 0',
              opacity: '0.85',
            }}
          >
            {defaultRecommendation}
          </p>
        </div>
      </div>

      {(currentBand || targetBand || examDaysLeft !== null || streakDays > 0) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-sm)',
            paddingTop: 'var(--spacing-sm)',
            borderTop: '1px solid var(--color-tutor-border)',
          }}
        >
          {currentBand && targetBand && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2xs)',
                padding: 'var(--spacing-2xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-tutor-accent-light)',
                color: 'var(--color-tutor-accent)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <IconTarget size={12} />
              <span>Band {currentBand} → {targetBand}</span>
            </div>
          )}

          {examDaysLeft !== null && examDaysLeft !== undefined && examDaysLeft > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2xs)',
                padding: 'var(--spacing-2xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-full)',
                background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
                color: 'var(--color-danger)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <IconTimer size={12} />
              <span>{examDaysLeft} days to exam</span>
            </div>
          )}

          {streakDays > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2xs)',
                padding: 'var(--spacing-2xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-full)',
                background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
                color: 'var(--color-warning-dark)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <IconAward size={12} />
              <span>{streakDays}-day streak</span>
            </div>
          )}
        </div>
      )}

      {action && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {action}
          <span style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)' }}>
            <IconChevronRight size={14} />
          </span>
        </div>
      )}
    </div>
  )
}
