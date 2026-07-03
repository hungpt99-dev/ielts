import { useId } from 'react'
import type { MistakeEntry, MistakeSkill } from '../../models'
import DatabaseService from '../../services/storage/Database'
import type { WritingFeedbackRecord } from '../../models/aiTutorModels'
import { LocalTutorStorage } from '../../services/storage/LocalTutorStorage'

export type WritingPhase =
  | 'idle'
  | 'select-task'
  | 'brainstorming'
  | 'outlining'
  | 'thesis'
  | 'paragraph'
  | 'draft-input'
  | 'feedback'
  | 'rewrite'

export type WritingTaskType = 'task1' | 'task2'

export interface GrammarIssue {
  original: string
  suggestion: string
  explanation: string
  type: 'grammar' | 'spelling' | 'punctuation'
}

export interface VocabSuggestion {
  original: string
  suggestion: string
  reason: string
}

export interface WritingBandEstimate {
  overall: number
  taskAchievement: number
  coherence: number
  vocabulary: number
  grammar: number
}

export interface WritingFeedbackData {
  id: string
  draftText: string
  bandEstimate: WritingBandEstimate
  taskType: WritingTaskType
  topic: string
  strengths: string[]
  weaknesses: string[]
  grammarIssues: GrammarIssue[]
  vocabularySuggestions: VocabSuggestion[]
  linkingWordSuggestions: string[]
  structureNotes: string
  improvedVersion: string
  thesisFeedback?: string
  outlineFeedback?: string
  generalAdvice: string
}

export interface BrainstormingIdea {
  id: string
  point: string
  explanation: string
  example?: string
}

export interface WritingOutline {
  introduction: string
  bodyParagraphs: { topic: string; supporting: string[] }[]
  conclusion: string
}

export interface WritingTaskAction {
  id: string
  label: string
  icon: string
  description: string
}

export const WRITING_TASK_ACTIONS: WritingTaskAction[] = [
  { id: 'brainstorm', label: 'Brainstorm Ideas', icon: '💡', description: 'Generate ideas for any IELTS writing topic' },
  { id: 'outline', label: 'Create Outline', icon: '📋', description: 'Build a clear essay structure' },
  { id: 'thesis', label: 'Improve Thesis', icon: '🎯', description: 'Strengthen your thesis statement' },
  { id: 'paragraph', label: 'Paragraph Structure', icon: '📝', description: 'Improve your paragraph organization' },
  { id: 'check-draft', label: 'Check My Draft', icon: '✅', description: 'Get feedback, band estimate, and rewrite suggestions' },
  { id: 'rewrite', label: 'Rewrite for Band', icon: '✨', description: 'Rewrite your text at a target band level' },
]

const WRITING_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Travel', 'Society', 'Culture', 'Economy', 'Science',
  'Media', 'Family', 'Sports', 'Food', 'Housing',
  'Crime', 'Art', 'Globalization', 'Transport', 'Communication',
]

export const TASK1_LINKING_WORDS = [
  'as shown in the graph', 'according to the chart', 'the figure for',
  'there was a significant increase', 'a slight decrease was observed',
  'this was followed by', 'in contrast', 'similarly',
  'whereas', 'while', 'compared to', 'accounted for',
  'the majority of', 'a minority of', 'the remainder',
]

export const TASK2_LINKING_WORDS = [
  'firstly', 'secondly', 'furthermore', 'moreover', 'in addition',
  'however', 'nevertheless', 'on the one hand', 'on the other hand',
  'in contrast', 'conversely', 'therefore', 'consequently',
  'as a result', 'for example', 'for instance', 'in particular',
  'in conclusion', 'to sum up', 'overall',
]

export function getTaskSelectorMessage(): string {
  return "✍️ **Writing Coach — How can I help?**\n\nChoose what you'd like to work on:\n\n**1️⃣** Brainstorm ideas for a topic\n**2️⃣** Create an essay outline\n**3️⃣** Improve your thesis statement\n**4️⃣** Check paragraph structure\n**5️⃣** Submit a draft for full feedback + band estimate\n**6️⃣** Rewrite a text at a target band level\n\nJust type the **number** or **name** of the task, or use the buttons above!"
}

export function detectWritingTaskChoice(message: string): string | null {
  const lower = message.trim().toLowerCase()
  if (/^1$|brainstorm/i.test(lower)) return 'brainstorm'
  if (/^2$|outline/i.test(lower)) return 'outline'
  if (/^3$|thesis/i.test(lower)) return 'thesis'
  if (/^4$|paragraph/i.test(lower)) return 'paragraph'
  if (/^5$|draft|check/i.test(lower)) return 'check-draft'
  if (/^6$|rewrite|band/i.test(lower)) return 'rewrite'
  return null
}

export function detectWritingTaskType(message: string): WritingTaskType {
  const lower = message.toLowerCase()
  if (/\btask\s*1\b|graph|chart|diagram|map|process|bar|line|pie|table/.test(lower)) return 'task1'
  return 'task2'
}

export function detectWritingTopic(message: string): string | null {
  const lower = message.toLowerCase()
  const found = WRITING_TOPICS.find(t => lower.includes(t.toLowerCase()))
  return found || null
}

