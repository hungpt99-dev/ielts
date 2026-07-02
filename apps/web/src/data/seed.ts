import { DatabaseService } from '../services/storage/Database'
import type {
  VocabularyEntry,
  VocabReviewEntry,
  TaskEntry,
  ReadingSession,
  ListeningSession,
  WritingSession,
  SpeakingSession,
  GrammarNote,
  MistakeEntry,
  MockTestEntry,
  TopicProgress,
  PassageEntry,
  VocabDifficulty,
  VocabStatus,
  GrammarStatus,
  TaskCategory,
  MistakeSkill,
  SpeakingPart,
  WritingTaskType,
  QuestionType,
} from '../models'

function uid() {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function daysFromNow(days: number, hours = 8): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hours, 0, 0, 0)
  return d.toISOString()
}


export const IELTS_TOPICS: string[] = [
  'Education',
  'Technology',
  'Environment',
  'Health',
  'Work',
  'Business',
  'Travel',
  'Culture',
  'Society',
  'Crime',
  'Government',
  'Media',
  'Globalization',
  'Family',
  'Housing',
  'Transport',
  'Art',
  'Sports',
  'Science',
]


interface SeedVocab {
  word: string
  meaning: string
  meaningVi: string
  pronunciation: string
  partOfSpeech: string
  topic: string
  exampleSentence: string
  collocations: string[]
  synonyms: string[]
  antonyms: string[]
  wordFamily: string[]
  personalNote: string
  difficulty: VocabDifficulty
  status: VocabStatus
  tags: string[]
}

