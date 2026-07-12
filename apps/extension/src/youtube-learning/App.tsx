import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { VideoPageInfo } from './infrastructure/youtube/YouTubePageDetector'
import { LearningEventBus, type LearningEvent } from './domain/events/LearningEventBus'
import { contentScriptMessageSchema } from './schemas/messages'
import { TabBar } from './presentation/components/TabBar'
import type { TabDefinition } from './presentation/components/TabBar'
import { VocabularyDetail } from './presentation/components/VocabularyDetail'
import { SentenceExplanationPanel } from './presentation/components/SentenceExplanation'
import { QuizPanel } from './presentation/components/QuizPanel'
import { FillInBlankPanel } from './presentation/components/FillInBlank'
import { IconHeadphones } from '@ielts/ui'
import { tokenizeSegment, normalizeWord, formatTime } from './presentation/utils/tokenizeTranscript'

export type PanelTab = 'overview' | 'transcript' | 'practice'

interface AppState {
  videoInfo: VideoPageInfo | null
  isLearningMode: boolean
  activeTab: PanelTab
  transcriptAvailable: boolean
  isFocusMode: boolean
  currentTime: number
}

export function YouTubeLearningApp() {
  const [state, setState] = useState<AppState>({
    videoInfo: null,
    isLearningMode: false,
    activeTab: 'overview',
    transcriptAvailable: false,
    isFocusMode: false,
    currentTime: 0,
  })
  const eventBusRef = useRef(LearningEventBus.getInstance())

  const sendToParent = useCallback((type: string, payload?: unknown) => {
    try {
      window.parent.postMessage(
        { source: 'ielts-youtube-learning', type, payload },
        '*',
      )
    } catch {
      // iframe may be detached
    }
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      const parsed = contentScriptMessageSchema.safeParse(event.data)
      if (!parsed.success) return
      const { type, payload } = parsed.data
      switch (type) {
        case 'VIDEO_INFO':
          if (payload && typeof payload === 'object' && 'videoId' in (payload as Record<string, unknown>)) {
            setState(prev => ({ ...prev, videoInfo: payload as VideoPageInfo }))
          }
          break
        case 'TIME_UPDATE':
          if (typeof payload === 'number') {
            setState(prev => ({ ...prev, currentTime: payload }))
          }
          break
        case 'TRANSCRIPT_AVAILABLE':
          if (typeof payload === 'boolean') {
            setState(prev => ({ ...prev, transcriptAvailable: payload }))
          }
          break
        case 'FOCUS_MODE':
          if (typeof payload === 'boolean') {
            setState(prev => ({ ...prev, isFocusMode: payload }))
          }
          break
        case 'LEARNING_EVENT':
          if (payload && typeof payload === 'object') {
            eventBusRef.current.emit(payload as LearningEvent)
          }
          break
        case 'LEARNING_MODE_STATE':
          if (typeof payload === 'boolean') {
            setState(prev => ({ ...prev, isLearningMode: payload }))
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)
    sendToParent('PANEL_READY')
    return () => window.removeEventListener('message', handleMessage)
  }, [sendToParent])

  const toggleLearningMode = useCallback(() => {
    setState(prev => {
      const newMode = !prev.isLearningMode
      sendToParent('TOGGLE_LEARNING_MODE', newMode)
      return { ...prev, isLearningMode: newMode, activeTab: newMode ? 'overview' : prev.activeTab }
    })
  }, [sendToParent])

  const setActiveTab = useCallback((tab: PanelTab) => {
    setState(prev => ({ ...prev, activeTab: tab }))
  }, [])

  const toggleFocusMode = useCallback(() => {
    sendToParent('TOGGLE_FOCUS_MODE', !state.isFocusMode)
    setState(prev => ({ ...prev, isFocusMode: !prev.isFocusMode }))
  }, [state.isFocusMode, sendToParent])

  if (!state.videoInfo) {
    return (
      <div style={{ padding: 'var(--spacing-md)', fontFamily: 'var(--font-sans)', color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.6 }}>IELTS Journey</div>
          <div style={{ marginTop: 'var(--spacing-xs)' }}>Waiting for video...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)', color: 'var(--color-text)', backgroundColor: 'var(--color-background)',
      overflow: 'hidden',
    }}>
      <Header
        isLearningMode={state.isLearningMode}
        onToggle={toggleLearningMode}
        onToggleFocus={toggleFocusMode}
        isFocusMode={state.isFocusMode}
      />
      {state.isLearningMode ? (
        <>
          <TabBar tabs={TABS} activeTab={state.activeTab} onChange={setActiveTab} />
          <div style={{ flex: 1, minHeight: 0 }}>
            <PanelContent
              activeTab={state.activeTab}
              videoInfo={state.videoInfo}
              currentTime={state.currentTime}
              transcriptAvailable={state.transcriptAvailable}
              sendToParent={sendToParent}
            />
          </div>
        </>
      ) : (
        <DisabledState />
      )}
    </div>
  )
}

