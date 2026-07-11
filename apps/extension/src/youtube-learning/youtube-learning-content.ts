import { YouTubeAdapter } from './infrastructure/youtube/YouTubeAdapter'
import { YouTubeLayoutManager, PANEL_IFRAME_ID } from './infrastructure/youtube/YouTubeLayoutManager'
import { FocusMode } from './infrastructure/youtube/FocusMode'
import { detectVideoPage, type VideoPageInfo } from './infrastructure/youtube/YouTubePageDetector'
import { LearningEventBus } from './domain/events/LearningEventBus'
import { StorageAdapter } from './infrastructure/persistence/StorageAdapter'
import { AIAdapter } from './infrastructure/ai/AIAdapter'
import { LearningSessionService } from './application/services/LearningSessionService'
import { VocabularyService } from './application/services/VocabularyService'
import { AIAnalysisService } from './application/services/AIAnalysisService'
import { clearTranscriptCache } from './infrastructure/youtube/YouTubeTranscriptProvider'
import { safeStorageGet } from '../utils/safe-chrome'
import { setVideoHelperHidden } from '../content-script/videoHelper'

const TRANSCRIPT_RETRY_COOLDOWN_MS = 3000
const MAX_PENDING_MESSAGES = 50
const AUTO_OPEN_STORAGE_KEY = 'yt-learning-auto-open'

const DEBUG = process.env.NODE_ENV === 'development'

function log(...args: unknown[]): void {
  if (DEBUG) console.debug('[YT Content]', ...args)
}

let youtubeAdapter: YouTubeAdapter | null = null
let layoutManager: YouTubeLayoutManager | null = null
let focusMode: FocusMode | null = null
let storageAdapter: StorageAdapter | null = null
let eventBus: LearningEventBus | null = null
let aiAdapter: AIAdapter | null = null
let sessionService: LearningSessionService | null = null
let vocabService: VocabularyService | null = null
let analysisService: AIAnalysisService | null = null
let panelMessageHandler: ((event: MessageEvent) => void) | null = null
let ytNavigationInitialized = false

let currentVideoInfo: VideoPageInfo | null = null
let isLearningMode = false
let sentTranscriptRequest = false
let panelReady = false
let currentAbortController: AbortController | null = null

const PENDING_MESSAGES: Array<{ type: string; payload?: unknown }> = []

function getOrCreateLayoutManager(): YouTubeLayoutManager {
  if (!layoutManager) layoutManager = new YouTubeLayoutManager()
  return layoutManager
}

function postToPanel(type: string, payload?: unknown): void {
  const iframe = document.getElementById(PANEL_IFRAME_ID) as HTMLIFrameElement | null
  if (iframe?.contentWindow) {
    try {
      iframe.contentWindow.postMessage(
        { source: 'ielts-content-script', type, payload },
        '*',
      )
    } catch {
      // iframe may be detached
    }
  }
}

function postToParent(type: string, payload?: unknown): void {
  if (panelReady) {
    postToPanel(type, payload)
  } else if (PENDING_MESSAGES.length < MAX_PENDING_MESSAGES) {
    PENDING_MESSAGES.push({ type, payload })
  }
}

