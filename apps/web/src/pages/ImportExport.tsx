import { useState, useRef, useCallback } from 'react'
import { DatabaseService } from '../services/storage/Database'
import { useToast } from '../components/ui/Toast'
import type { AppExportData } from '../models'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import PageHeader from '../components/layout/PageHeader'
import { IconDatabase } from '@ielts/ui'

const REQUIRED_ARRAYS = [
  'vocabulary', 'vocabularyReviews', 'tasks', 'readingSessions',
  'listeningSessions', 'writingSessions', 'speakingSessions',
  'grammarNotes', 'mistakes', 'mockTests', 'topicsProgress', 'passages',
] as const

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
  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(obj[key])) return false
  }
  return true
}

function countRecords(data: AppExportData): { label: string; count: number }[] {
  return REQUIRED_ARRAYS.map(key => ({
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
    count: (data as unknown as Record<string, unknown[]>)[key].length,
  })).filter(r => r.count > 0)
}

export default function ImportExport() {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [lastExport, setLastExport] = useState<{ date: string; size: string; records: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [importPreview, setImportPreview] = useState<AppExportData | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const clearFeedback = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  async function handleExport() {
    clearFeedback()
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

      const totalRecords = REQUIRED_ARRAYS.reduce((sum, k) => sum + (data as unknown as Record<string, unknown[]>)[k].length, 0)
      setLastExport({ date: new Date().toLocaleString(), size: formatBytes(blob.size), records: totalRecords })
      setSuccess(`Backup exported successfully (${formatBytes(blob.size)}, ${totalRecords} records)`)
      showToast('success', `Backup exported (${formatBytes(blob.size)}, ${totalRecords} records)`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      showToast('error', err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    clearFeedback()
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string)
        if (!validateImportData(raw)) {
          setError('Invalid backup file format. Please select a valid IELTS Journey backup JSON file.')
          return
        }
        setImportPreview(raw)
        setShowConfirm(true)
      } catch {
        setError('Could not parse file. Make sure it is a valid JSON file.')
      }
    }
    reader.onerror = () => setError('Failed to read file')
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleImportConfirm() {
    if (!importPreview) return
    clearFeedback()
    setShowConfirm(false)
    setImporting(true)
    try {
      await DatabaseService.importAll(importPreview)

      const totalRecords = REQUIRED_ARRAYS.reduce((sum, k) => sum + (importPreview as unknown as Record<string, unknown[]>)[k].length, 0)
      setSuccess(`Data imported successfully (${totalRecords} records)`)
      showToast('success', `Data imported (${totalRecords} records)`)
      setImportPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Your data was not modified.')
      showToast('error', err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  function handleCancelImport() {
    setShowConfirm(false)
    setImportPreview(null)
  }

  async function handleClearAll() {
    clearFeedback()
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL data?\n\n' +
      'This will remove all vocabulary, tasks, sessions, notes, mistakes, and mock tests. ' +
      'Settings will also be reset.\n\n' +
      'Make sure you have exported a backup first!'
    )
    if (!confirmed) return

    try {
      await DatabaseService.resetAll()
      setLastExport(null)
      setSuccess('All data has been cleared. Settings have been reset.')
      showToast('success', 'All data has been cleared')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data')
      showToast('error', err instanceof Error ? err.message : 'Failed to clear data')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-4 sm:pt-6">
      <PageHeader
        icon={<IconDatabase size={20} />}
        title="Import / Export Backup"
        description="Back up your IELTS data or restore from a previous backup"
      />

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {error && (
        <ErrorDisplay message={error} variant="banner" />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Export Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Download a complete JSON backup of all your IELTS data, including vocabulary, practice sessions,
            essays, grammar notes, mistakes, mock tests, and settings.
          </p>
          {lastExport && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-700/50">
              <p className="font-medium text-slate-700 dark:text-slate-300">Last export</p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                {lastExport.date} &middot; {lastExport.size} &middot; {lastExport.records} records
              </p>
            </div>
          )}
          <Button onClick={handleExport} loading={exporting}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Restore your data from a previously exported JSON backup file. This will replace all current data.
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

      {showConfirm && importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-overlay)' }} role="dialog" aria-modal="true" aria-label="Import confirmation">
          <div className="w-[480px] max-w-full rounded-xl border p-6 shadow-xl" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Import Data?
            </h3>
            <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
              This will overwrite ALL your current data with the backup data.
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              The backup was created on{' '}
              <span className="font-medium">
                {new Date(importPreview.exportedAt).toLocaleString()}
              </span>
              .
            </p>

            <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
              {countRecords(importPreview).map(r => (
                <div key={r.label} className="flex items-center justify-between rounded px-3 py-1.5 text-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{r.label}</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{r.count}</span>
                </div>
              ))}
              {importPreview.settings && (
                <div className="flex items-center justify-between rounded px-3 py-1.5 text-sm" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Settings</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>included</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={handleCancelImport}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleImportConfirm} loading={importing}>
                Import & Overwrite
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Clear all IELTS data from this browser. This action cannot be undone.
            Export a backup first if you want to keep your data.
          </p>
          <Button variant="danger" onClick={handleClearAll}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Data
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
    </div>
  )
}
