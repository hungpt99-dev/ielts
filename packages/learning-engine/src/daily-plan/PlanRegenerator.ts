import type { DailyPlanEngine } from './DailyPlanEngine';
import type {
  StudyPlan,
  StudyTask,
  NormalizedProfile,
  RegenerationMode,
  MissedTaskResolution,
  LocalDate,
  PlanValidationIssue,
  SettingsChangeImpact,
  PlanFeasibility,
  PlanWarning,
  PlanGenerationSummary,
  GenerateStudyPlanResult,
  DayOfWeek,
} from './types';
import { TASK_STATUS, TASK_PRIORITY } from '../domain/constants';

// ── Public Config & Params Types ──

export interface PlanRegeneratorConfig {
  maxRepairAttempts?: number;
  engineVersion?: string;
  schemaVersion?: string;
}

export interface RegeneratePlanParams {
  currentPlan: StudyPlan;
  newProfile: NormalizedProfile;
  mode: RegenerationMode;
}

export interface MissedTaskAdaptationParams {
  plan: StudyPlan;
  missedTaskIds: string[];
}

export interface SettingsChangePreviewParams {
  currentPlan: StudyPlan;
  newProfile: NormalizedProfile;
  updatedFields: string[];
}

// ── Constants ──

const ALLOWED_DURATIONS = [10, 15, 20, 30, 45, 60, 90] as const;
const MIN_SESSION_MINUTES = 10;
const DEFAULT_MAX_REPAIR_ATTEMPTS = 3;
const ALL_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ── Date Utilities ──

