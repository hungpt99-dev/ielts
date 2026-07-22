import { DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER_ID } from '@ielts/config'
import { BRIDGE_NAMESPACE } from './extensionBridge.types'
import { vocabularyRepo, mistakeRepo, studyNoteRepo, passageEntryRepo, artifactRepo } from '../../../services/repositories'
import { getLearningEngine } from '../../../services/engineBootstrap'
import { STORAGE_KEYS } from '@ielts/config'

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

      console.log('[WebSyncBridge] IMPORT_EXTENSION_DATA received, keys:', Object.keys(data))

      const existingVocab = await vocabularyRepo.findAll()
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
          await vocabularyRepo.bulkCreate(newVocab as any[]).catch(() => {})
          window.dispatchEvent(new CustomEvent('vocabulary-changed'))
        }
      }

      const mistakesList = data.mistakes as Record<string, unknown>[] | undefined
      if (Array.isArray(mistakesList)) {
        const existingMistakes = await mistakeRepo.findAll()
        const existingMistakeIds = new Set(existingMistakes.map(m => m.id as string))
        const newMistakes = mistakesList.filter(m => !existingMistakeIds.has(m.id as string))
        if (newMistakes.length > 0) {
          await mistakeRepo.bulkCreate(newMistakes as any[]).catch(() => {})
        }
      }

      const entriesList = data.learningEntries as Record<string, unknown>[] | undefined
      if (Array.isArray(entriesList)) {
        const existingNotes = await studyNoteRepo.findAll()
        const existingNoteIds = new Set(existingNotes.map(n => n.id as string))
        const existingPassages = await passageEntryRepo.findAll().catch(() => [] as Record<string, unknown>[])
        const existingPassageIds = new Set(existingPassages.map(p => p.id as string))

        for (const entry of entriesList) {
          const id = entry.id as string
          if (entry.category === 'reading') {
            if (!existingPassageIds.has(id)) {
              await passageEntryRepo.create({
                id,
                title: entry.pageTitle || entry.topic || 'Saved from extension',
                content: entry.text as string,
                source: 'user-created',
                topic: entry.topic || 'general',
                skill: 'reading',
                pageTitle: entry.pageTitle as string,
                pageUrl: entry.pageUrl as string,
                tags: Array.isArray(entry.tags) ? entry.tags as string[] : [],
                personalNote: (entry.personalNote as string) || '',
                difficulty: (entry.difficulty as string) || '',
                status: (entry.status as string) || 'new',
                createdAt: (entry.createdAt as string) || new Date().toISOString(),
                updatedAt: (entry.updatedAt as string) || new Date().toISOString(),
              }).catch(() => {})
              const engine = getLearningEngine()
              if (engine) {
                engine.saveExercise({
                  id,
                  sessionId: '', skill: 'reading', exerciseType: 'comprehension', objectiveId: '',
                  title: entry.pageTitle || entry.topic || 'Saved from extension',
                  instructions: '',
                  content: { passage: entry.text as string },
                  questions: [],
                  difficulty: (entry.difficulty as string) === 'easy' || (entry.difficulty as string) === 'beginner' ? 'easy' : (entry.difficulty as string) === 'hard' || (entry.difficulty as string) === 'advanced' ? 'hard' : 'medium',
                  estimatedMinutes: Math.max(1, Math.ceil(((entry.text as string) || '').split(/\s+/).length / 80)),
                  sourceType: 'saved-content',
                  sourceIds: [id],
                  explanationPolicy: 'after-attempt',
                  evaluationPolicy: 'deterministic',
                  metadata: { focusAreas: [], contextSnapshotHash: '', schemaVersion: '1.0' },
                } as any).catch(() => {})
              }
              existingPassageIds.add(id)
            }
          } else {
            if (!existingNoteIds.has(id)) {
              await studyNoteRepo.create({
                id,
                text: entry.text as string,
                category: entry.category as string,
                topic: entry.topic || '',
                skill: entry.skill || 'general',
                tags: Array.isArray(entry.tags) ? entry.tags as string[] : [],
                personalNote: (entry.personalNote as string) || '',
                pageTitle: entry.pageTitle as string,
                pageUrl: entry.pageUrl as string,
                status: (entry.status as string) || 'new',
                createdAt: (entry.createdAt as string) || new Date().toISOString(),
                updatedAt: (entry.updatedAt as string) || new Date().toISOString(),
              } as any).catch(() => {})
              existingNoteIds.add(id)
            }
          }
        }
      }

      const articlesList = data.articles as Record<string, unknown>[] | undefined
      if (Array.isArray(articlesList)) {
        console.log('[WebSyncBridge] Received', articlesList.length, 'articles from extension')
        const existingPassages = await passageEntryRepo.findAll().catch(() => [] as Record<string, unknown>[])
        const existingPassageIds = new Set(existingPassages.map(p => p.id as string))
        for (const article of articlesList) {
          const id = article.id as string
          if (!existingPassageIds.has(id)) {
            console.log('[WebSyncBridge] Saving article:', (article.title as string)?.slice(0, 50))
            await passageEntryRepo.create({
              id,
              title: (article.title as string) || (article.pageTitle as string) || 'Article',
              content: (article.content as string) || (article.text as string) || '',
              source: 'user-created',
              topic: article.topic || 'general',
              skill: 'reading',
              pageTitle: article.pageTitle as string,
              pageUrl: article.pageUrl as string,
              tags: Array.isArray(article.tags) ? article.tags as string[] : [],
              difficulty: '',
              status: 'new',
              createdAt: (article.createdAt as string) || new Date().toISOString(),
              updatedAt: (article.updatedAt as string) || new Date().toISOString(),
            }).catch(() => {})
            const engine = getLearningEngine()
            if (engine) {
              const artText = (article.content as string) || (article.text as string) || ''
              engine.saveExercise({
                id,
                sessionId: '', skill: 'reading', exerciseType: 'comprehension', objectiveId: '',
                title: (article.title as string) || (article.pageTitle as string) || 'Article',
                instructions: '',
                content: { passage: artText },
                questions: [],
                difficulty: 'medium',
                estimatedMinutes: Math.max(1, Math.ceil(artText.split(/\s+/).length / 80)),
                sourceType: 'saved-content',
                sourceIds: [id],
                explanationPolicy: 'after-attempt',
                evaluationPolicy: 'deterministic',
                metadata: { focusAreas: [], contextSnapshotHash: '', schemaVersion: '1.0' },
              } as any).catch(() => {})
            }
            existingPassageIds.add(id)
          }
        }
      }
      const artifactsList = data.artifacts as Record<string, unknown>[] | undefined
      if (Array.isArray(artifactsList)) {
        console.log('[WebSyncBridge] Received', artifactsList.length, 'artifacts from extension')
        const existingArtifacts = await artifactRepo.findAll().catch(() => [] as Record<string, unknown>[])
        const existingArtifactIds = new Set(existingArtifacts.map(a => a.id as string))
        for (const artifact of artifactsList) {
          const id = artifact.id as string
          if (!existingArtifactIds.has(id)) {
            await artifactRepo.create({
              id,
              url: (artifact.url as string) || (artifact.pageUrl as string) || '',
              title: (artifact.title as string) || 'Untitled',
              description: (artifact.description as string) || '',
              favicon: (artifact.favicon as string) || '',
              tags: Array.isArray(artifact.tags) ? artifact.tags as string[] : [],
              isFavorite: !!artifact.isFavorite,
              category: (artifact.category as string) || 'article',
              source: (artifact.source as string) || 'extension',
              contentType: (artifact.contentType as string) || 'article',
              contentText: (artifact.contentText as string) || (artifact.content as string) || '',
              wordCount: (artifact.wordCount as number) || 0,
              readingStatus: (artifact.readingStatus as string) || 'unread',
              personalNote: (artifact.personalNote as string) || '',
              createdAt: (artifact.createdAt as string) || new Date().toISOString(),
              updatedAt: (artifact.updatedAt as string) || new Date().toISOString(),
            }).catch(() => {})
            existingArtifactIds.add(id)
          }
        }
      }
      return
    }

    if (msg.type === 'EXPORT_EXTENSION_DATA') {
      const [vocabEntries, mistakeEntries, noteEntries, passageEntries, artifactEntries] = await Promise.all([
        vocabularyRepo.findAll().catch(() => []),
        mistakeRepo.findAll().catch(() => []),
        studyNoteRepo.findAll().catch(() => []),
        passageEntryRepo.findAll().catch(() => []),
        artifactRepo.findAll().catch(() => []),
      ])

      const settings = (() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
          return raw ? JSON.parse(raw) : {}
        } catch { return {} }
      })()

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
            learningEntries: noteEntries,
            articles: passageEntries,
            artifacts: artifactEntries,
            settings: {
              aiProvider: settings.aiProvider || DEFAULT_AI_PROVIDER_ID,
              aiModel: settings.aiModel || DEFAULT_AI_MODEL,
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
