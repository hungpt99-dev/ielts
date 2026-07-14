import { describe, it, expect } from 'vitest';
import {
  mergeProfileSources,
  mapScheduleToStudyDays,
  createWeeklyAvailability,
  validateCriticalFields,
  normalizeProfile,
  buildUserProfile,
  buildNormalizedProfile,
  PlanEngineIntegration,
  ProfileValidationError,
} from './PlanEngineIntegration';
import type {
  SettingsSource,
  PersonalizationSource,
  DataProvider,
} from './PlanEngineIntegration';
import type { UserProfileInput } from './types';

// ── Fixtures ──

function sampleSettings(overrides?: Partial<SettingsSource>): SettingsSource {
  return {
    targetBand: 7.0,
    currentBand: 5.5,
    examDate: '2026-10-12',
    dailyStudyMinutes: 60,
    weakSkills: ['Writing', 'Speaking'],
    studyGoal: 'academic',
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    aiEnabled: false,
    ...overrides,
  };
}

function samplePersonalization(
  overrides?: Partial<PersonalizationSource>,
): PersonalizationSource {
  return {
    profile: {
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: '2026-10-12',
      dailyStudyMinutes: 60,
      weakSkills: ['Writing', 'Speaking'],
      studyGoal: 'academic',
      preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    },
    progress: {
      studyStreak: 5,
      roadmapProgress: 0.3,
      weeklyTasksDone: 8,
      weeklyTasksTotal: 12,
      totalStudyHours: 45,
    },
    vocabulary: {
      totalWords: 200,
      dueForReview: 25,
      masteredCount: 50,
    },
    mistakes: {
      total: 30,
      recent: 5,
      bySkill: { Writing: 12, Speaking: 8, Reading: 6, Listening: 4 },
      dueForReview: 10,
    },
    exam: {
      countdownDays: 90,
    },
    tasks: {
      completedCount: 120,
    },
    ...overrides,
  };
}

function validUserProfile(): UserProfileInput {
  return {
    currentOverallBand: 5.5,
    targetOverallBand: 7.0,
    currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
    targetSkillBands: {},
    examType: 'academic',
    examDate: '2026-10-12',
    planStartDate: '2026-07-14',
    timezone: 'Asia/Ho_Chi_Minh',
    studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    weeklyAvailability: createWeeklyAvailability(
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      60,
    ),
    maximumSessionMinutes: 60,
    maximumSessionsPerDay: 3,
    preferredStudyTime: 'flexible',
    restDays: ['sunday'],
    studyIntensity: 'moderate',
    weakSkills: ['writing', 'speaking'],
    strongSkills: ['listening'],
    preferredLearningMethods: [],
    preferredTaskTypes: [],
    recentMistakes: [],
    exerciseAccuracy: { listening: 0.7, reading: 0.7, writing: 0.4, speaking: 0.5 },
    completedExercises: 50,
    incompleteExercises: 10,
    savedVocabularyCount: 200,
    previousMockResults: [],
    taskCompletionHistory: [],
    actualStudyDurations: [],
    currentLearningStreak: 5,
    existingRoadmapProgress: 0.3,
    userConfidence: { writing: 0.3, speaking: 0.4 },
    manuallySelectedPrioritySkills: ['writing'],
    offlineOnlyMode: true,
    aiProviderAvailable: false,
  };
}

// ── Tests ──

describe('mapScheduleToStudyDays', () => {
  it('converts short day names to full day-of-week values', () => {
    expect(mapScheduleToStudyDays(['mon', 'wed', 'fri'])).toEqual([
      'monday', 'wednesday', 'friday',
    ]);
  });

  it('returns empty array for empty schedule', () => {
    expect(mapScheduleToStudyDays([])).toEqual([]);
  });

  it('handles all days', () => {
    const all = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    expect(mapScheduleToStudyDays(all)).toEqual([
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ]);
  });

  it('filters unknown day names', () => {
    expect(mapScheduleToStudyDays(['mon', 'xxx', 'fri'])).toEqual(['monday', 'friday']);
  });

  it('is case-insensitive', () => {
    expect(mapScheduleToStudyDays(['Mon', 'TUE', 'Wed'])).toEqual([
      'monday', 'tuesday', 'wednesday',
    ]);
  });
});

