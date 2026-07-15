import { describe, it, expect } from 'vitest';
import {
  buildPhaseBlueprints,
  createStudyPhasesFromBlueprints,
  hasDuplicatePhaseTitles,
  isMonotonicStageProgression,
  isMonotonicBandProgression,
  hasRegressiveFinalPhase,
  areTitlesSemanticallyUnique,
  detectGenericTitles,
  ensureUniqueTitles,
  analyzeLearningGaps,
  generatePhaseTitle,
  PhaseBlueprint,
} from '../phase-blueprint';
import type {
  NormalizedProfile,
  PlanningWindow,
  SkillGapScore,
  StudyPhase,
  StudyPhaseType,
} from '../types';

function makeProfile(overrides?: Partial<NormalizedProfile>): NormalizedProfile {
  return {
    currentOverallBand: 5.5,
    targetOverallBand: 6.5,
    currentSkillBands: { listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.0 },
    targetSkillBands: {},
    examType: 'academic',
    examDate: '2026-12-31',
    planStartDate: '2026-07-14',
    timezone: 'UTC',
    weeklyAvailability: {
      monday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      tuesday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      wednesday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      thursday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      friday: { enabled: true, availableMinutes: 60, maximumSessionMinutes: 60, maximumSessions: 3 },
      saturday: { enabled: false, availableMinutes: 0, maximumSessionMinutes: 0, maximumSessions: 0 },
      sunday: { enabled: false, availableMinutes: 0, maximumSessionMinutes: 0, maximumSessions: 0 },
    },
    availabilityExceptions: [],
    targetDailyMinutes: 120,
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
    userConfidence: {},
    manuallySelectedPrioritySkills: [],
    offlineOnlyMode: true,
    aiProviderAvailable: false,
    ...overrides,
  };
}

function makeWindow(overrides?: Partial<PlanningWindow>): PlanningWindow {
  return {
    startDate: '2026-07-14',
    examDate: '2026-12-31',
    finalStudyDate: '2026-12-31',
    totalCalendarDays: 170,
    totalAvailableStudyDays: 120,
    totalAvailableMinutes: 7200,
    reservedBufferMinutes: 720,
    schedulableMinutes: 6480,
    ...overrides,
  };
}

function makeSkillGaps(): SkillGapScore[] {
  return [
    { skill: 'listening', bandGap: 0.5, priorityScore: 0.15, normalizedWeight: 0.1, reasons: [] },
    { skill: 'reading', bandGap: 0.5, priorityScore: 0.15, normalizedWeight: 0.1, reasons: [] },
    { skill: 'writing', bandGap: 1.5, priorityScore: 0.40, normalizedWeight: 0.35, reasons: ['Weak skill', 'Large gap'] },
    { skill: 'speaking', bandGap: 1.5, priorityScore: 0.40, normalizedWeight: 0.35, reasons: ['Weak skill', 'Large gap'] },
    { skill: 'vocabulary', bandGap: 1.0, priorityScore: 0.20, normalizedWeight: 0.05, reasons: [] },
    { skill: 'grammar', bandGap: 1.0, priorityScore: 0.20, normalizedWeight: 0.05, reasons: [] },
  ];
}

function phasesFromBlueprints(blueprints: PhaseBlueprint[]): StudyPhase[] {
  const window = makeWindow();
  const profile = makeProfile();
  const { phases } = createStudyPhasesFromBlueprints(blueprints, window.startDate, profile, window);
  return phases;
}

// ── Phase Blueprint Tests ──

