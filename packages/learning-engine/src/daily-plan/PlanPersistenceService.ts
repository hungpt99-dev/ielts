import type { DailyPlanEngine } from './DailyPlanEngine';
import type {
  StudyPlan,
  PlanValidationIssue,
  RegenerationMode,
  NormalizedProfile,
  GenerateStudyPlanResult,
  PlanRepairAction,
  LocalDate,
} from './types';

// ── Repository Interface ──
// Abstracts storage for local-first IndexedDB/Dexie or in-memory (tests).

export interface PlanRepository {
  save(plan: StudyPlan): Promise<StudyPlan>;
  findById(id: string): Promise<StudyPlan | null>;
  findActive(): Promise<StudyPlan | null>;
  findAll(orderBy?: 'createdAt' | 'updatedAt'): Promise<StudyPlan[]>;
  deleteById(id: string): Promise<void>;
  saveVersion(plan: StudyPlan): Promise<StudyPlan>;
  findVersions(planId: string): Promise<StudyPlan[]>;
}

// ── Configuration ──

export interface PlanPersistenceServiceConfig {
  validateBeforeSave?: boolean;
  repairBeforeSave?: boolean;
  maxRepairAttempts?: number;
}

const DEFAULT_CONFIG: Required<PlanPersistenceServiceConfig> = {
  validateBeforeSave: true,
  repairBeforeSave: true,
  maxRepairAttempts: 3,
};

// ── Result Types ──

export interface PersistPlanResult {
  success: boolean;
  plan: StudyPlan;
  validationIssues: PlanValidationIssue[];
  repairsPerformed: PlanRepairAction[];
}

export interface LoadPlanResult {
  plan: StudyPlan | null;
  validationIssues: PlanValidationIssue[];
}

// ── Allowed durations (mirrors engine constant) ──

const ALLOWED_DURATIONS = [10, 15, 20, 30, 45, 60, 90] as const;

// ── Service ──

export class PlanPersistenceService {
  private readonly engine: DailyPlanEngine;
  private readonly repository: PlanRepository;
  private readonly config: Required<PlanPersistenceServiceConfig>;

