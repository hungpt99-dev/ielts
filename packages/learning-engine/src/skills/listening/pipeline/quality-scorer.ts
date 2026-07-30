// ═══════════════════════════════════════════════════════════════════════
// QualityScorer — Scores listening exercises 0-100
// ═══════════════════════════════════════════════════════════════════════

import type {
  ConversationScenario,
  Distractor,
  QualityDimension,
  QualityReport,
  QuestionSet,
  Transcript,
  ValidationResult,
} from './types'

export interface ScoreInput {
  scenario: ConversationScenario
  transcript: Transcript
  questionSet: QuestionSet
  distractors: Distractor[]
  validation: ValidationResult
}

const DEFAULT_THRESHOLD = 70

export function score(input: ScoreInput, threshold = DEFAULT_THRESHOLD): QualityReport {
  const { scenario, transcript, questionSet, distractors } = input
  const issues: string[] = []

  const naturalness = scoreNaturalness(transcript, scenario)
  const ieltsAuthenticity = scoreIELTSAuthenticity(scenario, questionSet)
  const difficultyAlignment = scoreDifficultyAlignment(scenario, transcript)
  const distractorQuality = scoreDistractorQuality(distractors, transcript, questionSet)
  const conversationFlow = scoreConversationFlow(transcript)
  const answerUniqueness = scoreAnswerUniqueness(questionSet, distractors)
  const questionClarity = scoreQuestionClarity(questionSet)
  const audioReadiness = scoreAudioReadiness(transcript, scenario)

  const dimensions = {
    naturalness,
    ieltsAuthenticity,
    difficultyAlignment,
    distractorQuality,
    conversationFlow,
    answerUniqueness,
    questionClarity,
    audioReadiness,
  }

  let totalScore = 0
  let totalWeight = 0
  for (const dim of Object.values(dimensions)) {
    totalScore += dim.score * dim.weight
    totalWeight += dim.weight
    if (dim.remarks.length > 0) issues.push(...dim.remarks)
  }
  totalScore = Math.round(totalScore / totalWeight)

  return {
    totalScore,
    passed: totalScore >= threshold,
    threshold,
    dimensions,
    issues,
  }
}

function scoreNaturalness(transcript: Transcript, scenario: ConversationScenario): QualityDimension {
  let score = 70
  const remarks: string[] = []

  // Check for conversational markers
  const hasQuestions = transcript.lines.some(l => l.text.includes('?'))
  const hasGreetings = transcript.lines.some(l => /^(Hello|Good (morning|afternoon|evening)|Hi)/i.test(l.text))
  const hasClosings = transcript.lines.some(l => /(goodbye|Thank you|bye)/i.test(l.text))
  const hasTurnTaking = new Set(transcript.lines.map(l => l.speakerId)).size > 1

  if (hasQuestions && hasGreetings) score += 10
  if (hasClosings) score += 5
  if (hasTurnTaking) score += 5

  // Check for corrections (natural speech)
  const corrections = transcript.lines.filter(l => l.isCorrection).length
  if (scenario.languageFeatures.allowCorrections && corrections > 0) score += 5
  if (corrections === 0 && scenario.languageFeatures.allowCorrections) {
    score -= 5
    remarks.push('No corrections present despite language profile allowing them')
  }

  // Check segment length variation
  const lengths = transcript.lines.map(l => l.text.split(/\s+/).length)
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length
  if (variance > 20) score += 5
  if (variance < 5) remarks.push('Lines have very uniform length — may sound robotic')

  if (hasGreetings && hasClosings && hasTurnTaking) score = Math.min(100, score + 5)
  else remarks.push('Missing conversational structure elements')

  return { name: 'naturalness', score: Math.max(0, Math.min(100, score)), weight: 0.18, remarks }
}

