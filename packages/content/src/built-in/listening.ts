import type { ListeningTranscript } from '@ielts/storage'

const now = '2025-01-01T00:00:00.000Z'

export const LISTENING_TRANSCRIPTS_PACK_ID = 'listening-transcripts-v1'

export const BUILT_IN_LISTENING_TRANSCRIPTS: ListeningTranscript[] = [
  {
    id: 'built-in-listening-education-1',
    title: 'University Orientation Talk',
    transcript: 'Good morning and welcome to university orientation. Today I will be talking about the facilities available on campus and some important information for new students. First, let me tell you about the library. The main library is open from 8 AM to 10 PM on weekdays, and from 9 AM to 5 PM on weekends. Please note that the library closes at 5:30 PM on Saturdays. Your student ID card gives you access to all library services. The student union building is located next to the cafeteria and offers various services including academic support, career counseling, and social activities. There is also a computer lab available 24 hours a day using your student ID card for entry. Finally, I would like to remind all students that registration for extracurricular activities closes at the end of the first week.',
    source: 'built-in',
    topic: 'Education',
    difficulty: 'easy',
    tags: ['education', 'orientation', 'university'],
    isFavorite: false,
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'built-in-listening-environment-1',
    title: 'Environmental Science Lecture',
    transcript: 'Today we will discuss the relationship between traffic density and air quality in urban environments. Recent studies have shown a strong correlation between vehicle emissions and the concentration of particulate matter in the air. Specifically, the correlation between traffic density and particulate matter concentration was found to be statistically significant at the 95 percent confidence level. Nitrogen dioxide levels were particularly high in areas with heavy traffic during peak hours. Researchers used data collection methodology that included both stationary monitoring stations and mobile sensors. The findings suggest that reducing traffic volume could significantly improve urban air quality, though further research is needed to understand the full impact of other contributing factors.',
    source: 'built-in',
    topic: 'Environment',
    difficulty: 'hard',
    tags: ['environment', 'science', 'academic'],
    isFavorite: false,
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'built-in-listening-technology-1',
    title: 'Technology Podcast Interview',
    transcript: 'Welcome to Tech Talk. Today we are joined by Dr. Sarah Chen, a professor of digital media at the University of Technology. Dr. Chen, thank you for joining us. Thank you, it is a pleasure to be here. So, let us start with social media. How has it changed the way we consume news? Well, social media has fundamentally altered news consumption. People now get their news from platforms like Twitter and Facebook rather than traditional newspapers. This has both positive and negative implications. On the positive side, news spreads faster and reaches more people. On the negative side, misinformation can spread just as quickly. What advice would you give to young people about using social media? I would recommend being critical about sources and always verifying information before sharing it.',
    source: 'built-in',
    topic: 'Technology',
    difficulty: 'medium',
    tags: ['technology', 'media', 'interview'],
    isFavorite: false,
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
]
