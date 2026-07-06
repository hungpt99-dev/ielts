import { useState, useId, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────

export type ReadingListeningPhase =
  | 'idle'
  | 'content-input'
  | 'action-select'
  | 'summarizing'
  | 'vocabulary'
  | 'comprehension'
  | 'opinion'
  | 'exercises'
  | 'ielts-connection'
  | 'explaining'
  | 'feedback'

export interface ContentAnalysis {
  text: string
  wordCount: number
  sentenceCount: number
  detectedTopic: string
  difficultWords: { word: string; definition: string }[]
  keyVocabulary: { word: string; meaning: string; ieltsUse: string }[]
}

export interface ReadingQuestion {
  id: string
  question: string
  type: 'factual' | 'inference' | 'vocabulary' | 'opinion'
}

export interface ReadingExercise {
  id: string
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  type: 'fill-blank' | 'multiple-choice' | 'true-false'
}

export interface ReadingAction {
  id: string
  label: string
  icon: string
  description: string
}

export const READING_ACTIONS: ReadingAction[] = [
  { id: 'summarize', label: 'Summarize', icon: '📝', description: 'Get a clear summary of the content' },
  { id: 'vocabulary', label: 'Key Vocabulary', icon: '📖', description: 'Extract useful IELTS words and phrases' },
  { id: 'comprehension', label: 'Comprehension Qs', icon: '❓', description: 'Test your understanding of the content' },
  { id: 'opinion', label: 'Opinion Questions', icon: '💬', description: 'Discuss your thoughts on the topic' },
  { id: 'exercises', label: 'Exercises', icon: '✏️', description: 'Practice with exercises from the content' },
  { id: 'ielts-connection', label: 'IELTS Connection', icon: '🌍', description: 'Connect content to IELTS topics and skills' },
  { id: 'explain', label: 'Explain Something', icon: '🔍', description: 'Ask about a specific sentence or word' },
]

// ── IELTS Topic Vocabulary ────────────────────────────────────

const TOPIC_VOCABULARY: Record<string, { word: string; meaning: string; ieltsUse: string }[]> = {
  environment: [
    { word: 'sustainable', meaning: 'able to be maintained without harming the environment', ieltsUse: 'Writing Task 2 — discussing environmental solutions' },
    { word: 'biodiversity', meaning: 'variety of plant and animal life in a habitat', ieltsUse: 'Reading passages about ecosystems' },
    { word: 'carbon footprint', meaning: 'amount of CO2 produced by an activity', ieltsUse: 'Speaking Part 3 — environmental responsibility' },
    { word: 'renewable', meaning: 'energy from sources that never run out', ieltsUse: 'Writing Task 2 — energy and sustainability' },
    { word: 'ecosystem', meaning: 'community of living organisms and their environment', ieltsUse: 'Reading — science and nature passages' },
    { word: 'deforestation', meaning: 'clearing of forests on a large scale', ieltsUse: 'Writing Task 2 — causes and effects essays' },
    { word: 'emission', meaning: 'production and discharge of gases', ieltsUse: 'Academic Task 1 — describing data about pollution' },
    { word: 'conservation', meaning: 'protection of natural resources', ieltsUse: 'Speaking Part 2 — describe an environmental project' },
  ],
  education: [
    { word: 'curriculum', meaning: 'subjects taught in a school or course', ieltsUse: 'Writing Task 2 — education systems' },
    { word: 'pedagogy', meaning: 'method and practice of teaching', ieltsUse: 'Academic discussions about teaching methods' },
    { word: 'higher education', meaning: 'education at university level', ieltsUse: 'Speaking Part 3 — advantages of university' },
    { word: 'vocational training', meaning: 'training for specific jobs or skills', ieltsUse: 'Writing Task 2 — skills vs academic education' },
    { word: 'critical thinking', meaning: 'ability to analyze and evaluate information', ieltsUse: 'Speaking Part 3 — importance of education' },
    { word: 'lifelong learning', meaning: 'continuous learning throughout life', ieltsUse: 'Writing Task 2 — benefits of education' },
    { word: 'literacy', meaning: 'ability to read and write', ieltsUse: 'Reading passages about social development' },
  ],
  technology: [
    { word: 'innovation', meaning: 'new method, idea, or product', ieltsUse: 'Writing Task 2 — technological progress' },
    { word: 'digital literacy', meaning: 'ability to use digital technology effectively', ieltsUse: 'Speaking Part 3 — technology in education' },
    { word: 'artificial intelligence', meaning: 'computer systems performing human-like tasks', ieltsUse: 'Reading — future of work passages' },
    { word: 'automation', meaning: 'use of machines to do work automatically', ieltsUse: 'Writing Task 2 — impact on employment' },
    { word: 'cybersecurity', meaning: 'protection of computer systems from attacks', ieltsUse: 'Reading — technology and privacy' },
    { word: 'disruptive', meaning: 'causing significant change to an industry', ieltsUse: 'Speaking Part 3 — technology and change' },
  ],
  health: [
    { word: 'wellness', meaning: 'state of being in good health', ieltsUse: 'Writing Task 2 — healthy lifestyle' },
    { word: 'preventive medicine', meaning: 'healthcare focused on preventing disease', ieltsUse: 'Reading — healthcare systems' },
    { word: 'mental health', meaning: 'psychological and emotional well-being', ieltsUse: 'Speaking Part 3 — modern life challenges' },
    { word: 'epidemic', meaning: 'widespread occurrence of a disease', ieltsUse: 'Reading — public health passages' },
    { word: 'nutrition', meaning: 'process of providing food for health and growth', ieltsUse: 'Writing Task 2 — diet and society' },
  ],
  travel: [
    { word: 'tourism', meaning: 'commercial organization of holidays', ieltsUse: 'Writing Task 2 — economic impact of tourism' },
    { word: 'destination', meaning: 'place to which someone is traveling', ieltsUse: 'Speaking Part 1 — travel and holidays' },
    { word: 'cultural heritage', meaning: 'traditions and history of a place', ieltsUse: 'Writing Task 2 — preserving culture' },
    { word: 'ecotourism', meaning: 'responsible travel to natural areas', ieltsUse: 'Speaking Part 3 — sustainable travel' },
    { word: 'accommodation', meaning: 'a place to stay', ieltsUse: 'Listening Section 1 — booking hotels' },
  ],
  work: [
    { word: 'remote work', meaning: 'working from home or away from office', ieltsUse: 'Writing Task 2 — changes in employment' },
    { word: 'work-life balance', meaning: 'balance between work and personal life', ieltsUse: 'Speaking Part 3 — job satisfaction' },
    { word: 'gig economy', meaning: 'labor market of short-term contracts', ieltsUse: 'Reading — changing work patterns' },
    { word: 'occupation', meaning: 'job or profession', ieltsUse: 'Speaking Part 1 — work and study' },
    { word: 'entrepreneurship', meaning: 'starting and running businesses', ieltsUse: 'Writing Task 2 — economy and innovation' },
  ],
  society: [
    { word: 'inequality', meaning: 'difference in status, wealth, or opportunity', ieltsUse: 'Writing Task 2 — social problems' },
    { word: 'globalization', meaning: 'increasing interconnection of countries', ieltsUse: 'Writing Task 2 — culture and economy' },
    { word: 'urbanization', meaning: 'population shift to cities', ieltsUse: 'Reading — city planning and development' },
    { word: 'demographics', meaning: 'statistical characteristics of a population', ieltsUse: 'Academic Task 1 — describing population data' },
    { word: 'infrastructure', meaning: 'basic physical systems of a society', ieltsUse: 'Writing Task 2 — government spending' },
  ],
  science: [
    { word: 'phenomenon', meaning: 'observable fact or event', ieltsUse: 'Reading — scientific passages' },
    { word: 'hypothesis', meaning: 'proposed explanation for something', ieltsUse: 'Reading — research and experiments' },
    { word: 'breakthrough', meaning: 'sudden important discovery', ieltsUse: 'Writing Task 2 — science and technology' },
    { word: 'empirical', meaning: 'based on observation or experience', ieltsUse: 'Reading — scientific method' },
    { word: 'evolution', meaning: 'gradual development over time', ieltsUse: 'Reading — biology and adaptation' },
  ],
  media: [
    { word: 'censorship', meaning: 'suppression of information', ieltsUse: 'Writing Task 2 — freedom of speech' },
    { word: 'journalism', meaning: 'activity of gathering news', ieltsUse: 'Reading — media and communication' },
    { word: 'misinformation', meaning: 'false or misleading information', ieltsUse: 'Speaking Part 3 — social media' },
    { word: 'platform', meaning: 'digital service for communication', ieltsUse: 'Writing Task 2 — technology and society' },
    { word: 'audience', meaning: 'assembled group of listeners or viewers', ieltsUse: 'Listening Section 2 — media talks' },
  ],
}

const DIFFICULT_WORDS: { word: string; definition: string }[] = [
  { word: 'notwithstanding', definition: 'in spite of; nevertheless' },
  { word: 'ubiquitous', definition: 'present everywhere at once' },
  { word: 'paradigm', definition: 'typical example or pattern of something' },
  { word: 'perpetuate', definition: 'make something continue indefinitely' },
  { word: 'unequivocal', definition: 'leaving no doubt; unambiguous' },
  { word: 'juxtaposition', definition: 'placing two things close together for contrast' },
  { word: 'disparity', definition: 'great difference or inequality' },
  { word: 'ameliorate', definition: 'make something bad become better' },
  { word: 'exacerbate', definition: 'make a problem or situation worse' },
  { word: 'pragmatic', definition: 'dealing with things in a practical way' },
  { word: 'scrutinize', definition: 'examine or inspect closely' },
  { word: 'elaborate', definition: 'develop or present in detail' },
  { word: 'inevitable', definition: 'certain to happen; unavoidable' },
  { word: 'profound', definition: 'very great or intense; having deep meaning' },
  { word: 'implication', definition: 'possible consequence or effect' },
  { word: 'deteriorate', definition: 'become progressively worse' },
  { word: 'mitigate', definition: 'make less severe or serious' },
  { word: 'advocate', definition: 'publicly recommend or support' },
  { word: 'comprehensive', definition: 'including all elements or aspects' },
  { word: 'articulate', definition: 'express clearly and fluently' },
]

// ── Topic Detection ───────────────────────────────────────────

function detectTopic(text: string): string {
  const lower = text.toLowerCase()
  if (/\b(environment|climate|pollution|recycling|sustainability|energy|nature|green|emission|carbon|renewable|fossil)\b/.test(lower)) return 'environment'
  if (/\b(education|school|university|student|teacher|learn|study|exam|curriculum|pedagogy|classroom|lesson)\b/.test(lower)) return 'education'
  if (/\b(technology|internet|computer|ai|digital|social media|smartphone|software|innovation|online|tech)\b/.test(lower)) return 'technology'
  if (/\b(health|exercise|diet|doctor|hospital|medicine|sleep|wellness|disease|medical|nutrition|patient)\b/.test(lower)) return 'health'
  if (/\b(travel|tourism|holiday|vacation|country|culture|abroad|tourist|destination|journey|trip|explore)\b/.test(lower)) return 'travel'
  if (/\b(work|job|career|business|office|company|employ|profession|salary|employment|workplace)\b/.test(lower)) return 'work'
  if (/\b(society|community|population|urban|rural|inequality|poverty|social|welfare|demographic)\b/.test(lower)) return 'society'
  if (/\b(science|research|experiment|study|discovery|scientific|laboratory|theory|data|analysis)\b/.test(lower)) return 'science'
  if (/\b(media|news|newspaper|journalist|broadcast|advertise|press|television|radio|online)\b/.test(lower)) return 'media'
  return 'general'
}

function detectContentType(text: string): 'article' | 'transcript' | 'general' {
  const lower = text.toLowerCase()
  if (/\b(transcript|speaker|interviewer|interviewee|host|guest|podcast|episode|discussion)\b/.test(lower)) return 'transcript'
  if (/\b(article|report|study|research|according to|published|journal|newspaper)\b/.test(lower)) return 'article'
  return 'general'
}

// ── Content Analysis ──────────────────────────────────────────

export function analyzeContent(text: string): ContentAnalysis {
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const lower = text.toLowerCase()
  const detectedTopic = detectTopic(text)
  const contentType = detectContentType(text)

  const foundDifficult = DIFFICULT_WORDS.filter(dw => lower.includes(dw.word.toLowerCase()))
  const foundVocab = TOPIC_VOCABULARY[detectedTopic]?.filter(v => lower.includes(v.word.toLowerCase())) ?? []

  if (foundDifficult.length === 0 && contentType === 'article') {
    foundDifficult.push(
      { word: 'significant', definition: 'sufficiently great or important to be worthy of attention' },
      { word: 'consequence', definition: 'a result or effect of an action' },
    )
  }

  if (foundVocab.length === 0 && TOPIC_VOCABULARY[detectedTopic]) {
    foundVocab.push(...TOPIC_VOCABULARY[detectedTopic].slice(0, 3))
  }

  return {
    text,
    wordCount: words.length,
    sentenceCount: sentences.length,
    detectedTopic,
    difficultWords: foundDifficult.slice(0, 6),
    keyVocabulary: foundVocab.slice(0, 6),
  }
}

// ── Welcome / Content Input ───────────────────────────────────

export function getWelcomeMessage(type: 'reading' | 'listening'): string {
  if (type === 'reading') {
    return "📰 **Reading Discussion Tutor**\n\nShare any article, passage, or text you'd like to discuss! I can:\n\n• **Summarize** the content\n• **Explain** difficult sentences or words\n• **Extract** useful IELTS vocabulary\n• **Ask** comprehension and opinion questions\n• **Create** exercises from the content\n• **Connect** the topic to IELTS\n\nJust paste your text below to get started!"
  }
  return "🎧 **Listening Discussion Tutor**\n\nShare any transcript or audio notes you'd like to work with! I can:\n\n• **Summarize** what was discussed\n• **Explain** tricky phrases\n• **Extract** key vocabulary\n• **Ask** listening comprehension questions\n• **Create** exercises from the content\n• **Connect** to IELTS listening skills\n\nJust paste your transcript or notes below!"
}

export function detectContentSubmission(message: string): boolean {
  return message.trim().split(/\s+/).length >= 10
}

// ── Action Selector ───────────────────────────────────────────

export function getActionSelectorMessage(analysis: ContentAnalysis): string {
  const topicLabel = analysis.detectedTopic.charAt(0).toUpperCase() + analysis.detectedTopic.slice(1)
  return `📊 **Content Analysis Summary**\n\n**Topic detected:** ${topicLabel}\n**Word count:** ${analysis.wordCount}\n**Estimated reading/listening time:** ${Math.max(1, Math.ceil(analysis.wordCount / 200))} min\n**Difficulty words found:** ${analysis.difficultWords.length}\n**IELTS vocabulary found:** ${analysis.keyVocabulary.length}\n\n---\n\nWhat would you like to do with this content? Choose an option below! 👇`
}

export function detectActionChoice(message: string): string | null {
  const lower = message.trim().toLowerCase()
  if (/^1$|summarize|summary|main idea|overview/i.test(lower)) return 'summarize'
  if (/^2$|vocab|vocabulary|word|meaning|phrase/i.test(lower)) return 'vocabulary'
  if (/^3$|comprehension|understand|question/i.test(lower)) return 'comprehension'
  if (/^4$|opinion|think|feel|believe|view/i.test(lower)) return 'opinion'
  if (/^5$|exercise|practice|quiz|test/i.test(lower)) return 'exercises'
  if (/^6$|ielts|band|exam|test|score/i.test(lower)) return 'ielts-connection'
  if (/^7$|explain|meaning|sentence|word|phrase|what does/i.test(lower)) return 'explain'
  return null
}

// ── Summary Generation ────────────────────────────────────────

export function generateSummary(analysis: ContentAnalysis, language: 'english' | 'vietnamese' | 'both'): string {
  const topic = analysis.detectedTopic
  const wc = analysis.wordCount

  const eng = getSummaryEnglish(topic, wc, analysis.text)
  const viet = getSummaryVietnamese(topic, wc)

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}\n\n---\n\n💡 Type **"back"** to choose another action, or share new content!`
  return `${eng}\n\n---\n\n💡 Type **"back"** to choose another action, or share new content!`
}

function getSummaryEnglish(topic: string, _wc: number, _text: string): string {
  const summaries: Record<string, string> = {
    environment: "**Summary** 🌍\n\nThis content discusses environmental topics. It covers issues related to nature, sustainability, climate, and the impact of human activities on the planet. The author explores the relationship between economic development and environmental protection, highlighting the need for balanced approaches.\n\n**Key points:**\n• Environmental challenges require collective action\n• Sustainable practices are essential for the future\n• Individual and government efforts both matter\n\nWould you like me to explain any specific part in more detail?",
    education: "**Summary** 📚\n\nThis content focuses on education-related topics. It discusses learning methods, educational systems, and the role of education in personal and societal development. The text explores different perspectives on how education should be structured and delivered.\n\n**Key points:**\n• Education plays a vital role in personal growth\n• Different approaches to teaching and learning exist\n• The education system continues to evolve\n\nWould you like me to explain any specific part in more detail?",
    technology: "**Summary** 💻\n\nThis content explores technology and its impact on modern life. It discusses digital transformation, innovation, and how technological advances are reshaping various aspects of society, from communication to work and education.\n\n**Key points:**\n• Technology is transforming how we live and work\n• Digital skills are increasingly important\n• Innovation brings both opportunities and challenges\n\nWould you like me to explain any specific part in more detail?",
    health: "**Summary** 🏥\n\nThis content covers health and wellness topics. It discusses physical and mental well-being, healthcare systems, and factors that contribute to a healthy lifestyle. The text emphasizes the importance of prevention and balanced living.\n\n**Key points:**\n• Health is influenced by multiple factors\n• Prevention is better than cure\n• Mental health deserves equal attention\n\nWould you like me to explain any specific part in more detail?",
    travel: "**Summary** ✈️\n\nThis content discusses travel, tourism, and cultural exploration. It explores different destinations, travel experiences, and the impact of tourism on local communities and the environment.\n\n**Key points:**\n• Travel broadens perspectives and understanding\n• Tourism has economic and environmental impacts\n• Cultural exchange enriches both visitors and hosts\n\nWould you like me to explain any specific part in more detail?",
  }
  return summaries[topic] || `**Summary** 📝\n\nThis content discusses a range of interesting ideas related to **${topic}** and general topics. The text presents information and perspectives that can be connected to various IELTS themes.\n\n**Key points:**\n• The content explores ${topic}-related ideas\n• There are useful vocabulary items and concepts to learn\n• The topic can be connected to IELTS Speaking and Writing\n\nWould you like me to explain any specific part in more detail?`
}

function getSummaryVietnamese(topic: string, _wc: number): string {
  const summaries: Record<string, string> = {
    environment: "**Tóm tắt** 🌍\n\nNội dung này thảo luận về các chủ đề môi trường. Bài viết đề cập đến các vấn đề liên quan đến thiên nhiên, tính bền vững, khí hậu và tác động của hoạt động con người lên hành tinh.\n\n**Ý chính:**\n• Thách thức môi trường cần hành động tập thể\n• Các thực hành bền vững rất cần thiết cho tương lai\n• Cả nỗ lực cá nhân và chính phủ đều quan trọng",
    education: "**Tóm tắt** 📚\n\nNội dung này tập trung vào các chủ đề giáo dục. Bài viết thảo luận về phương pháp học tập, hệ thống giáo dục và vai trò của giáo dục đối với sự phát triển cá nhân và xã hội.\n\n**Ý chính:**\n• Giáo dục đóng vai trò quan trọng trong phát triển cá nhân\n• Có nhiều cách tiếp cận khác nhau trong giảng dạy\n• Hệ thống giáo dục không ngừng phát triển",
    technology: "**Tóm tắt** 💻\n\nNội dung này khám phá công nghệ và tác động của nó đến cuộc sống hiện đại. Bài viết thảo luận về chuyển đổi số, đổi mới sáng tạo và cách công nghệ đang thay đổi xã hội.\n\n**Ý chính:**\n• Công nghệ đang thay đổi cách chúng ta sống và làm việc\n• Kỹ năng số ngày càng quan trọng\n• Đổi mới mang đến cả cơ hội và thách thức",
  }
  return summaries[topic] || `**Tóm tắt** 📝\n\nNội dung này thảo luận về các ý tưởng liên quan đến chủ đề ${topic}. Bài viết trình bày thông tin và góc nhìn có thể kết nối với các chủ đề IELTS.\n\n**Ý chính:**\n• Nội dung khám phá các ý tưởng về ${topic}\n• Có nhiều từ vựng hữu ích để học\n• Chủ đề này thường xuất hiện trong IELTS Speaking và Writing`
}

// ── Vocabulary Extraction ─────────────────────────────────────

export function generateVocabularyList(analysis: ContentAnalysis, language: 'english' | 'vietnamese' | 'both'): string {
  const eng = generateVocabEnglish(analysis)
  const viet = generateVocabVietnamese(analysis)

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}\n\n---\n\n💡 Type **"back"** to choose another action!`
  return `${eng}\n\n---\n\n💡 Type **"back"** to choose another action!`
}

