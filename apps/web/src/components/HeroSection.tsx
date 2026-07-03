export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-background)] px-4 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[var(--color-text)] text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Learn IELTS with a Clear Daily Roadmap
          </h1>
          <p className="text-[var(--color-text-secondary)] mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl">
            IELTS Journey gives you a structured daily study plan with ready-made
            content. Open the app, see what to study today, and start learning
            immediately.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-8 text-base font-semibold shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              style={{ color: 'var(--color-on-primary)' }}
            >
              Start Your IELTS Journey
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-[var(--color-primary)] bg-transparent px-8 text-base font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary-light)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              See How It Works
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl" role="img" aria-label="IELTS Journey dashboard preview showing today's tasks and study roadmap">
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-6 py-4">
              <div className="h-3 w-3 rounded-full bg-[var(--color-danger)]" />
              <div className="h-3 w-3 rounded-full bg-[var(--color-warning)]" />
              <div className="h-3 w-3 rounded-full bg-[var(--color-success)]" />
              <span className="ml-3 text-sm font-medium text-[var(--color-text-secondary)]">
                IELTS Journey — Dashboard
              </span>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-full rounded-lg bg-[var(--color-primary-light)] p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                    Today&apos;s Tasks
                  </span>
                  <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-xs font-medium text-white">
                    3 remaining
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2">
                    <div className="h-4 w-4 rounded border border-[var(--color-primary)]" />
                    <span className="text-sm text-[var(--color-text)]">Reading Practice — Passage 1</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2">
                    <div className="h-4 w-4 rounded border border-[var(--color-primary)]" />
                    <span className="text-sm text-[var(--color-text)]">Vocabulary Review — 15 words</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2">
                    <div className="h-4 w-4 rounded border border-[var(--color-primary)]" />
                    <span className="text-sm text-[var(--color-text)]">Writing Task 2 — Essay Outline</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Progress
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[var(--color-text)]">68</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full w-[68%] rounded-full bg-[var(--color-primary)]"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-success)]" />
                  Study streak: 5 days
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Next Milestone
                </span>
                <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                  Target Band 7.0
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
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
