import { describe, it, expect } from 'vitest'
import {
  calculateMastery,
  calculateOverallMastery,
  SKILL,
  type Interaction,
  type InteractionType,
  type MasteryProfile,
  type SkillType,
} from '../policies'

const MS_PER_DAY = 86_400_000
const NOW = new Date('2025-06-01T00:00:00.000Z')

function makeProfile(overrides: Partial<MasteryProfile> = {}): MasteryProfile {
  return {
    wordId: 'word-1',
    skills: {
      [SKILL.READING]: { score: 0, lastInteractionDate: null },
      [SKILL.LISTENING]: { score: 0, lastInteractionDate: null },
      [SKILL.WRITING]: { score: 0, lastInteractionDate: null },
      [SKILL.SPEAKING]: { score: 0, lastInteractionDate: null },
    },
    overallMastery: 0,
    ...overrides,
  }
}

function interaction(
  skill: SkillType,
  type: InteractionType,
  correct = true,
  daysAgo = 0,
): Interaction {
  return {
    skill,
    type,
    date: new Date(NOW.getTime() - daysAgo * MS_PER_DAY),
    correct,
  }
}

function review(skill: SkillType, correct: boolean, daysAgo = 0) {
  return {
    skill,
    date: new Date(NOW.getTime() - daysAgo * MS_PER_DAY),
    correct,
  }
}

describe('MasteryCalculationPolicy — calculateMastery', () => {
  it('never-interacted word scores 0 across all skills', () => {
    const result = calculateMastery(makeProfile(), [], [], NOW)
    expect(result.skills[SKILL.READING].score).toBe(0)
    expect(result.skills[SKILL.LISTENING].score).toBe(0)
    expect(result.skills[SKILL.WRITING].score).toBe(0)
    expect(result.skills[SKILL.SPEAKING].score).toBe(0)
    expect(result.overallMastery).toBe(0)
  })

  it('perfectly acquired word reaches 100 in every skill and overall', () => {
    const interactions = []
    const reviews = []
    for (let i = 0; i < 20; i += 1) {
      interactions.push(interaction(SKILL.READING, 'EXPOSURE'))
      reviews.push(review(SKILL.READING, true))
    }
    for (let i = 0; i < 10; i += 1) {
      interactions.push(interaction(SKILL.LISTENING, 'AUDIO_RECOGNITION'))
      reviews.push(review(SKILL.LISTENING, true))
    }
    for (let i = 0; i < 15; i += 1) {
      interactions.push(interaction(SKILL.WRITING, 'USAGE'))
      interactions.push(interaction(SKILL.SPEAKING, 'USAGE'))
    }

    const result = calculateMastery(makeProfile(), interactions, reviews, NOW)
    expect(result.skills[SKILL.READING].score).toBe(100)
    expect(result.skills[SKILL.LISTENING].score).toBe(100)
    expect(result.skills[SKILL.WRITING].score).toBe(100)
    expect(result.skills[SKILL.SPEAKING].score).toBe(100)
    expect(result.overallMastery).toBe(100)
  })

  it('writing/speaking reach 100 with far fewer interactions than reading/listening', () => {
    const writing = calculateMastery(
      makeProfile(),
      [interaction(SKILL.WRITING, 'USAGE'), interaction(SKILL.SPEAKING, 'USAGE')],
      [],
      NOW,
    )
    const reading = calculateMastery(
      makeProfile(),
      [interaction(SKILL.READING, 'EXPOSURE')],
      [],
      NOW,
    )
    expect(writing.skills[SKILL.WRITING].score).toBeGreaterThan(reading.skills[SKILL.READING].score)
  })

  it('review accuracy is incorporated into reading/listening scores', () => {
    const accurate = calculateMastery(
      makeProfile(),
      [
        interaction(SKILL.READING, 'EXPOSURE'),
        interaction(SKILL.READING, 'EXPOSURE'),
        interaction(SKILL.READING, 'EXPOSURE'),
      ],
      [review(SKILL.READING, true), review(SKILL.READING, true), review(SKILL.READING, true)],
      NOW,
    )
    const inaccurate = calculateMastery(
      makeProfile(),
      [
        interaction(SKILL.READING, 'EXPOSURE'),
        interaction(SKILL.READING, 'EXPOSURE'),
        interaction(SKILL.READING, 'EXPOSURE'),
      ],
      [review(SKILL.READING, false), review(SKILL.READING, false), review(SKILL.READING, false)],
      NOW,
    )
    expect(accurate.skills[SKILL.READING].score).toBeGreaterThan(
      inaccurate.skills[SKILL.READING].score,
    )
  })

  it('score decays by ~5% per 30 days of inactivity per skill', () => {
    const fresh = calculateMastery(
      makeProfile(),
      [interaction(SKILL.READING, 'EXPOSURE')],
      [review(SKILL.READING, true)],
      NOW,
    )
    const stale = calculateMastery(
      makeProfile(),
      [interaction(SKILL.READING, 'EXPOSURE', true, 60)],
      [review(SKILL.READING, true, 60)],
      NOW,
    )
    const expected = fresh.skills[SKILL.READING].score * 0.95 * 0.95
    expect(stale.skills[SKILL.READING].score).toBeCloseTo(expected, 5)
  })

  it('words used across multiple skills receive a bonus', () => {
    const singleSkill = calculateMastery(
      makeProfile(),
      [interaction(SKILL.READING, 'USAGE'), interaction(SKILL.READING, 'USAGE')],
      [],
      NOW,
    )
    const multiSkill = calculateMastery(
      makeProfile(),
      [interaction(SKILL.READING, 'USAGE'), interaction(SKILL.WRITING, 'USAGE')],
      [],
      NOW,
    )
    expect(multiSkill.skills[SKILL.READING].score).toBeGreaterThan(
      singleSkill.skills[SKILL.READING].score,
    )
  })

  it('0 usageCount yields a 0 production score instead of a divide-by-zero', () => {
    const result = calculateMastery(
      makeProfile(),
      [interaction(SKILL.WRITING, 'EXPOSURE')],
      [],
      NOW,
    )
    expect(result.skills[SKILL.WRITING].score).toBe(0)
  })

  it('scores are clamped to [0, 100]', () => {
    const result = calculateMastery(
      makeProfile(),
      [interaction(SKILL.WRITING, 'USAGE'), interaction(SKILL.SPEAKING, 'USAGE')],
      [],
      NOW,
    )
    for (const skill of [SKILL.READING, SKILL.LISTENING, SKILL.WRITING, SKILL.SPEAKING]) {
      expect(result.skills[skill].score).toBeGreaterThanOrEqual(0)
      expect(result.skills[skill].score).toBeLessThanOrEqual(100)
    }
  })
})