function scoreIELTSAuthenticity(scenario: ConversationScenario, questionSet: QuestionSet): QualityDimension {
  let score = 75
  const remarks: string[] = []

  // Check part-appropriate layout
  const partLayouts: Record<string, string[]> = {
    part1: ['form-completion', 'note-completion'],
    part2: ['table-completion', 'note-completion'],
    part3: ['note-completion', 'form-completion', 'multiple-choice'],
    part4: ['note-completion', 'summary-completion', 'flow-chart-completion'],
  }
  const expectedLayouts = partLayouts[scenario.part] || []
  const layoutMatch = expectedLayouts.includes(questionSet.layout)

  if (layoutMatch) score += 10
  else {
    score -= 10
    remarks.push(`Layout "${questionSet.layout}" is atypical for ${scenario.part}`)
  }

  // Question count appropriateness
  if (scenario.part === 'part1' && questionSet.totalQuestions >= 5 && questionSet.totalQuestions <= 10) score += 5
  if (scenario.part === 'part2' && questionSet.totalQuestions >= 5 && questionSet.totalQuestions <= 10) score += 5
  if (scenario.part === 'part3' && questionSet.totalQuestions >= 5 && questionSet.totalQuestions <= 10) score += 5
  if (scenario.part === 'part4' && questionSet.totalQuestions >= 8 && questionSet.totalQuestions <= 10) score += 5

  // Word limit instructions present
  if (questionSet.instructions.includes('NO MORE THAN')) score += 5
  else remarks.push('Missing standard IELTS word limit instruction')

  // Form label authenticity
  if (questionSet.layout === 'form-completion') {
    const form = questionSet.presentation as import('./types').FormLayout
    if (form.formTitle) score += 5
    if (form.sections && form.sections.length > 0) score += 5
    if (form.fields.every(f => f.label.length > 2)) score += 5
  }

  return { name: 'ieltsAuthenticity', score: Math.max(0, Math.min(100, score)), weight: 0.18, remarks }
}

function scoreDifficultyAlignment(scenario: ConversationScenario, transcript: Transcript): QualityDimension {
  let score = 70
  const remarks: string[] = []

  const wordCount = transcript.metadata.wordCount
  const band = scenario.targetBand

  // Expected word count ranges by band
  if (band <= 5.5 && wordCount >= 100 && wordCount <= 250) score += 10
  else if (band <= 7 && wordCount >= 200 && wordCount <= 350) score += 10
  else if (band > 7 && wordCount >= 250 && wordCount <= 400) score += 10
  else remarks.push(`Word count (${wordCount}) may not align with target band ${band}`)

  // Lexical density check
  if (band <= 5.5 && transcript.metadata.lexicalDensity < 0.5) score += 5
  if (band > 5.5 && transcript.metadata.lexicalDensity > 0.4) score += 5

  // Speech rate check
  if (band <= 5.5 && transcript.metadata.speechRateWpm <= 140) score += 5
  if (band > 5.5 && transcript.metadata.speechRateWpm >= 140) score += 5

  // Entity complexity check
  const entityCategories = scenario.expectedEntities.map(e => e.category)
  const simpleCategories = ['personal-name', 'phone-number', 'address', 'date', 'time']
  const complexCategories = ['policy-detail', 'reason', 'opinion']
  const hasComplex = entityCategories.some(c => complexCategories.includes(c))
  const mostlySimple = entityCategories.every(c => simpleCategories.includes(c))

  if (band <= 5.5 && mostlySimple) score += 5
  if (band > 7 && hasComplex) score += 5
  if (band <= 5.5 && hasComplex) remarks.push('Complex entity types for easy exercise')

  return { name: 'difficultyAlignment', score: Math.max(0, Math.min(100, score)), weight: 0.12, remarks }
}

function scoreDistractorQuality(distractors: Distractor[], transcript: Transcript, questionSet: QuestionSet): QualityDimension {
  let score = 50
  const remarks: string[] = []

  if (distractors.length === 0) {
    score = 60
    remarks.push('No distractors present — reduce difficulty for higher bands')
    return { name: 'distractorQuality', score, weight: 0.14, remarks }
  }

  // Each distractor should appear in transcript
  let transcriptHits = 0
  for (const distractor of distractors) {
    const found = transcript.lines.some(line =>
      line.text.toLowerCase().includes(distractor.distractorValue.toLowerCase()),
    )
    if (found) transcriptHits++
  }
  const hitRate = transcriptHits / distractors.length
  score += Math.round(hitRate * 20)

  // Each distractor type should be varied
  const types = new Set(distractors.map(d => d.type))
  if (types.size >= 2) score += 10
  if (types.size >= 3) score += 10

  // Each distractor should relate to a question
  const questionEntities = new Set(questionSet.entities.map(e => e.id))
  const relevantDistractors = distractors.filter(d => questionEntities.has(d.entityId))
  if (relevantDistractors.length === distractors.length) score += 10

  if (hitRate < 1) remarks.push('Some distractors not verifiable in transcript')

  return { name: 'distractorQuality', score: Math.max(0, Math.min(100, score)), weight: 0.14, remarks }
}

