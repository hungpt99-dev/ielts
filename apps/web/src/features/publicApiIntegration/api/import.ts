import { DatabaseService } from '../../../services/storage/Database'
import type { PublicApiImportedContent, VocabularyEntry } from '../../../models'
import type {
  PublicApiPreview,
  PublicApiImportResult,
  PublicApiContentType,
  PublicApiSourceName,
} from '../types'

const KNOWN_LICENSES = [
  'CC BY-SA 3.0',
  'CC BY 4.0',
  'CC BY 2.0 FR',
  'CC BY 3.0',
  'CC BY 2.0',
  'CC0',
  'Public Domain',
  'Creative Commons Attribution-ShareAlike',
  'Creative Commons Attribution',
  'GNU Free Documentation License',
  'YouTube Terms of Service',
  'Apache License 2.0',
  'MIT',
]

const UNCLEAR_LICENSES = [
  'Unknown',
  'Unclear',
  'All Rights Reserved',
  'Copyright',
  'Proprietary',
  '',
]

export function validateLicense(licenseName: string): { valid: boolean; reason?: string } {
  if (!licenseName || typeof licenseName !== 'string' || licenseName.trim().length === 0) {
    return { valid: false, reason: 'License is missing or empty' }
  }

  const trimmed = licenseName.trim()

  if (UNCLEAR_LICENSES.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
    return { valid: false, reason: `License "${trimmed}" is unclear or restrictive` }
  }

  const known = KNOWN_LICENSES.some(l => trimmed.toLowerCase().includes(l.toLowerCase()) || l.toLowerCase().includes(trimmed.toLowerCase()))

  if (!known && trimmed.toLowerCase().includes('creative commons')) {
    return { valid: true }
  }

  if (!known && trimmed.toLowerCase().includes('public domain')) {
    return { valid: true }
  }

  if (!known && trimmed.toLowerCase().includes('open')) {
    return { valid: true, reason: 'License appears to be open but may need verification' }
  }

  if (!known) {
    return { valid: false, reason: `License "${trimmed}" is not recognized as an open license` }
  }

  return { valid: true }
}

export function createImportEntry(
  preview: PublicApiPreview,
  overrides?: Partial<Pick<PublicApiImportedContent, 'skill' | 'topic' | 'difficulty' | 'tags' | 'userNotes'>>,
): PublicApiImportedContent {
  return {
    id: crypto.randomUUID(),
    title: preview.title,
    content: preview.content,
    contentType: preview.contentType as PublicApiContentType,
    sourceType: 'public-api',
    sourceName: preview.sourceName as PublicApiSourceName,
    sourceUrl: preview.sourceUrl,
    licenseName: preview.licenseName,
    attribution: preview.attribution,
    importedAt: new Date().toISOString(),
    skill: overrides?.skill ?? '',
    topic: overrides?.topic ?? '',
    difficulty: overrides?.difficulty ?? 'medium',
    tags: overrides?.tags ?? [],
    userNotes: overrides?.userNotes ?? '',
  }
}

export async function importPublicApiContent(
  preview: PublicApiPreview,
  overrides?: Partial<Pick<PublicApiImportedContent, 'skill' | 'topic' | 'difficulty' | 'tags' | 'userNotes'>>,
): Promise<PublicApiImportResult> {
  const licenseCheck = validateLicense(preview.licenseName)
  if (!licenseCheck.valid) {
    return {
      success: false,
      contentId: '',
      error: licenseCheck.reason ?? 'License validation failed',
    }
  }

  try {
    const entry = createImportEntry(preview, overrides)
    await DatabaseService.addPublicApiContent(entry)

    if (preview.contentType === 'dictionary' || preview.contentType === 'vocabulary-list') {
      const vocabEntry: Omit<VocabularyEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        word: preview.title,
        meaning: preview.content || preview.title,
        meaningVi: '',
        pronunciation: '',
        partOfSpeech: '',
        topic: overrides?.topic || 'general',
        exampleSentence: '',
        collocations: [],
        synonyms: [],
        antonyms: [],
        wordFamily: [],
        personalNote: '',
        difficulty: overrides?.difficulty ?? 'medium',
        status: 'new',
        tags: overrides?.tags ?? [],
      }
      await DatabaseService.add('vocabulary', vocabEntry)
    }

    return {
      success: true,
      contentId: entry.id,
    }
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/api/import.ts error:', error);
    return {
      success: false,
      contentId: '',
      error: error instanceof Error ? error.message : 'Failed to import content',
    }
  }
}

export async function importPublicApiContentBatch(
  previews: PublicApiPreview[],
  overrides?: Partial<Pick<PublicApiImportedContent, 'skill' | 'topic' | 'difficulty' | 'tags' | 'userNotes'>>,
): Promise<PublicApiImportResult[]> {
  return Promise.all(previews.map(p => importPublicApiContent(p, overrides)))
}
