// ═══════════════════════════════════════════════════════════════════════
// Part3Strategy — IELTS Listening Part 3: Academic discussion (2-4 speakers)
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
  makeDistractorLine,
  makeLine,
} from './shared'
import { pickQuestionType } from '../question-types'
import type { TranscriptLine } from '../types'

const TOPICS = [
  'Research Project Discussion',
  'Course Feedback Session',
  'Presentation Preparation',
  'Field Trip Planning',
  'Academic Interview',
  'Group Assignment Discussion',
  'Laboratory Discussion',
  'Study Abroad Advice',
  'Work Placement Discussion',
  'Thesis Planning Meeting',
]

const ALLOWED_LAYOUTS: QuestionLayout[] = ['note-completion', 'table-completion', 'multiple-choice', 'matching']

const ENTITY_CATEGORIES_PART3: InformationEntity['category'][] = [
  'opinion', 'reason', 'date', 'action-item',
  'product-name', 'place-name', 'duration', 'quantity',
  'occupation', 'reference-number', 'policy-detail',
]

export const part3Strategy: ListeningPartStrategy = {
  part: 'part3' as ListeningPart,
  topics: TOPICS,
  speakerCount: 3,
  allowedLayouts: ALLOWED_LAYOUTS,
  defaultQuestionCount: 6,
  distractorEnabled: true,

  createSpeakers(): SpeakerProfile[] {
    return [
      { id: 's1', name: 'Dr. Thompson', role: 'Tutor', accent: 'british', gender: 'female', traits: ['encouraging', 'analytical'] },
      { id: 's2', name: 'James', role: 'Student', accent: 'neutral', gender: 'male', traits: ['curious', 'thoughtful'] },
      { id: 's3', name: 'Maria', role: 'Student', accent: 'australian', gender: 'female', traits: ['confident', 'practical'] },
    ]
  },

  getLanguageFeatures(targetBand: number): LanguageFeatureProfile {
    return {
      allowHesitations: true,
      allowFillers: true,
      allowCorrections: targetBand >= 6.0,
      allowInterruptions: true,
      allowEllipsis: true,
      formality: 'semi-formal',
      speechPace: 'moderate',
      vocabularyLevel: targetBand <= 6.0 ? 'intermediate' : 'advanced',
    }
  },

  getExpectedEntities(questionCount: number): InformationEntity[] {
    const count = Math.min(questionCount + 2, ENTITY_CATEGORIES_PART3.length)
    return ENTITY_CATEGORIES_PART3.slice(0, count).map((category, i) => ({
      id: `e-${i}`,
      category,
      value: '',
      wordLimit: category === 'opinion' || category === 'reason' || category === 'policy-detail' ? 3 : 2,
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
      part: 'part3',
      topic,
      subTopic: '',
      setting: `A tutor and students discuss ${topic.toLowerCase()} in an academic setting. The conversation includes agreement, disagreement, and opinion changes.`,
      speakers,
      exchangeType: 'interview',
      expectedEntities: entities,
      targetBand: config.targetBand,
      estimatedDurationMinutes: 4,
      languageFeatures: langFeatures,
    }
  },

  buildTranscript(input: PartTranscriptInput): Transcript {
    const { scenario, distractors } = input
    const lines = buildPart3Discussion(scenario, distractors)
    const plainText = lines.map(l => l.text).join(' ')

    const transcript: Transcript = {
      transcriptId: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scenarioId: scenario.scenarioId,
      lines,
      plainText,
      metadata: null as unknown as Transcript['metadata'],
    }
    transcript.metadata = buildTranscriptMetadata(transcript, scenario, distractors)
    return transcript
  },

  buildQuestions(input: PartQuestionInput): QuestionSet {
    const { scenario, transcript, questionCount } = input
    const count = Math.min(questionCount, scenario.expectedEntities.filter(e => e.tested).length)
    const entities = scenario.expectedEntities.filter(e => e.tested).slice(0, count)

    const qt = pickQuestionType('part3')
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

  buildDistractors(input: PartDistractorInput): Distractor[] {
    return buildPart3Distractors(input)
  },

  validatePart(input: PartValidationInput): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const { questionSet, transcript } = input

    // Part 3: Check that multiple speakers participate
    const speakerIds = new Set(transcript.lines.map(l => l.speakerId))
    if (speakerIds.size < 2) {
      errors.push({ code: 'ANSWER_NOT_IN_TRANSCRIPT', message: 'Part 3 must have at least 2 speakers', severity: 'error' })
    }

    // Part 3: opinions should come from different speakers (consistency check)
    const opinionEntities = questionSet.entities.filter(e => e.category === 'opinion')
    if (opinionEntities.length > 1) {
      const opinionLines = transcript.lines.filter(l =>
        opinionEntities.some(e => l.text.includes(e.value)),
      )
      const opinionSpeakers = new Set(opinionLines.map(l => l.speakerId))
      if (opinionSpeakers.size < 2) {
        warnings.push({ code: 'AMBIGUOUS_ANSWER', message: 'Part 3 opinions should come from multiple speakers', severity: 'warning' })
      }
    }

    // Part 3: layout should not be form-completion
    if (questionSet.layout === 'form-completion') {
      errors.push({ code: 'QUESTION_ORDER_VIOLATION', message: 'Form completion is not appropriate for Part 3', severity: 'error' })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: { totalChecks: 3, passedChecks: 3 - errors.length, failedChecks: errors.length, warningCount: warnings.length },
    }
  },
}

// ─── Part 3 Discussion Builder ─────────────────────────────────────────

function buildPart3Discussion(scenario: ConversationScenario, distractors: Distractor[]): TranscriptLine[] {
  const lines: TranscriptLine[] = []
  const [tutor, student1, student2] = scenario.speakers
  const distractorMap = new Map(distractors.map(d => [d.entityId, d]))

  // Opening — tutor introduces the topic
  lines.push(makeLine(tutor, `Right, let's talk about ${scenario.topic.toLowerCase()}. How is everyone getting on?`, false, false, false))
  lines.push(makeLine(student1, `I've been working on it. Actually, I wanted to discuss a few things.`, false, false, false))
  lines.push(makeLine(student2, `Yes, I have some thoughts on this as well.`, false, false, false))

  // Entity discussion with agreement/disagreement/opinion changes
  for (let i = 0; i < scenario.expectedEntities.length; i++) {
    const entity = scenario.expectedEntities[i]
    const distractor = distractorMap.get(entity.id)

    // Part 3: different speakers ask about different things
    const asker = [tutor, student1, student2][i % 3]
    const answerer = [student1, student2, tutor][i % 3]

    // Part 3 natural question style
    const questionStyles: Record<string, string[]> = {
      'opinion': ["What's your view on this?", "How do you feel about that?", "What do you think?"],
      'reason': ["Why do you think that is?", "What's the reason behind that?", "Can you explain why?"],
      'date': ["When do you think we should aim for?", "What's the timeline on that?"],
      'action-item': ["What do you think we should do next?", "What's your suggestion?"],
      'product-name': ["Which approach do you recommend?", "What tool are you thinking of using?"],
      'place-name': ["Where should we do that?", "Which venue do you suggest?"],
    }
    const qOpts = questionStyles[entity.category] || ["What about this?", "Any thoughts on that?"]
    const question = qOpts[Math.floor(Math.random() * qOpts.length)]

    if (distractor) {
      // Part 3 distractor: someone suggests wrong thing, then corrected
      lines.push(makeLine(asker, question, false, false, false))
      lines.push(makeLine(answerer, makeDistractorLine(entity, distractor), false, false, false))
      if (scenario.speakers.length > 2) {
        const third = scenario.speakers.find(s => s.id !== asker.id && s.id !== answerer.id) || tutor
        lines.push(makeLine(third, `Hmm, I don't think that's right. ${entity.value} would be better.`, false, true, false))
      } else {
        lines.push(makeLine(tutor, `Actually, I think ${entity.value} makes more sense.`, false, true, false))
      }
    } else {
      lines.push(makeLine(asker, question, false, false, false))
      // Part 3: sometimes use hesitation for naturalness
      if (scenario.languageFeatures.allowHesitations && Math.random() > 0.5 && answerer.id !== tutor.id) {
        lines.push(makeLine(answerer, `Um, well... I think it's ${entity.value}.`, false, false, true))
      } else {
        lines.push(makeLine(answerer, `I think it's ${entity.value}.`, false, false, false))
      }
    }

    // Agreement/disagreement from another speaker
    if (scenario.speakers.length > 2 && Math.random() > 0.4) {
      const other = scenario.speakers.find(s => s.id !== asker.id && s.id !== answerer.id) || tutor
      const reactions = [
        `I agree with that.`,
        `Yes, that makes sense.`,
        `That's a good point.`,
        `I'm not sure I agree with that, actually.`,
        `Hmm, I see it slightly differently.`,
      ]
      lines.push(makeLine(other, reactions[Math.floor(Math.random() * reactions.length)], false, false, false))
    }
  }

  // Closing
  lines.push(makeLine(tutor, `OK, that was really helpful. Let's summarise what we've discussed.`, false, false, false))
  if (student2) lines.push(makeLine(student2, `Thank you. I think we have a clear plan now.`, false, false, false))

  return lines
}

// ─── Part 3 Distractors ────────────────────────────────────────────────

function buildPart3Distractors(input: PartDistractorInput): Distractor[] {
  const { scenario, maxDistractors } = input
  if (!scenario.languageFeatures.allowCorrections || maxDistractors <= 0) return []

  // Part 3: distractors are opinion changes or alternative suggestions
  const eligible = scenario.expectedEntities.filter(e => ['opinion', 'reason', 'product-name', 'place-name', 'action-item'].includes(e.category) && e.value)
  const selected = [...eligible].sort(() => Math.random() - 0.5).slice(0, Math.min(maxDistractors, eligible.length))

  return selected.map((entity, i) => ({
    distractorId: `d3-${Date.now()}-${i}`,
    type: 'alternative-rejected' as const,
    entityId: entity.id,
    distractorValue: entity.value + ' (alternative)',
    speakerId: scenario.speakers[1].id,
    lineIndex: -1,
    correctedBySpeakerId: scenario.speakers[2]?.id || scenario.speakers[0].id,
    correctionLineIndex: -1,
    correctionPhrase: `${entity.value} would be a better choice`,
  }))
}