function scoreConversationFlow(transcript: Transcript): QualityDimension {
  let score = 70
  const remarks: string[] = []

  const speakers = new Set(transcript.lines.map(l => l.speakerId))
  const lineCount = transcript.lines.length

  if (lineCount >= 8) score += 10
  if (lineCount >= 12) score += 5
  if (lineCount < 4) {
    score -= 20
    remarks.push('Very short conversation')
  }

  // Speaker turns
  if (speakers.size >= 2) {
    const turns = countSpeakerTurns(transcript)
    if (turns >= 3) score += 10
    if (turns >= 5) score += 5
    if (turns < 2) remarks.push('Limited speaker interaction')
  }

  return { name: 'conversationFlow', score: Math.max(0, Math.min(100, score)), weight: 0.10, remarks }
}

function countSpeakerTurns(transcript: Transcript): number {
  let turns = 0
  let lastSpeaker = ''
  for (const line of transcript.lines) {
    if (line.speakerId !== lastSpeaker) {
      turns++
      lastSpeaker = line.speakerId
    }
  }
  return turns
}

function scoreAnswerUniqueness(questionSet: QuestionSet, distractors: Distractor[]): QualityDimension {
  let score = 80
  const remarks: string[] = []

  const answers = questionSet.entities.map(e => e.value.toLowerCase().trim())
  const uniqueAnswers = new Set(answers)

  if (uniqueAnswers.size === answers.length) score += 10
  else {
    score -= 10
    remarks.push('Duplicate answers detected')
  }

  // Answers should be distinct from distractors
  for (const distractor of distractors) {
    const entity = questionSet.entities.find(e => e.id === distractor.entityId)
    if (entity && distractor.distractorValue.toLowerCase() === entity.value.toLowerCase()) {
      score -= 15
      remarks.push('Distractor matches final answer')
      break
    }
  }

  // Answer variety
  const lengths = questionSet.entities.map(e => e.value.split(/\s+/).length)
  if (lengths.some(l => l > 1)) score += 5

  return { name: 'answerUniqueness', score: Math.max(0, Math.min(100, score)), weight: 0.12, remarks }
}

function scoreQuestionClarity(questionSet: QuestionSet): QualityDimension {
  let score = 80
  const remarks: string[] = []

  const instructions = questionSet.instructions
  if (instructions.length > 20) score += 5
  if (instructions.includes('NO MORE THAN')) score += 5

  // Check field labels are clear
  if (questionSet.layout === 'form-completion') {
    const form = questionSet.presentation as import('./types').FormLayout
    const shortLabels = form.fields.filter(f => f.label.length < 3)
    if (shortLabels.length > 0) {
      score -= shortLabels.length * 3
      remarks.push('Some form labels are too short')
    }
  }

  return { name: 'questionClarity', score: Math.max(0, Math.min(100, score)), weight: 0.08, remarks }
}

function scoreAudioReadiness(transcript: Transcript, scenario: ConversationScenario): QualityDimension {
  let score = 60
  const remarks: string[] = []

  // Numbers spelled out explicitly for TTS
  const hasNumbers = /\d/.test(transcript.plainText)
  if (!hasNumbers) score += 10

  // Names that benefit from spelling
  const hasSpellableContent = transcript.lines.some(l =>
    /[A-Z]{2,}/.test(l.text) || /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(l.text),
  )
  if (hasSpellableContent) score += 5

  // Reasonable duration
  const duration = transcript.metadata.estimatedSpeakingTimeSeconds
  if (duration >= 60 && duration <= 300) score += 10
  if (duration < 30) remarks.push('Very short audio — under 30 seconds')

  // Appropriate for part
  const expectedTimes: Record<string, [number, number]> = {
    part1: [60, 120],
    part2: [90, 150],
    part3: [120, 200],
    part4: [180, 300],
  }
  const range = expectedTimes[scenario.part]
  if (range && duration >= range[0] && duration <= range[1]) score += 10
  else if (range) remarks.push(`Duration (${duration}s) outside typical range for ${scenario.part}`)

  return { name: 'audioReadiness', score: Math.max(0, Math.min(100, score)), weight: 0.08, remarks }
}

export const QualityScorer = {
  score,
}
