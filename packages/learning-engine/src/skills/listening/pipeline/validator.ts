// ═══════════════════════════════════════════════════════════════════════
// Validator — Self-validating engine for listening exercises
// ═══════════════════════════════════════════════════════════════════════

import type {
  AnswerKey,
  Distractor,
  QuestionSet,
  Transcript,
  ValidationError,
  ValidationResult,
} from './types'

export interface ValidateInput {
  questionSet: QuestionSet
  answerKey: AnswerKey
  transcript: Transcript
  distractors: Distractor[]
}

export function validate(input: ValidateInput): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  const { questionSet, answerKey, transcript, distractors } = input
  const entities = questionSet.entities

  // 1. Every answer exists
  for (const entity of entities) {
    const answer = answerKey.entries.find(e => e.entityId === entity.id)
    if (!answer || !answer.correctAnswer) {
      errors.push({
        code: 'MISSING_ANSWER',
        message: `Entity "${entity.id}" has no answer in the answer key`,
        entityId: entity.id,
        severity: 'error',
      })
    }
  }

  // 2. Every answer appears in the transcript
  for (const entry of answerKey.entries) {
    const found = transcript.lines.some(line =>
      line.text.toLowerCase().includes(entry.correctAnswer.toLowerCase()),
    )
    if (!found) {
      errors.push({
        code: 'ANSWER_NOT_IN_TRANSCRIPT',
        message: `Answer "${entry.correctAnswer}" not found in transcript`,
        entityId: entry.entityId,
        questionNumber: entry.questionNumber,
        severity: 'error',
      })
    }
  }

  // 3. Answer appears AFTER correction (if distractor exists)
  for (const entry of answerKey.entries) {
    const distractor = distractors.find(d => d.entityId === entry.entityId)
    if (distractor) {
      const corrLineIdx = distractor.correctionLineIndex
      const answerLineIdx = entry.verifiedLineIndex
      if (corrLineIdx >= 0 && answerLineIdx >= 0 && answerLineIdx < corrLineIdx) {
        errors.push({
          code: 'ANSWER_BEFORE_CORRECTION',
          message: `Answer for entity "${entry.entityId}" appears before its correction`,
          entityId: entry.entityId,
          questionNumber: entry.questionNumber,
          severity: 'error',
        })
      }
    }
  }

  // 4. No duplicated answer unless intentional
  const answerValues = new Map<string, number>()
  for (const entry of answerKey.entries) {
    const key = entry.correctAnswer.toLowerCase().trim()
    const count = (answerValues.get(key) || 0) + 1
    answerValues.set(key, count)
  }
  for (const [value, count] of answerValues) {
    if (count > 1) {
      warnings.push({
        code: 'DUPLICATE_ANSWER',
        message: `Answer "${value}" appears ${count} times`,
        severity: 'warning',
      })
    }
  }

  // 5. Question order follows transcript order
  const entityPositions: Array<{ entityId: string; lineIndex: number }> = []
  for (const entity of entities) {
    const entry = answerKey.entries.find(e => e.entityId === entity.id)
    if (!entry) continue
    const lineIdx = transcript.lines.findIndex(line =>
      line.text.toLowerCase().includes(entry.correctAnswer.toLowerCase()),
    )
    if (lineIdx >= 0) {
      entityPositions.push({ entityId: entity.id, lineIndex: lineIdx })
    }
  }
  for (let i = 1; i < entityPositions.length; i++) {
    if (entityPositions[i].lineIndex < entityPositions[i - 1].lineIndex) {
      warnings.push({
        code: 'QUESTION_ORDER_VIOLATION',
        message: `Entity "${entityPositions[i].entityId}" appears before "${entityPositions[i - 1].entityId}" in transcript`,
        severity: 'warning',
      })
    }
  }

  // 6. Every fact in transcript is covered (no missing info entities)
  // (This checks the reverse: does the transcript contain info not in entities?)
  // For now, we skip this check — it's more about completeness

  // 7. Answer length validation
  for (const entry of answerKey.entries) {
    const entity = entities.find(e => e.id === entry.entityId)
    if (!entity) continue
    const wordCount = entry.correctAnswer.split(/\s+/).filter(Boolean).length
    if (wordCount < 1) {
      errors.push({
        code: 'ANSWER_TOO_SHORT',
        message: `Answer for "${entry.entityId}" is empty`,
        entityId: entry.entityId,
        questionNumber: entry.questionNumber,
        severity: 'error',
      })
    }
    if (wordCount > entity.wordLimit + 1) {
      warnings.push({
        code: 'ANSWER_TOO_LONG',
        message: `Answer for "${entry.entityId}" has ${wordCount} words (limit: ${entity.wordLimit})`,
        entityId: entry.entityId,
        questionNumber: entry.questionNumber,
        severity: 'warning',
      })
    }
  }

  // 8. Distractor validation — each distractor must not match final answer
  for (const distractor of distractors) {
    const entity = entities.find(e => e.id === distractor.entityId)
    if (!entity) continue
    if (distractor.distractorValue.toLowerCase() === entity.value.toLowerCase()) {
      errors.push({
        code: 'INVALID_DISTRACTOR',
        message: `Distractor ${distractor.distractorId} has same value as final answer`,
        entityId: distractor.entityId,
        severity: 'error',
      })
    }
  }

  // 9. Ambiguous answer detection
  for (const entry of answerKey.entries) {
    if (!entry.unambiguous) {
      warnings.push({
        code: 'AMBIGUOUS_ANSWER',
        message: `Answer "${entry.correctAnswer}" may be ambiguous without context`,
        entityId: entry.entityId,
        questionNumber: entry.questionNumber,
        severity: 'warning',
      })
    }
  }

  // 10. Check that distractors have transcript presence
  for (const distractor of distractors) {
    const found = transcript.lines.some(line =>
      line.text.toLowerCase().includes(distractor.distractorValue.toLowerCase()),
    )
    if (!found) {
      warnings.push({
        code: 'MISSING_DISTRACTOR',
        message: `Distractor "${distractor.distractorValue}" not found in transcript`,
        entityId: distractor.entityId,
        severity: 'warning',
      })
    }
  }

  // Summary
  const totalChecks = 10
  const failedChecks = errors.length
  const warningCount = warnings.length
  const passedChecks = totalChecks - errors.filter(e => e.severity === 'error').length

  const valid = errors.filter(e => e.severity === 'error').length === 0

  // Determine what needs regeneration
  let regenerateTargets: ValidationResult['regenerateTargets'] = undefined
  if (!valid) {
    const errorCodes = new Set(errors.map(e => e.code))
    if (errorCodes.has('MISSING_ANSWER') || errorCodes.has('ANSWER_NOT_IN_TRANSCRIPT')) {
      regenerateTargets = ['all']
    } else if (errorCodes.has('INVALID_DISTRACTOR') || errorCodes.has('ANSWER_BEFORE_CORRECTION')) {
      regenerateTargets = ['distractors']
    }
  }

  return {
    valid,
    errors,
    warnings,
    summary: {
      totalChecks,
      passedChecks,
      failedChecks,
      warningCount,
    },
    regenerateTargets,
  }
}

export const Validator = {
  validate,
}
