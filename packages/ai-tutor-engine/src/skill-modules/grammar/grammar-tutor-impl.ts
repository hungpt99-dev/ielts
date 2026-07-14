import type { TutorAIClient } from '../../ai/tutor-ai-client'
import type { GrammarExplanationRequest, GrammarExplanationResult, GrammarTutorModule, GrammarExerciseRequest, GrammarExerciseResult } from './grammar-tutor'

const GRAMMAR_PATTERNS: Array<{ pattern: RegExp; category: string; rule: string; correction: (match: string) => string; examples: string[] }> = [
  { pattern: /\b(he|she|it) don\'t\b/gi, category: 'subject-verb-agreement', rule: 'Third person singular subjects (he/she/it) require "doesn\'t" not "don\'t".', correction: m => m.replace(/\bdon\'t\b/i, 'doesn\'t'), examples: ['He doesn\'t like coffee. (not "He don\'t")', 'She doesn\'t work here.'] },
  { pattern: /\b(they|we|i|you) doesn\'t\b/gi, category: 'subject-verb-agreement', rule: 'Plural subjects (they/we) and I/you require "don\'t" not "doesn\'t".', correction: m => m.replace(/\bdoesn\'t\b/i, 'don\'t'), examples: ['They don\'t understand. (not "They doesn\'t")', 'We don\'t have time.'] },
  { pattern: /\bmore better\b|\bmore bigger\b|\bmore worse\b/gi, category: 'comparatives', rule: 'Use "better", "worse", etc. without "more" for irregular comparatives. Use "more" + adjective for longer adjectives (e.g., more expensive).', correction: m => m.replace(/more\s+/gi, ''), examples: ['This is better. (not "more better")', 'This is more expensive. (correct use of "more")'] },
  { pattern: /\bthe most best\b|\bthe most worst\b/gi, category: 'superlatives', rule: 'Use "best", "worst" without "most" for irregular superlatives.', correction: m => m.replace(/the most /gi, 'the '), examples: ['This is the best. (not "the most best")', 'That was the worst experience.'] },
  { pattern: /\b(i|he|she|it|they|we) goes\b(?!\s+to)/gi, category: 'verb-form', rule: 'After "to" (infinitive), use the base form of the verb, not the third person -s form.', correction: m => m.replace(/\bgoes\b(?!\s+to)/i, 'go'), examples: ['I go to school. (not "I goes")', 'They go shopping. (not "They goes")'] },
  { pattern: /\byesterday.*(go|see|do|come)\b(?!\s*(ing|es|ed)\b)/gi, category: 'past-tense', rule: 'When referring to past time (yesterday, last week, ago), use the past tense form.', correction: m => m, examples: ['Yesterday I went to the park. (not "go")', 'Last week I saw a movie. (not "see")'] },
  { pattern: /\bin the (last|past) (year|month|week) .*(have|has)\b/gi, category: 'present-perfect', rule: 'Use present perfect (have/has + past participle) with "in the last/past [time period]".', correction: m => m, examples: ['In the last year, I have improved. (correct)', 'In the past month, she has studied hard. (correct)'] },
  { pattern: /\bif (i|he|she|it|they|we) (was|were)\b.*\b(would|could)\b/gi, category: 'conditionals', rule: 'In second conditional (unreal situations), use "if + past simple, would/could + base verb".', correction: m => m, examples: ['If I were rich, I would travel. (not "If I was")', 'If she studied more, she could pass. (correct)'] },
  { pattern: /\b(a )?(apple|hour|honest|heir|university|one|once)\b/gi, category: 'articles-a-an', rule: 'Use "an" before vowel sounds (even if the letter is a consonant). Use "a" before consonant sounds (even if the letter is a vowel).', correction: m => m.replace(/\ba (?=apple|hour|honest|heir)/i, 'an ').replace(/\ban (?=university|one|once)/i, 'a '), examples: ['An apple (not "a apple")', 'A university (not "an university")'] },
  { pattern: /\bmuch (people|students|books|cars|things|ideas)\b/gi, category: 'countable-uncountable', rule: 'Use "many" with countable nouns (people, students, books). Use "much" with uncountable nouns (information, water, advice).', correction: m => m.replace(/\bmuch\b/i, 'many'), examples: ['Many people (not "much people")', 'Much information (correct, uncountable)'] },
]

function buildGrammarExplanationSystemPrompt(): string {
  return `You are an experienced IELTS Grammar tutor. Explain the grammar error and help the student understand the correction.

Return a JSON object with these fields:
- error: string (the original error)
- category: string (grammar category like "subject-verb-agreement", "tense", "article", etc.)
- correction: string (the corrected version)
- rule: string (the grammar rule explanation)
- examples: array of strings (2-3 example sentences)
- practiceSentence: string (a sentence for the student to practice this rule)`
}

export class GrammarTutorModuleImpl implements GrammarTutorModule {
  constructor(private aiClient?: TutorAIClient) {}

  async explainError(request: GrammarExplanationRequest): Promise<GrammarExplanationResult> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: buildGrammarExplanationSystemPrompt(),
          userMessage: `Text: ${request.text}${request.error ? `\nError to focus on: ${request.error}` : ''}\n\nAnalyze the grammar error and provide a clear explanation.`,
          schema: {} as any,
          temperature: 0.3,
          maxTokens: 800,
        })
        if (result.success && result.data) {
          return result.data as unknown as GrammarExplanationResult
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/grammar/grammar-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    return this.offlineErrorExplanation(request)
  }

  private offlineErrorExplanation(request: GrammarExplanationRequest): GrammarExplanationResult {
    const text = request.text

    for (const pattern of GRAMMAR_PATTERNS) {
      const match = text.match(pattern.pattern)
      if (match) {
        const corrected = pattern.correction(match[0])
        return {
          error: match[0],
          category: pattern.category,
          correction: corrected !== match[0] ? text.replace(match[0], corrected) : `Correct usage: ${match[0]}`,
          rule: pattern.rule,
          examples: pattern.examples,
          practiceSentence: `Rewrite this sentence correctly: "${text}"`,
        }
      }
    }

    if (request.error) {
      return {
        error: request.error,
        category: 'general',
        correction: `Review "${request.error}" in the context of the sentence.`,
        rule: 'Check the grammar rule related to this specific error. Consider verb tense, subject-verb agreement, articles, prepositions, or word order.',
        examples: ['Review your grammar textbook for the specific rule.', 'Practice with similar sentences to reinforce the correct form.'],
        practiceSentence: `Correct this sentence: "${text}"`,
      }
    }

    return {
      error: text.slice(0, 50),
      category: 'general',
      correction: 'Review the sentence for common grammar issues: subject-verb agreement, verb tense consistency, article usage, preposition choice, and word order.',
      rule: 'Always check your sentences for these common grammar areas. Reading your work aloud can help identify errors.',
      examples: ['Check for subject-verb agreement: "He goes" (correct), "He go" (incorrect)', 'Check verb tense consistency throughout your writing.'],
      practiceSentence: `Identify and correct any grammar errors in: "${text}"`,
    }
  }

  async generateExercises(_request: GrammarExerciseRequest): Promise<GrammarExerciseResult> {
    return { exercises: [] }
  }
}
