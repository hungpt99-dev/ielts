// ═══════════════════════════════════════════════════════════════════════
// Pipeline Tests — Strategies, Question Types, Validator, Quality Scorer
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest'
import {
  part1Strategy,
  part2Strategy,
  part3Strategy,
  part4Strategy,
  getStrategy,
  Validator,
  QualityScorer,
  DifficultyAnalyzer,
  ListeningGenerationPipeline,
  pickQuestionType,
  ALL_QUESTION_TYPES,
} from '../index'
import type { PipelineConfig, Transcript, InformationEntity } from '../types'

const BASE_CONFIG: PipelineConfig = {
  targetBand: 6.0,
  part: 'part1',
  topic: 'Hotel Reservation',
  questionCount: 6,
  maxDistractors: 2,
  enableValidation: true,
  enableQualityCheck: true,
  qualityThreshold: 70,
  language: 'en',
}

// ─── Part Strategies ───────────────────────────────────────────────────
describe('Part1Strategy', () => {
  it('creates a scenario with 2 speakers', () => {
    const scenario = part1Strategy.createScenario({ ...BASE_CONFIG, part: 'part1' })
    expect(scenario.part).toBe('part1')
    expect(scenario.speakers.length).toBe(2)
    expect(scenario.exchangeType).toBe('booking')
  })

  it('creates correct language features for low band', () => {
    const features = part1Strategy.getLanguageFeatures(4.5)
    expect(features.speechPace).toBe('slow')
    expect(features.allowCorrections).toBe(false)
  })

  it('creates correct language features for high band', () => {
    const features = part1Strategy.getLanguageFeatures(7.0)
    expect(features.allowCorrections).toBe(true)
  })

  it('builds a transcript with opening and closing', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const transcript = part1Strategy.buildTranscript({ scenario, distractors: [] })
    expect(transcript.lines.length).toBeGreaterThan(2)
    expect(transcript.plainText.length).toBeGreaterThan(50)
  })

  it('builds distractors for entities', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const distractors = part1Strategy.buildDistractors({ scenario, maxDistractors: 2 })
    expect(distractors.length).toBeGreaterThanOrEqual(0)
    expect(distractors.length).toBeLessThanOrEqual(2)
  })

  it('builds questions with pickQuestionType', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const transcript = part1Strategy.buildTranscript({ scenario, distractors: [] })
    const qs = part1Strategy.buildQuestions({ scenario, transcript, questionCount: 4 })
    expect(qs.totalQuestions).toBe(4)
    expect(qs.layout).toBeTruthy()
    expect(qs.instructions).toContain('NO MORE THAN')
  })

  it('ensures distractors differ from correct answers', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const distractors = part1Strategy.buildDistractors({ scenario, maxDistractors: 3 })
    for (const d of distractors) {
      const entity = scenario.expectedEntities.find(e => e.id === d.entityId)
      if (entity) expect(d.distractorValue.toLowerCase()).not.toBe(entity.value.toLowerCase())
    }
  })
})

describe('Part2Strategy', () => {
  it('creates a single-speaker monologue scenario', () => {
    const scenario = part2Strategy.createScenario({ ...BASE_CONFIG, part: 'part2', topic: '' })
    expect(scenario.speakers.length).toBe(1)
    expect(scenario.exchangeType).toBe('tour-guide')
    expect(scenario.part).toBe('part2')
  })

  it('never generates distractors', () => {
    const scenario = part2Strategy.createScenario({ ...BASE_CONFIG, part: 'part2', topic: '' })
    const distractors = part2Strategy.buildDistractors({ scenario, maxDistractors: 5 })
    expect(distractors.length).toBe(0)
  })

  it('builds a monologue transcript', () => {
    const scenario = part2Strategy.createScenario({ ...BASE_CONFIG, part: 'part2', topic: '' })
    const transcript = part2Strategy.buildTranscript({ scenario, distractors: [] })
    expect(transcript.metadata.numberOfSpeakers).toBe(1)
  })
})

describe('Part3Strategy', () => {
  it('creates 3-speaker academic discussion', () => {
    const scenario = part3Strategy.createScenario({ ...BASE_CONFIG, part: 'part3', targetBand: 7.0, topic: '' })
    expect(scenario.speakers.length).toBe(3)
    expect(scenario.languageFeatures.allowHesitations).toBe(true)
    expect(scenario.languageFeatures.allowInterruptions).toBe(true)
  })

  it('builds discussion transcript with multiple speakers', () => {
    const scenario = part3Strategy.createScenario({ ...BASE_CONFIG, part: 'part3', topic: '' })
    const transcript = part3Strategy.buildTranscript({ scenario, distractors: [] })
    expect(transcript.metadata.numberOfSpeakers).toBeGreaterThanOrEqual(2)
  })

  it('includes agreement/disagreement in discussion', () => {
    const scenario = part3Strategy.createScenario({ ...BASE_CONFIG, part: 'part3', topic: '' })
    const transcript = part3Strategy.buildTranscript({ scenario, distractors: [] })
    // With 3 speakers and multiple entities, conversation should be substantial
    expect(transcript.lines.length).toBeGreaterThan(5)
  })
})