function parseDate(d: LocalDate): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function formatDate(date: Date): LocalDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: LocalDate, days: number): LocalDate {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function daysBetween(a: LocalDate, b: LocalDate): number {
  const diff = parseDate(b).getTime() - parseDate(a).getTime();
  return Math.round(diff / 86400000);
}

function getDayOfWeek(date: LocalDate): DayOfWeek {
  const dayIndex = parseDate(date).getDay();
  return ALL_DAYS[(dayIndex + 6) % 7];
}

function isBeforeOrSame(a: LocalDate, b: LocalDate): boolean {
  return a <= b;
}

function clampMinutes(estimated: number, maxSessionMinutes: number): number {
  const allowed = ALLOWED_DURATIONS.filter(d => d <= maxSessionMinutes && d <= estimated);
  if (allowed.length === 0) return Math.min(ALLOWED_DURATIONS[0], maxSessionMinutes);
  return allowed.reduce((prev, curr) =>
    Math.abs(curr - estimated) < Math.abs(prev - estimated) ? curr : prev,
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── PlanRegenerator ──

export class PlanRegenerator {
  private readonly engine: DailyPlanEngine;
  private readonly maxRepairAttempts: number;

  constructor(engine: DailyPlanEngine, config: PlanRegeneratorConfig = {}) {
    this.engine = engine;
    this.maxRepairAttempts = config.maxRepairAttempts ?? DEFAULT_MAX_REPAIR_ATTEMPTS;
  }

  // ── Public API ──

  regenerate(params: RegeneratePlanParams): GenerateStudyPlanResult {
    const { currentPlan, newProfile, mode } = params;

    if (mode === 'full') {
      return this.engine.generatePlan(newProfile);
    }

    const completedTasks = currentPlan.tasks.filter(t => t.status === TASK_STATUS.COMPLETED);
    const inProgressTasks = currentPlan.tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS);

    if (mode === 'rebalance') {
      return this.rebalanceRegeneration(currentPlan, newProfile, completedTasks, inProgressTasks);
    }

    const generationResult = this.engine.generatePlan(newProfile);
    if (generationResult.status !== 'success') return generationResult;

    const mergedPlan = this.mergeCompletedTasks(
      currentPlan,
      generationResult.plan,
      completedTasks,
      inProgressTasks,
      mode,
    );

    const issues = this.engine.validatePlan(mergedPlan);
    if (issues.some(i => i.severity === 'error')) {
      const validationResult = this.handleValidationFailure(mergedPlan, issues, generationResult.feasibility);
      if (validationResult) return validationResult;
    }

    return {
      status: 'success',
      plan: mergedPlan,
      feasibility: generationResult.feasibility,
      warnings: generationResult.warnings,
      generationSummary: this.buildGenerationSummary(
        mergedPlan.tasks.length,
        issues,
        mergedPlan.generationMetadata.offlineFallbackUsed,
      ),
    };
  }

  adaptToMissedTasks(params: MissedTaskAdaptationParams): {
    updatedPlan: StudyPlan;
    resolutions: MissedTaskResolution[];
  } {
    const { plan, missedTaskIds } = params;
    let workingPlan: StudyPlan = this.clonePlan(plan);
    const resolutions: MissedTaskResolution[] = [];
    const processedIds = new Set<string>();

    for (const taskId of missedTaskIds) {
      if (processedIds.has(taskId)) continue;
      processedIds.add(taskId);

      const resolved = this.engine.adaptToMissedTask(workingPlan, taskId);
      workingPlan = resolved.updatedPlan;
      resolutions.push(resolved.resolution);
    }

    workingPlan.tasks.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
    this.renumberSessions(workingPlan.tasks);

    const updatedPhases = workingPlan.phases.map(p => ({
      ...p,
      scheduledMinutes: workingPlan.tasks
        .filter(t => t.phaseId === p.id)
        .reduce((s, t) => s + t.estimatedMinutes, 0),
    }));

    const updatedWeeks = workingPlan.weeks.map(w => ({
      ...w,
      taskIds: workingPlan.tasks.filter(t => t.weekId === w.id).map(t => t.id),
      scheduledMinutes: workingPlan.tasks
        .filter(t => t.weekId === w.id)
        .reduce((s, t) => s + t.estimatedMinutes, 0),
    }));

    workingPlan = {
      ...workingPlan,
      phases: updatedPhases,
      weeks: updatedWeeks,
      updatedAt: new Date().toISOString(),
    };

    return { updatedPlan: workingPlan, resolutions };
  }

  previewSettingsChange(params: SettingsChangePreviewParams): SettingsChangeImpact {
    const { currentPlan, newProfile, updatedFields } = params;
    const oldProfile = currentPlan.profile;
    const changes: string[] = [];
    const preservedItems: string[] = [];
    let requiresConfirmation = false;

    const completedCount = currentPlan.tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
    if (completedCount > 0) {
      preservedItems.push(`${completedCount} completed tasks will be preserved`);
    }

    const inProgressCount = currentPlan.tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length;
    if (inProgressCount > 0) {
      preservedItems.push(`${inProgressCount} in-progress tasks will be preserved`);
    }

    const hasUnfinishedTasks = currentPlan.tasks.some(
      t => t.status !== TASK_STATUS.COMPLETED && t.status !== TASK_STATUS.IN_PROGRESS,
    );
    if (hasUnfinishedTasks) {
      preservedItems.push('Unfinished tasks will be regenerated based on new settings');
    }

    if (newProfile.targetOverallBand !== oldProfile.targetOverallBand) {
      const diff = newProfile.targetOverallBand - oldProfile.targetOverallBand;
      changes.push(
        `Target band changed from ${oldProfile.targetOverallBand} to ${newProfile.targetOverallBand} (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`,
      );
      if (Math.abs(diff) >= 0.5) requiresConfirmation = true;
    }

    if (newProfile.examDate !== oldProfile.examDate) {
      const oldDays = daysBetween(oldProfile.planStartDate, oldProfile.examDate);
      const newDays = daysBetween(newProfile.planStartDate, newProfile.examDate);
      const dayDiff = newDays - oldDays;
      changes.push(
        `Exam date moved: ${dayDiff > 0 ? '+' : ''}${dayDiff} days (${oldProfile.examDate} → ${newProfile.examDate})`,
      );
      if (Math.abs(dayDiff) >= 7) requiresConfirmation = true;
    }

    if (newProfile.currentOverallBand !== oldProfile.currentOverallBand) {
      changes.push(
        `Current overall band changed from ${oldProfile.currentOverallBand} to ${newProfile.currentOverallBand}`,
      );
      if (Math.abs(newProfile.currentOverallBand - oldProfile.currentOverallBand) >= 0.5) {
        requiresConfirmation = true;
      }
    }

    if (
      updatedFields.some(
        f => f.toLowerCase().includes('availability') || f.toLowerCase().includes('study') || f.toLowerCase().includes('restday'),
      )
    ) {
      const oldTotal = this.calculateWeeklyMinutes(oldProfile);
      const newTotal = this.calculateWeeklyMinutes(newProfile);
      const diff = newTotal - oldTotal;
      changes.push(
        `Weekly availability changed: ${oldTotal} → ${newTotal} minutes (${diff > 0 ? '+' : ''}${diff})`,
      );
      if (Math.abs(diff) >= 120) requiresConfirmation = true;
    }

    if (newProfile.planStartDate !== oldProfile.planStartDate) {
      changes.push(
        `Plan start date changed from ${oldProfile.planStartDate} to ${newProfile.planStartDate}`,
      );
    }

    const skillChanges: string[] = [];
    for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
      const oldVal = oldProfile.currentSkillBands[skill];
      const newVal = newProfile.currentSkillBands[skill];
      if (oldVal !== newVal) {
        skillChanges.push(`${skill}: ${oldVal} → ${newVal}`);
      }
    }
    if (skillChanges.length > 0) {
      changes.push(`Skill band changes: ${skillChanges.join(', ')}`);
      requiresConfirmation = true;
    }

    if (
      updatedFields.some(f => f.includes('weak') || f.includes('strong') || f.includes('priority'))
    ) {
      changes.push('Skill priorities updated');
      requiresConfirmation = true;
    }

    if (
      updatedFields.some(f => f.includes('examType'))
    ) {
      changes.push(`Exam type changed from ${oldProfile.examType} to ${newProfile.examType}`);
      requiresConfirmation = true;
    }

    const description = this.buildChangeDescription(newProfile, currentPlan);

    return { description, changes, preservedItems, requiresConfirmation };
  }

  determineRegenerationMode(
    oldProfile: NormalizedProfile,
    newProfile: NormalizedProfile,
  ): RegenerationMode {
    if (newProfile.examDate !== oldProfile.examDate) return 'exam-date-change';
    if (newProfile.targetOverallBand !== oldProfile.targetOverallBand) return 'target-change';
    if (newProfile.currentOverallBand !== oldProfile.currentOverallBand) return 'target-change';
    if (
      JSON.stringify(newProfile.weeklyAvailability) !==
      JSON.stringify(oldProfile.weeklyAvailability)
    ) {
      return 'availability-change';
    }
    if (newProfile.weakSkills.join(',') !== oldProfile.weakSkills.join(',')) return 'settings-change';
    if (newProfile.strongSkills.join(',') !== oldProfile.strongSkills.join(',')) return 'settings-change';
    if (newProfile.maximumSessionMinutes !== oldProfile.maximumSessionMinutes) {
      return 'availability-change';
    }
    if (newProfile.maximumSessionsPerDay !== oldProfile.maximumSessionsPerDay) {
      return 'availability-change';
    }
    if (newProfile.studyIntensity !== oldProfile.studyIntensity) return 'settings-change';
    if (newProfile.planStartDate !== oldProfile.planStartDate) return 'settings-change';
    if (newProfile.examType !== oldProfile.examType) return 'settings-change';
    if (
      JSON.stringify(newProfile.currentSkillBands) !==
      JSON.stringify(oldProfile.currentSkillBands)
    ) {
      return 'target-change';
    }
    return 'settings-change';
  }

  // ── Private ──

  private rebalanceRegeneration(
    currentPlan: StudyPlan,
    newProfile: NormalizedProfile,
    completedTasks: StudyTask[],
    inProgressTasks: StudyTask[],
  ): GenerateStudyPlanResult {
    const preview = this.engine.previewPlan(newProfile);

    const futureTasks = currentPlan.tasks.filter(
      t => t.status !== TASK_STATUS.COMPLETED && t.status !== TASK_STATUS.IN_PROGRESS,
    );

    const preservedTasks = [...completedTasks, ...inProgressTasks];
    const capacityByDate = this.buildCapacityMap(newProfile, preview.planningWindow);

    const rebalanced = this.scheduleTasksWithPreserved(
      preservedTasks,
      futureTasks,
      capacityByDate,
      preview.planningWindow.startDate,
      preview.planningWindow.finalStudyDate,
    );

    const allTasks = [...preservedTasks, ...rebalanced];
    allTasks.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
    this.renumberSessions(allTasks);

    const generationResult = this.engine.generatePlan(newProfile);
    if (generationResult.status !== 'success') return generationResult;

    const newPlan = generationResult.plan;
    const mergedPlan: StudyPlan = {
      ...newPlan,
      tasks: allTasks,
      weeks: newPlan.weeks.map(w => ({
        ...w,
        taskIds: allTasks.filter(t => t.weekId === w.id).map(t => t.id),
        scheduledMinutes: allTasks
          .filter(t => t.weekId === w.id)
          .reduce((s, t) => s + t.estimatedMinutes, 0),
      })),
      phases: newPlan.phases.map(p => ({
        ...p,
        scheduledMinutes: allTasks
          .filter(t => t.phaseId === p.id)
          .reduce((s, t) => s + t.estimatedMinutes, 0),
      })),
      generationMetadata: {
        ...newPlan.generationMetadata,
        previousPlanId: currentPlan.id,
        previousPlanVersion: currentPlan.version,
        regenerationMode: 'rebalance',
        generationReason: 'regeneration-rebalance',
        validationWarnings: [],
      },
      version: currentPlan.version + 1,
      createdAt: currentPlan.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const issues = this.engine.validatePlan(mergedPlan);
    if (issues.some(i => i.severity === 'error')) {
      const validationResult = this.handleValidationFailure(mergedPlan, issues, preview.feasibility);
      if (validationResult) return validationResult;
    }

    return {
      status: 'success',
      plan: mergedPlan,
      feasibility: preview.feasibility,
      warnings: preview.warnings,
      generationSummary: this.buildGenerationSummary(
        allTasks.length,
        issues,
        false,
      ),
    };
  }

  private mergeCompletedTasks(
    currentPlan: StudyPlan,
    newPlan: StudyPlan,
    completedTasks: StudyTask[],
    inProgressTasks: StudyTask[],
    mode: RegenerationMode,
  ): StudyPlan {
    const preservedIds = new Set([
      ...completedTasks.map(t => t.id),
      ...inProgressTasks.map(t => t.id),
    ]);

    const preservedTasks = [...completedTasks, ...inProgressTasks];
    const filteredNewTasks = newPlan.tasks.filter(t => !preservedIds.has(t.id));

    const allTasks = [...preservedTasks, ...filteredNewTasks];
    allTasks.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
    this.renumberSessions(allTasks);

    const updatedWeeks = newPlan.weeks.map(w => ({
      ...w,
      taskIds: allTasks.filter(t => t.weekId === w.id).map(t => t.id),
      scheduledMinutes: allTasks
        .filter(t => t.weekId === w.id)
        .reduce((s, t) => s + t.estimatedMinutes, 0),
    }));

    const updatedPhases = newPlan.phases.map(p => ({
      ...p,
      scheduledMinutes: allTasks
        .filter(t => t.phaseId === p.id)
        .reduce((s, t) => s + t.estimatedMinutes, 0),
    }));

    return {
      ...newPlan,
      tasks: allTasks,
      weeks: updatedWeeks,
      phases: updatedPhases,
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

  private handleValidationFailure(
    plan: StudyPlan,
    issues: PlanValidationIssue[],
    feasibility: PlanFeasibility,
  ): GenerateStudyPlanResult | null {
    const errors = issues.filter(i => i.severity === 'error');
    const repairable = errors.filter(i => i.repairable);

    if (repairable.length > 0) {
      const repaired = this.repairPlan(plan, errors);
      if (repaired) {
        const finalIssues = this.engine.validatePlan(repaired);
        const finalErrors = finalIssues.filter(i => i.severity === 'error');
        if (finalErrors.length === 0) {
          return {
            status: 'success',
            plan: repaired,
            feasibility,
            warnings: this.collectWarnings(feasibility, finalIssues),
            generationSummary: this.buildGenerationSummary(
              repaired.tasks.length,
              finalIssues,
              repaired.generationMetadata.offlineFallbackUsed,
            ),
          };
        }
      }
    }

    return null;
  }

  private scheduleTasksWithPreserved(
    preservedTasks: StudyTask[],
    futureTasks: StudyTask[],
    capacityByDate: Map<string, { availableMinutes: number; maxSessionMinutes: number; maxSessions: number; isStudyDay: boolean }>,
    startDate: LocalDate,
    finalStudyDate: LocalDate,
  ): StudyTask[] {
    const rebalanced: StudyTask[] = [];
    const scheduledIds = new Set<string>();

    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };

    const sorted = [...futureTasks].sort((a, b) => {
      const aScore = (priorityOrder[a.priority] ?? 0) * 10 + (a.skill === 'writing' || a.skill === 'speaking' ? 5 : 0);
      const bScore = (priorityOrder[b.priority] ?? 0) * 10 + (b.skill === 'writing' || b.skill === 'speaking' ? 5 : 0);
      return bScore - aScore;
    });

    let currentDate = startDate;

    while (isBeforeOrSame(currentDate, finalStudyDate) && sorted.some(t => !scheduledIds.has(t.id))) {
      const cap = capacityByDate.get(currentDate);
      if (!cap || !cap.isStudyDay || cap.availableMinutes <= 0) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      const preservedOnDate = preservedTasks
        .filter(t => t.date === currentDate)
        .reduce((s, t) => s + t.estimatedMinutes, 0);
      const preservedSessions = preservedTasks.filter(t => t.date === currentDate).length;

      let remaining = cap.availableMinutes - preservedOnDate;
      let sessionsLeft = cap.maxSessions - preservedSessions;

      if (remaining <= 0 || sessionsLeft <= 0) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      for (const task of sorted) {
        if (scheduledIds.has(task.id)) continue;
        if (task.estimatedMinutes > cap.maxSessionMinutes) continue;
        if (task.estimatedMinutes > remaining) continue;

        const depsReady =
          !task.dependencies || task.dependencies.every(d => scheduledIds.has(d));
        if (!depsReady) continue;

        rebalanced.push({
          ...task,
          date: currentDate,
          sessionOrder: 1,
          status: 'not-started',
        });
        scheduledIds.add(task.id);
        remaining -= task.estimatedMinutes;
        sessionsLeft--;
      }

      currentDate = addDays(currentDate, 1);
    }

    for (const task of futureTasks) {
      if (!scheduledIds.has(task.id)) {
        rebalanced.push({ ...task, status: TASK_STATUS.SKIPPED });
      }
    }

    rebalanced.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
    return rebalanced;
  }

  private buildCapacityMap(
    profile: NormalizedProfile,
    window: { startDate: LocalDate; examDate: LocalDate; finalStudyDate: LocalDate },
  ): Map<string, { availableMinutes: number; maxSessionMinutes: number; maxSessions: number; isStudyDay: boolean }> {
    const map = new Map<string, { availableMinutes: number; maxSessionMinutes: number; maxSessions: number; isStudyDay: boolean }>();
    let current = window.startDate;

    while (isBeforeOrSame(current, window.examDate)) {
      const dayOfWeek = getDayOfWeek(current);
      const dayAvail = profile.weeklyAvailability[dayOfWeek];

      const isUnavailable = profile.availabilityExceptions.some(
        e => e.date === current && e.type === 'unavailable',
      );
      const override = profile.availabilityExceptions.find(
        e => e.date === current && e.type === 'custom-capacity',
      );

      const enabled = dayAvail.enabled && !isUnavailable;
      const availableMinutes = override
        ? (override.availableMinutes ?? dayAvail.availableMinutes)
        : dayAvail.availableMinutes;
      const maxSessionMinutes = Math.min(
        profile.maximumSessionMinutes,
        dayAvail.maximumSessionMinutes ?? profile.maximumSessionMinutes,
      );
      const maxSessions = Math.min(
        profile.maximumSessionsPerDay,
        dayAvail.maximumSessions ?? profile.maximumSessionsPerDay,
      );

      map.set(current, {
        availableMinutes: enabled ? availableMinutes : 0,
        maxSessionMinutes,
        maxSessions,
        isStudyDay: enabled,
      });

      current = addDays(current, 1);
    }

    return map;
  }

  private repairPlan(plan: StudyPlan, _issues: PlanValidationIssue[]): StudyPlan | null {
    let current: StudyPlan = { ...plan, tasks: [...plan.tasks], phases: [...plan.phases], weeks: [...plan.weeks] };

    for (let attempt = 0; attempt < this.maxRepairAttempts; attempt++) {
      const remaining = this.engine.validatePlan(current);
      const errors = remaining.filter(i => i.severity === 'error');
      if (errors.length === 0) break;

      for (const issue of errors) {
        const repaired = this.applyRepair(current, issue);
        if (repaired) {
          current = repaired;
        }
      }
    }

    const finalIssues = this.engine.validatePlan(current);
    return finalIssues.some(i => i.severity === 'error') ? null : current;
  }

  private applyRepair(plan: StudyPlan, issue: PlanValidationIssue): StudyPlan | null {
    if (issue.code === 'task-after-exam' && issue.path) {
      const taskId = issue.path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const updated = [...plan.tasks];
      updated[idx] = {
        ...updated[idx],
        date: plan.planningWindow.finalStudyDate,
        status: 'rescheduled',
      };
      return { ...plan, tasks: updated };
    }

    if (issue.code === 'task-on-exam-date' && issue.path) {
      const taskId = issue.path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const newDate = addDays(plan.planningWindow.examDate, -1);
      if (!isBeforeOrSame(plan.planningWindow.startDate, newDate)) return null;
      const updated = [...plan.tasks];
      updated[idx] = {
        ...updated[idx],
        date: newDate,
        status: 'rescheduled',
      };
      return { ...plan, tasks: updated };
    }

    if (issue.code === 'daily-capacity-exceeded') {
      const dateMatch = issue.message.match(/Date (\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return null;
      const dateStr = dateMatch[1];
      const dayTasks = plan.tasks.filter(t => t.date === dateStr);
      const cap = this.findCapacityForDate(plan, dateStr);
      if (!cap) return null;

      const excess = dayTasks.reduce((s, t) => s + t.estimatedMinutes, 0) - cap.availableMinutes;
      if (excess <= 0) return null;

      const sorted = [...dayTasks]
        .filter(t => t.status !== TASK_STATUS.COMPLETED)
        .sort((a, b) => b.priority.localeCompare(a.priority));
      const updated = [...plan.tasks];

      for (const task of sorted) {
        if (excess <= 0) break;
        if (task.priority === TASK_PRIORITY.LOW || task.priority === TASK_PRIORITY.NORMAL) {
          const nextDate = this.nextAvailableDate(plan, task.date);
          if (nextDate) {
            const idx = updated.findIndex(t => t.id === task.id);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                date: nextDate,
                status: 'rescheduled',
                rescheduledFromDate: task.date,
              };
            }
          }
        }
      }

      return { ...plan, tasks: updated };
    }

    if (issue.code === 'session-duration-exceeded' && issue.path) {
      const taskId = issue.path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const task = plan.tasks[idx];
      const newDuration = clampMinutes(
        task.estimatedMinutes,
        plan.profile.maximumSessionMinutes,
      );
      const updated = [...plan.tasks];
      updated[idx] = { ...updated[idx], estimatedMinutes: newDuration };
      return { ...plan, tasks: updated };
    }

    if (issue.code === 'total-scheduled-exceeded') {
      const totalScheduled = plan.tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
      const schedulableMinutes = plan.planningWindow.schedulableMinutes;
      const excess = totalScheduled - schedulableMinutes;
      if (excess <= 0) return null;

      let tasks = [...plan.tasks];
      let remainingExcess = excess;

      const nonCompleted = tasks.filter(t => t.status !== TASK_STATUS.COMPLETED);

      const lowPriority = nonCompleted
        .filter(t => t.priority === TASK_PRIORITY.LOW && t.estimatedMinutes >= MIN_SESSION_MINUTES)
        .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);

      for (const task of lowPriority) {
        if (remainingExcess <= 0) break;
        const trimmed = clampMinutes(
          Math.max(task.estimatedMinutes - Math.min(remainingExcess, task.estimatedMinutes * 0.5), MIN_SESSION_MINUTES),
          plan.profile.maximumSessionMinutes,
        );
        const reduction = task.estimatedMinutes - trimmed;
        if (reduction > 0) {
          const idx = tasks.findIndex(t => t.id === task.id);
          if (idx !== -1) {
            tasks[idx] = { ...tasks[idx], estimatedMinutes: trimmed };
            remainingExcess -= reduction;
          }
        }
      }

      if (remainingExcess > 0) {
        const reviewTasks = tasks
          .filter(t => t.skill === 'review' && t.status !== TASK_STATUS.COMPLETED && t.estimatedMinutes >= MIN_SESSION_MINUTES)
          .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);

        for (const task of reviewTasks) {
          if (remainingExcess <= 0) break;
          const trimmed = clampMinutes(
            Math.max(task.estimatedMinutes - Math.min(remainingExcess, 10), MIN_SESSION_MINUTES),
            plan.profile.maximumSessionMinutes,
          );
          const reduction = task.estimatedMinutes - trimmed;
          if (reduction > 0) {
            const idx = tasks.findIndex(t => t.id === task.id);
            if (idx !== -1) {
              tasks[idx] = { ...tasks[idx], estimatedMinutes: trimmed };
              remainingExcess -= reduction;
            }
          }
        }
      }

      if (remainingExcess > 0) {
        const normalPriority = tasks
          .filter(t => t.priority === TASK_PRIORITY.NORMAL && t.status !== TASK_STATUS.COMPLETED && t.estimatedMinutes > MIN_SESSION_MINUTES + 5)
          .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);

        for (const task of normalPriority) {
          if (remainingExcess <= 0) break;
          const trimmed = clampMinutes(
            Math.max(task.estimatedMinutes - Math.min(remainingExcess, 10), MIN_SESSION_MINUTES),
            plan.profile.maximumSessionMinutes,
          );
          const reduction = task.estimatedMinutes - trimmed;
          if (reduction > 0) {
            const idx = tasks.findIndex(t => t.id === task.id);
            if (idx !== -1) {
              tasks[idx] = { ...tasks[idx], estimatedMinutes: trimmed };
              remainingExcess -= reduction;
            }
          }
        }
      }

      if (remainingExcess >= totalScheduled) return null;
      return { ...plan, tasks };
    }

    return null;
  }

  private nextAvailableDate(plan: StudyPlan, fromDate: LocalDate): LocalDate | null {
    const maxIter = 365;
    let current = fromDate;

    for (let i = 0; i < maxIter; i++) {
      current = addDays(current, 1);
      if (current > plan.planningWindow.finalStudyDate) return null;
      if (current === plan.planningWindow.examDate) continue;

      const cap = this.findCapacityForDate(plan, current);
      if (cap && cap.isStudyDay && cap.availableMinutes > 0) return current;
    }

    return null;
  }

  private findCapacityForDate(
    plan: StudyPlan,
    date: LocalDate,
  ): { availableMinutes: number; maxSessionMinutes: number; maxSessions: number; isStudyDay: boolean } | null {
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

  // ── Utility Helpers ──

  private renumberSessions(tasks: StudyTask[]): void {
    const dateGroups = new Map<LocalDate, StudyTask[]>();
    for (const task of tasks) {
      const existing = dateGroups.get(task.date) ?? [];
      existing.push(task);
      dateGroups.set(task.date, existing);
    }

    for (const [, group] of dateGroups) {
      group.sort((a, b) => a.sessionOrder - b.sessionOrder);
      for (let i = 0; i < group.length; i++) {
        group[i] = { ...group[i], sessionOrder: i + 1 };
      }
    }
  }

  private calculateWeeklyMinutes(profile: NormalizedProfile): number {
    let total = 0;
    for (const day of ALL_DAYS) {
      if (profile.weeklyAvailability[day]?.enabled) {
        total += profile.weeklyAvailability[day].availableMinutes;
      }
    }
    return total;
  }

  private buildChangeDescription(newProfile: NormalizedProfile, _currentPlan: StudyPlan): string {
    const parts: string[] = [];
    parts.push(`Plan regenerated for ${newProfile.currentOverallBand} → ${newProfile.targetOverallBand}`);
    return parts.join('. ');
  }

  private collectWarnings(
    feasibility: PlanFeasibility,
    issues: PlanValidationIssue[],
  ): PlanWarning[] {
    const warnings: PlanWarning[] = [...feasibility.warnings];
    for (const issue of issues) {
      if (issue.severity === 'warning') {
        warnings.push({
          code: issue.code,
          message: issue.message,
          severity: 'warning',
        });
      }
    }
    return warnings;
  }

  private buildGenerationSummary(
    totalTasks: number,
    issues: PlanValidationIssue[],
    fallbackUsed: boolean,
  ): PlanGenerationSummary {
    return {
      generationId: generateId(),
      durationMs: 0,
      aiCallCount: 0,
      cacheHits: 0,
      candidateCount: totalTasks,
      scheduledTaskCount: totalTasks,
      reviewTaskCount: 0,
      mockTestCount: 0,
      repairsPerformed: issues
        .filter(i => i.repairable)
        .map(i => ({
          issueCode: i.code,
          action: 'auto-fix' as const,
          targetId: i.path ?? '',
          description: i.message,
        })),
      fallbackUsed,
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
}
