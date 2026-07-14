import type { TutorAIClient } from '../../ai/tutor-ai-client'
import type { VocabularyExplanationRequest, VocabularyExplanationResult, VocabularyTutorModule, VocabularyExerciseRequest, VocabularyExerciseResult } from './vocabulary-coach'

function buildVocabularyExplanationSystemPrompt(): string {
  return `You are an experienced IELTS vocabulary tutor. Explain the word in detail.

Return a JSON object with these fields:
- word: string
- meaning: string
- pronunciation: string
- partOfSpeech: string
- wordFamily: array of strings
- collocations: array of strings
- cefrLevel: string (A1-C2)
- ieltsUsage: string
- contextualExamples: array of strings
- synonyms: array of strings
- antonyms: array of strings`
}

export class VocabularyTutorModuleImpl implements VocabularyTutorModule {
  constructor(private aiClient?: TutorAIClient) {}

  async explainWord(request: VocabularyExplanationRequest): Promise<VocabularyExplanationResult> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: buildVocabularyExplanationSystemPrompt(),
          userMessage: `Word: ${request.word}${request.context ? `\nContext: ${request.context}` : ''}\n\nProvide a detailed IELTS-focused explanation.`,
          schema: {} as any,
          temperature: 0.3,
          maxTokens: 1000,
        })
        if (result.success && result.data) {
          return result.data as unknown as VocabularyExplanationResult
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/vocabulary/vocabulary-coach-impl.ts error:', error);
 /* fall through */ }
    }
    return this.offlineExplanation(request)
  }

  private offlineExplanation(request: VocabularyExplanationRequest): VocabularyExplanationResult {
    const word = request.word
    const isLong = word.length > 8
    const hasCommonSuffix = word.endsWith('tion') || word.endsWith('ment') || word.endsWith('ness') || word.endsWith('ity')
    const partOfSpeech = isLong ? 'noun' : word.endsWith('ly') ? 'adverb' : word.endsWith('ing') ? 'verb' : 'adjective'

    return {
      word,
      meaning: `"${word}" — ${
        request.context ? `In the context "${request.context.slice(0, 80)}", this word refers to a specific concept.` : 'Look up this word in a dictionary for its precise meaning and usage in IELTS contexts.'
      }`,
      pronunciation: `/${word.toLowerCase().replace(/[^a-z]/g, '')}/ (focus on syllable stress: ${word.slice(0, Math.ceil(word.length / 2))} • ${word.slice(Math.ceil(word.length / 2))})`,
      partOfSpeech,
      wordFamily: [word, `${word}s`, `${word}ing`, `${word}ed`],
      collocations: [`${partOfSpeech === 'verb' ? 'to' : 'a/an'} ${word}`, `${word} of`, `${word} in`],
      cefrLevel: isLong && !commonWords.includes(word.toLowerCase()) ? 'B2' : hasCommonSuffix ? 'B1' : 'A2',
      ieltsUsage: word.length > 6 ? `"${word}" is useful for IELTS ${word.length > 8 ? 'Writing and Speaking' : 'all sections'}. Practice using it in context.` : `"${word}" is a common English word. Consider learning more advanced synonyms for IELTS.`,
      contextualExamples: request.context
        ? [`In the given context: ${request.context.slice(0, 150)}`, `Try using "${word}" in your own sentences about ${getSuggestedTopic(word)}.`]
        : [`Example: The ${word} played an important role in the discussion.`, `Example: Understanding "${word}" is useful for IELTS ${getSuggestedTopic(word)} topics.`],
      synonyms: getDefaultSynonyms(word),
      antonyms: [],
    }
  }

  async generateExercises(_request: VocabularyExerciseRequest): Promise<VocabularyExerciseResult> {
    return { exercises: [] }
  }
}

function getSuggestedTopic(word: string): string {
  const topics: [string, string[]][] = [
    ['education', ['study', 'learn', 'teach', 'student', 'school', 'university', 'knowledge', 'skill']],
    ['environment', ['environment', 'climate', 'energy', 'pollution', 'sustainable', 'conservation', 'ecosystem']],
    ['technology', ['technology', 'digital', 'innovation', 'computer', 'internet', 'software', 'data']],
    ['health', ['health', 'medical', 'disease', 'treatment', 'nutrition', 'exercise', 'wellness']],
    ['travel', ['travel', 'tourism', 'destination', 'culture', 'abroad', 'journey', 'explore']],
  ]
  for (const [topic, keywords] of topics) {
    if (keywords.some(k => word.toLowerCase().includes(k))) return topic
  }
  return 'common IELTS topics'
}

function getDefaultSynonyms(word: string): string[] {
  const synonymsByLength = [
    ['important', 'significant', 'crucial', 'essential', 'vital'],
    ['good', 'beneficial', 'positive', 'favorable', 'advantageous'],
    ['bad', 'negative', 'harmful', 'damaging', 'detrimental'],
    ['big', 'large', 'substantial', 'considerable', 'significant'],
    ['small', 'minor', 'slight', 'limited', 'moderate'],
    ['show', 'demonstrate', 'illustrate', 'indicate', 'reveal'],
    ['get', 'obtain', 'acquire', 'achieve', 'attain'],
    ['use', 'utilize', 'employ', 'apply', 'leverage'],
  ]
  for (const [base, ..._syns] of synonymsByLength) {
    if (word.toLowerCase().includes(base)) return _syns
  }
  return ['consider', 'examine', 'analyze', 'evaluate'].filter(s => s !== word.toLowerCase())
}

const commonWords = ['the', 'and', 'that', 'have', 'this', 'with', 'they', 'from', 'which', 'their', 'about', 'would', 'there', 'could', 'should']
