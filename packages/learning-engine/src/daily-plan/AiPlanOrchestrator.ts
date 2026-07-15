import { z } from 'zod';
import type {
  NormalizedProfile,
  PlanningWindow,
  StudyPhase,
  StudyWeek,
  AIProfileAnalysis,
  AIWeeklyObjective,
  AITaskCandidate,
  AIGenerationPlan,
  AICallLimits,
  AIWeekBatch,
  AITaskBatch,
  PlanExplanation,
  PlanFeasibility,
  SkillGapScore,
} from './types';

// ── Zod Schemas for AI Output Validation ──

const studyTaskSkillSchema = z.enum([
  'listening', 'reading', 'writing', 'speaking',
  'vocabulary', 'grammar', 'review', 'mock-test', 'exam-preparation',
]);

const difficultySchema = z.enum(['easy', 'medium', 'hard']);
const prioritySchema = z.enum(['low', 'normal', 'high']);

const phaseStageSchema = z.enum([
  'foundation', 'skill-development', 'guided-practice', 'accuracy',
  'performance', 'consistency', 'target-readiness', 'exam-readiness',
]);

const officialBandSchema = z.number().refine(
  v => [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].includes(v),
  { message: 'Official IELTS bands must be whole or half-band values (0, 1, 1.5, 2, ..., 9)' },
);



