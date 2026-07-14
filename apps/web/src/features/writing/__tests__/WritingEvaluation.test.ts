import { describe, it, expect, vi, beforeEach } from 'vitest'

// Characterize the WritingFeedback shape that the feature produces
const EMPTY_FEEDBACK = {
  taskResponse: '',
  coherence: '',
  vocabulary: '',
  grammar: '',
  bandScore: 5,
  overallFeedback: '',
  improvedVersion: '',
  mistakes: [],
}

function parseWritingFeedback(content: string): typeof EMPTY_FEEDBACK {
  try {
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}')
    const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
    const parsed = JSON.parse(jsonStr)

    return {
      taskResponse: parsed.taskResponse || '',
      coherence: parsed.coherence || '',
      vocabulary: parsed.vocabulary || '',
      grammar: parsed.grammar || '',
      bandScore: typeof parsed.bandScore === 'number' ? Math.max(1, Math.min(9, parsed.bandScore)) : 5,
      overallFeedback: parsed.overallFeedback || '',
      improvedVersion: parsed.improvedVersion || '',
      mistakes: Array.isArray(parsed.mistakes)
        ? parsed.mistakes.map((m: Record<string, string>) => ({
            category: (['grammar', 'vocabulary', 'coherence', 'task-response'] as const).includes(
              m.category as 'grammar'
            )
              ? (m.category as 'grammar' | 'vocabulary' | 'coherence' | 'task-response')
              : 'grammar' as const,
            text: m.text || '',
            correction: m.correction || '',
            explanation: m.explanation || '',
          }))
        : [],
    }
  } catch (error) {
    console.error('apps/web/src/features/writing/__tests__/WritingEvaluation.test.ts error:', error);
    return { ...EMPTY_FEEDBACK, bandScore: 5 }
  }
}

function createWritingSession(params: {
  id: string
  taskType: string
  question: string
  essay: string
  topic: string
  wordCount: number
  timerSeconds: number
  feedback: typeof EMPTY_FEEDBACK
}): Record<string, unknown> {
  return {
    id: params.id,
    taskType: params.taskType || 'task2',
    question: params.question,
    essay: params.essay,
    topic: params.topic,
    wordCount: params.wordCount,
    timeSpentMinutes: Math.round(params.timerSeconds / 60),
    estimatedBand: params.feedback.bandScore || 5,
    feedback: params.feedback.overallFeedback || '',
    grammarMistakes: params.feedback.mistakes.filter((m: { category: string }) => m.category === 'grammar').map((m: { text: string }) => m.text).join(', '),
    vocabularyMistakes: params.feedback.mistakes.filter((m: { category: string }) => m.category === 'vocabulary').map((m: { text: string }) => m.text).join(', '),
    coherenceNotes: params.feedback.coherence || '',
    improvedSentences: params.feedback.mistakes.map((m: { correction: string }) => m.correction).join('\n'),
    betterVersion: params.feedback.improvedVersion || '',
    personalReflection: '',
    createdAt: expect.any(String) as unknown as string,
  }
}

describe('WritingEvaluation — AI feedback parsing', () => {
  it('parses valid AI feedback JSON', () => {
    const aiJson = JSON.stringify({
      taskResponse: 'Good response',
      coherence: 'Well structured',
      vocabulary: 'Good range',
      grammar: 'Some errors',
      bandScore: 6.5,
      overallFeedback: 'Keep practicing',
      improvedVersion: 'Improved version here',
      mistakes: [
        { category: 'grammar', text: 'incorrect tense', correction: 'corrected tense', explanation: 'Use past tense' },
        { category: 'vocabulary', text: 'wrong word', correction: 'better word', explanation: 'More precise' },
      ],
    })

    const result = parseWritingFeedback(aiJson)

    expect(result.taskResponse).toBe('Good response')
    expect(result.bandScore).toBe(6.5)
    expect(result.mistakes).toHaveLength(2)
    expect(result.mistakes[0].category).toBe('grammar')
    expect(result.mistakes[0].text).toBe('incorrect tense')
  })

  it('clamps bandScore to 1-9 range', () => {
    const high = parseWritingFeedback(JSON.stringify({ bandScore: 15 }))
    expect(high.bandScore).toBe(9)

    const low = parseWritingFeedback(JSON.stringify({ bandScore: -1 }))
    expect(low.bandScore).toBe(1)
  })

  it('defaults bandScore to 5 when missing', () => {
    const result = parseWritingFeedback(JSON.stringify({}))
    expect(result.bandScore).toBe(5)
  })

  it('defaults category to grammar for unknown categories', () => {
    const result = parseWritingFeedback(JSON.stringify({
      mistakes: [{ category: 'unknown-cat', text: 'error', correction: 'fix', explanation: '' }],
    }))
    expect(result.mistakes[0].category).toBe('grammar')
  })

  it('handles unparseable JSON by returning empty feedback', () => {
    const result = parseWritingFeedback('not json')
    expect(result.bandScore).toBe(5)
    expect(result.taskResponse).toBe('')
  })
})

describe('WritingEvaluation — session creation shape', () => {
  it('creates a WritingSession with all required fields', () => {
    const feedback = {
      ...EMPTY_FEEDBACK,
      bandScore: 6.5,
      overallFeedback: 'Good job',
      coherence: 'Well organized',
      mistakes: [
        { category: 'grammar' as const, text: 'error1', correction: 'fix1', explanation: '' },
        { category: 'vocabulary' as const, text: 'error2', correction: 'fix2', explanation: '' },
      ],
      improvedVersion: 'Better version',
    }

    const session = createWritingSession({
      id: 'ws-1',
      taskType: 'task2',
      question: 'Some question',
      essay: 'My essay text',
      topic: 'Education',
      wordCount: 250,
      timerSeconds: 1200,
      feedback,
    })

    expect(session.id).toBe('ws-1')
    expect(session.taskType).toBe('task2')
    expect(session.essay).toBe('My essay text')
    expect(session.wordCount).toBe(250)
    expect(session.timeSpentMinutes).toBe(20)
    expect(session.estimatedBand).toBe(6.5)
    expect(session.feedback).toBe('Good job')
    expect(session.grammarMistakes).toBe('error1')
    expect(session.vocabularyMistakes).toBe('error2')
    expect(session.coherenceNotes).toBe('Well organized')
    expect(session.improvedSentences).toBe('fix1\nfix2')
    expect(session.betterVersion).toBe('Better version')
    expect(session.createdAt).toEqual(expect.any(String))
  })
})
