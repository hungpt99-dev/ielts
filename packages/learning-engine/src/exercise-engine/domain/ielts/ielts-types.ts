export type IeltsTestVariant = 'academic' | 'general-training'

export const FULL_PASSAGE_SIMULATION = {
  passageWords: { min: 700, max: 950 } as const,
  questionCount: { min: 12, max: 14 } as const,
  taskGroupCount: { min: 2, max: 3 } as const,
  recommendedMinutes: 20,
} as const

export type ReadingExerciseType =
  | 'multiple-choice-single'
  | 'multiple-choice-multiple'
  | 'true-false-not-given'
  | 'yes-no-not-given'
  | 'matching-information'
  | 'matching-headings'
  | 'matching-features'
  | 'matching-sentence-endings'
  | 'sentence-completion'
  | 'summary-completion'
  | 'note-completion'
  | 'table-completion'
  | 'flow-chart-completion'
  | 'diagram-label-completion'
  | 'short-answer'

export type ListeningExerciseType =
  | 'multiple-choice-single'
  | 'multiple-choice-multiple'
  | 'matching'
  | 'plan-labelling'
  | 'map-labelling'
  | 'diagram-labelling'
  | 'form-completion'
  | 'note-completion'
  | 'table-completion'
  | 'flow-chart-completion'
  | 'summary-completion'
  | 'sentence-completion'
  | 'short-answer'

export type WritingExerciseType =
  | 'academic-task-1-line-graph'
  | 'academic-task-1-bar-chart'
  | 'academic-task-1-pie-chart'
  | 'academic-task-1-table'
  | 'academic-task-1-mixed-charts'
  | 'academic-task-1-process'
  | 'academic-task-1-map'
  | 'general-task-1-formal-letter'
  | 'general-task-1-semi-formal-letter'
  | 'general-task-1-informal-letter'
  | 'task-2-opinion'
  | 'task-2-discussion'
  | 'task-2-advantages-disadvantages'
  | 'task-2-problem-solution'
  | 'task-2-two-part-question'
  | 'task-2-positive-negative-development'

export type SpeakingExerciseType =
  | 'speaking-part-1'
  | 'speaking-part-2-cue-card'
  | 'speaking-part-3'
  | 'speaking-full-test'

export type ExerciseCategory = 'exam-authentic' | 'supporting-practice'

export type IeltsTaskTypeId = ReadingExerciseType | ListeningExerciseType | WritingExerciseType | SpeakingExerciseType

export interface PassageEvidence {
  paragraphId: string
  startOffset?: number
  endOffset?: number
  supportingText: string | null
}

export type ReadingQuestionSkill =
  | 'main-idea'
  | 'specific-detail'
  | 'paraphrase'
  | 'inference'
  | 'reference'
  | 'writer-purpose'
  | 'comparison'
  | 'cause-effect'
  | 'vocabulary-in-context'
  | 'cross-paragraph-synthesis'
  | 'paragraph-purpose'
  | 'reference-tracking'
  | 'information-location'

export type ParagraphFunction =
  | 'introduction'
  | 'historical-background'
  | 'cause'
  | 'effect'
  | 'contrast'
  | 'example'
  | 'evidence'
  | 'qualification'
  | 'limitation'
  | 'case-study'
  | 'future-development'
  | 'conclusion'

export interface ReadingPassageProfile {
  wordCount: number
  paragraphCount: number
  estimatedBandRange: {
    minimum: number
    maximum: number
  }
  lexicalComplexity: number
  syntacticComplexity: number
  informationDensity: number
  conceptualDensity: number
  discourseComplexity: number
  referenceTrackingDemand: number
  crossParagraphConnections: number
  paragraphFunctions: Array<{
    paragraphId: string
    functions: ParagraphFunction[]
  }>
}

export interface ReadingQuestionDifficulty {
  estimatedBand: number
  retrievalDistance: number
  paraphraseDistance: number
  inferenceDemand: number
  distractorPlausibility: number
  crossSentenceDemand: number
  crossParagraphDemand: number
}

export interface ReadingQuestionPlan {
  totalQuestions: number
  taskGroups: ReadingTaskGroupPlan[]
  requiredSkills: ReadingQuestionSkill[]
  maximumDirectRetrievalRatio: number
}

export interface ReadingTaskGroupPlan {
  type: ReadingExerciseType
  questionCount: number
  maximumWords?: number
  skills: ReadingQuestionSkill[]
  targetParagraphs?: string[]
  minimumDifficulty?: number
}

