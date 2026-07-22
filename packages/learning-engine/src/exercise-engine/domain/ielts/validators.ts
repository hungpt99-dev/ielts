import {
  READING_PASSAGE_SCHEMA,
  READING_QUESTIONS_SCHEMA,
  TRUE_FALSE_NOT_GIVEN_SCHEMA,
  YES_NO_NOT_GIVEN_SCHEMA,
  ABSOLUTE_WORDS,
  PASSAGE_WORD_LIMITS,
} from './reading-schemas'
import type {
  ReadingQualityReport,
  ReadingQualityIssue,
  ExerciseQualityReport,
  QualityIssue,
  PassageCoverage,
  ReadingExerciseQualityReport,
  QualityConfig,
} from './ielts-types'
import { DEFAULT_QUALITY_CONFIG } from './ielts-types'
import { estimateQuestionDifficulty } from './passage-profiler'

export interface ValidationResult<T = unknown> {
  valid: boolean
  data?: T
  errors: string[]
  quality?: ExerciseQualityReport
}

function extractId(raw: unknown): string {
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    return String((raw as Record<string, unknown>).id)
  }
  return 'unknown'
}

export function validateReadingPassage(content: unknown): ValidationResult {
  const result = READING_PASSAGE_SCHEMA.safeParse(content)
  if (!result.success) {
    return { valid: false, errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) }
  }
  return { valid: true, data: result.data, errors: [] }
}

export function validateReadingQuestion(question: unknown): ValidationResult {
  const result = READING_QUESTIONS_SCHEMA.safeParse(question)
  if (!result.success) {
    return { valid: false, errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) }
  }
  return { valid: true, data: result.data, errors: [] }
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[.,!?;:()"'\-]/g, ' ').split(/\s+/).filter(w => w.length > 0)
}

// ============================================================
// MODE-BASED PASSAGE LENGTH VALIDATION
// ============================================================

export function validatePassageLength(
  passageText: string,
): { valid: boolean; wordCount: number; error?: string } {
  const wc = wordCount(passageText)
  const { minWords, maxWords } = PASSAGE_WORD_LIMITS

  if (wc < minWords) {
    return { valid: false, wordCount: wc, error: `Passage has ${wc} words; minimum is ${minWords}` }
  }
  if (wc > maxWords * 1.3) {
    return { valid: false, wordCount: wc, error: `Passage has ${wc} words; maximum is ${maxWords}` }
  }
  return { valid: true, wordCount: wc }
}

// ============================================================
// PARAGRAPH FUNCTION VALIDATION
// ============================================================

const PARAGRAPH_FUNCTION_KEYWORDS: Record<string, string[]> = {
  background: ['introduce', 'background', 'historically', 'context', 'origin', 'emerged'],
  cause: ['cause', 'because', 'result', 'due to', 'leads to', 'leading', 'factor', 'contribut'],
  comparison: ['compared', 'whereas', 'while', 'in contrast', 'similarly', 'unlike', 'difference', 'both', 'on the one hand'],
  evidence: ['study', 'research', 'evidence', 'data', 'finding', 'experiment', 'survey', 'according to', 'reports', 'shows that', 'reveal'],
  example: ['example', 'instance', 'such as', 'illustrat', 'notably', 'case of'],
  limitation: ['however', 'limitation', 'nevertheless', 'despite', 'although', 'shortcoming', 'drawback', 'critic'],
  consequence: ['consequence', 'as a result', 'therefore', 'impact', 'effect', 'implication', 'hence'],
  alternative: ['alternative', 'others argue', 'another view', 'competing', 'differ', 'opposing', 'counterargument'],
  conclusion: ['conclusion', 'summary', 'ultimately', 'overall', 'in summary', 'to sum'],
  chronology: ['first', 'second', 'subsequently', 'then', 'later', 'after', 'following', 'initially', 'eventually'],
}

export function validateParagraphFunctions(
  paragraphs: Array<{ id: string; content: string }>,
): { valid: boolean; coverage: number; detected: string[]; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  const detected = new Set<string>()

  for (const p of paragraphs) {
    const lower = p.content.toLowerCase()
    for (const [func, keywords] of Object.entries(PARAGRAPH_FUNCTION_KEYWORDS)) {
      if (!detected.has(func) && keywords.some(kw => lower.includes(kw))) {
        detected.add(func)
      }
    }
  }

  const coverage = detected.size

  if (coverage < 2 && paragraphs.length >= 3) {
    issues.push({
      field: 'paragraphs',
      severity: 'major',
      description: `Only ${coverage} distinct paragraph functions detected across ${paragraphs.length} paragraphs. Passages should include varied functions such as cause, comparison, evidence, and consequence.`,
    })
  }

  if (coverage < 3 && paragraphs.length >= 4) {
    issues.push({
      field: 'paragraphs',
      severity: 'critical',
      description: 'Paragraphs lack sufficient variety of rhetorical functions. Expected at least 3 distinct functions for a passage of this length.',
    })
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    coverage,
    detected: [...detected],
    issues,
  }
}

// ============================================================
// TRUE / FALSE / NOT GIVEN VALIDATION
// ============================================================