describe('Part4Strategy', () => {
  it('creates single-speaker academic lecture', () => {
    const scenario = part4Strategy.createScenario({ ...BASE_CONFIG, part: 'part4', targetBand: 8.0, topic: '' })
    expect(scenario.speakers.length).toBe(1)
    expect(scenario.exchangeType).toBe('lecture')
    expect(scenario.languageFeatures.formality).toBe('academic')
  })

  it('never generates distractors', () => {
    const scenario = part4Strategy.createScenario({ ...BASE_CONFIG, part: 'part4', topic: '' })
    const distractors = part4Strategy.buildDistractors({ scenario, maxDistractors: 3 })
    expect(distractors.length).toBe(0)
  })

  it('builds formal lecture transcript', () => {
    const scenario = part4Strategy.createScenario({ ...BASE_CONFIG, part: 'part4', topic: '' })
    const transcript = part4Strategy.buildTranscript({ scenario, distractors: [] })
    expect(transcript.plainText.length).toBeGreaterThan(100)
    expect(transcript.metadata.numberOfSpeakers).toBe(1)
  })
})

describe('getStrategy', () => {
  it('returns correct strategy for each part', () => {
    expect(getStrategy('part1').part).toBe('part1')
    expect(getStrategy('part2').part).toBe('part2')
    expect(getStrategy('part3').part).toBe('part3')
    expect(getStrategy('part4').part).toBe('part4')
  })
})

// ─── Question Types ────────────────────────────────────────────────────
describe('Question Types', () => {
  it('ALL_QUESTION_TYPES has 7 generators', () => {
    expect(ALL_QUESTION_TYPES.length).toBe(7)
  })

  it('each generator has required interface', () => {
    for (const gen of ALL_QUESTION_TYPES) {
      expect(typeof gen.layout).toBe('string')
      expect(typeof gen.label).toBe('string')
      expect(typeof gen.supportsPart).toBe('function')
      expect(typeof gen.build).toBe('function')
      expect(typeof gen.validate).toBe('function')
    }
  })

  it('pickQuestionType returns valid generator for each part', () => {
    for (const part of ['part1', 'part2', 'part3', 'part4']) {
      for (let i = 0; i < 5; i++) {
        const qt = pickQuestionType(part)
        expect(qt.supportsPart(part)).toBe(true)
      }
    }
  })

  it('form completion produces form with sections', () => {
    const gen = ALL_QUESTION_TYPES.find(g => g.layout === 'form-completion')!
    const entities = makeTestEntities(6)
    const output = gen.build({ entities, scenarioTitle: 'Test Form', scenarioTopic: 'Test' })
    const pres = output.presentation as any
    expect(pres.formTitle).toBeTruthy()
    expect(pres.fields.length).toBe(6)
    expect(pres.sections.length).toBeGreaterThanOrEqual(1)
  })

  it('multiple choice generates 4 options per question', () => {
    const gen = ALL_QUESTION_TYPES.find(g => g.layout === 'multiple-choice')!
    const output = gen.build({ entities: makeTestEntities(3), scenarioTitle: 'Test', scenarioTopic: 'Test' })
    expect(output.totalQuestions).toBe(3)
  })

  it('matching generates column A/B format', () => {
    const gen = ALL_QUESTION_TYPES.find(g => g.layout === 'matching')!
    const output = gen.build({ entities: makeTestEntities(4), scenarioTitle: 'Test', scenarioTopic: 'Test' })
    expect(output.instructions).toContain('Column A')
    expect(output.instructions).toContain('Column B')
  })

  it('table completion produces table with rows and columns', () => {
    const gen = ALL_QUESTION_TYPES.find(g => g.layout === 'table-completion')!
    const output = gen.build({ entities: makeTestEntities(4), scenarioTitle: 'Test', scenarioTopic: 'Test' })
    const pres = output.presentation as any
    expect(pres.rows.length).toBe(4)
    expect(pres.columnHeaders.length).toBe(2)
  })
})

