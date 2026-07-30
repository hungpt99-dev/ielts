import { Button } from '@ielts/ui'
import { EXTENSION_URL } from './config'

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[600px] lg:mx-0">
      <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl shadow-[var(--color-primary)]/5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <span className="ml-2 flex-1 text-xs font-medium text-[var(--color-text-secondary)]">
            IELTS Journey — Today's Plan
          </span>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-primary)]">Daily Mission</span>
              <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-on-primary)]">3/4 done</span>
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] p-2 shadow-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--color-text)]">Reading Practice</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] p-2 shadow-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-purple-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--color-text)]">Vocabulary Review</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-blue-50/60 p-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-dashed border-blue-300 bg-transparent">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)]">Writing Task 2</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--color-surface-alt)] p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text)]">AI Tutor</p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">Ready to help you practice</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text)]">Band Score Estimate</span>
              <span className="text-xs font-bold text-[var(--color-primary)]">6.5</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
              <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%)',
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 right-[10%] h-[500px] w-[500px] rounded-full opacity-20" style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.5) 0%, rgba(37,99,235,0.1) 50%, transparent 70%)',
          animation: 'var(--animation-blob-1)',
        }} />
        <div className="absolute top-[20%] left-[5%] h-[400px] w-[400px] rounded-full opacity-15" style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)',
          animation: 'var(--animation-blob-2)',
        }} />
        <div className="absolute bottom-[10%] left-[30%] h-[350px] w-[350px] rounded-full opacity-10" style={{
          background: 'radial-gradient(circle, rgba(14,165,233,0.4) 0%, rgba(14,165,233,0.08) 50%, transparent 70%)',
          animation: 'var(--animation-blob-3)',
        }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pb-28 sm:pt-28 lg:pb-32 lg:pt-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--color-primary)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/10">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              Your Personal IELTS Tutor
            </span>

            <h1 className="mx-auto mt-6 max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--color-text)] sm:text-5xl lg:mx-0 lg:max-w-none lg:text-6xl">
              Your daily study plan,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                built by AI.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg lg:mx-0 lg:max-w-xl">
              IELTS Journey creates a personalized daily study plan from today to your exam day. Open the app, see what to study, and learn with real content. No more guessing what to do next.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="primary"
                  size="lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)',
                    boxShadow: '0 4px 20px rgba(37,99,235,0.4), 0 1px 3px rgba(0,0,0,0.1)',
                    border: 'none',
                    borderRadius: 'var(--radius-xl)',
                    padding: '14px 32px',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--weight-bold)',
                  }}
                >
                  Start Your Journey
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="ml-2 inline-block align-middle">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
              </a>
              <a href="#how-it-works">
                <Button variant="ghost" size="lg" style={{ borderColor: 'var(--color-border)' }}>
                  See How It Works
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full bg-[var(--color-success-light)] px-3 py-1 text-xs font-semibold text-[var(--color-success-dark)] ring-1 ring-inset ring-[var(--color-success)]/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
                100% Free
              </span>
              <span className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Private & Local
              </span>
              <span className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" /></svg>
                No Account Needed
              </span>
            </div>
          </div>

          <div className="hidden lg:block">
            <ProductMockup />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{ background: 'linear-gradient(to top, var(--color-background), transparent)' }}
      />
    </section>
  )
}
