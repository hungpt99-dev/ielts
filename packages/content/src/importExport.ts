import { getDb, safeDb, ContentMetaRepository, UserContentEditRepository } from '@ielts/storage'
import type { ContentMeta, UserContentEdit } from '@ielts/storage'
import { ALL_BUILT_IN_PACKS, BUILT_IN_TABLES } from './built-in'
import type { ExportContentOptions, ImportContentOptions, ContentImportResult } from './types'

interface ContentExportData {
  version: number
  exportedAt: string
  source: string
  content: Record<string, unknown[]>
  contentMeta: ContentMeta[]
  userContentEdits: UserContentEdit[]
}

const EXPORT_VERSION = 1

export class ContentImportExportService {
  private metaRepo: ContentMetaRepository
  private editRepo: UserContentEditRepository

  constructor() {
    this.metaRepo = new ContentMetaRepository()
    this.editRepo = new UserContentEditRepository()
  }

  async exportData(options: ExportContentOptions = {}): Promise<ContentExportData> {
    const db = getDb()
    const content: Record<string, unknown[]> = {}

    const tablesToExport = new Set<string>()

    if (options.packIds) {
      for (const packId of options.packIds) {
        const tableName = BUILT_IN_TABLES[packId]
        if (tableName) tablesToExport.add(tableName)
      }
    }

    if (options.contentType) {
      const types = Array.isArray(options.contentType) ? options.contentType : [options.contentType]
      for (const pack of ALL_BUILT_IN_PACKS) {
        if (types.includes(pack.contentType as never)) {
          tablesToExport.add(BUILT_IN_TABLES[pack.id])
        }
      }
    }

    if (tablesToExport.size === 0) {
      for (const pack of ALL_BUILT_IN_PACKS) {
        tablesToExport.add(BUILT_IN_TABLES[pack.id])
      }
    }

    for (const tableName of tablesToExport) {
      const table = db.table(tableName)
      let items = await table.toArray()

      if (!options.includeUserEdits) {
        items = items.filter((item: Record<string, unknown>) => {
          const id = item.id as string
          return id.startsWith('built-in-')
        })
      }

      content[tableName] = items
    }

    const allMeta = await this.metaRepo.findAll()
    const allEdits = options.includeUserEdits ? await this.editRepo.findAll() : []

    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      source: 'content-package',
      content,
      contentMeta: allMeta,
      userContentEdits: allEdits,
    }
  }

  async downloadExport(options: ExportContentOptions = {}, filename?: string): Promise<void> {
    const data = await this.exportData(options)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? `ielts-content-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async importData(data: unknown, options: ImportContentOptions): Promise<ContentImportResult> {
    return safeDb(async () => {
      const result: ContentImportResult = { added: 0, updated: 0, skipped: 0, failed: 0, errors: [] }

      const parsed = this.parseExportData(data)
      if (!parsed) {
        result.failed = 1
        result.errors.push('Invalid content export data format')
        return result
      }

      const db = getDb()

      for (const [tableName, items] of Object.entries(parsed.content)) {
        if (!items || !Array.isArray(items)) continue

        const table = db.table(tableName)

        for (const item of items) {
          try {
            const record = item as Record<string, unknown>
            const id = record.id as string

            if (options.dedup && id) {
              const existing = await table.get(id)
              if (existing) {
                if (options.mode === 'merge') {
                  await table.put(record)
                  result.updated++
                } else {
                  result.skipped++
                }
                continue
              }
            }

            await table.add(record)
            result.added++
          } catch (error) {
            result.failed++
            result.errors.push(`${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      if (parsed.contentMeta && options.mode === 'replace') {
        for (const meta of parsed.contentMeta) {
          try {
            const existing = await this.metaRepo.findById(meta.id)
            if (existing) {
              await this.metaRepo.update(meta.id, meta)
            } else {
              await this.metaRepo.create(meta)
            }
          } catch {
            // ignore meta import errors - they're not critical
          }
        }
      }

      if (parsed.userContentEdits && options.mode === 'replace') {
        for (const edit of parsed.userContentEdits) {
          try {
            const existing = await this.editRepo.findById(edit.id)
            if (!existing) {
              await this.editRepo.create(edit)
            }
          } catch {
            // ignore edit import errors
          }
        }
      }

      return result
    })
  }

  private parseExportData(data: unknown): ContentExportData | null {
    if (!data || typeof data !== 'object') return null
    const d = data as Record<string, unknown>
    if (typeof d.version !== 'number' || typeof d.exportedAt !== 'string' || typeof d.content !== 'object') {
      return null
    }
    return d as unknown as ContentExportData
  }

  generateExportFilename(): string {
    return `ielts-content-export-${new Date().toISOString().slice(0, 10)}.json`
  }

  getExportableTableNames(): string[] {
    return Object.values(BUILT_IN_TABLES)
  }
}

export function createContentImportExportService(): ContentImportExportService {
  return new ContentImportExportService()
}