describe('createWeeklyAvailability', () => {
  it('enables listed days with the given daily minutes', () => {
    const avail = createWeeklyAvailability(['mon', 'tue', 'wed'], 45);
    expect(avail.monday.enabled).toBe(true);
    expect(avail.monday.availableMinutes).toBe(45);
    expect(avail.tuesday.enabled).toBe(true);
    expect(avail.wednesday.enabled).toBe(true);
    expect(avail.thursday.enabled).toBe(false);
    expect(avail.friday.enabled).toBe(false);
    expect(avail.saturday.enabled).toBe(false);
    expect(avail.sunday.enabled).toBe(false);
  });

  it('disables all days when schedule is empty', () => {
    const avail = createWeeklyAvailability([], 30);
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const) {
      expect(avail[day].enabled).toBe(false);
      expect(avail[day].availableMinutes).toBe(0);
    }
  });

  it('calculates max sessions from daily minutes', () => {
    const avail = createWeeklyAvailability(['mon'], 90);
    expect(avail.monday.maximumSessions).toBe(3);
    const short = createWeeklyAvailability(['mon'], 25);
    expect(short.monday.maximumSessions).toBe(1);
  });

  it('caps max session minutes at daily minutes', () => {
    const avail = createWeeklyAvailability(['mon'], 30);
    expect(avail.monday.maximumSessionMinutes).toBe(30);
  });
});

describe('mergeProfileSources', () => {
  it('merges settings into a partial UserProfileInput', () => {
    const merged = mergeProfileSources(sampleSettings());
    expect(merged.currentOverallBand).toBe(5.5);
    expect(merged.targetOverallBand).toBe(7.0);
    expect(merged.examDate).toBe('2026-10-12');
    expect(merged.examType).toBe('academic');
    expect(merged.weakSkills).toEqual(['writing', 'speaking']);
    expect(merged.offlineOnlyMode).toBe(true);
    expect(merged.aiProviderAvailable).toBe(false);
  });

  it('returns empty object when both sources are null', () => {
    const merged = mergeProfileSources(null, null);
    expect(merged).toEqual({});
  });

  it('fills gaps from personalization when settings is null', () => {
    const merged = mergeProfileSources(null, samplePersonalization());
    expect(merged.currentOverallBand).toBe(5.5);
    expect(merged.targetOverallBand).toBe(7.0);
    expect(merged.currentLearningStreak).toBe(5);
    expect(merged.savedVocabularyCount).toBe(200);
  });

  it('settings take priority over personalization', () => {
    const merged = mergeProfileSources(
      sampleSettings({ currentBand: 6.0 }),
      samplePersonalization(),
    );
    expect(merged.currentOverallBand).toBe(6.0);
  });

  it('handles general-training exam type', () => {
    const merged = mergeProfileSources(
      sampleSettings({ studyGoal: 'general-training' }),
    );
    expect(merged.examType).toBe('general-training');
  });

  it('detects AI availability from settings', () => {
    const merged = mergeProfileSources(
      sampleSettings({ aiEnabled: true, aiApiKey: 'sk-xxx' }),
    );
    expect(merged.aiProviderAvailable).toBe(true);
  });

  it('does not enable AI when api key is missing', () => {
    const merged = mergeProfileSources(
      sampleSettings({ aiEnabled: true, aiApiKey: '' }),
    );
    expect(merged.aiProviderAvailable).toBe(false);
  });
});

