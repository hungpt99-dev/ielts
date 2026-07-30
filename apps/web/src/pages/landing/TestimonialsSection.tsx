const stats = [
  { label: 'Study Plans Created', value: '10,000+' },
  { label: 'Vocabulary Words Saved', value: '250,000+' },
  { label: 'Practice Sessions', value: '50,000+' },
  { label: 'IELTS Skills Covered', value: '4' },
]

const testimonials = [
  {
    quote: 'Finally an IELTS app that tells me what to study each day instead of leaving me to figure it out on my own.',
    name: 'Linh N.',
    role: 'Target Band 7.0',
    avatar: 'LN',
    color: 'bg-blue-500',
  },
  {
    quote: 'The AI tutor actually remembers what I struggle with. It feels like having a real teacher who knows my weaknesses.',
    name: 'Tuan H.',
    role: 'Target Band 6.5',
    avatar: 'TH',
    color: 'bg-indigo-500',
  },
  {
    quote: 'Being able to save vocabulary from any website and practice later is a game changer. I learn from real content.',
    name: 'Mai T.',
    role: 'Target Band 7.5',
    avatar: 'MT',
    color: 'bg-purple-500',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="px-4 py-20 sm:py-24" id="testimonials">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/10">
            Trusted by Learners
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            Join IELTS learners{' '}
            <span className="text-[var(--color-primary)]">worldwide.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Thousands of learners use IELTS Journey to prepare for their exam.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center transition-all duration-200 hover:-translate-y-1"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.02)' }}
            >
              <p className="text-4xl font-extrabold tracking-tight text-[var(--color-primary)]">{stat.value}</p>
              <p className="mt-1.5 truncate text-sm font-medium text-[var(--color-text-secondary)]">{stat.label}</p>
              <div className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-[var(--color-primary)]/5" />
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:-translate-y-1"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.02)' }}
            >
              <div className="mb-3 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                "{t.quote}"
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-[var(--color-border-light)] pt-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{t.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full bg-[var(--color-success-light)] px-3 py-1.5 text-xs font-semibold text-[var(--color-success-dark)] ring-1 ring-inset ring-[var(--color-success)]/10">Free</span>
          <span className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full bg-[var(--color-primary-light)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/10">Open Source</span>
          <span className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/10">Privacy First</span>
          <span className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/10">No Account Required</span>
        </div>
      </div>
    </section>
  )
}
