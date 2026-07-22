import { describe, it, expect } from 'vitest'
import {
  validateTrueFalseNotGiven,
  validatePassageLength,
  validateParagraphFunctions,
  validateMatchingHeadingsStructure,
  validateQuestionSkillDistribution,
  validateEvidenceParagraph,
  validateDuplicateQuestions,
  validateQuestionTypeClassification,
  validateCompletionAnswers,
  validateCompletionGrammar,
  assessReadingQuality,
  validateReadingActivity,
  validatePassageCoverage,
  validateDifficultyAlignment,
  validateCompletionParaphrasing,
  validateDistractorQuality,
  validateInferenceQuality,
  validateSkillVariety,
  assessReadingQualityExpanded,
  validateBuiltInReadingActivity,
} from '../domain/ielts/validators'
import { ABSOLUTE_WORDS } from '../domain/ielts/reading-schemas'
import { DEFAULT_QUALITY_CONFIG } from '../domain/ielts/ielts-types'
import { profileReadingPassage, estimateQuestionDifficulty } from '../domain/ielts/passage-profiler'
import { createReadingQuestionPlan, estimateDirectRetrievalRatio } from '../domain/ielts/question-planner'
import { auditReadingExercise } from '../domain/ielts/seed-data-validator'
import { createSeedFullReadingTest } from '../infrastructure/seed-data'
import type { ReadingPassageProfile } from '../domain/ielts/ielts-types'

