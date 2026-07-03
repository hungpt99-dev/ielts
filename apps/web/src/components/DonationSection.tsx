export default function DonationSection() {
  return (
    <section
      className="bg-[var(--color-background)] px-4 py-16 sm:py-20 lg:py-24"
      id="donation"
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-light)]">
          <svg
            className="h-7 w-7 text-[var(--color-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </div>

        <h2 className="mt-5 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Support IELTS Journey
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
          IELTS Journey is built as an independent learning project. If you find
          it helpful, you can support the project through a donation.
          Contributions help improve features, learning content, AI tutor
          quality, and future updates.
        </p>

        <div className="mt-10">
          <a
            href="https://example.com/donate"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 text-base font-semibold shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            style={{ color: 'var(--color-on-primary)' }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            Support the Project
          </a>
        </div>

        <p className="mt-6 text-sm text-[var(--color-muted)]">
          The donation button can later be connected to PayPal, Buy Me a Coffee,
          Ko-fi, or another global donation platform.
        </p>

        <p className="mt-4 text-sm text-[var(--color-muted)]">
          No pressure. The app is and will always be free to use.
        </p>
      </div>
    </section>
  )
}
