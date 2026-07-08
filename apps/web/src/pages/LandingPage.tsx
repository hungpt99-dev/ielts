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
import { APP_URL } from './landing/config'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <SEOHead
        title="IELTS Journey - Learn IELTS with AI Tutor"
        description="Learn IELTS with AI Tutor — your personal AI tutor that guides you through IELTS preparation. Chat, practice, and improve anytime."
        ogTitle="IELTS Journey - Learn IELTS with AI Tutor"
        ogDescription="Learn IELTS with AI Tutor — your personal AI tutor that guides you through IELTS preparation. Chat, practice, and improve anytime."
        keywords="IELTS, AI tutor, learn IELTS, IELTS preparation, IELTS practice, IELTS speaking, IELTS writing, IELTS reading, IELTS listening"
        canonical="https://ieltsjourney.dev"
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="flex min-h-screen flex-col" style={{ fontFamily: 'var(--font-sans)' }}>
        <header
          className="sticky top-0 z-50"
          style={{
            background: 'color-mix(in srgb, var(--color-background) 85%, transparent)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--color-border-light)',
          }}
        >
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="" className="h-6 w-6 rounded-lg" loading="lazy" decoding="async" />
              <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                IELTS Journey
              </span>
            </div>

            <nav className="hidden items-center gap-6 sm:flex" aria-label="Landing page navigation">
              <a href="#features" className="text-sm font-medium transition-colors hover:text-[var(--color-primary)]" style={{ color: 'var(--color-text-secondary)' }}>
                Features
              </a>
              <a href="#ai-tutor" className="text-sm font-medium transition-colors hover:text-[var(--color-primary)]" style={{ color: 'var(--color-text-secondary)' }}>
                AI Tutor
              </a>
              <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-[var(--color-primary)]" style={{ color: 'var(--color-text-secondary)' }}>
                How It Works
              </a>
              <a
                href={APP_URL}
                className="rounded-xl px-4 py-1.5 text-sm font-semibold transition-all hover:brightness-110"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                Get Started
              </a>
            </nav>

            <button
              className="sm:hidden flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: 'none',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="border-t px-4 py-4 sm:hidden" style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
              aria-label="Mobile navigation">
              <div className="flex flex-col gap-3">
                <a href="#features" onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  Features
                </a>
                <a href="#ai-tutor" onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  AI Tutor
                </a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  How It Works
                </a>
                <a href={APP_URL} onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
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

        <footer
          className="border-t px-4 py-10 sm:py-14"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="flex items-center gap-2">
                  <img src="/icon.png" alt="" className="h-6 w-6 rounded-lg" loading="lazy" decoding="async" />
                  <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                    IELTS Journey
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Your personal IELTS tutor that plans your study, every single day.
                </p>
                <div className="mt-4 flex gap-3">
                  <a href="https://github.com/hungpt99-dev" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--color-muted)' }}
                    aria-label="GitHub">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Product</p>
                <div className="flex flex-col gap-2">
                  <a href="#features" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Features</a>
                  <a href="#ai-tutor" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>AI Tutor</a>
                  <a href="#how-it-works" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>How It Works</a>
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Resources</p>
                <div className="flex flex-col gap-2">
                  <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Chrome Extension</a>
                  <a href="/info" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>About</a>
                  <a href="https://github.com/hungpt99-dev/IELTS" target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>GitHub</a>
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Legal</p>
                <div className="flex flex-col gap-2">
                  <a href="/info#privacy" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Privacy</a>
                  <a href="/info#about-website" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Terms</a>
                </div>
              </div>
            </div>
            <div className="mt-10 border-t pt-6 text-center text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
              Built for IELTS learners worldwide.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

const EXTENSION_URL = 'https://chromewebstore.google.com/detail/ielts-journey'
