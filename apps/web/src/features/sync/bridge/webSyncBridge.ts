import { BRIDGE_NAMESPACE } from './extensionBridge.types'
import { DatabaseService } from '../../../services/storage/Database'
import { loadAppSettings } from '../../../services/storage/SettingsStorage'

let initialized = false
function init(): void {
  if (initialized) return
  initialized = true
  window.addEventListener('message', handleIncomingSync)
}

async function handleIncomingSync(event: MessageEvent): Promise<void> {
  try {
    const msg = event.data
    if (!msg || typeof msg !== 'object') return
    if (msg.namespace !== BRIDGE_NAMESPACE) return
    if (msg.source !== 'content-script') return
    if (typeof msg.requestId !== 'string') return

    console.log('[WebSyncBridge] Received:', msg.type)

    if (msg.type === 'IMPORT_EXTENSION_DATA') {
      const data = msg.payload as Record<string, unknown> | undefined
      if (!data) { console.warn('[WebSyncBridge] IMPORT_EXTENSION_DATA: no payload'); return }

      const existingVocab = await DatabaseService.getAll<Record<string, unknown>>('vocabulary')
      const existingIds = new Set(existingVocab.map(v => v.id as string))

      const vocabList = data.vocabulary as Record<string, unknown>[] | undefined
      if (Array.isArray(vocabList)) {
        const normalized = vocabList.map(v => ({
          id: v.id,
          word: (v.word as string) || (v.sourceSentence as string)?.split(/\s+/)[0] || 'unknown',
          meaning: (v.meaning as string) || (v.sourceSentence as string) || (v.word as string) || '',
          meaningVi: (v.meaningVi as string) || '',
          pronunciation: (v.pronunciation as string) || '',
          partOfSpeech: (v.partOfSpeech as string) || '',
          topic: (v.topic as string) || 'general',
          exampleSentence: (v.exampleSentence as string) || (v.sourceSentence as string) || '',
          collocations: Array.isArray(v.collocations) ? v.collocations as string[] : [],
          synonyms: Array.isArray(v.synonyms) ? v.synonyms as string[] : [],
          antonyms: Array.isArray(v.antonyms) ? v.antonyms as string[] : [],
          wordFamily: Array.isArray(v.wordFamily) ? v.wordFamily as string[] : [],
          personalNote: (v.personalNote as string) || '',
          difficulty: ((v.difficulty as string) || 'medium') as 'easy' | 'medium' | 'hard',
          status: ((v.status as string) || 'new') as 'new' | 'learning' | 'reviewing' | 'mastered',
          tags: Array.isArray(v.tags) ? v.tags as string[] : [],
          createdAt: (v.createdAt as string) || new Date().toISOString(),
          updatedAt: (v.updatedAt as string) || new Date().toISOString(),
        }))
        const newVocab = normalized.filter(v => !existingIds.has(v.id as string))
        if (newVocab.length > 0) {
          await DatabaseService.bulkAdd('vocabulary', newVocab as never[]).catch(() => {})
          window.dispatchEvent(new CustomEvent('vocabulary-changed'))
        }
      }

      const mistakesList = data.mistakes as Record<string, unknown>[] | undefined
      if (Array.isArray(mistakesList)) {
        const existingMistakes = await DatabaseService.getAll<Record<string, unknown>>('mistakes')
        const existingMistakeIds = new Set(existingMistakes.map(m => m.id as string))
        const newMistakes = mistakesList.filter(m => !existingMistakeIds.has(m.id as string))
        if (newMistakes.length > 0) {
          await DatabaseService.bulkAdd('mistakes', newMistakes as never[]).catch(() => {})
        }
      }
      return
    }

    if (msg.type === 'EXPORT_EXTENSION_DATA') {
      const [vocabEntries, mistakeEntries] = await Promise.all([
        DatabaseService.getAll<Record<string, unknown>>('vocabulary').catch(() => []),
        DatabaseService.getAll<Record<string, unknown>>('mistakes').catch(() => []),
      ])

      const settings = loadAppSettings()

      window.postMessage(
        {
          namespace: BRIDGE_NAMESPACE,
          type: 'EXPORT_EXTENSION_DATA_RESPONSE',
          requestId: msg.requestId,
          source: 'web',
          createdAt: new Date().toISOString(),
          success: true,
          payload: {
            vocabulary: vocabEntries,
            mistakes: mistakeEntries,
            settings: {
              aiProvider: settings.aiProvider || 'openai',
              aiModel: settings.aiModel || 'gpt-4o-mini',
              aiBaseUrl: settings.aiBaseUrl || settings.aiEndpoint || '',
              aiApiKey: settings.aiApiKey || '',
              themeMode: settings.darkMode ? 'dark' : 'light',
            },
          },
        },
        window.location.origin,
      )
    }
  } catch (err) {
    console.error('[WebSyncBridge] Error:', err)
  }
}

init()
