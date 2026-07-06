import { useState, useRef } from 'react'
import { DatabaseService, type ImportSummary } from '../../services/storage/Database'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/layout/PageHeader'
import { IconDatabase } from '@ielts/ui'
import type { AppExportData } from '../../models'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const TABLE_NAMES: (keyof AppExportData)[] = [
  'vocabulary', 'vocabularyReviews', 'tasks',
  'readingSessions', 'readingPracticeSessions',
  'listeningSessions', 'listeningPracticeSessions',
  'writingSessions', 'speakingSessions',
  'grammarNotes', 'mistakes', 'mockTests',
  'topicsProgress', 'passages', 'ieltsTopics',
  'exampleSentences', 'readingPassages', 'listeningTranscripts',
  'writingPrompts', 'speakingQuestions', 'studyNotes',
  'customStudyPlans', 'usefulPhrases', 'aiContents',
  'progressRecords',
]

const TABLE_LABELS: Record<string, string> = {
  vocabulary: 'Vocabulary',
  vocabularyReviews: 'Vocabulary Reviews',
  tasks: 'Tasks',
  readingSessions: 'Reading Sessions',
  readingPracticeSessions: 'Reading Practice Sessions',
  listeningSessions: 'Listening Sessions',
  listeningPracticeSessions: 'Listening Practice Sessions',
  writingSessions: 'Writing Sessions',
  speakingSessions: 'Speaking Sessions',
  grammarNotes: 'Grammar Notes',
  mistakes: 'Mistakes',
  mockTests: 'Mock Tests',
  topicsProgress: 'Topics Progress',
  passages: 'Passages',
  ieltsTopics: 'IELTS Topics',
  exampleSentences: 'Example Sentences',
  readingPassages: 'Reading Passages',
  listeningTranscripts: 'Listening Transcripts',
  writingPrompts: 'Writing Prompts',
  speakingQuestions: 'Speaking Questions',
  studyNotes: 'Study Notes',
  customStudyPlans: 'Custom Study Plans',
  usefulPhrases: 'Useful Phrases',
  aiContents: 'AI Contents',
  progressRecords: 'Progress Records',
}

type ImportMode = 'merge' | 'replace'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateImportData(data: unknown): data is AppExportData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if (typeof obj.version !== 'number') return false
  if (typeof obj.exportedAt !== 'string') return false
  if (!obj.settings || typeof obj.settings !== 'object') return false
  for (const key of TABLE_NAMES) {
    if (!Array.isArray(obj[key])) return false
  }
  return true
}

function countRecords(data: AppExportData): { key: string; label: string; count: number }[] {
  return TABLE_NAMES.map(key => ({
    key,
    label: TABLE_LABELS[key] || key,
    count: (data[key] as unknown[]).length,
  })).filter(r => r.count > 0)
}

