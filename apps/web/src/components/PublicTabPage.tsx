import { useState, type FormEvent } from 'react'
import PageContent from './layout/PageContent'
import Button from './ui/Button'

interface FeedbackForm {
  message: string
  contact: string
}

const navLinks = [
  { id: 'about-website', label: 'Project' },
  { id: 'about-me', label: 'About Me' },
  { id: 'recruit', label: 'Recruit' },
  { id: 'donate', label: 'Donate' },
  { id: 'feedback', label: 'Feedback' },
]

const skills = [
  'Java', 'Spring Boot', 'Kafka', 'Redis',
  'MySQL', 'Docker', 'Kubernetes', 'TypeScript',
  'React', 'Next.js', 'PostgreSQL', 'AWS',
]

function NavPills() {
  return (
    <nav className="flex flex-wrap justify-center gap-2" aria-label="Section navigation">
      {navLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="rounded-full px-4 py-1.5 text-xs font-medium transition-all hover:scale-105 sm:text-sm"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}

function SectionCard({ id, title, children, className = '' }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-2xl border p-6 transition-shadow hover:shadow-md sm:p-8 ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h2
        className="mb-6 text-xl font-bold tracking-tight sm:text-2xl"
        style={{ color: 'var(--color-text)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
      <span className="h-1.5 w-1.5 rotate-45 rounded-sm" style={{ backgroundColor: 'var(--color-primary)' }} />
      <span className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
    </div>
  )
}

const sections = [
  {
    id: 'about-website',
    title: 'Project',
    content: (
      <div className="space-y-6">
        <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          IELTS Journey is a free, all-in-one platform designed to help you prepare for the IELTS exam.
          From vocabulary building and reading practice to writing feedback and speaking exercises,
          everything you need is right here — no subscriptions, no hidden fees.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Vocabulary', count: '200+', desc: 'words with spaced repetition' },
            { label: 'Exercises', count: '4', desc: 'skills: Reading, Listening, Writing, Speaking' },
            { label: 'Data', count: 'Local', desc: 'stored in your browser, no cloud' },
            { label: 'Cost', count: 'Free', desc: 'no premium tiers, no paywalls' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{stat.count}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{stat.label}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{stat.desc}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
            Features
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              'IELTS word highlighter with instant meanings',
              'Save vocabulary from any webpage',
              'Generate Reading questions from articles',
              'Speaking Part 1, 2, and 3 practice',
              'Writing Task 2 idea extraction',
              'Daily study plan with progress tracking',
              'Progress dashboard with skill analytics',
              'Import and export your data freely',
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <Divider />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
            Privacy
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Your data is stored locally in your browser. Nothing is sent to any server unless you
            explicitly configure an AI API key. We do not track, sell, or share your personal information.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'about-me',
    title: 'About Me',
    content: (
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-bold shadow-lg"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            H
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Pham Thanh Hung (Harry) <span className="text-2xl">👨‍💻</span>
            </h3>
            <p className="text-base italic leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              Fullstack Software Engineer in Fintech
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              I&apos;m a fullstack software engineer currently working in the fintech industry,
              where I build and maintain systems that handle money, data, and trust at scale.
              I work across the entire stack — from backend services in Java and Spring Boot
              to frontend applications in React and TypeScript.
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              In fintech, every bug costs real money and every millisecond impacts the user experience.
              That&apos;s what drives me to write clean, observable, and resilient code.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              What I Do Best
            </h3>
            <ul className="space-y-2">
              {[
                'Design and build fullstack applications from the ground up',
                'Write backend services that are readable, testable, and observable',
                'Build frontends with React, TypeScript, and modern tooling',
                'Ship reliable fintech systems where correctness is critical',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="mt-1.5 block h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-primary)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              What Drives Me
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              I believe great software is built at the intersection of discipline and creativity.
              Whether it&apos;s designing a new microservice or refactoring a messy frontend,
              I care about code quality, system resilience, and developer experience.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>
              Fullstack isn&apos;t just about knowing both sides — it&apos;s about making them work together seamlessly.
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
            Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <Divider />

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'Think Clearly' },
            { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Write Precisely' },
            { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', label: 'Ship Reliably' },
            { icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', label: 'Talk Less, Code More' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-transform hover:scale-105"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}
            >
              <svg className="h-6 w-6" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl border p-5 text-center"
          style={{
            borderColor: 'var(--color-primary-light)',
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
          }}
        >
          <p className="text-sm font-semibold italic" style={{ color: 'var(--color-text)' }}>
            &ldquo;Write code your future self won&rsquo;t hate you for.&rdquo;
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            And if you make it elegant — even better.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="mailto:pthung591@gmail.com"
            className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-white)' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            pthung591@gmail.com
          </a>
          <a
            href="https://github.com/hungpt99-dev/ielts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border-2 px-5 text-sm font-semibold transition-all hover:scale-105"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            hungpt99-dev
          </a>
        </div>
      </div>
    ),
  },
  {
    id: 'recruit',
    title: 'Recruit',
    content: (
      <div className="space-y-6">
        <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          Interested in contributing to IELTS Journey or collaborating on a project?
          I am always open to working with talented individuals and teams.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              <svg className="h-4 w-4" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              How to Get Involved
            </h3>
            <ul className="space-y-2">
              {[
                'Contribute on GitHub — PRs and issues are welcome',
                'Suggest features through the Feedback section',
                'Spread the word to fellow IELTS test-takers',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="mt-1.5 block h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-primary)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              <svg className="h-4 w-4" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              For Employers
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              If you are looking for a developer who ships real, user-facing products with clean
              architecture and attention to detail, let&apos;s talk. This project demonstrates my ability
              to design and build full-stack applications from the ground up.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'donate',
    title: 'Donate',
    content: (
      <div className="space-y-6">
        <p className="text-center text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          IELTS Journey is and will always be free. If you find the app useful,
          consider buying me a coffee ☕ — your support keeps the project alive.
        </p>

        <div
          className="w-full overflow-hidden rounded-2xl border-2 text-center shadow-lg transition-all hover:shadow-xl"
          style={{
            borderColor: 'var(--color-warning)',
            backgroundColor: 'var(--color-warning-light)',
          }}
        >
          <div className="px-6 pb-2 pt-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-md" style={{ backgroundColor: 'var(--color-warning-light)' }}>
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold" style={{ color: 'var(--color-warning-dark)' }}>Buy Me a Coffee</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-warning-dark)' }}>
              Your support means a lot!
            </p>
          </div>

          <div className="border-t border-amber-200 px-6 py-5" style={{ backgroundColor: 'var(--color-warning-light)' }}>
            <img
              src="/1783047807283_360225198377512995_3352638618091119450_b1e24afbc8810215cf87240c092f4bb8.jpg"
              alt="QR code for donation"
              className="mx-auto h-48 w-48 rounded-xl object-contain shadow-md"
              style={{ backgroundColor: 'var(--color-surface)' }}
              loading="lazy"
            />
            <p className="mt-3 text-xs" style={{ color: 'var(--color-warning-dark)' }}>
              Scan with your banking app to buy me a coffee
            </p>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          No pressure. The app is and will always be free.
        </p>
      </div>
    ),
  },
  {
    id: 'feedback',
    title: 'Feedback',
    content: <FeedbackSection />,
  },
]

function FeedbackSection() {
  const [form, setForm] = useState<FeedbackForm>({ message: '', contact: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const existing = JSON.parse(localStorage.getItem('ielts-feedback') || '[]')
      existing.push({ ...form, submittedAt: new Date().toISOString() })
      localStorage.setItem('ielts-feedback', JSON.stringify(existing))
    } catch {
      // Fallback: at least log it
    }
    setSubmitted(true)
    setForm({ message: '', contact: '' })
  }

  if (submitted) {
    return (
      <PageContent className="py-8 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Thank you for your feedback!
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Your message has been received. I will review it as soon as possible.
        </p>
        <div className="mt-4">
          <Button variant="primary" onClick={() => setSubmitted(false)}>
            Send Another Message
          </Button>
        </div>
    </PageContent>
  )
}

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="feedback-message"
          className="block text-sm font-medium"
          style={{ color: 'var(--color-text)' }}
        >
          Your Message
        </label>
        <textarea
          id="feedback-message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          placeholder="Describe your feedback, suggestion, or issue..."
          className="block w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="feedback-contact"
          className="block text-sm font-medium"
          style={{ color: 'var(--color-text)' }}
        >
          Contact Info <span className="text-xs" style={{ color: 'var(--color-muted)' }}>(optional)</span>
        </label>
        <input
          id="feedback-contact"
          type="text"
          value={form.contact}
          onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
          placeholder="Email, Twitter, or any way to reach you"
          className="block w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      <Button variant="primary" type="submit">
        Send Feedback
      </Button>
    </form>
  )
}

export default function PublicTabPage() {
  return (
    <PageContent className="space-y-8 sm:space-y-10">
      <div className="space-y-5 text-center">
        <div
          className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br p-0.5"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <div
            className="flex h-full w-full items-center justify-center rounded-[10px] text-lg font-bold"
            style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}
          >
            i
          </div>
        </div>
        <div className="space-y-2">
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: 'var(--color-text)' }}
          >
            About IELTS Journey
          </h1>
          <p
            className="text-base sm:text-lg"
            style={{ color: 'var(--color-muted)' }}
          >
            Everything you need to know about the project
          </p>
        </div>
        <NavPills />
      </div>

      {sections.map((section) => (
        <SectionCard key={section.id} id={section.id} title={section.title}>
          {section.content}
        </SectionCard>
      ))}
    </PageContent>
  )
}
