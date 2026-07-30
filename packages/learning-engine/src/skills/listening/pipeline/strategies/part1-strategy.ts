// ═══════════════════════════════════════════════════════════════════════
// Part1Strategy — IELTS Listening Part 1: Everyday social conversation
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
  makeAnswerLine,
  makeConfirmLine,
  makeCorrectionLine,
  makeDistractorLine,
  makeLine,
  makeQuestionLine,
} from './shared'
import { pickQuestionType } from '../question-types'

const TOPICS = [
  'Hotel Reservation',
  'Booking a Tour',
  'Medical Appointment',
  'Gym Membership',
  'Library Registration',
  'Transport Enquiry',
  'Club Registration',
  'Course Registration',
  'Renting a Property',
  'Bank Account Opening',
]

const ALLOWED_LAYOUTS: QuestionLayout[] = ['form-completion', 'note-completion']

const ENTITY_CATEGORIES_PART1: InformationEntity['category'][] = [
  'personal-name', 'phone-number', 'address', 'date', 'time',
  'price', 'reference-number', 'quantity', 'transport-method',
  'payment-method', 'document-type', 'place-name',
]

export const part1Strategy: ListeningPartStrategy = {
  part: 'part1' as ListeningPart,
  topics: TOPICS,
  speakerCount: 2,
  allowedLayouts: ALLOWED_LAYOUTS,
  defaultQuestionCount: 6,
  distractorEnabled: true,

  createSpeakers(): SpeakerProfile[] {
    return [
      { id: 'speaker-1', name: 'Receptionist', role: 'Staff', accent: 'british', gender: 'female', traits: ['helpful', 'efficient'] },
      { id: 'speaker-2', name: 'Customer', role: 'Caller', accent: 'neutral', gender: 'male', traits: ['polite', 'detailed'] },
    ]
  },

  getLanguageFeatures(targetBand: number): LanguageFeatureProfile {
    return {
      allowHesitations: false,
      allowFillers: false,
      allowCorrections: targetBand >= 5.5,
      allowInterruptions: false,
      allowEllipsis: true,
      formality: 'semi-formal',
      speechPace: targetBand <= 5.5 ? 'slow' : 'moderate',
      vocabularyLevel: targetBand <= 5.5 ? 'basic' : 'intermediate',
    }
  },

  getExpectedEntities(questionCount: number): InformationEntity[] {
    const count = Math.min(questionCount + 2, ENTITY_CATEGORIES_PART1.length)
    return ENTITY_CATEGORIES_PART1.slice(0, count).map((category, i) => ({
      id: `e-${i}`,
      category,
      value: '',
      wordLimit: category === 'address' || category === 'policy-detail' ? 3
        : category === 'personal-name' || category === 'date' ? 2 : 1,
      tested: true,
    }))
  },

  createScenario(config: PipelineConfig): ConversationScenario {
    const topic = config.topic || TOPICS[Math.floor(Math.random() * TOPICS.length)]
    const exchangeType = pickExchangeType(topic)
    const speakers = this.createSpeakers()
    const entities = fillEntityValues(this.getExpectedEntities(config.questionCount))
    const langFeatures = this.getLanguageFeatures(config.targetBand)

    return {
      scenarioId: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      part: 'part1',
      topic,
      subTopic: '',
      setting: SETTINGS[exchangeType] || SETTINGS.enquiry,
      speakers,
      exchangeType,
      expectedEntities: entities,
      targetBand: config.targetBand,
      estimatedDurationMinutes: 3,
      languageFeatures: langFeatures,
    }
  },

  buildTranscript(input: PartTranscriptInput): Transcript {
    const { scenario, distractors } = input
    const lines = buildPart1Conversation(scenario, distractors)
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
    return buildPart1Questions(input)
  },

  buildDistractors(input: PartDistractorInput): Distractor[] {
    return buildPart1Distractors(input)
  },

  validatePart(input: PartValidationInput): ValidationResult {
    return validatePart1(input)
  },
}

// ─── Part 1 Exchange Type ──────────────────────────────────────────────

type P1Exchange = ConversationScenario['exchangeType']

