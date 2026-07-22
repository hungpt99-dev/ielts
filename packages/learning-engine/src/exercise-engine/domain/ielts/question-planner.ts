import type {
  ReadingPassageProfile,
  ReadingQuestionPlan,
  ReadingTaskGroupPlan,
  ReadingQuestionSkill,
  ReadingExerciseType,
} from './ielts-types'

const SKILL_TO_EXERCISE_TYPE: Record<string, ReadingExerciseType[]> = {
  'main-idea': ['multiple-choice-single', 'matching-headings'],
  'specific-detail': ['multiple-choice-single', 'true-false-not-given', 'sentence-completion', 'short-answer'],
  'paraphrase': ['true-false-not-given', 'sentence-completion', 'multiple-choice-single', 'matching-information'],
  'inference': ['multiple-choice-single', 'true-false-not-given', 'yes-no-not-given'],
  'paragraph-purpose': ['multiple-choice-single', 'matching-headings', 'matching-information'],
  'writer-purpose': ['multiple-choice-single', 'yes-no-not-given'],
  'reference-tracking': ['multiple-choice-single', 'short-answer'],
  'reference': ['multiple-choice-single', 'true-false-not-given'],
  'comparison': ['multiple-choice-single', 'true-false-not-given', 'matching-features'],
  'cause-effect': ['multiple-choice-single', 'sentence-completion', 'true-false-not-given'],
  'vocabulary-in-context': ['multiple-choice-single'],
  'cross-paragraph-synthesis': ['multiple-choice-single', 'matching-information'],
  'information-location': ['multiple-choice-single', 'true-false-not-given', 'short-answer'],
}

const SKILL_DISTRIBUTION_GUIDANCE: Record<number, ReadingQuestionSkill[]> = {
  3: ['specific-detail', 'paraphrase', 'inference'],
  4: ['specific-detail', 'paraphrase', 'inference', 'main-idea'],
  5: ['specific-detail', 'paraphrase', 'inference', 'main-idea', 'cause-effect'],
  6: ['specific-detail', 'paraphrase', 'inference', 'paragraph-purpose', 'reference-tracking', 'cause-effect'],
  7: ['specific-detail', 'paraphrase', 'inference', 'paragraph-purpose', 'reference-tracking', 'cause-effect', 'comparison'],
  8: ['specific-detail', 'paraphrase', 'inference', 'paragraph-purpose', 'reference-tracking', 'cause-effect', 'comparison', 'main-idea'],
  9: ['specific-detail', 'paraphrase', 'inference', 'paragraph-purpose', 'writer-purpose', 'reference-tracking', 'cause-effect', 'comparison', 'main-idea'],
  10: ['specific-detail', 'specific-detail', 'paraphrase', 'paraphrase', 'inference', 'paragraph-purpose', 'reference-tracking', 'cause-effect', 'comparison', 'main-idea'],
  11: ['specific-detail', 'specific-detail', 'paraphrase', 'paraphrase', 'inference', 'inference', 'paragraph-purpose', 'reference-tracking', 'cause-effect', 'comparison', 'main-idea'],
  12: ['specific-detail', 'specific-detail', 'specific-detail', 'paraphrase', 'paraphrase', 'inference', 'inference', 'paragraph-purpose', 'reference-tracking', 'cause-effect', 'comparison', 'main-idea'],
  13: ['specific-detail', 'specific-detail', 'specific-detail', 'paraphrase', 'paraphrase', 'inference', 'inference', 'paragraph-purpose', 'reference-tracking', 'cause-effect', 'comparison', 'main-idea', 'cross-paragraph-synthesis'],
  14: ['specific-detail', 'specific-detail', 'specific-detail', 'paraphrase', 'paraphrase', 'inference', 'inference', 'paragraph-purpose', 'reference-tracking', 'cause-effect', 'comparison', 'main-idea', 'cross-paragraph-synthesis', 'writer-purpose'],
}

const GROUP_TYPE_PREFERENCES: ReadingExerciseType[][] = [
  ['true-false-not-given', 'multiple-choice-single'],
  ['multiple-choice-single', 'sentence-completion'],
  ['true-false-not-given', 'sentence-completion'],
  ['multiple-choice-single', 'matching-information'],
  ['true-false-not-given', 'multiple-choice-single', 'sentence-completion'],
]

