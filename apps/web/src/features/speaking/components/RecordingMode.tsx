import { useEffect, useRef, useState, useCallback } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

interface RecordingModeProps {
  onTranscript: (text: string) => void
  onFinish: () => void
  onPause: () => void
  onCancel: () => void
  onAudioBlob: (blob: Blob) => void
  recordingTime: number
  setRecordingTime: (t: number) => void
  maxDuration?: number
}

export default function RecordingMode({
  onTranscript,
  onFinish,
  onPause,
  onCancel,
  onAudioBlob,
  recordingTime,
  setRecordingTime,
  maxDuration = 120,
}: RecordingModeProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const micAnimationRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mountIdRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const isCompletingRef = useRef(false)
  const isPausedRef = useRef(false)

  const audioChunksRef = useRef<Blob[]>([])
  const mimeTypeRef = useRef('audio/webm')
  const accumulatedRef = useRef('')

  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const onPauseRef = useRef(onPause)
  onPauseRef.current = onPause
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel
  const onAudioBlobRef = useRef(onAudioBlob)
  onAudioBlobRef.current = onAudioBlob

  const stopEverything = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current
      recognitionRef.current = null
      try { rec.stop() } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (micAnimationRef.current) {
      cancelAnimationFrame(micAnimationRef.current)
      micAnimationRef.current = 0
    }
    if (analyserRef.current) {
      analyserRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [])

  const startRecording = useCallback(async (mountId: number) => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (mountId !== mountIdRef.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      streamRef.current = stream

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const animateMic = () => {
        if (!analyserRef.current) return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteTimeDomainData(dataArray)
        let sumSquares = 0
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128
          sumSquares += normalized * normalized
        }
        const rms = Math.sqrt(sumSquares / dataArray.length)
        const level = Math.min(rms * 4, 1)
        setMicLevel(level < 0.04 ? 0 : level)
        micAnimationRef.current = requestAnimationFrame(animateMic)
      }
      animateMic()

      const mimeType = (['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', ''] as const)
        .find(t => t === '' || MediaRecorder.isTypeSupported(t)) || ''
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      mimeTypeRef.current = mimeType || mediaRecorder.mimeType || 'audio/webm'

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        if (isCompletingRef.current) {
          const chunks = audioChunksRef.current
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: mimeTypeRef.current })
            onAudioBlobRef.current(blob)
          }
          isCompletingRef.current = false
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)

      const SpeechRecognitionConstructor = (window as unknown as Record<string, unknown>).SpeechRecognition
        || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
      if (SpeechRecognitionConstructor) {
        const recognition = new (SpeechRecognitionConstructor as new () => SpeechRecognition)()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en'
        recognition.maxAlternatives = 1
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (!recognitionRef.current) return
          let interim = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const alternative = result[0]
            if (result.isFinal) {
              if (alternative.confidence >= 0.4) {
                accumulatedRef.current += alternative.transcript + ' '
              }
            } else {
              if (alternative.confidence >= 0.3) {
                interim += alternative.transcript
              }
            }
          }
          const full = (accumulatedRef.current + interim).trim()
          onTranscriptRef.current(full)
        }
        recognition.onerror = (event) => {
          if (event.error === 'no-speech' || event.error === 'aborted') return
          console.warn('Speech recognition error:', event.error)
        }
        recognition.onend = () => {
          if (recognitionRef.current && !isCompletingRef.current && !isPausedRef.current) {
            try { recognition.start() } catch {}
          } else {
            recognitionRef.current = null
          }
        }
        recognition.start()
        recognitionRef.current = recognition
      }

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Microphone access denied or not available.')
    }
  }, [setRecordingTime])

  useEffect(() => {
    accumulatedRef.current = ''
    audioChunksRef.current = []
    mountIdRef.current += 1
    const id = mountIdRef.current
    startRecording(id)
    return () => {
      mountIdRef.current += 1
      stopEverything()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [startRecording, stopEverything])

  useEffect(() => {
    if (isRecording && !isPaused && recordingTime >= maxDuration) {
      isCompletingRef.current = true
      stopEverything()
      setIsRecording(false)
      onFinishRef.current()
    }
  }, [recordingTime, maxDuration, isRecording, isPaused, stopEverything])

  function handlePauseResume() {
    if (isPaused) {
      setIsPaused(false)
      isPausedRef.current = false
      mountIdRef.current += 1
      const id = mountIdRef.current
      startRecording(id)
    } else {
      setIsPaused(true)
      isPausedRef.current = true
      stopEverything()
    }
  }

  function handleFinish() {
    isCompletingRef.current = true
    stopEverything()
    setIsRecording(false)
    onFinishRef.current()
  }

  function handleCancel() {
    isCompletingRef.current = true
    stopEverything()
    setIsRecording(false)
    onCancelRef.current()
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progressPercent = Math.min((recordingTime / maxDuration) * 100, 100)
  const isNearLimit = recordingTime >= maxDuration * 0.8

  if (error) {
    return (
      <Card variant="elevated">
        <CardContent>
          <div className="flex flex-col items-center py-8">
            <svg className="mb-4 h-12 w-12" style={{ color: 'var(--color-danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
              You can still type your answer manually.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-1 transition-all"
        style={{
          width: `${progressPercent}%`,
          backgroundColor: isNearLimit ? 'var(--color-danger)' : 'var(--color-success)',
        }}
      />

      <CardContent>
        <div className="flex flex-col items-center py-8">
          <div
            className="relative mb-6"
            style={{
              transform: `scale(${1 + micLevel * 0.1})`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full"
              style={{
                backgroundColor: isPaused ? 'var(--color-surface-alt)' : 'var(--color-danger-light)',
                boxShadow: isPaused
                  ? 'none'
                  : `0 0 0 ${4 + micLevel * 16}px rgba(239, 68, 68, ${0.15 * (1 - micLevel)})`,
              }}
            >
              <svg
                className="h-10 w-10"
                style={{ color: isPaused ? 'var(--color-muted)' : 'var(--color-danger)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {isPaused ? (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                  </>
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </>
                )}
              </svg>
            </div>
          </div>

          <div className="mb-2 text-center">
            <span
              className="text-3xl font-bold tabular-nums"
              style={{
                color: isPaused ? 'var(--color-muted)' : isNearLimit ? 'var(--color-danger)' : 'var(--color-text)',
              }}
            >
              {formatTime(recordingTime)}
            </span>
            <span className="ml-2 text-sm" style={{ color: 'var(--color-muted)' }}>
              / {formatTime(maxDuration)}
            </span>
          </div>

          {isPaused ? (
            <span className="mb-4 text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
              Recording paused
            </span>
          ) : (
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-danger)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                Recording
              </span>
            </div>
          )}

          <div
            className="mb-2 flex h-1.5 w-48 overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="h-full flex-1"
                style={{
                  backgroundColor: micLevel > (i / 20) ? 'var(--color-primary)' : 'transparent',
                  transition: 'background-color 0.1s ease',
                }}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={handlePauseResume}
              variant={isPaused ? 'primary' : 'secondary'}
              size="md"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={handleFinish}
              variant="success"
              size="md"
              disabled={recordingTime < 3}
            >
              Finish Recording
            </Button>
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="md"
              style={{ color: 'var(--color-danger)' } as React.CSSProperties}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
