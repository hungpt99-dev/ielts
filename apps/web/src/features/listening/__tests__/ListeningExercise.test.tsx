import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ListeningQuestion from '../components/ListeningQuestion'
import type { ListeningQuestion as ListeningQuestionType } from '../../../models'
import { SAMPLE_EXERCISES } from '../data/exercises'

function makeQuestion(overrides: Partial<ListeningQuestionType> = {}): ListeningQuestionType {
  return {
    id: 'test-q-1',
    type: 'multiple-choice',
    question: 'What is the capital of France?',
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
    correctAnswer: 1,
    explanation: 'Paris is the capital of France.',
    ...overrides,
  }
}

describe('ListeningQuestion rendering', () => {
  it('renders question number and text', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
  })

  it('renders type badge with label', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument()
  })

  it('renders type badge for gap-fill', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'gap-fill', blanks: ['paris'] })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Gap Fill')).toBeInTheDocument()
  })

  it('renders type badge for true-false', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'true-false', correctAnswer: 0, options: ['True', 'False', 'Not Given'] })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('True / False / Not Given')).toBeInTheDocument()
  })

  it('renders type badge for short-answer', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'short-answer', correctAnswer: 'Paris', options: undefined })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Short Answer')).toBeInTheDocument()
  })

  it('renders type badge for multiple-answer', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'multiple-answer', correctAnswer: '0,2' })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Multiple Answer')).toBeInTheDocument()
  })

  it('renders type badge for table-completion', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({
          type: 'table-completion',
          correctAnswer: '',
          options: undefined,
          tableHeaders: ['Name', 'Detail'],
          tableRows: [{ label: 'Capital', blanks: ['Paris'] }],
        })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Table Completion')).toBeInTheDocument()
  })

  it('shows unknown type message for unsupported type', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'rewrite' as ListeningQuestionType['type'], options: undefined, correctAnswer: '' })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Unknown question type')).toBeInTheDocument()
  })
})

describe('Multiple-choice interaction', () => {
  it('renders all options', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('London')).toBeInTheDocument()
    expect(screen.getByText('Paris')).toBeInTheDocument()
    expect(screen.getByText('Berlin')).toBeInTheDocument()
    expect(screen.getByText('Madrid')).toBeInTheDocument()
  })

  it('calls onAnswer with index when option clicked', () => {
    const onAnswer = vi.fn()
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={undefined}
        onAnswer={onAnswer}
      />
    )
    fireEvent.click(screen.getByText('Paris'))
    expect(onAnswer).toHaveBeenCalledWith('test-q-1', 1)
  })

  it('highlights selected option', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={1}
        onAnswer={() => {}}
      />
    )
    const paris = screen.getByText('Paris').closest('button')
    expect(paris?.className).toMatch(/blue/)
  })

  it('disables buttons when showResult is true', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={1}
        onAnswer={() => {}}
        showResult
        isCorrect
      />
    )
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })
})

describe('Gap-fill interaction', () => {
  it('renders input for each blank', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'gap-fill', blanks: ['paris', 'france'] })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    const inputs = screen.getAllByPlaceholderText('Type answer...')
    expect(inputs).toHaveLength(2)
  })

  it('calls onAnswer with array when input changes', () => {
    const onAnswer = vi.fn()
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'gap-fill', blanks: ['paris'] })}
        index={0}
        answer={undefined}
        onAnswer={onAnswer}
      />
    )
    const input = screen.getByPlaceholderText('Type answer...')
    fireEvent.change(input, { target: { value: 'Paris' } })
    expect(onAnswer).toHaveBeenCalledWith('test-q-1', ['Paris'])
  })

  it('shows correct feedback when all blanks match', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'gap-fill', blanks: ['paris'] })}
        index={0}
        answer={['Paris']}
        onAnswer={() => {}}
        showResult
        isCorrect
      />
    )
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })

  it('disables inputs when showResult is true', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'gap-fill', blanks: ['paris'] })}
        index={0}
        answer={['Paris']}
        onAnswer={() => {}}
        showResult
        isCorrect
      />
    )
    const inputs = screen.getAllByPlaceholderText('Type answer...')
    inputs.forEach((input) => {
      expect(input).toBeDisabled()
    })
  })
})

describe('True-false interaction', () => {
  function trueFalseQuestion(overrides = {}) {
    return makeQuestion({ type: 'true-false', correctAnswer: 0, options: ['True', 'False', 'Not Given'], ...overrides })
  }

  it('renders True, False, Not Given options', () => {
    render(
      <ListeningQuestion
        question={trueFalseQuestion()}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('True')).toBeInTheDocument()
    expect(screen.getByText('False')).toBeInTheDocument()
    expect(screen.getByText('Not Given')).toBeInTheDocument()
  })

  it('calls onAnswer with index when option clicked', () => {
    const onAnswer = vi.fn()
    render(
      <ListeningQuestion
        question={trueFalseQuestion()}
        index={0}
        answer={undefined}
        onAnswer={onAnswer}
      />
    )
    fireEvent.click(screen.getByText('True'))
    expect(onAnswer).toHaveBeenCalledWith('test-q-1', 0)
  })

  it('uses default options when none provided', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'true-false', correctAnswer: 0, options: undefined })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('True')).toBeInTheDocument()
    expect(screen.getByText('False')).toBeInTheDocument()
    expect(screen.getByText('Not Given')).toBeInTheDocument()
  })
})

