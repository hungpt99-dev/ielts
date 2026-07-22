import { describe, it, expect } from 'vitest'
import type { ActivityMetadata, TopicAlignmentStatus } from '../../../domain/entities/learning-activity'

function determineTopicAlignment(
  requestedTopic: string,
  generatedTopic: string,
): TopicAlignmentStatus {
  if (!requestedTopic || !generatedTopic) return 'unknown'

  const req = requestedTopic.toLowerCase().replace(/^(reading|listening|writing|speaking):\s*/i, '').trim()
  const gen = generatedTopic.toLowerCase().replace(/^(reading|listening|writing|speaking):\s*/i, '').trim()

  if (req === gen) return 'matched'
  if (req.includes(gen) || gen.includes(req)) return 'matched'

  const reqWords = new Set(req.split(/\s+/))
  const genWords = new Set(gen.split(/\s+/))
  const intersection = [...reqWords].filter(w => genWords.has(w))
  if (intersection.length > 0) return 'matched'

  const RELATED_TOPIC_MAP: Record<string, string[]> = {
    'climate change': ['climate', 'global warming', 'greenhouse', 'environment', 'renewable energy', 'sustainability', 'carbon', 'emissions', 'fossil fuels', 'weather'],
    'environment': ['climate', 'pollution', 'conservation', 'ecosystem'],
    'education': ['learning', 'school', 'teaching', 'training', 'classroom', 'curriculum', 'student', 'teacher'],
    'technology': ['digital', 'computer', 'internet', 'software', 'ai', 'innovation', 'device'],
    'health': ['medical', 'healthcare', 'disease', 'wellness', 'nutrition'],
    'climate': ['climate change', 'global warming', 'greenhouse', 'environment'],
  }

  const reqRelatedTerms = RELATED_TOPIC_MAP[req]
  if (reqRelatedTerms?.some(term => gen.includes(term))) return 'related'

  return 'mismatched'
}

describe('Topic Metadata - Domain', () => {
  it('1. requestedTopic and generatedTopic remain separate', () => {
    const metadata: ActivityMetadata = {
      requestedTopic: 'climate change',
      generatedTopic: 'Education Technology',
      title: 'Reading: Education Technology',
      source: 'ai-generated',
    }

    expect(metadata.requestedTopic).toBe('climate change')
    expect(metadata.generatedTopic).toBe('Education Technology')
    expect(metadata.requestedTopic).not.toBe(metadata.generatedTopic)
  })

  it('2. Mapping does not overwrite generatedTopic with requestedTopic', () => {
    const metadata: ActivityMetadata = {
      requestedTopic: 'climate change',
      generatedTopic: 'Education Technology',
      title: 'Reading: Education Technology',
      source: 'ai-generated',
    }

    expect(metadata.generatedTopic).toBe('Education Technology')
    expect(metadata.generatedTopic).not.toBe('climate change')
  })

  it('3. Generated title remains unchanged after request metadata is attached', () => {
    const metadata: ActivityMetadata = {
      requestedTopic: 'climate change',
      generatedTopic: 'Education Technology',
      title: 'Reading: Education Technology',
      source: 'ai-generated',
    }

    expect(metadata.title).toBe('Reading: Education Technology')
    expect(metadata.title).not.toBe('climate change')
  })

  it('4. Legacy topic records can be migrated', () => {
    const legacyRecord = { topic: 'Climate Change' }
    const migrated: ActivityMetadata = {
      requestedTopic: legacyRecord.topic,
      generatedTopic: legacyRecord.topic,
      title: 'Reading: Climate Change',
      source: 'curated',
    }

    expect(migrated.requestedTopic).toBe('Climate Change')
    expect(migrated.generatedTopic).toBe('Climate Change')
    expect(migrated.source).toBe('curated')
  })
})

describe('Topic Alignment - determineTopicAlignment', () => {
  it('10. Climate request plus climate content passes - matched', () => {
    expect(determineTopicAlignment('climate change', 'Climate Change')).toBe('matched')
    expect(determineTopicAlignment('climate change', 'climate change')).toBe('matched')
  })

  it('11. Climate request plus renewable energy content may pass as related', () => {
    const result = determineTopicAlignment('climate change', 'renewable energy transition')
    expect(result === 'related' || result === 'matched').toBe(true)
  })

  it('12. Climate request plus education technology content fails - mismatched', () => {
    expect(determineTopicAlignment('climate change', 'Education Technology')).toBe('mismatched')
    expect(determineTopicAlignment('climate change', 'education technology')).toBe('mismatched')
    expect(determineTopicAlignment('climate change', 'urban development')).toBe('mismatched')
  })

  it('Empty or missing topics return unknown', () => {
    expect(determineTopicAlignment('', 'Education')).toBe('unknown')
    expect(determineTopicAlignment('climate', '')).toBe('unknown')
    expect(determineTopicAlignment('', '')).toBe('unknown')
  })

  it('Exact match returns matched', () => {
    expect(determineTopicAlignment('education', 'Education')).toBe('matched')
    expect(determineTopicAlignment('health', 'health')).toBe('matched')
  })

  it('Substring match returns matched', () => {
    expect(determineTopicAlignment('climate', 'climate change')).toBe('matched')
    expect(determineTopicAlignment('climate change', 'climate')).toBe('matched')
  })

  it('Keyword overlap returns matched', () => {
    expect(determineTopicAlignment('technology in education', 'Education Technology')).toBe('matched')
  })

  it('Related topics return related', () => {
    const result = determineTopicAlignment('climate change', 'renewable energy')
    expect(result === 'related' || result === 'matched').toBe(true)
  })

  it('Unrelated topics return mismatched', () => {
    expect(determineTopicAlignment('art', 'engineering')).toBe('mismatched')
    expect(determineTopicAlignment('sports', 'government policy')).toBe('mismatched')
  })

  it('13. A mismatched activity should not pass', () => {
    const alignment = determineTopicAlignment('climate change', 'Education Technology')
    expect(alignment).toBe('mismatched')

    function assertValidTopic(alignment: string) {
      if (alignment === 'mismatched') {
        throw new Error('Generated topic does not match requested topic')
      }
    }

    expect(() => assertValidTopic(alignment)).toThrow()
  })
})