function generateVocabEnglish(analysis: ContentAnalysis): string {
  const parts: string[] = []
  parts.push('📖 **Key IELTS Vocabulary from This Content**')

  if (analysis.keyVocabulary.length > 0) {
    parts.push('\n**Topic-Specific Vocabulary:**')
    analysis.keyVocabulary.forEach(v => {
      parts.push(`• **${v.word}** — ${v.meaning}`)
      parts.push(`  📌 ${v.ieltsUse}`)
    })
  }

  if (analysis.difficultWords.length > 0) {
    parts.push('\n**Advanced / Difficult Words:**')
    analysis.difficultWords.forEach(dw => {
      parts.push(`• **${dw.word}** — ${dw.definition}`)
    })
  }

  if (analysis.keyVocabulary.length === 0 && analysis.difficultWords.length === 0) {
    parts.push('\nI found some general vocabulary that may be useful for IELTS:')
    const genWords = [
      { word: 'significant', meaning: 'important or large enough to be noticed' },
      { word: 'consequence', meaning: 'a result or effect of an action' },
      { word: 'contribute', meaning: 'give to a common purpose' },
    ]
    genWords.forEach(w => {
      parts.push(`• **${w.word}** — ${w.meaning}`)
    })
  }

  parts.push('\n💡 **Tip:** Try writing 3 sentences using these words to help remember them!')
  parts.push('\n---\nType **"back"** to choose another action, or **"save"** to save these words to your vocabulary list!')
  return parts.join('\n')
}