function setupPanelMessaging(): void {
  panelMessageHandler = (event: MessageEvent) => {
    if (event.data?.source !== 'ielts-youtube-learning') return
    const { type, payload } = event.data

    switch (type) {
      case 'PANEL_READY':
        panelReady = true
        while (PENDING_MESSAGES.length > 0) {
          const msg = PENDING_MESSAGES.shift()!
          postToPanel(msg.type, msg.payload)
        }
        postToPanel('LEARNING_MODE_STATE', isLearningMode)
        if (currentVideoInfo) {
          postToPanel('VIDEO_INFO', currentVideoInfo)
        }
        if (sentTranscriptRequest === false && isLearningMode) {
          handleTranscriptRequest()
        }
        break

      case 'TOGGLE_LEARNING_MODE':
        if (typeof payload === 'boolean') handleLearningModeToggle(payload)
        break

      case 'TOGGLE_FOCUS_MODE':
        if (typeof payload === 'boolean') handleFocusModeToggle(payload)
        break

      case 'REQUEST_TRANSCRIPT':
        clearTranscriptCache()
        handleTranscriptRequest()
        break

      case 'GET_TRANSCRIPT':
        handleTranscriptRequest()
        break

      case 'CANCEL_TRANSCRIPT':
        cancelInFlightTranscript()
        break

      case 'SEEK_TO':
        if (typeof payload === 'number') handleSeekTo(payload)
        break

      case 'ANALYZE_VIDEO':
        handleAnalyzeVideo()
        break

      case 'REQUEST_ANALYSIS':
        handleAnalyzeVideo()
        break

      case 'ENTER_EXERCISE_MODE':
        handleEnterExerciseMode()
        break

      case 'EXIT_EXERCISE_MODE':
        handleExitExerciseMode()
        break

      case 'EXPLAIN_SENTENCE':
        if (payload && typeof payload === 'object') handleExplainSentence(payload as Record<string, unknown>)
        break

      case 'GENERATE_QUIZ':
        if (payload && typeof payload === 'object') handleGenerateQuiz(payload as Record<string, unknown>)
        break

      case 'SUBMIT_QUIZ':
        if (payload && typeof payload === 'object') handleSubmitQuiz(payload as Record<string, unknown>)
        break

      case 'SAVE_MISTAKES':
        if (payload && typeof payload === 'object') handleSaveMistakes(payload as Record<string, unknown>)
        break

      case 'REQUEST_VOCAB_EXPLANATION':
        if (payload && typeof payload === 'object') handleVocabExplanation(payload as Record<string, unknown>)
        break

      case 'SAVE_VOCAB':
        if (payload && typeof payload === 'object') handleSaveVocab(payload as Record<string, unknown>)
        break
    }
  }

  window.addEventListener('message', panelMessageHandler)
}

async function handleLearningModeToggle(enabled: boolean): Promise<void> {
  isLearningMode = enabled

  if (enabled) {
    setVideoHelperHidden(true)
    getOrCreateLayoutManager().injectPanel()
    getOrCreateLayoutManager().removeBadge()
    getOrCreateLayoutManager().updatePrimaryColumn()

    postToParent('LEARNING_MODE_STATE', true)

    if (currentVideoInfo) {
      postToParent('VIDEO_INFO', currentVideoInfo)
    }

    const focusActive = await focusMode?.isEnabled() ?? false
    if (focusActive) {
      await focusMode?.enable()
      postToParent('FOCUS_MODE', true)
    }

    await sessionService?.startSession(currentVideoInfo?.videoId || '')
  } else {
    postToParent('LEARNING_MODE_STATE', false)
    getOrCreateLayoutManager().removePanel()
    getOrCreateLayoutManager().resetLayout()
    getOrCreateLayoutManager().injectBadge(() => handleLearningModeToggle(true))

    await sessionService?.endSession()
    await storageAdapter?.clearSession()

    setVideoHelperHidden(false)
  }
}

async function handleFocusModeToggle(enabled: boolean): Promise<void> {
  if (enabled) {
    await focusMode?.enable()
  } else {
    await focusMode?.disable()
  }
  postToParent('FOCUS_MODE', enabled)
}

let retryTimeoutId: ReturnType<typeof setTimeout> | null = null

function cancelInFlightTranscript(): void {
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId)
    retryTimeoutId = null
  }
  sentTranscriptRequest = false
}

