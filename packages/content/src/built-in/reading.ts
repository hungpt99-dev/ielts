import type { ReadingPassage } from '@ielts/storage'

const now = '2025-01-01T00:00:00.000Z'

export const READING_PASSAGES_PACK_ID = 'reading-passages-v1'

export const BUILT_IN_READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'built-in-reading-education-1',
    title: 'Education Systems Around the World',
    content: 'Education systems vary significantly across different countries. In Finland, for example, students do not take standardized tests until later in their academic careers. The focus is on collaborative learning and critical thinking rather than rote memorization. This approach has yielded impressive results, with Finnish students consistently ranking among the top in international assessments. In contrast, many Asian education systems, such as those in South Korea and Japan, emphasize rigorous testing and academic competition from an early age. While this produces high academic achievement, critics argue that it can lead to excessive stress and a lack of creativity. The debate between these two approaches continues to shape education policy worldwide.',
    source: 'built-in',
    topic: 'Education',
    difficulty: 'medium',
    wordCount: 120,
    tags: ['education', 'comparison', 'academic'],
    isFavorite: false,
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'built-in-reading-environment-1',
    title: 'Climate Change and Renewable Energy',
    content: 'Climate change is one of the most pressing challenges facing humanity today. Rising global temperatures, melting polar ice caps, and extreme weather events are clear indicators of this phenomenon. In response, many countries have committed to reducing their carbon emissions and transitioning to renewable energy sources such as solar, wind, and hydroelectric power. However, the transition faces significant obstacles, including the high initial cost of renewable infrastructure and the intermittent nature of some renewable sources. Despite these challenges, technological advancements in energy storage and grid management are making renewable energy increasingly viable. Experts suggest that a combination of policy support, technological innovation, and public awareness is essential for a successful transition to a sustainable energy future.',
    source: 'built-in',
    topic: 'Environment',
    difficulty: 'medium',
    wordCount: 135,
    tags: ['environment', 'energy', 'climate'],
    isFavorite: false,
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'built-in-reading-technology-1',
    title: 'The Impact of Technology on Communication',
    content: 'Technology has fundamentally transformed the way people communicate in modern society. From the invention of the telegraph to the rise of social media platforms, each technological advancement has brought people closer together while simultaneously creating new challenges. The internet and smartphones have made instant communication possible across vast distances, enabling real-time collaboration and connection. However, concerns have been raised about the quality of these interactions, with critics arguing that digital communication lacks the nuance and depth of face-to-face conversation. The rise of remote work, online education, and virtual social events during recent global events has accelerated these trends, making it clear that digital communication is here to stay while highlighting the need for balance.',
    source: 'built-in',
    topic: 'Technology',
    difficulty: 'easy',
    wordCount: 140,
    tags: ['technology', 'communication', 'society'],
    isFavorite: false,
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
]

export const BUILT_IN_READING_PASSAGES_PACK = {
  id: READING_PASSAGES_PACK_ID,
  name: 'Built-in Reading Passages',
  description: 'Sample IELTS reading passages across common topics',
  version: 1,
  items: BUILT_IN_READING_PASSAGES,
}