describe('buildPhaseBlueprints', () => {
  it('generates unique titles for all phases', () => {
    const profile = makeProfile();
    const window = makeWindow();
    const gaps = makeSkillGaps();
    const blueprints = buildPhaseBlueprints(profile, window, gaps);

    const titles = blueprints.map(bp => bp.title);
    const uniqueTitles = new Set(titles);
    expect(titles.length).toBe(uniqueTitles.size);
  });

  it('generates monotonic stage progression', () => {
    const profile = makeProfile();
    const window = makeWindow();
    const gaps = makeSkillGaps();
    const blueprints = buildPhaseBlueprints(profile, window, gaps);
    const phases = phasesFromBlueprints(blueprints);

    expect(isMonotonicStageProgression(phases)).toBe(true);
  });

  it('ends with exam-readiness stage', () => {
    const profile = makeProfile();
    const window = makeWindow({ totalCalendarDays: 170 });
    const gaps = makeSkillGaps();
    const blueprints = buildPhaseBlueprints(profile, window, gaps);

    const last = blueprints[blueprints.length - 1];
    expect(last.stage).toBe('exam-readiness');
  });

  it('generates fewer phases for short windows', () => {
    const profile = makeProfile();
    const window = makeWindow({ totalCalendarDays: 10, totalAvailableStudyDays: 8 });
    const gaps = makeSkillGaps();
    const blueprints = buildPhaseBlueprints(profile, window, gaps);

    expect(blueprints.length).toBeLessThanOrEqual(5);
    expect(blueprints.length).toBeGreaterThanOrEqual(2);
  });

  it('includes foundation stage for weak skills', () => {
    const profile = makeProfile();
    const window = makeWindow({ totalCalendarDays: 90 });
    const gaps = makeSkillGaps();
    const blueprints = buildPhaseBlueprints(profile, window, gaps);

    const stages = blueprints.map(bp => bp.stage);
    expect(stages).toContain('foundation');
  });

  it('early phases focus on weak skills', () => {
    const profile = makeProfile();
    const window = makeWindow({ totalCalendarDays: 170 });
    const gaps = makeSkillGaps();
    const blueprints = buildPhaseBlueprints(profile, window, gaps);

    const firstPhaseSkills = blueprints[0].focusSkills;
    expect(firstPhaseSkills).toContain('writing');
    expect(firstPhaseSkills).toContain('speaking');
  });
});

// ── Title Uniqueness Tests ──

describe('hasDuplicatePhaseTitles', () => {
  it('returns false for unique titles', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: 'Strengthen Writing and Speaking Foundations', description: '', summary: '', startDate: '2026-07-14', endDate: '2026-07-20', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'skill-building', stage: 'skill-development', title: 'Develop Core Writing and Speaking Skills', description: '', summary: '', startDate: '2026-07-21', endDate: '2026-08-10', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];
    expect(hasDuplicatePhaseTitles(phases)).toBe(false);
  });

  it('returns true for duplicate titles', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: 'Building toward Band 6.5', description: '', summary: '', startDate: '2026-07-14', endDate: '2026-07-20', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'skill-building', stage: 'skill-development', title: 'Building toward Band 6.5', description: '', summary: '', startDate: '2026-07-21', endDate: '2026-08-10', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];
    expect(hasDuplicatePhaseTitles(phases)).toBe(true);
  });
});

// ── Monotonic Progression Tests ──

describe('isMonotonicStageProgression', () => {
  it('returns true for valid progression', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: 'Phase 1', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'skill-building', stage: 'skill-development', title: 'Phase 2', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
      { id: '3', type: 'exam-readiness', stage: 'exam-readiness', title: 'Phase 3', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 3, status: 'upcoming' },
    ];
    expect(isMonotonicStageProgression(phases)).toBe(true);
  });

  it('returns false for regressive progression', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'exam-readiness', stage: 'exam-readiness', title: 'Phase 1', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'foundation', stage: 'foundation', title: 'Phase 2', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];
    expect(isMonotonicStageProgression(phases)).toBe(false);
  });
});

describe('isMonotonicBandProgression', () => {
  it('returns true for non-decreasing band goals', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: '', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming', officialBandGoal: 6.0 },
      { id: '2', type: 'skill-building', stage: 'skill-development', title: '', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming', officialBandGoal: 6.5 },
    ];
    expect(isMonotonicBandProgression(phases)).toBe(true);
  });

  it('returns false for decreasing band goals', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: '', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming', officialBandGoal: 6.5 },
      { id: '2', type: 'skill-building', stage: 'skill-development', title: '', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming', officialBandGoal: 6.0 },
    ];
    expect(isMonotonicBandProgression(phases)).toBe(false);
  });
});

