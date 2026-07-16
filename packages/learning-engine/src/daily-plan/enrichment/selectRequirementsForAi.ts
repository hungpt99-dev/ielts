import type {
  TaskEnrichmentRequirement,
  AITaskCandidate,
  AiTaskCoverageConfig,
  AiTaskGenerationBatch,
  AiGenerationCallBudget,
  BatchValidationResult,
} from '../types';

// ── Generic title patterns ──

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

export function isValidTaskCandidate(candidate: AITaskCandidate): boolean {
  if (!candidate.requirementId) return false;
  if (!candidate.title || candidate.title.trim().length === 0) return false;
  if (isGenericTitle(candidate.title)) return false;
  if (!candidate.description || candidate.description.trim().length === 0) return false;
  if (!candidate.objective || candidate.objective.trim().length === 0) return false;
  if (!candidate.reason || candidate.reason.trim().length === 0) return false;
  if (candidate.recommendedMinutes < 5 || candidate.recommendedMinutes > 180) return false;
  return true;
}

// ── Calculate affordable candidate count from call budget ──

export function calculateAffordableCandidateCount(
  budget: AiGenerationCallBudget,
  candidatesPerBatch: number,
): number {
  const taskCallsAvailable = Math.max(
    0,
    budget.requiredCalls - budget.profileAnalysisCalls - budget.objectiveBatchCalls,
  );
  return taskCallsAvailable * candidatesPerBatch + budget.repairBudget * candidatesPerBatch;
}

// ── Requirement priority comparator ──

const WEAK_SKILLS: string[] = ['writing', 'speaking'];

function taskTypePriority(taskType: string): number {
  const lowPriorityTypes = ['review', 'vocabulary', 'grammar'];
  const highPriorityTypes = ['mock-test', 'exam-preparation'];
  if (highPriorityTypes.includes(taskType)) return 2;
  if (lowPriorityTypes.includes(taskType)) return 0;
  return 1;
}

export function compareRequirementPriority(
  left: TaskEnrichmentRequirement,
  right: TaskEnrichmentRequirement,
): number {
  const leftIsWeak = WEAK_SKILLS.includes(left.skill);
  const rightIsWeak = WEAK_SKILLS.includes(right.skill);
  return (
    Number(rightIsWeak) - Number(leftIsWeak) ||
    taskTypePriority(right.taskType) - taskTypePriority(left.taskType) ||
    right.scheduledMinutes - left.scheduledMinutes ||
    left.sequence - right.sequence ||
    left.id.localeCompare(right.id)
  );
}

// ── Stratified selection across the roadmap ──

export function selectRequirementsForAi(
  requirements: TaskEnrichmentRequirement[],
  config: AiTaskCoverageConfig,
  affordableCount: number,
): { selected: TaskEnrichmentRequirement[]; deterministic: TaskEnrichmentRequirement[] } {
  if (requirements.length === 0) {
    return { selected: [], deterministic: [] };
  }

  const desiredCount = Math.ceil(requirements.length * config.targetAiCoverage);
  const selectedCount = Math.min(requirements.length, desiredCount, affordableCount);

  if (config.distributeAcrossEntireRoadmap) {
    return selectViaStratifiedRoundRobin(requirements, selectedCount, config);
  }

  // Simple top-N by priority
  const sorted = [...requirements].sort(compareRequirementPriority);
  return {
    selected: sorted.slice(0, selectedCount),
    deterministic: sorted.slice(selectedCount),
  };
}

function selectViaStratifiedRoundRobin(
  requirements: TaskEnrichmentRequirement[],
  selectedCount: number,
  config: AiTaskCoverageConfig,
): { selected: TaskEnrichmentRequirement[]; deterministic: TaskEnrichmentRequirement[] } {
  // Group by phase:week:skill
  const groups = new Map<string, TaskEnrichmentRequirement[]>();
  for (const req of requirements) {
    const key = `${req.phaseId}:${req.weekId}:${req.skill}`;
    const group = groups.get(key) ?? [];
    group.push(req);
    groups.set(key, group);
  }

  const groupKeys = [...groups.keys()];
  const selected = new Set<string>();
  const selectedReqs: TaskEnrichmentRequirement[] = [];

  // First pass: pick at least one from each group (round-robin)
  if (config.minimumAiPerWeekSkillGroup > 0) {
    for (const key of groupKeys) {
      const group = groups.get(key)!;
      const picked = group.sort(compareRequirementPriority).slice(0, config.minimumAiPerWeekSkillGroup);
      for (const req of picked) {
        if (!selected.has(req.id) && selectedReqs.length < selectedCount) {
          selected.add(req.id);
          selectedReqs.push(req);
        }
      }
    }
  }

  // Second pass: fill remaining capacity with highest-priority requirements
  if (selectedReqs.length < selectedCount) {
    const remaining = requirements
      .filter(r => !selected.has(r.id))
      .sort(compareRequirementPriority);

    for (const req of remaining) {
      if (selectedReqs.length >= selectedCount) break;
      if (config.prioritizeWeakSkills && !WEAK_SKILLS.includes(req.skill)) continue;
      selected.add(req.id);
      selectedReqs.push(req);
    }

    // Fill remaining slots with any remaining requirements (priority order)
    for (const req of remaining) {
      if (selectedReqs.length >= selectedCount) break;
      if (selected.has(req.id)) continue;
      selected.add(req.id);
      selectedReqs.push(req);
    }
  }

  const selectedSet = new Set(selectedReqs.map(r => r.id));
  const deterministic = requirements.filter(r => !selectedSet.has(r.id));

  return { selected: selectedReqs, deterministic };
}

// ── Build AI generation batches from selected requirements ──

export function buildTaskGenerationBatches(
  selectedRequirements: TaskEnrichmentRequirement[],
  maxPerBatch: number,
): AiTaskGenerationBatch[] {
  const batches: AiTaskGenerationBatch[] = [];
  for (let i = 0; i < selectedRequirements.length; i += maxPerBatch) {
    const batchReqs = selectedRequirements.slice(i, i + maxPerBatch);
    batches.push({
      id: `task-gen-batch-${batches.length + 1}`,
      requirements: batchReqs,
      expectedCandidateCount: batchReqs.length,
    });
  }
  return batches;
}

// ── Validate an AI batch response against its requirements ──

export function validateBatchResponse(
  batch: AiTaskGenerationBatch,
  candidates: readonly AITaskCandidate[],
): BatchValidationResult {
  const expectedIds = new Set(batch.requirements.map(r => r.id));
  const seenIds = new Set<string>();

  const validCandidates: AITaskCandidate[] = [];
  const missingRequirementIds: string[] = [];
  const unknownRequirementIds: string[] = [];
  const duplicateRequirementIds: string[] = [];
  const invalidRequirementIds: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.requirementId || !expectedIds.has(candidate.requirementId)) {
      unknownRequirementIds.push(candidate.requirementId || '(missing)');
      continue;
    }

    if (seenIds.has(candidate.requirementId)) {
      duplicateRequirementIds.push(candidate.requirementId);
      continue;
    }

    if (!isValidTaskCandidate(candidate)) {
      invalidRequirementIds.push(candidate.requirementId);
      continue;
    }

    seenIds.add(candidate.requirementId);
    validCandidates.push(candidate);
  }

  for (const expectedId of expectedIds) {
    if (!seenIds.has(expectedId)) {
      missingRequirementIds.push(expectedId);
    }
  }

  return {
    validCandidates,
    missingRequirementIds,
    unknownRequirementIds,
    duplicateRequirementIds,
    invalidRequirementIds,
  };
}
