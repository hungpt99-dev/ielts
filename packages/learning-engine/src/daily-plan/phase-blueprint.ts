import { toNearestOfficialBand, toDisplayBand, OFFICIAL_IELTS_BANDS } from '../domain/value-objects';
import type {
  NormalizedProfile,
  PlanningWindow,
  SkillGapScore,
  StudyPhase,
  StudyPhaseType,
  StudyTaskSkill,
  PhaseStage,
  LocalDate,
} from './types';
import { PHASE_STAGE_ORDER } from './types';

// ── Public Types ──

export interface PhaseBlueprint {
  stage: PhaseStage;
  type: StudyPhaseType;
  officialBandGoal: number;
  focusSkills: StudyTaskSkill[];
  primaryWeaknesses: string[];
  title: string;
  summary: string;
  objectives: string[];
  completionCriteria: string[];
}

export interface LearningGap {
  skill: StudyTaskSkill;
  currentBand: number;
  targetBand: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  weaknesses: string[];
}

// ── Deterministic Phase Blueprint Generator ──

export function buildPhaseBlueprints(
  profile: NormalizedProfile,
  window: PlanningWindow,
  skillGaps: SkillGapScore[],
): PhaseBlueprint[] {
  const currentOfficial = toNearestOfficialBand(profile.currentOverallBand);
  const targetOfficial = toNearestOfficialBand(profile.targetOverallBand);
  const totalDays = window.totalCalendarDays;
  const learningGaps = analyzeLearningGaps(profile, skillGaps);
  const criticalGaps = learningGaps.filter(g => g.priority === 'critical' || g.priority === 'high');
  const weakCoreSkills = criticalGaps
    .filter(g => g.skill === 'writing' || g.skill === 'speaking' || g.skill === 'reading' || g.skill === 'listening')
    .map(g => g.skill as StudyTaskSkill);

  const needsExamPrep = totalDays <= 60;
  const hasSkillGaps = criticalGaps.length > 0;
  const hasLargeGap = (targetOfficial - currentOfficial) >= 1.5;

  const totalWeeklyMinutes = Object.values(profile.weeklyAvailability)
    .filter(d => d.enabled)
    .reduce((sum, d) => sum + d.availableMinutes, 0);

  const stages = selectStages({
    totalDays,
    hasLargeGap,
    hasSkillGaps,
    needsExamPrep,
    studyIntensity: profile.studyIntensity,
    totalWeeklyMinutes,
    criticalGapCount: criticalGaps.length,
    targetOfficial,
    currentOfficial,
    weakCoreSkills,
  });
  const validated = validateStageProgression(stages);
  const blueprints = validated.map((stage, i) =>
    buildSingleBlueprint(stage, i, validated.length, profile, learningGaps, weakCoreSkills, currentOfficial, targetOfficial),
  );

  return ensureUniqueTitles(blueprints);
}

interface SelectStagesParams {
  totalDays: number;
  hasLargeGap: boolean;
  hasSkillGaps: boolean;
  needsExamPrep: boolean;
  studyIntensity: string;
  totalWeeklyMinutes: number;
  criticalGapCount: number;
  targetOfficial: number;
  currentOfficial: number;
  weakCoreSkills: StudyTaskSkill[];
}