export function createReadingQuestionPlan(
  totalQuestions: number,
  targetBand: number,
  profile: ReadingPassageProfile,
): ReadingQuestionPlan {
  const maxDirectRatio = 0.4
  const skills = selectSkills(totalQuestions, targetBand, profile)
  const groups = createTaskGroups(totalQuestions, skills, profile)
  const maxDirectCount = Math.floor(totalQuestions * maxDirectRatio)

  return {
    totalQuestions,
    taskGroups: groups,
    requiredSkills: skills,
    maximumDirectRetrievalRatio: maxDirectRatio,
  }
}

function selectSkills(
  totalQuestions: number,
  targetBand: number,
  profile: ReadingPassageProfile,
): ReadingQuestionSkill[] {
  const baseSkills = SKILL_DISTRIBUTION_GUIDANCE[totalQuestions] || [
    'specific-detail', 'paraphrase', 'inference', 'paragraph-purpose',
    'reference-tracking', 'cause-effect',
  ]

  const selected = [...baseSkills]

  if (targetBand >= 6.5 && !selected.includes('cross-paragraph-synthesis')) {
    selected.push('cross-paragraph-synthesis')
  }
  if (targetBand >= 6.0 && !selected.includes('writer-purpose')) {
    selected.push('writer-purpose')
  }
  if (profile.referenceTrackingDemand > 0.5 && !selected.includes('reference-tracking')) {
    selected.push('reference-tracking')
  }
  if (profile.crossParagraphConnections > 0.5 && !selected.includes('comparison')) {
    selected.push('comparison')
  }

  // Ensure direct detail doesn't dominate
  const directDetailCount = selected.filter(s =>
    s === 'specific-detail' || s === 'information-location'
  ).length
  if (directDetailCount > Math.ceil(totalQuestions * 0.4)) {
    for (let i = selected.length - 1; i >= 0; i--) {
      if (selected[i] === 'specific-detail') {
        selected.splice(i, 1)
        break
      }
    }
    if (!selected.includes('paraphrase')) selected.push('paraphrase')
  }

  return selected.slice(0, totalQuestions)
}

function createTaskGroups(
  totalQuestions: number,
  skills: ReadingQuestionSkill[],
  profile: ReadingPassageProfile,
): ReadingTaskGroupPlan[] {
  if (totalQuestions <= 3) {
    return [{
      type: 'multiple-choice-single',
      questionCount: totalQuestions,
      skills: skills.slice(0, totalQuestions),
    }]
  }

  if (totalQuestions <= 6) {
    return createSmallActivityGroups(totalQuestions, skills, profile)
  }

  if (totalQuestions <= 10) {
    return createLargerActivityGroups(totalQuestions, skills, profile)
  }

  return createFullPassageSimulationGroups(totalQuestions, skills, profile)
}

function createSmallActivityGroups(
  totalQuestions: number,
  skills: ReadingQuestionSkill[],
  profile: ReadingPassageProfile,
): ReadingTaskGroupPlan[] {
  const groups: ReadingTaskGroupPlan[] = []

  const hasInference = skills.includes('inference')
  const hasComparison = skills.includes('comparison') || skills.includes('cause-effect')
  const hasParagraphPurpose = skills.includes('paragraph-purpose') || skills.includes('main-idea')

  const tfngCount = hasInference && totalQuestions >= 4 ? Math.min(3, Math.floor(totalQuestions * 0.5)) : 0
  const mcCount = totalQuestions - tfngCount

  if (tfngCount > 0) {
    const tfngSkills = skills
      .filter(s => ['specific-detail', 'paraphrase', 'inference'].includes(s))
      .slice(0, tfngCount)
    groups.push({
      type: 'true-false-not-given',
      questionCount: tfngCount,
      skills: tfngSkills,
    })
  }

  if (mcCount > 0) {
    const mcSkills = skills
      .filter(s => !groups.flatMap(g => g.skills).includes(s) || s === 'paragraph-purpose' || s === 'reference-tracking')
      .slice(0, mcCount)
    groups.push({
      type: 'multiple-choice-single',
      questionCount: mcCount,
      skills: mcSkills,
    })
  }

  if (groups.length === 0) {
    groups.push({
      type: 'multiple-choice-single',
      questionCount: totalQuestions,
      skills: skills.slice(0, totalQuestions),
    })
  }

  return groups
}

