import type { ListeningQuestion, FormFieldModel } from '../../../models'

interface FormQuestionProps {
  question: ListeningQuestion
  index: number
  answer: unknown
  onAnswer: (questionId: string, answer: unknown) => void
  showResult?: boolean
  isCorrect?: boolean
  formFields?: FormFieldModel[]
}

interface QuestionProps {
  question: ListeningQuestion
  index: number
  answer: unknown
  onAnswer: (questionId: string, answer: unknown) => void
  showResult?: boolean
  isCorrect?: boolean
}

const SECTION_CSS: Record<string, string> = {
  backgroundColor: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
}

function getInputStyle(isCorrect?: boolean, isWrong?: boolean): Record<string, string> {
  if (isCorrect) {
    return {
      borderColor: '#22c55e',
      backgroundColor: '#f0fdf4',
      color: '#166534',
    }
  }
  if (isWrong) {
    return {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2',
      color: '#991b1b',
    }
  }
  return {}
}

export default function FormQuestion({
  question,
  index,
  answer,
  onAnswer,
  showResult,
  isCorrect,
}: FormQuestionProps) {
  const formFields = question.formFields as FormFieldModel[] | undefined || []

  if (formFields.length > 0) {
    return renderFormLayout(formFields)
  }

  // Fallback to simple gap-fill rendering
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {index + 1}. {question.question}
      </span>
      <input
        type="text"
        value={(answer as string) ?? ''}
        onChange={(e) => onAnswer(question.id, e.target.value)}
        disabled={showResult}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Type your answer..."
        style={{
          ...SECTION_CSS,
          ...getInputStyle(
            showResult ? isCorrect : undefined,
            showResult ? !isCorrect : undefined,
          ),
        }}
        aria-label={`Answer for question ${index + 1}`}
      />
      {showResult && (
        <div className="text-xs" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
          {isCorrect ? 'Correct!' : `Correct answer: ${question.correctAnswer}`}
        </div>
      )}
    </div>
  )
}

function renderFormLayout(fields: FormFieldModel[]) {
  // Group fields by section
  const sections = new Map<string, FormFieldModel[]>()
  for (const field of fields) {
    const key = field.section || 'main'
    if (!sections.has(key)) sections.set(key, [])
    sections.get(key)!.push(field)
  }

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface-alt)',
      }}
    >
      {Array.from(sections.entries()).map(([sectionName, sectionFields], sIdx) => (
        <div key={sectionName} className={sIdx > 0 ? 'mt-6 pt-6 border-t' : ''} style={{ borderColor: 'var(--color-border)' }}>
          {sections.size > 1 && (
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              {sectionName}
            </h4>
          )}
          <div className="space-y-4">
            {sectionFields.map((field, fIdx) => (
              <div key={field.order} className="flex items-center gap-3">
                <label
                  className="text-sm font-medium min-w-[120px] shrink-0"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {field.label}
                </label>
                <div className="flex-1">
                  <div
                    className="h-10 px-3 flex items-center rounded-lg border text-sm font-medium"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  >
                    ___________
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}