describe('Short-answer interaction', () => {
  it('renders text input', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'short-answer', correctAnswer: 'Paris', options: undefined })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByPlaceholderText('Type your answer...')).toBeInTheDocument()
  })

  it('calls onAnswer with string value on change', () => {
    const onAnswer = vi.fn()
    render(
      <ListeningQuestion
        question={makeQuestion({ type: 'short-answer', correctAnswer: 'Paris', options: undefined })}
        index={0}
        answer={undefined}
        onAnswer={onAnswer}
      />
    )
    const input = screen.getByPlaceholderText('Type your answer...')
    fireEvent.change(input, { target: { value: 'Paris' } })
    expect(onAnswer).toHaveBeenCalledWith('test-q-1', 'Paris')
  })

  it('shows correct feedback for exact match', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({
          type: 'short-answer',
          correctAnswer: 'Paris',
          options: undefined,
          acceptableAnswers: ['Paris', 'the capital'],
        })}
        index={0}
        answer={'Paris'}
        onAnswer={() => {}}
        showResult
        isCorrect
      />
    )
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })

  it('shows correct feedback for acceptable answer', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({
          type: 'short-answer',
          correctAnswer: 'Paris',
          options: undefined,
          acceptableAnswers: ['Paris', 'the capital'],
        })}
        index={0}
        answer={'the capital'}
        onAnswer={() => {}}
        showResult
        isCorrect
      />
    )
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })
})

describe('Multiple-answer interaction', () => {
  it('renders all options', () => {
    render(
      <ListeningQuestion
        question={makeQuestion({
          type: 'multiple-answer',
          correctAnswer: '0,2',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
        })}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
    expect(screen.getByText('Option C')).toBeInTheDocument()
    expect(screen.getByText('Option D')).toBeInTheDocument()
  })

  it('toggles selection on click', () => {
    const onAnswer = vi.fn()
    render(
      <ListeningQuestion
        question={makeQuestion({
          type: 'multiple-answer',
          correctAnswer: '0,2',
          options: ['Option A', 'Option B'],
        })}
        index={0}
        answer={undefined}
        onAnswer={onAnswer}
      />
    )
    fireEvent.click(screen.getByText('Option A'))
    expect(onAnswer).toHaveBeenCalledWith('test-q-1', [0])

    fireEvent.click(screen.getByText('Option B'))
    expect(onAnswer).toHaveBeenCalledWith('test-q-1', [1])
  })

  it('removes selection on second click', () => {
    const onAnswer = vi.fn()
    render(
      <ListeningQuestion
        question={makeQuestion({
          type: 'multiple-answer',
          correctAnswer: '0,2',
          options: ['Option A', 'Option B'],
        })}
        index={0}
        answer={[0]}
        onAnswer={onAnswer}
      />
    )
    fireEvent.click(screen.getByText('Option A'))
    expect(onAnswer).toHaveBeenCalledWith('test-q-1', [])
  })
})

describe('Table-completion interaction', () => {
  const tableQuestion = makeQuestion({
    type: 'table-completion',
    correctAnswer: '',
    options: undefined,
    tableHeaders: ['Feature', 'Detail'],
    tableRows: [
      { label: 'Capital', blanks: ['Paris'] },
      { label: 'Population', blanks: ['2 million'] },
    ],
  })

  it('renders table headers', () => {
    render(
      <ListeningQuestion
        question={tableQuestion}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Feature')).toBeInTheDocument()
    expect(screen.getByText('Detail')).toBeInTheDocument()
  })

  it('renders row labels', () => {
    render(
      <ListeningQuestion
        question={tableQuestion}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    expect(screen.getByText('Capital')).toBeInTheDocument()
    expect(screen.getByText('Population')).toBeInTheDocument()
  })

  it('renders input for each cell', () => {
    render(
      <ListeningQuestion
        question={tableQuestion}
        index={0}
        answer={undefined}
        onAnswer={() => {}}
      />
    )
    const inputs = screen.getAllByPlaceholderText('...')
    expect(inputs).toHaveLength(2)
  })

  it('calls onAnswer with row data when cell changes', () => {
    const onAnswer = vi.fn()
    render(
      <ListeningQuestion
        question={tableQuestion}
        index={0}
        answer={undefined}
        onAnswer={onAnswer}
      />
    )
    const inputs = screen.getAllByPlaceholderText('...')
    fireEvent.change(inputs[0], { target: { value: 'Paris' } })
    expect(onAnswer).toHaveBeenCalledWith('test-q-1', { '0': ['Paris'] })
  })
})

describe('Show result mode', () => {
  it('shows Correct label when answer is correct', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={1}
        onAnswer={() => {}}
        showResult
        isCorrect
      />
    )
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })

  it('shows Incorrect label when answer is wrong', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={0}
        onAnswer={() => {}}
        showResult
        isCorrect={false}
      />
    )
    expect(screen.getByText('Incorrect')).toBeInTheDocument()
  })

  it('shows explanation in result mode', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={1}
        onAnswer={() => {}}
        showResult
        isCorrect
      />
    )
    expect(screen.getByText('Paris is the capital of France.')).toBeInTheDocument()
  })

  it('highlights correct option in green', () => {
    render(
      <ListeningQuestion
        question={makeQuestion()}
        index={0}
        answer={0}
        onAnswer={() => {}}
        showResult
        isCorrect={false}
      />
    )
    const parisBtn = screen.getByText('Paris').closest('button')
    expect(parisBtn?.className).toMatch(/green/)
  })
})