function createLargerActivityGroups(
  totalQuestions: number,
  skills: ReadingQuestionSkill[],
  profile: ReadingPassageProfile,
): ReadingTaskGroupPlan[] {
  const groups: ReadingTaskGroupPlan[] = []

  // For 12-14 questions (Full Passage Simulation): aim for 3 diverse groups
  if (totalQuestions >= 11) {
    return createFullPassageSimulationGroups(totalQuestions, skills, profile)
  }

  const tfngCount = Math.min(Math.floor(totalQuestions * 0.35), 6)
  const remaining = totalQuestions - tfngCount

  if (tfngCount >= 3) {
    groups.push({
      type: 'true-false-not-given',
      questionCount: tfngCount,
      skills: (['specific-detail', 'paraphrase', 'inference', 'comparison'] as ReadingQuestionSkill[]).slice(0, tfngCount),
    })
  }

  if (remaining >= 3) {
    const mcSkills = skills
      .filter(s => !['specific-detail'].includes(s))
      .slice(0, remaining)
    groups.push({
      type: 'multiple-choice-single',
      questionCount: remaining,
      skills: mcSkills,
    })
  }

  return groups
}

function createFullPassageSimulationGroups(
  totalQuestions: number,
  skills: ReadingQuestionSkill[],
  profile: ReadingPassageProfile,
): ReadingTaskGroupPlan[] {
  const groups: ReadingTaskGroupPlan[] = []

  // Build 2-3 diverse groups for full passage simulation
  const availableTypes: ReadingExerciseType[] = [
    'true-false-not-given',
    'multiple-choice-single',
    'matching-information',
    'matching-headings',
    'sentence-completion',
    'short-answer',
    'summary-completion',
    'yes-no-not-given',
    'matching-features',
    'matching-sentence-endings',
  ]

  // Shuffle available types for variety
  const shuffled = [...availableTypes].sort(() => Math.random() - 0.5)

  // Select 2-3 task types
  const groupCount = totalQuestions >= 13 ? 3 : 2
  const selectedTypes = shuffled.slice(0, groupCount)

  // Distribute questions among groups
  let remaining = totalQuestions
  const groupSizes: number[] = []
  for (let i = 0; i < selectedTypes.length; i++) {
    const share = i === selectedTypes.length - 1
      ? remaining
      : Math.floor(totalQuestions / selectedTypes.length) + (Math.random() > 0.5 ? 1 : 0)
    groupSizes.push(Math.min(share, remaining))
    remaining -= groupSizes[i]
  }

  // Ensure minimum sizes per group
  for (let i = 0; i < groupSizes.length; i++) {
    const type = selectedTypes[i]
    const minSize = type === 'true-false-not-given' || type === 'yes-no-not-given' ? 3
      : type === 'matching-headings' || type === 'matching-information' ? 3
        : 2

    if (groupSizes[i] < minSize) {
      // Redistribute from largest group
      const largestIdx = groupSizes.indexOf(Math.max(...groupSizes))
      if (largestIdx !== i && groupSizes[largestIdx] > minSize + 1) {
        groupSizes[largestIdx] -= (minSize - groupSizes[i])
        groupSizes[i] = minSize
      }
    }
  }

  for (let i = 0; i < selectedTypes.length; i++) {
    const startIdx = groups.reduce((sum, g) => sum + g.questionCount, 0)
    const groupSkills = skills.slice(startIdx, startIdx + groupSizes[i])
    groups.push({
      type: selectedTypes[i],
      questionCount: groupSizes[i],
      skills: groupSkills,
    })
  }

  return groups
}

export function estimateDirectRetrievalRatio(
  skills: ReadingQuestionSkill[],
): number {
  const direct = skills.filter(s =>
    s === 'specific-detail' || s === 'information-location'
  ).length
  return skills.length > 0 ? direct / skills.length : 0
}

export function getPassageParagraphIds(
  profile: ReadingPassageProfile,
): string[] {
  return profile.paragraphFunctions.map(pf => pf.paragraphId)
}

export function selectTargetParagraphs(
  profile: ReadingPassageProfile,
  questionCount: number,
  minimumDistinct: number = 3,
): string[] {
  const paraIds = getPassageParagraphIds(profile)
  if (paraIds.length <= minimumDistinct) return paraIds

  // Prioritize paragraphs with distinct functions
  const scored = paraIds.map(id => {
    const funcs = profile.paragraphFunctions.find(pf => pf.paragraphId === id)
    const distinctFuncs = new Set(funcs?.functions || []).size
    return { id, score: distinctFuncs }
  }).sort((a, b) => b.score - a.score)

  const selected = scored.slice(0, Math.min(questionCount, paraIds.length)).map(s => s.id)
  const remaining = paraIds.filter(id => !selected.includes(id))

  // Ensure minimum distinct paragraphs are covered
  while (selected.length < Math.min(minimumDistinct, paraIds.length) && remaining.length > 0) {
    selected.push(remaining.shift()!)
  }

  return selected
}