function generateVocabVietnamese(analysis: ContentAnalysis): string {
  const parts: string[] = []
  parts.push('📖 **Từ vựng IELTS quan trọng từ nội dung này**')

  if (analysis.keyVocabulary.length > 0) {
    parts.push('\n**Từ vựng theo chủ đề:**')
    analysis.keyVocabulary.forEach(v => {
      parts.push(`• **${v.word}** — ${v.meaning}`)
    })
  }

  if (analysis.difficultWords.length > 0) {
    parts.push('\n**Từ nâng cao / khó:**')
    analysis.difficultWords.forEach(dw => {
      parts.push(`• **${dw.word}** — ${dw.definition}`)
    })
  }

  parts.push('\n💡 **Mẹo:** Hãy thử viết 3 câu sử dụng các từ này để ghi nhớ lâu hơn!')
  return parts.join('\n')
}

// ── Comprehension Questions ───────────────────────────────────

export function generateComprehensionQuestions(analysis: ContentAnalysis, language: 'english' | 'vietnamese' | 'both'): string {
  const topic = analysis.detectedTopic
  const questions = getTopicQuestions(topic)

  const eng = `❓ **Comprehension Questions**\n\nTest your understanding of this content. Try to answer these questions in your own words:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}\n\n---\n\nTry answering these one at a time! Type the number of the question you'd like to answer, or type your answer directly.`

  const viet = `❓ **Câu hỏi đọc hiểu**\n\nHãy trả lời các câu hỏi sau để kiểm tra mức độ hiểu nội dung:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}\n\n---\n\nNhập số câu hỏi bạn muốn trả lời, hoặc trả lời trực tiếp!`

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}\n\n---\n\n💡 Type **"back"** to choose another action!`
  return `${eng}\n\n---\n\n💡 Type **"back"** to choose another action!`
}

function getTopicQuestions(topic: string): string[] {
  const questionSets: Record<string, string[]> = {
    environment: [
      'What is the main environmental issue discussed in this content?',
      'What solutions does the author suggest for environmental problems?',
      'Do you think individual actions or government policies are more effective for protecting the environment?',
      'How does this content connect to the concept of sustainability?',
      'What vocabulary related to climate change can you find in the text?',
    ],
    education: [
      'What is the main argument about education in this content?',
      'How does this content describe different learning methods?',
      'What challenges in education are mentioned?',
      'Do you agree with the author\'s perspective on education? Why or why not?',
      'What education-related vocabulary would be useful for IELTS Writing Task 2?',
    ],
    technology: [
      'How does this content describe the impact of technology on society?',
      'What are the benefits and drawbacks of technology mentioned?',
      'Does the author present a balanced view of technological progress?',
      'How has technology changed the way people communicate, according to this text?',
      'What technology vocabulary can you identify for IELTS Speaking Part 3?',
    ],
    health: [
      'What health-related issues are discussed in this content?',
      'What factors contribute to good health according to the text?',
      'Does the content focus more on physical or mental health?',
      'What preventive measures are suggested?',
      'How can this topic be discussed in IELTS Speaking Part 3?',
    ],
    travel: [
      'What travel destinations or experiences are described?',
      'How does this content portray the relationship between tourism and local communities?',
      'What are the benefits of travel mentioned in the text?',
      'Are there any negative impacts of tourism discussed?',
      'How would you use this topic in an IELTS Speaking Part 2 answer?',
    ],
  }
  return questionSets[topic] || [
    'What is the main idea or argument of this content?',
    'Can you summarize the key points in 2-3 sentences?',
    'What evidence or examples does the author provide?',
    'Do you agree with the perspectives presented? Why?',
    'How could this content be useful for your IELTS preparation?',
  ]
}

// ── Opinion Questions ─────────────────────────────────────────

export function generateOpinionQuestions(analysis: ContentAnalysis, language: 'english' | 'vietnamese' | 'both'): string {
  const topic = analysis.detectedTopic
  const questions = getOpinionQuestions(topic)

  const eng = `💬 **Opinion & Discussion Questions**\n\nThese questions will help you practice expressing your opinions — a key skill for IELTS Speaking Part 3 and Writing Task 2:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}\n\n---\n\nShare your thoughts! Type your answer to any question, or type a number to select one.`

  const viet = `💬 **Câu hỏi ý kiến & thảo luận**\n\nNhững câu hỏi này giúp bạn luyện tập diễn đạt ý kiến — kỹ năng quan trọng cho IELTS Speaking Part 3 và Writing Task 2:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}\n\n---\n\nChia sẻ suy nghĩ của bạn! Nhập câu trả lời hoặc số câu hỏi.`

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}\n\n---\n\n💡 Type **"back"** to choose another action!`
  return `${eng}\n\n---\n\n💡 Type **"back"** to choose another action!`
}

