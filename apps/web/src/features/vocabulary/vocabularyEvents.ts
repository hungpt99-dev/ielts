const VOCABULARY_CHANGED = 'vocabulary-changed'

export function onVocabularyChanged(callback: () => void): () => void {
  window.addEventListener(VOCABULARY_CHANGED, callback)
  return () => window.removeEventListener(VOCABULARY_CHANGED, callback)
}

export function emitVocabularyChanged(): void {
  window.dispatchEvent(new CustomEvent(VOCABULARY_CHANGED))
}
