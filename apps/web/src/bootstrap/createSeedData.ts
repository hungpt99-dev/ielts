import type { LearningEngine } from '@ielts/learning-engine'

const WRITING_SEED_PROMPTS = [
  { taskType: 'task2', prompt: 'Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree?', wordLimit: 250, timeMinutes: 40, difficulty: 'medium', topic: 'Education', description: 'Discuss compulsory community service in high schools' },
  { taskType: 'task2', prompt: 'In many countries, the amount of crime is increasing. What do you think are the main causes of crime? How can we deal with those causes?', wordLimit: 250, timeMinutes: 40, difficulty: 'medium', topic: 'Society', description: 'Analyze causes of crime and propose solutions' },
  { taskType: 'task2', prompt: 'Some people think that governments should spend more money on public services rather than on arts such as music and painting. To what extent do you agree or disagree?', wordLimit: 250, timeMinutes: 40, difficulty: 'medium', topic: 'Government', description: 'Debate government spending priorities' },
  { taskType: 'task2', prompt: 'Globalization has both advantages and disadvantages. Discuss both views and give your own opinion.', wordLimit: 250, timeMinutes: 40, difficulty: 'hard', topic: 'Globalization', description: 'Discuss pros and cons of globalization' },
  { taskType: 'task1', prompt: 'The chart below shows the percentage of households in different income groups who owned various electronic devices in 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.', wordLimit: 150, timeMinutes: 20, difficulty: 'medium', topic: 'Technology', description: 'Summarize data about household device ownership' },
  { taskType: 'task1', prompt: 'The table below gives information about the average daily water consumption in four different countries. Summarize the information by selecting and reporting the main features.', wordLimit: 150, timeMinutes: 20, difficulty: 'easy', topic: 'Environment', description: 'Compare water consumption across countries' },
  { taskType: 'task2', prompt: 'Some people believe that studying online is more effective than studying in a traditional classroom. Discuss the advantages and disadvantages of both approaches.', wordLimit: 250, timeMinutes: 40, difficulty: 'easy', topic: 'Education', description: 'Compare online vs traditional learning' },
  { taskType: 'task2', prompt: 'Many people today are choosing to work from home rather than in a traditional office. Is this a positive or negative development?', wordLimit: 250, timeMinutes: 40, difficulty: 'easy', topic: 'Work', description: 'Evaluate the trend of working from home' },
  { taskType: 'task2', prompt: 'Climate change is one of the biggest challenges facing the world today. What measures can individuals and governments take to combat climate change?', wordLimit: 250, timeMinutes: 40, difficulty: 'medium', topic: 'Environment', description: 'Propose solutions to climate change' },
]

export async function seedWritingPrompts(engine: LearningEngine): Promise<void> {
  try {
    const existing = await engine.getExercises('writing')
    const alreadySeeded = existing.status === 'success' && existing.data?.exercises.some(
      (e: any) => (e.source || e.sourceType) === 'built-in' && e.metadata?.schemaVersion === '1.0' && e.metadata?.seedVersion === '1',
    )
    if (alreadySeeded) return

    const difficultyMap: Record<string, any> = { easy: 'easy', medium: 'medium', hard: 'hard' }
    for (const p of WRITING_SEED_PROMPTS) {
      await engine.saveExercise({
        id: `writing-builtin-${p.prompt.slice(0, 40).replace(/\s+/g, '-').toLowerCase()}`,
        sessionId: '',
        skill: 'writing',
        exerciseType: 'essay',
        objectiveId: '',
        title: `${p.taskType === 'task1' ? 'Task 1' : 'Task 2'}: ${p.description}`,
        instructions: `Write at least ${p.wordLimit} words. ${p.taskType === 'task1' ? 'Summarize the information by selecting and reporting the main features.' : 'Plan your response with a clear introduction, body paragraphs, and conclusion.'}`,
        content: { passage: p.prompt },
        questions: [{
          type: 'essay',
          prompt: p.prompt,
          wordLimit: p.wordLimit,
          rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
        }],
        difficulty: difficultyMap[p.difficulty] || 'medium',
        estimatedMinutes: p.timeMinutes,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'ai-assisted',
        metadata: { focusAreas: [], contextSnapshotHash: '', schemaVersion: '1.0', seedVersion: '1', topic: p.topic, description: p.description, taskType: p.taskType },
      } as any)
    }
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
  }
}

