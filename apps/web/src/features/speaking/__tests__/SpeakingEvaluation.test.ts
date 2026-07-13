import { describe, it, expect } from 'vitest'

interface EvaluationResult {
  fluency: number
  vocabulary: number
  grammar: number
  pronunciation: number
  coherence: number
  taskAchievement: number
}

const EMPTY_EVALUATION: EvaluationResult = {
  fluency: 5,
  vocabulary: 5,
  grammar: 5,
  pronunciation: 5,
  coherence: 5,
  taskAchievement: 5,
}

function parseSpeakingFeedback(
  content: string,
): { evaluation: EvaluationResult; fields: Record<string, string>; bandScore: number | null } {
  const jsonStart = content.indexOf('{')
  const jsonEnd = content.lastIndexOf('}')
  const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
  const parsed = JSON.parse(jsonStr) as Record<string, unknown>

  const textFields: Record<string, string> = {}
  const fieldNames = ['fluencyNotes', 'vocabularyNotes', 'grammarNotes', 'pronunciationNotes', 'betterExpressions', 'improvedAnswer']
  for (const key of fieldNames) {
    if (typeof parsed[key] === 'string') {
      textFields[key] = parsed[key] as string
    }
  }

  const scores = parsed.scores as Record<string, unknown> | undefined
  const evaluation = { ...EMPTY_EVALUATION }
  if (scores && typeof scores === 'object') {
    for (const key of Object.keys(evaluation) as (keyof EvaluationResult)[]) {
      const score = scores[key]
      if (typeof score === 'number' && score >= 1 && score <= 10) {
        evaluation[key] = Math.round(score)
      }
    }
  }

  const bandScore = typeof parsed.bandScore === 'number' ? parsed.bandScore : null

  return { evaluation, fields: textFields, bandScore }
}

function createSpeakingSession(params: {
  id: string
  part: number
  question: string
  answerNotes: string
  topic: string
  durationSeconds: number
  evaluation: EvaluationResult
  fluencyNotes: string
  vocabularyNotes: string
  grammarNotes: string
  pronunciationNotes: string
  betterExpressions: string
  improvedAnswer: string
}): Record<string, unknown> {
  const selfRating = Math.round(
    Object.values(params.evaluation).reduce((s, v) => s + v, 0) / Object.keys(params.evaluation).length,
  )

  return {
    id: params.id,
    part: params.part,
    question: params.question,
    answerNotes: params.answerNotes,
    topic: params.topic,
    durationSeconds: params.durationSeconds,
    selfRating: selfRating || 5,
    fluencyNotes: params.fluencyNotes,
    vocabularyNotes: params.vocabularyNotes,
    grammarMistakes: params.grammarNotes,
    pronunciationNotes: params.pronunciationNotes,
    betterExpressions: params.betterExpressions,
    improvedAnswer: params.improvedAnswer,
    createdAt: expect.any(String) as unknown as string,
  }
}

describe('SpeakingEvaluation — AI feedback parsing', () => {
  it('parses valid AI feedback JSON with scores', () => {
    const aiJson = JSON.stringify({
      fluencyNotes: 'Good flow',
      vocabularyNotes: 'Good range',
      grammarNotes: 'Some tense errors',
      pronunciationNotes: 'Clear',
      betterExpressions: 'Could use "moreover"',
      improvedAnswer: 'Improved: ...',
      scores: { fluency: 7, vocabulary: 6, grammar: 5, pronunciation: 8, coherence: 7, taskAchievement: 6 },
      bandScore: 6.5,
    })

    const result = parseSpeakingFeedback(aiJson)

    expect(result.fields.fluencyNotes).toBe('Good flow')
    expect(result.evaluation.fluency).toBe(7)
    expect(result.evaluation.grammar).toBe(5)
    expect(result.bandScore).toBe(6.5)
  })

  it('clamps scores to 1-10 range', () => {
    const result = parseSpeakingFeedback(JSON.stringify({
      scores: { fluency: 15, grammar: -1, vocabulary: 5, pronunciation: 5, coherence: 5, taskAchievement: 5 },
    }))

    expect(result.evaluation.fluency).toBe(5)
    expect(result.evaluation.grammar).toBe(5)
  })

  it('handles missing bandScore', () => {
    const result = parseSpeakingFeedback(JSON.stringify({
      fluencyNotes: 'Some notes',
    }))

    expect(result.bandScore).toBeNull()
  })

  it('handles unparseable JSON', () => {
    expect(() => parseSpeakingFeedback('not json')).toThrow()
  })
})

describe('SpeakingEvaluation — session creation shape', () => {
  it('creates a SpeakingSession with all required fields', () => {
    const evaluation: EvaluationResult = { fluency: 7, vocabulary: 6, grammar: 5, pronunciation: 8, coherence: 7, taskAchievement: 6 }
    const avg = Math.round(Object.values(evaluation).reduce((s, v) => s + v, 0) / Object.keys(evaluation).length)

    const session = createSpeakingSession({
      id: 'ss-1',
      part: 2,
      question: 'Describe your hometown',
      answerNotes: 'My hometown is...',
      topic: 'Hometown',
      durationSeconds: 90,
      evaluation,
      fluencyNotes: 'Good',
      vocabularyNotes: 'Okay',
      grammarNotes: 'Some errors',
      pronunciationNotes: 'Clear',
      betterExpressions: 'Use more idioms',
      improvedAnswer: 'Better version here',
    })

    expect(session.id).toBe('ss-1')
    expect(session.part).toBe(2)
    expect(session.answerNotes).toBe('My hometown is...')
    expect(session.durationSeconds).toBe(90)
    expect(session.selfRating).toBe(avg)
    expect(session.grammarMistakes).toBe('Some errors')
    expect(session.createdAt).toEqual(expect.any(String))
  })
})