const BRAINSTORM_DATA: Record<string, BrainstormingIdea[]> = {
  Education: [
    { id: 'b1', point: 'Equal Access to Education', explanation: 'Education should be accessible to all regardless of socioeconomic background. Governments should invest in public schools and scholarship programs.', example: 'In Finland, free education from primary to university level has resulted in high literacy rates and social equality.' },
    { id: 'b2', point: 'Technology in the Classroom', explanation: 'Digital tools can enhance learning through interactive content, personalized pacing, and access to global resources.', example: 'Online platforms like Khan Academy allow students to learn at their own pace and revisit difficult topics.' },
    { id: 'b3', point: 'Skills-Based vs. Academic Education', explanation: 'There is debate about whether education should focus on practical job skills or traditional academic knowledge. A balanced approach is often most effective.', example: 'Countries like Germany combine academic learning with vocational training through their dual education system.' },
  ],
  Technology: [
    { id: 'b4', point: 'Impact on Employment', explanation: 'Automation and AI are transforming the job market, eliminating some roles while creating new ones that require digital skills.', example: 'Self-checkout systems have reduced cashier positions but increased demand for IT maintenance staff.' },
    { id: 'b5', point: 'Digital Divide', explanation: 'Access to technology is uneven globally, creating a gap between those who can benefit from digital resources and those who cannot.', example: 'During the pandemic, students without reliable internet access fell behind their peers who could attend online classes.' },
    { id: 'b6', point: 'Privacy and Security', explanation: 'As technology collects more personal data, concerns about privacy, surveillance, and data security have become major societal issues.', example: 'Social media platforms have faced criticism for how they handle user data and target advertisements.' },
  ],
  Environment: [
    { id: 'b7', point: 'Climate Change Mitigation', explanation: 'Reducing greenhouse gas emissions through renewable energy, energy efficiency, and sustainable practices is essential to limit global warming.', example: 'The Paris Agreement commits countries to reducing their carbon emissions to keep global temperature rise below 2\u00b0C.' },
    { id: 'b8', point: 'Individual vs. Government Responsibility', explanation: 'While individual actions like recycling help, systemic change requires government policies and corporate accountability.', example: 'Plastic bag bans by governments have proven more effective than voluntary individual reduction efforts.' },
    { id: 'b9', point: 'Economic Growth vs. Environmental Protection', explanation: 'The traditional view that economic development and environmental protection are in conflict is being challenged by sustainable development models.', example: `Costa Rica has grown its economy while doubling its forest cover through eco-tourism and green policies.` },
  ],
  Health: [
    { id: 'b10', point: 'Public vs. Private Healthcare', explanation: 'Debate exists over whether healthcare should be publicly funded and universally accessible or privately managed with market competition.', example: 'Countries with universal healthcare systems like the UK tend to have better health outcomes per dollar spent than the US system.' },
    { id: 'b11', point: 'Preventive Medicine', explanation: 'Preventing diseases through lifestyle changes, regular check-ups, and public health campaigns is more cost-effective than treating advanced illnesses.', example: 'Anti-smoking campaigns and taxes have significantly reduced smoking rates in many developed countries.' },
    { id: 'b12', point: 'Mental Health Awareness', explanation: 'Mental health is increasingly recognized as equally important as physical health, yet stigma and underfunding remain significant barriers.', example: 'Workplace mental health programs have been shown to improve productivity and reduce absenteeism.' },
  ],
  Work: [
    { id: 'b13', point: 'Remote Work Revolution', explanation: 'The shift to remote work has changed how companies operate, offering flexibility but also blurring work-life boundaries.', example: 'Many tech companies now offer permanent remote or hybrid options, reducing commuting and office costs.' },
    { id: 'b14', point: 'Work-Life Balance', explanation: 'Long working hours and job stress are leading to burnout, making work-life balance a priority for modern employees.', example: 'Countries like Sweden have experimented with 6-hour workdays and reported increased productivity.' },
    { id: 'b15', point: 'Gig Economy', explanation: 'Short-term contracts and freelance work are growing, offering flexibility but often lacking job security and benefits.', example: 'Platforms like Uber and Upwork have enabled millions to work independently, though without traditional employment protections.' },
  ],
}

function getDefaultBrainstorming(topic: string): BrainstormingIdea[] {
  return [
    { id: 'gen1', point: 'Consider Multiple Perspectives', explanation: `When writing about "${topic}", think about different stakeholders, pros and cons, and short-term vs long-term effects.` },
    { id: 'gen2', point: 'Use Specific Examples', explanation: 'Support your arguments with real-world examples, statistics, or case studies to make your essay more convincing and concrete.' },
    { id: 'gen3', point: 'Connect to IELTS Themes', explanation: `The topic "${topic}" can connect to broader IELTS themes like society, economy, technology, and the environment.` },
  ]
}

export function generateBrainstorming(topic: string): BrainstormingIdea[] {
  const normalized = Object.keys(BRAINSTORM_DATA).find(
    k => k.toLowerCase() === topic.toLowerCase(),
  ) || Object.keys(BRAINSTORM_DATA).find(
    k => topic.toLowerCase().includes(k.toLowerCase()),
  )
  if (normalized) return BRAINSTORM_DATA[normalized]
  return getDefaultBrainstorming(topic)
}

export function formatBrainstorming(ideas: BrainstormingIdea[]): string {
  const items = ideas.map(
    (idea, i) => `**${i + 1}. ${idea.point}**\n${idea.explanation}${idea.example ? `\n\ud83d\udccc *Example:* ${idea.example}` : ''}`,
  )
  return `\ud83d\udca1 **Brainstorming Ideas**\n\n${items.join('\n\n')}\n\n---\n\nWhich idea would you like to develop further? Or shall I help you create an outline?`
}

export function getBrainstormPrompt(topic: string): string {
  return `I'd like to brainstorm ideas about "${topic}". Can you help me generate some arguments and examples?`
}

export function getOutlinePrompt(topic: string, taskType: WritingTaskType): string {
  return `Help me create an outline for a ${taskType === 'task1' ? 'Task 1' : 'Task 2'} essay about "${topic}".`
}

export function getDraftPrompt(): string {
  return 'Please check my draft and give me feedback with band estimate.'
}

export function getThesisPrompt(topic: string): string {
  return `Help me improve my thesis statement about "${topic}".`
}

export function getParagraphCheckPrompt(): string {
  return 'Please check the structure of this paragraph.'
}

export function getRewritePrompt(targetBand: number): string {
  return `Please rewrite my text to target band ${targetBand}.`
}

// ── Outline Generator ─────────────────────────────────────────

