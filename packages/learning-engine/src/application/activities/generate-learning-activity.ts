import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../../domain/entities/learning-activity'
import type { Exercise, ExerciseSourceType, EvaluationPolicy } from '../../domain/entities/exercise'
import type { LearningSessionRepository, ExerciseRepository } from '../../ports/session-repository'
import type { TutorIntelligencePort } from '../../ports/tutor-intelligence-port'
import type { LearningEventPublisher } from '../../ports/learning-event-publisher'
import { determineDifficulty } from '../../domain/policies/difficulty-policy'
import { selectQuestionTypes, estimateQuestionCount } from '../../domain/policies/question-count-policy'
import type { LearnerContextPort } from '../../ports/learner-context-port'
import type { SkillRegistry } from '../../skills/skill-registry'
import { buildListeningPassagePrompt, buildPracticeQuestionsPrompt, buildPracticeQuestionsSystemPrompt } from './prompt-builders'
import { buildReadingPassagePrompt, buildFullPassageSimulationPrompt } from '../../exercise-engine/application/prompt-builders-ielts'
import { createDefaultExerciseRegistry } from '../../exercise-engine/domain/ielts/task-registry'
import { validateWordLimit } from '../../exercise-engine/domain/ielts/listening-validators'
import { checkSemanticConsistency } from './source-question-validator'
import { ABSOLUTE_WORDS } from '../../exercise-engine/domain/ielts/reading-schemas'
import { profileReadingPassage } from '../../exercise-engine/domain/ielts/passage-profiler'
import { createReadingQuestionPlan } from '../../exercise-engine/domain/ielts/question-planner'
import { assessReadingQualityExpanded } from '../../exercise-engine/domain/ielts/validators'
import { FULL_PASSAGE_SIMULATION } from '../../exercise-engine/domain/ielts/ielts-types'

export interface GenerateActivityDependencies {
  sessionRepository: LearningSessionRepository
  exerciseRepository: ExerciseRepository
  tutorPort: TutorIntelligencePort
  contextPort: LearnerContextPort
  eventPublisher?: LearningEventPublisher
  skillRegistry?: SkillRegistry
}

