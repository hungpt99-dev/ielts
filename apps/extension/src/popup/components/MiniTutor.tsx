import { useState, useEffect } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import { safeStorageGet, safeStorageSet, safeSendMessage } from '../../utils/safe-chrome'
import type {
  AiExplainType,
  SimpleExplain,
  VietnameseExplain,
  IeltsVocabResult,
  RewriteResult,
  QuizResult,
} from '@ielts/ai'

type MiniTutorAction = 'explain' | 'simplify' | 'translate' | 'exercise' | 'vocabulary' | 'questions' | 'discuss' | 'ielts-connect'

interface ActionConfig {
  id: MiniTutorAction
  icon: string
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
  { id: 'explain', icon: '💡', label: 'Explain', description: 'Explain in simple English', color: '#3b82f6' },
  { id: 'simplify', icon: '✂️', label: 'Simplify', description: 'Rewrite with simpler words', color: '#10b981' },
  { id: 'translate', icon: '🌐', label: 'Translate', description: 'Translate to Vietnamese', color: '#8b5cf6' },
  { id: 'exercise', icon: '📝', label: 'Exercise', description: 'Turn into practice quiz', color: '#f59e0b' },
  { id: 'vocabulary', icon: '📖', label: 'Vocabulary', description: 'Extract IELTS vocabulary', color: '#3b82f6' },
  { id: 'questions', icon: '❓', label: 'Questions', description: 'Generate follow-up questions', color: '#ec4899' },
  { id: 'discuss', icon: '💬', label: 'Discuss', description: 'Start a discussion', color: '#06b6d4' },
  { id: 'ielts-connect', icon: '🎯', label: 'IELTS Connect', description: 'Connect to IELTS learning', color: '#ef4444' },
]