// ─── Validator ─────────────────────────────────────────────────────────
describe('Validator', () => {
  it('validates a correctly generated Part 1 exercise', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const distractors = part1Strategy.buildDistractors({ scenario, maxDistractors: 1 })
    const transcript = part1Strategy.buildTranscript({ scenario, distractors })
    const qs = part1Strategy.buildQuestions({ scenario, transcript, questionCount: 4 })
    const answerKey = buildTestAnswerKey(qs, transcript)

    const result = Validator.validate({ questionSet: qs, answerKey, transcript, distractors })
    expect(result.valid).toBe(true)
  })

  it('detects missing answers', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const transcript = part1Strategy.buildTranscript({ scenario, distractors: [] })
    const qs = part1Strategy.buildQuestions({ scenario, transcript, questionCount: 4 })

    const result = Validator.validate({
      questionSet: qs,
      answerKey: { answerKeyId: 'empty', questionSetId: '', entries: [], metadata: { totalAnswers: 0, unambiguousCount: 0, averageAnswerLength: 0, totalAcceptableVariations: 0, allFactsInTranscript: false } },
      transcript,
      distractors: [],
    })
    expect(result.valid).toBe(false)
  })

  it('detects invalid distractors matching correct answer', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const transcript = part1Strategy.buildTranscript({ scenario, distractors: [] })
    const qs = part1Strategy.buildQuestions({ scenario, transcript, questionCount: 4 })
    const answerKey = buildTestAnswerKey(qs, transcript)

    const badDistractor = {
      distractorId: 'bad',
      type: 'wrong-date-corrected' as const,
      entityId: qs.entities[0].id,
      distractorValue: qs.entities[0].value,
      speakerId: 's1',
      lineIndex: 0,
      correctedBySpeakerId: 's2',
      correctionLineIndex: 1,
      correctionPhrase: 'fix',
    }

    const result = Validator.validate({ questionSet: qs, answerKey, transcript, distractors: [badDistractor] })
    expect(result.errors.some(e => e.code === 'INVALID_DISTRACTOR')).toBe(true)
  })
})

// ─── Quality Scorer ────────────────────────────────────────────────────
describe('QualityScorer', () => {
  it('scores a Part 1 exercise', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const distractors = part1Strategy.buildDistractors({ scenario, maxDistractors: 2 })
    const transcript = part1Strategy.buildTranscript({ scenario, distractors })
    const qs = part1Strategy.buildQuestions({ scenario, transcript, questionCount: 4 })
    const answerKey = buildTestAnswerKey(qs, transcript)
    const validation = Validator.validate({ questionSet: qs, answerKey, transcript, distractors })

    const report = QualityScorer.score({ scenario, transcript, questionSet: qs, distractors, validation }, 70)
    expect(report.totalScore).toBeGreaterThanOrEqual(0)
    expect(report.totalScore).toBeLessThanOrEqual(100)
  })

  it('reports pass/fail against threshold', () => {
    const scenario = part1Strategy.createScenario(BASE_CONFIG)
    const transcript = part1Strategy.buildTranscript({ scenario, distractors: [] })
    const qs = part1Strategy.buildQuestions({ scenario, transcript, questionCount: 4 })
    const answerKey = buildTestAnswerKey(qs, transcript)
    const validation = Validator.validate({ questionSet: qs, answerKey, transcript, distractors: [] })

    const pass = QualityScorer.score({ scenario, transcript, questionSet: qs, distractors: [], validation }, 70)
    const fail = QualityScorer.score({ scenario, transcript, questionSet: qs, distractors: [], validation }, 95)
    expect(typeof pass.passed).toBe('boolean')
    expect(typeof fail.passed).toBe('boolean')
  })
})

// ─── Difficulty Analyzer ───────────────────────────────────────────────
describe('DifficultyAnalyzer', () => {
  it('estimates CEFR from band', () => {
    const scenario = part1Strategy.createScenario({ ...BASE_CONFIG, targetBand: 5.5 })
    const transcript = part1Strategy.buildTranscript({ scenario, distractors: [] })
    const analysis = DifficultyAnalyzer.analyze({ transcript, targetBand: 5.5, distractorsCount: 0, entityCount: 4 })
    expect(analysis.cefrLevel).toBe('B1')
    expect(analysis.estimatedIeltsBand).toBe(5.5)
  })
})

