import { Button } from '@ielts/ui'
import { EXTENSION_URL } from './config'

function AIChatPreview() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-blue-100 bg-blue-50 p-3.5">
          <p className="text-sm leading-relaxed text-[var(--color-text)]">
            Good morning! I noticed you struggled with{' '}
            <span className="font-semibold text-[var(--color-primary)]">Listening Section 3</span>{' '}
            yesterday. Let's practice similar questions today.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
          <p className="text-sm leading-relaxed text-[var(--color-text)]">
            In the phrase "it is widely believed that...", why is the passive voice used?
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-green-100 bg-green-50 p-3.5">
          <p className="text-sm leading-relaxed text-[var(--color-text)]">
            <span className="font-semibold text-green-700">Grammar: Passive Voice</span>
            <br />
            The passive voice shifts focus from the agent to the action. Creates an objective, formal tone. Great for IELTS Writing Task 2!
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Band 7+</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Writing Task 2</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const capabilities = [
  {
    title: 'Knows Your Journey',
    description: 'Remembers your target band, weak skills, saved vocabulary, and study history.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Suggests Daily Focus',
    description: 'Recommends what to practice based on your weak areas and recent performance.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    title: 'Explains Anything',
    description: 'Vocabulary, grammar, writing feedback — ask and get clear, contextual answers.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    title: 'Creates Exercises',
    description: 'Generates personalized practice from your saved content and study history.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-purple-600',
  },
]

export default function AITutorSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:py-24" id="ai-tutor">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(37,99,235,0.03) 0%, rgba(99,102,241,0.02) 30%, var(--color-background) 100%)' }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-600/10">
            AI-Powered
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            A personal AI tutor that{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">actually knows you.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Not a generic chatbot. Your AI Tutor knows your target band, weak skills, saved vocabulary, and study history.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.02)' }}
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${cap.gradient} text-white shadow-md`}>
                {cap.icon}
              </div>
              <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">{cap.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{cap.description}</p>
            </div>
          ))}
        </div>

        <div
          className="mt-14 rounded-2xl border border-indigo-100 bg-[var(--color-surface)] p-6 sm:p-8"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(37,99,235,0.06), 0 16px 48px rgba(37,99,235,0.04)' }}
        >
          <AIChatPreview />
        </div>

        <div className="mt-10 text-center">
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
              Try AI Tutor
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
