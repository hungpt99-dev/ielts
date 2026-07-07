import { Button, Badge } from '@ielts/ui'
import { APP_URL } from './config'

export default function FinalCTASection() {
  return (
    <section className="px-4 py-20 sm:py-28 lg:py-32"
      style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Start your IELTS journey today.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.85)' }}>
          No account required. No credit card. Your data stays in your browser.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a href={APP_URL}>
            <Button variant="primary" size="lg"
              style={{
                background: 'white',
                color: 'var(--color-primary)',
                border: '2px solid white',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              }}>
              Start Learning Free
            </Button>
          </a>
          <a href="#features">
            <Button variant="ghost" size="lg"
              style={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.3)' }}>
              Explore the Features
            </Button>
          </a>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {['100% Free', 'Open Source', 'Privacy First', 'Works Offline'].map((item) => (
            <Badge key={item} variant="default" size="sm"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}
