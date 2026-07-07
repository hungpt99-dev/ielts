import { useState, useEffect, useCallback, useRef, useId } from 'react'
import { emitAITutorOpened } from '../features/websiteActions/eventEmitters'
import { VoiceProvider } from '../voice/VoiceProvider'
import { useVoice } from '../voice/useVoice'
import VoiceButton from '../voice/components/VoiceButton'
import TtsToggle from '../voice/components/TtsToggle'
import RecordingIndicator from '../voice/components/RecordingIndicator'
import type { AssistantMode, ChatMessage, ChatSession } from '../types'
import type { TutorMemory, UserTutorPreferences, ProactiveSuggestion } from '../models/aiTutorModels'
import { DEFAULT_TUTOR_PREFERENCES } from '../models/aiTutorModels'
import { LocalTutorStorage } from '../services/storage/LocalTutorStorage'
import { suggestionEngine } from '../services/aiTutor/SuggestionEngine'
import { contextManager, type ContextDataItem } from '../services/aiTutor/ContextManager'
import { MemoryService, type MemoryStats } from '../services/aiTutor/MemoryService'
import ModeSelector from '../components/aiTutor/ModeSelector'
import { topicContextManager } from '../services/aiTutor/TopicContextManager'
import {
  type TeachingLesson,
  type CheckingQuestion,
  type ExerciseQuestion,
  type ExerciseAnswerRecord,
  detectLessonFromMessage,
  generateLessonText,
  generateFeedbackMessage,
  evaluateCheckingAnswer,
  evaluateExerciseAnswer,
  suggestNextTopics,
  CheckingQuestionCard,
  ExerciseCard,
  ExerciseFeedbackCard,
  evaluateCheckingAnswerAI,
  evaluateExerciseAnswerAI,
  generateMistakeReviewAI,
} from '../components/aiTutor/TeachingMode'
import {
  aiGenerateResponse,
  aiGenerateSocraticQuestion,
  aiGenerateGentleCorrection,
  aiGenerateDailyCheckIn,
  aiGenerateLesson,
} from '../components/aiTutor/aiTutorHelper'
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { generateId } from '../utils'
import { IconAlertCircle, IconRefresh, IconAITutor, IconHash, IconMessageCircle, IconExplain, IconFolderOpen, IconDelete, IconClose, IconSend, IconLoading, IconVocabularyBook, IconVocabulary, IconGrammar, IconEdit, IconMistakes, IconCheckCircle, IconTarget, IconBookText, IconListening, IconTodayPlan, IconStar, IconShield, IconDownload, IconWriting, IconArticle, IconTimer, IconSpeaking, IconReading } from '@ielts/ui'
import PageContainer from '../components/layout/PageContainer'
import PageHeader from '../components/layout/PageHeader'
import {
  type SpeakingPhase,
  type SpeakingQuestionItem,
  type CueCard,
  type SpeakingFeedback,
  getPartSelectorMessage,
  detectPartChoice,
  getRandomPart1Questions,
  getRandomCueCard,
  getRandomPart3Questions,
  generateSpeakingFeedback,
  formatFeedbackMessage,
  saveSpeakingMistakesToNotebook,
  isNextQuestionRequest,
  generateSpeakingStartMessage,
  PartSelectorCard,
  CueCardDisplay,
  FeedbackSummaryCard,
} from '../components/aiTutor/SpeakingPartner'
import {
  type WritingPhase,
  type WritingTaskType,
  type WritingFeedbackData,
  type BrainstormingIdea,
  type WritingOutline,
  getTaskSelectorMessage,
  detectWritingTaskChoice,
  detectWritingTaskType,
  detectWritingTopic,
  generateBrainstorming,
  generateOutline,
  improveThesisStatement,
  checkParagraphStructure,
  generateWritingFeedback,
  generateImprovedVersion,
  formatFeedbackMessage as formatWritingFeedbackMessage,
  saveWritingFeedback,
  saveWritingMistakesToNotebook,
  TaskSelectorCard,
  WritingFeedbackCard,
} from '../components/aiTutor/WritingTutor'
import {
  type ReadingListeningPhase,
  type ContentAnalysis,
  analyzeContent,
  getWelcomeMessage,
  detectContentSubmission,
  getActionSelectorMessage,
  detectActionChoice,
  isBackRequest,
  ActionSelectorCard,
  READING_ACTIONS,
} from '../components/aiTutor/ReadingListeningTutor'
import {
  aiGenerateSummary,
  aiGenerateVocabularyList as aiGenerateVocabularyListFn,
  aiGenerateComprehensionQuestions as aiGenerateComprehensionQuestionsFn,
  aiGenerateOpinionQuestions,
  aiGenerateExercises as aiGenerateExercisesFn,
  aiGenerateIeltsConnection,
  aiGenerateExplanation,
} from '../components/aiTutor/aiTutorHelper'

type Language = 'english' | 'vietnamese' | 'both'

// ── Response Generation ─────────────────────────────────────────

const MODE_GREETINGS: Record<AssistantMode, string> = {
  'friendly-chat': "Hey there! I'm your IELTS learning friend. What shall we chat about today?",
  'ielts-tutor': "Hi! I'm your IELTS tutor. What would you like to learn today? I can help with any skill — reading, writing, speaking, listening, vocabulary, or grammar.",
  'speaking-partner': "Hello! Ready to practice speaking? I can ask you Part 1, Part 2, or Part 3 questions and give you feedback.",
  'writing-coach': "Hi! I'm your writing coach. Want to brainstorm ideas, check an essay, or practice writing a paragraph?",
  'grammar-teacher': "Hey! I'm here to help with English grammar. What grammar point would you like to study?",
  'vocabulary-coach': "Hi! Ready to build your vocabulary? Tell me a topic and I'll teach you useful words and phrases.",
  'reading-explainer': "Hello! Got an article or passage you want to discuss? I can help explain it and find useful vocabulary.",
  'listening-coach': "Hi! Working on listening? We can practice with transcripts, discuss audio content, or extract useful language.",
  'study-planner': "Hey! Let's plan your IELTS study journey. Tell me your target band, exam date, or what you want to focus on.",
  'motivation-coach': "Hi there! Let's keep your IELTS motivation strong. How was your study today? Remember, every step counts!",
  'socratic-tutor': "Welcome to Socratic Tutor mode! 🧠 Instead of giving you answers directly, I'll guide you with thoughtful questions. You'll discover answers yourself — and remember them better! What would you like to explore?",
}

const MODE_PROMPT: Record<AssistantMode, string> = {
  'friendly-chat': 'Let\'s chat naturally, but I\'ll connect it to learning English. I might teach you a phrase or correct something gently.',
  'ielts-tutor': 'I can teach you step by step, give mini exercises, explain vocabulary/grammar, and guide you like a real tutor.',
  'speaking-partner': 'I\'ll ask IELTS speaking questions and give feedback. After you answer, I\'ll suggest improvements and estimate your band.',
  'writing-coach': 'I\'ll help you write better — from brainstorming to full essays. I can check grammar, suggest vocabulary, and estimate band scores.',
  'grammar-teacher': 'I\'ll explain grammar rules simply, give examples, and create mini exercises for you.',
  'vocabulary-coach': 'I\'ll teach topic-based vocabulary with meanings, examples, collocations, and practice exercises.',
  'reading-explainer': 'Share any text or article with me. I\'ll summarize it, explain difficult parts, and find IELTS-relevant vocabulary.',
  'listening-coach': 'Share transcripts or audio notes. I\'ll help you understand, extract vocabulary, and create comprehension questions.',
  'study-planner': 'Tell me your goals and schedule. I\'ll help you make a realistic study plan and keep you on track.',
  'motivation-coach': 'I\'m here to encourage you, celebrate your progress, and help you stay consistent with your studies.',
  'socratic-tutor': 'I\'ll guide you with questions instead of giving direct answers. You\'ll think deeply about each topic and discover the answers yourself.',
}

function detectTopic(userMessage: string): string {
  const lower = userMessage.toLowerCase()
  if (/\b(grammar|tense|verb|noun|adjective|adverb|preposition|sentence|clause|article|plural|singular)\b/.test(lower)) return 'grammar'
  if (/\b(vocabulary|word|meaning|phrase|expression|idiom|collocation|synonym|antonym)\b/.test(lower)) return 'vocabulary'
  if (/\b(speaking|speak|pronunciation|fluency|accent|part\s*[123]|cue\s*card)\b/.test(lower)) return 'speaking'
  if (/\b(writing|essay|paragraph|thesis|introduction|conclusion|task\s*[12]|cohesion|coherence)\b/.test(lower)) return 'writing'
  if (/\b(reading|passage|article|text|comprehension|skim|scan|main idea)\b/.test(lower)) return 'reading'
  if (/\b(listening|audio|transcript|listen|hear|accent|lecture|conversation)\b/.test(lower)) return 'listening'
  if (/\b(ielts|band|score|exam|test|practice|mock|preparation)\b/.test(lower)) return 'ielts'
  if (/\b(plan|schedule|study|goal|target|deadline|exam date)\b/.test(lower)) return 'planning'
  if (/\b(hello|hi|hey|how are you|good morning|good evening)\b/.test(lower)) return 'greeting'
  if (/\b(thank|thanks|appreciate)\b/.test(lower)) return 'thanks'
  if (/\b(environment|climate|pollution|recycling|sustainability|energy|nature)\b/.test(lower)) return 'environment'
  if (/\b(education|school|university|student|teacher|learn|study|exam|online\s*learning)\b/.test(lower)) return 'education'
  if (/\b(technology|internet|computer|ai|digital|social media|smartphone)\b/.test(lower)) return 'technology'
  if (/\b(health|exercise|diet|doctor|hospital|medicine|sleep|wellness)\b/.test(lower)) return 'health'
  if (/\b(travel|tourism|holiday|vacation|country|culture|abroad)\b/.test(lower)) return 'travel'
  if (/\b(work|job|career|business|office|company|employ|profession)\b/.test(lower)) return 'work'
  return 'general'
}

// ── Friend Mode Response Generation ────────────────────────────────────

