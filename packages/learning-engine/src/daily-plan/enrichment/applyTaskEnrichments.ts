import type {
  StudyPlan,
  StudyTask,
  TaskEnrichmentRequirement,
  AITaskCandidate,
  EnrichmentMergeReport,
} from '../types';

// ── Centralized generic-title detection ──

const GENERIC_TITLE_PATTERNS: RegExp[] = [
  /^[A-Z][a-z]+\s+Practice$/,
  /^[A-Z][a-z]+\s+Exercise$/,
  /^(Listening|Reading|Writing|Speaking|Vocabulary|Grammar)\s+Practice$/i,
  /^(Listening|Reading|Writing|Speaking)\s+Exercise$/i,
  /^(Listen|Speak|Read|Write)$/i,
  /^Practice$/i,
  /^Exercise$/i,
];

export function isGenericTitle(title: string): boolean {
  return GENERIC_TITLE_PATTERNS.some(p => p.test(title.trim()));
}

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

// ── Exact enrichment merge ──

export function applyTaskEnrichments(
  plan: StudyPlan,
  requirements: TaskEnrichmentRequirement[],
  candidates: AITaskCandidate[],
): { plan: StudyPlan; report: EnrichmentMergeReport } {
  const taskById = new Map<string, StudyTask>();
  for (const task of plan.tasks) {
    taskById.set(task.id, task);
  }

  const reqById = new Map<string, TaskEnrichmentRequirement>();
  for (const req of requirements) {
    reqById.set(req.id, req);
  }

  const candidateByReqId = new Map<string, AITaskCandidate>();
  const duplicateRequirementIds: string[] = [];
  const unknownRequirementIds: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.requirementId) {
      unknownRequirementIds.push(candidate.candidateId);
      continue;
    }
    if (!reqById.has(candidate.requirementId)) {
      unknownRequirementIds.push(candidate.requirementId);
      continue;
    }
    if (candidateByReqId.has(candidate.requirementId)) {
      duplicateRequirementIds.push(candidate.requirementId);
      continue;
    }
    candidateByReqId.set(candidate.requirementId, candidate);
  }

  const appliedAiCandidates: string[] = [];
  const missingRequirementIds: string[] = [];
  const fallbackTasks: string[] = [];
  const rejectedRequirementIds: string[] = [];
  const updatedTasks: StudyTask[] = [];

  for (const req of requirements) {
    const task = taskById.get(req.taskId);
    if (!task) {
      missingRequirementIds.push(req.id);
      continue;
    }

    const candidate = candidateByReqId.get(req.id);

    if (candidate && !rejectCandidate(candidate)) {
      appliedAiCandidates.push(req.id);
      updatedTasks.push({
        ...task,
        title: candidate.title,
        description: candidate.description,
        objective: candidate.objective,
        reason: candidate.reason,
        estimatedMinutes: req.scheduledMinutes,
        metadata: {
          ...task.metadata,
          enrichmentSource: 'ai',
          requirementId: req.id,
          aiCandidateId: candidate.candidateId,
        },
      });
    } else {
      if (candidate && rejectCandidate(candidate)) {
        rejectedRequirementIds.push(req.id);
      }

      const fallback = buildDeterministicFallback(task);
      fallbackTasks.push(req.id);
      updatedTasks.push({
        ...task,
        title: fallback.title,
        description: fallback.description,
        objective: fallback.objective,
        reason: fallback.reason,
        estimatedMinutes: req.scheduledMinutes,
        metadata: {
          ...task.metadata,
          enrichmentSource: 'deterministic-fallback',
          requirementId: req.id,
        },
      });
    }
  }

  const taskMap = new Map(updatedTasks.map(t => [t.id, t]));
  const finalTasks = plan.tasks.map(t => taskMap.get(t.id) ?? t);

  const report: EnrichmentMergeReport = {
    totalRequirements: requirements.length,
    totalCandidates: candidates.length,
    appliedAiCandidates: appliedAiCandidates.length,
    fallbackTasks: fallbackTasks.length,
    duplicateRequirementIds,
    unknownRequirementIds,
    missingRequirementIds,
    rejectedRequirementIds,
  };

  return {
    plan: { ...plan, tasks: finalTasks },
    report,
  };
}

// ── Candidate validation ──

function rejectCandidate(candidate: AITaskCandidate): boolean {
  if (!candidate.title || candidate.title.trim().length === 0) return true;
  if (!candidate.description || candidate.description.trim().length === 0) return true;
  if (!candidate.objective || candidate.objective.trim().length === 0) return true;
  if (!candidate.reason || candidate.reason.trim().length === 0) return true;
  if (isGenericTitle(candidate.title)) return true;
  if (candidate.recommendedMinutes < 5 || candidate.recommendedMinutes > 180) return true;
  return false;
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
