import { useRef } from 'react'
import { DatabaseService } from '../../services/storage/Database'
import { emitVocabularyChanged } from './vocabularyEvents'

export interface VocabularyImportProps {
  onImportComplete: (count: number) => void
  className?: string
}

export default function VocabularyImport({ onImportComplete, className }: VocabularyImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const items = Array.isArray(data) ? data : (data.vocabulary || [])

      let count = 0
      for (const item of items) {
        if (item.word && item.meaning) {
          await DatabaseService.add('vocabulary', item)
          count++
        }
      }

      onImportComplete(count)
      emitVocabularyChanged()
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={className}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import
      </button>
    </>
  )
}
