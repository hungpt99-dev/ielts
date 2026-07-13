import type {
  NormalizedProfile,
  StudyPlan,
  StudyTask,
  PlanFeasibility,
  SkillGapScore,
  PlanExplanation,
  MissedTaskResolution,
  LocalDate,
} from './types';
import type { EnrichPlanResult, AIProfileAnalysis } from './AiPlanOrchestrator';

export interface TaskScheduleExplanation {
  taskId: string;
  title: string;
  date: LocalDate;
  reason: string;
  factors: ScheduleFactor[];
}

export interface ScheduleFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface PrioritizationExplanation {
  taskId: string;
  title: string;
  priority: string;
  explanation: string;
  factors: Array<{ name: string; weight: number; description: string }>;
}

export interface AdaptationExplanation {
  action: string;
  reason: string;
  summary: string;
  consequence: string;
}

export interface ExplainabilityContext {
  profile: NormalizedProfile;
  plan: StudyPlan;
  enrichResult?: EnrichPlanResult | null;
}

export class ExplainabilityService {
  explainTaskSchedule(
    task: StudyTask,
    plan: StudyPlan,
    skillGaps: SkillGapScore[],
  ): TaskScheduleExplanation {
    const factors: ScheduleFactor[] = [];

    const skillAlloc = plan.skillAllocation;
    if (skillAlloc) {
      const allocPercent = skillAlloc[task.skill as keyof typeof skillAlloc] ?? 0;
      if (allocPercent > 25) {
        factors.push({
          name: 'skill-allocation',
          impact: 'positive',
          description: `${task.skill} receives ${allocPercent}% of study time due to its importance`,
        });
      }
    }

    const skillGap = skillGaps.find(g => g.skill === task.skill);
    if (skillGap && skillGap.bandGap > 0.5) {
      factors.push({
        name: 'skill-gap',
        impact: 'positive',
        description: `Band gap of ${skillGap.bandGap.toFixed(1)} in ${task.skill} requires focused practice`,
      });
    }

    const weak = plan.profile.weakSkills.includes(task.skill);
    if (weak) {
      factors.push({
        name: 'user-priority',
        impact: 'positive',
        description: `You identified ${task.skill} as a skill you want to improve`,
      });
    }

    const dayTasks = plan.tasks.filter(t => t.date === task.date && t.id !== task.id);
    const totalDayMinutes = dayTasks.reduce((s, t) => s + t.estimatedMinutes, 0) + task.estimatedMinutes;
    factors.push({
      name: 'daily-capacity',
      impact: totalDayMinutes <= this.getDayCapacity(plan, task.date) ? 'positive' : 'negative',
      description: `Total ${totalDayMinutes}m fits within the day's available capacity`,
    });

    if (task.rescheduledFromDate) {
      factors.push({
        name: 'rescheduled',
        impact: 'neutral',
        description: `Rescheduled from ${task.rescheduledFromDate} due to adaptation`,
      });
    }

    if (task.reviewOfTaskId) {
      factors.push({
        name: 'spaced-review',
        impact: 'positive',
        description: 'Scheduled as a review to reinforce previous learning',
      });
    }

    const reason = this.buildScheduleReason(task, factors, skillGaps);
    return { taskId: task.id, title: task.title, date: task.date, reason, factors };
  }

  explainPrioritization(
    task: StudyTask,
    plan: StudyPlan,
    skillGaps: SkillGapScore[],
  ): PrioritizationExplanation {
    const factors: Array<{ name: string; weight: number; description: string }> = [];

    const skillGap = skillGaps.find(g => g.skill === task.skill);
    if (skillGap) {
      factors.push({
        name: 'skill-gap',
        weight: Math.round(skillGap.priorityScore * 100),
        description: `${task.skill} has a gap of ${skillGap.bandGap.toFixed(1)} bands`,
      });
    }

    const isWeak = plan.profile.weakSkills.includes(task.skill);
    if (isWeak) {
      factors.push({
        name: 'declared-weakness',
        weight: 80,
        description: `${task.skill} is listed as a skill you want to strengthen`,
      });
    }

    if (task.difficulty === 'hard') {
      factors.push({
        name: 'difficulty',
        weight: 30,
        description: 'Hard tasks get priority to ensure sufficient practice time',
      });
    }

    if (task.priority === 'high' || task.priority === 'critical') {
      factors.push({
        name: 'task-priority',
        weight: 50,
        description: 'Marked as high priority due to its importance in your learning path',
      });
    }

    if (task.reviewOfTaskId) {
      factors.push({
        name: 'review',
        weight: 40,
        description: 'Review tasks reinforce previously covered material',
      });
    }

    const daysUntilExam = this.daysBetween(task.date, plan.planningWindow.examDate);
    if (daysUntilExam <= 14) {
      factors.push({
        name: 'exam-proximity',
        weight: 60,
        description: `Only ${daysUntilExam} days until the exam — focused revision is prioritized`,
      });
    }

    const explanation = this.buildPrioritizationExplanation(task, factors);
    return { taskId: task.id, title: task.title, priority: task.priority, explanation, factors };
  }

