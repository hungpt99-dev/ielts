import { useState, useId, useCallback } from 'react'
import type { TutorMemory } from '../../models/aiTutorModels'
import { generateId } from '../../utils'

// ── Types ─────────────────────────────────────────────────────

export type TeachingLessonType = 'grammar' | 'vocabulary'

export interface CheckingQuestion {
  id: string
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
}

export interface ExerciseQuestion {
  id: string
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  type: 'fill-blank' | 'multiple-choice' | 'rewrite' | 'identify'
}

export interface TeachingLesson {
  id: string
  type: TeachingLessonType
  topic: string
  title: string
  level: 'simple' | 'intermediate' | 'advanced'
  explanation: string
  rules: string[]
  examples: string[]
  checkingQuestion: CheckingQuestion
  exercises: ExerciseQuestion[]
  summary: string
  nextTopic: string
  commonMistakes: { mistake: string; correction: string; note: string }[]
}

export interface ExerciseAnswerRecord {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  feedback: string
}

// ── Grammar Lessons ───────────────────────────────────────────

function createGrammarLessons(): Record<string, TeachingLesson> {
  return {
    'present-perfect': {
      id: 'present-perfect',
      type: 'grammar',
      topic: 'present-perfect',
      title: 'Present Perfect vs Past Simple',
      level: 'simple',
      explanation:
        'The Present Perfect connects the past to the present. Use it for life experiences, changes over time, and unfinished actions. The Past Simple is for completed past actions at a specific time.\n\nPresent Perfect: have/has + past participle (V3)\nPast Simple: V-ed (or irregular form)',
      rules: [
        'Use Present Perfect for: experiences ("I have visited London"), changes ("You have improved"), unfinished actions ("I have lived here for 5 years"), recent events with present relevance ("She has just left")',
        'Use Past Simple for: finished actions at a specific time ("I visited London in 2020"), completed past habits ("I studied there every day")',
        'Signal words for Present Perfect: ever, never, already, yet, just, since, for, recently, so far',
        'Signal words for Past Simple: yesterday, last week, ago, in 2010, when I was young',
      ],
      examples: [
        '"I have studied English for 3 years." (Present Perfect — still studying)',
        '"I studied English yesterday." (Past Simple — finished)',
        '"She has never eaten sushi." (Present Perfect — experience up to now)',
        '"She ate sushi last week." (Past Simple — specific finished time)',
      ],
      checkingQuestion: {
        id: 'pp-check-1',
        question: 'Which sentence is correct? "I have seen that movie yesterday" or "I saw that movie yesterday"?',
        options: ['I have seen that movie yesterday', 'I saw that movie yesterday'],
        correctAnswer: 'I saw that movie yesterday',
        explanation: '"Yesterday" is a specific finished time, so we use Past Simple (saw), not Present Perfect (have seen).',
      },
      exercises: [
        {
          id: 'pp-ex-1',
          type: 'fill-blank',
          question: 'She _____ (live) in Hanoi since 2018.',
          correctAnswer: 'has lived',
          explanation: '"Since 2018" — an action that started in the past and continues. Use Present Perfect: has lived.',
        },
        {
          id: 'pp-ex-2',
          type: 'fill-blank',
          question: 'They _____ (go) to the beach last weekend.',
          correctAnswer: 'went',
          explanation: '"Last weekend" — a specific finished time. Use Past Simple: went.',
        },
        {
          id: 'pp-ex-3',
          type: 'multiple-choice',
          question: 'Choose the correct sentence:',
          options: [
            'I have never been to Japan.',
            'I have never gone to Japan when I was a child.',
            'I never have been to Japan.',
            'I have been never to Japan.',
          ],
          correctAnswer: 'I have never been to Japan.',
          explanation: '"Never" goes between "have" and the past participle. The correct structure is: have + never + past participle.',
        },
        {
          id: 'pp-ex-4',
          type: 'fill-blank',
          question: '______ you ever ______ (eat) Vietnamese food?',
          correctAnswer: 'Have, eaten',
          explanation: 'For questions in Present Perfect: Have/Has + subject + past participle. "Have you ever eaten Vietnamese food?"',
        },
      ],
      summary:
        'Great work! Key takeaway: Present Perfect connects past to present (no specific time), Past Simple is for finished actions (specific time). Remember: since/for/ever/never/yet → Present Perfect; yesterday/last week/ago → Past Simple.',
      nextTopic: 'articles',
      commonMistakes: [
        { mistake: 'I have seen that movie yesterday.', correction: 'I saw that movie yesterday.', note: 'Specific time (yesterday) = Past Simple.' },
        { mistake: 'She has went to the market.', correction: 'She has gone to the market.', note: 'After have/has, use past participle (gone), not past simple (went).' },
        { mistake: 'I have studied English last year.', correction: 'I studied English last year.', note: '"Last year" is a finished time, use Past Simple.' },
      ],
    },

    articles: {
      id: 'articles',
      type: 'grammar',
      topic: 'articles',
      title: 'Articles: A, An, The',
      level: 'simple',
      explanation:
        'Articles are small words that come before nouns. They are very important for IELTS Grammar score.\n\n• "A" — before consonant SOUNDS (a book, a university, a European)\n• "An" — before vowel SOUNDS (an apple, an hour, an honest person)\n• "The" — when both speaker and listener know what is being referred to\n• No article (zero article) — for general plurals and uncountable nouns',
      rules: [
        'Use "a/an" for non-specific singular countable nouns: "I saw a dog" (any dog)',
        'Use "the" for specific nouns: "The dog I saw was brown" (that specific dog), unique things (the sun, the internet), superlatives (the best), and previously mentioned things',
        'Use zero article for general ideas with plural/uncountable nouns: "Dogs are loyal", "Water is essential"',
        'No article before: meals (breakfast, lunch), sports (play football), some institutions (go to school, in hospital) — unless specific',
      ],
      examples: [
        '"I need a pen." (any pen — not specific)',
        '"Can you pass the pen?" (the specific pen we both know about)',
        '"An honest person always tells the truth." (an + honest because "h" is silent)',
        '"The more you practice, the better you get." (the + comparative)',
      ],
      checkingQuestion: {
        id: 'art-check-1',
        question: 'Which is correct? "She is ___ university student."',
        options: ['a', 'an', 'the', '(no article)'],
        correctAnswer: 'a',
        explanation: '"University" starts with a consonant sound /juː/, so we use "a" even though the letter is a vowel.',
      },
      exercises: [
        {
          id: 'art-ex-1',
          type: 'fill-blank',
          question: 'I need ___ umbrella. It\'s raining outside.',
          correctAnswer: 'an',
          explanation: '"Umbrella" starts with a vowel sound /ʌ/, so use "an".',
        },
        {
          id: 'art-ex-2',
          type: 'multiple-choice',
          question: 'Choose the correct sentence:',
          options: [
            'The honesty is important in IELTS writing.',
            'Honesty is important in IELTS writing.',
            'An honesty is important in IELTS writing.',
            'A honesty is important in IELTS writing.',
          ],
          correctAnswer: 'Honesty is important in IELTS writing.',
          explanation: 'Abstract uncountable nouns like "honesty" take zero article when used in a general sense.',
        },
        {
          id: 'art-ex-3',
          type: 'fill-blank',
          question: 'She is ___ best student in the class.',
          correctAnswer: 'the',
          explanation: 'Use "the" before superlatives (best, worst, most, etc.).',
        },
      ],
      summary:
        'Excellent! Remember: a/an = non-specific; the = specific/known; no article = general. Pay special attention to vowel sounds (an hour, a university) — this is a common IELTS test point.',
      nextTopic: 'conditionals',
      commonMistakes: [
        { mistake: 'She is a honest person.', correction: 'She is an honest person.', note: '"Honest" starts with a silent "h" — vowel sound, so use "an".' },
        { mistake: 'I went to the school to learn English.', correction: 'I went to school to learn English.', note: 'Use "the" only for a specific building; "go to school" = general purpose.' },
        { mistake: 'An university was built.', correction: 'A university was built.', note: '"University" starts with /juː/ — a consonant sound, so use "a".' },
      ],
    },

    conditionals: {
      id: 'conditionals',
      type: 'grammar',
      topic: 'conditionals',
      title: 'Conditionals (If Sentences)',
      level: 'intermediate',
      explanation:
        'Conditionals are sentences with "if" that show cause and effect. There are 4 main types in IELTS:\n\n• Zero Conditional: general truths (If + present, present)\n• First Conditional: real future (If + present, will + verb)\n• Second Conditional: unreal present/hypothetical (If + past, would + verb)\n• Third Conditional: unreal past (If + past perfect, would have + V3)',
      rules: [
        'Zero: If you heat ice, it melts. (always true)',
        'First: If I study hard, I will get Band 7. (possible future)',
        'Second: If I were you, I would practice more. (hypothetical — "were" for all subjects)',
        'Third: If I had studied, I would have passed. (past regret)',
        'Mixed conditionals combine Second and Third: If I had studied (past), I would be fluent now (present).',
      ],
      examples: [
        '"If you study consistently, you improve." (Zero — general truth)',
        '"If it rains tomorrow, I will stay home and practice speaking." (First — real future)',
        '"If I had more time, I would read more English books." (Second — hypothetical now)',
        '"If I had started IELTS preparation earlier, I would have achieved a higher score." (Third — past regret)',
      ],
      checkingQuestion: {
        id: 'cond-check-1',
        question: 'Which conditional type is this? "If I were rich, I would travel around the world."',
        options: ['Zero', 'First', 'Second', 'Third'],
        correctAnswer: 'Second',
        explanation: 'This is Second Conditional — talking about an unreal/hypothetical situation in the present (I am not rich). Structure: If + past, would + verb.',
      },
      exercises: [
        {
          id: 'cond-ex-1',
          type: 'fill-blank',
          question: 'If she _____ (study) harder, she will pass the exam.',
          correctAnswer: 'studies',
          explanation: 'First Conditional: If + present simple, will + verb. "If she studies harder, she will pass."',
        },
        {
          id: 'cond-ex-2',
          type: 'fill-blank',
          question: 'If I had known about the test, I _____ (prepare) better.',
          correctAnswer: 'would have prepared',
          explanation: 'Third Conditional: If + past perfect, would have + V3. "If I had known, I would have prepared better."',
        },
        {
          id: 'cond-ex-3',
          type: 'multiple-choice',
          question: 'Choose the correct sentence:',
          options: [
            'If I will see him, I will tell him.',
            'If I see him, I will tell him.',
            'If I saw him, I will tell him.',
            'If I would see him, I will tell him.',
          ],
          correctAnswer: 'If I see him, I will tell him.',
          explanation: 'In First Conditional, use present simple after "if", NOT "will". Correct: If + present, will + verb.',
        },
      ],
      summary:
        'Great effort! Remember the pattern: Zero (always true), First (real future), Second (hypothetical now), Third (past regret). In IELTS Writing Task 2, Second and Third conditionals help you write more sophisticated arguments.',
      nextTopic: 'prepositions',
      commonMistakes: [
        { mistake: 'If I will go, I will call you.', correction: 'If I go, I will call you.', note: 'Never use "will" after "if" in First Conditional.' },
        { mistake: 'If I was you, I would study more.', correction: 'If I were you, I would study more.', note: 'Use "were" for all subjects in Second Conditional (subjunctive mood).' },
      ],
    },

    prepositions: {
      id: 'prepositions',
      type: 'grammar',
      topic: 'prepositions',
      title: 'Prepositions of Time and Place',
      level: 'simple',
      explanation:
        'Prepositions are small but powerful words. They are tested directly in IELTS Listening and affect your Grammar score in Writing and Speaking.\n\n• IN: months (in March), years (in 2020), seasons (in summer), parts of day (in the morning), cities/countries (in Hanoi)',
      rules: [
        'IN — longer periods and enclosed spaces: in April, in winter, in the evening, in Vietnam, in the room, in a book',
        'ON — surfaces and specific days: on Monday, on my birthday, on the table, on the wall, on the internet, on the bus',
        'AT — specific points and locations: at 5 o\'clock, at night, at the weekend, at the door, at the bus stop, at work',
        'No preposition before: this/that/next/last/every: "last Monday" (not "on last Monday"), "this year" (not "in this year")',
      ],
      examples: [
        '"I was born in 1998." (year → IN)',
        '"The meeting is on Monday." (day → ON)',
        '"I will meet you at 3 PM." (time → AT)',
        '"She is at the bus stop waiting." (specific location → AT)',
      ],
      checkingQuestion: {
        id: 'prep-check-1',
        question: 'Fill in: "I usually wake up ___ 7 AM."',
        options: ['in', 'on', 'at', '(no preposition)'],
        correctAnswer: 'at',
        explanation: 'Use "at" for specific times (clock times): at 7 AM, at noon, at midnight.',
      },
      exercises: [
        {
          id: 'prep-ex-1',
          type: 'fill-blank',
          question: 'She was born ___ March 15, 1999.',
          correctAnswer: 'on',
          explanation: 'Use "on" for specific dates (day + month).',
        },
        {
          id: 'prep-ex-2',
          type: 'fill-blank',
          question: 'The book is ___ the shelf, ___ the left.',
          correctAnswer: 'on, on',
          explanation: '"On the shelf" (surface) and "on the left" (position).',
        },
        {
          id: 'prep-ex-3',
          type: 'multiple-choice',
          question: 'Choose the correct sentence:',
          options: [
            'I will see you on Monday morning.',
            'I will see you in Monday morning.',
            'I will see you at Monday morning.',
            'I will see you Monday morning.',
          ],
          correctAnswer: 'I will see you on Monday morning.',
          explanation: 'Use "on" for days + parts of day: on Monday morning, on Friday evening.',
        },
      ],
      summary:
        'Well done! Quick reference: IN (months, years, countries, inside), ON (days, surfaces), AT (clock times, specific points). Practice by noticing these in the articles you read!',
      nextTopic: 'present-perfect',
      commonMistakes: [
        { mistake: 'I\'ll see you in Monday.', correction: 'I\'ll see you on Monday.', note: 'Days of the week → ON.' },
        { mistake: 'She arrived at Hanoi yesterday.', correction: 'She arrived in Hanoi yesterday.', note: 'Cities/countries → IN, not AT.' },
      ],
    },
  }
}

