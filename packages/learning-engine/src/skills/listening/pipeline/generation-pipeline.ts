// ═══════════════════════════════════════════════════════════════════════
// ListeningGenerationPipeline — Orchestrates per-part strategies
// ═══════════════════════════════════════════════════════════════════════

import type { AnswerEntry, AnswerKey, PipelineConfig, PipelineResult } from './types'
import { getStrategy } from './strategies'
import { Validator } from './validator'
import { QualityScorer } from './quality-scorer'
import { DifficultyAnalyzer } from './difficulty-analyzer'

const PIPELINE_VERSION = '2.1.0'
const MAX_RETRIES = 3

export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const startTime = Date.now()
  const stageTimings: Record<string, number> = {}
  let rejectedVersions = 0
  const strategy = getStrategy(config.part)

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const currentResult = await executeStages(config, stageTimings, strategy)

    // Generic validation (applies to all parts)
    if (config.enableValidation) {
      const validationStart = Date.now()
      currentResult.validation = Validator.validate({
        questionSet: currentResult.questionSet,
        answerKey: currentResult.answerKey,
        transcript: currentResult.transcript,
        distractors: currentResult.distractors,
      })

      // Merge part-specific validation
      const partValidation = strategy.validatePart({
        questionSet: currentResult.questionSet,
        transcript: currentResult.transcript,
        distractors: currentResult.distractors,
      })
      currentResult.validation.errors.push(...partValidation.errors)
      currentResult.validation.warnings.push(...partValidation.warnings)
      currentResult.validation.valid = currentResult.validation.valid && partValidation.valid
      currentResult.validation.summary.failedChecks += partValidation.summary.failedChecks
      currentResult.validation.summary.warningCount += partValidation.summary.warningCount
      currentResult.validation.summary.totalChecks += partValidation.summary.totalChecks

      stageTimings['validation'] = (stageTimings['validation'] || 0) + (Date.now() - validationStart)

      if (!currentResult.validation.valid && attempt < MAX_RETRIES - 1) {
        rejectedVersions++
        continue
      }
    }

    // Quality check
    if (config.enableQualityCheck) {
      const qualityStart = Date.now()
      currentResult.qualityReport = QualityScorer.score(
        {
          scenario: currentResult.scenario,
          transcript: currentResult.transcript,
          questionSet: currentResult.questionSet,
          distractors: currentResult.distractors,
          validation: currentResult.validation,
        },
        config.qualityThreshold,
      )
      stageTimings['quality-check'] = (stageTimings['quality-check'] || 0) + (Date.now() - qualityStart)

      if (!currentResult.qualityReport.passed && attempt < MAX_RETRIES - 1) {
        rejectedVersions++
        continue
      }
    }

    // Difficulty analysis
    const difficultyStart = Date.now()
    currentResult.difficultyAnalysis = DifficultyAnalyzer.analyze({
      transcript: currentResult.transcript,
      targetBand: config.targetBand,
      distractorsCount: currentResult.distractors.length,
      entityCount: currentResult.questionSet.entities.length,
    })
    stageTimings['difficulty-analysis'] = (stageTimings['difficulty-analysis'] || 0) + (Date.now() - difficultyStart)

    const totalTime = Date.now() - startTime
    currentResult.rejectedVersions = rejectedVersions
    currentResult.metadata = {
      pipelineVersion: PIPELINE_VERSION,
      generatedAt: new Date().toISOString(),
      totalGenerationTimeMs: totalTime,
      stageTimings,
      rejectedVersions,
      finalScore: currentResult.qualityReport?.totalScore ?? 0,
    }

    return currentResult
  }

  // All retries failed — return last computed result
  const fallbackResult = await executeStages(config, stageTimings, strategy)
  const totalTime = Date.now() - startTime

  fallbackResult.metadata = {
    pipelineVersion: PIPELINE_VERSION,
    generatedAt: new Date().toISOString(),
    totalGenerationTimeMs: totalTime,
    stageTimings,
    rejectedVersions,
    finalScore: 0,
  }

  return fallbackResult
}