const ACTION_AI_MAP: Record<string, AiExplainType | null> = {
  explain: 'simple',
  simplify: 'rewrite',
  translate: 'vietnamese',
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
    case 'vietnamese': {
      const d = data as VietnameseExplain
      let text = `📝 Translation:\n${d.translation}`
      if (d.vocabularyNotes?.length) {
        text += '\n\n📖 Vocabulary Notes:\n'
        text += d.vocabularyNotes.map(v => `• ${v.word}: ${v.meaning}`).join('\n')
      }
      return text
    }
    case 'rewrite': {
      const d = data as RewriteResult
      let text = `✂️ Simplified:\n${d.rewritten}`
      if (d.changes) text += `\n\n🔄 Changes:\n${d.changes}`
      if (d.tone) text += `\n\n🎭 Tone: ${d.tone}`
      return text
    }
    case 'ielts-vocab': {
      const d = data as IeltsVocabResult
      return d.words.map(w =>
        `📖 ${w.word} (${w.partOfSpeech})\n${w.meaning}\n"${w.example}"` +
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
        `\n✅ Answer: ${letters[q.correctAnswer]}\n💡 ${q.explanation}`
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

      try {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' }, (response) => {
          if (cancelled) return
          setLoading(false)
          if (response?.selectedText) {
            setSelectedText(response.selectedText)
            setPageInfo({ title: response.title || tab.title || '', url: response.url || tab.url || '' })
          } else {
            setPageInfo({ title: tab.title || '', url: tab.url || '' })
          }
        })
      } catch {
        if (!cancelled) setLoading(false)
      }
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
    "You're doing great — keep learning! 🌟",
    "Every mistake is a step forward! 💪",
    "Small steps lead to big progress! 🚀",
    "You've got this — I believe in you! ✨",
    "Learning English is a journey, enjoy it! 🌈",
  ]
  const [tipIndex] = useState(() => Math.floor(Math.random() * personalityTips.length))

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button onClick={onBack} style={backBtnStyle} aria-label="Go back to dashboard">
          ← Back
        </button>
        <div style={headerTitleStyle}>
          <span style={{ fontSize: '16px' }}>🎓</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>AI Tutor</span>
        </div>
      </div>

      {!selectedText && !loading && (
        <div style={{
          ...personalityBannerStyle,
          background: 'linear-gradient(135deg, #3b82f615, #8b5cf615)',
        }}>
          <span style={{ fontSize: '14px' }}>💡</span>
          <span style={{ fontSize: '11px', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
            {personalityTips[tipIndex]}
          </span>
        </div>
      )}

      {loading ? (
        <div style={centerStyle}>
          <div style={{ fontSize: '24px' }}>⏳</div>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>Getting selected text...</p>
        </div>
      ) : !selectedText ? (
        <div style={emptyStyle}>
          <div style={{ fontSize: '36px', marginBottom: '4px', opacity: 0.6 }}>🎓</div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
            Hi! I'm your IELTS learning friend! 👋
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: '1.4', marginTop: '2px' }}>
            Select text on any webpage, then open the popup. I'll help you understand, learn vocabulary, and practice IELTS!
          </p>
          <p style={{ fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: '1.4', marginTop: '4px' }}>
            💡 You can also right-click selected text and choose <strong>"Explain with AI"</strong>.
          </p>
          <div style={{
            marginTop: '12px', padding: '8px 12px',
            background: 'linear-gradient(135deg, #3b82f610, #8b5cf610)',
            borderRadius: '10px', fontSize: '11px',
            color: 'var(--color-text-secondary)', lineHeight: '1.5',
            textAlign: 'center',
          }}>
            Ready to learn something new today? You've got this! 🌟
          </div>
        </div>
      ) : (
        <>
          <div style={textBoxStyle}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Selected Text
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5', wordBreak: 'break-word' }}>
              &ldquo;{selectedText.length > 180 ? selectedText.slice(0, 180) + '...' : selectedText}&rdquo;
            </p>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                    background: activeAction === action.id ? `${action.color}12` : 'var(--color-surface)',
                    opacity: actionLoading ? 0.5 : 1,
                    cursor: actionLoading ? 'default' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) {
                      e.currentTarget.style.background = `${action.color}10`
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
                  <span style={{ fontSize: '20px', lineHeight: '1' }}>{action.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 500, color: activeAction === action.id ? action.color : 'var(--color-text)', lineHeight: '1.2', textAlign: 'center' }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveVocabulary}
            style={quickSaveBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#3b82f610'; e.currentTarget.style.borderColor = '#3b82f6' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#3b82f6' }}
          >
            <span>📥</span>
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
                borderRadius: '50%',
                animation: 'mini-tutor-spin 0.7s linear infinite',
              }} />
              <p style={{ color: 'var(--color-muted)', fontSize: '12px' }}>
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
              <div style={{ fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: '#dc2626' }}>
                {error.includes('API key') ? (
                  <>
                    <strong>🔑 API Key Required</strong>
                    <p style={{ marginTop: '6px', color: '#991b1b' }}>
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
                    marginTop: '10px',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
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
                    marginTop: '10px',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  🔄 Try Again
                </button>
              )}
            </div>
          )}

          {result && (
            <div style={resultBoxStyle}>
              <div style={{
                fontSize: '10px', fontWeight: 600,
                color: activeAction ? ACTIONS.find(a => a.id === activeAction)?.color || 'var(--color-muted)' : 'var(--color-muted)',
                marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {activeAction ? ACTIONS.find(a => a.id === activeAction)?.label : 'Result'}
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-text)' }}>
                {result}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={handleSaveResult}
                  disabled={saved}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: saved ? 'var(--color-success)' : 'var(--color-primary)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: saved ? 'default' : 'pointer',
                    opacity: saved ? 0.8 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {saved ? '✓ Saved' : '💾 Save as Note'}
                </button>
                {!saved && (
                  <button
                    onClick={handleSaveVocabulary}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    📖 Save Vocab
                  </button>
                )}
              </div>
              {saved && (
                <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'var(--color-muted)', textAlign: 'center' }}>
                  You can find your saved items in the main app's Vocabulary and Notes sections.
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
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '10px',
  marginBottom: '4px',
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  minHeight: '500px',
  gap: '12px',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  padding: '4px 8px',
  borderRadius: '6px',
}

const headerTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const centerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 16px',
  gap: '12px',
  flex: 1,
}

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 16px',
  gap: '8px',
  flex: 1,
}

const textBoxStyle: React.CSSProperties = {
  background: 'var(--color-surface-alt)',
  borderRadius: '10px',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  maxHeight: '80px',
  overflowY: 'auto',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
  gap: '6px',
}

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '10px 4px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  transition: 'all 0.15s',
  background: 'var(--color-surface)',
  fontFamily: 'inherit',
}

const quickSaveBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #3b82f6',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  color: '#3b82f6',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
}

const resultBoxStyle: React.CSSProperties = {
  background: 'var(--color-surface-alt)',
  borderRadius: '10px',
  padding: '12px',
  border: '1px solid var(--color-border)',
  maxHeight: '280px',
  overflowY: 'auto',
}

const errorBoxStyle: React.CSSProperties = {
  background: '#fef2f2',
  borderRadius: '10px',
  padding: '12px',
  border: '1px solid #fecaca',
}