export function generateOutline(topic: string, taskType: WritingTaskType): WritingOutline {
  if (taskType === 'task1') {
    return {
      introduction: '**Introduction:**\n\u2022 Paraphrase the question/title of the chart/graph\n\u2022 Give an overview of the main trend(s) or key feature(s)\n\u2022 Do NOT give specific numbers in the introduction',
      bodyParagraphs: [
        {
          topic: '**Body Paragraph 1 \u2014 First Main Feature**',
          supporting: [
            'Describe the most noticeable trend or pattern',
            'Include specific data points to support your description',
            'Use comparative language (higher than, lower than, similar to)',
          ],
        },
        {
          topic: '**Body Paragraph 2 \u2014 Second Main Feature**',
          supporting: [
            'Describe another significant trend or pattern',
            'Highlight contrasts or similarities between data sets',
            'Use appropriate vocabulary for describing changes (rose, fell, fluctuated)',
          ],
        },
      ],
      conclusion: 'Task 1 does not require a separate conclusion \u2014 the overview in the introduction serves this purpose.',
    }
  }

  const outlines: Record<string, WritingOutline> = {
    Education: {
      introduction: '**Introduction:**\n\u2022 Hook: Education is a fundamental pillar of society\n\u2022 Context: The debate over the best approach to education continues\n\u2022 Thesis: While traditional academic education has its merits, a balanced system incorporating practical skills and technology is most effective for preparing students for the modern world',
      bodyParagraphs: [
        {
          topic: '**Body Paragraph 1 \u2014 Benefits of Academic Education**',
          supporting: [
            'Academic education builds critical thinking and theoretical knowledge',
            'It provides a foundation for higher education and specialized careers',
            'Example: Subjects like history and literature develop analytical skills applicable to many fields',
          ],
        },
        {
          topic: '**Body Paragraph 2 \u2014 Importance of Practical Skills**',
          supporting: [
            'Vocational training prepares students directly for the workforce',
            'Practical skills address skills gaps in the economy',
            'Example: Apprenticeship programs in Germany successfully combine learning with hands-on experience',
          ],
        },
        {
          topic: '**Body Paragraph 3 \u2014 The Role of Technology**',
          supporting: [
            'Digital tools can personalize learning and increase engagement',
            'Online education improves access for remote or disadvantaged students',
            'However, the digital divide must be addressed to ensure equal opportunities',
          ],
        },
      ],
      conclusion: '**Conclusion:**\n\u2022 Summarize: The most effective education system balances academic knowledge, practical skills, and technology\n\u2022 Restate thesis: A holistic approach to education serves both individual growth and societal needs\n\u2022 Final thought: Investing in diverse educational pathways is essential for future prosperity',
    },
    Technology: {
      introduction: '**Introduction:**\n\u2022 Hook: Technology has transformed nearly every aspect of modern life\n\u2022 Context: From communication to employment, its impact is undeniable\n\u2022 Thesis: Although technology brings significant benefits in efficiency and connectivity, society must address challenges related to privacy, employment, and inequality',
      bodyParagraphs: [
        {
          topic: '**Body Paragraph 1 \u2014 Positive Impacts of Technology**',
          supporting: [
            'Technology has revolutionized communication, making global connection instant and accessible',
            'Automation and AI have increased productivity across industries',
            'Example: Telemedicine has improved healthcare access in rural areas',
          ],
        },
        {
          topic: '**Body Paragraph 2 \u2014 Challenges and Drawbacks**',
          supporting: [
            'Privacy concerns have grown as data collection becomes more pervasive',
            'Job displacement due to automation threatens certain sectors',
            'The digital divide creates inequality between those with and without access',
          ],
        },
        {
          topic: '**Body Paragraph 3 \u2014 Striking a Balance**',
          supporting: [
            'Governments should regulate data collection while encouraging innovation',
            'Education systems must adapt to prepare workers for the digital economy',
            'Investment in digital infrastructure can help bridge the digital divide',
          ],
        },
      ],
      conclusion: '**Conclusion:**\n\u2022 Summarize: Technology is a double-edged sword with both remarkable benefits and significant challenges\n\u2022 Restate thesis: Careful management and regulation are needed to maximize benefits while minimizing harm\n\u2022 Final thought: The goal should be inclusive technological progress that serves all members of society',
    },
    Environment: {
      introduction: '**Introduction:**\n\u2022 Hook: Environmental degradation is one of the most pressing issues of our time\n\u2022 Context: Climate change, pollution, and biodiversity loss threaten ecosystems worldwide\n\u2022 Thesis: Tackling environmental problems requires collective action from governments, businesses, and individuals, with each playing a distinct but complementary role',
      bodyParagraphs: [
        {
          topic: '**Body Paragraph 1 \u2014 Government Responsibility**',
          supporting: [
            'Governments can implement regulations, carbon taxes, and environmental standards',
            'International cooperation through agreements like the Paris Accord is essential',
            'Example: The European Union\u2019s emissions trading system has reduced industrial pollution',
          ],
        },
        {
          topic: '**Body Paragraph 2 \u2014 Corporate Role**',
          supporting: [
            'Businesses can adopt sustainable practices and green technologies',
            'Corporate social responsibility (CSR) initiatives can drive environmental progress',
            'Example: Companies like Patagonia have built successful models around sustainability',
          ],
        },
        {
          topic: '**Body Paragraph 3 \u2014 Individual Actions**',
          supporting: [
            'Personal choices about consumption, transport, and waste have cumulative impact',
            'Public awareness and education drive demand for sustainable products',
            'Individual advocacy can pressure governments and corporations to act',
          ],
        },
      ],
      conclusion: '**Conclusion:**\n\u2022 Summarize: Environmental protection requires coordinated effort at all levels of society\n\u2022 Restate thesis: Government leadership, corporate innovation, and individual commitment are all necessary\n\u2022 Final thought: The cost of inaction far outweighs the investment needed for a sustainable future',
    },
  }

  const matched = Object.keys(outlines).find(
    k => k.toLowerCase() === topic.toLowerCase() || topic.toLowerCase().includes(k.toLowerCase()),
  )
  if (matched) return outlines[matched]

  return {
    introduction: `**Introduction:**\n\u2022 Hook: Introduce the topic of "${topic}" and its relevance today\n\u2022 Context: Briefly explain why this topic is important or debated\n\u2022 Thesis: State your main argument or position clearly in one sentence`,
    bodyParagraphs: [
      {
        topic: '**Body Paragraph 1 \u2014 First Main Argument**',
        supporting: [
          'Start with a clear topic sentence stating your first point',
          'Explain your point in more detail',
          'Provide a specific example or evidence to support your argument',
          'Explain how this example supports your overall thesis',
        ],
      },
      {
        topic: '**Body Paragraph 2 \u2014 Second Main Argument**',
        supporting: [
          'Introduce your second point with a clear topic sentence',
          'Develop the idea with explanation and analysis',
          'Include another example or piece of evidence',
          'Connect back to your thesis statement',
        ],
      },
      {
        topic: '**Body Paragraph 3 \u2014 Counter-Argument or Further Support (Optional)**',
        supporting: [
          'Acknowledge an opposing viewpoint if relevant',
          'Refute it or explain why your position is stronger',
          'Alternatively, provide a third supporting point',
        ],
      },
    ],
    conclusion: '**Conclusion:**\n\u2022 Summarize your main points briefly\n\u2022 Restate your thesis in different words\n\u2022 End with a final thought, prediction, or recommendation',
  }
}