function getOpinionQuestions(topic: string): string[] {
  const opinionSets: Record<string, string[]> = {
    environment: [
      'Do you think governments are doing enough to protect the environment?',
      'Should individuals be responsible for reducing their carbon footprint, or is it mostly the job of corporations?',
      'Is it possible to have economic growth without harming the environment?',
      'What is the most effective way to encourage people to recycle more?',
    ],
    education: [
      'Do you think the current education system prepares students well for the future?',
      'Should university education be free for everyone?',
      'Is online learning as effective as traditional classroom learning?',
      'What subjects should be mandatory in schools?',
    ],
    technology: [
      'Has technology improved our lives or made them more complicated?',
      'Do you think artificial intelligence will eventually replace human workers?',
      'Should social media platforms be more strictly regulated?',
      'What technological development has had the biggest impact on society?',
    ],
    health: [
      'Should healthcare be free for all citizens?',
      'What is more important for good health: diet, exercise, or mental well-being?',
      'Do you think people today are more health-conscious than previous generations?',
      'How can governments encourage citizens to lead healthier lifestyles?',
    ],
    travel: [
      'Is tourism beneficial or harmful to local communities?',
      'Do you prefer traveling to familiar places or exploring new destinations?',
      'Should people travel more to understand different cultures?',
      'How has the way people travel changed in recent years?',
    ],
  }
  return opinionSets[topic] || [
    'What is your opinion on the main topic of this content?',
    'Do you agree or disagree with the author\'s perspective? Why?',
    'Can you think of any examples from your own experience related to this topic?',
    'How do you think this issue will develop in the future?',
  ]
}

