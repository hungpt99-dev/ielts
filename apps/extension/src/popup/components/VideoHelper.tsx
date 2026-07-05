import { useState, useEffect, useCallback } from 'react'
import {
  generateVocabularyFromTranscript,
  generateSummaryFromTranscript,
  generateListeningQuestions,
  generateShadowingScripts,
} from '@ielts/ai'
import { saveVocabularyEntry, extensionVocabSchema } from '../../storage/vocabularyStore'
import {
  saveVideoEntry,
  videoEntrySchema,
  type VideoEntry,
} from '../../storage/videoStore'
import { saveEntry as saveLearningEntry } from '../../storage/indexedDB'
import { incrementDailyProgress } from '../../services/storage'
import { safeStorageGet } from '../../utils/safe-chrome'
import type { VideoQuestion, VideoVocabItem, ShadowingItem } from '../../storage/videoStore'
import type { LearningEntry } from '../../types'

interface VideoHelperProps {
  onSaved: () => void
  onCancel: () => void
}

interface VideoPageInfo {
  isVideoPage: boolean
  platform: string
  videoTitle: string
  videoUrl: string
  videoId: string
}

type AiTab = 'vocabulary' | 'summary' | 'questions' | 'shadowing'

async function getAIProviderConfig(): Promise<{ apiKey: string; baseUrl: string; model: string }> {
  const [syncResult, localResult] = await Promise.all([
    new Promise<any>(r => chrome.storage.sync.get(['extensionSettings'], r)),
    new Promise<any>(r => chrome.storage.local.get(['aiApiKey'], r)),
  ])
  const settings = syncResult.extensionSettings || {}
  return {
    apiKey: localResult.aiApiKey || '',
    baseUrl: settings.aiBaseUrl || 'https://api.openai.com/v1',
    model: settings.aiModel || 'gpt-4o-mini',
  }
}

type AiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'no-key' }
  | { status: 'done' }

const TAB_LABELS: Record<AiTab, string> = {
  vocabulary: '📖 Vocabulary',
  summary: '📝 Summary',
  questions: '❓ Questions',
  shadowing: '🎤 Shadowing',
}

