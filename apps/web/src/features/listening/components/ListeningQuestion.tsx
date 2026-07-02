import type { ListeningQuestion as ListeningQuestionType } from '../../../models'

interface QuestionProps {
  question: ListeningQuestionType
  index: number
  answer: unknown
  onAnswer: (questionId: string, answer: unknown) => void
  showResult?: boolean
  isCorrect?: boolean
}

export default function ListeningQuestion({
  question,
  index,
  answer,
  onAnswer,
  showResult,
  isCorrect,
}: QuestionProps) {
  function renderQuestion() {
    switch (question.type) {
      case 'multiple-choice':
        return renderMultipleChoice()
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
                  ? 'var(--color-success, #16a34a)'
                  : isOptionWrong
                    ? 'var(--color-danger, #dc2626)'
                    : 'var(--color-text)',
              }}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isOptionCorrect
                    ? 'bg-green-500 text-white'
                    : isOptionWrong
                      ? 'bg-red-500 text-white'
                      : isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
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

  function renderGapFill() {
    const blanks = question.blanks || []
    const currentAnswer = (answer as string[]) || []
    return (
      <div className="space-y-3">
        {blanks.map((_blank, i) => {
          const userVal = currentAnswer[i] || ''
          const isCorrect = showResult && userVal.toLowerCase().trim() === _blank.toLowerCase()
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
                  <p className="text-xs text-red-600 dark:text-red-400">Correct: {_blank}</p>
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
              borderColor: isCorrect ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)',
              backgroundColor: isCorrect ? 'var(--color-success-light, #f0fdf4)' : 'var(--color-danger-light, #fef2f2)',
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
            {question.type === 'multiple-choice' ? 'Multiple Choice' : 'Gap Fill'}
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
