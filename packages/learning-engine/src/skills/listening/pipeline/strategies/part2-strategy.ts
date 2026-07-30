// ═══════════════════════════════════════════════════════════════════════
// Part2Strategy — IELTS Listening Part 2: Social monologue
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
  makeMonologueStatement,
} from './shared'
import { pickQuestionType } from '../question-types'

const TOPICS = [
  'Museum Guide',
  'Campus Tour',
  'City Walking Tour',
  'Park Information',
  'Event Introduction',
  'Exhibition Guide',
  'Community Centre',
  'Training Programme',
  'Facility Description',
  'Travel Destination',
]

const ALLOWED_LAYOUTS: QuestionLayout[] = ['note-completion', 'table-completion', 'multiple-choice', 'matching']

const ENTITY_CATEGORIES_PART2: InformationEntity['category'][] = [
  'date', 'time', 'place-name', 'duration', 'price',
  'transport-method', 'action-item', 'policy-detail',
  'quantity', 'measurement', 'reference-number', 'phone-number',
]

export const part2Strategy: ListeningPartStrategy = {
  part: 'part2' as ListeningPart,
  topics: TOPICS,
  speakerCount: 1,
  allowedLayouts: ALLOWED_LAYOUTS,
  defaultQuestionCount: 6,
  distractorEnabled: false,

  createSpeakers(): SpeakerProfile[] {
    return [
      { id: 'speaker-1', name: 'Guide', role: 'Tour Guide', accent: 'british', gender: 'female', traits: ['enthusiastic', 'informative', 'clear'] },
    ]
  },

  getLanguageFeatures(targetBand: number): LanguageFeatureProfile {
    return {
      allowHesitations: false,
      allowFillers: false,
      allowCorrections: false,
      allowInterruptions: false,
      allowEllipsis: false,
      formality: 'semi-formal',
      speechPace: targetBand <= 5.5 ? 'slow' : 'moderate',
      vocabularyLevel: targetBand <= 5.5 ? 'basic' : 'intermediate',
    }
  },

  getExpectedEntities(questionCount: number): InformationEntity[] {
    const count = Math.min(questionCount + 2, ENTITY_CATEGORIES_PART2.length)
    return ENTITY_CATEGORIES_PART2.slice(0, count).map((category, i) => ({
      id: `e-${i}`,
      category,
      value: '',
      wordLimit: category === 'policy-detail' || category === 'action-item' ? 3 : 2,
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
      part: 'part2',
      topic,
      subTopic: '',
      setting: `A guide leads visitors through a location, describing points of interest and providing practical information about ${topic.toLowerCase()}.`,
      speakers,
      exchangeType: 'tour-guide',
      expectedEntities: entities,
      targetBand: config.targetBand,
      estimatedDurationMinutes: 3,
      languageFeatures: langFeatures,
    }
  },

  buildTranscript(input: PartTranscriptInput): Transcript {
    const { scenario } = input
    const guide = scenario.speakers[0]
    const lines: ReturnType<typeof makeLine>[] = []

    // Opening
    lines.push(makeLine(guide, `Good morning everyone, and welcome to today's ${scenario.topic.toLowerCase()}. My name is ${guide.name}, and I'll be your guide.`, false, false, false))
    lines.push(makeLine(guide, `Before we begin, let me give you an overview of what we'll be covering today.`, false, false, false))

    // Entity statements — each as a separate paragraph-like line
    for (const entity of scenario.expectedEntities) {
      lines.push(makeLine(guide, makeMonologueStatement(entity), false, false, false))
    }

    // Closing
    const closings = [
      "That concludes our introduction for today. Are there any questions?",
      "Thank you for listening. I hope you found this information useful. Please feel free to ask any questions.",
      "So that's the key information. Please explore at your own pace and enjoy your visit.",
    ]
    lines.push(makeLine(guide, closings[Math.floor(Math.random() * closings.length)], false, false, false))

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

    const qt = pickQuestionType('part2')
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
    const { questionSet, distractors } = input

    // Part 2: No distractors expected in monologue
    if (distractors.length > 0) {
      warnings.push({ code: 'INVALID_DISTRACTOR', message: 'Part 2 should not have distractors', severity: 'warning' })
    }

    // Part 2: all entities should be factual (not opinions)
    const opinionCats = new Set(['opinion'])
    for (const e of questionSet.entities) {
      if (opinionCats.has(e.category)) {
        warnings.push({ code: 'AMBIGUOUS_ANSWER', message: 'Part 2 should not test opinions', entityId: e.id, severity: 'warning' })
      }
    }

    // Part 2: layout should not be form-completion
    if (questionSet.layout === 'form-completion') {
      errors.push({ code: 'QUESTION_ORDER_VIOLATION', message: 'Form completion is not appropriate for Part 2', severity: 'error' })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: { totalChecks: 3, passedChecks: 3 - errors.length, failedChecks: errors.length, warningCount: warnings.length },
    }
  },
}