function Header({ isLearningMode, onToggle, onToggleFocus, isFocusMode }: {
  isLearningMode: boolean
  onToggle: () => void
  onToggleFocus: () => void
  isFocusMode: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--spacing-sm) var(--spacing-md)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>IELTS Journey</span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--spacing-2xs)' }}>
        <button
          onClick={onToggleFocus}
          title={isFocusMode ? 'Disable Focus Mode' : 'Enable Focus Mode'}
          style={{
            padding: 'var(--spacing-2xs) var(--spacing-xs)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--color-border)',
            background: isFocusMode ? 'var(--color-primary-dark)' : 'transparent',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
          }}
          aria-label={isFocusMode ? 'Disable Focus Mode' : 'Enable Focus Mode'}
        >
          {isFocusMode ? 'Focus On' : 'Focus'}
        </button>
        <button
          onClick={onToggle}
          style={{
            padding: 'var(--spacing-2xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            background: isLearningMode ? 'var(--color-primary)' : 'var(--color-surface-alt)',
            color: isLearningMode ? 'var(--color-on-primary)' : 'var(--color-muted)',
            cursor: 'pointer',
            fontWeight: 'var(--weight-medium)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
          }}
          aria-label={isLearningMode ? 'Disable Learning Mode' : 'Enable Learning Mode'}
          aria-pressed={isLearningMode}
        >
          {isLearningMode ? 'Learning' : 'Study'}
        </button>
      </div>
    </div>
  )
}

const TABS: TabDefinition[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'practice', label: 'Practice' },
]

function PanelContent({ activeTab, videoInfo, currentTime, transcriptAvailable, sendToParent }: {
  activeTab: PanelTab
  videoInfo: VideoPageInfo
  currentTime: number
  transcriptAvailable: boolean
  sendToParent: (type: string, payload?: unknown) => void
}) {
  switch (activeTab) {
    case 'overview':
      return <OverviewPanel videoInfo={videoInfo} transcriptAvailable={transcriptAvailable} currentTime={currentTime} sendToParent={sendToParent} />
    case 'transcript':
      return <TranscriptPanel videoId={videoInfo.videoId} currentTime={currentTime} sendToParent={sendToParent} />
    case 'practice':
      return <PracticePanel transcriptAvailable={transcriptAvailable} videoId={videoInfo.videoId} sendToParent={sendToParent} />
    default:
      return <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-muted)' }}>Select a tab</div>
  }
}

function DisabledState() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 'var(--spacing-xl)', textAlign: 'center', gap: 'var(--spacing-md)',
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
      <div style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-base)' }}>Study with IELTS Journey</div>
      <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-relaxed)' }}>
        Click "Study" to enable learning mode.<br />
        Save vocabulary, take notes, and practice.
      </div>
    </div>
  )
}