// ── Vocabulary Lessons ────────────────────────────────────────

function createVocabularyLessons(): Record<string, TeachingLesson> {
  return {
    environment: {
      id: 'environment',
      type: 'vocabulary',
      topic: 'environment',
      title: 'Environment & Climate Change Vocabulary',
      level: 'intermediate',
      explanation:
        'Environment is one of the most common IELTS topics. You will see it in Reading passages, hear it in Listening, and write about it in Task 2. Here are essential words and phrases to help you score higher.',
      rules: [
        'Sustainable (adj) — can be maintained without harming the environment. Collocations: sustainable development, sustainable energy, sustainable practices',
        'Biodiversity (n) — the variety of plants and animals in a habitat. "Deforestation threatens biodiversity."',
        'Carbon footprint (n) — the amount of CO2 a person or activity produces. "Reduce your carbon footprint by using public transport."',
        'Renewable energy (n) — energy from sources that never run out: solar, wind, hydro, geothermal',
        'Ecosystem (n) — all living things in an area and their environment. "Coral reefs are fragile ecosystems."',
        'Deforestation (n) — cutting down forests. "Deforestation contributes to climate change."',
      ],
      examples: [
        '"Governments should invest more in sustainable energy sources like wind and solar power."',
        '"The loss of biodiversity is one of the most serious environmental problems we face today."',
        '"Individuals can reduce their carbon footprint by recycling more and using fewer plastic products."',
        '"Climate change is causing more extreme weather events, such as floods, droughts, and heatwaves."',
      ],
      checkingQuestion: {
        id: 'env-check-1',
        question: 'What does "sustainable" mean?',
        options: [
          'Something that is very expensive',
          'Something that can continue without damaging the environment',
          'Something related to technology',
          'Something that happens quickly',
        ],
        correctAnswer: 'Something that can continue without damaging the environment',
        explanation: '"Sustainable" means able to be maintained at a certain rate or level without depleting natural resources.',
      },
      exercises: [
        {
          id: 'env-ex-1',
          type: 'fill-blank',
          question: 'Many companies are trying to reduce their carbon _____ by using electric vehicles.',
          correctAnswer: 'footprint',
          explanation: '"Carbon footprint" is the standard collocation for the amount of CO2 emissions produced.',
        },
        {
          id: 'env-ex-2',
          type: 'multiple-choice',
          question: 'Choose the best word: "Solar and wind power are examples of _____ energy."',
          options: ['traditional', 'renewable', 'fossil', 'nuclear'],
          correctAnswer: 'renewable',
          explanation: 'Solar and wind are renewable energy sources — they naturally replenish and never run out.',
        },
        {
          id: 'env-ex-3',
          type: 'fill-blank',
          question: 'The Amazon rainforest has incredible _____ — it is home to millions of plant and animal species.',
          correctAnswer: 'biodiversity',
          explanation: '"Biodiversity" refers to the variety of living species in an ecosystem.',
        },
      ],
      summary:
        'Excellent! You now know 6 key environment words: sustainable, biodiversity, carbon footprint, renewable energy, ecosystem, deforestation. Try using them in a practice IELTS Writing Task 2 essay about environmental problems.',
      nextTopic: 'education',
      commonMistakes: [
        { mistake: 'Using "sustainable" to mean "comfortable"', correction: 'Sustainable = able to continue without harm, especially environmentally', note: 'In IELTS context, "sustainable" almost always relates to environmental or economic sustainability.' },
        { mistake: 'Using "climate" without specifics', correction: 'Be specific: climate change, global warming, greenhouse effect, climate crisis', note: 'Using topic-specific collocations shows the examiner you have a wide vocabulary.' },
      ],
    },

    education: {
      id: 'education',
      type: 'vocabulary',
      topic: 'education',
      title: 'Education Vocabulary',
      level: 'intermediate',
      explanation:
        'Education is a very common IELTS topic. These words will help you discuss schools, universities, learning methods, and educational systems more effectively.',
      rules: [
        'Curriculum (n) — the subjects and content taught in a course. "The curriculum should include practical skills."',
        'Pedagogy (n) — the method and practice of teaching. "Modern pedagogy emphasizes student-centered learning."',
        'Higher education (n) — education at university level. "More young people are pursuing higher education."',
        'Vocational training (n) — training for specific jobs/skills. "Vocational training prepares students for the workplace."',
        'Critical thinking (n) — the ability to analyze and evaluate. "Schools should develop critical thinking skills."',
        'Lifelong learning (n) — continuous learning throughout life. "Lifelong learning is essential in a changing economy."',
      ],
      examples: [
        '"The school curriculum should balance academic subjects with creative arts and physical education."',
        '"Online learning has made higher education more accessible to students in remote areas."',
        '"Many countries are investing more in vocational training to address skill shortages."',
        '"Critical thinking is one of the most important skills for university students to develop."',
      ],
      checkingQuestion: {
        id: 'edu-check-1',
        question: 'What does "curriculum" mean?',
        options: [
          'The list of students in a class',
          'The total marks needed to pass',
          'The subjects taught in a school or course',
          'The rules of the school',
        ],
        correctAnswer: 'The subjects taught in a school or course',
        explanation: 'Curriculum refers to the set of subjects and content that students are taught in a school or educational program.',
      },
      exercises: [
        {
          id: 'edu-ex-1',
          type: 'fill-blank',
          question: '_____ training is important because not every student wants to go to university.',
          correctAnswer: 'Vocational',
          explanation: '"Vocational training" prepares students for specific trades/careers (plumber, electrician, chef, etc.).',
        },
        {
          id: 'edu-ex-2',
          type: 'multiple-choice',
          question: 'Choose the best word: "Modern _____ focuses on interactive learning rather than lectures."',
          options: ['pedagogy', 'curriculum', 'tuition', 'discipline'],
          correctAnswer: 'pedagogy',
          explanation: '"Pedagogy" is the theory and practice of teaching methods. Modern pedagogy = modern teaching approaches.',
        },
      ],
      summary:
        'Great learning! Key education words: curriculum, pedagogy, higher education, vocational training, critical thinking, lifelong learning. These are excellent for Writing Task 2 essays about education systems.',
      nextTopic: 'technology',
      commonMistakes: [
        { mistake: 'Confusing "curriculum" and "syllabus"', correction: 'Curriculum = the whole program; syllabus = the content of one course', note: 'In IELTS Writing, "curriculum" is more useful for general education discussions.' },
      ],
    },

    technology: {
      id: 'technology',
      type: 'vocabulary',
      topic: 'technology',
      title: 'Technology Vocabulary',
      level: 'intermediate',
      explanation:
        'Technology is a recurring IELTS topic. From social media to AI, you need to discuss technological developments confidently.',
      rules: [
        'Innovation (n) — a new method, idea, or product. "Technological innovation is transforming every industry."',
        'Digital literacy (n) — the ability to use digital technology. "Digital literacy is as important as reading and writing."',
        'Artificial intelligence (AI) (n) — computer systems that can perform tasks requiring human intelligence',
        'Disruptive technology (n) — technology that causes major change. "Smartphones were a disruptive technology."',
        'Automation (n) — using machines/computers to do work. "Automation is changing the job market."',
        'Cybersecurity (n) — protection of computer systems from theft/damage. "Cybersecurity is a growing concern."',
      ],
      examples: [
        '"Innovation in renewable energy technology is crucial for fighting climate change."',
        '"Digital literacy should be taught from primary school to prepare children for the future."',
        '"Artificial intelligence is being used in healthcare to diagnose diseases more accurately."',
        '"While automation increases efficiency, it also raises concerns about job displacement."',
      ],
      checkingQuestion: {
        id: 'tech-check-1',
        question: 'What does "innovation" mean?',
        options: [
          'Copying an existing idea',
          'A new method, idea, or product',
          'Fixing old technology',
          'Removing outdated systems',
        ],
        correctAnswer: 'A new method, idea, or product',
        explanation: 'Innovation means creating something new or improving existing solutions in a significant way.',
      },
      exercises: [
        {
          id: 'tech-ex-1',
          type: 'fill-blank',
          question: '_____ is the practice of protecting computers and networks from digital attacks.',
          correctAnswer: 'Cybersecurity',
          explanation: '"Cybersecurity" refers to protection against cyber threats like hacking, malware, and data breaches.',
        },
        {
          id: 'tech-ex-2',
          type: 'multiple-choice',
          question: 'Choose the best word: "The rise of online shopping was a _____ technology for traditional retail."',
          options: ['useful', 'gradual', 'disruptive', 'simple'],
          correctAnswer: 'disruptive',
          explanation: '"Disruptive technology" causes fundamental change to an industry, often replacing traditional methods.',
        },
      ],
      summary:
        'Well done! Technology vocabulary is versatile for IELTS. Use these words: innovation, digital literacy, artificial intelligence, disruptive technology, automation, cybersecurity. They work well in Writing Task 2 and Speaking Part 3.',
      nextTopic: 'health',
      commonMistakes: [
        { mistake: 'Using "technology" as a countable noun', correction: 'Technology is uncountable: "Technology is advancing" (not "technologies are advancing")', note: 'For plural, say "technological developments" or "technologies" only when referring to specific types.' },
      ],
    },
  }
}