const SEED_VOCABULARY: SeedVocab[] = [
  {
    word: 'sustainable',
    meaning: 'able to be maintained at a certain rate or level; environmentally friendly',
    meaningVi: 'bền vững',
    pronunciation: '/səˈsteɪnəbl/',
    partOfSpeech: 'adjective',
    topic: 'Environment',
    exampleSentence: 'Governments should invest in sustainable energy sources to reduce carbon emissions.',
    collocations: ['sustainable development', 'sustainable energy', 'sustainable growth'],
    synonyms: ['maintainable', 'renewable', 'viable'],
    antonyms: ['unsustainable', 'depletable'],
    wordFamily: ['sustain', 'sustainability', 'sustained'],
    personalNote: 'Common in Environment essays',
    difficulty: 'medium',
    status: 'learning',
    tags: ['environment', 'writing'],
  },
  {
    word: 'ubiquitous',
    meaning: 'present, appearing, or found everywhere',
    meaningVi: 'phổ biến khắp nơi',
    pronunciation: '/juːˈbɪkwɪtəs/',
    partOfSpeech: 'adjective',
    topic: 'Technology',
    exampleSentence: 'Smartphones have become ubiquitous in modern society.',
    collocations: ['ubiquitous computing', 'ubiquitous presence', 'ubiquitous technology'],
    synonyms: ['omnipresent', 'pervasive', 'widespread'],
    antonyms: ['rare', 'scarce', 'uncommon'],
    wordFamily: ['ubiquity', 'ubiquitously'],
    personalNote: 'Good for Technology and Society essays',
    difficulty: 'hard',
    status: 'new',
    tags: ['technology', 'vocabulary'],
  },
  {
    word: 'mitigate',
    meaning: 'to make less severe, serious, or painful',
    meaningVi: 'giảm nhẹ',
    pronunciation: '/ˈmɪtɪɡeɪt/',
    partOfSpeech: 'verb',
    topic: 'Environment',
    exampleSentence: 'Tree planting programs can help mitigate the effects of climate change.',
    collocations: ['mitigate risks', 'mitigate the impact', 'mitigate damage'],
    synonyms: ['alleviate', 'reduce', 'lessen'],
    antonyms: ['aggravate', 'worsen', 'intensify'],
    wordFamily: ['mitigation', 'mitigating', 'mitigable'],
    personalNote: 'Use in Task 2 essays',
    difficulty: 'hard',
    status: 'learning',
    tags: ['environment', 'writing task 2'],
  },
  {
    word: 'comprehensive',
    meaning: 'including all or nearly all elements; thorough',
    meaningVi: 'toàn diện',
    pronunciation: '/ˌkɒmprɪˈhensɪv/',
    partOfSpeech: 'adjective',
    topic: 'Education',
    exampleSentence: 'The university offers a comprehensive range of courses for international students.',
    collocations: ['comprehensive education', 'comprehensive review', 'comprehensive approach'],
    synonyms: ['thorough', 'complete', 'extensive'],
    antonyms: ['incomplete', 'partial', 'selective'],
    wordFamily: ['comprehend', 'comprehension', 'comprehensively'],
    personalNote: 'Good for Education essays',
    difficulty: 'medium',
    status: 'reviewing',
    tags: ['education', 'reading'],
  },
  {
    word: 'globalization',
    meaning: 'the process of increasing interconnection between countries',
    meaningVi: 'toàn cầu hóa',
    pronunciation: '/ˌɡləʊbəlaɪˈzeɪʃən/',
    partOfSpeech: 'noun',
    topic: 'Globalization',
    exampleSentence: 'Globalization has led to greater cultural exchange between nations.',
    collocations: ['economic globalization', 'globalization process', 'impact of globalization'],
    synonyms: ['internationalization', 'integration', 'liberalization'],
    antonyms: ['isolationism', 'protectionism'],
    wordFamily: ['globalize', 'global', 'globally'],
    personalNote: 'Key topic for IELTS Writing and Speaking',
    difficulty: 'medium',
    status: 'reviewing',
    tags: ['globalization', 'writing', 'speaking'],
  },
  {
    word: 'sedentary',
    meaning: 'tending to spend much time seated; inactive',
    meaningVi: 'ít vận động',
    pronunciation: '/ˈsedəntri/',
    partOfSpeech: 'adjective',
    topic: 'Health',
    exampleSentence: 'A sedentary lifestyle is linked to many health problems including obesity.',
    collocations: ['sedentary lifestyle', 'sedentary work', 'sedentary behavior'],
    synonyms: ['inactive', 'stationary', 'desk-bound'],
    antonyms: ['active', 'energetic', 'mobile'],
    wordFamily: ['sedentariness', 'sedentarily'],
    personalNote: 'Common in Health essays',
    difficulty: 'medium',
    status: 'learning',
    tags: ['health', 'writing'],
  },
  {
    word: 'remuneration',
    meaning: 'money paid for work or services',
    meaningVi: 'thù lao',
    pronunciation: '/rɪˌmjuːnəˈreɪʃən/',
    partOfSpeech: 'noun',
    topic: 'Work',
    exampleSentence: 'Employees expect fair remuneration for their contributions.',
    collocations: ['competitive remuneration', 'remuneration package', 'remuneration policy'],
    synonyms: ['compensation', 'salary', 'pay'],
    antonyms: [],
    wordFamily: ['remunerate', 'remunerative'],
    personalNote: 'Formal word for Work/Business topics',
    difficulty: 'hard',
    status: 'new',
    tags: ['work', 'business', 'formal'],
  },
  {
    word: 'infrastructure',
    meaning: 'the basic physical and organizational structures needed for society',
    meaningVi: 'cơ sở hạ tầng',
    pronunciation: '/ˈɪnfrəstrʌktʃə/',
    partOfSpeech: 'noun',
    topic: 'Transport',
    exampleSentence: 'The government needs to invest more in public transport infrastructure.',
    collocations: ['transport infrastructure', 'infrastructure development', 'infrastructure projects'],
    synonyms: ['framework', 'network', 'facilities'],
    antonyms: [],
    wordFamily: ['infrastructural'],
    personalNote: 'Used in Transport, Government, and Urbanization essays',
    difficulty: 'medium',
    status: 'reviewing',
    tags: ['transport', 'government'],
  },
  {
    word: 'deteriorate',
    meaning: 'to become progressively worse',
    meaningVi: 'xấu đi',
    pronunciation: '/dɪˈtɪəriəreɪt/',
    partOfSpeech: 'verb',
    topic: 'Health',
    exampleSentence: 'Without proper treatment, his health continued to deteriorate.',
    collocations: ['deteriorate rapidly', 'deteriorate over time', 'deteriorate further'],
    synonyms: ['worsen', 'decline', 'degenerate'],
    antonyms: ['improve', 'recover', 'strengthen'],
    wordFamily: ['deterioration', 'deteriorating'],
    personalNote: 'Useful for describing negative trends',
    difficulty: 'medium',
    status: 'learning',
    tags: ['health', 'environment'],
  },
  {
    word: 'innovation',
    meaning: 'a new method, idea, or product',
    meaningVi: 'sự đổi mới',
    pronunciation: '/ˌɪnəˈveɪʃən/',
    partOfSpeech: 'noun',
    topic: 'Technology',
    exampleSentence: 'Technological innovation has transformed the way we communicate.',
    collocations: ['technological innovation', 'innovation process', 'drive innovation'],
    synonyms: ['invention', 'breakthrough', 'modernization'],
    antonyms: ['stagnation', 'tradition'],
    wordFamily: ['innovate', 'innovative', 'innovator'],
    personalNote: 'Key word for Technology essays',
    difficulty: 'easy',
    status: 'mastered',
    tags: ['technology', 'business'],
  },
  {
    word: 'disparity',
    meaning: 'a great difference between things',
    meaningVi: 'sự chênh lệch',
    pronunciation: '/dɪˈspærəti/',
    partOfSpeech: 'noun',
    topic: 'Society',
    exampleSentence: 'There is a growing disparity between the rich and the poor.',
    collocations: ['income disparity', 'wealth disparity', 'social disparity'],
    synonyms: ['inequality', 'gap', 'imbalance'],
    antonyms: ['equality', 'parity', 'uniformity'],
    wordFamily: ['disparate'],
    personalNote: 'Common in Society/Government essays',
    difficulty: 'hard',
    status: 'learning',
    tags: ['society', 'writing'],
  },
  {
    word: 'rehabilitation',
    meaning: 'the restoration of something to a good condition',
    meaningVi: 'sự phục hồi',
    pronunciation: '/ˌriːəbɪlɪˈteɪʃən/',
    partOfSpeech: 'noun',
    topic: 'Crime',
    exampleSentence: 'The prison system should focus on rehabilitation rather than punishment.',
    collocations: ['rehabilitation program', 'rehabilitation center', 'criminal rehabilitation'],
    synonyms: ['recovery', 'restoration', 'reintegration'],
    antonyms: ['punishment', 'incarceration'],
    wordFamily: ['rehabilitate', 'rehabilitative'],
    personalNote: 'Key word for Crime topic essays',
    difficulty: 'hard',
    status: 'new',
    tags: ['crime', 'government'],
  },
  {
    word: 'multicultural',
    meaning: 'relating to several cultural or ethnic groups',
    meaningVi: 'đa văn hóa',
    pronunciation: '/ˌmʌltiˈkʌltʃərəl/',
    partOfSpeech: 'adjective',
    topic: 'Culture',
    exampleSentence: 'London is a multicultural city with residents from over 200 countries.',
    collocations: ['multicultural society', 'multicultural education', 'multicultural environment'],
    synonyms: ['diverse', 'pluralistic', 'cosmopolitan'],
    antonyms: ['monocultural', 'homogeneous'],
    wordFamily: ['multiculturalism', 'multiculturally'],
    personalNote: 'Good for Culture and Society topics',
    difficulty: 'easy',
    status: 'reviewing',
    tags: ['culture', 'society'],
  },
  {
    word: 'entrepreneurship',
    meaning: 'the activity of setting up a business or businesses',
    meaningVi: 'tinh thần khởi nghiệp',
    pronunciation: '/ˌɒntrəprəˈnɜːʃɪp/',
    partOfSpeech: 'noun',
    topic: 'Business',
    exampleSentence: 'Entrepreneurship is essential for economic growth and job creation.',
    collocations: ['entrepreneurship education', 'promote entrepreneurship', 'entrepreneurship ecosystem'],
    synonyms: ['enterprise', 'venturing', 'business ownership'],
    antonyms: [],
    wordFamily: ['entrepreneur', 'entrepreneurial'],
    personalNote: 'Common in Business/Work essays',
    difficulty: 'medium',
    status: 'learning',
    tags: ['business', 'work', 'economy'],
  },
  {
    word: 'conservation',
    meaning: 'the protection of natural resources and environments',
    meaningVi: 'sự bảo tồn',
    pronunciation: '/ˌkɒnsəˈveɪʃən/',
    partOfSpeech: 'noun',
    topic: 'Environment',
    exampleSentence: 'Wildlife conservation efforts have helped protect endangered species.',
    collocations: ['wildlife conservation', 'conservation efforts', 'energy conservation'],
    synonyms: ['preservation', 'protection', 'safeguarding'],
    antonyms: ['exploitation', 'destruction', 'waste'],
    wordFamily: ['conserve', 'conservative', 'conservationist'],
    personalNote: 'Essential for Environment topics',
    difficulty: 'easy',
    status: 'mastered',
    tags: ['environment', 'science'],
  },
  {
    word: 'urbanization',
    meaning: 'the process of population shifting from rural to urban areas',
    meaningVi: 'đô thị hóa',
    pronunciation: '/ˌɜːbənaɪˈzeɪʃən/',
    partOfSpeech: 'noun',
    topic: 'Housing',
    exampleSentence: 'Rapid urbanization has led to housing shortages in many major cities.',
    collocations: ['rapid urbanization', 'urbanization rate', 'urbanization process'],
    synonyms: ['urban development', 'city growth', 'urban expansion'],
    antonyms: ['ruralization', 'depopulation'],
    wordFamily: ['urbanize', 'urban', 'urbanized'],
    personalNote: 'Relevant to Housing, Transport, and Society',
    difficulty: 'medium',
    status: 'reviewing',
    tags: ['housing', 'society', 'transport'],
  },
  {
    word: 'contemporary',
    meaning: 'living or occurring at the same time; modern',
    meaningVi: 'đương đại',
    pronunciation: '/kənˈtemprəri/',
    partOfSpeech: 'adjective',
    topic: 'Art',
    exampleSentence: 'Contemporary art often challenges traditional notions of beauty.',
    collocations: ['contemporary art', 'contemporary society', 'contemporary issues'],
    synonyms: ['modern', 'current', 'present-day'],
    antonyms: ['traditional', 'ancient', 'outdated'],
    wordFamily: ['contemporarily', 'contemporaneous'],
    personalNote: 'Useful for Art and Media topics',
    difficulty: 'easy',
    status: 'reviewing',
    tags: ['art', 'media'],
  },
  {
    word: 'legislation',
    meaning: 'laws considered collectively; the process of making laws',
    meaningVi: 'pháp luật',
    pronunciation: '/ˌledʒɪsˈleɪʃən/',
    partOfSpeech: 'noun',
    topic: 'Government',
    exampleSentence: 'The government introduced new legislation to tackle air pollution.',
    collocations: ['introduce legislation', 'legislation requires', 'proposed legislation'],
    synonyms: ['law', 'statute', 'regulation'],
    antonyms: [],
    wordFamily: ['legislate', 'legislative', 'legislator'],
    personalNote: 'Key word for Government/Crime topics',
    difficulty: 'medium',
    status: 'learning',
    tags: ['government', 'crime'],
  },
  {
    word: 'recreation',
    meaning: 'activity done for enjoyment when not working',
    meaningVi: 'giải trí',
    pronunciation: '/ˌrekriˈeɪʃən/',
    partOfSpeech: 'noun',
    topic: 'Sports',
    exampleSentence: 'Parks provide important recreational spaces for urban communities.',
    collocations: ['recreational activities', 'recreation center', 'outdoor recreation'],
    synonyms: ['leisure', 'entertainment', 'amusement'],
    antonyms: ['work', 'labor'],
    wordFamily: ['recreational', 'recreate'],
    personalNote: 'Common in Sports/Health essays',
    difficulty: 'easy',
    status: 'mastered',
    tags: ['sports', 'health'],
  },
  {
    word: 'disseminate',
    meaning: 'to spread or disperse information widely',
    meaningVi: 'phổ biến',
    pronunciation: '/dɪˈsemɪneɪt/',
    partOfSpeech: 'verb',
    topic: 'Media',
    exampleSentence: 'Social media allows people to disseminate information quickly.',
    collocations: ['disseminate information', 'disseminate knowledge', 'disseminate results'],
    synonyms: ['spread', 'distribute', 'circulate'],
    antonyms: ['conceal', 'suppress', 'withhold'],
    wordFamily: ['dissemination', 'disseminator'],
    personalNote: 'Formal word, good for Media essays',
    difficulty: 'hard',
    status: 'new',
    tags: ['media', 'technology'],
  },
  {
    word: 'intergenerational',
    meaning: 'relating to or affecting multiple generations',
    meaningVi: 'liên thế hệ',
    pronunciation: '/ˌɪntədʒenəˈreɪʃənəl/',
    partOfSpeech: 'adjective',
    topic: 'Family',
    exampleSentence: 'Intergenerational relationships benefit both young and old members of society.',
    collocations: ['intergenerational relationships', 'intergenerational conflict', 'intergenerational mobility'],
    synonyms: ['multigenerational', 'cross-generational'],
    antonyms: ['intragenerational'],
    wordFamily: ['generation', 'generational'],
    personalNote: 'Good for Family and Society topics',
    difficulty: 'hard',
    status: 'new',
    tags: ['family', 'society'],
  },
  {
    word: 'empirical',
    meaning: 'based on observation or experience, not theory',
    meaningVi: 'thực nghiệm',
    pronunciation: '/ɪmˈpɪrɪkəl/',
    partOfSpeech: 'adjective',
    topic: 'Science',
    exampleSentence: 'The study provides empirical evidence to support the hypothesis.',
    collocations: ['empirical evidence', 'empirical research', 'empirical data'],
    synonyms: ['experimental', 'observational', 'evidence-based'],
    antonyms: ['theoretical', 'speculative', 'hypothetical'],
    wordFamily: ['empirically', 'empiricism', 'empiricist'],
    personalNote: 'Key word for Science essays',
    difficulty: 'hard',
    status: 'learning',
    tags: ['science', 'writing'],
  },
  {
    word: 'curriculum',
    meaning: 'the subjects in a course of study or program',
    meaningVi: 'chương trình học',
    pronunciation: '/kəˈrɪkjʊləm/',
    partOfSpeech: 'noun',
    topic: 'Education',
    exampleSentence: 'The school curriculum should include practical skills alongside academic subjects.',
    collocations: ['school curriculum', 'curriculum development', 'core curriculum'],
    synonyms: ['syllabus', 'course of study', 'program'],
    antonyms: [],
    wordFamily: ['curricular', 'extracurricular'],
    personalNote: 'Very common in Education essays',
    difficulty: 'easy',
    status: 'mastered',
    tags: ['education'],
  },
  {
    word: 'commodify',
    meaning: 'to turn something into a product that can be bought and sold',
    meaningVi: 'hàng hóa hóa',
    pronunciation: '/kəˈmɒdɪfaɪ/',
    partOfSpeech: 'verb',
    topic: 'Globalization',
    exampleSentence: 'Critics argue that globalization tends to commodify cultural traditions.',
    collocations: ['commodify culture', 'commodify art', 'commodify education'],
    synonyms: ['commercialize', 'marketize', 'merchandise'],
    antonyms: [],
    wordFamily: ['commodity', 'commodification', 'commoditization'],
    personalNote: 'Advanced word for Globalization topics',
    difficulty: 'hard',
    status: 'new',
    tags: ['globalization', 'culture'],
  },
  {
    word: 'congestion',
    meaning: 'the state of being overcrowded, especially with traffic',
    meaningVi: 'sự tắc nghẽn',
    pronunciation: '/kənˈdʒestʃən/',
    partOfSpeech: 'noun',
    topic: 'Transport',
    exampleSentence: 'Traffic congestion is a major problem in most urban areas.',
    collocations: ['traffic congestion', 'congestion charge', 'road congestion'],
    synonyms: ['gridlock', 'traffic jam', 'overcrowding'],
    antonyms: ['free flow', 'smooth traffic'],
    wordFamily: ['congest', 'congested'],
    personalNote: 'Common in Transport essays',
    difficulty: 'easy',
    status: 'reviewing',
    tags: ['transport', 'housing'],
  },
]


