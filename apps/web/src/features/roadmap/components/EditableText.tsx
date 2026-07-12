import { useState, useRef, useEffect } from 'react'

interface EditableTextProps {
  value: string
  onSave: (value: string) => void
  isEditing: boolean
  multiline?: boolean
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

export default function EditableText({
  value,
  onSave,
  isEditing,
  multiline = false,
  placeholder = 'Enter text...',
  className = '',
  style,
}: EditableTextProps) {
  const [isActive, setIsActive] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isActive])

  if (!isEditing) {
    return (
      <span className={className} style={style}>
        {value || placeholder}
      </span>
    )
  }

  if (isActive) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { onSave(draft); setIsActive(false) }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setDraft(value); setIsActive(false) }
          }}
          className={`w-full resize-none rounded-lg border px-2 py-1 text-sm ${className}`}
          style={{
            borderColor: 'var(--color-primary)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            ...style,
          }}
          placeholder={placeholder}
          rows={2}
        />
      )
    }
    return (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setIsActive(false) }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(draft); setIsActive(false) }
          if (e.key === 'Escape') { setDraft(value); setIsActive(false) }
        }}
        className={`w-full rounded-lg border px-2 py-1 text-sm ${className}`}
        style={{
          borderColor: 'var(--color-primary)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          ...style,
        }}
        placeholder={placeholder}
      />
    )
  }

  return (
    <span
      className={`group relative inline-flex items-center gap-1 cursor-text ${className}`}
      style={style}
      onClick={() => setIsActive(true)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsActive(true) }}
    >
      <span>
        {value || <span className="italic" style={{ color: 'var(--color-muted)' }}>{placeholder}</span>}
      </span>
      <svg
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        width="12" height="12" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ color: 'var(--color-primary)' }}
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </span>
  )
}
