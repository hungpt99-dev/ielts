import type { IeltsTopic } from '@ielts/storage'

const now = '2025-01-01T00:00:00.000Z'

export const IELTS_TOPICS_PACK_ID = 'ielts-topics-v1'

export const BUILT_IN_IELTS_TOPICS: IeltsTopic[] = [
  { id: 'built-in-topic-education', name: 'Education', description: 'Schools, universities, learning methods, and education systems', skill: 'general', tags: ['education', 'academic'], color: '#4A90D9', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-technology', name: 'Technology', description: 'Digital transformation, internet, AI, and technological advances', skill: 'general', tags: ['technology', 'innovation'], color: '#7B68EE', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-environment', name: 'Environment', description: 'Climate change, pollution, conservation, and sustainability', skill: 'general', tags: ['environment', 'science'], color: '#2ECC71', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-health', name: 'Health', description: 'Healthcare, fitness, nutrition, and public health issues', skill: 'general', tags: ['health', 'wellness'], color: '#E74C3C', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-work', name: 'Work', description: 'Employment, careers, workplace dynamics, and labor market', skill: 'general', tags: ['work', 'career'], color: '#F39C12', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-business', name: 'Business', description: 'Commerce, entrepreneurship, management, and economics', skill: 'general', tags: ['business', 'economy'], color: '#1ABC9C', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-travel', name: 'Travel', description: 'Tourism, cultural exchange, and travel experiences', skill: 'general', tags: ['travel', 'culture'], color: '#3498DB', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-culture', name: 'Culture', description: 'Traditions, arts, customs, and cultural diversity', skill: 'general', tags: ['culture', 'arts'], color: '#9B59B6', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-society', name: 'Society', description: 'Social structures, community, and demographic changes', skill: 'general', tags: ['society', 'community'], color: '#E67E22', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-crime', name: 'Crime', description: 'Law enforcement, justice system, and crime prevention', skill: 'general', tags: ['crime', 'law'], color: '#C0392B', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-government', name: 'Government', description: 'Politics, public policy, and governance', skill: 'general', tags: ['government', 'politics'], color: '#2C3E50', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-media', name: 'Media', description: 'News, journalism, social media, and mass communication', skill: 'general', tags: ['media', 'communication'], color: '#E91E63', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-globalization', name: 'Globalization', description: 'Global interconnectedness, trade, and international relations', skill: 'general', tags: ['globalization', 'international'], color: '#00BCD4', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-family', name: 'Family', description: 'Family structures, parenting, and intergenerational relationships', skill: 'general', tags: ['family', 'relationships'], color: '#FF5722', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-housing', name: 'Housing', description: 'Urban development, accommodation, and city planning', skill: 'general', tags: ['housing', 'urban'], color: '#795548', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-transport', name: 'Transport', description: 'Public transport, infrastructure, and mobility solutions', skill: 'general', tags: ['transport', 'infrastructure'], color: '#607D8B', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-art', name: 'Art', description: 'Visual arts, music, literature, and creative expression', skill: 'general', tags: ['art', 'creativity'], color: '#FF9800', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-sports', name: 'Sports', description: 'Athletics, fitness, competition, and recreational activities', skill: 'general', tags: ['sports', 'fitness'], color: '#4CAF50', createdAt: now, updatedAt: now },
  { id: 'built-in-topic-science', name: 'Science', description: 'Scientific research, discoveries, and technological innovation', skill: 'general', tags: ['science', 'research'], color: '#2196F3', createdAt: now, updatedAt: now },
]
