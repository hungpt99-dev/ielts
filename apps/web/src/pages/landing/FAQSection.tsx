import { useState } from 'react'

const faqs = [
  {
    q: 'Is IELTS Journey free?',
    a: 'The basic version can be free, with optional future premium features.',
  },
  {
    q: 'Do I need to search for IELTS materials myself?',
    a: 'No. IELTS Journey provides ready-made learning content and daily tasks so you can start studying faster.',
  },
  {
    q: 'Can beginners use it?',
    a: 'Yes. It is designed especially for learners who do not know where to start.',
  },
  {
    q: 'Does it support personalized learning?',
    a: 'Yes. The roadmap can be based on your target band, exam date, current level, weak skills, and progress.',
  },
  {
    q: 'Does it need a backend?',
    a: 'The simple version can work locally in the browser using browser storage. Future versions can support online sync.',
  },
  {
    q: 'Is there an AI Tutor?',
    a: 'Yes. The AI Tutor helps explain, suggest practice, remind users, and create exercises based on the user\'s learning journey.',
  },
]

function FAQItem({
  question,
  answer,
  defaultOpen,
}: {
  question: string
  answer: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
      <dt>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-medium text-[var(--color-text)]"
          aria-expanded={open}
        >
          <span>{question}</span>
          <svg
            className={`h-5 w-5 shrink-0 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </dt>
      {open && (
        <dd className="border-t border-[var(--color-border)] px-6 py-4 text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {answer}
        </dd>
      )}
    </div>
  )
}

export default function FAQSection() {
  return (
    <section
      className="bg-[var(--color-surface)] px-4 py-16 text-[var(--color-text)] sm:py-20 lg:py-24"
      id="faq"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <dl className="mt-10 space-y-3">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </dl>
      </div>
    </section>
  )
}
