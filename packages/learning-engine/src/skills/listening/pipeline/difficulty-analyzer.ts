// ═══════════════════════════════════════════════════════════════════════
// DifficultyAnalyzer — Estimates CEFR/IELTS/proficiency level
// ═══════════════════════════════════════════════════════════════════════

import type { DifficultyAnalysis, Transcript } from './types'
import { CEFR_VOCABULARY } from './types'

export interface AnalyzeInput {
  transcript: Transcript
  targetBand: number
  distractorsCount: number
  entityCount: number
}

const BAND_TO_CEFR: Record<number, DifficultyAnalysis['cefrLevel']> = {
  4: 'A2',
  4.5: 'A2',
  5: 'B1',
  5.5: 'B1',
  6: 'B2',
  6.5: 'B2',
  7: 'B2',
  7.5: 'C1',
  8: 'C1',
  8.5: 'C1',
  9: 'C2',
}

function getCEFRLevel(band: number): DifficultyAnalysis['cefrLevel'] {
  const nearest = Object.keys(BAND_TO_CEFR).map(Number).reduce((prev, curr) =>
    Math.abs(curr - band) < Math.abs(prev - band) ? curr : prev,
  )
  return BAND_TO_CEFR[nearest] || 'B1'
}

function analyzeVocabulary(transcript: Transcript): DifficultyAnalysis['vocabularyComplexity'] {
  const words = transcript.plainText
    .toLowerCase()
    .replace(/[^a-z\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  const cefrSpread: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 }
  let academicWordCount = 0
  let technicalTermCount = 0
  const classified = new Set<string>()

  for (const word of words) {
    if (classified.has(word)) continue
    classified.add(word)

    let classified_cefr = false
    for (const [level, levelSet] of Object.entries(CEFR_VOCABULARY)) {
      if ((levelSet as Set<string>).has(word)) {
        cefrSpread[level] = (cefrSpread[level] || 0) + 1
        classified_cefr = true
        break
      }
    }

    // Estimate academic/technical words
    if (!classified_cefr && word.length > 7 && /^(tion|ment|ence|ance|ity|ism|logy|graphy|metry|nomy)$/.test(word.slice(-4))) {
      academicWordCount++
    } else if (!classified_cefr && word.length > 8) {
      technicalTermCount++
    }
  }

  const averageWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length

  return {
    cefrSpread,
    academicWordCount,
    technicalTermCount,
    averageWordLength: Math.round(averageWordLength * 10) / 10,
  }
}

function analyzeSpeechComplexity(
  transcript: Transcript,
  distractorsCount: number,
  entityCount: number,
): DifficultyAnalysis['speechComplexity'] {
  const { wordCount, estimatedSpeakingTimeSeconds } = transcript.metadata
  const minutes = estimatedSpeakingTimeSeconds / 60 || 1

  const utterancesPerMinute = Math.round(transcript.lines.length / minutes)
  const informationDensity = Math.round((entityCount / wordCount) * 1000) / 10
  const distractorDensity = Math.round((distractorsCount / wordCount) * 1000) / 10

  const disfluencyLines = transcript.lines.filter(l => l.isCorrection || l.isFiller).length
  const disfluencyRate = Math.round((disfluencyLines / wordCount) * 1000) / 10

  const sentences = transcript.plainText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const averageSentenceLength = sentences.length > 0
    ? wordsInArray(sentences.map(s => s.trim()), transcript)
    : 0

  return {
    averageSentenceLength,
    utterancesPerMinute,
    informationDensity,
    distractorDensity,
    disfluencyRate,
  }
}

function wordsInArray(sentences: string[], _transcript: Transcript): number {
  const total = sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0)
  return sentences.length > 0 ? Math.round((total / sentences.length) * 10) / 10 : 0
}

function analyzeComprehensionBurden(transcript: Transcript): DifficultyAnalysis['comprehensionBurden'] {
  const text = transcript.plainText.toLowerCase()

  const inferenceIndicators = ['therefore', 'consequently', 'as a result', 'this means', 'which suggests', 'indicating']
  const paraphraseIndicators = ['in other words', 'that is to say', 'meaning', 'or rather', 'specifically']
  const negationWords = ['not', 'never', 'no', "don't", "doesn't", "didn't", 'cannot', "won't", "shouldn't", 'neither', 'nor', 'hardly', 'rarely', 'seldom']

  const inferenceCount = inferenceIndicators.reduce((sum, indicator) =>
    sum + (text.split(indicator).length - 1), 0)
  const paraphraseCount = paraphraseIndicators.reduce((sum, indicator) =>
    sum + (text.split(indicator).length - 1), 0)
  const negationCount = negationWords.reduce((sum, word) =>
    sum + (text.match(new RegExp(`\\b${word}\\b`, 'gi'))?.length || 0), 0)
  const synonymCount = 0 // Requires NLP for accurate count; placeholder

  return { requiredInferenceCount: inferenceCount, paraphraseCount, synonymCount, negationCount }
}

export function analyze(input: AnalyzeInput): DifficultyAnalysis {
  const { transcript, targetBand, distractorsCount, entityCount } = input

  return {
    cefrLevel: getCEFRLevel(targetBand),
    estimatedIeltsBand: targetBand,
    vocabularyComplexity: analyzeVocabulary(transcript),
    speechComplexity: analyzeSpeechComplexity(transcript, distractorsCount, entityCount),
    comprehensionBurden: analyzeComprehensionBurden(transcript),
  }
}

export const DifficultyAnalyzer = {
  analyze,
}