async function handleTranscriptRequest(): Promise<void> {
  cancelInFlightTranscript()

  sentTranscriptRequest = true
  currentAbortController = new AbortController()
  const signal = currentAbortController.signal

  log('Requesting transcript...')
  postToParent('TRANSCRIPT_LOADING')

  try {
    const result = await youtubeAdapter?.fetchTranscript(undefined, { signal })

    if (signal.aborted) {
      sentTranscriptRequest = false
      currentAbortController = null
      return
    }

    if (result?.ok && result.data?.segments?.length) {
      const segments = result.data.segments.map(s => ({
        id: s.id,
        start: s.start,
        end: s.end,
        text: s.text,
      }))
      postToParent('TRANSCRIPT_DATA', segments)
      postToParent('TRANSCRIPT_AVAILABLE', true)
      log('Transcript loaded successfully')
    } else if (result && !result.ok) {
      const err = result.error
      const errorPayload = { code: err.code, detail: err.detail, retryable: err.retryable }
      switch (err.code) {
        case 'NO_CAPTIONS':
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'This video does not have captions.' })
          break
        case 'UNSUPPORTED_LANGUAGE':
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'Captions are available, but not in your selected language.' })
          break
        case 'PLAYER_RESPONSE_NOT_FOUND':
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'The YouTube player is still loading. Try again.' })
          break
        case 'CAPTION_FETCH_FAILED':
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'Captions were found, but could not be downloaded.' })
          break
        case 'CAPTION_PARSE_FAILED':
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'Caption data could not be processed.' })
          break
        case 'EXTENSION_COMMUNICATION_FAILED':
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'Extension communication error.' })
          break
        case 'VIDEO_UNAVAILABLE':
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'This video is unavailable, private, restricted, or unsupported.' })
          break
        case 'INVALID_VIDEO_ID':
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'No video detected.' })
          break
        case 'REQUEST_CANCELLED':
          break
        default:
          postToParent('TRANSCRIPT_ERROR', { ...errorPayload, message: err.message || 'Transcript unavailable.' })
      }
    } else {
      log('Transcript unavailable for video')
      postToParent('TRANSCRIPT_UNAVAILABLE')
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
    } else {
      const msg = e instanceof Error ? e.message : String(e)
      log('Transcript request error:', msg, e)
      postToParent('TRANSCRIPT_ERROR', { code: 'UNKNOWN', message: msg || 'An unexpected error occurred' })
    }
  }

  currentAbortController = null
  retryTimeoutId = setTimeout(() => {
    sentTranscriptRequest = false
    retryTimeoutId = null
  }, TRANSCRIPT_RETRY_COOLDOWN_MS)
}

function handleSeekTo(seconds: number): void {
  youtubeAdapter?.getPlayer().seek(seconds)
  sessionService?.markUserActive()
}

async function handleAnalyzeVideo(): Promise<void> {
  if (!currentVideoInfo?.videoId) return
  try {
    const result = await youtubeAdapter?.fetchTranscript()
    if (!result?.ok || !result.data) {
      postToParent('ANALYSIS_DATA', { error: 'Transcript required' })
      return
    }
    const analysis = await analysisService?.analyze(result.data)
    if (analysis) {
      postToParent('ANALYSIS_DATA', {
        cefrLevel: analysis.cefrLevel,
        speakingSpeed: analysis.speakingSpeed,
        topics: analysis.topics,
        wordCount: analysis.wordCount,
        lexicalDiversity: analysis.lexicalDiversity,
      })
    } else {
      postToParent('ANALYSIS_DATA', { error: 'Analysis failed' })
    }
  } catch {
    postToParent('ANALYSIS_DATA', { error: 'Analysis failed' })
  }
}

function handleEnterExerciseMode(): void {
  focusMode?.enable()
  getOrCreateLayoutManager().updatePrimaryColumn()
  postToParent('FOCUS_MODE', true)
}

function handleExitExerciseMode(): void {
  focusMode?.disable()
  getOrCreateLayoutManager().updatePrimaryColumn()
  postToParent('FOCUS_MODE', false)
}

