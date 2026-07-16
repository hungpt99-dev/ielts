import type {
  StudyPlan,
  StudyTask,
  TaskEnrichmentRequirement,
  AITaskCandidate,
  TaskEnrichmentReport,
} from '../types';

// ── Build enrichment requirements from plan tasks ──

export function buildTaskEnrichmentRequirements(plan: StudyPlan): TaskEnrichmentRequirement[] {
  return plan.tasks.map((task, idx) => ({
    id: `task-enrichment:${task.id}`,
    taskId: task.id,
    phaseId: task.phaseId,
    weekId: task.weekId,
    skill: task.skill,
    taskType: task.taskType,
    scheduledMinutes: task.estimatedMinutes,
    sequence: idx + 1,
  }));
}

// ── Exact enrichment merge by requirementId → taskId ──

export function applyTaskEnrichments(
  plan: StudyPlan,
  requirements: TaskEnrichmentRequirement[],
  candidates: AITaskCandidate[],
  selectedForAi: string[],
): { plan: StudyPlan; report: TaskEnrichmentReport } {
  const taskById = new Map<string, StudyTask>();
  for (const task of plan.tasks) {
    taskById.set(task.id, task);
  }

  const reqById = new Map<string, TaskEnrichmentRequirement>();
  for (const req of requirements) {
    reqById.set(req.id, req);
  }

  const selectedSet = new Set(selectedForAi);
  const candidateByReqId = new Map<string, AITaskCandidate>();
  const unknownRequirementIds: string[] = [];
  const duplicateRequirementIds: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.requirementId || !reqById.has(candidate.requirementId)) {
      unknownRequirementIds.push(candidate.requirementId || '(missing)');
      continue;
    }
    if (candidateByReqId.has(candidate.requirementId)) {
      duplicateRequirementIds.push(candidate.requirementId);
      continue;
    }
    candidateByReqId.set(candidate.requirementId, candidate);
  }

  let aiGenerated = 0;
  let aiRepaired = 0;
  let plannedDeterministic = 0;
  let fallbackAfterAiFailure = 0;
  const invalidRequirementIds: string[] = [];
  const missingRequirementIds: string[] = [];
  const updatedTasks: StudyTask[] = [];
  const totalScheduledMinutes = plan.tasks.reduce((s, t) => s + t.estimatedMinutes, 0);

  for (const req of requirements) {
    const task = taskById.get(req.taskId);
    if (!task) {
      missingRequirementIds.push(req.id);
      continue;
    }

    const candidate = candidateByReqId.get(req.id);
    const wasSelectedForAi = selectedSet.has(req.id);

    if (candidate && candidateIsValid(candidate)) {
      aiGenerated++;
      updatedTasks.push({
        ...task,
        title: candidate.title,
        description: candidate.description,
        objective: candidate.objective,
        reason: candidate.reason,
        estimatedMinutes: req.scheduledMinutes,
        enrichment: { source: 'ai-generated', requirementId: req.id },
        metadata: {
          ...task.metadata,
          aiCandidateId: candidate.candidateId,
        },
      });
    } else if (wasSelectedForAi) {
      // Selected for AI but no valid candidate → fallback
      if (candidate && !candidateIsValid(candidate)) {
        invalidRequirementIds.push(req.id);
      }
      fallbackAfterAiFailure++;
      const fallback = buildDeterministicFallback(task);
      updatedTasks.push({
        ...task,
        title: fallback.title,
        description: fallback.description,
        objective: fallback.objective,
        reason: fallback.reason,
        estimatedMinutes: req.scheduledMinutes,
        enrichment: { source: 'fallback-after-ai-failure', requirementId: req.id },
        metadata: { ...task.metadata },
      });
    } else {
      // Not selected for AI → planned deterministic
      plannedDeterministic++;
      const fallback = buildDeterministicFallback(task);
      updatedTasks.push({
        ...task,
        title: fallback.title,
        description: fallback.description,
        objective: fallback.objective,
        reason: fallback.reason,
        estimatedMinutes: req.scheduledMinutes,
        enrichment: { source: 'planned-deterministic', requirementId: req.id },
        metadata: { ...task.metadata },
      });
    }
  }

  const taskMap = new Map(updatedTasks.map(t => [t.id, t]));
  const finalTasks = plan.tasks.map(t => taskMap.get(t.id) ?? t);
  const finalTotal = finalTasks.reduce((s, t) => s + t.estimatedMinutes, 0);

  // Invariant: total minutes must equal original
  if (finalTotal !== totalScheduledMinutes) {
    console.warn('[applyTaskEnrichments] Total minutes mismatch:',
      totalScheduledMinutes, '→', finalTotal);
  }

  const report: TaskEnrichmentReport = {
    totalTaskRequirements: requirements.length,
    selectedForAi: selectedForAi.length,
    intentionallyDeterministic: requirements.length - selectedForAi.length,
    validAiCandidates: aiGenerated,
    repairedAiCandidates: aiRepaired,
    plannedDeterministicTasks: plannedDeterministic,
    fallbackAfterAiFailureTasks: fallbackAfterAiFailure,
    unknownRequirementIds,
    duplicateRequirementIds,
    invalidRequirementIds,
    missingRequirementIds,
  };

  return {
    plan: { ...plan, tasks: finalTasks },
    report,
  };
}

