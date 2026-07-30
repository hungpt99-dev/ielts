import { Button } from '@ielts/ui'
import { EXTENSION_URL } from './config'

const STATS = ['100% Free', 'Open Source', 'Privacy First', 'Works Offline']

export default function FinalCTASection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, var(--color-primary) 30%, #4f46e5 70%, #1e3a5f 100%)',
          backgroundSize: '400% 400%',
          animation: 'var(--animation-gradient-shift)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-[10%] h-64 w-64 rounded-full opacity-10" style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
          animation: 'var(--animation-blob-1)',
        }} />
        <div className="absolute bottom-0 left-[5%] h-48 w-48 rounded-full opacity-[0.08]" style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          animation: 'var(--animation-blob-2)',
        }} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex whitespace-nowrap rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
            <div className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">
              Start free. No credit card.
            </div>
          </div>

          <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to start your{' '}
            <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">IELTS journey?</span>
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
            No account required. No credit card. Your data stays in your browser. Start preparing for IELTS with your personal AI tutor today.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="lg"
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-primary)',
                  border: 'none',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.1)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px 36px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--weight-bold)',
                }}
              >
                Start Learning Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="ml-2 inline-block align-middle">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Button>
            </a>
            <a href="#features">
              <Button
                variant="ghost"
                size="lg"
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px 32px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--weight-semibold)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Explore Features
              </Button>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {STATS.map((item) => (
              <span
                key={item}
                className="inline-flex items-center whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