// ── Exercises ─────────────────────────────────────────────────

export function generateExercises(analysis: ContentAnalysis, language: 'english' | 'vietnamese' | 'both'): string {
  const topic = analysis.detectedTopic
  const exercises = getTopicExercises(topic)

  const eng = `✏️ **Exercises from This Content**\n\nPractice with these exercises based on the topic:\n\n${exercises.map((ex, i) => `**${i + 1}. ${ex.question}**\n${ex.type === 'multiple-choice' ? ex.options?.map((o, j) => `${String.fromCharCode(97 + j)}) ${o}`).join('\n') : ''}\n`).join('\n')}\n\n---\n\nType the **number** of the exercise you want to answer, or type your answer directly!`

  const viet = `✏️ **Bài tập từ nội dung này**\n\nLuyện tập với các bài tập dựa trên chủ đề:\n\n${exercises.map((ex, i) => `**${i + 1}. ${ex.question}**\n${ex.type === 'multiple-choice' ? ex.options?.map((o, j) => `${String.fromCharCode(97 + j)}) ${o}`).join('\n') : ''}\n`).join('\n')}\n\n---\n\nNhập số bài tập hoặc câu trả lời của bạn!`

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}\n\n---\n\n💡 Type **"back"** to choose another action, or answer an exercise above!`
  return `${eng}\n\n---\n\n💡 Type **"back"** to choose another action, or answer an exercise above!`
}

function getTopicExercises(topic: string): ReadingExercise[] {
  const sets: Record<string, ReadingExercise[]> = {
    environment: [
      {
        id: 'rl-env-1', type: 'fill-blank',
        question: 'Many companies are trying to reduce their carbon _____ by using renewable energy.',
        correctAnswer: 'footprint',
        explanation: 'Carbon footprint = the amount of CO2 a person or activity produces.',
      },
      {
        id: 'rl-env-2', type: 'multiple-choice',
        question: 'Which of the following is an example of renewable energy?',
        options: ['Coal', 'Natural gas', 'Solar power', 'Nuclear fuel'],
        correctAnswer: 'Solar power',
        explanation: 'Solar power comes from the sun, a source that never runs out — making it renewable.',
      },
      {
        id: 'rl-env-3', type: 'true-false',
        question: '"Deforestation helps to reduce carbon emissions." Is this statement true or false?',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Deforestation actually increases carbon emissions because trees absorb CO2.',
      },
      {
        id: 'rl-env-4', type: 'fill-blank',
        question: 'The Amazon rainforest has incredible _____ — it is home to millions of species.',
        correctAnswer: 'biodiversity',
        explanation: 'Biodiversity refers to the variety of plant and animal life in a habitat.',
      },
    ],
    education: [
      {
        id: 'rl-edu-1', type: 'fill-blank',
        question: 'The school _____ includes both academic subjects and sports.',
        correctAnswer: 'curriculum',
        explanation: 'Curriculum = the subjects taught in a school or course.',
      },
      {
        id: 'rl-edu-2', type: 'multiple-choice',
        question: 'What does "pedagogy" refer to?',
        options: ['School rules', 'Teaching methods', 'Student grades', 'Classroom furniture'],
        correctAnswer: 'Teaching methods',
        explanation: 'Pedagogy is the method and practice of teaching.',
      },
      {
        id: 'rl-edu-3', type: 'true-false',
        question: '"Vocational training focuses on academic theory rather than practical skills." True or false?',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Vocational training focuses on practical job-specific skills, not academic theory.',
      },
    ],
    technology: [
      {
        id: 'rl-tech-1', type: 'fill-blank',
        question: 'Artificial _____ is being used to diagnose diseases more accurately.',
        correctAnswer: 'intelligence',
        explanation: 'Artificial intelligence (AI) = computer systems that perform tasks requiring human intelligence.',
      },
      {
        id: 'rl-tech-2', type: 'multiple-choice',
        question: 'What does "disruptive technology" mean?',
        options: ['Technology that breaks easily', 'Technology that causes major industry change', 'Old-fashioned technology', 'Technology that is very cheap'],
        correctAnswer: 'Technology that causes major industry change',
        explanation: 'Disruptive technology fundamentally changes how an industry operates.',
      },
      {
        id: 'rl-tech-3', type: 'fill-blank',
        question: '_____ is the practice of protecting computer systems from digital attacks.',
        correctAnswer: 'Cybersecurity',
        explanation: 'Cybersecurity protects systems, networks, and data from cyber threats.',
      },
    ],
    health: [
      {
        id: 'rl-heal-1', type: 'fill-blank',
        question: '_____ medicine focuses on preventing diseases rather than treating them.',
        correctAnswer: 'Preventive',
        explanation: 'Preventive medicine aims to prevent health problems before they occur.',
      },
      {
        id: 'rl-heal-2', type: 'multiple-choice',
        question: 'Which is NOT a factor in maintaining good mental health?',
        options: ['Regular exercise', 'Social connections', 'Excessive stress', 'Adequate sleep'],
        correctAnswer: 'Excessive stress',
        explanation: 'Excessive stress is harmful to mental health, while the other factors are beneficial.',
      },
    ],
    travel: [
      {
        id: 'rl-trav-1', type: 'fill-blank',
        question: '_____ is a form of tourism that focuses on visiting natural areas responsibly.',
        correctAnswer: 'Ecotourism',
        explanation: 'Ecotourism promotes responsible travel to natural areas that conserves the environment.',
      },
      {
        id: 'rl-trav-2', type: 'multiple-choice',
        question: 'What does "cultural heritage" include?',
        options: ['Only buildings', 'Traditions, customs, and historical sites', 'Modern technology', 'Natural landscapes only'],
        correctAnswer: 'Traditions, customs, and historical sites',
        explanation: 'Cultural heritage encompasses traditions, customs, historical sites, and cultural practices.',
      },
    ],
  }
  return sets[topic] || [
    {
      id: 'rl-gen-1', type: 'fill-blank',
      question: 'One _____ of climate change is the increase in extreme weather events.',
      correctAnswer: 'consequence',
      explanation: 'Consequence = a result or effect of an action or condition.',
    },
    {
      id: 'rl-gen-2', type: 'multiple-choice',
      question: 'What does "significant" mean in academic writing?',
      options: ['Very small', 'Important or large enough to notice', 'Completely unrelated', 'Easily forgotten'],
      correctAnswer: 'Important or large enough to notice',
      explanation: 'Significant means sufficiently great or important to be worthy of attention.',
    },
  ]
}

// ── IELTS Connection ──────────────────────────────────────────

export function generateIeltsConnection(analysis: ContentAnalysis, language: 'english' | 'vietnamese' | 'both'): string {
  const topic = analysis.detectedTopic
  const eng = getIeltsConnectionEnglish(topic)
  const viet = getIeltsConnectionVietnamese(topic)

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}\n\n---\n\n💡 Type **"back"** to choose another action!`
  return `${eng}\n\n---\n\n💡 Type **"back"** to choose another action!`
}