// ── Lesson Cache ──────────────────────────────────────────────

const GRAMMAR_LESSONS = createGrammarLessons()
const VOCABULARY_LESSONS = createVocabularyLessons()

export function getAllGrammarTopics(): { id: string; title: string }[] {
  return Object.values(GRAMMAR_LESSONS).map(l => ({ id: l.topic, title: l.title }))
}

export function getAllVocabularyTopics(): { id: string; title: string }[] {
  return Object.values(VOCABULARY_LESSONS).map(l => ({ id: l.topic, title: l.title }))
}

// ── Lesson Lookup ─────────────────────────────────────────────

export function findLesson(type: TeachingLessonType, topicOrQuery: string): TeachingLesson | null {
  const lower = topicOrQuery.toLowerCase()
  const lessons = type === 'grammar' ? GRAMMAR_LESSONS : VOCABULARY_LESSONS

  const direct = lessons[lower]
  if (direct) return direct

  const matched = Object.values(lessons).find(l =>
    l.title.toLowerCase().includes(lower) ||
    l.explanation.toLowerCase().includes(lower) ||
    l.topic.toLowerCase().includes(lower),
  )
  return matched ?? null
}

export function detectLessonFromMessage(
  message: string,
  type: TeachingLessonType,
): { lesson: TeachingLesson; confidence: 'high' | 'medium' | 'low' } | null {
  const lower = message.toLowerCase()
  const lessons = type === 'grammar' ? GRAMMAR_LESSONS : VOCABULARY_LESSONS

  for (const [, lesson] of Object.entries(lessons)) {
    const keywords = lesson.title.toLowerCase().split(' ').concat(
      lesson.examples.some(e => lower.includes(e.toLowerCase().slice(0, 15))) ? [lesson.topic] : [],
    )
    if (keywords.some(k => lower.includes(k))) {
      return { lesson, confidence: 'high' }
    }
    if (lesson.rules.some(r => lower.includes(r.toLowerCase().slice(0, 20)))) {
      return { lesson, confidence: 'medium' }
    }
  }
  return null
}

