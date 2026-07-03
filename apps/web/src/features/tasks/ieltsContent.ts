import type { TaskDetail, Difficulty, StudySkill, TaskContentSection, TaskPracticeQuestion } from './types'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

interface ContentTemplate {
  skill: StudySkill
  title: string
  objective: string
  difficulty: Difficulty
  estimatedMinutes: number
  getContent: () => { sections: TaskContentSection[]; questions: TaskPracticeQuestion[]; tips: string[]; whyItMatters: string; topic: string }
}

const VOCABULARY_CONTENT: ContentTemplate[] = [
  {
    skill: 'Vocabulary',
    title: 'Learn 10 Useful Environment Vocabulary Words',
    objective: 'Learn and practice key environment-related vocabulary for IELTS',
    difficulty: 'medium',
    estimatedMinutes: 20,
    getContent: () => ({
      topic: 'Environment',
      whyItMatters: 'Environment topics appear frequently in IELTS Writing Task 2 and Speaking Part 3.',
      sections: [
        { heading: 'Key Vocabulary', body: 'Here are 10 important environment words for IELTS:', type: 'instruction' },
        { heading: 'Word List', body: '1. Biodiversity (n) - the variety of plant and animal life in a habitat\n2. Carbon footprint (n) - the amount of carbon dioxide released by activities\n3. Deforestation (n) - the removal of trees from forests\n4. Ecosystem (n) - a community of living organisms and their environment\n5. Fossil fuels (n) - natural fuels like coal and gas\n6. Greenhouse effect (n) - trapping of heat by the atmosphere\n7. Renewable energy (n) - energy from sources that don\'t deplete\n8. Sustainability (n) - avoiding depletion of natural resources\n9. Conservation (n) - protecting the environment\n10. Pollution (n) - harmful substances in the environment', type: 'list' },
        { heading: 'Example Sentences', body: 'Biodiversity is essential for a healthy ecosystem.\nMany countries are investing in renewable energy to reduce their carbon footprint.\nDeforestation has led to the loss of many animal habitats.\nThe government should promote conservation efforts.', type: 'example' },
      ],
      questions: [
        { id: generateId(), question: 'Complete the sentence: "The company aims to reduce its _____ by using solar power."', options: ['biodiversity', 'carbon footprint', 'ecosystem', 'conservation'], correctAnswer: 'carbon footprint', type: 'multiple-choice' },
        { id: generateId(), question: 'What is the best synonym for "sustainability"?', options: ['destruction', 'maintenance', 'renewability', 'pollution'], correctAnswer: 'renewability', type: 'multiple-choice' },
        { id: generateId(), question: 'Write a sentence using the word "conservation".', type: 'open-ended' },
      ],
      tips: ['Use topic-specific vocabulary to impress the examiner.', 'Practice using these words in full sentences.', 'Group vocabulary by topic for better retention.'],
    }),
  },
  {
    skill: 'Vocabulary',
    title: 'Learn 10 Education Vocabulary Words',
    objective: 'Learn and practice education-related vocabulary for IELTS',
    difficulty: 'easy',
    estimatedMinutes: 15,
    getContent: () => ({
      topic: 'Education',
      whyItMatters: 'Education is a common IELTS topic in Writing Task 2 and Speaking Part 1-3.',
      sections: [
        { heading: 'Key Vocabulary', body: 'Essential education vocabulary for IELTS:', type: 'instruction' },
        { heading: 'Word List', body: '1. Curriculum (n) - the subjects taught in a course\n2. Higher education (n) - university-level education\n3. Scholarship (n) - financial aid for students\n4. Tuition (n) - teaching fees\n5. Vocational training (n) - practical job training\n6. Literacy (n) - ability to read and write\n7. Compulsory (adj) - required by law\n8. Assessment (n) - evaluation of learning\n9. Diploma (n) - a certificate of completion\n10. Specialize (v) - focus on a specific subject', type: 'list' },
        { heading: 'Example Sentences', body: 'The curriculum should include both academic and practical subjects.\nMany students apply for a scholarship to study abroad.\nVocational training provides useful skills for employment.\nEducation is compulsory until the age of 16 in many countries.', type: 'example' },
      ],
      questions: [
        { id: generateId(), question: 'Which word means "required by law"?', options: ['voluntary', 'compulsory', 'optional', 'elective'], correctAnswer: 'compulsory', type: 'multiple-choice' },
        { id: generateId(), question: 'Complete: "She received a _____ to study at the university."', options: ['curriculum', 'scholarship', 'tuition', 'literacy'], correctAnswer: 'scholarship', type: 'multiple-choice' },
      ],
      tips: ['Learn words in topic groups.', 'Use at least 2-3 topic-specific words in your essay.', 'Practice collocations like "higher education" and "vocational training".'],
    }),
  },
  {
    skill: 'Vocabulary',
    title: 'Learn 10 Technology Vocabulary Words',
    objective: 'Learn and practice technology vocabulary for IELTS',
    difficulty: 'medium',
    estimatedMinutes: 20,
    getContent: () => ({
      topic: 'Technology',
      whyItMatters: 'Technology is a frequent IELTS topic across all skills.',
      sections: [
        { heading: 'Key Vocabulary', body: 'Important technology vocabulary:', type: 'instruction' },
        { heading: 'Word List', body: '1. Innovation (n) - a new method or idea\n2. Digital (adj) - using electronic technology\n3. Automation (n) - automatic operation of processes\n4. Artificial Intelligence (n) - machine-based intelligence\n5. Revolutionize (v) - change dramatically\n6. Cyber security (n) - protection of digital information\n7. Algorithm (n) - set of rules for problem-solving\n8. Bandwidth (n) - data transfer capacity\n9. Breakthrough (n) - a significant development\n10. Disruptive (adj) - causing major change', type: 'list' },
        { heading: 'Example Sentences', body: 'Artificial Intelligence is revolutionizing many industries.\nCompanies invest heavily in cyber security to protect data.\nThe invention of the smartphone was a major technological breakthrough.\nAutomation has changed the way factories operate.', type: 'example' },
      ],
      questions: [
        { id: generateId(), question: 'Which word describes a significant scientific development?', options: ['disruption', 'breakthrough', 'bandwidth', 'algorithm'], correctAnswer: 'breakthrough', type: 'multiple-choice' },
        { id: generateId(), question: 'Complete: "The _____ of social media has changed how people communicate."', options: ['innovation', 'automation', 'revolution', 'algorithm'], correctAnswer: 'revolution', type: 'multiple-choice' },
      ],
      tips: ['Technology vocabulary is useful for both Academic and General IELTS.', 'Use specific examples to support your arguments.', 'Learn both nouns and verb forms.'],
    }),
  },
]

