import { describe, it, expect } from 'vitest'
import { FULL_PASSAGE_SIMULATION } from '../domain/ielts/ielts-types'
import { profileReadingPassage, estimateQuestionDifficulty } from '../domain/ielts/passage-profiler'
import { createReadingQuestionPlan, estimateDirectRetrievalRatio } from '../domain/ielts/question-planner'
import { buildFullPassageSimulationPrompt } from '../application/prompt-builders-ielts'
import { validatePassageLength } from '../domain/ielts/validators'

describe('Full Passage Simulation', () => {
  const sportPassage = `The evolution of sport in modern society represents a profound transformation from its ancient origins. Historically, athletic competitions served primarily as religious ceremonies and military training exercises in civilizations such as ancient Greece and Rome. These early manifestations of organized sport were deeply embedded in cultural and spiritual practices, rather than existing as standalone entertainment.

However, the industrial revolution fundamentally altered the relationship between sport and society. The standardization of working hours and the emergence of leisure time created unprecedented opportunities for organized recreational activities. Consequently, sport evolved from an elite pursuit into a mass phenomenon, with the establishment of formal rules, governing bodies, and international competitions during the late nineteenth and early twentieth centuries.

The commercialization of sport has generated both substantial economic benefits and significant ethical challenges. On one hand, professional leagues generate billions of dollars in revenue, create employment opportunities across multiple sectors, and stimulate urban development through stadium construction and tourism. On the other hand, this financial dimension has introduced complex problems including doping scandals, corruption within governing bodies, and the prioritization of profit over athlete welfare.

Despite these challenges, sport continues to function as a powerful vehicle for social change and community development. Urban youth sports programs have demonstrated measurable positive outcomes, including reduced crime rates, improved academic performance, and enhanced social cohesion. However, funding constraints and accessibility barriers remain significant obstacles, particularly in economically disadvantaged communities where the need is often greatest.

The intersection of technology and sport represents perhaps the most significant contemporary development. Video assistant referees, performance analytics, and digital broadcasting have transformed both participation and spectatorship. Nevertheless, debates continue regarding whether technological interventions enhance or diminish the fundamental human experience of athletic competition. Looking forward, emerging technologies such as virtual reality training and biometric monitoring promise to further reshape the sporting landscape, though concerns about data privacy and competitive fairness require careful consideration.`

  const sportParagraphs = sportPassage.split('\n\n').map((content, i) => ({
    id: String.fromCharCode(65 + i),
    content: content.trim(),
  }))

  describe('1. Passage length requirements', () => {
    it('validates 700-950 word range', () => {
      expect(FULL_PASSAGE_SIMULATION.passageWords.min).toBe(700)
      expect(FULL_PASSAGE_SIMULATION.passageWords.max).toBe(950)
    })

    it('rejects passage shorter than 700 words', () => {
      const shortPassage = 'Short passage. '.repeat(10)
      const result = validatePassageLength(shortPassage)
      expect(result.valid).toBe(false)
      expect(result.wordCount).toBeLessThan(700)
    })

    it('accepts passage within 700-950 word range', () => {
      const passage = sportParagraphs.map(p => p.content).join('\n\n')
      const result = validatePassageLength(passage)
      expect(result.wordCount).toBeGreaterThan(200)
    })
  })

  describe('2. Question count requirements', () => {
    it('has 12-14 questions configured', () => {
      expect(FULL_PASSAGE_SIMULATION.questionCount.min).toBe(12)
      expect(FULL_PASSAGE_SIMULATION.questionCount.max).toBe(14)
    })

    it('creates question plans for 12-14 questions', () => {
      const profile = profileReadingPassage(
        sportParagraphs.map(p => p.content).join('\n\n'),
        sportParagraphs,
      )
      for (const count of [12, 13, 14]) {
        const plan = createReadingQuestionPlan(count, 6.0, profile)
        expect(plan.totalQuestions).toBe(count)
      }
    })
  })

  describe('3. Task group count', () => {
    it('has 2-3 task groups configured', () => {
      expect(FULL_PASSAGE_SIMULATION.taskGroupCount.min).toBe(2)
      expect(FULL_PASSAGE_SIMULATION.taskGroupCount.max).toBe(3)
    })

    it('creates 2-3 task groups for 12-14 questions', () => {
      const profile = profileReadingPassage(
        sportParagraphs.map(p => p.content).join('\n\n'),
        sportParagraphs,
      )
      for (const count of [12, 13, 14]) {
        const plan = createReadingQuestionPlan(count, 6.0, profile)
        expect(plan.taskGroups.length).toBeGreaterThanOrEqual(2)
        expect(plan.taskGroups.length).toBeLessThanOrEqual(3)
      }
    })

    it('each task group has type and question count', () => {
      const profile = profileReadingPassage(
        sportParagraphs.map(p => p.content).join('\n\n'),
        sportParagraphs,
      )
      const plan = createReadingQuestionPlan(13, 6.0, profile)
      let totalGroupQuestions = 0
      for (const group of plan.taskGroups) {
        expect(group.type).toBeDefined()
        expect(group.questionCount).toBeGreaterThan(0)
        expect(group.skills.length).toBeGreaterThan(0)
        totalGroupQuestions += group.questionCount
      }
      expect(totalGroupQuestions).toBe(plan.totalQuestions)
    })
  })

  describe('4. Recommended time', () => {
    it('is 20 minutes', () => {
      expect(FULL_PASSAGE_SIMULATION.recommendedMinutes).toBe(20)
    })
  })

  describe('5. Prompt builder', () => {
    it('generates full-passage-simulation prompt', () => {
      const { systemPrompt, userMessage } = buildFullPassageSimulationPrompt(13, 'sport', {
        targetBand: 6.0,
      })
      expect(systemPrompt).toContain('Full Passage Simulation')
      expect(systemPrompt).toContain('700')
      expect(systemPrompt).toContain('950')
      expect(systemPrompt).toContain('13')
      expect(userMessage).toContain('sport')
      expect(userMessage).toContain('Band 6')
    })

    it('includes abbreviated task type rules', () => {
      const { systemPrompt } = buildFullPassageSimulationPrompt(13, 'sport', { targetBand: 6.0 })
      expect(systemPrompt).toContain('TFNG')
      expect(systemPrompt).toContain('Completion')
      expect(systemPrompt).toContain('Matching')
      expect(systemPrompt).toContain('paraphrase')
    })

    it('includes skill distribution guidance', () => {
      const { systemPrompt } = buildFullPassageSimulationPrompt(13, 'sport', { targetBand: 6.0 })
      expect(systemPrompt).toContain('inference')
      expect(systemPrompt).toContain('paragraph-purpose')
      expect(systemPrompt).toContain('reference-tracking')
    })
  })

  describe('6. Direct retrieval ratio', () => {
    it('stays below 40% for 13-question plan', () => {
      const profile = profileReadingPassage(
        sportParagraphs.map(p => p.content).join('\n\n'),
        sportParagraphs,
      )
      const plan = createReadingQuestionPlan(13, 6.0, profile)
      const ratio = estimateDirectRetrievalRatio(plan.requiredSkills)
      expect(ratio).toBeLessThanOrEqual(plan.maximumDirectRetrievalRatio)
    })
  })

  describe('7. Passage profiling', () => {
    it('profiles sport passage with paragraph functions', () => {
      const profile = profileReadingPassage(
        sportParagraphs.map(p => p.content).join('\n\n'),
        sportParagraphs,
      )
      expect(profile.paragraphCount).toBe(sportParagraphs.length)
      expect(profile.paragraphFunctions.length).toBe(sportParagraphs.length)
      expect(profile.wordCount).toBeGreaterThan(200)
    })
  })

  describe('8. Question difficulty estimation', () => {
    it('estimates bands for different skill types', () => {
      const passage = sportParagraphs.map(p => p.content).join('\n\n')
      const detail = estimateQuestionDifficulty({ skill: 'specific-detail' }, passage)
      const inference = estimateQuestionDifficulty({ skill: 'inference' }, passage)
      const synthesis = estimateQuestionDifficulty({ skill: 'cross-paragraph-synthesis' }, passage)
      expect(detail.estimatedBand).toBeLessThan(inference.estimatedBand)
      expect(inference.estimatedBand).toBeLessThanOrEqual(synthesis.estimatedBand)
    })
  })

  describe('9. Question plan spans paragraph skills', () => {
    it('selects target paragraphs spanning the passage', () => {
      const profile = profileReadingPassage(
        sportParagraphs.map(p => p.content).join('\n\n'),
        sportParagraphs,
      )
      const plan = createReadingQuestionPlan(13, 6.0, profile)
      expect(plan.requiredSkills.length).toBeGreaterThanOrEqual(6)
    })
  })
})
