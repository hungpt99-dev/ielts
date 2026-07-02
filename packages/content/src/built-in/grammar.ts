import type { GrammarNote } from '@ielts/storage'

const now = '2025-01-01T00:00:00.000Z'

export const GRAMMAR_NOTES_PACK_ID = 'grammar-notes-v1'

export const BUILT_IN_GRAMMAR_NOTES: GrammarNote[] = [
  {
    id: 'built-in-grammar-conditionals-1',
    topic: 'Conditional Sentences',
    explanation: 'Conditional sentences are used to express that one action depends on another. There are four main types: Zero (general truth), First (real future), Second (unreal present), and Third (unreal past).',
    exampleSentences: [
      'If you heat water to 100°C, it boils. (Zero conditional)',
      'If I study hard, I will pass the exam. (First conditional)',
      'If I had more time, I would travel the world. (Second conditional)',
      'If I had studied harder, I would have passed. (Third conditional)',
    ],
    commonMistakes: [
      'Using "will" in the if-clause: "If I will go, I will call you."',
      'Mixing up second and third conditional forms',
      'Forgetting the comma when the if-clause comes first',
    ],
    correctedExamples: [
      'If I go, I will call you.',
      'If I were rich, I would buy a house. (NOT: If I was rich)',
      'If I had known, I would have come earlier.',
    ],
    personalNote: 'Very common in Speaking Part 3 when giving hypothetical answers',
    relatedSkill: 'speaking',
    status: 'reviewing',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'built-in-grammar-relative-clauses-1',
    topic: 'Relative Clauses',
    explanation: 'Relative clauses give extra information about a noun. Defining relative clauses are essential to meaning; non-defining relative clauses add extra information and are set off by commas.',
    exampleSentences: [
      'The student who studies every day will improve quickly. (defining)',
      'My sister, who lives in London, is a doctor. (non-defining)',
      'The book which I borrowed was very helpful.',
    ],
    commonMistakes: [
      'Using "that" in non-defining clauses',
      'Omitting the relative pronoun when it is necessary',
      'Using the wrong pronoun for people vs. things',
    ],
    correctedExamples: [
      'My car, which is red, is parked outside. (NOT: My car, that is red)',
      'The woman who called you is my teacher.',
      'The laptop that I bought is faulty.',
    ],
    personalNote: 'Use relative clauses in Writing Task 2 to improve cohesion',
    relatedSkill: 'writing',
    status: 'reviewing',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'built-in-grammar-articles-1',
    topic: 'Article Usage (a/an/the)',
    explanation: 'Articles are used before nouns. "A/an" is used for non-specific singular countable nouns. "The" is used for specific nouns, unique things, and before superlatives. No article is used for general plurals and uncountable nouns.',
    exampleSentences: [
      'I saw a dog in the park. (any dog)',
      'The dog I saw was brown. (specific dog)',
      'Dogs are loyal animals. (general statement)',
    ],
    commonMistakes: [
      'Omitting "the" before superlatives',
      'Using "the" when making general statements with plurals',
      'Forgetting "a/an" before singular countable nouns',
    ],
    correctedExamples: [
      'She is the best student in the class.',
      'I love dogs. (NOT: I love the dogs — when speaking generally)',
      'He is a teacher.',
    ],
    personalNote: 'Pay attention during Speaking test — easy to make small mistakes',
    relatedSkill: 'speaking',
    status: 'reviewing',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'built-in-grammar-passive-1',
    topic: 'Passive Voice',
    explanation: 'Passive voice focuses on the action rather than the doer. Formed with "be" + past participle. Commonly used in academic writing and Task 1 descriptions.',
    exampleSentences: [
      'The experiment was conducted by the research team.',
      'English is spoken worldwide.',
      'The chart shows that sales were increased by 20%.',
    ],
    commonMistakes: [
      'Overusing passive voice when active is clearer',
      'Wrong past participle forms',
      'Forgetting to include the agent when necessary',
    ],
    correctedExamples: [
      'The window was broken. (by someone)',
      'The report was written by the intern.',
      'Mistakes were made by the team.',
    ],
    personalNote: 'Essential for Writing Task 1 when describing diagrams and processes',
    relatedSkill: 'writing',
    status: 'weak',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'built-in-grammar-tense-consistency-1',
    topic: 'Tense Consistency',
    explanation: 'Maintain the same tense throughout a paragraph unless there is a reason to shift. In IELTS essays, use present simple for general truths, past simple for completed past events, and present perfect for past-to-present connections.',
    exampleSentences: [
      'Many people believe that education is important. (present simple)',
      'In 2020, the government introduced new policies. (past simple)',
      'The number of users has increased significantly. (present perfect)',
    ],
    commonMistakes: [
      'Shifting tense within the same sentence without reason',
      'Using past simple when present perfect is needed',
      'Mixing present and past in a paragraph describing a trend',
    ],
    correctedExamples: [
      'I have lived here for five years. (NOT: I am living here for five years)',
      'She studied engineering, and now she works as an architect.',
      'The data shows that sales increased steadily.',
    ],
    personalNote: 'Pay attention in Writing Task 1 when describing trends over time',
    relatedSkill: 'writing',
    status: 'reviewing',
    createdAt: now,
    updatedAt: now,
  },
]