;const listeningSeedData: any[] = [
  {
    title: 'Campus Facilities Tour',
    topic: 'Education',
    difficulty: 'easy',
    transcript: 'Welcome to the university campus. Today I will show you the main facilities available to students. The library is located in the central building and is open from 8 AM to 10 PM on weekdays. It contains over 500,000 books and provides quiet study areas on the second floor. The computer lab is in the science building and offers free printing services. Students can also access the sports centre, which has a swimming pool, a gym, and tennis courts. Membership is included in the tuition fee. Finally, the student union building houses a cafeteria, a bookshop, and several meeting rooms for clubs and societies.',
    questions: [
      { type: 'multiple-choice', question: 'What time does the library close on weekdays?', options: ['8 PM', '9 PM', '10 PM', '11 PM'], correctIndex: 2, explanation: 'The library is open from 8 AM to 10 PM on weekdays.' },
      { type: 'multiple-choice', question: 'Where is the computer lab located?', options: ['Central building', 'Science building', 'Sports centre', 'Student union'], correctIndex: 1, explanation: 'The computer lab is in the science building.' },
      { type: 'gap-fill', question: 'The library has over ______ books.', blanks: ['500,000'], explanation: 'It contains over 500,000 books.' },
      { type: 'multiple-choice', question: 'What is NOT mentioned as a facility at the sports centre?', options: ['Swimming pool', 'Gym', 'Basketball court', 'Tennis courts'], correctIndex: 2, explanation: 'The sports centre has a swimming pool, a gym, and tennis courts.' },
    ],
  },
  {
    title: 'Weather Forecast Report',
    topic: 'Environment',
    difficulty: 'easy',
    transcript: 'And now for the weather forecast. Tomorrow will start with cloudy skies across most of the region. However, by midday, the clouds will clear in the east, bringing sunny spells and temperatures reaching 22 degrees Celsius. In the west, rain is expected to move in during the afternoon, with heavy showers possible around 4 PM. Winds will be light, coming from the south-west. The overnight temperature will drop to around 12 degrees. Looking ahead to the weekend, Saturday will be mostly dry with some sunshine, while Sunday is likely to be wet and windy.',
    questions: [
      { type: 'multiple-choice', question: 'What will the weather be like in the east by midday?', options: ['Cloudy', 'Rainy', 'Sunny', 'Windy'], correctIndex: 2, explanation: 'The clouds will clear in the east, bringing sunny spells.' },
      { type: 'multiple-choice', question: 'When are heavy showers expected in the west?', options: ['Morning', 'Midday', 'Around 4 PM', 'Evening'], correctIndex: 2, explanation: 'Heavy showers are possible around 4 PM in the west.' },
      { type: 'gap-fill', question: 'The maximum temperature tomorrow will be ______ degrees Celsius.', blanks: ['22', '22 degrees'], explanation: 'Temperatures reaching 22 degrees Celsius.' },
      { type: 'multiple-choice', question: 'What does the forecast say about the weekend?', options: ['Both days will be sunny', 'Saturday dry, Sunday wet', 'Both days will be rainy', 'Saturday wet, Sunday dry'], correctIndex: 1, explanation: 'Saturday will be mostly dry, while Sunday is likely to be wet and windy.' },
    ],
  },
  {
    title: 'Job Interview Advice',
    topic: 'Work',
    difficulty: 'medium',
    transcript: 'Today I would like to offer some advice for job interviews. First impressions are crucial, so dressing appropriately is essential. I recommend wearing formal business attire, even if the company has a casual dress code. Before the interview, research the company thoroughly. Look at their website, recent news, and understand their products or services. During the interview, listen carefully to each question and take a moment to think before answering. Use specific examples from your previous experience to demonstrate your skills. At the end of the interview, prepare two or three thoughtful questions to ask the interviewer. After the interview, send a thank-you email within 24 hours to express your appreciation and reinforce your interest in the position.',
    questions: [
      { type: 'multiple-choice', question: 'What does the speaker recommend wearing to an interview?', options: ['Casual clothes', 'Formal business attire', 'Company uniform', 'Smart casual'], correctIndex: 1, explanation: 'The speaker recommends formal business attire.' },
      { type: 'multiple-choice', question: 'How should you respond to interview questions?', options: ['Answer immediately', 'Use examples from experience', 'Keep answers short', 'Memorize responses'], correctIndex: 1, explanation: 'Use specific examples from your previous experience to demonstrate your skills.' },
      { type: 'gap-fill', question: 'Prepare ______ thoughtful questions to ask the interviewer.', blanks: ['two or three', '2 or 3'], explanation: 'Prepare two or three thoughtful questions.' },
      { type: 'multiple-choice', question: 'When should you send a thank-you email after the interview?', options: ['Within 12 hours', 'Within 24 hours', 'Within 48 hours', 'Within a week'], correctIndex: 1, explanation: 'Send a thank-you email within 24 hours.' },
    ],
  },
  {
    title: 'Public Transport Developments',
    topic: 'Transport',
    difficulty: 'medium',
    transcript: 'The city council has announced major improvements to the public transport system. A new tram line will be constructed connecting the city centre with the northern suburbs, which is expected to reduce travel time by approximately 20 minutes. The project is scheduled for completion in 2026. In addition, bus fares will be reduced by 15 percent starting next month to encourage more people to use public transport. The council is also planning to introduce electric buses on all major routes by 2028. Furthermore, cycle lanes will be expanded throughout the city, creating a safer environment for cyclists. These measures are part of the city\'s commitment to reducing carbon emissions by 50 percent by 2030.',
    questions: [
      { type: 'multiple-choice', question: 'What will the new tram line connect?', options: ['East and west suburbs', 'City centre and northern suburbs', 'Airport and city centre', 'South and north'], correctIndex: 1, explanation: 'A new tram line will connect the city centre with the northern suburbs.' },
      { type: 'gap-fill', question: 'The tram project is expected to be completed in ______.', blanks: ['2026'], explanation: 'The project is scheduled for completion in 2026.' },
      { type: 'multiple-choice', question: 'By how much will bus fares be reduced?', options: ['10 percent', '15 percent', '20 percent', '25 percent'], correctIndex: 1, explanation: 'Bus fares will be reduced by 15 percent.' },
      { type: 'multiple-choice', question: 'What is the city\'s target for reducing carbon emissions by 2030?', options: ['30 percent', '40 percent', '50 percent', '60 percent'], correctIndex: 2, explanation: 'The city aims to reduce carbon emissions by 50 percent by 2030.' },
    ],
  },
  {
    title: 'Health and Nutrition Study',
    topic: 'Health',
    difficulty: 'hard',
    transcript: 'A recent study published in the Journal of Nutritional Science has revealed interesting findings about the relationship between breakfast habits and academic performance. Researchers followed 2,000 university students over a period of three years. The results showed that students who consumed a balanced breakfast containing protein, whole grains, and fruit scored on average 12 percent higher on examinations compared to those who skipped breakfast or consumed only sugary cereals. Furthermore, the study found that students who ate breakfast also reported better concentration levels and lower stress during exam periods. However, researchers noted that the quality of breakfast was more important than the frequency. They recommended that educational institutions consider implementing breakfast programs to support student achievement.',
    questions: [
      { type: 'multiple-choice', question: 'How many students participated in the study?', options: ['500', '1,000', '2,000', '5,000'], correctIndex: 2, explanation: 'Researchers followed 2,000 university students.' },
      { type: 'gap-fill', question: 'Students who ate a balanced breakfast scored ______ percent higher on exams.', blanks: ['12'], explanation: 'Students scored on average 12 percent higher.' },
      { type: 'multiple-choice', question: 'What did researchers find more important than breakfast frequency?', options: ['Time of breakfast', 'Quality of breakfast', 'Amount of food', 'Type of drink'], correctIndex: 1, explanation: 'The quality of breakfast was more important than the frequency.' },
      { type: 'multiple-choice', question: 'What did breakfast-eating students NOT report?', options: ['Better concentration', 'Lower stress', 'Higher attendance', 'Better exam scores'], correctIndex: 2, explanation: 'They reported better concentration levels and lower stress.' },
    ],
  },
  {
    title: 'Museum Exhibition Announcement',
    topic: 'Culture',
    difficulty: 'hard',
    transcript: 'Good evening and welcome to the City Museum. I am delighted to announce our upcoming exhibition, "Ancient Civilizations of the Mediterranean," which will open on March 15th and run until September 30th. The exhibition features over 300 artifacts from Egypt, Greece, and Rome, many of which have never been displayed outside their home countries. Highlights include a collection of Egyptian jewelry from the Tomb of Tutankhamun, Greek marble sculptures, and Roman coins. Audio guides are available in eight languages, and guided tours run every hour from 10 AM to 4 PM. Admission prices are 15 pounds for adults, 8 pounds for students, and children under 12 enter free. Group bookings of ten or more receive a 20 percent discount. Please note that photography is permitted but flash photography is strictly prohibited to protect the artifacts.',
    questions: [
      { type: 'multiple-choice', question: 'When will the exhibition open?', options: ['January 15th', 'March 15th', 'June 1st', 'September 30th'], correctIndex: 1, explanation: 'The exhibition opens on March 15th.' },
      { type: 'multiple-choice', question: 'How many artifacts are in the exhibition?', options: ['100', '200', '300', '400'], correctIndex: 2, explanation: 'The exhibition features over 300 artifacts.' },
      { type: 'gap-fill', question: 'Children under ______ enter the museum for free.', blanks: ['12'], explanation: 'Children under 12 enter free.' },
      { type: 'multiple-choice', question: 'What discount do group bookings receive?', options: ['10 percent', '15 percent', '20 percent', '25 percent'], correctIndex: 2, explanation: 'Group bookings of ten or more receive a 20 percent discount.' },
    ],
  },
]
const SPEAKING_PHRASES_SEED = [
  {
    category: 'Giving Opinions',
    phrases: [
      'In my opinion, ...',
      'From my perspective, ...',
      'As far as I am concerned, ...',
      'I strongly believe that ...',
      'It seems to me that ...',
      'I would argue that ...',
      'My view is that ...',
      'Personally, I think ...',
      'The way I see it, ...',
      'I am convinced that ...',
    ],
  },
  {
    category: 'Agreeing',
    phrases: [
      'I completely agree with that.',
      'That is exactly what I think.',
      'You are absolutely right.',
      'I could not agree more.',
      'That is a valid point.',
      'I share the same opinion.',
      'That is true to a certain extent.',
      'I tend to agree with that.',
    ],
  },
  {
    category: 'Disagreeing',
    phrases: [
      'I am afraid I disagree.',
      'I see it differently.',
      'That is not entirely true.',
      'I respect your opinion, but ...',
      'I cannot support that view.',
      'That is one way to look at it, however ...',
      'I beg to differ.',
      'While I understand your point, I think ...',
    ],
  },
  {
    category: 'Expressing Certainty',
    phrases: [
      'I am absolutely certain that ...',
      'There is no doubt that ...',
      'I am convinced that ...',
      'Without a doubt, ...',
      'It is clear that ...',
      'I am sure that ...',
      'Undoubtedly, ...',
      'It is obvious that ...',
    ],
  },
  {
    category: 'Expressing Uncertainty',
    phrases: [
      'I am not entirely sure, but ...',
      'I am not certain about ...',
      'It is difficult to say, but ...',
      'I suppose that ...',
      'Maybe I am wrong, but ...',
      'I am not completely convinced that ...',
      'It could be argued that ...',
      'I am not entirely convinced that ...',
    ],
  },
  {
    category: 'Giving Examples',
    phrases: [
      'For example, ...',
      'For instance, ...',
      'Such as ...',
      'To illustrate this, ...',
      'A good example of this is ...',
      'This can be seen in ...',
      'Take ... for example.',
      'One notable example is ...',
    ],
  },
  {
    category: 'Comparing and Contrasting',
    phrases: [
      'Similarly, ...',
      'In the same way, ...',
      'On the other hand, ...',
      'In contrast, ...',
      'Whereas ...',
      'While ...',
      'Compared to ...',
      'The main difference is that ...',
      'Both are similar in that ...',
    ],
  },
  {
    category: 'Cause and Effect',
    phrases: [
      'As a result, ...',
      'Consequently, ...',
      'Therefore, ...',
      'This leads to ...',
      'As a consequence, ...',
      'One of the main causes is ...',
      'The primary reason is ...',
      'This results in ...',
      'Due to ...',
    ],
  },
  {
    category: 'Structuring Your Answer',
    phrases: [
      'There are several reasons for this.',
      'First of all, ...',
      'Firstly, ... / Secondly, ... / Finally, ...',
      'The main point is that ...',
      'In addition to this, ...',
      'Moreover, ...',
      'Furthermore, ...',
      'Another important aspect is ...',
      'To conclude, ...',
      'In summary, ...',
    ],
  },
  {
    category: 'Hesitating and Buying Time',
    phrases: [
      'That is an interesting question.',
      'Let me think about that for a moment.',
      'Well, I have never really thought about that before, but ...',
      'That is a difficult question to answer, but I would say ...',
      'How can I put this? ...',
      'Let me see ...',
    ],
  },
  {
    category: 'Clarifying and Rephrasing',
    phrases: [
      'In other words, ...',
      'What I mean is ...',
      'To put it another way, ...',
      'Let me rephrase that.',
      'What I am trying to say is ...',
      'That is to say, ...',
    ],
  },
  {
    category: 'Expressing Preferences',
    phrases: [
      'I would rather ... than ...',
      'I prefer ... because ...',
      'My preference is ...',
      'Given the choice, I would ...',
      'I am more inclined to ...',
      'I favor ... over ...',
    ],
  },
]

