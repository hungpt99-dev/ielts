import { useId } from 'react'
import type { MistakeEntry, MistakeSkill } from '../../models'
import DatabaseService from '../../services/storage/Database'
import { getSpeakingFeedback as aiGetSpeakingFeedback, generateSpeakingQuestions as aiGenerateSpeakingQuestions } from '../../services/ai/AIService'

export type SpeakingPhase = 'idle' | 'select-part' | 'part1' | 'part2' | 'part3' | 'feedback' | 'completed'

export interface SpeakingQuestionItem {
  id: string
  part: 1 | 2 | 3
  question: string
  topic: string
}

export interface CueCard {
  id: string
  topic: string
  title: string
  instructions: string
  bulletPoints: string[]
  followUpQuestions: string[]
}

export interface SpeakingFeedback {
  id: string
  corrections: { original: string; suggestion: string; explanation: string }[]
  betterPhrases: { phrase: string; context: string }[]
  bandEstimate: BandEstimate
  generalAdvice: string
}

export interface BandEstimate {
  overall: number
  fluency: number
  grammar: number
  vocabulary: number
  coherence: number
}

// ── Part 1 Questions ────────────────────────────────────────────

let cachedPart1Questions: SpeakingQuestionItem[] | null = null
let cachedCueCards: CueCard[] | null = null
let cachedPart3Questions: SpeakingQuestionItem[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 3600_000 // 1 hour

async function ensureQuestionCache(): Promise<void> {
  const now = Date.now()
  if (cachedPart1Questions && cachedCueCards && cachedPart3Questions && (now - cacheTimestamp) < CACHE_TTL) {
    return
  }

  try {
    const [part1Result, part2Result, part3Result] = await Promise.all([
      aiGenerateSpeakingQuestions(1, 'familiar topics'),
      aiGenerateSpeakingQuestions(2, 'various topics'),
      aiGenerateSpeakingQuestions(3, 'abstract topics'),
    ])

    if (!part1Result.error && part1Result.content) {
      try {
        const parsed = JSON.parse(part1Result.content)
        if (parsed.questions) {
          cachedPart1Questions = parsed.questions.map((q: string, i: number) => ({
            id: `p1-ai-${i}`,
            part: 1 as const,
            question: q,
            topic: 'Mixed',
          }))
        }
      } catch {}
    }

    if (!part2Result.error && part2Result.content) {
      try {
        const parsed = JSON.parse(part2Result.content)
        if (parsed.cueCard) {
          cachedCueCards = [parsed.cueCard].map((c: any, i: number) => ({
            id: `p2-ai-${i}`,
            topic: c.topic || 'General',
            title: c.title || 'Describe something',
            instructions: c.instructions || 'You should say:',
            bulletPoints: c.bulletPoints || [],
            followUpQuestions: c.followUpQuestions || [],
          }))
        }
      } catch {}
    }

    if (!part3Result.error && part3Result.content) {
      try {
        const parsed = JSON.parse(part3Result.content)
        if (parsed.questions) {
          cachedPart3Questions = parsed.questions.map((q: string, i: number) => ({
            id: `p3-ai-${i}`,
            part: 3 as const,
            question: q,
            topic: 'Discussion',
          }))
        }
      } catch {}
    }
  } catch {
    // Fall through to static questions below
  }

  // Fall back to hardcoded questions if AI failed
  if (!cachedPart1Questions) cachedPart1Questions = STATIC_PART1_QUESTIONS
  if (!cachedCueCards) cachedCueCards = STATIC_PART2_CUE_CARDS
  if (!cachedPart3Questions) cachedPart3Questions = STATIC_PART3_QUESTIONS

  cacheTimestamp = now
}

const STATIC_PART1_QUESTIONS: SpeakingQuestionItem[] = [
  // Work / Study
  { id: 'p1-1', part: 1, question: "Do you work or are you a student?", topic: 'Work/Study' },
  { id: 'p1-2', part: 1, question: "What do you do (for work / as your job)?", topic: 'Work/Study' },
  { id: 'p1-3', part: 1, question: "Why did you choose that job / field of study?", topic: 'Work/Study' },
  { id: 'p1-4', part: 1, question: "Do you enjoy your job / studies?", topic: 'Work/Study' },
  { id: 'p1-5', part: 1, question: "What are your main responsibilities at work / school?", topic: 'Work/Study' },
  { id: 'p1-6', part: 1, question: "Do you plan to change your job / continue studying in the future?", topic: 'Work/Study' },

  // Hometown
  { id: 'p1-7', part: 1, question: "Where is your hometown?", topic: 'Hometown' },
  { id: 'p1-8', part: 1, question: "What do you like about your hometown?", topic: 'Hometown' },
  { id: 'p1-9', part: 1, question: "Has your hometown changed much since you were young?", topic: 'Hometown' },
  { id: 'p1-10', part: 1, question: "Would you recommend your hometown to visitors?", topic: 'Hometown' },

  // Home / Accommodation
  { id: 'p1-11', part: 1, question: "Do you live in a house or an apartment?", topic: 'Home' },
  { id: 'p1-12', part: 1, question: "What's your favorite room in your home?", topic: 'Home' },
  { id: 'p1-13', part: 1, question: "What would you like to change about your home?", topic: 'Home' },
  { id: 'p1-14', part: 1, question: "Do you prefer living in a house or an apartment?", topic: 'Home' },

  // Hobbies / Free Time
  { id: 'p1-15', part: 1, question: "What do you like to do in your free time?", topic: 'Hobbies' },
  { id: 'p1-16', part: 1, question: "Do you prefer to spend your free time alone or with others?", topic: 'Hobbies' },
  { id: 'p1-17', part: 1, question: "Have you started any new hobbies recently?", topic: 'Hobbies' },
  { id: 'p1-18', part: 1, question: "Why do you think hobbies are important?", topic: 'Hobbies' },

  // Travel
  { id: 'p1-19', part: 1, question: "Do you like to travel?", topic: 'Travel' },
  { id: 'p1-20', part: 1, question: "What kind of places have you traveled to?", topic: 'Travel' },
  { id: 'p1-21', part: 1, question: "Do you prefer traveling alone or with others?", topic: 'Travel' },
  { id: 'p1-22', part: 1, question: "Where would you like to travel in the future?", topic: 'Travel' },

  // Food
  { id: 'p1-23', part: 1, question: "What kind of food do you like?", topic: 'Food' },
  { id: 'p1-24', part: 1, question: "Can you cook? What dishes can you make?", topic: 'Food' },
  { id: 'p1-25', part: 1, question: "Do you prefer eating at home or eating out?", topic: 'Food' },
  { id: 'p1-26', part: 1, question: "What is a traditional dish from your country?", topic: 'Food' },

  // Weather
  { id: 'p1-27', part: 1, question: "What kind of weather do you like?", topic: 'Weather' },
  { id: 'p1-28', part: 1, question: "What is the weather like in your country?", topic: 'Weather' },
  { id: 'p1-29', part: 1, question: "Does the weather affect your mood?", topic: 'Weather' },
  { id: 'p1-30', part: 1, question: "What do you like to do in different types of weather?", topic: 'Weather' },

  // Technology
  { id: 'p1-31', part: 1, question: "How often do you use the internet?", topic: 'Technology' },
  { id: 'p1-32', part: 1, question: "What do you use your phone for most?", topic: 'Technology' },
  { id: 'p1-33', part: 1, question: "Do you prefer reading news online or in print?", topic: 'Technology' },
  { id: 'p1-34', part: 1, question: "How has technology changed the way you communicate?", topic: 'Technology' },

  // Family / Friends
  { id: 'p1-35', part: 1, question: "Do you have a large or small family?", topic: 'Family' },
  { id: 'p1-36', part: 1, question: "How often do you see your family?", topic: 'Family' },
  { id: 'p1-37', part: 1, question: "What do you like to do with your friends?", topic: 'Friends' },
  { id: 'p1-38', part: 1, question: "Is it easy to make friends in your country?", topic: 'Friends' },
]

// ── Part 2 Cue Cards ────────────────────────────────────────────

const STATIC_PART2_CUE_CARDS: CueCard[] = [
  {
    id: 'p2-1', topic: 'Person', title: 'Describe a person you admire',
    instructions: "Describe a person you admire. You should say:",
    bulletPoints: ["Who this person is", "How you know them", "What they are like", "And explain why you admire them"],
    followUpQuestions: [
      "What qualities do you think make a good role model?",
      "How have role models changed in modern society?",
      "Do you think celebrities are good role models for young people?",
    ],
  },
  {
    id: 'p2-2', topic: 'Place', title: 'Describe a place you like to visit',
    instructions: "Describe a place you like to visit. You should say:",
    bulletPoints: ["Where this place is", "How often you go there", "What you do there", "And explain why you like this place"],
    followUpQuestions: [
      "Why do people like to visit new places?",
      "How has tourism changed in your country?",
      "What are the benefits of traveling to different places?",
    ],
  },
  {
    id: 'p2-3', topic: 'Object', title: 'Describe an important object you own',
    instructions: "Describe an important object that you own. You should say:",
    bulletPoints: ["What the object is", "How you got it", "Why it is important to you", "And explain how you use it"],
    followUpQuestions: [
      "Why do people become attached to certain objects?",
      "Do people today value material possessions more than in the past?",
      "What role does technology play in people's lives today?",
    ],
  },
  {
    id: 'p2-4', topic: 'Event', title: 'Describe a memorable event or celebration',
    instructions: "Describe a memorable event or celebration you attended. You should say:",
    bulletPoints: ["What the event was", "When and where it happened", "Who you were with", "And explain why it was memorable"],
    followUpQuestions: [
      "How do people in your country celebrate special occasions?",
      "Has the way people celebrate changed in recent years?",
      "Are traditional celebrations still important in modern society?",
    ],
  },
  {
    id: 'p2-5', topic: 'Activity', title: 'Describe a hobby or activity you enjoy',
    instructions: "Describe a hobby or activity that you enjoy. You should say:",
    bulletPoints: ["What the hobby is", "When you started it", "How often you do it", "And explain why you enjoy it"],
    followUpQuestions: [
      "Why are hobbies important for people?",
      "How do people in your country spend their free time?",
      "Do you think people have enough free time today?",
    ],
  },
  {
    id: 'p2-6', topic: 'Experience', title: 'Describe a useful skill you learned',
    instructions: "Describe a useful skill that you learned. You should say:",
    bulletPoints: ["What the skill is", "How you learned it", "How long it took to learn", "And explain why it is useful"],
    followUpQuestions: [
      "What skills are most important for young people to learn?",
      "How has education changed in your country?",
      "Do you think online learning is as effective as traditional learning?",
    ],
  },
  {
    id: 'p2-7', topic: 'Media', title: 'Describe a book or movie that impressed you',
    instructions: "Describe a book or movie that impressed you. You should say:",
    bulletPoints: ["What the book or movie is", "When you read or watched it", "What it is about", "And explain why it impressed you"],
    followUpQuestions: [
      "Do people in your country prefer reading books or watching movies?",
      "How has the film industry changed in recent years?",
      "What are the benefits of reading regularly?",
    ],
  },
  {
    id: 'p2-8', topic: 'Technology', title: 'Describe a piece of technology you use regularly',
    instructions: "Describe a piece of technology that you use regularly. You should say:",
    bulletPoints: ["What the technology is", "How you use it", "How often you use it", "And explain why it is important to you"],
    followUpQuestions: [
      "How has technology changed daily life in your country?",
      "Do you think people rely too much on technology?",
      "What technological developments do you predict for the future?",
    ],
  },
]

// ── Part 3 Questions ────────────────────────────────────────────

const STATIC_PART3_QUESTIONS: SpeakingQuestionItem[] = [
  { id: 'p3-1', part: 3, question: "How have family roles changed in your country in recent decades?", topic: 'Family & Society' },
  { id: 'p3-2', part: 3, question: "Do you think it's better to live in a big city or a small town? Why?", topic: 'Urban vs Rural' },
  { id: 'p3-3', part: 3, question: "What are the main environmental problems facing your country?", topic: 'Environment' },
  { id: 'p3-4', part: 3, question: "How can individuals help protect the environment?", topic: 'Environment' },
  { id: 'p3-5', part: 3, question: "Do you think education should be free for everyone?", topic: 'Education' },
  { id: 'p3-6', part: 3, question: "How has technology changed the way people learn?", topic: 'Education & Technology' },
  { id: 'p3-7', part: 3, question: "What are the advantages and disadvantages of social media?", topic: 'Technology' },
  { id: 'p3-8', part: 3, question: "Do you think traditional newspapers will disappear in the future?", topic: 'Media' },
  { id: 'p3-9', part: 3, question: "How has the way people work changed in recent years?", topic: 'Work' },
  { id: 'p3-10', part: 3, question: "What qualities do you think a good leader should have?", topic: 'Leadership' },
  { id: 'p3-11', part: 3, question: "Do you think globalization has more positive or negative effects?", topic: 'Globalization' },
  { id: 'p3-12', part: 3, question: "How can governments encourage people to be more active?", topic: 'Health' },
  { id: 'p3-13', part: 3, question: "What role should art and culture play in society?", topic: 'Culture' },
  { id: 'p3-14', part: 3, question: "Do you think the gap between rich and poor is increasing?", topic: 'Economy' },
  { id: 'p3-15', part: 3, question: "How can countries balance economic development with environmental protection?", topic: 'Economy & Environment' },
  { id: 'p3-16', part: 3, question: "What are the benefits of learning a foreign language?", topic: 'Language Learning' },
  { id: 'p3-17', part: 3, question: "Do you think young people today face more pressure than previous generations?", topic: 'Youth' },
  { id: 'p3-18', part: 3, question: "How has the tourism industry affected local communities in your country?", topic: 'Tourism' },
  { id: 'p3-19', part: 3, question: "What can be done to reduce traffic congestion in big cities?", topic: 'Urban Planning' },
  { id: 'p3-20', part: 3, question: "Do you think it's important for countries to preserve their traditional culture?", topic: 'Culture & Heritage' },
]

// ── Part Selector ───────────────────────────────────────────────

export function getPartSelectorMessage(): string {
  return "Great, let's practice IELTS Speaking! 🗣️\n\nWhich part would you like to practice?\n\n**1️⃣ Part 1** — Short questions about familiar topics (4-5 minutes)\n**2️⃣ Part 2** — A cue card with 1-2 minutes of speaking\n**3️⃣ Part 3** — Deeper discussion questions (4-5 minutes)\n\nJust type **1**, **2**, or **3** to choose your part!"
}

export function getPartLabel(part: 1 | 2 | 3): string {
  return part === 1 ? 'Part 1' : part === 2 ? 'Part 2 (Cue Card)' : 'Part 3'
}

export function detectPartChoice(message: string): 1 | 2 | 3 | null {
  const lower = message.trim().toLowerCase()
  if (/^1$|part\s*1|^part one$/i.test(lower)) return 1
  if (/^2$|part\s*2|^part two$/i.test(lower)) return 2
  if (/^3$|part\s*3|^part three$/i.test(lower)) return 3
  if (/\bcue\s*card\b/i.test(lower)) return 2
  if (/\bfollow.?up|discussion\b/i.test(lower)) return 3
  return null
}

// ── Question Selection ──────────────────────────────────────────

export async function getRandomPart1Questions(count = 3): Promise<SpeakingQuestionItem[]> {
  await ensureQuestionCache()
  const pool = cachedPart1Questions || STATIC_PART1_QUESTIONS
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export async function getRandomCueCard(): Promise<CueCard> {
  await ensureQuestionCache()
  const pool = cachedCueCards || STATIC_PART2_CUE_CARDS
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}

export async function getRandomPart3Questions(count = 2): Promise<SpeakingQuestionItem[]> {
  await ensureQuestionCache()
  const pool = cachedPart3Questions || STATIC_PART3_QUESTIONS
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function formatPart1Questions(questions: SpeakingQuestionItem[]): string {
  return questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n\n')
}

export function formatCueCard(card: CueCard): string {
  const bullets = card.bulletPoints.map(b => `• ${b}`).join('\n')
  return `**🎯 IELTS Speaking Part 2 — Cue Card**\n\n**Topic:** ${card.topic}\n\n**${card.title}**\n\n${card.instructions}\n\n${bullets}\n\n---\n\nTake 1 minute to prepare, then speak for 1-2 minutes. Type your answer when you're ready!`
}

export function formatPart3Questions(questions: SpeakingQuestionItem[]): string {
  return questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n\n')
}

// ── Answer Analysis ─────────────────────────────────────────────

interface AnalysisResult {
  wordCount: number
  uniqueWordRatio: number
  avgSentenceLength: number
  linkingWords: string[]
  complexStructures: string[]
  detectedErrors: { original: string; suggestion: string; explanation: string }[]
}

function analyzeText(text: string): AnalysisResult {
  const words = text.split(/\s+/).filter(Boolean)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const lower = text.toLowerCase()

  const linkingWordPatterns = [
    'however', 'moreover', 'furthermore', 'nevertheless', 'nonetheless',
    'therefore', 'consequently', 'as a result', 'in addition', 'for example',
    'for instance', 'such as', 'in contrast', 'on the other hand', 'in conclusion',
    'to sum up', 'firstly', 'secondly', 'finally', 'meanwhile',
  ]
  const linkingWords = linkingWordPatterns.filter(lw => lower.includes(lw))

  const complexPatterns = [
    'which', 'that', 'because', 'although', 'while', 'whereas',
    'despite', 'in spite of', 'not only', 'as well as', 'would',
    'could', 'should', 'have been', 'has been', 'had been',
  ]
  const complexStructures = complexPatterns.filter(p => lower.includes(p))

  const errors: AnalysisResult['detectedErrors'] = []

  const subjVerbMatches = text.match(/\b(I|He|She|It|We|They) (is|are|was|were|do|does|don't|doesn't)\b/gi)
  if (subjVerbMatches) {
    subjVerbMatches.forEach(m => {
      const parts = m.split(' ')
      const subject = parts[0].toLowerCase()
      const verb = parts[1].toLowerCase()
      if (subject === 'i' && (verb === 'is' || verb === 'are' || verb === 'was' || verb === 'does' || verb === "doesn't")) {
        errors.push({
          original: m,
          suggestion: `I ${verb === 'is' ? 'am' : verb === 'are' ? 'am' : verb === 'was' ? 'was' : verb === 'does' ? 'do' : "don't"}`,
          explanation: `After "I", use "${verb === 'is' ? 'am' : verb === 'are' ? 'am' : verb === 'was' ? 'was' : verb === 'does' ? 'do' : "don't"}" not "${verb}".`,
        })
      }
      if ((subject === 'he' || subject === 'she' || subject === 'it') && (verb === 'are' || verb === 'were' || verb === 'do' || verb === "don't")) {
        errors.push({
          original: m,
          suggestion: `${parts[0]} ${verb === 'are' ? 'is' : verb === 'were' ? 'was' : verb === 'do' ? 'does' : "doesn't"}`,
          explanation: `After "${parts[0]}", use "${verb === 'are' ? 'is' : verb === 'were' ? 'was' : verb === 'do' ? 'does' : "doesn't"}" for present simple.`,
        })
      }
      if ((subject === 'we' || subject === 'they') && (verb === 'is' || verb === 'was' || verb === 'does' || verb === "doesn't")) {
        errors.push({
          original: m,
          suggestion: `${parts[0]} ${verb === 'is' ? 'are' : verb === 'was' ? 'were' : verb === 'does' ? 'do' : "don't"}`,
          explanation: `After "${parts[0]}", use "${verb === 'is' ? 'are' : verb === 'was' ? 'were' : verb === 'does' ? 'do' : "don't"}" for present simple.`,
        })
      }
    })
  }

  const articleErrors = text.match(/\ba (apple|hour|honest|umbrella)/gi)
  if (articleErrors) {
    articleErrors.forEach(m => {
      const word = m.toLowerCase().replace(/^a\s+/, '')
      errors.push({
        original: m,
        suggestion: `an ${word}`,
        explanation: `Use "an" before "${word}" because it starts with a vowel sound.`,
      })
    })
  }

  return {
    wordCount: words.length,
    uniqueWordRatio: words.length > 0 ? uniqueWords.size / words.length : 0,
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    linkingWords,
    complexStructures,
    detectedErrors: errors,
  }
}

// ── Band Estimation ─────────────────────────────────────────────

function estimateBand(_text: string, analysis: AnalysisResult): BandEstimate {
  const wordCount = analysis.wordCount
  const uniqueRatio = analysis.uniqueWordRatio
  const linkingCount = analysis.linkingWords.length
  const complexCount = analysis.complexStructures.length
  const errorCount = analysis.detectedErrors.length

  let fluency = 5.0
  if (wordCount >= 400) fluency = 8.5
  else if (wordCount >= 320) fluency = 8.0
  else if (wordCount >= 250) fluency = 7.5
  else if (wordCount >= 180) fluency = 7.0
  else if (wordCount >= 120) fluency = 6.5
  else if (wordCount >= 80) fluency = 6.0
  else if (wordCount >= 50) fluency = 5.0
  else fluency = 4.0

  let vocabulary = 5.0
  if (uniqueRatio >= 0.7) vocabulary = 8.0
  else if (uniqueRatio >= 0.65) vocabulary = 7.5
  else if (uniqueRatio >= 0.6) vocabulary = 7.0
  else if (uniqueRatio >= 0.55) vocabulary = 6.5
  else if (uniqueRatio >= 0.5) vocabulary = 6.0
  else if (uniqueRatio < 0.4) vocabulary = 4.5

  if (linkingCount >= 1) vocabulary = Math.max(vocabulary, 6.0)
  if (linkingCount >= 3) vocabulary = Math.max(vocabulary, 6.5)
  if (linkingCount >= 5) vocabulary = Math.max(vocabulary, 7.0)

  let grammar = 5.0
  if (complexCount >= 8) grammar = 7.5
  else if (complexCount >= 6) grammar = 7.0
  else if (complexCount >= 4) grammar = 6.5
  else if (complexCount >= 2) grammar = 6.0
  if (errorCount >= 3) grammar = Math.min(grammar, 5.5)
  if (errorCount >= 5) grammar = Math.min(grammar, 5.0)
  if (errorCount === 0 && wordCount > 50) grammar = Math.max(grammar, 6.0)

  let coherence = 5.0
  if (linkingCount >= 1) coherence = 6.0
  if (linkingCount >= 2) coherence = 6.5
  if (linkingCount >= 4) coherence = 7.0
  if (wordCount >= 100) coherence = Math.max(coherence, 6.0)
  if (wordCount >= 200) coherence = Math.max(coherence, 6.5)

  fluency = Math.round(fluency * 2) / 2
  vocabulary = Math.round(vocabulary * 2) / 2
  grammar = Math.round(grammar * 2) / 2
  coherence = Math.round(coherence * 2) / 2

  const overall = Math.round(((fluency + vocabulary + grammar + coherence) / 4) * 2) / 2
  const clamped = Math.max(3.0, Math.min(9.0, overall))

  return {
    overall: clamped,
    fluency,
    grammar,
    vocabulary,
    coherence,
  }
}

// ── Better Phrases ──────────────────────────────────────────────

function generateBetterPhrases(text: string, part: 1 | 2 | 3): { phrase: string; context: string }[] {
  const phrases: { phrase: string; context: string }[] = []
  const lower = text.toLowerCase()

  if (!/\bin my opinion\b|\bi think\b|\bi believe\b|\bfrom my perspective\b/.test(lower)) {
    phrases.push({
      phrase: 'In my opinion, ... / From my perspective, ...',
      context: 'Use these to introduce your opinion more formally and clearly.',
    })
  }

  if (!/\bfor example\b|\bfor instance\b|\bsuch as\b/.test(lower)) {
    phrases.push({
      phrase: 'For example, ... / For instance, ...',
      context: 'Adding specific examples makes your answer more convincing and detailed.',
    })
  }

  if (part === 3 && !/\bhowever\b|\bon the other hand\b|\bin contrast\b/.test(lower)) {
    phrases.push({
      phrase: 'However, ... / On the other hand, ...',
      context: 'Use contrasting phrases to show you can see both sides of an issue — this is key for Part 3.',
    })
  }

  if (!/\bbecause\b|\bthe reason is\b|\bdue to\b|\bas\b/.test(lower) && text.length > 30) {
    phrases.push({
      phrase: 'This is because ... / The reason for this is ...',
      context: 'Explaining reasons adds depth to your answer and shows the examiner you can develop ideas.',
    })
  }

  if (text.split(/\s+/).filter(Boolean).length < 40 && part === 2) {
    phrases.push({
      phrase: 'Additionally, ... / Moreover, ... / Furthermore, ...',
      context: 'Your answer is quite short for Part 2. Try adding more details with linking words.',
    })
  }

  return phrases.slice(0, 3)
}

// ── General Advice ──────────────────────────────────────────────

function generateGeneralAdvice(analysis: AnalysisResult, part: 1 | 2 | 3, band: BandEstimate): string {
  const advice: string[] = []

  if (analysis.wordCount < 50 && part === 2) {
    advice.push('For Part 2, aim to speak for 1-2 minutes. Try to expand your answer with more details, examples, and personal experiences.')
  }

  if (analysis.detectedErrors.length >= 3) {
    advice.push('Focus on grammar basics — especially subject-verb agreement and articles. These are essential for a higher band score.')
  }

  if (analysis.linkingWords.length < 2) {
    advice.push('Use more linking words to connect your ideas. This improves coherence, which is 25% of your speaking score.')
  }

  if (analysis.complexStructures.length < 3) {
    advice.push('Try using more complex sentence structures (relative clauses, conditionals, passive voice) to demonstrate grammatical range.')
  }

  if (band.vocabulary < 6.5) {
    advice.push('To improve your vocabulary score, include some topic-specific words and less common vocabulary in your answers.')
  }

  if (advice.length === 0) {
    advice.push('Great effort! Keep practicing regularly and try to incorporate the suggested phrases to reach an even higher band.')
  }

  return advice.slice(0, 3).join('\n')
}

// ── Main Feedback Generator ─────────────────────────────────────

export async function generateSpeakingFeedback(text: string, part: 1 | 2 | 3): Promise<SpeakingFeedback> {
  try {
    const aiResult = await aiGetSpeakingFeedback(text, `IELTS Speaking Part ${part} question`, part)
    if (!aiResult.error && aiResult.content) {
      try {
        const parsed = JSON.parse(aiResult.content)
        const band: BandEstimate = {
          overall: parsed.bandScore || 6.0,
          fluency: parsed.fluencyScore || parsed.fluencyNotes ? 6.0 : 5.0,
          grammar: parsed.grammarScore || parsed.grammarNotes ? 6.0 : 5.0,
          vocabulary: parsed.vocabularyScore || parsed.vocabularyNotes ? 6.0 : 5.0,
          coherence: 6.0,
        }

        const feedback: SpeakingFeedback = {
          id: crypto.randomUUID?.() ?? Date.now().toString(36),
          corrections: [],
          betterPhrases: [],
          bandEstimate: band,
          generalAdvice: '',
        }

        const parts: string[] = []
        if (parsed.fluencyNotes) parts.push(`**Fluency & Coherence:** ${parsed.fluencyNotes}`)
        if (parsed.vocabularyNotes) parts.push(`**Vocabulary:** ${parsed.vocabularyNotes}`)
        if (parsed.grammarNotes) parts.push(`**Grammar:** ${parsed.grammarNotes}`)
        if (parsed.pronunciationNotes) parts.push(`**Pronunciation:** ${parsed.pronunciationNotes}`)
        if (parsed.betterExpressions) {
          feedback.betterPhrases = [{ phrase: parsed.betterExpressions, context: 'Consider using these expressions to enhance your response.' }]
        }
        if (parsed.improvedAnswer) {
          parts.push(`**Improved Version:**\n${parsed.improvedAnswer}`)
        }

        feedback.generalAdvice = parts.join('\n\n')
        return feedback
      } catch {
        // Fall through to template
      }
    }
  } catch {
    // Fall through to template
  }

  const analysis = analyzeText(text)
  const bandEstimate = estimateBand(text, analysis)
  const betterPhrases = generateBetterPhrases(text, part)
  const generalAdvice = generateGeneralAdvice(analysis, part, bandEstimate)

  return {
    id: crypto.randomUUID?.() ?? Date.now().toString(36),
    corrections: analysis.detectedErrors,
    betterPhrases,
    bandEstimate,
    generalAdvice,
  }
}

export function formatFeedbackMessage(feedback: SpeakingFeedback, language: 'english' | 'vietnamese' | 'both', part: 1 | 2 | 3): string {
  const eng = generateFeedbackEnglish(feedback, part)
  const viet = generateFeedbackVietnamese(feedback, part)

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}`
  return eng
}

function generateFeedbackEnglish(feedback: SpeakingFeedback, _part: 1 | 2 | 3): string {
  const parts: string[] = []
  const band = feedback.bandEstimate

  parts.push(`📊 **Estimated Speaking Band: ${band.overall}**`)
  parts.push(`┌─────────────────────────────┐
│ Fluency & Coherence:  ${band.fluency}        │
│ Grammar:               ${band.grammar}        │
│ Vocabulary:            ${band.vocabulary}        │
│ Pronunciation:         N/A (text only) │
└─────────────────────────────┘`)

  if (feedback.corrections.length > 0) {
    parts.push(`🔍 **Corrections:**`)
    feedback.corrections.forEach(c => {
      parts.push(`• "${c.original}" → **${c.suggestion}**\n  ${c.explanation}`)
    })
  } else {
    parts.push('✅ **Grammar:** No major issues detected! Good control of grammar.')
  }

  if (feedback.betterPhrases.length > 0) {
    parts.push(`💡 **Try these phrases:**`)
    feedback.betterPhrases.forEach(p => {
      parts.push(`• **${p.phrase}**\n  ${p.context}`)
    })
  }

  parts.push(`📝 **Advice:**\n${feedback.generalAdvice}`)

  parts.push(`---\nType **"next"** for another question, **"part 2"** to switch parts, or keep talking about this topic!`)

  return parts.join('\n\n')
}

function generateFeedbackVietnamese(feedback: SpeakingFeedback, _part: 1 | 2 | 3): string {
  const parts: string[] = []
  const band = feedback.bandEstimate

  parts.push(`📊 **Ước tính Band Nói: ${band.overall}**`)
  parts.push(`┌─────────────────────────────────┐
│ Độ trôi chảy & Mạch lạc:  ${band.fluency}        │
│ Ngữ pháp:                   ${band.grammar}        │
│ Từ vựng:                    ${band.vocabulary}        │
│ Phát âm:                    N/A (chỉ văn bản) │
└─────────────────────────────────┘`)

  if (feedback.corrections.length > 0) {
    parts.push(`🔍 **Sửa lỗi:**`)
    feedback.corrections.forEach(c => {
      parts.push(`• "${c.original}" → **${c.suggestion}**\n  ${c.explanation}`)
    })
  } else {
    parts.push('✅ **Ngữ pháp:** Không có lỗi lớn! Bạn kiểm soát ngữ pháp tốt.')
  }

  if (feedback.betterPhrases.length > 0) {
    parts.push(`💡 **Thử các cụm từ này:**`)
    feedback.betterPhrases.forEach(p => {
      parts.push(`• **${p.phrase}**\n  ${p.context}`)
    })
  }

  parts.push(`📝 **Lời khuyên:**\n${feedback.generalAdvice}`)

  parts.push(`---\nGõ **"next"** để nhận câu hỏi khác, **"part 2"** để đổi phần, hoặc tiếp tục nói về chủ đề này!`)

  return parts.join('\n\n')
}

// ── Save Mistakes to Notebook ───────────────────────────────────

export async function saveSpeakingMistakesToNotebook(
  _text: string,
  corrections: SpeakingFeedback['corrections'],
  part: 1 | 2 | 3,
): Promise<void> {
  if (corrections.length === 0) return

  for (const c of corrections) {
    const entry: Omit<MistakeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      mistake: c.original,
      correction: c.suggestion,
      explanation: c.explanation,
      source: `AI Tutor - Speaking ${part === 1 ? 'Part 1' : part === 2 ? 'Part 2 (Cue Card)' : 'Part 3'}`,
      date: new Date().toISOString().split('T')[0],
      skill: 'speaking' as MistakeSkill,
      status: 'new',
      repetitionCount: 0,
    }
    await DatabaseService.addMistake(entry)
  }
}

// ── Check if user wants next ────────────────────────────────────

export function isNextQuestionRequest(text: string): boolean {
  const lower = text.trim().toLowerCase()
  return /^(next|yes|another|continue|more|again)$/.test(lower) ||
    /^(next question|yes please|give me another|one more)$/i.test(lower)
}

// ── React: Part Selector Card ───────────────────────────────────

interface PartSelectorCardProps {
  onSelect: (part: 1 | 2 | 3) => void
  disabled?: boolean
}

export function PartSelectorCard({ onSelect, disabled }: PartSelectorCardProps) {
  const labelId = useId()

  return (
    <div
      className="mt-3 rounded-xl border-2 border-[var(--color-warning-light)] bg-[var(--color-warning-light)]/50 p-4 dark:border-[var(--color-warning-dark)] dark:bg-[var(--color-warning-dark)]/10"
      role="group"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        🗣️ Choose a Speaking Part
      </p>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onSelect(1)}
          disabled={disabled}
          className="flex flex-col items-center gap-1 rounded-lg border-2 border-[var(--color-warning-light)] bg-[var(--color-surface)] p-3 text-sm transition-colors hover:bg-[var(--color-warning-light)] disabled:opacity-50 dark:border-[var(--color-warning-dark)] dark:bg-[var(--color-surface-secondary)] dark:hover:bg-[var(--color-warning-dark)]/20"
        >
          <span className="text-xl">1️⃣</span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Part 1</span>
          <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Short Q&A</span>
        </button>
        <button
          onClick={() => onSelect(2)}
          disabled={disabled}
          className="flex flex-col items-center gap-1 rounded-lg border-2 border-[var(--color-warning-light)] bg-[var(--color-surface)] p-3 text-sm transition-colors hover:bg-[var(--color-warning-light)] disabled:opacity-50 dark:border-[var(--color-warning-dark)] dark:bg-[var(--color-surface-secondary)] dark:hover:bg-[var(--color-warning-dark)]/20"
        >
          <span className="text-xl">2️⃣</span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Part 2</span>
          <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Cue Card</span>
        </button>
        <button
          onClick={() => onSelect(3)}
          disabled={disabled}
          className="flex flex-col items-center gap-1 rounded-lg border-2 border-[var(--color-warning-light)] bg-[var(--color-surface)] p-3 text-sm transition-colors hover:bg-[var(--color-warning-light)] disabled:opacity-50 dark:border-[var(--color-warning-dark)] dark:bg-[var(--color-surface-secondary)] dark:hover:bg-[var(--color-warning-dark)]/20"
        >
          <span className="text-xl">3️⃣</span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Part 3</span>
          <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Discussion</span>
        </button>
      </div>
    </div>
  )
}

// ── React: Cue Card Display ─────────────────────────────────────

interface CueCardDisplayProps {
  card: CueCard
}

export function CueCardDisplay({ card }: CueCardDisplayProps) {
  const labelId = useId()

  return (
    <div
      className="mt-3 rounded-xl border-2 border-[var(--color-warning-light)] bg-[var(--color-surface)] p-4 dark:border-[var(--color-warning-dark)] dark:bg-[var(--color-surface-secondary)]"
      aria-labelledby={labelId}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <div>
          <p id={labelId} className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            IELTS Speaking Part 2
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Topic: {card.topic}</p>
        </div>
      </div>

      <p className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {card.title}
      </p>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        {card.instructions}
      </p>

      <ul className="mb-3 space-y-1">
        {card.bulletPoints.map((bp, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="mt-0.5 text-[var(--color-warning)]">•</span>
            <span>{bp}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-lg bg-[var(--color-warning-light)] p-2.5 dark:bg-[var(--color-warning-dark)]/20">
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          ⏱ Take 1 minute to prepare, then type your 1-2 minute response below.
        </p>
      </div>
    </div>
  )
}

// ── React: Band Estimate Display ────────────────────────────────

interface BandEstimateCardProps {
  band: BandEstimate
}

const BAND_COLORS: Record<string, string> = {
  '9': 'text-[var(--color-success)]', '8.5': 'text-[var(--color-success)]', '8': 'text-[var(--color-success)]',
  '7.5': 'text-[var(--color-primary)]', '7': 'text-[var(--color-primary)]', '6.5': 'text-[var(--color-primary)]',
  '6': 'text-[var(--color-warning)]', '5.5': 'text-[var(--color-warning)]', '5': 'text-[var(--color-warning)]',
  '4.5': 'text-[var(--color-danger)]', '4': 'text-[var(--color-danger)]', '3.5': 'text-[var(--color-danger)]', '3': 'text-[var(--color-danger)]',
}

function getBandColor(band: number): string {
  const key = band.toString()
  return BAND_COLORS[key] || 'text-[var(--color-text-secondary)]'
}

export function BandEstimateCard({ band }: BandEstimateCardProps) {
  const labelId = useId()

  return (
    <div
      className="mt-3 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-4 dark:border-[var(--color-border)] dark:bg-[var(--color-surface-secondary)]"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="mb-3 text-sm font-bold" style={{ color: 'var(--color-text)' }}>
        📊 Speaking Band Estimate
      </p>

      <div className="mb-4 text-center">
        <span className={`text-4xl font-bold ${getBandColor(band.overall)}`}>
          {band.overall}
        </span>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Estimated Overall Band</p>
        <p className="mt-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
          ⚠️ This is a rough estimate based on your typed answer. Pronunciation and fluency in real speech may differ.
        </p>
      </div>

      <div className="space-y-2">
        {[
          { label: 'Fluency & Coherence', value: band.fluency, max: 9 },
          { label: 'Grammar', value: band.grammar, max: 9 },
          { label: 'Vocabulary', value: band.vocabulary, max: 9 },
        ].map(item => (
          <div key={item.label}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
              <span className={`font-medium ${getBandColor(item.value)}`}>{item.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)] dark:bg-[var(--color-surface-secondary)]">
              <div
                className={`h-full rounded-full transition-all ${
                  item.value >= 7 ? 'bg-green-500' : item.value >= 6 ? 'bg-blue-500' : item.value >= 5 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${(item.value / 9) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── React: Feedback Summary Card ────────────────────────────────

interface FeedbackSummaryCardProps {
  feedback: SpeakingFeedback
  part: 1 | 2 | 3
  onNext: () => void
  onSwitchPart: () => void
  disabled?: boolean
}

export function FeedbackSummaryCard({ feedback, part: _part, onNext, onSwitchPart, disabled }: FeedbackSummaryCardProps) {
  return (
    <div className="mt-3 space-y-3">
      <BandEstimateCard band={feedback.bandEstimate} />

      {feedback.corrections.length > 0 && (
        <div className="rounded-xl border-2 border-[var(--color-danger-light)] bg-[var(--color-danger-light)]/50 p-4 dark:border-[var(--color-danger-dark)] dark:bg-[var(--color-danger-dark)]/10">
          <p className="mb-2 text-sm font-medium text-[var(--color-danger)] dark:text-[var(--color-danger)]">🔍 Corrections</p>
          <div className="space-y-2">
            {feedback.corrections.map((c, i) => (
              <div key={i} className="text-xs">
                <p className="text-[var(--color-danger)] dark:text-[var(--color-danger)]">
                  <span className="line-through">{c.original}</span>
                  {' → '}
                  <span className="font-medium text-[var(--color-success)] dark:text-[var(--color-success)]">{c.suggestion}</span>
                </p>
                <p className="mt-0.5" style={{ color: 'var(--color-muted)' }}>{c.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.betterPhrases.length > 0 && (
        <div className="rounded-xl border-2 border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/50 p-4 dark:border-[var(--color-primary-hover)] dark:bg-[var(--color-primary-hover)]/10">
          <p className="mb-2 text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-primary)]">💡 Suggested Phrases</p>
          <div className="space-y-2">
            {feedback.betterPhrases.map((p, i) => (
              <div key={i} className="text-xs">
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>{p.phrase}</p>
                <p style={{ color: 'var(--color-muted)' }}>{p.context}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border-2 border-[var(--color-success-light)] bg-[var(--color-success-light)]/50 p-4 dark:border-[var(--color-success)] dark:bg-[var(--color-success)]/10">
        <p className="mb-1 text-sm font-medium text-[var(--color-success)] dark:text-[var(--color-success)]">📝 Advice</p>
        <p className="whitespace-pre-wrap text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {feedback.generalAdvice}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onNext}
          disabled={disabled}
          className="flex-1 rounded-lg bg-[var(--color-warning)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-warning-dark)] disabled:opacity-50"
        >
          Next Question →
        </button>
        <button
          onClick={onSwitchPart}
          disabled={disabled}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-50 dark:hover:bg-[var(--color-surface-secondary)]"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Switch Part
        </button>
      </div>
    </div>
  )
}

// ── Speaking Session Chat Message Generator ─────────────────────

export function generateSpeakingStartMessage(part: 1 | 2 | 3, questions?: SpeakingQuestionItem[], cueCard?: CueCard): string {
  if (part === 1 && questions) {
    return `🗣️ **IELTS Speaking Part 1 Practice**\n\nI'll ask you a few short questions about familiar topics. Answer each one naturally — don't worry about perfect grammar, just speak!\n\nHere are your questions:\n\n${formatPart1Questions(questions)}\n\n---\nStart with the first question when you're ready!`
  }
  if (part === 2 && cueCard) {
    return formatCueCard(cueCard)
  }
  if (part === 3 && questions) {
    return `🗣️ **IELTS Speaking Part 3 Practice**\n\nThese are deeper discussion questions. Try to give detailed answers with examples and explanations.\n\n${formatPart3Questions(questions)}\n\n---\nStart with the first question when you're ready!`
  }
  return "Let's practice speaking! Choose a part to begin."
}

export function generateSimpleNextPrompt(part: 1 | 2 | 3): string {
  const prompts: Record<number, string> = {
    1: "Type **'next'** for another Part 1 question, or **'part 2'** / **'part 3'** to switch.",
    2: "Type **'next'** for a new cue card, or **'part 1'** / **'part 3'** to switch.",
    3: "Type **'next'** for another Part 3 question, or **'part 1'** / **'part 2'** to switch.",
  }
  return prompts[part]
}
