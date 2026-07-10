import { AIAdapter } from '../../infrastructure/ai/AIAdapter'
import type { TranscriptData, TranscriptSegmentData } from '../../domain/types'
import { safeStorageGet, safeStorageSet } from '../../../utils/safe-chrome'

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface VideoAnalysis {
  cefrLevel: CEFRLevel
  ieltsBand: number
  speakingSpeed: number
  topics: string[]
  accent: string | null
  wordCount: number
  uniqueWordCount: number
  averageWordLength: number
  lexicalDiversity: number
}

interface AnalysisCacheEntry {
  hash: string
  result: VideoAnalysis
  createdAt: string
}

const ANALYSIS_CACHE_KEY = 'yt-learning-analysis-cache'
const CACHE_MAX_ENTRIES = 50

export class AIAnalysisService {
  private aiAdapter: AIAdapter
  private cache: Map<string, AnalysisCacheEntry> = new Map()
  private cacheLoaded: boolean = false

  constructor(aiAdapter: AIAdapter) {
    this.aiAdapter = aiAdapter
  }

  async analyze(transcript: TranscriptData): Promise<VideoAnalysis> {
    const hash = this.computeHash(transcript.segments)

    await this.ensureCacheLoaded()

    const cached = this.cache.get(hash)
    if (cached) return cached.result

    const aiResult = await this.tryAIAnalysis(transcript)
    if (aiResult) {
      this.cache.set(hash, { hash, result: aiResult, createdAt: new Date().toISOString() })
      await this.persistCache()
      return aiResult
    }

    return this.deterministicAnalysis(transcript)
  }

  async generateVocabularyPreview(
    transcript: TranscriptData,
    count: number = 20,
    difficulty?: CEFRLevel,
  ): Promise<Array<{ word: string; frequency: number; estimatedCEFR: CEFRLevel }>> {
    const systemPrompt = 'You are an IELTS vocabulary analyst. Return ONLY valid JSON, no markdown.'
    const difficultyFilter = difficulty ? ` Focus on ${difficulty} level words.` : ''
    const userPrompt = `From this transcript, extract the top ${count} most important English vocabulary words for IELTS learners.${difficultyFilter}\n\nTranscript:\n${transcript.fullText}\n\nReturn an array of objects with keys: word, frequency (number), estimatedCEFR (A1/A2/B1/B2/C1/C2).`

    const result = await this.aiAdapter.request(systemPrompt, userPrompt, { temperature: 0.3 })
    if (!result.error && result.content) {
      try {
        const parsed = JSON.parse(result.content)
        if (Array.isArray(parsed)) return parsed.slice(0, count)
      } catch {
        // fall through to deterministic
      }
    }

    return this.deterministicVocabularyPreview(transcript, count)
  }

  calculateSpeakingSpeed(segments: TranscriptSegmentData[]): number {
    if (segments.length === 0) return 0

    const totalWords = segments.reduce((sum, s) => {
      return sum + s.text.split(/\s+/).filter(w => w.length > 0).length
    }, 0)

    const firstStart = segments[0].start
    const lastEnd = segments[segments.length - 1].end
    const durationMinutes = (lastEnd - firstStart) / 60

    if (durationMinutes <= 0) return 0

    return Math.round(totalWords / durationMinutes)
  }

  detectCEFRLevel(transcript: TranscriptData): CEFRLevel {
    const { lexicalDiversity, averageWordLength } = this.calculateLexicalMetrics(transcript.segments)

    if (averageWordLength > 5.5 || lexicalDiversity > 0.7) return 'C2'
    if (averageWordLength > 5.0 || lexicalDiversity > 0.6) return 'C1'
    if (averageWordLength > 4.5 || lexicalDiversity > 0.5) return 'B2'
    if (averageWordLength > 4.0 || lexicalDiversity > 0.4) return 'B1'
    if (averageWordLength > 3.5) return 'A2'
    return 'A1'
  }

