import { useState, useCallback } from 'react'
import type { SavedItemDisplay } from '../../services/savedItemsService'
import { deleteSavedItem, updateSavedItem } from '../../services/savedItemsService'
import type { SaveCategory } from '../../types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../types'
import { IconBack, IconAITutor, IconDelete, IconEdit, IconCheck, IconInfo } from '@ielts/ui'
import { CategoryIcon } from '../../components/CategoryIcon'
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

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  } catch {
    return ''
  }
}

export default function SavedItemDetailView({ item: initialItem, onBack, onDeleted }: SavedItemDetailViewProps) {
  const [editing, setEditing] = useState(false)
  const [item, setItem] = useState(initialItem)
  const [form, setForm] = useState({ text: item.text, topic: item.topic, tags: item.tags.join(', '), personalNote: item.personalNote })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [enrichment, setEnrich] = useState<EnrichmentState>({ type: 'idle' })

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      await updateSavedItem(item, { text: form.text, topic: form.topic, tags, personalNote: form.personalNote })
      setItem((prev) => ({ ...prev, text: form.text, topic: form.topic, tags, personalNote: form.personalNote }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }, [form, item])

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try { await deleteSavedItem(item); onDeleted() } finally { setDeleting(false) }
  }, [confirmDelete, item, onDeleted])

  const runEnrich = useCallback(async (action: EnrichmentType) => {
    setEnrich({ type: 'loading', action })
    const text = item.text
    try {
      const handler = {
        vocab: enrichVocabulary,
        explain: explainText,
        'ielts-vocab': analyzeIeltsVocab,
        examples: generateExamples,
      }[action] as ((text: string) => Promise<VocabEnrichResult | ExplainResult | IeltsVocabResult | ExampleSentencesResult>)
      const r = await handler(text)
      const key = { vocab: 'vocab', explain: 'explain', 'ielts-vocab': 'ielts-vocab', examples: 'examples' }[action] as 'vocab' | 'explain' | 'ielts-vocab' | 'examples'
      setEnrich({ type: key, data: r } as EnrichmentState)
    } catch (err) {
      setEnrich({ type: 'error', message: err instanceof Error ? err.message : 'AI enrichment failed' })
    }
  }, [item.text])

  const isAiLoading = enrichment.type === 'loading'
  const color = CATEGORY_COLORS[item.category as SaveCategory] || 'var(--color-muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-alt)', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)', borderRadius: '10px', width: '32px', height: '32px' }} aria-label="Back">
          <IconBack size={16} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
          <CategoryIcon category={item.category as SaveCategory} size={14} /> {CATEGORY_LABELS[item.category as SaveCategory]}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {!editing && (
            <IconBtn icon={<IconEdit size={14} />} label="Edit" onClick={() => setEditing(true)} />
          )}
          <IconBtn icon={<IconDelete size={14} />} label={confirmDelete ? 'Confirm?' : 'Delete'} onClick={handleDelete} disabled={deleting} danger={!confirmDelete} />
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {editing ? (
          <EditForm form={form} setForm={setForm} onCancel={() => { setForm({ text: item.text, topic: item.topic, tags: item.tags.join(', '), personalNote: item.personalNote }); setEditing(false) }} onSave={handleSave} saving={saving} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Text */}
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.text}</p>
            </div>

            {/* Source */}
            {item.pageTitle && (
              <LabelBlock label="Source">
                {item.pageUrl ? (
                  <a href={item.pageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', wordBreak: 'break-all' }}>{item.pageTitle}</a>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{item.pageTitle}</span>
                )}
              </LabelBlock>
            )}

            {/* Meta pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '8px 10px', borderRadius: '10px', background: 'var(--color-surface-alt)' }}>
              <Pill icon={<CategoryIcon category={item.category as SaveCategory} size={11} />} label={CATEGORY_LABELS[item.category as SaveCategory]} color={color} />
              {item.topic && <Pill label={`#${item.topic}`} />}
              {item.difficulty && <Pill label={item.difficulty} />}
              <Pill label={item.status} />
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <LabelBlock label="Tags">
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {item.tags.map((tag) => (
                    <span key={tag} style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', background: `${color}12`, color, fontWeight: 500 }}>{tag}</span>
                  ))}
                </div>
              </LabelBlock>
            )}

            {/* Personal note */}
            {item.personalNote && (
              <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--color-warning-light)', borderLeft: `3px solid var(--color-warning)` }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-warning-dark)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Note</span>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{item.personalNote}</p>
              </div>
            )}

            {/* AI Tools */}
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '8px' }}>
                <IconAITutor size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                AI Tools
              </span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {([
                  { label: 'Enrich Vocab', action: 'vocab' as EnrichmentType },
                  { label: 'Explain', action: 'explain' as EnrichmentType },
                  { label: 'IELTS Level', action: 'ielts-vocab' as EnrichmentType },
                  { label: 'Examples', action: 'examples' as EnrichmentType },
                ]).map(({ label, action }) => (
                  <AiBtn key={action} label={label} loading={isAiLoading && (enrichment as any).action === action} onClick={() => runEnrich(action)} />
                ))}
              </div>

              {enrichment.type === 'error' && (
                <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: '12px', lineHeight: 1.4 }}>
                  {enrichment.message}
                </div>
              )}
              {enrichment.type === 'vocab' && <VocabResult data={enrichment.data} />}
              {enrichment.type === 'explain' && <ExplainResultCard data={enrichment.data} />}
              {enrichment.type === 'ielts-vocab' && <IeltsVocabResult data={enrichment.data} />}
              {enrichment.type === 'examples' && <ExamplesResult data={enrichment.data} />}
            </div>

            {/* Timestamps */}
            <div style={{ fontSize: '10px', color: 'var(--color-muted)', textAlign: 'center', padding: '4px 0' }}>
              Saved {timeAgo(item.createdAt)}
              {item.updatedAt !== item.createdAt && <> · Updated {timeAgo(item.updatedAt)}</>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Sub-components ─── */

function Pill({ label, icon, color }: { label: string; icon?: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 500, background: color ? `${color}15` : 'var(--color-surface)', color: color || 'var(--color-text-secondary)', border: color ? 'none' : '1px solid var(--color-border-light)' }}>
      {icon}{label}
    </span>
  )
}

function LabelBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' }}>{label}</span>
      {children}
    </div>
  )
}

function IconBtn({ icon, label, onClick, disabled, danger }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px',
        border: `1px solid ${danger ? 'var(--color-danger)' : 'var(--color-border)'}`,
        background: danger && label === 'Confirm?' ? 'var(--color-danger)' : 'transparent',
        color: danger ? (label === 'Confirm?' ? 'white' : 'var(--color-danger)') : 'var(--color-text-secondary)',
        cursor: disabled ? 'default' : 'pointer', fontSize: '11px', fontFamily: 'var(--font-sans)',
        fontWeight: 500, opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
      }}
    >
      {icon}{label}
    </button>
  )
}

function AiBtn({ label, loading, onClick }: { label: string; loading?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px',
        border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)',
        cursor: loading ? 'default' : 'pointer', fontSize: '11px', fontFamily: 'var(--font-sans)',
        fontWeight: 500, opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-light)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface)' }}
    >
      {loading ? (
        <span style={{ width: '10px', height: '10px', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
      ) : (
        <IconAITutor size={11} />
      )}
      {label}
    </button>
  )
}

function EditForm({ form, setForm, onCancel, onSave, saving }: {
  form: { text: string; topic: string; tags: string; personalNote: string }
  setForm: (f: any) => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <EditField label="Text" multiline rows={4} value={form.text} onChange={(v) => setForm((p: any) => ({ ...p, text: v }))} />
      <EditField label="Topic" value={form.topic} onChange={(v) => setForm((p: any) => ({ ...p, topic: v }))} />
      <EditField label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm((p: any) => ({ ...p, tags: v }))} placeholder="vocabulary, grammar, part1" />
      <EditField label="Personal Note" multiline rows={2} value={form.personalNote} onChange={(v) => setForm((p: any) => ({ ...p, personalNote: v }))} />

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
          Cancel
        </button>
        <button onClick={onSave} disabled={saving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600, opacity: saving ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {saving ? <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <IconCheck size={14} />}
          Save
        </button>
      </div>
    </div>
  )
}