function selectStages(params: SelectStagesParams): PhaseStage[] {
  const { totalDays, hasLargeGap, hasSkillGaps, needsExamPrep, studyIntensity, totalWeeklyMinutes, criticalGapCount, targetOfficial, currentOfficial, weakCoreSkills } = params;

  if (totalDays <= 7) {
    return ['target-readiness', 'exam-readiness'];
  }

  if (totalDays <= 14) {
    return ['accuracy', 'target-readiness', 'exam-readiness'];
  }

  const stages: PhaseStage[] = [];
  const bandGap = Math.max(0, targetOfficial - currentOfficial);
  const hasUniqueWeakSkills = weakCoreSkills.length > 0;
  const isIntensive = studyIntensity === 'intensive';
  const isLight = studyIntensity === 'light';
  const weeklyHours = totalWeeklyMinutes / 60;

  if ((hasSkillGaps || hasLargeGap) && hasUniqueWeakSkills) {
    stages.push('foundation');
  } else if (hasLargeGap && !isLight) {
    stages.push('foundation');
  }

  stages.push('skill-development');

  if (totalDays > 21 || (totalDays > 14 && !isLight)) {
    stages.push('guided-practice');
  }

  const needsAccuracyPhase = hasSkillGaps || bandGap >= 1 || totalDays > 30;
  if (needsAccuracyPhase) {
    stages.push('accuracy');
  }

  const hasEnoughTime = totalDays > 45 || (totalDays > 30 && isIntensive);
  const needsPerformance = bandGap >= 1 || criticalGapCount >= 2 || hasEnoughTime;
  if (needsPerformance) {
    stages.push('performance');
  }

  const needsConsistency = totalDays > 60 || (totalDays > 45 && (bandGap >= 1.5 || criticalGapCount >= 3)) || (totalDays > 30 && isIntensive && bandGap >= 1);
  if (needsConsistency) {
    stages.push('consistency');
  }

  stages.push('target-readiness');

  if (needsExamPrep || totalDays > 14 || weeklyHours >= 5) {
    stages.push('exam-readiness');
  }

  if (stages.length > 10) {
    const removable = stages.filter(s => s !== 'target-readiness' && s !== 'exam-readiness');
    const removeCount = stages.length - 10;
    const sorted: PhaseStage[] = (removable as PhaseStage[]).sort((a, b) => {
      const aIsLessEssential = a === 'consistency' || a === 'guided-practice';
      const bIsLessEssential = b === 'consistency' || b === 'guided-practice';
      return aIsLessEssential ? (bIsLessEssential ? 0 : 1) : (bIsLessEssential ? -1 : 0);
    });
    const toRemove = new Set(sorted.slice(0, removeCount));
    return stages.filter((s): s is PhaseStage => !toRemove.has(s));
  }

  return stages;
}

function validateStageProgression(stages: PhaseStage[]): PhaseStage[] {
  if (stages.length <= 1) return stages;

  const result: PhaseStage[] = [stages[0]];

  for (let i = 1; i < stages.length; i++) {
    const prev = PHASE_STAGE_ORDER[result[result.length - 1]];
    const curr = PHASE_STAGE_ORDER[stages[i]];
    if (curr >= prev) {
      result.push(stages[i]);
    }
  }

  return result;
}

function buildSingleBlueprint(
  stage: PhaseStage,
  index: number,
  total: number,
  _profile: NormalizedProfile,
  _learningGaps: LearningGap[],
  weakCoreSkills: StudyTaskSkill[],
  currentOfficial: number,
  targetOfficial: number,
): PhaseBlueprint {
  const focusSkills = resolveFocusSkills(stage, index, total, _learningGaps, weakCoreSkills);
  const primaryWeaknesses = _learningGaps
    .filter(g => focusSkills.includes(g.skill))
    .flatMap(g => g.weaknesses)
    .slice(0, 3);
  const bandGoal = resolveBandGoal(stage, index, total, currentOfficial, targetOfficial);

  return {
    stage,
    type: stageToPhaseType(stage),
    officialBandGoal: bandGoal,
    focusSkills,
    primaryWeaknesses,
    title: generatePhaseTitle(stage, index, total, focusSkills, bandGoal),
    summary: generatePhaseSummary(stage, focusSkills, bandGoal),
    objectives: generatePhaseObjectives(stage, focusSkills, bandGoal),
    completionCriteria: generateCompletionCriteria(stage, focusSkills, bandGoal),
  };
}

function resolveFocusSkills(
  stage: PhaseStage,
  _index: number,
  _total: number,
  _learningGaps: LearningGap[],
  weakCoreSkills: StudyTaskSkill[],
): StudyTaskSkill[] {
  const coreSkills: StudyTaskSkill[] = ['listening', 'reading', 'writing', 'speaking'];
  const vocab: StudyTaskSkill = 'vocabulary';
  const grammarStudy: StudyTaskSkill = 'grammar';

  switch (stage) {
    case 'foundation': {
      if (weakCoreSkills.length > 0) {
        return [...new Set([vocab, grammarStudy, ...weakCoreSkills])];
      }
      return [vocab, grammarStudy, ...coreSkills];
    }

    case 'skill-development': {
      if (weakCoreSkills.length > 0) {
        return weakCoreSkills.slice(0, 3);
      }
      return coreSkills;
    }

    case 'guided-practice': {
      if (weakCoreSkills.length > 0) return weakCoreSkills.slice(0, 2);
      return coreSkills.slice(0, 3);
    }

    case 'accuracy': {
      if (weakCoreSkills.length > 0) return [...weakCoreSkills, grammarStudy];
      return coreSkills;
    }

    case 'performance':
      return coreSkills;

    case 'consistency':
      return coreSkills;

    case 'target-readiness':
      return coreSkills;

    case 'exam-readiness':
      return coreSkills;
  }
}

