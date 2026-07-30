// ═══════════════════════════════════════════════════════════════════════
// Shared transcript-building utilities used by all part strategies
// ═══════════════════════════════════════════════════════════════════════

import type {
  ConversationScenario,
  Distractor,
  InformationEntity,
  Transcript,
  TranscriptLine,
  TranscriptMetadata,
} from '../types'

export function makeLine(
  speaker: { id: string; name: string },
  text: string,
  isDistractor = false,
  isCorrection = false,
  isFiller = false,
): TranscriptLine {
  return { speakerId: speaker.id, speakerName: speaker.name, text, isDistractor, isCorrection, isFiller }
}

export function computeLexicalDensity(text: string): number {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  const stopWords = new Set([
    'the','a','an','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','will','would','shall','should','can','could','may','might',
    'must','in','on','at','to','for','of','with','from','by','about','as','into',
    'through','during','before','after','above','below','between','and','but','or',
    'nor','so','yet','if','when','where','while','although','because','until','since',
    'that','which','who','whom','whose','this','these','those','it','they','them',
    'he','she','his','her','its','their','our','my','your','i','you','we','me','us',
    'not','no','just','very','then','now','here','there','also','well','really',
    'actually','quite','rather','all','some','any','each','every','both','few',
    'more','most','other','such','only',
  ])
  const contentWords = words.filter(w => !stopWords.has(w.toLowerCase()))
  return Math.round((contentWords.length / words.length) * 100) / 100
}

export function computeAverageSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) return 0
  const totalWords = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0)
  return Math.round((totalWords / sentences.length) * 10) / 10
}

export function buildTranscriptMetadata(
  transcript: Transcript,
  _scenario: ConversationScenario,
  _distractors: Distractor[],
): TranscriptMetadata {
  const wordCount = transcript.plainText.split(/\s+/).filter(Boolean).length
  const speechRate = 150

  return {
    wordCount,
    estimatedSpeakingTimeSeconds: Math.round(wordCount / (speechRate / 60)),
    speechRateWpm: speechRate,
    numberOfSpeakers: new Set(transcript.lines.map(l => l.speakerId)).size,
    topic: _scenario.topic,
    part: _scenario.part,
    difficulty: _scenario.targetBand <= 5.5 ? 'easy' : _scenario.targetBand <= 7 ? 'medium' : 'hard',
    targetBand: _scenario.targetBand,
    hasCorrections: transcript.lines.some(l => l.isCorrection),
    hasDistractors: _distractors.length > 0,
    hasInterruptions: _scenario.languageFeatures.allowInterruptions,
    distinctInformationEntities: _scenario.expectedEntities.length,
    lexicalDensity: computeLexicalDensity(transcript.plainText),
    averageSentenceLength: computeAverageSentenceLength(transcript.plainText),
  }
}

// ── Speaker selection for distractors ──────────────────────────────────

export function getDistractorSpeakers(
  speakers: Array<{ id: string; name: string }>,
  distractor: Distractor,
): [typeof speakers[0], typeof speakers[0]] {
  const distSpk = speakers.find(s => s.id === distractor.speakerId) || speakers[0]
  const corrSpk = speakers.find(s => s.id === distractor.correctedBySpeakerId) || speakers[1] || speakers[0]
  return [distSpk, corrSpk]
}

// ── Entity value defaults ──────────────────────────────────────────────

export const ENTITY_DEFAULTS: Record<InformationEntity['category'], { value: string; alternatives?: string[] }> = {
  'personal-name': { value: 'Sarah Johnson', alternatives: ['Johnson'] },
  'phone-number': { value: '07700 900 482', alternatives: ['07700900482'] },
  'address': { value: '42 Queen Street', alternatives: ['42, Queen Street', '42 Queen St'] },
  'date': { value: 'the 15th of June', alternatives: ['15 June', 'June 15th', 'June 15'] },
  'time': { value: '10:30 am', alternatives: ['10.30', 'half past ten', '10:30'] },
  'price': { value: '£35', alternatives: ['35 pounds', 'thirty-five pounds', '35'] },
  'quantity': { value: '4', alternatives: ['four'] },
  'reference-number': { value: 'RB-2841', alternatives: ['RB2841', 'RB 2841'] },
  'product-name': { value: 'the Deluxe Package', alternatives: ['Deluxe Package', 'Deluxe'] },
  'place-name': { value: 'Conference Room A', alternatives: ['Room A', 'conference room A'] },
  'occupation': { value: 'a software developer', alternatives: ['software developer'] },
  'duration': { value: '3 weeks', alternatives: ['three weeks'] },
  'measurement': { value: '50 square metres', alternatives: ['50 sq m', '50 square meters'] },
  'transport-method': { value: 'bus', alternatives: ['the bus'] },
  'payment-method': { value: 'credit card', alternatives: ['by card', 'card'] },
  'document-type': { value: 'a passport', alternatives: ['passport'] },
  'action-item': { value: 'arrive 15 minutes early', alternatives: ['arrive early'] },
  'policy-detail': { value: 'cancellation requires 24 hours notice', alternatives: ['24 hours notice'] },
  'reason': { value: 'budget constraints', alternatives: ['limited budget'] },
  'opinion': { value: 'it has great potential', alternatives: ['great potential'] },
}

export function fillEntityValues(entities: InformationEntity[]): InformationEntity[] {
  for (const e of entities) {
    const defaults = ENTITY_DEFAULTS[e.category]
    if (!defaults) {
      if (!e.value) e.value = 'N/A'
      continue
    }
    if (!e.value) e.value = defaults.value
    if (!e.acceptableAlternatives) e.acceptableAlternatives = defaults.alternatives
  }
  return entities
}