export function formatOutline(outline: WritingOutline): string {
  const body = outline.bodyParagraphs.map(
    bp => `${bp.topic}\n${bp.supporting.map(s => `\u2022 ${s}`).join('\n')}`,
  ).join('\n\n')

  return `\ud83d\udccb **Essay Outline**\n\n${outline.introduction}\n\n${body}\n\n${outline.conclusion}\n\n---\n\nWould you like me to help you write a paragraph based on this outline, or improve any specific part?`
}

// ── Thesis Statement Improvement ──────────────────────────────

export function improveThesisStatement(userThesis: string, topic: string): string {
  const lower = userThesis.toLowerCase()
  const feedback: string[] = []

  if (userThesis.length < 30) {
    feedback.push('\ud83d\udccf **Length:** Your thesis is quite short. A strong thesis for IELTS Task 2 should clearly state your position and preview your main points.')
  }

  if (!/\b(i believe|i think|in my opinion|this essay|will argue|contend|assert)\b/.test(lower)) {
    feedback.push('\ud83c\udfaf **Clarity:** Make sure your thesis clearly states your position. Use phrases like "This essay will argue that..." or "I believe that...".')
  }

  if (!/\b(because|due to|as|since|for)\b/.test(lower)) {
    feedback.push('\ud83d\udd17 **Reasoning:** Consider adding a reason or scope to your thesis. For example: "This essay will argue that X is beneficial because Y and Z."')
  }

  if (lower.split(/\s+/).length > 40) {
    feedback.push('\u2702\ufe0f **Conciseness:** Your thesis might be too long. Aim for 1-2 clear sentences that capture your main argument.')
  }

  const examples = getThesisExample(topic)

  if (feedback.length === 0) {
    feedback.push('\u2705 Your thesis is clear and well-structured! It states your position and previews your argument effectively.')
  }

  return `\ud83c\udfaf **Thesis Feedback**\n\n**Your thesis:**\n"${userThesis}"\n\n**Feedback:**\n${feedback.join('\n\n')}\n\n${examples ? `**Suggested improvement based on topic "${topic}":**\n${examples}` : ''}\n\n---\n\nWould you like me to help you rewrite your thesis statement?`
}

function getThesisExample(topic: string): string | null {
  const examples: Record<string, string> = {
    Education: '**Improved version:** "This essay will argue that while traditional academic education develops critical thinking, incorporating practical skills and technology is essential to prepare students for the demands of the modern workforce."',
    Technology: '**Improved version:** "Although technology has revolutionized communication and productivity, this essay will contend that its benefits must be weighed against significant concerns about privacy, employment, and social inequality."',
    Environment: '**Improved version:** "This essay will argue that addressing environmental challenges requires coordinated action from governments, corporations, and individuals, with each sector playing a distinct but complementary role."',
    Health: '**Improved version:** "While universal healthcare systems provide essential access to medical services, this essay will argue that preventive medicine and public health education are equally important investments."',
  }
  const matched = Object.keys(examples).find(
    k => k.toLowerCase() === topic.toLowerCase() || topic.toLowerCase().includes(k.toLowerCase()),
  )
  return matched ? examples[matched] : null
}

// ── Paragraph Structure Feedback ──────────────────────────────

export function checkParagraphStructure(paragraph: string): string {
  const lower = paragraph.toLowerCase()
  const feedback: string[] = []
  const words = paragraph.split(/\s+/).filter(Boolean)

  if (words.length < 40) {
    feedback.push('\ud83d\udccf **Length:** This paragraph is quite short (under 40 words). Aim for 60-100 words per body paragraph in IELTS Writing Task 2.')
  }

  if (words.length > 150) {
    feedback.push('\ud83d\udccf **Length:** This paragraph is very long. Consider splitting it into two paragraphs for better organization.')
  }

  const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length < 3) {
    feedback.push('\ud83d\udcdd **Structure:** A good paragraph typically has 3-5 sentences: a topic sentence, supporting details, an example, and a concluding/linking sentence.')
  }

  const topicSentenceKeywords = /\b(first|one|another|important|significant|main|key|primary|major|crucial|essential)\b/
  if (!topicSentenceKeywords.test(lower)) {
    feedback.push('\ud83d\udccc **Topic Sentence:** Your paragraph may lack a clear topic sentence. Start with a sentence that introduces the main idea of this paragraph.')
  }

  const exampleKeywords = /\b(for example|for instance|such as|like|specifically|in particular|to illustrate)\b/
  if (!exampleKeywords.test(lower)) {
    feedback.push('\ud83d\udca1 **Example:** Consider adding a specific example or evidence to support your point. IELTS essays with concrete examples score higher for Task Achievement.')
  }

  if (feedback.length === 0) {
    feedback.push('\u2705 Your paragraph is well-structured! It has a clear topic sentence, supporting details, examples, and good use of linking words.')
  }

  return `\ud83d\udcdd **Paragraph Structure Feedback**\n\n${feedback.join('\n\n')}\n\n---\n\nWould you like me to suggest an improved version of this paragraph?`
}

// ── Writing Analysis ──────────────────────────────────────────

interface WritingAnalysis {
  wordCount: number
  sentenceCount: number
  avgSentenceLength: number
  paragraphs: number
  linkingWords: string[]
  complexStructures: string[]
  topicSpecificVocab: string[]
  grammarIssues: GrammarIssue[]
  vocabSuggestions: VocabSuggestion[]
}