function resolveBandGoal(
  stage: PhaseStage,
  index: number,
  total: number,
  currentOfficial: number,
  targetOfficial: number,
): number {
  if (currentOfficial >= targetOfficial) return targetOfficial;

  const validBands = OFFICIAL_IELTS_BANDS.filter(
    b => b > 0 && b >= currentOfficial && b <= targetOfficial,
  );

  if (validBands.length <= 1) return targetOfficial;

  if (stage === 'target-readiness' || stage === 'exam-readiness') {
    return targetOfficial;
  }

  const nonFinalCount = total - 2;
  if (nonFinalCount <= 0) return targetOfficial;

  const progression = buildBandProgression(validBands, nonFinalCount, currentOfficial, targetOfficial);

  if (index < progression.length) {
    return progression[index];
  }

  return targetOfficial;
}

function buildBandProgression(
  validBands: readonly number[],
  count: number,
  _currentOfficial: number,
  targetOfficial: number,
): number[] {
  if (validBands.length <= 1) return [targetOfficial];
  if (count <= 0) return [targetOfficial];

  const intermediateBands = validBands.slice(1);

  if (count <= intermediateBands.length) {
    return intermediateBands.slice(0, count);
  }

  const result: number[] = [];
  const lastValue = intermediateBands[intermediateBands.length - 1];

  result.push(...intermediateBands);

  while (result.length < count) {
    result.push(lastValue);
  }

  return result;
}

function stageToPhaseType(stage: PhaseStage): StudyPhaseType {
  const map: Record<PhaseStage, StudyPhaseType> = {
    'foundation': 'foundation',
    'skill-development': 'skill-building',
    'guided-practice': 'guided-practice',
    'accuracy': 'error-correction',
    'performance': 'timed-practice',
    'consistency': 'guided-practice',
    'target-readiness': 'mock-examination',
    'exam-readiness': 'exam-readiness',
  };
  return map[stage];
}

// ── Centralized Title Generator ──

export function generatePhaseTitle(
  stage: PhaseStage,
  _index: number,
  _total: number,
  focusSkills: StudyTaskSkill[],
  bandGoal: number,
): string {
  const bandStr = toDisplayBand(toNearestOfficialBand(bandGoal));
  const weakList = formatSkillList(focusSkills);

  switch (stage) {
    case 'foundation': {
      if (focusSkills.length <= 2) {
        return `Strengthen ${formatSkillList(focusSkills)} Foundations`;
      }
      const cSkills = focusSkills.filter(s => s === 'writing' || s === 'speaking');
      if (cSkills.length > 0) {
        return `Strengthen ${formatSkillList(cSkills)} Foundations`;
      }
      return `Build Core Band ${bandStr} Foundations`;
    }

    case 'skill-development': {
      if (weakList && weakList.length > 0) {
        return `Develop Core ${weakList} Skills`;
      }
      return `Develop Core Band ${bandStr} Skills`;
    }

    case 'guided-practice':
      return 'Apply Skills Through Guided IELTS Practice';

    case 'accuracy': {
      if (weakList && weakList.length > 0) {
        return `Improve ${weakList} Accuracy`;
      }
      return `Improve Grammar and Vocabulary Accuracy`;
    }

    case 'performance': {
      const perfSkills = getSkillStr(focusSkills);
      if (perfSkills && perfSkills.length > 0) {
        return `Build ${perfSkills} Performance Under Timed Conditions`;
      }
      return 'Build Performance Under Timed Conditions';
    }

    case 'consistency':
      return `Stabilize Band ${bandStr} Consistency`;

    case 'target-readiness':
      return `Confirm Band ${bandStr} Readiness`;

    case 'exam-readiness':
      return 'Prepare for Exam Day';
  }
}

function getSkillStr(skills: StudyTaskSkill[]): string {
  return formatSkillList(skills.filter(s => s !== 'vocabulary' && s !== 'grammar'));
}