const PrimaryWeaknessSchema = z.object({
  skill: studyTaskSkillSchema,
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const AIPhaseSchema = z.object({
  order: z.number().int().min(1),
  stage: phaseStageSchema,
  title: z.string().min(1).max(150),
  summary: z.string().min(1).max(300),
  officialBandGoal: officialBandSchema,
  focusSkills: z.array(studyTaskSkillSchema).min(1).max(6),
  objectives: z.array(z.string().min(1)).min(1).max(5),
  completionCriteria: z.array(z.string().min(1)).min(1).max(5),
});

export const AIPhaseArraySchema = z.array(AIPhaseSchema).min(2).max(12);

export const AIProfileAnalysisSchema = z.object({
  primaryWeaknesses: z.array(PrimaryWeaknessSchema).min(1).max(4),
  secondaryWeaknesses: z.array(studyTaskSkillSchema).max(4),
  recommendedSequence: z.array(studyTaskSkillSchema).min(1).max(4),
  recommendedTaskTypes: z.array(z.string()).min(1).max(10),
  risks: z.array(z.string()).max(5),
  learnerSummary: z.string().min(1).max(500),
});

export const AIWeeklyObjectiveSchema = z.object({
  weekId: z.string().min(1),
  title: z.string().min(1).max(100),
  focus: z.string().min(1).max(200),
  objectives: z.array(z.string().min(1)).min(1).max(5),
  recommendedTaskTypes: z.array(z.string()).max(10),
  pedagogicalReason: z.string().min(1).max(300),
});

export const AITaskCandidateSchema = z.object({
  candidateId: z.string().min(1),
  targetWeekId: z.string().min(1),
  skill: studyTaskSkillSchema,
  taskType: z.string().min(1),
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(500),
  objective: z.string().min(1).max(300),
  reason: z.string().min(1).max(300),
  recommendedMinutes: z.number().int().min(10).max(120),
  difficulty: difficultySchema,
  priority: prioritySchema,
  prerequisites: z.array(z.string()).max(5).optional(),
  suggestedSourceTypes: z.array(z.enum([
    'built-in', 'saved-content', 'saved-vocabulary',
    'user-mistakes', 'ai-generated', 'manual',
  ])).max(3).optional(),
  relevantSourceIds: z.array(z.string()).max(10).optional(),
});

// ── Types ──

export type AICallFn = (
  systemPrompt: string,
  userPrompt: string,
) => Promise<string | null>;

export type EnrichProgressPhase = 'profile-analysis' | 'weekly-objectives' | 'task-candidates' | 'complete'

export interface AiPlanOrchestratorConfig {
  callLimits?: Partial<AICallLimits>;
  enableCache?: boolean;
  cacheTtlMs?: number;
  onProgress?: (phase: EnrichProgressPhase, current: number, total: number) => void;
}

export interface EnrichPlanParams {
  profile: NormalizedProfile;
  planningWindow: PlanningWindow;
  phases: StudyPhase[];
  weeks: StudyWeek[];
  feasibility: PlanFeasibility;
  skillGaps: SkillGapScore[];
  signal?: AbortSignal;
}

export interface EnrichPlanResult {
  profileAnalysis: AIProfileAnalysis | null;
  enrichedObjectives: AIWeeklyObjective[];
  taskCandidates: AITaskCandidate[];
  generationPlan: AIGenerationPlan;
  callStats: AiCallStats;
  fallbackUsed: boolean;
  completeness: EnrichmentCompletenessReport;
  requirements: EnrichmentRequirement[];
}

export interface ExplainabilityContext {
  profile: NormalizedProfile;
  planningWindow: PlanningWindow;
  phases: StudyPhase[];
  weeks: StudyWeek[];
  feasibility: PlanFeasibility;
  skillGaps: SkillGapScore[];
  profileAnalysis: AIProfileAnalysis | null;
  enrichedObjectives: AIWeeklyObjective[];
}

// ── Domain Errors ──

export class AiGenerationPlanTooLargeError extends Error {
  public readonly requiredCalls: number;
  public readonly hardCallLimit: number;
  public readonly profileAnalysisCalls: number;
  public readonly objectiveBatchCalls: number;
  public readonly taskCandidateBatchCalls: number;

  constructor(details: {
    requiredCalls: number;
    hardCallLimit: number;
    profileAnalysisCalls: number;
    objectiveBatchCalls: number;
    taskCandidateBatchCalls: number;
  }) {
    super(
      `AI generation plan too large: ${details.requiredCalls} required calls exceeds hard limit of ${details.hardCallLimit}`,
    );
    this.name = 'AiGenerationPlanTooLargeError';
    this.requiredCalls = details.requiredCalls;
    this.hardCallLimit = details.hardCallLimit;
    this.profileAnalysisCalls = details.profileAnalysisCalls;
    this.objectiveBatchCalls = details.objectiveBatchCalls;
    this.taskCandidateBatchCalls = details.taskCandidateBatchCalls;
  }
}

export class IncompletePlanEnrichmentError extends Error {
  public readonly missingRequirements: Array<{ requirementId: string; expectedCount: number; generatedCount: number }>;
  public readonly expectedItemCount: number;
  public readonly generatedItemCount: number;
  public readonly repairCallsAttempted: number;
  public readonly repairBudget: number;

  constructor(details: {
    missingRequirements: Array<{ requirementId: string; expectedCount: number; generatedCount: number }>;
    expectedItemCount: number;
    generatedItemCount: number;
    repairCallsAttempted: number;
    repairBudget: number;
  }) {
    super(
      `Plan enrichment incomplete: ${details.missingRequirements.length} requirements still missing after ${details.repairCallsAttempted} repair calls`,
    );
    this.name = 'IncompletePlanEnrichmentError';
    this.missingRequirements = details.missingRequirements;
    this.expectedItemCount = details.expectedItemCount;
    this.generatedItemCount = details.generatedItemCount;
    this.repairCallsAttempted = details.repairCallsAttempted;
    this.repairBudget = details.repairBudget;
  }
}

// ── Domain Helpers ──

import type { AiGenerationCallBudget, AiCallStats, EnrichmentRequirement, EnrichmentCoverage, EnrichmentCompletenessReport } from './types';

export function calculateAiGenerationCallBudget(input: {
  profileAnalysisRequired: boolean;
  objectiveBatchCount: number;
  taskCandidateBatchCount: number;
  maxRepairCalls: number;
  hardCallLimit: number;
}): AiGenerationCallBudget {
  const profileAnalysisCalls = input.profileAnalysisRequired ? 1 : 0;
  const objectiveBatchCalls = input.objectiveBatchCount;
  const taskCandidateBatchCalls = input.taskCandidateBatchCount;
  const requiredCalls = profileAnalysisCalls + objectiveBatchCalls + taskCandidateBatchCalls;
  const repairBudget = Math.max(0, input.maxRepairCalls);
  const maximumCalls = Math.min(requiredCalls + repairBudget, input.hardCallLimit);

  return {
    profileAnalysisCalls,
    objectiveBatchCalls,
    taskCandidateBatchCalls,
    requiredCalls,
    repairBudget,
    maximumCalls,
    hardCallLimit: input.hardCallLimit,
  };
}

export function calculateEnrichmentCoverage(
  requirements: EnrichmentRequirement[],
  getGeneratedCount: (requirementId: string) => number,
): EnrichmentCoverage[] {
  return requirements.map(req => {
    const generatedCount = getGeneratedCount(req.requirementId);
    const missingCount = Math.max(0, req.expectedCount - generatedCount);
    return {
      requirementId: req.requirementId,
      expectedCount: req.expectedCount,
      generatedCount,
      missingCount,
      complete: missingCount === 0,
    };
  });
}

export function mergeAndDeduplicate<T extends { candidateId?: string; title?: string; recommendedMinutes?: number }>(
  newItems: T[],
  existingItems: T[],
  getRequirementId: (item: T) => string,
): { merged: T[]; duplicatesDiscarded: number } {
  const existingSignatures = new Set<string>();
  for (const item of existingItems) {
    existingSignatures.add(makeContentSignature(item, getRequirementId(item)));
  }

  let duplicatesDiscarded = 0;
  const merged = [...existingItems];

  for (const item of newItems) {
    const sig = makeContentSignature(item, getRequirementId(item));
    if (existingSignatures.has(sig)) {
      duplicatesDiscarded++;
    } else {
      existingSignatures.add(sig);
      merged.push(item);
    }
  }

  return { merged, duplicatesDiscarded };
}

function makeContentSignature(item: { candidateId?: string; title?: string; recommendedMinutes?: number }, requirementId: string): string {
  const title = (item.title ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  return [requirementId, title, item.recommendedMinutes ?? 0].join('|');
}

export function buildEnrichmentRequirements(phases: StudyPhase[], taskBatches: import('./types').AITaskBatch[]): EnrichmentRequirement[] {
  const requirements: EnrichmentRequirement[] = [];

  for (const batch of taskBatches) {
    const phase = phases.find(p => p.id === batch.phaseId);
    if (!phase) continue;
    for (const weekId of batch.weekIds) {
      for (const skill of phase.targetSkills.length > 0 ? phase.targetSkills : ['listening', 'reading', 'writing', 'speaking']) {
        const requirementId = `${batch.phaseId}:${weekId}:${skill}`;
        requirements.push({
          requirementId,
          phaseId: batch.phaseId,
          weekId,
          skill,
          itemType: 'task-candidate',
          expectedCount: Math.max(1, Math.ceil(batch.requiredCount / Math.max(1, batch.weekIds.length * Math.max(1, phase.targetSkills.length)))),
        });
      }
    }
  }

  return requirements;
}

export function createCompletenessReport(
  requirements: EnrichmentRequirement[],
  coverage: EnrichmentCoverage[],
  totalItems: number,
  aiGeneratedItems: number,
  repairedItems: number,
  fallbackItems: number,
  duplicatesDiscarded: number,
): EnrichmentCompletenessReport {
  const missing = coverage.filter(c => !c.complete);
  return {
    expectedItems: requirements.reduce((s, r) => s + r.expectedCount, 0),
    generatedItems: totalItems,
    aiGeneratedItems,
    repairedItems,
    fallbackItems,
    duplicateItemsDiscarded: duplicatesDiscarded,
    missingItems: missing.reduce((s, c) => s + c.missingCount, 0),
    missingRequirementIds: missing.map(c => c.requirementId),
    complete: missing.length === 0,
  };
}

// ── Default Limits ──

const DEFAULT_CALL_LIMITS: AICallLimits = {
  maximumCallsPerGeneration: 5,
  maximumRepairCalls: 1,
  maximumTokensPerGeneration: 32000,
  maximumCandidatesPerBatch: 15,
  maximumWeeksPerBatch: 6,
  requestTimeoutMs: 30000,
};

const DEFAULT_WEEKS_PER_OBJECTIVE_BATCH = 5;
const ALLOWED_DURATIONS = [10, 15, 20, 30, 45, 60, 90];

// ── Cache ──

class AiCache<T = unknown> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs = 60 * 60 * 1000) {
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ── Orchestrator ──

export class AiPlanOrchestrator {
  private readonly limits: AICallLimits;
  private readonly cache: AiCache<string>;
  private readonly callAI: AICallFn;
  private readonly config: AiPlanOrchestratorConfig;

  constructor(
    callAI: AICallFn,
    config: AiPlanOrchestratorConfig = {},
  ) {
    this.callAI = callAI;
    this.config = config;
    this.limits = { ...DEFAULT_CALL_LIMITS, ...config.callLimits };
    this.cache = config.enableCache !== false
      ? new AiCache<string>(config.cacheTtlMs)
      : new AiCache<string>(0);
  }

  async enrichPlan(params: EnrichPlanParams): Promise<EnrichPlanResult> {
    const { profile, planningWindow, phases, weeks, skillGaps, signal } = params;

    if (signal?.aborted) {
      return this.emptyResult(0, true);
    }

    const aiAvailable = profile.aiProviderAvailable && !profile.offlineOnlyMode;
    const generationPlan = this.buildAiGenerationPlan(weeks, phases);

    console.log('[AiOrchestrator] aiAvailable:', aiAvailable, 'useAI:', generationPlan.useAI, 'batches:', generationPlan.taskCandidateBatches.length, 'profile.aiProviderAvailable:', profile.aiProviderAvailable, 'offlineOnly:', profile.offlineOnlyMode)
    if (!generationPlan.useAI || !aiAvailable) {
      console.log('[AiOrchestrator] Early return - useAI:', generationPlan.useAI, 'aiAvailable:', aiAvailable)
      return this.emptyResult(0, true);
    }

    console.log('[AiOrchestrator] Call budget:', JSON.stringify(generationPlan.callBudget))

    const callStats: AiCallStats = {
      requiredCallsAttempted: 0,
      repairCallsAttempted: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalAttemptedCalls: 0,
      cacheHits: 0,
      totalTokensEstimated: 0,
    };
    let fallbackUsed = false;
    let aiGeneratedItems = 0;
    let repairedItems = 0;
    let fallbackItems = 0;
    let duplicatesDiscarded = 0;

    const totalBatches = generationPlan.weeklyObjectiveBatches.length + generationPlan.taskCandidateBatches.length
    let completedBatches = 0

    const reportProgress = (phase: EnrichProgressPhase) => {
      this.config.onProgress?.(phase, completedBatches, totalBatches)
    }

    // ── First Pass: Required Work (no retries) ──

    // Step 1: Optional profile analysis
    let profileAnalysis: AIProfileAnalysis | null = null;
    if (generationPlan.profileAnalysisRequired) {
      callStats.requiredCallsAttempted++;
      callStats.totalAttemptedCalls++;
      const cacheKey = this.profileAnalysisCacheKey(profile);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        try {
          profileAnalysis = JSON.parse(cached) as AIProfileAnalysis;
          callStats.cacheHits++;
        } catch (error) {
          console.error('packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts error:', error);
          this.cache.clear();
        }
      }

      if (!profileAnalysis) {
        profileAnalysis = await this.callWithFallback<AIProfileAnalysis>(
          () => this.callProfileAnalysis(profile, planningWindow, skillGaps, signal),
          null,
        );
        if (profileAnalysis) {
          callStats.successfulCalls++;
          this.cache.set(cacheKey, JSON.stringify(profileAnalysis));
          aiGeneratedItems++;
        } else {
          callStats.failedCalls++;
          fallbackUsed = true;
        }
      }
    }

    // Step 2: Weekly objectives (all batches, no retries)
    reportProgress('weekly-objectives')
    const enrichedObjectives: AIWeeklyObjective[] = [];
    let previousBatchSummary: string | undefined;

    for (const batch of generationPlan.weeklyObjectiveBatches) {
      if (signal?.aborted) break;

      callStats.requiredCallsAttempted++;
      callStats.totalAttemptedCalls++;
      const cacheKey = this.objectiveBatchCacheKey(batch, profile);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as AIWeeklyObjective[];
          enrichedObjectives.push(...parsed);
          callStats.cacheHits++;
          previousBatchSummary = this.buildBatchSummary(parsed);
          completedBatches++;
          reportProgress('weekly-objectives');
          continue;
        } catch (error) {
          console.error('packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts error:', error);
          this.cache.clear();
        }
      }

      const objectives = await this.callWithFallback<AIWeeklyObjective[]>(
        () => this.callWeeklyObjectives(batch, profile, previousBatchSummary, signal),
        [],
      );

      if (objectives && objectives.length > 0) {
        enrichedObjectives.push(...objectives);
        callStats.successfulCalls++;
        this.cache.set(cacheKey, JSON.stringify(objectives));
        previousBatchSummary = this.buildBatchSummary(objectives);
        aiGeneratedItems += objectives.length;
      } else {
        console.log('[AiOrchestrator] Weekly objectives failed for batch:', batch.batchIndex)
        callStats.failedCalls++;
        fallbackUsed = true;
      }
      completedBatches++
      reportProgress('weekly-objectives')
    }

    if (signal?.aborted) {
      return this.emptyWithCompleteness(generationPlan, callStats, fallbackUsed);
    }

    // Step 3: Task candidates (all batches, no retries)
    reportProgress('task-candidates')
    const taskCandidates: AITaskCandidate[] = [];
    const weeksWithObjectives = new Map(
      enrichedObjectives.map(o => [o.weekId, o]),
    );

    for (const batch of generationPlan.taskCandidateBatches) {
      if (signal?.aborted) break;

      callStats.requiredCallsAttempted++;
      callStats.totalAttemptedCalls++;
      const cacheKey = this.taskBatchCacheKey(batch, profile);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as AITaskCandidate[];
          taskCandidates.push(...parsed);
          callStats.cacheHits++;
          completedBatches++;
          reportProgress('task-candidates');
          continue;
        } catch (error) {
          console.error('packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts error:', error);
          this.cache.clear();
        }
      }

      const candidates = await this.callWithFallback<AITaskCandidate[]>(
        () => this.callTaskCandidates(batch, weeks, weeksWithObjectives, profile, signal),
        [],
      );

      if (candidates && candidates.length > 0) {
        taskCandidates.push(...candidates);
        callStats.successfulCalls++;
        this.cache.set(cacheKey, JSON.stringify(candidates));
        aiGeneratedItems += candidates.length;
        console.log('[AiOrchestrator] Batch', batch.batchIndex, 'got', candidates.length, 'candidates (required:', batch.requiredCount, ')')
      } else {
        console.log('[AiOrchestrator] Task candidates FAILED for batch:', batch.batchIndex, 'required:', batch.requiredCount, 'weeks:', batch.weekIds.length)
        callStats.failedCalls++;
        fallbackUsed = true;
      }
      completedBatches++
      reportProgress('task-candidates')
    }

    if (signal?.aborted) {
      return this.emptyWithCompleteness(generationPlan, callStats, fallbackUsed);
    }

    // ── Second Pass: Repair Work (only missing items) ──

    const requirements = buildEnrichmentRequirements(phases, generationPlan.taskCandidateBatches);
    const requirementCounts = new Map<string, number>();
    for (const c of taskCandidates) {
      const reqId = `${generationPlan.taskCandidateBatches.find(b => b.weekIds.includes(c.targetWeekId))?.phaseId ?? 'unknown'}:${c.targetWeekId}:${c.skill}`;
      requirementCounts.set(reqId, (requirementCounts.get(reqId) ?? 0) + 1);
    }

    const coverage = calculateEnrichmentCoverage(
      requirements,
      (reqId: string) => requirementCounts.get(reqId) ?? 0,
    );
    const missingReqs = coverage.filter(c => !c.complete);

    if (missingReqs.length > 0 && generationPlan.retryPolicy.enableRepair) {
      console.log('[AiOrchestrator] Repair pass needed for', missingReqs.length, 'requirements');

      for (let repairAttempt = 0; repairAttempt < generationPlan.retryPolicy.maxRepairAttempts; repairAttempt++) {
        if (callStats.repairCallsAttempted >= generationPlan.callBudget.repairBudget) break;
        if (signal?.aborted) break;

        const stillMissing = coverage.filter(c => !c.complete);
        if (stillMissing.length === 0) break;

        const repairBatch = generationPlan.taskCandidateBatches.find(
          b => stillMissing.some(r => r.requirementId.startsWith(b.phaseId))
        );
        if (!repairBatch) break;

        const missingForBatch = stillMissing.filter(
          r => r.requirementId.startsWith(repairBatch.phaseId)
        );

        callStats.repairCallsAttempted++;
        callStats.totalAttemptedCalls++;

        const repairCandidates = await this.callWithFallback<AITaskCandidate[]>(
          () => this.callTaskCandidates(
            {
              ...repairBatch,
              requiredCount: missingForBatch.reduce((s, r) => s + r.missingCount, 0),
            },
            weeks,
            weeksWithObjectives,
            profile,
            signal,
            taskCandidates,
          ),
          [],
        );

        if (repairCandidates && repairCandidates.length > 0) {
          const { merged, duplicatesDiscarded: dupCount } = mergeAndDeduplicate(
            repairCandidates,
            taskCandidates,
            (item) => {
              const batch = generationPlan.taskCandidateBatches.find(b => b.weekIds.includes(item.targetWeekId));
              return `${batch?.phaseId ?? 'unknown'}:${item.targetWeekId}:${item.skill}`;
            },
          );
          duplicatesDiscarded += dupCount;
          const newItems = merged.length - taskCandidates.length;
          repairedItems += newItems;
          taskCandidates.length = 0;
          taskCandidates.push(...merged);

          // Recalculate coverage
          const updatedCounts = new Map<string, number>();
          for (const c of taskCandidates) {
            const reqId = `${repairBatch.phaseId}:${c.targetWeekId}:${c.skill}`;
            updatedCounts.set(reqId, (updatedCounts.get(reqId) ?? 0) + 1);
          }
          Array.from(coverage.entries()).forEach(([_, c]) => {
            const newCount = updatedCounts.get(c.requirementId) ?? 0;
            c.generatedCount = newCount;
            c.missingCount = Math.max(0, c.expectedCount - newCount);
            c.complete = c.missingCount === 0;
          });

          callStats.successfulCalls++;
          console.log('[AiOrchestrator] Repair attempt', repairAttempt + 1, 'got', newItems, 'new items,', duplicatesDiscarded, 'duplicates discarded');
        } else {
          callStats.failedCalls++;
          console.log('[AiOrchestrator] Repair attempt', repairAttempt + 1, 'failed');
        }
      }

      // After repair, check if still incomplete
      const finalMissing = coverage.filter(c => !c.complete);
      if (finalMissing.length > 0 && generationPlan.retryPolicy.maxRepairAttempts > 0) {
        console.log('[AiOrchestrator] Still missing', finalMissing.length, 'requirements after repair');
        fallbackUsed = true;
      }
    }

    reportProgress('complete')
    callStats.totalTokensEstimated = (callStats.successfulCalls + callStats.cacheHits) * 4000;

    const finalCoverage = calculateEnrichmentCoverage(
      requirements,
      (reqId: string) => {
        const batch = generationPlan.taskCandidateBatches.find(b => reqId.startsWith(b.phaseId));
        return taskCandidates.filter(c => {
          const cReqId = `${batch?.phaseId ?? 'unknown'}:${c.targetWeekId}:${c.skill}`;
          return cReqId === reqId;
        }).length;
      },
    );

    const completeness = createCompletenessReport(
      requirements,
      finalCoverage,
      taskCandidates.length,
      aiGeneratedItems,
      repairedItems,
      fallbackItems,
      duplicatesDiscarded,
    );

    console.log('[AiOrchestrator] Enrichment completeness:', JSON.stringify({
      expectedItems: completeness.expectedItems,
      generatedItems: completeness.generatedItems,
      complete: completeness.complete,
      missingItems: completeness.missingItems,
    }));

    return {
      profileAnalysis,
      enrichedObjectives,
      taskCandidates,
      generationPlan,
      callStats,
      fallbackUsed,
      completeness,
      requirements,
    };
  }

  buildExplanation(context: ExplainabilityContext): PlanExplanation {
    const { profile, planningWindow, phases, feasibility, skillGaps, profileAnalysis } = context;

    const weeksCount = context.weeks.length;
    const phasesList = phases.map(p => ({
      type: p.type,
      title: p.title,
      duration: `${p.startDate} to ${p.endDate}`,
      focus: p.description,
    }));

    const skillBreakdown = skillGaps
      .filter(g => ['listening', 'reading', 'writing', 'speaking'].includes(g.skill))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .map(g => ({
        skill: g.skill,
        bandGap: g.bandGap,
        priority: g.priorityScore,
        reasons: g.reasons,
      }));

    const primaryWeakness = profileAnalysis?.primaryWeaknesses[0]?.skill ?? skillBreakdown[0]?.skill ?? 'writing';
    const learnerProfile = profileAnalysis?.learnerSummary ?? '';

    return {
      overview: {
        currentBand: profile.currentOverallBand,
        targetBand: profile.targetOverallBand,
        examDate: planningWindow.examDate,
        daysRemaining: planningWindow.totalCalendarDays,
        studyDays: planningWindow.totalAvailableStudyDays,
        totalAvailableHours: Math.round(planningWindow.totalAvailableMinutes / 60 * 10) / 10,
        totalScheduledHours: Math.round(planningWindow.schedulableMinutes / 60 * 10) / 10,
        feasibility: feasibility.status,
      },
      skillAnalysis: {
        weakestSkill: primaryWeakness,
        skillBreakdown,
        allocation: skillGaps.reduce((acc, g) => {
          acc[g.skill] = g.normalizedWeight;
          return acc;
        }, {} as Record<string, number>),
      },
      phaseProgression: phasesList,
      weeksCount,
      personalization: {
        aiUsed: profileAnalysis !== null,
        personalizedFeatures: profileAnalysis
          ? ['content-suggestions', 'weakness-targeting', 'adaptive-sequence']
          : ['deterministic-allocation'],
        learnerSummary: learnerProfile,
        dataUsed: [
          'skill-band-scores',
          'exam-type',
          'planning-window',
          ...(profile.recentMistakes.length > 0 ? ['mistake-history'] : []),
          ...(profile.previousMockResults.length > 0 ? ['mock-results'] : []),
        ],
      },
      feasibilitySummary: {
        status: feasibility.status,
        warnings: feasibility.warnings.map(w => w.message),
        suggestions: feasibility.suggestions.map(s => s.description),
      },
    };
  }

  // ── AI Generation Plan Strategy ──

  private buildAiGenerationPlan(weeks: StudyWeek[], phases: StudyPhase[]): AIGenerationPlan {
    const weekCount = weeks.length;
    const maxWeeksPerBatch = this.limits.maximumWeeksPerBatch;

    if (weekCount === 0) {
      const emptyPlan: AIGenerationPlan = {
        useAI: false,
        profileAnalysisRequired: false,
        weeklyObjectiveBatches: [],
        taskCandidateBatches: [],
        allowRepairCall: false,
        maximumCalls: 0,
        tokenBudget: 0,
        callBudget: calculateAiGenerationCallBudget({
          profileAnalysisRequired: false,
          objectiveBatchCount: 0,
          taskCandidateBatchCount: 0,
          maxRepairCalls: 0,
          hardCallLimit: 25,
        }),
        retryPolicy: { maxRepairAttempts: 0, enableRepair: false },
      };
      return emptyPlan;
    }

    const objectiveBatches: AIWeekBatch[] = [];
    const weeksPerBatch = Math.min(maxWeeksPerBatch, DEFAULT_WEEKS_PER_OBJECTIVE_BATCH);

    for (let i = 0; i < weekCount; i += weeksPerBatch) {
      const batchWeeks = weeks.slice(i, i + weeksPerBatch);
      objectiveBatches.push({
        batchIndex: objectiveBatches.length + 1,
        weekIds: batchWeeks.map(w => w.id),
        startDate: batchWeeks[0].startDate,
        endDate: batchWeeks[batchWeeks.length - 1].endDate,
        phaseContext: phases.find(p => p.id === batchWeeks[0].phaseId)?.type,
      });
    }

    const taskBatches: AITaskBatch[] = [];
    for (const phase of phases) {
      const phaseWeeks = weeks.filter(w => w.phaseId === phase.id);
      if (phaseWeeks.length === 0) continue;

      const totalCapacity = phaseWeeks.reduce((s, w) => s + w.availableMinutes, 0);
      const candidateCapacity = Math.round(totalCapacity / 25);
      const perWeekTarget = Math.max(2, Math.round(candidateCapacity / Math.max(1, phaseWeeks.length)));
      const cappedPerPhase = Math.min(
        perWeekTarget * phaseWeeks.length,
        this.limits.maximumCandidatesPerBatch,
      );

      taskBatches.push({
        batchIndex: taskBatches.length + 1,
        phaseId: phase.id,
        weekIds: phaseWeeks.map(w => w.id),
        requiredCount: cappedPerPhase,
        tokenBudget: Math.min(cappedPerPhase * 1000, this.limits.maximumTokensPerGeneration / Math.max(1, phases.length)),
      });
    }

    const totalBatches = objectiveBatches.length + taskBatches.length;
    const useAI = totalBatches > 0;

    const callBudget = calculateAiGenerationCallBudget({
      profileAnalysisRequired: useAI,
      objectiveBatchCount: objectiveBatches.length,
      taskCandidateBatchCount: taskBatches.length,
      maxRepairCalls: this.limits.maximumRepairCalls,
      hardCallLimit: 25,
    });

    if (useAI && callBudget.requiredCalls > callBudget.hardCallLimit) {
      throw new AiGenerationPlanTooLargeError({
        requiredCalls: callBudget.requiredCalls,
        hardCallLimit: callBudget.hardCallLimit,
        profileAnalysisCalls: callBudget.profileAnalysisCalls,
        objectiveBatchCalls: callBudget.objectiveBatchCalls,
        taskCandidateBatchCalls: callBudget.taskCandidateBatchCalls,
      });
    }

    return {
      useAI,
      profileAnalysisRequired: useAI,
      weeklyObjectiveBatches: objectiveBatches,
      taskCandidateBatches: taskBatches,
      allowRepairCall: useAI && callBudget.repairBudget > 0,
      maximumCalls: callBudget.maximumCalls,
      tokenBudget: Math.min(totalBatches * 4000, this.limits.maximumTokensPerGeneration),
      callBudget,
      retryPolicy: { maxRepairAttempts: this.limits.maximumRepairCalls, enableRepair: callBudget.repairBudget > 0 },
    };
  }

  // ── AI Call Methods ──

  private async callProfileAnalysis(
    profile: NormalizedProfile,
    planningWindow: PlanningWindow,
    skillGaps: SkillGapScore[],
    signal?: AbortSignal,
  ): Promise<AIProfileAnalysis | null> {
    const systemPrompt = `You are an expert IELTS tutor creating personalized learning analysis.
You must respond with valid JSON only, no markdown, no explanation outside the JSON.
Use this exact schema:
{
  "primaryWeaknesses": [{ "skill": string, "reason": string, "confidence": number (0-1) }],
  "secondaryWeaknesses": [string],
  "recommendedSequence": [string],
  "recommendedTaskTypes": [string],
  "risks": [string],
  "learnerSummary": string
}

IMPORTANT IELTS BAND RULES:
- Official IELTS bands use ONLY whole and half-band values: 0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
- Values like 5.6, 5.8, 6.1, 6.3, 6.4, 6.6 are NOT valid IELTS bands
- Never invent band values with unsupported precision
- When referencing band scores, use only valid whole or half-band values

PHASE PROGRESSION RULES (when discussing learning phases):
- Every phase must have a unique purpose and title
- Do NOT repeat the same or semantically equivalent phase title
- The phases must form a chronological learning progression
- A later phase must not represent an earlier level of readiness
- The final phase must be the most advanced and focus on target validation or exam readiness
- Phase titles should primarily describe the learner's focus skills and stage - not just the target band
- Phases progress through stages: foundation → skill-development → guided-practice → accuracy → performance → consistency → target-readiness → exam-readiness

Rules:
- Skills must be one of: listening, reading, writing, speaking, vocabulary, grammar
- primaryWeaknesses must have 1-4 entries with specific, actionable reasons
- secondaryWeaknesses must be an array of skills
- learnerSummary must be under 500 characters and personalized to the learner's band gap
- recommendedSequence should order skills from highest to lowest priority
- Be specific about why each weakness matters for IELTS
- Do NOT include dates, schedules, or time allocations
- Do NOT guarantee score improvements`;

    const userPrompt = `Analyze this IELTS learner profile and provide pedagogical recommendations.

Current overall band: ${profile.currentOverallBand}
Target overall band: ${profile.targetOverallBand}
Exam type: ${profile.examType}
Days until exam: ${planningWindow.totalCalendarDays}
Available study days: ${planningWindow.totalAvailableStudyDays}
Total available minutes: ${planningWindow.totalAvailableMinutes}

Skill bands:
${skillGaps.map(g => `  ${g.skill}: current band gap ${g.bandGap.toFixed(1)}, priority score ${g.priorityScore.toFixed(3)} (${g.reasons.join(', ')})`).join('\n')}

Weak skills declared: ${profile.weakSkills.join(', ') || 'none'}
Strong skills declared: ${profile.strongSkills.join(', ') || 'none'}`;

    const content = await this.safeAICall(systemPrompt, userPrompt, signal);
    if (!content) return null;

    return this.parseAndValidate(content, AIProfileAnalysisSchema);
  }

  private async callWeeklyObjectives(
    batch: AIWeekBatch,
    profile: NormalizedProfile,
    previousSummary?: string,
    signal?: AbortSignal,
  ): Promise<AIWeeklyObjective[] | null> {
    const systemPrompt = `You are an expert IELTS tutor creating detailed weekly learning objectives.
You must respond with valid JSON array only — no markdown, no explanation outside the JSON.
Each entry must follow:
{
  "weekId": string,
  "title": string (max 100 chars),
  "focus": string (max 200 chars),
  "objectives": [string] (1-5 items),
  "recommendedTaskTypes": [string],
  "pedagogicalReason": string (max 300 chars)
}

IMPORTANT IELTS BAND RULES:
- Official IELTS bands use ONLY whole and half-band values: 0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
- Values like 5.6, 5.8, 6.1, 6.3, 6.4, 6.6 are NOT valid IELTS bands
- Never invent band values with unsupported precision

Rules:
- Return an array of objects, one per week
- weekId must match the provided week IDs exactly
- Objectives should show clear progression from basic to advanced skills
- Each objective should be specific and measurable
- focus should describe the week's main theme (e.g., "Building academic vocabulary for Task 2 essays")
- Do NOT include dates, time allocation, or scheduling
- Do NOT guarantee score improvements`;

    const phaseInfo = batch.phaseContext ? `Phase context: ${batch.phaseContext}` : '';
    const continuity = previousSummary ? `Previous batch focus areas: ${previousSummary}` : '';

    const userPrompt = `Create weekly learning objectives for weeks ${batch.batchIndex}.

Week IDs: ${batch.weekIds.join(', ')}
Date range: ${batch.startDate} to ${batch.endDate}
${phaseInfo}
${continuity}

Learner profile:
  Current overall band: ${profile.currentOverallBand}
  Target overall band: ${profile.targetOverallBand}
  Exam type: ${profile.examType}
  Weak skills: ${profile.weakSkills.join(', ') || 'none'}
  Strong skills: ${profile.strongSkills.join(', ') || 'none'}`;

    const content = await this.safeAICall(systemPrompt, userPrompt, signal);
    if (!content) return null;

    return this.parseAndValidateArray(content, AIWeeklyObjectiveSchema, 'weekly-objectives');
  }

  private async callTaskCandidates(
    batch: AITaskBatch,
    weeks: StudyWeek[],
    weeksWithObjectives: Map<string, AIWeeklyObjective>,
    profile: NormalizedProfile,
    signal?: AbortSignal,
    existingCandidates?: AITaskCandidate[],
  ): Promise<AITaskCandidate[] | null> {
    const batchWeeks = weeks.filter(w => batch.weekIds.includes(w.id));
    if (batchWeeks.length === 0) return [];

    const systemPrompt = `You are an expert IELTS tutor creating personalized, detailed task suggestions for a study plan.
You must respond with valid JSON array only — no markdown, no explanation outside the JSON.
Each entry must follow:
{
  "candidateId": string,
  "targetWeekId": string,
  "skill": "listening" | "reading" | "writing" | "speaking" | "vocabulary" | "grammar",
  "taskType": string,
  "title": string (max 150 chars),
  "description": string (max 500 chars),
  "objective": string (max 300 chars),
  "reason": string (max 300 chars),
  "recommendedMinutes": number (one of ${ALLOWED_DURATIONS.join(', ')}),
  "difficulty": "easy" | "medium" | "hard",
  "priority": "low" | "normal" | "high",
  "prerequisites": [string] (optional, max 5)
}

IMPORTANT IELTS BAND RULES:
- Official IELTS bands use ONLY whole and half-band values: 0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
- Values like 5.6, 5.8, 6.1, 6.3, 6.4, 6.6 are NOT valid IELTS bands
- Never invent band values with unsupported precision

MATCHING RULES (CRITICAL):
- The study plan uses core skills: listening, reading, writing, speaking, vocabulary, grammar
- Vocabulary and grammar are SUPPORTING skills — most tasks in the plan are for core skills
- Only generate vocabulary or grammar candidates when the week's focus clearly requires them (e.g. a vocabulary-focused week)
- PREFER candidates for: listening, reading, writing, speaking
- Vocabulary candidates should be rare — only when the phase explicitly targets vocabulary
- Grammar candidates should be rare — only when the phase explicitly targets grammar
- Prioritize generating candidates for the skills that appear in the phase's skill allocation

Title quality rules (MOST IMPORTANT):
- Each title must be specific and descriptive, NOT generic like "Writing Practice" or "Listening Practice"
- Include the skill, task type, and focus area in the title
- Example GOOD titles: "Academic Writing Task 1: Describe a Graph with Trends", "Skimming and Scanning Practice with Academic Passages"
- Example BAD titles: "Writing Practice", "Reading Practice", "Listening Exercise"
- Use IELTS-specific terminology (Task 1, Task 2, Part 1, multiple-choice, gap-fill, True/False/Not Given)

Other rules:
- recommendMinutes must be one of: ${ALLOWED_DURATIONS.join(', ')}
- candidateId should be unique and contain the week reference
- Generate exactly ${batch.requiredCount} candidates — do not return fewer
- Spread candidates evenly across the ${batch.weekIds.length} target week(s) (${Math.round(batch.requiredCount / Math.max(1, batch.weekIds.length))}–${Math.ceil(batch.requiredCount / Math.max(1, batch.weekIds.length))} per week)
- Do NOT include final dates or scheduling
- Do NOT guarantee score improvements
${existingCandidates ? `- IMPORTANT: These tasks are already covered — do NOT generate duplicates of them:\n${existingCandidates.map(c => `  • Week ${c.targetWeekId}: ${c.title}`).join('\n')}` : ''}`;

    const weekDetails = batchWeeks.map(w => {
      const objective = weeksWithObjectives.get(w.id);
      return `  Week ${w.id}: available ${w.availableMinutes}m, skill allocation ${JSON.stringify(w.skillAllocation)}` +
        (objective ? `, focus: ${objective.focus}` : '');
    }).join('\n');

    const userPrompt = `Create ${batch.requiredCount} task candidates for phase ${batch.phaseId}.

Phase context: ${this.getPhaseContext(batch.phaseId, weeks)}

Weeks in this batch:
${weekDetails}

Learner: ${profile.currentOverallBand} → ${profile.targetOverallBand}, ${profile.examType}
Weak skills: ${profile.weakSkills.join(', ') || 'none'}`;

    const content = await this.safeAICall(systemPrompt, userPrompt, signal);
    if (!content) return null;

    return this.parseAndValidateArray(content, AITaskCandidateSchema, 'task-candidates');
  }

  // ── Helpers ──

  private getPhaseContext(phaseId: string, weeks: StudyWeek[]): string {
    const phaseWeeks = weeks.filter(w => w.phaseId === phaseId);
    if (phaseWeeks.length === 0) return '';
    return `weeks ${phaseWeeks[0].weekNumber} to ${phaseWeeks[phaseWeeks.length - 1].weekNumber}`;
  }

  private buildBatchSummary(objectives: AIWeeklyObjective[]): string {
    return objectives.map(o => `${o.weekId}: ${o.focus}`).join('; ');
  }

  private profileAnalysisCacheKey(profile: NormalizedProfile): string {
    return `profile-analysis:${profile.currentOverallBand}-${profile.targetOverallBand}-${profile.examType}-${profile.planStartDate}-${profile.examDate}`;
  }

  private objectiveBatchCacheKey(batch: AIWeekBatch, profile: NormalizedProfile): string {
    return `objectives:${batch.batchIndex}-${batch.weekIds.join(',')}-${profile.currentOverallBand}-${profile.targetOverallBand}`;
  }

  private taskBatchCacheKey(batch: AITaskBatch, profile: NormalizedProfile): string {
    return `tasks:${batch.batchIndex}-${batch.phaseId}-${batch.weekIds.join(',')}-${profile.currentOverallBand}-${profile.targetOverallBand}`;
  }

  private async safeAICall(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal,
  ): Promise<string | null> {
    try {
      const result = await this.callAI(systemPrompt, userPrompt);
      if (signal?.aborted) return null;
      return result;
    } catch (error) {
      console.error('packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts error:', error);
      return null;
    }
  }

  private async callWithFallback<T>(
    fn: () => Promise<T | null>,
    fallback: T | null,
  ): Promise<T | null> {
    try {
      const result = await fn();
      return result ?? fallback;
    } catch (error) {
      console.error('packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts error:', error);
      return fallback;
    }
  }

  private repairJSON(raw: string): string {
    return raw.replace(/,\s*([}\]])/g, '$1')
  }

  private parseAndValidate<T>(
    content: string,
    schema: z.ZodType<T>,
  ): T | null {
    try {
      const cleaned = this.repairJSON(this.extractJSON(content));
      const parsed = JSON.parse(cleaned) as unknown;
      const result = schema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts error:', error);
      return null;
    }
  }

  private parseAndValidateArray<T>(
    content: string,
    schema: z.ZodType<T>,
    label?: string,
  ): T[] | null {
    try {
      const raw = this.extractJSON(content);
      const cleaned = this.repairJSON(raw);
      if (raw !== cleaned) {
        console.log(`[AiOrchestrator] ${label || ''} repairJSON modified output: ${raw.length} -> ${cleaned.length} chars`);
      }
      const parsed = JSON.parse(cleaned);
      const items: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as Record<string, unknown>).items)
          ? (parsed as Record<string, unknown>).items as unknown[]
          : [parsed];
      const results: T[] = [];
      let rejected = 0;
      for (const item of items) {
        const result = schema.safeParse(item);
        if (result.success) {
          results.push(result.data);
        } else {
          rejected++;
          if (rejected <= 3) {
            const snippet = JSON.stringify(item).slice(0, 120);
            console.log(`[AiOrchestrator] ${label || ''} Zod rejected item: ${result.error.issues[0]?.message || 'unknown'} — snippet: ${snippet}`);
          }
        }
      }
      if (rejected > 0) {
        console.log(`[AiOrchestrator] ${label || ''} validation: ${results.length} accepted, ${rejected} rejected (of ${items.length} total)`);
      }
      return results.length > 0 ? results : null;
    } catch (error) {
      console.error(`[AiOrchestrator] ${label || ''} parse error:`, error);
      return null;
    }
  }

  private emptyResult(attemptedCalls: number, fallbackUsed: boolean): EnrichPlanResult {
    const emptyCallStats: AiCallStats = {
      requiredCallsAttempted: 0,
      repairCallsAttempted: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalAttemptedCalls: attemptedCalls,
      cacheHits: 0,
      totalTokensEstimated: 0,
    };
    const emptyBudget: AiGenerationCallBudget = {
      profileAnalysisCalls: 0,
      objectiveBatchCalls: 0,
      taskCandidateBatchCalls: 0,
      requiredCalls: 0,
      repairBudget: 0,
      maximumCalls: 0,
      hardCallLimit: 25,
    };
    return {
      profileAnalysis: null,
      enrichedObjectives: [],
      taskCandidates: [],
      generationPlan: {
        useAI: false,
        profileAnalysisRequired: false,
        weeklyObjectiveBatches: [],
        taskCandidateBatches: [],
        allowRepairCall: false,
        maximumCalls: 0,
        tokenBudget: 0,
        callBudget: emptyBudget,
        retryPolicy: { maxRepairAttempts: 0, enableRepair: false },
      },
      callStats: emptyCallStats,
      fallbackUsed,
      completeness: {
        expectedItems: 0,
        generatedItems: 0,
        aiGeneratedItems: 0,
        repairedItems: 0,
        fallbackItems: 0,
        duplicateItemsDiscarded: 0,
        missingItems: 0,
        missingRequirementIds: [],
        complete: false,
      },
      requirements: [],
    };
  }

  private emptyWithCompleteness(generationPlan: AIGenerationPlan, callStats: AiCallStats, fallbackUsed: boolean): EnrichPlanResult {
    return {
      profileAnalysis: null,
      enrichedObjectives: [],
      taskCandidates: [],
      generationPlan,
      callStats,
      fallbackUsed,
      completeness: {
        expectedItems: 0,
        generatedItems: 0,
        aiGeneratedItems: 0,
        repairedItems: 0,
        fallbackItems: 0,
        duplicateItemsDiscarded: 0,
        missingItems: 0,
        missingRequirementIds: [],
        complete: false,
      },
      requirements: [],
    };
  }

  private extractJSON(content: string): string {
    const jsonStart = content.indexOf('[');
    const jsonObjStart = content.indexOf('{');

    if (jsonStart !== -1 && (jsonObjStart === -1 || jsonStart < jsonObjStart)) {
      const jsonEnd = content.lastIndexOf(']');
      if (jsonEnd === -1) throw new Error('No closing bracket found');
      return content.slice(jsonStart, jsonEnd + 1);
    }

    const start = jsonObjStart;
    if (start === -1) throw new Error('No JSON found');
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let end = -1;

    for (let i = start; i < content.length; i++) {
      const char = content[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (inString) {
        if (char === '\\') escapeNext = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') { inString = true; continue; }
      if (char === '{') { braceCount++; continue; }
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) { end = i; break; }
      }
    }

    if (end === -1) throw new Error('No matching closing brace found');
    return content.slice(start, end + 1);
  }
}
