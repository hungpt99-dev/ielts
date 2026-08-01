import { describe, it, expect, beforeEach } from 'vitest'
import { createVocabularyEngine } from '../orchestration/vocabulary-engine'
import { InMemoryVocabularyRepository, InMemoryVocabReviewRepository } from '../infrastructure/in-memory-repositories'

describe('VocabularyEngine facade', () => {
  let engine: ReturnType<typeof createVocabularyEngine>

  beforeEach(() => {
    engine = createVocabularyEngine({
      vocabularyRepository: new InMemoryVocabularyRepository(),
      vocabReviewRepository: new InMemoryVocabReviewRepository(),
    })
  })

  it('adds and retrieves words', async () => {
    await engine.addWord({ word: 'resilient', meaning: 'able to recover quickly', topic: 'character' })
    const all = await engine.getAllWords()
    expect(all).toHaveLength(1)
    expect(all[0].word).toBe('resilient')
  })

  it('deduplicates words on addWord by case-insensitive word', async () => {
    await engine.addWord({ word: 'Resilient', meaning: 'first', topic: 't' })
    const second = await engine.addWord({ word: 'resilient', meaning: 'second', topic: 't' })
    const all = await engine.getAllWords()
    expect(all).toHaveLength(1)
    expect(second.meaning).toBe('second')
  })

  it('rates a word and updates status', async () => {
    const word = await engine.addWord({ word: 'persist', meaning: 'continue firmly', topic: 'effort' })
    const result = await engine.rateWord(word, 'again')
    expect(result.vocab.status).toBe('learning')
    expect(await engine.getDueCount()).toBeGreaterThanOrEqual(0)
  })

  it('builds relationships for the knowledge graph', async () => {
    await engine.addWord({ word: 'happy', topic: 'emotion', synonyms: ['joyful'] })
    await engine.addWord({ word: 'joyful', topic: 'emotion' })
    const rels = await engine.getRelationships()
    expect(rels.some(r => r.sourceWord === 'happy' && r.relationshipType === 'synonym')).toBe(true)
  })

  it('generates exercises from saved words', async () => {
    await engine.addWord({ word: 'sustainable', meaning: 'm', topic: 'environment' })
    await engine.addWord({ word: 'pollution', meaning: 'm', topic: 'environment' })
    const all = await engine.getAllWords()
    const prompts = engine.generateExercises(all, 1)
    expect(prompts).toHaveLength(1)
    expect(prompts[0].wordsToUse).toContain('sustainable')
  })

  it('returns word detail with related words', async () => {
    await engine.addWord({ word: 'happy', topic: 'emotion', synonyms: ['joyful'] })
    await engine.addWord({ word: 'joyful', topic: 'emotion' })
    const all = await engine.getAllWords()
    const detail = await engine.getWordDetail(all[0].id)
    expect(detail?.relatedWords).toEqual([
      { word: 'joyful', relationshipType: 'synonym' },
    ])
  })
})