export function validateTrueFalseNotGiven(
  questions: unknown[],
  passageText: string,
): ValidationResult & { distribution?: { true: number; false: number; notGiven: number } } {
  const issues: QualityIssue[] = []
  let trueCount = 0
  let falseCount = 0
  let notGivenCount = 0
  let valid = true

  if (!Array.isArray(questions)) {
    return { valid: false, errors: ['Expected an array of questions'] }
  }

  for (const q of questions) {
    const result = TRUE_FALSE_NOT_GIVEN_SCHEMA.safeParse(q)
    if (!result.success) {
      valid = false
      continue
    }
    const d = result.data

    if (d.correctAnswer === 'true') trueCount++
    else if (d.correctAnswer === 'false') falseCount++
    else notGivenCount++

    // Check for absolute-word traps in False statements
    if (d.correctAnswer === 'false') {
      const absoluteHits = ABSOLUTE_WORDS.filter(w => {
        const regex = new RegExp(`\\b${w}\\b`, 'i')
        return regex.test(d.statement)
      })
      if (absoluteHits.length >= 1) {
        issues.push({
          field: d.id,
          severity: absoluteHits.length >= 2 ? 'major' : 'minor',
          description: `False answer may rely on absolute word(s): "${absoluteHits.join('", "')}". The statement should be contradicted by passage content, not by obvious extreme words.`,
          suggestion: 'Rephrase the false statement to use a subtler contradiction based on paraphrased passage details.',
        })
      }

      if (!d.explanation.toLowerCase().includes('contradict')) {
        issues.push({
          field: d.id,
          severity: 'minor',
          description: 'False answer explanation should mention contradiction',
        })
      }
    }

    // Check for not-given matching passage too closely
    if (d.correctAnswer === 'not-given') {
      const statement = d.statement.toLowerCase()
      const passage = passageText.toLowerCase()
      const words = tokenize(statement).filter(w => w.length > 3)
      const matchCount = words.filter(w => passage.includes(w)).length
      if (matchCount === words.length && words.length > 3) {
        issues.push({
          field: d.id,
          severity: 'critical',
          description: 'Not-given statement matches passage too closely — may not actually be not-given',
        })
        valid = false
      }

      // Check for two independent claims in one statement
      const andParts = d.statement.split(/\band\b/i).filter(p => p.trim().length > 15)
      if (andParts.length >= 2) {
        issues.push({
          field: d.id,
          severity: 'major',
          description: 'Not-given statement contains two potentially independent claims separated by "and", making it ambiguous',
          suggestion: 'Split into separate statements or focus on a single claim.',
        })
        valid = false
      }
    }

    // Check for two independent claims in False statements too
    if (d.correctAnswer === 'false') {
      const andParts = d.statement.split(/\band\b/i).filter(p => p.trim().length > 15)
      if (andParts.length >= 2) {
        issues.push({
          field: d.id,
          severity: 'major',
          description: 'Statement contains two potentially independent claims separated by "and"',
          suggestion: 'Each TFNG statement must contain a single testable claim.',
        })
        valid = false
      }
    }
  }

  const total = questions.length

  // Distribution validation
  if (total >= 4) {
    const hasTrue = trueCount >= 1
    const hasFalse = falseCount >= 1
    const hasNG = notGivenCount >= 1

    if (!hasTrue || !hasFalse || !hasNG) {
      issues.push({
        field: 'distribution',
        severity: hasNG ? 'major' : 'critical',
        description: `TFNG distribution is incomplete (T:${trueCount}, F:${falseCount}, NG:${notGivenCount}). Groups of 4+ must include at least one of each answer type.`,
        suggestion: hasNG ? undefined : 'Add at least one genuine Not Given question.',
      })
      if (!hasNG) valid = false
    }
  }

  // Distribution for 5+
  if (total >= 5) {
    const expectedMin = Math.floor(total / 4)
    if (trueCount < expectedMin || falseCount < expectedMin || notGivenCount < expectedMin) {
      issues.push({
        field: 'distribution',
        severity: 'major',
        description: `Answer distribution too uneven (T:${trueCount}, F:${falseCount}, NG:${notGivenCount}). Each type should appear at least ${expectedMin} times.`,
      })
    }
  }

  return {
    valid,
    errors: valid ? [] : ['TFNG validation failed'],
    distribution: { true: trueCount, false: falseCount, notGiven: notGivenCount },
    quality: issues.length > 0
      ? {
          authenticity: valid ? 1 : 0.6,
          answerability: 1,
          difficultyAlignment: 1,
          distractorQuality: 1,
          instructionAccuracy: 1,
          sourceQuestionConsistency: 1,
          duplicationRisk: 1,
          ambiguityRisk: issues.some(i => i.severity === 'critical') ? 0.4 : 0.8,
          overallStatus: valid ? 'repair' : 'reject',
          issues,
        }
      : undefined,
  }
}

// ============================================================
// YES / NO / NOT GIVEN VALIDATION
// ============================================================

export function validateYesNoNotGiven(
  questions: unknown[],
): ValidationResult {
  const issues: QualityIssue[] = []
  let valid = true

  if (!Array.isArray(questions)) {
    return { valid: false, errors: ['Expected an array of questions'] }
  }

  for (const q of questions) {
    const result = YES_NO_NOT_GIVEN_SCHEMA.safeParse(q)
    if (!result.success) {
      valid = false
      issues.push({
        field: extractId(q),
        severity: 'critical',
        description: result.error.issues[0]?.message ?? 'Unknown schema error',
      })
      continue
    }
    const statement = result.data.statement.toLowerCase()
    if (
      statement.includes('according to the passage') ||
      statement.includes('the text states') ||
      statement.includes('it is mentioned')
    ) {
      issues.push({
        field: result.data.id,
        severity: 'critical',
        description: 'YNNG should test writer views/claims, not factual information',
      })
      valid = false
    }
  }

  return {
    valid,
    errors: valid ? [] : ['YNNG validation failed'],
    quality: issues.length > 0
      ? {
          authenticity: 1,
          answerability: 1,
          difficultyAlignment: 1,
          distractorQuality: 1,
          instructionAccuracy: 1,
          sourceQuestionConsistency: 1,
          duplicationRisk: 1,
          ambiguityRisk: 1,
          overallStatus: valid ? 'repair' : 'reject',
          issues,
        }
      : undefined,
  }
}

// ============================================================
// COMPLETION QUESTION VALIDATION
// ============================================================

export function validateCompletionAnswers(
  questions: Array<{
    id: string
    type: string
    gaps?: Array<{ id: string; correctAnswer: string }>
    correctAnswer?: string
    wordLimit?: { maxWords: number; maxNumbers: number; instruction: string }
  }>,
  passageText: string,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  const passageLower = passageText.toLowerCase()
  let valid = true

  for (const q of questions) {
    const answers: string[] = []

    if (q.gaps && Array.isArray(q.gaps)) {
      for (const gap of q.gaps) {
        answers.push(gap.correctAnswer)
      }
    } else if (q.correctAnswer) {
      answers.push(q.correctAnswer)
    }

    const wordLimit = q.wordLimit

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i]
      const answerLower = answer.toLowerCase()

      // Check answer appears in passage
      if (!passageLower.includes(answerLower)) {
        // Try without punctuation
        const cleanPassage = passageLower.replace(/[.,!?;:()"]/g, ' ')
        if (!cleanPassage.includes(answerLower)) {
          issues.push({
            field: q.id,
            severity: 'critical',
            description: `Answer "${answer}" does not appear in the passage. Completion answers must be taken directly from the passage.`,
            suggestion: 'Ensure the answer is a verbatim or closely matched phrase from the passage.',
          })
          valid = false
        }
      }

      // Check word limit
      if (wordLimit && answer) {
        const answerWords = answer.split(/\s+/).filter(w => w.length > 0)
        const hasNumbers = /\d/.test(answer)

        if (answerWords.length > wordLimit.maxWords) {
          issues.push({
            field: q.id,
            severity: 'critical',
            description: `Answer "${answer}" has ${answerWords.length} words; word limit is ${wordLimit.maxWords}`,
          })
          valid = false
        }

        if (hasNumbers && wordLimit.maxNumbers === 0) {
          issues.push({
            field: q.id,
            severity: 'major',
            description: `Answer "${answer}" contains a number but word limit excludes numbers`,
          })
        }
      }
    }
  }

  return { valid, issues }
}

