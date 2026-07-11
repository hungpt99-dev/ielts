import { useState, useEffect, type ReactNode } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import { IconAITutor, IconExplain, IconSimplify, IconGlobe, IconEdit, IconVocabulary, IconHelpCircle, IconMessageSquare, IconTarget, IconSave, IconCheck, IconBack, IconLock, IconRefresh, IconLoading } from '@ielts/ui'
import { safeStorageGet, safeStorageSet, safeSendMessage } from '../../utils/safe-chrome'
import type {
  AiExplainType,
  SimpleExplain,
  TranslateExplain,
  IeltsVocabResult,
  RewriteResult,
  QuizResult,
} from '@ielts/ai'

type MiniTutorAction = 'explain' | 'simplify' | 'translate' | 'exercise' | 'vocabulary' | 'questions' | 'discuss' | 'ielts-connect'

interface ActionConfig {
  id: MiniTutorAction
  icon: ReactNode
  label: string
  description: string
  color: string
}

interface MiniTutorProps {
  onBack: () => void
  initialText?: string
  initialPageInfo?: { title: string; url: string }
}

const ACTIONS: ActionConfig[] = [
  { id: 'explain', icon: <IconExplain />, label: 'Explain', description: 'Explain in simple English', color: 'var(--color-primary)' },
  { id: 'simplify', icon: <IconSimplify />, label: 'Simplify', description: 'Rewrite with simpler words', color: 'var(--color-success)' },
  { id: 'translate', icon: <IconGlobe />, label: 'Translate', description: 'Translate selected text', color: 'var(--color-skill-reading)' },
  { id: 'exercise', icon: <IconEdit />, label: 'Exercise', description: 'Turn into practice quiz', color: 'var(--color-warning)' },
  { id: 'vocabulary', icon: <IconVocabulary />, label: 'Vocabulary', description: 'Extract IELTS vocabulary', color: 'var(--color-primary)' },
  { id: 'questions', icon: <IconHelpCircle />, label: 'Questions', description: 'Generate follow-up questions', color: 'var(--color-skill-speaking)' },
  { id: 'discuss', icon: <IconMessageSquare />, label: 'Discuss', description: 'Start a discussion', color: 'var(--color-skill-listening)' },
  { id: 'ielts-connect', icon: <IconTarget />, label: 'IELTS Connect', description: 'Connect to IELTS learning', color: 'var(--color-danger)' },
]

const ACTION_AI_MAP: Record<string, AiExplainType | null> = {
  explain: 'simple',
  simplify: 'rewrite',
  translate: 'translate',
  exercise: 'quiz',
  vocabulary: 'ielts-vocab',
  questions: null,
  discuss: null,
  'ielts-connect': null,
}

const CUSTOM_PROMPTS: Record<string, { system: string; user: string }> = {
  questions: {
    system: 'You are an IELTS tutor assistant. Generate 3-5 follow-up discussion questions about the given text. Each question should help the learner think deeply about the topic and practice English. Number each question.',
    user: 'Generate follow-up questions about this text:',
  },
  discuss: {
    system: 'You are a friendly IELTS tutor having a chat with your student. Generate 3 discussion points about the text below. For each point, give a short opinion prompt or question. Keep the tone warm and supportive.',
    user: 'Let me discuss this text with you:',
  },
  'ielts-connect': {
    system: 'You are an IELTS expert. Analyze the text below and explain how it connects to IELTS exam topics. Identify which IELTS topics (Environment, Education, Technology, Health, Crime, Travel, etc.) the text relates to. Give specific examples of how this content could appear in IELTS Speaking, Writing, Reading, or Listening sections. Format clearly.',
    user: 'Connect this text to IELTS learning:',
  },
}

