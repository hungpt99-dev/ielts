import { useState } from 'react'
import SEOHead from '../components/SEOHead'
import HeroSection from './landing/HeroSection'
import ProblemSection from './landing/ProblemSection'
import SolutionSection from './landing/SolutionSection'
import HowItWorksSection from './landing/HowItWorksSection'
import FeatureGrid from './landing/FeatureGrid'
import AITutorSection from './landing/AITutorSection'
import ExtensionSection from './landing/ExtensionSection'
import MobileSection from './landing/MobileSection'
import TestimonialsSection from './landing/TestimonialsSection'
import FinalCTASection from './landing/FinalCTASection'
import { EXTENSION_URL } from './landing/config'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <SEOHead
        title="IELTS Journey - Learn IELTS with AI Tutor"
        description="Learn IELTS with AI Tutor — your personal AI tutor that guides you through IELTS preparation."
        ogTitle="IELTS Journey - Learn IELTS with AI Tutor"
        ogDescription="Learn IELTS with AI Tutor — your personal AI tutor that guides you through IELTS preparation."
        keywords="IELTS, AI tutor, learn IELTS, IELTS preparation, IELTS practice"
        canonical="https://ieltsjourney.dev"
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="flex min-h-screen flex-col">
        <header
          className="sticky top-0 z-50 border-b border-[var(--color-border-light)]"
          style={{
            background: 'color-mix(in srgb, var(--color-background) 85%, transparent)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          }}
        >
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <img src="/icon.png" alt="" className="h-8 w-8 rounded-xl shadow-sm" loading="lazy" decoding="async" />
              <span className="text-base font-bold tracking-tight text-[var(--color-text)]">IELTS Journey</span>
            </div>

            <nav className="hidden items-center gap-1 sm:flex" aria-label="Landing page navigation">
              <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]">Features</a>
              <a href="#ai-tutor" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]">AI Tutor</a>
              <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]">How It Works</a>
              <a
                href={EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 inline-flex items-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                style={{ color: '#ffffff' }}
              >
                Get Started
              </a>
            </nav>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] sm:hidden cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-6 pt-4 shadow-lg sm:hidden" aria-label="Mobile navigation">
              <div className="flex flex-col gap-1.5">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]">Features</a>
                <a href="#ai-tutor" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]">AI Tutor</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]">How It Works</a>
                <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold shadow-sm"
                style={{ color: '#ffffff' }}>
                  Get Started
                </a>
              </div>
            </nav>
          )}
        </header>

        <main id="main-content" className="w-full" aria-label="IELTS Journey landing page">
          <HeroSection />
          <ProblemSection />
          <SolutionSection />
          <HowItWorksSection />
          <AITutorSection />
          <FeatureGrid />
          <ExtensionSection />
          <MobileSection />
          <TestimonialsSection />
          <FinalCTASection />
        </main>

        <footer className="border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2.5">
                  <img src="/icon.png" alt="" className="h-8 w-8 rounded-xl shadow-sm" loading="lazy" decoding="async" />
                  <span className="text-base font-bold tracking-tight text-[var(--color-text)]">IELTS Journey</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Your personal IELTS tutor that plans your study, every single day. Built with AI, designed for real progress.
                </p>
                <div className="mt-4 flex gap-3">
                  <a href="https://github.com/hungpt99-dev" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]" aria-label="GitHub">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Product</p>
                <div className="flex flex-col gap-2.5">
                  <a href="#features" className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">Features</a>
                  <a href="#ai-tutor" className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">AI Tutor</a>
                  <a href="#how-it-works" className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">How It Works</a>
                  <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">Chrome Extension</a>
                </div>
              </div>

              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Resources</p>
                <div className="flex flex-col gap-2.5">
                  <a href="/info" className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">About</a>
                  <a href="https://github.com/hungpt99-dev/IELTS" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">GitHub</a>
                </div>
              </div>

              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Legal</p>
                <div className="flex flex-col gap-2.5">
                  <a href="/info#privacy" className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">Privacy</a>
                  <a href="/info#about-website" className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">Terms</a>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t border-[var(--color-border-light)] pt-8 text-center">
              <p className="text-sm text-[var(--color-muted)]">Built for IELTS learners worldwide. Open source. Privacy first.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
