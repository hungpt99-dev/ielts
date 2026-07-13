import type {
  NormalizedProfile,
  UserProfileInput,
  WeeklyAvailability,
  DayAvailability,
  DayOfWeek,
  IELTSExamType,
  StudyTaskSkill,
  SkillBandScores,
  UserProfileField,
} from './types';

// ── Data Source Shape ──
// These types mirror the shapes returned by existing services
// (PersonalizationContext, AppSettings, learningProfileRepository)
// so consumers can pass their domain objects directly.

export interface SettingsSource {
  targetBand: number;
  currentBand: number;
  examDate: string;
  dailyStudyMinutes: number;
  weakSkills: string[];
  studyGoal: string;
  preferredSchedule: string[];
  aiEnabled: boolean;
  aiProvider?: string;
  aiApiKey?: string;
}

export interface PersonalizationSource {
  profile: {
    targetBand: number;
    currentBand: number;
    examDate: string;
    dailyStudyMinutes: number;
    weakSkills: string[];
    studyGoal: string;
    preferredSchedule: string[];
  };
  progress: {
    studyStreak: number;
    roadmapProgress: number;
    weeklyTasksDone: number;
    weeklyTasksTotal: number;
    totalStudyHours: number;
  };
  vocabulary: {
    totalWords: number;
    dueForReview: number;
    masteredCount: number;
  };
  mistakes: {
    total: number;
    recent: number;
    bySkill: Record<string, number>;
    dueForReview: number;
  };
  exam: {
    countdownDays: number;
  };
  tasks: {
    completedCount: number;
  };
}

// ── Profile Integration ──

/**
 * Merge data from multiple sources (settings, personalization context, learning profile)
 * into a complete UserProfileInput. Sources are shallow-merged – later sources fill gaps
 * left by earlier ones, so you can call it with whatever is available.
 */
export function mergeProfileSources(
  settings?: SettingsSource | null,
  personalization?: PersonalizationSource | null,
): Partial<UserProfileInput> {
  const result: Partial<UserProfileInput> = {};

  if (settings) {
    result.currentOverallBand = settings.currentBand;
    result.targetOverallBand = settings.targetBand;
    result.examDate = settings.examDate || undefined;
    result.examType = mapStudyGoalToExamType(settings.studyGoal);
    result.weeklyAvailability = createWeeklyAvailability(
      settings.preferredSchedule,
      settings.dailyStudyMinutes,
    );
    result.studyDays = mapScheduleToStudyDays(settings.preferredSchedule);
    result.weakSkills = mapWeakSkills(settings.weakSkills);
    result.offlineOnlyMode = !settings.aiEnabled;
    result.aiProviderAvailable = settings.aiEnabled && !!(settings.aiApiKey || settings.aiProvider);
  }

  if (personalization) {
    result.currentOverallBand ??= personalization.profile.currentBand;
    result.targetOverallBand ??= personalization.profile.targetBand;
    result.examDate ??= personalization.profile.examDate || undefined;
    result.examType ??= mapStudyGoalToExamType(personalization.profile.studyGoal);
    result.weeklyAvailability ??= createWeeklyAvailability(
      personalization.profile.preferredSchedule,
      personalization.profile.dailyStudyMinutes,
    );
    result.studyDays ??= mapScheduleToStudyDays(personalization.profile.preferredSchedule);
    result.weakSkills ??= mapWeakSkills(personalization.profile.weakSkills);
    result.currentLearningStreak = personalization.progress.studyStreak;
    result.existingRoadmapProgress = personalization.progress.roadmapProgress;
    result.savedVocabularyCount = personalization.vocabulary.totalWords;
  }

  return result;
}

const ALL_DAYS: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const SHORT_DAY_MAP: Record<string, DayOfWeek> = {
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
  sun: 'sunday',
};

const SKILL_MAP: Record<string, StudyTaskSkill> = {
  Vocabulary: 'vocabulary',
  Reading: 'reading',
  Listening: 'listening',
  Writing: 'writing',
  Speaking: 'speaking',
  Grammar: 'grammar',
};

function mapStudyGoalToExamType(goal: string): IELTSExamType {
  if (goal === 'general-training' || goal === 'general') return 'general-training';
  return 'academic';
}

function mapWeakSkills(weak: string[]): StudyTaskSkill[] {
  return weak
    .map(s => SKILL_MAP[s] ?? null)
    .filter((s): s is StudyTaskSkill => s !== null);
}

export function mapScheduleToStudyDays(schedule: string[]): DayOfWeek[] {
  return schedule
    .map(d => SHORT_DAY_MAP[d.toLowerCase()] ?? null)
    .filter((d): d is DayOfWeek => d !== null);
}

