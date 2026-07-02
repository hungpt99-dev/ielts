export type ContentType =
  | 'reading-passage'
  | 'writing-prompt'
  | 'speaking-question'
  | 'listening-transcript'
  | 'vocabulary-list'
  | 'grammar-note'
  | 'useful-phrase'
  | 'ielts-topic'
  | 'example-sentence'

export type ImportExportMode = 'merge' | 'replace'

export interface ContentPackMeta {
  id: string
  name: string
  description: string
  version: number
  contentType: ContentType
  itemCount: number
  tags: string[]
}

export interface ContentPackItem<T = unknown> {
  packId: string
  item: T
}

export interface ContentSeedingOptions {
  force?: boolean
  onProgress?: (packId: string, current: number, total: number) => void
}

export interface ContentSeedingResult {
  seeded: number
  skipped: number
  errors: string[]
  packs: Array<{ packId: string; packName: string; version: number; count: number }>
}

export interface ContentFilter {
  query?: string
  contentType?: ContentType | ContentType[]
  skill?: string | string[]
  topic?: string | string[]
  difficulty?: string | string[]
  tags?: string[]
  isBuiltIn?: boolean
  isFavorite?: boolean
  packId?: string
  page?: number
  pageSize?: number
}

export interface ContentSearchResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UserContentEditInput {
  originalId: string
  contentType: string
  tableName: string
  changes: Record<string, unknown>
}

export interface ExportContentOptions {
  contentType?: ContentType | ContentType[]
  packIds?: string[]
  includeUserEdits?: boolean
}

export interface ImportContentOptions {
  mode: ImportExportMode
  validate?: boolean
  dedup?: boolean
}

export interface ContentImportResult {
  added: number
  updated: number
  skipped: number
  failed: number
  errors: string[]
}