// ── Checking Question Evaluation ──────────────────────────────

export function evaluateCheckingAnswer(
  question: CheckingQuestion,
  userAnswer: string,
): { isCorrect: boolean; feedback: string } {
  const normalizedUser = userAnswer.trim().toLowerCase()
  const normalizedCorrect = question.correctAnswer.trim().toLowerCase()

  const isCorrect = normalizedUser === normalizedCorrect ||
    (question.options?.some(o => o.toLowerCase() === normalizedUser) && normalizedUser === normalizedCorrect)

  if (isCorrect) {
    return {
      isCorrect: true,
      feedback: `✅ Correct! ${question.explanation}\n\nGreat understanding! Let's move on to some practice exercises.`,
    }
  }

  return {
    isCorrect: false,
    feedback: `❌ Not quite. The correct answer is: "${question.correctAnswer}".\n\n${question.explanation}\n\nDon't worry — mistakes are part of learning! Let's try some exercises to reinforce this.`,
  }
}

// ── Exercise Answer Evaluation ────────────────────────────────

export function evaluateExerciseAnswer(
  question: ExerciseQuestion,
  userAnswer: string,
): { isCorrect: boolean; feedback: string; expected: string } {
  const normalizedUser = userAnswer.trim().toLowerCase()
  const normalizedCorrect = question.correctAnswer.trim().toLowerCase()

  let isCorrect = false

  if (question.type === 'multiple-choice' && question.options) {
    isCorrect = normalizedUser === normalizedCorrect
  } else if (question.type === 'fill-blank') {
    const acceptableAnswers = normalizedCorrect.split('/').map(a => a.trim())
    isCorrect = acceptableAnswers.some(a => normalizedUser === a || normalizedUser.includes(a))
  } else if (question.type === 'rewrite') {
    isCorrect = normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)
  } else {
    isCorrect = normalizedUser === normalizedCorrect
  }

  if (isCorrect) {
    return {
      isCorrect: true,
      feedback: `✅ Excellent! "${userAnswer}" is correct.\n\n${question.explanation}\n\nKeep up the great work!`,
      expected: question.correctAnswer,
    }
  }

  return {
    isCorrect: false,
    feedback: `📝 Good try! The correct answer is: "${question.correctAnswer}".\n\n${question.explanation}\n\nReview the rule above and try to understand why this is the answer.`,
    expected: question.correctAnswer,
  }
}