const SPEAKING_QUESTIONS_SEED = [
  { part: 1, question: 'Tell me about your hometown.', topic: 'Hometown', difficulty: 'easy' },
  { part: 1, question: 'What do you do for work or study?', topic: 'Work', difficulty: 'easy' },
  { part: 1, question: 'What are your hobbies?', topic: 'Hobbies', difficulty: 'easy' },
  { part: 1, question: 'Do you like to travel? Why or why not?', topic: 'Travel', difficulty: 'easy' },
  { part: 1, question: 'What kind of music do you enjoy?', topic: 'Music', difficulty: 'easy' },
  { part: 1, question: 'Tell me about your family.', topic: 'Family', difficulty: 'easy' },
  { part: 1, question: 'How has technology changed the way people communicate?', topic: 'Technology', difficulty: 'medium' },
  { part: 1, question: 'What role does social media play in your daily life?', topic: 'Technology', difficulty: 'medium' },
  { part: 1, question: 'Do you prefer reading books or watching movies? Why?', topic: 'Hobbies', difficulty: 'medium' },
  { part: 2, question: 'Describe a place you like to visit.', topic: 'Travel', difficulty: 'easy', cueCard: { topic: 'A place you like to visit', points: ['where it is', 'how you know about it', 'what you can do there'], followUp: ['Why do you like it?'] } },
  { part: 2, question: 'Describe a memorable event from your childhood.', topic: 'Family', difficulty: 'easy', cueCard: { topic: 'A memorable childhood event', points: ['what the event was', 'when it happened', 'who was there'], followUp: ['Why was it memorable?'] } },
  { part: 2, question: 'Describe a person who has influenced you.', topic: 'Society', difficulty: 'easy', cueCard: { topic: 'An influential person', points: ['who this person is', 'how you know them', 'what they did'], followUp: ['Why did they influence you?'] } },
  { part: 2, question: 'Describe a challenge you have overcome.', topic: 'Work', difficulty: 'medium', cueCard: { topic: 'A challenge you overcame', points: ['what the challenge was', 'how you approached it', 'what the outcome was'], followUp: ['What did you learn?'] } },
  { part: 2, question: 'Describe a skill you would like to learn.', topic: 'Education', difficulty: 'medium', cueCard: { topic: 'A skill you want to learn', points: ['what the skill is', 'why you want to learn it', 'how you plan to learn it'], followUp: ['How would it benefit you?'] } },
  { part: 2, question: 'Describe a time you worked in a team.', topic: 'Work', difficulty: 'medium', cueCard: { topic: 'A teamwork experience', points: ['what the task was', 'who was in the team', 'what your role was'], followUp: ['Was the teamwork successful?'] } },
  { part: 3, question: 'How do you think education will change in the future?', topic: 'Education', difficulty: 'medium' },
  { part: 3, question: 'What are the main causes of environmental problems in your country?', topic: 'Environment', difficulty: 'medium' },
  { part: 3, question: 'Do you think cities are becoming too crowded? What can be done?', topic: 'Society', difficulty: 'medium' },
  { part: 3, question: 'To what extent should governments regulate the use of artificial intelligence?', topic: 'Technology', difficulty: 'hard' },
  { part: 3, question: 'What are the long-term effects of social media on interpersonal relationships?', topic: 'Technology', difficulty: 'hard' },
  { part: 3, question: 'How can societies balance economic development with environmental protection?', topic: 'Environment', difficulty: 'hard' },
]

