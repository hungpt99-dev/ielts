// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — MasteryProfile
// ═══════════════════════════════════════════════════════════════════════

export interface SkillMastery {
  score: number
  exposureCount: number
  usageCount: number
  correctUsageCount: number
  lastUsedAt?: string
  lastEncounteredAt?: string
}

export interface MasteryProfile {
  wordId: string
  reading: SkillMastery
  listening: SkillMastery
  writing: SkillMastery
  speaking: SkillMastery
  overall: SkillMastery
}

export function createSkillMastery(overrides: Partial<SkillMastery> = {}): SkillMastery {
  return {
    score: 0,
    exposureCount: 0,
    usageCount: 0,
    correctUsageCount: 0,
    ...overrides,
  }
}

export function createMasteryProfile(overrides: Partial<MasteryProfile> = {}): MasteryProfile {
  return {
    wordId: '',
    reading: createSkillMastery(),
    listening: createSkillMastery(),
    writing: createSkillMastery(),
    speaking: createSkillMastery(),
    overall: createSkillMastery(),
    ...overrides,
  }
}
