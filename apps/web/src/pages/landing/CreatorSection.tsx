import { CREATOR } from './config'

export default function CreatorSection() {
  const hasEmail = CREATOR.email.length > 0
  const hasCv = CREATOR.cv.length > 0
  const hasLinkedin = CREATOR.linkedin.length > 0

  return (
    <section
      className="bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-16 sm:py-20 lg:py-24"
      id="creator"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built by one developer
        </h2>
        <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
          IELTS Journey is maintained by a passionate developer. If you like the
          project, consider supporting or reaching out.
        </p>

        <div className="mx-auto mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-8 text-left">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-2xl font-bold text-[var(--color-primary)]">
              {CREATOR.englishName[0]}
            </div>
            <div>
              <p className="text-xl font-bold">{CREATOR.name}</p>
              <p className="text-[var(--color-text-secondary)]">
                {CREATOR.englishName} &middot; {CREATOR.role}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {CREATOR.background}
          </p>
          <p className="mt-2 text-[var(--color-text-secondary)] text-sm leading-relaxed">
            <strong>Current focus:</strong> {CREATOR.currentFocus}
          </p>
          <p className="mt-2 text-[var(--color-text-secondary)] text-sm leading-relaxed">
            <strong>Open to:</strong> {CREATOR.openTo}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={CREATOR.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold shadow-sm transition-all hover:scale-105"
            style={{ color: 'var(--color-white)' }}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
            View GitHub
          </a>
          {hasEmail && (
            <a
              href={`mailto:${CREATOR.email}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-primary)] transition-all hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Contact Me
            </a>
          )}
          {hasCv && (
            <a
              href={CREATOR.cv}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-primary)] transition-all hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download CV
            </a>
          )}
          {hasLinkedin && (
            <a
              href={CREATOR.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-primary)] transition-all hover:scale-105"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              LinkedIn
            </a>
          )}
        </div>

        {!hasEmail && !hasCv && !hasLinkedin && (
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            Contact links coming soon. In the meantime, reach out via GitHub.
          </p>
        )}
      </div>
    </section>
  )
}