async function executeStages(
  config: PipelineConfig,
  stageTimings: Record<string, number>,
  strategy: ReturnType<typeof getStrategy>,
): Promise<PipelineResult> {
  // Stage 1: Scenario (via strategy)
  const scenarioStart = Date.now()
  const scenario = strategy.createScenario(config)
  stageTimings['scenario'] = (stageTimings['scenario'] || 0) + (Date.now() - scenarioStart)

  // Stage 2: Distractors (via strategy)
  const distractorStart = Date.now()
  const distractors = strategy.buildDistractors({
    scenario,
    maxDistractors: config.maxDistractors,
  })
  stageTimings['distractors'] = (stageTimings['distractors'] || 0) + (Date.now() - distractorStart)

  // Stage 3: Transcript (via strategy)
  const transcriptStart = Date.now()
  const transcript = strategy.buildTranscript({
    scenario,
    distractors,
  })
  stageTimings['transcript'] = (stageTimings['transcript'] || 0) + (Date.now() - transcriptStart)

  // Update distractor line indices
  for (const distractor of distractors) {
    const distLineIdx = transcript.lines.findIndex(l =>
      l.isDistractor && l.text.toLowerCase().includes(distractor.distractorValue.toLowerCase()),
    )
    const corrLineIdx = transcript.lines.findIndex(l =>
      l.isCorrection && l.text.toLowerCase().includes(distractor.correctionPhrase.toLowerCase()),
    )
    if (distLineIdx >= 0) distractor.lineIndex = distLineIdx
    if (corrLineIdx >= 0) distractor.correctionLineIndex = corrLineIdx
  }

  // Stage 4: Questions (via strategy)
  const questionsStart = Date.now()
  const questionSet = strategy.buildQuestions({
    scenario,
    transcript,
    questionCount: config.questionCount,
  })
  stageTimings['questions'] = (stageTimings['questions'] || 0) + (Date.now() - questionsStart)

  // Stage 5: Answer Key
  const answerKeyStart = Date.now()
  const answerKey = buildAnswerKey(questionSet, transcript)
  stageTimings['answer-key'] = (stageTimings['answer-key'] || 0) + (Date.now() - answerKeyStart)

  return {
    scenario,
    transcript,
    questionSet,
    answerKey,
    distractors,
    validation: { valid: true, errors: [], warnings: [], summary: { totalChecks: 0, passedChecks: 0, failedChecks: 0, warningCount: 0 } },
    qualityReport: null,
    difficultyAnalysis: {
      cefrLevel: 'B1',
      estimatedIeltsBand: config.targetBand,
      vocabularyComplexity: { cefrSpread: {}, academicWordCount: 0, technicalTermCount: 0, averageWordLength: 0 },
      speechComplexity: { averageSentenceLength: 0, utterancesPerMinute: 0, informationDensity: 0, distractorDensity: 0, disfluencyRate: 0 },
      comprehensionBurden: { requiredInferenceCount: 0, paraphraseCount: 0, synonymCount: 0, negationCount: 0 },
    },
    metadata: {
      pipelineVersion: PIPELINE_VERSION,
      generatedAt: new Date().toISOString(),
      totalGenerationTimeMs: 0,
      stageTimings: {},
      rejectedVersions: 0,
      finalScore: 0,
    },
    rejectedVersions: 0,
  }
}

function buildAnswerKey(questionSet: PipelineResult['questionSet'], transcript: PipelineResult['transcript']): AnswerKey {
  const entries: AnswerEntry[] = []

  for (let i = 0; i < questionSet.entities.length; i++) {
    const entity = questionSet.entities[i]
    const answerLineIdx = transcript.lines.findIndex(line =>
      line.text.toLowerCase().includes(entity.value.toLowerCase()),
    )

    let correctionsBeforeAnswer = 0
    for (let j = 0; j < answerLineIdx; j++) {
      if (transcript.lines[j].isCorrection) correctionsBeforeAnswer++
    }

    entries.push({
      questionNumber: i + 1,
      entityId: entity.id,
      correctAnswer: entity.value,
      acceptableAlternatives: entity.acceptableAlternatives || [],
      wordLimit: entity.wordLimit,
      verifiedLineIndex: answerLineIdx,
      unambiguous: correctionsBeforeAnswer === 0 || (answerLineIdx > 0 && transcript.lines.some(
        (l, idx) => idx >= answerLineIdx - 2 && idx <= answerLineIdx && l.isCorrection,
      )),
    })
  }

  return {
    answerKeyId: `ak-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    questionSetId: questionSet.questionSetId,
    entries,
    metadata: {
      totalAnswers: entries.length,
      unambiguousCount: entries.filter(e => e.unambiguous).length,
      averageAnswerLength: entries.length > 0 ? entries.reduce((sum, e) => sum + e.correctAnswer.split(/\s+/).length, 0) / entries.length : 0,
      totalAcceptableVariations: entries.reduce((sum, e) => sum + e.acceptableAlternatives.length, 0),
      allFactsInTranscript: entries.every(e => e.verifiedLineIndex >= 0),
    },
  }
}

export const ListeningGenerationPipeline = {
  runPipeline,
}