interface SeedTask {
  title: string
  description: string
  category: TaskCategory
  date: string
  isDone: boolean
  isRecurring: boolean
  recurringDays: number[]
  notes: string
  timeMinutes: number
  completedAt: string | null
}

function generateSeedTasks(): SeedTask[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  function taskDate(dayOffset: number): string {
    const d = new Date(monday)
    d.setDate(d.getDate() + dayOffset)
    return d.toISOString()
  }

  const tasks: SeedTask[] = [
    {
      title: 'Learn 10 new vocabulary words',
      description: 'Study new words on the topic of Environment using the Vocabulary Notebook',
      category: 'Vocabulary',
      date: taskDate(0),
      isDone: true,
      isRecurring: true,
      recurringDays: [0, 1, 2, 3, 4, 5, 6],
      notes: 'Focus on academic collocations',
      timeMinutes: 20,
      completedAt: taskDate(0),
    },
    {
      title: 'Review vocabulary due today',
      description: 'Use the spaced repetition system to review words due for today',
      category: 'Vocabulary',
      date: taskDate(0),
      isDone: true,
      isRecurring: true,
      recurringDays: [0, 1, 2, 3, 4, 5, 6],
      notes: '',
      timeMinutes: 15,
      completedAt: taskDate(0),
    },
    {
      title: 'Write a Task 2 essay',
      description: 'Practice writing a 250-word essay on an Education topic',
      category: 'Writing Task 2',
      date: taskDate(0),
      isDone: true,
      isRecurring: false,
      recurringDays: [],
      notes: 'Focus on structure: introduction, body paragraphs, conclusion',
      timeMinutes: 40,
      completedAt: taskDate(0),
    },
    {
      title: 'Read IELTS passage on Technology',
      description: 'Read and answer questions for one IELTS Reading passage',
      category: 'Reading',
      date: taskDate(0),
      isDone: true,
      isRecurring: true,
      recurringDays: [0, 2, 4],
      notes: 'Practice skimming and scanning techniques',
      timeMinutes: 30,
      completedAt: taskDate(0),
    },
    {
      title: 'Review grammar: Conditionals',
      description: 'Study the rules and practice exercises for conditional sentences',
      category: 'Grammar',
      date: taskDate(1),
      isDone: false,
      isRecurring: true,
      recurringDays: [1, 3],
      notes: 'Focus on mixed conditionals',
      timeMinutes: 20,
      completedAt: null,
    },
    {
      title: 'Speaking Part 2 practice',
      description: 'Practice a cue card topic for 2 minutes on the topic of Travel',
      category: 'Speaking Part 2',
      date: taskDate(1),
      isDone: false,
      isRecurring: false,
      recurringDays: [],
      notes: 'Record yourself and check for fluency',
      timeMinutes: 30,
      completedAt: null,
    },
    {
      title: 'Listening Section 1 practice',
      description: 'Complete one Listening Section 1 exercise',
      category: 'Listening',
      date: taskDate(1),
      isDone: false,
      isRecurring: true,
      recurringDays: [1, 3, 5],
      notes: '',
      timeMinutes: 25,
      completedAt: null,
    },
    {
      title: 'Review repeated mistakes',
      description: 'Go through the Mistake Notebook and review unresolved mistakes',
      category: 'Grammar',
      date: taskDate(2),
      isDone: false,
      isRecurring: true,
      recurringDays: [2, 5],
      notes: 'Update status of reviewed mistakes',
      timeMinutes: 15,
      completedAt: null,
    },
    {
      title: 'Practice Writing Task 1',
      description: 'Describe a chart or graph for IELTS Writing Task 1',
      category: 'Writing Task 1',
      date: taskDate(2),
      isDone: false,
      isRecurring: false,
      recurringDays: [],
      notes: 'Focus on overview and key features',
      timeMinutes: 30,
      completedAt: null,
    },
    {
      title: 'Speaking Part 3 discussion',
      description: 'Practice answering abstract questions about Society',
      category: 'Speaking Part 3',
      date: taskDate(2),
      isDone: false,
      isRecurring: false,
      recurringDays: [],
      notes: 'Develop ideas with examples',
      timeMinutes: 20,
      completedAt: null,
    },
    {
      title: 'Review grammar: Relative Clauses',
      description: 'Study defining and non-defining relative clauses',
      category: 'Grammar',
      date: taskDate(3),
      isDone: false,
      isRecurring: false,
      recurringDays: [],
      notes: '',
      timeMinutes: 20,
      completedAt: null,
    },
    {
      title: 'Learn new words on Health topic',
      description: 'Add 5 new health-related words to vocabulary notebook',
      category: 'Vocabulary',
      date: taskDate(3),
      isDone: false,
      isRecurring: true,
      recurringDays: [0, 1, 2, 3, 4, 5, 6],
      notes: '',
      timeMinutes: 15,
      completedAt: null,
    },
    {
      title: 'Full Mock Test',
      description: 'Complete one full IELTS mock test under timed conditions',
      category: 'Mock Test',
      date: taskDate(4),
      isDone: false,
      isRecurring: false,
      recurringDays: [],
      notes: 'Create a quiet environment and time yourself strictly',
      timeMinutes: 165,
      completedAt: null,
    },
    {
      title: 'Review week progress',
      description: 'Review Progress Analytics and plan next week goals',
      category: 'Reading',
      date: taskDate(5),
      isDone: false,
      isRecurring: true,
      recurringDays: [5],
      notes: '',
      timeMinutes: 20,
      completedAt: null,
    },
    {
      title: 'Rest and light vocabulary review',
      description: 'Review 10 words from the Review Center',
      category: 'Vocabulary',
      date: taskDate(6),
      isDone: false,
      isRecurring: true,
      recurringDays: [6],
      notes: 'Keep it light — just review, no new content',
      timeMinutes: 15,
      completedAt: null,
    },
  ]
  return tasks
}


