import type {
  NormalizedProfile,
  PlanningWindow,
  PlanFeasibility,
  SkillGapScore,
  SkillAllocation,
  StudyPhase,
  StudyWeek,
  StudyTask,
  StudyPlan,
  StudyTimeBudget,
  StudyPhaseType,
  StudyTaskSkill,
  LocalDate,
  PlanValidationIssue,
  PlanValidationCode,
  PlanFeasibilityStatus,
  DayOfWeek,
  PlanWarning,
  PlanAdjustmentSuggestion,
  MissedTaskResolution,
  MissedTaskAction,
  RegenerationMode,
  StudyPlanPreview,
  GenerateStudyPlanResult,
  PlanGenerationSummary,
  PlanGenerationMetadata,
  PlanRepairAction,
  PlanProgress,
  PlanSummary,
} from './types';

// ── Constants ──

const ALLOWED_DURATIONS = [10, 15, 20, 30, 45, 60, 90] as const;
const DEFAULT_BUFFER_PERCENTAGE = 0.1;
const REVIEW_INTERVALS = [1, 3, 7, 14] as const;
const MIN_SESSION_MINUTES = 10;
const MAX_PHASES = 6;
const SKILL_NAMES: StudyTaskSkill[] = ['listening', 'reading', 'writing', 'speaking', 'vocabulary', 'grammar'];
const CORE_SKILLS: StudyTaskSkill[] = ['listening', 'reading', 'writing', 'speaking'];
const ALL_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const PHASE_CONFIGS: Array<{ type: StudyPhaseType; minDays: number; optimalDays: number }> = [
  { type: 'diagnostic', minDays: 1, optimalDays: 3 },
  { type: 'foundation', minDays: 7, optimalDays: 21 },
  { type: 'skill-building', minDays: 7, optimalDays: 21 },
  { type: 'guided-practice', minDays: 5, optimalDays: 14 },
  { type: 'timed-practice', minDays: 5, optimalDays: 10 },
  { type: 'error-correction', minDays: 3, optimalDays: 7 },
  { type: 'mock-examination', minDays: 2, optimalDays: 5 },
  { type: 'final-review', minDays: 2, optimalDays: 4 },
  { type: 'exam-readiness', minDays: 1, optimalDays: 3 },
];

interface DailyCapacity {
  date: LocalDate;
  availableMinutes: number;
  maxSessionMinutes: number;
  maxSessions: number;
  isStudyDay: boolean;
}

export interface DailyPlanEngineConfig {
  bufferPercentage?: number;
  maxRepairAttempts?: number;
  engineVersion?: string;
  schemaVersion?: string;
}

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
  const best = allowed.reduce((prev, curr) =>
    Math.abs(curr - estimated) < Math.abs(prev - estimated) ? curr : prev
  );
  return best;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Engine Class ──

export class DailyPlanEngine {
  private readonly bufferPercentage: number;
  private readonly maxRepairAttempts: number;
  private readonly engineVersion: string;
  private readonly schemaVersion: string;

  constructor(config: DailyPlanEngineConfig = {}) {
    this.bufferPercentage = config.bufferPercentage ?? DEFAULT_BUFFER_PERCENTAGE;
    this.maxRepairAttempts = config.maxRepairAttempts ?? 3;
    this.engineVersion = config.engineVersion ?? '1.0.0';
    this.schemaVersion = config.schemaVersion ?? '1.0.0';
  }

  // ── Public API ──

  generatePlan(profile: NormalizedProfile): GenerateStudyPlanResult {
    const window = this.calculatePlanningWindow(profile);
    const dailyCapacities = this.calculateDailyCapacities(profile, window);
    const skillGaps = this.analyzeSkillGaps(profile);
    const skillAllocation = this.createSkillAllocation(skillGaps);
    const feasibility = this.analyzeFeasibility(window, profile, skillGaps);

    if (feasibility.status === 'insufficient-time') {
      return {
        status: 'needs-profile-completion',
        missingFields: [],
        message: feasibility.warnings.map(w => w.message).join(' '),
      };
    }

    if (feasibility.status === 'high-risk') {
      return {
        status: 'requires-confirmation',
        preview: this.createPreview(window, feasibility, skillAllocation, profile),
        feasibility,
      };
    }

    const phases = this.planPhases(window, profile, skillGaps);
    const timeBudget = this.allocateTimeBudget(window, profile, feasibility);
    const plan = this.buildPlan(profile, window, feasibility, timeBudget, skillAllocation, phases, dailyCapacities, skillGaps);
    const validationIssues = this.validatePlan(plan);

    if (validationIssues.some(i => i.severity === 'error')) {
      const repaired = this.repairPlan(plan, validationIssues);
      if (repaired) {
        const finalIssues = this.validatePlan(repaired);
        if (finalIssues.some(i => i.severity === 'error')) {
          return {
            status: 'failure',
            reason: { code: 'validation-failed', message: 'Plan validation failed after repair', recoverable: true, suggestedAction: 'Adjust profile settings and retry' },
            validationIssues: finalIssues,
            suggestions: this.generateSuggestions(feasibility),
          };
        }
        return this.successResult(repaired, feasibility, validationIssues);
      }
      return {
        status: 'failure',
        reason: { code: 'repair-failed', message: 'Could not repair the plan', recoverable: true, suggestedAction: 'Adjust profile settings and retry' },
        validationIssues,
        suggestions: this.generateSuggestions(feasibility),
      };
    }

    return this.successResult(plan, feasibility, validationIssues);
  }

  previewPlan(profile: NormalizedProfile): StudyPlanPreview {
    const window = this.calculatePlanningWindow(profile);
    const skillGaps = this.analyzeSkillGaps(profile);
    const skillAllocation = this.createSkillAllocation(skillGaps);
    const feasibility = this.analyzeFeasibility(window, profile, skillGaps);
    const phases = this.planPhases(window, profile, skillGaps);
    const dailyCapacities = this.calculateDailyCapacities(profile, window);
    const totalCapacity = dailyCapacities.reduce((s, d) => s + d.availableMinutes, 0);
    const avgTaskMinutes = 25;
    const estimatedTotalTasks = Math.floor((totalCapacity * (1 - this.bufferPercentage)) / avgTaskMinutes);
    const estimatedMockTestCount = Math.max(1, Math.floor(phases.filter(p => p.type === 'mock-examination').length * 2));

    return {
      planningWindow: window,
      feasibility,
      skillAllocation,
      phases,
      estimatedTotalTasks,
      estimatedMockTestCount,
      warnings: feasibility.warnings,
      suggestions: feasibility.suggestions,
    };
  }

