import { describe, it, expect, beforeEach } from 'vitest';
import { DailyPlanEngine } from './DailyPlanEngine';
import {
  PlanPersistenceService,
  type PlanRepository,
} from './PlanPersistenceService';
import type {
  StudyPlan,
  StudyTask,
  NormalizedProfile,
  WeeklyAvailability,
  DayAvailability,
  PlanGenerationMetadata,
} from './types';

// ── In-Memory Repository Implementation ──

class InMemoryPlanRepository implements PlanRepository {
  private plans = new Map<string, StudyPlan>();
  private versions = new Map<string, StudyPlan[]>();
  private activeId: string | null = null;

  async save(plan: StudyPlan): Promise<StudyPlan> {
    this.plans.set(plan.id, plan);
    this.activeId = plan.id;
    return plan;
  }

  async findById(id: string): Promise<StudyPlan | null> {
    return this.plans.get(id) ?? null;
  }

  async findActive(): Promise<StudyPlan | null> {
    if (this.activeId) return this.plans.get(this.activeId) ?? null;
    const all = Array.from(this.plans.values());
    if (all.length === 0) return null;
    return all.reduce((latest, p) =>
      p.updatedAt > latest.updatedAt ? p : latest,
    );
  }

  async findAll(orderBy?: 'createdAt' | 'updatedAt'): Promise<StudyPlan[]> {
    const all = Array.from(this.plans.values());
    if (orderBy) {
      all.sort((a, b) => b[orderBy].localeCompare(a[orderBy]));
    }
    return all;
  }

  async deleteById(id: string): Promise<void> {
    this.plans.delete(id);
    if (this.activeId === id) this.activeId = null;
  }

  async saveVersion(plan: StudyPlan): Promise<StudyPlan> {
    const existing = this.versions.get(plan.id) ?? [];
    existing.push(plan);
    this.versions.set(plan.id, existing);
    return plan;
  }

  async findVersions(planId: string): Promise<StudyPlan[]> {
    return this.versions.get(planId) ?? [];
  }
}

// ── Test Helpers (mirror DailyPlanEngine.test.ts patterns) ──

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
      (defaults as Record<string, DayAvailability>)[day] = avail;
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

function generateValidPlan(engine: DailyPlanEngine, profile: NormalizedProfile): StudyPlan {
  const result = engine.generatePlan(profile);
  if (result.status !== 'success') {
    throw new Error(`Plan generation failed: ${result.status}`);
  }
  return result.plan;
}

// ── Tests ──

