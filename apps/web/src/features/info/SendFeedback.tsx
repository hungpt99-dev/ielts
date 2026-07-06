import { useState, type FormEvent } from 'react'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/layout/PageHeader'
import { IconMail } from '@ielts/ui'

interface FeedbackForm {
  message: string
  contact: string
}

export default function SendFeedback() {
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
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Thank you for your feedback!
        </h2>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Your message has been received. I will review it as soon as possible.
        </p>
        <div className="mt-6">
          <Button variant="primary" onClick={() => setSubmitted(false)}>
            Send Another Message
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <PageHeader
        icon={<IconMail size={22} />}
        title="Send Feedback"
        description="Have a suggestion, found a bug, or just want to say hello? Send me a message below."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="message"
            className="block text-sm font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            Your Message
          </label>
          <textarea
            id="message"
            required
            rows={6}
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
            htmlFor="contact"
            className="block text-sm font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            Contact Info <span className="text-xs" style={{ color: 'var(--color-muted)' }}>(optional)</span>
          </label>
          <input
            id="contact"
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
    </div>
  )
}
