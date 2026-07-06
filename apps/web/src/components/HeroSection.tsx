export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full opacity-10" style={{ backgroundColor: 'var(--color-primary)' }} />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-10" style={{ backgroundColor: 'var(--color-tutor-accent)' }} />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full opacity-5" style={{ backgroundColor: 'var(--color-primary)' }} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free · Open Source · Local-First
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl" style={{ color: 'var(--color-text)' }}>
            Learn IELTS with a{' '}
            <span style={{ color: 'var(--color-primary)' }}>Clear Daily Roadmap</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: 'var(--color-text-secondary)' }}>
            IELTS Journey gives you a structured daily study plan with ready-made
            content. Open the app, see what to study today, and start learning
            immediately. No more guessing what to do next.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-8 text-base font-semibold text-white shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Start Your IELTS Journey
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-2xl border-2 px-8 text-base font-semibold transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
                backgroundColor: 'transparent',
              }}
            >
              See All Features
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl" role="img" aria-label="IELTS Journey dashboard preview showing today's tasks and study roadmap">
          <div className="overflow-hidden rounded-2xl shadow-lg" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--color-danger)' }} />
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--color-warning)' }} />
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
              <span className="ml-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                IELTS Journey — Dashboard
              </span>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-full rounded-xl p-5 lg:col-span-2" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                    Today's Tasks
                  </span>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                    3 remaining
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {['Reading Practice — Passage 1', 'Vocabulary Review — 15 words', 'Writing Task 2 — Essay Outline'].map(task => (
                    <div key={task} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
                      <div className="h-4 w-4 rounded border-2" style={{ borderColor: 'var(--color-primary)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Progress
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>68</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>%</span>
                </div>
                <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div className="h-full w-[68%] rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
                  Study streak: 5 days
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Next Milestone
                </span>
                <p className="mt-2 text-base font-bold" style={{ color: 'var(--color-text)' }}>
                  Target Band 7.0
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Exam in 8 weeks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
