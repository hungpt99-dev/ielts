import { useState } from 'react'
import { IconSend } from '@ielts/ui'

const exampleQuestions = [
  'Can you explain my grammar mistake?',
  'What should I improve based on my progress?',
  'How can I improve Writing Task 2?',
]

interface AskTutorCompactCardProps {
  isAiConfigured: boolean
  onSend?: (message: string) => void
  onConfigure?: () => void
}

export default function AskTutorCompactCard({ isAiConfigured, onSend, onConfigure }: AskTutorCompactCardProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    onSend?.(input.trim())
    setInput('')
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        Ask Your Tutor
      </h2>
      <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Ask a quick question about your lesson, mistakes, vocabulary, progress, or study plan.
      </p>

      {isAiConfigured ? (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="relative flex flex-1 items-center rounded-xl border px-3"
              style={{
                height: '44px',
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)',
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                placeholder="Ask a quick question..."
                className="h-full w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--color-text)' }}
                aria-label="Ask your tutor"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-label="Send question"
            >
              <IconSend size={16} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {exampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => onSend?.(q)}
                className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:opacity-80"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            AI Tutor is not configured yet.
          </p>
          <button
            onClick={onConfigure}
            className="mt-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Configure AI Provider
          </button>
        </div>
      )}
    </div>
  )
}
