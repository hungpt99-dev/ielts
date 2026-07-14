import type { TutorAIClient } from '../../ai/tutor-ai-client'
import type { SpeakingFeedbackResult, SpeakingReviewRequest, SpeakingTutorModule, SpeakingPart, SpeakingQuestionRequest, SpeakingQuestionResult } from './speaking-tutor'

const PART_1_QUESTIONS: Array<{ question: string; topic: string }> = [
  { question: 'Do you work or are you a student?', topic: 'work-study' },
  { question: 'What do you enjoy most about your job/studies?', topic: 'work-study' },
  { question: 'Do you live in a house or an apartment?', topic: 'living' },
  { question: 'What do you like about your home?', topic: 'living' },
  { question: 'Do you like to travel? Why or why not?', topic: 'travel' },
  { question: 'What kind of music do you enjoy?', topic: 'hobbies' },
  { question: 'How often do you read books?', topic: 'hobbies' },
  { question: 'What is your favorite time of day?', topic: 'daily-routine' },
  { question: 'Do you prefer eating at home or eating out?', topic: 'food' },
  { question: 'What do you usually do on weekends?', topic: 'free-time' },
  { question: 'Do you like watching movies? What type?', topic: 'entertainment' },
  { question: 'Have you recently learned something new?', topic: 'learning' },
]

const PART_2_CUE_CARDS: Array<{ topic: string; cueCard: string; followUpPoints: string[] }> = [
  { topic: 'person', cueCard: 'Describe a person who has influenced you. You should say: who this person is, how you know them, what qualities they have, and explain why they have influenced you.', followUpPoints: ['Do you think it is important to have role models?', 'How do people influence each other in modern society?'] },
  { topic: 'place', cueCard: 'Describe a place you have visited that impressed you. You should say: where it is, when you visited it, what you saw and did there, and explain why it impressed you.', followUpPoints: ['Why do people like to visit new places?', 'How has tourism changed in recent years?'] },
  { topic: 'experience', cueCard: 'Describe a memorable event in your life. You should say: what the event was, when it happened, who was with you, and explain why it was memorable.', followUpPoints: ['Why do some memories stay with us longer?', 'How do celebrations differ across cultures?'] },
  { topic: 'object', cueCard: 'Describe an important object that you own. You should say: what it is, how you got it, why it is important to you, and explain how long you have had it.', followUpPoints: ['Why do people become attached to certain objects?', 'How has consumerism changed attitudes toward possessions?'] },
  { topic: 'skill', cueCard: 'Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you plan to learn it, and explain how it would benefit you.', followUpPoints: ['Is it better to learn a skill from a teacher or by yourself?', 'What skills are most valuable in today\'s world?'] },
  { topic: 'habit', cueCard: 'Describe a healthy habit you have. You should say: what the habit is, when you started it, how often you do it, and explain how it benefits your life.', followUpPoints: ['How can people develop better habits?', 'Do you think governments should promote healthy lifestyles?'] },
]

const PART_3_QUESTIONS: Array<{ question: string; followUp?: string }> = [
  { question: 'How has technology changed the way people communicate?', followUp: 'Do you think these changes are mostly positive or negative?' },
  { question: 'What role should governments play in protecting the environment?', followUp: 'Can individual actions really make a difference?' },
  { question: 'Why is education important for a country\'s development?', followUp: 'How should education systems adapt to the future?' },
  { question: 'How do cultural traditions change over time?', followUp: 'Is it important to preserve traditional customs?' },
  { question: 'What factors contribute to a person\'s career success?', followUp: 'Has the definition of success changed in recent years?' },
  { question: 'How does globalization affect local cultures?', followUp: 'Can globalization and cultural preservation coexist?' },
]

function buildSpeakingReviewSystemPrompt(): string {
  return `You are an experienced IELTS Speaking examiner. Evaluate the speaking response according to IELTS criteria.

Return a JSON object with these fields:
- estimatedBand: number (1-9)
- fluencyAndCoherence: string
- lexicalResource: string
- grammaticalRangeAndAccuracy: string
- pronunciationNotes: string
- overallFeedback: string
- improvements: array of strings`
}

export class SpeakingTutorModuleImpl implements SpeakingTutorModule {
  constructor(private aiClient?: TutorAIClient) {}