interface SeedGrammar {
  topic: string
  explanation: string
  exampleSentences: string[]
  commonMistakes: string[]
  correctedExamples: string[]
  personalNote: string
  relatedSkill: string
  status: GrammarStatus
}

const SEED_GRAMMAR: SeedGrammar[] = [
  {
    topic: 'Conditional Sentences',
    explanation: 'Conditional sentences are used to express that one action depends on another. There are four main types: Zero (general truth), First (real future), Second (unreal present), and Third (unreal past).',
    exampleSentences: [
      'If you heat water to 100°C, it boils. (Zero conditional)',
      'If I study hard, I will pass the exam. (First conditional)',
      'If I had more time, I would travel the world. (Second conditional)',
      'If I had studied harder, I would have passed. (Third conditional)',
    ],
    commonMistakes: [
      'Using "will" in the if-clause: "If I will go, I will call you."',
      'Mixing up second and third conditional forms',
      'Forgetting the comma when the if-clause comes first',
    ],
    correctedExamples: [
      'If I go, I will call you.',
      'If I were rich, I would buy a house. (NOT: If I was rich)',
      'If I had known, I would have come earlier.',
    ],
    personalNote: 'Very common in Speaking Part 3 when giving hypothetical answers',
    relatedSkill: 'speaking',
    status: 'reviewing',
  },
  {
    topic: 'Relative Clauses',
    explanation: 'Relative clauses give extra information about a noun. Defining relative clauses are essential to meaning; non-defining relative clauses add extra information and are set off by commas.',
    exampleSentences: [
      'The student who studies every day will improve quickly. (defining)',
      'My sister, who lives in London, is a doctor. (non-defining)',
      'The book which I borrowed was very helpful.',
    ],
    commonMistakes: [
      'Using "that" in non-defining clauses',
      'Omitting the relative pronoun when it is necessary',
      'Using the wrong pronoun for people vs. things',
    ],
    correctedExamples: [
      'My car, which is red, is parked outside. (NOT: My car, that is red)',
      'The woman who called you is my teacher.',
      'The laptop that I bought is faulty.',
    ],
    personalNote: 'Use relative clauses in Writing Task 2 to improve cohesion',
    relatedSkill: 'writing',
    status: 'weak',
  },
  {
    topic: 'Article Usage (a/an/the)',
    explanation: 'Articles are used before nouns. "A/an" is used for non-specific singular countable nouns. "The" is used for specific nouns, unique things, and before superlatives. No article is used for general plurals and uncountable nouns.',
    exampleSentences: [
      'I saw a dog in the park. (any dog)',
      'The dog I saw was brown. (specific dog)',
      'Dogs are loyal animals. (general statement)',
    ],
    commonMistakes: [
      'Omitting "the" before superlatives',
      'Using "the" when making general statements with plurals',
      'Forgetting "a/an" before singular countable nouns',
    ],
    correctedExamples: [
      'She is the best student in the class.',
      'I love dogs. (NOT: I love the dogs — when speaking generally)',
      'He is a teacher.',
    ],
    personalNote: 'Pay attention during Speaking test — easy to make small mistakes',
    relatedSkill: 'speaking',
    status: 'reviewing',
  },
  {
    topic: 'Passive Voice',
    explanation: 'Passive voice focuses on the action rather than the doer. Formed with "be" + past participle. Commonly used in academic writing and Task 1 descriptions.',
    exampleSentences: [
      'The experiment was conducted by the research team.',
      'English is spoken worldwide.',
      'The chart shows that sales were increased by 20%.',
    ],
    commonMistakes: [
      'Overusing passive voice when active is clearer',
      'Wrong past participle forms',
      'Forgetting to include the agent when necessary',
    ],
    correctedExamples: [
      'The window was broken. (by someone)',
      'The report was written by the intern.',
      'Mistakes were made by the team.',
    ],
    personalNote: 'Essential for Writing Task 1 when describing diagrams and processes',
    relatedSkill: 'writing',
    status: 'weak',
  },
  {
    topic: 'Tense Consistency',
    explanation: 'Maintain the same tense throughout a paragraph unless there is a reason to shift. In IELTS essays, use present simple for general truths, past simple for completed past events, and present perfect for past-to-present connections.',
    exampleSentences: [
      'Many people believe that education is important. (present simple)',
      'In 2020, the government introduced new policies. (past simple)',
      'The number of users has increased significantly. (present perfect)',
    ],
    commonMistakes: [
      'Shifting tense within the same sentence without reason',
      'Using past simple when present perfect is needed',
      'Mixing present and past in a paragraph describing a trend',
    ],
    correctedExamples: [
      'I have lived here for five years. (NOT: I am living here for five years)',
      'She studied engineering, and now she works as an architect.',
      'The data shows that sales increased steadily.',
    ],
    personalNote: 'Pay attention in Writing Task 1 when describing trends over time',
    relatedSkill: 'writing',
    status: 'reviewing',
  },
]