function OverviewPanel({ videoInfo, transcriptAvailable, currentTime, sendToParent }: {
  videoInfo: VideoPageInfo
  transcriptAvailable: boolean
  currentTime: number
  sendToParent: (type: string, payload?: unknown) => void
}) {
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [techOpen, setTechOpen] = useState(false)

  useEffect(() => {
    if (!transcriptAvailable) return
    setAnalysisLoading(true)
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      if (event.data?.type === 'ANALYSIS_DATA') {
        const payload = event.data.payload as Record<string, unknown> | undefined
        if (payload && !payload.error) setAnalysis(payload)
        setAnalysisLoading(false)
      }
    }
    window.addEventListener('message', handler)
    sendToParent('REQUEST_ANALYSIS')
    return () => window.removeEventListener('message', handler)
  }, [transcriptAvailable, sendToParent])

  const sectionTitle: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }
  const cardStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', marginBottom: '10px' }
  const badge = (bg: string, color: string, label: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: bg, color, fontSize: '11px', fontWeight: 500,
  })
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '12px' }

  return (
    <div style={{ height: '100%', padding: 'var(--spacing-sm)', overflow: 'auto' }}>
      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', marginBottom: '2px', lineHeight: 1.3 }}>
        {videoInfo.videoTitle || 'Untitled Video'}
      </div>
      {videoInfo.channelName && (
        <div style={{ color: 'var(--color-muted)', fontSize: '11px', marginBottom: '12px' }}>{videoInfo.channelName}</div>
      )}

      {/* IELTS Suitability Card */}
      {analysis && (
        <div style={cardStyle}>
          <div style={sectionTitle}>IELTS Suitability</div>
          <div style={row}>
            <span style={{ color: 'var(--color-muted)' }}>CEFR Level</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{String(analysis.cefrLevel || '—')}</span>
          </div>
          <div style={row}>
            <span style={{ color: 'var(--color-muted)' }}>Speaking Speed</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{analysis.speakingSpeed ? `${analysis.speakingSpeed} wpm` : '—'}</span>
          </div>
          <div style={row}>
            <span style={{ color: 'var(--color-muted)' }}>Word Count</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{String(analysis.wordCount || '—')}</span>
          </div>
          <div style={row}>
            <span style={{ color: 'var(--color-muted)' }}>Lexical Diversity</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{analysis.lexicalDiversity ? `${(analysis.lexicalDiversity as number).toFixed(2)}` : '—'}</span>
          </div>
        </div>
      )}

      {analysisLoading && (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--color-muted)', fontSize: '11px' }}>
          Analysing transcript...
        </div>
      )}

      {/* Topics */}
      {analysis?.topics && Array.isArray(analysis.topics) && (analysis.topics as string[]).length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitle}>Topics</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {(analysis.topics as string[]).map((t: string, i: number) => (
              <span key={i} style={badge('rgba(59,130,246,0.15)', 'var(--color-primary-hover)', t)}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Transcript Status */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Transcript</div>
        <div style={row}>
          <span style={{ color: 'var(--color-muted)' }}>Status</span>
          <span style={{ fontWeight: 500, color: transcriptAvailable ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {transcriptAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Technical Details (collapsible) */}
      <details
        open={techOpen}
        onToggle={(e) => setTechOpen((e.target as HTMLDetailsElement).open)}
        style={{ fontSize: '12px' }}
      >
        <summary style={{ cursor: 'pointer', color: 'var(--color-muted)', fontSize: '11px', padding: '4px 0', userSelect: 'none' }}>
          Technical Details
        </summary>
        <div style={{ padding: '6px 0 0 0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={row}><span style={{ color: 'var(--color-muted)' }}>Video ID</span><span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>{videoInfo.videoId}</span></div>
          <div style={row}><span style={{ color: 'var(--color-muted)' }}>Current Time</span><span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>{formatTime(currentTime)}</span></div>
          <div style={{ ...row, flexWrap: 'wrap' }}><span style={{ color: 'var(--color-muted)' }}>URL</span><span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{videoInfo.videoUrl}</span></div>
        </div>
      </details>
    </div>
  )
}

interface VocabWordState {
  word: string
  normalized: string
  sentence: string
  startTime: number
}

function TranscriptPanel({ videoId, currentTime, sendToParent }: {
  videoId: string
  currentTime: number
  sendToParent: (type: string, payload?: unknown) => void
}) {
  const [segments, setSegments] = useState<Array<{ id: string; start: number; end: number; text: string }> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vocabWord, setVocabWord] = useState<VocabWordState | null>(null)
  const [activeSentence, setActiveSentence] = useState<{ text: string; start: number; end: number } | null>(null)
  const [explainSentence, setExplainSentence] = useState<{ text: string; startTime: number } | null>(null)
  const [translateEnabled, setTranslateEnabled] = useState(false)
  const [translations, setTranslations] = useState<Map<string, string>>(new Map())
  const [translating, setTranslating] = useState(false)
  const translateLanguageRef = useRef('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setVocabWord(null)
    sendToParent('REQUEST_TRANSCRIPT')

    const timeoutId = setTimeout(() => {
      setError('Transcript request timed out')
      setLoading(false)
      sendToParent('CANCEL_TRANSCRIPT')
    }, 30000)

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      if (event.data?.type === 'TRANSCRIPT_DATA') {
        setSegments(event.data.payload)
        setLoading(false)
        clearTimeout(timeoutId)
      }
      if (event.data?.type === 'TRANSCRIPT_UNAVAILABLE') {
        setSegments(null)
        setLoading(false)
        clearTimeout(timeoutId)
      }
      if (event.data?.type === 'TRANSCRIPT_ERROR') {
        const payload = event.data.payload as Record<string, unknown> | undefined
        setSegments(null)
        setLoading(false)
        setError((payload?.message as string) || 'Transcript unavailable')
        clearTimeout(timeoutId)
      }
      if (event.data?.type === 'TRANSLATED_SEGMENTS') {
        const payload = event.data.payload as Record<string, unknown> | undefined
        setTranslating(false)
        if (payload?.error) return
        const translated = payload?.segments as Array<{ id: string; translatedText: string }> | undefined
        if (translated) {
          setTranslations(prev => {
            const next = new Map(prev)
            for (const s of translated) next.set(s.id, s.translatedText)
            return next
          })
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timeoutId)
    }
  }, [videoId, sendToParent])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      if (event.data?.type === 'SETTINGS_DATA') {
        const payload = event.data.payload as { nativeLanguage?: string; autoTranslateTranscript?: boolean } | undefined
        if (payload?.nativeLanguage) {
          translateLanguageRef.current = payload.nativeLanguage
        }
        if (payload?.autoTranslateTranscript && payload?.nativeLanguage) {
          setTranslateEnabled(true)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    if (!translateEnabled || !segments || segments.length === 0 || !translateLanguageRef.current) return
    setTranslations(new Map())
    setTranslating(true)
    sendToParent('TRANSLATE_SEGMENTS', { segments, language: translateLanguageRef.current })
  }, [translateEnabled, segments, sendToParent])

  const activeIndex = segments?.findIndex(
    s => currentTime >= s.start && currentTime < s.end,
  ) ?? -1

  const tokenizedSegments = useMemo(() => {
    if (!segments) return null
    return segments.map(seg => ({
      ...seg,
      tokens: tokenizeSegment(seg.text),
    }))
  }, [segments])

  useEffect(() => {
    if (activeIndex >= 0 && containerRef.current && !vocabWord) {
      const el = containerRef.current.querySelector(`[data-seg-idx="${activeIndex}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIndex, vocabWord])

  const handleSegmentClick = (start: number) => {
    sendToParent('SEEK_TO', start)
  }

  const handleSentenceTextClick = (e: React.MouseEvent, seg: { text: string; start: number; end: number }) => {
    e.stopPropagation()
    setActiveSentence(prev =>
      prev?.start === seg.start && prev?.text === seg.text ? null : { text: seg.text, start: seg.start, end: seg.end },
    )
  }

  const handleExplainSentence = () => {
    if (!activeSentence) return
    setExplainSentence({ text: activeSentence.text, startTime: activeSentence.start })
    setActiveSentence(null)
  }

  const handleWordClick = (e: React.MouseEvent, word: string, seg: { id: string; start: number; end: number; text: string }) => {
    e.stopPropagation()
    const normalized = normalizeWord(word)
    if (!normalized) return
    setVocabWord({ word, normalized, sentence: seg.text, startTime: seg.start })
  }

  const handleVocabSave = () => {
    if (!vocabWord) return
    sendToParent('SAVE_VOCAB', {
      word: vocabWord.normalized,
      sentence: vocabWord.sentence,
      timestamp: vocabWord.startTime,
    })
  }

  const handleVocabSeek = (time: number) => {
    sendToParent('SEEK_TO', time)
  }

  const smallBtnStyle: React.CSSProperties = {
    padding: '2px 8px', borderRadius: '4px', border: 'none',
    background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary-hover)',
    cursor: 'pointer', fontSize: '10px', fontWeight: 500, fontFamily: 'var(--font-sans)',
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--spacing-xs)' }}>Transcript error</div>
        <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--spacing-sm)' }}>{error}</div>
        <button onClick={() => sendToParent('REQUEST_TRANSCRIPT')} style={{
          padding: 'var(--spacing-2xs) var(--spacing-md)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)',
          background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)',
        }} aria-label="Retry transcript load">Retry</button>
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-muted)', textAlign: 'center', fontSize: 'var(--text-xs)' }}>Loading transcript...</div>
  }

  if (!segments || segments.length === 0) {
    return (
      <div style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--spacing-xs)' }}>No transcript available</div>
        <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--spacing-sm)' }}>This video may not have captions enabled.</div>
        <button onClick={() => sendToParent('REQUEST_TRANSCRIPT')} style={{
          padding: 'var(--spacing-2xs) var(--spacing-md)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)',
          background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)',
        }} aria-label="Retry transcript load">Retry</button>
      </div>
    )
  }

  const translateBtnStyle: React.CSSProperties = {
    ...smallBtnStyle,
    background: translateEnabled ? 'var(--color-primary)' : 'rgba(59,130,246,0.15)',
    color: translateEnabled ? '#fff' : 'var(--color-primary-hover)',
  }

  const handleToggleTranslate = () => {
    if (translateEnabled) {
      setTranslateEnabled(false)
      setTranslations(new Map())
    } else if (!translateLanguageRef.current) {
      const lang = prompt('Set target language for translation (e.g. Vietnamese, Spanish, French):\nYou can also set a default in extension Settings → Native Language.')
      if (lang) {
        translateLanguageRef.current = lang
        setTranslateEnabled(true)
      }
    } else {
      setTranslateEnabled(true)
    }
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div ref={containerRef} style={{ height: '100%', padding: 'var(--spacing-xs)', overflow: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 6px 8px', borderBottom: '1px solid var(--color-border)', marginBottom: '6px', background: 'var(--color-background)' }}>
          <button onClick={handleToggleTranslate} style={translateBtnStyle} aria-label={translateEnabled ? 'Hide translation' : 'Show translation'}>
            {translateEnabled ? 'Translate: ON' : 'Translate'}
          </button>
          {translateLanguageRef.current && (
            <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
              → {translateLanguageRef.current}
            </span>
          )}
          {translating && <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>Translating...</span>}
        </div>
        {(tokenizedSegments || segments).map((seg: any, idx: number) => {
          const tokens = seg.tokens || []
          const translatedText = translations.get(seg.id)
          return (
            <div
              key={seg.id}
              data-seg-idx={idx}
              onClick={() => handleSegmentClick(seg.start)}
              style={{
                padding: 'var(--spacing-2xs) var(--spacing-xs)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '2px',
                background: idx === activeIndex ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
                borderLeft: idx === activeIndex ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'background var(--transition-fast)',
              }}
              role="button"
              tabIndex={0}
              aria-label={`Segment at ${formatTime(seg.start)}: ${seg.text}`}
              onKeyDown={e => { if (e.key === 'Enter') handleSegmentClick(seg.start) }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginBottom: '2px' }}>
                {formatTime(seg.start)}
              </div>
              <div
                style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 'var(--leading-normal)' }}
                onClick={(e) => handleSentenceTextClick(e, seg)}
              >
                {tokens.map((token, ti) => {
                  if (token.isPunctuation || !token.isMeaningful) {
                    return <span key={ti}>{token.text}</span>
                  }
                  return (
                    <span
                      key={ti}
                      onClick={(e) => handleWordClick(e, token.text, seg)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleWordClick(e as unknown as React.MouseEvent, token.text, seg) }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Learn word: ${token.text}`}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px dashed var(--color-primary)',
                        padding: '0 1px',
                        borderRadius: '2px',
                        transition: 'background var(--transition-fast), color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'color-mix(in srgb, var(--color-primary) 20%, transparent)'; (e.target as HTMLElement).style.color = 'var(--color-primary-hover)' }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '' }}
                    >
                      {token.text}
                    </span>
                  )
                })}
              </div>
              {translatedText && (
                <div
                  style={{
                    marginTop: '3px',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-normal)',
                    borderLeft: '2px solid var(--color-primary)',
                  }}
                >
                  {translatedText}
                </div>
              )}
              {activeSentence?.start === seg.start && activeSentence?.text === seg.text && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--color-border)' }}>
                  <button onClick={handleExplainSentence} style={smallBtnStyle}>Explain</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {vocabWord && (
        <VocabularyDetail
          word={vocabWord.word}
          normalized={vocabWord.normalized}
          sourceSentence={vocabWord.sentence}
          startTime={vocabWord.startTime}
          videoTitle=""
          onClose={() => setVocabWord(null)}
          onSave={handleVocabSave}
          onSeek={handleVocabSeek}
        />
      )}
      {explainSentence && (
        <SentenceExplanationPanel
          sentence={explainSentence.text}
          startTime={explainSentence.startTime}
          onClose={() => setExplainSentence(null)}
          onSeek={(time) => sendToParent('SEEK_TO', time)}
        />
      )}
    </div>
  )
}

