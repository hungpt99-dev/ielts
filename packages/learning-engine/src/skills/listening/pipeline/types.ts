// ═══════════════════════════════════════════════════════════════════════
// Listening Generation Pipeline — Types & Interfaces
// ═══════════════════════════════════════════════════════════════════════

// ── Listening Part Types ──────────────────────────────────────────────
export type ListeningPart =
  | 'part1'  // Everyday social context (form-filling, notes)
  | 'part2'  // Monologue in social context (guided tour, announcement)
  | 'part3'  // Conversation in educational/training context (2-4 people)
  | 'part4'  // Academic monologue (lecture, presentation)

// ── Scenario ───────────────────────────────────────────────────────────
export interface SpeakerProfile {
  id: string
  name: string
  role: string
  accent: 'british' | 'american' | 'australian' | 'neutral'
  gender: 'male' | 'female'
  traits?: string[]
}

export interface ConversationScenario {
  scenarioId: string
  part: ListeningPart
  topic: string
  subTopic: string
  setting: string
  speakers: SpeakerProfile[]
  /** The type of information exchange happening */
  exchangeType:
    | 'booking'
    | 'registration'
    | 'enquiry'
    | 'orientation'
    | 'consultation'
    | 'tour-guide'
    | 'announcement'
    | 'lecture'
    | 'interview'
    | 'customer-service'
  /** Information entities expected in this scenario */
  expectedEntities: InformationEntity[]
  targetBand: number
  estimatedDurationMinutes: number
  languageFeatures: LanguageFeatureProfile
}

export interface LanguageFeatureProfile {
  allowHesitations: boolean
  allowFillers: boolean
  allowCorrections: boolean
  allowInterruptions: boolean
  allowEllipsis: boolean
  formality: 'casual' | 'semi-formal' | 'formal' | 'academic'
  speechPace: 'slow' | 'moderate' | 'fast'
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced'
}

// ── Information Entities (what questions test) ─────────────────────────
export interface InformationEntity {
  id: string
  /** Semantic category of the information */
  category:
    | 'personal-name'
    | 'phone-number'
    | 'address'
    | 'date'
    | 'time'
    | 'price'
    | 'quantity'
    | 'reference-number'
    | 'product-name'
    | 'place-name'
    | 'occupation'
    | 'duration'
    | 'measurement'
    | 'transport-method'
    | 'payment-method'
    | 'document-type'
    | 'action-item'
    | 'policy-detail'
    | 'reason'
    | 'opinion'
  /** The final correct value */
  value: string
  /** Acceptable alternative answers */
  acceptableAlternatives?: string[]
  /** Where this entity appears in the transcript */
  transcriptSpan?: { startIndex: number; endIndex: number }
  /** Is this entity tested? */
  tested: boolean
  /** Word limit for the answer */
  wordLimit: number
}

// ── Transcript ─────────────────────────────────────────────────────────
export interface TranscriptLine {
  speakerId: string
  speakerName: string
  text: string
  /** SSML annotations for TTS */
  ssml?: string
  /** Timing hint in seconds (relative to start) */
  timestampSeconds?: number
  /** Annotation: this line contains a distractor */
  isDistractor?: boolean
  /** Annotation: this line contains a correction */
  isCorrection?: boolean
  /** Annotation: this line contains a hesitation/filler */
  isFiller?: boolean
}

export interface Transcript {
  transcriptId: string
  scenarioId: string
  lines: TranscriptLine[]
  metadata: TranscriptMetadata
  /** Original text without annotations */
  plainText: string
}

export interface TranscriptMetadata {
  wordCount: number
  estimatedSpeakingTimeSeconds: number
  speechRateWpm: number
  numberOfSpeakers: number
  topic: string
  part: ListeningPart
  difficulty: 'easy' | 'medium' | 'hard'
  targetBand: number
  hasCorrections: boolean
  hasDistractors: boolean
  hasInterruptions: boolean
  distinctInformationEntities: number
  lexicalDensity: number
  averageSentenceLength: number
}