interface SeedWriting {
  taskType: WritingTaskType
  question: string
  essay: string
  topic: string
  wordCount: number
  timeSpentMinutes: number
  estimatedBand: number
  feedback: string
  grammarMistakes: string
  vocabularyMistakes: string
  coherenceNotes: string
  improvedSentences: string
  betterVersion: string
  personalReflection: string
}

const SEED_WRITING: SeedWriting[] = [
  {
    taskType: 'task2',
    question: 'Some people believe that governments should invest more in public transportation to reduce traffic congestion. Others think that building more roads is the better solution. Discuss both views and give your own opinion.',
    essay: 'Traffic congestion is a growing problem in many cities around the world. Some people argue that governments should spend more money on public transportation, while others believe that constructing additional roads is more effective. This essay will discuss both perspectives before presenting my own view.\n\nOn the one hand, investing in public transportation can significantly reduce the number of private vehicles on the road. When efficient and affordable public transport options are available, people are more likely to use them instead of driving their own cars. For example, cities like Tokyo and London have excellent subway systems that carry millions of passengers daily, which helps to minimize traffic jams. Furthermore, public transportation is more environmentally friendly as it produces fewer emissions per passenger.\n\nOn the other hand, building more roads can also help to alleviate congestion. Wider roads and additional highways can accommodate more vehicles and reduce bottlenecks. However, this approach has limitations. Studies have shown that building new roads often encourages more people to drive, which eventually leads to the same level of congestion. This phenomenon is known as induced demand.\n\nIn my opinion, a combination of both approaches is the most effective solution. Governments should invest in expanding public transport networks while also improving existing road infrastructure. Additionally, policies such as congestion charging and promoting cycling can complement these efforts.\n\nIn conclusion, while both public transportation investment and road construction have their merits, I believe that prioritizing public transport is the more sustainable long-term solution to traffic congestion.',
    topic: 'Transport',
    wordCount: 248,
    timeSpentMinutes: 45,
    estimatedBand: 6.5,
    feedback: 'Good structure with clear introduction, body paragraphs, and conclusion. The essay addresses both views and gives your opinion. To improve, develop your examples further and use more specific data. The conclusion could be stronger by summarizing key points more effectively.',
    grammarMistakes: 'Missing article before "growing problem" — should be "a growing problem." "More environmentally friendly" is fine, but consider "more environmentally friendly option" for clarity.',
    vocabularyMistakes: 'Good range of vocabulary but could include more topic-specific terms like "congestion charge," "bottlenecks," "emissions." Try using more advanced collocations.',
    coherenceNotes: 'Coherence is good with clear paragraphing. Use more linking words like "furthermore," "moreover," "in addition" to connect ideas better. The essay flows logically from one point to the next.',
    improvedSentences: 'Original: "Traffic congestion is a growing problem in many cities." Improved: "Traffic congestion has become an increasingly pressing issue in urban centers worldwide."',
    betterVersion: '',
    personalReflection: 'Need to improve vocabulary range and use more specific examples. Practice writing within 40 minutes to simulate exam conditions.',
  },
  {
    taskType: 'task1',
    question: 'The chart below shows the percentage of households in a country with internet access from 2015 to 2022. Summarize the information by selecting and reporting the main features.',
    essay: 'The line chart illustrates the proportion of households that had internet access in a particular country between 2015 and 2022.\n\nOverall, there was a significant upward trend in internet access over the period, with the percentage increasing from just over 60% to nearly 100%. The most notable growth occurred between 2016 and 2019.\n\nIn 2015, approximately 62% of households had internet access. This figure rose steadily to around 70% in 2016 and 78% in 2017. Between 2017 and 2018, the increase was particularly sharp, reaching 88% by the end of 2018.\n\nThe upward trend continued, albeit at a slower pace, from 2019 onwards. In 2019, the proportion stood at 92%, and it gradually climbed to 95% in 2020. The figure remained relatively stable in 2021 before reaching a peak of 98% in 2022.\n\nIn conclusion, the period saw a dramatic increase in household internet access, with near-universal coverage achieved by the end of the period.',
    topic: 'Technology',
    wordCount: 174,
    timeSpentMinutes: 25,
    estimatedBand: 6.0,
    feedback: 'Good overview and clear data description. To improve, use more varied vocabulary for describing changes (e.g., "soared," "plummeted," "plateaued"). Make sure to report all key data points accurately.',
    grammarMistakes: '"Just over 60%" is fine. Ensure consistency in tense — use past simple throughout since the period is complete.',
    vocabularyMistakes: 'Use more precise language: "sharp increase," "steady rise," "gradual growth." Try to avoid repeating "increased" multiple times.',
    coherenceNotes: 'Structure is logical. Use more comparison language to contrast different time periods.',
    improvedSentences: 'Original: "The figure rose steadily to around 70% in 2016." Improved: "The proportion experienced a steady rise, reaching approximately 70% by 2016."',
    betterVersion: '',
    personalReflection: 'Practice using more varied vocabulary. Work on describing data more precisely.',
  },
]