describe('hasRegressiveFinalPhase', () => {
  it('returns false when final phase is most advanced', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: '', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'exam-readiness', stage: 'exam-readiness', title: '', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];
    expect(hasRegressiveFinalPhase(phases)).toBe(false);
  });

  it('returns true when final phase is less advanced', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'mock-examination' as StudyPhaseType, stage: 'target-readiness', title: '', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'foundation', stage: 'foundation', title: '', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];
    expect(hasRegressiveFinalPhase(phases)).toBe(true);
  });
});

describe('areTitlesSemanticallyUnique', () => {
  it('returns true for distinct semantic titles', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: 'Strengthen Writing Foundations', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'skill-building', stage: 'skill-development', title: 'Develop Core Skills', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];
    expect(areTitlesSemanticallyUnique(phases)).toBe(true);
  });

  it('returns false for repeated "Building toward" pattern', () => {
    const phases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: 'Building toward Band 6.0', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'skill-building', stage: 'skill-development', title: 'Building toward Band 6.5', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];
    expect(areTitlesSemanticallyUnique(phases)).toBe(false);
  });
});

describe('detectGenericTitles', () => {
  it('detects "Build toward" patterns', () => {
    const result = detectGenericTitles(['Build toward Band 6.5', 'Develop Core Skills']);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Build toward Band 6.5');
  });

  it('returns empty for non-generic titles', () => {
    const result = detectGenericTitles(['Strengthen Writing Foundations', 'Develop Core Skills', 'Prepare for Exam Day']);
    expect(result).toHaveLength(0);
  });
});

describe('ensureUniqueTitles', () => {
  it('appends phase number for duplicate titles', () => {
    const blueprints: PhaseBlueprint[] = [
      {
        stage: 'foundation', type: 'foundation', officialBandGoal: 6.0, focusSkills: ['writing'], primaryWeaknesses: [],
        title: 'Building toward Band 6.5', summary: '', objectives: [], completionCriteria: [],
      },
      {
        stage: 'skill-development', type: 'skill-building', officialBandGoal: 6.5, focusSkills: ['writing'], primaryWeaknesses: [],
        title: 'Building toward Band 6.5', summary: '', objectives: [], completionCriteria: [],
      },
    ];
    const result = ensureUniqueTitles(blueprints);
    expect(result[0].title).toBe('Building toward Band 6.5');
    expect(result[1].title).toContain('(Phase 2)');
  });
});

// ── Learning Gap Analysis Tests ──

describe('analyzeLearningGaps', () => {
  it('identifies critical gaps for skills with large band difference', () => {
    const profile = makeProfile();
    const gaps = makeSkillGaps();
    const learningGaps = analyzeLearningGaps(profile, gaps);

    const writingGap = learningGaps.find(g => g.skill === 'writing');
    expect(writingGap?.priority).toBe('critical');

    const listeningGap = learningGaps.find(g => g.skill === 'listening');
    expect(listeningGap?.priority).toBe('medium');
  });

  it('marks weak skills as high priority', () => {
    const profile = makeProfile();
    const gaps = makeSkillGaps();
    const gapsWithAccuracy = [
      ...gaps.filter(g => g.skill !== 'writing' && g.skill !== 'speaking'),
      { skill: 'writing' as const, bandGap: 1.0, priorityScore: 0.4, normalizedWeight: 0.3, reasons: ['Weak skill'] },
      { skill: 'speaking' as const, bandGap: 0.5, priorityScore: 0.3, normalizedWeight: 0.2, reasons: [] },
    ];
    const learningGaps = analyzeLearningGaps(
      { ...profile, weakSkills: ['writing'] },
      gapsWithAccuracy,
    );

    const writingGap = learningGaps.find(g => g.skill === 'writing');
    expect(writingGap?.priority).toBe('critical');

    const speakingGap = learningGaps.find(g => g.skill === 'speaking');
    expect(speakingGap?.priority).toBe('critical');
  });
});

// ── Title Generator Tests ──

