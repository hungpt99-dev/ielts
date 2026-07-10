import { useState, useCallback } from 'react'
import type { SavedItemDisplay } from '../../services/savedItemsService'
import { deleteSavedItem, updateSavedItem } from '../../services/savedItemsService'
import type { SaveCategory } from '../../types'
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '../../types'
import { IconBack, IconAITutor } from '@ielts/ui'
import {
  enrichVocabulary,
  explainText,
  analyzeIeltsVocab,
  generateExamples,
  type VocabEnrichResult,
  type ExplainResult,
  type IeltsVocabResult,
  type ExampleSentencesResult,
} from '../../services/aiEnrichmentService'

interface SavedItemDetailViewProps {
  item: SavedItemDisplay
  onBack: () => void
  onDeleted: () => void
}

type EnrichmentType = 'vocab' | 'explain' | 'ielts-vocab' | 'examples'
type EnrichmentState =
  | { type: 'idle' }
  | { type: 'loading'; action: EnrichmentType }
  | { type: 'vocab'; data: VocabEnrichResult }
  | { type: 'explain'; data: ExplainResult }
  | { type: 'ielts-vocab'; data: IeltsVocabResult }
  | { type: 'examples'; data: ExampleSentencesResult }
  | { type: 'error'; message: string }

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function AiButton({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        borderRadius: '8px',
        border: '1px solid var(--color-tutor-accent)',
        background: loading ? 'var(--color-tutor-accent-light)' : 'transparent',
        color: 'var(--color-tutor-accent)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '11px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.15s',
      }}
    >
      {loading ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid var(--color-tutor-accent)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        <IconAITutor size={12} />
      )}
      {label}
    </button>
  )
}

