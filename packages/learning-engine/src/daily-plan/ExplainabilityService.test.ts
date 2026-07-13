import { describe, it, expect } from 'vitest';
import { ExplainabilityService } from './ExplainabilityService';
import type {
  NormalizedProfile,
  StudyPlan,
  StudyTask,
  PlanningWindow,
  PlanFeasibility,
  SkillGapScore,
  SkillAllocation,
  StudyPhase,
  StudyWeek,
  PlanGenerationMetadata,
  MissedTaskResolution,
} from './types';

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
    weeklyAvailability: {
      monday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      tuesday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      wednesday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      thursday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      friday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      saturday: { enabled: true, availableMinutes: 120, maximumSessionMinutes: 60, maximumSessions: 3 },
      sunday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
    },
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
    offlineOnlyMode: false,
    aiProviderAvailable: false,
    ...overrides,
  };
}

function createTask(overrides: Partial<StudyTask> = {}): StudyTask {
  return {
    id: 'task-1',
    roadmapId: 'plan-1',
    phaseId: 'phase-1',
    weekId: 'week-1',
    date: '2026-07-14',
    sessionOrder: 1,
    skill: 'writing',
    taskType: 'practice',
    title: 'Writing Task 2 Practice',
    description: 'Practice writing a Task 2 essay',
    objective: 'Improve essay structure',
    reason: 'Writing needs improvement',
    estimatedMinutes: 30,
    difficulty: 'medium',
    priority: 'high',
    sourceType: 'built-in',
    status: 'not-started',
    scheduledAt: '2026-07-13T00:00:00Z',
    metadata: { generationReason: 'Skill gap in writing' },
    ...overrides,
  };
}

function createPlan(overrides: Partial<StudyPlan> = {}): StudyPlan {
  const profile = createProfile();
  const metadata: PlanGenerationMetadata = {
    engineVersion: '1.0.0', schemaVersion: '1.0.0', generatedAt: '2026-07-13T00:00:00Z',
    generationReason: 'initial', profileSnapshotHash: '', settingsSnapshotHash: '',
    aiUsed: false, aiCallCount: 0, offlineFallbackUsed: false, validationWarnings: [],
  };
  const planningWindow: PlanningWindow = {
    startDate: '2026-07-14', examDate: '2026-10-12', finalStudyDate: '2026-10-12',
    totalCalendarDays: 90, totalAvailableStudyDays: 75,
    totalAvailableMinutes: 5400, reservedBufferMinutes: 540, schedulableMinutes: 4860,
  };
  const feasibility: PlanFeasibility = {
    status: 'comfortable', availableMinutes: 5400, recommendedMinutes: 4500,
    schedulableMinutes: 4860, deficitMinutes: 0, availableStudyDays: 75,
    warnings: [], suggestions: [],
  };
  const phases: StudyPhase[] = [{
    id: 'phase-1', type: 'skill-building', title: 'Skill Development',
    description: 'Build core writing and speaking skills',
    startDate: '2026-07-14', endDate: '2026-08-12',
    targetSkills: ['writing', 'speaking'], objectives: [],
    allocatedMinutes: 1800, scheduledMinutes: 0, order: 1, status: 'upcoming',
  }];
  const skillAllocation: SkillAllocation = {
    listening: 15, reading: 15, writing: 30, speaking: 25, vocabulary: 10, grammar: 5,
  };
  const tasks: StudyTask[] = [
    createTask({ id: 'task-1', date: '2026-07-14', skill: 'writing', priority: 'high' }),
    createTask({ id: 'task-2', date: '2026-07-14', skill: 'speaking', priority: 'high' }),
    createTask({ id: 'task-3', date: '2026-07-15', skill: 'reading', priority: 'normal' }),
  ];

  return {
    id: 'plan-1', version: 1, profile, planningWindow, feasibility, timeBudget: {
      totalAvailableMinutes: 5400, reservedBufferMinutes: 540, schedulableMinutes: 4860,
      newLearningMinutes: 1500, guidedPracticeMinutes: 1200, independentPracticeMinutes: 600,
      reviewMinutes: 500, vocabularyMinutes: 300, mistakeReviewMinutes: 200,
      timedPracticeMinutes: 300, mockTestMinutes: 200, mockAnalysisMinutes: 100,
      finalPreparationMinutes: 100,
    },
    skillAllocation, phases, weeks: [], tasks,     generationMetadata: metadata,
    createdAt: '2026-07-13T00:00:00Z', updatedAt: '2026-07-13T00:00:00Z',
    ...overrides,
  };
}