const READING_CONTENT: ContentTemplate[] = [
  {
    skill: 'Reading',
    title: 'Practice Skimming with a Short Reading Passage',
    objective: 'Improve skimming skills to find main ideas quickly',
    difficulty: 'easy',
    estimatedMinutes: 20,
    getContent: () => ({
      topic: 'Skimming Practice',
      whyItMatters: 'Skimming helps you find main ideas quickly, saving time in the Reading test.',
      sections: [
        { heading: 'What is Skimming?', body: 'Skimming means reading quickly to understand the main idea without focusing on every word. Look at the title, subheadings, first sentences of each paragraph, and key words.', type: 'instruction' },
        { heading: 'Practice Passage', body: 'Climate change is one of the most pressing issues of our time. Scientists agree that human activities, particularly the burning of fossil fuels, are contributing to rising global temperatures. The effects are already visible: melting polar ice caps, more frequent extreme weather events, and changing ecosystems. Governments around the world are taking action through international agreements like the Paris Accord, which aims to limit global warming to 1.5 degrees Celsius above pre-industrial levels. Individuals can also help by reducing their carbon footprint through actions like using public transport, recycling, and conserving energy at home.', type: 'text' },
        { heading: 'Skimming Strategy', body: 'To skim this passage: 1. Read the title "Climate Change" 2. Read the first sentence of each paragraph 3. Look for key words: climate change, fossil fuels, global temperatures, Paris Accord, carbon footprint. The main idea is: Climate change is a serious problem caused by human activity, and both governments and individuals need to take action.', type: 'tip' },
      ],
      questions: [
        { id: generateId(), question: 'What is the main idea of the passage?', options: ['Fossil fuels are running out', 'Climate change is a serious problem requiring action', 'The Paris Accord was a failure', 'Only governments can solve climate change'], correctAnswer: 'Climate change is a serious problem requiring action', type: 'multiple-choice' },
        { id: generateId(), question: 'According to the passage, what are the effects of climate change?', type: 'open-ended' },
      ],
      tips: ['Practice skimming with a timer - give yourself 1-2 minutes per passage.', 'Focus on the first and last sentences of each paragraph.', 'Identify key words before you start reading.'],
    }),
  },
  {
    skill: 'Reading',
    title: 'Scanning Practice: Find Specific Information',
    objective: 'Practice scanning for specific details in a reading passage',
    difficulty: 'medium',
    estimatedMinutes: 25,
    getContent: () => ({
      topic: 'Scanning Practice',
      whyItMatters: 'Scanning is essential for finding specific information, dates, names, and facts in the IELTS Reading test.',
      sections: [
        { heading: 'What is Scanning?', body: 'Scanning means searching for specific information without reading every word. Look for numbers, capital letters, dates, and specific keywords related to what you need to find.', type: 'instruction' },
        { heading: 'Practice Passage', body: 'The University of Cambridge was founded in 1209 and is the second-oldest university in the English-speaking world. It has produced 121 Nobel laureates, including Sir Ernest Rutherford (Chemistry, 1908) and Stephen Hawking (not a Nobel winner, but a renowned physicist). The university has 31 colleges, with Trinity College being the largest. The annual tuition fee for international students is approximately £38,000, depending on the course. The acceptance rate is around 21%, making it highly competitive. Notable alumni include Isaac Newton, Charles Darwin, and John Milton.', type: 'text' },
        { heading: 'Scanning Questions', body: 'Use scanning to find: 1. When was Cambridge University founded? (1209) 2. How many Nobel laureates has Cambridge produced? (121) 3. What is the acceptance rate? (21%) 4. Who is a notable alumnus? (Isaac Newton, Charles Darwin, or John Milton) 5. How much is the tuition fee? (£38,000)', type: 'instruction' },
      ],
      questions: [
        { id: generateId(), question: 'In what year was Cambridge University founded?', options: ['1209', '1219', '1908', '1208'], correctAnswer: '1209', type: 'multiple-choice' },
        { id: generateId(), question: 'How many colleges does Cambridge have?', options: ['121', '31', '38', '21'], correctAnswer: '31', type: 'multiple-choice' },
        { id: generateId(), question: 'What is the acceptance rate at Cambridge?', options: ['38%', '31%', '21%', '12%'], correctAnswer: '21%', type: 'multiple-choice' },
      ],
      tips: ['Scan for specific keywords, not full sentences.', 'Look for numbers, dates, and proper nouns first.', 'Practice scanning with a timer - aim to find 5 facts in 2 minutes.'],
    }),
  },
  {
    skill: 'Reading',
    title: 'Understanding Paragraph Structure',
    objective: 'Learn to identify topic sentences and supporting details',
    difficulty: 'medium',
    estimatedMinutes: 25,
    getContent: () => ({
      topic: 'Paragraph Structure',
      whyItMatters: 'Understanding paragraph structure helps you answer heading-matching and summary-completion questions.',
      sections: [
        { heading: 'Understanding Paragraphs', body: 'IELTS Reading passages are carefully structured. Each paragraph typically contains: a topic sentence (main idea), supporting sentences (details/examples), and sometimes a concluding sentence. Identifying these parts helps you answer questions faster.', type: 'instruction' },
        { heading: 'Example Paragraph', body: '(Topic Sentence) The rise of remote work has transformed the modern workplace. (Supporting Detail) Studies show that 70% of employees work remotely at least once a week. (Supporting Detail) Companies have reported a 25% increase in productivity. (Supporting Detail) However, some workers struggle with isolation and work-life boundaries. (Concluding Sentence) Overall, remote work offers both opportunities and challenges for the future of employment.', type: 'example' },
        { heading: 'Key Elements', body: 'Topic sentence: usually the first or second sentence\nSupporting details: facts, examples, statistics\nConcluding sentence: summarizes or transitions to the next idea', type: 'list' },
      ],
      questions: [
        { id: generateId(), question: 'What is the topic sentence of the example paragraph?', options: ['Companies reported a 25% increase in productivity', 'The rise of remote work has transformed the modern workplace', 'Some workers struggle with isolation', 'Overall, remote work offers both opportunities and challenges'], correctAnswer: 'The rise of remote work has transformed the modern workplace', type: 'multiple-choice' },
        { id: generateId(), question: 'Identify one supporting detail from the paragraph.', type: 'short-answer' },
      ],
      tips: ['The topic sentence is usually at the beginning of the paragraph.', 'Look for transition words like "however", "therefore", "in addition".', 'Practice by identifying topic sentences in news articles.'],
    }),
  },
]