export default function SavedItemDetailView({
  item: initialItem,
  onBack,
  onDeleted,
}: SavedItemDetailViewProps) {
  const [editing, setEditing] = useState(false)
  const [item, setItem] = useState(initialItem)
  const [form, setForm] = useState({
    text: item.text,
    topic: item.topic,
    tags: item.tags.join(', '),
    personalNote: item.personalNote,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [enrichment, setEnrichment] = useState<EnrichmentState>({ type: 'idle' })

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      await updateSavedItem(item, {
        text: form.text,
        topic: form.topic,
        tags,
        personalNote: form.personalNote,
      })
      setItem((prev) => ({ ...prev, text: form.text, topic: form.topic, tags, personalNote: form.personalNote }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }, [form, item])

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await deleteSavedItem(item)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, item, onDeleted])

  const runEnrich = useCallback(async (action: EnrichmentType) => {
    setEnrichment({ type: 'loading', action })
    const text = item.text
    try {
      switch (action) {
        case 'vocab': {
          const r = await enrichVocabulary(text)
          if (r.error) { setEnrichment({ type: 'error', message: r.error }); return }
          setEnrichment({ type: 'vocab', data: r.data! })
          break
        }
        case 'explain': {
          const r = await explainText(text)
          if (r.error) { setEnrichment({ type: 'error', message: r.error }); return }
          setEnrichment({ type: 'explain', data: r.data! })
          break
        }
        case 'ielts-vocab': {
          const r = await analyzeIeltsVocab(text)
          if (r.error) { setEnrichment({ type: 'error', message: r.error }); return }
          setEnrichment({ type: 'ielts-vocab', data: r.data! })
          break
        }
        case 'examples': {
          const r = await generateExamples(text)
          if (r.error) { setEnrichment({ type: 'error', message: r.error }); return }
          setEnrichment({ type: 'examples', data: r.data! })
          break
        }
      }
    } catch (err) {
      setEnrichment({ type: 'error', message: err instanceof Error ? err.message : 'AI enrichment failed' })
    }
  }, [item.text])

  const isAiLoading = enrichment.type === 'loading'
  const color = CATEGORY_COLORS[item.category as SaveCategory] || 'var(--color-muted)'

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-text-secondary)',
            borderRadius: '8px',
          }}
          aria-label="Back"
        >
          <IconBack size={16} />
        </button>
        <span
          style={{
            fontWeight: 600,
            fontSize: '13px',
            color: 'var(--color-text)',
          }}
        >
          {CATEGORY_ICONS[item.category as SaveCategory]} {CATEGORY_LABELS[item.category as SaveCategory]}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--color-danger)',
              background: confirmDelete ? 'var(--color-danger)' : 'transparent',
              color: confirmDelete ? 'white' : 'var(--color-danger)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              opacity: deleting ? 0.5 : 1,
            }}
          >
            {deleting ? '...' : confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px', maxHeight: '440px', overflowY: 'auto' }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <EditField label="Text" multiline rows={4} value={form.text} onChange={(v) => setForm((p) => ({ ...p, text: v }))} />
            <EditField label="Topic" value={form.topic} onChange={(v) => setForm((p) => ({ ...p, topic: v }))} />
            <EditField label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm((p) => ({ ...p, tags: v }))} placeholder="vocabulary, grammar, part1" />
            <EditField label="Personal Note" multiline rows={2} value={form.personalNote} onChange={(v) => setForm((p) => ({ ...p, personalNote: v }))} />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setForm({ text: item.text, topic: item.topic, tags: item.tags.join(', '), personalNote: item.personalNote })
                  setEditing(false)
                }}
                style={secondaryBtnStyle}
              >
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ ...primaryBtnStyle, opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {item.text}
            </p>

            {item.pageTitle && (
              <div>
                <SectionLabel label="Source" />
                {item.pageUrl ? (
                  <a href={item.pageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                    {item.pageTitle}
                  </a>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{item.pageTitle}</span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Pill style={{ background: `${color}18`, color }} icon={CATEGORY_ICONS[item.category as SaveCategory]} label={CATEGORY_LABELS[item.category as SaveCategory]} />
              {item.topic && <Pill label={`#${item.topic}`} />}
              {item.difficulty && <Pill label={item.difficulty} />}
              <Pill label={item.status} />
            </div>

            {item.tags.length > 0 && (
              <div>
                <SectionLabel label="Tags" />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {item.tags.map((tag) => (
                    <span key={tag} style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.personalNote && (
              <div>
                <SectionLabel label="Note" />
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{item.personalNote}</p>
              </div>
            )}

            {/* AI Enrichment */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '10px' }}>
              <SectionLabel label="AI Tools" />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <AiButton label="Enrich Vocab" loading={isAiLoading && enrichment.type === 'loading' && enrichment.action === 'vocab'} onClick={() => runEnrich('vocab')} />
                <AiButton label="Explain" loading={isAiLoading && enrichment.type === 'loading' && enrichment.action === 'explain'} onClick={() => runEnrich('explain')} />
                <AiButton label="IELTS Analysis" loading={isAiLoading && enrichment.type === 'loading' && enrichment.action === 'ielts-vocab'} onClick={() => runEnrich('ielts-vocab')} />
                <AiButton label="Examples" loading={isAiLoading && enrichment.type === 'loading' && enrichment.action === 'examples'} onClick={() => runEnrich('examples')} />
              </div>

              {enrichment.type === 'error' && (
                <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: '12px' }}>
                  {enrichment.message}
                </div>
              )}

              {enrichment.type === 'vocab' && <VocabEnrichSection data={enrichment.data} />}
              {enrichment.type === 'explain' && <ExplainSection data={enrichment.data} />}
              {enrichment.type === 'ielts-vocab' && <IeltsVocabSection data={enrichment.data} />}
              {enrichment.type === 'examples' && <ExamplesSection data={enrichment.data} />}
            </div>

            <div style={{ fontSize: '10px', color: 'var(--color-muted)', borderTop: '1px solid var(--color-border-light)', paddingTop: '8px' }}>
              Created: {formatDate(item.createdAt)}
              {item.updatedAt !== item.createdAt && <> · Updated: {formatDate(item.updatedAt)}</>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* Sub-components */

function SectionLabel({ label }: { label: string }) {
  return <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '4px' }}>{label}</span>
}

function Pill({ label, icon, style: extraStyle }: { label: string; icon?: string; style?: React.CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 500, background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', ...extraStyle }}>
      {icon && <span>{icon}</span>}{label}
    </span>
  )
}

function EditField({ label, value, onChange, multiline, rows, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; placeholder?: string
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
    resize: 'vertical',
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows || 3} placeholder={placeholder} style={inputStyle} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  )
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)',
  background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
  fontSize: '12px', fontFamily: 'var(--font-sans)',
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '8px', border: 'none',
  background: 'var(--color-primary)', color: 'white', cursor: 'pointer',
  fontSize: '12px', fontFamily: 'var(--font-sans)',
}

function VocabEnrichSection({ data }: { data: VocabEnrichResult }) {
  return (
    <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--color-surface-alt)', fontSize: '12px', lineHeight: 1.5 }}>
      {data.pronunciation && <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', marginBottom: '4px' }}>/{data.pronunciation}/</div>}
      {data.partOfSpeech && <Pill label={data.partOfSpeech} />}
      {data.meaning && <p style={{ margin: '6px 0', color: 'var(--color-text)' }}>{data.meaning}</p>}
      {data.meaningVi && <p style={{ margin: '4px 0', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{data.meaningVi}</p>}
      {data.exampleSentence && (
        <div style={{ marginTop: '6px' }}>
          <SectionLabel label="Example" />
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>"{data.exampleSentence}"</p>
        </div>
      )}
      {data.synonyms.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <SectionLabel label="Synonyms" />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{data.synonyms.map((s) => <Pill key={s} label={s} />)}</div>
        </div>
      )}
      {data.antonyms.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <SectionLabel label="Antonyms" />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{data.antonyms.map((a) => <Pill key={a} label={a} />)}</div>
        </div>
      )}
    </div>
  )
}

function ExplainSection({ data }: { data: ExplainResult }) {
  return (
    <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--color-surface-alt)', fontSize: '12px', lineHeight: 1.5 }}>
      <p style={{ margin: 0, color: 'var(--color-text)' }}>{data.explanation}</p>
      {data.examples.length > 0 && (
        <ul style={{ margin: '6px 0 0', paddingLeft: '16px', color: 'var(--color-text-secondary)' }}>
          {data.examples.map((ex, i) => <li key={i} style={{ marginBottom: '2px' }}>{ex}</li>)}
        </ul>
      )}
    </div>
  )
}

function IeltsVocabSection({ data }: { data: IeltsVocabResult }) {
  return (
    <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--color-surface-alt)', fontSize: '12px', lineHeight: 1.5 }}>
      {data.bandLevel && <Pill label={`Band ${data.bandLevel}`} style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }} />}
      {data.usage.length > 0 && (
        <ul style={{ margin: '6px 0', paddingLeft: '16px', color: 'var(--color-text-secondary)' }}>
          {data.usage.map((u, i) => <li key={i}>{u}</li>)}
        </ul>
      )}
      {data.tips && <p style={{ margin: 0, color: 'var(--color-primary)' }}>💡 {data.tips}</p>}
    </div>
  )
}

function ExamplesSection({ data }: { data: ExampleSentencesResult }) {
  return (
    <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--color-surface-alt)', fontSize: '12px', lineHeight: 1.5 }}>
      <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--color-text-secondary)' }}>
        {data.sentences.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
      </ul>
    </div>
  )
}
