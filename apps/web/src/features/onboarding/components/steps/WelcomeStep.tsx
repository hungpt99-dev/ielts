import { useNavigate } from 'react-router-dom'
import Button from '../../../../components/ui/Button'

interface WelcomeStepProps {
  onStart: () => void
}

export default function WelcomeStep({ onStart }: WelcomeStepProps) {
  const navigate = useNavigate()

  return (
    <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0' }}>
      <div
        style={{
          width: '80px', height: '80px',
          borderRadius: 'var(--radius-2xl)',
          background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--spacing-lg)',
          color: 'var(--color-primary)',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
        </svg>
      </div>

      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', lineHeight: 'var(--leading-tight)', margin: 0 }}>
        Welcome to IELTS Journey
      </h1>

      <p style={{
        fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)', marginTop: 'var(--spacing-md)',
        maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto',
      }}>
        Let&apos;s personalize your IELTS study plan, AI Tutor, vocabulary review,
        and daily practice. This takes about 3 minutes.
      </p>

      <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
        <Button variant="primary" size="lg" onClick={onStart} style={{ minWidth: '200px' }}>
          Start Setup
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard', { replace: true })}>
          I&apos;ll do this later
        </Button>
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 'var(--spacing-lg)' }}>
        Your data stays on your device · No account needed
      </p>
    </div>
  )
}