export function createWeeklyAvailability(
  schedule: string[],
  dailyMinutes: number,
): WeeklyAvailability {
  const enabledDays = new Set(schedule.map(d => d.toLowerCase()));
  const baseDay: DayAvailability = {
    enabled: true,
    availableMinutes: dailyMinutes,
    maximumSessionMinutes: Math.min(dailyMinutes, 60),
    maximumSessions: Math.max(1, Math.ceil(dailyMinutes / 30)),
  };
  const restDay: DayAvailability = {
    enabled: false,
    availableMinutes: 0,
    maximumSessionMinutes: 0,
    maximumSessions: 0,
  };

  const availability: WeeklyAvailability = {
    monday: { ...baseDay },
    tuesday: { ...baseDay },
    wednesday: { ...baseDay },
    thursday: { ...baseDay },
    friday: { ...baseDay },
    saturday: { ...baseDay },
    sunday: { ...baseDay },
  };

  for (const day of ALL_DAYS) {
    const shortKey = Object.entries(SHORT_DAY_MAP).find(([, v]) => v === day)?.[0];
    if (shortKey && !enabledDays.has(shortKey)) {
      availability[day] = { ...restDay };
    }
  }

  return availability;
}

// ── Critical Field Validation ──

const CRITICAL_FIELDS: UserProfileField[] = [
  'currentOverallBand',
  'targetOverallBand',
  'examDate',
  'planStartDate',
  'weeklyAvailability',
];