export interface TfngEvidence {
  answer: 'true' | 'false' | 'not-given'
  supportingParagraphIds: string[]
  supportingText: string | null
  missingInformation?: string
  explanation: string
}

export interface CompletionValidation {
  answerOccursInPassage: boolean
  respectsWordLimit: boolean
  completedSentenceIsGrammatical: boolean
  answerIsUnambiguous: boolean
  promptIsParaphrased: boolean
  sourceLocationIsNotDuplicated: boolean
}

export type DistractorSource =
  | 'nearby-detail'
  | 'partial-truth'
  | 'wrong-paragraph'
  | 'reversed-cause-effect'
  | 'overgeneralization'
  | 'misinterpreted-reference'
  | 'unsupported-inference'

export interface PassageCoverage {
  paragraphIdsUsed: string[]
  answerCountByParagraph: Record<string, number>
  uncoveredImportantParagraphIds: string[]
  duplicatedEvidenceLocations: string[]
}

export type ActivityContentSource =
  | 'built-in'
  | 'ai-generated'
  | 'imported'

export interface ReadingExerciseQualityReport {
  passageEstimatedBand: number
  averageQuestionEstimatedBand: number
  passageQuestionDifficultyAlignment: number
  paraphraseQuality: number
  directRetrievalRatio: number
  skillVariety: number
  distractorQuality: number
  tfngQuality: number
  completionQuality: number
  inferenceQuality: number
  passageCoverage: number
  duplicationRisk: number
  ambiguityRisk: number
  ieltsAuthenticity: number
  status: 'pass' | 'repair' | 'reject'
  issues: ReadingQualityIssue[]
}

export interface QualityConfig {
  difficultyAlignmentTolerance: number
  maximumDirectRetrievalRatio: number
  minimumTfngGroupSizeForNgRequirement: number
  maximumRepairAttempts: number
  minimumDistinctParagraphIdsForSixQuestions: number
  completionMinimumParaphraseRatio: number
}

export interface ReadingEvidence {
  paragraphId: string
  supportingText: string | null
}

export interface ReadingDifficultyProfile {
  targetBandMin: number
  targetBandMax: number
  lexicalComplexity: number
  syntacticComplexity: number
  informationDensity: number
  paraphraseDistance: number
  inferenceDemand: number
  distractorPlausibility: number
  referenceTrackingDemand: number
  crossParagraphReasoning: number
}

export interface MatchingHeadingsTaskGroup {
  type: 'matching-headings'
  headings: Array<{
    id: string
    text: string
  }>
  items: Array<{
    paragraphId: string
    correctHeadingId: string
    explanation: string
  }>
}

export interface ReadingQualityReport {
  passageCoherence: number
  languageNaturalness: number
  informationDensity: number
  difficultyAlignment: number
  paraphraseQuality: number
  distractorQuality: number
  questionVariety: number
  answerability: number
  ambiguityRisk: number
  ieltsAuthenticity: number
  status: 'pass' | 'repair' | 'reject'
  issues: ReadingQualityIssue[]
}

export interface ReadingQualityIssue {
  field: string
  severity: 'critical' | 'major' | 'minor'
  description: string
  suggestion?: string
}

export interface CompletionWordLimit {
  maxWords: number
  maxNumbers: number
  instruction: string
}

export interface ListeningSource {
  transcript: TranscriptSegment[]
  speakers: SpeakerDefinition[]
  audioAsset?: AudioAssetReference
  ttsScript?: TtsScript
  durationSeconds: number
  accentProfile: AccentProfile
}

export interface TranscriptSegment {
  id: string
  speakerId: string
  text: string
  startTimeSeconds: number
  endTimeSeconds: number
}

export interface SpeakerDefinition {
  id: string
  name?: string
  role: 'examiner' | 'candidate' | 'narrator' | 'speaker'
}

export interface AudioAssetReference {
  url?: string
  durationSeconds: number
  format: 'mp3' | 'wav' | 'tts'
}

export interface TtsScript {
  segments: { speakerId: string; text: string }[]
  speed: number
  pauses: { afterSegmentId: string; durationSeconds: number }[]
}

export type AccentProfile = 'british' | 'american' | 'australian' | 'canadian' | 'neutral'

export interface MapLabellingTask {
  backgroundDescription: string
  landmarks: MapLandmark[]
  paths: MapPath[]
  labels: MapLabelTarget[]
  options?: string[]
}

export interface MapLandmark {
  id: string
  description: string
  position: { x: number; y: number }
  label?: string
}

