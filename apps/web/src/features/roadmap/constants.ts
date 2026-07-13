import type { TaskCategory } from '../../models'

export const SKILL_TO_CATEGORY: Record<string, TaskCategory> = {
  Reading: 'Reading',
  Listening: 'Listening',
  Writing: 'Writing Task 1',
  Speaking: 'Speaking Part 1',
  Vocabulary: 'Vocabulary',
  Grammar: 'Grammar',
}

export const ENGINE_SKILL_TO_CATEGORY: Record<string, TaskCategory> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing Task 1',
  speaking: 'Speaking Part 1',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  review: 'Vocabulary',
  'mock-test': 'Mock Test',
  'exam-preparation': 'Vocabulary',
}

export const PHASE_TYPE_TO_NAME: Record<string, string> = {
  diagnostic: 'Diagnostic Assessment',
  foundation: 'Foundation Building',
  'skill-building': 'Skill Development',
  'strategy-development': 'Strategy Development',
  'guided-practice': 'Guided Practice',
  'timed-practice': 'Timed Practice',
  'mock-examination': 'Mock Test Preparation',
  'error-correction': 'Error Correction',
  'final-review': 'Final Review',
  'exam-readiness': 'Exam Readiness',
}