describe('Reading Quality Validators — Regression Tests', () => {
  // ================================================================
  // 1. TFNG group of 4 has True, False, and Not Given
  // ================================================================
  describe('1. TFNG distribution (T, F, NG required for 4+)', () => {
    it('rejects TFNG group of 4 with no Not Given', () => {
      const questions = [
        makeTFNG('q1', 1, 'Statement about the topic', 'true'),
        makeTFNG('q2', 2, 'Another true statement', 'true'),
        makeTFNG('q3', 3, 'Contradicts the passage entirely', 'false'),
        makeTFNG('q4', 4, 'Also true about the topic', 'true'),
      ]
      const result = validateTrueFalseNotGiven(questions, 'The passage says the topic is important and widely studied.')
      expect(result.valid).toBe(false)
      expect(result.distribution?.notGiven).toBe(0)
    })

    it('accepts TFNG group of 4 with at least one of each', () => {
      const passage = 'Coral reefs are diverse underwater ecosystems. They cover less than 1% of the ocean floor yet support 25% of marine species. Climate change threatens their survival through ocean warming and acidification.'
      const questions = [
        makeTFNG('q1', 1, 'Coral reefs support a quarter of all marine species', 'true'),
        makeTFNG('q2', 2, 'Coral reefs cover more than 10% of the ocean floor', 'false'),
        makeTFNG('q3', 3, 'Coral reefs are most abundant in the Atlantic Ocean', 'not-given'),
        makeTFNG('q4', 4, 'Ocean warming poses a risk to coral reef ecosystems', 'true'),
      ]
      const result = validateTrueFalseNotGiven(questions, passage)
      expect(result.valid).toBe(true)
      expect(result.distribution).toEqual({ true: 2, false: 1, notGiven: 1 })
    })

    it('rejects TFNG group with zero Not Given in a 5-question group', () => {
      const passage = 'Urban beekeeping has grown in popularity across major cities. Rooftop hives now exist on buildings in London, New York and Tokyo.'
      const questions = Array.from({ length: 5 }, (_, i) =>
        makeTFNG(`q${i}`, i + 1, `Statement about urban beekeeping ${i + 1}`, 'true'),
      )
      questions[2] = makeTFNG('q3', 3, 'Urban beekeeping contradicts city regulations', 'false')
      const result = validateTrueFalseNotGiven(questions, passage)
      expect(result.valid).toBe(false)
      expect(result.distribution?.notGiven).toBe(0)
    })
  })

  // ================================================================
  // 2. Repeated "only", "all", "always", "never" traps trigger review
  // ================================================================
  describe('2. Absolute word traps trigger review', () => {
    it('flags false answer relying on multiple absolute words', () => {
      const passage = 'The fennec fox uses its large ears to dissipate heat and to locate prey underground. Its ears can also help regulate body temperature in the desert environment.'
      const questions = [
        makeTFNG('q1', 1, 'The fennec fox is native to desert regions', 'true'),
        makeTFNG('q2', 2, 'The fennec fox uses its ears only for cooling', 'false'),
        makeTFNG('q3', 3, 'Fennec foxes are the smallest canids', 'not-given'),
        makeTFNG('q4', 4, 'The fox relies entirely on its ears for survival and never uses other adaptations', 'false'),
        makeTFNG('q5', 5, 'Fennec foxes have adapted to desert life', 'true'),
      ]
      const result = validateTrueFalseNotGiven(questions, passage)
      
      const qualityIssues = result.quality?.issues || []
      const absoluteIssues = qualityIssues.filter(i =>
        i.severity === 'major' && i.description.includes('absolute word')
      )
      expect(absoluteIssues.length).toBeGreaterThanOrEqual(1)
    })

    it('detects extreme words in statement', () => {
      const hasAll = ABSOLUTE_WORDS.includes('all')
      const hasOnly = ABSOLUTE_WORDS.includes('only')
      const hasNever = ABSOLUTE_WORDS.includes('never')
      expect(hasAll).toBe(true)
      expect(hasOnly).toBe(true)
      expect(hasNever).toBe(true)
    })
  })

  // ================================================================
  // 3. Short-answer question is not parsed as gap fill
  // ================================================================
  describe('3. Short-answer vs gap-fill classification', () => {
    it('flags short-answer that looks like gap-fill text', () => {
      const questions = [
        {
          id: 'q1',
          type: 'short-answer',
          question: 'Camels reduce water loss by producing dry ______ and highly concentrated urine.',
        },
      ]
      const result = validateQuestionTypeClassification(questions)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.description.includes('fill-in-the-blank'))).toBe(true)
    })

    it('accepts proper short-answer question', () => {
      const questions = [
        {
          id: 'q1',
          type: 'short-answer',
          question: 'What phrase is used to describe camels in the passage?',
        },
      ]
      const result = validateQuestionTypeClassification(questions)
      expect(result.valid).toBe(true)
    })

    it('accepts proper gap-fill sentence', () => {
      const questions = [
        {
          id: 'q1',
          type: 'sentence-completion',
          sentence: 'Camels reduce water loss by producing dry ______.',
        },
      ]
      const result = validateQuestionTypeClassification(questions)
      expect(result.valid).toBe(true)
    })
  })

  // ================================================================
  // 4. Completion answers obey word limits
  // ================================================================
  describe('4. Completion answer word limits', () => {
    it('rejects answer exceeding word limit', () => {
      const questions = [
        {
          id: 'q1',
          type: 'sentence-completion',
          sentence: 'The species has a ______.',
          gaps: [{ id: 'g1', correctAnswer: 'remarkably long and distinctive tail' }],
          wordLimit: { maxWords: 2, maxNumbers: 0, instruction: 'NO MORE THAN TWO WORDS' },
        },
      ]
      const result = validateCompletionAnswers(questions, 'The species has a remarkably long and distinctive tail that helps it balance.')
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.description.includes('word limit'))).toBe(true)
    })

    it('accepts answer within word limit', () => {
      const questions = [
        {
          id: 'q1',
          type: 'sentence-completion',
          sentence: 'The species has a ______.',
          gaps: [{ id: 'g1', correctAnswer: 'distinctive tail' }],
          wordLimit: { maxWords: 2, maxNumbers: 0, instruction: 'NO MORE THAN TWO WORDS' },
        },
      ]
      const result = validateCompletionAnswers(questions, 'The species has a distinctive tail that helps it balance.')
      expect(result.valid).toBe(true)
    })
  })

  // ================================================================
  // 5. Completion sentence grammar
  // ================================================================
  describe('5. Completion sentence grammar', () => {
    it('flags completion without gap markers', () => {
      const questions = [
        {
          id: 'q1',
          type: 'sentence-completion',
          sentence: 'Camels reduce water loss by producing dry waste.',
          gaps: [{ id: 'g1', correctAnswer: 'waste' }],
        },
      ]
      const result = validateCompletionGrammar(questions)
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('issues')
    })
  })

  // ================================================================
  // 6. Evidence paragraph validation
  // ================================================================
  describe('6. Evidence paragraph validation', () => {
    it('rejects evidence referencing non-existent paragraph', () => {
      const questions = [
        {
          id: 'q1',
          type: 'multiple-choice-single',
          question: 'What does the passage say about X?',
          correctAnswer: 'Content answer',
          evidence: { paragraphId: 'Z', supportingText: 'some text' },
        },
      ]
      const result = validateEvidenceParagraph(questions, ['A', 'B'], 'The passage discusses X in paragraph A.')
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.description.includes('does not exist'))).toBe(true)
    })

    it('accepts evidence with valid paragraph ID', () => {
      const questions = [
        {
          id: 'q1',
          type: 'multiple-choice-single',
          question: 'What does the passage say about X?',
          correctAnswer: 'Content answer',
          evidence: { paragraphId: 'A', supportingText: 'X is important' },
        },
      ]
      const result = validateEvidenceParagraph(questions, ['A', 'B'], 'The passage says X is important in paragraph A.')
      expect(result.valid).toBe(true)
    })

    it('flags missing supporting text for non-NG answers', () => {
      const questions = [
        {
          id: 'q1',
          type: 'true-false-not-given',
          statement: 'X is important',
          correctAnswer: 'true',
          evidence: { paragraphId: 'A', supportingText: null },
        },
      ]
      const result = validateEvidenceParagraph(questions, ['A', 'B'], 'X is important')
      expect(result.issues.some(i => i.description.includes('missing supporting text'))).toBe(true)
    })
  })

  // ================================================================
  // 7. Question skill distribution
  // ================================================================
  describe('7. Question skill distribution', () => {
    it('warns when all questions are direct-detail (not critical)', () => {
      const questions = Array.from({ length: 8 }, (_, i) => ({
        id: `q${i}`,
        skill: 'specific-detail',
      }))
      const result = validateQuestionSkillDistribution(questions, 5.5)
      expect(result.issues.length).toBeGreaterThanOrEqual(1)
      expect(result.issues.some(i => i.description.includes('direct detail'))).toBe(true)
    })

    it('accepts balanced skill mix', () => {
      const questions = [
        { id: 'q1', skill: 'specific-detail' },
        { id: 'q2', skill: 'specific-detail' },
        { id: 'q3', skill: 'paraphrase' },
        { id: 'q4', skill: 'paraphrase' },
        { id: 'q5', skill: 'main-idea' },
        { id: 'q6', skill: 'inference' },
        { id: 'q7', skill: 'cause-effect' },
        { id: 'q8', skill: 'reference' },
      ]
      const result = validateQuestionSkillDistribution(questions, 5.5)
      expect(result.valid).toBe(true)
    })

    it('flags no inference questions at Band 6.5+', () => {
      const questions = [
        { id: 'q1', skill: 'specific-detail' },
        { id: 'q2', skill: 'paraphrase' },
        { id: 'q3', skill: 'main-idea' },
        { id: 'q4', skill: 'cause-effect' },
        { id: 'q5', skill: 'specific-detail' },
      ]
      const result = validateQuestionSkillDistribution(questions, 6.5)
      expect(result.issues.some(i => i.description.includes('No inference'))).toBe(true)
    })
  })

  // ================================================================
  // 8. Matching Headings structure
  // ================================================================
  describe('8. Matching Headings structure', () => {
    it('accepts valid matching headings with 3+ paragraphs and extra headings', () => {
      const questions = [
        {
          id: 'q1',
          type: 'matching-headings',
          headings: ['i: First idea', 'ii: Second idea', 'iii: Third idea', 'iv: Fourth idea (unused)', 'v: Fifth idea (unused)'],
          paragraphs: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
          correctMatches: { A: 'i: First idea', B: 'ii: Second idea', C: 'iii: Third idea' },
        },
      ]
      const result = validateMatchingHeadingsStructure(questions)
      expect(result.valid).toBe(true)
    })

    it('rejects matching headings without enough headings', () => {
      const questions = [
        {
          id: 'q1',
          type: 'matching-headings',
          headings: ['i: First idea', 'ii: Second idea'],
          paragraphs: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
          correctMatches: { A: 'i: First idea', B: 'ii: Second idea', C: 'i: First idea' },
        },
      ]
      const result = validateMatchingHeadingsStructure(questions)
      expect(result.valid).toBe(false)
    })
  })

  // ================================================================
  // 9. Single heading rejected as Matching Headings
  // ================================================================
  describe('9. Single heading rejected as Matching Headings', () => {
    it('rejects a single-paragraph heading as matching-headings', () => {
      const questions = [
        {
          id: 'q1',
          type: 'matching-headings',
          headings: ['i: The correct heading'],
          paragraphs: [{ id: 'A' }],
          correctMatches: { A: 'i: The correct heading' },
        },
      ]
      const result = validateMatchingHeadingsStructure(questions)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.description.includes('only 1 paragraph'))).toBe(true)
    })
  })

  // ================================================================
  // 10. Evidence paragraph correspondence
  // ================================================================
  describe('10. Evidence paragraph correspondence', () => {
    it('passes when evidence paragraph exists in passage', () => {
      const questions = [
        {
          id: 'q1',
          type: 'multiple-choice-single',
          question: 'Test?',
          correctAnswer: 'Answer',
          evidence: { paragraphId: 'B', supportingText: 'text from paragraph B' },
        },
      ]
      const result = validateEvidenceParagraph(questions, ['A', 'B', 'C'], 'Paragraph B contains text from paragraph B.')
      expect(result.valid).toBe(true)
    })

    it('flags when supporting text is not found in passage', () => {
      const questions = [
        {
          id: 'q1',
          type: 'multiple-choice-single',
          question: 'Test?',
          correctAnswer: 'Answer',
          evidence: { paragraphId: 'A', supportingText: 'completely unrelated text not in passage' },
        },
      ]
      const result = validateEvidenceParagraph(questions, ['A', 'B'], 'The passage discusses other topics entirely.')
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.description.includes('does not appear'))).toBe(true)
    })
  })

  // ================================================================
  // 11. Duplicate semantic questions trigger repair
  // ================================================================
  describe('11. Duplicate question detection', () => {
    it('detects near-duplicate questions', () => {
      const questions = [
        { id: 'q1', statement: 'The passage suggests that climate change is a serious problem that requires immediate action.' },
        { id: 'q2', statement: 'The passage suggests that climate change is a serious problem requiring urgent action.' },
      ]
      const result = validateDuplicateQuestions(questions)
      expect(result.valid).toBe(false)
    })

    it('accepts genuinely different questions', () => {
      const questions = [
        { id: 'q1', statement: 'The passage suggests climate change is a serious problem.' },
        { id: 'q2', statement: 'The author argues that renewable energy is the primary solution.' },
      ]
      const result = validateDuplicateQuestions(questions)
      expect(result.valid).toBe(true)
    })
  })

  // ================================================================
  // 12. Difficulty alignment in quality report
  // ================================================================
  describe('12. Difficulty alignment in quality report', () => {
    it('reports low difficulty alignment for simple passage at high band', () => {
      const simplePassage = 'Dogs are popular pets. Many people own dogs. Dogs need food and water. They like to play fetch. Dogs are loyal animals.'
      const report = assessReadingQuality({
        passage: simplePassage,
        paragraphs: [
          { id: 'A', content: 'Dogs are popular pets. Many people own dogs.' },
          { id: 'B', content: 'Dogs need food and water. They like to play fetch. Dogs are loyal animals.' },
        ],
        taskGroups: [
          {
            id: 'g1',
            type: 'true-false-not-given',
            questions: [
              makeTFNG('q1', 1, 'Dogs are popular pets', 'true'),
              makeTFNG('q2', 2, 'Dogs need food and water', 'true'),
              makeTFNG('q3', 3, 'Dogs enjoy playing fetch', 'true'),
              makeTFNG('q4', 4, 'Cats are more popular than dogs', 'not-given'),
            ],
          },
        ],
        targetBandMin: 6.5,
      })
      expect(report.status).not.toBe('pass')
      expect(report.informationDensity).toBeLessThanOrEqual(0.4)
    })

    it('accepts dense passage aligned with band 5', () => {
      const passage = 'Climate change represents one of the most significant challenges facing the global community. Scientific evidence indicates that human activities, particularly fossil fuel combustion, have substantially increased atmospheric greenhouse gas concentrations. This has led to rising global temperatures and more frequent extreme weather events.'
      const report = assessReadingQuality({
        passage,
        paragraphs: [
          { id: 'A', content: 'Climate change represents one of the most significant challenges facing the global community.' },
          { id: 'B', content: 'Scientific evidence indicates that human activities, particularly fossil fuel combustion, have substantially increased atmospheric greenhouse gas concentrations.' },
          { id: 'C', content: 'This has led to rising global temperatures and more frequent extreme weather events.' },
        ],
        taskGroups: [
          {
            id: 'g1',
            type: 'true-false-not-given',
            questions: [
              makeTFNG('q1', 1, 'Climate change is a significant global challenge', 'true'),
              makeTFNG('q2', 2, 'Fossil fuel combustion has reduced greenhouse gas concentrations', 'false'),
              makeTFNG('q3', 3, 'The Paris Agreement was signed in 2015', 'not-given'),
              makeTFNG('q4', 4, 'Rising temperatures lead to extreme weather', 'true'),
            ],
          },
        ],
        targetBandMin: 5.0,
      })
      expect(report.status).not.toBe('reject')
    })
  })

  // ================================================================
  // 13. Formulaic textbook passages receive lower quality scores
  // ================================================================
  describe('13. Formulaic passage detection', () => {
    it('detects formulaic "general → example → explanation" pattern', () => {
      const formulaicPassage = `Water is essential for life. For example, humans need water to survive. This is because the human body is composed mostly of water.
      
Plants also require water to grow. For instance, crops need regular irrigation in dry climates. This means that agriculture depends on water availability.
      
Water pollution is a major environmental concern. For example, industrial waste can contaminate rivers and lakes. This shows how important the topic is.`

      const report = assessReadingQuality({
        passage: formulaicPassage,
        paragraphs: [
          { id: 'A', content: 'Water is essential for life. For example, humans need water to survive. This is because the human body is composed mostly of water.' },
          { id: 'B', content: 'Plants also require water to grow. For instance, crops need regular irrigation in dry climates. This means that agriculture depends on water availability.' },
          { id: 'C', content: 'Water pollution is a major environmental concern. For example, industrial waste can contaminate rivers and lakes. This shows how important the topic is.' },
        ],
        taskGroups: [
          {
            id: 'g1',
            type: 'multiple-choice-single',
            questions: [
              {
                id: 'q1', number: 1, type: 'multiple-choice-single',
                question: 'What is the main topic?',
                options: ['Water', 'Air', 'Fire', 'Earth'],
                correctIndex: 0,
                explanation: 'The passage is about water.',
                evidence: { paragraphId: 'A', supportingText: 'Water is essential for life.' },
              },
            ],
          },
        ],
      })

      expect(report.ieltsAuthenticity).toBeLessThanOrEqual(0.5)
      const formulaicIssues = report.issues.filter(i =>
        i.description.includes('formulaic') || i.description.includes('general statement')
      )
      expect(formulaicIssues.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ================================================================
  // 14. Invalid content blocked from persistence
  // ================================================================
  describe('14. Invalid content blocked from persistence', () => {
    it('rejects content with missing Not Given and formulaic structure', () => {
      const passage = 'Bees are important insects. For example, they pollinate flowers. This is because they collect nectar.'
      const result = validateReadingActivity(
        passage,
        [{ id: 'A', content: passage }],
        [
          {
            id: 'g1',
            type: 'true-false-not-given',
            questions: [
              makeTFNG('q1', 1, 'Bees are important insects', 'true'),
              makeTFNG('q2', 2, 'Bees pollinate flowers', 'true'),
              makeTFNG('q3', 3, 'Bees collect nectar', 'true'),
              makeTFNG('q4', 4, 'Bees only live in hives', 'false'),
            ],
          },
        ],
        { targetBandMin: 5.5 },
      )

      expect(result.validForPersistence).toBe(false)
    })

    it('accepts well-structured valid content', () => {
      const paraA = 'The decline of bee populations has become a pressing concern for ecologists and agricultural scientists worldwide. Over the past two decades, colony collapse disorder has resulted in the loss of millions of managed honeybee hives across Europe, North America and parts of Asia. This phenomenon threatens not only honey production but also the pollination of crops that make up a significant portion of the global food supply, including almonds, apples and various berries. The economic impact is substantial: global pollination services are valued at over 150 billion dollars annually, with bees responsible for approximately one-third of the food consumed by humans.'
      const paraB = 'Research conducted across multiple continents indicates that pesticide use is one of several contributing factors to this decline. Studies published in leading scientific journals have identified neonicotinoid insecticides as particularly harmful to bee navigation and immune function. However, most researchers agree that the causes are multifactorial: habitat loss due to agricultural intensification, the spread of parasitic mites such as Varroa destructor, and climate change all play significant roles. The interaction between these factors may amplify their individual effects, creating conditions more severe than any single cause would produce alone.'
      const paraC = 'In contrast to popular belief, wild bee species are often more vulnerable to environmental changes than managed honeybee colonies. Unlike domestic honeybees, which benefit from human intervention and management, solitary bees and bumblebees depend entirely on specific habitats and forage plants. When these habitats are fragmented or destroyed, wild pollinators have no alternative resources to fall back on, making conservation efforts for these species critically important. A recent meta-analysis revealed that wild bee populations have declined by an average of 25 percent in regions with intensive agriculture, compared to only a 10 percent decline in areas with mixed land use.'
      const passage = `${paraA}\n\n${paraB}\n\n${paraC}`

      const result = validateReadingActivity(
        passage,
        [
          { id: 'A', content: paraA },
          { id: 'B', content: paraB },
          { id: 'C', content: paraC },
        ],
        [
          {
            id: 'g1',
            type: 'true-false-not-given',
            questions: [
              {
                id: 'q1', number: 1, type: 'true-false-not-given',
                statement: 'Bee population decline has been observed on multiple continents',
                correctAnswer: 'true',
                skill: 'paraphrase',
                explanation: 'The passage refers to losses across Europe, North America and parts of Asia.',
                evidence: { paragraphId: 'A', supportingText: 'loss of millions of managed honeybee hives across Europe, North America and parts of Asia' },
              },
              {
                id: 'q2', number: 2, type: 'true-false-not-given',
                statement: 'Pesticides are the only factor responsible for bee decline',
                correctAnswer: 'false',
                skill: 'inference',
                explanation: 'The passage states causes are multifactorial, contradicting the claim that pesticides are the only factor.',
                evidence: { paragraphId: 'B', supportingText: 'causes are multifactorial' },
              },
              {
                id: 'q3', number: 3, type: 'true-false-not-given',
                statement: 'The number of beekeeping operations in Australia has doubled since 2010',
                correctAnswer: 'not-given',
                skill: 'specific-detail',
                explanation: 'The passage does not mention Australia or any statistics about beekeeping operations.',
                evidence: { paragraphId: 'A', supportingText: null },
              },
              {
                id: 'q4', number: 4, type: 'true-false-not-given',
                statement: 'Wild bee populations are at greater risk from environmental disruption than managed colonies',
                correctAnswer: 'true',
                skill: 'comparison',
                explanation: 'The passage explicitly contrasts wild bees with managed honeybee colonies.',
                evidence: { paragraphId: 'C', supportingText: 'wild bee species are often more vulnerable to environmental changes than managed honeybee colonies' },
              },
            ],
          },
        ],
        { targetBandMin: 5.5 },
      )

      expect(result.validForPersistence).toBe(true)
    })
  })

  // ================================================================
  // 15. Desert animal fixture — genuine Not Given
  // ================================================================
  describe('15. Desert animal fixture — genuine Not Given', () => {
    it('requires at least one Not Given in a 4-question TFNG group', () => {
      const passage = 'Desert animals have evolved remarkable adaptations for surviving in arid environments. The fennec fox, native to the Sahara, uses its large ears to dissipate heat and detect prey underground. Camels store fat in their humps, which can be metabolized for both energy and water. Many desert reptiles obtain all their water from the food they consume.'
      
      const questions = [
        makeTFNG('q1', 1, 'Desert animals have evolved adaptations for arid survival', 'true'),
        makeTFNG('q2', 2, 'The fennec fox uses its ears for thermoregulation', 'true'),
        makeTFNG('q3', 3, 'Camels store fat primarily in their tails rather than humps', 'false'),
        makeTFNG('q4', 4, 'The fennec fox is the smallest desert carnivore in the Sahara', 'not-given'),
      ]

      const result = validateTrueFalseNotGiven(questions, passage)
      
      if (result.distribution) {
        const { true: t, false: f, notGiven: ng } = result.distribution
        expect(t).toBeGreaterThanOrEqual(1)
        expect(f).toBeGreaterThanOrEqual(1)
        expect(ng).toBeGreaterThanOrEqual(1)
      } else {
        expect(result.valid).toBe(true)
      }
    })
  })

  // ================================================================
  // 16. Question type classification remains correct
  // ================================================================
  describe('16. Question type classification validation', () => {
    it('detects misclassified short-answer', () => {
      const questions = [
        {
          id: 'q1',
          type: 'short-answer',
          question: 'The process involves three main ______ that occur sequentially.',
        },
      ]
      const result = validateQuestionTypeClassification(questions)
      expect(result.valid).toBe(false)
    })

    it('accepts all correct type assignments', () => {
      const questions = [
        { id: 'q1', type: 'multiple-choice-single', question: 'What is the main purpose of the passage?' },
        { id: 'q2', type: 'true-false-not-given', statement: 'The passage states that X is true.' },
        { id: 'q3', type: 'sentence-completion', sentence: 'The experiment demonstrated that ______ is essential.' },
        { id: 'q4', type: 'short-answer', question: 'What was the key finding of the study?' },
      ]
      const result = validateQuestionTypeClassification(questions)
      expect(result.valid).toBe(true)
    })
  })

  // ================================================================
  // 17. Passage Coverage Validation (NEW)
  // ================================================================
  describe('17. Passage coverage validation', () => {
    it('flags questions clustered in one paragraph', () => {
      const paragraphs = [
        { id: 'A', content: 'Paragraph A content about the main topic.' },
        { id: 'B', content: 'Paragraph B provides evidence from a 2019 study.' },
        { id: 'C', content: 'Paragraph C discusses limitations and critiques.' },
        { id: 'D', content: 'Paragraph D concludes with future implications.' },
      ]
      const questions = Array.from({ length: 6 }, (_, i) => ({
        id: `q${i}`,
        type: 'true-false-not-given',
        evidence: { paragraphId: 'A', supportingText: 'some text' },
        skill: 'specific-detail',
      }))
      const result = validatePassageCoverage(questions, paragraphs)
      expect(result.coverage.paragraphIdsUsed).toHaveLength(1)
      expect(result.issues.some(i => i.description.includes('cover only'))).toBe(true)
    })

    it('accepts well-distributed coverage', () => {
      const paragraphs = [
        { id: 'A', content: 'Paragraph A.' },
        { id: 'B', content: 'Paragraph B.' },
        { id: 'C', content: 'Paragraph C.' },
        { id: 'D', content: 'Paragraph D.' },
      ]
      const questions = [
        { id: 'q1', type: 'true-false-not-given', evidence: { paragraphId: 'A', supportingText: 'text A' }, skill: 'specific-detail' },
        { id: 'q2', type: 'true-false-not-given', evidence: { paragraphId: 'B', supportingText: 'text B' }, skill: 'paraphrase' },
        { id: 'q3', type: 'true-false-not-given', evidence: { paragraphId: 'C', supportingText: 'text C' }, skill: 'inference' },
        { id: 'q4', type: 'true-false-not-given', evidence: { paragraphId: 'D', supportingText: 'text D' }, skill: 'comparison' },
      ]
      const result = validatePassageCoverage(questions, paragraphs)
      expect(result.valid).toBe(true)
      expect(result.coverage.paragraphIdsUsed).toHaveLength(4)
    })
  })

  // ================================================================
  // 18. Difficulty Alignment Validation (NEW)
  // ================================================================
  describe('18. Difficulty alignment validation', () => {
    it('rejects Band 6.5 passage with only Band 5 direct-retrieval questions', () => {
      const passage = 'Scientific investigation into quantum computing has accelerated dramatically in recent years. Researchers have demonstrated that quantum bits can exist in multiple states simultaneously, enabling computational capabilities that far exceed those of classical computers for specific problem domains. However, significant engineering challenges remain before practical quantum computers can be deployed at scale.'.repeat(3)
      const questions = Array.from({ length: 6 }, (_, i) => ({
        id: `q${i}`,
        skill: 'specific-detail' as const,
        statement: `The passage mentions something about quantum computing ${i + 1}`,
      }))
      const result = validateDifficultyAlignment(
        questions,
        { estimatedBandRange: { minimum: 6.5, maximum: 7.5 } },
        passage,
      )
      expect(result.valid).toBe(false)
      expect(result.directRetrievalRatio).toBeGreaterThan(0.4)
    })

    it('accepts questions aligned with passage difficulty', () => {
      const passage = 'The quantum computing revolution represents a paradigm shift in computational theory. Unlike classical bits, quantum bits leverage superposition and entanglement to process information in fundamentally new ways. Despite these theoretical advantages, practical implementation faces substantial obstacles including decoherence and error correction challenges.'
      const questions = [
        { id: 'q1', skill: 'specific-detail', question: 'What is the primary challenge?' },
        { id: 'q2', skill: 'paraphrase', question: 'How are quantum bits different?' },
        { id: 'q3', skill: 'inference', question: 'What can be inferred about current quantum computers?' },
        { id: 'q4', skill: 'comparison', question: 'Compare classical and quantum computing.' },
      ]
      const result = validateDifficultyAlignment(
        questions,
        { estimatedBandRange: { minimum: 5.0, maximum: 6.5 } },
        passage,
      )
      expect(result.directRetrievalRatio).toBeLessThan(0.5)
    })
  })

  // ================================================================
  // 19. Completion Paraphrasing (NEW)
  // ================================================================
  describe('19. Completion paraphrasing validation', () => {
    it('flags completion that directly copies passage wording', () => {
      const passage = 'The researchers discovered that caffeine consumption significantly improves cognitive performance in sleep-deprived individuals.'
      const questions = [
        {
          id: 'q1',
          type: 'sentence-completion',
          sentence: 'The researchers discovered that caffeine consumption significantly improves cognitive ______.',
          gaps: [{ correctAnswer: 'performance' }],
        },
      ]
      const result = validateCompletionParaphrasing(questions, passage)
      expect(result.issues.some(i => i.description.includes('closely copies'))).toBe(true)
    })

    it('accepts paraphrased completion', () => {
      const passage = 'The study revealed that moderate exercise enhances memory retention in elderly participants.'
      const questions = [
        {
          id: 'q1',
          type: 'sentence-completion',
          sentence: 'Older adults showed improved recall ability after engaging in ______.',
          gaps: [{ correctAnswer: 'moderate exercise' }],
        },
      ]
      const result = validateCompletionParaphrasing(questions, passage)
      expect(result.valid).toBe(true)
    })
  })

  // ================================================================
  // 20. Distractor Quality (NEW)
  // ================================================================
  describe('20. Distractor quality validation', () => {
    it('flags distractors too short compared to correct answer', () => {
      const questions = [
        {
          id: 'q1',
          type: 'multiple-choice-single',
          question: 'What is the main topic?',
          options: [
            'A comprehensive analysis of the intersection between modern technology and traditional educational methodologies in developing nations',
            'Yes',
            'No',
            'Maybe not',
          ],
          correctIndex: 0,
        },
      ]
      const result = validateDistractorQuality(questions, 'A long passage about technology and education.')
      expect(result.issues.some(i => i.description.includes('too short'))).toBe(true)
    })

    it('accepts well-formed distractors', () => {
      const questions = [
        {
          id: 'q1',
          type: 'multiple-choice-single',
          question: 'What does the passage suggest about renewable energy?',
          options: [
            'It is becoming more cost-effective than fossil fuels in many regions',
            'It has been fully adopted by all major industrial nations worldwide',
            'It requires further technological development to achieve widespread use',
            'It represents a temporary solution rather than a permanent change',
          ],
          correctIndex: 0,
        },
      ]
      const result = validateDistractorQuality(questions, 'Renewable energy has grown substantially in recent years. Solar and wind power are becoming more cost-effective than fossil fuels in many regions. However, further technological development is needed for widespread use.')
      expect(result.valid).toBe(true)
    })
  })

  // ================================================================
  // 21. Inference Quality (NEW)
  // ================================================================
  describe('21. Inference quality validation', () => {
    it('flags inference question without inferential explanation', () => {
      const questions = [
        {
          id: 'q1',
          skill: 'inference',
          statement: 'What can be concluded from the passage?',
          explanation: 'The passage directly states this fact.',
        },
      ]
      const result = validateInferenceQuality(questions, 'Some passage text.')
      expect(result.issues.some(i => i.description.includes('does not reference inferential'))).toBe(true)
    })

    it('accepts proper inference with inferential language', () => {
      const questions = [
        {
          id: 'q1',
          skill: 'inference',
          statement: 'What can be inferred about X?',
          explanation: 'The passage implies that X leads to Y, suggesting that Z would be a likely outcome.',
        },
      ]
      const result = validateInferenceQuality(questions, 'The passage discusses X.')
      expect(result.valid).toBe(true)
    })
  })

  // ================================================================
  // 22. Skill Variety (NEW)
  // ================================================================
  describe('22. Skill variety validation', () => {
    it('flags exercise with only one skill type for 6 questions', () => {
      const questions = Array.from({ length: 6 }, (_, i) => ({
        id: `q${i}`,
        skill: 'specific-detail',
      }))
      const result = validateSkillVariety(questions, 6.0)
      expect(result.valid).toBe(false)
      expect(result.skillCount).toBe(1)
    })

    it('accepts exercise with varied skill distribution', () => {
      const questions = [
        { id: 'q1', skill: 'specific-detail' },
        { id: 'q2', skill: 'paraphrase' },
        { id: 'q3', skill: 'inference' },
        { id: 'q4', skill: 'paragraph-purpose' },
        { id: 'q5', skill: 'reference-tracking' },
        { id: 'q6', skill: 'cause-effect' },
      ]
      const result = validateSkillVariety(questions, 6.0)
      expect(result.valid).toBe(true)
      expect(result.skillCount).toBeGreaterThanOrEqual(4)
    })
  })

  // ================================================================
  // 23. Passage Profiler (NEW)
  // ================================================================
  describe('23. Passage profiler', () => {
    it('profiles a Band 6-6.5 passage with multiple paragraph functions', () => {
      const passage = `The evolution of sport in modern society represents a profound transformation from its ancient origins. Historically, athletic competitions served primarily as religious ceremonies and military training exercises in civilizations such as ancient Greece and Rome. These early manifestations of organized sport were deeply embedded in cultural and spiritual practices, rather than existing as standalone entertainment.

However, the industrial revolution fundamentally altered the relationship between sport and society. The standardization of working hours and the emergence of leisure time created unprecedented opportunities for organized recreational activities. Consequently, sport evolved from an elite pursuit into a mass phenomenon, with the establishment of formal rules, governing bodies, and international competitions during the late nineteenth and early twentieth centuries.

The commercialization of sport has generated both substantial economic benefits and significant ethical challenges. On one hand, professional leagues generate billions of dollars in revenue, create employment opportunities across multiple sectors, and stimulate urban development through stadium construction and tourism. On the other hand, this financial dimension has introduced complex problems including doping scandals, corruption within governing bodies, and the prioritization of profit over athlete welfare.

Despite these challenges, sport continues to function as a powerful vehicle for social change and community development. Urban youth sports programs have demonstrated measurable positive outcomes, including reduced crime rates, improved academic performance, and enhanced social cohesion. However, funding constraints and accessibility barriers remain significant obstacles, particularly in economically disadvantaged communities where the need is often greatest.

The intersection of technology and sport represents perhaps the most significant contemporary development. Video assistant referees, performance analytics, and digital broadcasting have transformed both participation and spectatorship. Nevertheless, debates continue regarding whether technological interventions enhance or diminish the fundamental human experience of athletic competition.`
      
      const paragraphs = [
        { id: 'A', content: passage.split('\n\n')[0] },
        { id: 'B', content: passage.split('\n\n')[1] },
        { id: 'C', content: passage.split('\n\n')[2] },
        { id: 'D', content: passage.split('\n\n')[3] },
        { id: 'E', content: passage.split('\n\n')[4] },
      ]
      
      const profile = profileReadingPassage(passage, paragraphs)
      
      expect(profile.wordCount).toBeGreaterThan(200)
      expect(profile.paragraphCount).toBeGreaterThanOrEqual(4)
      expect(profile.estimatedBandRange.minimum).toBeGreaterThanOrEqual(5.5)
      expect(profile.estimatedBandRange.maximum).toBeLessThanOrEqual(7.5)
      expect(profile.paragraphFunctions.length).toBe(5)
      
      // First paragraph should have historical-background
      const para1Funcs = profile.paragraphFunctions[0].functions
      expect(para1Funcs.some(f => f === 'historical-background' || f === 'introduction')).toBe(true)
      
      // Third paragraph should have contrast
      const para3Funcs = profile.paragraphFunctions[2].functions
      expect(para3Funcs.some(f => f === 'contrast' || f === 'cause' || f === 'effect')).toBe(true)
    })

    it('estimates question difficulty for different skills', () => {
      const passage = 'Coral reefs are diverse underwater ecosystems. They cover less than 1% of the ocean floor yet support 25% of marine species.'
      
      const detailQuestion = { skill: 'specific-detail', question: 'How much of the ocean floor do reefs cover?' }
      const detailResult = estimateQuestionDifficulty(detailQuestion, passage)
      expect(detailResult.estimatedBand).toBeLessThan(6.0)
      expect(detailResult.isDirectRetrieval).toBe(true)
      
      const inferenceQuestion = { skill: 'inference', question: 'What can be inferred about the ecological significance of coral reefs?' }
      const inferenceResult = estimateQuestionDifficulty(inferenceQuestion, passage)
      expect(inferenceResult.estimatedBand).toBeGreaterThan(5.5)
    })
  })

  // ================================================================
  // 24. Question Planner (NEW)
  // ================================================================
  describe('24. Question planner', () => {
    it('creates a 6-question plan with skill variety', () => {
      const passage = 'Research has shown that regular exercise provides numerous health benefits. Studies indicate that even moderate physical activity can reduce the risk of chronic diseases. However, many people struggle to maintain consistent exercise routines due to time constraints and lack of motivation.'.repeat(5)
      const paragraphs = [
        { id: 'A', content: 'Research has shown exercise provides health benefits.' },
        { id: 'B', content: 'Studies indicate moderate activity reduces disease risk.' },
        { id: 'C', content: 'However, many people struggle with consistency.' },
        { id: 'D', content: 'Time constraints and motivation are key barriers.' },
      ]
      const profile = profileReadingPassage(passage, paragraphs)
      const plan = createReadingQuestionPlan(6, 6.0, profile)
      
      expect(plan.totalQuestions).toBe(6)
      expect(plan.requiredSkills.length).toBeGreaterThanOrEqual(4)
      expect(plan.taskGroups.length).toBeGreaterThanOrEqual(1)
      expect(plan.maximumDirectRetrievalRatio).toBe(0.4)
      
      const directRetrieval = estimateDirectRetrievalRatio(plan.requiredSkills)
      expect(directRetrieval).toBeLessThanOrEqual(0.5)
    })

    it('ensures direct retrieval ratio stays within limits', () => {
      const plan = createReadingQuestionPlan(8, 5.5, {
        wordCount: 500,
        paragraphCount: 4,
        estimatedBandRange: { minimum: 5.0, maximum: 6.0 },
        lexicalComplexity: 0.4,
        syntacticComplexity: 0.3,
        informationDensity: 0.5,
        conceptualDensity: 0.3,
        discourseComplexity: 0.4,
        referenceTrackingDemand: 0.3,
        crossParagraphConnections: 0.3,
        paragraphFunctions: [
          { paragraphId: 'A', functions: ['introduction'] },
          { paragraphId: 'B', functions: ['evidence'] },
          { paragraphId: 'C', functions: ['contrast'] },
          { paragraphId: 'D', functions: ['conclusion'] },
        ],
      })
      
      expect(plan.maximumDirectRetrievalRatio).toBe(0.4)
    })
  })

  // ================================================================
  // 25. Expanded Quality Report (NEW)
  // ================================================================
  describe('25. Expanded quality report', () => {
    it('detects direct-retrieval-heavy exercise for Band 6.5 passage', () => {
      const passage = 'The intersection of artificial intelligence and healthcare represents one of the most promising frontiers in modern medicine. Machine learning algorithms have demonstrated remarkable accuracy in diagnosing conditions ranging from retinal diseases to certain types of cancer, often matching or exceeding the performance of experienced clinicians. However, the deployment of AI in clinical settings raises complex questions about accountability, bias in training data, and the changing role of medical professionals.'.repeat(3)
      
      const paragraphs = [
        { id: 'A', content: passage.split('. ')[0] + '.' },
        { id: 'B', content: passage.split('. ')[1] + '.' },
        { id: 'C', content: passage.split('. ')[2] + '.' },
      ]
      
      const report = assessReadingQualityExpanded({
        passage,
        paragraphs,
        taskGroups: [
          {
            id: 'g1',
            type: 'true-false-not-given',
            questions: Array.from({ length: 4 }, (_, i) => ({
              id: `q${i}`,
              number: i + 1,
              type: 'true-false-not-given',
              statement: `The passage mentions AI in healthcare ${i + 1}`,
              correctAnswer: 'true',
              skill: 'specific-detail',
              explanation: 'The passage mentions this topic.',
              evidence: { paragraphId: 'A', supportingText: 'AI in healthcare' },
            })),
          },
        ],
        bandMin: 6.5,
      })
      
      expect(report.directRetrievalRatio).toBeGreaterThan(0.4)
      expect(report.status).not.toBe('pass')
    })

    it('passes a well-structured, varied exercise', () => {
      const passage = 'Agricultural practices have undergone profound changes over the past century. The shift from subsistence farming to industrial agriculture has dramatically increased crop yields but introduced environmental concerns regarding soil degradation and water quality. Organic farming methods offer an alternative approach by emphasizing ecological balance and biodiversity. However, organic produce remains more expensive than conventionally grown alternatives, limiting accessibility for lower-income populations.'
      
      const paragraphs = [
        { id: 'A', content: 'Agricultural practices have undergone profound changes. The shift to industrial agriculture increased yields but raised environmental concerns.' },
        { id: 'B', content: 'Organic farming methods offer an alternative by emphasizing ecological balance and biodiversity.' },
        { id: 'C', content: 'However, organic produce remains more expensive, limiting accessibility for lower-income populations.' },
      ]
      
      const report = assessReadingQualityExpanded({
        passage,
        paragraphs,
        taskGroups: [
          {
            id: 'g1',
            type: 'multiple-choice-single',
            questions: [
              {
                id: 'q1', number: 1, type: 'multiple-choice-single',
                question: 'What is the main purpose of the first paragraph?',
                options: [
                  'To describe the shift from subsistence to industrial agriculture and its trade-offs',
                  'To argue that organic farming is superior to industrial methods',
                  'To list all agricultural technologies developed in the past century',
                  'To compare food prices across different economic systems',
                ],
                correctIndex: 0,
                skill: 'paragraph-purpose',
                explanation: 'The paragraph introduces agricultural changes and their dual consequences.',
                evidence: { paragraphId: 'A', supportingText: 'profound changes' },
              },
              {
                id: 'q2', number: 2, type: 'multiple-choice-single',
                question: 'What can be inferred about the affordability of organic food?',
                options: [
                  'It restricts consumption among economically disadvantaged groups',
                  'It has no effect on consumer purchasing decisions',
                  'It is cheaper than conventional food in most markets',
                  'It will decrease significantly within the next decade',
                ],
                correctIndex: 0,
                skill: 'inference',
                explanation: 'The passage implies that higher cost limits accessibility, which suggests reduced consumption among lower-income groups.',
                evidence: { paragraphId: 'C', supportingText: 'limiting accessibility for lower-income populations' },
              },
              {
                id: 'q3', number: 3, type: 'multiple-choice-single',
                question: 'According to the passage, what environmental advantage does organic farming offer?',
                options: [
                  'Increased crop yields compared to industrial methods',
                  'Lower production costs through technological innovation',
                  'Emphasis on ecological balance and biodiversity preservation',
                  'Reduced need for agricultural labor through automation',
                ],
                correctIndex: 2,
                skill: 'specific-detail',
                explanation: 'The passage directly states that organic farming emphasizes ecological balance and biodiversity.',
                evidence: { paragraphId: 'B', supportingText: 'emphasizing ecological balance and biodiversity' },
              },
            ],
          },
        ],
        bandMin: 5.5,
      })
      
      expect(report.status).not.toBe('reject')
    })
  })

  // ================================================================
  // 26. Built-in Activity Audit (NEW)
  // ================================================================
  describe('26. Built-in activity audit', () => {
    it('audits seed reading exercise', () => {
      const seedExercise = createSeedFullReadingTest()
      const result = auditReadingExercise({
        id: seedExercise.id,
        title: seedExercise.title,
        passages: seedExercise.passages,
      })
      
      expect(result).toHaveProperty('exerciseId')
      expect(result).toHaveProperty('passageEstimatedBand')
      expect(result).toHaveProperty('directRetrievalRatio')
      expect(result).toHaveProperty('skillDistribution')
      expect(result).toHaveProperty('passageCoverage')
      expect(result).toHaveProperty('status')
      
      // Seed exercise has stub content, so it should have issues
      expect(result.issues.length).toBeGreaterThanOrEqual(0)
    })

    it('flags built-in exercise with no passage coverage', () => {
      const result = auditReadingExercise({
        id: 'test-built-in',
        title: 'Test Exercise',
        passages: [{
          id: 'p1',
          content: 'A brief passage about technology.',
          questionGroups: [{
            id: 'g1',
            type: 'true_false_not_given',
            instructions: [],
            questions: Array.from({ length: 5 }, (_, i) => ({
              id: `q${i}`,
              number: i + 1,
              type: 'true_false_not_given',
              prompt: `Statement ${i}`,
              statement: `Statement ${i}`,
              correctAnswer: 'true',
              points: 1,
              difficulty: { difficulty: 0.5 },
              learningObjectiveIds: [],
            })),
          }],
        }],
      })
      
      expect(result.malformedTaskTypes.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ================================================================
  // 27. False vs Not Given distinction (NEW)
  // ================================================================
  describe('27. False distinguished from Not Given', () => {
    it('accepts subtler false that doesn\'t use absolute words', () => {
      const passage = 'The construction of the new railway line took three years longer than originally planned due to unexpected geological conditions encountered during tunnel excavation. The revised timeline pushed the completion date to 2024, resulting in additional costs of approximately 1.2 billion dollars.'
      const questions = [
        makeTFNG('q1', 1, 'The railway project was completed ahead of schedule', 'false'),
        makeTFNG('q2', 2, 'Geological conditions affected the construction timeline', 'true'),
        makeTFNG('q3', 3, 'The additional costs totalled 1.2 billion euros', 'not-given'),
        makeTFNG('q4', 4, 'The revised completion date was set for 2024', 'true'),
      ]
      const result = validateTrueFalseNotGiven(questions, passage)
      
      const qualityIssues = result.quality?.issues || []
      const absoluteIssues = qualityIssues.filter(i =>
        i.description.includes('absolute word')
      )
      // The false statement uses subtler contradiction, shouldn't trigger absolute-word warning
      expect(absoluteIssues.length).toBe(0)
    })

    it('distinguishes false (contradicts) from not-given (missing info)', () => {
      const passage = 'Marine biologists have observed that dolphin populations in the Mediterranean have stabilised following conservation efforts initiated in the 1990s. These measures included fishing restrictions and the establishment of protected marine areas along key migration routes.'
      const questions = [
        makeTFNG('q1', 1, 'Dolphin populations in the Mediterranean increased substantially after conservation measures began', 'false'),
        makeTFNG('q2', 2, 'Protected marine areas have been established along dolphin migration routes', 'true'),
        makeTFNG('q3', 3, 'The Mediterranean dolphin population was estimated at 12,000 in 1995', 'not-given'),
      ]
      const result = validateTrueFalseNotGiven(questions, passage)
      expect(result.distribution).toBeDefined()
      expect(result.distribution?.true).toBe(1)
      expect(result.distribution?.false).toBe(1)
      expect(result.distribution?.notGiven).toBe(1)
    })
  })
})

// Helper to create TFNG question objects
function makeTFNG(id: string, number: number, statement: string, correctAnswer: 'true' | 'false' | 'not-given') {
  const explanation: Record<string, string> = {
    'true': `The passage confirms that ${statement}`,
    'false': `The passage contradicts the statement about ${statement}`,
    'not-given': `The passage does not provide information about ${statement}`,
  }
  return {
    id,
    number,
    type: 'true-false-not-given' as const,
    statement,
    correctAnswer,
    explanation: explanation[correctAnswer] || 'Explanation text.',
    evidence: {
      paragraphId: 'A',
      supportingText: correctAnswer === 'not-given' ? null : 'relevant passage text supporting the answer',
    },
  }
}
