import { Card, Badge } from '@ielts/ui'

export default function MobileSection() {
  return (
    <section className="px-4 py-16 sm:py-20 lg:py-24" id="mobile"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <Badge variant="primary" size="md" style={{ marginBottom: 'var(--spacing-md)' }}>
              Mobile & PWA
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: 'var(--color-text)' }}>
              Your study plan, in your pocket.
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                'Install as a PWA — no app store needed',
                'Works offline — study without internet',
                'Mobile-first design — native feel on any device',
                'Sync across devices via browser',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={2} className="mt-0.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2 flex items-center justify-center">
            <Card variant="elevated" padding="lg" style={{ width: '100%', maxWidth: '280px' }}>
              <div style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-alt)',
                padding: 'var(--spacing-2xl) var(--spacing-lg)',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  IELTS Journey
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Install as PWA
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
