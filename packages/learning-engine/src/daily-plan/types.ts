// ──────────────────────────────────────────────
// Daily Plan Engine — Core Types & Interfaces
// ──────────────────────────────────────────────

// ── Value Objects ──

export type LocalDate = string;
export type IELTSExamType = "academic" | "general-training";
export type StudyTimePreference = "morning" | "afternoon" | "evening" | "flexible";
export type StudyIntensity = "light" | "moderate" | "intensive";
export type TaskDifficulty = "easy" | "medium" | "hard";
export type TaskPriority = "low" | "normal" | "high" | "critical";

export type StudyTaskStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "skipped"
  | "rescheduled";

export type PlanFeasibilityStatus =
  | "comfortable"
  | "challenging"
  | "high-risk"
  | "insufficient-time";

export type RegenerationMode =
  | "full"
  | "future-only"
  | "rebalance"
  | "settings-change"
  | "exam-date-change"
  | "availability-change"
  | "target-change";

export type PlanGenerationStage =
  | "normalizing-profile"
  | "validating-profile"
  | "calculating-availability"
  | "analyzing-skills"
  | "checking-feasibility"
  | "planning-phases"
  | "generating-objectives"
  | "generating-task-candidates"
  | "scheduling-tasks"
  | "adding-reviews"
  | "adding-mock-tests"
  | "validating-plan"
  | "repairing-plan"
  | "persisting-plan"
  | "completed";

export type StudyPhaseType =
  | "diagnostic"
  | "foundation"
  | "skill-building"
  | "strategy-development"
  | "guided-practice"
  | "timed-practice"
  | "mock-examination"
  | "error-correction"
  | "final-review"
  | "exam-readiness";

export type PhaseStage =
  | 'foundation'
  | 'skill-development'
  | 'guided-practice'
  | 'accuracy'
  | 'performance'
  | 'consistency'
  | 'target-readiness'
  | 'exam-readiness';

export const PHASE_STAGE_ORDER: Record<PhaseStage, number> = {
  'foundation': 0,
  'skill-development': 1,
  'guided-practice': 2,
  'accuracy': 3,
  'performance': 4,
  'consistency': 5,
  'target-readiness': 6,
  'exam-readiness': 7,
};

export type PlanValidationCode =
  | "start-after-exam"
  | "task-outside-window"
  | "task-on-exam-date"
  | "task-after-exam"
  | "task-on-disabled-date"
  | "daily-capacity-exceeded"
  | "session-duration-exceeded"
  | "session-limit-exceeded"
  | "total-scheduled-exceeded"
  | "invalid-week"
  | "invalid-phase"
  | "invalid-week-dates"
  | "invalid-phase-dates"
  | "dependency-order"
  | "review-after-source"
  | "invalid-skill-allocation"
  | "duplicate-id"
  | "duplicate-task"
  | "missing-required-field"
  | "invalid-timezone-date"
  | "empty-plan"
  | "mock-missing-analysis"
  | "final-week-violation"
  | "ai-schema-mismatch"
  | "score-claim"
  | "duplicate-phase-title"
  | "phase-stage-regression"
  | "band-goal-regression"
  | "regressive-final-phase"
  | "generic-phase-title";

export type StudyTaskSkill =
  | "listening"
  | "reading"
  | "writing"
  | "speaking"
  | "vocabulary"
  | "grammar"
  | "review"
  | "mock-test"
  | "exam-preparation";

export type StudyTaskSourceType =
  | "built-in"
  | "saved-content"
  | "saved-vocabulary"
  | "user-mistakes"
  | "ai-generated"
  | "manual";

export type MissedTaskAction =
  | "rescheduled"
  | "split"
  | "replaced"
  | "merged"
  | "dropped"
  | "requires-user-action";

export type PlanGenerationStatus =
  | "success"
  | "needs-profile-completion"
  | "requires-confirmation"
  | "cancelled"
  | "failure";

export type AICacheRecordType =
  | "profile-analysis"
  | "weekly-objectives"
  | "task-candidates"
  | "progress-review";

// ── Profile & Input Types ──

