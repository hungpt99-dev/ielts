import { makeAIRequest } from '../../services/ai/AIService'

const LANGUAGE_INSTRUCTION: Record<string, string> = {
  english: 'Respond in English only.',
  vietnamese: 'Respond in Vietnamese only.',
  both: 'Respond in both English and Vietnamese, separated by "---". Do NOT translate the user\'s message unless asked.',
}

function getLanguageInstruction(language: 'english' | 'vietnamese' | 'both'): string {
  return LANGUAGE_INSTRUCTION[language] || LANGUAGE_INSTRUCTION.english
}

function buildContextString(externalContext?: string): string {
  if (externalContext && externalContext.length > 0) {
    return `\n\nAdditional context about the user:\n${externalContext}`
  }
  return ''
}

const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  'friendly-chat': `You are a friendly IELTS learning assistant. Chat naturally with the user in a warm, encouraging way. Gently connect topics to English learning. Keep your tone casual and supportive. After giving your main response, add a brief English correction tip if relevant (like a phrasal verb or grammar point). Make the user feel like they're talking to a supportive friend who happens to be great at English.`,
  'ielts-tutor': `You are an expert IELTS tutor. Answer the user's IELTS-related questions clearly and concisely. Provide study advice, explain English grammar and vocabulary, suggest IELTS strategies, and motivate the user. Keep responses practical, actionable, and in a friendly tutor tone. Under 150 words unless the user asks for detail.`,
  'speaking-partner': `You are an IELTS Speaking examiner and coach. Guide the user through IELTS Speaking practice — suggest they choose Part 1, 2, or 3. Generate authentic IELTS-style speaking questions. After they answer, provide constructive feedback on fluency, vocabulary, grammar, and coherence, with an estimated band score (1-9). Keep your tone encouraging and constructive.`,
  'writing-coach': `You are an IELTS Writing coach. Help with brainstorming ideas, creating essay outlines, improving thesis statements, checking paragraph structure, and providing full essay feedback with band estimates. Be specific and constructive.`,
  'grammar-teacher': `You are an IELTS grammar teacher. Explain grammar rules simply with clear examples. Create mini exercises to test understanding. Correct mistakes gently. Focus on grammar points relevant to IELTS (tenses, articles, conditionals, prepositions, sentence structure).`,
  'vocabulary-coach': `You are an IELTS vocabulary coach. Teach topic-based vocabulary with meanings, example sentences, collocations, and common usage notes. Suggest ways to remember new words. Create mini quizzes. Focus on IELTS-relevant topics.`,
  'reading-explainer': `You are an IELTS reading tutor. When the user shares text (an article, passage, or any English content), help them understand it better. Offer to: summarize, explain difficult parts, extract useful IELTS vocabulary, create comprehension questions, and connect the topic to IELTS. Be thorough and educational.`,
  'listening-coach': `You are an IELTS listening tutor. When the user shares a transcript or audio notes, help them work with it. Offer to: summarize, explain tricky phrases, extract key vocabulary, create listening comprehension questions, and connect to IELTS listening skills.`,
  'study-planner': `You are an IELTS study planner. Help create personalized study schedules. Ask about the user's target band, current band, exam date, available study time, and weak areas. Provide realistic, actionable weekly plans.`,
  'motivation-coach': `You are an IELTS motivation coach. Encourage the user warmly. Celebrate their progress, help them stay consistent, and reframe challenges as opportunities. Keep messages uplifting and personal.`,
  'socratic-tutor': `You are a Socratic tutor for IELTS. Do NOT give direct answers. Instead, guide the user with thoughtful questions so they discover answers themselves. Ask one question at a time. After they answer, ask a deeper follow-up question. After 3-4 rounds, synthesize what they've learned. Use the Socratic method to develop their critical thinking. Topic: IELTS preparation.`,
}

