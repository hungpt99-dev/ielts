import { Card, Badge } from '@ielts/ui'

export default function TestimonialsSection() {
  return (
    <section className="px-4 py-16 sm:py-20 lg:py-24" id="testimonials"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text)' }}>
          Join IELTS learners worldwide.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}>
          Thousands of learners use IELTS Journey to prepare for their exam.
          Be among the first to experience personalized AI-powered IELTS prep.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          {[
            { label: 'Study Plans Created', value: '10,000+' },
            { label: 'Vocabulary Words Saved', value: '250,000+' },
            { label: 'Practice Sessions', value: '50,000+' },
          ].map((stat) => (
            <Card key={stat.label} variant="outlined" padding="md"
              style={{ minWidth: '160px', textAlign: 'center' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {stat.label}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Badge variant="success" size="sm">Free</Badge>
          <Badge variant="info" size="sm">Open Source</Badge>
          <Badge variant="primary" size="sm">Privacy First</Badge>
          <Badge variant="success" size="sm">No Account Required</Badge>
        </div>
      </div>
    </section>
  )
}
