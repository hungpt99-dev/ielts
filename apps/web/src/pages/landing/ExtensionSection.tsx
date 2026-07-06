import { Card, Badge, Button } from '@ielts/ui'
import { EXTENSION_URL } from './config'

export default function ExtensionSection() {
  return (
    <section className="px-4 py-16 sm:py-20 lg:py-24" id="extension"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="primary" size="md" style={{ marginBottom: 'var(--spacing-md)' }}>
              Browser Extension
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: 'var(--color-text)' }}>
              Learn from the real internet.
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Save vocabulary, articles, and text from any website. Turn real content into IELTS study material.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Highlight words on any webpage and save to vocabulary',
                'Save articles to read and practice with later',
                'AI explains selected text in IELTS context',
                'Auto-highlight previously saved words while browsing',
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
            <div className="mt-6">
              <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="md">
                  Install Chrome Extension
                </Button>
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Card variant="elevated" padding="lg" style={{ width: '100%', maxWidth: '360px' }}>
              <div style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-alt)',
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1} className="mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="mt-4 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Available on Chrome Web Store
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