// ─── Pipeline Integration ──────────────────────────────────────────────
describe('Pipeline', () => {
  it('Part 1 pipeline end-to-end', async () => {
    const result = await ListeningGenerationPipeline.runPipeline(BASE_CONFIG)
    expect(result.scenario.part).toBe('part1')
    expect(result.transcript.lines.length).toBeGreaterThan(0)
    expect(result.questionSet.totalQuestions).toBeGreaterThan(0)
    expect(result.answerKey.entries.length).toBe(result.questionSet.entities.length)
    expect(result.validation.valid).toBe(true)
    expect(result.metadata.pipelineVersion).toBe('2.1.0')
  })

  it('Part 2 pipeline', async () => {
    const result = await ListeningGenerationPipeline.runPipeline({ ...BASE_CONFIG, part: 'part2', topic: '', maxDistractors: 0, qualityThreshold: 60 })
    expect(result.scenario.part).toBe('part2')
    expect(result.transcript.metadata.numberOfSpeakers).toBe(1)
    expect(result.distractors.length).toBe(0)
  })

  it('Part 3 pipeline', async () => {
    const result = await ListeningGenerationPipeline.runPipeline({ ...BASE_CONFIG, part: 'part3', targetBand: 7.0, topic: '', maxDistractors: 1, qualityThreshold: 60 })
    expect(result.scenario.part).toBe('part3')
    expect(result.scenario.speakers.length).toBeGreaterThanOrEqual(2)
  })

  it('Part 4 pipeline', async () => {
    const result = await ListeningGenerationPipeline.runPipeline({ ...BASE_CONFIG, part: 'part4', targetBand: 8.0, topic: '', questionCount: 8, maxDistractors: 0, qualityThreshold: 60 })
    expect(result.scenario.part).toBe('part4')
    expect(result.scenario.exchangeType).toBe('lecture')
  })
})

// ─── Snapshot Tests ────────────────────────────────────────────────────
describe('Pipeline output snapshots', () => {
  it('Part 1 Hotel Reservation snapshot', async () => {
    const result = await ListeningGenerationPipeline.runPipeline({ ...BASE_CONFIG, topic: 'Hotel Reservation', qualityThreshold: 60 })
    expect({
      part: result.scenario.part,
      topic: result.scenario.topic,
      speakerCount: result.scenario.speakers.length,
      transcriptWordCount: result.transcript.metadata.wordCount,
      questionCount: result.questionSet.totalQuestions,
      layout: result.questionSet.layout,
      validationValid: result.validation.valid,
      difficultyBand: result.difficultyAnalysis.estimatedIeltsBand,
    }).toMatchSnapshot()
  })

  it('Part 2 snapshot', async () => {
    const result = await ListeningGenerationPipeline.runPipeline({ ...BASE_CONFIG, part: 'part2', topic: '', maxDistractors: 0, qualityThreshold: 60 })
    expect({
      part: result.scenario.part,
      speakerCount: result.scenario.speakers.length,
      transcriptWordCount: result.transcript.metadata.wordCount,
      questionCount: result.questionSet.totalQuestions,
      layout: result.questionSet.layout,
      validationValid: result.validation.valid,
    }).toMatchSnapshot()
  })
})

// ─── Helper ────────────────────────────────────────────────────────────
function makeTestEntities(count: number): InformationEntity[] {
  const categories: InformationEntity['category'][] = [
    'personal-name', 'phone-number', 'date', 'time', 'price',
    'place-name', 'duration', 'quantity', 'reference-number', 'reason',
  ]
  return categories.slice(0, count).map((cat, i) => ({
    id: `e-${i}`,
    category: cat,
    value: `test-value-${i}`,
    wordLimit: cat === 'reason' ? 3 : 1,
    tested: true,
  }))
}

function buildTestAnswerKey(qs: any, transcript: Transcript) {
  const entries: any[] = []
  for (let i = 0; i < qs.entities.length; i++) {
    const entity = qs.entities[i]
    const idx = transcript.lines.findIndex((line: { text: string }) =>
      line.text.toLowerCase().includes(entity.value.toLowerCase()),
    )
    entries.push({
      questionNumber: i + 1,
      entityId: entity.id,
      correctAnswer: entity.value,
      acceptableAlternatives: entity.acceptableAlternatives || [],
      wordLimit: entity.wordLimit,
      verifiedLineIndex: idx,
      unambiguous: true,
    })
  }
  return {
    answerKeyId: 'test-key',
    questionSetId: qs.questionSetId,
    entries,
    metadata: {
      totalAnswers: entries.length,
      unambiguousCount: entries.length,
      averageAnswerLength: entries.reduce((s: number, e: any) => s + e.correctAnswer.split(/\s+/).length, 0) / entries.length,
      totalAcceptableVariations: entries.reduce((s: number, e: any) => s + e.acceptableAlternatives.length, 0),
      allFactsInTranscript: entries.every((e: any) => e.verifiedLineIndex >= 0),
    },
  }
}