export async function aiGenerateResponse(params: {
  userMessage: string
  mode: string
  language: 'english' | 'vietnamese' | 'both'
  context?: string
}): Promise<string> {
  const { userMessage, mode, language, context } = params
  const modePrompt = MODE_SYSTEM_PROMPTS[mode] || MODE_SYSTEM_PROMPTS['ielts-tutor']
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `${modePrompt}\n\n${langInstruction}${buildContextString(context)}
  
IMPORTANT RULES:
- Keep responses under 200 words unless the user explicitly asks for details.
- Do NOT mention that you are an AI or that you don't have access to external data.
- Be encouraging and supportive.
- If the user's message is unclear, ask a clarifying question.
- Use simple, clear language appropriate for English learners.`

  const { content, error } = await makeAIRequest(systemPrompt, userMessage, {
    temperature: 0.7,
    maxTokens: 500,
  })

  if (content && !error) {
    return content
  }

  throw new Error(error || 'Failed to generate response')
}

export async function aiGenerateLesson(params: {
  topic: string
  type: 'grammar' | 'vocabulary'
  language: 'english' | 'vietnamese' | 'both'
}): Promise<{
  title: string
  explanation: string
  rules: string[]
  examples: string[]
  checkingQuestion: { question: string; options: string[]; correctAnswer: string; explanation: string }
  exercises: { question: string; options?: string[]; correctAnswer: string; explanation: string; type: string }[]
  summary: string
  nextTopic: string
  commonMistakes: { mistake: string; correction: string; note: string }[]
}> {
  const { topic, type, language } = params
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an expert IELTS ${type} teacher. Create a detailed lesson on the topic "${topic}".
${langInstruction}

Respond with valid JSON ONLY, no other text. Use this exact structure:
{
  "title": "Lesson title",
  "explanation": "Clear, simple explanation suitable for intermediate English learners",
  "rules": ["Rule 1", "Rule 2", "Rule 3", "Rule 4"],
  "examples": ["Example sentence 1", "Example sentence 2", "Example sentence 3", "Example sentence 4"],
  "checkingQuestion": {
    "question": "A question to check understanding",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct option text",
    "explanation": "Why this is correct"
  },
  "exercises": [
    {
      "type": "fill-blank | multiple-choice | rewrite | identify",
      "question": "Exercise question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct answer",
      "explanation": "Explanation"
    }
  ],
  "summary": "Brief summary of what was learned",
  "nextTopic": "Suggested next topic ID",
  "commonMistakes": [
    { "mistake": "Common mistake", "correction": "Correct version", "note": "Explanation note" }
  ]
}

Include 3-4 exercises. For multiple-choice, provide 4 options. For fill-blank, just provide the correct answer.`

  const { content, error } = await makeAIRequest(systemPrompt, `Create a ${type} lesson about "${topic}".`, {
    temperature: 0.7,
    maxTokens: 2000,
  })

  if (content && !error) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // fall through
    }
  }

  throw new Error(error || 'Failed to generate lesson')
}

export async function aiGenerateQuickExercises(type: 'grammar' | 'vocabulary', language: 'english' | 'vietnamese' | 'both'): Promise<{
  type: string
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
}[]> {
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS ${type} teacher. Generate 3 quick practice exercises.
${langInstruction}

Respond with valid JSON ONLY — an array of objects:
[
  {
    "type": "fill-blank | multiple-choice",
    "question": "The question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Correct answer",
    "explanation": "Brief explanation"
  }
]

For fill-blank, omit "options". For multiple-choice, provide 4 options.`

  const { content, error } = await makeAIRequest(systemPrompt, `Give me 3 quick ${type} exercises.`, {
    temperature: 0.7,
    maxTokens: 1000,
  })

  if (content && !error) {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // fall through
    }
  }

  throw new Error(error || 'Failed to generate exercises')
}