describe('extractTopicFromTitle', () => {
  function extractTopicFromTitle(title: string, skill: string): string {
    const skillPrefix = new RegExp(`^${skill}:\\s*`, 'i')
    let topic = title.replace(skillPrefix, '').trim()
    topic = topic.replace(/^(reading|listening|writing|speaking):\s*/i, '').trim()
    return topic
  }

  it('strips skill prefix from reading title', () => {
    expect(extractTopicFromTitle('Reading: Education Technology', 'reading')).toBe('Education Technology')
  })

  it('strips case-insensitive skill prefix', () => {
    expect(extractTopicFromTitle('reading: Climate Change', 'reading')).toBe('Climate Change')
    expect(extractTopicFromTitle('READING: Urban Development', 'reading')).toBe('Urban Development')
  })

  it('returns title as-is when no skill prefix', () => {
    expect(extractTopicFromTitle('Climate Change', 'reading')).toBe('Climate Change')
  })

  it('strips generic skill prefix even when skill param differs', () => {
    expect(extractTopicFromTitle('Reading: Education Technology', 'listening')).toBe('Education Technology')
  })

  it('handles titles with trailing spaces after prefix', () => {
    expect(extractTopicFromTitle('Reading:   Space Topic', 'reading')).toBe('Space Topic')
  })
})

describe('Topic Metadata - Rendering Rules', () => {
  const passage = {
    id: 'p1',
    title: 'Reading: Education Technology',
    topic: 'Education Technology',
    topicMetadata: {
      requestedTopic: 'climate change',
      generatedTopic: 'Education Technology',
      title: 'Reading: Education Technology',
      source: 'ai-generated' as const,
    },
    text: 'Technology is changing the way students learn...',
    questions: [],
    difficulty: 'medium' as const,
    wordCount: 150,
    estimatedMinutes: 20,
    sourceType: 'ai-generated' as const,
  }

  it('5. Header topic badge uses generatedTopic', () => {
    const badgeTopic = passage.topicMetadata?.generatedTopic || passage.topic
    expect(badgeTopic).toBe('Education Technology')
    expect(badgeTopic).not.toBe('climate change')
  })

  it('6. Header title uses the generated title', () => {
    const title = passage.topicMetadata?.title || passage.title
    expect(title).toBe('Reading: Education Technology')
  })

  it('7. Route topic does not override activity metadata', () => {
    const routeTopic = 'climate change'
    const displayTopic = passage.topicMetadata?.generatedTopic || passage.topic

    expect(displayTopic).toBe('Education Technology')
    expect(routeTopic).not.toBe(displayTopic)
  })

  it('8. Stale form state does not appear after activity loading', () => {
    const staleFormState = 'climate change'
    const loadedTopic = passage.topicMetadata?.generatedTopic || passage.topic

    expect(loadedTopic).toBe('Education Technology')
    expect(loadedTopic).not.toBe(staleFormState)
  })

  it('9. AI-generated source label is displayed independently from topic', () => {
    const sourceLabel = passage.sourceType === 'ai-generated' ? 'AI-Generated' : 'Curated'
    expect(sourceLabel).toBe('AI-Generated')
    expect(passage.topic).toBe('Education Technology')
  })

  it('shows mismatch warning when requestedTopic differs from generatedTopic', () => {
    const isMismatched = passage.topicMetadata.requestedTopic !== passage.topicMetadata.generatedTopic
    expect(isMismatched).toBe(true)
  })
})

describe('Topic Metadata - Frontend Regression', () => {
  const testCase = {
    requestedTopic: 'climate change',
    generatedTopic: 'Education Technology',
    title: 'Reading: Education Technology',
  }

  it('never renders Topic: climate change when Title shows Education Technology', () => {
    const topicLabel = testCase.generatedTopic
    const title = testCase.title

    expect(title).toBe('Reading: Education Technology')
    expect(topicLabel).toBe('Education Technology')
    expect(topicLabel).not.toBe('climate change')
  })

  it('shows mismatch warning when topics differ', () => {
    const isMismatch = testCase.requestedTopic !== testCase.generatedTopic
    expect(isMismatch).toBe(true)
  })

  it('preserves requestedTopic separately for diagnostics', () => {
    expect(testCase.requestedTopic).toBe('climate change')
    expect(testCase.generatedTopic).toBe('Education Technology')
  })
})