function formatExplainResult(type: AiExplainType, data: unknown): string {
  switch (type) {
    case 'simple': {
      const d = data as SimpleExplain
      return d.explanation
    }
    case 'translate': {
      const d = data as TranslateExplain
      let text = `[Translation]\n${d.translation}`
      if (d.vocabularyNotes?.length) {
        text += '\n\n[Vocabulary Notes]\n'
        text += d.vocabularyNotes.map(v => `  ${v.word}: ${v.meaning}`).join('\n')
      }
      return text
    }
    case 'rewrite': {
      const d = data as RewriteResult
      let text = `[Simplified]\n${d.rewritten}`
      if (d.changes) text += `\n\n[Changes]\n${d.changes}`
      if (d.tone) text += `\n\n[Tone] ${d.tone}`
      return text
    }
    case 'ielts-vocab': {
      const d = data as IeltsVocabResult
      return d.words.map(w =>
        `${w.word} (${w.partOfSpeech})\n${w.meaning}\n"${w.example}"` +
        (w.synonyms.length ? `\nSynonyms: ${w.synonyms.join(', ')}` : '') +
        (w.collocations.length ? `\nCollocations: ${w.collocations.join(', ')}` : '')
      ).join('\n\n')
    }
    case 'quiz': {
      const d = data as QuizResult
      const letters = ['A', 'B', 'C', 'D', 'E', 'F']
      return d.questions.map((q, i) =>
        `Question ${i + 1}: ${q.question}\n` +
        q.options.map((opt, oi) => `  ${letters[oi]}. ${opt}`).join('\n') +
        `\n[Answer] ${letters[q.correctAnswer]}\n${q.explanation}`
      ).join('\n\n')
    }
    default:
      return JSON.stringify(data, null, 2)
  }
}

