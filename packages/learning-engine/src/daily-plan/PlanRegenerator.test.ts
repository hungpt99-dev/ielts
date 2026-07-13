import { describe, it, expect, beforeEach } from 'vitest';
import { DailyPlanEngine } from './DailyPlanEngine';
import { PlanRegenerator } from './PlanRegenerator';
import type {
  NormalizedProfile,
  WeeklyAvailability,
  DayAvailability,
  StudyPlan,
  StudyTask,
} from './types';

// ── Test Helpers ──

function fullAvailability(minutes: number): DayAvailability {
  return {
    enabled: true,
    availableMinutes: minutes,
    maximumSessionMinutes: 60,
    maximumSessions: 3,
  };
}

function restDay(): DayAvailability {
  return {
    enabled: false,
    availableMinutes: 0,
    maximumSessionMinutes: 0,
    maximumSessions: 0,
  };
}

function createWeeklyAvailability(
  override: Partial<Record<string, DayAvailability>> = {},
): WeeklyAvailability {
  const defaults: WeeklyAvailability = {
    monday: fullAvailability(60),
    tuesday: fullAvailability(60),
    wednesday: fullAvailability(60),
    thursday: fullAvailability(60),
    friday: fullAvailability(60),
    saturday: fullAvailability(120),
    sunday: fullAvailability(60),
  };
  for (const [day, avail] of Object.entries(override)) {
    if (avail !== undefined) {
      (defaults as unknown as Record<string, DayAvailability>)[day] = avail;
    }
  }
  return defaults;
}

function createProfile(
  overrides: Partial<NormalizedProfile> = {},
): NormalizedProfile {
  return {
    currentOverallBand: 5.5,
    targetOverallBand: 7.0,
    currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
    targetSkillBands: {},
    examType: 'academic',
    examDate: '2026-10-12',
    planStartDate: '2026-07-14',
    timezone: 'Asia/Ho_Chi_Minh',
    weeklyAvailability: createWeeklyAvailability(),
    availabilityExceptions: [],
    maximumSessionMinutes: 60,
    maximumSessionsPerDay: 3,
    studyIntensity: 'moderate',
    weakSkills: ['writing', 'speaking'],
    strongSkills: ['listening'],
    preferredTaskTypes: [],
    recentMistakes: [],
    exerciseAccuracy: {},
    previousMockResults: [],
    taskCompletionHistory: [],
    userConfidence: { listening: 0.7, reading: 0.6, writing: 0.3, speaking: 0.4 },
    manuallySelectedPrioritySkills: ['writing'],
    offlineOnlyMode: true,
    aiProviderAvailable: false,
    ...overrides,
  };
}

function generateValidPlan(
  engine: DailyPlanEngine,
  profile: NormalizedProfile,
): StudyPlan {
  const result = engine.generatePlan(profile);
  if (result.status !== 'success') {
    throw new Error(`Plan generation failed: ${result.status}`);
  }
  return result.plan;
}

// ── Tests ──

