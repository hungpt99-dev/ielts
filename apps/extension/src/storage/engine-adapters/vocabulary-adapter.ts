import type { VocabularyRepository, VocabularyEntry } from '@ielts/learning-engine'
import { safeStorageGet, safeStorageSet } from '../../utils/safe-chrome'

const VOCAB_KEY = 'engine-vocabulary'

async function getAll(): Promise<VocabularyEntry[]> {
  const result = await safeStorageGet<VocabularyEntry[]>(VOCAB_KEY)
  return result[VOCAB_KEY] ?? []
}

export const extensionVocabularyRepository: VocabularyRepository = {
  async getDueForReview(limit = 10) {
    const all = await getAll()
    const now = new Date().toISOString()
    return all.filter(v => v.dueForReview && (!v.lastReviewedAt || v.lastReviewedAt <= now)).slice(0, limit)
  },

  async getByTopic(topic: string) {
    const all = await getAll()
    return all.filter(v => v.topic === topic)
  },

  async updateMastery(wordId: string, mastery: number) {
    const all = await getAll()
    const entry = all.find(v => v.id === wordId)
    if (entry) {
      entry.mastery = mastery
      await safeStorageSet({ [VOCAB_KEY]: all })
    }
  },

  async markReviewed(wordId: string) {
    const all = await getAll()
    const entry = all.find(v => v.id === wordId)
    if (entry) {
      entry.lastReviewedAt = new Date().toISOString()
      entry.dueForReview = false
      await safeStorageSet({ [VOCAB_KEY]: all })
    }
  },
}
