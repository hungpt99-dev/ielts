import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AppSettings } from '../../../models'

const mockId = 'mock-uuid-abc-123'
vi.stubGlobal('crypto', {
  randomUUID: () => mockId,
})

const mockCallAI = vi.hoisted(() => vi.fn<(...args: any[]) => Promise<{ content: string | null; error: string | null }>>())

const mockSettings = vi.hoisted(() => ({
  value: {
    targetBand: 7.0,
    currentBand: 5.5,
    examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    dailyStudyMinutes: 60,
    weakSkills: ['Writing', 'Speaking'],
    preferredTopics: ['Environment', 'Education'],
    studyReminder: 'Time to study!',
    studyGoal: 'academic' as const,
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'] as ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[],
    aiApiKey: 'sk-test-key',
    aiProvider: 'openai' as const,
    aiEndpoint: '',
    aiModel: 'gpt-4o-mini',
    darkMode: false,
    aiEnabled: true,
  },
}))

vi.mock('@ielts/ai', () => ({
  callAI: mockCallAI,
}))

vi.mock('../../../services/storage/SettingsStorage', () => ({
  loadAppSettings: vi.fn(() => mockSettings.value),
}))

let taskIdCounter = 0
vi.mock('../../../services/storage/Database', () => ({
  DatabaseService: {
    getAll: vi.fn(() => Promise.resolve([])),
    get: vi.fn(),
    update: vi.fn(),
    addTask: vi.fn((item: any) => Promise.resolve({ ...item, id: `mock-task-${++taskIdCounter}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
    remove: vi.fn(),
    add: vi.fn(),
  },
}))

function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    targetBand: 7.0,
    currentBand: 5.5,
    examDate: '2026-09-15',
    dailyStudyMinutes: 60,
    weakSkills: ['Writing', 'Speaking'],
    preferredTopics: ['Environment', 'Education'],
    nativeLanguage: '',
    studyReminder: 'Time to study!',
    studyGoal: 'academic' as const,
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'],
    aiApiKey: 'sk-test-key',
    aiProvider: 'openai' as const,
    aiBaseUrl: '',
    aiEndpoint: '',
    aiModel: 'gpt-4o-mini',
    darkMode: false,
    aiEnabled: true,
    ...overrides,
  }
}

function makeValidAiResponse(): string {
  return JSON.stringify({
    phases: [
      {
        name: 'Foundation Building',
        description: 'Build essential vocabulary and grammar',
        order: 0,
        targetRange: 'Band 5.0-6.0',
        weeks: [
          {
            weekNumber: 1,
            label: 'Week 1',
            focus: 'Vocabulary Fundamentals',
            goal: 'Master the basics of vocabulary',
            days: [
              {
                dayNumber: 1,
                skillFocus: 'Vocabulary',
                objective: 'Learn 10 new topic-specific words',
                task: { title: 'Learn vocabulary', description: 'Study 10 new words', estimatedMinutes: 20 },
              },
              {
                dayNumber: 2,
                skillFocus: 'Reading',
                objective: 'Practice skimming for main ideas',
                task: { title: 'Reading practice', description: 'Skim a passage', estimatedMinutes: 25 },
              },
            ],
          },
        ],
      },
    ],
  })
}

// ================================================================
// aiPlanPrompts.ts
// ================================================================
describe('aiPlanPrompts', () => {
  describe('extractAiPlanInput', () => {
    it('should extract all fields from AppSettings', async () => {
      const { extractAiPlanInput } = await import('../aiPlanPrompts')
      const settings = makeSettings()
      const input = extractAiPlanInput(settings)

      expect(input.targetBand).toBe(7.0)
      expect(input.currentBand).toBe(5.5)
      expect(input.bandGap).toBe(1.5)
      expect(input.examDate).toBe('2026-09-15')
      expect(input.examCountdownDays).toBeGreaterThan(0)
      expect(input.dailyStudyMinutes).toBe(60)
      expect(input.weakSkills).toEqual(['Writing', 'Speaking'])
      expect(input.preferredTopics).toEqual(['Environment', 'Education'])
      expect(input.studyGoal).toBe('academic')
      expect(input.preferredSchedule).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
      expect(input.studyStreak).toBe(0)
      expect(input.lastStudyDate).toBeNull()
    })

    it('should use default weak skills when settings have none', async () => {
      const { extractAiPlanInput } = await import('../aiPlanPrompts')
      const settings = makeSettings({ weakSkills: [] })
      const input = extractAiPlanInput(settings)

      expect(input.weakSkills).toEqual([
        'reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar',
      ])
    })

    it('should set examCountdownDays to null when no exam date', async () => {
      const { extractAiPlanInput } = await import('../aiPlanPrompts')
      const settings = makeSettings({ examDate: '' })
      const input = extractAiPlanInput(settings)

      expect(input.examDate).toBeNull()
      expect(input.examCountdownDays).toBeNull()
    })

    it('should set bandGap to 0 when target <= current', async () => {
      const { extractAiPlanInput } = await import('../aiPlanPrompts')
      const settings = makeSettings({ targetBand: 6.0, currentBand: 7.0 })
      const input = extractAiPlanInput(settings)

      expect(input.bandGap).toBe(0)
    })
  })

  describe('enrichWithLearningData', () => {
    it('should override studyStreak and lastStudyDate', async () => {
      const { extractAiPlanInput, enrichWithLearningData } = await import('../aiPlanPrompts')
      const input = extractAiPlanInput(makeSettings())
      const enriched = enrichWithLearningData(input, { studyStreak: 5, lastStudyDate: '2026-07-01' })

      expect(enriched.studyStreak).toBe(5)
      expect(enriched.lastStudyDate).toBe('2026-07-01')
      expect(enriched.targetBand).toBe(7.0)
    })

    it('should handle optional extras being undefined', async () => {
      const { extractAiPlanInput, enrichWithLearningData } = await import('../aiPlanPrompts')
      const input = extractAiPlanInput(makeSettings())
      const enriched = enrichWithLearningData(input, { studyStreak: 0, lastStudyDate: null })

      expect(enriched.studyStreak).toBe(0)
      expect(enriched.lastStudyDate).toBeNull()
    })
  })

  describe('buildPlanSystemPrompt', () => {
    it('should return the system prompt string', async () => {
      const { buildPlanSystemPrompt } = await import('../aiPlanPrompts')
      const prompt = buildPlanSystemPrompt()

      expect(prompt).toContain('expert IELTS study plan advisor')
      expect(prompt).toContain('valid JSON')
    })
  })

  describe('buildPlanUserPrompt', () => {
    it('should include all learner profile fields', async () => {
      const { extractAiPlanInput, buildPlanUserPrompt } = await import('../aiPlanPrompts')
      const input = extractAiPlanInput(makeSettings())
      const prompt = buildPlanUserPrompt(input)

      expect(prompt).toContain('Target Band: 7')
      expect(prompt).toContain('Current Band: 5.5')
      expect(prompt).toContain('Band Gap: 1.5')
      expect(prompt).toContain('Academic')
      expect(prompt).toContain('60 minutes')
      expect(prompt).toContain('Exam Date: 2026-09-15')
      expect(prompt).toContain('Writing')
      expect(prompt).toContain('Speaking')
    })

    it('should include weak areas section', async () => {
      const { extractAiPlanInput, buildPlanUserPrompt } = await import('../aiPlanPrompts')
      const input = extractAiPlanInput(makeSettings())
      const prompt = buildPlanUserPrompt(input)

      expect(prompt).toContain('Weak Areas')
      expect(prompt).toContain('Writing')
      expect(prompt).toContain('Speaking')
    })

    it('should include preferred topics when available', async () => {
      const { extractAiPlanInput, buildPlanUserPrompt } = await import('../aiPlanPrompts')
      const input = extractAiPlanInput(makeSettings())
      const prompt = buildPlanUserPrompt(input)

      expect(prompt).toContain('Environment')
      expect(prompt).toContain('Education')
    })

    it('should mention no exam date when not set', async () => {
      const { extractAiPlanInput, buildPlanUserPrompt } = await import('../aiPlanPrompts')
      const settings = makeSettings({ examDate: '' })
      const input = extractAiPlanInput(settings)
      const prompt = buildPlanUserPrompt(input)

      expect(prompt).toContain('Not set')
      expect(prompt).toContain('comprehensive long-term plan')
    })

    it('should mention available study days when fewer than 7', async () => {
      const { extractAiPlanInput, buildPlanUserPrompt } = await import('../aiPlanPrompts')
      const settings = makeSettings({ preferredSchedule: ['mon', 'wed', 'fri'] })
      const input = extractAiPlanInput(settings)
      const prompt = buildPlanUserPrompt(input)

      expect(prompt).toContain('Available Study Days')
      expect(prompt).toContain('3 of 7 days')
    })

    it('should respect daily study minutes in the output', async () => {
      const { extractAiPlanInput, buildPlanUserPrompt } = await import('../aiPlanPrompts')
      const settings = makeSettings({ dailyStudyMinutes: 30 })
      const input = extractAiPlanInput(settings)
      const prompt = buildPlanUserPrompt(input)

      expect(prompt).toContain('30 minutes')
      expect(prompt).toContain('not exceed 30')
    })

    it('should include study streak when > 0', async () => {
      const { extractAiPlanInput, buildPlanUserPrompt, enrichWithLearningData } = await import('../aiPlanPrompts')
      const input = extractAiPlanInput(makeSettings())
      const enriched = enrichWithLearningData(input, { studyStreak: 10, lastStudyDate: '2026-07-01' })
      const prompt = buildPlanUserPrompt(enriched)

      expect(prompt).toContain('Study Streak: 10')
      expect(prompt).toContain('Last Study Date: 2026-07-01')
    })
  })
})

// ================================================================
// aiRoadmapGenerator.ts
// ================================================================
describe('aiRoadmapGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generatePlanWithAI', () => {
    it('should return fallback roadmap when AI is not configured', async () => {
      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const settings = makeSettings({ aiApiKey: '', aiEnabled: false })
      const result = await generatePlanWithAI(settings)

      expect(result.usedAi).toBe(false)
      expect(result.error).toContain('AI not configured')
      expect(result.roadmap).not.toBeNull()
      expect(result.roadmap!.phases.length).toBeGreaterThan(0)
      expect(result.rawResponse).toBeNull()
      expect(mockCallAI).not.toHaveBeenCalled()
    })

    it('should return fallback roadmap when AI returns an error', async () => {
      mockCallAI.mockResolvedValue({ content: null, error: 'Rate limit exceeded' })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.usedAi).toBe(false)
      expect(result.error).toContain('Rate limit exceeded')
      expect(result.roadmap).not.toBeNull()
      expect(result.rawResponse).toBeNull()
    })

    it('should return fallback roadmap when AI returns empty content', async () => {
      mockCallAI.mockResolvedValue({ content: null, error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.usedAi).toBe(false)
      expect(result.error).toContain('empty response')
      expect(result.roadmap).not.toBeNull()
    })

    it('should return fallback roadmap when AI response is unparseable', async () => {
      mockCallAI.mockResolvedValue({ content: 'not json at all', error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.usedAi).toBe(true)
      expect(result.error).toContain('Failed to parse')
      expect(result.roadmap).not.toBeNull()
      expect(result.rawResponse).toBe('not json at all')
    })

    it('should return roadmap from AI when response is valid', async () => {
      mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.usedAi).toBe(true)
      expect(result.error).toBeNull()
      expect(result.roadmap).not.toBeNull()
      expect(result.roadmap!.phases).toHaveLength(1)
      expect(result.roadmap!.phases[0].name).toBe('Foundation Building')
      expect(result.roadmap!.phases[0].weeks).toHaveLength(1)
      expect(result.roadmap!.phases[0].weeks[0].days).toHaveLength(2)
      expect(result.rawResponse).toBe(makeValidAiResponse())
    })

    it('should pass extras to enrichWithLearningData', async () => {
      mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const extras = { studyStreak: 7, lastStudyDate: '2026-07-01', completedTaskCount: 15, weakSkillAccuracy: { Writing: 0.6 } }
      await generatePlanWithAI(makeSettings(), extras)

      expect(mockCallAI).toHaveBeenCalledTimes(1)
      const userPrompt = mockCallAI.mock.calls[0][1]
      expect(userPrompt).toContain('Study Streak: 7')
      expect(userPrompt).toContain('Last Study Date: 2026-07-01')
    })

    it('should catch exceptions and return fallback roadmap', async () => {
      mockCallAI.mockRejectedValue(new Error('Network failure'))

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.usedAi).toBe(false)
      expect(result.error).toContain('Network failure')
      expect(result.roadmap).not.toBeNull()
      expect(result.rawResponse).toBeNull()
    })

    it('should call with correct AI options', async () => {
      mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      await generatePlanWithAI(makeSettings())

      const [, , , options] = mockCallAI.mock.calls[0]
      expect(options).toEqual({ temperature: 0.7, maxTokens: 4096 })
    })

    it('should generate fallback roadmap with phases when AI is off', async () => {
      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings({ aiApiKey: '', aiEnabled: false }))

      expect(result.roadmap).not.toBeNull()
      expect(result.roadmap!.phases.length).toBe(4)
      expect(result.roadmap!.totalTasks).toBeGreaterThan(0)
    })
  })

  describe('AI config / parse / conversion (tested through generatePlanWithAI)', () => {
    it('should not call AI when apiKey is empty', async () => {
      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      await generatePlanWithAI(makeSettings({ aiApiKey: '' }))
      expect(mockCallAI).not.toHaveBeenCalled()
    })

    it('should not call AI when aiEnabled is false', async () => {
      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      await generatePlanWithAI(makeSettings({ aiEnabled: false }))
      expect(mockCallAI).not.toHaveBeenCalled()
    })

    it('should call AI with custom endpoint when configured', async () => {
      mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })
      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      await generatePlanWithAI(makeSettings({ aiEndpoint: 'https://custom.ai/v1', aiModel: 'custom-model' }))

      expect(mockCallAI).toHaveBeenCalledTimes(1)
    })

    it('should parse JSON embedded in markdown code fence', async () => {
      const content = 'Here is your plan:\n\n```json\n' + makeValidAiResponse() + '\n```'
      mockCallAI.mockResolvedValue({ content, error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.usedAi).toBe(true)
      expect(result.error).toBeNull()
      expect(result.roadmap).not.toBeNull()
    })

    it('should detect invalid JSON and return fallback roadmap', async () => {
      mockCallAI.mockResolvedValue({ content: 'not json', error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.usedAi).toBe(true)
      expect(result.error).toContain('Failed to parse')
      expect(result.roadmap).not.toBeNull()
    })

    it('should detect JSON without phases and return fallback roadmap', async () => {
      mockCallAI.mockResolvedValue({ content: JSON.stringify({ foo: 'bar' }), error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.usedAi).toBe(true)
      expect(result.error).toContain('Failed to parse')
    })

    it('should convert AI result to roadmap with correct structure', async () => {
      mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.roadmap!.phases).toHaveLength(1)
      expect(result.roadmap!.phases[0].weeks).toHaveLength(1)
      expect(result.roadmap!.phases[0].weeks[0].days).toHaveLength(2)
      expect(result.roadmap!.overallProgress).toBe(0)
      expect(result.roadmap!.completedTasks).toBe(0)
    })

    it('should handle multiple phases with week offset', async () => {
      const multiPhase = {
        phases: [
          {
            name: 'Phase 1', description: 'First', order: 0, targetRange: 'Band 5-6',
            weeks: [
              { weekNumber: 1, label: 'Week 1', focus: 'A', goal: 'G', days: [
                { dayNumber: 1, skillFocus: 'Vocabulary', objective: 'O', task: { title: 'T', description: 'D', estimatedMinutes: 20 } },
              ]},
            ],
          },
          {
            name: 'Phase 2', description: 'Second', order: 1, targetRange: 'Band 6-7',
            weeks: [
              { weekNumber: 1, label: 'Week 1', focus: 'C', goal: 'G3', days: [
                { dayNumber: 1, skillFocus: 'Writing', objective: 'O3', task: { title: 'T3', description: 'D3', estimatedMinutes: 30 } },
              ]},
            ],
          },
        ],
      }
      mockCallAI.mockResolvedValue({ content: JSON.stringify(multiPhase), error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.roadmap!.phases).toHaveLength(2)
      expect(result.roadmap!.phases[0].weeks[0].weekNumber).toBe(1)
      expect(result.roadmap!.phases[1].weeks[0].weekNumber).toBe(2)
    })

    it('should store timestamps on generated roadmap', async () => {
      mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })

      const { generatePlanWithAI } = await import('../aiRoadmapGenerator')
      const result = await generatePlanWithAI(makeSettings())

      expect(result.roadmap!.generatedAt).toBeTruthy()
      expect(result.roadmap!.updatedAt).toBeTruthy()
    })
  })
})

// ================================================================
// Integration: roadmapService.ts × aiRoadmapGenerator.ts
// ================================================================
describe('roadmapService integration with AI generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should call generatePlanWithAI when ensureRoadmap has no existing roadmap', async () => {
    mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })

    const { ensureRoadmap } = await import('../roadmapService')
    const roadmap = await ensureRoadmap()

    expect(mockCallAI).toHaveBeenCalled()
    expect(roadmap).not.toBeNull()
    expect(roadmap.phases.length).toBeGreaterThan(0)
  })

  it('should fall back to static generation when AI generation throws', async () => {
    mockCallAI.mockRejectedValue(new Error('API unavailable'))

    const { ensureRoadmap } = await import('../roadmapService')
    const roadmap = await ensureRoadmap()

    expect(roadmap).not.toBeNull()
    expect(roadmap.phases.length).toBe(4)
    expect(roadmap.totalTasks).toBeGreaterThan(0)
  })

  it('should return cached roadmap if generated recently', async () => {
    mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })

    const { ensureRoadmap, saveRoadmap, generateRoadmap } = await import('../roadmapService')
    const staticRoadmap = await generateRoadmap(makeSettings(), [])
    saveRoadmap(staticRoadmap)

    const roadmap = await ensureRoadmap()

    expect(mockCallAI).not.toHaveBeenCalled()
    expect(roadmap).not.toBeNull()
  })

  it('should recalculate progress on existing roadmap', async () => {
    const { ensureRoadmap, saveRoadmap, generateRoadmap } = await import('../roadmapService')
    const staticRoadmap = await generateRoadmap(makeSettings(), [])
    staticRoadmap.updatedAt = new Date(Date.now() - 86400000).toISOString()
    saveRoadmap(staticRoadmap)

    const roadmap = await ensureRoadmap()

    expect(roadmap.updatedAt).toBeTruthy()
    expect(new Date(roadmap.updatedAt).getTime()).toBeGreaterThan(new Date(staticRoadmap.updatedAt).getTime())
  })

  it('should generate a static roadmap when AI is disabled', async () => {
    const { ensureRoadmap } = await import('../roadmapService')
    const roadmap = await ensureRoadmap()

    expect(roadmap.phases.length).toBe(4)
    expect(typeof roadmap.overallProgress).toBe('number')
    expect(typeof roadmap.currentPhaseIndex).toBe('number')
    expect(typeof roadmap.currentWeekIndex).toBe('number')
  })

  it('should save the roadmap to localStorage after AI generation', async () => {
    mockCallAI.mockResolvedValue({ content: makeValidAiResponse(), error: null })

    const { ensureRoadmap, loadRoadmap } = await import('../roadmapService')
    await ensureRoadmap()

    const saved = loadRoadmap()
    expect(saved).not.toBeNull()
    expect(saved!.phases).toHaveLength(1)
  })
})
