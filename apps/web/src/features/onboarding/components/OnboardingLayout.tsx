import { type ReactNode } from 'react'
import { TOTAL_ONBOARDING_STEPS } from '../types'

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  stepTitle: string
  stepDescription: string
  onBack?: () => void
  showBack?: boolean
  footer?: ReactNode
}

export default function OnboardingLayout({
  children, currentStep, stepTitle, stepDescription,
  onBack, showBack = true, footer,
}: OnboardingLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          paddingTop: 'calc(var(--spacing-sm) + env(safe-area-inset-top, 0px))',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          {showBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px', height: '44px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label="Go back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
            IELTS Journey
          </span>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
          Step {currentStep + 1} of {TOTAL_ONBOARDING_STEPS}
        </span>
      </header>

      <div style={{ padding: 'var(--spacing-md) var(--spacing-md) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2xs)' }}>
          {Array.from({ length: TOTAL_ONBOARDING_STEPS }, (_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2xs)' }}>
              <div
                style={{
                  width: i === currentStep ? '32px' : '10px',
                  height: i === currentStep ? '6px' : '6px',
                  borderRadius: i === currentStep ? 'var(--radius-full)' : 'var(--radius-full)',
                  background: i <= currentStep ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  transition: 'all var(--transition-normal)',
                }}
                role="progressbar"
                aria-valuenow={currentStep + 1}
                aria-valuemin={1}
                aria-valuemax={TOTAL_ONBOARDING_STEPS}
                aria-label={`Step ${i + 1} of ${TOTAL_ONBOARDING_STEPS}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--spacing-lg) var(--spacing-md)',
          paddingBottom: 'var(--spacing-lg)',
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
            {stepTitle}
          </h1>
          {stepDescription && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)', lineHeight: 'var(--leading-relaxed)' }}>
              {stepDescription}
            </p>
          )}
        </div>

        {children}
      </div>

      {footer && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          padding: 'var(--spacing-md) var(--spacing-md)',
          paddingBottom: 'calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--color-border-light)',
          background: 'var(--color-background)',
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          zIndex: 10,
        }}>
          {footer}
        </div>
      )}
    </div>
  )
}
