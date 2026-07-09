import type { VocabularyEntry, MistakeEntry } from '../../models'
import { DatabaseService } from '../storage/Database'
import { loadAppSettings } from '../storage/SettingsStorage'
import { sendLatestVocabToExtension } from '../storage/VocabularySync'
import { initSyncResponseListener, requestExtensionData, pushSettingsToExtension } from './SyncProtocol'
import { mapExtensionVocabToWeb, mapExtensionMistakeToWeb, mapWebSettingsToPatch } from './SyncMapper'
import type { ExtensionDataResponse } from './SyncProtocol'

export type SyncPhase = 'idle' | 'pushing_settings' | 'pushing_vocab' | 'requesting_extension' | 'importing' | 'complete'
export type SyncResult = 'success' | 'partial' | 'error'

export interface SyncProgress {
  phase: SyncPhase
  result: SyncResult | null
  syncedVocabCount: number
  syncedMistakeCount: number
  error?: string
}

export class SyncOrchestrator {
  private static initialized = false

  static init(): void {
    if (this.initialized) return
    this.initialized = true
    initSyncResponseListener()
  }
}

type ProgressListener = (progress: SyncProgress) => void
const progressListeners = new Set<ProgressListener>()

export function onSyncProgress(listener: ProgressListener): () => void {
  progressListeners.add(listener)
  return () => progressListeners.delete(listener)
}

function notify(phase: SyncPhase, extra?: Partial<SyncProgress>): void {
  const progress: SyncProgress = {
    phase,
    result: null,
    syncedVocabCount: 0,
    syncedMistakeCount: 0,
    ...extra,
  }
  for (const listener of progressListeners) {
    try { listener(progress) } catch {}
  }
}

export async function syncAll(): Promise<SyncProgress> {
  SyncOrchestrator.init()

  const result: SyncProgress = {
    phase: 'idle',
    result: null,
    syncedVocabCount: 0,
    syncedMistakeCount: 0,
  }

  try {
    notify('pushing_settings', result)
    const settings = loadAppSettings()
    const patch = mapWebSettingsToPatch(settings)
    pushSettingsToExtension(patch)
    await sleep(300)

    notify('pushing_vocab', result)
    sendLatestVocabToExtension()
    await sleep(500)

    notify('requesting_extension', result)
    let extensionData: ExtensionDataResponse
    try {
      extensionData = await requestExtensionData()
    } catch {
      result.result = 'partial'
      result.error = 'Extension did not respond. Web data has been pushed.'
      notify('complete', result)
      return result
    }

    notify('importing', result)
    const importResult = await importExtensionData(extensionData)
    result.syncedVocabCount = importResult.vocabCount
    result.syncedMistakeCount = importResult.mistakeCount

    result.result = 'success'
    result.phase = 'complete'
    notify('complete', result)
    return result
  } catch (err) {
    result.result = 'error'
    result.error = err instanceof Error ? err.message : 'Sync failed unexpectedly'
    notify('complete', result)
    return result
  }
}

async function importExtensionData(data: ExtensionDataResponse): Promise<{
  vocabCount: number
  mistakeCount: number
}> {
  const existingVocab = await DatabaseService.getAll<VocabularyEntry>('vocabulary')
  const existingMistakes = await DatabaseService.getAll<MistakeEntry>('mistakes')
  const existingVocabIds = new Set(existingVocab.map(v => v.id))
  const existingMistakeIds = new Set(existingMistakes.map(m => m.id))

  const newVocab = data.vocabulary
    .map(mapExtensionVocabToWeb)
    .filter(v => !existingVocabIds.has(v.id))

  const newMistakes = data.mistakes
    .map(mapExtensionMistakeToWeb)
    .filter(m => !existingMistakeIds.has(m.id))

  const ops: Promise<void>[] = []

  if (newVocab.length > 0) {
    ops.push(
      DatabaseService.bulkAdd('vocabulary', newVocab as never[])
        .then(() => {}),
    )
  }

  if (newMistakes.length > 0) {
    ops.push(
      DatabaseService.bulkAdd('mistakes', newMistakes as never[])
        .then(() => {}),
    )
  }

  // Articles are not auto-imported during sync.
  // Use the "Import Articles from Extension" button for that.

  await Promise.all(ops)

  return {
    vocabCount: newVocab.length,
    mistakeCount: newMistakes.length,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