// ── Candidate validation ──

function candidateIsValid(candidate: AITaskCandidate): boolean {
  if (!candidate.title || candidate.title.trim().length === 0) return false;
  if (!candidate.description || candidate.description.trim().length === 0) return false;
  if (!candidate.objective || candidate.objective.trim().length === 0) return false;
  if (!candidate.reason || candidate.reason.trim().length === 0) return false;
  if (candidate.recommendedMinutes < 5 || candidate.recommendedMinutes > 180) return false;
  return true;
}

// ── Deterministic fallback builder ──

interface FallbackContent {
  title: string;
  description: string;
  objective: string;
  reason: string;
}

const SKILL_FOCUS: Record<string, { focus: string; taskTypes: string[] }> = {
  listening: {
    focus: 'Listening Comprehension',
    taskTypes: ['Section-based Practice', 'Note Completion', 'Multiple Choice'],
  },
  reading: {
    focus: 'Reading Comprehension',
    taskTypes: ['Passage Analysis', 'Skimming and Scanning', 'True/False/Not Given'],
  },
  writing: {
    focus: 'Writing Skills',
    taskTypes: ['Task 1: Graph Description', 'Task 2: Essay Writing'],
  },
  speaking: {
    focus: 'Speaking Fluency',
    taskTypes: ['Part 1: Introduction', 'Part 2: Long Turn', 'Part 3: Discussion'],
  },
  vocabulary: {
    focus: 'Vocabulary Building',
    taskTypes: ['Topic-specific Vocabulary', 'Collocation Practice'],
  },
  grammar: {
    focus: 'Grammar Accuracy',
    taskTypes: ['Tense Practice', 'Conditional Structures'],
  },
};

function buildDeterministicFallback(task: StudyTask): FallbackContent {
  const skillKey = task.skill.toLowerCase();
  const focus = SKILL_FOCUS[skillKey] ?? { focus: 'Skill Practice', taskTypes: ['General Exercise'] };
  const taskTypeLabel = focus.taskTypes[task.sessionOrder % focus.taskTypes.length];
  const phaseHint = task.metadata?.focusArea
    ? ` as part of ${task.metadata.focusArea}`
    : '';
  const duration = task.estimatedMinutes;

  const title = `${focus.focus}: ${taskTypeLabel}`;
  const description = `Complete a ${duration}-minute ${skillKey} session focused on ${taskTypeLabel.toLowerCase()}${phaseHint}.`;
  const objective = `Improve ${skillKey} skills through targeted ${taskTypeLabel.toLowerCase()} practice.`;
  const reason = `This activity supports your ${skillKey} development${phaseHint}.`;

  return { title, description, objective, reason };
}