  constructor(
    engine: DailyPlanEngine,
    repository: PlanRepository,
    config: PlanPersistenceServiceConfig = {},
  ) {
    this.engine = engine;
    this.repository = repository;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async savePlan(plan: StudyPlan): Promise<PersistPlanResult> {
    let target = this.clonePlan(plan);
    const repairs: PlanRepairAction[] = [];

    if (this.config.validateBeforeSave) {
      let issues = this.engine.validatePlan(target);

      if (issues.some(i => i.severity === 'error')) {
        if (this.config.repairBeforeSave) {
          for (let attempt = 0; attempt < this.config.maxRepairAttempts; attempt++) {
            const errors = issues.filter(i => i.severity === 'error');
            if (errors.length === 0) break;

            for (const issue of errors) {
              const repaired = this.applyRepair(target, issue);
              if (repaired) {
                target = repaired;
                repairs.push({
                  issueCode: issue.code,
                  action: 'auto-repair',
                  targetId: issue.path ?? '',
                  description: issue.message,
                });
              }
            }
          }
          issues = this.engine.validatePlan(target);
        }

        if (issues.some(i => i.severity === 'error')) {
          return {
            success: false,
            plan: target,
            validationIssues: issues,
            repairsPerformed: repairs,
          };
        }
      }

      target = {
        ...target,
        generationMetadata: {
          ...target.generationMetadata,
          validationWarnings: issues.filter(i => i.severity === 'warning'),
        },
      };
    }

    target = { ...target, updatedAt: new Date().toISOString() };
    const saved = await this.repository.save(target);

    return {
      success: true,
      plan: saved,
      validationIssues: [],
      repairsPerformed: repairs,
    };
  }

  async loadPlan(id: string): Promise<LoadPlanResult> {
    const plan = await this.repository.findById(id);
    if (!plan) {
      return { plan: null, validationIssues: [] };
    }
    const issues = this.config.validateBeforeSave
      ? this.engine.validatePlan(plan)
      : [];
    return { plan, validationIssues: issues };
  }

  async loadActivePlan(): Promise<LoadPlanResult> {
    const plan = await this.repository.findActive();
    if (!plan) {
      return { plan: null, validationIssues: [] };
    }
    const issues = this.config.validateBeforeSave
      ? this.engine.validatePlan(plan)
      : [];
    return { plan, validationIssues: issues };
  }

  async listPlans(): Promise<StudyPlan[]> {
    return this.repository.findAll('updatedAt');
  }

  async deletePlan(id: string): Promise<void> {
    await this.repository.deleteById(id);
  }

  async regenerateWithPreservation(
    currentPlan: StudyPlan,
    newProfile: NormalizedProfile,
    mode: RegenerationMode,
  ): Promise<GenerateStudyPlanResult> {
    const generationResult = this.engine.generatePlan(newProfile);

    if (generationResult.status !== 'success') {
      return generationResult;
    }

    const newPlan = this.overlayCompletedTasks(currentPlan, generationResult.plan, mode);

    const issues = this.engine.validatePlan(newPlan);
    if (issues.some(i => i.severity === 'error')) {
      return {
        status: 'failure',
        reason: {
          code: 'validation-failed',
          message: 'Regenerated plan failed validation',
          recoverable: true,
          suggestedAction: 'Review profile settings and retry',
        },
        validationIssues: issues,
        suggestions: [],
      };
    }

    newPlan.generationMetadata.validationWarnings = issues.filter(i => i.severity === 'warning');

    const saved = await this.repository.save(newPlan);

    return {
      status: 'success',
      plan: saved,
      feasibility: generationResult.feasibility,
      warnings: generationResult.warnings,
      generationSummary: {
        ...generationResult.generationSummary,
        repairsPerformed: [],
      },
    };
  }

  // ── Private Helpers ──

  private overlayCompletedTasks(
    currentPlan: StudyPlan,
    newPlan: StudyPlan,
    mode: RegenerationMode,
  ): StudyPlan {
    const completedTasks = currentPlan.tasks.filter(t => t.status === 'completed');

    if (completedTasks.length === 0) {
      return {
        ...newPlan,
        generationMetadata: {
          ...newPlan.generationMetadata,
          previousPlanId: currentPlan.id,
          previousPlanVersion: currentPlan.version,
          regenerationMode: mode,
          generationReason: `regeneration-${mode}`,
        },
        version: currentPlan.version + 1,
        createdAt: currentPlan.createdAt,
        updatedAt: new Date().toISOString(),
      };
    }

    const completedIds = new Set(completedTasks.map(t => t.id));
    const completedDateCapacity = new Map<string, number>();

    for (const task of completedTasks) {
      const existing = completedDateCapacity.get(task.date) ?? 0;
      completedDateCapacity.set(task.date, existing + task.estimatedMinutes);
    }

    const newPlanTaskIds = new Set(newPlan.tasks.map(t => t.id));

    const filteredNewTasks = newPlan.tasks.filter(t => {
      if (completedIds.has(t.id)) return false;
      const completedOnDate = completedDateCapacity.get(t.date) ?? 0;
      if (completedOnDate === 0) return true;

      const cap = this.findCapacityForDate(newPlan, t.date);
      if (!cap) return true;

      const dateTasks = newPlan.tasks.filter(nt => nt.date === t.date && !completedIds.has(nt.id));
      const nonCompletedCount = dateTasks.filter(nt => newPlanTaskIds.has(nt.id)).length;
      const totalNonCompletedMin = dateTasks
        .filter(nt => newPlanTaskIds.has(nt.id))
        .reduce((s, nt) => s + nt.estimatedMinutes, 0);

      const availableAfterCompleted = cap.availableMinutes - completedOnDate;
      return totalNonCompletedMin <= availableAfterCompleted && nonCompletedCount <= cap.maxSessions;
    });

    const filteredIds = new Set(filteredNewTasks.map(t => t.id));
    const skippedBeforeStart = currentPlan.tasks.filter(
      t => t.status === 'skipped' && t.date < newPlan.planningWindow.startDate &&
        !completedIds.has(t.id) && !filteredIds.has(t.id) && !newPlanTaskIds.has(t.id),
    );

    const allTasks = [...completedTasks, ...filteredNewTasks, ...skippedBeforeStart];
    allTasks.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);

    for (let i = 0; i < allTasks.length; i++) {
      allTasks[i] = { ...allTasks[i], sessionOrder: allTasks[i].sessionOrder };
    }

    const updatedWeeks = newPlan.weeks.map(w => ({
      ...w,
      taskIds: allTasks.filter(t => t.weekId === w.id).map(t => t.id),
    }));

    return {
      ...newPlan,
      tasks: allTasks,
      weeks: updatedWeeks,
      generationMetadata: {
        ...newPlan.generationMetadata,
        previousPlanId: currentPlan.id,
        previousPlanVersion: currentPlan.version,
        regenerationMode: mode,
        generationReason: `regeneration-${mode}`,
        validationWarnings: [],
      },
      version: currentPlan.version + 1,
      createdAt: currentPlan.createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  private clonePlan(plan: StudyPlan): StudyPlan {
    return {
      ...plan,
      tasks: plan.tasks.map(t => ({ ...t })),
      phases: plan.phases.map(p => ({ ...p })),
      weeks: plan.weeks.map(w => ({ ...w })),
    };
  }

  private findCapacityForDate(plan: StudyPlan, date: LocalDate): {
    availableMinutes: number;
    maxSessionMinutes: number;
    maxSessions: number;
    isStudyDay: boolean;
  } | null {
    const profile = plan.profile;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const d = new Date(date + 'T12:00:00');
    const dayName = dayNames[d.getDay()];
    const dayAvail = profile.weeklyAvailability[dayName];
    if (!dayAvail) return null;

    const isUnavailable = profile.availabilityExceptions.some(
      e => e.date === date && e.type === 'unavailable',
    );
    const override = profile.availabilityExceptions.find(
      e => e.date === date && e.type === 'custom-capacity',
    );

    const enabled = dayAvail.enabled && !isUnavailable;
    const rawMinutes = override
      ? (override.availableMinutes ?? dayAvail.availableMinutes)
      : dayAvail.availableMinutes;

    return {
      availableMinutes: enabled ? rawMinutes : 0,
      maxSessionMinutes: Math.min(
        profile.maximumSessionMinutes,
        dayAvail.maximumSessionMinutes ?? profile.maximumSessionMinutes,
      ),
      maxSessions: Math.min(
        profile.maximumSessionsPerDay,
        dayAvail.maximumSessions ?? profile.maximumSessionsPerDay,
      ),
      isStudyDay: enabled,
    };
  }

  private nextAvailableDate(plan: StudyPlan, fromDate: LocalDate): LocalDate | null {
    const maxIterations = 365;
    let current = fromDate;

    for (let i = 0; i < maxIterations; i++) {
      current = this.addDays(current, 1);
      if (current > plan.planningWindow.finalStudyDate) return null;
      if (current === plan.planningWindow.examDate) continue;

      const cap = this.findCapacityForDate(plan, current);
      if (cap && cap.isStudyDay && cap.availableMinutes > 0) return current;
    }

    return null;
  }

  private addDays(date: LocalDate, days: number): LocalDate {
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  private clampMinutes(estimated: number, maxSessionMinutes: number): number {
    const allowed = ALLOWED_DURATIONS.filter(d => d <= maxSessionMinutes && d <= estimated);
    if (allowed.length === 0) return Math.min(ALLOWED_DURATIONS[0], maxSessionMinutes);
    return allowed.reduce((prev, curr) =>
      Math.abs(curr - estimated) < Math.abs(prev - estimated) ? curr : prev,
    );
  }

  private applyRepair(plan: StudyPlan, issue: PlanValidationIssue): StudyPlan | null {
    const { code, path, message } = issue;

    if (code === 'task-after-exam' && path) {
      const taskId = path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const tasks = [...plan.tasks];
      tasks[idx] = { ...tasks[idx], date: plan.planningWindow.finalStudyDate, status: 'rescheduled' };
      return { ...plan, tasks };
    }

    if (code === 'task-on-exam-date' && path) {
      const taskId = path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const newDate = this.addDays(plan.planningWindow.examDate, -1);
      if (newDate < plan.planningWindow.startDate) return null;
      const tasks = [...plan.tasks];
      tasks[idx] = { ...tasks[idx], date: newDate, status: 'rescheduled' };
      return { ...plan, tasks };
    }

    if (code === 'daily-capacity-exceeded') {
      const dateMatch = message.match(/Date (\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return null;
      const dateStr = dateMatch[1];
      const dayTasks = plan.tasks.filter(t => t.date === dateStr);
      const cap = this.findCapacityForDate(plan, dateStr);
      if (!cap) return null;

      const totalMinutes = dayTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
      const excess = totalMinutes - cap.availableMinutes;
      if (excess <= 0) return null;

      const sorted = [...dayTasks].filter(t => t.status !== 'completed').sort((a, b) => {
        const order = { critical: 4, high: 3, normal: 2, low: 1 };
        return (order[b.priority] ?? 0) - (order[a.priority] ?? 0);
      });
      const tasks = [...plan.tasks];
      let remaining = excess;

      for (const task of sorted) {
        if (remaining <= 0) break;
        const nextDate = this.nextAvailableDate(plan, task.date);
        if (nextDate) {
          const idx = tasks.findIndex(t => t.id === task.id);
          if (idx !== -1) {
            tasks[idx] = {
              ...tasks[idx],
              date: nextDate,
              status: 'rescheduled',
              rescheduledFromDate: task.date,
            };
            remaining -= task.estimatedMinutes;
          }
        }
      }

      return { ...plan, tasks };
    }

    if (code === 'session-duration-exceeded' && path) {
      const taskId = path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const task = plan.tasks[idx];
      const newDuration = this.clampMinutes(task.estimatedMinutes, plan.profile.maximumSessionMinutes);
      const tasks = [...plan.tasks];
      tasks[idx] = { ...tasks[idx], estimatedMinutes: newDuration };
      return { ...plan, tasks };
    }

    if (code === 'task-on-disabled-date' && path) {
      const taskId = path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const task = plan.tasks[idx];
      const nextDate = this.nextAvailableDate(plan, task.date);
      if (!nextDate) return null;
      const tasks = [...plan.tasks];
      tasks[idx] = {
        ...tasks[idx],
        date: nextDate,
        status: 'rescheduled',
        rescheduledFromDate: task.date,
      };
      return { ...plan, tasks };
    }

    return null;
  }
}
