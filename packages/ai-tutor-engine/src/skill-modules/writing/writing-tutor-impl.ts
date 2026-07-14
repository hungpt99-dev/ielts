import type { TutorAIClient } from '../../ai/tutor-ai-client'
import type { WritingFeedbackResult, WritingReviewRequest, WritingTutorModule, WritingTaskType, WritingExerciseRequest, WritingExerciseResult } from './writing-tutor'

function buildWritingReviewSystemPrompt(): string {
  return `You are an experienced IELTS Writing examiner. Evaluate the writing sample according to official IELTS rubric criteria.

Return a JSON object with these fields:
- estimatedBand: number (1-9)
- taskResponse: string (detailed feedback on task achievement/response)
- coherenceAndCohesion: string (feedback on organization and linking)
- lexicalResource: string (feedback on vocabulary use)
- grammarRangeAndAccuracy: string (feedback on grammar)
- improvedVersion: string (a rewritten version showing improvements)
- grammarIssues: array of {text: string, correction: string, explanation: string}
- vocabularySuggestions: array of {word: string, suggestion: string}
- overallFeedback: string (summary of strengths and areas to improve)`
}

function buildBrainstormSystemPrompt(): string {
  return 'You are an IELTS Writing tutor. Generate relevant ideas for the given essay topic. Return a JSON array of strings.'
}

function buildOutlineSystemPrompt(): string {
  return 'You are an IELTS Writing tutor. Create a clear essay outline for the given topic and task type. Return a JSON string with the complete outline.'
}

const DEFAULT_WRITING_PROMPTS: WritingExerciseResult[] = [
  { prompt: 'Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree?', instructions: 'Write at least 250 words. Plan your essay before writing.', tips: ['State your position clearly in the introduction', 'Use specific examples to support your arguments', 'Write a conclusion that summarizes your position'] },
  { prompt: 'In many countries, the amount of crime is increasing. What do you think are the main causes of crime? How can we deal with those causes?', instructions: 'Write at least 250 words. Address both parts of the question.', tips: ['Discuss multiple causes', 'Provide specific solutions', 'Use topic-specific vocabulary'] },
  { prompt: 'Describe a chart showing the proportion of energy produced from different sources in a country over a period.', instructions: 'Write at least 150 words. Summarize the main trends.', tips: ['Start with an overview sentence', 'Compare key data points', 'Use appropriate vocabulary for describing trends'] },
  { prompt: 'Some people think that governments should spend more money on railways rather than roads. Others believe the opposite. Discuss both views and give your own opinion.', instructions: 'Write at least 250 words. Discuss both perspectives.', tips: ['Allocate equal paragraphs to each view', 'Use linking words to compare ideas', 'Give your opinion in the conclusion'] },
  { prompt: 'The charts below show the percentage of water used for different purposes in six countries. Summarize the information.', instructions: 'Write at least 150 words. Select and report key features.', tips: ['Identify the main pattern', 'Make comparisons where relevant', 'Avoid listing every data point'] },
]

const DEFAULT_BRAINSTORM_RESULTS: Record<string, string[]> = {
  environment: ['Deforestation leads to loss of biodiversity', 'Renewable energy reduces carbon emissions', 'Individual actions collectively make a difference', 'Government policies are essential for large-scale change', 'Economic growth and environmental protection can coexist'],
  education: ['Education is the foundation of economic development', 'Technology has transformed access to learning', 'Lifelong learning is increasingly important', 'Quality education reduces social inequality', 'Practical skills are as important as academic knowledge'],
  technology: ['Technology has changed how we communicate and work', 'Artificial intelligence creates both opportunities and challenges', 'Digital divide remains a significant concern', 'Social media affects mental health and social relationships', 'Automation will transform the job market'],
}

export class WritingTutorModuleImpl implements WritingTutorModule {
  constructor(private aiClient?: TutorAIClient) {}

