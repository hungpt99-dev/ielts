const solutions = [
  {
    title: 'AI Study Roadmap',
    description: 'Set your target band and exam date. Our AI builds a day-by-day plan from today to exam day.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Daily Learning Missions',
    description: 'Every morning, your dashboard shows exactly what to study. No planning, no deciding — just start.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    title: 'Visible Progress',
    description: 'See your estimated band score improve, track completed tasks, and know when you\'re ready for the exam.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-violet-600',
  },
]

export default function SolutionSection() {
  return (
    <section className="relative px-4 py-20 sm:py-24" id="solution">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
        background: 'linear-gradient(180deg, var(--color-background) 0%, var(--color-surface) 30%, var(--color-surface) 70%, var(--color-background) 100%)',
      }} />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--color-success-light)] px-3 py-1 text-xs font-semibold text-[var(--color-success-dark)] ring-1 ring-inset ring-[var(--color-success)]/10">
            The Solution
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            IELTS Journey gives you{' '}
            <span className="text-[var(--color-success)]">what's missing.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Instead of guessing what to study, get a clear daily plan with everything you need.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {solutions.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-success-light)]"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.02)' }}
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md`}>
                {item.icon}
              </div>
              <h3 className="truncate text-lg font-semibold text-[var(--color-text)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