export default function DataManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<AppExportData | null>(null)
  const [importMode, setImportMode] = useState<ImportMode>('replace')
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const data = await DatabaseService.exportAll()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `ielts-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const totalRecords = TABLE_NAMES.reduce((sum, k) => sum + (data[k] as unknown[]).length, 0)
      showToast('success', `Backup exported (${formatBytes(blob.size)}, ${totalRecords} records)`)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportSummary(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string)
        if (!validateImportData(raw)) {
          showToast('error', 'Invalid backup file format.')
          return
        }
        setImportPreview(raw)
      } catch {
        showToast('error', 'Could not parse file. Make sure it is a valid JSON file.')
      }
    }
    reader.onerror = () => showToast('error', 'Failed to read file')
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleImportConfirm() {
    if (!importPreview) return

    setImporting(true)
    setImportSummary(null)
    setImportPreview(null)

    try {
      const summary = await DatabaseService.importAll(importPreview, importMode)
      setImportSummary(summary)
      if (summary.failed === 0) {
        showToast('success', `Import complete: ${summary.added} added, ${summary.updated} updated, ${summary.skipped} skipped`)
      } else {
        showToast('warning', `Import completed with ${summary.failed} errors`)
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  function handleCancelImport() {
    setImportPreview(null)
  }

  function handleDismissSummary() {
    setImportSummary(null)
  }

  async function handleResetAll() {
    setResetting(true)
    try {
      await DatabaseService.resetAll()
      showToast('success', 'All data has been cleared.')
      setShowResetConfirm(false)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to clear data')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-4 sm:pt-6">
      <PageHeader
        icon={<IconDatabase size={22} />}
        title="Data Management"
        description="Export, import, and manage your learning data"
        iconBackground="var(--color-danger-light)"
        iconColor="var(--color-danger)"
      />

      <Card>
        <CardHeader>
          <CardTitle>Export Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Download a complete JSON backup of all your data, including vocabulary,
            practice sessions, notes, mistakes, and settings.
          </p>
          <Button onClick={handleExport} loading={exporting}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Restore your data from a previously exported JSON backup file.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            className="hidden"
            aria-hidden="true"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            loading={importing}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L5 8m4-4v12" />
            </svg>
            Select Backup File
          </Button>
        </CardContent>
      </Card>

      {importSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Import Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center dark:border-green-800 dark:bg-green-900/30">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{importSummary.added}</p>
                <p className="text-xs text-green-600 dark:text-green-500">Added</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center dark:border-blue-800 dark:bg-blue-900/30">
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{importSummary.updated}</p>
                <p className="text-xs text-blue-600 dark:text-blue-500">Updated</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center dark:border-slate-600 dark:bg-slate-700/50">
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{importSummary.skipped}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Skipped</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center dark:border-red-800 dark:bg-red-900/30">
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{importSummary.failed}</p>
                <p className="text-xs text-red-600 dark:text-red-500">Failed</p>
              </div>
            </div>
            {importSummary.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/30">
                <p className="text-xs font-medium text-red-700 dark:text-red-400">Errors:</p>
                <ul className="mt-1 space-y-0.5">
                  {importSummary.errors.slice(0, 5).map((err, i) => (
                    <li key={i} className="text-xs text-red-600 dark:text-red-500">{err}</li>
                  ))}
                  {importSummary.errors.length > 5 && (
                    <li className="text-xs text-red-500">...and {importSummary.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            <Button variant="ghost" onClick={handleDismissSummary}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--color-danger)' }}>Reset Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Clear all IELTS data from this browser. This action cannot be undone.
            Export a backup first if you want to keep your data.
          </p>
          <Button variant="danger" onClick={() => setShowResetConfirm(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset All Data
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          All data is stored locally in this browser using IndexedDB. No data is ever sent to any server.
          Regular backups are recommended. Backup files contain all your learning data in JSON format
          and can be safely stored or transferred to another device.
        </p>
      </div>

      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-overlay)' }} role="dialog" aria-modal="true" aria-label="Import confirmation">
          <div className="w-[480px] max-w-full rounded-xl border p-6 shadow-xl" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Import Backup Data
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Backup created on{' '}
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                {new Date(importPreview.exportedAt).toLocaleString()}
              </span>
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Import Mode
              </label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: importMode === 'replace' ? 'var(--color-danger)' : 'var(--color-surface-alt)',
                    color: importMode === 'replace' ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: importMode === 'merge' ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                    color: importMode === 'merge' ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Merge
                </button>
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {importMode === 'replace'
                  ? 'Clears all existing data before importing.'
                  : 'Keeps existing data and adds/updates with imported data.'}
              </p>
            </div>

            {importMode === 'replace' && (
              <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                This will overwrite ALL your current data!
              </p>
            )}

            <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
              {countRecords(importPreview).map(r => (
                <div key={r.key} className="flex items-center justify-between rounded px-3 py-1.5 text-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{r.label}</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{r.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={handleCancelImport}>
                Cancel
              </Button>
              <Button
                variant={importMode === 'replace' ? 'danger' : 'primary'}
                onClick={handleImportConfirm}
                loading={importing}
              >
                {importMode === 'replace' ? 'Replace & Import' : 'Merge & Import'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-overlay)' }} role="dialog" aria-modal="true" aria-label="Reset confirmation">
          <div className="w-[440px] max-w-full rounded-xl border p-6 shadow-xl" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Reset All Data?
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              This will delete ALL your data including vocabulary, tasks, sessions, notes, mistakes,
              and mock tests. Settings will also be reset to defaults.
            </p>
            <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
              This action cannot be undone. Export a backup first.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleResetAll} loading={resetting}>
                Delete Everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