export async function aiEvaluateAnswer(params: {
  question: string
  correctAnswer: string
  userAnswer: string
  exerciseType: string
  lessonTopic: string
}): Promise<{ isCorrect: boolean; feedback: string; expected: string }> {
  const { question, correctAnswer, userAnswer, exerciseType, lessonTopic } = params

  const systemPrompt = `You are an IELTS tutor evaluating a student's answer.

Question: "${question}"
Expected correct answer: "${correctAnswer}"
Student's answer: "${userAnswer}"
Exercise type: ${exerciseType}
Lesson topic: ${lessonTopic}

Determine if the student's answer is correct (allow minor variations like different word forms or synonyms if they show understanding).
Respond with valid JSON ONLY:
{
  "isCorrect": true/false,
  "feedback": "Encouraging feedback explaining the result (1-3 sentences)",
  "expected": "The expected correct answer"
}`

  const { content, error } = await makeAIRequest(systemPrompt, 'Evaluate this answer.', {
    temperature: 0.3,
    maxTokens: 300,
  })

  if (content && !error) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // fall through
    }
  }

  return {
    isCorrect: userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
    feedback: error || 'Answer recorded.',
    expected: correctAnswer,
  }
}

export async function aiReviewMistakes(params: {
  patterns: { pattern: string; skill: string; examples: string[]; suggestion: string }[]
  limit?: number
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const { patterns, limit = 5, language } = params
  const langInstruction = getLanguageInstruction(language)

  if (patterns.length === 0) {
    return '📝 **Mistake Review**\n\nNo mistakes recorded yet. Keep practicing and I will track your common mistakes here! 💪'
  }

  const topPatterns = patterns.slice(0, limit)
  const patternText = topPatterns.map((p, i) =>
    `${i + 1}. "${p.pattern}" (${p.skill}) - Examples: ${p.examples.slice(0, 2).join('; ')} - Suggestion: ${p.suggestion}`
  ).join('\n')

  const systemPrompt = `You are an IELTS tutor reviewing a student's common mistakes.
${langInstruction}

Review these mistake patterns and provide encouraging, actionable feedback. Keep it under 200 words.

Mistakes:
${patternText}`

  const { content, error } = await makeAIRequest(systemPrompt, 'Review these mistakes and give feedback.', {
    temperature: 0.7,
    maxTokens: 400,
  })

  if (content && !error) {
    return content
  }

  return '📝 **Mistake Review**\n\nUnable to generate AI review at this moment. Please try again later.'
}

export async function aiGenerateExplanation(params: {
  content: string
  query: string
  analysis: { wordCount: number; sentenceCount: number; detectedTopic: string }
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const { content, query, analysis, language } = params
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS reading/listening tutor. The user has shared some content and is asking about a specific part.
${langInstruction}

Content (${analysis.wordCount} words, topic: ${analysis.detectedTopic}):
"""
${content.slice(0, 2000)}
"""

User query: "${query}"

Explain the meaning, usage, or context of what the user is asking about. Connect it to IELTS preparation where relevant. Keep it concise and helpful.`

  const { content: result, error } = await makeAIRequest(systemPrompt, query, {
    temperature: 0.7,
    maxTokens: 400,
  })

  if (result && !error) {
    return result
  }

  throw new Error(error || 'Failed to generate explanation')
}

export async function aiGenerateSocraticQuestion(params: {
  userMessage: string
  topic: string
  round: number
  previousQA?: { question: string; answer: string; type: string }[]
  language: 'english' | 'vietnamese' | 'both'
}): Promise<{
  question: string
  type: string
  hint?: string
  wrapUp?: string
  feedback?: string
}> {
  const { userMessage, topic, round, previousQA, language } = params
  const langInstruction = getLanguageInstruction(language)

  const historyText = previousQA && previousQA.length > 0
    ? `\nPrevious conversation:\n${previousQA.map(qa => `- Tutor: ${qa.question}\n- Student: ${qa.answer}`).join('\n')}`
    : ''

  const systemPrompt = `You are a Socratic tutor for IELTS preparation. Your goal is to guide the student through questions so they discover answers themselves.
${langInstruction}

Topic: ${topic}
Current round: ${round + 1} of 4
${historyText}

Rules:
- NEVER give direct answers. Always respond with a question.
- If round >= 4 (this is round ${round}), provide a wrap-up instead — summarize what the student learned.
- Keep questions thoughtful and engaging.
- If the student seems stuck, provide a brief hint.
- Adjust question difficulty based on the student's previous answers.

Respond with valid JSON ONLY:
- If not wrapping up: {"question": "Your Socratic question", "type": "define|justify|give-example|improve|challenge|clarify", "hint": "Optional brief hint"}
- If wrapping up (round >= 4): {"wrapUp": "Summary of what was learned with encouragement", "type": "wrap-up"}`

  const { content, error } = await makeAIRequest(systemPrompt, userMessage, {
    temperature: 0.7,
    maxTokens: 400,
  })

  if (content && !error) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // fall through
    }
  }

  return {
    question: "That's interesting! Can you tell me more about why you think that? What evidence or experience supports your view? 🤔",
    type: 'justify',
    hint: 'Think about what you already know on this topic.',
  }
}

export async function aiGenerateSummary(params: {
  text: string
  analysis: { wordCount: number; sentenceCount: number; detectedTopic: string }
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const { text, analysis, language } = params
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS tutor. Summarize the following content for an English learner.
${langInstruction}

Content (${analysis.wordCount} words, topic: ${analysis.detectedTopic}):
"""
${text.slice(0, 3000)}
"""

Provide:
1. A concise summary (3-5 sentences)
2. 3 key points or main ideas
3. Why this content is relevant for IELTS preparation

Keep the summary clear and easy to understand for an intermediate English learner.`

  const { content, error } = await makeAIRequest(systemPrompt, 'Summarize this content for IELTS learning.', {
    temperature: 0.5,
    maxTokens: 500,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate summary')
}

export async function aiGenerateVocabularyList(params: {
  text: string
  analysis: { wordCount: number; sentenceCount: number; detectedTopic: string }
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const { text, analysis, language } = params
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS vocabulary tutor. Extract useful vocabulary from the given content.
${langInstruction}

Content (${analysis.wordCount} words, topic: ${analysis.detectedTopic}):
"""
${text.slice(0, 3000)}
"""

Extract 5-8 useful IELTS vocabulary items. For each, provide:
- The word/phrase
- Meaning (simple English)
- Example from the content or a new IELTS-style example
- Why it's useful for IELTS

Format naturally as a friendly lesson. Group into "Topic-Specific Vocabulary" and "Advanced/Academic Words".`

  const { content, error } = await makeAIRequest(systemPrompt, 'Extract IELTS vocabulary from this content.', {
    temperature: 0.5,
    maxTokens: 600,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate vocabulary list')
}

export async function aiGenerateComprehensionQuestions(params: {
  text: string
  analysis: { wordCount: number; sentenceCount: number; detectedTopic: string }
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const { text, analysis, language } = params
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS tutor. Create comprehension questions based on the given content.
${langInstruction}

Content (${analysis.wordCount} words, topic: ${analysis.detectedTopic}):
"""
${text.slice(0, 3000)}
"""

Create 4-5 comprehension questions that test understanding. Include a mix of:
- Literal questions (facts directly stated)
- Inference questions (implied meaning)
- Vocabulary-in-context questions

Format each question clearly. After each question, provide a brief expected answer guide.`

  const { content, error } = await makeAIRequest(systemPrompt, 'Create comprehension questions from this content.', {
    temperature: 0.5,
    maxTokens: 600,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate comprehension questions')
}

export async function aiGenerateOpinionQuestions(params: {
  text: string
  analysis: { wordCount: number; sentenceCount: number; detectedTopic: string }
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const { text, analysis, language } = params
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS tutor. Create opinion/discussion questions based on the given content.
${langInstruction}

Content (${analysis.wordCount} words, topic: ${analysis.detectedTopic}):
"""
${text.slice(0, 3000)}
"""

Create 3-4 discussion questions that:
- Relate to the content topic
- Encourage the user to express and justify their opinion
- Are similar to IELTS Speaking Part 3 or Writing Task 2 questions
- Include a brief note on what a strong answer would include`

  const { content, error } = await makeAIRequest(systemPrompt, 'Create opinion questions from this content.', {
    temperature: 0.5,
    maxTokens: 500,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate opinion questions')
}

export async function aiGenerateExercises(params: {
  text: string
  analysis: { wordCount: number; sentenceCount: number; detectedTopic: string }
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const { text, analysis, language } = params
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS tutor. Create practice exercises based on the given content.
${langInstruction}

Content (${analysis.wordCount} words, topic: ${analysis.detectedTopic}):
"""
${text.slice(0, 3000)}
"""

Create 3-4 exercises. Use a mix of:
- Gap-fill (remove key words from sentences in the content)
- True/False/Not Given questions
- Synonym matching
- Sentence completion

Format clearly with instructions and provide answers at the end.`

  const { content, error } = await makeAIRequest(systemPrompt, 'Create exercises from this content.', {
    temperature: 0.5,
    maxTokens: 600,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate exercises')
}

export async function aiGenerateIeltsConnection(params: {
  text: string
  analysis: { wordCount: number; sentenceCount: number; detectedTopic: string }
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const { text, analysis, language } = params
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS tutor. Connect the given content to IELTS exam preparation.
${langInstruction}

Content (${analysis.wordCount} words, topic: ${analysis.detectedTopic}):
"""
${text.slice(0, 3000)}
"""

Explain:
1. How this topic might appear in IELTS (Speaking, Writing, Reading, Listening)
2. Key vocabulary from the content useful for IELTS
3. Potential essay or speaking questions related to this topic
4. Tips on how the user can use similar content for self-study

Keep it practical and actionable.`

  const { content, error } = await makeAIRequest(systemPrompt, 'Connect this content to IELTS preparation.', {
    temperature: 0.5,
    maxTokens: 500,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate IELTS connection')
}

export async function aiGenerateDailyCheckIn(params: {
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const langInstruction = getLanguageInstruction(params.language)

  const systemPrompt = `You are a friendly IELTS learning companion. Greet the user warmly for a daily check-in.
${langInstruction}

Ask how their study went yesterday and what they plan to focus on today. Be encouraging and personal. Keep it to 2-4 sentences.`

  const { content, error } = await makeAIRequest(systemPrompt, 'Daily check-in message.', {
    temperature: 0.7,
    maxTokens: 200,
  })

  if (content && !error) return content
  return "Hey friend! ☀️ Good to see you today! How did your study go yesterday? What are you planning to focus on today? Remember, every day of practice brings you closer to your IELTS goal! 💪"
}

export async function aiGenerateGentleCorrection(params: {
  userMessage: string
  language: 'english' | 'vietnamese' | 'both'
}): Promise<string> {
  const langInstruction = getLanguageInstruction(params.language)

  const systemPrompt = `You are a friendly English tutor. The user wrote a message that may contain minor English errors.
${langInstruction}

User message: "${params.userMessage}"

If there are 1-2 clear, fixable errors in the message, provide a gentle correction in this format:
💡 *Gentle correction:*
• "original" → **suggestion** — brief explanation

If there are no clear errors, respond with an empty string.
Keep corrections encouraging. Only correct genuine errors, not stylistic choices.
Do NOT correct if the message is very short (under 5 words).`

  const { content, error } = await makeAIRequest(systemPrompt, 'Check for English errors and correct gently.', {
    temperature: 0.3,
    maxTokens: 200,
  })

  if (content && !error && content.trim()) return '\n\n' + content.trim()
  return ''
}

export async function aiGetModeGreeting(mode: string, language: 'english' | 'vietnamese' | 'both'): Promise<string> {
  const langInstruction = getLanguageInstruction(language)
  const modeName = mode.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const systemPrompt = `You are an IELTS learning assistant. Generate a warm, friendly greeting for a user who just selected the "${modeName}" mode.
${langInstruction}

The greeting should:
- Welcome the user warmly
- Briefly describe what this mode does (${MODE_SYSTEM_PROMPTS[mode]?.slice(0, 100) || 'help with IELTS preparation'})
- Invite the user to ask a question or start practicing
- Be 2-4 sentences long

Keep it natural and encouraging. Do NOT use markdown formatting.`

  const { content, error } = await makeAIRequest(systemPrompt, `Generate a greeting for ${modeName} mode.`, {
    temperature: 0.7,
    maxTokens: 200,
  })

  if (content && !error) return content
  return `Hi! I'm your ${modeName} assistant. What would you like to learn today? 😊`
}

export async function aiGenerateBrainstormingIdeas(topic: string, language: 'english' | 'vietnamese' | 'both'): Promise<string> {
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS writing coach. Generate creative, well-structured brainstorming ideas for an IELTS essay about "${topic}".
${langInstruction}

Provide 3-4 distinct ideas/arguments. For each idea, include:
- The main point
- An explanation (2-3 sentences)
- A specific real-world example

Format as a natural lesson with clear sections. Make ideas suitable for IELTS Writing Task 2.`

  const { content, error } = await makeAIRequest(systemPrompt, `Brainstorm ideas about ${topic}.`, {
    temperature: 0.7,
    maxTokens: 600,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate brainstorming ideas')
}

export async function aiGenerateOutline(topic: string, taskType: 'task1' | 'task2', language: 'english' | 'vietnamese' | 'both'): Promise<string> {
  const langInstruction = getLanguageInstruction(language)
  const taskInstruction = taskType === 'task1'
    ? 'Task 1: Describe a chart/graph/table/map. Focus on main trends, comparisons, and data highlights without opinion.'
    : 'Task 2: Write a discursive essay. Present arguments, examples, and a clear position.'

  const systemPrompt = `You are an IELTS writing coach. Create a detailed essay outline for ${taskInstruction} on the topic "${topic}".
${langInstruction}

Include:
- A strong introduction with hook, context, and clear thesis statement
- 2-3 body paragraphs, each with a topic sentence, supporting points, and example suggestions
- A conclusion that summarizes and restates the thesis

Format clearly with section headers. Make the outline practical and easy to follow.`

  const { content, error } = await makeAIRequest(systemPrompt, `Create an outline for ${taskType} essay about ${topic}.`, {
    temperature: 0.7,
    maxTokens: 600,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate outline')
}

export async function aiImproveThesisStatement(thesis: string, topic: string, language: 'english' | 'vietnamese' | 'both'): Promise<string> {
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS writing coach. Help improve a thesis statement.
${langInstruction}

Topic: "${topic}"
Current thesis: "${thesis}"

Analyze the thesis and provide:
1. Specific feedback on clarity, position, and preview of arguments
2. An improved version with explanation of changes
3. Tips for writing strong thesis statements for IELTS

Be constructive and detailed.`

  const { content, error } = await makeAIRequest(systemPrompt, `Improve this thesis: ${thesis}`, {
    temperature: 0.5,
    maxTokens: 400,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to improve thesis')
}

export async function aiCheckParagraphStructure(paragraph: string, language: 'english' | 'vietnamese' | 'both'): Promise<string> {
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an IELTS writing coach. Analyze the paragraph structure.
${langInstruction}

Paragraph:
"""
${paragraph}
"""

Check for:
1. Clear topic sentence
2. Supporting details and examples
3. Cohesion and linking words
4. Appropriate length (60-100 words for Task 2 body paragraphs)
5. A concluding or linking sentence

Provide specific, actionable feedback. If the paragraph is well-structured, say so and suggest how to make it even better.`

  const { content, error } = await makeAIRequest(systemPrompt, 'Check paragraph structure.', {
    temperature: 0.5,
    maxTokens: 400,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to check paragraph')
}

export async function aiGenerateFullWritingFeedback(text: string, taskType: 'task1' | 'task2', topic: string, language: 'english' | 'vietnamese' | 'both'): Promise<string> {
  const langInstruction = getLanguageInstruction(language)
  const taskInstruction = taskType === 'task1'
    ? 'Task 1 (Academic): Describe visual information — charts, graphs, tables, maps.'
    : 'Task 2: Respond to an opinion, discussion, or problem-solution prompt with a well-structured essay.'

  const systemPrompt = `You are an expert IELTS writing examiner. Evaluate the following IELTS Writing ${taskInstruction}
${langInstruction}

Topic: "${topic}"
Essay:
"""
${text}
"""

Provide detailed feedback with:
1. Estimated band score (overall 1-9, with subscores for Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range)
2. Strengths (2-3 points)
3. Areas for improvement (2-3 points, specific and actionable)
4. Grammar and vocabulary issues with corrections
5. Suggestions for linking words and structure improvements
6. An improved version of key sentences or the full essay

Be constructive, specific, and encouraging. Format clearly with section headers.`

  const { content, error } = await makeAIRequest(systemPrompt, `Evaluate this ${taskType} writing about ${topic}.`, {
    temperature: 0.5,
    maxTokens: 1500,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate writing feedback')
}

export async function aiGenerateImprovedVersion(text: string, targetBand: number, language: 'english' | 'vietnamese' | 'both'): Promise<string> {
  const langInstruction = getLanguageInstruction(language)

  const systemPrompt = `You are an expert IELTS writing coach. Rewrite the following text to target IELTS Band ${targetBand}.
${langInstruction}

Original text:
"""
${text}
"""

Rewrite to achieve Band ${targetBand} by:
- Upgrading vocabulary (more precise, academic, and topic-specific words)
- Using varied sentence structures (complex sentences, relative clauses, conditionals)
- Improving coherence with appropriate linking words
- Maintaining the original meaning and argument

Provide:
1. The rewritten version
2. A brief explanation of key improvements made

Keep the same length and core message.`

  const { content, error } = await makeAIRequest(systemPrompt, `Rewrite to band ${targetBand}.`, {
    temperature: 0.5,
    maxTokens: 1000,
  })

  if (content && !error) return content
  throw new Error(error || 'Failed to generate improved version')
}

export async function aiGenerateProactiveMessage(context: {
  streak: number
  weakSkills: string[]
  examCountdownDays: number
  dueVocabularyCount: number
  mistakeCount: number
  lastStudyDaysAgo: number
  todayUnfinishedTasks: number
}, language: 'english' | 'vietnamese' | 'both'): Promise<string> {
  const langInstruction = getLanguageInstruction(language)

  const contextStr = [
    context.streak > 0 ? `${context.streak}-day study streak` : 'No current streak',
    context.weakSkills.length > 0 ? `Weak skills: ${context.weakSkills.join(', ')}` : '',
    context.examCountdownDays > 0 ? `Exam in ${context.examCountdownDays} days` : 'No exam set',
    context.dueVocabularyCount > 0 ? `${context.dueVocabularyCount} words due for review` : '',
    context.mistakeCount > 0 ? `${context.mistakeCount} unresolved mistakes` : '',
    context.lastStudyDaysAgo > 0 ? `Last study: ${context.lastStudyDaysAgo} days ago` : 'Studied today',
    context.todayUnfinishedTasks > 0 ? `${context.todayUnfinishedTasks} unfinished tasks today` : '',
  ].filter(Boolean).join('. ') || 'New user'

  const systemPrompt = `You are an IELTS tutor assistant generating a proactive message for a student.
${langInstruction}

Student context: ${contextStr}

Generate ONE short, personalized message (2-3 sentences) that:
- Is encouraging and supportive
- Suggests a specific action the student can take
- Relates to their current situation (streak, weak areas, exam, etc.)
- Is timely and relevant

Keep it natural and conversational. Do NOT mention you are an AI. Do NOT use markdown.`

  const { content, error } = await makeAIRequest(systemPrompt, 'Generate a proactive coaching message.', {
    temperature: 0.7,
    maxTokens: 200,
  })

  if (content && !error) return content
  return "Keep up your great work! Every study session brings you closer to your IELTS goal. 🎯"
}

export async function aiGenerateStudyContent(params: {
  title: string
  skill: string
  difficulty: string
  userContext?: {
    targetBand?: number
    currentBand?: number
    weakSkills?: string[]
    studyStreak?: number
    examCountdownDays?: number
    studyGoal?: string
    totalStudyHours?: number
    vocabularyCount?: number
    vocabDueForReview?: number
    mistakeCount?: number
    recentMistakes?: number
    topMistakeSkill?: string
    weeklyTasksDone?: number
    weeklyTasksTotal?: number
    todayUnfinished?: number
    completedTasks?: number
  }
}): Promise<{
  sections: { heading: string; body: string; type: string }[]
  questions: { id: string; question: string; options?: string[]; correctAnswer?: string; type: string }[]
  tips: string[]
  whyItMatters: string
  topic: string
  objective: string
  estimatedMinutes: number
}> {
  const { title, skill, difficulty, userContext } = params

  const profileLines: string[] = []
  if (userContext) {
    if (userContext.targetBand) profileLines.push(`- Target band: ${userContext.targetBand}`)
    if (userContext.currentBand) profileLines.push(`- Current band: ${userContext.currentBand}`)
    if (userContext.weakSkills?.length) profileLines.push(`- Weak skills: ${userContext.weakSkills.join(', ')}`)
    if (userContext.studyStreak) profileLines.push(`- Study streak: ${userContext.studyStreak} days`)
    if (userContext.totalStudyHours) profileLines.push(`- Total study hours: ${userContext.totalStudyHours}`)
    if (userContext.weeklyTasksDone !== undefined) profileLines.push(`- Weekly tasks: ${userContext.weeklyTasksDone}/${userContext.weeklyTasksTotal || '?'} done`)
    if (userContext.todayUnfinished) profileLines.push(`- ${userContext.todayUnfinished} unfinished task(s) today`)
    if (userContext.completedTasks) profileLines.push(`- ${userContext.completedTasks} tasks completed overall`)
    if (userContext.examCountdownDays) profileLines.push(`- Exam in ${userContext.examCountdownDays} days${userContext.examCountdownDays <= 30 ? ' (URGENT)' : ''}`)
    if (userContext.studyGoal) profileLines.push(`- Study goal: ${userContext.studyGoal}`)
    if (userContext.vocabularyCount) profileLines.push(`- Vocabulary saved: ${userContext.vocabularyCount} words${userContext.vocabDueForReview ? ` (${userContext.vocabDueForReview} due for review)` : ''}`)
    if (userContext.mistakeCount) profileLines.push(`- Total mistakes: ${userContext.mistakeCount}${userContext.recentMistakes ? ` (${userContext.recentMistakes} recent)` : ''}`)
    if (userContext.topMistakeSkill) profileLines.push(`- Most mistakes in: ${userContext.topMistakeSkill}`)
  }

  const userProfile = profileLines.join('\n')
  const profileSection = userProfile
    ? `\n\nStudent profile:\n${userProfile}\n\nPersonalize the lesson content to their current level, weak areas, and study progress.`
    : ''

  const systemPrompt = `You are an expert IELTS ${skill} teacher. Create a brief study lesson titled "${title}".
The lesson should be at ${difficulty} difficulty level for IELTS preparation.${profileSection}

Respond with valid JSON ONLY. Use this exact structure:
{
  "topic": "Main topic (one word)",
  "objective": "One sentence learning objective",
  "whyItMatters": "Why this matters for IELTS (2-3 sentences)",
  "estimatedMinutes": 20,
  "sections": [
    { "heading": "Section title", "body": "Section content with explanations, examples", "type": "instruction" },
    { "heading": "Section title", "body": "More content", "type": "text" }
  ],
  "questions": [
    { "id": "q1", "question": "Question text", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "type": "multiple-choice" },
    { "id": "q2", "question": "Question text", "correctAnswer": "answer", "type": "short-answer" }
  ],
  "tips": ["Practical tip 1", "Practical tip 2"]
}

Guidelines:
- 3-4 sections with clear explanations
- 3-4 practice questions (mix multiple-choice and short-answer)
- 3-4 practical tips
- Make content specific and immediately useful for IELTS learners`

  const { content, error } = await makeAIRequest(systemPrompt, `Create a short study lesson titled "${title}" for ${skill} at ${difficulty} level.`, {
    temperature: 0.7,
    maxTokens: 1500,
  })

  if (content && !error) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          sections: parsed.sections || [],
          questions: parsed.questions || [],
          tips: parsed.tips || [],
          whyItMatters: parsed.whyItMatters || 'This topic is important for IELTS preparation.',
          topic: parsed.topic || 'General',
          objective: parsed.objective || `Study ${title}`,
          estimatedMinutes: parsed.estimatedMinutes || 20,
        }
      }
    } catch {
      // fall through
    }
  }

  throw new Error(error || 'Failed to generate study content')
}