export async function generateLearningActivity(
  request: GenerateLearningActivityRequest,
  deps: GenerateActivityDependencies,
): Promise<GenerateLearningActivityResult> {
  const generationId = crypto.randomUUID?.() ?? `${Date.now()}-gen`
  const log = (msg: string, ...args: unknown[]) => console.log(`[GenerateActivity:${generationId}] ${msg}`, ...args)

  const session = await deps.sessionRepository.getById(request.sessionId)
  if (!session) {
    throw new Error(`Session ${request.sessionId} not found`)
  }

  const context = await deps.contextPort.buildLearningContext({
    scope: request.contextScope as any,
    skill: request.skill,
  })

  const difficultyDecision = determineDifficulty({
    currentBand: context.learner.currentOverallBand,
    targetBand: context.learner.targetOverallBand,
    recentAccuracy: context.progress.recentAccuracy[request.skill],
    consecutiveCorrect: 0,
    consecutiveMistakes: 0,
    totalAttempts: 0,
    timeSpentMs: 0,
    hintsUsed: 0,
  })

  const questionTypes = selectQuestionTypes(request.skill, request.activityType)
  const questionCount = Math.min(
    Math.max(
      estimateQuestionCount(request.availableMinutes, questionTypes, 2),
      FULL_PASSAGE_SIMULATION.questionCount.min,
    ),
    FULL_PASSAGE_SIMULATION.questionCount.max,
  )

  const exerciseId = crypto.randomUUID?.() ?? `${Date.now()}-ex`
  const sourceType: ExerciseSourceType = context.constraints.aiAvailable ? 'ai-generated' : 'built-in'
  const evaluationPolicy: EvaluationPolicy = 'deterministic'

  const exercise: Exercise = {
    id: exerciseId,
    sessionId: request.sessionId,
    skill: request.skill,
    exerciseType: request.activityType === 'guided-exercise' ? 'quiz' : 'comprehension',
    objectiveId: request.objectiveId,
    title: `${request.skill.charAt(0).toUpperCase() + request.skill.slice(1)} Practice`,
    instructions: `Complete the following ${questionCount} question${questionCount > 1 ? 's' : ''} at ${difficultyDecision.level} difficulty.`,
    content: request.sourceContent ? {
      passage: request.sourceContent.text,
      referenceUrl: request.sourceContent.sourceUrl,
    } : undefined,
    questions: [],
    difficulty: difficultyDecision.level,
    estimatedMinutes: request.availableMinutes,
    sourceType,
    sourceIds: request.sourceContent ? [request.sourceContent.id] : [],
    explanationPolicy: 'after-attempt',
    evaluationPolicy,
    metadata: {
      focusAreas: [],
      templateId: 'built-in',
      contextSnapshotHash: context.generatedAt,
      schemaVersion: '1.0',
    },
  }

  let aiFailedWithTopic = false
  const hasUserRequest = !!request.topic || !!request.sourceContent?.topic

  if (context.constraints.aiAvailable) {
    try {
      const requestedTopic = request.topic || request.sourceContent?.topic || ''
      log('Calling AI for skill:', request.skill, 'existing questions:', exercise.questions.length, 'requestedTopic:', requestedTopic)
      const topic = requestedTopic || undefined
      const hasSourceContent = !!request.sourceContent?.text
      const isReading = request.skill === 'reading'
      const isListening = request.skill === 'listening'
      let systemPrompt: string
      let userMessage: string

      // Use task-registry-driven prompt building
      if (isReading && !hasSourceContent) {
        const registry = createDefaultExerciseRegistry()
        const taskTypes = registry.getBySkill(request.skill).filter(t => t.capability.generation)
        const selectedTaskType = taskTypes[Math.floor(Math.random() * taskTypes.length)]

        if (selectedTaskType) {
          const readingPrompt = buildFullPassageSimulationPrompt(questionCount, topic, {
            targetBand: context.learner.targetOverallBand ?? context.learner.currentOverallBand ?? 5.5,
          })
          systemPrompt = readingPrompt.systemPrompt
          userMessage = readingPrompt.userMessage
        } else {
          systemPrompt = buildPracticeQuestionsSystemPrompt(request.skill, request.activityType, questionCount, difficultyDecision.level, hasSourceContent ? undefined : topic)
          userMessage = hasSourceContent
            ? `Based on the content below, generate ${questionCount} ${request.activityType} questions for ${request.skill} practice:\n\nContent: ${request.sourceContent!.text.slice(0, 1000)}`
            : `${buildPracticeQuestionsPrompt(request.skill, request.activityType, questionCount, difficultyDecision.level, topic)}`
        }
      } else {
        const listeningPrompt = isListening && !hasSourceContent && topic ? buildListeningPassagePrompt(difficultyDecision.level, questionCount, topic) : null
        systemPrompt = listeningPrompt?.systemPrompt ?? buildPracticeQuestionsSystemPrompt(request.skill, request.activityType, questionCount, difficultyDecision.level, hasSourceContent ? undefined : topic)
        userMessage = listeningPrompt?.userMessage ?? (
          hasSourceContent
            ? `Based on the content below, generate ${questionCount} ${request.activityType} questions for ${request.skill} practice:\n\nContent: ${request.sourceContent!.text.slice(0, 1000)}`
            : `${buildPracticeQuestionsPrompt(request.skill, request.activityType, questionCount, difficultyDecision.level, topic)}`
        )
      }
      log('systemPrompt (first 200):', systemPrompt.slice(0, 200))
      log('userMessage (first 200):', userMessage.slice(0, 200))
      const aiResult = await deps.tutorPort.generateEducationalContent<any>({
        systemPrompt,
        userMessage,
        schema: {},
        maxTokens: isReading ? Math.max(questionCount * 600, 8000) : isListening ? Math.max(questionCount * 500, 4000) : Math.min(questionCount * 300, 4000),
      })
      if (!aiResult.success) {
        log('AI call returned failure:', JSON.stringify(aiResult).slice(0, 300))
        aiFailedWithTopic = true
      }
      if (aiResult.success && aiResult.data) {
        const raw = aiResult.data
        const items = raw.taskGroups && Array.isArray(raw.taskGroups)
          ? raw.taskGroups.flatMap((group: any) => (group.questions || []).map((q: any) => ({ ...q, groupType: group.type })))
          : Array.isArray(raw) ? raw : (raw.questions ?? [raw])
        const aiQuestions: any[] = []
        for (const [idx, rawQ] of items.entries()) {
          const result = normalizeAiQuestion(rawQ, idx, exerciseId, generationId)
          if (result) aiQuestions.push(result)
        }

        if (aiQuestions.length > 0) {
          if (isReading && aiQuestions.length < FULL_PASSAGE_SIMULATION.questionCount.min) {
            log(`WARNING: AI returned only ${aiQuestions.length} questions, requested ${questionCount}. Model didn't follow the count instruction.`)
          }
          if (isReading && raw.passage) {
            exercise.content = { ...exercise.content, passage: raw.passage }
            exercise.title = raw.title ?? exercise.title
          }
          if (isListening) {
            const rawTranscript = raw.transcript || raw.segments
            if (rawTranscript) {
              const transcriptText = Array.isArray(rawTranscript)
                ? rawTranscript.map((s: any) => s.text ?? '').join(' ')
                : String(rawTranscript)
              exercise.content = { ...exercise.content, transcript: transcriptText }
              exercise.title = raw.title ?? exercise.title
            }
          }

          let generatedTopic: string = ''
          if (raw.topic && typeof raw.topic === 'string' && raw.topic.trim()) {
            generatedTopic = raw.topic.trim()
          } else if (raw.title && typeof raw.title === 'string') {
            const titleStr = raw.title as string
            const titleMatch = titleStr.match(/^(Reading|Listening):\s*(.+)/i)
            generatedTopic = titleMatch ? titleMatch[2].trim() : titleStr.trim()
          } else if (topic) {
            generatedTopic = topic
          }

          const generatedTitle = (raw.title as string)?.trim?.() || exercise.title

          if (requestedTopic || generatedTopic) {
            exercise.metadata = {
              ...exercise.metadata,
              ...({
                requestedTopic,
                generatedTopic,
                generatedTitle,
                source: 'ai-generated' as const,
              }) as Record<string, unknown>,
            } as typeof exercise.metadata
          }

          exercise.questions = aiQuestions
          exercise.sourceType = 'ai-generated'
        } else {
          log('AI returned no parseable questions')
          aiFailedWithTopic = true
        }

        if (isReading && aiQuestions.length > 0) {
          const passageText = exercise.content?.passage || ''
          if (passageText) {
            const result = assessSourceQuestionConsistency(passageText, aiQuestions)
            if (result.score < 0.3) {
              log(`REJECTED: source-question consistency score ${result.score.toFixed(2)} — ${result.failedCount}/${result.totalCount} questions failed`)
              aiFailedWithTopic = true
            } else if (result.score < 0.6) {
              log(`WARNING: low source-question consistency score ${result.score.toFixed(2)} — ${result.failedCount}/${result.totalCount} questions flagged`)
            }

            // Run passage profiling and expanded quality validation
            const passageParagraphs = (raw.paragraphs || []) as Array<{ id: string; content: string }>
            if (passageParagraphs.length > 0) {
              try {
                const passageProfile = profileReadingPassage(passageText, passageParagraphs)
                log(`Passage profiled: Band ~${passageProfile.estimatedBandRange.minimum.toFixed(1)}–${passageProfile.estimatedBandRange.maximum.toFixed(1)}, words: ${passageProfile.wordCount}, paragraphs: ${passageProfile.paragraphCount}`)

                const targetBand = context.learner.targetOverallBand ?? context.learner.currentOverallBand ?? 5.5
                const taskGroups = (raw.taskGroups || []).map((g: any) => ({
                  id: g.id,
                  type: g.type,
                  questions: g.questions || [],
                }))

                const qualityReport = assessReadingQualityExpanded({
                  passage: passageText,
                  paragraphs: passageParagraphs,
                  taskGroups,
                  bandMin: targetBand,
                  bandMax: targetBand + 1.0,
                })

                log(`Quality report: status=${qualityReport.status}, direct-retrieval=${Math.round(qualityReport.directRetrievalRatio * 100)}%, avg-question-band=${qualityReport.averageQuestionEstimatedBand.toFixed(1)}, passage-band=${qualityReport.passageEstimatedBand.toFixed(1)}`)

                if (qualityReport.status === 'reject') {
                  const criticalIssues = qualityReport.issues.filter(i => i.severity === 'critical')
                  log(`⚠ QUALITY WARNING: ${criticalIssues.length} critical quality issues: ${criticalIssues.map(i => i.description).join('; ')}`)
                  exercise.metadata = {
                    ...exercise.metadata,
                    qualityReport: {
                      status: qualityReport.status,
                      directRetrievalRatio: qualityReport.directRetrievalRatio,
                      skillVariety: qualityReport.skillVariety,
                      passageCoverage: qualityReport.passageCoverage,
                      issues: qualityReport.issues.map(i => ({ field: i.field, severity: i.severity, description: i.description })),
                    },
                  } as typeof exercise.metadata
                } else if (qualityReport.status === 'repair') {
                  const majorIssues = qualityReport.issues.filter(i => i.severity === 'major' || i.severity === 'critical')
                  log(`ℹ QUALITY NOTE: ${majorIssues.length} significant issues — ${majorIssues.map(i => i.description).join('; ')}`)
                }

                const bandGap = qualityReport.passageEstimatedBand - qualityReport.averageQuestionEstimatedBand
                if (bandGap > 1.0) {
                  log(`⚠ WARNING: Passage difficulty (Band ~${qualityReport.passageEstimatedBand.toFixed(1)}) exceeds question difficulty (Band ~${qualityReport.averageQuestionEstimatedBand.toFixed(1)}) by ${bandGap.toFixed(1)} bands`)
                }

                exercise.metadata = {
                  ...exercise.metadata,
                  qualityProfile: {
                    passageEstimatedBand: qualityReport.passageEstimatedBand,
                    averageQuestionEstimatedBand: qualityReport.averageQuestionEstimatedBand,
                    directRetrievalRatio: qualityReport.directRetrievalRatio,
                    paraphraseQuality: qualityReport.paraphraseQuality,
                    skillVariety: qualityReport.skillVariety,
                    ieltsAuthenticity: qualityReport.ieltsAuthenticity,
                    status: qualityReport.status,
                  },
                } as typeof exercise.metadata
              } catch (err) {
                log('Passage profiling or quality review failed (non-fatal):', err instanceof Error ? err.message : String(err))
              }
            }

            if (result.score >= 0.3 && result.score < 0.8 && exercise.sourceType === 'ai-generated') {
              try {
                const semanticResult = await checkSemanticConsistency(passageText, aiQuestions, deps.tutorPort)
                if (!semanticResult.consistent) {
                  log(`AI SEMANTIC CHECK FAILED: ${semanticResult.reason}. Problem questions: ${semanticResult.inconsistentQuestions.join(', ')}`)
                  aiFailedWithTopic = true
                } else {
                  log(`AI semantic check passed: ${semanticResult.reason}`)
                }
              } catch {
                log('AI semantic check skipped (error)')
              }
            }

          }
        }

        if (isListening && exercise.content?.transcript) {
          void (typeof exercise.content.transcript === 'string' 
            ? exercise.content.transcript 
            : Array.isArray(exercise.content.transcript) 
              ? (exercise.content.transcript as any[]).map(s => s.text).join(' ') 
              : '')
          
          for (const q of aiQuestions) {
            if (q.blanks && q.wordLimit) {
              for (const blank of q.blanks) {
                const result = validateWordLimit(blank, q.wordLimit, q.id)
                if (!result.valid) {
                  console.warn(`[GenerateActivity:${generationId}] Word limit violation: ${result.errors.join('; ')}`)
                }
              }
            }
          }
        }
      }
    } catch (error) {
      log('AI generation failed:', error instanceof Error ? error.message : error);
      console.error(`[GenerateActivity:${generationId}] Full error:`, error)
      aiFailedWithTopic = true
    }
  }

  if (aiFailedWithTopic && hasUserRequest) {
    throw new Error(
      `AI generation failed for topic "${request.topic || request.sourceContent?.topic || 'unknown'}". ` +
      `The AI model did not return valid ${request.skill} questions. ` +
      `Try rephrasing your topic or using a different subject.`
    )
  }

  if (exercise.questions.length === 0) {
    throw new Error(
      `No questions generated for ${request.skill} activity. ` +
      `The ${request.topic ? `topic "${request.topic}"` : 'request'} did not produce valid content.`
    )
  }

  log('Saving exercise:', exercise.id, 'title:', exercise.title, 'questions:', exercise.questions.length, 'sourceType:', exercise.sourceType)
  await deps.exerciseRepository.save(exercise)

  if (deps.eventPublisher) {
    deps.eventPublisher.publish({
      id: crypto.randomUUID?.() ?? `${Date.now()}-evt`,
      type: 'exercise_generated',
      occurredAt: new Date().toISOString(),
      source: 'learning-engine',
      sessionId: request.sessionId,
      exerciseId: exercise.id,
      skill: request.skill,
      sourceType,
      schemaVersion: '1.0',
    })
  }

  function extractTopicFromTitle(title: string, skill: string): string {
    const skillPrefix = new RegExp(`^${skill}:\\s*`, 'i')
    let topic = title.replace(skillPrefix, '').trim()
    const genericPrefix = /^(reading|listening|writing|speaking):\s*/i
    topic = topic.replace(genericPrefix, '').trim()
    return topic
  }

  const requestedTopic = request.topic || request.sourceContent?.topic || ''
  const exerciseTopicMetadata = (exercise.metadata as Record<string, unknown>)
  const rawGeneratedTopic = (exerciseTopicMetadata?.generatedTopic as string) || ''
  const generatedTopic = rawGeneratedTopic || extractTopicFromTitle(exercise.title, request.skill)
  const generatedTitle = (exerciseTopicMetadata?.generatedTitle as string) || exercise.title

  const activity = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-act`,
    sessionId: request.sessionId,
    type: request.activityType,
    skill: request.skill,
    title: exercise.title,
    instructions: exercise.instructions,
    estimatedMinutes: request.availableMinutes,
    order: 0,
    exercise,
    completed: false,
    topicMetadata: {
      requestedTopic,
      generatedTopic: generatedTopic || exercise.title,
      title: generatedTitle,
      source: exercise.sourceType === 'ai-generated' ? 'ai-generated' as const : 'curated' as const,
    },
    topicAlignment: determineTopicAlignment(requestedTopic, generatedTopic || exercise.title),
  }

  return {
    activity,
    aiUsed: exercise.sourceType === 'ai-generated',
    cacheHit: false,
  }
}

const VALID_QUESTION_TYPES = new Set([
  'multiple-choice-single', 'multiple-choice-multiple',
  'true-false-not-given', 'yes-no-not-given',
  'matching-headings', 'matching-information', 'matching-features', 'matching-sentence-endings',
  'matching',
  'sentence-completion', 'summary-completion', 'note-completion',
  'table-completion', 'flow-chart-completion', 'diagram-label-completion',
  'form-completion',
  'short-answer',
  'map-labelling', 'plan-labelling',
])

const COMPLETION_TYPES = new Set([
  'sentence-completion', 'summary-completion', 'note-completion',
  'table-completion', 'flow-chart-completion', 'diagram-label-completion',
  'form-completion',
  'map-labelling', 'plan-labelling',
])

const TFNG_TYPES = new Set(['true-false-not-given', 'yes-no-not-given'])

const PLACEHOLDER_PATTERNS = [
  /^Option\s*[A-Z]$/i, /^Answer\s*[A-Z]$/i, /^Choice\s*[A-Z]$/i,
  /^TBD$/i, /^N\/?A$/i, /^Placeholder$/i, /^Lorem/i,
]

function isPlaceholderValue(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some(p => p.test(value.trim()))
}

function removeGeneratedOptionPrefix(value: string): string {
  return value.replace(/^\s*[A-D][.)]\s+/i, '').trim()
}

function normalizeAiQuestion(
  q: Record<string, unknown>,
  idx: number,
  exerciseId: string,
  generationId: string,
): Record<string, unknown> | null {
  const rawType = ((q.type ?? q.Type ?? '') as string).toLowerCase().replace(/_/g, '-')
  const prefix = `[GenerateActivity:${generationId}]`

  if (!VALID_QUESTION_TYPES.has(rawType)) {
    console.warn(`${prefix} Rejected question ${idx}: unknown type "${rawType}"`)
    return null
  }

  const isTfng = TFNG_TYPES.has(rawType)
  const isCompletion = COMPLETION_TYPES.has(rawType)
  const isShortAnswer = rawType === 'short-answer'
  const isMc = rawType === 'multiple-choice-single' || rawType === 'multiple-choice-multiple'

  const questionText = (q.question ?? q.Question ?? q.statement ?? q.sentence ?? q.prompt ?? q.text ?? '') as string
  if (!questionText) {
    console.warn(`${prefix} Rejected question ${idx}: empty question text`)
    return null
  }

  const explanation = (q.explanation ?? q.Explanation ?? '') as string

  // Map new type to old kebab-case type for renderer compatibility
  const renderType = isTfng ? 'true-false-not-given'
    : isCompletion || isShortAnswer ? 'gap-fill'
    : isMc ? 'multiple-choice'
    : rawType === 'matching-headings' || rawType.startsWith('matching') ? 'matching-headings'
    : 'multiple-choice'

  const base = {
    id: `${exerciseId}-q${idx}`,
    type: renderType,
    question: questionText,
    explanation,
  }

  if (isTfng) {
    const rawAnswer = ((q.correctAnswer ?? q.CorrectAnswer ?? q.answer ?? '') as string).toLowerCase().replace(/[-\s]/g, '')
    if (!['true', 'false', 'notgiven', 'yes', 'no'].includes(rawAnswer)) {
      console.warn(`${prefix} Rejected question ${idx}: invalid TFNG answer "${rawAnswer}"`)
      return null
    }
    const normalizedAnswer = rawAnswer === 'notgiven' ? 'not-given' : rawAnswer as string

    // Detect absolute word traps in False answers
    if (normalizedAnswer === 'false') {
      const absoluteHits = ABSOLUTE_WORDS.filter(w => {
        const regex = new RegExp(`\\b${w}\\b`, 'i')
        return regex.test(questionText)
      })
      if (absoluteHits.length >= 2) {
        console.warn(`${prefix} Weak question ${idx}: False answer may rely on absolute words: "${absoluteHits.join('", "')}". Consider subtler contradictions.`)
      }
    }

    // Check for two independent claims in TFNG statements
    if ((normalizedAnswer === 'false' || normalizedAnswer === 'not-given') && questionText.toLowerCase().includes(' and ')) {
      const andParts = questionText.split(/\band\b/i).filter(p => p.trim().length > 15)
      if (andParts.length >= 2) {
        console.warn(`${prefix} Suspect question ${idx}: TFNG statement may contain two independent claims joined by "and"`)
      }
    }

    return {
      ...base,
      correctAnswer: normalizedAnswer,
      options: ['True', 'False', 'Not Given'],
      correctIndex: normalizedAnswer === 'true' || normalizedAnswer === 'yes' ? 0 : normalizedAnswer === 'false' || normalizedAnswer === 'no' ? 1 : 2,
    }
  }

  if (isCompletion || isShortAnswer) {
    const text = questionText.trim()

    // Detect misclassified short-answer questions that look like gap-fill
    if (isShortAnswer && (text.includes('___') || text.includes('_____'))) {
      console.warn(`${prefix} Rejected question ${idx}: short-answer formatted as gap-fill ("${text.slice(0, 50)}..."). Use a question ending with "?"`)
      return null
    }

    // Normalize gaps: handle object, array, or missing
    let rawGaps: Record<string, unknown>[] = []
    if (Array.isArray(q.gaps)) {
      rawGaps = q.gaps as Record<string, unknown>[]
    } else if (q.gaps && typeof q.gaps === 'object') {
      rawGaps = [q.gaps as Record<string, unknown>]
    } else if (Array.isArray(q.blanks)) {
      rawGaps = (q.blanks as unknown[]).map((b: unknown) => {
        if (typeof b === 'string') return { correctAnswer: b }
        if (typeof b === 'object' && b !== null) return b as Record<string, unknown>
        return { correctAnswer: String(b) }
      })
    } else if (q.blanks && typeof q.blanks === 'object') {
      rawGaps = [q.blanks as Record<string, unknown>]
    }

    // Fallback: extract blanks from gap markers in the text
    if (rawGaps.length === 0 && isCompletion) {
      const gapCount = (text.match(/_{2,}/g) || []).length
      if (gapCount > 0) {
        const fallbackAnswer = (q.correctAnswer as string)?.trim()
        if (fallbackAnswer) {
          rawGaps = Array.from({ length: gapCount }, (_, i) => ({
            id: `${exerciseId}-gap${i}`,
            correctAnswer: fallbackAnswer,
          }))
        }
      }
    }

    return {
      ...base,
      blanks: rawGaps.map((g: Record<string, unknown>) => (g.correctAnswer ?? g.answer ?? '') as string).filter(b => b.trim().length > 0),
      correctAnswer: rawGaps.map((g: Record<string, unknown>) => (g.correctAnswer ?? g.answer ?? '') as string).join(', '),
      acceptableAlternatives: rawGaps.flatMap((g: Record<string, unknown>) => (Array.isArray(g.acceptableAlternatives) ? g.acceptableAlternatives : []) as string[]),
    }
  }

  if (isMc) {
    const rawOptions = (Array.isArray(q.options) ? q.options : (Array.isArray(q.Options) ? q.Options : [])) as string[]
    const cleaned = rawOptions.map(removeGeneratedOptionPrefix).filter(o => o.length > 0)

    if (cleaned.some(o => isPlaceholderValue(o))) {
      console.warn(`${prefix} Rejected question ${idx}: placeholder options detected`)
      return null
    }

    if (cleaned.length !== 4) {
      console.warn(`${prefix} Rejected question ${idx}: expected 4 options, got ${cleaned.length}`)
      return null
    }

    if (new Set(cleaned).size !== cleaned.length) {
      console.warn(`${prefix} Rejected question ${idx}: duplicate options`)
      return null
    }

    let correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex
      : typeof q.answer === 'number' ? q.answer
      : -1

    // Handle correctAnswer as letter (A, B, C, D) or index string
    if (correctIdx < 0 && typeof q.correctAnswer === 'string') {
      const letter = q.correctAnswer.toUpperCase().trim()
      if (letter.length === 1 && letter >= 'A' && letter <= 'D') {
        correctIdx = letter.charCodeAt(0) - 65
      } else {
        const num = parseInt(letter, 10)
        if (!isNaN(num) && num >= 0 && num < cleaned.length) {
          correctIdx = num
        } else {
          // Try matching the correctAnswer text against options
          const idx = cleaned.findIndex(o => o.toLowerCase().trim() === q.correctAnswer.trim().toLowerCase())
          if (idx >= 0) correctIdx = idx
        }
      }
    }

    if (correctIdx < 0 || correctIdx >= cleaned.length) {
      console.warn(`${prefix} Rejected question ${idx}: invalid correctIndex ${correctIdx}`)
      return null
    }

    return {
      ...base,
      options: cleaned,
      correctIndex: correctIdx,
    }
  }

  if (rawType === 'matching-headings' || rawType.startsWith('matching')) {
    const headings = Array.isArray(q.headings) ? q.headings as string[] : []
    const paragraphIds = Array.isArray(q.paragraphIds) ? q.paragraphIds as string[] : []
    const correctMatches = (q.correctMatches ?? {}) as Record<string, number>
    return {
      ...base,
      headings,
      paragraphIds,
      correctMatches,
      correctAnswer: 0,
    }
  }

  console.warn(`${prefix} Rejected question ${idx}: type "${rawType}" has no defined normalization`)
  return null
}

interface ConsistencyResult {
  score: number
  totalCount: number
  failedCount: number
  details: Array<{ questionIndex: number; score: number; matched: string[]; missed: string[] }>
}

function assessSourceQuestionConsistency(
  passageText: string,
  questions: Array<{ question?: string; statement?: string; explanation?: string }>,
): ConsistencyResult {
  const passageLower = passageText.toLowerCase()
  const passageWordSet = tokenizeText(passageLower)

  const commonWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or', 'if', 'while',
    'about', 'up', 'out', 'also', 'been', 'its', 'this', 'that', 'these', 'those', 'which',
    'their', 'them', 'they', 'has', 'had', 'does', 'did', 'one', 'two'])

  const contentWords = [...passageWordSet].filter(w => !commonWords.has(w) && w.length > 3)
  const contentSet = new Set(contentWords)

  let totalQuestions = 0
  let failedQuestions = 0
  const details: ConsistencyResult['details'] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const qText = (
      (q.question || '') + ' ' +
      (q.statement || '') + ' ' +
      (q.explanation || '')
    ).toLowerCase()

    const qWords = tokenizeText(qText)
    if (qWords.size < 4) continue

    totalQuestions++

    const questionContentWords = [...qWords].filter(w => !commonWords.has(w) && w.length > 3)

    if (questionContentWords.length === 0) continue

    const matched = questionContentWords.filter(w => contentSet.has(w))
    const missed = questionContentWords.filter(w => !contentSet.has(w))

    const matchScore = matched.length / Math.max(1, questionContentWords.length)

    if (matchScore < 0.25 && matched.length < 2) {
      failedQuestions++
    }

    details.push({
      questionIndex: i,
      score: matchScore,
      matched: matched.slice(0, 3),
      missed: missed.slice(0, 5),
    })
  }

  const consistencyScore = totalQuestions > 0
    ? (totalQuestions - failedQuestions) / totalQuestions
    : 1.0

  return {
    score: consistencyScore,
    totalCount: totalQuestions,
    failedCount: failedQuestions,
    details,
  }
}

function tokenizeText(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[.,!?;:()"']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0)
  )
}

type TopicAlignmentStatus = 'matched' | 'related' | 'mismatched' | 'unknown'

const RELATED_TOPIC_MAP: Record<string, string[]> = {
  'climate change': ['climate', 'global warming', 'greenhouse', 'environment', 'renewable energy', 'sustainability', 'carbon', 'emissions', 'fossil fuels', 'weather', 'sea levels', 'paris accord', 'energy transition'],
  'environment': ['climate', 'pollution', 'conservation', 'ecosystem', 'sustainability', 'waste', 'recycling', 'biodiversity', 'habitat', 'nature'],
  'education': ['learning', 'school', 'teaching', 'training', 'classroom', 'curriculum', 'student', 'teacher', 'academic', 'study', 'knowledge'],
  'technology': ['digital', 'computer', 'internet', 'software', 'ai', 'artificial intelligence', 'innovation', 'device', 'screen', 'app', 'data', 'online'],
  'education technology': ['edtech', 'digital learning', 'online education', 'elearning', 'educational apps', 'classroom technology', 'smart learning'],
  'health': ['medical', 'healthcare', 'disease', 'wellness', 'nutrition', 'fitness', 'hospital', 'medicine', 'patient', 'treatment'],
  'science': ['research', 'experiment', 'scientific', 'laboratory', 'discovery', 'hypothesis', 'theory', 'biology', 'chemistry', 'physics'],
  'work': ['employment', 'job', 'career', 'profession', 'workplace', 'occupation', 'labour', 'business', 'industry'],
  'business': ['commerce', 'trade', 'marketing', 'management', 'entrepreneur', 'economy', 'finance', 'corporate', 'market'],
  'travel': ['tourism', 'transport', 'destination', 'journey', 'trip', 'holiday', 'tourist', 'exploration', 'culture'],
  'culture': ['art', 'tradition', 'heritage', 'customs', 'society', 'community', 'language', 'identity', 'diverse'],
  'society': ['social', 'community', 'population', 'urban', 'inequality', 'demographic', 'policy', 'public', 'citizen'],
  'globalization': ['global', 'international', 'trade', 'economy', 'cross-border', 'multinational', 'interconnected'],
  'art': ['painting', 'music', 'sculpture', 'creative', 'artist', 'gallery', 'museum', 'performance', 'visual'],
  'sports': ['athlete', 'competition', 'team', 'game', 'training', 'exercise', 'fitness', 'olympic', 'championship'],
  'government': ['policy', 'political', 'administration', 'regulation', 'legislation', 'public service', 'democracy'],
  'media': ['journalism', 'news', 'television', 'social media', 'broadcast', 'press', 'communication', 'advertising'],
  'crime': ['criminal', 'law', 'justice', 'offence', 'punishment', 'legal', 'enforcement', 'security'],
  'urban development': ['city', 'urban', 'infrastructure', 'housing', 'transportation', 'planning', 'smart city', 'development'],
}

function normalizeTopic(topic: string): string {
  return topic.toLowerCase().replace(/^(reading|listening|writing|speaking):\s*/i, '').trim()
}

function determineTopicAlignment(
  requestedTopic: string,
  generatedTopic: string,
): TopicAlignmentStatus {
  if (!requestedTopic || !generatedTopic) return 'unknown'

  const req = normalizeTopic(requestedTopic)
  const gen = normalizeTopic(generatedTopic)

  if (req === gen) return 'matched'

  if (req.includes(gen) || gen.includes(req)) return 'matched'

  const reqWords = new Set(req.split(/\s+/))
  const genWords = new Set(gen.split(/\s+/))
  const intersection = [...reqWords].filter(w => genWords.has(w))

  if (intersection.length > 0) return 'matched'

  const reqRelatedTerms = RELATED_TOPIC_MAP[req] || []
  if (reqRelatedTerms.some(term => gen.includes(term))) return 'related'

  const genNormalized = gen.toLowerCase()
  for (const [, terms] of Object.entries(RELATED_TOPIC_MAP)) {
    if (terms.some(t => genNormalized.includes(t))) {
      for (const reqTerm of reqWords) {
        const reqRelatedTermsForSub = RELATED_TOPIC_MAP[reqTerm] || []
        if (reqRelatedTermsForSub.some(t => genNormalized.includes(t))) {
          return 'related'
        }
      }
    }
  }

  return 'mismatched'
}


