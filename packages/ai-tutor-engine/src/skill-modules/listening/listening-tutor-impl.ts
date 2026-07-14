import type { TutorAIClient } from '../../ai/tutor-ai-client'
import type { ListeningExplanationRequest, ListeningExplanationResult, ListeningTutorModule, ListeningExerciseRequest, ListeningExerciseResult } from './listening-tutor'

function buildListeningExplanationSystemPrompt(): string {
  return `You are an experienced IELTS Listening tutor. Analyze the transcript and help the student understand it better.

Return a JSON object with these fields:
- summary: string
- keyVocabulary: array of {word: string, definition: string, example: string}
- distractorExplanation: string (explain any confusing parts or distractors, if applicable)
- tips: array of strings`
}

export class ListeningTutorModuleImpl implements ListeningTutorModule {
  constructor(private aiClient?: TutorAIClient) {}

  async explainTranscript(request: ListeningExplanationRequest): Promise<ListeningExplanationResult> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: buildListeningExplanationSystemPrompt(),
          userMessage: `Transcript:\n${request.transcript.slice(0, 3000)}${request.question ? `\n\nQuestion: ${request.question}` : ''}${request.userAnswer ? `\n\nUser's answer: ${request.userAnswer}` : ''}${request.correctAnswer ? `\n\nCorrect answer: ${request.correctAnswer}` : ''}`,
          schema: {} as any,
          temperature: 0.3,
          maxTokens: 1500,
        })
        if (result.success && result.data) {
          return result.data as unknown as ListeningExplanationResult
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/listening/listening-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    return this.offlineExplanation(request)
  }

  private offlineExplanation(request: ListeningExplanationRequest): ListeningExplanationResult {
    const sentences = request.transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)
    return {
      summary: sentences.length > 0 ? `The speaker discusses ${sentences[0]?.trim()?.slice(0, 100)}...` : 'Listen to this section carefully for key information.',
      keyVocabulary: [],
      distractorExplanation: request.correctAnswer && request.userAnswer && request.userAnswer !== request.correctAnswer
        ? `The correct answer was "${request.correctAnswer}". In listening tasks, be careful with: (1) numbers that sound similar (e.g., 15 vs 50), (2) negatives that change meaning, (3) speakers who correct themselves.`
        : undefined,
      tips: [
        'Read the questions before listening to know what information to focus on.',
        'Pay attention to transition words that signal important information (first, then, however, finally).',
        'Be careful with distractors — speakers may give incorrect information before correcting themselves.',
        'Practice recognizing different accents and speech patterns.',
        'If you miss an answer, move on and focus on the next question.',
      ],
    }
  }

  async generateExercises(_request: ListeningExerciseRequest): Promise<ListeningExerciseResult> {
    return { questions: [] }
  }
}
