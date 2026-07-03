import { APP_URL, EXTENSION_URL } from './config'

export default function FinalCTASection() {
  return (
    <section className="bg-[var(--color-background)] text-[var(--color-text)] px-4 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Start your IELTS learning journey today
        </h2>
        <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
          Free, private, and built for real learners.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={APP_URL}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-8 text-base font-semibold shadow-sm transition-all hover:scale-105"
            style={{ color: 'var(--color-white)' }}
          >
            Start Learning Free
          </a>
          <a
            href={EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-[var(--color-primary)] px-8 text-base font-semibold text-[var(--color-primary)] transition-all hover:scale-105"
          >
            Install Chrome Extension
          </a>
          <a
            href="#donation"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--color-border)] px-8 text-base font-semibold text-[var(--color-text-secondary)] transition-all hover:scale-105"
          >
            Support the Project
          </a>
        </div>
      </div>
    </section>
  )
}