const skillGaps: SkillGapScore[] = [
  { skill: 'writing', bandGap: 2.0, priorityScore: 0.85, normalizedWeight: 0.3, reasons: ['Band gap of 2.0', 'User-declared weak skill'] },
  { skill: 'speaking', bandGap: 1.5, priorityScore: 0.65, normalizedWeight: 0.25, reasons: ['Band gap of 1.5'] },
  { skill: 'listening', bandGap: 1.0, priorityScore: 0.4, normalizedWeight: 0.15, reasons: ['Band gap of 1.0'] },
  { skill: 'reading', bandGap: 1.0, priorityScore: 0.3, normalizedWeight: 0.15, reasons: ['Band gap of 1.0'] },
  { skill: 'vocabulary', bandGap: 1.5, priorityScore: 0.2, normalizedWeight: 0.1, reasons: ['Supporting skill'] },
  { skill: 'grammar', bandGap: 1.5, priorityScore: 0.15, normalizedWeight: 0.05, reasons: ['Supporting skill'] },
];

describe('ExplainabilityService', () => {
  const service = new ExplainabilityService();

  describe('explainTaskSchedule', () => {
    it('returns explanation with reason and factors for a task', () => {
      const plan = createPlan();
      const task = createTask();
      const result = service.explainTaskSchedule(task, plan, skillGaps);

      expect(result.taskId).toBe('task-1');
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(10);
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('includes skill-gap factor when band gap is significant', () => {
      const plan = createPlan();
      const task = createTask({ skill: 'writing' });
      const result = service.explainTaskSchedule(task, plan, skillGaps);

      const skillGapFactor = result.factors.find(f => f.name === 'skill-gap');
      expect(skillGapFactor).toBeDefined();
      expect(skillGapFactor!.impact).toBe('positive');
    });

    it('identifies rescheduled tasks', () => {
      const plan = createPlan();
      const task = createTask({ rescheduledFromDate: '2026-07-10' });
      const result = service.explainTaskSchedule(task, plan, skillGaps);

      const rescheduledFactor = result.factors.find(f => f.name === 'rescheduled');
      expect(rescheduledFactor).toBeDefined();
      expect(rescheduledFactor!.description).toContain('2026-07-10');
    });

    it('identifies review tasks', () => {
      const plan = createPlan();
      const task = createTask({ reviewOfTaskId: 'original-task-1' });
      const result = service.explainTaskSchedule(task, plan, skillGaps);

      const reviewFactor = result.factors.find(f => f.name === 'spaced-review');
      expect(reviewFactor).toBeDefined();
    });
  });

  describe('explainPrioritization', () => {
    it('returns explanation with weighted factors', () => {
      const plan = createPlan();
      const task = createTask({ skill: 'writing', priority: 'high' });
      const result = service.explainPrioritization(task, plan, skillGaps);

      expect(result.taskId).toBe('task-1');
      expect(result.priority).toBe('high');
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.factors.some(f => f.weight > 0)).toBe(true);
    });

    it('includes exam-proximity factor when exam is within 14 days', () => {
      const plan = createPlan();
      plan.planningWindow.examDate = '2026-07-20';
      const task = createTask({ date: '2026-07-14' });
      const result = service.explainPrioritization(task, plan, skillGaps);

      const proximityFactor = result.factors.find(f => f.name === 'exam-proximity');
      expect(proximityFactor).toBeDefined();
    });

    it('explains standard priority when no special factors apply', () => {
      const plan = createPlan({ profile: createProfile({ weakSkills: [], strongSkills: [] }) });
      const task = createTask({ skill: 'vocabulary', priority: 'low', difficulty: 'easy' });
      const result = service.explainPrioritization(task, plan, []);

      expect(result.explanation).toBeTruthy();
    });
  });

  describe('explainAdaptation', () => {
    it('explains rescheduled adaptation', () => {
      const plan = createPlan();
      const resolution: MissedTaskResolution = {
        taskId: 'task-1', action: 'rescheduled',
        reason: 'Moved to next available date 2026-07-16 using buffer',
        affectedTaskIds: [],
      };
      const result = service.explainAdaptation(resolution, plan);

      expect(result.action).toBe('rescheduled');
      expect(result.summary).toContain('moved to a different date');
      expect(result.consequence).toBeTruthy();
    });

    it('explains dropped adaptation', () => {
      const plan = createPlan();
      const resolution: MissedTaskResolution = {
        taskId: 'task-1', action: 'dropped',
        reason: 'Low priority with insufficient future capacity',
        affectedTaskIds: [],
      };
      const result = service.explainAdaptation(resolution, plan);

      expect(result.action).toBe('dropped');
      expect(result.summary).toContain('removed');
    });

    it('explains split adaptation with affected tasks', () => {
      const plan = createPlan();
      const resolution: MissedTaskResolution = {
        taskId: 'task-1', action: 'split',
        reason: 'Split into two shorter tasks',
        affectedTaskIds: ['task-1a', 'task-1b'],
      };
      const result = service.explainAdaptation(resolution, plan);

      expect(result.action).toBe('split');
      expect(result.consequence).toContain('shorter sessions');
    });
  });

  describe('generatePlanExplanation', () => {
    it('returns PlanExplanation with overview and skill analysis', () => {
      const plan = createPlan();
      const result = service.generatePlanExplanation(plan);

      expect(result.overview.currentBand).toBe(5.5);
      expect(result.overview.targetBand).toBe(7.0);
      expect(result.overview.feasibility).toBe('comfortable');
      expect(result.skillAnalysis.weakestSkill).toBe('writing');
      expect(result.skillAnalysis.skillBreakdown.length).toBeGreaterThan(0);
      expect(result.phaseProgression.length).toBeGreaterThan(0);
      expect(result.weeksCount).toBe(0);
    });

    it('includes AI data when enrichResult is provided', () => {
      const plan = createPlan();
      plan.generationMetadata.aiUsed = true;
      const enrichResult = {
        profileAnalysis: {
          primaryWeaknesses: [{ skill: 'writing' as const, reason: 'Weak in coherence', confidence: 0.85 }],
          secondaryWeaknesses: ['speaking' as const],
          recommendedSequence: ['writing' as const, 'speaking' as const],
          recommendedTaskTypes: ['essay-practice'],
          risks: ['Time is limited for writing improvement'],
          learnerSummary: 'You need focused writing practice to improve coherence and task achievement.',
        },
        enrichedObjectives: [{ weekId: 'week-1', title: 'Writing Fundamentals', focus: 'Essay structure', objectives: ['Master thesis statements'], recommendedTaskTypes: [], pedagogicalReason: 'Build foundation' }],
        taskCandidates: [],
        generationPlan: { useAI: true, profileAnalysisRequired: true, weeklyObjectiveBatches: [], taskCandidateBatches: [], allowRepairCall: false, maximumCalls: 1, tokenBudget: 4000 },
        callStats: { attemptedCalls: 1, successfulCalls: 1, failedCalls: 0, totalTokensEstimated: 4000, cacheHits: 0 },
        fallbackUsed: false,
      };
      const result = service.generatePlanExplanation(plan, enrichResult);

      expect(result.personalization.aiUsed).toBe(true);
      expect(result.personalization.learnerSummary).toContain('coherence');
      expect(result.personalization.personalizedFeatures).toContain('ai-objectives');
    });

    it('includes data sources based on available profile data', () => {
      const profile = createProfile({
        recentMistakes: [{ id: 'm1', skill: 'writing', mistake: 'subject-verb agreement', frequency: 3, lastOccurrence: '2026-07-01' }],
        previousMockResults: [{ date: '2026-06-01', overall: 5.5 }],
        taskCompletionHistory: [{ taskId: 'old-task', status: 'completed', date: '2026-07-01' }],
      });
      const plan = createPlan({ profile });
      const result = service.generatePlanExplanation(plan);

      expect(result.personalization.dataUsed).toContain('mistake-history');
      expect(result.personalization.dataUsed).toContain('mock-results');
      expect(result.personalization.dataUsed).toContain('task-history');
    });
  });

  describe('summarizeAiUsage', () => {
    it('returns fallback message when AI was unavailable', () => {
      const enrichResult = {
        profileAnalysis: null,
        enrichedObjectives: [],
        taskCandidates: [],
        generationPlan: { useAI: false, profileAnalysisRequired: false, weeklyObjectiveBatches: [], taskCandidateBatches: [], allowRepairCall: false, maximumCalls: 0, tokenBudget: 0 },
        callStats: { attemptedCalls: 0, successfulCalls: 0, failedCalls: 0, totalTokensEstimated: 0, cacheHits: 0 },
        fallbackUsed: true,
      };
      const result = service.summarizeAiUsage(enrichResult);
      expect(result).toContain('AI was unavailable');
    });

    it('describes AI contributions when AI was used', () => {
      const enrichResult = {
        profileAnalysis: null,
        enrichedObjectives: [{ weekId: 'w1', title: 'Test', focus: 'Test', objectives: ['Obj'], recommendedTaskTypes: [], pedagogicalReason: 'test' }],
        taskCandidates: [{ candidateId: 'c1', targetWeekId: 'w1', skill: 'writing', taskType: 'practice', title: 'Test', description: '', objective: '', reason: '', recommendedMinutes: 30, difficulty: 'medium', priority: 'normal' }],
        generationPlan: { useAI: true, profileAnalysisRequired: false, weeklyObjectiveBatches: [], taskCandidateBatches: [], allowRepairCall: false, maximumCalls: 1, tokenBudget: 4000 },
        callStats: { attemptedCalls: 2, successfulCalls: 2, failedCalls: 0, totalTokensEstimated: 8000, cacheHits: 0 },
        fallbackUsed: false,
      };
      const result = service.summarizeAiUsage(enrichResult);
      expect(result).toContain('Weekly learning objectives');
      expect(result).toContain('personalized task suggestions');
      expect(result).toContain('2 successful calls');
    });

    it('returns deterministic message when no AI data is present', () => {
      const enrichResult = {
        profileAnalysis: null,
        enrichedObjectives: [],
        taskCandidates: [],
        generationPlan: { useAI: false, profileAnalysisRequired: false, weeklyObjectiveBatches: [], taskCandidateBatches: [], allowRepairCall: false, maximumCalls: 0, tokenBudget: 0 },
        callStats: { attemptedCalls: 0, successfulCalls: 0, failedCalls: 0, totalTokensEstimated: 0, cacheHits: 0 },
        fallbackUsed: false,
      };
      const result = service.summarizeAiUsage(enrichResult);
      expect(result).toContain('deterministic scheduling');
    });

    it('describes partial AI usage with only objectives', () => {
      const enrichResult = {
        profileAnalysis: null,
        enrichedObjectives: [{ weekId: 'w1', title: 'Week 1', focus: 'Writing', objectives: ['Obj1'], recommendedTaskTypes: [], pedagogicalReason: 'test' }],
        taskCandidates: [],
        generationPlan: { useAI: true, profileAnalysisRequired: false, weeklyObjectiveBatches: [], taskCandidateBatches: [], allowRepairCall: false, maximumCalls: 1, tokenBudget: 4000 },
        callStats: { attemptedCalls: 1, successfulCalls: 1, failedCalls: 0, totalTokensEstimated: 4000, cacheHits: 0 },
        fallbackUsed: false,
      };
      const result = service.summarizeAiUsage(enrichResult);
      expect(result).toContain('Weekly learning objectives');
      expect(result).not.toContain('personalized task suggestions');
    });

    it('describes partial AI usage with only task candidates', () => {
      const enrichResult = {
        profileAnalysis: null,
        enrichedObjectives: [],
        taskCandidates: [{ candidateId: 'c1', targetWeekId: 'w1', skill: 'writing', taskType: 'practice', title: 'Test', description: '', objective: '', reason: '', recommendedMinutes: 30, difficulty: 'medium', priority: 'normal' }],
        generationPlan: { useAI: true, profileAnalysisRequired: false, weeklyObjectiveBatches: [], taskCandidateBatches: [], allowRepairCall: false, maximumCalls: 1, tokenBudget: 4000 },
        callStats: { attemptedCalls: 1, successfulCalls: 1, failedCalls: 0, totalTokensEstimated: 4000, cacheHits: 0 },
        fallbackUsed: false,
      };
      const result = service.summarizeAiUsage(enrichResult);
      expect(result).toContain('personalized task suggestions');
    });
  });

  describe('explainTaskSchedule additional scenarios', () => {
    it('explains low-priority task with default reason', () => {
      const plan = createPlan();
      const task = createTask({ priority: 'low', skill: 'vocabulary' });
      const result = service.explainTaskSchedule(task, plan, []);

      expect(result.taskId).toBe('task-1');
      expect(result.reason).toBeTruthy();
      expect(result.reason).toContain('2026-07-14');
    });

    it('mentions daily capacity in factors', () => {
      const plan = createPlan();
      const task = createTask();
      const result = service.explainTaskSchedule(task, plan, skillGaps);

      const capacityFactor = result.factors.find(f => f.name === 'daily-capacity');
      expect(capacityFactor).toBeDefined();
      expect(capacityFactor!.impact).toBe('positive');
    });
  });

  describe('explainPrioritization additional scenarios', () => {
    it('explains critical priority task', () => {
      const plan = createPlan();
      plan.planningWindow.examDate = '2026-07-20';
      const task = createTask({ priority: 'critical', date: '2026-07-14' });
      const result = service.explainPrioritization(task, plan, skillGaps);

      expect(result.priority).toBe('critical');
      expect(result.factors.some(f => f.name === 'exam-proximity')).toBe(true);
    });

    it('handles no skill gaps gracefully', () => {
      const plan = createPlan();
      const task = createTask({ skill: 'grammar', priority: 'normal' });
      const result = service.explainPrioritization(task, plan, []);

      expect(result.explanation).toBeTruthy();
    });

    it('includes review factor for review tasks', () => {
      const plan = createPlan();
      const task = createTask({ reviewOfTaskId: 'original-1' });
      const result = service.explainPrioritization(task, plan, skillGaps);

      const reviewFactor = result.factors.find(f => f.name === 'review');
      expect(reviewFactor).toBeDefined();
    });
  });

  describe('explainAdaptation additional scenarios', () => {
    it('explains replaced adaptation', () => {
      const plan = createPlan();
      const resolution = {
        taskId: 'task-1', action: 'replaced' as const,
        reason: 'Replaced with more suitable task',
        affectedTaskIds: ['task-1b'],
      };
      const result = service.explainAdaptation(resolution, plan);

      expect(result.action).toBe('replaced');
      expect(result.summary).toContain('replaced');
      expect(result.consequence).toBeTruthy();
    });

    it('explains merged adaptation', () => {
      const plan = createPlan();
      const resolution = {
        taskId: 'task-1', action: 'merged' as const,
        reason: 'Combined with similar vocabulary task',
        affectedTaskIds: ['task-1b'],
      };
      const result = service.explainAdaptation(resolution, plan);

      expect(result.action).toBe('merged');
      expect(result.summary).toContain('combined');
    });

    it('explains requires-user-action adaptation', () => {
      const plan = createPlan();
      const resolution = {
        taskId: 'task-1', action: 'requires-user-action' as const,
        reason: 'No suitable date available, user needs to adjust schedule',
        affectedTaskIds: [],
      };
      const result = service.explainAdaptation(resolution, plan);

      expect(result.action).toBe('requires-user-action');
      expect(result.consequence).toBeTruthy();
    });
  });

  describe('generatePlanExplanation additional scenarios', () => {
    it('generates explanation with no AI data and no weak skills', () => {
      const profile = createProfile({
        weakSkills: [],
        strongSkills: [],
      });
      const plan = createPlan({ profile });
      plan.generationMetadata.aiUsed = false;
      const result = service.generatePlanExplanation(plan);

      expect(result.personalization.aiUsed).toBe(false);
      expect(result.personalization.learnerSummary).toContain('skill bands');
      expect(result.personalization.personalizedFeatures).toContain('deterministic-allocation');
    });

    it('includes accuracy-based allocation when exercise accuracy is available', () => {
      const profile = createProfile({
        exerciseAccuracy: { listening: 0.8, reading: 0.7, writing: 0.4, speaking: 0.5 },
      });
      const plan = createPlan({ profile });
      const result = service.generatePlanExplanation(plan);

      expect(result.personalization.personalizedFeatures).toContain('accuracy-based-allocation');
    });
  });
});
