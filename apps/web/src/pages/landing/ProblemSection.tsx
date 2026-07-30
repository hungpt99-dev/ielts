const problems = [
  {
    title: 'Too many resources',
    description: "You've downloaded 10 apps, saved 50 websites, but still don't know what to study today.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: 'No structure',
    description: 'You study randomly — reading today, grammar tomorrow — without a clear progression path.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    title: 'No feedback',
    description: "You practice writing and speaking, but nobody tells you if you're improving or repeating mistakes.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: 'No progress visibility',
    description: "You feel like you're studying, but you can't see if you're actually getting closer to your target band.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
]

export default function ProblemSection() {
  return (
    <section className="px-4 py-20 sm:py-24" id="problems">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--color-danger-light)] px-3 py-1 text-xs font-semibold text-[var(--color-danger)] ring-1 ring-inset ring-[var(--color-danger)]/10">
            The Struggle
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            Studying for IELTS alone{' '}
            <span className="text-[var(--color-danger)]">is hard.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Every day, IELTS self-learners face the same challenges. Do any of these sound familiar?
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <div
              key={p.title}
              className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-danger-light)]"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.02)' }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-danger-light)] text-[var(--color-danger)] transition-colors group-hover:bg-[var(--color-danger-light)]/80">
                {p.icon}
              </div>
              <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