describe('PlanRegenerator', () => {
  let engine: DailyPlanEngine;
  let regenerator: PlanRegenerator;

  beforeEach(() => {
    engine = new DailyPlanEngine();
    regenerator = new PlanRegenerator(engine);
  });

  describe('regenerate (future-only)', () => {
    it('preserves completed tasks during future-only regeneration', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const tasks = [...plan.tasks];
      const completedTasks = tasks.slice(0, 3).map(t => ({
        ...t,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      }));
      const completedIds = new Set(completedTasks.map(t => t.id));
      const currentPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...completedTasks,
          ...tasks.slice(3).map(t => ({ ...t, status: t.status as StudyTask['status'] })),
        ],
      };

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const result = regenerator.regenerate({
        currentPlan,
        newProfile,
        mode: 'future-only',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const preserved = result.plan.tasks.filter(t => completedIds.has(t.id));
        expect(preserved.length).toBeGreaterThanOrEqual(completedTasks.length);
        for (const task of preserved) {
          expect(task.status).toBe('completed');
        }
      }
    });

    it('preserves in-progress tasks during regeneration', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const inProgress = plan.tasks.slice(0, 2).map(t => ({
        ...t,
        status: 'in-progress' as const,
        startedAt: new Date().toISOString(),
      }));
      const completed = plan.tasks.slice(2, 4).map(t => ({
        ...t,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      }));
      const preservedIds = new Set([...inProgress, ...completed].map(t => t.id));

      const currentPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...inProgress,
          ...completed,
          ...plan.tasks.slice(4).map(t => ({ ...t, status: t.status as StudyTask['status'] })),
        ],
      };

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const result = regenerator.regenerate({
        currentPlan,
        newProfile,
        mode: 'future-only',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const preserved = result.plan.tasks.filter(t => preservedIds.has(t.id));
        expect(preserved.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('increments plan version on regeneration', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'future-only',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.version).toBe(plan.version + 1);
      }
    });

    it('preserves createdAt from original plan', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'future-only',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.createdAt).toBe(plan.createdAt);
      }
    });

    it('links to previous plan in metadata', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'settings-change',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.generationMetadata.previousPlanId).toBe(plan.id);
        expect(result.plan.generationMetadata.previousPlanVersion).toBe(plan.version);
        expect(result.plan.generationMetadata.regenerationMode).toBe('settings-change');
      }
    });

    it('delegates to engine.generatePlan for full mode', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ targetOverallBand: 7.5 });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'full',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.profile.targetOverallBand).toBe(7.5);
      }
    });
  });

  describe('regenerate (exam-date-change)', () => {
    it('adjusts planning window for new exam date', () => {
      const profile = createProfile({
        examDate: '2026-10-12',
      });
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({
        examDate: '2026-09-12',
      });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'exam-date-change',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.planningWindow.examDate).toBe('2026-09-12');
        expect(result.plan.tasks.every(t => t.date <= '2026-09-12')).toBe(true);
      }
    });

    it('preserves completed tasks when exam date changes', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const completed = plan.tasks.slice(0, 2).map(t => ({
        ...t,
        status: 'completed' as const,
      }));
      const completedIds = new Set(completed.map(t => t.id));
      const currentPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...completed,
          ...plan.tasks.slice(2).map(t => ({ ...t, status: t.status as StudyTask['status'] })),
        ],
      };

      const newProfile = createProfile({ examDate: '2026-09-12' });
      const result = regenerator.regenerate({
        currentPlan,
        newProfile,
        mode: 'exam-date-change',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const preserved = result.plan.tasks.filter(t => completedIds.has(t.id));
        expect(preserved.length).toBeGreaterThanOrEqual(completed.length);
      }
    });
  });

  describe('regenerate (target-change)', () => {
    it('regenerates plan with new target band', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ targetOverallBand: 7.5 });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'target-change',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.profile.targetOverallBand).toBe(7.5);
      }
    });

    it('preserves completed tasks when target changes', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const completed = plan.tasks.slice(0, 3).map(t => ({
        ...t,
        status: 'completed' as const,
      }));
      const completedIds = new Set(completed.map(t => t.id));
      const currentPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...completed,
          ...plan.tasks.slice(3).map(t => ({ ...t, status: t.status as StudyTask['status'] })),
        ],
      };

      const newProfile = createProfile({ targetOverallBand: 6.5 });
      const result = regenerator.regenerate({
        currentPlan,
        newProfile,
        mode: 'target-change',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const preserved = result.plan.tasks.filter(t => completedIds.has(t.id));
        expect(preserved.length).toBe(completed.length);
      }
    });
  });

  describe('regenerate (availability-change)', () => {
    it('regenerates plan with updated availability', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(120),
          tuesday: fullAvailability(120),
          wednesday: fullAvailability(120),
          thursday: fullAvailability(120),
          friday: fullAvailability(120),
          saturday: fullAvailability(120),
          sunday: fullAvailability(120),
        }),
      });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'availability-change',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.planningWindow.totalAvailableMinutes).toBeGreaterThan(
          plan.planningWindow.totalAvailableMinutes,
        );
      }
    });
  });

  describe('regenerate (rebalance)', () => {
    it('redistributes future tasks when rebalancing', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const completed = plan.tasks.slice(0, 2).map(t => ({
        ...t,
        status: 'completed' as const,
      }));

      const currentPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...completed,
          ...plan.tasks.slice(2).map(t => ({ ...t, status: t.status as StudyTask['status'] })),
        ],
      };

      const newProfile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(90),
          tuesday: fullAvailability(90),
          wednesday: fullAvailability(90),
          thursday: fullAvailability(90),
          friday: fullAvailability(90),
          saturday: fullAvailability(90),
          sunday: fullAvailability(90),
        }),
      });
      const result = regenerator.regenerate({
        currentPlan,
        newProfile,
        mode: 'rebalance',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.tasks.length).toBeGreaterThan(0);
      }
    });
  });

  describe('regenerate error handling', () => {
    it('returns non-success when engine generation fails', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const invalidProfile = createProfile({
        targetOverallBand: 9.0,
        planStartDate: '2099-01-01',
        examDate: '2099-01-02',
        weeklyAvailability: createWeeklyAvailability({
          monday: restDay(),
          tuesday: restDay(),
          wednesday: restDay(),
          thursday: restDay(),
          friday: restDay(),
          saturday: restDay(),
          sunday: restDay(),
        }),
      });

      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile: invalidProfile,
        mode: 'future-only',
      });

      expect(['failure', 'needs-profile-completion', 'requires-confirmation']).toContain(
        result.status,
      );
    });

    it('handles empty completed tasks gracefully', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ studyIntensity: 'light' });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'future-only',
      });

      expect(result.status).toBe('success');
    });
  });

  describe('adaptToMissedTasks', () => {
    it('reschedules a single missed high-priority task', () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(120),
          tuesday: fullAvailability(120),
          wednesday: fullAvailability(120),
          thursday: fullAvailability(120),
          friday: fullAvailability(120),
          saturday: fullAvailability(120),
          sunday: fullAvailability(120),
        }),
      });
      const plan = generateValidPlan(engine, profile);

      const targetTask = plan.tasks.find(t => t.priority === 'high' || t.priority === 'critical');
      if (!targetTask) return; // skip if no high-priority task

      const result = regenerator.adaptToMissedTasks({
        plan,
        missedTaskIds: [targetTask.id],
      });

      expect(result.resolutions.length).toBe(1);
      expect(result.resolutions[0].taskId).toBe(targetTask.id);
      expect(['rescheduled', 'split', 'dropped']).toContain(result.resolutions[0].action);
      expect(result.updatedPlan.tasks.length).toBeGreaterThanOrEqual(plan.tasks.length - 1);
    });

    it('handles multiple missed tasks', () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(120),
          tuesday: fullAvailability(120),
          wednesday: fullAvailability(120),
          thursday: fullAvailability(120),
          friday: fullAvailability(120),
          saturday: fullAvailability(120),
          sunday: fullAvailability(120),
        }),
      });
      const plan = generateValidPlan(engine, profile);

      const taskIds = plan.tasks.slice(0, 3).map(t => t.id);
      const result = regenerator.adaptToMissedTasks({
        plan,
        missedTaskIds: taskIds,
      });

      expect(result.resolutions.length).toBe(3);
      expect(result.updatedPlan.tasks.length).toBeGreaterThan(0);
    });

    it('drops non-existent task gracefully', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const result = regenerator.adaptToMissedTasks({
        plan,
        missedTaskIds: ['nonexistent-task-id'],
      });

      expect(result.resolutions.length).toBe(1);
      expect(result.resolutions[0].action).toBe('dropped');
    });

    it('drops multiple non-existent tasks gracefully', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const result = regenerator.adaptToMissedTasks({
        plan,
        missedTaskIds: ['nonexistent-task-a', 'nonexistent-task-b'],
      });

      expect(result.resolutions.length).toBe(2);
      expect(result.resolutions.every(r => r.action === 'dropped')).toBe(true);
    });

    it('preserves task count after rescheduling', () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(120),
          tuesday: fullAvailability(120),
          wednesday: fullAvailability(120),
          thursday: fullAvailability(120),
          friday: fullAvailability(120),
          saturday: fullAvailability(120),
          sunday: fullAvailability(120),
        }),
      });
      const plan = generateValidPlan(engine, profile);

      if (plan.tasks.length === 0) return;

      const result = regenerator.adaptToMissedTasks({
        plan,
        missedTaskIds: [plan.tasks[0].id],
      });

      expect(result.resolutions[0].action).toBeTruthy();
    });
  });

  describe('previewSettingsChange', () => {
    it('detects exam date change impact', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const completedPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map((t, i) =>
          i < 2 ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
        ),
      };
      const newProfile = createProfile({ examDate: '2026-08-12' });
      const impact = regenerator.previewSettingsChange({
        currentPlan: completedPlan,
        newProfile,
        updatedFields: ['examDate'],
      });

      expect(impact.changes.length).toBeGreaterThan(0);
      expect(impact.changes.some(c => c.includes('Exam date'))).toBe(true);
      expect(impact.preservedItems.some(i => i.includes('completed'))).toBe(true);
    });

    it('detects target band change', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ targetOverallBand: 7.5 });
      const impact = regenerator.previewSettingsChange({
        currentPlan: plan,
        newProfile,
        updatedFields: ['targetOverallBand'],
      });

      expect(impact.changes.some(c => c.includes('Target band'))).toBe(true);
    });

    it('detects skill band change', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({
        currentSkillBands: { listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6.0 },
      });
      const impact = regenerator.previewSettingsChange({
        currentPlan: plan,
        newProfile,
        updatedFields: ['currentSkillBands'],
      });

      expect(impact.changes.some(c => c.includes('Skill band'))).toBe(true);
      expect(impact.requiresConfirmation).toBe(true);
    });

    it('detects availability change', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(30),
          tuesday: fullAvailability(30),
          wednesday: fullAvailability(30),
          thursday: fullAvailability(30),
          friday: fullAvailability(30),
          saturday: fullAvailability(30),
          sunday: fullAvailability(30),
        }),
      });
      const impact = regenerator.previewSettingsChange({
        currentPlan: plan,
        newProfile,
        updatedFields: ['weeklyAvailability'],
      });

      expect(impact.changes.some(c => c.includes('Weekly availability'))).toBe(true);
    });

    it('detects current band change', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ currentOverallBand: 6.0 });
      const impact = regenerator.previewSettingsChange({
        currentPlan: plan,
        newProfile,
        updatedFields: ['currentOverallBand'],
      });

      expect(impact.changes.some(c => c.includes('Current overall band'))).toBe(true);
    });

    it('detects exam type change', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ examType: 'general-training' });
      const impact = regenerator.previewSettingsChange({
        currentPlan: plan,
        newProfile,
        updatedFields: ['examType'],
      });

      expect(impact.changes.some(c => c.includes('Exam type'))).toBe(true);
      expect(impact.requiresConfirmation).toBe(true);
    });

    it('detects plan start date change', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ planStartDate: '2026-08-01' });
      const impact = regenerator.previewSettingsChange({
        currentPlan: plan,
        newProfile,
        updatedFields: ['planStartDate'],
      });

      expect(impact.changes.some(c => c.includes('start date'))).toBe(true);
    });

    it('requires confirmation for significant changes', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({
        examDate: '2026-08-01',
        targetOverallBand: 7.5,
      });
      const impact = regenerator.previewSettingsChange({
        currentPlan: plan,
        newProfile,
        updatedFields: ['examDate', 'targetOverallBand'],
      });

      expect(impact.requiresConfirmation).toBe(true);
    });

    it('reports completed task count in preserved items', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const completed = plan.tasks.slice(0, 2).map(t => ({
        ...t,
        status: 'completed' as const,
      }));
      const currentPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...completed,
          ...plan.tasks.slice(2).map(t => ({ ...t, status: t.status as StudyTask['status'] })),
        ],
      };

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const impact = regenerator.previewSettingsChange({
        currentPlan,
        newProfile,
        updatedFields: ['studyIntensity'],
      });

      const completedPreserved = impact.preservedItems.some(i => i.includes('completed'));
      expect(completedPreserved).toBe(true);
    });
  });

  describe('determineRegenerationMode', () => {
    it('detects exam-date-change', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ examDate: '2026-11-01' });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('exam-date-change');
    });

    it('detects target-change', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ targetOverallBand: 7.5 });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('target-change');
    });

    it('detects availability-change', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(120),
        }),
      });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('availability-change');
    });

    it('detects settings-change for weak skills', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ weakSkills: ['writing'] });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('settings-change');
    });

    it('returns settings-change when no major field changed', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ studyIntensity: 'light' });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('settings-change');
    });

    it('prioritizes exam-date-change over other changes', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({
        examDate: '2026-11-01',
        targetOverallBand: 7.5,
      });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('exam-date-change');
    });

    it('returns settings-change for identical profiles', () => {
      const profile = createProfile();
      const mode = regenerator.determineRegenerationMode(profile, { ...profile });
      expect(mode).toBe('settings-change');
    });

    it('detects maximum sessions change as availability-change', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ maximumSessionsPerDay: 1 });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('availability-change');
    });
  });

  describe('edge cases', () => {
    it('handles plan with no completed tasks', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const result = regenerator.regenerate({
        currentPlan: plan,
        newProfile,
        mode: 'future-only',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.version).toBe(plan.version + 1);
      }
    });

    it('handles adaptToMissedTasks with empty missedTaskIds', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const result = regenerator.adaptToMissedTasks({
        plan,
        missedTaskIds: [],
      });

      expect(result.resolutions).toHaveLength(0);
      expect(result.updatedPlan.tasks.length).toBe(plan.tasks.length);
    });

    it('produces valid plan after regeneration', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const completed = plan.tasks.slice(0, 3).map(t => ({
        ...t,
        status: 'completed' as const,
      }));
      const currentPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...completed,
          ...plan.tasks.slice(3).map(t => ({ ...t, status: t.status as StudyTask['status'] })),
        ],
      };

      const newProfile = createProfile({ targetOverallBand: 7.5 });
      const result = regenerator.regenerate({
        currentPlan,
        newProfile,
        mode: 'target-change',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const validationIssues = engine.validatePlan(result.plan);
        const errors = validationIssues.filter(i => i.severity === 'error');
        expect(errors).toHaveLength(0);
      }
    });

    it('previewSettingsChange works with no completed tasks', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({ examDate: '2026-08-12' });
      const impact = regenerator.previewSettingsChange({
        currentPlan: plan,
        newProfile,
        updatedFields: ['examDate'],
      });

      expect(impact.changes.length).toBeGreaterThan(0);
      expect(impact.preservedItems).toBeDefined();
    });

    it('previewSettingsChange detects multiple changes at once', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const completedPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map((t, i) =>
          i < 2 ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
        ),
      };
      const newProfile = createProfile({
        examDate: '2026-08-12',
        targetOverallBand: 7.5,
        studyIntensity: 'intensive',
      });
      const impact = regenerator.previewSettingsChange({
        currentPlan: completedPlan,
        newProfile,
        updatedFields: ['examDate', 'targetOverallBand', 'studyIntensity'],
      });

      expect(impact.changes.length).toBeGreaterThanOrEqual(2);
      expect(impact.requiresConfirmation).toBe(true);
      expect(impact.preservedItems.some(i => i.includes('completed'))).toBe(true);
    });
  });

  describe('adaptToMissedTasks additional scenarios', () => {
    it('handles mixed existing and non-existing task IDs', () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(120),
          tuesday: fullAvailability(120),
          wednesday: fullAvailability(120),
          thursday: fullAvailability(120),
          friday: fullAvailability(120),
          saturday: fullAvailability(120),
          sunday: fullAvailability(120),
        }),
      });
      const plan = generateValidPlan(engine, profile);

      const existingId = plan.tasks[0].id;
      const result = regenerator.adaptToMissedTasks({
        plan,
        missedTaskIds: [existingId, 'nonexistent-one', 'nonexistent-two'],
      });

      expect(result.resolutions.length).toBe(3);
      const existingResolution = result.resolutions.find(r => r.taskId === existingId);
      expect(existingResolution).toBeDefined();
      expect(['rescheduled', 'split', 'dropped']).toContain(existingResolution!.action);
      const droppedResolutions = result.resolutions.filter(r => r.action === 'dropped');
      expect(droppedResolutions.length).toBeGreaterThanOrEqual(2);
    });

    it('preserves other tasks after adapting missed tasks', () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(120),
          tuesday: fullAvailability(120),
          wednesday: fullAvailability(120),
          thursday: fullAvailability(120),
          friday: fullAvailability(120),
          saturday: fullAvailability(120),
          sunday: fullAvailability(120),
        }),
      });
      const plan = generateValidPlan(engine, profile);

      const allIds = new Set(plan.tasks.map(t => t.id));
      const missedIds = plan.tasks.slice(0, 2).map(t => t.id);

      const result = regenerator.adaptToMissedTasks({
        plan,
        missedTaskIds: missedIds,
      });

      const preservedIds = result.updatedPlan.tasks.map(t => t.id);
      for (const id of allIds) {
        expect(preservedIds).toContain(id);
      }
    });
  });

  describe('determineRegenerationMode additional scenarios', () => {
    it('detects examType change', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ examType: 'general-training' });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('settings-change');
    });

    it('detects studyIntensity change', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('settings-change');
    });

    it('detects skill band changes', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({
        currentSkillBands: { listening: 7.0, reading: 6.5, writing: 5.5, speaking: 6.0 },
      });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('target-change');
    });

    it('detects maximumSessionMinutes change as availability-change', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ maximumSessionMinutes: 90 });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('availability-change');
    });

    it('detects planStartDate change', () => {
      const oldProfile = createProfile();
      const newProfile = createProfile({ planStartDate: '2026-08-01' });
      const mode = regenerator.determineRegenerationMode(oldProfile, newProfile);
      expect(mode).toBe('settings-change');
    });
  });

  describe('regenerate additional edge cases', () => {
    it('handles all-tasks-completed before regeneration', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const allCompleted: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map(t => ({
          ...t,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        })),
      };

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const result = regenerator.regenerate({
        currentPlan: allCompleted,
        newProfile,
        mode: 'future-only',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const completedPreserved = result.plan.tasks.filter(t => t.status === 'completed');
        expect(completedPreserved.length).toBe(allCompleted.tasks.length);
      }
    });

    it('preserves in-progress tasks with startedAt on future-only regeneration', () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const inProgress = plan.tasks.slice(0, 2).map(t => ({
        ...t,
        status: 'in-progress' as const,
        startedAt: new Date().toISOString(),
      }));
      const inProgressIds = new Set(inProgress.map(t => t.id));
      const currentPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...inProgress,
          ...plan.tasks.slice(2).map(t => ({ ...t, status: t.status as StudyTask['status'] })),
        ],
      };

      const newProfile = createProfile({ studyIntensity: 'intensive' });
      const result = regenerator.regenerate({
        currentPlan,
        newProfile,
        mode: 'future-only',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const preserved = result.plan.tasks.filter(t => inProgressIds.has(t.id));
        expect(preserved.length).toBeGreaterThanOrEqual(2);
        for (const task of preserved) {
          expect(task.status).toBe('in-progress');
        }
      }
    });
  });
});
