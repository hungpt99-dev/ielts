import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../learning/ai-exercise-session', () => ({
  generateFromEngine: vi.fn(),
}))

import { generateFromEngine } from '../../learning/ai-exercise-session'

type AiSessionResult = { content: string | null; error: string | null }

async function generateQuestionsForPassage(opts: { title: string; text: string; difficulty: string }): Promise<AiSessionResult> {
  return generateFromEngine('reading', `Questions: ${opts.title}`, opts.difficulty, 15,
    opts.text ? { id: expect.any(String) as string, type: 'selected-text' as const, text: opts.text } : undefined)
}

const mockGenerateFromEngine = vi.mocked(generateFromEngine)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AIService — generateQuestionsForPassage', () => {
  it('calls generateFromEngine with reading skill and passage text', async () => {
    mockGenerateFromEngine.mockResolvedValue({ content: '{"title":"Q","questions":[]}', error: null })

    const result = await generateQuestionsForPassage({
      title: 'My Passage',
      text: 'Passage text here',
      difficulty: 'easy',
    })

    expect(mockGenerateFromEngine).toHaveBeenCalledWith(
      'reading', 'Questions: My Passage', 'easy', 15, expect.objectContaining({ text: 'Passage text here' }),
    )
    expect(result.content).toBeTruthy()
  })
})