export default function VideoHelper({ onSaved, onCancel }: VideoHelperProps) {
  const [videoInfo, setVideoInfo] = useState<VideoPageInfo>({
    isVideoPage: false,
    platform: '',
    videoTitle: '',
    videoUrl: '',
    videoId: '',
  })
  const [videoInfoLoading, setVideoInfoLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [transcript, setTranscript] = useState('')
  const [topic, setTopic] = useState('')
  const [showTranscriptInput, setShowTranscriptInput] = useState(false)
  const [fetchingTranscript, setFetchingTranscript] = useState(false)

  const [activeTab, setActiveTab] = useState<AiTab>('vocabulary')

  const [vocabState, setVocabState] = useState<AiState>({ status: 'idle' })
  const [vocabData, setVocabData] = useState<VideoVocabItem[] | null>(null)

  const [summaryState, setSummaryState] = useState<AiState>({ status: 'idle' })
  const [summaryData, setSummaryData] = useState<{ summary: string; keyPoints: string[]; ieltsTopics: string[] } | null>(null)

  const [questionsState, setQuestionsState] = useState<AiState>({ status: 'idle' })
  const [questionsData, setQuestionsData] = useState<VideoQuestion[] | null>(null)

  const [shadowingState, setShadowingState] = useState<AiState>({ status: 'idle' })
  const [shadowingData, setShadowingData] = useState<ShadowingItem[] | null>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadVideoInfo() {
      setVideoInfoLoading(true)
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.id) {
          setVideoInfoLoading(false)
          return
        }

        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_PAGE_INFO' }).catch(() => null)
        if (cancelled) return

        if (response?.isVideoPage) {
          setVideoInfo(response)
          setVideoInfoLoading(false)
          return
        }

        const pending = await safeStorageGet<any>('pendingVideoInfo')
        if (cancelled) return

        if (pending?.pendingVideoInfo?.isVideoPage) {
          setVideoInfo(pending.pendingVideoInfo)
          setVideoInfoLoading(false)
          return
        }

        if (tab.url) {
          setVideoInfo({
            isVideoPage: false,
            platform: '',
            videoTitle: tab.title || '',
            videoUrl: tab.url || '',
            videoId: '',
          })
        }
      } catch {
        /* fallback to default */
      } finally {
        if (!cancelled) setVideoInfoLoading(false)
      }
    }

    loadVideoInfo()
    return () => { cancelled = true }
  }, [])

  const handleFetchTranscript = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab.id) return

      setFetchingTranscript(true)
      setError(null)

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'FETCH_YOUTUBE_TRANSCRIPT' }).catch(() => null)
      if (response?.transcript) {
        setTranscript(response.transcript)
        setShowTranscriptInput(false)
      } else {
        setError('No captions found for this video. Paste the transcript manually.')
      }
    } catch {
      setError('Could not fetch transcript. Try pasting it manually.')
    } finally {
      setFetchingTranscript(false)
    }
  }, [])

  const handleGenerateVocabulary = useCallback(async () => {
    if (!transcript.trim()) return
    setVocabState({ status: 'loading' })
    setVocabData(null)

    const config = await getAIProviderConfig()
    if (!config.apiKey) {
      setVocabState({ status: 'no-key' })
      return
    }

    const result = await generateVocabularyFromTranscript(transcript, videoInfo.videoTitle, () => config)
    if (result.error) {
      setVocabState({ status: 'error', message: result.error })
    } else if (result.data) {
      setVocabData(result.data.words)
      setVocabState({ status: 'done' })
    }
  }, [transcript, videoInfo.videoTitle])

  const handleGenerateSummary = useCallback(async () => {
    if (!transcript.trim()) return
    setSummaryState({ status: 'loading' })
    setSummaryData(null)

    const config = await getAIProviderConfig()
    if (!config.apiKey) {
      setSummaryState({ status: 'no-key' })
      return
    }

    const result = await generateSummaryFromTranscript(transcript, videoInfo.videoTitle, () => config)
    if (result.error) {
      setSummaryState({ status: 'error', message: result.error })
    } else if (result.data) {
      setSummaryData(result.data)
      setSummaryState({ status: 'done' })
    }
  }, [transcript, videoInfo.videoTitle])

  const handleGenerateQuestions = useCallback(async () => {
    if (!transcript.trim()) return
    setQuestionsState({ status: 'loading' })
    setQuestionsData(null)

    const config = await getAIProviderConfig()
    if (!config.apiKey) {
      setQuestionsState({ status: 'no-key' })
      return
    }

    const result = await generateListeningQuestions(transcript, videoInfo.videoTitle, () => config)
    if (result.error) {
      setQuestionsState({ status: 'error', message: result.error })
    } else if (result.data) {
      setQuestionsData(result.data.questions)
      setQuestionsState({ status: 'done' })
    }
  }, [transcript, videoInfo.videoTitle])

  const handleGenerateShadowing = useCallback(async () => {
    if (!transcript.trim()) return
    setShadowingState({ status: 'loading' })
    setShadowingData(null)

    const config = await getAIProviderConfig()
    if (!config.apiKey) {
      setShadowingState({ status: 'no-key' })
      return
    }

    const result = await generateShadowingScripts(transcript, () => config)
    if (result.error) {
      setShadowingState({ status: 'error', message: result.error })
    } else if (result.data) {
      setShadowingData(result.data.scripts)
      setShadowingState({ status: 'done' })
    }
  }, [transcript])

  const handleSave = async () => {
    if (!videoInfo.videoTitle.trim()) {
      setError('Video title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const now = new Date().toISOString()
      const entry: VideoEntry = videoEntrySchema.parse({
        id: crypto.randomUUID(),
        videoTitle: videoInfo.videoTitle,
        videoUrl: videoInfo.videoUrl,
        platform: videoInfo.platform || 'youtube',
        notes: notes.trim(),
        transcript: transcript.trim(),
        topic: topic.trim(),
        tags: [],

        aiVocabulary: vocabData || [],
        aiSummary: summaryData?.summary || '',
        aiKeyPoints: summaryData?.keyPoints || [],
        aiIeltsTopics: summaryData?.ieltsTopics || [],
        aiQuestions: questionsData || [],
        aiShadowingScripts: shadowingData || [],

        aiVocabularyGeneratedAt: vocabData ? now : undefined,
        aiSummaryGeneratedAt: summaryData ? now : undefined,
        aiQuestionsGeneratedAt: questionsData ? now : undefined,
        aiShadowingGeneratedAt: shadowingData ? now : undefined,

        savedToListening: false,
        savedToVocabulary: false,

        status: 'completed',
        createdAt: now,
        updatedAt: now,
      })

      await saveVideoEntry(entry)

      const listeningEntry: LearningEntry = {
        id: crypto.randomUUID(),
        text: `[Video] ${videoInfo.videoTitle}`,
        category: 'reading',
        topic: topic.trim() || 'general',
        skill: 'listening',
        difficulty: '',
        tags: [],
        personalNote: notes.trim(),
        pageTitle: videoInfo.videoTitle,
        pageUrl: videoInfo.videoUrl,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      }

      await saveLearningEntry(listeningEntry)

      if (vocabData && vocabData.length > 0) {
        for (const item of vocabData) {
          const vocabEntry = extensionVocabSchema.parse({
            id: crypto.randomUUID(),
            word: item.word,
            sourceSentence: item.context || '',
            pageTitle: videoInfo.videoTitle,
            pageUrl: videoInfo.videoUrl,
            topic: topic.trim() || 'general',
            personalNote: '',
            tags: [],
            meaning: item.meaning,
            meaningVi: '',
            partOfSpeech: item.partOfSpeech,
            pronunciation: '',
            exampleSentence: item.example,
            synonyms: item.synonyms,
            antonyms: [],
            collocations: item.collocations,
            wordFamily: [],
            difficulty: '',
            status: 'new',
            addedToReview: true,
            reviewId: '',
            createdAt: now,
            updatedAt: now,
          })
          await saveVocabularyEntry(vocabEntry)
        }
      }

      await incrementDailyProgress('wordsAdded', vocabData?.length || 0)
      await incrementDailyProgress('articlesSaved', 1)

      setSaved(true)
      setTimeout(() => onSaved(), 1200)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div role="status" aria-label="Video saved" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff' }}>✓</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>Video saved!</div>
        {vocabData && <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>{vocabData.length} vocabulary words added</div>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 8px', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🎬</span> Video Helper
        </h2>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '18px', padding: '4px', lineHeight: 1 }}>✕</button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--color-danger)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {videoInfoLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', justifyContent: 'center' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Detecting video page...</span>
        </div>
      ) : (
        <>
          {/* Video Info */}
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            {videoInfo.isVideoPage ? (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px', wordBreak: 'break-word' }}>
                  {videoInfo.videoTitle || 'Unknown Video'}
                </div>
                {videoInfo.videoUrl && (
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)', wordBreak: 'break-all' }}>
                    {videoInfo.videoUrl}
                  </div>
                )}
                {videoInfo.platform && (
                  <span style={{ display: 'inline-block', marginTop: '4px', padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#d97706', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {videoInfo.platform}
                  </span>
                )}
              </>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center', padding: '8px' }}>
                No video detected on this page. Navigate to a YouTube video and try again.
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Add your notes about this video..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px', lineHeight: 1.5, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          {/* Topic */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>IELTS Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. education, environment, technology"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px' }}
            />
          </div>

          {/* Transcript */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Transcript</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {videoInfo.platform === 'youtube' && videoInfo.isVideoPage && (
                  <button
                    type="button"
                    onClick={handleFetchTranscript}
                    disabled={fetchingTranscript}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', cursor: fetchingTranscript ? 'default' : 'pointer', fontWeight: 500, opacity: fetchingTranscript ? 0.7 : 1 }}
                  >
                    {fetchingTranscript ? '⏳ Fetching...' : '🎬 Fetch Transcript'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTranscriptInput(!showTranscriptInput)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
                >
                  {showTranscriptInput ? 'Hide' : transcript ? 'Edit' : 'Paste Transcript'}
                </button>
              </div>
            </div>
            {showTranscriptInput && (
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={4}
                placeholder="Paste video transcript here for AI analysis..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px', lineHeight: 1.5, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
              />
            )}
            {transcript && !showTranscriptInput && (
              <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                ✓ {transcript.length.toLocaleString()} characters
              </div>
            )}
          </div>

          {/* AI Actions */}
          {transcript.trim() && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Analysis</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <AiActionButton label="📖 Vocabulary" onClick={handleGenerateVocabulary} state={vocabState} />
                <AiActionButton label="📝 Summary" onClick={handleGenerateSummary} state={summaryState} />
                <AiActionButton label="❓ Questions" onClick={handleGenerateQuestions} state={questionsState} />
                <AiActionButton label="🎤 Shadowing" onClick={handleGenerateShadowing} state={shadowingState} />
              </div>

              {/* Results tabs */}
              {[vocabData, summaryData, questionsData, shadowingData].some(Boolean) && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', overflowX: 'auto', scrollbarWidth: 'thin' }}>
                    {(Object.entries(TAB_LABELS) as [AiTab, string][]).map(([key, label]) => {
                      const hasData = (key === 'vocabulary' && vocabData) ||
                        (key === 'summary' && summaryData) ||
                        (key === 'questions' && questionsData) ||
                        (key === 'shadowing' && shadowingData)
                      if (!hasData) return null
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveTab(key)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '11px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                            background: activeTab === key ? 'rgba(59,130,246,0.15)' : 'transparent',
                            color: activeTab === key ? 'var(--color-primary)' : 'var(--color-muted)',
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {activeTab === 'vocabulary' && vocabData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                      {vocabData.map((item, i) => (
                        <div key={i} style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--color-surface-alt)', fontSize: '12px' }}>
                          <strong style={{ color: 'var(--color-primary)' }}>{item.word}</strong>
                          {item.partOfSpeech && <span style={{ color: 'var(--color-muted)', marginLeft: '4px', fontSize: '10px' }}>{item.partOfSpeech}</span>}
                          <div style={{ color: 'var(--color-text)', marginTop: '2px' }}>{item.meaning}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'summary' && summaryData && (
                    <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '12px' }}>
                      <div style={{ color: 'var(--color-text)', lineHeight: 1.5, marginBottom: '8px' }}>{summaryData.summary}</div>
                      {summaryData.keyPoints.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Key Points</div>
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {summaryData.keyPoints.map((p, i) => (
                              <li key={i} style={{ color: 'var(--color-text)', marginBottom: '2px' }}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'questions' && questionsData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                      {questionsData.map((q, i) => (
                        <div key={i} style={{ padding: '8px', borderRadius: '6px', background: 'var(--color-surface-alt)' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                            {i + 1}. {q.question}
                          </div>
                          {q.options && (
                            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                              {q.options.map((opt, oi) => (
                                <div key={oi} style={{ padding: '2px 0' }}>{String.fromCharCode(65 + oi)}. {opt}</div>
                              ))}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
                            ✓ {q.correctAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'shadowing' && shadowingData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                      {shadowingData.map((item, i) => (
                        <div key={i} style={{ padding: '8px', borderRadius: '6px', background: 'var(--color-surface-alt)' }}>
                          <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.5 }}>🎤 {item.sentence}</div>
                          {item.translation && <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>{item.translation}</div>}
                          {item.focusWords.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                              {item.focusWords.map((fw, fi) => (
                                <span key={fi} style={{ padding: '1px 6px', borderRadius: '3px', background: '#dbeafe', color: '#1d4ed8', fontSize: '10px' }}>{fw}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error / No key states */}
              {[vocabState, summaryState, questionsState, shadowingState].some(s => s.status === 'error' || s.status === 'no-key') && (
                <div style={{ padding: '8px 10px', borderRadius: '6px', fontSize: '11px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  {vocabState.status === 'no-key' || summaryState.status === 'no-key' || questionsState.status === 'no-key' || shadowingState.status === 'no-key' ? (
                    <span>
                      API key not configured.{' '}
                      <button type="button" onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}>Open Settings</button>
                    </span>
                  ) : (
                    (vocabState.status === 'error' ? vocabState.message :
                      summaryState.status === 'error' ? summaryState.message :
                        questionsState.status === 'error' ? questionsState.message :
                          shadowingState.status === 'error' ? shadowingState.message : '')
                  )}
                </div>
              )}
            </div>
          )}

          <label style={{ display: 'flex', gap: '4px', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.4, padding: '6px 8px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <span>ℹ️</span>
            <span>For YouTube videos, click "Fetch Transcript" to auto-detect captions, or paste the transcript manually for AI analysis.</span>
          </label>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !videoInfo.videoTitle.trim()}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: saving || !videoInfo.videoTitle.trim() ? 'var(--color-primary-hover)' : 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving || !videoInfo.videoTitle.trim() ? 'not-allowed' : 'pointer',
                opacity: saving || !videoInfo.videoTitle.trim() ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Video & Vocabulary'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function AiActionButton({
  label,
  onClick,
  state,
}: {
  label: string
  onClick: () => void
  state: AiState
}) {
  const isLoading = state.status === 'loading'
  const isDone = state.status === 'done'
  const isError = state.status === 'error' || state.status === 'no-key'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      style={{
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        border: isDone ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
        background: isDone ? 'rgba(16,185,129,0.08)' : isError ? '#fef2f2' : 'var(--color-surface)',
        color: isDone ? 'var(--color-success)' : isError ? '#dc2626' : 'var(--color-text)',
        fontSize: '12px',
        fontWeight: 500,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
        transition: 'all 0.15s',
        textAlign: 'center',
        lineHeight: 1.3,
      }}
      onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
      onMouseLeave={(e) => { if (!isDone && !isError) e.currentTarget.style.borderColor = 'var(--color-border)' }}
    >
      {isLoading ? '⏳' : isDone ? '✓' : label}
    </button>
  )
}