async function handleVocabExplanation(payload: Record<string, unknown>): Promise<void> {
  const word = typeof payload.word === 'string' ? payload.word : ''
  const normalized = typeof payload.normalized === 'string' ? payload.normalized : word.toLowerCase()
  const sentence = typeof payload.sentence === 'string' ? payload.sentence : ''
  const startTime = typeof payload.startTime === 'number' ? payload.startTime : 0

  if (!word || !aiAdapter) {
    postToParent('VOCAB_EXPLANATION', { error: 'Word explanation not available' })
    return
  }

  try {
    // First try: AI-powered rich explanation with full schema
    const systemPrompt = 'You are an IELTS vocabulary expert. Return ONLY valid JSON, no markdown, no code fences.'
    const userPrompt = `Analyze this word for an IELTS learner:\n\nWord: "${word}"\nContext sentence: "${sentence}"\n\nReturn JSON with:\n- word: the original word\n- normalizedWord: lowercase lemma\n- lemma: base form\n- pronunciation: IPA pronunciation (optional)\n- partOfSpeech: e.g. noun, verb, adjective\n- contextualDefinition: definition matching this context\n- vietnameseMeaning: Vietnamese translation (optional)\n- cefrLevel: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"\n- ieltsRelevance: "low"|"medium"|"high"\n- collocations: array of {phrase: string, example?: string}\n- synonyms: array of strings\n- wordFamily: array of {word: string, partOfSpeech: string}\n- simpleExample: simple example sentence\n- ieltsExample: IELTS-style example sentence (optional)\n\nContextual definition must relate to the provided sentence. If the word has multiple meanings, explain the one used in the context sentence first.`

    const result = await aiAdapter.request(systemPrompt, userPrompt, { temperature: 0.3 })

    if (!result.error && result.content) {
      let parsed: Record<string, unknown>
      try { parsed = JSON.parse(result.content) } catch { throw new Error('AI returned invalid JSON') }

      const collocations = Array.isArray(parsed.collocations)
        ? parsed.collocations.map((c: any) => ({ phrase: typeof c === 'string' ? c : c.phrase || '', example: c.example }))
        : []

      const wordFamily = Array.isArray(parsed.wordFamily)
        ? parsed.wordFamily.map((wf: any) => ({ word: typeof wf === 'string' ? wf : wf.word || '', partOfSpeech: wf.partOfSpeech || '' }))
        : []

      postToParent('VOCAB_EXPLANATION', {
        word: parsed.word || word,
        normalizedWord: parsed.normalizedWord || normalized,
        lemma: parsed.lemma || normalized,
        pronunciation: parsed.pronunciation || undefined,
        partOfSpeech: parsed.partOfSpeech || 'unknown',
        contextualDefinition: parsed.contextualDefinition || '',
        vietnameseMeaning: parsed.vietnameseMeaning || undefined,
        cefrLevel: typeof parsed.cefrLevel === 'string' ? parsed.cefrLevel : undefined,
        ieltsRelevance: typeof parsed.ieltsRelevance === 'string' ? parsed.ieltsRelevance : undefined,
        collocations,
        synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
        wordFamily,
        simpleExample: parsed.simpleExample || '',
        ieltsExample: parsed.ieltsExample || undefined,
        sourceSentence: sentence,
        startTime,
      })
      return
    }

    // Fallback: use existing vocabulary service
    if (vocabService) {
      const details = await vocabService.getWordDetails(normalized, sentence)
      postToParent('VOCAB_EXPLANATION', {
        word,
        normalizedWord: normalized,
        lemma: normalized,
        pronunciation: details.pronunciation || undefined,
        partOfSpeech: details.partOfSpeech || 'unknown',
        contextualDefinition: details.meaning || '',
        vietnameseMeaning: details.meaningVi || undefined,
        cefrLevel: undefined,
        ieltsRelevance: undefined,
        collocations: (details.collocations || []).map((c: string) => ({ phrase: c })),
        synonyms: details.synonyms || [],
        wordFamily: (details.wordFamily || []).map((w: string) => ({ word: w, partOfSpeech: '' })),
        simpleExample: details.exampleSentence || '',
        ieltsExample: undefined,
        sourceSentence: sentence,
        startTime,
      })
      return
    }

    postToParent('VOCAB_EXPLANATION', { error: 'Word explanation unavailable' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to get word details'
    postToParent('VOCAB_EXPLANATION', { error: msg })
  }
}

async function handleSaveMistakes(payload: Record<string, unknown>): Promise<void> {
  const mistakes = payload.mistakes as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(mistakes) || mistakes.length === 0) return

  try {
    const existing = await safeStorageGet<unknown[]>('yt-learning-mistakes')
    const all = (existing?.['yt-learning-mistakes'] ?? []) as Array<Record<string, unknown>>
    for (const m of mistakes) {
      const dup = all.find(
        (e: Record<string, unknown>) =>
          e.questionId === m.questionId && e.attemptDate === m.attemptDate,
      )
      if (!dup) all.push({ ...m, savedAt: new Date().toISOString() })
    }
    await chrome.storage.local.set({ 'yt-learning-mistakes': all })
    postToParent('MISTAKES_SAVED', { success: true })
  } catch {
    // non-critical
  }
}

async function handleSaveVocab(payload: Record<string, unknown>): Promise<void> {
  const word = typeof payload.word === 'string' ? payload.word : ''
  const sentence = typeof payload.sentence === 'string' ? payload.sentence : ''
  const videoId = currentVideoInfo?.videoId
  const videoTitle = currentVideoInfo?.videoTitle || ''
  const videoUrl = currentVideoInfo?.videoUrl || ''
  const timestamp = typeof payload.timestamp === 'number' ? payload.timestamp : 0

  if (!word || !videoId || !vocabService) {
    postToParent('VOCAB_SAVED', { error: 'Cannot save word' })
    return
  }

  try {
    await vocabService.saveWord(word, sentence, videoId, timestamp)
    // Save to IndexedDB via background script (runs at extension origin,
    // so the popup dashboard can read it — content-script IndexedDB lives
    // at the host page origin, not the extension's).
    chrome.runtime.sendMessage({
      type: 'SAVE_YOUTUBE_VOCAB_TO_IDB',
      payload: { word, sentence, videoTitle, videoUrl, timestamp },
    }).catch(() => {})
    postToParent('VOCAB_SAVED', { success: true, word })
  } catch {
    postToParent('VOCAB_SAVED', { error: 'Failed to save word' })
  }
}

async function handleExplainSentence(payload: Record<string, unknown>): Promise<void> {
  const sentence = typeof payload.sentence === 'string' ? payload.sentence : ''
  const contextBefore = Array.isArray(payload.contextBefore) ? payload.contextBefore as string[] : []
  const contextAfter = Array.isArray(payload.contextAfter) ? payload.contextAfter as string[] : []
  const startTime = typeof payload.startTime === 'number' ? payload.startTime : 0

  if (!sentence || !aiAdapter) {
    postToParent('SENTENCE_EXPLANATION', { error: 'Sentence or AI not available' })
    return
  }

  try {
    const contextText = [...contextBefore, sentence, ...contextAfter].join(' ')
    const systemPrompt = 'You are an IELTS listening and grammar tutor. Analyze the given transcript sentence. Return ONLY valid JSON, no markdown, no code fences.'
    const userPrompt = `Analyze this transcript sentence for an IELTS learner:\n\nSentence: "${sentence}"\n\nContext: "${contextText}"\n\nReturn JSON with:\n- simpleMeaning: clear simple explanation\n- translation: Vietnamese translation (optional)\n- sentenceStructure: grammar structure explanation\n- grammarPoints: array of {name, explanation, sourceText?}\n- vocabulary: array of {word, meaningInContext}\n- listeningNotes: array of listening difficulty notes\n- simplifiedVersion: simpler English version\n- academicAlternative: more academic IELTS version (optional)\n- practiceQuestion: {prompt, answer} (optional)`

    const result = await aiAdapter.request(systemPrompt, userPrompt, { temperature: 0.3 })

    if (result.error || !result.content) {
      postToParent('SENTENCE_EXPLANATION', { error: result.error || 'AI returned empty response' })
      return
    }

    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(result.content) } catch {
      postToParent('SENTENCE_EXPLANATION', { error: 'AI returned invalid JSON' })
      return
    }

    postToParent('SENTENCE_EXPLANATION', {
      simpleMeaning: parsed.simpleMeaning || 'Explanation not available',
      translation: parsed.translation || undefined,
      sentenceStructure: parsed.sentenceStructure || 'Basic sentence',
      grammarPoints: Array.isArray(parsed.grammarPoints) ? parsed.grammarPoints : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      listeningNotes: Array.isArray(parsed.listeningNotes) ? parsed.listeningNotes : [],
      simplifiedVersion: parsed.simplifiedVersion || sentence,
      academicAlternative: parsed.academicAlternative || undefined,
      practiceQuestion: parsed.practiceQuestion || undefined,
    })
  } catch {
    postToParent('SENTENCE_EXPLANATION', { error: 'Failed to generate explanation' })
  }
}

