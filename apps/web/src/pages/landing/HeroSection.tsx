import { Button, Badge } from '@ielts/ui'
import { APP_URL } from './config'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32"
      style={{
        background: 'linear-gradient(135deg, #faf9f6 0%, #e8f0fe 50%, #f0f9ff 100%)',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)',
        }} />
      </div>

      <div className="mx-auto max-w-6xl text-center relative">
        <Badge variant="primary" size="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Your Personal IELTS Tutor
        </Badge>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: 'var(--color-text)', lineHeight: '1.15' }}>
          Your daily study plan,
          <br />
          <span style={{ color: 'var(--color-primary)' }}>built by AI.</span>
          <br />
          Your IELTS goal, actually achievable.
        </h1>

        <p className="mx-auto mt-6 text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--color-text-secondary)' }}>
          IELTS Journey creates a personalized daily study plan from today to your exam day.
          Open the app, see what to study, and learn with real content.
          No more guessing what to do next.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a href={APP_URL}>
            <Button variant="primary" size="lg">
              Start Your Journey
            </Button>
          </a>
          <a href="#how-it-works">
            <Button variant="ghost" size="lg">
              See How It Works
            </Button>
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm"
          style={{ color: 'var(--color-muted)' }}>
          <span className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            No account required
          </span>
          <span className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your data stays on your device
          </span>
          <span className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            100% Free
          </span>
        </div>
      </div>
    </section>
  )
}
