import { Badge, Button } from '@ielts/ui'
import { EXTENSION_URL } from './config'

const FEATURES = [
  'Highlight words on any webpage and save to vocabulary',
  'Save articles to read and practice with later',
  'AI explains selected text in IELTS context',
  'Auto-highlight previously saved words while browsing',
]

function BrowserMockup() {
  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" style={{
        boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 12px 24px rgba(0,0,0,0.04), 0 32px 64px rgba(37,99,235,0.04)',
      }}>
        <div className="flex items-center gap-1.5 border-b border-[var(--color-border-light)] bg-[var(--color-surface-alt)] px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="ml-3 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[10px] text-[var(--color-muted)]">
            https://www.bbc.com/news/...
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="h-2 w-3/4 rounded-full bg-[var(--color-border)]" />
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            The researchers found that{' '}
            <span className="inline-block cursor-default rounded bg-yellow-100 px-0.5 font-medium text-[var(--color-text)]">
              biodiversity
            </span>{' '}
            in tropical regions has declined by nearly 70% since 1970.
          </p>

          <div className="mx-auto w-fit rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5" style={{
            boxShadow: '0 2px 8px rgba(37,99,235,0.15)',
          }}>
            <p className="text-xs font-medium text-[var(--color-primary)]">biodiversity (n.)</p>
            <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
              The variety of plant and animal life in a particular habitat.
            </p>
            <button className="mt-1.5 text-[10px] font-semibold text-[var(--color-primary)]">Save to vocabulary →</button>
          </div>

          <div className="h-2 w-2/3 rounded-full bg-[var(--color-border)]" />
          <div className="h-2 w-1/2 rounded-full bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  )
}

export default function ExtensionSection() {
  return (
    <section className="px-4 py-20 sm:py-24" id="extension">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <Badge variant="primary" size="md" className="mb-4 font-semibold">
              Browser Extension
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
              Learn from the{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">real internet.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
              Save vocabulary, articles, and text from any website. Turn real content into IELTS study material.
            </p>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="primary"
                  size="lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.35), 0 1px 3px rgba(0,0,0,0.08)',
                    border: 'none',
                    borderRadius: 'var(--radius-xl)',
                    padding: '14px 32px',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--weight-bold)',
                  }}
                >
                  Install Chrome Extension
                </Button>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center lg:order-last">
            <BrowserMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