function generateFriendModeEnglish(topic: string, userMessage: string): string {
  const lower = userMessage.toLowerCase()

  if (/\b(hello|hi|hey|how's it going|what's up|good morning|good afternoon|good evening)\b/.test(lower)) {
    return "Hey friend! 😊 Great to see you! How's your English learning going today? Let's chat — every conversation is good practice!"
  }

  if (/\bhow (are|were) you\b/.test(lower) || /\bhow('s| is) (it going|your day|your study)\b/.test(lower)) {
    return "I'm doing well, thanks for asking! 😊 But I'm more interested in YOU — how was your study today? Anything new you learned or found tricky? I'd love to hear about it!"
  }

  if (/\b(study|learn|practice|review|read|write|listen|speak)\b/.test(lower) && /\b(today|yesterday|this week|recently|lately)\b/.test(lower)) {
    return "That's wonderful to hear you've been practicing! 🎉 Consistency is everything for IELTS. What specifically did you focus on? If you tell me, I can help reinforce what you've learned or suggest what to try next. You're doing great — keep it up!"
  }

  if (/\b(think|feel|believe|opinion|in my opinion|i think|i feel)\b/.test(lower)) {
    return "I love hearing your thoughts on this! 🎯 You explained your opinion clearly. In IELTS, giving opinions confidently is really important — especially in Speaking Part 3 and Writing Task 2. Try adding a short real-life example to make your point even stronger. Want to practice together?"
  }

  if (/\b(tired|difficult|hard|struggl|confus|frustrat|stress|overwhelm|worried|nervous)\b/.test(lower)) {
    return "I hear you, and it's completely okay to feel that way. 🌟 Learning a language is a journey with ups and downs. You're already doing something amazing by practicing. Every mistake is proof that you're trying! What's feeling tough right now? Let's work through it together, one step at a time."
  }

  if (/\b(bored|nothing|anything|something|what should|what can|idea|suggest|recommend)\b/.test(lower)) {
    return "Since you're looking for something fun, how about a quick English activity? 🎯 I could:\n\n• Teach you 3 new topic words\n• Ask you a fun discussion question\n• Give you a mini grammar challenge\n• Or we can just chat and I'll gently help with your English along the way\n\nWhat sounds good?"
  }

  return "That's really interesting! Tell me more! 🎯 You know, chatting about everyday things in English is fantastic practice for IELTS Speaking. It builds fluency and confidence naturally. By the way, here's a tip: native speakers often use phrasal verbs in casual conversation — like 'come across' instead of 'find'. Want to learn a few more? 😊"
}

function generateFriendModeVietnamese(topic: string, userMessage: string): string {
  const lower = userMessage.toLowerCase()

  if (/\b(hello|hi|hey|chào|how's it going|what's up)\b/.test(lower)) {
    return "Chào bạn! 😊 Rất vui được trò chuyện! Học tiếng Anh hôm nay thế nào? Có gì thú vị không? Cứ chat tự nhiên nhé — mỗi cuộc trò chuyện đều là cơ hội luyện tập tốt!"
  }

  if (/\bhow (are|were) you\b/.test(lower) || /\bbạn (khỏe|thế nào|sao rồi)\b/.test(lower)) {
    return "Mình ổn, cảm ơn bạn! 😊 Nhưng mình quan tâm đến BẠN hơn — học tập hôm nay thế nào? Có gì mới hay khó khăn gì không? Kể mình nghe với, mình sẵn sàng giúp đỡ!"
  }

  if (/\b(học|luyện|ôn|đọc|viết|nghe|nói|study|learn|practice|review)\b/.test(lower) && /\b(hôm qua|hôm nay|tuần này|study|today)\b/.test(lower)) {
    return "Tuyệt vời khi bạn đã luyện tập! 🎉 Kiên trì là chìa khóa cho IELTS. Bạn tập trung vào kỹ năng nào vậy? Kể mình nghe, mình có thể giúp bạn củng cố kiến thức hoặc gợi ý bước tiếp theo. Bạn đang làm rất tốt!"
  }

  return "Thú vị đấy! Kể thêm đi! 🎯 Nói về những chủ đề hàng ngày bằng tiếng Anh là cách luyện tập tuyệt vời cho IELTS Speaking. Nó giúp bạn nói trôi chảy và tự tin hơn. Nhân tiện, mình có một mẹo nhỏ: người bản ngữ thường dùng phrasal verbs trong hội thoại — như 'come across' thay vì 'find'. Bạn muốn học thêm vài từ không? 😊"
}

// ── Gentle English Correction ─────────────────────────────────────────

interface GentleCorrection {
  original: string
  suggestion: string
  explanation: string
}

function getGentleCorrections(message: string): GentleCorrection[] {
  const corrections: GentleCorrection[] = []

  const iAmMatch = message.match(/\bI (is|are|were)\b/i)
  if (iAmMatch) {
    corrections.push({
      original: `I ${iAmMatch[1]}`,
      suggestion: 'I am',
      explanation: `After "I", use "am" (not "${iAmMatch[1]}") for present tense.`,
    })
  }

  const heMatch = message.match(/\b(he|she|it) (go|do|make|take|have|say|get|know|think|come|want|use|find|work|feel|try|study|play|run|write|read|speak|listen|learn|teach|help|keep|eat|drink|like|love|hate)\b/i)
  if (heMatch) {
    corrections.push({
      original: `${heMatch[1]} ${heMatch[2]}`,
      suggestion: `${heMatch[1]} ${heMatch[2]}s`,
      explanation: `After "${heMatch[1]}", add "s" to the verb in present simple (${heMatch[1]} ${heMatch[2]}s).`,
    })
  }

  const articleMatch = message.match(/\b(important|interesting|useful|honest|hour)\b/i)
  if (articleMatch) {
    const word = articleMatch[1].toLowerCase()
    corrections.push({
      original: word,
      suggestion: `an ${word}`,
      explanation: `Use "an" before "${word}" because it starts with a vowel sound.`,
    })
  }

  return corrections.slice(0, 2)
}

function formatCorrectionsAsText(corrections: GentleCorrection[]): string {
  if (corrections.length === 0) return ''
  const lines = corrections.map(c =>
    `• "${c.original}" → **${c.suggestion}** — ${c.explanation}`
  )
  return `\n\n💡 *Gentle correction:*\n${lines.join('\n')}`
}

// ── Socratic Tutor Mode ──────────────────────────────────────────────

type SocraticQuestionType =
  | 'define'
  | 'make-sentence'
  | 'justify'
  | 'improve'
  | 'explain-opinion'
  | 'clarify'
  | 'give-example'
  | 'guess'
  | 'challenge'

interface SocraticQA {
  id: string
  type: SocraticQuestionType
  question: string
  hint?: string
  userAnswer?: string
  feedback?: string
}

const SOCRATIC_MAX_ROUNDS = 4

function getNextSocraticType(prev: SocraticQuestionType): SocraticQuestionType {
  const progression: SocraticQuestionType[] = ['define', 'explain-opinion', 'justify', 'give-example', 'improve', 'challenge']
  const idx = progression.indexOf(prev)
  if (idx === -1 || idx >= progression.length - 1) return 'clarify'
  return progression[idx + 1]
}

function generateSocraticStartingQuestion(userMessage: string, topic: string): SocraticQA {
  const lower = userMessage.toLowerCase()

  const wordMatch = userMessage.match(/"([^"]+)"|'([^']+)'|`([^`]+)`|\b(sustainable|biodiversity|curriculum|innovation|significant|acquire|consequence|implement|inevitable|contribute|mitigate|advocate|comprehensive|elaborate|articulate)\b/i)

  if (/\b(meaning|definition|what does|define|vocab|word|phrase|term)\b/.test(lower) && wordMatch) {
    const word = wordMatch[1] || wordMatch[2] || wordMatch[3] || wordMatch[4] || 'this word'
    return {
      id: generateId(),
      type: 'define',
      question: `Before I give you the definition, what do you **think** "${word}" means? Try guessing based on how it sounds or where you've seen it before. Even a rough idea is a great start! 🤔`,
      hint: `Think about the context where you saw "${word}". Does it sound positive or negative? What part of speech might it be?`,
    }
  }

  if (topic === 'grammar' || /\b(grammar|tense|verb|article|preposition|sentence structure)\b/.test(lower)) {
    return {
      id: generateId(),
      type: 'guess',
      question: `That's a great grammar question! Instead of giving you the rule right away, let me ask: what do you **already know** about this? Try explaining it in your own words — even a small attempt will help us build from there! 💡`,
      hint: 'Think about examples you remember. When have you seen this grammar point used before?',
    }
  }

  if (/\b(sentence|write|correct|improve|rewrite|fix|check)\b/.test(lower)) {
    return {
      id: generateId(),
      type: 'improve',
      question: `I'd love to work on that with you! First, could you **try** writing a sentence yourself? Show me what you have in mind, and then we can refine it together. Even a rough draft is perfect! ✍️`,
      hint: 'Start simple — a subject + verb + object. You can always add more detail later!',
    }
  }

  if (/\b(opinion|think|believe|feel|you think|what is your|do you)\b/.test(lower)) {
    return {
      id: generateId(),
      type: 'explain-opinion',
      question: `Interesting! Before I share my thoughts, can you explain your **own** opinion more clearly? Try giving me a reason or a real-life example. In IELTS, supporting your ideas makes your answer much stronger! 🎯`,
      hint: 'Ask yourself: "Why do I think this? Can I think of a personal experience or a fact that supports this?"',
    }
  }

  if (/\b(exam|test|score|band|ielts)\b/.test(lower)) {
    return {
      id: generateId(),
      type: 'guess',
      question: `Great question about IELTS! What do **you** already know about this? Have you tried any practice tests or read any tips before? Share what you know, and I'll guide you from there! 🎯`,
    }
  }

  if (/\b(exercise|quiz|practice|question)\b/.test(lower)) {
    return {
      id: generateId(),
      type: 'challenge',
      question: `Alright, let's test your knowledge! Before I give you the answer, what do **you** think the correct answer is? Try to reason it out — the process is more important than getting it right! 🧠`,
    }
  }

  return {
    id: generateId(),
    type: 'justify',
    question: `That's something worth exploring together! Instead of jumping to the answer, let me ask: what do **you** think? Try reasoning it out loud — even a small guess or instinct counts. Learning happens when you think through it yourself! 😊`,
    hint: 'Start with "I think..." or "Based on what I know..." and go from there.',
  }
}

