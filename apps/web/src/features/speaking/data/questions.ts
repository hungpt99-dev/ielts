export interface SpeakingQuestion {
  id: string
  part: 1 | 2 | 3
  question: string
  topic: string
  followUp?: string[]
  cueCard?: {
    topic: string
    points: string[]
    followUp: string[]
  }
}

export const SAMPLE_QUESTIONS: SpeakingQuestion[] = [
  // ── Part 1: Introduction & Interview ──
  {
    id: 'p1-001',
    part: 1,
    question: 'Do you work or are you a student?',
    topic: 'Work & Study',
    followUp: [
      'What do you like about your job/studies?',
      'What would you like to change about your job/studies?',
    ],
  },
  {
    id: 'p1-002',
    part: 1,
    question: 'Where do you live? Do you like it there?',
    topic: 'Home & Accommodation',
    followUp: [
      'What kind of place do you live in?',
      'What is your favorite room in your home?',
      'Would you like to move to a different place?',
    ],
  },
  {
    id: 'p1-003',
    part: 1,
    question: 'What do you like to do in your free time?',
    topic: 'Hobbies & Leisure',
    followUp: [
      'Do you prefer to spend your free time alone or with others?',
      'Has your free time changed since you were a child?',
    ],
  },
  {
    id: 'p1-004',
    part: 1,
    question: 'Do you like to travel? Where have you been?',
    topic: 'Travel',
    followUp: [
      'What kind of places do you prefer to visit?',
      'Do you prefer traveling alone or in a group?',
    ],
  },
  {
    id: 'p1-005',
    part: 1,
    question: 'What kind of music do you enjoy?',
    topic: 'Music',
    followUp: [
      'Do you play any musical instruments?',
      'Has your taste in music changed over the years?',
    ],
  },
  {
    id: 'p1-006',
    part: 1,
    question: 'Do you like watching movies? What type?',
    topic: 'Movies & TV',
    followUp: [
      'Do you prefer watching movies at home or in a cinema?',
      'What was the last movie you watched?',
    ],
  },
  {
    id: 'p1-007',
    part: 1,
    question: 'How often do you use the internet?',
    topic: 'Technology',
    followUp: [
      'What do you mainly use the internet for?',
      'Could you live without the internet?',
    ],
  },
  {
    id: 'p1-008',
    part: 1,
    question: 'Do you like shopping? Why or why not?',
    topic: 'Shopping',
    followUp: [
      'Do you prefer shopping online or in stores?',
      'What was the last thing you bought?',
    ],
  },
  {
    id: 'p1-009',
    part: 1,
    question: 'What is your favorite type of food?',
    topic: 'Food & Cooking',
    followUp: [
      'Can you cook? What dishes can you make?',
      'Do you prefer eating at home or eating out?',
    ],
  },
  {
    id: 'p1-010',
    part: 1,
    question: 'Do you play any sports?',
    topic: 'Sports & Exercise',
    followUp: [
      'What sports are popular in your country?',
      'Did you play sports as a child?',
    ],
  },
  {
    id: 'p1-011',
    part: 1,
    question: 'What do you usually do on weekends?',
    topic: 'Daily Routine',
    followUp: [
      'Do you prefer busy or relaxing weekends?',
      'How have your weekends changed recently?',
    ],
  },
  {
    id: 'p1-012',
    part: 1,
    question: 'Do you like reading books? Why?',
    topic: 'Reading',
    followUp: [
      'What kind of books do you read?',
      'Do you prefer physical books or e-books?',
    ],
  },

  // ── Part 2: Cue Card / Long Turn ──
  {
    id: 'p2-001',
    part: 2,
    question: 'Describe a place you like to visit.',
    topic: 'Places',
    cueCard: {
      topic: 'A Place You Like to Visit',
      points: [
        'Where this place is',
        'How you know about this place',
        'What you can do there',
        'Why you like visiting this place',
      ],
      followUp: [
        'Do you prefer visiting new places or familiar ones?',
        'How has tourism changed in your country?',
      ],
    },
  },
  {
    id: 'p2-002',
    part: 2,
    question: 'Describe a person who has influenced you.',
    topic: 'People',
    cueCard: {
      topic: 'A Person Who Has Influenced You',
      points: [
        'Who this person is',
        'How you know them',
        'What qualities they have',
        'Why they have influenced you',
      ],
      followUp: [
        'What kind of people become role models today?',
        'Do you think celebrities are good role models?',
      ],
    },
  },
  {
    id: 'p2-003',
    part: 2,
    question: 'Describe a skill you want to learn.',
    topic: 'Skills & Learning',
    cueCard: {
      topic: 'A Skill You Want to Learn',
      points: [
        'What the skill is',
        'Why you want to learn it',
        'How you plan to learn it',
        'How it will benefit you',
      ],
      followUp: [
        'Is it better to learn a skill from a teacher or by yourself?',
        'What skills are most important in today\'s world?',
      ],
    },
  },
  {
    id: 'p2-004',
    part: 2,
    question: 'Describe a memorable event in your life.',
    topic: 'Events & Experiences',
    cueCard: {
      topic: 'A Memorable Event',
      points: [
        'What the event was',
        'When and where it happened',
        'Who was with you',
        'Why it was memorable',
      ],
      followUp: [
        'Why do some memories stay with us for a long time?',
        'Do you think people remember positive or negative events more?',
      ],
    },
  },
  {
    id: 'p2-005',
    part: 2,
    question: 'Describe a piece of technology you find useful.',
    topic: 'Technology',
    cueCard: {
      topic: 'A Useful Piece of Technology',
      points: [
        'What the technology is',
        'How you use it',
        'Why you find it useful',
        'How it has changed your life',
      ],
      followUp: [
        'What technology do you think will become important in the future?',
        'Has technology made our lives easier or more complicated?',
      ],
    },
  },
  {
    id: 'p2-006',
    part: 2,
    question: 'Describe a goal you have for the future.',
    topic: 'Goals & Ambitions',
    cueCard: {
      topic: 'A Future Goal',
      points: [
        'What the goal is',
        'When you hope to achieve it',
        'What steps you need to take',
        'Why this goal is important to you',
      ],
      followUp: [
        'Do you think it is important to set goals?',
        'How do people in your country pursue their goals?',
      ],
    },
  },
  {
    id: 'p2-007',
    part: 2,
    question: 'Describe a book or film that impressed you.',
    topic: 'Entertainment',
    cueCard: {
      topic: 'A Book or Film That Impressed You',
      points: [
        'What the book or film is',
        'What it is about',
        'Why you chose to read or watch it',
        'Why it impressed you',
      ],
      followUp: [
        'Do you prefer books or movies based on books?',
        'What makes a story memorable?',
      ],
    },
  },

  // ── Part 3: Discussion ──
  {
    id: 'p3-001',
    part: 3,
    question: 'What are the main benefits of learning a foreign language?',
    topic: 'Education',
    followUp: [
      'Why do some people find learning a language difficult?',
      'What is the best age to start learning a new language?',
      'How has technology changed language learning?',
    ],
  },
  {
    id: 'p3-002',
    part: 3,
    question: 'How has technology changed the way people communicate?',
    topic: 'Technology & Communication',
    followUp: [
      'Do you think social media has improved relationships?',
      'What are the disadvantages of relying on digital communication?',
      'How do you think people will communicate in the future?',
    ],
  },
  {
    id: 'p3-003',
    part: 3,
    question: 'What can governments do to protect the environment?',
    topic: 'Environment',
    followUp: [
      'Should individuals take more responsibility for the environment?',
      'Why are some countries more environmentally friendly than others?',
      'What are the most serious environmental problems today?',
    ],
  },
  {
    id: 'p3-004',
    part: 3,
    question: 'Do you think cities are becoming too crowded?',
    topic: 'Urbanization',
    followUp: [
      'What problems does overpopulation in cities cause?',
      'What can be done to improve life in big cities?',
      'Would you prefer to live in a city or a rural area?',
    ],
  },
  {
    id: 'p3-005',
    part: 3,
    question: 'What role does education play in a person\'s success?',
    topic: 'Education & Success',
    followUp: [
      'Is a university degree necessary for success today?',
      'What skills should schools teach that they currently do not?',
      'How has the value of education changed over time?',
    ],
  },
  {
    id: 'p3-006',
    part: 3,
    question: 'How important is it to preserve traditional culture?',
    topic: 'Culture & Tradition',
    followUp: [
      'What is the best way to preserve cultural heritage?',
      'How has globalization affected local cultures?',
      'Should governments spend money on preserving traditions?',
    ],
  },
  {
    id: 'p3-007',
    part: 3,
    question: 'What are the advantages and disadvantages of globalization?',
    topic: 'Globalization',
    followUp: [
      'Has globalization had a positive or negative effect on your country?',
      'How has globalization affected the job market?',
      'Do you think globalization will continue to grow?',
    ],
  },
  {
    id: 'p3-008',
    part: 3,
    question: 'How has the way people work changed in recent years?',
    topic: 'Work & Employment',
    followUp: [
      'What are the pros and cons of working from home?',
      'Do you think AI will replace many jobs?',
      'What skills will be most important for future jobs?',
    ],
  },
  {
    id: 'p3-009',
    part: 3,
    question: 'What can be done to reduce stress in modern life?',
    topic: 'Health & Wellbeing',
    followUp: [
      'Is modern life more stressful than in the past?',
      'What are the most effective ways to relax?',
      'Should employers do more to reduce workplace stress?',
    ],
  },
  {
    id: 'p3-010',
    part: 3,
    question: 'Do you think social media has a positive or negative impact on society?',
    topic: 'Media & Technology',
    followUp: [
      'How does social media affect young people?',
      'Should social media companies be regulated more strictly?',
      'What are the benefits of using social media for education?',
    ],
  },
]