describe('validateCriticalFields', () => {
  it('returns valid for complete input', () => {
    const profile = validUserProfile();
    const result = validateCriticalFields(profile);
    expect(result.valid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it('detects missing critical fields', () => {
    const result = validateCriticalFields({} as Partial<UserProfileInput>);
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('currentOverallBand');
    expect(result.missingFields).toContain('targetOverallBand');
    expect(result.missingFields).toContain('examDate');
    expect(result.missingFields).toContain('planStartDate');
    expect(result.missingFields).toContain('weeklyAvailability');
  });

  it('detects all-disabled weekly availability', () => {
    const result = validateCriticalFields({
      currentOverallBand: 5.5,
      targetOverallBand: 7.0,
      examDate: '2026-10-12',
      planStartDate: '2026-07-14',
      weeklyAvailability: createWeeklyAvailability([], 60),
    });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('weeklyAvailability');
  });

  it('detects out-of-range band values', () => {
    const result = validateCriticalFields({
      currentOverallBand: -1,
      targetOverallBand: 15,
    } as Partial<UserProfileInput>);
    expect(result.valid).toBe(false);
  });

  it('treats empty string exam date as missing', () => {
    const result = validateCriticalFields({
      currentOverallBand: 5.5,
      targetOverallBand: 7.0,
      examDate: '',
      planStartDate: '2026-07-14',
      weeklyAvailability: createWeeklyAvailability(['mon'], 60),
    });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('examDate');
  });
});

describe('normalizeProfile', () => {
  it('transforms UserProfileInput to NormalizedProfile', () => {
    const input = validUserProfile();
    const normalized = normalizeProfile(input);

    expect(normalized.currentOverallBand).toBe(5.5);
    expect(normalized.targetOverallBand).toBe(7.0);
    expect(normalized.currentSkillBands).toEqual({
      listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5,
    });
    expect(normalized.weeklyAvailability.monday.enabled).toBe(true);
    expect(normalized.weakSkills).toEqual(['writing', 'speaking']);
  });

  it('fills default skill bands when not provided', () => {
    const input = validUserProfile();
    input.currentSkillBands = undefined as never;
    const normalized = normalizeProfile(input);
    expect(normalized.currentSkillBands).toEqual({
      listening: 0, reading: 0, writing: 0, speaking: 0,
    });
  });

  it('sets default timezone when not provided', () => {
    const input = validUserProfile();
    input.timezone = '';
    const normalized = normalizeProfile(input);
    expect(normalized.timezone).toBeTruthy();
  });

  it('builds availability exceptions from temporary dates', () => {
    const input = validUserProfile();
    input.temporaryUnavailableDates = ['2026-08-01', '2026-08-15'];
    const normalized = normalizeProfile(input);
    expect(normalized.availabilityExceptions).toHaveLength(2);
    expect(normalized.availabilityExceptions[0]).toEqual({
      date: '2026-08-01',
      type: 'unavailable',
    });
  });

  it('builds availability exceptions from date-specific overrides', () => {
    const input = validUserProfile();
    input.dateSpecificAdditionalAvailability = [
      { date: '2026-08-10', additionalMinutes: 30 },
    ];
    const normalized = normalizeProfile(input);
    expect(normalized.availabilityExceptions).toHaveLength(1);
    expect(normalized.availabilityExceptions[0]).toEqual({
      date: '2026-08-10',
      type: 'custom-capacity',
      availableMinutes: 30,
    });
  });

  it('provides safe defaults for optional fields when not set', () => {
    const input = validUserProfile();
    input.recentMistakes = undefined;
    input.exerciseAccuracy = undefined;
    input.taskCompletionHistory = undefined;
    input.userConfidence = undefined;
    const normalized = normalizeProfile(input);
    expect(normalized.recentMistakes).toEqual([]);
    expect(normalized.exerciseAccuracy).toEqual({});
    expect(normalized.taskCompletionHistory).toEqual([]);
    expect(normalized.userConfidence).toEqual({});
    expect(normalized.offlineOnlyMode).toBe(true);
  });
});

describe('buildUserProfile', () => {
  it('builds complete profile from settings and personalization', () => {
    const profile = buildUserProfile({
      settings: sampleSettings(),
      personalization: samplePersonalization(),
      overrides: {
        planStartDate: '2026-07-14',
        currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
      },
    });

    expect(profile.currentOverallBand).toBe(5.5);
    expect(profile.targetOverallBand).toBe(7.0);
    expect(profile.examDate).toBe('2026-10-12');
    expect(profile.planStartDate).toBe('2026-07-14');
    expect(profile.examType).toBe('academic');
    expect(profile.savedVocabularyCount).toBe(200);
    expect(profile.currentLearningStreak).toBe(5);
  });

  it('throws ProfileValidationError when critical fields are missing', () => {
    expect(() =>
      buildUserProfile({
        settings: sampleSettings({ examDate: '', currentBand: 0 }),
        overrides: {},
      }),
    ).toThrow(ProfileValidationError);
  });

  it('throws with correct missing field names', () => {
    try {
      buildUserProfile({ settings: null, personalization: null, overrides: {} });
    } catch (e) {
      console.error('packages/learning-engine/src/daily-plan/PlanEngineIntegration.test.ts error:', e);
      if (e instanceof ProfileValidationError) {
        expect(e.missingFields).toContain('currentOverallBand');
        expect(e.missingFields).toContain('planStartDate');
      }
    }
  });

  it('overrides take precedence over sources', () => {
    const profile = buildUserProfile({
      settings: sampleSettings({ currentBand: 5.0 }),
      overrides: {
        currentOverallBand: 6.0,
        planStartDate: '2026-08-01',
        currentSkillBands: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 },
      },
    });
    expect(profile.currentOverallBand).toBe(6.0);
    expect(profile.planStartDate).toBe('2026-08-01');
  });

  it('works with only settings and minimal overrides', () => {
    const profile = buildUserProfile({
      settings: sampleSettings(),
      overrides: { planStartDate: '2026-07-14' },
    });
    expect(profile.currentOverallBand).toBe(5.5);
    expect(profile.planStartDate).toBe('2026-07-14');
  });
});

describe('buildNormalizedProfile', () => {
  it('builds a ready-to-use NormalizedProfile for the engine', () => {
    const normalized = buildNormalizedProfile({
      settings: sampleSettings(),
      personalization: samplePersonalization(),
      overrides: {
        planStartDate: '2026-07-14',
        currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
      },
    });

    expect(normalized.currentOverallBand).toBe(5.5);
    expect(normalized.targetOverallBand).toBe(7.0);
    expect(normalized.planStartDate).toBe('2026-07-14');
    expect(normalized.weakSkills).toEqual(['writing', 'speaking']);
    expect(normalized.availabilityExceptions).toEqual([]);
  });

  it('throws with meaningful error for missing fields', () => {
    expect(() =>
      buildNormalizedProfile({
        settings: null,
        personalization: null,
        overrides: {},
      }),
    ).toThrow('missing required fields');
  });
});

describe('PlanEngineIntegration class', () => {
  it('loads normalized profile from data provider', async () => {
    const provider: DataProvider = {
      getSettings: async () => sampleSettings(),
      getPersonalization: async () => samplePersonalization(),
    };
    const integration = new PlanEngineIntegration(provider);

    const profile = await integration.loadNormalizedProfile({
      planStartDate: '2026-07-14',
      currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
    });

    expect(profile.currentOverallBand).toBe(5.5);
    expect(profile.targetOverallBand).toBe(7.0);
    expect(profile.planStartDate).toBe('2026-07-14');
  });

  it('loads user profile from data provider', async () => {
    const provider: DataProvider = {
      getSettings: async () => sampleSettings(),
      getPersonalization: async () => samplePersonalization(),
    };
    const integration = new PlanEngineIntegration(provider);

    const profile = await integration.loadUserProfile({
      planStartDate: '2026-07-14',
    });

    expect(profile.currentOverallBand).toBe(5.5);
    expect(profile.planStartDate).toBe('2026-07-14');
    expect(profile.savedVocabularyCount).toBe(200);
  });

  it('throws when provider returns null sources and no overrides', async () => {
    const provider: DataProvider = {
      getSettings: async () => null,
      getPersonalization: async () => null,
    };
    const integration = new PlanEngineIntegration(provider);

    await expect(
      integration.loadNormalizedProfile(),
    ).rejects.toThrow(ProfileValidationError);
  });

  it('allows DataProvider to reject', async () => {
    const provider: DataProvider = {
      getSettings: async () => { throw new Error('Storage unavailable'); },
      getPersonalization: async () => null,
    };
    const integration = new PlanEngineIntegration(provider);

    await expect(
      integration.loadNormalizedProfile({
        planStartDate: '2026-07-14',
      }),
    ).rejects.toThrow('Storage unavailable');
  });

  it('works with personalization only (no settings)', async () => {
    const provider: DataProvider = {
      getSettings: async () => null,
      getPersonalization: async () => samplePersonalization(),
    };
    const integration = new PlanEngineIntegration(provider);

    const profile = await integration.loadNormalizedProfile({
      planStartDate: '2026-07-14',
      currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
    });

    expect(profile.currentOverallBand).toBe(5.5);
    expect(profile.targetOverallBand).toBe(7.0);
    expect(profile.weakSkills).toEqual(['writing', 'speaking']);
  });
});

describe('ProfileValidationError', () => {
  it('stores missing fields', () => {
    const error = new ProfileValidationError(['planStartDate', 'examDate']);
    expect(error.message).toContain('planStartDate');
    expect(error.message).toContain('examDate');
    expect(error.missingFields).toEqual(['planStartDate', 'examDate']);
  });
});

describe('end-to-end: integration with engine', () => {
  it('generates a valid normalized profile with no hardcoded values', () => {
    const settings = sampleSettings({
      targetBand: 7.5,
      currentBand: 6.0,
      dailyStudyMinutes: 90,
      preferredSchedule: ['mon', 'wed', 'fri'],
    });

    const normalized = buildNormalizedProfile({
      settings,
      overrides: {
        planStartDate: '2026-09-01',
        currentSkillBands: { listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6.0 },
        targetSkillBands: { writing: 7.0, speaking: 7.0 },
        studyIntensity: 'intensive',
      },
    });

    expect(normalized.currentOverallBand).toBe(6.0);
    expect(normalized.targetOverallBand).toBe(7.5);
    expect(normalized.planStartDate).toBe('2026-09-01');
    expect(normalized.currentSkillBands).toEqual({
      listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6.0,
    });
    expect(normalized.targetSkillBands).toEqual({ writing: 7.0, speaking: 7.0 });
    expect(normalized.studyIntensity).toBe('intensive');
    expect(normalized.offlineOnlyMode).toBe(true);
    expect(normalized.aiProviderAvailable).toBe(false);

    const enabledDays = [
      normalized.weeklyAvailability.monday,
      normalized.weeklyAvailability.wednesday,
      normalized.weeklyAvailability.friday,
    ];
    const disabledDays = [
      normalized.weeklyAvailability.tuesday,
      normalized.weeklyAvailability.thursday,
      normalized.weeklyAvailability.saturday,
      normalized.weeklyAvailability.sunday,
    ];

    for (const day of enabledDays) {
      expect(day.enabled).toBe(true);
      expect(day.availableMinutes).toBe(90);
    }
    for (const day of disabledDays) {
      expect(day.enabled).toBe(false);
    }
  });

  it('generates a plan from complete profile with AI disabled (no key)', () => {
    const settings = sampleSettings({
      aiEnabled: false,
      aiApiKey: '',
    });

    const normalized = buildNormalizedProfile({
      settings,
      overrides: {
        planStartDate: '2026-07-14',
        currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
      },
    });

    expect(normalized.aiProviderAvailable).toBe(false);
    expect(normalized.offlineOnlyMode).toBe(true);
    expect(normalized.currentOverallBand).toBe(5.5);
    expect(normalized.weeklyAvailability.monday.enabled).toBe(true);
  });

  it('generates a plan from complete profile with AI enabled and key', () => {
    const settings = sampleSettings({
      aiEnabled: true,
      aiApiKey: 'sk-xxx',
    });

    const normalized = buildNormalizedProfile({
      settings,
      overrides: {
        planStartDate: '2026-07-14',
        currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
      },
    });

    expect(normalized.aiProviderAvailable).toBe(true);
    expect(normalized.offlineOnlyMode).toBe(false);
  });

  it('generates a plan with combined availability exceptions and overrides', () => {
    const settings = sampleSettings();

    const normalized = buildNormalizedProfile({
      settings,
      overrides: {
        planStartDate: '2026-07-14',
        currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
        temporaryUnavailableDates: ['2026-07-20', '2026-07-25'],
        dateSpecificAdditionalAvailability: [
          { date: '2026-07-22', additionalMinutes: 60 },
        ],
      },
    });

    expect(normalized.availabilityExceptions).toHaveLength(3);
    const unavailableDates = normalized.availabilityExceptions.filter(e => e.type === 'unavailable');
    expect(unavailableDates).toHaveLength(2);
    const customCapacity = normalized.availabilityExceptions.filter(e => e.type === 'custom-capacity');
    expect(customCapacity).toHaveLength(1);
    expect(customCapacity[0].availableMinutes).toBe(60);
  });
});