const LISTENING_CONTENT: ContentTemplate[] = [
  {
    skill: 'Listening',
    title: 'Listen for Main Ideas: Short Lecture Practice',
    objective: 'Practice identifying main ideas from a short listening passage',
    difficulty: 'medium',
    estimatedMinutes: 20,
    getContent: () => ({
      topic: 'Main Ideas',
      whyItMatters: 'IELTS Listening Part 1 requires you to understand main ideas and specific details from everyday conversations.',
      sections: [
        { heading: 'Listening Strategy', body: 'Before listening, read the questions carefully. Predict the type of information you need (names, numbers, dates). Focus on understanding the overall context.', type: 'instruction' },
        { heading: 'Listen to the Passage', body: 'Imagine you hear a conversation between a student and a university advisor. The advisor explains the library rules: books can be borrowed for two weeks, reference books must stay in the library, and laptops are available for 3-hour loans. The library opens at 8 AM and closes at 10 PM on weekdays. Quiet study zones are on the second floor.', type: 'text' },
        { heading: 'Key Information', body: 'Book loan period: 2 weeks\nReference books: must stay in library\nLaptop loan: 3 hours\nOpening hours: 8 AM - 10 PM (weekdays)\nQuiet study: 2nd floor', type: 'list' },
      ],
      questions: [
        { id: generateId(), question: 'How long can students borrow books for?', options: ['One week', 'Two weeks', 'Three weeks', 'One month'], correctAnswer: 'Two weeks', type: 'multiple-choice' },
        { id: generateId(), question: 'Where are the quiet study zones?', options: ['First floor', 'Second floor', 'Ground floor', 'Basement'], correctAnswer: 'Second floor', type: 'multiple-choice' },
        { id: generateId(), question: 'What is the maximum loan period for a laptop?', options: ['2 hours', '3 hours', '4 hours', 'All day'], correctAnswer: '3 hours', type: 'multiple-choice' },
      ],
      tips: ['Listen for numbers and specific details.', 'Read questions before the audio starts.', 'Practice with IELTS listening sample tests.'],
    }),
  },
  {
    skill: 'Listening',
    title: 'Listen for Specific Details: Booking a Hotel',
    objective: 'Practice identifying specific details in a conversation',
    difficulty: 'easy',
    estimatedMinutes: 15,
    getContent: () => ({
      topic: 'Booking',
      whyItMatters: 'IELTS Listening Section 1 often involves simple conversations like booking a hotel or making a reservation.',
      sections: [
        { heading: 'Conversation Context', body: 'A guest calls a hotel to book a room for three nights. The receptionist asks for name, dates, room type, and contact information. Listen for specific details: name spelling, dates, prices, and phone numbers.', type: 'instruction' },
        { heading: 'Practice Script', body: 'Receptionist: Good morning, Seaside Hotel. How can I help you?\nGuest: Hello, I\'d like to book a room for three nights, please.\nReceptionist: Certainly. When would you like to check in?\nGuest: From July 15th to July 18th.\nReceptionist: And what type of room would you prefer?\nGuest: A double room with a sea view, please.\nReceptionist: The rate is $150 per night. Could I have your name, please?\nGuest: Yes, it\'s Emily Watson.\nReceptionist: Could you spell that?\nGuest: E-M-I-L-Y W-A-T-S-O-N.\nReceptionist: And a contact number?\nGuest: 0412 345 678.', type: 'example' },
        { heading: 'Information to Note', body: 'Hotel: Seaside Hotel\nCheck-in: July 15th\nCheck-out: July 18th\nRoom: Double with sea view\nRate: $150/night\nName: Emily Watson\nPhone: 0412 345 678', type: 'list' },
      ],
      questions: [
        { id: generateId(), question: 'What is the name of the hotel?', options: ['Sunset Hotel', 'Seaside Hotel', 'Sea View Hotel', 'Grand Hotel'], correctAnswer: 'Seaside Hotel', type: 'multiple-choice' },
        { id: generateId(), question: 'How much is the room per night?', options: ['$100', '$120', '$150', '$180'], correctAnswer: '$150', type: 'multiple-choice' },
        { id: generateId(), question: 'What is the guest\'s phone number?', options: ['0412 345 678', '0412 345 678', '0412 345 879', '0421 345 678'], correctAnswer: '0412 345 678', type: 'fill-blank' },
      ],
      tips: ['Pay attention to name spelling questions.', 'Practice with numbers - prices, dates, phone numbers.', 'Listen for corrections - speakers sometimes change information.'],
    }),
  },
  {
    skill: 'Listening',
    title: 'Listen for Directions: Map Labeling Practice',
    objective: 'Practice following directions and labeling a map',
    difficulty: 'hard',
    estimatedMinutes: 25,
    getContent: () => ({
      topic: 'Directions',
      whyItMatters: 'Map labeling is a common question type in IELTS Listening Section 2.',
      sections: [
        { heading: 'Map Listening Strategy', body: 'When you hear directions, pay attention to prepositions (next to, opposite, behind, between) and landmarks (entrance, reception, stairs). Visualize the layout as you listen.', type: 'instruction' },
        { heading: 'Practice Directions', body: 'Imagine you are at a museum. The entrance is on the south side. As you enter, the gift shop is immediately on your left. The main exhibition hall is straight ahead. The café is behind the main hall, with outdoor seating. The restrooms are next to the café on the right. The lecture theater is upstairs, above the entrance. The children\'s area is between the gift shop and the restrooms.', type: 'text' },
        { heading: 'Location Summary', body: 'Gift shop: left of entrance\nMain exhibition: straight ahead\nCafé: behind main hall\nRestrooms: next to café (right)\nLecture theater: upstairs, above entrance\nChildren\'s area: between gift shop and restrooms', type: 'list' },
      ],
      questions: [
        { id: generateId(), question: 'Where is the gift shop located?', options: ['Right of entrance', 'Left of entrance', 'Behind the main hall', 'Upstairs'], correctAnswer: 'Left of entrance', type: 'multiple-choice' },
        { id: generateId(), question: 'What is located between the gift shop and the restrooms?', options: ['Café', 'Main exhibition', 'Children\'s area', 'Lecture theater'], correctAnswer: 'Children\'s area', type: 'multiple-choice' },
        { id: generateId(), question: 'Where is the lecture theater?', options: ['Behind the café', 'Next to the entrance', 'Upstairs above entrance', 'Between gift shop and restrooms'], correctAnswer: 'Upstairs above entrance', type: 'multiple-choice' },
      ],
      tips: ['Draw or imagine the layout as you listen.', 'Listen for prepositions of place.', 'Practice with official IELTS map labeling questions.'],
    }),
  },
]