function pickExchangeType(topic: string): P1Exchange {
  const t = topic.toLowerCase()
  if (t.includes('hotel') || t.includes('booking') || t.includes('tour')) return 'booking'
  if (t.includes('registration') || t.includes('course') || t.includes('library') || t.includes('club') || t.includes('gym')) return 'registration'
  if (t.includes('medical') || t.includes('doctor') || t.includes('appointment')) return 'consultation'
  if (t.includes('bank') || t.includes('account') || t.includes('transport')) return 'customer-service'
  if (t.includes('job') || t.includes('application')) return 'registration'
  if (t.includes('rent') || t.includes('property')) return 'enquiry'
  return 'enquiry'
}

const SETTINGS: Record<string, string> = {
  booking: "A customer calls to make a booking. The staff member takes down details.",
  registration: "Someone registers for a service. The staff member collects required information.",
  enquiry: "A person calls to ask about services, prices, or availability.",
  consultation: "A professional asks questions and provides advice or appointment details.",
  'customer-service': "A customer contacts a business with a query or issue.",
}

// ─── Part 1 Conversation Builder ───────────────────────────────────────

function buildPart1Conversation(scenario: ConversationScenario, distractors: Distractor[]): ReturnType<typeof makeLine>[] {
  const lines: ReturnType<typeof makeLine>[] = []
  const [staff, customer] = scenario.speakers
  const distractorMap = new Map(distractors.map(d => [d.entityId, d]))

  // Opening
  lines.push(makeLine(staff, OPENINGS[Math.floor(Math.random() * OPENINGS.length)], false, false, false))
  lines.push(makeLine(customer, CUSTOMER_GREETINGS[Math.floor(Math.random() * CUSTOMER_GREETINGS.length)], false, false, false))

  // Entity exchange with possible distractors
  for (const entity of scenario.expectedEntities) {
    const distractor = distractorMap.get(entity.id)
    if (distractor) {
      lines.push(makeLine(staff, makeDistractorLine(entity, distractor), true, false, false))
      lines.push(makeLine(customer, makeCorrectionLine(entity, distractor), false, true, false))
      lines.push(makeLine(staff, makeConfirmLine(entity), false, false, false))
    } else {
      lines.push(makeLine(staff, makeQuestionLine(entity), false, false, false))
      lines.push(makeLine(customer, makeAnswerLine(entity), false, false, false))
    }
  }

  // Closing
  lines.push(makeLine(staff, CLOSINGS_CUSTOMER_SERVICE[Math.floor(Math.random() * CLOSINGS_CUSTOMER_SERVICE.length)], false, false, false))
  lines.push(makeLine(customer, "Thank you. Goodbye.", false, false, false))

  return lines
}

const OPENINGS = [
  "Good morning, this is Central Travel Agency. How can I help you today?",
  "Hello, Lakeside Hotel reservations. How may I assist you?",
  "Good afternoon, Community College. Are you calling to register for a course?",
  "Hello, City Library. How can I help you today?",
  "Good morning, National Medical Centre. How can I help?",
  "Hello, you've reached the information desk. How can I assist you?",
]

const CUSTOMER_GREETINGS = [
  "Hi, I'd like to make a booking, please.",
  "Hello, yes. I'm calling to make an enquiry.",
  "Hi there. I'd like to register, please.",
  "Good morning. I need to book an appointment.",
  "Hello. I'm calling about a reservation.",
]

const CLOSINGS_CUSTOMER_SERVICE = [
  "That's all confirmed. You'll receive an email confirmation shortly.",
  "You're all set. Is there anything else I can help you with?",
  "That's everything. Thank you for your call.",
  "All done. Have a great day!",
]

// ─── Part 1 Questions ──────────────────────────────────────────────────

function buildPart1Questions(input: PartQuestionInput): QuestionSet {
  const { scenario, transcript, questionCount } = input
  const count = Math.min(questionCount, scenario.expectedEntities.filter(e => e.tested).length)
  const entities = scenario.expectedEntities.filter(e => e.tested).slice(0, count)

  const qt = pickQuestionType('part1')
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
}

// ─── Part 1 Distractors ────────────────────────────────────────────────

