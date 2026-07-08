import { useState, useRef, useEffect, useCallback } from 'react'

interface AudioPlayerProps {
  audioUrl: string
  audioType: 'audio' | 'youtube'
  transcript?: string
}

function cleanTranscript(text: string): string {
  return text.replace(/\[blank-\d+\]/g, '________')
}

function TtsPlayer({ transcript }: { transcript: string }) {
  const cleanText = cleanTranscript(transcript)
  const [playing, setPlaying] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    const updateVoices = () => {
      const available = speechSynthesis.getVoices()
      setVoices(available)
      if (!selectedVoice && available.length > 0) {
        const english = available.find(v => v.lang.startsWith('en'))
        setSelectedVoice(english?.voiceURI || available[0].voiceURI)
      }
    }
    updateVoices()
    speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [selectedVoice])

  useEffect(() => {
    return () => {
      speechSynthesis.cancel()
    }
  }, [])

  function speak() {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(cleanText)
    if (selectedVoice) {
      const voice = voices.find(v => v.voiceURI === selectedVoice)
      if (voice) utterance.voice = voice
    }
    utterance.rate = 0.85
    utterance.pitch = 1
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
    setPlaying(true)
  }

  function pause() {
    speechSynthesis.pause()
    setPlaying(false)
  }

  function resume() {
    speechSynthesis.resume()
    setPlaying(true)
  }

  function stop() {
    speechSynthesis.cancel()
    setPlaying(false)
  }

  function togglePlayPause() {
    if (playing) {
      if (speechSynthesis.speaking) {
        pause()
      } else {
        stop()
      }
    } else {
      if (speechSynthesis.paused) {
        resume()
      } else {
        speak()
      }
    }
  }

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlayPause}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--color-primary)' }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex flex-1 items-center gap-3">
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="max-w-[160px] truncate rounded-lg border px-2 py-1 text-xs sm:max-w-[200px]"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            aria-label="Select voice"
          >
            {voices.filter(v => v.lang.startsWith('en')).map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={stop}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:opacity-80"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Stop"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
        AI-generated audio — browser text-to-speech
      </p>
    </div>
  )
}

export default function AudioPlayer({ audioUrl, audioType, transcript }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (audioType !== 'audio' || !audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const onLoaded = () => setDuration(audio.duration)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audioRef.current = null
    }
  }, [audioUrl, audioType])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }, [playing])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
  }, [])

  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (audioType === 'youtube' && audioUrl) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border p-3"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface-alt)',
        }}
      >
        <svg className="h-5 w-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        <a
          href={audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium underline-offset-2 hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Open YouTube video
        </a>
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
          (listen alongside the transcript)
        </span>
      </div>
    )
  }

  if (!audioUrl) {
    if (transcript) {
      return <TtsPlayer transcript={transcript} />
    }
    return (
      <div
        className="rounded-xl border p-4 text-sm"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface-alt)',
          color: 'var(--color-muted)',
        }}
      >
        No audio file available. Read the transcript below to practice.
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--color-primary)' }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <input
            ref={progressRef}
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, var(--color-border) ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`,
              accentColor: 'var(--color-primary)',
            }}
            aria-label="Seek audio"
          />
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer appearance-none rounded-full"
            style={{ accentColor: 'var(--color-primary)' }}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