interface SeedSpeaking {
  part: SpeakingPart
  question: string
  answerNotes: string
  topic: string
  durationSeconds: number
  selfRating: number
  fluencyNotes: string
  vocabularyNotes: string
  grammarMistakes: string
  pronunciationNotes: string
  betterExpressions: string
  improvedAnswer: string
}

const SEED_SPEAKING: SeedSpeaking[] = [
  {
    part: 1,
    question: 'Do you like to travel? Why or why not?',
    answerNotes: 'I enjoy traveling because it allows me to experience new cultures and cuisines. I try to take at least two trips per year, both domestic and international. Recently I visited Japan and was amazed by the blend of tradition and modernity.',
    topic: 'Travel',
    durationSeconds: 45,
    selfRating: 7,
    fluencyNotes: 'Good pace, a few hesitations when thinking of specific vocabulary. Need to reduce filler words like "um" and "like."',
    vocabularyNotes: 'Used "domestic and international travel," "blend of tradition and modernity." Could include more descriptive adjectives.',
    grammarMistakes: '"Recently I visited" is correct. Try to use present perfect for recent experiences: "I have recently visited."',
    pronunciationNotes: 'Pronunciation is clear. Work on intonation to sound more natural.',
    betterExpressions: '"I have a keen interest in exploring new destinations." "Travel broadens the mind and exposes you to different perspectives."',
    improvedAnswer: 'I am absolutely passionate about traveling because it gives me the opportunity to immerse myself in different cultures and cuisines. I typically take two or three trips annually, both within my country and abroad. For instance, I recently visited Japan, and I was truly captivated by how seamlessly tradition and modernity coexist there, from ancient temples to cutting-edge technology.',
  },
  {
    part: 2,
    question: 'Describe a piece of technology that you find useful. You should say: what it is, when you got it, how you use it, and explain why you find it useful.',
    answerNotes: 'Smartphone — got it 2 years ago. Use it for communication, navigation, learning English with apps, reading news, managing schedule. Very useful because it combines many tools in one device. Helps me study IELTS on the go with vocabulary apps and podcasts.',
    topic: 'Technology',
    durationSeconds: 90,
    selfRating: 6,
    fluencyNotes: 'Structured well but ran out of things to say before 2 minutes. Need to develop ideas with more examples and details.',
    vocabularyNotes: 'Good basic vocabulary. Could use "indispensable," "multifunctional," "streamline my daily routine."',
    grammarMistakes: '"Got it 2 years ago" should be "I bought it two years ago." Avoid very short sentence fragments in formal speech.',
    pronunciationNotes: 'Speak a bit slower to improve clarity. Emphasize key words.',
    betterExpressions: '"It has become an indispensable part of my daily life." "It helps me streamline my study routine." "The device is incredibly versatile."',
    improvedAnswer: 'I would like to talk about my smartphone, which has become an indispensable part of my daily life. I purchased it about two years ago, and since then it has completely transformed how I manage my routine. I use it for a wide range of purposes, including communication with family and friends, navigation when I travel, and most importantly, studying English. For instance, I use vocabulary-building apps and listen to IELTS podcasts during my commute. I find it incredibly useful because it is essentially a multipurpose device that helps me stay organized, productive, and connected wherever I go.',
  },
  {
    part: 3,
    question: 'How has technology changed the way people communicate in modern society? Do you think these changes are positive or negative?',
    answerNotes: 'Technology has dramatically changed communication. People now use social media, messaging apps, and video calls instead of face-to-face meetings. This has both positive and negative effects. Positive: instant communication across distances, connecting with people globally. Negative: less personal interaction, reduced privacy, information overload.',
    topic: 'Technology',
    durationSeconds: 75,
    selfRating: 7,
    fluencyNotes: 'Good structure with balanced view. Could extend ideas with more specific examples or statistics.',
    vocabularyNotes: '"Instant communication," "information overload" are good. Could use "digital communication," "virtual interaction," "erosion of privacy."',
    grammarMistakes: 'Overall good. "Reduced privacy" is correct. Use "the erosion of privacy" for more formal expression.',
    pronunciationNotes: 'Good intonation. Practice linking words for more natural flow.',
    betterExpressions: '"Technology has revolutionized the way we interact with one another." "While it has facilitated global connectivity, it has also led to a decline in face-to-face communication."',
    improvedAnswer: 'Technology has revolutionized the way people interact in countless ways. Nowadays, social media platforms, instant messaging applications, and video conferencing tools have largely replaced traditional face-to-face communication. In my view, this transformation has both advantages and drawbacks. On the positive side, technology enables us to stay in touch with friends and family across the globe instantly, and it has made information more accessible than ever before. However, on the negative side, over-reliance on digital communication can lead to a decline in meaningful personal interactions and contribute to a sense of social isolation. I believe that the key lies in striking a balance between digital and in-person communication.',
  },
]


interface SeedReading {
  title: string
  topic: string
  sourceUrl: string
  passageText: string
  questionType: QuestionType
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  timeSpentMinutes: number
  newVocabulary: string[]
  summary: string
  mistakes: string
  notes: string
}