async function handleGenerateQuiz(payload: Record<string, unknown>): Promise<void> {
  const videoId = currentVideoInfo?.videoId
  const startMs = typeof payload.startMs === 'number' ? payload.startMs : 0
  const endMs = typeof payload.endMs === 'number' ? payload.endMs : 0
  const difficulty = typeof payload.difficulty === 'string' ? payload.difficulty : 'medium'
  const questionCount = typeof payload.questionCount === 'number' ? payload.questionCount : 5

  if (!videoId || !aiAdapter || typeof startMs !== 'number' || startMs < 0 || typeof endMs !== 'number' || endMs <= startMs) {
    postToParent('QUIZ_DATA', { error: 'Invalid quiz parameters' })
    return
  }

  try {
    const transcriptResult = await youtubeAdapter?.fetchTranscript()
    if (!transcriptResult?.ok || !transcriptResult.data?.segments?.length) {
      postToParent('QUIZ_DATA', { error: 'Transcript required' })
      return
    }

    const selectedSegments = transcriptResult.data.segments.filter(
      s => s.start * 1000 >= startMs && s.end * 1000 <= endMs,
    )
    if (selectedSegments.length < 3) {
      postToParent('QUIZ_DATA', { error: 'Selected section too short for quiz generation' })
      return
    }

    const sectionText = selectedSegments.map(s => s.text).join(' ')
    const systemPrompt = 'You are an IELTS listening quiz generator. Create questions based ONLY on the provided transcript section. Return ONLY valid JSON, no markdown, no code fences.'
    const userPrompt = `Create ${questionCount} IELTS listening questions from this transcript section (${startMs}ms to ${endMs}ms):\n\n${sectionText}\n\nDifficulty: ${difficulty}\n\nReturn JSON with:\n- questions: array of {id: string, type: "multiple-choice"|"sentence-completion"|"short-answer"|"true-false-not-given"|"fill-blank", prompt: string, options?: string[], correctAnswer: string, points: number, sourceSegmentIds: string[], explanation: string, evidenceStartMs: number, evidenceEndMs: number}\n\nEvery answer must be directly supported by the transcript. No invented information.`

    const result = await aiAdapter.request(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 4000 })
    if (result.error || !result.content) {
      postToParent('QUIZ_DATA', { error: result.error || 'Quiz generation failed' })
      return
    }

    let parsed: { questions?: unknown[] }
    try { parsed = JSON.parse(result.content) } catch {
      postToParent('QUIZ_DATA', { error: 'AI returned invalid JSON' })
      return
    }

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      postToParent('QUIZ_DATA', { error: 'No questions generated' })
      return
    }

    const questions = parsed.questions.slice(0, questionCount).map((q: any, i: number) => ({
      id: q.id || `q-${i}`,
      type: validateQuestionType(q.type),
      prompt: q.prompt || '',
      options: Array.isArray(q.options) ? q.options : undefined,
      correctAnswer: q.correctAnswer || '',
      points: typeof q.points === 'number' ? q.points : 1,
      sourceSegmentIds: Array.isArray(q.sourceSegmentIds) ? q.sourceSegmentIds : [],
      explanation: q.explanation || '',
      evidenceStartMs: typeof q.evidenceStartMs === 'number' ? q.evidenceStartMs : startMs,
      evidenceEndMs: typeof q.evidenceEndMs === 'number' ? q.evidenceEndMs : endMs,
    }))

    postToParent('QUIZ_DATA', {
      success: true,
      quiz: {
        id: crypto.randomUUID(),
        videoId,
        title: 'Listening Quiz',
        startMs,
        endMs,
        questions,
        totalPoints: questions.reduce((sum: number, q: any) => sum + q.points, 0),
        onePlay: true,
        hideSubtitles: true,
        createdAt: new Date().toISOString(),
      },
    })
  } catch {
    postToParent('QUIZ_DATA', { error: 'Quiz generation failed' })
  }
}

