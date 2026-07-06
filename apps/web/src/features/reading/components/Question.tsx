import type { ReadingQuestion } from '../../../models'

interface QuestionProps {
  question: ReadingQuestion
  index: number
  answer: unknown
  onAnswer: (questionId: string, answer: unknown) => void
  showResult?: boolean
  isCorrect?: boolean
}

export default function Question({ question, index, answer, onAnswer, showResult, isCorrect }: QuestionProps) {
  function renderQuestion() {
    switch (question.type) {
      case 'multiple-choice':
        return renderMultipleChoice()
      case 'true-false-not-given':
        return renderTrueFalseNotGiven()
      case 'matching-headings':
        return renderMatchingHeadings()
      case 'gap-fill':
        return renderGapFill()
      default:
        return <p style={{ color: 'var(--color-danger)' }}>Unknown question type</p>
    }
  }

  function renderMultipleChoice() {
    return (
      <div className="space-y-2">
        {question.options?.map((option, i) => {
          const letter = String.fromCharCode(65 + i)
          const isSelected = answer === i
          const isOptionCorrect = showResult && question.correctAnswer === i
          const isOptionWrong = showResult && isSelected && !isOptionCorrect
          return (
            <button
              key={i}
              onClick={() => onAnswer(question.id, i)}
              disabled={showResult}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                isOptionCorrect
                  ? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                  : isOptionWrong
                    ? 'border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                    : isSelected
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-700/50'
              }`}
              style={{
                color: isOptionCorrect
                  ? 'var(--color-success)'
                  : isOptionWrong
                    ? 'var(--color-danger)'
                    : 'var(--color-text)',
              }}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isOptionCorrect
                    ? 'text-white'
                    : isOptionWrong
                      ? 'text-white'
                      : isSelected
                        ? 'text-white'
                        : 'text-[var(--color-text-secondary)]'
                }`}
                style={{
                  backgroundColor: isOptionCorrect
                    ? 'var(--color-success)'
                    : isOptionWrong
                      ? 'var(--color-danger)'
                      : isSelected
                        ? 'var(--color-primary)'
                        : 'var(--color-surface-alt)',
                }}
              >
                {letter}
              </span>
              <span>{option}</span>
              {isOptionCorrect && (
                <svg className="ml-auto h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isOptionWrong && (
                <svg className="ml-auto h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  function renderTrueFalseNotGiven() {
    const options = ['true', 'false', 'not-given'] as const
    const labels = ['True', 'False', 'Not Given']
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => {
          const isSelected = answer === opt
          const isOptionCorrect = showResult && question.correctAnswer === opt
          const isOptionWrong = showResult && isSelected && !isOptionCorrect
          return (
            <button
              key={opt}
              onClick={() => onAnswer(question.id, opt)}
              disabled={showResult}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                isOptionCorrect
                  ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400'
                  : isOptionWrong
                    ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700/50'
              }`}
              style={
                isOptionCorrect
                  ? { backgroundColor: 'var(--color-success-light)', borderColor: 'var(--color-success)' }
                  : isOptionWrong
                    ? { backgroundColor: 'var(--color-danger-light)', borderColor: 'var(--color-danger)' }
                    : undefined
              }
            >
              {labels[i]}
            </button>
          )
        })}
      </div>
    )
  }

  function renderMatchingHeadings() {
    const headings = question.headings || []
    const paragraphs = question.paragraphs || []
    const correctMatches = question.correctMatches || {}
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-600" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Headings</p>
          <div className="space-y-1">
            {headings.map((h, i) => (
              <p key={i} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="mr-1 font-bold text-blue-600 dark:text-blue-400">{String.fromCharCode(65 + i)}.</span>
                {h}
              </p>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {paragraphs.map((p) => {
            const selected = (answer as Record<string, number>)?.[p.id]
            const isCorrect = showResult && selected === correctMatches[p.id]
            const isWrong = showResult && selected !== undefined && selected !== correctMatches[p.id]
            return (
              <div
                key={p.id}
                className={`rounded-lg border p-3 ${
                  isCorrect
                    ? 'border-green-500 dark:border-green-600'
                    : isWrong
                      ? 'border-red-500 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-600'
                }`}
              >
                <p className="mb-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {p.text}
                </p>
                <select
                  value={selected ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    const current = (answer as Record<string, number>) || {}
                    onAnswer(question.id, { ...current, [p.id]: val ? parseInt(val) : undefined })
                  }}
                  disabled={showResult}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  aria-label={`Match heading for paragraph`}
                >
                  <option value="">Select heading...</option>
                  {headings.map((h, i) => (
                    <option key={i} value={i}>
                      {String.fromCharCode(65 + i)}. {h.slice(0, 60)}...
                    </option>
                  ))}
                </select>
                {isCorrect && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">Correct</p>
                )}
                {isWrong && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Correct match: {String.fromCharCode(65 + correctMatches[p.id])}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderGapFill() {
    const blanks = question.blanks || []
    const currentAnswer = (answer as string[]) || []
    return (
      <div className="space-y-3">
        {blanks.map((blank, i) => {
          const userVal = currentAnswer[i] || ''
          const isCorrect = showResult && userVal.toLowerCase().trim() === blank.toLowerCase()
          const isWrong = showResult && userVal.trim() !== '' && !isCorrect
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {i + 1}
              </span>
              <input
                type="text"
                value={userVal}
                onChange={(e) => {
                  const next = [...currentAnswer]
                  next[i] = e.target.value
                  onAnswer(question.id, next)
                }}
                disabled={showResult}
                placeholder="Type answer..."
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : isWrong
                      ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500'
                }`}
              />
              {isCorrect && (
                <svg className="h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isWrong && (
                <div className="text-right">
                  <p className="text-xs text-red-600 dark:text-red-400">Correct: {blank}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border p-4 sm:p-6 ${
        showResult && isCorrect !== undefined
          ? isCorrect
            ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
            : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      }`}
      style={
        showResult && isCorrect !== undefined
          ? {
              borderColor: isCorrect ? 'var(--color-success)' : 'var(--color-danger)',
              backgroundColor: isCorrect ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            }
          : {
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }
      }
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {index + 1}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            {question.type === 'multiple-choice'
              ? 'Multiple Choice'
              : question.type === 'true-false-not-given'
                ? 'True / False / Not Given'
                : question.type === 'matching-headings'
                  ? 'Matching Headings'
                  : 'Gap Fill'}
          </span>
        </div>
        {showResult && isCorrect !== undefined && (
          <span
            className={`shrink-0 text-xs font-semibold ${
              isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        )}
      </div>

      <p className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {question.question}
      </p>

      {renderQuestion()}

      {showResult && (
        <div
          className="mt-4 rounded-lg border p-3 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface-alt)',
          }}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
            Explanation
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
