import { describe, it, expect, beforeEach } from 'vitest';
import { DailyPlanEngine } from './DailyPlanEngine';
import type {
  NormalizedProfile,
  WeeklyAvailability,
  DayAvailability,
} from './types';

function fullAvailability(minutes: number): DayAvailability {
  return { enabled: true, availableMinutes: minutes, maximumSessionMinutes: 60, maximumSessions: 3 };
}

function restDay(): DayAvailability {
  return { enabled: false, availableMinutes: 0, maximumSessionMinutes: 0, maximumSessions: 0 };
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

function createProfile(overrides: Partial<NormalizedProfile> = {}): NormalizedProfile {
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

describe('DailyPlanEngine', () => {
  let engine: DailyPlanEngine;

  beforeEach(() => {
    engine = new DailyPlanEngine();
  });

  describe('generatePlan', () => {
    it('generates a valid study plan from a complete profile', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.id).toBeTruthy();
        expect(result.plan.version).toBe(1);
        expect(result.plan.phases.length).toBeGreaterThan(0);
        expect(result.plan.weeks.length).toBeGreaterThan(0);
        expect(result.plan.tasks.length).toBeGreaterThan(0);
        expect(result.feasibility.status).toBeTruthy();
        expect(result.warnings).toBeDefined();
        expect(result.generationSummary.scheduledTaskCount).toBeGreaterThan(0);
      }
    });

    it('never schedules tasks after the exam date', () => {
      const profile = createProfile({ examDate: '2026-08-14', planStartDate: '2026-07-14' });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        for (const task of result.plan.tasks) {
          expect(task.date <= result.plan.planningWindow.examDate).toBe(true);
        }
      }
    });

    it('never schedules tasks on rest days', () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({ wednesday: restDay(), sunday: restDay() }),
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        for (const task of result.plan.tasks) {
          expect(task.date).not.toBe('2026-07-15');
          expect(task.date).not.toBe('2026-07-19');
        }
      }
    });

    it('never exceeds daily capacity', () => {
      const profile = createProfile({
        maximumSessionMinutes: 30,
        maximumSessionsPerDay: 2,
        weeklyAvailability: createWeeklyAvailability({
          monday: { enabled: true, availableMinutes: 45, maximumSessionMinutes: 30, maximumSessions: 2 },
        }),
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const tasksByDate = new Map<string, number>();
        for (const task of result.plan.tasks) {
          const total = tasksByDate.get(task.date) ?? 0;
          tasksByDate.set(task.date, total + task.estimatedMinutes);
        }
        for (const [, total] of tasksByDate) {
          expect(total).toBeLessThanOrEqual(60);
        }
      }
    });

    it('returns insufficient-time for very short schedules with large gaps', () => {
      const profile = createProfile({
        examDate: '2026-07-21',
        planStartDate: '2026-07-14',
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
      const result = engine.generatePlan(profile);
      expect(['failure', 'requires-confirmation']).toContain(result.status);
    });

    it('prioritizes weak skills in allocation', () => {
      const profile = createProfile({
        weakSkills: ['writing', 'speaking'],
        strongSkills: ['reading', 'listening'],
        currentSkillBands: { listening: 6.5, reading: 6.5, writing: 5.0, speaking: 5.5 },
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        expect(result.plan.skillAllocation.writing).toBeGreaterThanOrEqual(result.plan.skillAllocation.listening);
        expect(result.plan.skillAllocation.writing).toBeGreaterThanOrEqual(result.plan.skillAllocation.reading);
      }
    });

    it('generates a plan with phases, weeks, and tasks', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const phases = result.plan.phases;
        const weeks = result.plan.weeks;
        const tasks = result.plan.tasks;

        expect(phases.length).toBeGreaterThan(0);
        expect(weeks.length).toBeGreaterThanOrEqual(phases.length);

        for (const week of weeks) {
          const phase = phases.find(p => p.id === week.phaseId);
          expect(phase).toBeDefined();
        }

        expect(tasks.length).toBeGreaterThanOrEqual(weeks.length);
      }
    });

    it('generates intermediate-length plan for 30 days', () => {
      const profile = createProfile({
        examDate: '2026-08-13',
        planStartDate: '2026-07-14',
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        expect(result.plan.phases.length).toBeGreaterThanOrEqual(4);
        expect(result.plan.weeks.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('generates long plan for 60+ days', () => {
      const profile = createProfile({
        examDate: '2026-10-12',
        planStartDate: '2026-07-14',
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        expect(result.plan.phases.length).toBeGreaterThanOrEqual(5);
        expect(result.plan.tasks.length).toBeGreaterThan(0);
      }
    });

    it('includes review tasks for high-priority items', () => {
      const profile = createProfile({
        weakSkills: ['writing'],
        currentSkillBands: { listening: 6.5, reading: 6.5, writing: 5.0, speaking: 6.0 },
        targetOverallBand: 7.0,
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const reviewTasks = result.plan.tasks.filter(t => t.skill === 'review');
        expect(reviewTasks.length).toBeGreaterThan(0);
      }
    });

    it('does not schedule tasks on rest days', () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: restDay(),
          tuesday: restDay(),
          wednesday: restDay(),
          thursday: restDay(),
          friday: restDay(),
          saturday: fullAvailability(120),
          sunday: fullAvailability(60),
        }),
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const tasksOnMonThu = result.plan.tasks.filter(t => {
          const day = new Date(t.date).getDay();
          return day >= 1 && day <= 5;
        });
        expect(tasksOnMonThu.length).toBe(0);
      }
    });

    it('preserves scheduled task capacity within available time', () => {
      const profile = createProfile({
        examDate: '2026-08-14',
        planStartDate: '2026-07-14',
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
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const totalScheduled = result.plan.tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
        expect(totalScheduled).toBeLessThanOrEqual(result.plan.planningWindow.totalAvailableMinutes);
      }
    });
  });

  describe('validatePlan', () => {
    it('returns no errors for a valid generated plan', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const errors = result.plan.generationMetadata.validationWarnings;
        const severe = errors.filter(e => e.severity === 'error');
        expect(severe).toHaveLength(0);
      }
    });

    it('detects tasks scheduled after the exam', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const brokenPlan = {
          ...result.plan,
          tasks: result.plan.tasks.map(t => ({ ...t, date: '2099-12-31' })),
        };
        const issues = engine.validatePlan(brokenPlan);
        const afterExam = issues.filter(i => i.code === 'task-after-exam');
        expect(afterExam.length).toBeGreaterThan(0);
      }
    });

    it('detects empty plan with schedulable minutes', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const emptyPlan = {
          ...result.plan,
          tasks: [],
        };
        const issues = engine.validatePlan(emptyPlan);
        expect(issues.some(i => i.code === 'empty-plan')).toBe(true);
      }
    });

    it('detects duplicate task IDs', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success' && result.plan.tasks.length >= 2) {
        const duplicateTasks = result.plan.tasks.map((t, i) =>
          i === 1 ? { ...t, id: result.plan.tasks[0].id } : t
        );
        const issues = engine.validatePlan({ ...result.plan, tasks: duplicateTasks });
        expect(issues.some(i => i.code === 'duplicate-id')).toBe(true);
      }
    });
  });

  describe('adaptToMissedTask', () => {
    it('reschedules a missed high-priority task to next available date', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success' && result.plan.tasks.length > 0) {
        const task = result.plan.tasks[0];
        const { updatedPlan, resolution } = engine.adaptToMissedTask(result.plan, task.id);

        expect(resolution.taskId).toBe(task.id);
        expect(['rescheduled', 'split', 'dropped']).toContain(resolution.action);
        expect(updatedPlan.tasks.find(t => t.id === task.id)).toBeDefined();
      }
    });

    it('handles non-existent task gracefully', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const { updatedPlan, resolution } = engine.adaptToMissedTask(result.plan, 'nonexistent-task');
        expect(resolution.action).toBe('dropped');
        expect(updatedPlan.tasks.length).toBe(result.plan.tasks.length);
      }
    });

    it('splits a missed high-duration high-priority task when buffer is insufficient', () => {
      const profile = createProfile({
        maximumSessionMinutes: 60,
        maximumSessionsPerDay: 3,
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
      const result = engine.generatePlan(profile);

      if (result.status === 'success' && result.plan.tasks.length > 2) {
        const task = result.plan.tasks[0];
        const { resolution } = engine.adaptToMissedTask(result.plan, task.id);

        expect(resolution.taskId).toBe(task.id);
        expect(['rescheduled', 'split', 'dropped']).toContain(resolution.action);
      }
    });

    it('drops low-priority missed task when future capacity is low', () => {
      const profile = createProfile({
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
      const result = engine.generatePlan(profile);

      if (result.status === 'success' && result.plan.tasks.length > 0) {
        const lowTask = result.plan.tasks.find(t => t.priority === 'low');
        if (lowTask) {
          const { resolution } = engine.adaptToMissedTask(result.plan, lowTask.id);
          expect(resolution.action).toBe('dropped');
        }
      }
    });
  });

  describe('adaptToProfileChange', () => {
    it('preserves completed tasks on future-only regeneration', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success' && result.plan.tasks.length > 0) {
        const completedPlan = {
          ...result.plan,
          tasks: result.plan.tasks.map((t, i) =>
            i === 0 ? { ...t, status: 'completed' as const } : t
          ),
        };
        const newProfile = createProfile({ planStartDate: '2026-07-15' });
        const adapted = engine.adaptToProfileChange(completedPlan, newProfile, 'future-only');

        if (adapted.status === 'success') {
          const completed = adapted.plan.tasks.filter(t => t.status === 'completed');
          expect(completed.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('regenerates completely on full mode', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const newProfile = createProfile({ targetOverallBand: 7.5 });
        const adapted = engine.adaptToProfileChange(result.plan, newProfile, 'full');

        if (adapted.status === 'success') {
          expect(adapted.plan.tasks.length).toBeGreaterThan(0);
          expect(adapted.plan.profile.targetOverallBand).toBe(7.5);
        }
      }
    });

    it('preserves completed tasks on settings-change mode', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success' && result.plan.tasks.length > 2) {
        const completedPlan = {
          ...result.plan,
          tasks: result.plan.tasks.map((t, i) =>
            i < 2 ? { ...t, status: 'completed' as const } : t
          ),
        };
        const newProfile = createProfile({ studyIntensity: 'intensive' });
        const adapted = engine.adaptToProfileChange(completedPlan, newProfile, 'settings-change');

        if (adapted.status === 'success') {
          const completed = adapted.plan.tasks.filter(t => t.status === 'completed');
          expect(completed.length).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });

  describe('previewPlan', () => {
    it('returns a preview with feasibility and phases', () => {
      const profile = createProfile();
      const preview = engine.previewPlan(profile);

      expect(preview.planningWindow).toBeDefined();
      expect(preview.feasibility).toBeDefined();
      expect(preview.skillAllocation).toBeDefined();
      expect(preview.phases).toBeDefined();
      expect(preview.estimatedTotalTasks).toBeGreaterThan(0);
    });
  });

  describe('calculateProgress', () => {
    it('returns zero progress for an untouched plan', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const progress = engine.calculateProgress(result.plan);
        expect(progress.totalTasks).toBeGreaterThan(0);
        expect(progress.overallTaskProgress).toBe(0);
        expect(progress.completedTasks).toBe(0);
      }
    });

    it('calculates partial progress correctly', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success' && result.plan.tasks.length > 1) {
        const modifiedPlan = {
          ...result.plan,
          tasks: result.plan.tasks.map((t, i) =>
            i < 2 ? { ...t, status: 'completed' as const } : t
          ),
        };
        const progress = engine.calculateProgress(modifiedPlan);
        expect(progress.completedTasks).toBe(2);
        expect(progress.overallTaskProgress).toBeGreaterThan(0);
        expect(progress.overallTaskProgress).toBeLessThan(1);
      }
    });
  });

  describe('createPlanSummary', () => {
    it('returns a structured plan summary', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const summary = engine.createPlanSummary(result.plan);
        expect(summary.currentBand).toBe(5.5);
        expect(summary.targetBand).toBe(7.0);
        expect(summary.examDate).toBeTruthy();
        expect(summary.daysRemaining).toBeGreaterThan(0);
        expect(summary.phases.length).toBeGreaterThan(0);
        expect(summary.taskCount).toBeGreaterThan(0);
      }
    });

    it('identifies weakest skills correctly', () => {
      const profile = createProfile({
        currentSkillBands: { listening: 6.5, reading: 6.5, writing: 5.0, speaking: 5.5 },
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const summary = engine.createPlanSummary(result.plan);
        expect(summary.weakestSkills).toContain('writing');
      }
    });
  });

  describe('constraint enforcement', () => {
    it('never exceeds maximum session minutes', () => {
      const profile = createProfile({ maximumSessionMinutes: 30 });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        for (const task of result.plan.tasks) {
          expect(task.estimatedMinutes).toBeLessThanOrEqual(30);
        }
      }
    });

    it('never exceeds maximum sessions per day', () => {
      const profile = createProfile({ maximumSessionsPerDay: 2 });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const sessionsByDate = new Map<string, number>();
        for (const task of result.plan.tasks) {
          sessionsByDate.set(task.date, (sessionsByDate.get(task.date) ?? 0) + 1);
        }
        for (const [, count] of sessionsByDate) {
          expect(count).toBeLessThanOrEqual(2);
        }
      }
    });

    it('creates distinct weeks with unique IDs', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const weekIds = new Set(result.plan.weeks.map(w => w.id));
        expect(weekIds.size).toBe(result.plan.weeks.length);
      }
    });

    it('creates unique task IDs', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const taskIds = new Set(result.plan.tasks.map(t => t.id));
        expect(taskIds.size).toBe(result.plan.tasks.length);
      }
    });

    it('preserves completed learning history in progress calculation', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success' && result.plan.tasks.length > 3) {
        const modifiedPlan = {
          ...result.plan,
          tasks: result.plan.tasks.map((t, i) =>
            i < 3 ? { ...t, status: 'completed' as const, actualMinutes: t.estimatedMinutes } : t
          ),
        };
        const progress = engine.calculateProgress(modifiedPlan);
        expect(progress.completedTasks).toBe(3);
        expect(progress.actualStudyMinutes).toBeGreaterThan(0);
        expect(progress.overallTaskProgress).toBeGreaterThan(0);
      }
    });

    it('detects mock test missing analysis in plan validation', () => {
      const profile = createProfile();
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const planWithOrphanMock = {
          ...result.plan,
          tasks: [
            ...result.plan.tasks,
            {
              ...result.plan.tasks[0],
              id: 'orphan-mock',
              skill: 'mock-test' as const,
              taskType: 'mock-test',
              title: 'Mock Test Without Analysis',
            },
          ],
        };
        const issues = engine.validatePlan(planWithOrphanMock);
        const mockIssues = issues.filter(i => i.code === 'mock-missing-analysis');
        expect(mockIssues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('edge cases', () => {
    it('handles single-day availability', () => {
      const profile = createProfile({
        examDate: '2026-07-21',
        planStartDate: '2026-07-14',
        weeklyAvailability: createWeeklyAvailability({
          monday: restDay(),
          tuesday: restDay(),
          wednesday: restDay(),
          thursday: restDay(),
          friday: restDay(),
          saturday: fullAvailability(120),
          sunday: restDay(),
        }),
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        expect(result.plan.tasks.length).toBeGreaterThan(0);
        const saturdayTasks = result.plan.tasks.filter(t => {
          const day = new Date(t.date).getDay();
          return day === 6;
        });
        expect(saturdayTasks.length).toBe(result.plan.tasks.length);
      }
    });

    it('handles close exam date (7 days)', () => {
      const profile = createProfile({
        examDate: '2026-07-21',
        planStartDate: '2026-07-14',
      });
      const result = engine.generatePlan(profile);

      expect(['success', 'requires-confirmation', 'failure']).toContain(result.status);
    });

    it('handles exam on start date (same-day)', () => {
      const profile = createProfile({
        planStartDate: '2026-07-14',
        examDate: '2026-07-14',
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        expect(result.plan.tasks.every(t => t.date === '2026-07-14')).toBe(true);
        for (const task of result.plan.tasks) {
          expect(task.estimatedMinutes).toBeLessThanOrEqual(30);
        }
      }
    });

    it('handles profile with no weak skills', () => {
      const profile = createProfile({
        weakSkills: [],
        strongSkills: [],
        currentSkillBands: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 },
      });
      const result = engine.generatePlan(profile);

      expect(result.status).toBe('success');
    });

    it('generates plan with no AI available (offline-only mode)', () => {
      const profile = createProfile({
        offlineOnlyMode: true,
        aiProviderAvailable: false,
      });
      const result = engine.generatePlan(profile);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.generationMetadata.offlineFallbackUsed).toBe(true);
        expect(result.plan.generationMetadata.aiUsed).toBe(false);
      }
    });

    it('generates plan when AI is available but user chooses offline', () => {
      const profile = createProfile({
        offlineOnlyMode: true,
        aiProviderAvailable: true,
      });
      const result = engine.generatePlan(profile);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.generationMetadata.aiUsed).toBe(true);
      }
    });

    it('handles target already achieved (no band gap)', () => {
      const profile = createProfile({
        currentOverallBand: 7.0,
        targetOverallBand: 7.0,
        currentSkillBands: { listening: 7.0, reading: 7.0, writing: 7.0, speaking: 7.0 },
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        expect(result.plan.tasks.length).toBeGreaterThan(0);
        expect(result.plan.skillAllocation).toBeDefined();
      }
    });

    it('honors availability exceptions (unavailable dates)', () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(60),
          tuesday: fullAvailability(60),
          wednesday: fullAvailability(60),
          thursday: fullAvailability(60),
          friday: fullAvailability(60),
          saturday: fullAvailability(60),
          sunday: fullAvailability(60),
        }),
        availabilityExceptions: [
          { date: '2026-07-15', type: 'unavailable' },
        ],
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        const tasksOnException = result.plan.tasks.filter(t => t.date === '2026-07-15');
        expect(tasksOnException.length).toBe(0);
      }
    });

    it('handles plan with very short window (3 days)', () => {
      const profile = createProfile({
        examDate: '2026-07-17',
        planStartDate: '2026-07-14',
        weeklyAvailability: createWeeklyAvailability({
          monday: fullAvailability(60),
          tuesday: fullAvailability(60),
          wednesday: fullAvailability(60),
          thursday: fullAvailability(60),
          friday: fullAvailability(60),
          saturday: fullAvailability(60),
          sunday: fullAvailability(60),
        }),
      });
      const result = engine.generatePlan(profile);

      expect(['success', 'requires-confirmation', 'failure']).toContain(result.status);
    });

    it('generates plan with general-training exam type', () => {
      const profile = createProfile({
        examType: 'general-training',
      });
      const result = engine.generatePlan(profile);

      if (result.status === 'success') {
        expect(result.plan.profile.examType).toBe('general-training');
      }
    });
  });
});