  validatePlan(plan: StudyPlan, tasks?: StudyTask[]): PlanValidationIssue[] {
    const issues: PlanValidationIssue[] = [];
    const t = tasks ?? plan.tasks;
    const { planningWindow: w, phases, weeks } = plan;

    if (!isBeforeOrSame(w.startDate, w.examDate)) {
      issues.push(this.issue('start-after-exam', 'error', 'Start date is after exam date'));
    }

    if (w.schedulableMinutes <= 0) {
      issues.push(this.issue('empty-plan', 'error', 'No schedulable minutes available'));
    }

    for (const task of t) {
      if (!isBeforeOrSame(task.date, w.examDate)) {
        issues.push(this.issue('task-after-exam', 'error', `Task ${task.id} is after exam date`, `tasks.${task.id}`));
      }
      if (task.date === w.examDate) {
        issues.push(this.issue('task-on-exam-date', 'warning', `Task ${task.id} is on exam date`, `tasks.${task.id}`));
      }
      if (!isBeforeOrSame(w.startDate, task.date)) {
        issues.push(this.issue('task-outside-window', 'error', `Task ${task.id} is before start date`, `tasks.${task.id}`));
      }
    }

    const datesWithTasks = new Map<LocalDate, StudyTask[]>();
    for (const task of t) {
      const existing = datesWithTasks.get(task.date) ?? [];
      existing.push(task);
      datesWithTasks.set(task.date, existing);
    }

    const capacities = this.calculateDailyCapacities(plan.profile, w);
    for (const cap of capacities) {
      const dateTasks = datesWithTasks.get(cap.date) ?? [];
      const totalMinutes = dateTasks.reduce((s, task) => s + task.estimatedMinutes, 0);
      const totalSessions = dateTasks.length;

      if (totalMinutes > cap.availableMinutes) {
        issues.push(this.issue('daily-capacity-exceeded', 'error', `Date ${cap.date}: ${totalMinutes}m exceeds ${cap.availableMinutes}m capacity`));
      }
      for (const task of dateTasks) {
        if (task.estimatedMinutes > cap.maxSessionMinutes) {
          issues.push(this.issue('session-duration-exceeded', 'error', `Task ${task.id}: ${task.estimatedMinutes}m exceeds ${cap.maxSessionMinutes}m max session`, `tasks.${task.id}`));
        }
      }
      if (totalSessions > cap.maxSessions) {
        issues.push(this.issue('session-limit-exceeded', 'warning', `Date ${cap.date}: ${totalSessions} sessions exceeds ${cap.maxSessions} limit`));
      }
      if (!cap.isStudyDay && dateTasks.length > 0) {
        issues.push(this.issue('task-on-disabled-date', 'error', `Date ${cap.date} is a rest day but has tasks`));
      }
    }

    const totalScheduled = t.reduce((s, task) => s + task.estimatedMinutes, 0);
    if (totalScheduled > w.schedulableMinutes) {
      issues.push(this.issue('total-scheduled-exceeded', 'error', `Total ${totalScheduled}m exceeds ${w.schedulableMinutes}m schedulable`));
    }

    for (const phase of phases) {
      if (!isBeforeOrSame(phase.startDate, phase.endDate)) {
        issues.push(this.issue('invalid-phase-dates', 'error', `Phase ${phase.id} has invalid dates`));
      }
      for (const week of weeks) {
        if (week.phaseId === phase.id) {
          if (!isBeforeOrSame(week.startDate, week.endDate)) {
            issues.push(this.issue('invalid-week-dates', 'error', `Week ${week.id} has invalid dates`));
          }
        }
      }
    }

    const taskDeps = new Map(t.map(task => [task.id, task]));
    for (const task of t) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          const dep = taskDeps.get(depId);
          if (!dep) {
            issues.push(this.issue('dependency-order', 'warning', `Task ${task.id} depends on missing ${depId}`));
          } else if (dep.date > task.date) {
            issues.push(this.issue('dependency-order', 'error', `Task ${task.id} depends on ${depId} scheduled later`));
          }
        }
      }
      if (task.reviewOfTaskId) {
        const source = taskDeps.get(task.reviewOfTaskId);
        if (source && source.date > task.date) {
          issues.push(this.issue('review-after-source', 'error', `Review ${task.id} is before its source task`));
        }
      }
    }

    const seenIds = new Set<string>();
    for (const task of t) {
      if (seenIds.has(task.id)) {
        issues.push(this.issue('duplicate-id', 'error', `Duplicate task ID: ${task.id}`));
      }
      seenIds.add(task.id);
    }

    if (t.length === 0 && w.schedulableMinutes > 0) {
      issues.push(this.issue('empty-plan', 'warning', 'Plan has tasks but no non-review tasks'));
    }

    const mockTasks = t.filter(task => task.skill === 'mock-test');
    for (const mock of mockTasks) {
      const analysisExists = t.some(task =>
        task.reviewOfTaskId === mock.id || (task.metadata?.focusArea === 'mock-analysis' && task.date >= mock.date)
      );
      if (!analysisExists) {
        issues.push(this.issue('mock-missing-analysis', 'warning', `Mock test ${mock.id} has no analysis task`, `tasks.${mock.id}`));
      }
    }

    const finalWeekTasks = t.filter(task => {
      const finalStudyDate = w.finalStudyDate;
      if (!finalStudyDate) return false;
      const weekBeforeExam = addDays(finalStudyDate, -6);
      return task.date >= weekBeforeExam;
    });
    const hasIntensiveNewMaterial = finalWeekTasks.some(task =>
      task.difficulty === 'hard' && task.priority === 'high' && task.skill !== 'review' && task.skill !== 'exam-preparation'
    );
    if (hasIntensiveNewMaterial) {
      issues.push(this.issue('final-week-violation', 'warning', 'Final week contains intensive new material'));
    }

    return issues;
  }

  adaptToMissedTask(plan: StudyPlan, missedTaskId: string): { updatedPlan: StudyPlan; resolution: MissedTaskResolution } {
    const taskIndex = plan.tasks.findIndex(t => t.id === missedTaskId);
    if (taskIndex === -1) {
      return {
        updatedPlan: plan,
        resolution: {
          taskId: missedTaskId,
          action: 'dropped',
          reason: 'Task not found',
          affectedTaskIds: [],
        },
      };
    }

    const missedTask = plan.tasks[taskIndex];
    const updatedTasks = [...plan.tasks];

    const futureCapacity = this.findFutureCapacity(plan, missedTask.date);
    const bufferAvailable = plan.timeBudget.reservedBufferMinutes - this.usedBuffer(plan);

    if (missedTask.priority === 'low' && futureCapacity < missedTask.estimatedMinutes * 0.5) {
      updatedTasks[taskIndex] = { ...missedTask, status: 'skipped' };
      return {
        updatedPlan: { ...plan, tasks: updatedTasks },
        resolution: {
          taskId: missedTaskId,
          action: 'dropped',
          reason: 'Low priority with insufficient future capacity',
          affectedTaskIds: [],
        },
      };
    }

    if (bufferAvailable >= missedTask.estimatedMinutes) {
      const nextAvailable = this.nextAvailableDate(plan, missedTask.date);
      if (nextAvailable) {
        updatedTasks[taskIndex] = {
          ...missedTask,
          date: nextAvailable,
          status: 'rescheduled',
          rescheduledFromDate: missedTask.date,
        };
        updatedTasks.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
        this.renumberSessions(updatedTasks);
        return {
          updatedPlan: { ...plan, tasks: updatedTasks },
          resolution: {
            taskId: missedTaskId,
            action: 'rescheduled',
            reason: `Moved to next available date ${nextAvailable} using buffer`,
            affectedTaskIds: [],
          },
        };
      }
    }

    if (missedTask.estimatedMinutes > 20) {
      const halfMinutes = clampMinutes(Math.ceil(missedTask.estimatedMinutes / 2), plan.profile.maximumSessionMinutes);
      const nextDate = this.nextAvailableDate(plan, missedTask.date);
      if (nextDate) {
        const splitTask1: StudyTask = {
          ...missedTask,
          id: generateId(),
          estimatedMinutes: halfMinutes,
          date: nextDate,
          sessionOrder: 1,
          title: `${missedTask.title} (Part 1)`,
          status: 'rescheduled',
          rescheduledFromDate: missedTask.date,
        };
        const dayAfterSplit = this.nextAvailableDate(plan, nextDate);
        if (dayAfterSplit) {
          const splitTask2: StudyTask = {
            ...missedTask,
            id: generateId(),
            estimatedMinutes: clampMinutes(missedTask.estimatedMinutes - halfMinutes, plan.profile.maximumSessionMinutes),
            date: dayAfterSplit,
            sessionOrder: 1,
            title: `${missedTask.title} (Part 2)`,
            status: 'rescheduled',
            dependencies: [splitTask1.id],
            rescheduledFromDate: missedTask.date,
          };
          updatedTasks.splice(taskIndex, 1, splitTask1, splitTask2);
          updatedTasks.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
          this.renumberSessions(updatedTasks);
          return {
            updatedPlan: { ...plan, tasks: updatedTasks },
            resolution: {
              taskId: missedTaskId,
              action: 'split',
              reason: `Split into two shorter tasks on ${nextDate} and ${dayAfterSplit}`,
              affectedTaskIds: [splitTask1.id, splitTask2.id],
            },
          };
        }
      }
    }

    updatedTasks[taskIndex] = { ...missedTask, status: 'skipped' };
    return {
      updatedPlan: { ...plan, tasks: updatedTasks },
      resolution: {
        taskId: missedTaskId,
        action: 'dropped',
        reason: 'No buffer capacity or suitable date available',
        affectedTaskIds: [],
      },
    };
  }

  adaptToProfileChange(plan: StudyPlan, newProfile: NormalizedProfile, mode: RegenerationMode): GenerateStudyPlanResult {
    if (mode === 'future-only' || mode === 'settings-change' || mode === 'exam-date-change' || mode === 'availability-change' || mode === 'target-change') {
      const completedTasks = plan.tasks.filter(t => t.status === 'completed');
      const futureTasks = plan.tasks.filter(t => t.status !== 'completed' && isBeforeOrSame(newProfile.planStartDate, t.date));

      const window = this.calculatePlanningWindow(newProfile);
      const skillGaps = this.analyzeSkillGaps(newProfile);
      const skillAllocation = this.createSkillAllocation(skillGaps);
      const feasibility = this.analyzeFeasibility(window, newProfile, skillGaps);
      const phases = this.planPhases(window, newProfile, skillGaps);
      const timeBudget = this.allocateTimeBudget(window, newProfile, feasibility);
      const dailyCapacities = this.calculateDailyCapacities(newProfile, window);

      const retainedTasks = mode === 'exam-date-change'
        ? completedTasks
        : completedTasks;

      if (mode === 'target-change' || mode === 'exam-date-change') {
        return this.generatePlan(newProfile);
      }

      const reprioritized = this.rescheduleRemaining(retainedTasks, futureTasks, window, dailyCapacities, skillAllocation, phases, plan);
      const validationIssues = this.validatePlan(reprioritized);

      return {
        status: 'success',
        plan: reprioritized,
        feasibility,
        warnings: this.collectWarnings(feasibility, validationIssues),
        generationSummary: this.createSummary(0, reprioritized.tasks.length, validationIssues, false),
      };
    }

    return this.generatePlan(newProfile);
  }

  calculateProgress(plan: StudyPlan): PlanProgress {
    const allTasks = plan.tasks;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const totalScheduledMinutes = allTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    const completedEstimatedMinutes = allTasks
      .filter(t => t.status === 'completed')
      .reduce((s, t) => s + t.estimatedMinutes, 0);
    const actualStudyMinutes = allTasks
      .filter(t => t.status === 'completed' && t.actualMinutes != null)
      .reduce((s, t) => s + (t.actualMinutes ?? 0), 0);
    const missedCount = allTasks.filter(t => t.status === 'skipped').length;
    const rescheduledCount = allTasks.filter(t => t.status === 'rescheduled').length;

    const phaseProgress: Record<string, number> = {};
    for (const phase of plan.phases) {
      const phaseTasks = allTasks.filter(t => t.phaseId === phase.id);
      const phaseCompleted = phaseTasks.filter(t => t.status === 'completed').length;
      phaseProgress[phase.id] = phaseTasks.length > 0 ? phaseCompleted / phaseTasks.length : 0;
    }

    const weeklyProgress: Record<string, number> = {};
    for (const week of plan.weeks) {
      const weekTasks = allTasks.filter(t => t.weekId === week.id);
      const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
      weeklyProgress[week.id] = weekTasks.length > 0 ? weekCompleted / weekTasks.length : 0;
    }

    const skillProgress: Partial<Record<StudyTaskSkill, number>> = {};
    for (const skill of SKILL_NAMES) {
      const skillTasks = allTasks.filter(t => t.skill === skill);
      const skillCompleted = skillTasks.filter(t => t.status === 'completed').length;
      skillProgress[skill] = skillTasks.length > 0 ? skillCompleted / skillTasks.length : 0;
    }

    const consistency = totalTasks > 0
      ? completedTasks / totalTasks
      : 0;

    return {
      overallTaskProgress: totalTasks > 0 ? completedTasks / totalTasks : 0,
      weightedOverallProgress: totalScheduledMinutes > 0 ? completedEstimatedMinutes / totalScheduledMinutes : 0,
      minuteProgress: totalScheduledMinutes > 0 ? completedEstimatedMinutes / totalScheduledMinutes : 0,
      phaseProgress,
      weeklyProgress,
      skillProgress,
      completedPlannedMinutes: completedEstimatedMinutes,
      actualStudyMinutes,
      consistency,
      missedTaskCount: missedCount,
      rescheduledTaskCount: rescheduledCount,
      totalTasks,
      completedTasks,
      totalScheduledMinutes,
    };
  }

  createPlanSummary(plan: StudyPlan): PlanSummary {
    const progress = this.calculateProgress(plan);
    const mockTestCount = plan.tasks.filter(t => t.skill === 'mock-test').length;
    const reviewTaskCount = plan.tasks.filter(t => t.skill === 'review').length;
    const weakSkills = this.getWeakestSkills(plan.skillAllocation);

    return {
      currentBand: plan.profile.currentOverallBand,
      targetBand: plan.profile.targetOverallBand,
      examDate: plan.planningWindow.examDate,
      daysRemaining: daysBetween(plan.planningWindow.startDate, plan.planningWindow.examDate),
      availableStudyDays: plan.planningWindow.totalAvailableStudyDays,
      totalAvailableHours: Math.round(plan.planningWindow.totalAvailableMinutes / 60 * 10) / 10,
      totalScheduledHours: Math.round(progress.totalScheduledMinutes / 60 * 10) / 10,
      reservedBufferMinutes: plan.planningWindow.reservedBufferMinutes,
      feasibility: plan.feasibility.status,
      weakestSkills: weakSkills,
      skillAllocation: plan.skillAllocation,
      phases: plan.phases.map(p => ({
        type: p.type,
        title: p.title,
        dateRange: [p.startDate, p.endDate] as [LocalDate, LocalDate],
      })),
      taskCount: plan.tasks.length,
      reviewTaskCount,
      mockTestCount,
      aiUsed: plan.generationMetadata.aiUsed,
      offlineFallbackUsed: plan.generationMetadata.offlineFallbackUsed,
    };
  }

  // ── Private Pipeline Methods ──

  private calculatePlanningWindow(profile: NormalizedProfile): PlanningWindow {
    const startDate = profile.planStartDate;
    const examDate = profile.examDate;
    const totalCalendarDays = daysBetween(startDate, examDate);
    const finalStudyDate = examDate;

    let totalAvailableStudyDays = 0;
    let totalAvailableMinutes = 0;
    let current = startDate;

    while (isBeforeOrSame(current, examDate)) {
      const dayOfWeek = getDayOfWeek(current);
      const dayAvail = profile.weeklyAvailability[dayOfWeek];
      const isUnavailable = profile.availabilityExceptions.some(
        e => e.date === current && e.type === 'unavailable'
      );
      const override = profile.availabilityExceptions.find(
        e => e.date === current && e.type === 'custom-capacity'
      );

      if (dayAvail.enabled && !isUnavailable) {
        totalAvailableStudyDays++;
        const minutes = override ? (override.availableMinutes ?? dayAvail.availableMinutes) : dayAvail.availableMinutes;
        totalAvailableMinutes += minutes;
      }

      current = addDays(current, 1);
    }

    const reservedBufferMinutes = Math.round(totalAvailableMinutes * this.bufferPercentage);
    const schedulableMinutes = totalAvailableMinutes - reservedBufferMinutes;

    return {
      startDate,
      examDate,
      finalStudyDate,
      totalCalendarDays,
      totalAvailableStudyDays,
      totalAvailableMinutes,
      reservedBufferMinutes,
      schedulableMinutes,
    };
  }

  private calculateDailyCapacities(profile: NormalizedProfile, window: PlanningWindow): DailyCapacity[] {
    const capacities: DailyCapacity[] = [];
    let current = window.startDate;

    while (isBeforeOrSame(current, window.examDate)) {
      const dayOfWeek = getDayOfWeek(current);
      const dayAvail = profile.weeklyAvailability[dayOfWeek];

      const isUnavailable = profile.availabilityExceptions.some(
        e => e.date === current && e.type === 'unavailable'
      );
      const override = profile.availabilityExceptions.find(
        e => e.date === current && e.type === 'custom-capacity'
      );

      const enabled = dayAvail.enabled && !isUnavailable;
      const availableMinutes = override ? (override.availableMinutes ?? dayAvail.availableMinutes) : dayAvail.availableMinutes;
      const maxSessionMinutes = Math.min(
        profile.maximumSessionMinutes,
        dayAvail.maximumSessionMinutes ?? profile.maximumSessionMinutes
      );
      const maxSessions = Math.min(
        profile.maximumSessionsPerDay,
        dayAvail.maximumSessions ?? profile.maximumSessionsPerDay
      );

      capacities.push({
        date: current,
        availableMinutes: enabled ? availableMinutes : 0,
        maxSessionMinutes,
        maxSessions,
        isStudyDay: enabled,
      });

      current = addDays(current, 1);
    }

    return capacities;
  }

  private analyzeSkillGaps(profile: NormalizedProfile): SkillGapScore[] {
    const scores: SkillGapScore[] = [];

    for (const skill of CORE_SKILLS) {
      const current = profile.currentSkillBands[skill];
      const target = profile.targetSkillBands[skill] ?? profile.targetOverallBand;
      const bandGap = Math.max(0, target - current);

      const isWeak = profile.weakSkills.includes(skill);
      const isStrong = profile.strongSkills.includes(skill);

      const errorRate = profile.exerciseAccuracy
        ? 1 - ((profile.exerciseAccuracy[skill] ?? 0.5) / 1)
        : 0.5;
      const userPriority = isWeak ? 2 : isStrong ? -1 : 0;

      const bandGapWeight = 0.4;
      const errorWeight = 0.25;
      const preferenceWeight = 0.2;
      const confidenceWeight = 0.15;

      const confidenceScore = profile.userConfidence
        ? 1 - (profile.userConfidence[skill] ?? 0.5)
        : 0.5;

      const priorityScore =
        (bandGap / 9) * bandGapWeight +
        errorRate * errorWeight +
        (userPriority + 1) / 3 * preferenceWeight +
        confidenceScore * confidenceWeight;

      const reasons: string[] = [];
      if (bandGap > 1) reasons.push(`Band gap of ${bandGap.toFixed(1)}`);
      if (isWeak) reasons.push('User-declared weak skill');
      if (errorRate > 0.3) reasons.push('High error rate');

      scores.push({
        skill,
        bandGap,
        priorityScore: Math.round(priorityScore * 100) / 100,
        normalizedWeight: 0,
        reasons,
      });
    }

    for (const skill of ['vocabulary', 'grammar'] as StudyTaskSkill[]) {
      const gap = profile.targetOverallBand - profile.currentOverallBand;
      scores.push({
        skill,
        bandGap: Math.max(0, gap),
        priorityScore: Math.max(0, gap / 9 * 0.3),
        normalizedWeight: 0,
        reasons: ['Supporting skill'],
      });
    }

    const totalScore = scores.reduce((s, sc) => s + sc.priorityScore, 0) || 1;
    for (const sc of scores) {
      sc.normalizedWeight = Math.round((sc.priorityScore / totalScore) * 100) / 100;
    }

    return scores;
  }

  private createSkillAllocation(gaps: SkillGapScore[]): SkillAllocation {
    const raw: Record<string, number> = {};
    for (const gap of gaps) {
      raw[gap.skill] = gap.normalizedWeight;
    }

    const listening = raw['listening'] ?? 0;
    const reading = raw['reading'] ?? 0;
    const writing = raw['writing'] ?? 0;
    const speaking = raw['speaking'] ?? 0;
    const vocabulary = raw['vocabulary'] ?? 0;
    const grammar = raw['grammar'] ?? 0;

    const total = listening + reading + writing + speaking + vocabulary + grammar;
    if (total === 0) {
      return { listening: 25, reading: 25, writing: 25, speaking: 25, vocabulary: 0, grammar: 0 };
    }

    const normalize = (v: number) => Math.round((v / total) * 100);

    return {
      listening: normalize(listening),
      reading: normalize(reading),
      writing: normalize(writing),
      speaking: normalize(speaking),
      vocabulary: normalize(vocabulary),
      grammar: normalize(grammar),
    };
  }

  private analyzeFeasibility(window: PlanningWindow, profile: NormalizedProfile, skillGaps: SkillGapScore[]): PlanFeasibility {
    const warnings: PlanWarning[] = [];
    const suggestions: PlanAdjustmentSuggestion[] = [];

    const bandGap = profile.targetOverallBand - profile.currentOverallBand;
    const recommendedMinutesPerBand = 600;
    const recommendedMinutes = Math.ceil(bandGap * recommendedMinutesPerBand * (window.totalCalendarDays < 30 ? 1.5 : 1));
    const deficitMinutes = Math.max(0, recommendedMinutes - window.schedulableMinutes);

    let status: PlanFeasibilityStatus;
    const ratio = window.schedulableMinutes / Math.max(1, recommendedMinutes);

    if (window.schedulableMinutes <= 0) {
      status = 'insufficient-time';
      warnings.push({ code: 'no-study-time', message: 'No available study time in the planning window', severity: 'error' });
    } else if (window.totalCalendarDays < 7 && bandGap > 1) {
      status = 'insufficient-time';
      warnings.push({ code: 'too-little-time', message: 'Less than 7 days with a band gap over 1.0. Consider moving the exam date.', severity: 'error' });
    } else if (ratio < 0.5) {
      status = 'insufficient-time';
      warnings.push({ code: 'insufficient-time', message: 'Available study time is less than 50% of the recommended time', severity: 'error' });
    } else if (ratio < 0.8) {
      status = 'high-risk';
      warnings.push({ code: 'high-risk', message: 'Study time is tight. Consider increasing availability or reducing target.', severity: 'warning' });
    } else if (ratio < 1.0) {
      status = 'challenging';
      warnings.push({ code: 'challenging', message: 'The plan is challenging but achievable with consistent effort.', severity: 'info' });
    } else {
      status = 'comfortable';
    }

    if (deficitMinutes > 0) {
      suggestions.push({ type: 'increase-minutes', description: `Increase study minutes per day by approximately ${Math.ceil(deficitMinutes / Math.max(1, window.totalAvailableStudyDays))} minutes`, impact: 'More manageable schedule' });
      suggestions.push({ type: 'add-days', description: 'Enable one or more rest days for study', impact: 'Up to 120+ extra minutes per week' });
      suggestions.push({ type: 'adjust-target', description: 'Consider a slightly lower target band to match available time', impact: 'More achievable plan' });
    }

    if (bandGap > 2.5) {
      warnings.push({ code: 'large-gap', message: `Band gap of ${bandGap.toFixed(1)} is ambitious within this timeframe.`, severity: 'warning' });
    }

    const maxGap = Math.max(...skillGaps.filter(g => CORE_SKILLS.includes(g.skill)).map(g => g.bandGap));
    if (maxGap >= 2) {
      const weakSkill = skillGaps.find(g => g.bandGap === maxGap);
      if (weakSkill) {
        suggestions.push({ type: 'prioritize-weak-skill', description: `Focus on ${weakSkill.skill} which has the largest gap`, impact: 'Better score improvement' });
      }
    }

    return {
      status,
      availableMinutes: window.totalAvailableMinutes,
      recommendedMinutes,
      schedulableMinutes: window.schedulableMinutes,
      deficitMinutes,
      availableStudyDays: window.totalAvailableStudyDays,
      warnings,
      suggestions,
    };
  }

  private planPhases(window: PlanningWindow, profile: NormalizedProfile, skillGaps: SkillGapScore[]): StudyPhase[] {
    const phases: StudyPhase[] = [];
    const totalDays = window.totalCalendarDays;
    const bandGap = profile.targetOverallBand - profile.currentOverallBand;

    let remainingDays = totalDays;

    const selected: StudyPhaseType[] = [];

    if (totalDays <= 7) {
      selected.push('diagnostic', 'exam-readiness');
    } else if (totalDays <= 14) {
      selected.push('diagnostic', 'error-correction', 'mock-examination', 'final-review');
    } else if (totalDays <= 30) {
      selected.push('diagnostic', 'skill-building', 'guided-practice', 'timed-practice', 'mock-examination', 'final-review');
    } else if (totalDays <= 60) {
      if (bandGap > 2) {
        selected.push('diagnostic', 'foundation', 'skill-building', 'guided-practice', 'mock-examination', 'exam-readiness');
      } else {
        selected.push('diagnostic', 'skill-building', 'guided-practice', 'timed-practice', 'mock-examination', 'final-review');
      }
    } else {
      selected.push('diagnostic', 'foundation', 'skill-building', 'guided-practice', 'timed-practice', 'mock-examination', 'final-review', 'exam-readiness');
    }

    const configs = PHASE_CONFIGS.filter(c => selected.includes(c.type));
    const totalOptimal = configs.reduce((s, c) => s + c.optimalDays, 0);
    const scale = Math.min(1, totalDays / Math.max(1, totalOptimal));

    let currentDate = window.startDate;

    for (let i = 0; i < configs.length && remainingDays > 0; i++) {
      const cfg = configs[i];
      const phaseDays = Math.max(cfg.minDays, Math.min(Math.round(cfg.optimalDays * scale), remainingDays - (configs.length - i - 1) * 1));
      const endDate = addDays(currentDate, phaseDays - 1);

      if (isBeforeOrSame(endDate, window.finalStudyDate) || i === configs.length - 1) {
        const allocatedMinutes = this.estimatePhaseMinutes(currentDate, endDate, profile, window);
        phases.push({
          id: `phase-${i + 1}`,
          type: cfg.type,
          title: this.phaseTitle(cfg.type),
          description: this.phaseDescription(cfg.type, profile),
          startDate: currentDate,
          endDate: endDate,
          targetSkills: this.phaseTargetSkills(cfg.type, skillGaps),
          objectives: [],
          allocatedMinutes,
          scheduledMinutes: 0,
          order: i + 1,
          status: 'upcoming',
        });

        remainingDays -= phaseDays;
        currentDate = addDays(currentDate, phaseDays);
      }
    }

    return phases;
  }

  private allocateTimeBudget(window: PlanningWindow, _profile: NormalizedProfile, feasibility: PlanFeasibility): StudyTimeBudget {
    const total = feasibility.schedulableMinutes;

    const reviewMinutes = Math.round(total * 0.15);
    const vocabularyMinutes = Math.round(total * 0.08);
    const mistakeReviewMinutes = Math.round(total * 0.05);
    const timedPracticeMinutes = Math.round(total * 0.15);
    const mockTestMinutes = Math.round(total * 0.12);
    const mockAnalysisMinutes = Math.round(total * 0.05);
    const finalPreparationMinutes = Math.round(total * 0.05);
    const newLearningMinutes = Math.round(total * 0.15);
    const guidedPracticeMinutes = Math.round(total * 0.1);
    const independentPracticeMinutes = Math.round(total * 0.1);

    return {
      totalAvailableMinutes: window.totalAvailableMinutes,
      reservedBufferMinutes: window.reservedBufferMinutes,
      schedulableMinutes: total,
      newLearningMinutes,
      guidedPracticeMinutes,
      independentPracticeMinutes,
      reviewMinutes,
      vocabularyMinutes,
      mistakeReviewMinutes,
      timedPracticeMinutes,
      mockTestMinutes,
      mockAnalysisMinutes,
      finalPreparationMinutes,
    };
  }

  // ── Task Scheduling ──

  private buildPlan(
    profile: NormalizedProfile,
    window: PlanningWindow,
    feasibility: PlanFeasibility,
    timeBudget: StudyTimeBudget,
    skillAllocation: SkillAllocation,
    phases: StudyPhase[],
    dailyCapacities: DailyCapacity[],
    skillGaps: SkillGapScore[],
  ): StudyPlan {
    const planId = generateId();
    const weeks = this.createWeeks(phases, profile, window);
    const tasks = this.scheduleAllTasks(phases, weeks, dailyCapacities, skillAllocation, timeBudget, profile, window, skillGaps);

    const scheduledMinutes = tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    for (const phase of phases) {
      const phaseTasks = tasks.filter(t => t.phaseId === phase.id);
      phase.scheduledMinutes = phaseTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    }

    const metadata: PlanGenerationMetadata = {
      engineVersion: this.engineVersion,
      schemaVersion: this.schemaVersion,
      generatedAt: new Date().toISOString(),
      generationReason: 'initial-generation',
      profileSnapshotHash: this.hashProfile(profile),
      settingsSnapshotHash: '',
      aiUsed: profile.aiProviderAvailable,
      aiCallCount: 0,
      offlineFallbackUsed: !profile.aiProviderAvailable,
      validationWarnings: [],
    };

    return {
      id: planId,
      version: 1,
      profile,
      planningWindow: window,
      feasibility,
      timeBudget,
      skillAllocation,
      phases,
      weeks,
      tasks,
      generationMetadata: metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private createWeeks(phases: StudyPhase[], profile: NormalizedProfile, window: PlanningWindow): StudyWeek[] {
    const weeks: StudyWeek[] = [];
    let weekNumber = 0;

    for (const phase of phases) {
      let current = phase.startDate;
      while (isBeforeOrSame(current, phase.endDate)) {
        weekNumber++;
        const weekEnd = addDays(current, 6);
        const endDate = isBeforeOrSame(weekEnd, phase.endDate) ? weekEnd : phase.endDate;

        let availableMinutes = 0;
        let w = current;
        while (isBeforeOrSame(w, endDate)) {
          const dow = getDayOfWeek(w);
          const dayAvail = profile.weeklyAvailability[dow];
          const isUnavailable = profile.availabilityExceptions.some(e => e.date === w && e.type === 'unavailable');
          const override = profile.availabilityExceptions.find(e => e.date === w && e.type === 'custom-capacity');
          if (dayAvail.enabled && !isUnavailable) {
            availableMinutes += override ? (override.availableMinutes ?? dayAvail.availableMinutes) : dayAvail.availableMinutes;
          }
          w = addDays(w, 1);
        }

        weeks.push({
          id: `week-${weekNumber}`,
          phaseId: phase.id,
          weekNumber,
          startDate: current,
          endDate,
          title: `Week ${weekNumber}`,
          focus: phase.description,
          description: '',
          objectives: [],
          targetSkills: phase.targetSkills,
          availableMinutes,
          scheduledMinutes: 0,
          bufferMinutes: Math.round(availableMinutes * this.bufferPercentage),
          skillAllocation: {},
          taskIds: [],
        });

        current = addDays(endDate, 1);
      }
    }

    return weeks;
  }

  private scheduleAllTasks(
    phases: StudyPhase[],
    weeks: StudyWeek[],
    dailyCapacities: DailyCapacity[],
    skillAllocation: SkillAllocation,
    timeBudget: StudyTimeBudget,
    profile: NormalizedProfile,
    window: PlanningWindow,
    skillGaps: SkillGapScore[],
  ): StudyTask[] {
    const tasks: StudyTask[] = [];
    const roadmapId = generateId();
    let sessionCounter = 0;

    const phaseMap = new Map(phases.map(p => [p.id, p]));
    const weekByDate = new Map<LocalDate, StudyWeek>();
    for (const week of weeks) {
      let wd = week.startDate;
      while (isBeforeOrSame(wd, week.endDate)) {
        weekByDate.set(wd, week);
        wd = addDays(wd, 1);
      }
    }

    const skillMinutesRemaining: Record<string, number> = {};
    const totalSchedulable = window.schedulableMinutes;
    for (const skill of SKILL_NAMES) {
      const alloc = (skillAllocation as Record<string, number>)[skill] ?? 0;
      skillMinutesRemaining[skill] = Math.round((alloc / 100) * totalSchedulable);
    }

    const dailySkillCounter = new Map<string, Map<StudyTaskSkill, number>>();

    for (let di = 0; di < dailyCapacities.length; di++) {
      const cap = dailyCapacities[di];
      if (!cap.isStudyDay || cap.availableMinutes <= 0) continue;
      if (!isBeforeOrSame(cap.date, window.finalStudyDate)) break;

      const week = weekByDate.get(cap.date);
      if (!week) continue;

      const phase = phaseMap.get(week.phaseId);
      if (!phase) continue;

      const daySkills = dailySkillCounter.get(cap.date) ?? new Map();
      dailySkillCounter.set(cap.date, daySkills);

      let remaining = cap.availableMinutes;
      let sessionsLeft = cap.maxSessions;
      let currentSessionOrder = 0;

      const weekTasks = tasks.filter(t => t.weekId === week.id);
      const weekScheduled = weekTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
      const weekRemaining = week.availableMinutes - weekScheduled;

      if (weekRemaining <= 0) continue;

      const availableForDay = Math.min(remaining, weekRemaining);

      const selectedSkills = this.selectSkillsForDay(
        phase,
        week,
        skillMinutesRemaining,
        availableForDay,
        cap.maxSessionMinutes,
        cap.date,
        profile,
      );

      for (const skill of selectedSkills) {
        if (sessionsLeft <= 0) break;

        const sessionDuration = clampMinutes(
          Math.min(skillMinutesRemaining[skill] ?? 10, remaining / Math.max(1, sessionsLeft)),
          cap.maxSessionMinutes,
        );

        if (sessionDuration < MIN_SESSION_MINUTES) continue;
        if (sessionDuration > remaining) continue;

        sessionCounter++;
        currentSessionOrder++;

        const weekIndex = weeks.indexOf(week);
        const phaseIndex = phases.indexOf(phase);

        const task = this.createStudyTask(
          roadmapId,
          phase,
          week,
          cap.date,
          currentSessionOrder,
          skill as StudyTaskSkill,
          sessionDuration,
          `task-${sessionCounter}`,
          profile,
          skillGaps,
        );

        tasks.push(task);
        remaining -= sessionDuration;
        sessionsLeft--;
        skillMinutesRemaining[skill] = (skillMinutesRemaining[skill] ?? 0) - sessionDuration;
        daySkills.set(skill as StudyTaskSkill, (daySkills.get(skill as StudyTaskSkill) ?? 0) + 1);

        week.scheduledMinutes += sessionDuration;
      }
    }

    const usedByDate = new Map<LocalDate, { minutes: number; sessions: number }>();
    for (const task of tasks) {
      const used = usedByDate.get(task.date) ?? { minutes: 0, sessions: 0 };
      used.minutes += task.estimatedMinutes;
      used.sessions += 1;
      usedByDate.set(task.date, used);
    }

    this.addReviewTasks(tasks, weeks, dailyCapacities, usedByDate, window, profile, roadmapId);
    for (const task of tasks) {
      if (task.skill !== 'review') continue;
      const used = usedByDate.get(task.date) ?? { minutes: 0, sessions: 0 };
      used.minutes += task.estimatedMinutes;
      used.sessions += 1;
      usedByDate.set(task.date, used);
    }

    this.addMockTestTasks(tasks, phases, weeks, dailyCapacities, usedByDate, window, roadmapId, skillGaps);
    for (const task of tasks) {
      if (task.skill !== 'mock-test' && task.taskType !== 'error-analysis') continue;
      const used = usedByDate.get(task.date) ?? { minutes: 0, sessions: 0 };
      used.minutes += task.estimatedMinutes;
      used.sessions += 1;
      usedByDate.set(task.date, used);
    }

    this.applyFinalWeekRules(tasks, weeks, dailyCapacities, usedByDate, window, roadmapId, profile);

    tasks.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
    this.renumberSessions(tasks);

    for (const week of weeks) {
      week.taskIds = tasks.filter(t => t.weekId === week.id).map(t => t.id);
    }

    return tasks;
  }

  private selectSkillsForDay(
    phase: StudyPhase,
    week: StudyWeek,
    skillMinutesRemaining: Record<string, number>,
    availableMinutes: number,
    maxSessionMinutes: number,
    _date: LocalDate,
    _profile: NormalizedProfile,
  ): string[] {
    const skills: string[] = [];

    const phaseRelevantSkills = phase.targetSkills.length > 0
      ? phase.targetSkills
      : CORE_SKILLS;

    const scored = phaseRelevantSkills
      .filter(s => (skillMinutesRemaining[s] ?? 0) > 0)
      .map(s => ({
        skill: s,
        score: (skillMinutesRemaining[s] ?? 0) + (week.skillAllocation[s] ?? 0) * 10,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    for (const s of scored) {
      const duration = clampMinutes(Math.min(skillMinutesRemaining[s.skill] ?? 10, availableMinutes / Math.max(1, scored.length)), maxSessionMinutes);
      if (duration >= MIN_SESSION_MINUTES) {
        skills.push(s.skill);
      }
    }

    return skills;
  }

  private createStudyTask(
    roadmapId: string,
    phase: StudyPhase,
    week: StudyWeek,
    date: LocalDate,
    sessionOrder: number,
    skill: StudyTaskSkill,
    estimatedMinutes: number,
    taskId: string,
    profile: NormalizedProfile,
    skillGaps: SkillGapScore[],
  ): StudyTask {
    const gap = skillGaps.find(g => g.skill === skill);

    return {
      id: taskId,
      roadmapId,
      phaseId: phase.id,
      weekId: week.id,
      date,
      sessionOrder,
      skill,
      taskType: `${skill}-practice`,
      title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Practice`,
      description: `Focused ${skill} practice aligned with ${phase.type} phase objectives.`,
      objective: `Improve ${skill} skills through targeted practice`,
      reason: gap
        ? `${skill.charAt(0).toUpperCase() + skill.slice(1)} has a priority score of ${gap.priorityScore.toFixed(2)}${gap.reasons.length > 0 ? ` (${gap.reasons.join(', ')})` : ''}`
        : `${skill.charAt(0).toUpperCase() + skill.slice(1)} practice for balanced improvement`,
      estimatedMinutes,
      difficulty: estimatedMinutes <= 20 ? 'easy' : estimatedMinutes <= 45 ? 'medium' : 'hard',
      priority: gap && gap.bandGap >= 1.5 ? 'high' : gap && gap.bandGap >= 0.5 ? 'normal' : 'low',
      sourceType: 'built-in',
      status: 'not-started',
      scheduledAt: new Date().toISOString(),
      metadata: {
        targetBand: profile.targetOverallBand,
        focusArea: phase.type,
        generationReason: gap ? `Priority score: ${gap.priorityScore}` : 'Balanced allocation',
      },
    };
  }

  private addReviewTasks(
    tasks: StudyTask[],
    weeks: StudyWeek[],
    dailyCapacities: DailyCapacity[],
    usedByDate: Map<LocalDate, { minutes: number; sessions: number }>,
    window: PlanningWindow,
    _profile: NormalizedProfile,
    roadmapId: string,
  ): void {
    const weekMap = new Map(weeks.map(w => [w.id, w]));
    const capacityByDate = new Map(dailyCapacities.map(c => [c.date, c]));

    let reviewCounter = 0;
    const tasksToReview = tasks.filter(t => t.priority === 'high' || t.priority === 'critical');
    const reviewedTaskIds = new Set<string>();

    for (const task of tasksToReview) {
      if (reviewedTaskIds.has(task.id)) continue;
      reviewedTaskIds.add(task.id);

      for (const interval of REVIEW_INTERVALS) {
        const reviewDate = addDays(task.date, interval);
        if (!isBeforeOrSame(reviewDate, window.finalStudyDate)) break;
        if (reviewDate === window.examDate) continue;

        const cap = capacityByDate.get(reviewDate);
        if (!cap || !cap.isStudyDay) continue;

        const used = usedByDate.get(reviewDate) ?? { minutes: 0, sessions: 0 };
        const remainingMinutes = cap.availableMinutes - used.minutes;
        const remainingSessions = cap.maxSessions - used.sessions;
        if (remainingMinutes < 10 || remainingSessions <= 0) continue;

        const reviewDuration = clampMinutes(Math.min(15, task.estimatedMinutes * 0.5), cap.maxSessionMinutes);
        if (reviewDuration < MIN_SESSION_MINUTES || reviewDuration > remainingMinutes) continue;

        const week = weekMap.get(task.weekId);
        if (!week) continue;

        reviewCounter++;
        const reviewTask: StudyTask = {
          id: `review-${reviewCounter}`,
          roadmapId,
          phaseId: task.phaseId,
          weekId: week.id,
          date: reviewDate,
          sessionOrder: 0,
          skill: 'review',
          taskType: 'review',
          title: `Review: ${task.title}`,
          description: `Review and reinforce concepts from ${task.title}`,
          objective: `Solidify learning from previous ${task.skill} practice`,
          reason: `Spaced repetition review of high-priority ${task.skill} task`,
          estimatedMinutes: reviewDuration,
          difficulty: 'easy',
          priority: 'normal',
          sourceType: 'built-in',
          reviewOfTaskId: task.id,
          status: 'not-started',
          scheduledAt: new Date().toISOString(),
          metadata: {
            focusArea: 'spaced-review',
            generationReason: `Review interval: ${interval} days`,
          },
        };

        tasks.push(reviewTask);
        used.minutes += reviewDuration;
        used.sessions += 1;
        usedByDate.set(reviewDate, used);

        const weekCapacity = weekMap.get(reviewTask.weekId);
        if (weekCapacity) {
          weekCapacity.scheduledMinutes += reviewDuration;
        }
      }
    }
  }

  private addMockTestTasks(
    tasks: StudyTask[],
    phases: StudyPhase[],
    _weeks: StudyWeek[],
    dailyCapacities: DailyCapacity[],
    usedByDate: Map<LocalDate, { minutes: number; sessions: number }>,
    window: PlanningWindow,
    roadmapId: string,
    skillGaps: SkillGapScore[],
  ): void {
    const mockPhases = phases.filter(p => p.type === 'mock-examination' || p.type === 'timed-practice');
    let mockCounter = 0;

    for (const phase of mockPhases) {
      const mockDate = this.findSuitableMockDate(dailyCapacities, phase.startDate, phase.endDate);
      if (!mockDate) continue;

      const cap = dailyCapacities.find(c => c.date === mockDate);
      if (!cap || cap.availableMinutes < 60) continue;

      const used = usedByDate.get(mockDate) ?? { minutes: 0, sessions: 0 };
      const remainingOnMockDay = cap.availableMinutes - used.minutes;
      const mockMinutes = clampMinutes(Math.min(120, Math.min(cap.availableMinutes * 0.7, remainingOnMockDay * 0.8)), cap.maxSessionMinutes * 2);
      if (mockMinutes < 30 || cap.maxSessions - used.sessions <= 0) continue;

      mockCounter++;
      const mockTask: StudyTask = {
        id: `mock-test-${mockCounter}`,
        roadmapId,
        phaseId: phase.id,
        weekId: '',
        date: mockDate,
        sessionOrder: 1,
        skill: 'mock-test',
        taskType: 'mock-test',
        title: `Mock Test ${mockCounter}`,
        description: `Full-length timed mock test for phase: ${phase.type}`,
        objective: `Assess current performance and identify weak areas`,
        reason: 'Mock tests provide essential timed practice and performance feedback',
        estimatedMinutes: mockMinutes,
        difficulty: 'hard',
        priority: 'high',
        sourceType: 'built-in',
        status: 'not-started',
        scheduledAt: new Date().toISOString(),
        metadata: {
          focusArea: 'mock-examination',
          generationReason: `Scheduled during ${phase.type} phase`,
        },
      };

      tasks.push(mockTask);
      used.minutes += mockMinutes;
      used.sessions += 1;
      usedByDate.set(mockDate, used);

      const analysisDate = this.nextAvailableDateFrom(
        addDays(mockDate, 1),
        dailyCapacities,
        window,
      );

      if (analysisDate && analysisDate !== window.examDate) {
        const analysisCap = dailyCapacities.find(c => c.date === analysisDate);
        if (analysisCap) {
          const analysisUsed = usedByDate.get(analysisDate) ?? { minutes: 0, sessions: 0 };
          const analysisRemaining = analysisCap.availableMinutes - analysisUsed.minutes;
          const analysisMinutes = clampMinutes(Math.min(30, analysisRemaining), analysisCap.maxSessionMinutes);
          if (analysisMinutes >= MIN_SESSION_MINUTES && analysisCap.maxSessions - analysisUsed.sessions > 0) {
            const analysisTask: StudyTask = {
              id: `mock-analysis-${mockCounter}`,
              roadmapId,
              phaseId: phase.id,
              weekId: '',
              date: analysisDate,
              sessionOrder: 1,
              skill: 'review',
              taskType: 'error-analysis',
              title: `Mock Test ${mockCounter} Analysis`,
              description: `Analyze mock test results, identify error patterns, and plan targeted improvement`,
              objective: `Transform mock test results into actionable study priorities`,
              reason: 'Analysis is essential to benefit from mock tests',
              estimatedMinutes: analysisMinutes,
              difficulty: 'medium',
              priority: 'high',
              sourceType: 'built-in',
              dependencies: [mockTask.id],
              status: 'not-started',
              scheduledAt: new Date().toISOString(),
              metadata: {
                focusArea: 'mock-analysis',
                generationReason: 'Post-mock error analysis',
              },
            };
            tasks.push(analysisTask);
            analysisUsed.minutes += analysisMinutes;
            analysisUsed.sessions += 1;
            usedByDate.set(analysisDate, analysisUsed);

            const week = this.findWeekForDate(phases, analysisDate);
            if (week) {
              analysisTask.weekId = week.id;
            }
          }
        }
      }

      const week = this.findWeekForDate(phases, mockDate);
      if (week) {
        mockTask.weekId = week.id;
      }
    }
  }

  private applyFinalWeekRules(
    tasks: StudyTask[],
    _weeks: StudyWeek[],
    dailyCapacities: DailyCapacity[],
    usedByDate: Map<LocalDate, { minutes: number; sessions: number }>,
    window: PlanningWindow,
    roadmapId: string,
    _profile: NormalizedProfile,
  ): void {
    const lastWeekStart = addDays(window.finalStudyDate, -6);

    for (const task of tasks) {
      if (!isBeforeOrSame(lastWeekStart, task.date) || !isBeforeOrSame(task.date, window.finalStudyDate)) continue;
      if (task.skill === 'review' || task.skill === 'exam-preparation' || task.skill === 'mock-test') continue;
      if (task.difficulty !== 'hard') continue;
      task.difficulty = 'medium';
      task.estimatedMinutes = clampMinutes(task.estimatedMinutes * 0.7, 45);
    }

    const examDateTasks = tasks.filter(t => t.date === window.examDate);
    for (const task of examDateTasks) {
      if (task.skill !== 'exam-preparation' && task.skill !== 'review') {
        task.skill = 'exam-preparation';
        task.title = `Light Exam Preparation: ${task.title}`;
        task.estimatedMinutes = clampMinutes(task.estimatedMinutes * 0.5, 30);
      }
    }

    const examUsed = usedByDate.get(window.examDate) ?? { minutes: 0, sessions: 0 };
    const examCap = dailyCapacities.find(c => c.date === window.examDate);
    const examRemaining = examCap ? examCap.availableMinutes - examUsed.minutes : 0;
    const examSessionsRemaining = examCap ? examCap.maxSessions - examUsed.sessions : 0;

    if (examRemaining >= 15 && examSessionsRemaining > 0) {
      const examDayTask: StudyTask = {
        id: `exam-day-prep`,
        roadmapId,
        phaseId: 'final-review',
        weekId: '',
        date: window.examDate,
        sessionOrder: 1,
        skill: 'exam-preparation',
        taskType: 'exam-preparation',
        title: 'Exam Day Preparation',
        description: 'Review exam format, check documents, and mental preparation.',
        objective: 'Ensure readiness for the IELTS exam',
        reason: 'Final preparation ensures you are mentally and logistically prepared',
        estimatedMinutes: 15,
        difficulty: 'easy',
        priority: 'high',
        sourceType: 'built-in',
        status: 'not-started',
        scheduledAt: new Date().toISOString(),
        metadata: {
          focusArea: 'exam-readiness',
          generationReason: 'Final exam preparation task',
        },
      };
      tasks.push(examDayTask);
      examUsed.minutes += 15;
      examUsed.sessions += 1;
      usedByDate.set(window.examDate, examUsed);
    }

    const finalReviewDate = addDays(window.finalStudyDate, -1);
    if (isBeforeOrSame(window.startDate, finalReviewDate) && isBeforeOrSame(finalReviewDate, window.finalStudyDate)) {
      const reviewCap = dailyCapacities.find(c => c.date === finalReviewDate);
      if (reviewCap) {
        const reviewUsed = usedByDate.get(finalReviewDate) ?? { minutes: 0, sessions: 0 };
        const finalWeekTasks = tasks.filter(t =>
          t.date >= lastWeekStart && t.date <= window.finalStudyDate &&
          t.skill !== 'review' && t.skill !== 'exam-preparation' && t.skill !== 'mock-test' &&
          t.difficulty !== 'easy'
        );
        const seen = new Set<string>();
        for (const task of finalWeekTasks) {
          if (seen.has(task.id)) continue;
          seen.add(task.id);
          const reviewRemaining = reviewCap.availableMinutes - reviewUsed.minutes;
          const reviewDuration = clampMinutes(Math.min(task.estimatedMinutes * 0.3, reviewRemaining), reviewCap.maxSessionMinutes);
          if (reviewDuration < MIN_SESSION_MINUTES || reviewCap.maxSessions - reviewUsed.sessions <= 0) continue;
          const finalReview: StudyTask = {
            id: `final-review-${task.id}`,
            roadmapId,
            phaseId: task.phaseId,
            weekId: task.weekId,
            date: finalReviewDate,
            sessionOrder: 0,
            skill: 'review',
            taskType: 'review',
            title: `Final Review: ${task.title}`,
            description: `Quick review of key concepts from ${task.title}`,
            objective: 'Reinforce learning before the exam',
            reason: 'Final review consolidates knowledge for exam day',
            estimatedMinutes: reviewDuration,
            difficulty: 'easy',
            priority: 'normal',
            sourceType: 'built-in',
            reviewOfTaskId: task.id,
            status: 'not-started',
            scheduledAt: new Date().toISOString(),
            metadata: {
              focusArea: 'final-preparation',
              generationReason: 'Final review before exam',
            },
          };
          tasks.push(finalReview);
          reviewUsed.minutes += reviewDuration;
          reviewUsed.sessions += 1;
          usedByDate.set(finalReviewDate, reviewUsed);
        }
      }
    }

    tasks.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
    this.renumberSessions(tasks);
  }

  // ── Repair ──

  private repairPlan(plan: StudyPlan, issues: PlanValidationIssue[]): StudyPlan | null {
    let current = { ...plan, tasks: [...plan.tasks], phases: [...plan.phases], weeks: [...plan.weeks] };
    const repairs: PlanRepairAction[] = [];

    for (let attempt = 0; attempt < this.maxRepairAttempts; attempt++) {
      const remaining = this.validatePlan(current, current.tasks);
      const errors = remaining.filter(i => i.severity === 'error');
      if (errors.length === 0) break;

      for (const issue of errors) {
        const repaired = this.applyRepair(current, issue);
        if (repaired) {
          current = repaired;
          repairs.push({
            issueCode: issue.code,
            action: 'auto-repair',
            targetId: issue.path ?? '',
            description: issue.message,
          });
        }
      }
    }

    current.generationMetadata = {
      ...current.generationMetadata,
      validationWarnings: repairs.map(r => ({
        code: r.issueCode,
        severity: 'warning' as const,
        path: r.targetId,
        message: r.description,
        repairable: true,
      })),
    };

    const finalIssues = this.validatePlan(current, current.tasks);
    if (finalIssues.some(i => i.severity === 'error')) return null;

    return current;
  }

  private applyRepair(plan: StudyPlan, issue: PlanValidationIssue): StudyPlan | null {
    if (issue.code === 'task-after-exam' && issue.path) {
      const taskId = issue.path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const updated = [...plan.tasks];
      updated[idx] = { ...updated[idx], date: plan.planningWindow.finalStudyDate, status: 'rescheduled' };
      return { ...plan, tasks: updated };
    }

    if (issue.code === 'task-on-exam-date' && issue.path) {
      const taskId = issue.path.replace('tasks.', '');
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return null;
      const newDate = addDays(plan.planningWindow.examDate, -1);
      if (!isBeforeOrSame(plan.planningWindow.startDate, newDate)) return null;
      const updated = [...plan.tasks];
      updated[idx] = { ...updated[idx], date: newDate, status: 'rescheduled' };
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

      const sorted = [...dayTasks].sort((a, b) => b.priority.localeCompare(a.priority));
      const updated = [...plan.tasks];

      for (const task of sorted) {
        if (excess <= 0) break;
        if (task.priority === 'low' || task.priority === 'normal') {
          const nextDate = this.nextAvailableDate(plan, task.date);
          if (nextDate) {
            const idx = updated.findIndex(t => t.id === task.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], date: nextDate, status: 'rescheduled', rescheduledFromDate: task.date };
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
      const maxSessionMin = plan.profile.maximumSessionMinutes;
      const newDuration = clampMinutes(task.estimatedMinutes, maxSessionMin);
      const updated = [...plan.tasks];
      updated[idx] = { ...updated[idx], estimatedMinutes: newDuration };
      return { ...plan, tasks: updated };
    }

    if (issue.code === 'total-scheduled-exceeded') {
      const totalScheduled = plan.tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
      const schedulable = plan.planningWindow.schedulableMinutes;
      const excess = totalScheduled - schedulable;
      if (excess <= 0) return null;

      let tasks = [...plan.tasks];
      let remaining = excess;

      const reduceTaskDuration = (task: StudyTask, maxReduction: number): number => {
        const minAllowed = Math.max(MIN_SESSION_MINUTES, Math.round(task.estimatedMinutes * 0.5));
        const canReduce = task.estimatedMinutes - minAllowed;
        if (canReduce <= 0) return 0;
        const reduction = Math.min(maxReduction, canReduce);
        const trimmed = clampMinutes(task.estimatedMinutes - reduction, plan.profile.maximumSessionMinutes);
        const idx = tasks.findIndex(t => t.id === task.id);
        if (idx !== -1) {
          tasks[idx] = { ...tasks[idx], estimatedMinutes: trimmed };
        }
        return task.estimatedMinutes - trimmed;
      };

      const lowPriority = tasks
        .filter(t => t.priority === 'low' && t.estimatedMinutes > MIN_SESSION_MINUTES && t.status !== 'completed')
        .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);

      for (const task of lowPriority) {
        if (remaining <= 0) break;
        const reduced = reduceTaskDuration(task, remaining);
        remaining -= reduced;
      }

      if (remaining > 0) {
        const reviews = tasks
          .filter(t => t.skill === 'review' && t.estimatedMinutes > MIN_SESSION_MINUTES && t.status !== 'completed')
          .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);

        for (const task of reviews) {
          if (remaining <= 0) break;
          const reduced = reduceTaskDuration(task, remaining);
          remaining -= reduced;
        }
      }

      if (remaining > 0) {
        const normalPriority = tasks
          .filter(t => t.priority === 'normal' && t.estimatedMinutes > MIN_SESSION_MINUTES + 5 && t.status !== 'completed')
          .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);

        for (const task of normalPriority) {
          if (remaining <= 0) break;
          const reduced = reduceTaskDuration(task, remaining);
          remaining -= reduced;
        }
      }

      if (remaining > 0) {
        const highPriority = tasks
          .filter(t => t.priority === 'high' && t.estimatedMinutes > MIN_SESSION_MINUTES + 10 && t.status !== 'completed' && t.skill !== 'mock-test' && t.skill !== 'exam-preparation')
          .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);

        for (const task of highPriority) {
          if (remaining <= 0) break;
          const reduced = reduceTaskDuration(task, Math.min(remaining, 10));
          remaining -= reduced;
        }
      }

      const newTotal = tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
      if (newTotal >= totalScheduled) return null;
      return { ...plan, tasks };
    }

    return null;
  }

  // ── Adaptation Helpers ──

  private findFutureCapacity(plan: StudyPlan, afterDate: LocalDate): number {
    const futureTasks = plan.tasks.filter(t =>
      t.date > afterDate && isBeforeOrSame(t.date, plan.planningWindow.finalStudyDate)
    );
    const capacities = this.calculateDailyCapacities(plan.profile, plan.planningWindow);
    const futureCapacities = capacities.filter(c => c.date > afterDate);

    const scheduledFuture = futureTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    const availableFuture = futureCapacities.reduce((s, c) => s + c.availableMinutes, 0);

    return Math.max(0, availableFuture - scheduledFuture);
  }

  private usedBuffer(plan: StudyPlan): number {
    const totalScheduled = plan.tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    return Math.max(0, totalScheduled - plan.planningWindow.schedulableMinutes + plan.planningWindow.reservedBufferMinutes);
  }

  private nextAvailableDate(plan: StudyPlan, fromDate: LocalDate): LocalDate | null {
    const capacities = this.calculateDailyCapacities(plan.profile, plan.planningWindow);
    const future = capacities.filter(c =>
      c.date > fromDate && c.isStudyDay && c.availableMinutes > 0
    );
    return future.length > 0 ? future[0].date : null;
  }

  private nextAvailableDateFrom(fromDate: LocalDate, capacities: DailyCapacity[], window: PlanningWindow): LocalDate | null {
    const future = capacities.filter(c =>
      c.date >= fromDate && c.isStudyDay && c.availableMinutes > 0 && isBeforeOrSame(c.date, window.finalStudyDate)
    );
    return future.length > 0 ? future[0].date : null;
  }

  private findSuitableMockDate(capacities: DailyCapacity[], start: LocalDate, end: LocalDate): LocalDate | null {
    const suitable = capacities.filter(c =>
      isBeforeOrSame(start, c.date) && isBeforeOrSame(c.date, end) &&
      c.isStudyDay && c.availableMinutes >= 60
    );
    if (suitable.length === 0) return null;
    const last = suitable[suitable.length - 1];
    return last.date;
  }

  private findWeekForDate(phases: StudyPhase[], date: LocalDate): StudyWeek | null {
    for (const phase of phases) {
      if (date >= phase.startDate && date <= phase.endDate) {
        return {
          id: `${phase.id}-week`,
          phaseId: phase.id,
          weekNumber: phase.order,
          startDate: phase.startDate,
          endDate: phase.endDate,
          title: phase.title,
          focus: phase.description,
          description: '',
          objectives: [],
          targetSkills: phase.targetSkills,
          availableMinutes: phase.allocatedMinutes,
          scheduledMinutes: 0,
          bufferMinutes: 0,
          skillAllocation: {},
          taskIds: [],
        };
      }
    }
    return null;
  }

  private findCapacityForDate(plan: StudyPlan, date: LocalDate): DailyCapacity | null {
    const capacities = this.calculateDailyCapacities(plan.profile, plan.planningWindow);
    return capacities.find(c => c.date === date) ?? null;
  }

  private rescheduleRemaining(
    completedTasks: StudyTask[],
    futureTasks: StudyTask[],
    window: PlanningWindow,
    dailyCapacities: DailyCapacity[],
    skillAllocation: SkillAllocation,
    phases: StudyPhase[],
    plan: StudyPlan,
  ): StudyPlan {
    const capacityByDate = new Map(dailyCapacities.map(c => [c.date, c]));
    const rescheduled: StudyTask[] = [...completedTasks];

    const pending = [...futureTasks].filter(t => t.status !== 'completed').sort((a, b) => {
      const aScore = a.priority === 'critical' ? 3 : a.priority === 'high' ? 2 : a.priority === 'normal' ? 1 : 0;
      const bScore = b.priority === 'critical' ? 3 : b.priority === 'high' ? 2 : b.priority === 'normal' ? 1 : 0;
      return bScore - aScore;
    });

    let datePtr = window.startDate;
    let sessionCounter = rescheduled.length;
    const pendingById = new Map(pending.map(t => [t.id, t]));
    const scheduled = new Set<string>();

    while (datePtr <= window.finalStudyDate && pending.length > 0) {
      const cap = capacityByDate.get(datePtr);
      if (!cap || !cap.isStudyDay || cap.availableMinutes <= 0) {
        datePtr = addDays(datePtr, 1);
        continue;
      }

      let remaining = cap.availableMinutes;
      let sessionsLeft = cap.maxSessions;

      for (let i = 0; i < pending.length && sessionsLeft > 0 && remaining > 0; i++) {
        const task = pending[i];
        if (scheduled.has(task.id)) continue;
        if (task.estimatedMinutes > cap.maxSessionMinutes) continue;
        if (task.estimatedMinutes > remaining) continue;

        const depsReady = !task.dependencies || task.dependencies.every(d => scheduled.has(d));
        if (!depsReady) continue;

        sessionCounter++;
        rescheduled.push({ ...task, date: datePtr, sessionOrder: 1, status: 'not-started' });
        scheduled.add(task.id);
        remaining -= task.estimatedMinutes;
        sessionsLeft--;
      }

      pending.length = 0;
      for (const [, t] of pendingById) {
        if (!scheduled.has(t.id)) pending.push(t);
      }

      datePtr = addDays(datePtr, 1);
    }

    for (const [, t] of pendingById) {
      if (!scheduled.has(t.id)) {
        rescheduled.push({ ...t, status: 'skipped' });
      }
    }

    rescheduled.sort((a, b) => a.date.localeCompare(b.date) || a.sessionOrder - b.sessionOrder);
    this.renumberSessions(rescheduled);

    const updatedWeeks = plan.weeks.map(w => ({
      ...w,
      taskIds: rescheduled.filter(t => t.weekId === w.id).map(t => t.id),
    }));

    return {
      ...plan,
      planningWindow: window,
      tasks: rescheduled,
      weeks: updatedWeeks,
    };
  }

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

  // ── Result Builders ──

  private successResult(plan: StudyPlan, feasibility: PlanFeasibility, validationIssues: PlanValidationIssue[]): GenerateStudyPlanResult {
    return {
      status: 'success',
      plan,
      feasibility,
      warnings: this.collectWarnings(feasibility, validationIssues),
      generationSummary: this.createSummary(plan.tasks.filter(t => t.reviewOfTaskId).length, plan.tasks.length, validationIssues, plan.generationMetadata.offlineFallbackUsed),
    };
  }

  private collectWarnings(feasibility: PlanFeasibility, issues: PlanValidationIssue[]): PlanWarning[] {
    const warnings: PlanWarning[] = [...feasibility.warnings];
    for (const issue of issues) {
      if (issue.severity === 'warning') {
        warnings.push({ code: issue.code, message: issue.message, severity: 'warning' });
      }
    }
    return warnings;
  }

  private createSummary(
    reviewCount: number,
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
      reviewTaskCount: reviewCount,
      mockTestCount: 0,
      repairsPerformed: issues.filter(i => i.repairable).map(i => ({
        issueCode: i.code,
        action: i.repairable ? 'auto-fix' : 'manual',
        targetId: i.path ?? '',
        description: i.message,
      })),
      fallbackUsed,
    };
  }

  private createPreview(
    window: PlanningWindow,
    feasibility: PlanFeasibility,
    skillAllocation: SkillAllocation,
    _profile: NormalizedProfile,
  ): StudyPlanPreview {
    const skills = Object.entries(skillAllocation) as [string, number][];
    const sorted = skills.sort((a, b) => b[1] - a[1]);
    const avgMinutes = 25;
    const estimatedTasks = Math.floor(feasibility.schedulableMinutes / avgMinutes);
    const mockCount = Math.max(1, Math.floor(window.totalCalendarDays / 21));

    const phasesList: StudyPhase[] = [
      { id: 'phase-1', type: 'skill-building', title: 'Skill Building', description: 'Build core skills', startDate: window.startDate, endDate: addDays(window.startDate, 6), targetSkills: ['writing', 'speaking'], objectives: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
    ];

    return {
      planningWindow: window,
      feasibility,
      skillAllocation,
      phases: phasesList,
      estimatedTotalTasks: estimatedTasks,
      estimatedMockTestCount: mockCount,
      warnings: feasibility.warnings,
      suggestions: feasibility.suggestions,
    };
  }

  private generateSuggestions(feasibility: PlanFeasibility): PlanAdjustmentSuggestion[] {
    return feasibility.suggestions.length > 0
      ? feasibility.suggestions
      : [{ type: 'general', description: 'Review your availability and exam date', impact: 'Better planning' }];
  }

  // ── Utility Helpers ──

  private phaseTitle(type: StudyPhaseType): string {
    const titles: Record<StudyPhaseType, string> = {
      'diagnostic': 'Diagnostic Assessment',
      'foundation': 'Foundation Building',
      'skill-building': 'Skill Development',
      'strategy-development': 'Strategy Development',
      'guided-practice': 'Guided Practice',
      'timed-practice': 'Timed Practice',
      'mock-examination': 'Mock Examination',
      'error-correction': 'Error Correction',
      'final-review': 'Final Review',
      'exam-readiness': 'Exam Readiness',
    };
    return titles[type] ?? type;
  }

  private phaseDescription(type: StudyPhaseType, _profile: NormalizedProfile): string {
    const descriptions: Record<StudyPhaseType, string> = {
      'diagnostic': 'Initial assessment to establish baseline performance across all skills',
      'foundation': 'Build fundamental vocabulary, grammar, and core techniques',
      'skill-building': 'Develop key skills for each IELTS section',
      'strategy-development': 'Learn test-taking strategies and approaches',
      'guided-practice': 'Practice with structured guidance and feedback',
      'timed-practice': 'Practice under timed conditions to build speed and accuracy',
      'mock-examination': 'Complete mock tests under exam conditions',
      'error-correction': 'Analyze and correct common mistakes',
      'final-review': 'Consolidate knowledge and review key concepts',
      'exam-readiness': 'Prepare mentally and logistically for exam day',
    };
    return descriptions[type] ?? type;
  }

  private phaseTargetSkills(type: StudyPhaseType, skillGaps: SkillGapScore[]): StudyTaskSkill[] {
    const sortedByGap = [...skillGaps]
      .filter(g => CORE_SKILLS.includes(g.skill))
      .sort((a, b) => b.bandGap - a.bandGap);

    switch (type) {
      case 'diagnostic':
        return CORE_SKILLS;
      case 'foundation':
        return ['vocabulary', 'grammar', ...CORE_SKILLS];
      case 'skill-building':
      case 'guided-practice':
        return sortedByGap.slice(0, 3).map(g => g.skill);
      case 'timed-practice':
      case 'mock-examination':
        return CORE_SKILLS;
      case 'error-correction':
        return sortedByGap.slice(0, 2).map(g => g.skill);
      case 'final-review':
      case 'exam-readiness':
        return CORE_SKILLS;
      default:
        return CORE_SKILLS;
    }
  }

  private estimatePhaseMinutes(start: LocalDate, end: LocalDate, profile: NormalizedProfile, _window: PlanningWindow): number {
    let total = 0;
    let current = start;
    while (isBeforeOrSame(current, end)) {
      const dow = getDayOfWeek(current);
      const dayAvail = profile.weeklyAvailability[dow];
      if (dayAvail.enabled) {
        const isUnavailable = profile.availabilityExceptions.some(e => e.date === current && e.type === 'unavailable');
        if (!isUnavailable) {
          total += dayAvail.availableMinutes;
        }
      }
      current = addDays(current, 1);
    }
    return total;
  }

  private getWeakestSkills(allocation: SkillAllocation): StudyTaskSkill[] {
    const entries = Object.entries(allocation) as [StudyTaskSkill, number][];
    const sorted = entries
      .filter(([skill]) => CORE_SKILLS.includes(skill))
      .sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return CORE_SKILLS;
    const maxVal = sorted[0][1];
    return sorted.filter(([, v]) => v === maxVal).map(([s]) => s);
  }

  private hashProfile(profile: NormalizedProfile): string {
    return `${profile.currentOverallBand}-${profile.targetOverallBand}-${profile.examDate}-${profile.planStartDate}`;
  }

  private issue(
    code: PlanValidationCode,
    severity: 'warning' | 'error',
    message: string,
    path?: string,
  ): PlanValidationIssue {
    return {
      code,
      severity,
      path,
      message,
      repairable: ['task-after-exam', 'task-on-exam-date', 'daily-capacity-exceeded', 'session-duration-exceeded', 'total-scheduled-exceeded'].includes(code),
    };
  }
}