  explainAdaptation(resolution: MissedTaskResolution, plan: StudyPlan): AdaptationExplanation {
    const actionLabels: Record<string, string> = {
      rescheduled: 'moved to a different date',
      split: 'split into smaller tasks',
      replaced: 'replaced with an alternative task',
      merged: 'combined with another task',
      dropped: 'removed from the plan',
    };

    const actionDescriptions: Record<string, string> = {
      rescheduled: 'The task was moved to a later date when you have available capacity.',
      split: 'The task was divided into shorter sessions that better fit your available time.',
      replaced: 'The original task was replaced with a more suitable alternative.',
      merged: 'This task was combined with another related task to keep your schedule manageable.',
      dropped: 'The task was removed to focus your time on higher-priority work.',
    };

    const action = actionLabels[resolution.action] ?? resolution.action;
    const consequence = this.buildAdaptationConsequence(resolution, plan);

    return {
      action: resolution.action,
      reason: resolution.reason,
      summary: `This task was ${action}: ${resolution.reason}`,
      consequence,
    };
  }

  generatePlanExplanation(
    plan: StudyPlan,
    enrichResult?: EnrichPlanResult | null,
  ): PlanExplanation {
    const profile = plan.profile;
    const feasibility = plan.feasibility;
    const skillGaps = this.extractSkillGaps(plan);

    const primaryWeakness = profile.weakSkills[0] ?? skillGaps[0]?.skill ?? 'writing';
    const aiAnalysis: AIProfileAnalysis | null = enrichResult?.profileAnalysis ?? null;

    const skillBreakdown = skillGaps
      .filter(g => ['listening', 'reading', 'writing', 'speaking'].includes(g.skill))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 4)
      .map(g => ({
        skill: g.skill,
        bandGap: g.bandGap,
        priority: g.priorityScore,
        reasons: g.reasons,
      }));

    const phases = plan.phases.map(p => ({
      type: p.type,
      title: p.title,
      duration: `${p.startDate} to ${p.endDate}`,
      focus: p.description,
    }));

    const dataUsed: string[] = ['skill-band-scores', 'exam-type', 'planning-window'];
    if (profile.recentMistakes.length > 0) dataUsed.push('mistake-history');
    if (profile.previousMockResults.length > 0) dataUsed.push('mock-results');
    if (profile.taskCompletionHistory.length > 0) dataUsed.push('task-history');

    const personalizedFeatures: string[] = [];
    if (profile.weakSkills.length > 0) personalizedFeatures.push('weakness-targeting');
    if (enrichResult?.enrichedObjectives.length) personalizedFeatures.push('ai-objectives');
    if (enrichResult?.taskCandidates.length) personalizedFeatures.push('ai-task-suggestions');
    if (Object.keys(profile.exerciseAccuracy ?? {}).length > 0) personalizedFeatures.push('accuracy-based-allocation');
    if (personalizedFeatures.length === 0) personalizedFeatures.push('deterministic-allocation');