describe('Exercise data integrity', () => {
  it('exports five sample exercises', () => {
    expect(SAMPLE_EXERCISES).toHaveLength(5)
  })

  it('each exercise has required fields', () => {
    for (const ex of SAMPLE_EXERCISES) {
      expect(ex.id).toBeTruthy()
      expect(ex.title).toBeTruthy()
      expect(ex.topic).toBeTruthy()
      expect(ex.transcript).toBeTruthy()
      expect(ex.difficulty).toMatch(/^(easy|medium|hard)$/)
      expect(ex.wordCount).toBeGreaterThan(0)
      expect(ex.estimatedMinutes).toBeGreaterThan(0)
    }
  })

  it('each exercise has at least 7 questions', () => {
    for (const ex of SAMPLE_EXERCISES) {
      expect(ex.questions.length).toBeGreaterThanOrEqual(7)
    }
  })

  it('each question has required fields', () => {
    for (const ex of SAMPLE_EXERCISES) {
      for (const q of ex.questions) {
        expect(q.id).toBeTruthy()
        expect(q.question).toBeTruthy()
        expect(q.explanation).toBeTruthy()
        expect(q.type).toMatch(/^(multiple-choice|gap-fill|true-false|short-answer|multiple-answer|table-completion)$/)
      }
    }
  })

  it('multiple-choice questions have options and valid correctAnswer', () => {
    for (const ex of SAMPLE_EXERCISES) {
      for (const q of ex.questions) {
        if (q.type === 'multiple-choice') {
          expect(q.options).toBeDefined()
          expect(q.options!.length).toBeGreaterThanOrEqual(2)
          expect(typeof q.correctAnswer).toBe('number')
          expect(q.correctAnswer as number).toBeGreaterThanOrEqual(0)
          expect(q.correctAnswer as number).toBeLessThan(q.options!.length)
        }
      }
    }
  })

  it('gap-fill questions have blanks array', () => {
    for (const ex of SAMPLE_EXERCISES) {
      for (const q of ex.questions) {
        if (q.type === 'gap-fill') {
          expect(q.blanks).toBeDefined()
          expect(q.blanks!.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('true-false questions have correctAnswer as number', () => {
    for (const ex of SAMPLE_EXERCISES) {
      for (const q of ex.questions) {
        if (q.type === 'true-false') {
          expect(typeof q.correctAnswer).toBe('number')
          expect(q.correctAnswer as number).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('short-answer questions have correctAnswer as string', () => {
    for (const ex of SAMPLE_EXERCISES) {
      for (const q of ex.questions) {
        if (q.type === 'short-answer') {
          expect(typeof q.correctAnswer).toBe('string')
          expect((q.correctAnswer as string).length).toBeGreaterThan(0)
          expect(q.acceptableAnswers).toBeDefined()
          expect(q.acceptableAnswers!.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('multiple-answer questions have comma-separated correctAnswer', () => {
    for (const ex of SAMPLE_EXERCISES) {
      for (const q of ex.questions) {
        if (q.type === 'multiple-answer') {
          expect(typeof q.correctAnswer).toBe('string')
          const parts = (q.correctAnswer as string).split(',')
          expect(parts.length).toBeGreaterThanOrEqual(2)
          parts.forEach((p) => {
            expect(Number.isInteger(Number(p))).toBe(true)
          })
        }
      }
    }
  })

  it('exercises include all question types', () => {
    const types = new Set<string>()
    for (const ex of SAMPLE_EXERCISES) {
      for (const q of ex.questions) {
        types.add(q.type)
      }
    }
    expect(types.has('multiple-choice')).toBe(true)
    expect(types.has('gap-fill')).toBe(true)
    expect(types.has('true-false')).toBe(true)
    expect(types.has('short-answer')).toBe(true)
    expect(types.has('multiple-answer')).toBe(true)
  })

  it('exercises are spread across topics', () => {
    const topics = SAMPLE_EXERCISES.map((ex) => ex.topic)
    expect(topics).toContain('Education')
    expect(topics).toContain('Environment')
    expect(topics).toContain('Travel')
    expect(topics).toContain('Society')
    expect(topics).toContain('Work')
  })
})
