import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import {
  exportExtensionData,
  importExtensionData,
  getSyncStatus,
  markItemsSynced,
  downloadJson,
  generateExportFilename,
  readJsonFile,
  validateExtensionExportData,
  type StorageHandlers,
  type StorageGet,
  type StorageSet,
  type SyncStatus,
} from '../../../../../packages/storage/src/syncService'
import {
  getAllEntries,
  saveEntry,
  clearAllEntries,
} from '../../storage/indexedDB'
import {
  getAllVocabulary,
  saveVocabularyEntry,
  deleteVocabularyEntry,
} from '../../storage/vocabularyStore'
import {
  getAllArticles,
  saveArticleEntry,
  deleteArticleEntry,
} from '../../storage/articleStore'
import {
  getAllMistakes as getAllMistakeEntries,
  saveMistakeEntry,
  deleteMistakeEntry,
} from '../../storage/mistakeStore'
import {
  getAllVideos,
  saveVideoEntry,
  deleteVideoEntry,
} from '../../storage/videoStore'

interface BackupRestoreProps {
  onBack: () => void
}

const storageHandlers: StorageHandlers = {
  getAllLearningEntries: async () => getAllEntries() as unknown as Record<string, unknown>[],
  saveLearningEntry: async (e) => saveEntry(e as never),
  clearLearningEntries: async () => clearAllEntries(),
  getAllVocabulary: async () => getAllVocabulary() as unknown as Record<string, unknown>[],
  saveVocabularyEntry: async (e) => saveVocabularyEntry(e as never),
  deleteVocabularyEntry: async (id) => deleteVocabularyEntry(id),
  getAllArticles: async () => getAllArticles() as unknown as Record<string, unknown>[],
  saveArticleEntry: async (e) => saveArticleEntry(e as never),
  deleteArticleEntry: async (id) => deleteArticleEntry(id),
  getAllMistakes: async () => getAllMistakeEntries() as unknown as Record<string, unknown>[],
  saveMistakeEntry: async (e) => saveMistakeEntry(e as never),
  deleteMistakeEntry: async (id) => deleteMistakeEntry(id),
  getAllVideos: async () => getAllVideos() as unknown as Record<string, unknown>[],
  saveVideoEntry: async (e) => saveVideoEntry(e as never),
  deleteVideoEntry: async (id) => deleteVideoEntry(id),
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BackupRestore({ onBack }: BackupRestoreProps) {
  const { showToast } = useToast()
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [result, setResult] = useState<{ added: number; failed: number; errors: string[] } | null>(null)

  const storageGet: StorageGet<SyncStatus> = useCallback(
    (key: string) => new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => resolve(res[key] ?? null))
    }),
    [],
  )

  const storageSet: StorageSet = useCallback(
    (key: string, value: unknown) => new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve())
    }),
    [],
  )

  useEffect(() => {
    getSyncStatus(storageGet).then(setSyncStatus)
  }, [storageGet])

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await exportExtensionData(storageHandlers)
      const filename = generateExportFilename()
      downloadJson(data, filename)
      showToast('success', `Exported ${data.meta.source} data`)
    } catch (e) {
      showToast('error', `Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
    setExporting(false)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setResult(null)

    try {
      const json = await readJsonFile(file)

      if (!validateExtensionExportData(json)) {
        showToast('error', 'Invalid backup file format')
        setImporting(false)
        return
      }

      const summary = await importExtensionData(json, storageHandlers, importMode)
      setResult({
        added: summary.added,
        failed: summary.failed,
        errors: summary.errors.slice(0, 10),
      })

      if (summary.failed > 0) {
        showToast('warning', `Imported ${summary.added} items, ${summary.failed} failed`)
      } else {
        showToast('success', `Successfully imported ${summary.added} items`)
      }
    } catch (e) {
      showToast('error', `Import failed: ${e instanceof Error ? e.message : 'Invalid file'}`)
    }

    setImporting(false)
    e.target.value = ''
  }

  const handleClearPending = async () => {
    if (syncStatus && syncStatus.pendingItems.length > 0) {
      const ids = syncStatus.pendingItems.map(item => item.id)
      await markItemsSynced(ids, storageGet, storageSet)
      const updated = await getSyncStatus(storageGet)
      setSyncStatus(updated)
      showToast('success', 'Pending items cleared')
    }
  }

  const clearInputRef = () => {
    const input = document.getElementById('import-file-input') as HTMLInputElement
    if (input) input.value = ''
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        minHeight: '500px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text)',
            fontSize: '16px',
            flexShrink: 0,
          }}
          aria-label="Back"
        >
          ←
        </button>
        <h1
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Backup & Restore
        </h1>
      </header>

      {/* Sync Status */}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
        }}
      >
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 8px',
          }}
        >
          Sync Status
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Last Sync</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
              {formatDate(syncStatus?.lastSyncAt ?? null)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Pending Items</span>
            <span
              style={{
                color: (syncStatus?.pendingItems.length ?? 0) > 0
                  ? 'var(--color-warning, #d97706)'
                  : 'var(--color-text)',
                fontWeight: 500,
              }}
            >
              {syncStatus?.pendingItems.length ?? 0}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Last Result</span>
            <span
              style={{
                fontWeight: 500,
                color:
                  syncStatus?.lastSyncResult === 'success'
                    ? 'var(--color-success, #10b981)'
                    : syncStatus?.lastSyncResult === 'failed'
                      ? 'var(--color-error, #ef4444)'
                      : 'var(--color-text)',
              }}
            >
              {syncStatus?.lastSyncResult ?? 'N/A'}
            </span>
          </div>
        </div>
        {(syncStatus?.pendingItems.length ?? 0) > 0 && (
          <button
            onClick={handleClearPending}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Clear Pending Items
          </button>
        )}
      </section>

      {/* Export */}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
        }}
      >
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 8px',
          }}
        >
          Export Data
        </h2>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            margin: '0 0 12px',
            lineHeight: '1.4',
          }}
        >
          Download all your learning data as a JSON backup file. You can import it later or
          into the main IELTS Journey website.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: exporting ? 'not-allowed' : 'pointer',
            opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? 'Exporting...' : '📥 Download Backup'}
        </button>
      </section>

      {/* Import */}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
        }}
      >
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 8px',
          }}
        >
          Import Data
        </h2>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            margin: '0 0 12px',
            lineHeight: '1.4',
          }}
        >
          Restore data from a previously exported JSON backup file.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <button
            onClick={() => setImportMode('merge')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: importMode === 'merge'
                ? '2px solid var(--color-primary)'
                : '1px solid var(--color-border)',
              background: importMode === 'merge'
                ? 'var(--color-primary-light, transparent)'
                : 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Merge
          </button>
          <button
            onClick={() => setImportMode('replace')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: importMode === 'replace'
                ? '2px solid var(--color-error, #ef4444)'
                : '1px solid var(--color-border)',
              background: importMode === 'replace'
                ? 'var(--color-error-light, transparent)'
                : 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Replace
          </button>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: '2px dashed var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: importing ? 'not-allowed' : 'pointer',
            opacity: importing ? 0.6 : 1,
          }}
        >
          {importing ? 'Importing...' : '📤 Upload Backup'}
          <input
            id="import-file-input"
            type="file"
            accept=".json"
            onChange={handleImport}
            onClick={clearInputRef}
            style={{ display: 'none' }}
            disabled={importing}
          />
        </label>
      </section>

      {/* Result Summary */}
      {result && (
        <section
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px',
          }}
        >
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 8px',
            }}
          >
            Import Result
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Added</span>
              <span style={{ color: 'var(--color-success, #10b981)', fontWeight: 600 }}>
                {result.added}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Failed</span>
              <span
                style={{
                  color: result.failed > 0 ? 'var(--color-error, #ef4444)' : 'var(--color-text)',
                  fontWeight: 600,
                }}
              >
                {result.failed}
              </span>
            </div>
            {result.errors.length > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: 'var(--color-surface-alt, #f8f9fa)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}
              >
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-error, #ef4444)',
                      padding: '2px 0',
                      wordBreak: 'break-all',
                    }}
                  >
                    {err}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setResult(null)}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </section>
      )}

      {/* Note about website sync */}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.5',
        }}
      >
        <strong style={{ color: 'var(--color-text)' }}>💡 About Website Sync</strong>
        <p style={{ margin: '4px 0 0' }}>
          The extension and the IELTS Journey website store data in separate databases due to
          browser security (IndexedDB is origin-bound). To sync data:
        </p>
        <ol style={{ margin: '8px 0 0', paddingLeft: '16px' }}>
          <li>Export a backup from the extension</li>
          <li>Open the IELTS Journey website and use its Import function</li>
          <li>Or export from the website and import here</li>
        </ol>
        <p style={{ margin: '8px 0 0' }}>
          When the website is open in a tab, automatic sync is available via the browser bridge.
        </p>
      </section>
    </div>
  )
}
