import { Card } from '@ielts/ui'

const solutions = [
  {
    title: 'AI Study Roadmap',
    description: 'Set your target band and exam date. Our AI builds a day-by-day plan from today to exam day.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    title: 'Daily Learning Missions',
    description: 'Every morning, your dashboard shows exactly what to study. No planning, no deciding — just start.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    title: 'Visible Progress',
    description: 'See your estimated band score improve, track completed tasks, and know when you\'re ready for the exam.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function SolutionSection() {
  return (
    <section className="px-4 py-16 sm:py-20 lg:py-24" id="solution"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text)' }}>
          IELTS Journey gives you what&apos;s missing.
        </h2>
        <p className="mx-auto mt-4 text-center text-lg leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}>
          Instead of guessing what to study, get a clear daily plan with everything you need.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {solutions.map((item) => (
            <Card key={item.title} variant="elevated" padding="lg" accentLeft tint="success">
              <div style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-xs)' }}>
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
