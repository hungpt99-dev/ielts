import { Card, Badge, Button } from '@ielts/ui'
import { APP_URL } from './config'

const capabilities = [
  {
    title: 'Knows Your Journey',
    description: 'Remembers your target band, weak skills, saved vocabulary, and study history.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Suggests Daily Focus',
    description: 'Recommends what to practice based on your weak areas and recent performance.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: 'Explains Anything',
    description: 'Vocabulary, grammar, writing feedback — ask and get clear, contextual answers.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: 'Creates Exercises',
    description: 'Generates personalized practice from your saved content and study history.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
]

export default function AITutorSection() {
  return (
    <section className="px-4 py-16 sm:py-20 lg:py-24" id="ai-tutor"
      style={{
        background: 'linear-gradient(180deg, var(--color-tutor-accent-light) 0%, var(--color-background) 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <Badge variant="info" size="md" style={{ marginBottom: 'var(--spacing-md)' }}>
            AI Tutor
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: 'var(--color-tutor-text)' }}>
            A personal AI tutor that actually knows you.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}>
            Not a generic chatbot. Your AI Tutor knows your target band, weak skills,
            saved vocabulary, and study history.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((cap) => (
            <Card key={cap.title} variant="tutor" padding="md">
              <div style={{ color: 'var(--color-tutor-accent)', marginBottom: 'var(--spacing-xs)' }}>
                {cap.icon}
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-tutor-text)' }}>
                {cap.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {cap.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-10 mx-auto max-w-2xl">
          <Card variant="tutor" padding="lg" style={{ borderRadius: 'var(--radius-2xl)' }}>
            <div className="flex items-start gap-3">
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-tutor-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 'var(--text-base)',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-sm leading-relaxed" style={{
                  color: 'var(--color-tutor-text)',
                  fontStyle: 'italic',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  &ldquo;Good morning! I noticed you struggled with Listening Section 3 yesterday.
                  Let&apos;s practice similar questions today. I&apos;ve prepared a short exercise based
                  on your saved vocabulary.&rdquo;
                </p>
                <p className="mt-2 text-xs" style={{ color: 'var(--color-tutor-border)' }}>
                  — Your AI Tutor, proactive and personal
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <a href={APP_URL}>
            <Button variant="tutor" size="lg">
              Try AI Tutor
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