  async reviewSpeaking(request: SpeakingReviewRequest): Promise<SpeakingFeedbackResult> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: buildSpeakingReviewSystemPrompt(),
          userMessage: `Part: ${request.part}\nTopic: ${request.topic}\nTarget band: ${request.targetBand}\n\nResponse:\n${request.response}`,
          schema: {} as any,
          temperature: 0.3,
          maxTokens: 1500,
        })
        if (result.success && result.data) {
          return result.data as unknown as SpeakingFeedbackResult
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/speaking/speaking-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    return this.offlineSpeakingReview(request)
  }

  private offlineSpeakingReview(request: SpeakingReviewRequest): SpeakingFeedbackResult {
    const wordCount = request.response.split(/\s+/).length
    const estimatedBand = wordCount < 30 ? 4 : wordCount < 60 ? 5 : wordCount < 100 ? 6 : 6.5

    const improvements: string[] = []
    if (wordCount < 50) improvements.push('Try to give longer, more detailed responses')
    improvements.push('Use a wider range of vocabulary, including less common words')
    improvements.push('Practice using complex sentence structures')
    improvements.push('Organize your ideas more clearly with signposting language')

    return {
      estimatedBand,
      fluencyAndCoherence: wordCount < 50 ? 'Your response was relatively short. Try to expand your answers with examples and explanations.' : 'Your response shows reasonable fluency. Work on using connecting words to link your ideas more smoothly.',
      lexicalResource: 'Try to incorporate a wider range of vocabulary, including topic-specific terms and idiomatic language where appropriate.',
      grammaticalRangeAndAccuracy: 'Use a mix of simple and complex sentence structures. Pay attention to verb tenses and subject-verb agreement.',
      pronunciationNotes: pronunciationNote(),
      overallFeedback: `Your response contained approximately ${wordCount} words. Focus on developing your ideas more fully and using more varied language.`,
      improvements,
    }
  }

  async generateQuestion(request: SpeakingQuestionRequest): Promise<SpeakingQuestionResult> {
    if (this.aiClient) {
      try {
        const result = await this.aiClient.generateStructured({
          systemPrompt: `You are an IELTS Speaking examiner. Create a Part ${request.part} speaking question. Return JSON: { "part": number, "topic": string, "question": string, "followUpQuestions": string[], "cueCard"?: string, "tips": string[] }`,
          userMessage: `Part: ${request.part}\nTopic: ${request.topic ?? 'general'}\nTarget band: ${request.targetBand}\n\nCreate an appropriate speaking question.`,
          schema: {} as any,
          temperature: 0.6,
          maxTokens: 800,
        })
        if (result.success && result.data) {
          const d = result.data as any
          return { part: d.part ?? request.part, topic: d.topic ?? request.topic ?? 'general', question: d.question ?? '', followUpQuestions: d.followUpQuestions ?? [], cueCard: d.cueCard, tips: d.tips ?? [] }
        }
      } catch (error) {
 console.error('packages/ai-tutor-engine/src/skill-modules/speaking/speaking-tutor-impl.ts error:', error);
 /* fall through */ }
    }
    return this.offlineQuestion(request.part, request.topic)
  }

  private offlineQuestion(part: SpeakingPart, topic?: string): SpeakingQuestionResult {
    if (part === 1) {
      const q = topic ? PART_1_QUESTIONS.find(q => q.topic === topic) ?? PART_1_QUESTIONS[Math.floor(Math.random() * PART_1_QUESTIONS.length)] : PART_1_QUESTIONS[Math.floor(Math.random() * PART_1_QUESTIONS.length)]
      return { part: 1, topic: q.topic, question: q.question, followUpQuestions: ['Can you tell me more about that?', 'Why do you feel that way?'], tips: ['Answer in 2-3 sentences', 'Give specific details', 'Show personality in your answers'] }
    }
    if (part === 2) {
      const card = topic ? PART_2_CUE_CARDS.find(c => c.topic === topic) ?? PART_2_CUE_CARDS[Math.floor(Math.random() * PART_2_CUE_CARDS.length)] : PART_2_CUE_CARDS[Math.floor(Math.random() * PART_2_CUE_CARDS.length)]
      return { part: 2, topic: card.topic, question: card.cueCard, followUpQuestions: card.followUpPoints, cueCard: card.cueCard, tips: ['Take 1 minute to prepare notes', 'Speak for 1-2 minutes', 'Cover all points on the cue card', 'Use a variety of tenses'] }
    }
    const q = PART_3_QUESTIONS[Math.floor(Math.random() * PART_3_QUESTIONS.length)]
    return { part: 3, topic: topic ?? 'general', question: q.question, followUpQuestions: q.followUp ? [q.followUp] : [], tips: ['Give balanced arguments', 'Use examples to support your views', 'Discuss different perspectives', 'Demonstrate critical thinking'] }
  }
}

function pronunciationNote(): string {
  const notes = [
    'Focus on word stress and sentence rhythm. Practice with recorded materials.',
    'Pay attention to the pronunciation of common vowel sounds that may not exist in your native language.',
    'Work on consonant clusters at the ends of words, which can affect clarity.',
    'Practice the th- sound, which is often challenging for many learners.',
    'Note: Pronunciation assessment is limited with text input. For full evaluation, record your speaking.',
  ]
  return notes[Math.floor(Math.random() * notes.length)]
}