export interface MapPath {
  id: string
  from: string
  to: string
  instruction?: string
}

export interface MapLabelTarget {
  id: string
  description: string
  correctLocation: { x: number; y: number }
}

export interface AcademicTask1Visual {
  type: 'line-chart' | 'bar-chart' | 'pie-chart' | 'table' | 'mixed-chart' | 'process' | 'map'
  title: string
  units?: string
  series?: DataSeries[]
  categories?: string[]
  processStages?: ProcessStage[]
  mapStates?: MapState[]
}

export interface DataSeries {
  name: string
  values: number[]
}

export interface ProcessStage {
  id: string
  name: string
  description: string
  input?: string
  output?: string
  nextStageId?: string
}

export interface MapState {
  id: string
  label: string
  period: string
  features: { description: string; location: string }[]
}

export interface WritingAssessment {
  estimatedOverallBand: number
  confidence: 'low' | 'medium' | 'high'
  criteria: {
    taskAchievementOrResponse: CriterionAssessment
    coherenceAndCohesion: CriterionAssessment
    lexicalResource: CriterionAssessment
    grammaticalRangeAndAccuracy: CriterionAssessment
  }
  wordCount: number
  underLength: boolean
  offTopicRisk: boolean
  copiedLanguageRisk: boolean
  prioritizedImprovements: Improvement[]
}

export interface CriterionAssessment {
  estimatedBand: number
  evidence: string
  strengths: string[]
  problems: string[]
  improvement: string
  uncertainty: number
}

export interface Improvement {
  criterion: string
  action: string
  priority: number
}

export interface SpeakingCueCard {
  topic: string
  mainInstruction: string
  prompts: string[]
  preparationSeconds: 60
  speakingSeconds: 120
  followUpQuestion: string
}

export interface SpeakingAssessment {
  estimatedOverallBand: number
  confidence: 'low' | 'medium' | 'high'
  fluencyAndCoherence: CriterionAssessment
  lexicalResource: CriterionAssessment
  grammaticalRangeAndAccuracy: CriterionAssessment
  pronunciation: PronunciationAssessment
}

export interface PronunciationAssessment {
  status: 'assessed' | 'not-assessed'
  reason?: string
  estimatedBand?: number
  evidence?: string
  strengths?: string[]
  problems?: string[]
  improvement?: string
}

export interface ExerciseQualityReport {
  authenticity: number
  answerability: number
  difficultyAlignment: number
  distractorQuality: number
  instructionAccuracy: number
  sourceQuestionConsistency: number
  duplicationRisk: number
  ambiguityRisk: number
  overallStatus: 'pass' | 'repair' | 'reject'
  issues: QualityIssue[]
}

export interface QualityIssue {
  field: string
  severity: 'critical' | 'major' | 'minor'
  description: string
  suggestion?: string
}

export interface ExerciseCapability {
  generation: boolean
  validation: boolean
  rendering: boolean
  answerSubmission: boolean
  scoring: boolean
  review: boolean
  persistence: boolean
}

export interface GeneratedActivityEnvelope {
  schemaVersion: number
  engineVersion: string
  promptVersion: string
  activity: unknown
}

export interface IeltsDifficultyProfile {
  targetBandRange: { minimum: number; maximum: number }
  cefrRange: { minimum: CefrLevel; maximum: CefrLevel }
  lexicalComplexity: number
  syntacticComplexity: number
  paraphraseDistance: number
  inferenceDemand: number
  distractorPlausibility: number
  informationDensity: number
  timePressure: number
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface FullPassageSimulationQualityReport {
  passageWordCount: number
  questionCount: number
  taskGroupCount: number

  passageEstimatedBand: number
  averageQuestionEstimatedBand: number

  passageCoherence: number
  languageNaturalness: number
  informationDensity: number
  passageCoverage: number
  paraphraseQuality: number
  directRetrievalRatio: number
  skillVariety: number
  distractorQuality: number
  answerability: number
  ambiguityRisk: number
  ieltsAuthenticity: number

  status: 'pass' | 'repair' | 'reject'
  issues: ReadingQualityIssue[]
}

export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  difficultyAlignmentTolerance: 0.5,
  maximumDirectRetrievalRatio: 0.4,
  minimumTfngGroupSizeForNgRequirement: 4,
  maximumRepairAttempts: 3,
  minimumDistinctParagraphIdsForSixQuestions: 3,
  completionMinimumParaphraseRatio: 0.5,
}