function validateQuestionType(type: string): string {
  const valid = ['multiple-choice', 'sentence-completion', 'short-answer', 'true-false-not-given', 'matching', 'summary-completion', 'fill-blank']
  return valid.includes(type) ? type : 'short-answer'
}

async function handleSubmitQuiz(payload: Record<string, unknown>): Promise<void> {
  const quizId = typeof payload.quizId === 'string' ? payload.quizId : ''
  const answers = payload.answers as Record<string, string> | undefined

  if (!quizId || !answers) {
    postToParent('QUIZ_EVALUATION', { error: 'Missing quiz ID or answers' })
    return
  }

  try {
    const questions = payload.questions as Array<Record<string, unknown>> | undefined
    if (!Array.isArray(questions)) {
      postToParent('QUIZ_EVALUATION', { error: 'Questions not provided for evaluation' })
      return
    }

    const results = questions.map((q: any) => {
      const userAnswer = (answers[q.id] || '').trim().toLowerCase()
      const correctAnswer = (q.correctAnswer || '').trim().toLowerCase()
      const accepted = Array.isArray(q.acceptedAnswers)
        ? q.acceptedAnswers.map((a: string) => a.trim().toLowerCase())
        : []

      const isCorrect = userAnswer === correctAnswer || accepted.includes(userAnswer)
      return {
        questionId: q.id,
        correct: isCorrect,
        points: isCorrect ? (q.points || 1) : 0,
        totalPoints: q.points || 1,
        userAnswer: answers[q.id] || '',
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        evidenceStartMs: q.evidenceStartMs || 0,
        evidenceEndMs: q.evidenceEndMs || 0,
      }
    })

    const totalScore = results.reduce((sum: number, r: any) => sum + r.points, 0)
    const totalPossible = results.reduce((sum: number, r: any) => sum + r.totalPoints, 0)

    postToParent('QUIZ_EVALUATION', {
      success: true,
      quizId,
      results,
      totalScore,
      totalPossible,
      accuracy: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
    })
  } catch {
    postToParent('QUIZ_EVALUATION', { error: 'Evaluation failed' })
  }
}

