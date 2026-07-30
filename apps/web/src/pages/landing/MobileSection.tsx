import { Badge } from '@ielts/ui'

function PhoneMockup() {
  return (
    <div className="mx-auto w-full max-w-[260px]">
      <div className="relative rounded-[2rem] border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] p-2" style={{
        boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.06), 0 16px 48px rgba(37,99,235,0.06)',
      }}>
        <div className="absolute top-4 left-1/2 h-1.5 w-20 -translate-x-1/2 rounded-full bg-[var(--color-border)]" />

        <div className="overflow-hidden rounded-[1.5rem] bg-[var(--color-background)]">
          <div className="flex items-center justify-between px-5 pb-3 pt-8" style={{
            background: 'linear-gradient(135deg, var(--color-primary), #4f46e5)',
          }}>
            <span className="text-[10px] font-semibold text-white/80">Today</span>
            <span className="text-[11px] font-bold text-white">IELTS Journey</span>
            <span />
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--color-primary)]">Daily Mission</span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">3/4</span>
              </div>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-[11px] font-medium text-[var(--color-text)]">Reading Practice</span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <span className="text-[11px] font-medium text-[var(--color-text)]">AI Tutor — Ask questions</span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--color-text)]">Band Score</span>
                <span className="text-xs font-bold text-[var(--color-primary)]">6.5</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                <div className="h-full w-[65%] rounded-full" style={{ background: 'linear-gradient(90deg, var(--color-primary), #4f46e5)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ITEMS = [
  'Install as a PWA — no app store needed',
  'Works offline — study without internet',
  'Mobile-first design — native feel on any device',
  'Sync across devices via browser',
]

export default function MobileSection() {
  return (
    <section className="relative px-4 py-20 sm:py-24" id="mobile">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
        background: 'linear-gradient(180deg, var(--color-background) 0%, var(--color-surface) 50%, var(--color-surface) 100%)',
      }} />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex items-center justify-center lg:order-last">
            <PhoneMockup />
          </div>

          <div className="lg:order-first">
            <Badge variant="primary" size="md" className="mb-4 font-semibold">
              Mobile & PWA
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
              Your study plan,{' '}
              <span className="text-indigo-500">in your pocket.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
              Install IELTS Journey as a Progressive Web App. Works like a native app on any device, even offline.
            </p>
            <ul className="mt-6 space-y-3">
              {ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