function EditField({ label, value, onChange, multiline, rows, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; placeholder?: string
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px',
    fontFamily: 'var(--font-sans)', boxSizing: 'border-box', resize: 'vertical', outline: 'none',
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows || 3} placeholder={placeholder} style={baseStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={baseStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
        />
      )}
    </div>
  )
}

/* AI result cards */

function VocabResult({ data }: { data: VocabEnrichResult }) {
  return (
    <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--color-surface-alt)', fontSize: '12px', lineHeight: 1.55 }}>
      {data.pronunciation && <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontSize: '13px', marginBottom: '6px' }}>/{data.pronunciation}/</div>}
      {data.partOfSpeech && <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', marginBottom: '6px', fontWeight: 500 }}>{data.partOfSpeech}</span>}
      {data.meaning && <p style={{ margin: '0 0 4px', color: 'var(--color-text)', fontWeight: 500 }}>{data.meaning}</p>}
      {data.translation && <p style={{ margin: '0 0 6px', color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '11px' }}>{data.translation}</p>}
      {data.exampleSentence && <div style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--color-surface)', marginBottom: '6px', borderLeft: '2px solid var(--color-primary)' }}><span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '2px' }}>Example</span><p style={{ margin: 0, color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '11px' }}>"{data.exampleSentence}"</p></div>}
      <RowChips label="Synonyms" items={data.synonyms} />
      <RowChips label="Antonyms" items={data.antonyms} />
    </div>
  )
}

function ExplainResultCard({ data }: { data: ExplainResult }) {
  return (
    <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--color-surface-alt)', fontSize: '12px', lineHeight: 1.55 }}>
      <p style={{ margin: 0, color: 'var(--color-text)' }}>{data.explanation}</p>
      {data.examples.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '4px' }}>Examples</span>
          <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
            {data.examples.map((ex, i) => <li key={i} style={{ marginBottom: '2px' }}>{ex}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function IeltsVocabResult({ data }: { data: IeltsVocabResult }) {
  return (
    <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--color-surface-alt)', fontSize: '12px', lineHeight: 1.55 }}>
      {data.bandLevel && <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: 'var(--color-success-light)', color: 'var(--color-success)', marginBottom: '6px' }}>Band {data.bandLevel}</span>}
      {data.usage.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '4px' }}>Usage</span>
          <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
            {data.usage.map((u, i) => <li key={i} style={{ marginBottom: '2px' }}>{u}</li>)}
          </ul>
        </div>
      )}
      {data.tips && <div style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '11px', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '4px' }}><IconInfo size={14} style={{ flexShrink: 0, marginTop: '1px' }} />{data.tips}</div>}
    </div>
  )
}

function ExamplesResult({ data }: { data: ExampleSentencesResult }) {
  return (
    <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--color-surface-alt)', fontSize: '12px', lineHeight: 1.55 }}>
      <ol style={{ margin: 0, paddingLeft: '16px', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
        {data.sentences.map((s, i) => <li key={i} style={{ marginBottom: '4px', lineHeight: 1.5 }}>{s}</li>)}
      </ol>
    </div>
  )
}

function RowChips({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginTop: '6px' }}>
      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '3px' }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {items.map((s) => <span key={s} style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '10px', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}>{s}</span>)}
      </div>
    </div>
  )
}