export function validateCompletionGrammar(
  questions: Array<{
    id: string
    type: string
    sentence?: string
    gaps?: Array<{ id: string; correctAnswer: string }>
    correctAnswer?: string
  }>,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  let valid = true

  for (const q of questions) {
    if (q.type !== 'sentence-completion' || !q.sentence || !q.gaps) continue

    // Check the sentence can be completed grammatically
    const sentenceTemplate = q.sentence
    const hasGapMarker = sentenceTemplate.includes('______') || sentenceTemplate.includes('___') || sentenceTemplate.includes('_____')

    if (!hasGapMarker) {
      issues.push({
        field: q.id,
        severity: 'minor',
        description: `Sentence completion "${sentenceTemplate.slice(0, 50)}..." has no visible gap marker`,
        suggestion: 'Use "______" or "_____" to mark the gap.',
      })
    }
  }

  return { valid, issues }
}

// ============================================================
// MATCHING HEADINGS VALIDATION
// ============================================================

export function validateMatchingHeadingsStructure(
  questions: Array<{
    id: string
    type: string
    headings?: string[]
    paragraphIds?: string[]
    paragraphs?: Array<{ id: string }>
    correctMatches?: Record<string, string>
  }>,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []

  const mhQuestions = questions.filter(q => q.type === 'matching-headings')

  for (const q of mhQuestions) {
    const headings = q.headings || []
    const paragraphs = q.paragraphs || (q.paragraphIds ? q.paragraphIds.map(id => ({ id })) : [])
    const paraIds = paragraphs.map(p => p.id)

    // Must have at least 3 target paragraphs
    if (paraIds.length < 3) {
      issues.push({
        field: q.id,
        severity: 'critical',
        description: `Matching Headings has only ${paraIds.length} paragraph(s). A valid group requires at least 3 target paragraphs with a shared heading bank. A single isolated heading question is not a valid Matching Headings task.`,
        suggestion: 'Create a group with at least 3 paragraphs and more headings than paragraphs.',
      })
    }

    // Must have more headings than paragraphs
    if (headings.length <= paraIds.length && paraIds.length > 0) {
      issues.push({
        field: q.id,
        severity: 'critical',
        description: `Matching Headings has ${headings.length} headings for ${paraIds.length} paragraphs. Must have more headings than paragraphs (at least ${paraIds.length + 1}).`,
        suggestion: `Add at least ${paraIds.length + 1 - headings.length} more plausible but unused heading(s).`,
      })
    }

    // Check unique assignments
    const matches = q.correctMatches || {}
    const usedHeadings = new Set(Object.values(matches))
    if (usedHeadings.size !== Object.keys(matches).length) {
      issues.push({
        field: q.id,
        severity: 'major',
        description: 'Matching Headings has duplicate heading assignments. Each paragraph must get a unique heading.',
      })
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  }
}

// ============================================================
// QUESTION SKILL DISTRIBUTION
// ============================================================

export const READING_QUESTION_SKILLS = [
  'main-idea',
  'specific-detail',
  'paraphrase',
  'inference',
  'reference',
  'writer-purpose',
  'comparison',
  'cause-effect',
  'vocabulary-in-context',
  'cross-paragraph-synthesis',
] as const

export function validateQuestionSkillDistribution(
  questions: Array<{ id: string; skill?: string }>,
  targetBandMin: number = 5.5,
): { valid: boolean; issues: QualityIssue[]; skills: Record<string, number> } {
  const issues: QualityIssue[] = []
  const skills: Record<string, number> = {}
  const total = questions.length

  if (total === 0) return { valid: true, issues: [], skills: {} }

  for (const q of questions) {
    const skill = q.skill || 'specific-detail'
    skills[skill] = (skills[skill] || 0) + 1
  }

  const detailCount = skills['specific-detail'] || 0
  const detailRatio = detailCount / total

  // Check if too many questions test just direct detail
  if (detailRatio > 0.6 && total >= 5) {
    issues.push({
      field: 'question-skills',
      severity: 'major',
      description: `${detailCount}/${total} questions (${Math.round(detailRatio * 100)}%) test only direct detail retrieval. A balanced mix requires inference, paraphrase, main-idea, and other skill types.`,
      suggestion: 'Reduce direct-detail questions and add inference, paraphrase, cause-effect, comparison, or writer-purpose items.',
    })
  }

  if (detailRatio === 1 && total >= 4) {
    issues.push({
      field: 'question-skills',
      severity: 'major',
      description: `All ${total} questions test direct detail retrieval. This does not reflect IELTS Reading practice.`,
      suggestion: 'Include at least inference, paraphrase, and main-idea questions.',
    })
  }

  // Check for adequate variety at higher bands
  if (targetBandMin >= 6.5) {
    const distinctSkills = new Set(Object.keys(skills)).size
    if (distinctSkills < 4) {
      issues.push({
        field: 'question-skills',
        severity: 'major',
        description: `Only ${distinctSkills} distinct skill types for Band ${targetBandMin}+. Expected at least 4 different skills including inference, comparison, or cross-paragraph synthesis.`,
      })
    }

    if (!skills['inference']) {
      issues.push({
        field: 'question-skills',
        severity: 'major',
        description: 'No inference questions found. Band 6.5-7.5 activities should include inference-demanding items.',
        suggestion: 'Add at least one question requiring inference (reading between the lines).',
      })
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    skills,
  }
}

// ============================================================
// QUESTION TYPE CLASSIFICATION
// ============================================================

export function validateQuestionTypeClassification(
  questions: Array<{ id: string; type: string; question?: string; sentence?: string }>,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []

  for (const q of questions) {
    // Short answer should be a question with a question mark, not a fill-in-the-blank
    if (q.type === 'short-answer' || q.type === 'gap-fill') {
      const text = (q.question || q.sentence || '').trim()
      // If it looks like a gap-fill (contains "___" or ends with "_____"), it should be classified as completion
      if (text.includes('___') || text.includes('_____')) {
        if (q.type === 'short-answer') {
          issues.push({
            field: q.id,
            severity: 'critical',
            description: `Short-answer question is formatted as a fill-in-the-blank ("${text.slice(0, 60)}..."). Short-answer must be a question ending with "?". Gap-fill items must use a different renderer type.`,
            suggestion: 'Either rephrase as a question (for short-answer) or reclassify as sentence-completion.',
          })
        }
      }
      // If it ends with "?" it should NOT be gap-fill
      if (text.endsWith('?') && q.type === 'gap-fill') {
        issues.push({
          field: q.id,
          severity: 'major',
          description: `Gap-fill item "${text.slice(0, 50)}..." is actually a question ending with "?". Consider reclassifying as short-answer.`,
        })
      }
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  }
}

// ============================================================
// EVIDENCE VALIDATION
// ============================================================

export function validateEvidenceParagraph(
  questions: Array<{
    id: string
    type: string
    evidence?: { paragraphId?: string; supportingText?: string | null }
    correctAnswer?: string
  }>,
  paragraphIds: string[],
  passageText: string,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []

  for (const q of questions) {
    const ev = q.evidence
    if (!ev) {
      issues.push({
        field: q.id,
        severity: 'major',
        description: `Question ${q.id} is missing evidence (paragraphId and supportingText)`,
      })
      continue
    }

    const paraId = ev.paragraphId
    if (paraId && !paragraphIds.includes(paraId)) {
      issues.push({
        field: q.id,
        severity: 'critical',
        description: `Evidence paragraphId "${paraId}" does not exist in passage paragraphs: [${paragraphIds.join(', ')}]`,
      })
    }

    // For non-NG answers, supporting text should be present
    const isNotGiven = q.correctAnswer === 'not-given'
    if (!isNotGiven && (!ev.supportingText || ev.supportingText.trim() === '')) {
      issues.push({
        field: q.id,
        severity: 'major',
        description: `Question ${q.id} (answer: ${q.correctAnswer}) is missing supporting text evidence`,
        suggestion: 'Include the relevant passage text that supports this answer.',
      })
    }

    // Verify supporting text appears in passage
    if (ev.supportingText && ev.supportingText.trim()) {
      const supportLower = ev.supportingText.toLowerCase().trim()
      const passageLower = passageText.toLowerCase()
      if (!passageLower.includes(supportLower)) {
        issues.push({
          field: q.id,
          severity: 'critical',
          description: `Supporting text "${ev.supportingText.slice(0, 60)}..." does not appear in the passage`,
        })
      }
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  }
}

// ============================================================
// DUPLICATE QUESTION VALIDATION
// ============================================================

export function validateDuplicateQuestions(
  questions: Array<{ id: string; statement?: string; question?: string; sentence?: string }>,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  const seen = new Map<string, string>()

  for (const q of questions) {
    const text = (q.statement || q.question || q.sentence || '').toLowerCase().trim()
    if (text.length < 10) continue

    for (const [existingId, existingText] of seen) {
      const overlap = computeWordOverlap(text, existingText)
      if (overlap > 0.8) {
        issues.push({
          field: q.id,
          severity: 'critical',
          description: `Question "${q.id}" is a near-duplicate of question "${existingId}" (${Math.round(overlap * 100)}% word overlap)`,
          suggestion: 'Ensure each question tests a different detail or skill.',
        })
      }
    }

    seen.set(q.id, text)
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  }
}

function computeWordOverlap(a: string, b: string): number {
  const wordsA = new Set(tokenize(a))
  const wordsB = new Set(tokenize(b))
  if (wordsA.size === 0 && wordsB.size === 0) return 0
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length
  return intersection / Math.min(wordsA.size, wordsB.size)
}

// ============================================================
// COMPREHENSIVE READING QUALITY ASSESSMENT
// ============================================================

export interface ReadingQualityAssessmentInput {
  passage: string
  paragraphs: Array<{ id: string; content: string }>
  taskGroups: Array<{
    id: string
    type: string
    questions: any[]
  }>
  targetBandMin?: number
  targetBandMax?: number
}

export function assessReadingQuality(input: ReadingQualityAssessmentInput): ReadingQualityReport {
  const issues: ReadingQualityIssue[] = []
  const allQuestions = input.taskGroups.flatMap(g => g.questions)
  const passageLower = input.passage.toLowerCase()

  // 1. Passage coherence — check paragraph function variety
  const paraIssues = validateParagraphFunctions(input.paragraphs).issues
  issues.push(...paraIssues.map(i => ({
    field: i.field,
    severity: i.severity,
    description: i.description,
    suggestion: i.suggestion,
  })))

  // 2. Language naturalness — check for formulaic textbook patterns
  const genericClosings = [
    'this shows how important',
    'in conclusion this is why',
    'this demonstrates the significance',
    'clearly this is vital',
    'undoubtedly this matters',
    'as can be seen this is',
  ]
  for (const closing of genericClosings) {
    if (passageLower.includes(closing)) {
      issues.push({
        field: 'passage',
        severity: 'major',
        description: `Passage contains generic closing sentence: "${closing}...". Avoid formulaic textbook-style endings.`,
        suggestion: 'End with a substantive point, qualified claim, or implication rather than a generic summary.',
      })
      break
    }
  }

  // Check for excessive topic keyword repetition
  const title = input.passage.split('\n')[0] || ''
  const topicWords = tokenize(title).filter(w => w.length > 4)
  const passageWordCount = wordCount(input.passage)
  for (const tw of topicWords) {
    const regex = new RegExp(`\\b${tw}\\b`, 'gi')
    const matches = input.passage.match(regex)
    if (matches && matches.length > passageWordCount / 30) {
      issues.push({
        field: 'passage',
        severity: 'minor',
        description: `Topic keyword "${tw}" appears ${matches.length} times in a ${passageWordCount}-word passage. Consider using synonyms or pronouns.`,
      })
    }
  }

  // 3. Information density — word count vs paragraph count
  const wc = wordCount(input.passage)
  const density = wc / Math.max(1, input.paragraphs.length)
  if (density < 60 && input.paragraphs.length >= 3) {
    issues.push({
      field: 'passage',
      severity: 'minor',
      description: `Low information density: ~${Math.round(density)} words per paragraph. IELTS passages typically have denser content.`,
    })
  }

  // 4. Paraphrase quality — check if questions copy passage wording directly
  let questionCopiesDirectly = 0
  for (let i = 0; i < Math.min(allQuestions.length, 20); i++) {
    const q = allQuestions[i]
    const qText = (q.question || q.statement || q.sentence || '').toLowerCase()
    if (qText.length < 15) continue
    const qWords = tokenize(qText).filter(w => w.length > 3)
    if (qWords.length === 0) continue

    // Check how many consecutive words match the passage
    const qPhrases = extractPhrases(qText, 3)
    let maxConsecutiveMatch = 0
    for (const phrase of qPhrases) {
      if (passageLower.includes(phrase)) {
        const phraseWords = phrase.split(/\s+/).length
        if (phraseWords > maxConsecutiveMatch) maxConsecutiveMatch = phraseWords
      }
    }

    if (maxConsecutiveMatch >= 4) {
      questionCopiesDirectly++
    }
  }

  if (questionCopiesDirectly > 0 && allQuestions.length > 0) {
    const copyRatio = questionCopiesDirectly / Math.min(allQuestions.length, 20)
    if (copyRatio > 0.5) {
      issues.push({
        field: 'questions',
        severity: 'critical',
        description: `${questionCopiesDirectly}/${Math.min(allQuestions.length, 20)} questions contain 4+ consecutive words matching the passage directly. Strong paraphrasing is required for IELTS.`,
        suggestion: 'Rephrase question stems using synonyms and different grammatical structures.',
      })
    } else {
      issues.push({
        field: 'questions',
        severity: 'major',
        description: `${questionCopiesDirectly} question(s) copy passage wording too closely. Use stronger paraphrasing.`,
      })
    }
  }

  // 5. Difficulty alignment
  const bandMin = input.targetBandMin || 5.0
  const wcPerQuestion = allQuestions.length > 0 ? wc / allQuestions.length : 0
  if (bandMin >= 6.5 && wcPerQuestion < 80) {
    issues.push({
      field: 'difficulty',
      severity: 'major',
      description: `Information density too low for Band ${bandMin}+: ~${Math.round(wcPerQuestion)} words per question. Band 6.5+ passages need denser content.`,
    })
  }

  // 6. Check for all-questions-direct-retrieval
  const skillDist = validateQuestionSkillDistribution(
    allQuestions.map(q => ({ id: q.id || '', skill: q.skill })),
    bandMin,
  )
  issues.push(...skillDist.issues.map(i => ({
    field: i.field,
    severity: i.severity,
    description: i.description,
    suggestion: i.suggestion,
  })))

  // 7. Check TFNG groups specifically
  for (const group of input.taskGroups) {
    if (group.type === 'true-false-not-given' && group.questions.length >= 4) {
      const dist = validateTrueFalseNotGiven(group.questions, input.passage)
      if (!dist.distribution) continue
      const { notGiven: ng } = dist.distribution
      if (ng === 0) {
        issues.push({
          field: group.id,
          severity: 'critical',
          description: `TFNG group "${group.id}" has ${group.questions.length} questions but zero Not Given answers. Real IELTS always includes genuine Not Given items in groups of 4+.`,
          suggestion: 'Replace one or two items with genuine Not Given statements.',
        })
      }
    }

    // Check matching-headings structure
    if (group.type === 'matching-headings') {
      const mhValidation = validateMatchingHeadingsStructure(group.questions)
      issues.push(...mhValidation.issues.map(i => ({
        field: i.field,
        severity: i.severity,
        description: i.description,
        suggestion: i.suggestion,
      })))
    }
  }

  // 8. Check for formulaic "general → example → explanation" pattern in all paragraphs
  const formulaicCount = input.paragraphs.filter(p => {
    const lower = p.content.toLowerCase()
    const hasGeneral = lower.length > 30
    const hasForExample = lower.includes('for example') || lower.includes('such as') || lower.includes('for instance')
    const hasExplanation = lower.includes('this is because') || lower.includes('this means that') || lower.includes('the reason') || lower.includes('this shows') || lower.includes('this demonstrates')
    return hasGeneral && hasForExample && hasExplanation
  }).length

  if (formulaicCount >= input.paragraphs.length * 0.8 && input.paragraphs.length >= 3) {
    issues.push({
      field: 'paragraphs',
      severity: 'major',
      description: `${formulaicCount}/${input.paragraphs.length} paragraphs follow a formulaic "general statement → example → explanation" pattern. Vary paragraph structures.`,
      suggestion: 'Introduce paragraphs focused on cause-and-effect, comparison, chronology, or competing explanations.',
    })
  }

  // Compute scores
  const criticalIssues = issues.filter(i => i.severity === 'critical').length
  const majorIssues = issues.filter(i => i.severity === 'major').length
  const totalIssues = issues.length

  const hasCriticalTFNG = issues.some(i => i.field.includes('distribution') && i.severity === 'critical')
  const hasCriticalCopy = issues.some(i => i.field === 'questions' && i.severity === 'critical')

  const status: ReadingQualityReport['status'] =
    (hasCriticalTFNG || (criticalIssues >= 3))
      ? 'reject'
      : (majorIssues >= 3 || criticalIssues > 0)
        ? 'repair'
        : 'pass'

  return {
    passageCoherence: Math.max(0, 1 - (issues.filter(i => i.field === 'paragraphs').length * 0.3)),
    languageNaturalness: Math.max(0, 1 - (issues.filter(i => i.field === 'passage').length * 0.4)),
    informationDensity: density >= 80 ? 1 : density >= 60 ? 0.7 : density >= 40 ? 0.4 : 0.2,
    difficultyAlignment: bandMin >= 6.5 && wcPerQuestion < 80 ? 0.5 : 0.9,
    paraphraseQuality: questionCopiesDirectly === 0 ? 0.95 : questionCopiesDirectly <= 2 ? 0.6 : 0.3,
    distractorQuality: 0.85, // Requires AI assessment for accurate score
    questionVariety: Math.max(0, 1 - (totalIssues * 0.15)),
    answerability: 0.9,
    ambiguityRisk: (hasCriticalTFNG || hasCriticalCopy) ? 0.7 : 0.3,
    ieltsAuthenticity: formulaicCount > input.paragraphs.length * 0.5 ? 0.4 : 0.8,
    status,
    issues: issues.map(i => ({
      field: i.field,
      severity: i.severity,
      description: i.description,
      suggestion: i.suggestion,
    })),
  }
}

function extractPhrases(text: string, n: number): string[] {
  const words = tokenize(text)
  const phrases: string[] = []
  for (let i = 0; i <= words.length - n; i++) {
    phrases.push(words.slice(i, i + n).join(' '))
  }
  return phrases
}

// ============================================================
// PASSAGE COVERAGE VALIDATION
// ============================================================

export function validatePassageCoverage(
  questions: Array<{
    id: string
    evidence?: { paragraphId?: string; supportingText?: string | null }
    type: string
    skill?: string
  }>,
  paragraphs: Array<{ id: string; content: string }>,
): { valid: boolean; coverage: PassageCoverage; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  const paragraphIdsUsed = new Set<string>()
  const answerCountByParagraph: Record<string, number> = {}
  const evidenceLocations = new Map<string, string[]>()

  for (const q of questions) {
    if (q.evidence?.paragraphId) {
      const pid = q.evidence.paragraphId
      paragraphIdsUsed.add(pid)
      answerCountByParagraph[pid] = (answerCountByParagraph[pid] || 0) + 1

      const supportText = q.evidence.supportingText || ''
      if (supportText) {
        const existing = evidenceLocations.get(pid) || []
        existing.push(supportText)
        evidenceLocations.set(pid, existing)
      }
    }
  }

  const allParagraphIds = paragraphs.map(p => p.id)
  const uncoveredParagraphIds = allParagraphIds.filter(pid => !paragraphIdsUsed.has(pid))

  // Check coverage breadth
  if (paragraphs.length >= 4 && paragraphIdsUsed.size < 3) {
    issues.push({
      field: 'coverage',
      severity: 'major',
      description: `Questions cover only ${paragraphIdsUsed.size}/${paragraphs.length} paragraphs. Broader passage coverage is expected.`,
      suggestion: `Include questions targeting uncovered paragraphs: ${uncoveredParagraphIds.join(', ')}`,
    })
  }

  if (paragraphs.length >= 3 && questions.length >= 5 && paragraphIdsUsed.size < 2) {
    issues.push({
      field: 'coverage',
      severity: 'critical',
      description: `Questions cover only ${paragraphIdsUsed.size} paragraph(s) out of ${paragraphs.length}. This does not reflect IELTS practice.`,
    })
  }

  // Check for same-evidence duplication
  const duplicatedEvidenceLocations: string[] = []
  for (const [pid, texts] of evidenceLocations) {
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const overlap = computeWordOverlap(texts[i], texts[j])
        if (overlap > 0.7) {
          duplicatedEvidenceLocations.push(pid)
        }
      }
    }
  }

  if (duplicatedEvidenceLocations.length > 0) {
    issues.push({
      field: 'coverage',
      severity: 'major',
      description: `Duplicate evidence locations detected in paragraph(s): ${[...new Set(duplicatedEvidenceLocations)].join(', ')}. Different questions should target different parts of the passage.`,
    })
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    coverage: {
      paragraphIdsUsed: [...paragraphIdsUsed],
      answerCountByParagraph,
      uncoveredImportantParagraphIds: uncoveredParagraphIds,
      duplicatedEvidenceLocations: [...new Set(duplicatedEvidenceLocations)],
    },
    issues,
  }
}

// ============================================================
// QUESTION DIFFICULTY ALIGNMENT
// ============================================================

export function validateDifficultyAlignment(
  questions: Array<{
    id: string
    skill?: string
    statement?: string
    question?: string
    sentence?: string
  }>,
  passageProfile: { estimatedBandRange: { minimum: number; maximum: number } },
  passageText: string,
  config: QualityConfig = DEFAULT_QUALITY_CONFIG,
): { valid: boolean; averageBand: number; directRetrievalRatio: number; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  let totalBand = 0
  let directCount = 0

  for (const q of questions) {
    const difficulty = estimateQuestionDifficulty(q, passageText)
    totalBand += difficulty.estimatedBand
    if (difficulty.isDirectRetrieval) directCount++
  }

  const total = questions.length
  const averageBand = total > 0 ? totalBand / total : 0
  const directRatio = total > 0 ? directCount / total : 0
  const passageMin = passageProfile.estimatedBandRange.minimum

  if (averageBand < passageMin - config.difficultyAlignmentTolerance) {
    issues.push({
      field: 'difficulty-alignment',
      severity: 'critical',
      description: `Average question difficulty (~Band ${averageBand.toFixed(1)}) is below passage difficulty (~Band ${passageMin.toFixed(1)}) by more than ${config.difficultyAlignmentTolerance} bands. Questions are too easy for this passage.`,
      suggestion: 'Add inference, paragraph-purpose, reference-tracking, and cross-paragraph questions. Reduce direct-retrieval questions.',
    })
  } else if (averageBand < passageMin - 0.2) {
    issues.push({
      field: 'difficulty-alignment',
      severity: 'major',
      description: `Average question difficulty (~Band ${averageBand.toFixed(1)}) is slightly below passage difficulty (~Band ${passageMin.toFixed(1)}). Consider adding higher-order questions.`,
    })
  }

  if (directRatio > config.maximumDirectRetrievalRatio) {
    issues.push({
      field: 'skill-distribution',
      severity: 'critical',
      description: `Direct retrieval ratio is ${Math.round(directRatio * 100)}%, exceeding the ${Math.round(config.maximumDirectRetrievalRatio * 100)}% limit.`,
      suggestion: 'Replace direct-retrieval questions with inference, paraphrase, paragraph-purpose, or reference-tracking items.',
    })
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    averageBand,
    directRetrievalRatio: directRatio,
    issues,
  }
}

// ============================================================
// COMPLETION PARAPHRASING VALIDATION
// ============================================================

export function validateCompletionParaphrasing(
  questions: Array<{
    id: string
    type: string
    sentence?: string
    gaps?: Array<{ correctAnswer: string }>
    correctAnswer?: string
  }>,
  passageText: string,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []

  for (const q of questions) {
    if (q.type !== 'sentence-completion' || !q.sentence) continue
    if (!q.sentence.includes('______') && !q.sentence.includes('___')) continue

    const sentenceLower = q.sentence.toLowerCase()
    const passageLower = passageText.toLowerCase()

    // Check for direct copy of source
    const chunks = extractChunks(sentenceLower.replace(/_{2,}/g, ''), 4)
    let maxConsecutiveMatch = 0
    for (const chunk of chunks) {
      if (passageLower.includes(chunk)) {
        const words = chunk.split(/\s+/).length
        if (words > maxConsecutiveMatch) maxConsecutiveMatch = words
      }
    }

    if (maxConsecutiveMatch >= 4) {
      issues.push({
        field: q.id,
        severity: 'major',
        description: `Completion prompt "${q.sentence.slice(0, 60)}..." closely copies the passage (${maxConsecutiveMatch} consecutive matching words). Use stronger paraphrasing.`,
        suggestion: 'Rephrase the sentence using synonyms and different grammatical structures.',
      })
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  }
}

function extractChunks(text: string, n: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const chunks: string[] = []
  for (let i = 0; i <= words.length - n; i++) {
    chunks.push(words.slice(i, i + n).join(' '))
  }
  return chunks
}

// ============================================================
// DISTRACTOR QUALITY VALIDATION
// ============================================================

export function validateDistractorQuality(
  questions: Array<{
    id: string
    type: string
    options?: string[]
    question?: string
    correctIndex?: number
  }>,
  passageText: string,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  const passageLower = passageText.toLowerCase()

  for (const q of questions) {
    if (!Array.isArray(q.options) || q.options.length !== 4) continue
    const correctIdx = q.correctIndex ?? 0
    const distractors = q.options.filter((_, i) => i !== correctIdx)

    // Check for absurdly short/long distractors
    const correctLength = q.options[correctIdx]?.length || 0
    for (let i = 0; i < distractors.length; i++) {
      const d = distractors[i]
      if (d.length < 10) {
        issues.push({
          field: q.id,
          severity: 'major',
          description: `Distractor "${d}" is too short (${d.length} chars). Distractors should be of similar length to the correct answer.`,
        })
      }
      if (correctLength > 0 && (d.length < correctLength * 0.4 || d.length > correctLength * 2.5)) {
        issues.push({
          field: q.id,
          severity: 'minor',
          description: `Distractor "${d}" has very different length compared to the correct answer, potentially revealing the answer.`,
        })
      }
    }

    // Check if distractors relate to the passage
    let unrelatedCount = 0
    for (const d of distractors) {
      const dWords = d.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      if (dWords.length === 0) { unrelatedCount++; continue }
      const matched = dWords.filter(w => passageLower.includes(w))
      if (matched.length === 0) unrelatedCount++
    }

    if (unrelatedCount >= 2) {
      issues.push({
        field: q.id,
        severity: 'major',
        description: `${unrelatedCount}/${distractors.length} distractors appear unrelated to the passage. All distractors should originate from passage content.`,
      })
    }

    // Check uniqueness
    const uniqueOptions = new Set(q.options.map(o => o.toLowerCase().trim()))
    if (uniqueOptions.size !== q.options.length) {
      issues.push({
        field: q.id,
        severity: 'critical',
        description: 'Duplicate options detected in multiple-choice question.',
      })
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  }
}

// ============================================================
// INFERENCE QUALITY VALIDATION
// ============================================================

export function validateInferenceQuality(
  questions: Array<{
    id: string
    skill?: string
    explanation?: string
    statement?: string
    question?: string
  }>,
  passageText: string,
): { valid: boolean; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  const inferenceQuestions = questions.filter(q => q.skill === 'inference')

  for (const q of inferenceQuestions) {
    const expl = (q.explanation || '').toLowerCase()

    if (!expl.includes('infers') && !expl.includes('implied') && !expl.includes('suggest') && !expl.includes('indicate') && !expl.includes('can be understood')) {
      issues.push({
        field: q.id,
        severity: 'minor',
        description: 'Inference question explanation does not reference inferential reasoning. Ensure the learner needs to read between the lines.',
      })
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  }
}

// ============================================================
// SKILL VARIETY VALIDATION
// ============================================================

export function validateSkillVariety(
  questions: Array<{ id: string; skill?: string }>,
  targetBandMin?: number,
): { valid: boolean; skillCount: number; distinctSkills: string[]; issues: QualityIssue[] } {
  const issues: QualityIssue[] = []
  const skills = new Set<string>()

  for (const q of questions) {
    const skill = q.skill || 'specific-detail'
    skills.add(skill)
  }

  const distinctSkills = [...skills]
  const band = targetBandMin || 5.0

  if (band >= 6.5 && distinctSkills.length < 4) {
    issues.push({
      field: 'skill-variety',
      severity: 'major',
      description: `Only ${distinctSkills.length} distinct skill types for Band ${band}+. Expected at least 4 (e.g., inference, paraphrase, paragraph-purpose, reference-tracking).`,
    })
  }

  if (distinctSkills.length === 1 && questions.length >= 4) {
    issues.push({
      field: 'skill-variety',
      severity: 'critical',
      description: 'All questions test the same skill. An IELTS-style exercise should assess varied reading skills.',
      suggestion: 'Include inference, paraphrase, main-idea, and paragraph-purpose questions.',
    })
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    skillCount: distinctSkills.length,
    distinctSkills,
    issues,
  }
}

// ============================================================
// EXPANDED COMPREHENSIVE READING QUALITY ASSESSMENT
// ============================================================

export interface ExpandedReadingQualityInput extends ReadingQualityAssessmentInput {
  bandMin?: number
  bandMax?: number
}

export function assessReadingQualityExpanded(
  input: ExpandedReadingQualityInput,
): ReadingExerciseQualityReport {
  const allQuestions = input.taskGroups.flatMap(g => g.questions)
  const paragraphIds = input.paragraphs.map(p => p.id)
  const passageText = input.passage

  // Run base quality assessment
  const baseReport = assessReadingQuality({
    passage: input.passage,
    paragraphs: input.paragraphs,
    taskGroups: input.taskGroups,
    targetBandMin: input.bandMin || input.targetBandMin,
    targetBandMax: input.bandMax || input.targetBandMax,
  })

  // Passage coverage
  const coverageResult = validatePassageCoverage(allQuestions, input.paragraphs)

  // Question difficulty
  const difficultyResult = validateDifficultyAlignment(
    allQuestions,
    { estimatedBandRange: { minimum: input.bandMin || 5.0, maximum: input.bandMax || 7.0 } },
    passageText,
  )

  // Skill variety
  const skillResult = validateSkillVariety(allQuestions, input.bandMin || input.targetBandMin)

  // Completion paraphrasing
  const compParaphraseResult = validateCompletionParaphrasing(allQuestions, passageText)

  // Distractor quality
  const distractorResult = validateDistractorQuality(allQuestions, passageText)

  // Inference quality
  const inferenceResult = validateInferenceQuality(allQuestions, passageText)

  // TFNG quality
  let tfngQuality = 1.0
  for (const group of input.taskGroups) {
    if (group.type === 'true-false-not-given') {
      const tfngResult = validateTrueFalseNotGiven(group.questions, passageText)
      if (tfngResult.distribution) {
        const dist = tfngResult.distribution
        const hasAll = dist.true > 0 && dist.false > 0 && dist.notGiven > 0
        if (!hasAll && group.questions.length >= 4) {
          tfngQuality = Math.min(tfngQuality, 0.3)
        }
      }
    }
  }

  // Collect all issues
  const allIssues: ReadingQualityIssue[] = [
    ...baseReport.issues,
    ...coverageResult.issues.map(i => ({
      field: i.field,
      severity: i.severity,
      description: i.description,
      suggestion: i.suggestion,
    })),
    ...difficultyResult.issues.map(i => ({
      field: i.field,
      severity: i.severity,
      description: i.description,
      suggestion: i.suggestion,
    })),
    ...skillResult.issues.map(i => ({
      field: i.field,
      severity: i.severity,
      description: i.description,
      suggestion: i.suggestion,
    })),
    ...compParaphraseResult.issues.map(i => ({
      field: i.field,
      severity: i.severity,
      description: i.description,
      suggestion: i.suggestion,
    })),
    ...distractorResult.issues.map(i => ({
      field: i.field,
      severity: i.severity,
      description: i.description,
      suggestion: i.suggestion,
    })),
    ...inferenceResult.issues.map(i => ({
      field: i.field,
      severity: i.severity,
      description: i.description,
      suggestion: i.suggestion,
    })),
  ]

  const criticalCount = allIssues.filter(i => i.severity === 'critical').length
  const majorCount = allIssues.filter(i => i.severity === 'major').length

  const status: ReadingExerciseQualityReport['status'] =
    criticalCount >= 2 ? 'reject'
      : criticalCount >= 1 ? 'repair'
        : majorCount >= 3 ? 'repair'
          : 'pass'

  const passageCov = input.paragraphs.length > 0
    ? coverageResult.coverage.paragraphIdsUsed.length / input.paragraphs.length
    : 0

  return {
    passageEstimatedBand: input.bandMin || baseReport.difficultyAlignment >= 0.7 ? 5.5 : 5.0,
    averageQuestionEstimatedBand: difficultyResult.averageBand,
    passageQuestionDifficultyAlignment: criticalCount === 0 && majorCount === 0 ? 1.0 : majorCount <= 2 ? 0.7 : 0.4,
    paraphraseQuality: baseReport.paraphraseQuality,
    directRetrievalRatio: difficultyResult.directRetrievalRatio,
    skillVariety: Math.min(1, skillResult.skillCount / 6),
    distractorQuality: majorCount <= 1 ? 0.85 : majorCount <= 3 ? 0.6 : 0.3,
    tfngQuality,
    completionQuality: compParaphraseResult.valid ? 0.9 : 0.5,
    inferenceQuality: inferenceResult.valid ? 0.9 : 0.5,
    passageCoverage: passageCov,
    duplicationRisk: coverageResult.coverage.duplicatedEvidenceLocations.length > 0 ? 0.7 : 0.2,
    ambiguityRisk: baseReport.ambiguityRisk,
    ieltsAuthenticity: status === 'pass' ? 0.9 : status === 'repair' ? 0.6 : 0.3,
    status,
    issues: allIssues,
  }
}

// ============================================================
// VALIDATE BUILT-IN / IMPORTED CONTENT
// ============================================================

export function validateBuiltInReadingActivity(
  passageText: string,
  paragraphs: Array<{ id: string; content: string }>,
  taskGroups: Array<{ id: string; type: string; questions: any[] }>,
  options?: {
    targetBandMin?: number
    targetBandMax?: number
  },
): ReadingExerciseQualityReport {
  const allQuestions = taskGroups.flatMap(g => g.questions)
  const passageProfile = {
    estimatedBandRange: {
      minimum: options?.targetBandMin || 5.0,
      maximum: options?.targetBandMax || 7.0,
    },
    wordCount: passageText.split(/\s+/).filter(w => w.length > 0).length,
    paragraphCount: paragraphs.length,
  }

  return assessReadingQualityExpanded({
    passage: passageText,
    paragraphs,
    taskGroups,
    bandMin: options?.targetBandMin,
    bandMax: options?.targetBandMax,
  })
}

export function repairReadingContent(
  content: unknown,
  maxAttempts: number = 3,
): { repaired: unknown; attemptCount: number; success: boolean } {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = validateReadingPassage(content)
    if (result.valid) {
      const data = result.data as any
      const qualityResult = assessReadingQuality({
        passage: data.passage || '',
        paragraphs: data.paragraphs || [],
        taskGroups: data.taskGroups || [],
        targetBandMin: 5.5,
      })
      if (qualityResult.status === 'pass') {
        return { repaired: content, attemptCount: attempt + 1, success: true }
      }
    }
  }
  return { repaired: null, attemptCount: maxAttempts, success: false }
}

// ============================================================
// EXPORT AGGREGATE VALIDATOR CONVENIENCE
// ============================================================

export interface AggregateReadingValidationResult {
  validForPersistence: boolean
  qualityReport: ReadingQualityReport
  allIssues: ReadingQualityIssue[]
}

export function validateReadingActivity(
  passage: string,
  paragraphs: Array<{ id: string; content: string }>,
  taskGroups: Array<{ id: string; type: string; questions: any[] }>,
  options?: {
    targetBandMin?: number
    targetBandMax?: number
  },
): AggregateReadingValidationResult {
  const allIssues: ReadingQualityIssue[] = []
  const allQuestions = taskGroups.flatMap(g => g.questions)

  // Passage length
  const lengthCheck = validatePassageLength(passage)
  if (!lengthCheck.valid && lengthCheck.error) {
    allIssues.push({
      field: 'passage',
      severity: lengthCheck.wordCount < 100 ? 'critical' : 'major',
      description: lengthCheck.error,
    })
  }

  // Duplicate questions
  const dupCheck = validateDuplicateQuestions(allQuestions)
  allIssues.push(...dupCheck.issues.map(i => ({
    field: i.field,
    severity: i.severity,
    description: i.description,
    suggestion: i.suggestion,
  })))

  // Evidence
  const paragraphIds = paragraphs.map(p => p.id)
  const evCheck = validateEvidenceParagraph(allQuestions, paragraphIds, passage)
  allIssues.push(...evCheck.issues.map(i => ({
    field: i.field,
    severity: i.severity,
    description: i.description,
    suggestion: i.suggestion,
  })))

  // Full quality report
  const qualityReport = assessReadingQuality({
    passage,
    paragraphs,
    taskGroups,
    targetBandMin: options?.targetBandMin,
    targetBandMax: options?.targetBandMax,
  })
  allIssues.push(...qualityReport.issues)

  const hasCritical = allIssues.some(i => i.severity === 'critical')

  return {
    validForPersistence: !hasCritical,
    qualityReport: {
      ...qualityReport,
      status: hasCritical ? 'reject' : qualityReport.status,
      issues: allIssues,
    },
    allIssues,
  }
}