export function generatePhaseSummary(
  stage: PhaseStage,
  _focusSkills: StudyTaskSkill[],
  bandGoal: number,
): string {
  const bandStr = toDisplayBand(toNearestOfficialBand(bandGoal));

  switch (stage) {
    case 'foundation':
      return `Build reliable Band ${bandStr} fundamentals through targeted vocabulary, grammar, and core skill development`;

    case 'skill-development':
      return `Develop core Band ${bandStr} performance with focused practice on key skill areas`;

    case 'guided-practice':
      return `Apply improved techniques through authentic IELTS task formats and structured practice`;

    case 'accuracy':
      return `Reduce recurring mistakes and improve precision in weak areas`;

    case 'performance':
      return `Build speed and accuracy through timed practice sessions across all skills`;

    case 'consistency':
      return `Stabilize performance and eliminate inconsistent results through repeated assessment`;

    case 'target-readiness':
      return `Confirm Band ${bandStr} readiness through full mock tests and targeted revision`;

    case 'exam-readiness':
      return 'Complete final preparation, mock tests, and exam strategy review';
  }
}

export function generatePhaseObjectives(
  stage: PhaseStage,
  focusSkills: StudyTaskSkill[],
  bandGoal: number,
): string[] {
  const bandStr = toDisplayBand(toNearestOfficialBand(bandGoal));
  const skillList = formatSkillList(focusSkills);

  switch (stage) {
    case 'foundation':
      return [
        `Build vocabulary and grammar foundations for Band ${bandStr}`,
        `Establish core techniques for ${skillList || 'each IELTS skill'}`,
        'Complete initial diagnostic assessment',
      ];

    case 'skill-development':
      return [
        `Develop ${skillList || 'core'} skills to Band ${bandStr} level`,
        'Improve task response, coherence, and accuracy',
        'Build confidence in weaker skill areas',
      ];

    case 'guided-practice':
      return [
        'Apply learned techniques in guided practice sessions',
        'Complete structured exercises for each target skill',
        'Receive feedback and adjust approach',
      ];

    case 'accuracy':
      return [
        'Reduce error rates in weak skill areas',
        'Improve grammar precision and vocabulary range',
        'Address recurring mistake patterns',
      ];

    case 'performance':
      return [
        'Practice under timed conditions across all skills',
        'Build speed without sacrificing accuracy',
        `Produce Band ${bandStr}-level work within exam time limits`,
      ];

    case 'consistency':
      return [
        `Achieve Band ${bandStr} results across multiple assessments`,
        'Eliminate performance variability',
        'Build sustained focus and test endurance',
      ];

    case 'target-readiness':
      return [
        `Confirm Band ${bandStr} readiness through mock tests`,
        'Identify and address remaining gaps',
        'Refine test-taking strategy',
      ];

    case 'exam-readiness':
      return [
        'Complete full timed mock tests',
        'Review exam format and procedures',
        'Prepare mentally and logistically for exam day',
      ];
  }
}

export function generateCompletionCriteria(
  stage: PhaseStage,
  focusSkills: StudyTaskSkill[],
  bandGoal: number,
): string[] {
  const bandStr = toDisplayBand(toNearestOfficialBand(bandGoal));

  switch (stage) {
    case 'foundation':
      return [
        'Complete diagnostic assessment for all skills',
        'Complete foundation vocabulary and grammar exercises',
        `Demonstrate basic competency at Band ${bandStr} level`,
      ];

    case 'skill-development':
      return [
        `Complete skill-building exercises for ${focusSkills.length > 0 ? formatSkillList(focusSkills) : 'core skills'}`,
        'Maintain at least 60% accuracy across practice sessions',
        `Demonstrate improvement toward Band ${bandStr} performance`,
      ];

    case 'guided-practice':
      return [
        'Complete guided practice tasks for target skills',
        'Receive and incorporate feedback on at least 5 practice sessions',
        'Show consistent improvement in weak areas',
      ];

    case 'accuracy':
      return [
        'Reduce error rate by at least 20% in weak skills',
        'Complete error-correction exercises for recurring mistakes',
        'Maintain above 70% accuracy in practice sessions',
      ];

    case 'performance':
      return [
        'Complete timed practice sessions for all skills',
        'Complete tasks within time limits with acceptable accuracy',
        'Demonstrate improved speed and response quality',
      ];

    case 'consistency':
      return [
        `Achieve Band ${bandStr} or higher in at least 2 consecutive assessments`,
        'Demonstrate stable performance across different task types',
        'Complete consistency exercises for identified weak areas',
      ];

    case 'target-readiness':
      return [
        `Achieve target band in full mock test`,
        'Complete error analysis of mock test results',
        'Address remaining gaps identified in mock performance',
      ];

    case 'exam-readiness':
      return [
        'Complete at least one full timed mock test',
        'Review exam day procedures and time management',
        'Confirm logistic and mental readiness for exam day',
      ];
  }
}

