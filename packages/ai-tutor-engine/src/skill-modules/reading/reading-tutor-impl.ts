import type { TutorAIClient } from '../../ai/tutor-ai-client'
import type { ReadingExplanationRequest, ReadingExplanationResult, ReadingTutorModule } from './reading-tutor'

function buildReadingExplanationSystemPrompt(): string {
  return `You are an experienced IELTS Reading tutor. Explain the passage and help the student understand it better.

Return a JSON object with these fields:
- summary: string (brief summary of the passage)
- keyVocabulary: array of {word: string, definition: string, example: string}
- questionStrategy: string (strategy for answering the question type, if applicable)
- answerExplanation: string (explanation of the correct answer, if applicable)
- tips: array of strings (general reading tips)`
}

export class ReadingTutorModuleImpl implements ReadingTutorModule {
  constructor(private aiClient?: TutorAIClient) {}

  async explainPassage(request: ReadingExplanationRequest): Promise<ReadingExplanationResult> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: buildReadingExplanationSystemPrompt(),
          userMessage: `Passage:\n${request.passage.slice(0, 3000)}${request.question ? `\n\nQuestion: ${request.question}` : ''}${request.userAnswer ? `\n\nUser's answer: ${request.userAnswer}` : ''}${request.correctAnswer ? `\n\nCorrect answer: ${request.correctAnswer}` : ''}`,
          schema: {} as any,
          temperature: 0.3,
          maxTokens: 1500,
        })
        if (result.success && result.data) {
          return result.data as unknown as ReadingExplanationResult
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/reading/reading-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    return this.offlineExplanation(request)
  }

  private offlineExplanation(request: ReadingExplanationRequest): ReadingExplanationResult {
    const wordCount = request.passage.split(/\s+/).length
    const sentences = request.passage.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const firstSentence = sentences[0]?.trim() ?? ''

    const keyVocabulary = extractKeyVocabulary(request.passage)

    return {
      summary: firstSentence ? `This passage discusses ${firstSentence.slice(0, 100)}...` : 'Read the passage carefully to understand the main ideas and supporting details.',
      keyVocabulary: keyVocabulary.slice(0, 5),
      questionStrategy: request.question ? readStrategyForQuestion(request.question) : undefined,
      answerExplanation: request.correctAnswer ? `The correct answer is "${request.correctAnswer}". ${request.userAnswer && request.userAnswer !== request.correctAnswer ? `Your answer "${request.userAnswer}" was not correct. ` : ''}Look for specific evidence in the passage that supports this answer.` : undefined,
      tips: [
        `This passage is approximately ${wordCount} words. Skim first to understand the main ideas.`,
        'Read the questions before reading the passage in detail.',
        'Underline keywords in the questions and find synonyms in the passage.',
        'Pay attention to topic sentences at the beginning of each paragraph.',
        'Don\'t spend too much time on difficult questions — move on and come back if time allows.',
      ],
    }
  }

}

function readStrategyForQuestion(question: string): string {
  const lower = question.toLowerCase()
  if (lower.includes('true') || lower.includes('false') || lower.includes('not given')) {
    return 'For True/False/Not Given questions: Find keywords from the statement in the passage. If the meaning matches exactly, it\'s True. If the information contradicts, it\'s False. If the information is not mentioned, it\'s Not Given.'
  }
  if (lower.includes('heading') || lower.includes('match')) {
    return 'For matching headings questions: Read all headings first. Skim each paragraph to identify the main idea. Look for topic sentences and repeated keywords.'
  }
  if (lower.includes('complete') || lower.includes('gap') || lower.includes('fill')) {
    return 'For sentence completion questions: Identify the type of word needed (noun, verb, etc.). Find the location in the passage using context. Check that your answer fits grammatically.'
  }
  if (lower.includes('multiple') || lower.includes('choice')) {
    return 'For multiple choice questions: Read all options carefully. Eliminate obviously wrong answers. Find evidence in the passage to support your choice. Distractors often use similar words but different meaning.'
  }
  return 'Read the question carefully. Identify the question type and apply the appropriate strategy. Look for evidence in the passage before answering.'
}

function extractKeyVocabulary(text: string): Array<{ word: string; definition: string; example: string }> {
  const words = text.split(/\s+/).filter(w => w.length > 6)
  const unique = [...new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')))]
    .filter(w => !commonWords.includes(w))
    .slice(0, 10)

  return unique.map(w => ({
    word: w,
    definition: `"${w}" is used in this context. Try to infer its meaning from the surrounding text.`,
    example: `Look at how "${w}" is used in the passage above.`,
  }))
}

const commonWords = ['however', 'therefore', 'although', 'because', 'through', 'between', 'without', 'throughout', 'another', 'different', 'important', 'significant', 'necessary', 'following', 'including', 'provided', 'regarding', 'according', 'particularly', 'specifically', 'usually', 'generally', 'currently', 'recently', 'previously', 'traditionally', 'typically', 'relatively', 'basically', 'essentially']
