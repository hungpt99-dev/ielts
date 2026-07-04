import type { ListeningExercise } from '../../../models'

export const SAMPLE_EXERCISES: ListeningExercise[] = [
  {
    id: 'listening-e1',
    title: 'University Orientation Talk',
    topic: 'Education',
    transcript: `Good morning, and welcome to the University of Manchester orientation day. My name is Dr. Sarah Chen, and I'm the Director of Student Services.

Today, I'll be giving you an overview of what to expect during your first year. First, let me talk about the academic calendar. The autumn term runs from September to December, with a reading week in early November. The spring term starts in January and runs through March, followed by the summer term from April to June.

Your course will consist of lectures, seminars, and practical sessions. Lectures are typically one hour long, while seminars last about two hours. For most courses, you'll have around twelve contact hours per week, though this varies by department.

Assessment methods include essays, examinations, and group projects. For first-year students, continuous assessment counts for forty percent of your final grade, while the end-of-year examination accounts for the remaining sixty percent.

I'd also like to draw your attention to the support services available. The student wellbeing centre offers free counselling, and the careers service can help with internship applications. The library is open twenty-four hours a day during exam periods.

If you have any questions, please speak to your personal tutor or visit the student services office on the ground floor of the University building. Thank you, and I wish you all the best for your studies.`,
    audioUrl: '',
    audioType: 'audio',
    questions: [
      {
        id: 'le1-q1',
        type: 'gap-fill',
        question: 'The autumn term reading week is in ________.',
        correctAnswer: 'early November',
        explanation: 'Dr. Chen mentions the reading week is in early November.',
        blanks: ['early November'],
      },
      {
        id: 'le1-q2',
        type: 'gap-fill',
        question: 'Seminars last about ________ hours.',
        correctAnswer: 'two',
        explanation: 'Seminars typically last about two hours.',
        blanks: ['two'],
      },
      {
        id: 'le1-q3',
        type: 'gap-fill',
        question: 'Continuous assessment counts for ________ percent of the final grade.',
        correctAnswer: 'forty',
        explanation: 'Continuous assessment is worth forty percent of the final grade.',
        blanks: ['forty'],
      },
      {
        id: 'le1-q4',
        type: 'gap-fill',
        question: 'The library is open ________ hours a day during exam periods.',
        correctAnswer: 'twenty-four',
        explanation: 'The library operates 24 hours a day during exams.',
        blanks: ['twenty-four'],
      },
      {
        id: 'le1-q5',
        type: 'true-false',
        question: 'Seminars are longer than lectures.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 0,
        explanation: 'Lectures are one hour while seminars last about two hours, so seminars are longer.',
      },
      {
        id: 'le1-q6',
        type: 'true-false',
        question: 'The student wellbeing centre charges a fee for counselling services.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 1,
        explanation: 'Dr. Chen says the wellbeing centre offers free counselling, so this statement is false.',
      },
      {
        id: 'le1-q7',
        type: 'short-answer',
        question: 'What is Dr. Sarah Chen\'s role at the university?',
        correctAnswer: 'Director of Student Services',
        explanation: 'Dr. Chen introduces herself as the Director of Student Services.',
        blanks: ['Director of Student Services'],
        acceptableAnswers: ['Director of Student Services', 'the Director of Student Services'],
      },
      {
        id: 'le1-q8',
        type: 'short-answer',
        question: 'On which floor is the student services office located?',
        correctAnswer: 'ground floor',
        explanation: 'The student services office is on the ground floor of the University building.',
        blanks: ['ground floor'],
        acceptableAnswers: ['ground floor', 'the ground floor'],
      },
    ],
    difficulty: 'easy',
    wordCount: 280,
    estimatedMinutes: 15,
  },
  {
    id: 'listening-e2',
    title: 'Climate Change Discussion',
    topic: 'Environment',
    transcript: `Welcome to today's lecture on climate change impacts. I'm Professor James Wilson from the Department of Environmental Science.

Today, we'll examine three major consequences of rising global temperatures. First, let's look at sea-level rise. Over the past century, global sea levels have risen by approximately nineteen centimetres. This is primarily due to thermal expansion of seawater and melting of glaciers and ice sheets. Scientists predict that by the year 2100, sea levels could rise by a further sixty to one hundred centimetres.

Second, we need to consider changes in weather patterns. Extreme weather events, including hurricanes, droughts, and heatwaves, have become more frequent and intense. For instance, the number of Category four and five hurricanes has increased by about thirty percent over the past thirty years.

Third, biodiversity loss is a significant concern. Many species are being forced to migrate to cooler areas, while those that cannot adapt quickly enough face extinction. The International Union for Conservation of Nature estimates that approximately one million species are currently at risk of extinction.

However, there is reason for optimism. Renewable energy adoption is accelerating rapidly. Solar and wind power now account for over ten percent of global electricity generation, and this figure continues to grow. Many countries have committed to achieving net-zero emissions by 2050.

In conclusion, while the challenges posed by climate change are substantial, technological innovation and international cooperation offer pathways to a more sustainable future. Thank you for your attention.`,
    audioUrl: '',
    audioType: 'audio',
    questions: [
      {
        id: 'le2-q1',
        type: 'gap-fill',
        question: 'Sea levels have risen by approximately ________ centimetres over the past century.',
        correctAnswer: 'nineteen',
        explanation: 'Dr. Wilson states sea levels rose about 19 centimetres.',
        blanks: ['nineteen'],
      },
      {
        id: 'le2-q2',
        type: 'gap-fill',
        question: 'Category four and five hurricanes have increased by about ________ percent.',
        correctAnswer: 'thirty',
        explanation: 'The increase in severe hurricanes is about 30%.',
        blanks: ['thirty'],
      },
      {
        id: 'le2-q3',
        type: 'multiple-choice',
        question: 'How many species are currently at risk of extinction according to the lecture?',
        options: [
          'Approximately one hundred thousand',
          'Approximately one million',
          'Approximately ten million',
          'Approximately one billion',
        ],
        correctAnswer: 1,
        explanation: 'The IUCN estimates roughly one million species are at risk.',
      },
      {
        id: 'le2-q4',
        type: 'gap-fill',
        question: 'Solar and wind power account for over ________ percent of global electricity generation.',
        correctAnswer: 'ten',
        explanation: 'Renewables like solar and wind now exceed 10% of global generation.',
        blanks: ['ten'],
      },
      {
        id: 'le2-q5',
        type: 'true-false',
        question: 'Sea levels could rise by a further 60 to 100 centimetres by the year 2100.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 0,
        explanation: 'Professor Wilson states that by 2100 sea levels could rise by 60-100 cm.',
      },
      {
        id: 'le2-q6',
        type: 'multiple-answer',
        question: 'Which TWO factors are mentioned as causes of sea-level rise?',
        options: [
          'Thermal expansion of seawater',
          'Increased rainfall',
          'Melting of glaciers and ice sheets',
          'Underwater volcanic activity',
          'Changes in ocean currents',
        ],
        correctAnswer: '0,2',
        explanation: 'The two causes mentioned are thermal expansion of seawater and melting of glaciers and ice sheets.',
      },
      {
        id: 'le2-q7',
        type: 'short-answer',
        question: 'What is the name of Professor Wilson\'s department?',
        correctAnswer: 'Environmental Science',
        explanation: 'Professor Wilson is from the Department of Environmental Science.',
        blanks: ['Environmental Science'],
        acceptableAnswers: ['Environmental Science', 'Department of Environmental Science'],
      },
      {
        id: 'le2-q8',
        type: 'short-answer',
        question: 'By what year have many countries committed to achieving net-zero emissions?',
        correctAnswer: '2050',
        explanation: 'Many countries have committed to net-zero emissions by 2050.',
        blanks: ['2050'],
        acceptableAnswers: ['2050'],
      },
    ],
    difficulty: 'medium',
    wordCount: 310,
    estimatedMinutes: 15,
  },
  {
    id: 'listening-e3',
    title: 'Travel Booking Conversation',
    topic: 'Travel',
    transcript: `Customer: Hello, I'd like to book a flight to Sydney, please.

Agent: Certainly, sir. When are you planning to travel?

Customer: I need to arrive by the fifteenth of March, so I'd like to fly out on the fourteenth.

Agent: Let me check availability. We have a morning flight departing at eight thirty with a layover in Singapore, arriving at six in the evening local time. Alternatively, there's a direct flight at eleven fifteen at night, arriving at nine the next morning.

Customer: The direct option sounds better. How much is that?

Agent: The direct flight is six hundred and eighty pounds for economy class. Business class is one thousand two hundred.

Customer: I'll go with economy. Does that include meals?

Agent: Yes, dinner and breakfast are served on the flight. You'll also have access to the in-flight entertainment system.

Customer: Great. Can I choose my seat?

Agent: Certainly. We have window seats available in rows twelve to fifteen, and aisle seats in rows sixteen to twenty. Where would you like to sit?

Customer: A window seat, please. Row twelve if possible.

Agent: I've booked you on flight BA two-oh-three departing at twenty-three fifteen from Terminal five. Your seat is twelve A. Please arrive at least two hours before departure.

Customer: Thank you very much.

Agent: You're welcome. Have a pleasant journey.`,
    audioUrl: '',
    audioType: 'audio',
    questions: [
      {
        id: 'le3-q1',
        type: 'gap-fill',
        question: 'The customer wants to arrive in Sydney by March ________.',
        correctAnswer: 'fifteenth',
        explanation: 'The customer stated they need to arrive by March 15th.',
        blanks: ['fifteenth', '15th'],
      },
      {
        id: 'le3-q2',
        type: 'gap-fill',
        question: 'The direct flight departs at ________.',
        correctAnswer: 'eleven fifteen',
        explanation: 'The agent says the direct flight is at 11:15 PM.',
        blanks: ['eleven fifteen', '23:15', '11:15'],
      },
      {
        id: 'le3-q3',
        type: 'gap-fill',
        question: 'The economy class ticket costs ________ pounds.',
        correctAnswer: 'six hundred and eighty',
        explanation: 'The economy price is £680.',
        blanks: ['six hundred and eighty', '680', 'six hundred eighty'],
      },
      {
        id: 'le3-q4',
        type: 'multiple-choice',
        question: 'Which gate does the customer need to go to?',
        options: [
          'Terminal three',
          'Terminal five',
          'Terminal seven',
          'Terminal two',
        ],
        correctAnswer: 1,
        explanation: 'The flight departs from Terminal 5.',
      },
      {
        id: 'le3-q5',
        type: 'gap-fill',
        question: 'Passengers should arrive at least ________ hours before departure.',
        correctAnswer: 'two',
        explanation: 'The agent says to arrive at least two hours early.',
        blanks: ['two', '2'],
      },
      {
        id: 'le3-q6',
        type: 'true-false',
        question: 'The direct flight arrives at 9:00 AM the following morning.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 0,
        explanation: 'The direct flight departs at 11:15 PM and arrives at 9:00 AM the next morning.',
      },
      {
        id: 'le3-q7',
        type: 'true-false',
        question: 'Meals are included with the economy class ticket.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 0,
        explanation: 'Dinner and breakfast are served on the flight, so meals are included.',
      },
      {
        id: 'le3-q8',
        type: 'short-answer',
        question: 'What is the flight number of the direct flight?',
        correctAnswer: 'BA two-oh-three',
        explanation: 'The agent books flight BA two-oh-three.',
        blanks: ['BA two-oh-three', 'BA203'],
        acceptableAnswers: ['BA two-oh-three', 'BA203', 'BA 203'],
      },
      {
        id: 'le3-q9',
        type: 'short-answer',
        question: 'What seat number has been booked for the customer?',
        correctAnswer: 'twelve A',
        explanation: 'The agent books seat twelve A (row 12, window seat).',
        blanks: ['twelve A', '12A'],
        acceptableAnswers: ['twelve A', '12A', '12-A'],
      },
    ],
    difficulty: 'easy',
    wordCount: 260,
    estimatedMinutes: 12,
  },
  {
    id: 'listening-e4',
    title: 'Urban Planning Lecture',
    topic: 'Society',
    transcript: `Today's lecture focuses on sustainable urban development. I'm Professor Mark Davis, and I've been researching urban planning for over twenty years.

The concept of the fifteen-minute city has gained significant attention in recent years. This model proposes that residents should be able to access all essential services within a fifteen-minute walk or bike ride from their homes. These services include grocery stores, healthcare facilities, schools, parks, and public transport.

Barcelona's superblock model is a pioneering example. In this system, groups of nine city blocks are transformed into pedestrian-friendly zones. Traffic is restricted to the perimeter roads, while interior streets become spaces for play, social interaction, and green areas. The result has been a twenty-five percent reduction in air pollution and a significant increase in outdoor social activities.

Another important concept is green infrastructure. This involves integrating natural elements into urban design, such as green roofs, rain gardens, and permeable pavements. These features help manage stormwater, reduce urban heat island effects, and improve air quality.

However, implementing these changes faces challenges. Existing infrastructure, property rights, and the need for political consensus can slow progress. Despite these obstacles, many cities worldwide are adopting these principles.

In conclusion, the shift toward sustainable urban design is not just about environmental benefits but also about creating more livable, equitable, and healthy communities for all residents.`,
    audioUrl: '',
    audioType: 'audio',
    questions: [
      {
        id: 'le4-q1',
        type: 'multiple-choice',
        question: 'What is the main concept of the fifteen-minute city?',
        options: [
          'All buildings must be fifteen stories or fewer',
          'Essential services should be within a 15-minute walk or bike ride',
          'City meetings should last no more than 15 minutes',
          'Public transport should arrive every 15 minutes',
        ],
        correctAnswer: 1,
        explanation: 'The 15-minute city model means all essential services are accessible within a 15-minute walk or bike ride.',
      },
      {
        id: 'le4-q2',
        type: 'gap-fill',
        question: 'Barcelona\'s superblock model resulted in a ________ percent reduction in air pollution.',
        correctAnswer: 'twenty-five',
        explanation: 'Barcelona saw a 25% reduction in air pollution.',
        blanks: ['twenty-five', '25'],
      },
      {
        id: 'le4-q3',
        type: 'gap-fill',
        question: 'In Barcelona\'s superblock, ________ city blocks are grouped together.',
        correctAnswer: 'nine',
        explanation: 'Groups of nine blocks are transformed in the superblock model.',
        blanks: ['nine', '9'],
      },
      {
        id: 'le4-q4',
        type: 'true-false',
        question: 'Professor Mark Davis has been researching urban planning for over twenty years.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 0,
        explanation: 'Professor Davis states he has been researching urban planning for over twenty years.',
      },
      {
        id: 'le4-q5',
        type: 'true-false',
        question: 'Traffic is completely banned inside Barcelona\'s superblocks.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 1,
        explanation: 'Traffic is restricted to perimeter roads, not completely banned.',
      },
      {
        id: 'le4-q6',
        type: 'multiple-answer',
        question: 'Which THREE features are mentioned as part of green infrastructure?',
        options: [
          'Green roofs',
          'Solar panels',
          'Rain gardens',
          'Underground parking',
          'Permeable pavements',
        ],
        correctAnswer: '0,2,4',
        explanation: 'Green roofs, rain gardens, and permeable pavements are all mentioned as green infrastructure features.',
      },
      {
        id: 'le4-q7',
        type: 'short-answer',
        question: 'What is the name of Barcelona\'s urban planning model?',
        correctAnswer: 'superblock',
        explanation: 'Barcelona\'s model is called the superblock model.',
        blanks: ['superblock', 'superblock model'],
        acceptableAnswers: ['superblock', 'superblock model', 'the superblock model'],
      },
    ],
    difficulty: 'medium',
    wordCount: 290,
    estimatedMinutes: 15,
  },
  {
    id: 'listening-e5',
    title: 'Job Interview Tips',
    topic: 'Work',
    transcript: `Welcome to today's career development workshop. I'm Helen Roberts, a recruitment specialist with fifteen years of experience.

Today, I'll share five essential tips for acing your job interview. Let me start with preparation. Research the company thoroughly before your interview. Understand their products, services, company culture, and recent news. This shows genuine interest and helps you tailor your responses.

Second, practice your responses to common questions. The "tell me about yourself" question is almost guaranteed. Structure your answer using the present-past-future framework: briefly describe your current role, relevant past experience, and why you're interested in this opportunity.

Third, prepare thoughtful questions to ask the interviewer. Good questions demonstrate engagement and help you determine if the role is right for you. Ask about team dynamics, growth opportunities, or recent projects rather than salary or benefits.

Fourth, non-verbal communication matters enormously. Maintain eye contact, offer a firm handshake, and sit up straight. Research indicates that non-verbal cues account for over fifty percent of the impression you make.

Finally, always send a thank-you email within twenty-four hours of the interview. Mention something specific from your conversation to reinforce your interest and make yourself memorable.

Follow these tips, and you'll significantly increase your chances of success. Good luck with your job search.`,
    audioUrl: '',
    audioType: 'audio',
    questions: [
      {
        id: 'le5-q1',
        type: 'gap-fill',
        question: 'The "tell me about yourself" answer should use the ________ framework.',
        correctAnswer: 'present-past-future',
        explanation: 'Helen recommends using the present-past-future structure.',
        blanks: ['present-past-future'],
      },
      {
        id: 'le5-q2',
        type: 'multiple-choice',
        question: 'What percentage of the impression you make comes from non-verbal cues?',
        options: [
          'Over 30 percent',
          'Over 50 percent',
          'Over 70 percent',
          'Over 90 percent',
        ],
        correctAnswer: 1,
        explanation: 'Non-verbal cues account for over 50% of the impression.',
      },
      {
        id: 'le5-q3',
        type: 'gap-fill',
        question: 'A thank-you email should be sent within ________ hours of the interview.',
        correctAnswer: 'twenty-four',
        explanation: 'Send a thank-you email within 24 hours of the interview.',
        blanks: ['twenty-four', '24'],
      },
      {
        id: 'le5-q4',
        type: 'true-false',
        question: 'Helen Roberts has fifteen years of experience as a recruitment specialist.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 0,
        explanation: 'Helen introduces herself as a recruitment specialist with fifteen years of experience.',
      },
      {
        id: 'le5-q5',
        type: 'true-false',
        question: 'You should ask about salary and benefits during the interview.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 1,
        explanation: 'Helen advises asking about team dynamics, growth opportunities, or projects rather than salary or benefits.',
      },
      {
        id: 'le5-q6',
        type: 'multiple-answer',
        question: 'Which THREE of the following interview tips does Helen mention?',
        options: [
          'Research the company thoroughly',
          'Wear formal clothing',
          'Practice responses to common questions',
          'Prepare thoughtful questions to ask the interviewer',
          'Bring multiple copies of your CV',
        ],
        correctAnswer: '0,2,3',
        explanation: 'Helen recommends researching the company, practicing responses, and preparing thoughtful questions.',
      },
      {
        id: 'le5-q7',
        type: 'short-answer',
        question: 'Besides eye contact, what other non-verbal cue does Helen recommend?',
        correctAnswer: 'firm handshake',
        explanation: 'Helen advises maintaining eye contact and offering a firm handshake.',
        blanks: ['firm handshake', 'a firm handshake'],
        acceptableAnswers: ['firm handshake', 'a firm handshake'],
      },
    ],
    difficulty: 'easy',
    wordCount: 270,
    estimatedMinutes: 12,
  },
]