// ── Validation Utilities ──

export function hasDuplicatePhaseTitles(phases: StudyPhase[]): boolean {
  const seen = new Set<string>();
  for (const p of phases) {
    const normalized = p.title.trim().toLowerCase().replace(/\s+/g, ' ');
    if (normalized.length === 0) continue;
    if (seen.has(normalized)) return true;
    seen.add(normalized);
  }
  return false;
}

export function isMonotonicStageProgression(phases: StudyPhase[]): boolean {
  for (let i = 1; i < phases.length; i++) {
    const prev = PHASE_STAGE_ORDER[phases[i - 1].stage];
    const curr = PHASE_STAGE_ORDER[phases[i].stage];
    if (curr < prev) return false;
  }
  return true;
}

export function isMonotonicBandProgression(phases: StudyPhase[]): boolean {
  for (let i = 1; i < phases.length; i++) {
    const prev = phases[i - 1].officialBandGoal ?? 0;
    const curr = phases[i].officialBandGoal ?? 0;
    if (curr < prev) return false;
  }
  return true;
}

export function hasRegressiveFinalPhase(phases: StudyPhase[]): boolean {
  if (phases.length < 2) return false;
  const last = phases[phases.length - 1].stage;
  const secondLast = phases[phases.length - 2].stage;
  return PHASE_STAGE_ORDER[last] < PHASE_STAGE_ORDER[secondLast];
}

export function areTitlesSemanticallyUnique(phases: StudyPhase[]): boolean {
  const basePhrases = ['building toward', 'ready for', 'developing', 'working toward'];
  const seenPhrases = new Set<string>();

  for (const p of phases) {
    const lower = p.title.trim().toLowerCase();
    for (const phrase of basePhrases) {
      if (lower.startsWith(phrase)) {
        const key = phrase;
        if (seenPhrases.has(key)) return false;
        seenPhrases.add(key);
      }
    }
  }
  return true;
}

export function detectGenericTitles(titles: string[]): string[] {
  const generic = [
    /^build toward/i,
    /^improve ielts/i,
    /^continue your journey/i,
    /^develop your english/i,
    /^reach your goal/i,
  ];

  return titles.filter(t => generic.some(r => r.test(t.trim())));
}

export function ensureUniqueTitles(blueprints: PhaseBlueprint[]): PhaseBlueprint[] {
  const seen = new Map<string, number>();
  return blueprints.map((blueprint, i) => {
    const normalized = blueprint.title.trim().toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(normalized)) {
      const copy = { ...blueprint };
      copy.title = `${blueprint.title} (Phase ${i + 1})`;
      return copy;
    }
    seen.set(normalized, i);
    return blueprint;
  });
}

// ── Helpers ──