// ── Questions ──────────────────────────────────────────────────────────
export type QuestionLayout =
  | 'form-completion'
  | 'table-completion'
  | 'note-completion'
  | 'sentence-completion'
  | 'summary-completion'
  | 'flow-chart-completion'
  | 'short-answer'
  | 'multiple-choice'
  | 'matching'
  | 'map-labelling'

export interface FormField {
  id: string
  label: string
  entityId: string
  answerValue: string
  acceptableAlternatives?: string[]
  wordLimit: number
  /** Display order in the form */
  order: number
  /** Section grouping within the form */
  section?: string
}

export interface FormLayout {
  layoutType: 'form-completion'
  formTitle: string
  formSubtitle?: string
  sections: FormSection[]
  fields: FormField[]
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

export interface TableLayout {
  layoutType: 'table-completion'
  tableTitle: string
  columnHeaders: string[]
  rows: TableCompletionRow[]
}

export interface TableCompletionRow {
  label: string
  cells: Array<{
    entityId: string
    answerValue: string
    blank: boolean
    content?: string
  }>
}

export interface NoteLayout {
  layoutType: 'note-completion'
  title: string
  instruction: string
  items: NoteItem[]
}

export interface NoteItem {
  label: string
  entityId: string
  answerValue: string
  acceptableAlternatives?: string[]
  wordLimit: number
  order: number
  bullet?: boolean
}

export type QuestionPresentation = FormLayout | TableLayout | NoteLayout

export interface QuestionSet {
  questionSetId: string
  scenarioId: string
  transcriptId: string
  layout: QuestionLayout
  presentation: QuestionPresentation
  entities: InformationEntity[]
  instructions: string
  totalQuestions: number
}

// ── Answer Key ─────────────────────────────────────────────────────────
export interface AnswerEntry {
  questionNumber: number
  entityId: string
  correctAnswer: string
  acceptableAlternatives: string[]
  wordLimit: number
  /** The transcript line index where the answer appears AFTER correction */
  verifiedLineIndex: number
  /** Is this answer unambiguous? */
  unambiguous: boolean
}

export interface AnswerKey {
  answerKeyId: string
  questionSetId: string
  entries: AnswerEntry[]
  metadata: {
    totalAnswers: number
    unambiguousCount: number
    averageAnswerLength: number
    totalAcceptableVariations: number
    allFactsInTranscript: boolean
  }
}

// ── Distractors ────────────────────────────────────────────────────────
export type DistractorType =
  | 'wrong-date-corrected'
  | 'wrong-time-corrected'
  | 'wrong-address-corrected'
  | 'wrong-price-corrected'
  | 'wrong-name-corrected'
  | 'wrong-spelling'
  | 'phone-repetition'
  | 'alternative-rejected'
  | 'quantity-updated'
  | 'location-corrected'

export interface Distractor {
  distractorId: string
  type: DistractorType
  entityId: string
  /** The distracting (wrong) information */
  distractorValue: string
  /** The speaker who said the distractor */
  speakerId: string
  /** The line index */
  lineIndex: number
  /** The speaker who corrected it */
  correctedBySpeakerId: string
  /** The line index of the correction */
  correctionLineIndex: number
  /** The correction phrase (e.g. "Actually, it's...") */
  correctionPhrase: string
}

// ── Validation ─────────────────────────────────────────────────────────
export interface ValidationError {
  code:
    | 'MISSING_ANSWER'
    | 'ANSWER_NOT_IN_TRANSCRIPT'
    | 'ANSWER_BEFORE_CORRECTION'
    | 'DUPLICATE_ANSWER'
    | 'QUESTION_ORDER_VIOLATION'
    | 'MISSING_DISTRACTOR'
    | 'INVALID_DISTRACTOR'
    | 'FACT_NOT_IN_TRANSCRIPT'
    | 'ANSWER_TOO_SHORT'
    | 'ANSWER_TOO_LONG'
    | 'AMBIGUOUS_ANSWER'
    | 'UNANSWERABLE_QUESTION'
  message: string
  entityId?: string
  questionNumber?: number
  lineIndex?: number
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: {
    totalChecks: number
    passedChecks: number
    failedChecks: number
    warningCount: number
  }
  /** If invalid, which sections need regeneration */
  regenerateTargets?: Array<'transcript' | 'questions' | 'distractors' | 'all'>
}

// ── Quality Scoring ────────────────────────────────────────────────────
export interface QualityDimension {
  name: string
  score: number // 0-100
  weight: number // 0-1
  remarks: string[]
}

export interface QualityReport {
  totalScore: number // 0-100
  passed: boolean // true if >= threshold
  threshold: number
  dimensions: {
    naturalness: QualityDimension
    ieltsAuthenticity: QualityDimension
    difficultyAlignment: QualityDimension
    distractorQuality: QualityDimension
    conversationFlow: QualityDimension
    answerUniqueness: QualityDimension
    questionClarity: QualityDimension
    audioReadiness: QualityDimension
  }
  issues: string[]
}

// ── Difficulty Analysis ────────────────────────────────────────────────
export interface DifficultyAnalysis {
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  estimatedIeltsBand: number
  vocabularyComplexity: {
    cefrSpread: Record<string, number> // e.g. { a1: 30, a2: 40, b1: 20, b2: 10 }
    academicWordCount: number
    technicalTermCount: number
    averageWordLength: number
  }
  speechComplexity: {
    averageSentenceLength: number
    utterancesPerMinute: number
    informationDensity: number // entities per 100 words
    distractorDensity: number // distractors per 100 words
    disfluencyRate: number // corrections+hesitations per 100 words
  }
  comprehensionBurden: {
    requiredInferenceCount: number
    paraphraseCount: number
    synonymCount: number
    negationCount: number
  }
}

// ── Generation Pipeline Types ──────────────────────────────────────────
export interface PipelineStage<TInput, TOutput> {
  name: string
  execute(input: TInput): Promise<TOutput>
}

export interface PipelineConfig {
  targetBand: number
  part: ListeningPart
  topic: string
  questionCount: number
  maxDistractors: number
  enableValidation: boolean
  enableQualityCheck: boolean
  qualityThreshold: number
  language: 'en' | string
}

export interface PipelineResult {
  scenario: ConversationScenario
  transcript: Transcript
  questionSet: QuestionSet
  answerKey: AnswerKey
  distractors: Distractor[]
  validation: ValidationResult
  qualityReport: QualityReport | null
  difficultyAnalysis: DifficultyAnalysis
  metadata: ExerciseMetadata
  rejectedVersions: number
}

export interface ExerciseMetadata {
  pipelineVersion: string
  generatedAt: string
  totalGenerationTimeMs: number
  stageTimings: Record<string, number>
  rejectedVersions: number
  finalScore: number
}

// ── Exercise Output (backward-compatible with existing models) ──────────
export interface ListeningExerciseOutput {
  id: string
  title: string
  topic: string
  part: ListeningPart
  transcript: string
  transcriptLines: TranscriptLine[]
  layout: QuestionLayout
  formFields?: FormField[]
  tableData?: TableLayout
  noteItems?: NoteItem[]
  answerKey: AnswerKey
  distractors: Distractor[]
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedBand: number
  wordCount: number
  estimatedMinutes: number
  instructions: string
}

// ── CEFR Vocabulary reference ──────────────────────────────────────────
export const CEFR_VOCABULARY = {
  A1: new Set([
    'hello', 'goodbye', 'please', 'thank', 'sorry', 'yes', 'no', 'name', 'address',
    'phone', 'number', 'date', 'time', 'day', 'week', 'month', 'year', 'morning',
    'afternoon', 'evening', 'night', 'today', 'tomorrow', 'yesterday', 'open',
    'close', 'big', 'small', 'good', 'bad', 'new', 'old', 'right', 'wrong',
    'here', 'there', 'left', 'right', 'first', 'last', 'next', 'book', 'pay',
    'cost', 'price', 'cash', 'card', 'room', 'key', 'door',
  ]),
  A2: new Set([
    'appointment', 'available', 'confirm', 'cancel', 'change', 'check', 'choose',
    'complete', 'contact', 'customer', 'delivery', 'department', 'details',
    'document', 'email', 'enter', 'entrance', 'exit', 'explain', 'extra',
    'form', 'include', 'information', 'insurance', 'leave', 'message',
    'offer', 'option', 'order', 'passenger', 'passport', 'return',
    'service', 'sign', 'special', 'standard', 'student', 'suggest',
    'total', 'ticket', 'visitor', 'weekday', 'weekend',
  ]),
  B1: new Set([
    'accommodation', 'additional', 'administration', 'agreement', 'available',
    'benefit', 'budget', 'calculate', 'campaign', 'category', 'certificate',
    'collection', 'community', 'complaint', 'condition', 'consider',
    'construction', 'consultant', 'continue', 'contribution', 'convince',
    'currently', 'deadline', 'describe', 'determine', 'discount',
    'discussion', 'display', 'effective', 'emergency', 'employer',
    'equipment', 'estimate', 'exhibition', 'experience', 'facility',
    'flexible', 'guarantee', 'identification', 'improvement', 'industry',
    'introduce', 'investigate', 'involve', 'location', 'maintain',
    'membership', 'mention', 'minimum', 'opportunity', 'organisation',
    'particularly', 'permission', 'positive', 'prefer', 'preparation',
    'procedure', 'professional', 'proposal', 'provide', 'qualification',
    'recommend', 'reference', 'registration', 'relevant', 'represent',
    'request', 'require', 'reservation', 'resources', 'responsible',
    'restriction', 'schedule', 'section', 'security', 'similar',
    'situation', 'specific', 'suggestion', 'suitable', 'surely',
    'survey', 'temporary', 'tournament', 'tradition', 'transport',
    'treatment', 'volunteer',
  ]),
  B2: new Set([
    'abstract', 'academic', 'accessible', 'acknowledge', 'acquire',
    'adjustment', 'advocate', 'allocation', 'alternative', 'analyst',
    'anticipate', 'apparent', 'approach', 'approximately', 'argument',
    'assessment', 'assigned', 'associate', 'assumption', 'attain',
    'awareness', 'capacity', 'challenging', 'circumstance', 'collaborate',
    'commence', 'commitment', 'compensate', 'component', 'comprehensive',
    'comprise', 'conceive', 'conduct', 'confirm', 'consequence',
    'considerable', 'consistent', 'constraint', 'consumption', 'contribute',
    'controversial', 'convert', 'coordinate', 'corporate', 'correspond',
    'criteria', 'crucial', 'deficit', 'demonstrate', 'depict',
    'deteriorate', 'dimension', 'diminish', 'discrimination', 'displacement',
    'distinction', 'distinguish', 'diverse', 'domain', 'domestic',
    'dominate', 'draft', 'duration', 'dynamic', 'eliminate', 'emerging',
    'emphasis', 'encounter', 'enhance', 'enormous', 'ensure', 'establish',
    'evaluate', 'evolution', 'exceed', 'exception', 'exclusive',
    'expansion', 'expertise', 'exploit', 'exposure', 'external',
    'facilitate', 'framework', 'fundamental', 'generate', 'genuine',
    'global', 'guideline', 'highlight', 'hypothesis', 'identical',
    'illustrate', 'immigration', 'implement', 'implication', 'impose',
    'incentive', 'incorporate', 'indicate', 'inevitable', 'infrastructure',
    'inherent', 'initiative', 'innovation', 'integrate', 'intense',
    'interact', 'interpret', 'intervention', 'investment', 'isolate',
    'justify', 'legislation', 'nevertheless', 'objective', 'occupation',
    'ongoing', 'orientated', 'paradigm', 'participant', 'perceive',
    'persist', 'perspective', 'phenomenon', 'philosophy', 'potential',
    'precede', 'predominantly', 'preliminary', 'presumably', 'priority',
    'proceed', 'promote', 'proportion', 'prospect', 'protocol',
    'publication', 'pursue', 'regime', 'regulate', 'reinforce',
    'rejection', 'release', 'reluctance', 'remarkable', 'replacement',
    'resolution', 'restore', 'restrict', 'retain', 'revelation',
    'revenue', 'revision', 'schedule', 'supplement', 'sustain',
    'symbolic', 'tackle', 'terminology', 'theoretical', 'transition',
    'underestimate', 'undergo', 'undertake', 'unprecedented',
    'validity', 'virtually', 'widespread',
  ]),
  C1: new Set([
    'abstraction', 'accessibility', 'accreditation', 'administrative',
    'advocacy', 'aggregate', 'alleviate', 'ambiguity', 'analogous',
    'anthropology', 'apparatus', 'applicability', 'arbitrary', 'articulate',
    'aspiration', 'assertion', 'assimilate', 'attainment', 'attributable',
    'authenticate', 'authorization', 'autonomy', 'benchmark', 'bureaucratic',
    'calibrate', 'catalyst', 'chronological', 'cohesion', 'collaborative',
    'commensurate', 'commodity', 'communicable', 'compatibility', 'compile',
    'complementary', 'compliance', 'conceptual', 'confine', 'conglomerate',
    'connotation', 'conscientious', 'consensus', 'consolidate', 'conspicuous',
    'constitute', 'constrain', 'converge', 'correlation', 'counterpart',
    'credential', 'cumulative', 'cynical', 'decentralize', 'deduce',
    'deficiency', 'delegate', 'deliberate', 'delineate', 'demographic',
    'derivative', 'designate', 'deterrent', 'detrimental', 'deviate',
    'diagnose', 'differentiate', 'dilemma', 'diminutive', 'discretion',
    'disparity', 'displace', 'disproportionate', 'dissolve', 'distortion',
    'diversify', 'documentation', 'dwindle', 'elaborate', 'elicit',
    'eloquent', 'embargo', 'embody', 'empirical', 'encapsulate',
    'encompass', 'endorse', 'enumerate', 'equilibrium', 'equivalent',
    'escalate', 'estimation', 'ethical', 'exacerbate', 'exempt',
    'exertion', 'explicit', 'exponential', 'extraction', 'extrapolate',
    'feasibility', 'fluctuation', 'formulate', 'fortify', 'generalization',
    'governance', 'hierarchical', 'homogeneous', 'illuminate', 'immerse',
    'imminent', 'imperative', 'impoverish', 'inception', 'inclination',
    'inclusive', 'increment', 'indigenous', 'induce', 'inequality',
    'inflation', 'inhibit', 'insistence', 'instigate', 'institutional',
    'intangible', 'interim', 'intermediary', 'intermittent', 'introspective',
    'invariably', 'irreversible', 'jurisdiction', 'legitimacy', 'levy',
    'liberalize', 'likelihood', 'lucrative', 'magnitude', 'manifestation',
    'marginalize', 'methodology', 'migrate', 'minimize', 'mobilize',
    'moderator', 'momentum', 'monopoly', 'multilateral', 'nationalistic',
    'negligible', 'negotiable', 'notwithstanding', 'obsolete', 'offset',
    'optimal', 'oscillate', 'oversight', 'paradigm', 'peripheral',
    'perpetual', 'plausible', 'polarize', 'portfolio', 'predominance',
    'prerequisite', 'prevalence', 'primarily', 'proactive', 'proclaim',
    'proficiency', 'profound', 'projection', 'proliferation', 'proportionate',
    'proposition', 'qualitatively', 'quantitative', 'radical', 'rationalize',
    'recession', 'reconcile', 'recurrence', 'redundant', 'refinement',
    'regression', 'reinstate', 'reluctant', 'repercussion', 'resilience',
    'resonate', 'revitalize', 'rigorous', 'saturation', 'scrutinize',
    'speculative', 'stabilization', 'standardize', 'stimulus', 'stipulate',
    'stratification', 'subordinate', 'subsidize', 'subsidy', 'substitute',
    'superfluous', 'suppress', 'surcharge', 'surveillance', 'susceptible',
    'symmetrical', 'synthesis', 'systematically', 'tangible', 'tenacious',
    'theoretical', 'tranquilize', 'trajectory', 'transcribe', 'transparency',
    'trigger', 'ubiquitous', 'unanimous', 'uncertainty', 'undermine',
    'unilateral', 'unprecedented', 'utilization', 'venture', 'verify',
    'versatile', 'vigorous', 'vindicate', 'volatile', 'voluntary',
    'warranted',
  ]),
} as const
