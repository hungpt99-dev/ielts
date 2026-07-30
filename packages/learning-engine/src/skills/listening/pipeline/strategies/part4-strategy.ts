// ═══════════════════════════════════════════════════════════════════════
// Part4Strategy — IELTS Listening Part 4: Academic lecture (1 speaker)
// ═══════════════════════════════════════════════════════════════════════

import type {
  ConversationScenario,
  Distractor,
  InformationEntity,
  LanguageFeatureProfile,
  ListeningPart,
  PipelineConfig,
  QuestionLayout,
  QuestionSet,
  SpeakerProfile,
  Transcript,
  ValidationError,
  ValidationResult,
} from '../types'
import type {
  ListeningPartStrategy,
  PartDistractorInput,
  PartQuestionInput,
  PartTranscriptInput,
  PartValidationInput,
} from './part-strategy'
import {
  buildTranscriptMetadata,
  fillEntityValues,
  makeLine,
} from './shared'
import { pickQuestionType } from '../question-types'

const TOPICS = [
  'Climate Change and Marine Ecosystems',
  'The Psychology of Learning',
  'Urban Development and Planning',
  'Ancient Civilizations',
  'Business Innovation Strategies',
  'Environmental Conservation',
  'Educational Reform',
  'Public Health Policy',
  'Technological Disruption',
  'Behavioural Economics',
]

const ALLOWED_LAYOUTS: QuestionLayout[] = ['note-completion', 'summary-completion', 'sentence-completion']

const ENTITY_CATEGORIES_PART4: InformationEntity['category'][] = [
  'policy-detail', 'reason', 'date', 'quantity',
  'product-name', 'place-name', 'measurement', 'duration',
  'opinion', 'reference-number',
]