describe('generatePhaseTitle', () => {
  it('generates foundation title with weak skill names', () => {
    const title = generatePhaseTitle('foundation', 0, 8, ['writing', 'speaking'], 6.0);
    expect(title).toContain('Writing');
    expect(title).toContain('Speaking');
    expect(title).toContain('Foundations');
  });

  it('generates distinct titles for each stage', () => {
    const stages = ['foundation', 'skill-development', 'guided-practice', 'accuracy', 'performance', 'consistency', 'target-readiness', 'exam-readiness'] as const;
    const titles = stages.map((s, i) => generatePhaseTitle(s, i, 8, ['writing', 'speaking', 'reading', 'listening'], 6.5));
    const unique = new Set(titles);
    expect(unique.size).toBe(stages.length);
  });

  it('does not produce "Building toward" for every stage', () => {
    const stages = ['foundation', 'skill-development', 'guided-practice', 'accuracy', 'performance', 'consistency', 'target-readiness', 'exam-readiness'] as const;
    const titles = stages.map((s, i) => generatePhaseTitle(s, i, 8, ['writing', 'speaking'], 6.5));
    const buildingCount = titles.filter(t => t.toLowerCase().includes('building toward')).length;
    expect(buildingCount).toBeLessThanOrEqual(1);
  });

  it('exam-readiness title never references a specific band', () => {
    const title = generatePhaseTitle('exam-readiness', 7, 8, ['listening', 'reading', 'writing', 'speaking'], 6.5);
    expect(title).not.toMatch(/Band \d/);
    expect(title).toContain('Exam Day');
  });
});

// ── Integration: Blueprint → Phases → Validation ──

describe('integration: blueprint to phases to validation', () => {
  it('full pipeline produces valid phases for typical 5.5→6.5 profile', () => {
    const profile = makeProfile();
    const window = makeWindow({ totalCalendarDays: 170 });
    const gaps = makeSkillGaps();

    const blueprints = buildPhaseBlueprints(profile, window, gaps);
    const phases = phasesFromBlueprints(blueprints);

    expect(phases.length).toBeGreaterThanOrEqual(4);
    expect(hasDuplicatePhaseTitles(phases)).toBe(false);
    expect(isMonotonicStageProgression(phases)).toBe(true);
    expect(isMonotonicBandProgression(phases)).toBe(true);
    expect(hasRegressiveFinalPhase(phases)).toBe(false);
    expect(areTitlesSemanticallyUnique(phases)).toBe(true);
    expect(detectGenericTitles(phases.map(p => p.title))).toHaveLength(0);
    expect(phases[phases.length - 1].stage).toBe('exam-readiness');
  });

  it('validates known-bad phase sequences', () => {
    const badPhases: StudyPhase[] = [
      { id: '1', type: 'mock-examination' as StudyPhaseType, stage: 'target-readiness', title: 'Ready for Band 6.5', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'foundation', stage: 'foundation', title: 'Building toward Band 6.5', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];

    expect(isMonotonicStageProgression(badPhases)).toBe(false);
    expect(hasRegressiveFinalPhase(badPhases)).toBe(true);
  });

  it('sequential phases with same title are detected', () => {
    const badPhases: StudyPhase[] = [
      { id: '1', type: 'foundation', stage: 'foundation', title: 'Building toward Band 6.5', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 1, status: 'upcoming' },
      { id: '2', type: 'skill-building', stage: 'skill-development', title: 'Building toward Band 6.5', description: '', summary: '', startDate: '', endDate: '', targetSkills: [], objectives: [], completionCriteria: [], allocatedMinutes: 0, scheduledMinutes: 0, order: 2, status: 'upcoming' },
    ];
    expect(hasDuplicatePhaseTitles(badPhases)).toBe(true);
  });

  it('generated 8 distinct phases for long timeline', () => {
    const profile = makeProfile();
    const window = makeWindow({ totalCalendarDays: 170 });
    const gaps = makeSkillGaps();
    const blueprints = buildPhaseBlueprints(profile, window, gaps);
    const phases = phasesFromBlueprints(blueprints);

    expect(phases.length).toBe(8);
    const titles = phases.map(p => p.title);
    expect(new Set(titles).size).toBe(8);
  });
});