const SEED_READING: SeedReading[] = [
  {
    title: 'Education Systems Around the World',
    topic: 'Education',
    sourceUrl: 'https://www.britishcouncil.org/education',
    passageText: 'Education systems vary significantly across different countries. In Finland, for example, students do not take standardized tests until later in their academic careers. The focus is on collaborative learning and critical thinking rather than rote memorization. This approach has yielded impressive results, with Finnish students consistently ranking among the top in international assessments. In contrast, many Asian education systems, such as those in South Korea and Japan, emphasize rigorous testing and academic competition from an early age. While this produces high academic achievement, critics argue that it can lead to excessive stress and a lack of creativity. The debate between these two approaches continues to shape education policy worldwide.',
    questionType: 'True / False / Not Given',
    totalQuestions: 8,
    correctAnswers: 6,
    accuracy: 75,
    timeSpentMinutes: 22,
    newVocabulary: ['rote memorization', 'collaborative learning', 'rigorous testing', 'impressive results', 'excessive stress'],
    summary: 'The passage compares different education systems, focusing on the Finnish approach of collaborative learning without early standardized tests versus the Asian approach of rigorous testing and competition.',
    mistakes: 'Misread one TFNG question about Finland — the passage said students do not take standardized tests until later, but I marked "True" for "Finnish students never take standardized tests."',
    notes: 'Practice skimming more efficiently. Focus on keywords in questions before reading the passage.',
  },
  {
    title: 'Climate Change and Renewable Energy',
    topic: 'Environment',
    sourceUrl: 'https://www.unep.org/climate-change',
    passageText: 'Climate change is one of the most pressing challenges facing humanity today. Rising global temperatures, melting polar ice caps, and extreme weather events are clear indicators of this phenomenon. In response, many countries have committed to reducing their carbon emissions and transitioning to renewable energy sources such as solar, wind, and hydroelectric power. However, the transition faces significant obstacles, including the high initial cost of renewable infrastructure and the intermittent nature of some renewable sources. Despite these challenges, technological advancements in energy storage and grid management are making renewable energy increasingly viable. Experts suggest that a combination of policy support, technological innovation, and public awareness is essential for a successful transition to a sustainable energy future.',
    questionType: 'Multiple Choice',
    totalQuestions: 6,
    correctAnswers: 5,
    accuracy: 83,
    timeSpentMinutes: 18,
    newVocabulary: ['pressing challenge', 'melting polar ice caps', 'extreme weather events', 'intermittent nature', 'grid management'],
    summary: 'The passage discusses climate change indicators, the global transition to renewable energy, the challenges faced, and the solutions being developed.',
    mistakes: 'One question about "main obstacle to renewable energy" — chose "public awareness" instead of "high initial cost."',
    notes: 'Read carefully for specific details. Eliminate wrong answers before choosing.',
  },
]


interface SeedListening {
  title: string
  sourceUrl: string
  topic: string
  durationMinutes: number
  section: number
  score: number
  transcriptNotes: string
  newVocabulary: string[]
  difficultSentences: string
  mistakes: string
  shadowingNotes: string
  selfRating: number
}

const SEED_LISTENING: SeedListening[] = [
  {
    title: 'University Orientation Talk',
    sourceUrl: 'https://www.ielts.org/listening/sample-1',
    topic: 'Education',
    durationMinutes: 12,
    section: 1,
    score: 8,
    transcriptNotes: 'Talk about university facilities, library opening hours, student union services, and campus map. Speaker was British English with moderate pace.',
    newVocabulary: ['orientation week', 'student union', 'facilities', 'registration deadline', 'campus map'],
    difficultSentences: '"Students are advised to register for extracurricular activities by the end of the first week, failing which they may not be allocated a slot."',
    mistakes: 'Missed the library closing time on Saturday (5:30 PM, wrote 5 PM). Number question about student ID — wrote 7842 instead of 7842B.',
    shadowingNotes: 'Work on British intonation patterns. The speaker dropped some "t" sounds in words like "important" and "twenty."',
    selfRating: 7,
  },
  {
    title: 'Environmental Science Lecture',
    sourceUrl: 'https://www.ielts.org/listening/sample-2',
    topic: 'Environment',
    durationMinutes: 15,
    section: 3,
    score: 7,
    transcriptNotes: 'Discussion between a professor and two students about a research project on urban air pollution. Academic vocabulary, faster pace, multiple speakers.',
    newVocabulary: ['particulate matter', 'air quality index', 'emission levels', 'data collection methodology', 'statistical significance'],
    difficultSentences: '"The correlation between traffic density and particulate matter concentration was found to be statistically significant at the 95 percent confidence level."',
    mistakes: 'Spelling error: "concentration" spelled wrong in answer. Misheard "nitrogen dioxide" as "nitrogen dioxide levels."',
    shadowingNotes: 'The female speaker spoke quite fast with connected speech. Practice shadowing academic discussions with multiple speakers.',
    selfRating: 6,
  },
]


interface SeedMistake {
  mistake: string
  correction: string
  explanation: string
  source: string
  date: string
  skill: MistakeSkill
  status: 'new' | 'reviewed' | 'resolved'
  repetitionCount: number
}

const SEED_MISTAKES: SeedMistake[] = [
  {
    mistake: 'I am used to study at night.',
    correction: 'I am used to studying at night.',
    explanation: '"Be used to" is followed by a gerund (-ing form), not an infinitive.',
    source: 'Speaking practice - Part 1',
    date: daysFromNow(-5),
    skill: 'grammar',
    status: 'reviewed',
    repetitionCount: 2,
  },
  {
    mistake: 'If I would have more time, I would travel more.',
    correction: 'If I had more time, I would travel more.',
    explanation: 'In second conditional, use past simple (if + subject + past simple) in the if-clause, not "would."',
    source: 'Writing Task 2 essay',
    date: daysFromNow(-3),
    skill: 'grammar',
    status: 'new',
    repetitionCount: 3,
  },
  {
    mistake: 'The number of student are increasing.',
    correction: 'The number of students is increasing.',
    explanation: '"The number of" is singular, so the verb should be "is" not "are." Also "students" should be plural.',
    source: 'Writing Task 1',
    date: daysFromNow(-4),
    skill: 'grammar',
    status: 'reviewed',
    repetitionCount: 1,
  },
  {
    mistake: 'Effect vs Affect — confused in sentence.',
    correction: 'The new policy will affect (verb) the economy. The effect (noun) on the economy was significant.',
    explanation: '"Affect" is a verb meaning to influence. "Effect" is a noun meaning the result.',
    source: 'Writing Task 2',
    date: daysFromNow(-2),
    skill: 'vocabulary',
    status: 'new',
    repetitionCount: 4,
  },
  {
    mistake: 'Answered "False" instead of "Not Given" because I assumed information was contradicted.',
    correction: 'The passage simply did not mention the information asked. It was not stated or contradicted.',
    explanation: 'Only choose "False" if the passage directly contradicts the statement. If the information is not present, choose "Not Given."',
    source: 'Reading practice - True/False/Not Given',
    date: daysFromNow(-6),
    skill: 'reading',
    status: 'new',
    repetitionCount: 2,
  },
]


interface SeedMockTest {
  date: string
  listeningScore: number
  readingScore: number
  writingBand: number
  speakingBand: number
  overallBand: number
  notes: string
  weakAreas: string[]
  improvementPlan: string
}