const WRITING_CONTENT: ContentTemplate[] = [
  {
    skill: 'Writing',
    title: 'Write One Opinion Paragraph for Task 2',
    objective: 'Practice writing a clear opinion paragraph for IELTS Writing Task 2',
    difficulty: 'medium',
    estimatedMinutes: 30,
    getContent: () => ({
      topic: 'Opinion Essays',
      whyItMatters: 'Opinion essays are one of the most common types in IELTS Writing Task 2.',
      sections: [
        { heading: 'Opinion Paragraph Structure', body: 'A good opinion paragraph includes: 1. Topic sentence stating your opinion clearly 2. Reason explaining why you hold that opinion 3. Example supporting your reason 4. Concluding sentence reinforcing your view.', type: 'instruction' },
        { heading: 'Sample Question', body: '"Some people believe that social media has more negative effects than positive effects on society. To what extent do you agree or disagree?"', type: 'text' },
        { heading: 'Sample Paragraph', body: 'I strongly agree that social media has more negative effects on society. Firstly, social media platforms often contribute to mental health issues among young people. For example, studies have shown that excessive use of Instagram and Facebook can lead to anxiety and depression due to constant comparison with others. Furthermore, the spread of misinformation on these platforms has become a serious concern during important events such as elections and health crises. Therefore, while social media offers connectivity, its negative impact on mental health and information quality cannot be ignored.', type: 'example' },
      ],
      questions: [
        { id: generateId(), question: 'What is the first reason the author gives for agreeing about social media\'s negative effects?', options: ['Spread of misinformation', 'Mental health issues', 'Reduced productivity', 'Privacy concerns'], correctAnswer: 'Mental health issues', type: 'multiple-choice' },
        { id: generateId(), question: 'Write one opinion paragraph (150-200 words) answering: "Some people think that children should start school at a very early age. Others believe they should start at a later age. Discuss both views and give your own opinion."', type: 'writing' },
      ],
      tips: ['State your opinion clearly in the first sentence.', 'Support each point with a specific example.', 'Use linking words to connect your ideas.'],
    }),
  },
  {
    skill: 'Writing',
    title: 'Review Complex Sentences for Writing Task 2',
    objective: 'Learn to use complex sentence structures in IELTS essays',
    difficulty: 'hard',
    estimatedMinutes: 25,
    getContent: () => ({
      topic: 'Complex Sentences',
      whyItMatters: 'Using complex sentences shows grammatical range, which is essential for a high IELTS Writing score.',
      sections: [
        { heading: 'What are Complex Sentences?', body: 'Complex sentences contain one independent clause and at least one dependent clause. They use subordinating conjunctions like although, because, while, whereas, despite, if, when.', type: 'instruction' },
        { heading: 'Examples', body: 'Simple: Many people use public transport. It is cheaper.\nComplex: Many people use public transport because it is cheaper.\n\nSimple: The government should invest in education. It benefits everyone.\nComplex: The government should invest in education because it benefits everyone.\n\nSimple: Some people prefer city life. Others prefer rural areas.\nComplex: While some people prefer city life, others prefer rural areas.', type: 'example' },
        { heading: 'Complex Sentence Types for IELTS', body: '1. Cause and Effect: "Because/Since/As...", "Therefore/Consequently...", "This leads to/This results in..."\n2. Contrast: "Although/Even though...", "While/Whereas...", "Despite/In spite of..."\n3. Condition: "If/Unless/Provided that...", "Whether or not..."\n4. Relative Clauses: "which/that/who/where"', type: 'list' },
      ],
      questions: [
        { id: generateId(), question: 'Combine these sentences using "although": "Online learning is convenient. Many students prefer face-to-face classes."', type: 'short-answer' },
        { id: generateId(), question: 'Which of the following is a complex sentence?', options: ['I went to the store.', 'The cat sat on the mat.', 'Although it was raining, we went for a walk.', 'She is a teacher.'], correctAnswer: 'Although it was raining, we went for a walk.', type: 'multiple-choice' },
        { id: generateId(), question: 'Write three complex sentences about the topic of technology in education.', type: 'writing' },
      ],
      tips: ['Aim to use 3-4 complex sentences per paragraph.', 'Do not over-complicate - clarity is more important.', 'Practice transforming simple sentences into complex ones.'],
    }),
  },
  {
    skill: 'Writing',
    title: 'Practice Describing a Chart for Writing Task 1',
    objective: 'Learn to describe data from a chart for IELTS Academic Writing Task 1',
    difficulty: 'hard',
    estimatedMinutes: 30,
    getContent: () => ({
      topic: 'Task 1 Charts',
      whyItMatters: 'IELTS Academic Writing Task 1 requires describing visual data accurately.',
      sections: [
        { heading: 'How to Describe a Chart', body: '1. Introduction: Paraphrase what the chart shows\n2. Overview: Describe the main trends (1-2 sentences)\n3. Details: Describe specific data points with comparisons\nUse vocabulary like: increased, decreased, remained stable, peaked at, dropped to, fluctuated, significant, slight, dramatic.', type: 'instruction' },
        { heading: 'Sample Chart Description', body: 'The line graph shows the number of international students in Australia from 2010 to 2020. Overall, the number increased significantly over the period. In 2010, there were approximately 250,000 international students. This number rose steadily to 350,000 in 2015. The most dramatic increase occurred between 2015 and 2019, when the figure peaked at 450,000. However, in 2020, the number dropped sharply to 300,000, likely due to the COVID-19 pandemic.', type: 'example' },
        { heading: 'Useful Vocabulary', body: 'Increase: rose, grew, climbed, surged, peaked at\nDecrease: fell, dropped, declined, plummeted, dipped\nStable: remained constant, leveled off, stayed the same\nDegree: dramatically, significantly, moderately, slightly', type: 'list' },
      ],
      questions: [
        { id: generateId(), question: 'Write an introductory sentence for: "The bar chart shows the percentage of households with internet access in three countries from 2000 to 2020."', type: 'writing' },
        { id: generateId(), question: 'Which word describes a sudden large decrease?', options: ['Decreased', 'Dipped', 'Plummeted', 'Declined'], correctAnswer: 'Plummeted', type: 'multiple-choice' },
      ],
      tips: ['Spend only 20 minutes on Task 1.', 'Always include an overview paragraph.', 'Do not give your opinion - describe only what you see.'],
    }),
  },
]

