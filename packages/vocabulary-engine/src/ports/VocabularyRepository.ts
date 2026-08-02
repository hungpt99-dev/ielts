import type { CefrLevel, LifecyclePhase } from '../domain/constants'
import type { VocabularyState, Word } from '../domain/entities'

export interface VocabularyRepository {
  getWord(wordId: string): Promise<Word | null>
  saveWord(word: Word): Promise<void>
  deleteWord(wordId: string): Promise<void>
  getWordsByIds(wordIds: string[]): Promise<Word[]>
  saveWords(words: Word[]): Promise<void>

  getVocabularyState(wordId: string): Promise<VocabularyState | null>
  saveVocabularyState(state: VocabularyState): Promise<void>
  deleteVocabularyState(wordId: string): Promise<void>
  getVocabularyStates(wordIds: string[]): Promise<VocabularyState[]>
  saveVocabularyStates(states: VocabularyState[]): Promise<void>

  countWordsByTopic(): Promise<Record<string, number>>
  countWordsByCefrLevel(): Promise<Partial<Record<CefrLevel, number>>>
  countWordsByLifecycle(): Promise<Record<LifecyclePhase, number>>
}