export function validateCriticalFields(input: Partial<UserProfileInput>): {
  valid: boolean;
  missingFields: UserProfileField[];
} {
  const missing: UserProfileField[] = [];

  for (const field of CRITICAL_FIELDS) {
    const value = input[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }

  if (input.weeklyAvailability) {
    const allDisabled = ALL_DAYS.every(
      day => !input.weeklyAvailability![day].enabled,
    );
    if (allDisabled) {
      if (!missing.includes('weeklyAvailability')) {
        missing.push('weeklyAvailability');
      }
    }
  }

  if (input.currentOverallBand != null && input.targetOverallBand != null) {
    if (input.currentOverallBand < 0 || input.currentOverallBand > 9 || input.targetOverallBand < 0 || input.targetOverallBand > 9) {
      if (!missing.includes('currentOverallBand')) missing.push('currentOverallBand');
      if (!missing.includes('targetOverallBand')) missing.push('targetOverallBand');
    }
  }

  return { valid: missing.length === 0, missingFields: missing };
}

// ── Profile Normalization ──

const DEFAULT_SKILL_BANDS: SkillBandScores = {
  listening: 0,
  reading: 0,
  writing: 0,
  speaking: 0,
};

export function normalizeProfile(input: UserProfileInput): NormalizedProfile {
  return {
    currentOverallBand: input.currentOverallBand,
    targetOverallBand: input.targetOverallBand,
    currentSkillBands: {
      ...DEFAULT_SKILL_BANDS,
      ...(input.currentSkillBands ?? {}),
    },
    targetSkillBands: { ...(input.targetSkillBands ?? {}) },
    examType: input.examType,
    examDate: input.examDate,
    planStartDate: input.planStartDate,
    timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    weeklyAvailability: input.weeklyAvailability,
    availabilityExceptions: buildAvailabilityExceptions(input),
    maximumSessionMinutes: input.maximumSessionMinutes ?? 60,
    maximumSessionsPerDay: input.maximumSessionsPerDay ?? 3,
    studyIntensity: input.studyIntensity ?? 'moderate',
    weakSkills: input.weakSkills ?? [],
    strongSkills: input.strongSkills ?? [],
    preferredTaskTypes: input.preferredTaskTypes ?? [],
    recentMistakes: input.recentMistakes ?? [],
    exerciseAccuracy: input.exerciseAccuracy ?? {},
    previousMockResults: input.previousMockResults ?? [],
    taskCompletionHistory: input.taskCompletionHistory ?? [],
    userConfidence: input.userConfidence ?? {},
    manuallySelectedPrioritySkills: input.manuallySelectedPrioritySkills ?? [],
    offlineOnlyMode: input.offlineOnlyMode ?? true,
    aiProviderAvailable: input.aiProviderAvailable ?? false,
  };
}

function buildAvailabilityExceptions(input: UserProfileInput): import('./types').AvailabilityException[] {
  const exceptions: import('./types').AvailabilityException[] = [];

  if (input.temporaryUnavailableDates) {
    for (const date of input.temporaryUnavailableDates) {
      exceptions.push({ date, type: 'unavailable' });
    }
  }

  if (input.dateSpecificAdditionalAvailability) {
    for (const override of input.dateSpecificAdditionalAvailability) {
      exceptions.push({
        date: override.date,
        type: 'custom-capacity',
        availableMinutes: override.additionalMinutes,
      });
    }
  }

  return exceptions;
}

// ── Convenience Builder ──

export interface BuildProfileParams {
  settings?: SettingsSource | null;
  personalization?: PersonalizationSource | null;
  overrides?: Partial<UserProfileInput>;
}

/**
 * Build a complete UserProfileInput by merging settings source,
 * personalization context, and explicit overrides.
 */
export function buildUserProfile(params: BuildProfileParams): UserProfileInput {
  const merged = mergeProfileSources(params.settings, params.personalization);
  const combined: Partial<UserProfileInput> = { ...merged, ...params.overrides };

  const missingCheck = validateCriticalFields(combined);
  if (!missingCheck.valid) {
    throw new ProfileValidationError(missingCheck.missingFields);
  }

  return {
    currentOverallBand: combined.currentOverallBand!,
    targetOverallBand: combined.targetOverallBand!,
    currentSkillBands: combined.currentSkillBands ?? DEFAULT_SKILL_BANDS,
    targetSkillBands: combined.targetSkillBands,
    examType: combined.examType ?? 'academic',
    examDate: combined.examDate!,
    planStartDate: combined.planStartDate!,
    timezone: combined.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    studyDays: combined.studyDays ?? [],
    weeklyAvailability: combined.weeklyAvailability!,
    maximumSessionMinutes: combined.maximumSessionMinutes ?? 60,
    maximumSessionsPerDay: combined.maximumSessionsPerDay ?? 3,
    preferredStudyTime: combined.preferredStudyTime ?? 'flexible',
    restDays: combined.restDays ?? [],
    studyIntensity: combined.studyIntensity ?? 'moderate',
    weakSkills: combined.weakSkills ?? [],
    strongSkills: combined.strongSkills ?? [],
    preferredLearningMethods: combined.preferredLearningMethods ?? [],
    preferredTaskTypes: combined.preferredTaskTypes ?? [],
    recentMistakes: combined.recentMistakes,
    exerciseAccuracy: combined.exerciseAccuracy,
    completedExercises: combined.completedExercises,
    incompleteExercises: combined.incompleteExercises,
    savedVocabularyCount: combined.savedVocabularyCount,
    previousMockResults: combined.previousMockResults,
    taskCompletionHistory: combined.taskCompletionHistory,
    actualStudyDurations: combined.actualStudyDurations,
    currentLearningStreak: combined.currentLearningStreak,
    existingRoadmapProgress: combined.existingRoadmapProgress,
    userConfidence: combined.userConfidence,
    previousIELTSResults: combined.previousIELTSResults,
    manuallySelectedPrioritySkills: combined.manuallySelectedPrioritySkills,
    temporaryUnavailableDates: combined.temporaryUnavailableDates,
    dateSpecificAdditionalAvailability: combined.dateSpecificAdditionalAvailability,
    offlineOnlyMode: combined.offlineOnlyMode ?? true,
    aiProviderAvailable: combined.aiProviderAvailable ?? false,
  };
}

/**
 * Build a complete NormalizedProfile in one step — the main entry point
 * for plan generation.
 */
export function buildNormalizedProfile(params: BuildProfileParams): NormalizedProfile {
  const userProfile = buildUserProfile(params);
  return normalizeProfile(userProfile);
}

// ── Error Type ──

export class ProfileValidationError extends Error {
  public readonly missingFields: UserProfileField[];

  constructor(missingFields: UserProfileField[]) {
    super(
      `Profile is missing required fields: ${missingFields.join(', ')}`,
    );
    this.name = 'ProfileValidationError';
    this.missingFields = missingFields;
  }
}

// ── PlanEngineIntegration Class ──

export interface DataProvider {
  getSettings(): Promise<SettingsSource | null>;
  getPersonalization(): Promise<PersonalizationSource | null>;
}

export class PlanEngineIntegration {
  private readonly dataProvider: DataProvider;

  constructor(dataProvider: DataProvider) {
    this.dataProvider = dataProvider;
  }

  async loadNormalizedProfile(
    overrides?: Partial<UserProfileInput>,
  ): Promise<NormalizedProfile> {
    const [settings, personalization] = await Promise.all([
      this.dataProvider.getSettings(),
      this.dataProvider.getPersonalization(),
    ]);

    return buildNormalizedProfile({
      settings,
      personalization,
      overrides,
    });
  }

  async loadUserProfile(
    overrides?: Partial<UserProfileInput>,
  ): Promise<UserProfileInput> {
    const [settings, personalization] = await Promise.all([
      this.dataProvider.getSettings(),
      this.dataProvider.getPersonalization(),
    ]);

    return buildUserProfile({
      settings,
      personalization,
      overrides,
    });
  }
}