const SPEAKING_CONTENT: ContentTemplate[] = [
  {
    skill: 'Speaking',
    title: 'Practice Speaking About Hobbies for 3 Minutes',
    objective: 'Practice speaking fluently about your hobbies for IELTS Speaking Part 1 and 2',
    difficulty: 'easy',
    estimatedMinutes: 15,
    getContent: () => ({
      topic: 'Hobbies',
      whyItMatters: 'Hobbies are a common topic in IELTS Speaking Part 1 and Part 2.',
      sections: [
        { heading: 'Part 1 Sample Questions', body: 'Examiner may ask:\n- Do you have any hobbies?\n- How much time do you spend on your hobbies?\n- Why do you enjoy your hobbies?\n- Have your hobbies changed since childhood?', type: 'list' },
        { heading: 'Part 2 Cue Card', body: 'Describe a hobby that you enjoy. You should say:\n- What the hobby is\n- When you started it\n- How often you do it\n- And explain why you enjoy it', type: 'instruction' },
        { heading: 'Sample Answer', body: 'One hobby I really enjoy is photography. I started it about three years ago when I bought my first camera. Usually, I go out to take photos every weekend, especially during sunrise or sunset when the light is beautiful. I enjoy photography because it helps me notice details in everyday life that I would normally miss. It is also a relaxing activity that helps me de-stress after a busy week at work.', type: 'example' },
      ],
      questions: [
        { id: generateId(), question: 'Practice speaking: Answer this Part 1 question for 30 seconds - "Do you have any hobbies? How do they benefit you?"', type: 'speaking' },
        { id: generateId(), question: 'Practice speaking: Describe a hobby you enjoy for 2 minutes. Use the cue card structure above.', type: 'speaking' },
      ],
      tips: ['Speak naturally and don\'t memorize answers.', 'Use the 4-part structure for Part 2 answers.', 'Record yourself and listen for fluency issues.'],
    }),
  },
  {
    skill: 'Speaking',
    title: 'Practice Speaking About Travel for 3 Minutes',
    objective: 'Practice speaking about travel experiences for IELTS Speaking',
    difficulty: 'medium',
    estimatedMinutes: 20,
    getContent: () => ({
      topic: 'Travel',
      whyItMatters: 'Travel is a frequent IELTS Speaking topic across all parts.',
      sections: [
        { heading: 'Part 1 Questions', body: '- Do you like traveling?\n- Where have you traveled recently?\n- What kind of places do you prefer to visit?\n- Do you prefer traveling alone or with others?', type: 'list' },
        { heading: 'Part 2 Cue Card', body: 'Describe a memorable trip you have taken. You should say:\n- Where you went\n- Who you went with\n- What you did there\n- And explain why it was memorable', type: 'instruction' },
        { heading: 'Useful Vocabulary', body: 'Breathtaking scenery, immerse myself in the culture, off the beaten track, a once-in-a-lifetime experience, broaden my horizons, local cuisine, travel itinerary, budget-friendly', type: 'list' },
      ],
      questions: [
        { id: generateId(), question: 'Practice: Answer this Part 1 question for 30 seconds - "What kind of places do you prefer to visit on holiday?"', type: 'speaking' },
        { id: generateId(), question: 'Practice: Describe a memorable trip for 2 minutes. Include specific details and use at least 3 vocabulary words from the list.', type: 'speaking' },
      ],
      tips: ['Use specific vocabulary related to the topic.', 'Include sensory details (sights, sounds, smells).', 'Show enthusiasm in your voice.'],
    }),
  },
  {
    skill: 'Speaking',
    title: 'Practice Speaking About Technology',
    objective: 'Practice discussing technology for IELTS Speaking Part 3',
    difficulty: 'hard',
    estimatedMinutes: 25,
    getContent: () => ({
      topic: 'Technology',
      whyItMatters: 'Part 3 requires discussing abstract ideas about technology with extended answers.',
      sections: [
        { heading: 'Part 3 Questions', body: '- How has technology changed the way people communicate?\n- What are the disadvantages of relying too much on technology?\n- Do you think technology will continue to replace jobs in the future?\n- How can people balance technology use with real-life interactions?', type: 'list' },
        { heading: 'How to Answer Part 3 Questions', body: 'Use this structure:\n1. Direct answer to the question\n2. Reason or explanation\n3. Example or evidence\n4. Alternative perspective (optional)\n5. Conclusion or summary', type: 'instruction' },
        { heading: 'Sample Answer', body: 'Question: "How has technology changed the way people communicate?"\nAnswer: "Technology has fundamentally transformed communication. Firstly, it has made communication instant and global. For example, I can video call a friend in another country in seconds, which was impossible a few decades ago. However, this convenience has also reduced face-to-face interaction. Many people now prefer texting over having real conversations. In my view, while technology has made communication faster and more convenient, it has also created new challenges in maintaining meaningful relationships."', type: 'example' },
      ],
      questions: [
        { id: generateId(), question: 'Practice: Answer for 1 minute - "What are the disadvantages of relying too much on technology?" Follow the 5-part structure.', type: 'speaking' },
        { id: generateId(), question: 'Practice: Answer for 1 minute - "Do you think technology will continue to replace jobs in the future?"', type: 'speaking' },
      ],
      tips: ['For Part 3, give extended answers (30-60 seconds).', 'Use linking phrases: "In my view...", "Furthermore...", "However...".', 'Show awareness of multiple perspectives.'],
    }),
  },
]