// ── Generate Lesson Text for Chat ─────────────────────────────

export function generateLessonText(lesson: TeachingLesson, language: 'english' | 'vietnamese' | 'both'): string {
  const title = lesson.title
  const explanation = lesson.explanation
  const rules = lesson.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')
  const examples = lesson.examples.map(e => `• ${e}`).join('\n')
  const mistakes = lesson.commonMistakes.map(m => `• "${m.mistake}" → ${m.correction} — ${m.note}`).join('\n')

  const eng = `📘 **${title}**\n\n**Explanation:**\n${explanation}\n\n**Key Rules:**\n${rules}\n\n**Examples:**\n${examples}\n\n**Common Mistakes to Avoid:**\n${mistakes}\n\n---\n\nLet me check your understanding! Answer the question below. 💡`

  const viet = `📘 **${title}**\n\n**Giải thích:**\n${explanation}\n\n**Quy tắc chính:**\n${rules}\n\n**Ví dụ:**\n${examples}\n\n**Lỗi thường gặp:**\n${mistakes}\n\n---\n\nKiểm tra hiểu biết của bạn! Trả lời câu hỏi bên dưới nhé. 💡`

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}`
  return eng
}

export function generateFeedbackMessage(
  lesson: TeachingLesson,
  exerciseResults: ExerciseAnswerRecord[],
  language: 'english' | 'vietnamese' | 'both',
): string {
  const correct = exerciseResults.filter(r => r.isCorrect).length
  const total = exerciseResults.length
  const score = Math.round((correct / total) * 100)

  const engSuggest = `**Suggested next topic:** ${getLessonTitle(lesson.nextTopic, lesson.type !== 'grammar') ??
    lesson.nextTopic.replace('-', ' ')}`

  const eng = `📊 **Lesson Complete: ${lesson.title}**\n\n**Your Score: ${correct}/${total} (${score}%)**\n\n${score >= 80
    ? '🌟 Excellent work! You have a strong understanding of this topic.'
    : score >= 60
      ? '👍 Good effort! Review the points you missed and try again.'
      : '💪 Keep practicing! Review the rules above and try the exercises again.'
  }\n\n${engSuggest}\n\nKeep learning — every step brings you closer to your IELTS goal! 🎯`

  const viet = `📊 **Hoàn thành bài học: ${lesson.title}**\n\n**Điểm của bạn: ${correct}/${total} (${score}%)**\n\n${score >= 80
    ? '🌟 Xuất sắc! Bạn hiểu rất rõ chủ đề này.'
    : score >= 60
      ? '👍 Cố gắng tốt! Hãy xem lại những phần bạn làm sai.'
      : '💪 Hãy tiếp tục luyện tập! Xem lại các quy tắc trên và thử lại.'
  }\n\n**Gợi ý chủ đề tiếp theo:** ${getLessonTitle(lesson.nextTopic, lesson.type !== 'grammar') ??
    lesson.nextTopic.replace('-', ' ')}\n\nTiếp tục học — mỗi bước đều đưa bạn gần hơn đến mục tiêu IELTS! 🎯`

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}`
  return eng
}