function formatSkillList(skills: StudyTaskSkill[]): string {
  if (skills.length === 0) return '';

  const formattedNames: Record<string, string> = {
    listening: 'Listening',
    reading: 'Reading',
    writing: 'Writing',
    speaking: 'Speaking',
    vocabulary: 'Vocabulary',
    grammar: 'Grammar',
  };

  const unique = [...new Set(skills)];
  const names = unique.map(s => formattedNames[s] ?? s);

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export function analyzeLearningGaps(
  profile: NormalizedProfile,
  skillGaps: SkillGapScore[],
): LearningGap[] {
  const coreSkills = ['listening', 'reading', 'writing', 'speaking'] as const;
  const skills = profile.currentSkillBands;

  return coreSkills.map(skill => {
    const gap = skillGaps.find(g => g.skill === skill);
    const currentBand = skills[skill];
    const targetBand = (profile.targetSkillBands[skill as keyof typeof profile.targetSkillBands] ?? profile.targetOverallBand) as number;
    const bandGap = Math.max(0, targetBand - currentBand);
    const isWeak = profile.weakSkills.includes(skill);

    let priority: LearningGap['priority'] = 'low';
    if (bandGap >= 1.5 || (isWeak && bandGap >= 1)) priority = 'critical';
    else if (bandGap >= 1 || isWeak) priority = 'high';
    else if (bandGap >= 0.5) priority = 'medium';

    const weaknesses: string[] = [];
    if (isWeak) weaknesses.push('Declared as weak by learner');
    if (bandGap >= 1.5) weaknesses.push(`Large band gap (${bandGap.toFixed(1)})`);
    if (gap && gap.normalizedWeight > 0.3) weaknesses.push('High priority in skill analysis');

    return {
      skill,
      currentBand,
      targetBand,
      priority,
      weaknesses,
    };
  });
}

// ── Stage-specific day weights for date distribution ──

const STAGE_DAY_WEIGHTS: Record<string, number> = {
  'foundation': 1.5,
  'skill-development': 1.3,
  'guided-practice': 1.1,
  'accuracy': 1.0,
  'performance': 0.9,
  'consistency': 0.8,
  'target-readiness': 0.7,
  'exam-readiness': 0.5,
};

export function createStudyPhasesFromBlueprints(
  blueprints: PhaseBlueprint[],
  startDate: LocalDate,
  _profile: NormalizedProfile,
  window: PlanningWindow,
): { phases: StudyPhase[]; dateAssignments: Array<{ id: string; startDate: LocalDate; endDate: LocalDate }> } {
  const totalDays = window.totalCalendarDays;
  const totalWeight = blueprints.reduce((sum, bp) => sum + STAGE_DAY_WEIGHTS[bp.stage], 0);
  const rawDaysPerWeight = totalDays / Math.max(1, totalWeight);

  let currentDate = startDate;
  const dateAssignments: Array<{ id: string; startDate: LocalDate; endDate: LocalDate }> = [];

  for (let i = 0; i < blueprints.length; i++) {
    const isLast = i === blueprints.length - 1;

    const daysLeftInWindow = isBeforeOrSameDate(currentDate, window.finalStudyDate)
      ? daysBetweenDate(currentDate, window.finalStudyDate) + 1
      : 0;

    if (isLast || daysLeftInWindow <= 1) {
      dateAssignments.push({ id: `phase-${i + 1}`, startDate: currentDate, endDate: window.finalStudyDate });
      for (let j = i + 1; j < blueprints.length; j++) {
        dateAssignments.push({ id: `phase-${j + 1}`, startDate: window.finalStudyDate, endDate: window.finalStudyDate });
      }
      break;
    }

    const minForRemaining = (blueprints.length - i - 1) * 2;
    const maxForThis = daysLeftInWindow - minForRemaining;
    const stageWeight = STAGE_DAY_WEIGHTS[blueprints[i].stage];
    const weightedDays = Math.round(rawDaysPerWeight * stageWeight);
    const phaseDays = Math.max(2, Math.min(weightedDays, maxForThis));

    const d = parseDate(currentDate);
    d.setDate(d.getDate() + phaseDays - 1);
    const endDate = formatDate(d);

    dateAssignments.push({ id: `phase-${i + 1}`, startDate: currentDate, endDate });
    currentDate = addDays(endDate, 1);
  }

  const phases: StudyPhase[] = blueprints.map((blueprint, i) => ({
    id: `phase-${i + 1}`,
    type: blueprint.type,
    stage: blueprint.stage,
    title: blueprint.title,
    description: blueprint.summary,
    summary: blueprint.summary,
    startDate: dateAssignments[i]?.startDate ?? startDate,
    endDate: dateAssignments[i]?.endDate ?? window.finalStudyDate,
    targetSkills: blueprint.focusSkills,
    objectives: blueprint.objectives,
    completionCriteria: blueprint.completionCriteria,
    allocatedMinutes: 0,
    scheduledMinutes: 0,
    order: i + 1,
    status: 'upcoming',
    officialBandGoal: blueprint.officialBandGoal,
  }));

  return { phases, dateAssignments };
}

function parseDate(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function isBeforeOrSameDate(a: string, b: string): boolean {
  return a <= b;
}

function daysBetweenDate(a: string, b: string): number {
  const da = parseDate(a);
  const db = parseDate(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
