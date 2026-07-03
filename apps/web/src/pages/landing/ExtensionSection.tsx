import { EXTENSION_URL } from './config'

export default function ExtensionSection() {
  return (
    <section
      className="bg-[var(--color-background)] text-[var(--color-text)] px-4 py-16 sm:py-20 lg:py-24"
      id="extension"
    >
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Learn while you browse
              </h2>
              <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
                The Chrome extension works while you read news, blogs, articles, and
                online content. It highlights useful IELTS words, explains difficult
                sentences, saves vocabulary, and turns selected text into IELTS
                practice.
              </p>
              <a
                href={EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-8 text-base font-semibold shadow-sm transition-all hover:scale-105"
                style={{ color: 'var(--color-white)' }}
              >
                Install Extension
              </a>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-[var(--color-surface-alt)] p-8">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 text-[var(--color-primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <p className="mt-4 text-[var(--color-text-secondary)] text-sm font-medium">
                  Available on Chrome Web Store
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