type PracticeMode = 'quiz' | 'fill-blank' | null

function PracticePanel({ transcriptAvailable, videoId, sendToParent }: {
  transcriptAvailable: boolean
  videoId: string
  sendToParent: (type: string, payload?: unknown) => void
}) {
  const [mode, setMode] = useState<PracticeMode>(null)

  if (mode === 'quiz') {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <QuizPanel
          videoId={videoId}
          startMs={0}
          endMs={120000}
          onClose={() => setMode(null)}
          onSeek={(time) => sendToParent('SEEK_TO', time)}
          sendToParent={sendToParent}
        />
      </div>
    )
  }

  if (mode === 'fill-blank') {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <FillInBlankPanel videoId={videoId} sendToParent={sendToParent} onClose={() => setMode(null)} />
      </div>
    )
  }

  const card: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
    borderRadius: '10px', cursor: transcriptAvailable ? 'pointer' : 'not-allowed',
    background: transcriptAvailable ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.06)', opacity: transcriptAvailable ? 1 : 0.4,
    transition: 'background 0.15s', width: '100%',
  }
  const iconBox: React.CSSProperties = {
    width: '40px', height: '40px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '14px', flexShrink: 0,
  }

  return (
    <div style={{ height: '100%', padding: 'var(--spacing-sm)', overflow: 'auto' }}>
      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Practice</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={() => setMode('fill-blank')} disabled={!transcriptAvailable} style={card} aria-label="Fill in the blank">
          <div style={{ ...iconBox, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>__</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text)' }}>Fill in the Blank</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>Type missing words from the transcript</div>
          </div>
        </button>
        <button onClick={() => setMode('quiz')} disabled={!transcriptAvailable} style={card} aria-label="Listening quiz">
          <div style={{ ...iconBox, background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary-hover)' }}><IconHeadphones size={16} /></div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text)' }}>Listening Quiz</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>AI-generated IELTS listening questions</div>
          </div>
        </button>
      </div>
      {!transcriptAvailable && (
        <div style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '11px', marginTop: '16px' }}>
          Transcript required for practice activities
        </div>
      )}
    </div>
  )
}

export default YouTubeLearningApp