const GRAMMAR_CONTENT: ContentTemplate[] = [
  {
    skill: 'Grammar',
    title: 'Review Present Tenses for IELTS Writing',
    objective: 'Practice using present simple and present continuous correctly',
    difficulty: 'easy',
    estimatedMinutes: 15,
    getContent: () => ({
      topic: 'Present Tenses',
      whyItMatters: 'Correct use of tenses is essential for grammatical range in IELTS Writing and Speaking.',
      sections: [
        { heading: 'Present Simple', body: 'Use for: facts, habits, routines, general truths\nStructure: Subject + base verb (add -s/-es for he/she/it)\nExamples: Water boils at 100 degrees. I study English every day.', type: 'instruction' },
        { heading: 'Present Continuous', body: 'Use for: actions happening now, temporary situations, future arrangements\nStructure: Subject + am/is/are + verb-ing\nExamples: I am studying for my IELTS exam this month. She is taking the test next Saturday.', type: 'instruction' },
        { heading: 'Common Mistakes', body: 'Incorrect: "I am going to the gym every day."\nCorrect: "I go to the gym every day."\n\nIncorrect: "She studies at the moment."\nCorrect: "She is studying at the moment."', type: 'example' },
      ],
      questions: [
        { id: generateId(), question: 'Choose the correct sentence:', options: ['He is working in a bank every day.', 'He works in a bank every day.', 'He work in a bank every day.', 'He working in a bank every day.'], correctAnswer: 'He works in a bank every day.', type: 'multiple-choice' },
        { id: generateId(), question: 'Complete: "Right now, I _____ (prepare) for my IELTS exam."', options: ['prepare', 'am preparing', 'prepares', 'prepared'], correctAnswer: 'am preparing', type: 'fill-blank' },
      ],
      tips: ['Use present simple for general truths and routines.', 'Use present continuous for temporary situations.', 'Don\'t use present continuous with stative verbs (know, believe, need).'],
    }),
  },
  {
    skill: 'Grammar',
    title: 'Review Past Tenses for IELTS Writing',
    objective: 'Practice using past simple, past continuous, and present perfect correctly',
    difficulty: 'medium',
    estimatedMinutes: 20,
    getContent: () => ({
      topic: 'Past Tenses',
      whyItMatters: 'Past tenses are essential for describing experiences, data trends, and historical events in IELTS.',
      sections: [
        { heading: 'Past Simple', body: 'Use for: completed actions in the past at a specific time\nStructure: Subject + past verb (-ed or irregular)\nExamples: I took the IELTS exam last month. She graduated in 2020.', type: 'instruction' },
        { heading: 'Past Continuous', body: 'Use for: actions in progress at a specific past time, interrupted actions, background description\nStructure: Subject + was/were + verb-ing\nExamples: I was studying when you called. It was raining heavily during the exam.', type: 'instruction' },
        { heading: 'Present Perfect', body: 'Use for: past actions with present relevance, experiences, recent changes, unfinished periods\nStructure: Subject + have/has + past participle\nExamples: I have studied English for five years. She has already completed her essay.', type: 'instruction' },
      ],
      questions: [
        { id: generateId(), question: 'Complete: "When I arrived, she _____ (wait) for me."', options: ['waited', 'was waiting', 'has waited', 'has been waiting'], correctAnswer: 'was waiting', type: 'fill-blank' },
        { id: generateId(), question: 'Which sentence is correct?', options: ['I have seen him yesterday.', 'I saw him yesterday.', 'I have saw him yesterday.', 'I seen him yesterday.'], correctAnswer: 'I saw him yesterday.', type: 'multiple-choice' },
        { id: generateId(), question: 'Fill in the blank: "She _____ (live) in London since 2018."', type: 'short-answer' },
      ],
      tips: ['Use past simple for finished time periods (yesterday, last year).', 'Use present perfect when the time is not specified.', 'Past continuous is useful for describing scenes in writing.'],
    }),
  },
  {
    skill: 'Grammar',
    title: 'Review Conditionals for IELTS Speaking and Writing',
    objective: 'Practice using first, second, and third conditionals correctly',
    difficulty: 'hard',
    estimatedMinutes: 25,
    getContent: () => ({
      topic: 'Conditionals',
      whyItMatters: 'Conditionals show grammatical range and help you express complex ideas in IELTS.',
      sections: [
        { heading: 'First Conditional', body: 'Use for: real/possible future situations\nStructure: If + present simple, will + base verb\nExample: If I study hard, I will achieve a high score.', type: 'instruction' },
        { heading: 'Second Conditional', body: 'Use for: unreal/hypothetical present situations\nStructure: If + past simple, would + base verb\nExample: If I had more time, I would practice speaking every day.', type: 'instruction' },
        { heading: 'Third Conditional', body: 'Use for: unreal past situations (regrets, past hypotheticals)\nStructure: If + had + past participle, would have + past participle\nExample: If I had started preparing earlier, I would have achieved a higher score.', type: 'instruction' },
      ],
      questions: [
        { id: generateId(), question: 'Complete: "If it _____ (rain) tomorrow, I will stay home."', options: ['rains', 'rained', 'will rain', 'would rain'], correctAnswer: 'rains', type: 'fill-blank' },
        { id: generateId(), question: 'Which conditional expresses regret about the past?', options: ['If I study, I will pass.', 'If I studied, I would pass.', 'If I had studied, I would have passed.', 'If I study, I would pass.'], correctAnswer: 'If I had studied, I would have passed.', type: 'multiple-choice' },
        { id: generateId(), question: 'Transform: "I don\'t have a study partner. I want to practice speaking more." Use second conditional.', type: 'short-answer' },
      ],
      tips: ['Use first conditional for real future possibilities.', 'Use second conditional for hypothetical situations.', 'Use third conditional for past regrets - this impresses examiners.'],
    }),
  },
]

const ALL_CONTENT = [...VOCABULARY_CONTENT, ...READING_CONTENT, ...LISTENING_CONTENT, ...WRITING_CONTENT, ...SPEAKING_CONTENT, ...GRAMMAR_CONTENT]

export function getContentForSkill(skill: StudySkill, difficulty?: Difficulty): ContentTemplate[] {
  let filtered = ALL_CONTENT.filter(c => c.skill === skill)
  if (difficulty) {
    filtered = filtered.filter(c => c.difficulty === difficulty)
  }
  return filtered
}

export function getRandomContentForSkill(skill: StudySkill, excludeTitles?: string[]): ContentTemplate | null {
  const available = ALL_CONTENT.filter(
    c => c.skill === skill && (!excludeTitles || !excludeTitles.includes(c.title))
  )
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export function getContentByTitle(title: string): ContentTemplate | null {
  return ALL_CONTENT.find(c => c.title === title) ?? null
}

export function getAllContentTemplates(): ContentTemplate[] {
  return ALL_CONTENT
}

export type { ContentTemplate }
