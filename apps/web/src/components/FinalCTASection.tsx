export default function FinalCTASection() {
  return (
    <section className="bg-[var(--color-background)] px-4 py-16 text-[var(--color-text)] sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-light)]">
          <svg
            className="h-8 w-8 text-[var(--color-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Start Your IELTS Journey Today
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] sm:mt-6 sm:text-xl">
          Follow a clear roadmap, complete daily tasks, and study IELTS without
          feeling lost. Your structured learning path starts now.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-8 text-base font-semibold shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            style={{ color: 'var(--color-on-primary)' }}
          >
            Start Learning
          </a>
          <a
            href="#contact"
            className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-[var(--color-primary)] bg-transparent px-8 text-base font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary-light)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            Contact the Creator
          </a>
        </div>
      </div>
    </section>
  )
}