export default function MiniTutor({ onBack, initialText, initialPageInfo }: MiniTutorProps) {
  const { showToast } = useToast()
  const [selectedText, setSelectedText] = useState('')
  const [pageInfo, setPageInfo] = useState({ title: '', url: '' })
  const [loading, setLoading] = useState(true)
  const [activeAction, setActiveAction] = useState<MiniTutorAction | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (initialText) {
      setSelectedText(initialText)
      if (initialPageInfo) {
        setPageInfo(initialPageInfo)
      }
      setLoading(false)
      return
    }

    let cancelled = false
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (cancelled) return
      const tab = tabs[0]
      if (!tab?.id) {
        setLoading(false)
        return
      }

      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }, (response) => {
        if (cancelled) return
        if (chrome.runtime.lastError) {
          setPageInfo({ title: tab.title || '', url: tab.url || '' })
          setLoading(false)
          return
        }
        setLoading(false)
        if (response?.selectedText) {
          setSelectedText(response.selectedText)
          setPageInfo({ title: response.title || tab.title || '', url: response.url || tab.url || '' })
        } else {
          setPageInfo({ title: tab.title || '', url: tab.url || '' })
        }
      })
    })

    return () => { cancelled = true }
  }, [initialText, initialPageInfo])

  const handleAction = async (action: MiniTutorAction) => {
    if (!selectedText) {
      showToast('warning', 'Select text on a webpage first')
      return
    }

    setActiveAction(action)
    setResult(null)
    setError(null)
    setActionLoading(true)
    setSaved(false)

    const aiType = ACTION_AI_MAP[action]
    const customPrompt = CUSTOM_PROMPTS[action]

    try {
      let response: { success: boolean; data?: unknown; message?: string }

      if (aiType) {
        response = await new Promise<{ success: boolean; data?: unknown; message?: string }>((resolve) => {
          try {
            chrome.runtime.sendMessage(
              { type: 'AI_EXPLAIN', payload: { text: selectedText, action: aiType } },
              (res) => {
                if (chrome.runtime.lastError) {
                  resolve({ success: false, message: chrome.runtime.lastError.message })
                } else {
                  resolve(res as { success: boolean; data?: unknown; message?: string })
                }
              },
            )
          } catch (err: any) {
            resolve({ success: false, message: err.message })
          }
        })
      } else if (customPrompt) {
        response = await new Promise<{ success: boolean; data?: unknown; message?: string }>((resolve) => {
          try {
            chrome.runtime.sendMessage(
              {
                type: 'AI_EXPLAIN',
                payload: {
                  text: selectedText,
                  action: 'custom',
                  systemPrompt: customPrompt.system,
                  userPrompt: customPrompt.user,
                },
              },
              (res) => {
                if (chrome.runtime.lastError) {
                  resolve({ success: false, message: chrome.runtime.lastError.message })
                } else {
                  resolve(res as { success: boolean; data?: unknown; message?: string })
                }
              },
            )
          } catch (err: any) {
            resolve({ success: false, message: err.message })
          }
        })
      } else {
        throw new Error('Unknown action')
      }

      if (!response.success) {
        setError(response.message || 'AI request failed')
      } else if (response.data) {
        if (aiType) {
          setResult(formatExplainResult(aiType, response.data))
        } else {
          setResult(response.data as string)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }

    setActionLoading(false)
  }

  const handleSaveResult = () => {
    if (!result) return

    const entry = {
      id: crypto.randomUUID(),
      text: result,
      category: 'reading' as const,
      topic: '',
      skill: 'general' as const,
      difficulty: '' as const,
      tags: activeAction ? [activeAction] : [],
      personalNote: `AI Tutor result from: ${pageInfo.title}`,
      pageTitle: pageInfo.title,
      pageUrl: pageInfo.url,
      status: 'new' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveItem(entry, 'notesAdded')
    setSaved(true)
    showToast('success', 'Saved as note')
  }

  const handleSaveVocabulary = () => {
    if (!selectedText) return

    const entry = {
      id: crypto.randomUUID(),
      text: selectedText,
      category: 'vocabulary' as const,
      topic: '',
      skill: 'vocabulary' as const,
      difficulty: '' as const,
      tags: [],
      personalNote: `Saved from: ${pageInfo.title}`,
      pageTitle: pageInfo.title,
      pageUrl: pageInfo.url,
      status: 'new' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveItem(entry, 'wordsAdded')
    showToast('success', 'Saved as vocabulary')
  }

  async function saveItem(entry: Record<string, unknown>, progressField: 'wordsAdded' | 'notesAdded') {
    const result = await safeStorageGet<any[]>('savedItems')
    const items = result.savedItems || []
    items.unshift(entry)
    await safeStorageSet({ savedItems: items })
    safeSendMessage({
      type: 'UPDATE_PROGRESS',
      payload: { [progressField]: 1 },
    })
  }

  const personalityTips = [
    "You're doing great — keep learning!",
    "Every mistake is a step forward!",
    "Small steps lead to big progress!",
    "You've got this — I believe in you!",
    "Learning English is a journey, enjoy it!",
  ]
  const [tipIndex] = useState(() => Math.floor(Math.random() * personalityTips.length))

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button onClick={onBack} style={backBtnStyle} aria-label="Go back to dashboard">
          <IconBack size={14} /> Back
        </button>
        <div style={headerTitleStyle}>
          <IconAITutor size={16} />
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>AI Tutor</span>
        </div>
      </div>

      {!selectedText && !loading && (
        <div style={{
          ...personalityBannerStyle,
          background: 'color-mix(in srgb, var(--color-primary) 6%, transparent)',
        }}>
          <IconExplain size={14} />
          <span style={{ fontSize: 'var(--text-xs)', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
            {personalityTips[tipIndex]}
          </span>
        </div>
      )}

      {loading ? (
        <div style={centerStyle}>
          <IconLoading size={24} />
          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>Getting selected text...</p>
        </div>
      ) : !selectedText ? (
        <div style={emptyStyle}>
          <IconAITutor size={36} style={{ opacity: 0.6 }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
            Hi! I'm your IELTS learning friend!
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', textAlign: 'center', lineHeight: '1.4', marginTop: 'var(--spacing-3xs)' }}>
            Select text on any webpage, then open the popup. I'll help you understand, learn vocabulary, and practice IELTS!
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center', lineHeight: '1.4', marginTop: 'var(--spacing-2xs)' }}>
            Tip: You can also right-click selected text and choose <strong>"Explain with AI"</strong>.
          </p>
          <div style={{
            marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-xs) var(--spacing-sm)',
            background: 'color-mix(in srgb, var(--color-primary) 6%, transparent)',
            borderRadius: 'var(--radius-xl)', fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)', lineHeight: '1.5',
            textAlign: 'center',
          }}>
            Ready to learn something new today? You've got this!
          </div>
        </div>
      ) : (
        <>
          {pageInfo.title && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2xs)',
                padding: 'var(--spacing-2xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-alt)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                overflow: 'hidden',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pageInfo.title}
              </span>
            </div>
          )}
          <div style={textBoxStyle}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', marginBottom: 'var(--spacing-2xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Selected Text
            </div>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: '1.5', wordBreak: 'break-word' }}>
              &ldquo;{selectedText.length > 180 ? selectedText.slice(0, 180) + '...' : selectedText}&rdquo;
            </p>
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', marginBottom: 'var(--spacing-2xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Choose an action
            </div>
            <div style={gridStyle}>
              {ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={actionLoading}
                  aria-label={action.label}
                  title={action.description}
                  style={{
                    ...actionBtnStyle,
                    borderColor: activeAction === action.id ? action.color : 'var(--color-border)',
                    background: activeAction === action.id
                      ? `color-mix(in srgb, ${action.color} 12%, transparent)`
                      : 'var(--color-surface)',
                    opacity: actionLoading ? 0.5 : 1,
                    cursor: actionLoading ? 'default' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) {
                      e.currentTarget.style.background = `color-mix(in srgb, ${action.color} 10%, transparent)`
                      e.currentTarget.style.borderColor = action.color
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeAction !== action.id) {
                      e.currentTarget.style.background = 'var(--color-surface)'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }
                  }}
                >
                  <span style={{ fontSize: 'var(--text-xl)', lineHeight: '1', display: 'inline-flex', alignItems: 'center' }}>{action.icon}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: activeAction === action.id ? action.color : 'var(--color-text)', lineHeight: '1.2', textAlign: 'center' }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveVocabulary}
            style={quickSaveBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
            }}
          >
            <IconSave size={14} />
            <span>Save selected text as vocabulary</span>
          </button>

          <style>{`
            @keyframes mini-tutor-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          {actionLoading && (
            <div style={centerStyle}>
              <div style={{
                width: '22px', height: '22px',
                border: '2px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: 'var(--radius-full)',
                animation: 'mini-tutor-spin 0.7s linear infinite',
              }} />
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)' }}>
                {activeAction === 'explain' ? 'Explaining...' :
                 activeAction === 'simplify' ? 'Simplifying...' :
                 activeAction === 'translate' ? 'Translating...' :
                 activeAction === 'exercise' ? 'Generating exercises...' :
                 activeAction === 'vocabulary' ? 'Extracting vocabulary...' :
                 activeAction === 'questions' ? 'Generating questions...' :
                 activeAction === 'discuss' ? 'Preparing discussion...' :
                 'Analyzing...'}
              </p>
            </div>
          )}

          {error && (
            <div style={errorBoxStyle}>
              <div style={{ fontSize: 'var(--text-sm)', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--color-danger-dark)' }}>
                {error.includes('API key') ? (
                  <>
                    <strong><IconLock size={12} /> API Key Required</strong>
                    <p style={{ marginTop: 'var(--spacing-2xs)', color: 'var(--color-danger-dark)' }}>
                      Add your AI API key in the extension Settings to use AI features.
                    </p>
                  </>
                ) : (
                  error
                )}
              </div>
              {error.includes('API key') && (
                <button
                  onClick={() => safeSendMessage({ type: 'OPEN_OPTIONS' })}
                  style={{
                    marginTop: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm) var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                  }}
                >
                  Open Settings
                </button>
              )}
              {!error.includes('API key') && (
                <button
                  onClick={() => activeAction && handleAction(activeAction)}
                  style={{
                    marginTop: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm) var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                  }}
                >
                  <IconRefresh size={12} /> Try Again
                </button>
              )}
            </div>
          )}

          {result && (
            <div style={resultBoxStyle}>
              <div style={{
                fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                color: activeAction ? ACTIONS.find(a => a.id === activeAction)?.color || 'var(--color-muted)' : 'var(--color-muted)',
                marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {activeAction ? ACTIONS.find(a => a.id === activeAction)?.label : 'Result'}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-text)' }}>
                {result}
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                <button
                  onClick={handleSaveResult}
                  disabled={saved}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    borderRadius: 'var(--radius-lg)',
                    border: 'none',
                    background: saved ? 'var(--color-success)' : 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: saved ? 'default' : 'pointer',
                    opacity: saved ? 0.8 : 1,
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {saved ? <><IconCheck size={12} /> Saved</> : <><IconSave size={12} /> Save as Note</>}
                </button>
                {!saved && (
                  <button
                    onClick={handleSaveVocabulary}
                    style={{
                      flex: 1,
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-medium)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <IconVocabulary size={12} /> Save Vocab
                  </button>
                )}
              </div>
              {saved && (
                <p style={{ margin: 'var(--spacing-2xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-success)', textAlign: 'center' }}>
                  <IconCheck size={10} /> Saved! You can find it in the main app.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const personalityBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-xs)',
  padding: 'var(--spacing-sm) var(--spacing-sm)',
  borderRadius: 'var(--radius-xl)',
  marginBottom: 'var(--spacing-2xs)',
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: 'var(--spacing-md)',
  minHeight: '500px',
  gap: 'var(--spacing-sm)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-xs)',
}

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--spacing-2xs) var(--spacing-xs)',
  borderRadius: 'var(--radius-md)',
}

const headerTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-2xs)',
}

const centerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--spacing-2xl) var(--spacing-md)',
  gap: 'var(--spacing-sm)',
  flex: 1,
}

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--spacing-2xl) var(--spacing-md)',
  gap: 'var(--spacing-xs)',
  flex: 1,
}

const textBoxStyle: React.CSSProperties = {
  background: 'var(--color-surface-alt)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--spacing-sm) var(--spacing-sm)',
  border: '1px solid var(--color-border)',
  maxHeight: '80px',
  overflowY: 'auto',
  width: '100%',
  boxSizing: 'border-box',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--spacing-2xs)',
}

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--spacing-2xs)',
  padding: 'var(--spacing-sm) var(--spacing-2xs)',
  borderRadius: 'var(--radius-2xl)',
  border: '1px solid var(--color-border)',
  transition: 'var(--transition-fast)',
  background: 'var(--color-surface)',
  fontFamily: 'inherit',
  boxShadow: 'var(--shadow-sm)',
}

const quickSaveBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--spacing-2xs)',
  padding: 'var(--spacing-xs) var(--spacing-sm)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-primary)',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  color: 'var(--color-primary)',
  transition: 'var(--transition-fast)',
  fontFamily: 'inherit',
}

const resultBoxStyle: React.CSSProperties = {
  background: 'var(--color-surface-alt)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--spacing-sm)',
  border: '1px solid var(--color-border)',
  maxHeight: '280px',
  overflowY: 'auto',
  width: '100%',
  boxSizing: 'border-box',
}

const errorBoxStyle: React.CSSProperties = {
  background: 'var(--color-danger-light)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--spacing-sm)',
  border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)',
  width: '100%',
  boxSizing: 'border-box',
}
