import type { ExerciseQualityReport } from './ielts-types'

export interface ListeningValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  quality?: ExerciseQualityReport
}

export function validateChronologicalOrder(
  questions: Array<{ id: string; number: number; evidence?: { startTimeMs?: number; endTimeMs?: number } }>,
): ListeningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const withTimestamps = questions.filter(q => q.evidence?.startTimeMs != null)
  
  for (let i = 1; i < withTimestamps.length; i++) {
    const prev = withTimestamps[i - 1]
    const curr = withTimestamps[i]
    if ((curr.evidence!.startTimeMs!) < (prev.evidence!.startTimeMs!)) {
      errors.push(`Question ${curr.number} (${curr.evidence!.startTimeMs}ms) appears before question ${prev.number} (${prev.evidence!.startTimeMs}ms) in transcript — violates chronological order`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateWordLimit(
  answer: string,
  limit: { maxWords: number; allowsNumber: boolean },
  questionId: string,
): ListeningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const words = answer.trim().split(/\s+/).filter(w => w.length > 0)
  const numbers = words.filter(w => /^\d+$/.test(w)).length
  const nonNumberWords = words.length - numbers

  if (nonNumberWords > limit.maxWords) {
    errors.push(`Question ${questionId}: answer "${answer}" has ${nonNumberWords} non-number words, exceeds limit of ${limit.maxWords}`)
  }
  if (numbers > 0 && !limit.allowsNumber) {
    warnings.push(`Question ${questionId}: answer "${answer}" contains numbers but numbers are not allowed`)
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function detectAmbiguousAnswer(
  questionId: string,
  correctAnswer: string,
  acceptableAlternatives: string[],
  _transcriptText: string,
): ListeningValidationResult {
  const warnings: string[] = []
  const allAnswers = [correctAnswer, ...acceptableAlternatives]
  
  const uniqueAnswers = new Set(allAnswers.map(a => a.toLowerCase().trim()))
  
  if (uniqueAnswers.size > 1 && allAnswers.length >= 2) {
    const shortOnes = allAnswers.filter(a => a.split(/\s+/).length === 1)
    const longOnes = allAnswers.filter(a => a.split(/\s+/).length >= 2)
    if (shortOnes.length > 0 && longOnes.length > 0) {
      if (longOnes.some(l => shortOnes.some(s => l.toLowerCase().includes(s.toLowerCase())))) {
        warnings.push(`Question ${questionId}: ambiguous — short answers (${shortOnes.join(', ')}) are contained within longer answers (${longOnes.join(', ')})`)
      }
    }
  }

  if (allAnswers.length >= 2) {
    warnings.push(`Question ${questionId}: multiple accepted forms (${allAnswers.join(', ')}) — verify this is intentional and unambiguous`)
  }

  return { valid: true, errors: [], warnings }
}

export function validateDistractors(
  options: string[],
  transcriptText: string,
  questionId: string,
): ListeningValidationResult {
  const warnings: string[] = []
  const transcriptLower = transcriptText.toLowerCase()

  for (const option of options) {
    const words = option.split(/\s+/).filter(w => w.length > 3)
    const matchingWords = words.filter(w => transcriptLower.includes(w.toLowerCase()))
    const matchRatio = words.length > 0 ? matchingWords.length / words.length : 0

    if (matchRatio === 0 && words.length >= 2 && option.length > 20) {
      warnings.push(`Question ${questionId}: distractor "${option}" has zero lexical overlap with transcript — may be obviously irrelevant`)
    }
  }

  return { valid: true, errors: [], warnings }
}

export function validateTranscriptAuthenticity(
  transcript: string,
  part: number,
): ListeningValidationResult {
  const warnings: string[] = []
  
  if (transcript.length < 200) {
    warnings.push(`Transcript is very short (${transcript.length} chars) — may not be realistic for IELTS Part ${part}`)
  }

  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
    : 0

  if (avgSentenceLength > 25 && part <= 2) {
    warnings.push(`Average sentence length (${Math.round(avgSentenceLength)} words) is too long for spoken ${part === 1 ? 'conversation' : 'monologue'} — sounds like written prose`)
  }

  const spokenMarkers = ['well', 'um', 'you know', 'I mean', 'actually', 'basically', 'sort of', 'kind of', 'right', 'okay', 'so']
  const hasSpokenMarkers = spokenMarkers.some(m => transcript.toLowerCase().includes(m))
  if (!hasSpokenMarkers) {
    warnings.push('Transcript lacks natural spoken discourse markers — may sound like written essay')
  }

  const hasCorrections = /no[,.]*\s+wait|actually[,.]*\s+let me|I mean[,.]*\s+not|sorry[,.]*\s+that's|rather[,.]*\s+it's/i.test(transcript)
  if (part <= 2 && !hasCorrections) {
    warnings.push('Transcript has no natural corrections or clarifications — typical of real spoken interaction')
  }

  return { valid: true, errors: [], warnings }
}

export function countListeningWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

export function createDefaultListeningDifficulty(band: number = 5.5) {
  return {
    targetBandRange: { minimum: band - 0.5, maximum: band },
    speechRateWordsPerMinute: band >= 7 ? 160 : band >= 5.5 ? 140 : 120,
    paraphraseDistance: band >= 7 ? 0.7 : band >= 5.5 ? 0.5 : 0.3,
    distractorDensity: band >= 7 ? 0.8 : band >= 5.5 ? 0.5 : 0.3,
    informationDensity: band >= 7 ? 0.8 : band >= 5.5 ? 0.5 : 0.3,
    speakerCount: 2,
    accentComplexity: band >= 7 ? 0.5 : 0.2,
    correctionFrequency: band >= 7 ? 0.6 : 0.3,
    inferenceDemand: band >= 7 ? 0.7 : 0.4,
    properNounDensity: 0.3,
    numberAndSpellingDemand: 0.5,
  }
}
