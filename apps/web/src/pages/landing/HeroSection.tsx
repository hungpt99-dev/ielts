import { APP_URL, EXTENSION_URL } from './config'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-background)] px-4 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="text-[var(--color-text)] text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          IELTS Journey
        </h1>
        <p className="mt-4 text-[var(--color-primary)] text-xl font-semibold sm:text-2xl">
          Free IELTS learning from the real internet
        </p>
        <p className="text-[var(--color-text-secondary)] mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          Read articles, news, and web content. IELTS Journey helps you
          highlight vocabulary, save words, generate IELTS exercises, and build
          a personal study journey.
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
        </div>

        <p className="mt-6 text-[var(--color-muted)] text-sm">
          No account required. No backend. Your data stays in your browser.
        </p>
      </div>
    </section>
  )
}