function getIeltsConnectionEnglish(topic: string): string {
  const connections: Record<string, string> = {
    environment: "🌍 **IELTS Connection: Environment**\n\nThe topic of environment is **very common** in IELTS. Here's how it appears:\n\n**Writing Task 2:**\n• \"Some people think that environmental problems should be solved by governments, while others believe individuals can do more. Discuss both views.\"\n• Keywords: sustainable development, carbon emissions, climate change, renewable energy\n\n**Speaking Part 3:**\n• \"What do you think is the biggest environmental problem in your country?\"\n• \"How can individuals help protect the environment?\"\n\n**Reading:**\n• Passages about climate change, conservation, pollution, and ecosystems are very common.\n\n**Listening:**\n• Section 4 often includes lectures on environmental topics.\n\n💡 **Tip:** Practice writing a paragraph about this topic using vocabulary from this content!",
    education: "📚 **IELTS Connection: Education**\n\nEducation is one of the most frequent IELTS topics:\n\n**Writing Task 2:**\n• \"Some people believe that universities should focus on academic subjects, while others think they should teach practical skills. Discuss.\"\n• Keywords: curriculum, pedagogy, higher education, vocational training\n\n**Speaking Part 1:**\n• \"Do you work or are you a student?\"\n• \"What subject are you studying?\"\n\n**Speaking Part 3:**\n• \"Do you think education will change in the future?\"\n• \"Is online learning as effective as traditional education?\"\n\n💡 **Tip:** Use specific education vocabulary in your answers to impress the examiner!",
    technology: "💻 **IELTS Connection: Technology**\n\nTechnology appears across all IELTS skills:\n\n**Writing Task 2:**\n• \"Some people think that technology has made our lives more complicated. To what extent do you agree or disagree?\"\n• Keywords: innovation, automation, digital literacy, artificial intelligence\n\n**Speaking Part 2:**\n• \"Describe a piece of technology you use regularly.\"\n• \"Describe an important technological development.\"\n\n**Reading:**\n• Passages about the internet, AI, social media, and digital transformation.\n\n💡 **Tip:** In IELTS, don't just list technology — discuss its IMPACT on society.",
    health: "🏥 **IELTS Connection: Health**\n\nHealth is a common topic in IELTS:\n\n**Writing Task 2:**\n• \"Some people think that governments should provide free healthcare to all citizens. Do you agree or disagree?\"\n• Keywords: preventive medicine, mental health, nutrition, healthcare system\n\n**Speaking Part 3:**\n• \"How can people maintain a healthy lifestyle?\"\n• \"Do you think young people today are less healthy than previous generations?\"\n\n**Reading:**\n• Passages about diet, exercise, medical research, and public health.\n\n💡 **Tip:** Learn topic-specific collocations like 'sedentary lifestyle', 'balanced diet', and 'public health campaign'.",
    travel: "✈️ **IELTS Connection: Travel & Tourism**\n\nTravel is a favorite IELTS topic:\n\n**Writing Task 2:**\n• \"Tourism is becoming increasingly important for many countries. What are the advantages and disadvantages?\"\n• Keywords: ecotourism, cultural heritage, destination, sustainable tourism\n\n**Speaking Part 1:**\n• \"Do you like to travel?\"\n• \"What kind of places have you visited?\"\n\n**Speaking Part 2:**\n• \"Describe a memorable trip you took.\"\n\n💡 **Tip:** Use travel vocabulary to make your Speaking answers more vivid and detailed!",
  }
  return connections[topic] || `🌍 **IELTS Connection: ${topic.charAt(0).toUpperCase() + topic.slice(1)}**\n\nThe topic of **${topic}** is relevant to IELTS in several ways:\n\n**Writing Task 2:**\n• Essays about ${topic} require clear arguments and specific examples.\n• Use topic-specific vocabulary to demonstrate lexical range.\n\n**Speaking Part 3:**\n• You may be asked to discuss ${topic}-related issues in depth.\n• Practice giving your opinion with reasons and examples.\n\n**Reading:**\n• Academic passages about ${topic} often appear in the Reading test.\n\n💡 **Tip:** Read articles about ${topic} regularly to build your vocabulary and knowledge!`
}