const SEED_MOCK_TESTS: SeedMockTest[] = [
  {
    date: daysFromNow(-14),
    listeningScore: 26,
    readingScore: 28,
    writingBand: 6.0,
    speakingBand: 6.5,
    overallBand: 6.5,
    notes: 'First full mock test. Felt nervous during Listening Section 3 and 4. Running out of time in Reading. Writing Task 2 was better than Task 1.',
    weakAreas: ['Listening Section 3 and 4', 'Reading time management', 'Writing Task 1 structure'],
    improvementPlan: 'Practice Listening Sections 3-4 daily. Work on speed reading techniques. Study Writing Task 1 structure for charts and graphs.',
  },
  {
    date: daysFromNow(-7),
    listeningScore: 28,
    readingScore: 30,
    writingBand: 6.0,
    speakingBand: 6.5,
    overallBand: 6.5,
    notes: 'Improved in Listening Sections 1-2 but still need work on 3-4. Reading score improved slightly. Writing still needs work on Task 1.',
    weakAreas: ['Listening Section 4', 'Writing Task 1 vocabulary', 'Vocabulary range'],
    improvementPlan: 'Continue daily listening practice. Add 10 new academic words per day. Practice describing different chart types for Task 1.',
  },
]


interface SeedPassage {
  title: string
  content: string
  highlightedWords: string[]
  source: 'user-created' | 'pasted'
}

const SEED_PASSAGES: SeedPassage[] = [
  {
    title: 'Technology in Modern Education',
    content: 'The integration of technology in education has become increasingly ubiquitous. From interactive whiteboards to online learning platforms, technology has transformed the way students access information and develop skills. While some argue that digital tools can be distracting, comprehensive research shows that when used appropriately, technology can enhance learning outcomes significantly. Schools must innovate their teaching methods to prepare students for a rapidly changing world, ensuring that the curriculum remains relevant and engaging.',
    highlightedWords: ['ubiquitous', 'comprehensive', 'innovate', 'curriculum'],
    source: 'user-created',
  },
  {
    title: 'Environmental Challenges',
    content: 'The world faces pressing environmental challenges that require urgent action. Climate change, driven by greenhouse gas emissions, is causing global temperatures to rise. To mitigate these effects, governments must invest in sustainable infrastructure and promote conservation efforts. The transition to renewable energy is essential, although it requires significant economic investment. Ultimately, protecting our environment requires a collaborative effort from individuals, businesses, and governments working together toward a more sustainable future.',
    highlightedWords: ['mitigate', 'sustainable', 'conservation', 'emissions'],
    source: 'user-created',
  },
]


export function isSeedDataLoaded(): boolean {
  try {
    const raw = localStorage.getItem('ielts-settings')
    if (raw) {
      const settings = JSON.parse(raw)
      return settings.sampleDataLoaded === true
    }
  } catch { /* ignore */ }
  return false
}

function markSeedDataLoaded() {
  try {
    const raw = localStorage.getItem('ielts-settings')
    const settings = raw ? JSON.parse(raw) : {}
    settings.sampleDataLoaded = true
    localStorage.setItem('ielts-settings', JSON.stringify(settings))
  } catch { /* ignore */ }
}

export async function loadSeedData(): Promise<void> {
  if (isSeedDataLoaded()) return

  const now = new Date().toISOString()
  const tasks = generateSeedTasks()

  for (const v of SEED_VOCABULARY) {
    const entry: VocabularyEntry = {
      id: uid(),
      ...v,
      createdAt: now,
      updatedAt: now,
    }
    await DatabaseService.put('vocabulary', entry)

    // Also create a vocab review entry so the review system works immediately
    const reviewEntry: VocabReviewEntry = {
      id: uid(),
      vocabularyId: entry.id,
      interval: v.status === 'mastered' ? 30 : v.status === 'reviewing' ? 3 : 0,
      easeFactor: 2.5,
      repetitions: v.status === 'mastered' ? 5 : v.status === 'reviewing' ? 2 : 0,
      nextReviewDate: daysFromNow(0),
      lastReviewDate: now,
      history: [],
    }
    await DatabaseService.put('vocabularyReviews', reviewEntry)
  }

  for (const t of tasks) {
    const entry: TaskEntry = {
      id: uid(),
      ...t,
      createdAt: t.date,
      updatedAt: t.date,
    }
    await DatabaseService.put('tasks', entry)
  }

  for (const g of SEED_GRAMMAR) {
    const entry: GrammarNote = {
      id: uid(),
      ...g,
      createdAt: now,
      updatedAt: now,
    }
    await DatabaseService.put('grammarNotes', entry)
  }

  for (const w of SEED_WRITING) {
    const entry: WritingSession = {
      id: uid(),
      ...w,
      createdAt: daysFromNow(-Math.floor(Math.random() * 10) - 1),
    }
    await DatabaseService.put('writingSessions', entry)
  }

  for (const s of SEED_SPEAKING) {
    const entry: SpeakingSession = {
      id: uid(),
      ...s,
      createdAt: daysFromNow(-Math.floor(Math.random() * 10) - 1),
    }
    await DatabaseService.put('speakingSessions', entry)
  }

  for (const r of SEED_READING) {
    const entry: ReadingSession = {
      id: uid(),
      ...r,
      createdAt: daysFromNow(-Math.floor(Math.random() * 8) - 2),
    }
    await DatabaseService.put('readingSessions', entry)
  }

  for (const l of SEED_LISTENING) {
    const entry: ListeningSession = {
      id: uid(),
      ...l,
      createdAt: daysFromNow(-Math.floor(Math.random() * 8) - 2),
    }
    await DatabaseService.put('listeningSessions', entry)
  }

  for (const m of SEED_MISTAKES) {
    const entry: MistakeEntry = {
      id: uid(),
      ...m,
      createdAt: m.date,
      updatedAt: m.date,
    }
    await DatabaseService.put('mistakes', entry)
  }

  for (const mt of SEED_MOCK_TESTS) {
    const entry: MockTestEntry = {
      id: uid(),
      ...mt,
      createdAt: mt.date,
    }
    await DatabaseService.put('mockTests', entry)
  }

  for (const p of SEED_PASSAGES) {
    const entry: PassageEntry = {
      id: uid(),
      ...p,
      createdAt: now,
      updatedAt: now,
    }
    await DatabaseService.put('passages', entry)
  }

  for (const topic of IELTS_TOPICS) {
    const entry: TopicProgress = {
      id: uid(),
      topicId: uid(),
      topic,
      progressPercent: 0,
      vocabularyCount: 0,
      readingCount: 0,
      listeningCount: 0,
      writingCount: 0,
      speakingCount: 0,
      weakPoints: [],
      lastReviewedAt: now,
      updatedAt: now,
    }
    await DatabaseService.put('topicsProgress', entry)
  }

  markSeedDataLoaded()
}

export async function resetSampleData(): Promise<void> {
  await DatabaseService.clearAll()
  try {
    const raw = localStorage.getItem('ielts-settings')
    if (raw) {
      const settings = JSON.parse(raw)
      settings.sampleDataLoaded = false
      localStorage.setItem('ielts-settings', JSON.stringify(settings))
    }
  } catch { /* ignore */ }
  await loadSeedData()
}