export interface SkillBandScores {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

export interface UserProfileInput {
  currentOverallBand: number;
  targetOverallBand: number;
  currentSkillBands: SkillBandScores;
  targetSkillBands?: Partial<SkillBandScores>;
  examType: IELTSExamType;
  examDate: LocalDate;
  planStartDate: LocalDate;
  timezone: string;
  studyDays: DayOfWeek[];
  weeklyAvailability: WeeklyAvailability;
  targetDailyMinutes?: number;
  maximumSessionMinutes: number;
  maximumSessionsPerDay: number;
  preferredStudyTime: StudyTimePreference;
  restDays: DayOfWeek[];
  studyIntensity: StudyIntensity;
  weakSkills: StudyTaskSkill[];
  strongSkills: StudyTaskSkill[];
  preferredLearningMethods: string[];
  preferredTaskTypes: string[];
  recentMistakes?: MistakeRecord[];
  exerciseAccuracy?: SkillAccuracyMap;
  completedExercises?: number;
  incompleteExercises?: number;
  savedVocabularyCount?: number;
  previousMockResults?: MockResultRecord[];
  taskCompletionHistory?: TaskCompletionRecord[];
  actualStudyDurations?: StudyDurationRecord[];
  currentLearningStreak?: number;
  existingRoadmapProgress?: number;
  userConfidence?: Partial<Record<StudyTaskSkill, number>>;
  previousIELTSResults?: SkillBandScores;
  manuallySelectedPrioritySkills?: StudyTaskSkill[];
  temporaryUnavailableDates?: LocalDate[];
  dateSpecificAdditionalAvailability?: DateAvailabilityOverride[];
  offlineOnlyMode?: boolean;
  aiProviderAvailable?: boolean;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DayAvailability {
  enabled: boolean;
  availableMinutes: number;
  preferredTime?: StudyTimePreference;
  maximumSessionMinutes?: number;
  maximumSessions?: number;
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface AvailabilityException {
  date: LocalDate;
  type: "unavailable" | "custom-capacity";
  availableMinutes?: number;
  preferredTime?: StudyTimePreference;
  reason?: string;
}

export interface MistakeRecord {
  skill: StudyTaskSkill;
  category: string;
  frequency: number;
  lastOccurrence: LocalDate;
  examples?: string[];
}

export interface SkillAccuracyMap {
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  vocabulary?: number;
  grammar?: number;
}

export interface MockResultRecord {
  date: LocalDate;
  overallBand?: number;
  skillBands?: Partial<SkillBandScores>;
  analysisComplete: boolean;
}

export interface TaskCompletionRecord {
  taskId: string;
  taskType: string;
  skill: StudyTaskSkill;
  completedAt: LocalDate;
  estimatedMinutes: number;
  actualMinutes?: number;
  status: StudyTaskStatus;
}

export interface StudyDurationRecord {
  date: LocalDate;
  plannedMinutes: number;
  actualMinutes: number;
}

export interface DateAvailabilityOverride {
  date: LocalDate;
  additionalMinutes: number;
}

// ── Normalized Profile ──

export interface DerivedStudyCapacity {
  targetDailyMinutes: number;
  preferredSessionMinutes: number;
  maximumSessionMinutes: number;
  maximumSessionsPerDay: number;
}

export interface DailyPlanDiagnostics {
  targetMinutes: number;
  scheduledMinutes: number;
  utilizationRatio: number;
  unallocatedMinutes: number;
  underutilizationReasons: string[];
}

export interface NormalizedProfile {
  currentOverallBand: number;
  targetOverallBand: number;
  currentSkillBands: SkillBandScores;
  targetSkillBands: Partial<SkillBandScores>;
  examType: IELTSExamType;
  examDate: LocalDate;
  planStartDate: LocalDate;
  timezone: string;
  weeklyAvailability: WeeklyAvailability;
  availabilityExceptions: AvailabilityException[];
  targetDailyMinutes: number;
  maximumSessionMinutes: number;
  maximumSessionsPerDay: number;
  studyIntensity: StudyIntensity;
  weakSkills: StudyTaskSkill[];
  strongSkills: StudyTaskSkill[];
  preferredTaskTypes: string[];
  recentMistakes: MistakeRecord[];
  exerciseAccuracy: SkillAccuracyMap;
  previousMockResults: MockResultRecord[];
  taskCompletionHistory: TaskCompletionRecord[];
  userConfidence: Partial<Record<StudyTaskSkill, number>>;
  manuallySelectedPrioritySkills: StudyTaskSkill[];
  offlineOnlyMode: boolean;
  aiProviderAvailable: boolean;
}

export type UserProfileField = keyof UserProfileInput;

export interface MissingProfileResult {
  status: "needs-profile-completion";
  missingFields: UserProfileField[];
  message: string;
}

// ── Planning Window ──

export interface PlanningWindow {
  startDate: LocalDate;
  examDate: LocalDate;
  finalStudyDate: LocalDate;
  totalCalendarDays: number;
  totalAvailableStudyDays: number;
  totalAvailableMinutes: number;
  reservedBufferMinutes: number;
  schedulableMinutes: number;
}

// ── Feasibility ──

export interface PlanWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}

export interface PlanAdjustmentSuggestion {
  type: string;
  description: string;
  impact?: string;
}

export interface PlanFeasibility {
  status: PlanFeasibilityStatus;
  availableMinutes: number;
  recommendedMinutes: number;
  schedulableMinutes: number;
  deficitMinutes: number;
  availableStudyDays: number;
  warnings: PlanWarning[];
  suggestions: PlanAdjustmentSuggestion[];
}

// ── Skill Gap ──

export interface SkillGapScore {
  skill: StudyTaskSkill;
  bandGap: number;
  priorityScore: number;
  normalizedWeight: number;
  reasons: string[];
}

export interface SkillAllocation {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  vocabulary: number;
  grammar: number;
}

// ── Study Time Budget ──

export interface StudyTimeBudget {
  totalAvailableMinutes: number;
  reservedBufferMinutes: number;
  schedulableMinutes: number;
  newLearningMinutes: number;
  guidedPracticeMinutes: number;
  independentPracticeMinutes: number;
  reviewMinutes: number;
  vocabularyMinutes: number;
  mistakeReviewMinutes: number;
  timedPracticeMinutes: number;
  mockTestMinutes: number;
  mockAnalysisMinutes: number;
  finalPreparationMinutes: number;
}

// ── Phase ──

export interface StudyPhase {
  id: string;
  type: StudyPhaseType;
  stage: PhaseStage;
  title: string;
  description: string;
  summary: string;
  startDate: LocalDate;
  endDate: LocalDate;
  targetSkills: StudyTaskSkill[];
  objectives: string[];
  completionCriteria: string[];
  allocatedMinutes: number;
  scheduledMinutes: number;
  order: number;
  status: "upcoming" | "active" | "completed";
  officialBandGoal?: number;
}

// ── Week ──

export interface StudyWeek {
  id: string;
  phaseId: string;
  weekNumber: number;
  startDate: LocalDate;
  endDate: LocalDate;
  title: string;
  focus: string;
  description: string;
  objectives: string[];
  targetSkills: StudyTaskSkill[];
  availableMinutes: number;
  scheduledMinutes: number;
  bufferMinutes: number;
  skillAllocation: Partial<Record<StudyTaskSkill, number>>;
  taskIds: string[];
}

// ── Task ──

export interface StudyTask {
  id: string;
  roadmapId: string;
  phaseId: string;
  weekId: string;
  date: LocalDate;
  sessionOrder: number;
  skill: StudyTaskSkill;
  taskType: string;
  title: string;
  description: string;
  objective: string;
  reason: string;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
  sourceType: StudyTaskSourceType;
  sourceIds?: string[];
  status: StudyTaskStatus;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  actualMinutes?: number;
  dependencies?: string[];
  reviewOfTaskId?: string;
  rescheduledFromDate?: LocalDate;
  enrichment?: {
    source: TaskEnrichmentOutcome;
    requirementId: string;
  };
  metadata: {
    targetBand?: number;
    focusArea?: string;
    exerciseCount?: number;
    generationReason?: string;
    templateId?: string;
    aiCandidateId?: string;
  };
}

// ── Plan ──

export interface StudyPlan {
  id: string;
  version: number;
  profile: NormalizedProfile;
  planningWindow: PlanningWindow;
  feasibility: PlanFeasibility;
  timeBudget: StudyTimeBudget;
  skillAllocation: SkillAllocation;
  phases: StudyPhase[];
  weeks: StudyWeek[];
  tasks: StudyTask[];
  generationMetadata: PlanGenerationMetadata;
  createdAt: string;
  updatedAt: string;
}

// ── Generation Metadata ──

export interface PlanGenerationMetadata {
  engineVersion: string;
  schemaVersion: string;
  generatedAt: string;
  generationReason: string;
  regenerationMode?: RegenerationMode;
  profileSnapshotHash: string;
  settingsSnapshotHash: string;
  aiUsed: boolean;
  aiProvider?: string;
  aiModel?: string;
  aiCallCount: number;
  aiTokenUsage?: number;
  offlineFallbackUsed: boolean;
  previousPlanId?: string;
  previousPlanVersion?: number;
  validationWarnings: PlanValidationIssue[];
}

// ── Validation & Repair ──

export interface PlanValidationIssue {
  code: PlanValidationCode;
  severity: "warning" | "error";
  path?: string;
  message: string;
  repairable: boolean;
}

export interface PlanRepairAction {
  issueCode: PlanValidationCode;
  action: string;
  targetId: string;
  description: string;
}

// ── Generation Progress ──

export interface PlanGenerationProgress {
  stage: PlanGenerationStage;
  completedBatches: number;
  totalBatches: number;
  message: string;
}

// ── Preview ──

export interface StudyPlanPreview {
  planningWindow: PlanningWindow;
  feasibility: PlanFeasibility;
  skillAllocation: SkillAllocation;
  phases: StudyPhase[];
  estimatedTotalTasks: number;
  estimatedMockTestCount: number;
  warnings: PlanWarning[];
  suggestions: PlanAdjustmentSuggestion[];
}

// ── Settings Change Impact ──

export interface SettingsChangeImpact {
  description: string;
  changes: string[];
  preservedItems: string[];
  requiresConfirmation: boolean;
}

// ── Generation Result ──

export type GenerateStudyPlanResult =
  | {
      status: "success";
      plan: StudyPlan;
      feasibility: PlanFeasibility;
      warnings: PlanWarning[];
      generationSummary: PlanGenerationSummary;
    }
  | {
      status: "needs-profile-completion";
      missingFields: UserProfileField[];
    }
  | {
      status: "requires-confirmation";
      preview: StudyPlanPreview;
      feasibility: PlanFeasibility;
    }
  | {
      status: "cancelled";
    }
  | {
      status: "failure";
      reason: PlanGenerationFailureReason;
      validationIssues: PlanValidationIssue[];
      suggestions: PlanAdjustmentSuggestion[];
    };

export interface PlanGenerationSummary {
  generationId: string;
  durationMs: number;
  aiCallCount: number;
  aiTokenUsage?: number;
  cacheHits: number;
  candidateCount: number;
  scheduledTaskCount: number;
  reviewTaskCount: number;
  mockTestCount: number;
  repairsPerformed: PlanRepairAction[];
  fallbackUsed: boolean;
}

export interface PlanGenerationFailureReason {
  code: string;
  message: string;
  recoverable: boolean;
  suggestedAction: string;
}

// ── AI Enrichment Budget & Coverage Types ──

export interface AiGenerationCallBudget {
  profileAnalysisCalls: number;
  objectiveBatchCalls: number;
  taskCandidateBatchCalls: number;
  requiredCalls: number;
  repairBudget: number;
  maximumCalls: number;
  hardCallLimit: number;
}

export interface AiCallStats {
  requiredCallsAttempted: number;
  repairCallsAttempted: number;
  successfulCalls: number;
  failedCalls: number;
  totalAttemptedCalls: number;
  cacheHits: number;
  totalTokensEstimated: number;
}

export type TaskEnrichmentOutcome =
  | 'ai-generated'
  | 'ai-repaired'
  | 'planned-deterministic'
  | 'fallback-after-ai-failure';

export interface PhaseWeekSkillRequirement {
  requirementId: string;
  phaseId: string;
  weekId?: string;
  skill: string;
  itemType: 'task-candidate' | 'weekly-objective' | 'profile-analysis';
  expectedCount: number;
}

export interface EnrichmentCoverage {
  requirementId: string;
  expectedCount: number;
  generatedCount: number;
  missingCount: number;
  complete: boolean;
}

export interface AiRetryPolicy {
  maxRepairAttempts: number;
  enableRepair: boolean;
}

export interface AiTaskCoverageConfig {
  targetAiCoverage: number;
  minimumAiPerWeekSkillGroup: number;
  prioritizeWeakSkills: boolean;
  prioritizeHighValueTasks: boolean;
  distributeAcrossEntireRoadmap: boolean;
}

export interface AiTaskGenerationBatch {
  id: string;
  requirements: TaskEnrichmentRequirement[];
  expectedCandidateCount: number;
}

export interface BatchValidationResult {
  validCandidates: AITaskCandidate[];
  missingRequirementIds: string[];
  unknownRequirementIds: string[];
  duplicateRequirementIds: string[];
  invalidRequirementIds: string[];
}

export interface TaskEnrichmentReport {
  totalTaskRequirements: number;
  selectedForAi: number;
  intentionallyDeterministic: number;
  validAiCandidates: number;
  repairedAiCandidates: number;
  plannedDeterministicTasks: number;
  fallbackAfterAiFailureTasks: number;
  unknownRequirementIds: string[];
  duplicateRequirementIds: string[];
  invalidRequirementIds: string[];
  missingRequirementIds: string[];
}

// ── AI Integration Types ──

export interface AIGenerationPlan {
  useAI: boolean;
  profileAnalysisRequired: boolean;
  weeklyObjectiveBatches: AIWeekBatch[];
  taskCandidateBatches: AITaskBatch[];
  allowRepairCall: boolean;
  maximumCalls: number;
  tokenBudget: number;
  callBudget: AiGenerationCallBudget;
  retryPolicy: AiRetryPolicy;
}

export interface AIWeekBatch {
  batchIndex: number;
  weekIds: string[];
  startDate: LocalDate;
  endDate: LocalDate;
  phaseContext?: string;
}

export interface AITaskBatch {
  batchIndex: number;
  phaseId: string;
  weekIds: string[];
  requiredCount: number;
  tokenBudget: number;
}

export interface AICallLimits {
  maximumCallsPerGeneration: number;
  maximumRepairCalls: number;
  maximumTokensPerGeneration: number;
  maximumCandidatesPerBatch: number;
  maximumWeeksPerBatch: number;
  requestTimeoutMs: number;
}

export interface AIProfileAnalysis {
  primaryWeaknesses: Array<{
    skill: StudyTaskSkill;
    reason: string;
    confidence: number;
  }>;
  secondaryWeaknesses: StudyTaskSkill[];
  recommendedSequence: StudyTaskSkill[];
  recommendedTaskTypes: string[];
  risks: string[];
  learnerSummary: string;
}

export interface AIWeeklyObjective {
  weekId: string;
  title: string;
  focus: string;
  objectives: string[];
  recommendedTaskTypes: string[];
  pedagogicalReason: string;
}

export interface TaskEnrichmentRequirement {
  id: string;
  taskId: string;
  phaseId: string;
  weekId: string;
  skill: StudyTaskSkill;
  taskType: string;
  scheduledMinutes: number;
  sequence: number;
}

export interface AITaskCandidate {
  candidateId: string;
  requirementId: string;
  targetWeekId: string;
  skill: StudyTaskSkill;
  taskType: string;
  title: string;
  description: string;
  objective: string;
  reason: string;
  recommendedMinutes: number;
  difficulty: TaskDifficulty;
  priority: "low" | "normal" | "high";
  prerequisites?: string[];
  suggestedSourceTypes?: StudyTaskSourceType[];
  relevantSourceIds?: string[];
}

export interface EnrichmentMergeReport {
  totalRequirements: number;
  totalCandidates: number;
  appliedAiCandidates: number;
  fallbackTasks: number;
  duplicateRequirementIds: string[];
  unknownRequirementIds: string[];
  missingRequirementIds: string[];
  rejectedRequirementIds: string[];
}

export interface AICacheRecord {
  key: string;
  type: AICacheRecordType;
  inputHash: string;
  value: unknown;
  createdAt: string;
  expiresAt?: string;
  provider?: string;
  model?: string;
  schemaVersion: string;
}

// ── Missed Task Adaptation ──

export interface MissedTaskResolution {
  taskId: string;
  action: MissedTaskAction;
  reason: string;
  affectedTaskIds: string[];
}

// ── Review Scheduling ──

export interface ReviewSchedule {
  sourceTaskId: string;
  preferredIntervals: number[];
  scheduledReviewTaskIds: string[];
}

// ── Task Library ──

export type StudyTaskType = string;

export interface TaskTemplate {
  id: string;
  skill: StudyTaskSkill;
  taskType: StudyTaskType;
  testTypes: IELTSExamType[];
  minimumBand: number;
  maximumBand: number;
  compatiblePhases: StudyPhaseType[];
  allowedDurations: number[];
  difficulty: TaskDifficulty;
  titleTemplate: string;
  descriptionTemplate: string;
  objectiveTemplate: string;
  reasonTemplate: string;
  tags: string[];
  requiredCapabilities?: string[];
}

// ── Progress ──

export interface PlanProgress {
  overallTaskProgress: number;
  weightedOverallProgress: number;
  minuteProgress: number;
  phaseProgress: Record<string, number>;
  weeklyProgress: Record<string, number>;
  skillProgress: Partial<Record<StudyTaskSkill, number>>;
  completedPlannedMinutes: number;
  actualStudyMinutes: number;
  consistency: number;
  missedTaskCount: number;
  rescheduledTaskCount: number;
  totalTasks: number;
  completedTasks: number;
  totalScheduledMinutes: number;
}

// ── Plan Summary (for UI / explanation) ──

export interface PlanSummary {
  currentBand: number;
  targetBand: number;
  examDate: LocalDate;
  daysRemaining: number;
  availableStudyDays: number;
  totalAvailableHours: number;
  totalScheduledHours: number;
  reservedBufferMinutes: number;
  feasibility: PlanFeasibilityStatus;
  weakestSkills: StudyTaskSkill[];
  skillAllocation: SkillAllocation;
  phases: Array<{
    type: StudyPhaseType;
    title: string;
    dateRange: [LocalDate, LocalDate];
  }>;
  taskCount: number;
  reviewTaskCount: number;
  mockTestCount: number;
  aiUsed: boolean;
  offlineFallbackUsed: boolean;
}

// ── Plan Explanation ──

export interface PlanExplanation {
  overview: {
    currentBand: number;
    targetBand: number;
    examDate: LocalDate;
    daysRemaining: number;
    studyDays: number;
    totalAvailableHours: number;
    totalScheduledHours: number;
    feasibility: PlanFeasibilityStatus;
  };
  skillAnalysis: {
    weakestSkill: StudyTaskSkill;
    skillBreakdown: Array<{
      skill: StudyTaskSkill;
      bandGap: number;
      priority: number;
      reasons: string[];
    }>;
    allocation: Record<string, number>;
  };
  phaseProgression: Array<{
    type: StudyPhaseType;
    title: string;
    duration: string;
    focus: string;
  }>;
  weeksCount: number;
  personalization: {
    aiUsed: boolean;
    personalizedFeatures: string[];
    learnerSummary: string;
    dataUsed: string[];
  };
  feasibilitySummary: {
    status: PlanFeasibilityStatus;
    warnings: string[];
    suggestions: string[];
  };
}