function getIeltsConnectionVietnamese(topic: string): string {
  const connections: Record<string, string> = {
    environment: "🌍 **Kết nối IELTS: Môi trường**\n\nChủ đề môi trường **rất phổ biến** trong IELTS:\n\n**Writing Task 2:** Các bài luận về bảo vệ môi trường, năng lượng tái tạo, biến đổi khí hậu\n**Speaking Part 3:** Câu hỏi về trách nhiệm bảo vệ môi trường\n**Reading:** Các bài đọc về hệ sinh thái và ô nhiễm",
    education: "📚 **Kết nối IELTS: Giáo dục**\n\nChủ đề giáo dục xuất hiện thường xuyên trong IELTS:\n\n**Writing Task 2:** Bài luận về hệ thống giáo dục, học trực tuyến, kỹ năng vs kiến thức\n**Speaking Part 1:** Câu hỏi về việc học tập\n**Speaking Part 3:** Thảo luận về tương lai của giáo dục",
    technology: "💻 **Kết nối IELTS: Công nghệ**\n\nCông nghệ xuất hiện trong tất cả kỹ năng IELTS:\n\n**Writing Task 2:** Tác động của công nghệ đến xã hội\n**Speaking Part 2:** Miêu tả một thiết bị công nghệ\n**Reading:** Các bài đọc về AI, mạng xã hội, chuyển đổi số",
  }
  return connections[topic] || `🌍 **Kết nối IELTS: ${topic.charAt(0).toUpperCase() + topic.slice(1)}**\n\nChủ đề này có thể xuất hiện trong IELTS:\n\n**Writing Task 2:** Bài luận về các vấn đề liên quan\n**Speaking Part 3:** Câu hỏi thảo luận sâu\n**Reading:** Các bài đọc học thuật`
}

// ── Explanation ───────────────────────────────────────────────