function buildPart1Distractors(input: PartDistractorInput): Distractor[] {
  const { scenario, maxDistractors } = input
  if (!part1Strategy.distractorEnabled || !scenario.languageFeatures.allowCorrections || maxDistractors <= 0) return []

  const distractableCategories = new Set(['personal-name', 'phone-number', 'address', 'date', 'time', 'price', 'reference-number', 'quantity'])
  const eligible = scenario.expectedEntities.filter(e => distractableCategories.has(e.category) && e.value)
  const selected = [...eligible].sort(() => Math.random() - 0.5).slice(0, Math.min(maxDistractors, eligible.length))

  return selected.map((entity, i) => {
    const wrongValue = generateWrongValue(entity)
    if (wrongValue === entity.value) return null
    return {
      distractorId: `d-${Date.now()}-${i}`,
      type: mapDistractorType(entity.category),
      entityId: entity.id,
      distractorValue: wrongValue,
      speakerId: scenario.speakers[0].id,
      lineIndex: -1,
      correctedBySpeakerId: scenario.speakers[1].id,
      correctionLineIndex: -1,
      correctionPhrase: `it's ${entity.value}`,
    }
  }).filter(Boolean) as Distractor[]
}

function mapDistractorType(category: InformationEntity['category']): Distractor['type'] {
  const map: Record<string, Distractor['type']> = {
    'personal-name': 'wrong-name-corrected',
    'phone-number': 'phone-repetition',
    'address': 'wrong-address-corrected',
    'date': 'wrong-date-corrected',
    'time': 'wrong-time-corrected',
    'price': 'wrong-price-corrected',
    'reference-number': 'wrong-spelling',
    'quantity': 'quantity-updated',
  }
  return map[category] || 'alternative-rejected'
}

function generateWrongValue(entity: InformationEntity): string {
  const v = entity.value
  switch (entity.category) {
    case 'personal-name': return v === 'Sarah Johnson' ? 'Sarah Jackson' : 'Janet Wilson'
    case 'phone-number': {
      const digits = v.replace(/\D/g, '')
      return digits.length >= 3 ? digits.slice(0, -1) + String(Number(digits.slice(-1)) + 1) : String(Number(v) + 1)
    }
    case 'address': return v.includes('Queen') ? '42 King Street' : '17 Queen Street'
    case 'date': {
      const nums = v.match(/\d+/)
      return nums ? v.replace(nums[0], String(Number(nums[0]) + 1)) : 'the 12th of June'
    }
    case 'time': {
      const match = v.match(/(\d+)/)
      if (match) {
        const h = Number(match[1])
        return String(h === 12 ? 1 : h + 1) + v.replace(/\d+/, '')
      }
      return '11:30 am'
    }
    case 'price': {
      const num = Number(v.replace(/[£$€]/g, ''))
      const prefix = v.match(/[£$€]/)?.[0] || '£'
      return `${prefix}${isNaN(num) ? 25 : num - 5}`
    }
    case 'reference-number': return v.slice(0, -2) + 'XX'
    case 'quantity': return String(Number(v) + 2)
    default: return v + 'X'
  }
}

// ─── Part 1 Validation ─────────────────────────────────────────────────

function validatePart1(input: PartValidationInput): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const { questionSet } = input

  // Part 1 specific: all form fields should have values
  for (const entity of questionSet.entities) {
    if (!entity.value) {
      errors.push({
        code: 'MISSING_ANSWER',
        message: `Entity ${entity.id} has no value in Part 1 form`,
        entityId: entity.id,
        severity: 'error',
      })
    }
  }

  // Part 1 specific: numbers validated (phone, price, date, time)
  const numberCategories = ['phone-number', 'price', 'date', 'time', 'quantity']
  for (const entity of questionSet.entities) {
    if (numberCategories.includes(entity.category)) {
      const hasNumber = /\d/.test(entity.value)
      if (!hasNumber) {
        warnings.push({
          code: 'ANSWER_TOO_SHORT',
          message: `Part 1 entity ${entity.category} should contain a number: "${entity.value}"`,
          entityId: entity.id,
          severity: 'warning',
        })
      }
    }
  }

  // Part 1 specific: word limit is 1-2 for most fields
  for (const entity of questionSet.entities) {
    const words = entity.value.split(/\s+/).filter(Boolean).length
    if (words > 3 && entity.category !== 'policy-detail' && entity.category !== 'reason') {
      warnings.push({
        code: 'ANSWER_TOO_LONG',
        message: `Part 1 answer for ${entity.category} has ${words} words`,
        entityId: entity.id,
        severity: 'warning',
      })
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings,
    summary: { totalChecks: 3 + questionSet.entities.length * 2, passedChecks: 3, failedChecks: errors.length, warningCount: warnings.length },
  }
}
