import { describe, it, expect } from 'vitest'
import { validateReadingPassage, validateTrueFalseNotGiven, validateYesNoNotGiven } from '../domain/ielts/validators'

describe('IELTS Validators', () => {
  describe('validateReadingPassage', () => {
    it('validates a correct passage', () => {
      const passage = {
        title: 'Test Passage',
        passage: 'This is a test passage with enough words to be valid. '.repeat(20),
        paragraphs: [
          { id: 'A', content: 'Paragraph A content with sufficient length for validation purposes.', index: 0 },
          { id: 'B', content: 'Paragraph B content with sufficient length to meet the minimum requirements.', index: 1 },
        ],
        taskGroups: [{
          id: 'g1', type: 'true-false-not-given', startNumber: 1, endNumber: 3,
          instructions: ['Test instructions'],
          questions: [{
            id: 'q1', number: 1, type: 'true-false-not-given',
            statement: 'A test statement about the passage',
            correctAnswer: 'true',
            explanation: 'This explanation is detailed enough to meet the minimum length requirement for validation.',
            evidence: { paragraphId: 'A', supportingText: 'test passage with enough words' },
          }],
        }],
      }
      const result = validateReadingPassage(passage)
      expect(result.valid).toBe(true)
    })

    it('rejects passage without task groups', () => {
      const result = validateReadingPassage({ title: 'Test', passage: 'content', paragraphs: [] })
      expect(result.valid).toBe(false)
    })
  })

  describe('validateTrueFalseNotGiven', () => {
    it('accepts valid TFNG questions', () => {
      const questions = [
        { id: 'q1', number: 1, type: 'true-false-not-given', statement: 'The sky is blue', correctAnswer: 'true', explanation: 'The passage states that the sky appears blue, which agrees with this statement.', evidence: { paragraphId: 'A', supportingText: 'sky is blue' } },
        { id: 'q2', number: 2, type: 'true-false-not-given', statement: 'The sky is green', correctAnswer: 'false', explanation: 'The passage directly contradicts this: it describes the sky as blue, not green.', evidence: { paragraphId: 'A', supportingText: 'sky is blue' } },
        { id: 'q3', number: 3, type: 'true-false-not-given', statement: 'The sky is heavy', correctAnswer: 'not-given', explanation: 'The passage does not mention anything about the weight of the sky.' },
      ]
      const result = validateTrueFalseNotGiven(questions, 'The sky is blue in color')
      expect(result.valid).toBe(true)
      expect(result.distribution).toEqual({ true: 1, false: 1, notGiven: 1 })
    })

    it('rejects not-given that closely matches passage', () => {
      const questions = [
        { id: 'q1', number: 1, type: 'true-false-not-given', statement: 'The sky appears blue because of light', correctAnswer: 'not-given', explanation: 'The passage does not explain why the sky appears blue, only states its color.' },
      ]
      const result = validateTrueFalseNotGiven(questions, 'The sky appears blue because of light scattering')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateYesNoNotGiven', () => {
    it('accepts valid YNNG about writer views', () => {
      const questions = [
        { id: 'q1', number: 1, type: 'yes-no-not-given', statement: 'The writer believes climate change is urgent', correctAnswer: 'yes', explanation: 'The writer explicitly states that climate change requires immediate global action.' },
      ]
      const result = validateYesNoNotGiven(questions)
      expect(result.valid).toBe(true)
    })

    it('rejects YNNG that tests factual information', () => {
      const questions = [
        { id: 'q1', number: 1, type: 'yes-no-not-given', statement: 'According to the passage, the sky is blue', correctAnswer: 'yes', explanation: 'Text mentions sky color' },
      ]
      const result = validateYesNoNotGiven(questions)
      expect(result.valid).toBe(false)
    })
  })
})