export function generateExplanation(_text: string, userQuery: string, analysis: ContentAnalysis, language: 'english' | 'vietnamese' | 'both'): string {
  const lower = userQuery.toLowerCase()
  let eng = ''
  let viet = ''

  const wordMatch = userQuery.match(/"([^"]+)"|'([^']+)'|`([^`]+)`/)

  if (wordMatch) {
    const targetWord = (wordMatch[1] || wordMatch[2] || wordMatch[3] || '').toLowerCase()
    const found = DIFFICULT_WORDS.find(dw => dw.word.toLowerCase() === targetWord)
    if (found) {
      eng = `🔍 **Explanation: "${found.word}"**\n\n**Definition:** ${found.definition}\n\nThis is an advanced word that can impress IELTS examiners when used correctly in Writing Task 2 or Speaking Part 3.\n\n**Example sentence:** "The government must ${found.word === 'mitigate' ? 'mitigate the effects of climate change' : found.word === 'advocate' ? 'advocate for policy reform' : 'address this significant issue'}."`
    } else {
      const topicVocab = TOPIC_VOCABULARY[analysis.detectedTopic]?.find(v => v.word.toLowerCase() === targetWord)
      if (topicVocab) {
        eng = `🔍 **Explanation: "${topicVocab.word}"**\n\n**Meaning:** ${topicVocab.meaning}\n\n**IELTS Use:** ${topicVocab.ieltsUse}\n\nThis is excellent vocabulary to use in your IELTS responses! Try writing a sentence with it.`
      } else {
        eng = `🔍 **Explanation: "${targetWord}"**\n\nThis word appears in the content you shared. In the context of this passage, it relates to the topic of **${analysis.detectedTopic}**. Try to understand its meaning from the surrounding sentences — this is an important IELTS reading skill (guessing meaning from context)!`
      }
    }
  } else if (/\b(sentence|phrase|part|paragraph|section|line)\b/.test(lower)) {
    eng = `🔍 **Let me explain that part**\n\nLooking at that section in the context of ${analysis.detectedTopic}, the author is making a point about the topic. The key idea here is that **${analysis.detectedTopic}** has significant implications for IELTS-related discussions.\n\nIn simpler terms, this part suggests that understanding ${analysis.detectedTopic} is important for developing your opinions and arguments in the IELTS exam.`
  } else {
    eng = `🔍 **Let me help you understand**\n\nThis content discusses **${analysis.detectedTopic}**, which is a common IELTS topic. The main ideas can be summarized as:\n\n• The content presents information about ${analysis.detectedTopic}\n• It contains useful vocabulary for IELTS\n• The topic can be connected to Writing Task 2 and Speaking Part 3\n\nWhich specific word or sentence would you like me to explain? You can quote it using "quotes"!`
  }

  viet = `🔍 **Giải thích**\n\nNội dung này thảo luận về chủ đề **${analysis.detectedTopic}**, một chủ đề phổ biến trong IELTS. Bạn có thể trích dẫn từ hoặc câu cụ thể bằng dấu ngoặc kép để tôi giải thích chi tiết!`

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}\n\n---\n\n💡 Type **"back"** to choose another action!`
  return `${eng}\n\n---\n\n💡 Type **"back"** to choose another action!`
}

// ── Evaluate Answer ───────────────────────────────────────────

export function evaluateAnswer(userAnswer: string, exercise: ReadingExercise): { isCorrect: boolean; feedback: string } {
  const normalizedUser = userAnswer.trim().toLowerCase()
  const normalizedCorrect = exercise.correctAnswer.trim().toLowerCase()

  let isCorrect = false
  if (exercise.type === 'multiple-choice' || exercise.type === 'true-false') {
    const optionLetters = ['a', 'b', 'c', 'd']
    const optionIndex = optionLetters.indexOf(normalizedUser)
    if (optionIndex >= 0 && exercise.options && optionIndex < exercise.options.length) {
      isCorrect = exercise.options[optionIndex].toLowerCase() === normalizedCorrect
    } else {
      isCorrect = normalizedUser === normalizedCorrect
    }
  } else {
    isCorrect = normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)
  }

  if (isCorrect) {
    return {
      isCorrect: true,
      feedback: `✅ **Correct!** Great answer.\n\n${exercise.explanation}\n\nKeep up the good work! 🌟`,
    }
  }

  return {
    isCorrect: false,
    feedback: `📝 **Good try!** The correct answer is: "${exercise.correctAnswer}".\n\n${exercise.explanation}\n\nReview this point and try again! 💪`,
  }
}

// ── Check if user wants to go back ────────────────────────────

export function isBackRequest(text: string): boolean {
  const lower = text.trim().toLowerCase()
  return /^(back|menu|return|main|home|options)$/.test(lower) || /^(go back|back to|show menu|show options)$/i.test(lower)
}

export function isSaveRequest(text: string): boolean {
  const lower = text.trim().toLowerCase()
  return /^(save|bookmark|keep|store)$/.test(lower) || /^(save this|save vocab|save words)$/i.test(lower)
}

// ── Answer Evaluation (general) ───────────────────────────────

export function generateAnswerFeedback(userAnswer: string): string {
  const wc = userAnswer.split(/\s+/).filter(Boolean).length
  const feedback: string[] = []

  if (wc < 10) {
    feedback.push('Your answer is quite short. Try to expand with more details or examples.')
  } else if (wc >= 30) {
    feedback.push('Great effort! You provided a detailed response.')
  }

  if (!/\b(because|therefore|however|for example|such as|in my opinion|i think)\b/i.test(userAnswer)) {
    feedback.push('Try using linking words like "because", "for example", or "in my opinion" to structure your answer better.')
  }

  if (feedback.length === 0) {
    feedback.push('Good answer! You expressed your ideas clearly. Keep practicing!')
  }

  return `💬 **Feedback on Your Answer**\n\n**Word count:** ${wc}\n\n${feedback.map(f => `• ${f}`).join('\n')}\n\nKeep expressing your ideas — this is excellent practice for IELTS Speaking and Writing! 🎯`
}

// ── React: Action Selector Card ───────────────────────────────

interface ActionSelectorCardProps {
  onSelect: (actionId: string) => void
  disabled?: boolean
}

export function ActionSelectorCard({ onSelect, disabled }: ActionSelectorCardProps) {
  const labelId = useId()

  return (
    <div
      className="mt-3 rounded-xl border-2 border-[var(--color-skill-listening-light)] bg-[var(--color-skill-listening-light)]/50 p-4 dark:border-[var(--color-skill-listening-dark)] dark:bg-[var(--color-skill-listening-dark)]/10"
      role="group"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        📌 Choose an Action
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {READING_ACTIONS.map(action => (
          <button
            key={action.id}
            title={action.description}
            onClick={() => onSelect(action.id)}
            disabled={disabled}
            className="flex flex-col items-center gap-1 rounded-lg border-2 border-[var(--color-skill-listening-light)] bg-[var(--color-surface)] p-3 text-sm transition-colors hover:bg-[var(--color-skill-listening-light)] disabled:opacity-50 dark:border-[var(--color-skill-listening-dark)] dark:bg-[var(--color-surface-secondary)] dark:hover:bg-[var(--color-skill-listening-dark)]/20"
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-xs font-medium text-center" style={{ color: 'var(--color-text)' }}>{action.label}</span>
            <span className="text-[10px] text-center" style={{ color: 'var(--color-muted)' }}>{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── React: Vocabulary List Card ───────────────────────────────

interface VocabularyCardProps {
  vocabulary: ContentAnalysis['keyVocabulary']
  difficultWords: ContentAnalysis['difficultWords']
}

export function VocabularyCard({ vocabulary, difficultWords }: VocabularyCardProps) {
  const labelId = useId()

  return (
    <div className="mt-3 space-y-3" aria-labelledby={labelId}>
      <p id={labelId} className="sr-only">Vocabulary extracted from content</p>

      {vocabulary.length > 0 && (
        <div className="rounded-xl border-2 border-[var(--color-skill-listening-light)] bg-[var(--color-surface)] p-4 dark:border-[var(--color-skill-listening-dark)] dark:bg-[var(--color-surface-secondary)]">
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            📖 Topic-Specific Vocabulary
          </p>
          <div className="space-y-3">
            {vocabulary.map((v, i) => (
              <div key={i} className="border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-sm font-semibold text-[var(--color-skill-listening-dark)] dark:text-[var(--color-skill-listening)]">{v.word}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{v.meaning}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-muted)' }}>📌 {v.ieltsUse}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {difficultWords.length > 0 && (
        <div className="rounded-xl border-2 border-[var(--color-warning-light)] bg-[var(--color-surface)] p-4 dark:border-[var(--color-warning-dark)] dark:bg-[var(--color-surface-secondary)]">
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            🔤 Advanced Words
          </p>
          <div className="flex flex-wrap gap-2">
            {difficultWords.map((dw, i) => (
              <div
                key={i}
                className="group relative rounded-lg border border-[var(--color-warning-light)] bg-[var(--color-warning-light)]/50 px-2.5 py-1.5 dark:border-[var(--color-warning-dark)] dark:bg-[var(--color-warning-dark)]/10"
              >
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{dw.word}</span>
                <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-lg border bg-[var(--color-surface)] p-2 shadow-lg group-hover:block dark:bg-[var(--color-surface-secondary)]" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{dw.definition}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-[var(--color-skill-listening-light)] p-2.5 text-center dark:bg-[var(--color-skill-listening-dark)]/20">
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          💡 Try writing 3 sentences using these words. Type **"save"** to save them!
        </p>
      </div>
    </div>
  )
}

// ── React: Comprehension Question Card ────────────────────────

interface ComprehensionCardProps {
  question: string
  questionNumber: number
  totalQuestions: number
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function ComprehensionCard({ question, questionNumber, totalQuestions, onSubmit, disabled }: ComprehensionCardProps) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const labelId = useId()

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || submitted) return
    setSubmitted(true)
    onSubmit(answer.trim())
  }, [answer, submitted, onSubmit])

  if (submitted) {
    return (
      <div className="mt-2 animate-pulse rounded-lg bg-[var(--color-skill-listening-light)] p-3 text-center text-xs text-[var(--color-skill-listening)] dark:bg-[var(--color-skill-listening-dark)]/20 dark:text-[var(--color-skill-listening)]">
        Reviewing your answer...
      </div>
    )
  }

  return (
    <div
      className="mt-3 rounded-xl border-2 border-[var(--color-skill-listening-light)] bg-[var(--color-skill-listening-light)]/50 p-4 dark:border-[var(--color-skill-listening-dark)] dark:bg-[var(--color-skill-listening-dark)]/10"
      role="form"
      aria-labelledby={labelId}
    >
      <div className="mb-3 flex items-center justify-between">
        <p id={labelId} className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          ❓ Question {questionNumber} of {totalQuestions}
        </p>
      </div>

      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {question}
      </p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        rows={3}
        disabled={disabled}
        className="mb-3 w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-skill-listening)]"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || disabled}
        className="w-full rounded-lg bg-[var(--color-skill-listening)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-skill-listening-dark)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit Answer
      </button>
    </div>
  )
}