  async reviewWriting(request: WritingReviewRequest): Promise<WritingFeedbackResult> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: buildWritingReviewSystemPrompt(),
          userMessage: `Task type: ${request.taskType}\nExam type: ${request.examType}\nTopic: ${request.topic}\nTarget band: ${request.targetBand}\n\nWriting sample:\n${request.text}`,
          schema: {} as any,
          temperature: 0.3,
          maxTokens: 2000,
        })
        if (result.success && result.data) {
          return result.data as unknown as WritingFeedbackResult
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/writing/writing-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    return this.offlineWritingReview(request)
  }

  private offlineWritingReview(request: WritingReviewRequest): WritingFeedbackResult {
    const wordCount = request.text.split(/\s+/).length
    const estimatedBand = wordCount < 150 ? 4 : wordCount < 250 ? 5 : 6
    return {
      estimatedBand,
      taskResponse: wordCount < 150 ? 'Your response appears incomplete. Aim for at least 150 words for Task 1 or 250 words for Task 2.' : 'Your response addresses the topic. Consider developing your main points with more specific examples and evidence.',
      coherenceAndCohesion: 'Review your paragraph structure. Each paragraph should have a clear topic sentence and supporting details. Use linking words to connect ideas.',
      lexicalResource: 'Try to use a wider range of vocabulary relevant to the topic. Avoid repeating the same words and phrases. Use synonyms and topic-specific terms.',
      grammarRangeAndAccuracy: 'Watch for subject-verb agreement and verb tense consistency. Vary your sentence structures by using a mix of simple, compound, and complex sentences.',
      improvedVersion: `[Improved version would be provided with AI. Here's a suggestion: review your essay focusing on: (1) clear thesis statement, (2) topic sentences for each paragraph, (3) specific examples, (4) varied vocabulary, (5) grammatical accuracy.]`,
      grammarIssues: [],
      vocabularySuggestions: [],
      overallFeedback: `Your essay contains approximately ${wordCount} words. Focus on developing your ideas more fully and using a wider range of vocabulary and sentence structures.`,
    }
  }

  async brainstormIdeas(topic: string, _taskType: WritingTaskType, _language?: string): Promise<string[]> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: buildBrainstormSystemPrompt(),
          userMessage: `Topic: ${topic}\nTask type: ${_taskType}\nGenerate 5-8 relevant ideas or arguments.`,
          schema: {} as any,
          temperature: 0.6,
          maxTokens: 1000,
        })
        if (result.success && result.data) {
          const ideas = Array.isArray(result.data) ? result.data : (result.data as any).ideas ?? []
          if (ideas.length > 0) return ideas.map(String)
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/writing/writing-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    const lower = topic.toLowerCase()
    for (const [key, ideas] of Object.entries(DEFAULT_BRAINSTORM_RESULTS)) {
      if (lower.includes(key)) return ideas
    }
    return [
      'Consider the main causes and effects related to this topic',
      'Think about different perspectives (individual, societal, governmental)',
      'Consider short-term and long-term implications',
      'Think about advantages and disadvantages',
      'Consider how this topic connects to broader IELTS themes',
    ]
  }

  async generateOutline(topic: string, _taskType: WritingTaskType, _language?: string): Promise<string> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: buildOutlineSystemPrompt(),
          userMessage: `Topic: ${topic}\nTask type: ${_taskType}\nCreate a detailed essay outline.`,
          schema: {} as any,
          temperature: 0.5,
          maxTokens: 1000,
        })
        if (result.success && result.data) {
          return String(result.data)
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/writing/writing-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    return `Introduction:
- Hook: General statement about the topic
- Context: Why this topic is relevant
- Thesis: Your main argument

Body Paragraph 1:
- Topic sentence: First main point
- Supporting details and examples
- Link back to thesis

Body Paragraph 2:
- Topic sentence: Second main point
- Supporting details and examples
- Link back to thesis

Conclusion:
- Restate thesis in different words
- Summarize main points
- Final thought or recommendation`
  }

  async improveThesis(thesis: string, _topic: string, _language?: string): Promise<string> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: 'You are an IELTS Writing tutor. Improve the given thesis statement to make it clearer and more impactful. Return a JSON string with the improved thesis.',
          userMessage: `Original thesis: "${thesis}"\nTopic: ${_topic}\n\nProvide an improved version.`,
          schema: {} as any,
          temperature: 0.4,
          maxTokens: 300,
        })
        if (result.success && result.data) return String(result.data)
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/writing/writing-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    if (!thesis.includes('because') && !thesis.includes('due to')) {
      return `${thesis.trimEnd().replace(/[.!?]$/, '')} because this approach addresses both immediate concerns and long-term sustainability.`
    }
    return thesis
  }

  async checkParagraphStructure(paragraph: string, _language?: string): Promise<string> {
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length < 2) return 'This paragraph is too short. Aim for 3-5 sentences including a topic sentence, supporting details, and a concluding or linking sentence.'
    if (sentences.length > 7) return 'This paragraph is very long. Consider breaking it into two or more paragraphs, each focused on one main idea.'
    return 'Paragraph structure looks reasonable. Ensure your first sentence is a clear topic sentence and your final sentence connects to the next paragraph or concludes the point.'
  }

  async generateExercise(_request: WritingExerciseRequest): Promise<WritingExerciseResult> {
    const index = Math.abs(hashCode(_request.topic)) % DEFAULT_WRITING_PROMPTS.length
    return DEFAULT_WRITING_PROMPTS[index]
  }
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