function getLessonTitle(topicId: string, isVocabulary: boolean): string | null {
  const lessons = isVocabulary ? VOCABULARY_LESSONS : GRAMMAR_LESSONS
  const found = lessons[topicId]
  return found?.title ?? null
}

// ── Next Topic Suggestions ────────────────────────────────────

export function suggestNextTopics(currentTopic: string): { id: string; title: string; reason: string }[] {
  const grammarTopics = Object.values(GRAMMAR_LESSONS)
  const vocabTopics = Object.values(VOCABULARY_LESSONS)
  const all = [...grammarTopics, ...vocabTopics]
  const current = all.find(l => l.topic === currentTopic)
  if (!current) {
    return all.slice(0, 4).map(l => ({
      id: l.topic,
      title: l.title,
      reason: l.type === 'grammar' ? 'Grammar foundation' : 'IELTS vocabulary topic',
    }))
  }

  const nextId = current.nextTopic
  const next = all.find(l => l.topic === nextId)
  const suggestions: { id: string; title: string; reason: string }[] = []

  if (next) {
    suggestions.push({
      id: next.topic,
      title: next.title,
      reason: next.type === 'grammar' ? 'Recommended next grammar topic' : 'Recommended next vocabulary topic',
    })
  }

  const others = all
    .filter(l => l.topic !== currentTopic && l.topic !== nextId)
    .slice(0, 3)
    .map(l => ({
      id: l.topic,
      title: l.title,
      reason: l.type === 'grammar' ? 'Related grammar topic' : 'Related vocabulary topic',
    }))

  return [...suggestions, ...others]
}