export async function seedSpeakingQuestions(engine: LearningEngine): Promise<void> {
  try {
    const existing = await engine.getExercises('speaking')
    const alreadySeeded = existing.status === 'success' && existing.data?.exercises.some(
      (e: any) => (e.source || e.sourceType) === 'built-in' && e.metadata?.part,
    )
    if (alreadySeeded) return

    for (const q of SPEAKING_QUESTIONS_SEED) {
      const diffMap: Record<string, any> = { easy: 'easy', medium: 'medium', hard: 'hard' }
      await engine.saveExercise({
        id: `speaking-q-${q.part}-${q.question.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`,
        sessionId: '',
        skill: 'speaking',
        exerciseType: 'speaking',
        objectiveId: '',
        title: `Part ${q.part}: ${q.question.slice(0, 50)}`,
        instructions: `Part ${q.part} speaking question. ${q.part === 2 ? 'You have 1 minute to prepare and up to 2 minutes to speak.' : q.part === 1 ? 'Answer in 45 seconds.' : 'Answer in 90 seconds.'}`,
        content: { passage: q.question },
        questions: [],
        difficulty: diffMap[q.difficulty] || 'medium',
        estimatedMinutes: q.part === 2 ? 3 : 2,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'deterministic',
        metadata: {
          focusAreas: ['speaking-questions'],
          contextSnapshotHash: '',
          schemaVersion: '1.0',
          part: q.part,
          topic: q.topic,
          cueCard: q.cueCard ? JSON.stringify(q.cueCard) : undefined,
          seedVersion: '1',
        },
      } as any)
    }
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
  }
}