export const part4Strategy: ListeningPartStrategy = {
  part: 'part4' as ListeningPart,
  topics: TOPICS,
  speakerCount: 1,
  allowedLayouts: ALLOWED_LAYOUTS,
  defaultQuestionCount: 8,
  distractorEnabled: false,

  createSpeakers(): SpeakerProfile[] {
    return [
      { id: 'speaker-1', name: 'Professor Evans', role: 'Lecturer', accent: 'british', gender: 'female', traits: ['authoritative', 'clear', 'academic'] },
    ]
  },

  getLanguageFeatures(targetBand: number): LanguageFeatureProfile {
    return {
      allowHesitations: false,
      allowFillers: false,
      allowCorrections: false,
      allowInterruptions: false,
      allowEllipsis: false,
      formality: 'academic',
      speechPace: targetBand <= 6.0 ? 'moderate' : 'fast',
      vocabularyLevel: targetBand <= 6.0 ? 'intermediate' : 'advanced',
    }
  },

  getExpectedEntities(questionCount: number): InformationEntity[] {
    const count = Math.min(questionCount + 2, ENTITY_CATEGORIES_PART4.length)
    return ENTITY_CATEGORIES_PART4.slice(0, count).map((category, i) => ({
      id: `e-${i}`,
      category,
      value: '',
      wordLimit: category === 'policy-detail' || category === 'reason' || category === 'opinion' ? 3 : 2,
      tested: true,
    }))
  },

  createScenario(config: PipelineConfig): ConversationScenario {
    const topic = config.topic || TOPICS[Math.floor(Math.random() * TOPICS.length)]
    const speakers = this.createSpeakers()
    const entities = fillEntityValues(this.getExpectedEntities(config.questionCount))
    const langFeatures = this.getLanguageFeatures(config.targetBand)

    return {
      scenarioId: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      part: 'part4',
      topic,
      subTopic: '',
      setting: `A university lecture on ${topic.toLowerCase()}. The lecturer presents structured academic content with detailed evidence and analysis.`,
      speakers,
      exchangeType: 'lecture',
      expectedEntities: entities,
      targetBand: config.targetBand,
      estimatedDurationMinutes: 5,
      languageFeatures: langFeatures,
    }
  },

  buildTranscript(input: PartTranscriptInput): Transcript {
    const { scenario } = input
    const lecturer = scenario.speakers[0]
    const lines: ReturnType<typeof makeLine>[] = []

    // Academic opening
    lines.push(makeLine(lecturer, `Good morning, everyone. In today's lecture, we'll be examining ${scenario.topic.toLowerCase()}. This is a topic of considerable importance in the field, and I'd like to cover several key aspects.`, false, false, false))
    lines.push(makeLine(lecturer, `Let me begin by providing some background context before we move into the specific details.`, false, false, false))

    // Lecture body — each entity gets its own paragraph
    for (let i = 0; i < scenario.expectedEntities.length; i++) {
      const entity = scenario.expectedEntities[i]

      // Academic-style lead-in
      const transitions = [
        'Now, turning to the next point,',
        'Furthermore, it is worth noting that',
        'Another significant aspect to consider is that',
        'Moving on, I would like to address',
        'In addition to this,',
        'A further important point is that',
        'Regarding the next aspect,',
        'Let me also mention that',
      ]
      const transition = transitions[i % transitions.length]

      // Entity statement with academic wrapping
      const entityStatement = buildAcademicStatement(entity)
      lines.push(makeLine(lecturer, `${transition} ${entityStatement}`, false, false, false))
    }

    // Academic closing with summary lead-in
    lines.push(makeLine(lecturer, `To summarise, these points highlight the key aspects of ${scenario.topic.toLowerCase()}.`, false, false, false))
    lines.push(makeLine(lecturer, `In the next lecture, we'll continue this discussion and explore some of these themes in greater depth. Any questions before we finish?`, false, false, false))

    const plainText = lines.map(l => l.text).join(' ')

    const transcript: Transcript = {
      transcriptId: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scenarioId: scenario.scenarioId,
      lines,
      plainText,
      metadata: null as unknown as Transcript['metadata'],
    }
    transcript.metadata = buildTranscriptMetadata(transcript, scenario, [])
    return transcript
  },

  buildQuestions(input: PartQuestionInput): QuestionSet {
    const { scenario, transcript, questionCount } = input
    const count = Math.min(questionCount, scenario.expectedEntities.filter(e => e.tested).length)
    const entities = scenario.expectedEntities.filter(e => e.tested).slice(0, count)

    const qt = pickQuestionType('part4')
    const output = qt.build({ entities, scenarioTitle: scenario.topic, scenarioTopic: scenario.topic })

    return {
      questionSetId: `qs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scenarioId: scenario.scenarioId,
      transcriptId: transcript.transcriptId,
      layout: output.layout,
      presentation: output.presentation,
      entities,
      instructions: output.instructions,
      totalQuestions: output.totalQuestions,
    }
  },

  buildDistractors(_input: PartDistractorInput): Distractor[] {
    return []
  },

  validatePart(input: PartValidationInput): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const { questionSet, transcript, distractors } = input

    // Part 4: No distractors
    if (distractors.length > 0) {
      warnings.push({ code: 'INVALID_DISTRACTOR', message: 'Part 4 lectures should not have distractors', severity: 'warning' })
    }

    // Part 4: Layout must be note/summary/sentence completion
    if (questionSet.layout === 'form-completion') {
      errors.push({ code: 'QUESTION_ORDER_VIOLATION', message: 'Form completion is not appropriate for Part 4', severity: 'error' })
    }

    // Part 4: Only one speaker
    const speakerIds = new Set(transcript.lines.map(l => l.speakerId))
    if (speakerIds.size > 1) {
      warnings.push({ code: 'AMBIGUOUS_ANSWER', message: 'Part 4 should have exactly one speaker', severity: 'warning' })
    }

    // Part 4: Answers should be unique (lecture notes don't repeat facts)
    const values = questionSet.entities.map(e => e.value.toLowerCase())
    const uniqueValues = new Set(values)
    if (uniqueValues.size < values.length) {
      warnings.push({ code: 'DUPLICATE_ANSWER', message: 'Duplicate answers in lecture notes', severity: 'warning' })
    }

    // Part 4: Minimum question count for a lecture
    if (questionSet.totalQuestions < 6) {
      warnings.push({ code: 'ANSWER_TOO_SHORT', message: 'Part 4 should have at least 6 questions', severity: 'warning' })
    }

    // Part 4: transcript should be longer than other parts
    const wordCount = transcript.plainText.split(/\s+/).filter(Boolean).length
    if (wordCount < 150) {
      warnings.push({ code: 'ANSWER_TOO_SHORT', message: `Lecture transcript too short (${wordCount} words). Part 4 should be 200+ words.`, severity: 'warning' })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: { totalChecks: 6, passedChecks: 6 - errors.length, failedChecks: errors.length, warningCount: warnings.length },
    }
  },
}

// ─── Academic statement builder ─────────────────────────────────────────

function buildAcademicStatement(entity: InformationEntity): string {
  const wrappers: Record<string, string[]> = {
    'policy-detail': [`the policy states that ${entity.value}`, `according to current guidelines, ${entity.value}`, `regulations specify that ${entity.value}`],
    'reason': [`the primary reason for this appears to be ${entity.value}`, `research suggests this is due to ${entity.value}`, `this can be attributed to ${entity.value}`],
    'date': [`this development began on ${entity.value}`, `the key milestone was reached on ${entity.value}`, `a significant date is ${entity.value}`],
    'quantity': [`the figures show approximately ${entity.value}`, `studies indicate a figure of around ${entity.value}`, `estimates suggest ${entity.value}`],
    'product-name': [`the methodology known as ${entity.value}`, `the approach called ${entity.value}`, `the system referred to as ${entity.value}`],
    'place-name': [`this was conducted at ${entity.value}`, `the site is located in ${entity.value}`, `the research took place in ${entity.value}`],
    'measurement': [`the measurements indicate approximately ${entity.value}`, `the scale is roughly ${entity.value}`, `dimensions are estimated at ${entity.value}`],
    'duration': [`this process takes approximately ${entity.value}`, `the timeline extends to about ${entity.value}`, `the period spans roughly ${entity.value}`],
    'opinion': [`many experts argue that ${entity.value}`, `the prevailing view is that ${entity.value}`, `a significant perspective is that ${entity.value}`],
    'reference-number': [`the study reference is ${entity.value}`, `cited as ${entity.value} in the literature`, `referenced as ${entity.value}`],
  }
  const options = wrappers[entity.category] || [`one important detail is that ${entity.value}`]
  return options[Math.floor(Math.random() * options.length)] + '.'
}