function detectGrammarIssues(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = []

  const subjVerbMatches = text.match(/\b(The\s+\w+|\bHe|She|It)\s+(are|were|have|do|don't)\b/gi)
  if (subjVerbMatches) {
    subjVerbMatches.forEach(m => {
      const match = m.match(/\b(He|She|It|The (\w+)) (are|were|have|do|don't)\b/i)
      const subject = match ? match[1] : m.split(' ')[0]
      issues.push({
        original: m,
        suggestion: m.replace(/\bare\b/i, 'is').replace(/\bwere\b/i, 'was').replace(/\bhave\b/i, 'has').replace(/\bdo\b/i, 'does').replace(/\bdon't\b/i, "doesn't"),
        explanation: `"${subject}" is third person singular, so use the singular verb form.`,
        type: 'grammar',
      })
    })
  }

  const iAmMatch = text.match(/\bI (is|are|were)\b/i)
  if (iAmMatch) {
    issues.push({
      original: `I ${iAmMatch[1]}`,
      suggestion: `I ${iAmMatch[1] === 'is' || iAmMatch[1] === 'are' ? 'am' : 'was'}`,
      explanation: 'After "I", use "am" for present tense or "was" for past tense.',
      type: 'grammar',
    })
  }

  const articleMatches = text.match(/\ba (apple|hour|honest|umbrella|heir)\b/gi)
  if (articleMatches) {
    articleMatches.forEach(m => {
      const word = m.replace(/^a\s+/i, '')
      issues.push({
        original: m,
        suggestion: `an ${word}`,
        explanation: `Use "an" before "${word}" as it starts with a vowel sound.`,
        type: 'grammar',
      })
    })
  }

  return issues.slice(0, 6)
}

function detectVocabIssues(text: string): VocabSuggestion[] {
  const suggestions: VocabSuggestion[] = []
  const lower = text.toLowerCase()

  if (/\bgood\b/.test(lower)) {
    suggestions.push({ original: 'good', suggestion: 'beneficial / advantageous / positive / effective', reason: 'Use more precise vocabulary to demonstrate lexical range.' })
  }
  if (/\bbad\b/.test(lower)) {
    suggestions.push({ original: 'bad', suggestion: 'detrimental / harmful / adverse / negative', reason: '"Bad" is too vague for academic writing.' })
  }
  if (/\bbig\b/.test(lower)) {
    suggestions.push({ original: 'big', suggestion: 'significant / substantial / considerable / major', reason: 'More formal alternatives improve academic tone.' })
  }
  if (/\b(very|really|a lot)\b/.test(lower)) {
    suggestions.push({ original: 'very / really / a lot', suggestion: 'significantly / considerably / substantially', reason: 'Avoid informal intensifiers in academic writing.' })
  }
  if (/\b(people|thing|stuff)\b/.test(lower)) {
    suggestions.push({ original: 'people / things', suggestion: 'individuals / aspects / society / citizens', reason: 'More specific nouns improve precision.' })
  }

  return suggestions.slice(0, 4)
}

function analyzeWriting(text: string, taskType: WritingTaskType): WritingAnalysis {
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const lower = text.toLowerCase()

  const linkingWords = taskType === 'task1'
    ? TASK1_LINKING_WORDS.filter(lw => lower.includes(lw))
    : TASK2_LINKING_WORDS.filter(lw => lower.includes(lw))

  const complexPatterns = [
    'which', 'that', 'because', 'although', 'while', 'whereas',
    'despite', 'in spite of', 'not only', 'would', 'could',
    'should', 'have been', 'has been', 'had been',
    'who', 'whose', 'whom', 'when', 'where',
  ]
  const complexStructures = complexPatterns.filter(p => lower.includes(p))

  const topicVocabPatterns = [
    'significant', 'substantial', 'considerable', 'notable',
    'consequently', 'therefore', 'hence', 'accordingly',
    'demonstrate', 'illustrate', 'indicate', 'reveal',
    'constitute', 'comprise', 'account for', 'represent',
    'inevitable', 'unprecedented', 'widespread', 'pervasive',
  ]
  const topicSpecificVocab = topicVocabPatterns.filter(p => lower.includes(p))

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
    paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
    linkingWords,
    complexStructures,
    topicSpecificVocab,
    grammarIssues: detectGrammarIssues(text),
    vocabSuggestions: detectVocabIssues(text),
  }
}

// ── Band Estimation ───────────────────────────────────────────

function estimateWritingBand(analysis: WritingAnalysis, taskType: WritingTaskType): WritingBandEstimate {
  const wc = analysis.wordCount
  const lc = analysis.linkingWords.length
  const cc = analysis.complexStructures.length
  const tv = analysis.topicSpecificVocab.length
  const ge = analysis.grammarIssues.length
  const vs = analysis.vocabSuggestions.length

  let taskAchievement = 5.0
  if (taskType === 'task2') {
    if (wc >= 150) taskAchievement = 5.5
    if (wc >= 200) taskAchievement = 6.0
    if (wc >= 250) taskAchievement = 6.5
    if (wc >= 280) taskAchievement = 7.0
    if (wc >= 320) taskAchievement = 7.5
  } else {
    if (wc >= 100) taskAchievement = 5.5
    if (wc >= 130) taskAchievement = 6.0
    if (wc >= 150) taskAchievement = 6.5
    if (wc >= 170) taskAchievement = 7.0
    if (wc >= 200) taskAchievement = 7.5
  }
  if (wc < 80) taskAchievement = 4.5

  let coherenceVal = 5.0
  if (lc >= 1) coherenceVal = 6.0
  if (lc >= 2) coherenceVal = 6.5
  if (lc >= 4) coherenceVal = 7.0
  if (lc >= 6) coherenceVal = 7.5
  if (analysis.paragraphs >= 3) coherenceVal = Math.max(coherenceVal, 6.0)
  if (analysis.paragraphs >= 4) coherenceVal = Math.max(coherenceVal, 6.5)
  if (lc < 1 && analysis.paragraphs < 3) coherenceVal = 4.5

  let vocabScore = 5.0
  if (tv >= 1) vocabScore = 6.0
  if (tv >= 3) vocabScore = 6.5
  if (tv >= 5) vocabScore = 7.0
  if (tv >= 8) vocabScore = 7.5
  if (vs >= 2) vocabScore = Math.min(vocabScore, 6.0)
  if (analysis.avgSentenceLength > 18) vocabScore = Math.max(vocabScore, 6.5)

  let grammarScore = 5.0
  if (cc >= 2) grammarScore = 6.0
  if (cc >= 4) grammarScore = 6.5
  if (cc >= 6) grammarScore = 7.0
  if (cc >= 8) grammarScore = 7.5
  if (ge >= 2) grammarScore = Math.min(grammarScore, 5.5)
  if (ge >= 4) grammarScore = Math.min(grammarScore, 5.0)
  if (ge === 0 && wc > 100) grammarScore = Math.max(grammarScore, 6.5)
  if (analysis.avgSentenceLength < 10) grammarScore = Math.min(grammarScore, 5.5)

  const round = (v: number) => Math.round(v * 2) / 2
  taskAchievement = round(taskAchievement)
  coherenceVal = round(coherenceVal)
  vocabScore = round(vocabScore)
  grammarScore = round(grammarScore)

  const overall = round((taskAchievement + coherenceVal + vocabScore + grammarScore) / 4)
  const clamped = Math.max(3.0, Math.min(9.0, overall))

  return {
    overall: clamped,
    taskAchievement,
    coherence: coherenceVal,
    vocabulary: vocabScore,
    grammar: grammarScore,
  }
}

// ── Strengths & Weaknesses ────────────────────────────────────

function generateStrengths(analysis: WritingAnalysis): string[] {
  const s: string[] = []
  if (analysis.wordCount >= 250) s.push('Good essay length \u2014 appropriate for Task 2')
  else if (analysis.wordCount >= 150) s.push('Appropriate length for the task')
  if (analysis.paragraphs >= 4) s.push('Well-organized with clear paragraph structure')
  else if (analysis.paragraphs >= 3) s.push('Good paragraph organization')
  if (analysis.linkingWords.length >= 4) s.push('Effective use of linking words for cohesion')
  if (analysis.complexStructures.length >= 4) s.push('Good range of complex sentence structures')
  if (analysis.topicSpecificVocab.length >= 3) s.push('Good use of topic-specific vocabulary')
  if (analysis.grammarIssues.length === 0) s.push('Strong grammatical accuracy')
  if (s.length === 0) s.push('Good attempt \u2014 keep practicing to develop your writing further')

  return s.slice(0, 4)
}

function generateWeaknesses(analysis: WritingAnalysis): string[] {
  const w: string[] = []
  if (analysis.wordCount < 250) w.push('Essay is below the recommended word count for Task 2 (250 words)')
  if (analysis.paragraphs < 3) w.push('Try to organize your essay into clearer paragraphs (introduction, body, conclusion)')
  if (analysis.linkingWords.length < 2) w.push('Add more linking words to improve coherence and cohesion')
  if (analysis.complexStructures.length < 3) w.push('Use more complex sentence structures to demonstrate grammatical range')
  if (analysis.topicSpecificVocab.length < 2) w.push('Include more topic-specific vocabulary to improve lexical resource score')
  if (analysis.grammarIssues.length > 0) w.push(`Review grammar basics \u2014 ${analysis.grammarIssues.length} issue(s) detected`)
  if (analysis.vocabSuggestions.length > 0) w.push('Some vocabulary choices could be more precise or academic')

  return w.slice(0, 4)
}

// ── Linking Word Suggestions ──────────────────────────────────

function generateLinkingSuggestions(text: string, taskType: WritingTaskType): string[] {
  const suggestions: string[] = []
  const lower = text.toLowerCase()

  if (!/\b(however|nevertheless|on the other hand|in contrast)\b/.test(lower)) {
    suggestions.push('Use **"However"** or **"On the other hand"** to introduce contrasting ideas')
  }
  if (!/\b(furthermore|moreover|in addition|additionally)\b/.test(lower)) {
    suggestions.push('Use **"Furthermore"** or **"Moreover"** to add supporting points')
  }
  if (!/\b(for example|for instance|such as|to illustrate)\b/.test(lower)) {
    suggestions.push('Use **"For example"** or **"For instance"** to introduce evidence or examples')
  }
  if (!/\b(therefore|consequently|as a result|hence)\b/.test(lower)) {
    suggestions.push('Use **"Therefore"** or **"As a result"** to show consequences or conclusions')
  }
  if (!/\b(firstly|first of all|to begin with)\b/.test(lower) && taskType === 'task2') {
    suggestions.push('Use **"Firstly"** or **"To begin with"** to structure your first body paragraph')
  }
  if (!/\b(in conclusion|to conclude|to sum up|overall)\b/.test(lower) && taskType === 'task2') {
    suggestions.push('Use **"In conclusion"** or **"To sum up"** to start your conclusion paragraph')
  }

  return suggestions.slice(0, 4)
}

// ── Improved Version Generator ────────────────────────────────

function improveVocabulary(text: string): string {
  let improved = text
    .replace(/\bgood\b/gi, 'beneficial')
    .replace(/\bbad\b/gi, 'detrimental')
    .replace(/\bbig\b/gi, 'significant')
    .replace(/\bsmall\b/gi, 'minor')
    .replace(/\bvery\b/gi, 'extremely')
    .replace(/\breally\b/gi, 'extremely')
    .replace(/\ba lot\b/gi, 'significantly')
    .replace(/\bpeople\b/gi, 'individuals')
    .replace(/\bthings?\b/gi, 'aspects')
    .replace(/\bstuff\b/gi, 'matters')
    .replace(/\bhave to\b/gi, 'must')
    .replace(/\bneed to\b/gi, 'must')
    .replace(/\bshow\b/gi, 'demonstrate')
    .replace(/\bget\b/gi, 'obtain')
    .replace(/\buse\b/gi, 'utilize')
    .replace(/\btell\b/gi, 'indicate')
    .replace(/\bsay\b/gi, 'state')
    .replace(/\bso\b/gi, 'therefore')
    .replace(/\bbut\b/gi, 'however')
    .replace(/\balso\b/gi, 'furthermore')

  improved = improved.replace(/\s{2,}/g, ' ').trim()
  return improved
}

export function generateImprovedVersion(text: string, targetBand: number): string {
  let improved = text.trim()

  const wc = improved.split(/\s+/).filter(Boolean).length
  if (wc < 250 && targetBand >= 6.5) {
    improved += '\n\nFurthermore, it is worth considering that this issue has wider implications for society as a whole. The long-term consequences of inaction would be substantial, affecting not only current populations but also future generations.'
  }

  if (targetBand >= 6.0) {
    improved = improveVocabulary(improved)
  }

  if (targetBand >= 7.0) {
    improved = improved.replace(
      /\b(I think|In my opinion)\b/gi,
      'It could be argued',
    )
  }

  return `**Improved Version (Target Band ${targetBand})**\n\n${improved}\n\n---\n\n*Improvements: vocabulary upgrades, sentence complexity, and structural enhancements to match band ${targetBand} level.*`
}

function generateGeneralAdvice(analysis: WritingAnalysis, taskType: WritingTaskType, _band: WritingBandEstimate): string {
  const advice: string[] = []

  if (analysis.wordCount < (taskType === 'task2' ? 250 : 150)) {
    advice.push('Aim to reach the minimum word count to avoid losing marks for Task Achievement.')
  }
  if (analysis.paragraphs < 3) {
    advice.push('Organize your essay into clear paragraphs: introduction, body, and conclusion.')
  }
  if (analysis.linkingWords.length < 3) {
    advice.push('Use a variety of linking words to improve Coherence and Cohesion (25% of your score).')
  }
  if (analysis.complexStructures.length < 4) {
    advice.push('Incorporate more complex sentences (relative clauses, conditionals) for Grammatical Range.')
  }
  if (analysis.topicSpecificVocab.length < 3) {
    advice.push('Include topic-specific vocabulary to boost your Lexical Resource score.')
  }
  if (analysis.grammarIssues.length > 0) {
    advice.push('Review basic grammar \u2014 subject-verb agreement and articles are common areas for improvement.')
  }

  if (advice.length === 0) {
    advice.push('Excellent work! Your writing demonstrates strong skills across all criteria. Keep practicing to maintain and improve your level.')
  }

  return advice.slice(0, 4).join('\n')
}

// ── Main Feedback Generator ───────────────────────────────────

export function generateWritingFeedback(text: string, taskType: WritingTaskType, topic: string): WritingFeedbackData {
  const analysis = analyzeWriting(text, taskType)
  const band = estimateWritingBand(analysis, taskType)
  const strengths = generateStrengths(analysis)
  const weaknesses = generateWeaknesses(analysis)
  const linkingSuggestions = generateLinkingSuggestions(text, taskType)
  const improvedVersion = generateImprovedVersion(text, Math.max(6.0, band.overall + 0.5))
  const advice = generateGeneralAdvice(analysis, taskType, band)

  return {
    id: crypto.randomUUID?.() ?? Date.now().toString(36),
    draftText: text,
    bandEstimate: band,
    taskType,
    topic,
    strengths,
    weaknesses,
    grammarIssues: analysis.grammarIssues,
    vocabularySuggestions: analysis.vocabSuggestions,
    linkingWordSuggestions: linkingSuggestions,
    structureNotes: `Paragraphs: ${analysis.paragraphs}, Sentences: ${analysis.sentenceCount}, Avg sentence length: ${analysis.avgSentenceLength} words.`,
    improvedVersion,
    generalAdvice: advice,
  }
}

export function formatFeedbackMessage(feedback: WritingFeedbackData, language: 'english' | 'vietnamese' | 'both'): string {
  const eng = generateFeedbackEnglish(feedback)
  const viet = generateFeedbackVietnamese(feedback)

  if (language === 'vietnamese') return viet
  if (language === 'both') return `${eng}\n\n---\n\n${viet}`
  return eng
}

function generateFeedbackEnglish(feedback: WritingFeedbackData): string {
  const parts: string[] = []
  const band = feedback.bandEstimate

  parts.push(`\ud83d\udcca **Estimated Writing Band: ${band.overall}**`)
  parts.push(`Task Achievement:  ${band.taskAchievement}\nCoherence:         ${band.coherence}\nVocabulary:        ${band.vocabulary}\nGrammar:           ${band.grammar}`)

  if (feedback.strengths.length > 0) {
    parts.push(`\u2705 **Strengths:**\n${feedback.strengths.map(s => `\u2022 ${s}`).join('\n')}`)
  }

  if (feedback.weaknesses.length > 0) {
    parts.push(`\ud83d\udca1 **Areas to Improve:**\n${feedback.weaknesses.map(w => `\u2022 ${w}`).join('\n')}`)
  }

  if (feedback.grammarIssues.length > 0) {
    parts.push(`\ud83d\udd0d **Grammar Issues:**`)
    feedback.grammarIssues.forEach(g => {
      parts.push(`\u2022 "${g.original}" \u2192 **${g.suggestion}**\n  ${g.explanation}`)
    })
  } else {
    parts.push('\u2705 **Grammar:** No major issues detected!')
  }

  if (feedback.vocabularySuggestions.length > 0) {
    parts.push(`\ud83d\udcd6 **Vocabulary Suggestions:**`)
    feedback.vocabularySuggestions.forEach(v => {
      parts.push(`\u2022 "${v.original}" \u2192 **${v.suggestion}**\n  ${v.reason}`)
    })
  }

  if (feedback.linkingWordSuggestions.length > 0) {
    parts.push(`\ud83d\udd17 **Linking Words to Add:**`)
    feedback.linkingWordSuggestions.forEach(l => {
      parts.push(`\u2022 ${l}`)
    })
  }

  parts.push(`\ud83d\udccb **Structure:** ${feedback.structureNotes}`)

  parts.push(`\ud83d\udcdd **Advice:**\n${feedback.generalAdvice}`)

  parts.push(`\u2728 **Improved Version:**\n${feedback.improvedVersion}`)

  parts.push('---\nType **"next"** for another task or **"check another"** to submit a new draft!')

  return parts.join('\n\n')
}

function generateFeedbackVietnamese(feedback: WritingFeedbackData): string {
  const parts: string[] = []
  const band = feedback.bandEstimate

  parts.push(`\ud83d\udcca **\u01af\u1edbc t\u00ednh Band Vi\u1ebft: ${band.overall}**`)
  parts.push(`Ho\u00e0n th\u00e0nh nhi\u1ec7m v\u1ee5:  ${band.taskAchievement}\nM\u1ea1ch l\u1ea1c:              ${band.coherence}\nT\u1eeb v\u1ef1ng:              ${band.vocabulary}\nNg\u1eef ph\u00e1p:             ${band.grammar}`)

  if (feedback.strengths.length > 0) {
    parts.push(`\u2705 **\u0110i\u1ec3m m\u1ea1nh:**\n${feedback.strengths.map(s => `\u2022 ${s}`).join('\n')}`)
  }
  if (feedback.weaknesses.length > 0) {
    parts.push(`\ud83d\udca1 **C\u1ea7n c\u1ea3i thi\u1ec7n:**\n${feedback.weaknesses.map(w => `\u2022 ${w}`).join('\n')}`)
  }

  parts.push(`\ud83d\udcdd **L\u1eddi khuy\u00ean:**\n${feedback.generalAdvice}`)

  parts.push(`\u2728 **Phi\u00ean b\u1ea3n c\u1ea3i thi\u1ec7n:**\n${feedback.improvedVersion}`)

  return parts.join('\n\n')
}

// ── Save Writing Feedback ─────────────────────────────────────

export async function saveWritingFeedback(
  feedback: WritingFeedbackData,
  sessionId: string,
): Promise<void> {
  const record: WritingFeedbackRecord = {
    id: feedback.id,
    sessionId,
    draftText: feedback.draftText,
    feedback: formatFeedbackMessage(feedback, 'english'),
    estimatedBand: feedback.bandEstimate.overall,
    improvedVersion: feedback.improvedVersion,
    grammarIssues: feedback.grammarIssues.map(g => `${g.original} -> ${g.suggestion}: ${g.explanation}`),
    vocabularyIssues: feedback.vocabularySuggestions.map(v => `${v.original} -> ${v.suggestion}: ${v.reason}`),
    structureNotes: feedback.structureNotes,
    createdAt: new Date().toISOString(),
  }
  await LocalTutorStorage.addWritingFeedback(record)
}

export async function saveWritingMistakesToNotebook(
  _text: string,
  issues: GrammarIssue[],
  taskType: WritingTaskType,
): Promise<void> {
  if (issues.length === 0) return

  for (const issue of issues) {
    const entry: Omit<MistakeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      mistake: issue.original,
      correction: issue.suggestion,
      explanation: issue.explanation,
      source: `AI Tutor - Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'}`,
      date: new Date().toISOString().split('T')[0],
      skill: 'writing' as MistakeSkill,
      status: 'new',
      repetitionCount: 0,
    }
    await DatabaseService.addMistake(entry)
  }
}

// ── React: Task Selector Card ─────────────────────────────────

interface TaskSelectorCardProps {
  onSelect: (taskId: string) => void
  disabled?: boolean
}

export function TaskSelectorCard({ onSelect, disabled }: TaskSelectorCardProps) {
  const labelId = useId()

  return (
    <div
      className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10"
      role="group"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        \u270d\ufe0f Choose a Writing Task
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {WRITING_TASK_ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => onSelect(action.id)}
            disabled={disabled}
            className="flex flex-col items-center gap-1 rounded-lg border-2 border-blue-200 bg-white p-3 text-sm transition-colors hover:bg-blue-50 disabled:opacity-50 dark:border-blue-700 dark:bg-slate-700 dark:hover:bg-blue-900/20"
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{action.label}</span>
            <span className="text-[10px] text-center" style={{ color: 'var(--color-muted)' }}>{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── React: Writing Band Estimate Card ─────────────────────────

interface WritingBandCardProps {
  band: WritingBandEstimate
}

const BAND_COLORS: Record<string, string> = {
  '9': 'text-green-600', '8.5': 'text-green-600', '8': 'text-green-600',
  '7.5': 'text-blue-600', '7': 'text-blue-600', '6.5': 'text-blue-600',
  '6': 'text-amber-600', '5.5': 'text-amber-600', '5': 'text-amber-600',
  '4.5': 'text-red-600', '4': 'text-red-600', '3.5': 'text-red-600', '3': 'text-red-600',
}

function getBandColor(band: number): string {
  const key = band.toString()
  return BAND_COLORS[key] || 'text-slate-600'
}

export function WritingBandCard({ band }: WritingBandCardProps) {
  const labelId = useId()

  return (
    <div
      className="mt-3 rounded-xl border-2 border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="mb-3 text-sm font-bold" style={{ color: 'var(--color-text)' }}>
        \ud83d\udcca Writing Band Estimate
      </p>
      <div className="mb-4 text-center">
        <span className={`text-4xl font-bold ${getBandColor(band.overall)}`}>
          {band.overall}
        </span>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Estimated Overall Band</p>
        <p className="mt-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
          \u26a0\ufe0f This is a rough estimate based on text analysis. Actual IELTS scores may differ.
        </p>
      </div>
      <div className="space-y-2">
        {[
          { label: 'Task Achievement', value: band.taskAchievement },
          { label: 'Coherence & Cohesion', value: band.coherence },
          { label: 'Lexical Resource', value: band.vocabulary },
          { label: 'Grammatical Range', value: band.grammar },
        ].map(item => (
          <div key={item.label}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
              <span className={`font-medium ${getBandColor(item.value)}`}>{item.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
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

// ── React: Writing Feedback Summary Card ──────────────────────

interface WritingFeedbackCardProps {
  feedback: WritingFeedbackData
  onNext: () => void
  onCheckAnother: () => void
  disabled?: boolean
}

export function WritingFeedbackCard({ feedback, onNext, onCheckAnother, disabled }: WritingFeedbackCardProps) {
  return (
    <div className="mt-3 space-y-3">
      <WritingBandCard band={feedback.bandEstimate} />

      {feedback.strengths.length > 0 && (
        <div className="rounded-xl border-2 border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-900/10">
          <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-400">\u2705 Strengths</p>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.weaknesses.length > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
          <p className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">\ud83d\udca1 Areas to Improve</p>
          <ul className="space-y-1">
            {feedback.weaknesses.map((w, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.grammarIssues.length > 0 && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-900/10">
          <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">\ud83d\udd0d Grammar Issues</p>
          <div className="space-y-2">
            {feedback.grammarIssues.map((g, i) => (
              <div key={i} className="text-xs">
                <p className="text-red-600 dark:text-red-400">
                  <span className="line-through">{g.original}</span>
                  {' \u2192 '}
                  <span className="font-medium text-green-600 dark:text-green-400">{g.suggestion}</span>
                </p>
                <p className="mt-0.5" style={{ color: 'var(--color-muted)' }}>{g.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.vocabularySuggestions.length > 0 && (
        <div className="rounded-xl border-2 border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-900/10">
          <p className="mb-2 text-sm font-medium text-purple-700 dark:text-purple-400">\ud83d\udcd6 Vocabulary Suggestions</p>
          <div className="space-y-2">
            {feedback.vocabularySuggestions.map((v, i) => (
              <div key={i} className="text-xs">
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {v.original} \u2192 {v.suggestion}
                </p>
                <p style={{ color: 'var(--color-muted)' }}>{v.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.linkingWordSuggestions.length > 0 && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
          <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-400">\ud83d\udd17 Linking Words</p>
          <ul className="space-y-1">
            {feedback.linkingWordSuggestions.map((l, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border-2 border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <p className="mb-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>\ud83d\udcdd Advice</p>
        <p className="whitespace-pre-wrap text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {feedback.generalAdvice}
        </p>
      </div>

      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-900/10">
        <p className="mb-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">\u2728 Improved Version</p>
        <p className="whitespace-pre-wrap text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {feedback.improvedVersion}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onNext}
          disabled={disabled}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          Next Task \u2192
        </button>
        <button
          onClick={onCheckAnother}
          disabled={disabled}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-700"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Check Another Draft
        </button>
      </div>
    </div>
  )
}