export async function seedSpeakingPhrases(engine: LearningEngine): Promise<void> {
  try {
    const existing = await engine.getExercises('speaking')
    const alreadySeeded = existing.status === 'success' && existing.data?.exercises.some(
      (e: any) => (e.source || e.sourceType) === 'built-in' && e.metadata?.phrases,
    )
    if (alreadySeeded) return

    for (const group of SPEAKING_PHRASES_SEED) {
      await engine.saveExercise({
        id: `speaking-phrases-${group.category.toLowerCase().replace(/\s+/g, '-')}`,
        sessionId: '',
        skill: 'speaking',
        exerciseType: 'speaking',
        objectiveId: '',
        title: group.category,
        instructions: 'Common phrases to help you in the IELTS Speaking test.',
        content: { passage: group.phrases.join('\n') },
        questions: [],
        difficulty: 'medium',
        estimatedMinutes: 0,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'deterministic',
        metadata: {
          focusAreas: ['speaking-phrases'],
          contextSnapshotHash: '',
          schemaVersion: '1.0',
          phrases: JSON.stringify(group.phrases),
        },
      } as any)
    }
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
  }
}

export async function seedListeningExercises(engine: LearningEngine): Promise<void> {
  try {
    const existing = await engine.getExercises('listening')
    const alreadySeeded = existing.status === 'success' && existing.data?.exercises.some(
      (e: any) => (e.source || e.sourceType) === 'built-in' && e.metadata?.seedVersion === '1',
    )
    if (alreadySeeded) return

    const diffMap: Record<string, any> = { easy: 'easy', medium: 'medium', hard: 'hard' }
    for (const ex of listeningSeedData) {
      await engine.saveExercise({
        id: `listening-seed-${ex.title.toLowerCase().replace(/\s+/g, '-')}`,
        sessionId: '',
        skill: 'listening',
        exerciseType: 'comprehension',
        objectiveId: '',
        title: ex.title,
        instructions: 'Listen to the recording and answer the questions.',
        content: { transcript: ex.transcript },
        questions: ex.questions.map((q: any, i: number) => ({
          id: `ls-q-${i}`,
          type: q.type === 'gap-fill' ? 'gap-fill' : 'multiple-choice',
          question: q.question,
          options: q.options || [],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
          blanks: Array.isArray(q.blanks) ? q.blanks : undefined,
          explanation: q.explanation || '',
        })),
        difficulty: diffMap[ex.difficulty] || 'medium',
        estimatedMinutes: 12,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'deterministic',
        metadata: {
          focusAreas: [],
          contextSnapshotHash: '',
          schemaVersion: '1.0',
          topic: ex.topic,
          seedVersion: '1',
        },
      } as any)
    }
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
  }
}