function generateSocraticFollowUp(
  userAnswer: string,
  prevQA: SocraticQA,
  topic: string,
  round: number,
  language: Language,
): { nextQuestion?: SocraticQA; feedback?: string; wrapUp?: string } {
  const lower = userAnswer.toLowerCase().trim()

  const isShortOrUnsure = lower.length < 8 || /\b((I don't know|not sure|no idea|idk|I'm not sure|maybe|perhaps|i don't understand|i have no clue))\b/.test(lower)

  if (isShortOrUnsure) {
    const hint = prevQA.hint || 'Think about what you already know on this topic. Even a small idea helps!'
    return {
      nextQuestion: {
        id: generateId(),
        type: 'clarify',
        question: `That's okay! Let me help you a bit. Here's a hint:\n\n**${hint}**\n\nNow, would you like to try again? Remember, there are no wrong answers here — only opportunities to learn! 🌟`,
        hint: 'Take a deep breath and try. You can do this!',
      },
    }
  }

  const positiveFeedback = userAnswer.length > 15
    ? `That's a thoughtful answer! You're thinking in the right direction. 👏`
    : `Good effort! You're engaging with the material, which is the most important part. 👍`

  if (round >= SOCRATIC_MAX_ROUNDS) {
    const wrapUps: Record<string, string> = {
      define: `Let me give you the full picture now.\n\n**What you shared:** "${userAnswer}" — that's a great attempt! You clearly understood part of it.\n\n**Here's the complete idea:** ${getSocraticWrapUpExplanation(topic, prevQA.type)}\n\n**Why this works:** By thinking through it yourself first, you've already built a mental framework. This makes the correct answer much easier to remember! 🧠\n\nWould you like to explore another topic or practice with some exercises?`,
      'make-sentence': `Let me give you my thoughts on your sentence.\n\n**Your sentence:** "${userAnswer}"\n\n**Feedback:** ${getSentenceFeedback(userAnswer)}\n\n**Suggested improvement:** ${getSocraticWrapUpExplanation(topic, prevQA.type)}\n\nGreat work practicing! Would you like to try another sentence or move to a new topic? ✍️`,
      justify: `Thank you for thinking through that! Here's my perspective.\n\n**Your reasoning:** "${userAnswer}"\n\n**My thoughts:** ${getSocraticWrapUpExplanation(topic, prevQA.type)}\n\nYou're building great critical thinking skills — exactly what IELTS examiners look for! Would you like to continue practicing? 🎯`,
    }
    return {
      wrapUp: wrapUps[prevQA.type] || `Great thinking! Here's what I'd add:\n\n${getSocraticWrapUpExplanation(topic, prevQA.type)}\n\nYou've done an excellent job working through this. Would you like to explore something else? 🌟`,
    }
  }

  const nextType = getNextSocraticType(prevQA.type)
  const nextQuestion = getSocraticNextQuestion(nextType, topic, userAnswer, language)

  return {
    nextQuestion: {
      id: generateId(),
      type: nextType,
      question: `${positiveFeedback}\n\nLet's go a bit deeper. ${nextQuestion}`,
      hint: getSocraticHintForType(nextType, topic),
    },
  }
}

function getSocraticNextQuestion(type: SocraticQuestionType, topic: string, userAnswer: string, language: Language): string {
  switch (type) {
    case 'justify':
      return `Why do you think that's the case? Can you explain the reasoning behind your answer? 🤔`
    case 'explain-opinion':
      return `Can you explain your opinion more clearly? Try to add a reason or example to support your point of view. 🎯`
    case 'give-example':
      return `Can you give me a specific example related to this? A real-life situation or a personal experience would be perfect! 💡`
    case 'improve':
      return `Now that you've shared your idea, can you **improve** it? Think about how you could make it clearer or more detailed. How would you say it differently? ✨`
    case 'challenge':
      return `Let me challenge you a bit: is there another way to look at this? What would happen if you considered the opposite perspective? 🧠`
    case 'clarify':
      return `Can you elaborate a bit more? What else comes to mind when you think about this topic? 🌟`
    case 'define':
      return `Based on what you've learned so far, how would you now define or summarize this in your own words? 📝`
    default:
      return `What else can you tell me about this? Keep going — you're doing great! 😊`
  }
}

function getSocraticWrapUpExplanation(topic: string, qType: SocraticQuestionType): string {
  if (topic === 'grammar') {
    return "Grammar is about patterns. Once you understand the pattern, you can apply it anywhere. The key is to practice noticing these patterns in real sentences — read them, say them, write them. That's how grammar becomes natural!"
  }
  if (topic === 'vocabulary' || topic === 'environment' || topic === 'education' || topic === 'technology') {
    return "Vocabulary sticks best when you connect it to something personal. Try using new words in sentences about your own life, and review them in context (sentences, not isolated words). This is far more effective than memorizing lists!"
  }
  if (topic === 'speaking') {
    return "For speaking, fluency matters more than perfection. Focus on expressing your ideas clearly, even with simple words. As you gain confidence, you can gradually add more sophisticated vocabulary and structures."
  }
  if (topic === 'writing') {
    return "Good writing is clear writing. Focus on one main idea per paragraph, use examples to support your points, and connect your ideas with linking words. Structure is just as important as vocabulary!"
  }
  return "The most important thing is to keep thinking and questioning. Active learning — where you reason through problems yourself — is far more effective than passively receiving information. You're building a skill that will serve you well beyond IELTS!"
}

function getSocraticHintForType(type: SocraticQuestionType, topic: string): string {
  switch (type) {
    case 'define': return 'Try to describe it in simple words. What is the core meaning?'
    case 'justify': return 'Ask yourself "why?" — what evidence or logic supports this?'
    case 'give-example': return 'Think about your own life, news, or common situations.'
    case 'improve': return 'Could you add more detail? Use more precise words? Make it clearer?'
    case 'clarify': return 'Break it down into smaller parts and explain each one.'
    case 'challenge': return 'Consider the opposite view — what would someone who disagrees say?'
    default: return 'Think deeper — what else is connected to this topic?'
  }
}

function getSentenceFeedback(sentence: string): string {
  const lower = sentence.toLowerCase()
  const feedback: string[] = []

  if (lower.length < 20) {
    feedback.push('Your sentence is quite short — try adding more detail (adjectives, reasons, examples).')
  }
  if (!/\b(because|therefore|however|moreover|for example|such as|in addition)\b/.test(lower)) {
    feedback.push('Consider using a linking word (like "because" or "for example") to connect your ideas.')
  }
  if (!/\b(a|an|the)\b/.test(lower)) {
    feedback.push('Check if you need articles (a/an/the) before nouns.')
  }
  if (feedback.length === 0) {
    feedback.push('Your sentence is clear and well-structured! Try experimenting with more complex structures next time.')
  }

  return feedback.slice(0, 2).join('\n')
}

// ── Socratic Question Card Component ────────────────────────────────

interface SocraticQuestionCardProps {
  question: SocraticQA
  round: number
  maxRounds: number
  onSubmit: (answer: string) => void
  disabled?: boolean
}

function SocraticQuestionCard({ question, round, maxRounds, onSubmit, disabled }: SocraticQuestionCardProps) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const labelId = useId()

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || submitted) return
    setSubmitted(true)
    onSubmit(answer.trim())
  }, [answer, submitted, onSubmit])

  if (submitted) {
    return (
      <div className="mt-2 animate-pulse rounded-lg p-3 text-center text-xs" style={{ backgroundColor: 'var(--color-tutor-background)', color: 'var(--color-tutor-text)' }}>
        Thinking about your answer...
      </div>
    )
  }

  return (
    <div
      className="mt-3 rounded-xl border-2 p-4" style={{ borderColor: 'var(--color-tutor-border)', backgroundColor: 'var(--color-tutor-background)' }}
      role="form"
      aria-labelledby={labelId}
    >
      <div className="mb-3 flex items-center justify-between">
        <p id={labelId} className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          🧠 Socratic Question {round}/{maxRounds}
        </p>
        {question.hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-[var(--color-tutor-accent-light)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
            type="button"
          >
            {showHint ? 'Hide hint' : 'Need a hint?'}
          </button>
        )}
      </div>

      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {question.question}
      </p>

      {showHint && question.hint && (
        <div className="mb-3 rounded-lg p-2.5 text-xs" style={{ backgroundColor: 'var(--color-tutor-background)', color: 'var(--color-tutor-text)' }}>
          💡 {question.hint}
        </div>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your thoughts here..."
        rows={2}
        disabled={disabled}
        className="mb-3 w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || disabled}
        className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Share My Answer
      </button>
    </div>
  )
}

// ── Daily Check-in ────────────────────────────────────────────────────

function hasCheckedInToday(): boolean {
  try {
    const last = localStorage.getItem('tutor-friend-checkin')
    return last === new Date().toDateString()
  } catch {
    return false
  }
}

function markCheckedInToday(): void {
  try {
    localStorage.setItem('tutor-friend-checkin', new Date().toDateString())
  } catch {
    // storage unavailable
  }
}

function getDailyCheckInMessage(): string {
  return "Hey friend! ☀️ Good to see you today! How did your study go yesterday? What are you planning to focus on today? Remember, every day of practice brings you closer to your IELTS goal! 💪"
}

// ── Standard Response Generation ──────────────────────────────────────

function generateEnglishExplanation(topic: string, mode: AssistantMode, userMessage: string): string {
  const lower = userMessage.toLowerCase()

  if (topic === 'grammar') {
    if (/\bpresent perfect|past simple|past tense|present tense|future tense\b/.test(lower)) {
      return "Great question about tenses! The Present Perfect connects the past to the present — we use it for experiences, changes, and unfinished actions. For example: 'I have studied IELTS for 3 months.' It's different from Past Simple, which is for finished past actions: 'I studied grammar yesterday.' Would you like me to explain more with examples?"
    }
    if (/\barticle\b/.test(lower)) {
      return "Articles (a/an/the) can be tricky! Use 'a' before consonant sounds, 'an' before vowel sounds for non-specific things. Use 'the' when both you and the listener know what you're referring to. For example: 'I saw a dog' (any dog), but 'The dog was brown' (that specific dog). In IELTS, correct article use helps your Grammar score."
    }
    if (/\bconditional|if\b/.test(lower)) {
      return "Conditionals are patterns using 'if'. There are 4 main types:\n• Zero: general truths (If you heat ice, it melts)\n• First: real future (If I study hard, I will get Band 7)\n• Second: unreal present (If I were you, I would practice more)\n• Third: unreal past (If I had studied, I would have passed)\nWhich one would you like to practice?"
    }
    return "That's a good grammar question! Let me explain simply. In English, word order is usually Subject-Verb-Object (SVO). For example: 'She (S) studies (V) English (O).' Adjectives come before nouns: 'a beautiful city.' Adverbs can move around: 'She quickly ran' or 'She ran quickly.' Would you like me to explain a specific grammar point?"
  }

  if (topic === 'vocabulary' || topic === 'environment' || topic === 'education' || topic === 'technology') {
    const topicWord = topic.charAt(0).toUpperCase() + topic.slice(1)
    return `Great topic — ${topicWord} vocabulary is very common in IELTS! Here are some useful words:\n\n• **${topic === 'environment' ? 'Sustainable' : topic === 'education' ? 'Curriculum' : topic === 'technology' ? 'Innovation' : 'Significant'}** — ${topic === 'environment' ? 'can be maintained without harming the environment' : topic === 'education' ? 'the subjects taught in a school or course' : topic === 'technology' ? 'a new method, idea, or product' : 'important or large enough to be noticed'}\n\n• **${topic === 'environment' ? 'Biodiversity' : topic === 'education' ? 'Pedagogy' : topic === 'technology' ? 'Disruptive' : 'Acquire'}** — ${topic === 'environment' ? 'the variety of plants and animals in a habitat' : topic === 'education' ? 'the method and practice of teaching' : topic === 'technology' ? 'causing significant change to an industry' : 'to gain something through effort'}\n\nWould you like example sentences with these words? I can also create a mini quiz for you!`
  }

  if (topic === 'speaking') {
    return "Great speaking practice! Here are some tips:\n\n• **Fluency**: Don't worry about perfect grammar — keep talking naturally.\n• **Vocabulary**: Use a few topic-specific words to impress the examiner.\n• **Structure**: For Part 2, organize your answer: introduction → main points → conclusion.\n• **Pronunciation**: Speak clearly at a natural pace.\n\nWant me to ask you a specific Part 1, 2, or 3 question to practice?"
  }

  if (topic === 'writing') {
    return "Writing is a key IELTS skill. Here are some important tips:\n\n• **Task 1 (Academic)**: Describe charts, graphs, or maps. Focus on key trends and comparisons.\n• **Task 2**: Write a clear essay with introduction, body paragraphs, and conclusion.\n• **Cohesion**: Use linking words (however, moreover, therefore) to connect ideas.\n• **Task achievement**: Always answer all parts of the question.\n\nWould you like me to help you brainstorm ideas or check a paragraph?"
  }

  if (topic === 'reading') {
    return "For IELTS Reading, try these strategies:\n\n• **Skimming**: Read quickly for the main idea.\n• **Scanning**: Look for specific information (names, dates, keywords).\n• **Time management**: Spend about 20 minutes per passage.\n• **Question types**: Practice matching headings, True/False/Not Given, and summary completion.\n\nWould you like me to explain a specific question type or strategy?"
  }

  if (topic === 'listening') {
    return "IELTS Listening tips:\n\n• **Before each section**: Read the questions carefully — predict what you'll hear.\n• **During**: Focus on keywords, numbers, names, and signpost words (firstly, however, in conclusion).\n• **Spelling**: British English spelling is preferred.\n• **Multiple choice**: Eliminate wrong options.\n\nWant to practice with some listening strategies?"
  }

  if (topic === 'ielts') {
    return "The IELTS exam has 4 sections: Listening (30 min), Reading (60 min), Writing (60 min), and Speaking (11-14 min). Each is scored from 1-9. Your overall band score is the average. Most universities require Band 6.0-7.0.\n\nKey tips:\n• Practice consistently — 30-60 minutes daily is better than 5 hours once a week.\n• Focus on your weak areas.\n• Take mock tests under timed conditions.\n\nWhat specific aspect of IELTS would you like help with?"
  }

  if (topic === 'planning') {
    return "Great that you're thinking about your study plan! Here's a suggested weekly schedule:\n\n• **Monday**: Reading + Vocabulary\n• **Tuesday**: Listening + Grammar\n• **Wednesday**: Writing Task 1\n• **Thursday**: Speaking practice\n• **Friday**: Writing Task 2\n• **Saturday**: Full mock test\n• **Sunday**: Review mistakes + relax\n\nEach session: 45-60 minutes of focused practice. What's your target band and exam date?"
  }

  if (topic === 'greeting') {
    return "Hello! I'm so happy to chat with you today. 😊 How are you feeling about your IELTS preparation? Is there anything specific you'd like to work on, or shall we just have a friendly conversation in English? Remember, every bit of practice helps!"
  }

  if (topic === 'thanks') {
    return "You're very welcome! I'm always happy to help. Remember, learning English is a journey — every step forward counts. Is there anything else you'd like to ask? Or would you like to practice something specific today?"
  }

  return "That's a great question! Here's what I think:\n\nEnglish learning works best when you:\n1. **Practice daily** — even 15 minutes helps\n2. **Focus on your weak areas** — identify them and work on them\n3. **Use real content** — articles, videos, podcasts in English\n4. **Track your progress** — review what you've learned\n5. **Stay positive** — mistakes are part of learning!\n\nWhat would you like to focus on today? I'm here to help!"
}

function generateVietnameseExplanation(topic: string, mode: AssistantMode, userMessage: string): string {
  const lower = userMessage.toLowerCase()

  if (topic === 'grammar') {
    if (/\bpresent perfect|past simple|past tense|present tense|future tense\b/.test(lower)) {
      return "Câu hỏi hay về thì! Thì Hiện tại Hoàn thành (Present Perfect) nối quá khứ với hiện tại — dùng để nói về kinh nghiệm, sự thay đổi và hành động chưa kết thúc. Ví dụ: 'Tôi đã học IELTS được 3 tháng.' Khác với Quá khứ Đơn (Past Simple) dùng cho hành động đã kết thúc: 'Hôm qua tôi đã học ngữ pháp.' Bạn muốn tôi giải thích thêm với ví dụ không?"
    }
    if (/\barticle\b/.test(lower)) {
      return "Mạo từ (a/an/the) có thể khó! Dùng 'a' trước phụ âm, 'an' trước nguyên âm cho vật không xác định. Dùng 'the' khi cả hai đều biết vật được nhắc đến. Ví dụ: 'Tôi thấy một con chó' (bất kỳ con nào), nhưng 'Con chó màu nâu' (con cụ thể). Trong IELTS, dùng mạo từ đúng giúp điểm Ngữ pháp của bạn."
    }
    return "Câu hỏi ngữ pháp hay đấy! Trong tiếng Anh, trật tự từ thường là Chủ ngữ-Động từ-Tân ngữ (SVO). Ví dụ: 'Cô ấy học tiếng Anh.' Tính từ đứng trước danh từ: 'một thành phố đẹp.' Bạn muốn tôi giải thích điểm ngữ pháp cụ thể nào không?"
  }

  if (topic === 'vocabulary' || topic === 'environment' || topic === 'education' || topic === 'technology') {
    const topicName = topic === 'environment' ? 'Môi trường' : topic === 'education' ? 'Giáo dục' : topic === 'technology' ? 'Công nghệ' : topic
    return `Chủ đề ${topicName} rất hay và thường gặp trong IELTS! Dưới đây là một số từ hữu ích:\n\n• **Sustainable (bền vững)** — có thể duy trì mà không gây hại đến môi trường\n• **Biodiversity (đa dạng sinh học)** — sự đa dạng của thực vật và động vật\n• **Curriculum (chương trình giảng dạy)** — các môn học trong trường\n• **Innovation (đổi mới sáng tạo)** — phương pháp, ý tưởng hoặc sản phẩm mới\n\nBạn có muốn xem ví dụ với các từ này không? Hoặc tôi có thể tạo bài tập nhỏ cho bạn!`
  }

  if (topic === 'speaking') {
    return "Luyện nói rất quan trọng! Một số mẹo:\n\n• **Lưu loát**: Đừng lo ngữ pháp hoàn hảo — cứ nói tự nhiên.\n• **Từ vựng**: Dùng vài từ chủ đề cụ thể để gây ấn tượng với giám khảo.\n• **Cấu trúc**: Phần 2, hãy sắp xếp: giới thiệu → ý chính → kết luận.\n\nBạn muốn tôi hỏi câu Part 1, 2 hay 3 để luyện tập?"
  }

  if (topic === 'writing') {
    return "Kỹ năng Viết rất quan trọng trong IELTS:\n\n• **Task 1**: Mô tả biểu đồ, tập trung vào xu hướng chính và so sánh.\n• **Task 2**: Viết bài luận rõ ràng với mở bài, thân bài và kết luận.\n• **Liên kết**: Dùng từ nối (however, moreover, therefore) để kết nối ý.\n\nBạn muốn tôi giúp bạn động não ý tưởng hay kiểm tra một đoạn văn?"
  }

  return "Câu hỏi tuyệt vời! Dưới đây là lời khuyên của tôi:\n\nHọc tiếng Anh hiệu quả nhất khi bạn:\n1. **Luyện tập hàng ngày** — chỉ 15 phút mỗi ngày cũng có ích\n2. **Tập trung vào điểm yếu** — xác định và cải thiện chúng\n3. **Dùng nội dung thực tế** — bài báo, video, podcast tiếng Anh\n4. **Theo dõi tiến độ** — ôn lại những gì đã học\n5. **Giữ tinh thần tích cực** — sai lầm là một phần của việc học!\n\nHôm nay bạn muốn tập trung vào gì? Tôi luôn sẵn sàng giúp đỡ!"
}

function generateResponse(
  userMessage: string,
  mode: AssistantMode,
  language: Language,
  topicContextHint?: string,
): string {
  const topic = detectTopic(userMessage)

  if (mode === 'friendly-chat') {
    const eng = generateFriendModeEnglish(topic, userMessage)
    const viet = generateFriendModeVietnamese(topic, userMessage)
    if (language === 'vietnamese') return viet
    if (language === 'both') return eng + '\n\n---\n\n' + viet
    return eng
  }

  if (mode === 'socratic-tutor') {
    const question = generateSocraticStartingQuestion(userMessage, topic)
    const intro = "Let's explore this together using the Socratic method — I'll guide you with questions so you discover the answer yourself! 🧠\n\n"
    return intro + question.question
  }

  const eng = generateEnglishExplanation(topic, mode, userMessage)
  const viet = generateVietnameseExplanation(topic, mode, userMessage)

  let prefix = ''
  if (topicContextHint && topicContextHint.length > 0) {
    prefix = '[Context: I see you are focusing on "' + topic + '" - ' + topicContextHint + ']\n\n'
  }

  if (language === 'vietnamese') {
    return prefix + viet
  }
  if (language === 'both') {
    return prefix + `${eng}\n\n---\n\n${viet}`
  }
  return prefix + eng
}

function generateTitle(userMessage: string): string {
  const lower = userMessage.slice(0, 60)
  return lower.length > 50 ? lower.slice(0, 47) + '...' : lower
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Voice auto-speak ─────────────────────────────────────────────

function VoiceResponseSpeaker({ messages }: { messages: ChatMessage[] }) {
  const { speak, ttsEnabled } = useVoice()
  const lastSpoken = useRef(0)

  useEffect(() => {
    if (!ttsEnabled) {
      lastSpoken.current = messages.length
      return
    }
    if (messages.length > lastSpoken.current) {
      const newMessages = messages.slice(lastSpoken.current)
      for (const msg of newMessages) {
        if (msg.role === 'assistant' && msg.content) {
          speak(msg.content)
        }
      }
      lastSpoken.current = messages.length
    }
  }, [messages, speak, ttsEnabled])

  return null
}

// ── Chat Page ───────────────────────────────────────────────────

export default function AITutorChat() {
  const skipAutoSpeak = useRef(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [session, setSession] = useState<ChatSession | null>(null)

  useEffect(() => {
    emitAITutorOpened(messages.length)
  }, [])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<AssistantMode>('ielts-tutor')
  const [language, setLanguage] = useState<Language>('both')
  const [preferences, setPreferences] = useState<UserTutorPreferences>(DEFAULT_TUTOR_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTopicName, setCurrentTopicName] = useState('')
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false)
  const [friendCorrections, setFriendCorrections] = useState<GentleCorrection[]>([])
  const [showContextDialog, setShowContextDialog] = useState(false)
  const [contextPreviewItems, setContextPreviewItems] = useState<ContextDataItem[]>([])

  // Teaching mode state
  const [teachingPhase, setTeachingPhase] = useState<'idle' | 'checking' | 'exercise' | 'feedback'>('idle')
  const [activeLesson, setActiveLesson] = useState<TeachingLesson | null>(null)
  const [activeCheckingQ, setActiveCheckingQ] = useState<CheckingQuestion | null>(null)
  const [activeExercise, setActiveExercise] = useState<ExerciseQuestion | null>(null)
  const [exerciseResults, setExerciseResults] = useState<ExerciseAnswerRecord[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)

  // Socratic mode state
  const [socraticPhase, setSocraticPhase] = useState<'idle' | 'questioning' | 'feedback'>('idle')
  const [socraticQA, setSocraticQA] = useState<SocraticQA | null>(null)
  const [socraticHistory, setSocraticHistory] = useState<SocraticQA[]>([])
  const [socraticRound, setSocraticRound] = useState(0)

  // Speaking Partner mode state
  const [speakingPhase, setSpeakingPhase] = useState<SpeakingPhase>('idle')
  const [speakingPart, setSpeakingPart] = useState<1 | 2 | 3>(1)
  const [speakingQuestions, setSpeakingQuestions] = useState<SpeakingQuestionItem[]>([])
  const [speakingCueCard, setSpeakingCueCard] = useState<CueCard | null>(null)
  const [currentSpeakingQIndex, setCurrentSpeakingQIndex] = useState(0)
  const [speakingFeedback, setSpeakingFeedback] = useState<SpeakingFeedback | null>(null)

  // Writing Tutor mode state
  const [writingPhase, setWritingPhase] = useState<WritingPhase>('idle')
  const [writingTask, setWritingTask] = useState<string | null>(null)
  const [writingTaskType, setWritingTaskType] = useState<WritingTaskType>('task2')
  const [writingTopic, setWritingTopic] = useState<string>('')
  const [writingFeedbackData, setWritingFeedbackData] = useState<WritingFeedbackData | null>(null)
  const [writingTargetBand, setWritingTargetBand] = useState(6.5)
  const [writingBrainstorming, setWritingBrainstorming] = useState<BrainstormingIdea[]>([])
  const [writingOutline, setWritingOutline] = useState<WritingOutline | null>(null)

  // Reading/Listening mode state
  const [rlPhase, setRlPhase] = useState<ReadingListeningPhase>('idle')
  const [rlAnalysis, setRlAnalysis] = useState<ContentAnalysis | null>(null)
  const [rlContent, setRlContent] = useState('')

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listEndRef = useRef<HTMLDivElement>(null)

  // Proactive suggestions state
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // Memory panel state
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null)
  const [memoryLoading, setMemoryLoading] = useState(false)
  const [memoryData, setMemoryData] = useState<TutorMemory | null>(null)
  const [memoryExporting, setMemoryExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<'memory' | 'all' | null>(null)

  // Save / convert state
  const [savingMsgId, setSavingMsgId] = useState<string | null>(null)
  const [saveMenuMsgId, setSaveMenuMsgId] = useState<string | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<{ id: string; text: string } | null>(null)

  // Load preferences
  useEffect(() => {
    try {
      const prefs = LocalTutorStorage.loadPreferences()
      setPreferences(prefs)
      setMode(prefs.preferredMode)
      setLanguage(prefs.language as Language || 'both')
    } catch {
      // Use defaults
    }
  }, [])

  // Consume navigation context (from Ask AI buttons)
  const location = useLocation()
  const navigate = useNavigate()
  const contextSentRef = useRef(false)

  useEffect(() => {
    if (contextSentRef.current) return

    const stateContext = location.state as { prompt?: string; type?: string; title?: string } | null
    const params = new URLSearchParams(location.search)
    const queryPrompt = params.get('q')

    const prompt = stateContext?.prompt || queryPrompt
    if (!prompt) return

    contextSentRef.current = true

    const timer = setTimeout(async () => {
      try {
        const prefs = LocalTutorStorage.loadPreferences()
        const mode = prefs.preferredMode || 'ielts-tutor'

        const now = new Date().toISOString()
        const sessionId = generateId()
        const newSession: ChatSession = {
          id: sessionId,
          mode,
          language: prefs.language || 'both',
          topic: stateContext?.type || 'general',
          messageCount: 0,
          createdAt: now,
          updatedAt: now,
        }
        await LocalTutorStorage.createSession(newSession)
        setSession(newSession)
        setMessages([])

        await new Promise(r => setTimeout(r, 100))

        const userMsg: ChatMessage = {
          id: generateId(),
          sessionId,
          role: 'user',
          content: prompt,
          mode,
          createdAt: now,
        }
        await LocalTutorStorage.addMessage(userMsg)
        setMessages([userMsg])

        setTimeout(async () => {
          setInput(prompt)
          await new Promise(r => setTimeout(r, 50))
          sendMessage(prompt)
        }, 200)
      } catch {
        // Context auto-send failed silently
      }
    }, 300)

    navigate(location.pathname, { replace: true })

    return () => clearTimeout(timer)
  }, [])

  // Initialize topic context manager
  useEffect(() => {
    topicContextManager.initialize().then(() => {
      const topic = topicContextManager.getCurrentTopicLabel()
      if (topic) setCurrentTopicName(topic)
    })
  }, [])

  // Initialize context manager and load preview for permission dialog
  useEffect(() => {
    contextManager.initialize().then(async () => {
      if (!contextManager.hasPermission()) {
        const items = await contextManager.getContextPreview()
        if (items.length > 0) {
          setContextPreviewItems(items)
          setShowContextDialog(true)
        }
      }
    })
  }, [])

  // Detect daily check-in need when mode is friendly-chat
  useEffect(() => {
    if (mode === 'friendly-chat' && !hasCheckedInToday()) {
      setShowCheckInPrompt(true)
    } else {
      setShowCheckInPrompt(false)
    }
    setFriendCorrections([])
    // Reset teaching state on mode change
    setTeachingPhase('idle')
    setActiveLesson(null)
    setActiveCheckingQ(null)
    setActiveExercise(null)
    setExerciseResults([])
    setCurrentExerciseIndex(0)
    // Reset Socratic state on mode change
    setSocraticPhase('idle')
    setSocraticQA(null)
    setSocraticHistory([])
    setSocraticRound(0)
    // Reset Speaking Partner state on mode change
    setSpeakingPhase('idle')
    setSpeakingPart(1)
    setSpeakingQuestions([])
    setSpeakingCueCard(null)
    setCurrentSpeakingQIndex(0)
    setSpeakingFeedback(null)
    // Reset Writing Tutor state on mode change
    setWritingPhase('idle')
    setWritingTask(null)
    setWritingTaskType('task2')
    setWritingTopic('')
    setWritingFeedbackData(null)
    setWritingBrainstorming([])
    setWritingOutline(null)
    // Reset Reading/Listening state on mode change
    setRlPhase('idle')
    setRlAnalysis(null)
    setRlContent('')
  }, [mode])

  // Load or create session
  const loadOrCreateSession = useCallback(async (selectedMode: AssistantMode) => {
    try {
      setError(null)
      const sessions = await LocalTutorStorage.getAllSessions()
      const existing = sessions.find(s => s.mode === selectedMode)
      if (existing) {
        setSession(existing)
        const msgs = await LocalTutorStorage.getMessagesBySession(existing.id)
        setMessages(msgs)
      } else {
        const now = new Date().toISOString()
        const newSession: ChatSession = {
          id: generateId(),
          mode: selectedMode,
          title: `${selectedMode === 'friendly-chat' ? 'Chat' : selectedMode === 'ielts-tutor' ? 'IELTS Tutor' : selectedMode === 'speaking-partner' ? 'Speaking Practice' : selectedMode === 'writing-coach' ? 'Writing Help' : selectedMode === 'grammar-teacher' ? 'Grammar Lesson' : selectedMode === 'vocabulary-coach' ? 'Vocabulary Study' : selectedMode === 'reading-explainer' ? 'Reading Discussion' : selectedMode === 'listening-coach' ? 'Listening Practice' : selectedMode === 'study-planner' ? 'Study Plan' : selectedMode === 'socratic-tutor' ? 'Socratic Learning' : 'Motivation'} Session`,
          messageCount: 0,
          lastMessageAt: now,
          isPinned: false,
          tags: [],
          createdAt: now,
          updatedAt: now,
        }
        await LocalTutorStorage.createSession(newSession)
        setSession({ ...newSession, messageCount: 0 })
        setMessages([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat session')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadOrCreateSession(mode)
  }, [mode, loadOrCreateSession])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Save preferences when language changes
  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang)
    const updated = LocalTutorStorage.patchPreferences({
      language: lang,
      useVietnamese: lang === 'vietnamese' || lang === 'both',
    })
    setPreferences(updated)
  }, [])

  // Change mode
  const handleModeChange = useCallback((newMode: AssistantMode) => {
    setMode(newMode)
    LocalTutorStorage.patchPreferences({ preferredMode: newMode })
  }, [])

  // Send message
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || !session || sending) return

    setSending(true)
    setInput('')

    try {
      const now = new Date().toISOString()

      const userMsg: ChatMessage = {
        id: generateId(),
        sessionId: session.id,
        role: 'user',
        content: text,
        mode: mode,
        createdAt: now,
      }

      await LocalTutorStorage.addMessage(userMsg)
      setMessages(prev => [...prev, userMsg])

      // Update topic context from user message
      const detectedTopic = await topicContextManager.updateTopicFromMessage(text)
      const topicLabel = topicContextManager.getCurrentTopicLabel()
      if (topicLabel) setCurrentTopicName(topicLabel)

      // Update session topic if detected
      if (detectedTopic !== 'general' && session.topic !== detectedTopic) {
        await LocalTutorStorage.updateSession(session.id, { topic: detectedTopic })
        setSession(prev => prev ? { ...prev, topic: detectedTopic } : prev)
      }

      // Update session title if first message
      if (session.messageCount === 0) {
        const title = generateTitle(text)
        await LocalTutorStorage.updateSession(session.id, { title })
        setSession(prev => prev ? { ...prev, title } : prev)
      }

      // Generate AI response — handle teaching flow, friend mode, or normal
      let responseText = ''

      // Teaching flow: user answering a checking question
      if (teachingPhase === 'checking' && activeCheckingQ) {
        const { isCorrect, feedback } = await evaluateCheckingAnswerAI(activeCheckingQ, text, activeLesson?.topic || '')
        responseText = feedback

        if (!isCorrect && activeLesson) {
          try {
            const memory = await LocalTutorStorage.loadMemory()
            const existing = memory.repeatedMistakePatterns.find(p =>
              p.pattern.toLowerCase().includes(activeLesson.topic)
            )
            if (existing) {
              existing.examples.push(`Incorrect answer on ${activeLesson.topic}`)
            } else {
              memory.repeatedMistakePatterns.push({
                pattern: activeLesson.topic,
                examples: [`Needs review on ${activeLesson.topic}`],
                skill: activeLesson.type === 'grammar' ? 'grammar' : 'vocabulary',
                suggestion: `Review the ${activeLesson.title} lesson again.`,
              })
            }
            await LocalTutorStorage.saveMemory(memory)
          } catch {
            // Silently fail
          }
        }

        if (activeLesson && activeLesson.exercises.length > 0) {
          setTeachingPhase('exercise')
          setCurrentExerciseIndex(0)
          setActiveCheckingQ(null)
          setActiveExercise(activeLesson.exercises[0])
        } else {
          setTeachingPhase('idle')
          setActiveLesson(null)
          setActiveCheckingQ(null)
        }
      }
      // Teaching flow: user answering an exercise
      else if (teachingPhase === 'exercise' && activeExercise) {
        const result = await evaluateExerciseAnswerAI(activeExercise, text)
        responseText = result.feedback

        const newResults = [...exerciseResults, {
          questionId: activeExercise.id,
          userAnswer: text,
          isCorrect: result.isCorrect,
          feedback: result.feedback,
        }]
        setExerciseResults(newResults)

        if (activeLesson && currentExerciseIndex < activeLesson.exercises.length - 1) {
          const nextIdx = currentExerciseIndex + 1
          setCurrentExerciseIndex(nextIdx)
          setActiveExercise(activeLesson.exercises[nextIdx])
        } else {
          // All exercises complete — generate summary
          setTeachingPhase('feedback')
          setActiveExercise(null)

          const summaryText = generateFeedbackMessage(activeLesson!, newResults, language)
          const summaryMsg: ChatMessage = {
            id: generateId(),
            sessionId: session.id,
            role: 'assistant',
            content: summaryText,
            mode: mode,
            metadata: {
              suggestedActions: ['teach-me', 'give-examples', 'quiz-me', 'practice-with-me'],
            },
            createdAt: new Date(Date.now() + 150).toISOString(),
          }
          await LocalTutorStorage.addMessage(summaryMsg)
          setMessages(prev => [...prev, summaryMsg])

          setTeachingPhase('idle')
          setActiveLesson(null)
          setExerciseResults([])
          setCurrentExerciseIndex(0)
        }
      }
      // Start new grammar lesson
      else if (mode === 'grammar-teacher' && teachingPhase === 'idle') {
        const contextStr = contextManager.hasPermission()
          ? await contextManager.getFormattedContextString()
          : ''
        const detectedGrammar = detectLessonFromMessage(text, 'grammar')
        if (detectedGrammar) {
          try {
            const lessonData = await aiGenerateLesson({ topic: detectedGrammar.lesson.topic, type: 'grammar', language })
            const lesson: TeachingLesson = {
              id: lessonData.title.toLowerCase().replace(/\s+/g, '-'),
              type: 'grammar',
              topic: detectedGrammar.lesson.topic,
              title: lessonData.title,
              level: 'intermediate',
              explanation: lessonData.explanation,
              rules: lessonData.rules,
              examples: lessonData.examples,
              checkingQuestion: lessonData.checkingQuestion,
              exercises: lessonData.exercises,
              summary: lessonData.summary,
              nextTopic: lessonData.nextTopic,
              commonMistakes: lessonData.commonMistakes,
            }
            responseText = generateLessonText(lesson, language)
            setActiveLesson(lesson)
            setActiveCheckingQ(lesson.checkingQuestion)
            setTeachingPhase('checking')
          } catch {
            responseText = await aiGenerateResponse({ userMessage: text, mode, language, context: contextStr })
          }
        } else {
          responseText = await aiGenerateResponse({ userMessage: text, mode, language, context: contextStr })
        }
      }
      // Start new vocabulary lesson
      else if (mode === 'vocabulary-coach' && teachingPhase === 'idle') {
        const contextStr = contextManager.hasPermission()
          ? await contextManager.getFormattedContextString()
          : ''
        const detectedVocab = detectLessonFromMessage(text, 'vocabulary')
        if (detectedVocab) {
          try {
            const lessonData = await aiGenerateLesson({ topic: detectedVocab.lesson.topic, type: 'vocabulary', language })
            const lesson: TeachingLesson = {
              id: lessonData.title.toLowerCase().replace(/\s+/g, '-'),
              type: 'vocabulary',
              topic: detectedVocab.lesson.topic,
              title: lessonData.title,
              level: 'intermediate',
              explanation: lessonData.explanation,
              rules: lessonData.rules,
              examples: lessonData.examples,
              checkingQuestion: lessonData.checkingQuestion,
              exercises: lessonData.exercises,
              summary: lessonData.summary,
              nextTopic: lessonData.nextTopic,
              commonMistakes: lessonData.commonMistakes,
            }
            responseText = generateLessonText(lesson, language)
            setActiveLesson(lesson)
            setActiveCheckingQ(lesson.checkingQuestion)
            setTeachingPhase('checking')
          } catch {
            responseText = await aiGenerateResponse({ userMessage: text, mode, language, context: contextStr })
          }
        } else {
          responseText = await aiGenerateResponse({ userMessage: text, mode, language, context: contextStr })
        }
      }
      // Socratic flow: user answering a Socratic question
      else if (mode === 'socratic-tutor' && socraticPhase === 'questioning' && socraticQA) {
        const previousQA = socraticHistory.length > 0
          ? socraticHistory.map(qa => ({ question: qa.question, answer: qa.userAnswer || '', type: qa.type }))
          : [{ question: socraticQA.question, answer: text, type: socraticQA.type }]

        const result = await aiGenerateSocraticQuestion({
          userMessage: text,
          topic: detectTopic(text),
          round: socraticRound,
          previousQA,
          language,
        })
        const updatedQA: SocraticQA = { ...socraticQA, userAnswer: text, feedback: result.feedback }
        setSocraticHistory(prev => [...prev, updatedQA])

        if (result.wrapUp) {
          responseText = result.wrapUp
          setSocraticPhase('feedback')
          setSocraticQA(null)
          setSocraticRound(0)
        } else if (result.question) {
          const nextQA: SocraticQA = {
            id: generateId(),
            type: result.type as SocraticQuestionType,
            question: result.question,
            hint: result.hint,
          }
          responseText = nextQA.question
          setSocraticQA(nextQA)
          setSocraticRound(prev => prev + 1)
        } else {
          responseText = "Great thinking! Would you like to explore another topic or ask me something else? 🎯"
          setSocraticPhase('idle')
          setSocraticQA(null)
          setSocraticRound(0)
        }
      }
      // Socratic flow: starting a new Socratic conversation
      else if (mode === 'socratic-tutor' && socraticPhase === 'idle') {
        const result = await aiGenerateSocraticQuestion({
          userMessage: text,
          topic: detectTopic(text),
          round: 0,
          language,
        })
        const intro = "Let's explore this together using the Socratic method — I'll guide you with questions so you discover the answer yourself! 🧠\n\n"
        const question = result.question || "What do you already know about this topic? Try explaining it in your own words! 💡"
        responseText = intro + question
        setSocraticQA({
          id: generateId(),
          type: (result.type || 'justify') as SocraticQuestionType,
          question: question,
          hint: result.hint,
        })
        setSocraticPhase('questioning')
        setSocraticRound(1)
        setSocraticHistory([])
      }
      // Speaking Partner flow
      else if (mode === 'speaking-partner' && speakingPhase === 'idle') {
        responseText = getPartSelectorMessage()
        setSpeakingPhase('select-part')
      }
      else if (mode === 'speaking-partner' && speakingPhase === 'select-part') {
        const choice = detectPartChoice(text)
        if (choice) {
          setSpeakingPart(choice)
          if (choice === 1) {
            const qs = await getRandomPart1Questions(3)
            setSpeakingQuestions(qs)
            setCurrentSpeakingQIndex(0)
            setSpeakingPhase('part1')
            responseText = generateSpeakingStartMessage(1, qs)
          } else if (choice === 2) {
            const card = await getRandomCueCard()
            setSpeakingCueCard(card)
            setSpeakingPhase('part2')
            responseText = generateSpeakingStartMessage(2, undefined, card)
          } else {
            const qs = await getRandomPart3Questions(2)
            setSpeakingQuestions(qs)
            setCurrentSpeakingQIndex(0)
            setSpeakingPhase('part3')
            responseText = generateSpeakingStartMessage(3, qs)
          }
        } else {
          responseText = "I didn't catch that. Please type **1**, **2**, or **3** to choose a part, or use the buttons above!"
        }
      }
      else if (mode === 'speaking-partner' && (speakingPhase === 'part1' || speakingPhase === 'part2' || speakingPhase === 'part3')) {
        const part = speakingPart
        const feedback = await generateSpeakingFeedback(text, part)
        setSpeakingFeedback(feedback)
        setSpeakingPhase('feedback')
        await saveSpeakingMistakesToNotebook(text, feedback.corrections, part)
        responseText = formatFeedbackMessage(feedback, language, part)
      }
      else if (mode === 'speaking-partner' && speakingPhase === 'feedback') {
        const lower = text.trim().toLowerCase()
        if (isNextQuestionRequest(text) || /\b(next|continue|another|more)\b/.test(lower)) {
          if (speakingPart === 1) {
            const qs = await getRandomPart1Questions(1)
            setSpeakingQuestions(qs)
            setCurrentSpeakingQIndex(0)
            setSpeakingPhase('part1')
            setSpeakingFeedback(null)
            responseText = qs[0].question
          } else if (speakingPart === 2) {
            const card = await getRandomCueCard()
            setSpeakingCueCard(card)
            setSpeakingPhase('part2')
            setSpeakingFeedback(null)
            responseText = generateSpeakingStartMessage(2, undefined, card)
          } else {
            const qs = await getRandomPart3Questions(1)
            setSpeakingQuestions(qs)
            setCurrentSpeakingQIndex(0)
            setSpeakingPhase('part3')
            setSpeakingFeedback(null)
            responseText = qs[0].question
          }
        } else if (detectPartChoice(text)) {
          const choice = detectPartChoice(text)!
          setSpeakingPart(choice)
          setSpeakingFeedback(null)
          if (choice === 1) {
            const qs = await getRandomPart1Questions(3)
            setSpeakingQuestions(qs)
            setCurrentSpeakingQIndex(0)
            setSpeakingPhase('part1')
            responseText = generateSpeakingStartMessage(1, qs)
          } else if (choice === 2) {
            const card = await getRandomCueCard()
            setSpeakingCueCard(card)
            setSpeakingPhase('part2')
            responseText = generateSpeakingStartMessage(2, undefined, card)
          } else {
            const qs = await getRandomPart3Questions(2)
            setSpeakingQuestions(qs)
            setCurrentSpeakingQIndex(0)
            setSpeakingPhase('part3')
            responseText = generateSpeakingStartMessage(3, qs)
          }
        } else {
          responseText = "Type **'next'** for another question, or **1**, **2**, or **3** to switch parts!"
        }
      }
      // Writing Coach flow
      else if (mode === 'writing-coach' && writingPhase === 'idle') {
        responseText = getTaskSelectorMessage()
        setWritingPhase('select-task')
      }
      else if (mode === 'writing-coach' && writingPhase === 'select-task') {
        const detectedTask = detectWritingTaskChoice(text)
        if (detectedTask) {
          setWritingTask(detectedTask)

          if (detectedTask === 'brainstorm') {
            const topic = detectWritingTopic(text) || 'general'
            setWritingTopic(topic)
            responseText = await generateBrainstorming(topic, language)
            setWritingPhase('brainstorming')
          } else if (detectedTask === 'outline') {
            const topic = detectWritingTopic(text) || 'education'
            const taskType = detectWritingTaskType(text)
            setWritingTopic(topic)
            setWritingTaskType(taskType)
            responseText = await generateOutline(topic, taskType, language)
            setWritingPhase('outlining')
          } else if (detectedTask === 'thesis') {
            const topic = detectWritingTopic(text) || ''
            setWritingTopic(topic)
            setWritingPhase('thesis')
            responseText = 'Please share your current thesis statement, and I\'ll help you improve it!\n\nWhat is the topic of your essay?'
          } else if (detectedTask === 'paragraph') {
            setWritingPhase('paragraph')
            responseText = 'Please share a paragraph from your essay, and I\'ll analyze its structure!\n\nPaste a paragraph below and I\'ll check its length, topic sentence, examples, and linking words.'
          } else if (detectedTask === 'check-draft') {
            const topic = detectWritingTopic(text) || ''
            const taskType = detectWritingTaskType(text)
            setWritingTopic(topic)
            setWritingTaskType(taskType)
            setWritingPhase('draft-input')
            responseText = 'Great! Paste your essay draft below and I\'ll give you:\n\n\u2022 Band score estimate (Task Achievement, Coherence, Vocabulary, Grammar)\n\u2022 Strengths & weaknesses\n\u2022 Grammar corrections\n\u2022 Vocabulary suggestions\n\u2022 Linking word recommendations\n\u2022 An improved version!\n\nSend your draft when you\'re ready!'
          } else if (detectedTask === 'rewrite') {
            setWritingPhase('rewrite')
            responseText = 'Please paste the text you\'d like me to rewrite, and tell me your target band score (e.g., "Band 7").\n\nI\'ll upgrade vocabulary, add complex structures, and improve overall quality to match your target level.'
          }
        } else {
          if (/\b(brainstorm|idea|suggest|argument|point)\b/i.test(text)) {
            const topic = detectWritingTopic(text) || 'general'
            setWritingTopic(topic)
            responseText = await generateBrainstorming(topic, language)
            setWritingPhase('brainstorming')
            setWritingTask('brainstorm')
          } else if (/\b(outline|structure|organize|arrange)\b/i.test(text)) {
            const topic = detectWritingTopic(text) || 'education'
            const taskType = detectWritingTaskType(text)
            setWritingTopic(topic)
            setWritingTaskType(taskType)
            responseText = await generateOutline(topic, taskType, language)
            setWritingPhase('outlining')
            setWritingTask('outline')
          } else {
            responseText = "I didn't catch which task you'd like to do. Please choose from the options above, or type a number (1-6)!"
          }
        }
      }
      else if (mode === 'writing-coach' && writingPhase === 'brainstorming') {
        if (text.trim().toLowerCase() === 'next' || /\b(outline|structure)\b/i.test(text)) {
          const taskType = detectWritingTaskType(text)
          const topic = writingTopic || detectWritingTopic(text) || 'education'
          setWritingTaskType(taskType)
          responseText = await generateOutline(topic, taskType, language)
          setWritingPhase('outlining')
          setWritingTask('outline')
        } else {
          responseText = `Great choice! Would you like me to create an **outline** based on these ideas, or would you like to explore a different topic?\n\nType the topic name for more brainstorming, or type **"outline"** to create an essay structure!`
        }
      }
      else if (mode === 'writing-coach' && writingPhase === 'outlining') {
        const lower = text.trim().toLowerCase()
        if (lower === 'next' || /\b(write|draft|check|feedback|go ahead)\b/i.test(lower)) {
          setWritingPhase('draft-input')
          responseText = 'Great! Please write your draft based on this outline and send it to me. I\'ll give you detailed feedback with a band estimate!'
        } else {
          responseText = `Would you like to **write a draft** based on this outline, or would you like to explore a different topic?\n\nType **"draft"** to start writing, or type a new topic to get a different outline!`
        }
      }
      else if (mode === 'writing-coach' && writingPhase === 'thesis') {
        if (!writingTopic) {
          const topic = detectWritingTopic(text)
          if (topic) {
            setWritingTopic(topic)
            responseText = `Great topic: ${topic}! Now please share your current thesis statement, and I'll help you improve it.`
          } else {
            responseText = 'What topic is your essay about? For example: Education, Technology, Environment, etc.'
          }
        } else {
          responseText = await improveThesisStatement(text, writingTopic, language)
          setWritingPhase('idle')
        }
      }
      else if (mode === 'writing-coach' && writingPhase === 'paragraph') {
        responseText = await checkParagraphStructure(text, language)
        setWritingPhase('idle')
      }
      else if (mode === 'writing-coach' && writingPhase === 'draft-input') {
        const topic = writingTopic || detectWritingTopic(text) || 'general'
        const taskType = writingTaskType || detectWritingTaskType(text)
        responseText = await generateWritingFeedback(text, taskType, topic, language)
        setWritingPhase('feedback')
      }
      else if (mode === 'writing-coach' && writingPhase === 'feedback') {
        const lower = text.trim().toLowerCase()
        if (isNextQuestionRequest(text) || /\b(next|another|more)\b/.test(lower)) {
          setWritingPhase('select-task')
          setWritingTask(null)
          setWritingFeedbackData(null)
          responseText = getTaskSelectorMessage()
        } else if (/\b(check|draft|submit)\b/i.test(lower)) {
          setWritingPhase('draft-input')
          setWritingFeedbackData(null)
          responseText = 'Send me your new draft and I\'ll give you fresh feedback!'
        } else if (/\b(rewrite|improve|upgrade)\b/i.test(lower)) {
          setWritingPhase('rewrite')
          responseText = 'What target band would you like to reach? Tell me your target (e.g., "Band 7") and I\'ll rewrite your text!'
        } else {
          responseText = "What would you like to do next?\n\n**\"next\"** \u2014 Choose a new task\n**\"draft\"** \u2014 Check another draft\n**\"rewrite\"** \u2014 Improve your text to a higher band"
        }
      }
      else if (mode === 'writing-coach' && writingPhase === 'rewrite') {
        const bandMatch = text.match(/\b(\d+(?:\.\d+)?)\b/)
        if (bandMatch) {
          const requestedBand = parseFloat(bandMatch[1])
          if (requestedBand >= 3 && requestedBand <= 9) {
            setWritingTargetBand(requestedBand)
            setWritingPhase('draft-input')
            responseText = `I'll work towards Band ${requestedBand}. Please paste the text you'd like me to rewrite!`
          } else {
            responseText = 'Please enter a valid band score between 4.0 and 9.0.'
          }
        } else if (text.length > 20) {
          responseText = await generateImprovedVersion(text, writingTargetBand, language)
          setWritingPhase('idle')
        } else {
          responseText = 'Please tell me your target band score (e.g., "Band 7"), or paste the text you want rewritten!'
        }
      }
      // Reading/Listening Tutor flow
      else if ((mode === 'reading-explainer' || mode === 'listening-coach') && rlPhase === 'idle') {
        const tutorType = mode === 'listening-coach' ? 'listening' : 'reading'
        responseText = getWelcomeMessage(tutorType)
        setRlPhase('content-input')
      }
      else if ((mode === 'reading-explainer' || mode === 'listening-coach') && rlPhase === 'content-input') {
        if (detectContentSubmission(text)) {
          const analysis = analyzeContent(text)
          setRlAnalysis(analysis)
          setRlContent(text)
          setRlPhase('action-select')
          responseText = getActionSelectorMessage(analysis)
        } else {
          responseText = "I'd love to help! But please share more content — at least a paragraph or a few sentences — so I can analyze it properly. You can paste an article, a transcript, or any English text you'd like to discuss! 📝"
        }
      }
      else if ((mode === 'reading-explainer' || mode === 'listening-coach') && rlPhase === 'action-select') {
        if (isBackRequest(text) || /^(new|reset|different|another)\b/.test(text.trim().toLowerCase())) {
          setRlPhase('content-input')
          setRlAnalysis(null)
          setRlContent('')
          responseText = "Sure! Share another piece of content you'd like to discuss. Paste the text below!"
        } else if (rlAnalysis) {
          const action = detectActionChoice(text)
          if (action === 'explain') {
            responseText = "Please quote the word, phrase, or sentence you'd like me to explain (use \"quotes\" around it), or tell me what part you need help understanding!\n\nFor example: \"What does 'sustainable' mean?\" or \"I don't understand the second paragraph.\""
            setRlPhase('explaining')
          } else if (action === 'summarize') {
            responseText = await aiGenerateSummary({ text: rlContent, analysis: rlAnalysis, language })
          } else if (action === 'vocabulary') {
            responseText = await aiGenerateVocabularyListFn({ text: rlContent, analysis: rlAnalysis, language })
          } else if (action === 'comprehension') {
            responseText = await aiGenerateComprehensionQuestionsFn({ text: rlContent, analysis: rlAnalysis, language })
          } else if (action === 'opinion') {
            responseText = await aiGenerateOpinionQuestions({ text: rlContent, analysis: rlAnalysis, language })
          } else if (action === 'exercises') {
            responseText = await aiGenerateExercisesFn({ text: rlContent, analysis: rlAnalysis, language })
          } else if (action === 'ielts-connection') {
            responseText = await aiGenerateIeltsConnection({ text: rlContent, analysis: rlAnalysis, language })
          } else {
            responseText = "You can choose an action from the buttons above, or type the action name (e.g., 'summarize', 'vocabulary', 'exercises'). Type **'back'** to start with different content!\n\nAvailable actions:\n" +
              READING_ACTIONS.map((a, i) => `${i + 1}. ${a.label} — ${a.description}`).join('\n')
          }
        }
      }
      else if ((mode === 'reading-explainer' || mode === 'listening-coach') && rlPhase === 'explaining') {
        if (isBackRequest(text)) {
          setRlPhase('action-select')
          responseText = rlAnalysis ? getActionSelectorMessage(rlAnalysis) : "What content would you like to explore?"
        } else if (rlAnalysis) {
          responseText = await aiGenerateExplanation({ content: rlContent, query: text, analysis: rlAnalysis, language })
          setRlPhase('action-select')
        }
      }
      // Normal response flow (friendly chat, other modes)
      else {
        const contextStr = contextManager.hasPermission()
          ? await contextManager.getFormattedContextString()
          : ''

        if (mode === 'friendly-chat') {
          const correctionsPromise = aiGenerateGentleCorrection({ userMessage: text, language })
          const baseResponsePromise = aiGenerateResponse({ userMessage: text, mode, language, context: contextStr })

          let finalResponse = await baseResponsePromise

          const checkInRequired = !hasCheckedInToday()
          if (checkInRequired) {
            const checkInMsg = await aiGenerateDailyCheckIn({ language })
            finalResponse = checkInMsg + '\n\n' + finalResponse
            markCheckedInToday()
            setShowCheckInPrompt(false)
          }

          const correctionText = await correctionsPromise
          if (correctionText) {
            finalResponse += correctionText
          }

          responseText = finalResponse
        } else {
          const contextHint = await topicContextManager.getContextForPrompt(mode)
          const enrichedHint = contextStr
            ? contextHint + '\n' + contextStr
            : contextHint
          responseText = await aiGenerateResponse({ userMessage: text, mode, language, context: enrichedHint })
        }
      }

      const aiMsg: ChatMessage = {
        id: generateId(),
        sessionId: session.id,
        role: 'assistant',
        content: responseText,
        mode: mode,
        metadata: {
          suggestedActions: ['teach-me', 'give-examples', 'quiz-me', 'practice-with-me'],
        },
        createdAt: new Date(Date.now() + 100).toISOString(),
      }

      await LocalTutorStorage.addMessage(aiMsg)
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }, [input, session, sending, mode, language, teachingPhase, activeCheckingQ, activeExercise, activeLesson, exerciseResults, currentExerciseIndex, socraticPhase, socraticQA, socraticRound, speakingPhase, speakingPart, speakingQuestions, speakingCueCard, currentSpeakingQIndex, speakingFeedback, writingPhase, writingTask, writingTaskType, writingTopic, writingFeedbackData, writingTargetBand, writingBrainstorming, writingOutline, rlPhase, rlAnalysis, rlContent])

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  // Quick actions
  const handleQuickAction = useCallback((action: string) => {
    const prompts: Record<string, string> = {
      'teach-me': 'Please teach me something new about what we\'re discussing.',
      'quiz-me': 'Test me with a quick quiz question.',
      'correct-english': 'Please check my English and correct any mistakes gently.',
      'explain-simply': 'Can you explain this in a simpler way?',
      'give-examples': 'Can you give me more examples?',
      'make-exercise': 'Turn this into a small exercise for me.',
      'remind-later': 'Please remind me to review this later.',
      'practice-with-me': 'Let\'s practice this together.',
    }
    setInput(prompts[action] || action)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // ── Proactive Suggestions ──────────────────────────────────

  const loadSuggestions = useCallback(async () => {
    if (!preferences.proactiveSuggestions) return
    setSuggestionsLoading(true)
    try {
      const pending = await suggestionEngine.getPendingSuggestions()
      setSuggestions(pending.filter(s => !s.isAccepted && !s.isDismissed))
    } catch {
      // Silently fail
    } finally {
      setSuggestionsLoading(false)
    }
  }, [preferences.proactiveSuggestions])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  const handleAcceptSuggestion = useCallback(async (id: string, action?: string) => {
    await suggestionEngine.acceptSuggestion(id)
    setSuggestions(prev => prev.filter(s => s.id !== id))
    if (action) {
      handleQuickAction(action)
    }
  }, [handleQuickAction])

  const handleDismissSuggestion = useCallback(async (id: string) => {
    await suggestionEngine.dismissSuggestion(id)
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }, [])

  // ── Memory Panel ──────────────────────────────────────────

  const openMemoryPanel = useCallback(async () => {
    setShowMemoryPanel(true)
    setMemoryLoading(true)
    try {
      const [stats, data] = await Promise.all([
        MemoryService.getMemoryStats(),
        MemoryService.getMemory(),
      ])
      setMemoryStats(stats)
      setMemoryData(data)
    } catch {
      setMemoryStats(null)
      setMemoryData(null)
    } finally {
      setMemoryLoading(false)
    }
  }, [])

  const closeMemoryPanel = useCallback(() => {
    setShowMemoryPanel(false)
    setConfirmDelete(null)
  }, [])

  const handleExportMemory = useCallback(async () => {
    setMemoryExporting(true)
    try {
      const json = await MemoryService.exportMemoryAsJson()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tutor-memory-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export memory')
    } finally {
      setMemoryExporting(false)
    }
  }, [])

  const handleDeleteMemory = useCallback(async () => {
    try {
      await MemoryService.clearMemoryData()
      setMemoryData(null)
      setMemoryStats(prev => prev ? {
        ...prev,
        weakPointCount: 0,
        mistakePatternCount: 0,
        feedbackSummaryCount: 0,
        goalCount: 0,
        acceptedRecommendations: 0,
        learningStreak: 0,
      } : null)
      setConfirmDelete(null)
    } catch {
      setError('Failed to clear memory')
    }
  }, [])

  const handleDeleteAllMemory = useCallback(async () => {
    try {
      await MemoryService.deleteAllMemory()
      setMemoryData(null)
      setMemoryStats(null)
      setConfirmDelete(null)
      setShowMemoryPanel(false)
    } catch {
      setError('Failed to delete all memory')
    }
  }, [])

  const handleRemoveWeakPoint = useCallback(async (index: number) => {
    await MemoryService.removeWeakPoint(index)
    const updated = await MemoryService.getMemory()
    setMemoryData(updated)
    const stats = await MemoryService.getMemoryStats()
    setMemoryStats(stats)
  }, [])

  const handleRemoveMistakePattern = useCallback(async (index: number) => {
    await MemoryService.removeMistakePattern(index)
    const updated = await MemoryService.getMemory()
    setMemoryData(updated)
    const stats = await MemoryService.getMemoryStats()
    setMemoryStats(stats)
  }, [])

  const handleRemoveGoal = useCallback(async (goalId: string) => {
    await MemoryService.removeGoal(goalId)
    const updated = await MemoryService.getMemory()
    setMemoryData(updated)
    const stats = await MemoryService.getMemoryStats()
    setMemoryStats(stats)
  }, [])

  // Clear chat
  const clearChat = useCallback(async () => {
    if (!session) return
    try {
      await LocalTutorStorage.deleteSessionMessages(session.id)
      setMessages([])
      setTeachingPhase('idle')
      setActiveLesson(null)
      setActiveCheckingQ(null)
      setActiveExercise(null)
      setExerciseResults([])
      setCurrentExerciseIndex(0)
      setSpeakingPhase('idle')
      setSpeakingPart(1)
      setSpeakingQuestions([])
      setSpeakingCueCard(null)
      setCurrentSpeakingQIndex(0)
      setSpeakingFeedback(null)
      setWritingPhase('idle')
      setWritingTask(null)
      setWritingTaskType('task2')
      setWritingTopic('')
      setWritingFeedbackData(null)
      setWritingBrainstorming([])
      setWritingOutline(null)
      setRlPhase('idle')
      setRlAnalysis(null)
      setRlContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear chat')
    }
  }, [session])

  // Save AI answer as note or learning item
  const handleSaveAnswer = useCallback(async (msg: ChatMessage, type: 'note' | 'vocabulary' | 'grammar' | 'exercise' | 'mistake') => {
    setSavingMsgId(msg.id)
    try {
      const now = new Date().toISOString()
      const entry = {
        id: crypto.randomUUID(),
        text: msg.content,
        category: type === 'vocabulary' ? 'vocabulary' : type === 'grammar' ? 'grammar' : type === 'exercise' ? 'reading' : type === 'mistake' ? 'mistake' : 'reading',
        topic: currentTopicName || '',
        skill: (type === 'vocabulary' ? 'vocabulary' : type === 'grammar' ? 'grammar' : type === 'exercise' ? 'reading' : type === 'mistake' ? 'speaking' : 'general') as any,
        difficulty: '' as const,
        tags: [mode, type],
        personalNote: `Saved from AI Tutor (${mode})`,
        pageTitle: '',
        pageUrl: '',
        status: 'new' as const,
        createdAt: now,
        updatedAt: now,
      }

      const existing = JSON.parse(localStorage.getItem('savedItems') || '[]')
      existing.unshift(entry)
      localStorage.setItem('savedItems', JSON.stringify(existing))

      setSaveFeedback({ id: msg.id, text: `Saved as ${type}` })
      setTimeout(() => setSaveFeedback(null), 2500)
    } catch {
      setSaveFeedback({ id: msg.id, text: 'Failed to save' })
      setTimeout(() => setSaveFeedback(null), 2500)
    } finally {
      setSavingMsgId(null)
      setSaveMenuMsgId(null)
    }
  }, [currentTopicName, mode])

  // Close save menu on click outside
  useEffect(() => {
    if (!saveMenuMsgId) return
    const handler = () => setSaveMenuMsgId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [saveMenuMsgId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}>
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} role="status" aria-label="Loading" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Loading your tutor...</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>Preparing your personalized learning assistant</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-danger-light)' }}>
            <IconAlertCircle size={28} style={{ color: 'var(--color-danger)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>Failed to load chat</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); loadOrCreateSession(mode) }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <IconRefresh size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const quickActions: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'teach-me', label: 'Teach Me', icon: <IconVocabulary size={12} /> },
    { key: 'quiz-me', label: 'Quiz Me', icon: <IconCheckCircle size={12} /> },
    { key: 'correct-english', label: 'Correct Me', icon: <IconEdit size={12} /> },
    { key: 'explain-simply', label: 'Explain Simply', icon: <IconExplain size={12} /> },
    { key: 'give-examples', label: 'Examples', icon: <IconBookText size={12} /> },
    { key: 'make-exercise', label: 'Exercise', icon: <IconEdit size={12} /> },
    { key: 'remind-later', label: 'Remind', icon: <IconTimer size={12} /> },
    { key: 'practice-with-me', label: 'Practice', icon: <IconTarget size={12} /> },
  ]

  return (
    <VoiceProvider>
    <PageContainer width="wide" className="pt-4 sm:pt-6">
      <PageHeader
        icon={<IconAITutor size={22} />}
        title="AI Tutor"
        description="Your IELTS learning companion"
        actions={
          <div className="flex items-center gap-1.5">
            <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              {(['english', 'vietnamese', 'both'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className="px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                  style={{
                    backgroundColor: language === lang ? 'var(--color-primary)' : 'transparent',
                    color: language === lang ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {lang === 'english' ? 'EN' : lang === 'vietnamese' ? 'VI' : 'EN/VI'}
                </button>
              ))}
            </div>
            <button
              onClick={openMemoryPanel}
              className="rounded-lg p-2 text-sm transition-colors hover:bg-[var(--color-surface-alt)]"
              style={{ color: 'var(--color-muted)' }}
              aria-label="Assistant memory"
            >
              <IconFolderOpen size={16} />
            </button>
            <button
              onClick={clearChat}
              className="rounded-lg p-2 text-sm transition-colors hover:bg-[var(--color-surface-alt)]"
              style={{ color: 'var(--color-muted)' }}
              aria-label="Clear chat"
            >
              <IconDelete size={16} />
            </button>
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {currentTopicName && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <IconHash size={10} />
            {currentTopicName}
          </span>
        )}
        {mode === 'friendly-chat' && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            <IconMessageCircle size={10} />
            Friend Mode
          </span>
        )}
        {mode === 'socratic-tutor' && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-skill-reading-light)', color: 'var(--color-skill-reading)' }}>
            <IconExplain size={10} />
            Socratic Mode
          </span>
        )}
      </div>

      <ModeSelector selectedMode={mode} onModeChange={handleModeChange} disabled={sending} />

      {/* Mode description */}
      {session && session.messageCount === 0 && (
        <div className="mb-4 rounded-2xl p-5" style={{
          background: 'linear-gradient(135deg, var(--color-tutor-background), var(--color-surface))',
          border: '1px solid var(--color-tutor-border)',
        }}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}>
              <span className="flex items-center justify-center" aria-hidden="true">
                {mode === 'friendly-chat' ? <IconMessageCircle size={16} /> : mode === 'ielts-tutor' ? <IconAITutor size={16} /> : mode === 'speaking-partner' ? <IconSpeaking size={16} /> : mode === 'writing-coach' ? <IconWriting size={16} /> : mode === 'grammar-teacher' ? <IconGrammar size={16} /> : mode === 'vocabulary-coach' ? <IconVocabulary size={16} /> : mode === 'reading-explainer' ? <IconReading size={16} /> : mode === 'listening-coach' ? <IconListening size={16} /> : mode === 'study-planner' ? <IconTodayPlan size={16} /> : mode === 'socratic-tutor' ? <IconExplain size={16} /> : <IconStar size={16} />}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-tutor-text)' }}>
                {MODE_GREETINGS[mode]}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-tutor-text)', opacity: 0.8 }}>
                {MODE_PROMPT[mode]}
              </p>
              {mode === 'friendly-chat' ? (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-tutor-text)', opacity: 0.7 }}>
                  💡 I'm your learning friend! I'll chat naturally, correct your English gently, and connect everything to your IELTS journey.
                </p>
              ) : mode === 'socratic-tutor' ? (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-tutor-text)', opacity: 0.7 }}>
                  💡 I'll guide you with questions instead of giving direct answers. You'll discover insights yourself — and remember them much longer!
                </p>
              ) : (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-tutor-text)', opacity: 0.7 }}>
                  💡 Currently explaining in: <strong>{language === 'english' ? 'English' : language === 'vietnamese' ? 'Vietnamese' : 'English + Vietnamese'}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Friendly check-in prompt */}
      {mode === 'friendly-chat' && showCheckInPrompt && session && session.messageCount === 0 && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg" aria-hidden="true">☀️</span>
            <div className="flex-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <p className="font-medium text-green-800 dark:text-green-300">
                Good to see you today, friend!
              </p>
              <p className="mt-1 text-green-700 dark:text-green-400">
                How was your study yesterday? What are you planning to focus on today? Send a message and I'll check in with you! 😊
              </p>
            </div>
            <button
              onClick={() => { markCheckedInToday(); setShowCheckInPrompt(false) }}
              className="shrink-0 rounded-lg p-1 text-green-500 transition-colors hover:bg-green-100 dark:hover:bg-green-800"
              aria-label="Dismiss check-in"
            >
              <IconClose size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Context permission dialog */}
      {showContextDialog && contextPreviewItems.length > 0 && !contextManager.hasPermission() && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg" aria-hidden="true">🔒</span>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Allow AI to use your learning data?
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                The assistant can personalize responses using your saved data. Here's what will be sent:
              </p>
              <div className="mt-2 space-y-1">
                {contextPreviewItems.map(item => (
                  <div key={item.type} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="mt-0.5 shrink-0 text-blue-500">•</span>
                    <span><strong>{item.label}:</strong> {item.summary}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                Your data stays on your device and is only used to improve AI responses. You can revoke permission or delete stored memory anytime.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={async () => {
                    await contextManager.grantPermission()
                    setShowContextDialog(false)
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Allow Context
                </button>
                <button
                  onClick={() => setShowContextDialog(false)}
                  className="rounded-lg border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Not Now
                </button>
                <button
                  onClick={() => { contextManager.revokePermission(); setShowContextDialog(false) }}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-red-50"
                  style={{ color: 'var(--color-danger)' }}
                >
                  Never
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context active indicator */}
      {contextManager.hasPermission() && !showContextDialog && contextPreviewItems.length > 0 && (
        <div className="mb-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
            Context active
          </span>
          <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {contextPreviewItems.map(i => i.label).join(' · ')}
          </span>
          <button
            onClick={async () => {
              const items = await contextManager.getContextPreview()
              setContextPreviewItems(items)
              setShowContextDialog(true)
            }}
            className="ml-auto text-[10px] underline transition-colors hover:text-blue-600"
            style={{ color: 'var(--color-muted)' }}
          >
            Manage
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ backgroundColor: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="ml-2 shrink-0 rounded-lg px-2 py-1 text-xs font-medium hover:opacity-70" aria-label="Dismiss error">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div
        ref={listRef}
        className="overflow-y-auto rounded-2xl px-4 py-4 shadow-sm max-h-[60vh] min-h-[200px]"
        style={{
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center py-12 text-center px-4">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}>
              <span className="text-2xl" aria-hidden="true">
                {mode === 'friendly-chat' ? '💬' : mode === 'ielts-tutor' ? '🎓' : mode === 'speaking-partner' ? '🗣️' : mode === 'writing-coach' ? '✍️' : mode === 'grammar-teacher' ? '📚' : mode === 'vocabulary-coach' ? '📖' : mode === 'reading-explainer' ? '📰' : mode === 'listening-coach' ? '🎧' : mode === 'study-planner' ? '📅' : mode === 'socratic-tutor' ? '🧠' : '⭐'}
              </span>
            </div>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              {mode === 'friendly-chat' ? "Let's have a friendly chat!" : mode === 'socratic-tutor' ? "Let's learn through questioning!" : mode === 'speaking-partner' ? "Let's practice IELTS Speaking!" : mode === 'reading-explainer' ? "Share an article to discuss!" : mode === 'listening-coach' ? "Share a transcript to explore!" : 'Start a conversation with your AI Tutor'}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {mode === 'friendly-chat'
                ? "Chat with me like a friend! I'll gently correct your English and connect our conversation to your IELTS learning journey."
                : mode === 'socratic-tutor'
                ? "I'll guide you with thoughtful questions instead of giving direct answers. You'll discover the answer yourself — and remember it much longer!"
                : mode === 'speaking-partner'
                ? "Practice IELTS Speaking with real Part 1, Part 2, and Part 3 questions. Get corrections, suggestions, and band estimates!"
                : mode === 'reading-explainer'
                ? "Share any article, passage, or text you'd like to discuss! I'll summarize it, explain difficult parts, extract vocabulary, and connect it to IELTS."
                : mode === 'listening-coach'
                ? "Share any transcript or audio notes! I'll help you understand, extract useful language, and create comprehension questions."
                : "Ask about IELTS, grammar, vocabulary, writing, speaking, or anything about learning English. I'm here to help!"}
            </p>
            {mode === 'friendly-chat' ? (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setInput("Hey! How's your day going?")}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Start casual chat
                </button>
                <button
                  onClick={() => setInput("I studied English today. Can you correct me if I make mistakes?")}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Practice with corrections
                </button>
                <button
                  onClick={() => setInput("Tell me something interesting about English.")}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Teach me something
                </button>
                <button
                  onClick={() => setInput("What do you think about learning English through daily conversations?")}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Discuss learning
                </button>
              </div>
            ) : mode === 'socratic-tutor' ? (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setInput("What does 'sustainable' mean?")}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Ask about a word
                </button>
                <button
                  onClick={() => setInput('Can you help me improve this sentence: "I go to school yesterday"')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Correct my sentence
                </button>
                <button
                  onClick={() => setInput('How can I get Band 7 in IELTS Writing?')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  IELTS strategy
                </button>
                <button
                  onClick={() => setInput('What do you think about online education?')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Discuss a topic
                </button>
              </div>
            ) : mode === 'speaking-partner' ? (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setInput('1')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Part 1 — Short Q&A
                </button>
                <button
                  onClick={() => setInput('2')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Part 2 — Cue Card
                </button>
                <button
                  onClick={() => setInput('3')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Part 3 — Discussion
                </button>
              </div>
            ) : mode === 'reading-explainer' || mode === 'listening-coach' ? (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setInput('Climate change is one of the most pressing issues of our time. Rising global temperatures have led to more frequent extreme weather events, melting polar ice caps, and disrupted ecosystems. Many scientists believe that human activities, particularly the burning of fossil fuels, are the primary cause. Governments around the world are now working to reduce carbon emissions and transition to renewable energy sources. However, some argue that these efforts are not enough and that more radical action is needed to prevent catastrophic environmental damage.')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  📰 Sample: Climate article
                </button>
                <button
                  onClick={() => setInput('Online education has transformed the way students learn around the world. With the rise of digital platforms, students can now access high-quality courses from top universities without leaving their homes. This has made education more accessible, especially for those in remote areas. However, challenges remain — including the digital divide, lack of face-to-face interaction, and the need for self-discipline. Many educators believe that a blended approach, combining online and in-person learning, is the most effective model for the future.')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  🎓 Sample: Education text
                </button>
                <button
                  onClick={() => setInput("Paste your own article or text here for me to analyze! I'll summarize it and help you learn from it.")}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  📝 Use your own text
                </button>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setInput('Can you teach me something about English grammar?')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Teach me grammar
                </button>
                <button
                  onClick={() => setInput('Give me some vocabulary about the environment.')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Environment vocabulary
                </button>
                <button
                  onClick={() => setInput('How can I improve my IELTS Writing Task 2?')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Writing tips
                </button>
                <button
                  onClick={() => setInput('Ask me a speaking question to practice.')}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Speaking practice
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const showDate = i === 0 || formatDate(msg.createdAt) !== formatDate(messages[i - 1].createdAt)
              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center">
                      <span className="rounded-full px-3 py-1 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-muted)' }}>
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isUser && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}>
                        <IconAITutor size={14} style={{ color: 'var(--color-tutor-accent)' }} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 shadow-sm ${
                        isUser
                          ? 'rounded-2xl rounded-br-sm'
                          : 'rounded-2xl rounded-bl-sm'
                      }`}
                      style={{
                        backgroundColor: isUser ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                        borderBottomRightRadius: isUser ? '4px' : undefined,
                        borderBottomLeftRadius: !isUser ? '4px' : undefined,
                      }}
                    >
                      <div className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
                        isUser ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${
                        isUser ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-muted)]'
                      }`}>
                        {!isUser && msg.mode === 'friendly-chat' && (
                          <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                            friend
                          </span>
                        )}
                        {formatTime(msg.createdAt)}
                      </div>
                      {!isUser && msg.metadata?.suggestedActions && msg.metadata.suggestedActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-2" style={{
                          borderColor: 'var(--color-border)',
                        }}>
                          {msg.metadata.suggestedActions.map(action => {
                            const actionLabels: Record<string, string> = {
                              'teach-me': 'Teach me',
                              'give-examples': 'Examples',
                              'quiz-me': 'Quiz',
                              'practice-with-me': 'Practice',
                            }
                            return (
                              <button
                                key={action}
                                onClick={() => handleQuickAction(action)}
                                className="rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-600"
                                style={{
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-primary)',
                                }}
                              >
                                {actionLabels[action] || action}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {!isUser && (
                        <div className="relative mt-2 flex items-center gap-1 border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                          <button
                            onClick={() => setSaveMenuMsgId(saveMenuMsgId === msg.id ? null : msg.id)}
                            disabled={savingMsgId === msg.id}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50"
                            style={{ color: 'var(--color-muted)' }}
                          >
                            {savingMsgId === msg.id ? (
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <IconDownload size={12} />
                            )}
                            Save
                          </button>

                          {saveFeedback && saveFeedback.id === msg.id && (
                            <span className="text-[10px] text-green-600 dark:text-green-400 animate-pulse">
                              {saveFeedback.text}
                            </span>
                          )}

                          {saveMenuMsgId === msg.id && (
                            <div
                              className="absolute bottom-full left-0 mb-1 z-10 flex flex-col gap-0.5 rounded-lg border bg-white p-1 shadow-lg dark:bg-slate-800"
                              style={{ borderColor: 'var(--color-border)' }}
                            >
                              {[
                                { type: 'note' as const, label: 'Save as Note', icon: <IconEdit size={12} /> },
                                { type: 'vocabulary' as const, label: 'Save as Vocabulary', icon: <IconVocabularyBook size={12} /> },
                                { type: 'grammar' as const, label: 'Save as Grammar Note', icon: <IconGrammar size={12} /> },
                                { type: 'exercise' as const, label: 'Save as Exercise', icon: <IconEdit size={12} /> },
                                { type: 'mistake' as const, label: 'Save as Mistake', icon: <IconMistakes size={12} /> },
                              ].map(item => (
                                <button
                                  key={item.type}
                                  onClick={() => handleSaveAnswer(msg, item.type)}
                                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
                                  style={{ color: 'var(--color-text)' }}
                                >
                                  {item.icon}
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
            {/* Teaching mode interactive cards */}
            {teachingPhase === 'checking' && activeCheckingQ && (
              <div className="px-1 py-2">
                <CheckingQuestionCard
                  question={activeCheckingQ}
                  onSubmit={(answer) => sendMessage(answer)}
                  disabled={sending}
                />
              </div>
            )}
            {teachingPhase === 'exercise' && activeExercise && (
              <div className="px-1 py-2">
                <ExerciseCard
                  question={activeExercise}
                  questionIndex={currentExerciseIndex}
                  total={activeLesson?.exercises.length ?? 0}
                  onSubmit={(answer) => sendMessage(answer)}
                  disabled={sending}
                />
              </div>
            )}
            {/* Socratic mode interactive card */}
            {mode === 'socratic-tutor' && socraticPhase === 'questioning' && socraticQA && (
              <div className="px-1 py-2">
                <SocraticQuestionCard
                  question={socraticQA}
                  round={socraticRound}
                  maxRounds={SOCRATIC_MAX_ROUNDS}
                  onSubmit={(answer) => sendMessage(answer)}
                  disabled={sending}
                />
              </div>
            )}
            {/* Speaking Partner interactive cards */}
            {mode === 'speaking-partner' && speakingPhase === 'select-part' && (
              <div className="px-1 py-2">
                <PartSelectorCard
                  onSelect={(part) => sendMessage(part.toString())}
                  disabled={sending}
                />
              </div>
            )}
            {mode === 'speaking-partner' && speakingPhase === 'part2' && speakingCueCard && (
              <div className="px-1 py-2">
                <CueCardDisplay card={speakingCueCard} />
              </div>
            )}
            {mode === 'speaking-partner' && speakingPhase === 'feedback' && speakingFeedback && (
              <div className="px-1 py-2">
                <FeedbackSummaryCard
                  feedback={speakingFeedback}
                  part={speakingPart}
                  onNext={() => sendMessage('next')}
                  onSwitchPart={() => sendMessage('switch')}
                  disabled={sending}
                />
              </div>
            )}
            {/* Writing Coach interactive cards */}
            {mode === 'writing-coach' && writingPhase === 'select-task' && (
              <div className="px-1 py-2">
                <TaskSelectorCard
                  onSelect={(taskId) => sendMessage(taskId)}
                  disabled={sending}
                />
              </div>
            )}
            {mode === 'writing-coach' && writingPhase === 'feedback' && writingFeedbackData && (
              <div className="px-1 py-2">
                <WritingFeedbackCard
                  feedback={writingFeedbackData}
                  onNext={() => sendMessage('next')}
                  onCheckAnother={() => sendMessage('check')}
                  disabled={sending}
                />
              </div>
            )}
            {/* Reading/Listening Tutor interactive cards */}
            {(mode === 'reading-explainer' || mode === 'listening-coach') && rlPhase === 'action-select' && rlAnalysis && (
              <div className="px-1 py-2">
                <ActionSelectorCard
                  onSelect={(actionId) => sendMessage(actionId)}
                  disabled={sending}
                />
              </div>
            )}
            {sending && (
              <div
                className="flex items-end gap-2"
                style={{ animation: 'chat-message-in 0.25s ease-out' }}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}>
                  <IconAITutor size={14} style={{ color: 'var(--color-tutor-accent)' }} />
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: 'var(--color-surface-alt)',
                    borderRadius: '18px 18px 18px 4px',
                  }}
                  aria-label="AI Tutor is typing"
                  role="status"
                >
                  {[0, 160, 320].map(delay => (
                    <span
                      key={delay}
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-tutor-accent)',
                        animation: 'typing-bounce 1.4s ease-in-out infinite',
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      {/* Quick actions */}
      {messages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quickActions.map(action => (
            <button
              key={action.key}
              onClick={() => handleQuickAction(action.key)}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all hover:brightness-95 disabled:opacity-50"
              style={{
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Proactive Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            <IconExplain size={14} />
            Suggestions
          </p>
          {suggestions.slice(0, 3).map(s => (
            <div
              key={s.id}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ backgroundColor: 'var(--color-tutor-background)', border: '1px solid var(--color-tutor-border)' }}
              role="alert"
            >
              <div className="mt-0.5 shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm" style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}>
                  {s.type === 'weakness-practice' ? <IconShield size={14} /> : s.type === 'vocabulary-review' ? <IconVocabularyBook size={14} /> : s.type === 'exam-prep' ? <IconTarget size={14} /> : s.type === 'mistake-review' ? <IconEdit size={14} /> : s.type === 'article-practice' ? <IconArticle size={14} /> : <IconExplain size={14} />}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{s.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{s.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptSuggestion(s.id, s.action)}
                    className="inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-[11px] font-medium text-white transition-all hover:brightness-110"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {s.actionLabel || 'Accept'}
                  </button>
                  <button
                    onClick={() => handleDismissSuggestion(s.id)}
                    className="inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-[11px] font-medium transition-colors"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <VoiceResponseSpeaker messages={messages} />
      <RecordingIndicator />
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
      {/* Input area */}
      <div className="mt-3 mb-4 flex items-center gap-2">
        <div
          className="relative flex flex-1 items-center rounded-2xl border px-4"
          style={{
            height: '52px',
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            boxSizing: 'border-box',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI tutor anything..."
            disabled={sending}
            className="h-full w-full resize-none bg-transparent text-sm outline-none leading-[52px] disabled:opacity-50"
            style={{
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              border: 'none',
              padding: 0,
            }}
            aria-label="Message input"
          />
          <span className="absolute right-3 text-[10px]" style={{ color: 'var(--color-muted)', lineHeight: '52px' }}>
            Enter ↵
          </span>
        </div>
        <TtsToggle buttonHeight={52} />
        <VoiceButton
          onTranscript={(text) => sendMessage(text)}
          disabled={!session}
          buttonHeight={52}
          size={20}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending || !session}
          className="flex shrink-0 items-center justify-center rounded-2xl text-white shadow-sm transition-all hover:brightness-110 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            width: '52px',
            height: '52px',
            backgroundColor: 'var(--color-primary)',
          }}
          aria-label="Send message"
        >
          {sending ? (
            <IconLoading size={20} className="animate-spin" />
          ) : (
            <IconSend size={20} />
          )}
        </button>
      </div>

      {/* ── Memory Panel Modal ─────────────────────────────────── */}
      {showMemoryPanel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--color-overlay)' }}
          onClick={closeMemoryPanel}
          role="dialog"
          aria-modal="true"
          aria-label="Assistant memory management"
        >
          <div
            className="flex max-h-[85vh] w-[480px] flex-col rounded-xl border shadow-xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                  Assistant Memory
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  All data stored locally on this device
                </p>
              </div>
              <button
                onClick={closeMemoryPanel}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="Close memory panel"
              >
                <IconClose size={16} />
              </button>
            </div>

            {memoryLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} role="status" aria-label="Loading" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Stats summary */}
                {memoryStats && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
                      Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: 'Sessions', value: memoryStats.sessionCount },
                        { label: 'Messages', value: memoryStats.messageCount },
                        { label: 'Streak', value: `${memoryStats.learningStreak}d` },
                        { label: 'Weak Points', value: memoryStats.weakPointCount },
                        { label: 'Mistakes', value: memoryStats.mistakePatternCount },
                        { label: 'Goals', value: memoryStats.goalCount },
                        { label: 'Feedback', value: memoryStats.feedbackSummaryCount },
                        { label: 'Notes', value: memoryStats.savedNoteCount },
                      ].map(stat => (
                        <div
                          key={stat.label}
                          className="rounded-lg border p-2.5 text-center"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                            {stat.value}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak Points */}
                {memoryData && memoryData.weakPoints.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
                      Weak Points ({memoryData.weakPoints.length})
                    </h3>
                    <div className="space-y-1.5">
                      {memoryData.weakPoints.map((wp, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-2 rounded-lg border p-2.5"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                              {wp.skill}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                              {wp.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveWeakPoint(i)}
                            className="shrink-0 rounded p-1 transition-colors"
                            style={{ color: 'var(--color-muted)' }}
                            aria-label={`Remove weak point: ${wp.skill}`}
                          >
                <IconClose size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Mistake Patterns */}
                {memoryData && memoryData.repeatedMistakePatterns.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
                      Mistake Patterns ({memoryData.repeatedMistakePatterns.length})
                    </h3>
                    <div className="space-y-1.5">
                      {memoryData.repeatedMistakePatterns.map((mp, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-2 rounded-lg border p-2.5"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                              {mp.pattern}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                              {mp.suggestion}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveMistakePattern(i)}
                            className="shrink-0 rounded p-1 transition-colors"
                            style={{ color: 'var(--color-muted)' }}
                            aria-label={`Remove mistake pattern: ${mp.pattern}`}
                          >
                            <IconClose size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goals */}
                {memoryData && memoryData.goals.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
                      Learning Goals ({memoryData.goals.length})
                    </h3>
                    <div className="space-y-1.5">
                      {memoryData.goals.map(g => (
                        <div
                          key={g.id}
                          className="flex items-start justify-between gap-2 rounded-lg border p-2.5"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                              {g.isAchieved ? '✅ ' : '🎯 '}{g.title}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                              {g.description}
                            </p>
                            {g.targetDate && (
                              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                Target: {new Date(g.targetDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveGoal(g.id)}
                            className="shrink-0 rounded p-1 transition-colors"
                            style={{ color: 'var(--color-muted)' }}
                            aria-label={`Remove goal: ${g.title}`}
                          >
                            <IconClose size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Summaries */}
                {memoryData && memoryData.feedbackSummaries.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
                      Feedback Summaries ({memoryData.feedbackSummaries.length})
                    </h3>
                    <div className="space-y-1.5">
                      {memoryData.feedbackSummaries.map((fs, i) => (
                        <div
                          key={i}
                          className="rounded-lg border p-2.5"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            {fs.skill} — {new Date(fs.date).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                            {fs.summary}
                          </p>
                          {fs.improvement && (
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-success)' }}>
                              Improvement: {fs.improvement}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {memoryData && memoryStats && memoryStats.weakPointCount === 0 && memoryStats.mistakePatternCount === 0 && memoryStats.goalCount === 0 && memoryStats.feedbackSummaryCount === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      No assistant memory data yet.
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      Memory is built as you interact with the AI Tutor.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={handleExportMemory}
                    disabled={memoryExporting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  >
                    {memoryExporting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <IconDownload size={16} />
                        Export memory as JSON
                      </>
                    )}
                  </button>

                  {confirmDelete === 'memory' ? (
                    <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-danger-light)', borderColor: 'var(--color-danger)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
                        Clear all assistant memory (weak points, goals, feedback)?
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--color-danger-dark)' }}>
                        Chat history and preferences will be kept.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={handleDeleteMemory}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                          style={{ backgroundColor: 'var(--color-danger)' }}
                        >
                          Yes, clear memory
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : confirmDelete === 'all' ? (
                    <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-danger-light)', borderColor: 'var(--color-danger)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
                        Delete ALL assistant data?
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--color-danger-dark)' }}>
                        This includes chat history, memory, reminders, notes, and preferences. This cannot be undone.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={handleDeleteAllMemory}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                          style={{ backgroundColor: 'var(--color-danger)' }}
                        >
                          Yes, delete everything
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete('memory')}
                        className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                      >
                        Clear Memory
                      </button>
                      <button
                        onClick={() => setConfirmDelete('all')}
                        className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                      >
                        Delete All
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-center leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    ⚠️ All assistant data is stored locally using IndexedDB and localStorage.
                    Data may be cleared if browser storage is reset. Cloud backups are not available.
                    You can export your data as JSON for safekeeping.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
    </VoiceProvider>
  )
}