    return {
      overview: {
        currentBand: profile.currentOverallBand,
        targetBand: profile.targetOverallBand,
        examDate: plan.planningWindow.examDate,
        daysRemaining: plan.planningWindow.totalCalendarDays,
        studyDays: plan.planningWindow.totalAvailableStudyDays,
        totalAvailableHours: Math.round((plan.planningWindow.totalAvailableMinutes / 60) * 10) / 10,
        totalScheduledHours: Math.round((plan.planningWindow.schedulableMinutes / 60) * 10) / 10,
        feasibility: feasibility.status,
      },
      skillAnalysis: {
        weakestSkill: primaryWeakness,
        skillBreakdown,
        allocation: skillGaps.reduce((acc, g) => {
          if (g.skill in plan.skillAllocation) {
            acc[g.skill] = plan.skillAllocation[g.skill as keyof typeof plan.skillAllocation] ?? 0;
          } else {
            acc[g.skill] = g.normalizedWeight;
          }
          return acc;
        }, {} as Record<string, number>),
      },
      phaseProgression: phases,
      weeksCount: plan.weeks.length,
      personalization: {
        aiUsed: plan.generationMetadata.aiUsed || !!aiAnalysis,
        personalizedFeatures,
        learnerSummary: aiAnalysis?.learnerSummary ?? 'Plan generated from your skill bands, availability, and target score.',
        dataUsed,
      },
      feasibilitySummary: {
        status: feasibility.status,
        warnings: feasibility.warnings.map(w => w.message),
        suggestions: feasibility.suggestions.map(s => s.description),
      },
    };
  }

  summarizeAiUsage(enrichResult: EnrichPlanResult): string {
    const { profileAnalysis, enrichedObjectives, taskCandidates, callStats, fallbackUsed } = enrichResult;

    if (fallbackUsed) {
      return 'AI was unavailable or offline. Your plan was generated using built-in IELTS learning templates. Connect an AI provider to receive more personalized task descriptions.';
    }

    const parts: string[] = [];
    if (profileAnalysis) {
      parts.push('Your skill profile was analyzed to identify your strongest areas and improvement opportunities.');
    }
    if (enrichedObjectives.length > 0) {
      parts.push(`Weekly learning objectives (${enrichedObjectives.length} weeks) were personalized to focus on your target skills.`);
    }
    if (taskCandidates.length > 0) {
      parts.push(`${taskCandidates.length} personalized task suggestions were generated based on your learning needs.`);
    }

    if (callStats && (callStats.successfulCalls > 0 || callStats.cacheHits > 0)) {
      parts.push(`AI contributed ${callStats.successfulCalls} successful call${callStats.successfulCalls !== 1 ? 's' : ''} with ${callStats.cacheHits} cache hit${callStats.cacheHits !== 1 ? 's' : ''}.`);
    }

    if (parts.length === 0) {
      return 'Your plan was generated using deterministic scheduling based on your available time and target score.';
    }

    return parts.join(' ');
  }

  // ── Private Helpers ──

  private buildScheduleReason(task: StudyTask, factors: ScheduleFactor[], skillGaps: SkillGapScore[]): string {
    const positive = factors.filter(f => f.impact === 'positive').map(f => f.description);
    const skillGap = skillGaps.find(g => g.skill === task.skill);

    if (skillGap && skillGap.bandGap > 0.5) {
      return `This ${task.skill} task is scheduled here because ${task.skill} is one of your focus areas with a band gap of ${skillGap.bandGap.toFixed(1)}. ${positive.length > 0 ? positive.join('. ') : ''}`;
    }

    if (task.reviewOfTaskId) {
      return `This review task is scheduled at this point to reinforce previously covered material at the optimal interval for retention.`;
    }

    if (task.rescheduledFromDate) {
      return `This task was moved from ${task.rescheduledFromDate} to this date due to schedule changes. ${positive.length > 0 ? positive.join('. ') : ''}`;
    }

    return `This task was placed on ${task.date} based on your available study time and skill priorities.`;
  }

  private buildPrioritizationExplanation(
    task: StudyTask,
    factors: Array<{ name: string; weight: number; description: string }>,
  ): string {
    const sorted = [...factors].sort((a, b) => b.weight - a.weight);
    const top = sorted.slice(0, 3);

    if (top.length === 0) {
      return `${task.title} has standard priority within your study plan.`;
    }

    const reasons = top.map(f => f.description);
    return `${task.title} is prioritized because: ${reasons.join('; ')}.`;
  }

  private buildAdaptationConsequence(resolution: MissedTaskResolution, plan: StudyPlan): string {
    const affected = resolution.affectedTaskIds;
    const affectedTasks = affected.length > 0
      ? plan.tasks.filter(t => affected.includes(t.id))
      : [];

    if (resolution.action === 'dropped') {
      return `This task was removed from the plan, freeing approximately ${affectedTasks.length > 0 ? 'related' : ''} study time for higher-priority work.`;
    }
    if (resolution.action === 'rescheduled') {
      return `The task was moved to a date with available capacity. Your overall workload is preserved.`;
    }
    if (resolution.action === 'split') {
      return `The task was divided into ${affectedTasks.length} shorter sessions. Each part covers a focused portion of the original material.`;
    }
    if (resolution.action === 'merged') {
      return `This task was combined with another related task to maintain a manageable daily schedule.`;
    }
    return 'The plan was adjusted to accommodate this change.';
  }

  private extractSkillGaps(plan: StudyPlan): SkillGapScore[] {
    const profile = plan.profile;
    const skills = ['listening', 'reading', 'writing', 'speaking', 'vocabulary', 'grammar'] as const;

    return skills.map(skill => {
      const current = profile.currentSkillBands[skill as keyof typeof profile.currentSkillBands] ?? 0;
      const target = profile.targetSkillBands[skill as keyof typeof profile.targetSkillBands] ?? profile.targetOverallBand;
      const bandGap = Math.max(0, target - current);
      const isWeak = profile.weakSkills.includes(skill);
      const reasons: string[] = [];
      if (bandGap > 0.5) reasons.push(`Band gap of ${bandGap.toFixed(1)}`);
      if (isWeak) reasons.push('User-declared weak skill');

      return { skill, bandGap, priorityScore: bandGap > 0 ? bandGap / 9 : 0.1, normalizedWeight: 0, reasons };
    });
  }

  private daysBetween(a: LocalDate, b: LocalDate): number {
    const parse = (d: LocalDate) => {
      const [y, m, day] = d.split('-').map(Number);
      return new Date(y, m - 1, day);
    };
    const diff = parse(b).getTime() - parse(a).getTime();
    return Math.round(diff / 86400000);
  }

  private getDayCapacity(plan: StudyPlan, date: LocalDate): number {
    const dayOfWeek = this.getDayOfWeek(date);
    const dayAvail = plan.profile.weeklyAvailability[dayOfWeek];
    if (!dayAvail || !dayAvail.enabled) return 0;
    const override = plan.profile.availabilityExceptions.find(
      e => e.date === date && e.type === 'custom-capacity',
    );
    return override?.availableMinutes ?? dayAvail.availableMinutes;
  }

  private getDayOfWeek(date: LocalDate): string {
    const [y, m, day] = date.split('-').map(Number);
    const d = new Date(y, m - 1, day);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[d.getDay()];
  }
}