// ── Mistake Review ────────────────────────────────────────────

export function generateMistakeReview(memory: TutorMemory | null, limit = 5): string {
  if (!memory || memory.repeatedMistakePatterns.length === 0) {
    return '📝 **Mistake Review**\n\nNo mistakes recorded yet. Keep practicing and I will track your common mistakes here! 💪'
  }

  const patterns = memory.repeatedMistakePatterns.slice(0, limit)
  const lines = patterns.map((p, i) =>
    `${i + 1}. **${p.pattern}** (${p.skill})\n   Example: "${p.examples[0] ?? 'N/A'}"\n   💡 ${p.suggestion}`,
  )

  return `📝 **Mistake Review**\n\nHere are your most common mistakes:\n\n${lines.join('\n\n')}\n\n---\n\nFocus on these patterns in your next practice session! Would you like to do some exercises based on these mistakes?`
}

// ── Mini Exercise Generator ───────────────────────────────────

export function generateQuickExercises(type: TeachingLessonType, _topic?: string): ExerciseQuestion[] {
  if (type === 'grammar') {
    return [
      {
        id: 'quick-g1',
        type: 'fill-blank',
        question: 'She _____ (go) to school every day.',
        correctAnswer: 'goes',
        explanation: 'Third person singular (she) in present simple: verb + s.',
      },
      {
        id: 'quick-g2',
        type: 'multiple-choice',
        question: 'Which is correct?',
        options: ['He don\'t like coffee.', 'He doesn\'t like coffee.', 'He not like coffee.', 'He no like coffee.'],
        correctAnswer: 'He doesn\'t like coffee.',
        explanation: 'Negative in present simple third person: doesn\'t + base verb.',
      },
      {
        id: 'quick-g3',
        type: 'fill-blank',
        question: 'They _____ (watch) TV when I arrived.',
        correctAnswer: 'were watching',
        explanation: 'Past continuous: was/were + verb-ing. Action in progress when another action happened.',
      },
    ]
  }

  return [
    {
      id: 'quick-v1',
      type: 'multiple-choice',
      question: 'What does "significant" mean?',
      options: ['Small and unimportant', 'Large or important enough to notice', 'Very difficult', 'Extremely fast'],
      correctAnswer: 'Large or important enough to notice',
      explanation: '"Significant" means important, large, or meaningful enough to be worthy of attention.',
    },
    {
      id: 'quick-v2',
      type: 'fill-blank',
      question: '"Consequences" means the _____ or effects of an action.',
      correctAnswer: 'results',
      explanation: '"Consequences" are the results or outcomes that follow from an action or decision.',
    },
    {
      id: 'quick-v3',
      type: 'multiple-choice',
      question: 'Which word means "to make something better"?',
      options: ['Worsen', 'Improve', 'Maintain', 'Replace'],
      correctAnswer: 'Improve',
      explanation: '"Improve" means to make something better or to become better.',
    },
  ]
}