  private async tryAIAnalysis(transcript: TranscriptData): Promise<VideoAnalysis | null> {
    const systemPrompt = 'You are an IELTS video analyst. Return ONLY valid JSON, no markdown, no code fences.'
    const userPrompt = `Analyze this transcript for IELTS learning:\n\nTranscript: ${transcript.fullText}\n\nReturn JSON with: cefrLevel (A1/A2/B1/B2/C1/C2), ieltsBand (1-9), topics (array of strings), accent (string or null).`

    const result = await this.aiAdapter.request(systemPrompt, userPrompt, { temperature: 0.3 })
    if (result.error || !result.content) return null

    try {
      const parsed = JSON.parse(result.content)
      const wordCount = this.countWords(transcript.segments)
      const uniqueWordCount = this.countUniqueWords(transcript.segments)
      const averageWordLength = this.calculateAverageWordLength(transcript.segments)
      const lexicalDiversity = uniqueWordCount / (wordCount || 1)

      return {
        cefrLevel: this.validateCEFR(parsed.cefrLevel),
        ieltsBand: this.clampIELTS(parsed.ieltsBand),
        speakingSpeed: this.calculateSpeakingSpeed(transcript.segments),
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 10) : [],
        accent: typeof parsed.accent === 'string' ? parsed.accent : null,
        wordCount,
        uniqueWordCount,
        averageWordLength,
        lexicalDiversity,
      }
    } catch {
      return null
    }
  }

  private deterministicAnalysis(transcript: TranscriptData): VideoAnalysis {
    const wordCount = this.countWords(transcript.segments)
    const uniqueWordCount = this.countUniqueWords(transcript.segments)
    const averageWordLength = this.calculateAverageWordLength(transcript.segments)
    const lexicalDiversity = uniqueWordCount / (wordCount || 1)
    const speakingSpeed = this.calculateSpeakingSpeed(transcript.segments)

    const cefrLevel = this.detectCEFRLevel(transcript)
    const ieltsBand = this.cefrToIELTS(cefrLevel)

    return {
      cefrLevel,
      ieltsBand,
      speakingSpeed,
      topics: [],
      accent: null,
      wordCount,
      uniqueWordCount,
      averageWordLength,
      lexicalDiversity,
    }
  }

  private calculateLexicalMetrics(
    segments: TranscriptSegmentData[],
  ): { lexicalDiversity: number; averageWordLength: number } {
    const uniqueWords = new Set<string>()
    let totalChars = 0
    let totalWords = 0

    for (const segment of segments) {
      const words = segment.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0)
      for (const word of words) {
        uniqueWords.add(word)
        totalChars += word.length
        totalWords++
      }
    }

    return {
      lexicalDiversity: totalWords > 0 ? uniqueWords.size / totalWords : 0,
      averageWordLength: totalWords > 0 ? totalChars / totalWords : 0,
    }
  }

  private countWords(segments: TranscriptSegmentData[]): number {
    return segments.reduce((sum, s) => sum + s.text.split(/\s+/).filter(w => w.length > 0).length, 0)
  }

  private countUniqueWords(segments: TranscriptSegmentData[]): number {
    const words = new Set<string>()
    for (const segment of segments) {
      const cleaned = segment.text.toLowerCase().replace(/[^a-z\s]/g, '')
      for (const w of cleaned.split(/\s+/).filter(w => w.length > 0)) {
        words.add(w)
      }
    }
    return words.size
  }

  private calculateAverageWordLength(segments: TranscriptSegmentData[]): number {
    let totalChars = 0
    let totalWords = 0
    for (const segment of segments) {
      for (const w of segment.text.split(/\s+/).filter(w => w.length > 0)) {
        totalChars += w.length
        totalWords++
      }
    }
    return totalWords > 0 ? totalChars / totalWords : 0
  }

  private deterministicVocabularyPreview(
    transcript: TranscriptData,
    count: number,
  ): Array<{ word: string; frequency: number; estimatedCEFR: CEFRLevel }> {
    const frequencyMap = new Map<string, number>()
    for (const segment of transcript.segments) {
      const words = segment.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0)
      for (const word of words) {
        frequencyMap.set(word, (frequencyMap.get(word) ?? 0) + 1)
      }
    }

    return [...frequencyMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word, freq]) => ({
        word,
        frequency: freq,
        estimatedCEFR: this.estimateCEFRFromWord(word),
      }))
  }

  private estimateCEFRFromWord(word: string): CEFRLevel {
    const length = word.length
    if (length <= 3) return 'A1'
    if (length <= 5) return 'A2'
    if (length <= 7) return 'B1'
    if (length <= 9) return 'B2'
    if (length <= 11) return 'C1'
    return 'C2'
  }

  private validateCEFR(level: string): CEFRLevel {
    const valid: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const upper = level?.toUpperCase() as CEFRLevel
    return valid.includes(upper) ? upper : 'B1'
  }

  private clampIELTS(band: number): number {
    return Math.max(1, Math.min(9, Math.round(band || 5)))
  }

  private cefrToIELTS(cefr: CEFRLevel): number {
    const map: Record<CEFRLevel, number> = { A1: 2, A2: 3, B1: 4, B2: 5.5, C1: 7, C2: 8.5 }
    return map[cefr]
  }

  private computeHash(segments: TranscriptSegmentData[]): string {
    const text = segments.map(s => `${s.start}-${s.end}-${s.text}`).join('|')
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const chr = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0
    }
    return `hash_${Math.abs(hash).toString(36)}`
  }

  private async ensureCacheLoaded(): Promise<void> {
    if (this.cacheLoaded) return
    try {
      const result = await safeStorageGet<AnalysisCacheEntry[]>(ANALYSIS_CACHE_KEY)
      const entries = result?.[ANALYSIS_CACHE_KEY] ?? []
      for (const entry of entries) {
        this.cache.set(entry.hash, entry)
      }
    } catch {
      // cache not available
    }
    this.cacheLoaded = true
  }

  private async persistCache(): Promise<void> {
    const entries = [...this.cache.values()]
    if (entries.length > CACHE_MAX_ENTRIES) {
      entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      entries.splice(0, entries.length - CACHE_MAX_ENTRIES)
    }
    await safeStorageSet({ [ANALYSIS_CACHE_KEY]: entries })
  }
}