function onVideoChange(videoId: string): void {
  cancelInFlightTranscript()
  clearTranscriptCache(videoId)

  currentVideoInfo = detectVideoPage()
  sentTranscriptRequest = false

  if (isLearningMode) {
    postToParent('VIDEO_INFO', currentVideoInfo)
    handleTranscriptRequest()
  }
}

function onTimeUpdate(time: number): void {
  if (isLearningMode) {
    postToParent('TIME_UPDATE', time)
  }
}

function cleanup(): void {
  cancelInFlightTranscript()
  if (panelMessageHandler) {
    window.removeEventListener('message', panelMessageHandler)
    panelMessageHandler = null
  }
  if (isLearningMode) {
    getOrCreateLayoutManager().removePanel()
    getOrCreateLayoutManager().resetLayout()
  }
  layoutManager?.destroy()
  youtubeAdapter?.destroy()
  sessionService?.destroy()
  panelReady = false
  isLearningMode = false
}

function onYtNavigateStart(): void {
  cleanup()
}

function onYtNavigateFinish(): void {
  if (!youtubeAdapter) {
    initYouTubeLearning()
  } else {
    const currentId = youtubeAdapter.getCurrentVideoId()
    const newPageInfo = detectVideoPage()
    const newId = newPageInfo.videoId
    if (currentId && newId && currentId !== newId) {
      youtubeAdapter.reinit()
    }
  }
}

export async function initYouTubeLearning(): Promise<void> {
  try {
    const info = detectVideoPage()
    if (!info.isVideoPage) return

    currentVideoInfo = info

    eventBus = LearningEventBus.getInstance()
    storageAdapter = new StorageAdapter()
    focusMode = new FocusMode()
    aiAdapter = new AIAdapter()

    sessionService = new LearningSessionService(storageAdapter, eventBus)
    vocabService = new VocabularyService(aiAdapter, storageAdapter)
    analysisService = new AIAnalysisService(aiAdapter)

    youtubeAdapter = new YouTubeAdapter({
      onVideoChange,
      onTimeUpdate,
    })

    if (!youtubeAdapter.init()) return

    setupPanelMessaging()

    const lm = getOrCreateLayoutManager()
    lm.injectBadge(() => handleLearningModeToggle(true))

    if (!ytNavigationInitialized) {
      ytNavigationInitialized = true
      document.addEventListener('yt-navigate-start', onYtNavigateStart)
      document.addEventListener('yt-navigate-finish', onYtNavigateFinish)
    }
  } catch (err) {
    log('Initialization failed:', err)
  }
}

export async function setAutoOpen(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ [AUTO_OPEN_STORAGE_KEY]: enabled })
  } catch {
    // storage unavailable
  }
}

export async function getAutoOpen(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(AUTO_OPEN_STORAGE_KEY)
    return result[AUTO_OPEN_STORAGE_KEY] === true
  } catch {
    return false
  }
}

export { cleanup, handleLearningModeToggle }