// ── React Components ──────────────────────────────────────────

interface CheckingQuestionCardProps {
  question: CheckingQuestion
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function CheckingQuestionCard({ question, onSubmit, disabled }: CheckingQuestionCardProps) {
  const [selected, setSelected] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const labelId = useId()

  const handleSubmit = useCallback(() => {
    if (!selected.trim() || submitted) return
    setSubmitted(true)
    onSubmit(selected.trim())
  }, [selected, submitted, onSubmit])

  if (submitted) {
    return (
      <div className="mt-2 animate-pulse rounded-lg bg-blue-50 p-3 text-center text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
        Checking your answer...
      </div>
    )
  }

  return (
    <div
      className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10"
      role="form"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        💡 Checking Question
      </p>
      <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {question.question}
      </p>
      {question.options ? (
        <div className="mb-3 space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                selected === opt
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600'
              }`}
            >
              <input
                type="radio"
                name="checking-question"
                value={opt}
                checked={selected === opt}
                onChange={() => setSelected(opt)}
                disabled={disabled}
                className="h-3.5 w-3.5 accent-blue-600"
              />
              <span style={{ color: 'var(--color-text)' }}>{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="Type your answer..."
          disabled={disabled}
          className="mb-3 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />
      )}
      <button
        onClick={handleSubmit}
        disabled={!selected.trim() || disabled}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Check Answer
      </button>
    </div>
  )
}

interface ExerciseCardProps {
  question: ExerciseQuestion
  questionIndex: number
  total: number
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function ExerciseCard({ question, questionIndex, total, onSubmit, disabled }: ExerciseCardProps) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const labelId = useId()

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || submitted) return
    setSubmitted(true)
    onSubmit(answer.trim())
  }, [answer, submitted, onSubmit])

  if (submitted) {
    return (
      <div className="mt-2 animate-pulse rounded-lg bg-green-50 p-3 text-center text-xs text-green-600 dark:bg-green-900/20 dark:text-green-400">
        Checking your answer...
      </div>
    )
  }

  return (
    <div
      className="mt-3 rounded-xl border-2 border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-900/10"
      role="form"
      aria-labelledby={labelId}
    >
      <div className="mb-3 flex items-center justify-between">
        <p id={labelId} className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          ✏️ Exercise {questionIndex + 1} of {total}
        </p>
        <span
          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400"
        >
          {question.type === 'fill-blank' ? 'Fill in the blank' : question.type === 'multiple-choice' ? 'Multiple choice' : question.type === 'rewrite' ? 'Rewrite' : 'Identify'}
        </span>
      </div>

      <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {question.question}
      </p>

      {question.options ? (
        <div className="mb-3 space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                answer === opt
                  ? 'border-green-500 bg-green-100 dark:bg-green-900/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600'
              }`}
            >
              <input
                type="radio"
                name={`exercise-${question.id}`}
                value={opt}
                checked={answer === opt}
                onChange={() => setAnswer(opt)}
                disabled={disabled}
                className="h-3.5 w-3.5 accent-green-600"
              />
              <span style={{ color: 'var(--color-text)' }}>{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          disabled={disabled}
          className="mb-3 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || disabled}
        className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit Answer
      </button>
    </div>
  )
}

interface ExerciseFeedbackCardProps {
  isCorrect: boolean
  feedback: string
}

export function ExerciseFeedbackCard({ isCorrect, feedback }: ExerciseFeedbackCardProps) {
  return (
    <div
      className={`mt-2 rounded-xl border-2 p-4 ${
        isCorrect
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10'
      }`}
    >
      <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
        {feedback}
      </p>
    </div>
  )
}