describe('MasteryCalculationPolicy — calculateOverallMastery', () => {
  it('weights writing/speaking above reading/listening', () => {
    const writingHeavy = calculateOverallMastery(
      makeProfile({
        skills: {
          [SKILL.READING]: { score: 0, lastInteractionDate: null },
          [SKILL.LISTENING]: { score: 0, lastInteractionDate: null },
          [SKILL.WRITING]: { score: 100, lastInteractionDate: null },
          [SKILL.SPEAKING]: { score: 0, lastInteractionDate: null },
        },
      }),
      0.5,
    )
    const readingHeavy = calculateOverallMastery(
      makeProfile({
        skills: {
          [SKILL.READING]: { score: 100, lastInteractionDate: null },
          [SKILL.LISTENING]: { score: 0, lastInteractionDate: null },
          [SKILL.WRITING]: { score: 0, lastInteractionDate: null },
          [SKILL.SPEAKING]: { score: 0, lastInteractionDate: null },
        },
      }),
      0.5,
    )
    expect(writingHeavy).toBeCloseTo(30, 5)
    expect(readingHeavy).toBeCloseTo(20, 5)
    expect(writingHeavy).toBeGreaterThan(readingHeavy)
  })

  it('neutral confidence reproduces the plain weighted formula', () => {
    const result = calculateOverallMastery(
      makeProfile({
        skills: {
          [SKILL.READING]: { score: 50, lastInteractionDate: null },
          [SKILL.LISTENING]: { score: 50, lastInteractionDate: null },
          [SKILL.WRITING]: { score: 50, lastInteractionDate: null },
          [SKILL.SPEAKING]: { score: 50, lastInteractionDate: null },
        },
      }),
      0.5,
    )
    expect(result).toBeCloseTo(50, 5)
  })

  it('clamps result to [0, 100]', () => {
    const high = calculateOverallMastery(
      makeProfile({
        skills: {
          [SKILL.READING]: { score: 100, lastInteractionDate: null },
          [SKILL.LISTENING]: { score: 100, lastInteractionDate: null },
          [SKILL.WRITING]: { score: 100, lastInteractionDate: null },
          [SKILL.SPEAKING]: { score: 100, lastInteractionDate: null },
        },
      }),
      1,
    )
    expect(high).toBe(100)
  })
})