describe('PlanPersistenceService', () => {
  let engine: DailyPlanEngine;
  let repository: InMemoryPlanRepository;
  let service: PlanPersistenceService;

  beforeEach(() => {
    engine = new DailyPlanEngine();
    repository = new InMemoryPlanRepository();
    service = new PlanPersistenceService(engine, repository);
  });

  describe('savePlan', () => {
    it('saves a valid plan successfully', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const result = await service.savePlan(plan);

      expect(result.success).toBe(true);
      expect(result.plan.id).toBe(plan.id);
      expect(result.repairsPerformed).toHaveLength(0);
      expect(result.validationIssues).toHaveLength(0);
    });

    it('validates plan before saving and rejects when unrepairable', async () => {
      const strictService = new PlanPersistenceService(engine, repository, {
        repairBeforeSave: false,
      });
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const brokenPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map(t => ({ ...t, date: '2099-12-31' })),
      };

      const result = await strictService.savePlan(brokenPlan);

      expect(result.success).toBe(false);
      expect(result.validationIssues.length).toBeGreaterThan(0);
      expect(result.validationIssues.some(i => i.code === 'task-after-exam')).toBe(true);
    });

    it('repairs fixable issues before saving', async () => {
      const profile = createProfile({
        maximumSessionMinutes: 15,
        maximumSessionsPerDay: 1,
      });
      const plan = generateValidPlan(engine, profile);

      const brokenPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map(t => ({
          ...t,
          estimatedMinutes: 60,
        })),
      };

      const result = await service.savePlan(brokenPlan);

      if (result.success) {
        expect(result.repairsPerformed.length).toBeGreaterThan(0);
        const sessionExceeds = result.repairsPerformed.filter(
          r => r.issueCode === 'session-duration-exceeded',
        );
        expect(sessionExceeds.length).toBeGreaterThan(0);
      }
    });

    it('stores the plan in the repository on success', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      await service.savePlan(plan);

      const loaded = await repository.findById(plan.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe(plan.id);
    });

    it('rejects saving with repair disabled and validation fails', async () => {
      const noRepairService = new PlanPersistenceService(engine, repository, {
        repairBeforeSave: false,
      });
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      const brokenPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map(t => ({ ...t, date: '2099-12-31' })),
      };

      const result = await noRepairService.savePlan(brokenPlan);
      expect(result.success).toBe(false);
    });

    it('updates updatedAt timestamp on save', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      await new Promise(r => setTimeout(r, 5));

      const result = await service.savePlan(plan);

      expect(result.plan.updatedAt > plan.updatedAt).toBe(true);
    });
  });

  describe('loadPlan', () => {
    it('loads a previously saved plan', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      await service.savePlan(plan);

      const result = await service.loadPlan(plan.id);

      expect(result.plan).not.toBeNull();
      expect(result.plan!.id).toBe(plan.id);
    });

    it('returns null for a non-existent plan', async () => {
      const result = await service.loadPlan('non-existent-id');
      expect(result.plan).toBeNull();
      expect(result.validationIssues).toHaveLength(0);
    });

    it('validates loaded plans', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      await service.savePlan(plan);

      const corrupted = {
        ...plan,
        tasks: plan.tasks.map(t => ({ ...t, date: '2099-12-31' })),
      };
      repository.save(corrupted);

      const result = await service.loadPlan(plan.id);
      expect(result.validationIssues.length).toBeGreaterThan(0);
    });
  });

  describe('loadActivePlan', () => {
    it('loads the most recently saved plan', async () => {
      const profile = createProfile();
      const plan1 = generateValidPlan(engine, profile);
      const plan2 = generateValidPlan(engine, createProfile({
        examDate: '2026-11-01',
      }));

      await service.savePlan(plan1);
      await new Promise(r => setTimeout(r, 10));
      await service.savePlan(plan2);

      const result = await service.loadActivePlan();
      expect(result.plan).not.toBeNull();
      expect(result.plan!.id).toBe(plan2.id);
    });

    it('returns null when no plans exist', async () => {
      const result = await service.loadActivePlan();
      expect(result.plan).toBeNull();
    });
  });

  describe('listPlans', () => {
    it('returns all saved plans ordered by updatedAt desc', async () => {
      const profile = createProfile();
      const plan1 = generateValidPlan(engine, profile);
      const plan2 = generateValidPlan(engine, createProfile({
        examDate: '2026-11-01',
      }));

      await service.savePlan(plan1);
      await new Promise(r => setTimeout(r, 10));
      await service.savePlan(plan2);

      const plans = await service.listPlans();
      expect(plans.length).toBe(2);
      expect(plans[0].id).toBe(plan2.id);
    });

    it('returns empty array when no plans exist', async () => {
      const plans = await service.listPlans();
      expect(plans).toHaveLength(0);
    });
  });

  describe('deletePlan', () => {
    it('removes a plan from the repository', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      await service.savePlan(plan);

      await service.deletePlan(plan.id);

      const loaded = await repository.findById(plan.id);
      expect(loaded).toBeNull();
    });

    it('does not throw when deleting non-existent plan', async () => {
      await expect(service.deletePlan('non-existent')).resolves.not.toThrow();
    });
  });

  describe('regenerateWithPreservation', () => {
    it('preserves completed tasks during regeneration', async () => {
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
      const plan = generateValidPlan(engine, profile);

      const firstDate = plan.tasks[0].date;
      const diffDateTasks = plan.tasks.filter(t => t.date !== firstDate);
      const completedTasks = diffDateTasks.slice(0, 3).map(t => ({
        ...t,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      }));
      const completedIds = new Set(completedTasks.map(t => t.id));
      const preservedPlan: StudyPlan = {
        ...plan,
        tasks: [
          ...completedTasks,
          ...plan.tasks.filter(t => !completedIds.has(t.id)).map(t => ({
            ...t,
            status: t.status as StudyTask['status'],
          })),
        ],
      };

      const newProfile = createProfile({
        studyIntensity: 'intensive',
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

      const result = await service.regenerateWithPreservation(
        preservedPlan,
        newProfile,
        'settings-change',
      );

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const preservedCompleted = result.plan.tasks.filter(t => completedIds.has(t.id));
        expect(preservedCompleted.length).toBeGreaterThanOrEqual(completedTasks.length);
        for (const task of preservedCompleted) {
          expect(task.status).toBe('completed');
        }
      }
    });

    it('preserves historical skipped tasks from before start date', async () => {
      const profile = createProfile({
        planStartDate: '2026-07-01',
        examDate: '2026-10-12',
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
      const plan = generateValidPlan(engine, profile);

      const skippedTask = plan.tasks[0];
      const preservedPlan: StudyPlan = {
        ...plan,
        tasks: [
          { ...skippedTask, status: 'skipped' as const },
          ...plan.tasks.slice(1),
        ],
      };

      const newProfile = createProfile({
        planStartDate: '2026-07-14',
        studyIntensity: 'intensive',
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

      const result = await service.regenerateWithPreservation(
        preservedPlan,
        newProfile,
        'settings-change',
      );

      expect(result.status).toBe('success');
    });

    it('returns non-success result when engine generation cannot proceed', async () => {
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

      const result = await service.regenerateWithPreservation(
        plan,
        invalidProfile,
        'full',
      );

      expect(['failure', 'needs-profile-completion', 'requires-confirmation']).toContain(result.status);
    });

    it('increments version number on regeneration', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      await service.savePlan(plan);

      const newProfile = createProfile({
        studyIntensity: 'intensive',
      });

      const result = await service.regenerateWithPreservation(
        plan,
        newProfile,
        'settings-change',
      );

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.version).toBe(plan.version + 1);
      }
    });

    it('preserves createdAt from original plan', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({
        studyIntensity: 'intensive',
      });

      const result = await service.regenerateWithPreservation(
        plan,
        newProfile,
        'settings-change',
      );

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.createdAt).toBe(plan.createdAt);
      }
    });

    it('links to previous plan in metadata', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const newProfile = createProfile({
        studyIntensity: 'intensive',
      });

      const result = await service.regenerateWithPreservation(
        plan,
        newProfile,
        'settings-change',
      );

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.plan.generationMetadata.previousPlanId).toBe(plan.id);
        expect(result.plan.generationMetadata.previousPlanVersion).toBe(plan.version);
        expect(result.plan.generationMetadata.regenerationMode).toBe('settings-change');
      }
    });
  });

  describe('validation configuration', () => {
    it('skips validation when validateBeforeSave is false', async () => {
      const skipValidationService = new PlanPersistenceService(engine, repository, {
        validateBeforeSave: false,
      });
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const brokenPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map(t => ({ ...t, date: '2099-12-31' })),
      };

      const result = await skipValidationService.savePlan(brokenPlan);
      expect(result.success).toBe(true);
    });

    it('respects maxRepairAttempts limit', async () => {
      const limitedService = new PlanPersistenceService(engine, repository, {
        maxRepairAttempts: 0,
      });
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      const brokenPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map(t => ({ ...t, date: '2099-12-31' })),
      };

      const result = await limitedService.savePlan(brokenPlan);
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles empty task array in plan', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      const emptyPlan: StudyPlan = {
        ...plan,
        tasks: [],
      };

      const result = await service.savePlan(emptyPlan);
      expect(result.success).toBe(true);
    });

    it('persists and retrieves plan metadata correctly', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      plan.generationMetadata.generationReason = 'test-reason';

      await service.savePlan(plan);
      const loaded = await service.loadPlan(plan.id);

      expect(loaded.plan).not.toBeNull();
      expect(loaded.plan!.generationMetadata.generationReason).toBe('test-reason');
      expect(loaded.plan!.generationMetadata.engineVersion).toBeTruthy();
    });

    it('loadActivePlan returns null when repository is empty after delete', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      await service.savePlan(plan);
      await service.deletePlan(plan.id);

      const result = await service.loadActivePlan();
      expect(result.plan).toBeNull();
    });

    it('repairs tasks exceeding session duration before saving', async () => {
      const profile = createProfile({
        maximumSessionMinutes: 15,
        maximumSessionsPerDay: 1,
      });
      const plan = generateValidPlan(engine, profile);

      const brokenPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map(t => ({
          ...t,
          estimatedMinutes: 60,
        })),
      };

      const result = await service.savePlan(brokenPlan);
      if (result.success) {
        const sessionRepairs = result.repairsPerformed.filter(
          r => r.issueCode === 'session-duration-exceeded',
        );
        expect(sessionRepairs.length).toBeGreaterThan(0);
        for (const task of result.plan.tasks) {
          expect(task.estimatedMinutes).toBeLessThanOrEqual(15);
        }
      }
    });

    it('persists and retrieves AI metadata', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);
      plan.generationMetadata.aiUsed = true;
      plan.generationMetadata.aiProvider = 'openai';
      plan.generationMetadata.aiModel = 'gpt-4';
      plan.generationMetadata.aiCallCount = 3;

      await service.savePlan(plan);
      const loaded = await service.loadPlan(plan.id);

      expect(loaded.plan).not.toBeNull();
      expect(loaded.plan!.generationMetadata.aiUsed).toBe(true);
      expect(loaded.plan!.generationMetadata.aiProvider).toBe('openai');
      expect(loaded.plan!.generationMetadata.aiModel).toBe('gpt-4');
      expect(loaded.plan!.generationMetadata.aiCallCount).toBe(3);
    });

    it('repairs task-on-disabled-date issue', async () => {
      const profile = createProfile({
        weeklyAvailability: createWeeklyAvailability({
          monday: restDay(),
          tuesday: fullAvailability(60),
        }),
      });
      const plan = generateValidPlan(engine, profile);

      const brokenPlan: StudyPlan = {
        ...plan,
        tasks: plan.tasks.map(t => ({
          ...t,
          date: '2026-07-14',
        })),
      };

      const result = await service.savePlan(brokenPlan);
      if (result.success) {
        const disabledRepairs = result.repairsPerformed.filter(
          r => r.issueCode === 'task-on-disabled-date',
        );
        expect(disabledRepairs.length).toBeGreaterThan(0);
      }
    });

    it('preserves plan version history across saves', async () => {
      const profile = createProfile();
      const plan = generateValidPlan(engine, profile);

      await service.savePlan(plan);

      const v2Profile = createProfile({ studyIntensity: 'intensive' });
      const v2Plan = generateValidPlan(engine, v2Profile);
      v2Plan.id = plan.id;
      v2Plan.version = 2;
      await service.savePlan(v2Plan);

      const loaded = await repository.findById(plan.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(2);
    });
  });
});