// ── Entity question line builders ──────────────────────────────────────

export function makeQuestionLine(entity: InformationEntity): string {
  const questions: Record<string, string[]> = {
    'personal-name': ["Could I take your full name, please?", "And your name is...?", "What name should I put down?"],
    'phone-number': ["And your phone number?", "What's the best number to reach you on?", "Could I have a contact number?"],
    'address': ["What's your address?", "And where are you based currently?", "Could you give me your address?"],
    'date': ["What date would you like?", "When would you like to come?", "And the date?"],
    'time': ["And what time suits you?", "What time would you prefer?", "And at what time?"],
    'price': ["How much does it cost?", "What's the price for that?", "And what's the cost?"],
    'quantity': ["How many would you need?", "And what quantity?", "So how many in total?"],
    'reference-number': ["Do you have a reference number?", "Could I get your reference number?"],
    'product-name': ["What type were you looking for?", "And which option did you want?"],
    'place-name': ["And where exactly is that?", "Which location?", "And where will it be held?"],
    'occupation': ["What do you do for work?", "And your occupation?", "What is your current role?"],
    'duration': ["How long will it last?", "And for how long?", "What's the duration?"],
    'measurement': ["And what are the dimensions?", "What size do you need?"],
    'transport-method': ["How will you be travelling?", "And what's the best way to get there?"],
    'payment-method': ["How would you like to pay?", "And which payment method?"],
    'document-type': ["What documents do I need?", "And what ID should I bring?"],
    'action-item': ["What do I need to do next?", "What's the next step?"],
    'policy-detail': ["And what's the policy on that?", "How does that work exactly?"],
    'reason': ["Why is that?", "What's the reason for that?"],
    'opinion': ["What do you think about that?", "And what's your view?"],
  }
  const options = questions[entity.category] || ["Could you tell me more about that?"]
  return options[Math.floor(Math.random() * options.length)]
}

export function makeAnswerLine(entity: InformationEntity): string {
  return `It's ${entity.value}.`
}

export function makeMonologueStatement(entity: InformationEntity): string {
  const statements: Record<string, string[]> = {
    'date': [`The event will take place on ${entity.value}.`],
    'time': [`It starts at ${entity.value}.`],
    'place-name': [`The location is ${entity.value}.`],
    'duration': [`It lasts approximately ${entity.value}.`],
    'price': [`The cost is ${entity.value}.`],
    'transport-method': [`The best way to get there is by ${entity.value}.`],
    'action-item': [`You will need to ${entity.value}.`],
    'policy-detail': [`Please note that ${entity.value}.`],
    'quantity': [`There are ${entity.value} available.`],
    'measurement': [`It measures approximately ${entity.value}.`],
    'reference-number': [`The reference number is ${entity.value}.`],
    'reason': [`This is because ${entity.value}.`],
    'opinion': [`In my view, ${entity.value}.`],
    'personal-name': [`The presenter is ${entity.value}.`],
    'phone-number': [`You can call ${entity.value}.`],
    'document-type': [`You'll need to bring ${entity.value}.`],
  }
  const options = statements[entity.category] || [`One important detail: ${entity.value}.`]
  return options[Math.floor(Math.random() * options.length)]
}

// ── Distractor line builders ───────────────────────────────────────────

export function makeDistractorLine(entity: InformationEntity, distractor: Distractor): string {
  const phrases: Record<string, string> = {
    'personal-name': `So that's ${distractor.distractorValue}, is that right?`,
    'phone-number': `Let me just read that back — ${distractor.distractorValue}?`,
    'address': `That would be ${distractor.distractorValue}, correct?`,
    'date': `So ${distractor.distractorValue} — let me just check availability.`,
    'time': `Is ${distractor.distractorValue} good for you?`,
    'price': `That comes to ${distractor.distractorValue}.`,
    'quantity': `So we're looking at ${distractor.distractorValue}?`,
    'reference-number': `I've got your reference as ${distractor.distractorValue}.`,
  }
  return phrases[entity.category] || `So that's ${distractor.distractorValue}?`
}

export function makeCorrectionLine(entity: InformationEntity, distractor: Distractor): string {
  const phrases = [
    `Actually, ${distractor.correctionPhrase || `it's ${entity.value}`}.`,
    `Sorry, ${distractor.correctionPhrase || `that should be ${entity.value}`}.`,
    `Oh, wait — ${distractor.correctionPhrase || `that's ${entity.value}, not ${distractor.distractorValue}`}.`,
    `No, ${distractor.correctionPhrase || `it's actually ${entity.value}`}.`,
  ]
  return phrases[Math.floor(Math.random() * phrases.length)]
}

export function makeConfirmLine(entity: InformationEntity): string {
  return `OK, so ${entity.value}. Got it.`
}

// ── Entity label for question display ──────────────────────────────────

export function entityLabel(category: InformationEntity['category']): string {
  const labels: Record<string, string> = {
    'personal-name': 'Customer Name',
    'phone-number': 'Phone Number',
    'address': 'Address',
    'date': 'Date',
    'time': 'Time',
    'price': 'Price',
    'quantity': 'Number of People',
    'reference-number': 'Reference Number',
    'product-name': 'Type of Tour',
    'place-name': 'Location',
    'occupation': 'Occupation',
    'duration': 'Duration',
    'measurement': 'Size / Dimensions',
    'transport-method': 'Transport',
    'payment-method': 'Payment Method',
    'document-type': 'ID Required',
    'action-item': 'Action Required',
    'policy-detail': 'Policy',
    'reason': 'Reason',
    'opinion': 'Opinion',
  }
  return labels[category] || 'Detail'
}
