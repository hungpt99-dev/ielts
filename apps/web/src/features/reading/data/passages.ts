import type { ReadingPassageWithQuestions } from '../../../models'

export const SAMPLE_PASSAGES: ReadingPassageWithQuestions[] = [
  {
    id: 'reading-p1',
    title: 'The Benefits of Urban Green Spaces',
    topic: 'Environment',
    text: `Urban green spaces, such as parks, community gardens, and green roofs, have become increasingly important as cities continue to expand. These areas provide numerous environmental benefits, including improved air quality, reduced urban heat island effect, and better stormwater management. Trees and plants absorb carbon dioxide and release oxygen, helping to mitigate the impacts of climate change at a local level.

Beyond environmental advantages, green spaces offer significant social and psychological benefits. Studies have shown that access to parks and natural areas reduces stress levels, improves mental health, and encourages physical activity. Residents living near green spaces report higher levels of life satisfaction and community engagement.

However, the distribution of green spaces is often unequal across urban areas. Low-income neighborhoods frequently have fewer parks and less tree coverage compared to wealthier districts. This disparity has led to growing calls for environmental justice and equitable access to nature in cities. Urban planners are now exploring innovative solutions, such as converting vacant lots into community gardens and implementing green infrastructure policies, to address these inequities.

The economic benefits of green spaces are also noteworthy. Properties located near parks and gardens tend to have higher real estate values, and businesses in green areas often attract more customers. Additionally, well-maintained public spaces can reduce crime rates by increasing foot traffic and community surveillance.

Despite these clear benefits, creating and maintaining urban green spaces requires significant investment and political will. Cities must balance competing priorities for land use, including housing, transportation, and commercial development. Successful examples from cities like Singapore, Vancouver, and Copenhagen demonstrate that with careful planning, urban green spaces can be integrated into dense urban environments, creating healthier and more livable cities for all residents.`,
    questions: [
      {
        id: 'p1-q1',
        type: 'multiple-choice',
        question: 'According to the passage, what is one environmental benefit of urban green spaces?',
        options: [
          'Increased property taxes',
          'Reduced urban heat island effect',
          'Higher population density',
          'More commercial development',
        ],
        correctAnswer: 1,
        explanation: 'The passage states that green spaces provide "reduced urban heat island effect" as one of their environmental benefits.',
      },
      {
        id: 'p1-q2',
        type: 'multiple-choice',
        question: 'What social benefit of green spaces is mentioned in the passage?',
        options: [
          'Higher unemployment rates',
          'Increased traffic congestion',
          'Improved mental health',
          'Reduced school enrollment',
        ],
        correctAnswer: 2,
        explanation: 'The passage says that access to parks "reduces stress levels, improves mental health, and encourages physical activity."',
      },
      {
        id: 'p1-q3',
        type: 'true-false-not-given',
        question: 'Wealthy districts generally have more green spaces than low-income neighborhoods.',
        correctAnswer: 'true',
        explanation: 'The passage states that "low-income neighborhoods frequently have fewer parks and less tree coverage compared to wealthier districts."',
      },
      {
        id: 'p1-q4',
        type: 'true-false-not-given',
        question: 'Urban green spaces always lead to an increase in crime rates.',
        correctAnswer: 'false',
        explanation: 'The passage states that "well-maintained public spaces can reduce crime rates by increasing foot traffic and community surveillance."',
      },
      {
        id: 'p1-q5',
        type: 'true-false-not-given',
        question: 'Singapore has the largest urban green space in the world.',
        correctAnswer: 'not-given',
        explanation: 'The passage mentions Singapore as a successful example but does not state that it has the largest green space.',
      },
      {
        id: 'p1-q6',
        type: 'gap-fill',
        question: 'Complete the sentences using words from the passage.',
        blanks: ['carbon dioxide', 'life satisfaction', 'environmental justice', 'political will'],
        correctAnswer: ['carbon dioxide', 'life satisfaction', 'environmental justice', 'political will'],
        explanation: 'These key terms appear throughout the passage describing the benefits and challenges of urban green spaces.',
      },
    ],
    difficulty: 'medium',
    wordCount: 380,
    estimatedMinutes: 20,
  },
  {
    id: 'reading-p2',
    title: 'The History of Digital Communication',
    topic: 'Technology',
    text: `The evolution of digital communication has transformed nearly every aspect of modern life. From the invention of the telegraph in the 1830s to the rise of social media platforms in the twenty-first century, each technological advancement has brought people closer together while simultaneously creating new challenges.

The telegraph, developed by Samuel Morse and others, was the first technology to enable instant communication over long distances. This innovation revolutionized business, journalism, and personal correspondence. By the late nineteenth century, the telephone had replaced the telegraph as the primary means of voice communication, allowing people to speak to one another in real time across vast distances.

The late twentieth century saw the emergence of the internet, which fundamentally changed communication once again. Email became the standard for written correspondence, while chat rooms and instant messaging services allowed for real-time text conversations. The World Wide Web made information accessible to anyone with a connection, democratizing knowledge on an unprecedented scale.

The rise of smartphones in the early 2000s marked another turning point. These devices put powerful communication tools in people's pockets, enabling constant connectivity. Social media platforms such as Facebook, Twitter, and Instagram created new ways for people to share their lives and opinions with wide audiences.

However, digital communication has also presented significant challenges. Concerns about privacy, misinformation, and the impact of social media on mental health have become increasingly prominent. The phenomenon of "digital divide" refers to the gap between those who have access to digital technologies and those who do not, which can exacerbate existing social and economic inequalities.

Looking ahead, emerging technologies such as virtual reality and artificial intelligence are likely to further transform how we communicate. As these technologies develop, society will need to address important questions about regulation, ethics, and the preservation of meaningful human connection in an increasingly digital world.`,
    questions: [
      {
        id: 'p2-q1',
        type: 'multiple-choice',
        question: 'What was the first technology to enable instant long-distance communication?',
        options: [
          'The telephone',
          'The telegraph',
          'The internet',
          'The smartphone',
        ],
        correctAnswer: 1,
        explanation: 'The passage states that "the telegraph was the first technology to enable instant communication over long distances."',
      },
      {
        id: 'p2-q2',
        type: 'multiple-choice',
        question: 'According to the passage, what is the "digital divide"?',
        options: [
          'The difference between analog and digital signals',
          'The gap between those with and without access to digital technologies',
          'The separation between online and offline communication',
          'The distinction between social media platforms',
        ],
        correctAnswer: 1,
        explanation: 'The passage defines the "digital divide" as "the gap between those who have access to digital technologies and those who do not."',
      },
      {
        id: 'p2-q3',
        type: 'true-false-not-given',
        question: 'The telephone was invented in the same century as the telegraph.',
        correctAnswer: 'true',
        explanation: 'The telegraph was invented in the 1830s, and the telephone was developed "by the late nineteenth century," both in the 1800s.',
      },
      {
        id: 'p2-q4',
        type: 'true-false-not-given',
        question: 'Social media platforms were created before the invention of email.',
        correctAnswer: 'false',
        explanation: 'The passage states that email became standard before social media. Email emerged with the internet in the late 20th century, while social media rose in the early 2000s.',
      },
      {
        id: 'p2-q5',
        type: 'matching-headings',
        question: 'Match each paragraph to the correct heading.',
        headings: [
          'Challenges of digital communication',
          'The telegraph and telephone era',
          'Future directions in communication',
          'The internet revolution',
          'Introduction to digital communication evolution',
          'The smartphone and social media age',
        ],
        paragraphs: [
          { id: 'para1', text: 'The evolution of digital communication has transformed nearly every aspect of modern life.' },
          { id: 'para2', text: 'The telegraph, developed by Samuel Morse and others, was the first technology to enable instant communication.' },
          { id: 'para3', text: 'The late twentieth century saw the emergence of the internet, which fundamentally changed communication.' },
          { id: 'para4', text: 'The rise of smartphones in the early 2000s marked another turning point.' },
          { id: 'para5', text: 'However, digital communication has also presented significant challenges.' },
          { id: 'para6', text: 'Looking ahead, emerging technologies such as virtual reality and artificial intelligence are likely to further transform communication.' },
        ],
        correctMatches: {
          para1: 4,
          para2: 1,
          para3: 3,
          para4: 5,
          para5: 0,
          para6: 2,
        },
        correctAnswer: '0',
        explanation: 'Each paragraph introduces a distinct era or theme in digital communication history, and the correct matches follow the chronological and thematic progression of the passage.',
      },
    ],
    difficulty: 'medium',
    wordCount: 360,
    estimatedMinutes: 20,
  },
  {
    id: 'reading-p3',
    title: 'Globalization and Cultural Identity',
    topic: 'Globalization',
    text: `Globalization, the process by which businesses, ideas, and cultures spread across the world, has accelerated dramatically over the past half century. Advances in transportation, communication technology, and trade liberalization have created an increasingly interconnected global economy. While globalization has brought economic growth and cultural exchange, it has also raised concerns about the preservation of local cultural identities.

Proponents of globalization argue that it promotes cross-cultural understanding and provides access to diverse products, ideas, and experiences. International travel, multinational media, and global brands have exposed people to different ways of life. This exposure can lead to greater tolerance and appreciation of cultural diversity. Moreover, global trade has lifted millions out of poverty by creating jobs and economic opportunities in developing countries.

Critics contend that globalization can lead to cultural homogenization, where local traditions, languages, and customs are eroded by dominant global cultures. The spread of multinational corporations and global media conglomerates often prioritizes Western lifestyles and values, potentially marginalizing indigenous cultures. For example, the dominance of English as a global language has put pressure on speakers of minority languages, many of which are at risk of extinction.

The relationship between globalization and cultural identity is complex. Some communities have responded by actively preserving and promoting their cultural heritage, while others have adapted global influences into new hybrid forms of cultural expression. The phenomenon of "glocalization" describes how global products and ideas are adapted to fit local contexts, creating unique cultural blends.

Ultimately, the impact of globalization on cultural identity depends on how it is managed. Policies that support cultural diversity, protect indigenous rights, and promote equitable economic development can help ensure that globalization benefits all members of society while preserving the rich tapestry of world cultures.`,
    questions: [
      {
        id: 'p3-q1',
        type: 'multiple-choice',
        question: 'What is the main concern about globalization raised in the passage?',
        options: [
          'It slows down economic growth',
          'It reduces international travel',
          'It may erode local cultural identities',
          'It limits access to technology',
        ],
        correctAnswer: 2,
        explanation: 'The passage says globalization has "raised concerns about the preservation of local cultural identities" and that critics worry about "cultural homogenization."',
      },
      {
        id: 'p3-q2',
        type: 'multiple-choice',
        question: 'What does the term "glocalization" refer to?',
        options: [
          'The rejection of global influences',
          'The adaptation of global products to local contexts',
          'The spread of local cultures globally',
          'The dominance of English worldwide',
        ],
        correctAnswer: 1,
        explanation: 'The passage defines glocalization as "how global products and ideas are adapted to fit local contexts, creating unique cultural blends."',
      },
      {
        id: 'p3-q3',
        type: 'true-false-not-given',
        question: 'Globalization has only negative effects on cultural identity.',
        correctAnswer: 'false',
        explanation: 'The passage presents both positive aspects (cultural exchange, economic growth) and negative aspects (cultural homogenization) of globalization.',
      },
      {
        id: 'p3-q4',
        type: 'true-false-not-given',
        question: 'English is the most widely spoken first language in the world.',
        correctAnswer: 'not-given',
        explanation: 'The passage mentions that English is a global language but does not compare it to other languages in terms of native speakers.',
      },
      {
        id: 'p3-q5',
        type: 'true-false-not-given',
        question: 'Global trade has contributed to poverty reduction in developing countries.',
        correctAnswer: 'true',
        explanation: 'The passage states that "global trade has lifted millions out of poverty by creating jobs and economic opportunities in developing countries."',
      },
    ],
    difficulty: 'hard',
    wordCount: 340,
    estimatedMinutes: 20,
  },
  {
    id: 'reading-p4',
    title: 'The Science of Habit Formation',
    topic: 'Science',
    text: `Habits are automatic behaviors that we perform with little conscious thought. Understanding how habits form and how they can be changed has been a subject of extensive scientific research, with important implications for personal development, education, and healthcare.

According to research from MIT and other institutions, habits are formed through a three-step neurological loop: the cue, the routine, and the reward. The cue is a trigger that tells the brain to go into automatic mode. The routine is the behavior itself, and the reward is the positive reinforcement that tells the brain to remember this pattern for the future. Over time, this loop becomes more efficient, and the behavior becomes increasingly automatic.

Studies have shown that it takes an average of 66 days to form a new habit, although this varies significantly depending on the complexity of the behavior and individual differences. Simple habits like drinking a glass of water each morning may form in as little as 18 days, while more complex behaviors like establishing a regular exercise routine can take several months.

One of the most effective strategies for habit formation is "implementation intentions," which involves specifying exactly when and where you will perform a behavior. For example, instead of saying "I will exercise more," a more effective plan would be "I will go for a 30-minute run at 7 AM every Monday, Wednesday, and Friday." This specificity creates a strong mental association between the situation and the behavior.

Another important principle is that habits are context-dependent. Changing environments can disrupt old habits and make it easier to establish new ones. This is why people often find it easier to adopt new routines when they move to a new city or start a new job. Researchers recommend using this principle deliberately by creating an environment that supports desired habits and makes undesired ones more difficult.

Understanding the science of habit formation can empower individuals to make lasting changes in their lives. By focusing on small, consistent actions rather than dramatic transformations, people can gradually reshape their automatic behaviors and achieve long-term goals.`,
    questions: [
      {
        id: 'p4-q1',
        type: 'multiple-choice',
        question: 'According to the passage, what are the three components of the habit loop?',
        options: [
          'Thought, action, and result',
          'Cue, routine, and reward',
          'Start, middle, and end',
          'Plan, execute, and review',
        ],
        correctAnswer: 1,
        explanation: 'The passage states that habits are formed through "the cue, the routine, and the reward" loop.',
      },
      {
        id: 'p4-q2',
        type: 'multiple-choice',
        question: 'How long does it typically take to form a new habit?',
        options: [
          'Exactly 21 days',
          'About 66 days on average',
          'At least 6 months',
          'Less than a week',
        ],
        correctAnswer: 1,
        explanation: 'The passage states that "it takes an average of 66 days to form a new habit."',
      },
      {
        id: 'p4-q3',
        type: 'true-false-not-given',
        question: 'Simple habits are generally easier to form than complex ones.',
        correctAnswer: 'true',
        explanation: 'The passage states that "simple habits like drinking a glass of water each morning may form in as little as 18 days, while more complex behaviors can take several months."',
      },
      {
        id: 'p4-q4',
        type: 'true-false-not-given',
        question: 'Habit formation is solely determined by willpower.',
        correctAnswer: 'false',
        explanation: 'The passage discusses several factors including implementation intentions, context, and environmental design, suggesting habit formation involves more than just willpower.',
      },
      {
        id: 'p4-q5',
        type: 'gap-fill',
        question: 'Complete the sentences using words from the passage.',
        blanks: ['automatic', 'cue', 'reward', 'context-dependent'],
        correctAnswer: ['automatic', 'cue', 'reward', 'context-dependent'],
        explanation: 'These keywords are central to the passage\'s explanation of how habits work.',
      },
    ],
    difficulty: 'easy',
    wordCount: 360,
    estimatedMinutes: 18,
  },
]
