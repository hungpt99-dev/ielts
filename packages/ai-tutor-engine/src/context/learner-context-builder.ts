import type {
  LearnerStateSnapshot,
  LearnerConstraint,
  ContextQuality,
  ExamContext,
  RoadmapContext,
  ProgressContext,
  MistakeSummary,
  VocabularySummary,
  ActivitySummary,
  TutorPreferences,
  SkillState,
} from '../domain/entities/learner-context'
import type { LearnerProfile } from '../domain/entities/learner-profile'
import type { IELTSSection } from '../domain/value-objects'
import type { ContextSourceRegistry } from './context-source-registry'
import { selectContextForScope } from './context-selector'
import type { TutorContextScope } from '../domain/entities/learner-context'

export interface LearnerContextDependencies {
  registry: ContextSourceRegistry
  getProfile(): Promise<Partial<LearnerProfile>>
  getExamContext(): Promise<Partial<ExamContext>>
  getRoadmapContext(): Promise<Partial<RoadmapContext> | null>
  getProgress(): Promise<Partial<ProgressContext>>
  getSkillStates(): Promise<Partial<Record<IELTSSection, Partial<SkillState>>>>
  getMistakes(): Promise<Partial<MistakeSummary>>
  getVocabulary(): Promise<Partial<VocabularySummary>>
  getActivity(): Promise<Partial<ActivitySummary>>
  getPreferences(): Promise<Partial<TutorPreferences>>
}

export class LearnerContextBuilder {
  private deps: LearnerContextDependencies

  constructor(deps: LearnerContextDependencies) {
    this.deps = deps
  }

  async build(scope: TutorContextScope): Promise<LearnerStateSnapshot> {
    const now = new Date().toISOString()

    const [profile, exam, roadmap, progress, skillStates, mistakes, vocabulary, activity, preferences] =
      await Promise.all([
        this.deps.getProfile(),
        this.deps.getExamContext(),
        this.deps.getRoadmapContext(),
        this.deps.getProgress(),
        this.deps.getSkillStates(),
        this.deps.getMistakes(),
        this.deps.getVocabulary(),
        this.deps.getActivity(),
        this.deps.getPreferences(),
      ])

    const fullProfile: LearnerProfile = {
      currentOverallBand: profile.currentOverallBand ?? null,
      targetOverallBand: profile.targetOverallBand ?? null,
      currentSkillBands: profile.currentSkillBands ?? null,
      targetSkillBands: profile.targetSkillBands ?? null,
      examType: profile.examType ?? null,
      examDate: profile.examDate ?? null,
      timezone: profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferredLanguage: profile.preferredLanguage ?? 'english',
      studyIntensity: profile.studyIntensity ?? 'moderate',
      weakSkills: profile.weakSkills ?? [],
      strongSkills: profile.strongSkills ?? [],
    }

    const fullExam: ExamContext = {
      examDate: exam.examDate ?? null,
      daysUntilExam: exam.daysUntilExam ?? null,
      isUrgent: exam.isUrgent ?? false,
      isFinalWeek: exam.isFinalWeek ?? false,
    }

    const fullProgress: ProgressContext = {
      overallCompletionPercent: progress.overallCompletionPercent ?? 0,
      skillProgress: progress.skillProgress ?? {},
      weeklyCompletionPercent: progress.weeklyCompletionPercent ?? 0,
      studyStreak: progress.studyStreak ?? 0,
      inactiveDays: progress.inactiveDays ?? 0,
      consistency: progress.consistency ?? 0,
    }

    const fullMistakes: MistakeSummary = {
      total: mistakes.total ?? 0,
      unreviewed: mistakes.unreviewed ?? 0,
      recentCount: mistakes.recentCount ?? 0,
      recurringPatterns: mistakes.recurringPatterns ?? [],
      bySkill: mistakes.bySkill ?? {},
    }

    const fullVocabulary: VocabularySummary = {
      totalSaved: vocabulary.totalSaved ?? 0,
      dueForReview: vocabulary.dueForReview ?? 0,
      mastered: vocabulary.mastered ?? 0,
      byTopic: vocabulary.byTopic ?? {},
    }

    const fullActivity: ActivitySummary = {
      lastActiveAt: activity.lastActiveAt ?? null,
      todayStudyMinutes: activity.todayStudyMinutes ?? 0,
      weeklyStudyMinutes: activity.weeklyStudyMinutes ?? 0,
      tasksCompletedToday: activity.tasksCompletedToday ?? 0,
    }

    const fullPreferences: TutorPreferences = {
      preferredMode: preferences.preferredMode ?? 'general-teacher',
      language: preferences.language ?? 'english',
      explanationLevel: preferences.explanationLevel ?? 'detailed',
      correctionStyle: preferences.correctionStyle ?? 'gentle',
      proactiveEnabled: preferences.proactiveEnabled ?? true,
      maxProactiveMessagesPerDay: preferences.maxProactiveMessagesPerDay ?? 5,
      quietHoursStart: preferences.quietHoursStart ?? '22:00',
      quietHoursEnd: preferences.quietHoursEnd ?? '08:00',
      allowedCategories: preferences.allowedCategories ?? [],
    }

    const fullSkillStates = {} as Record<IELTSSection, SkillState>
    const allSections: IELTSSection[] = ['listening', 'reading', 'writing', 'speaking']
    for (const section of allSections) {
      const s = skillStates[section]
      fullSkillStates[section] = {
        skill: section,
        currentBand: s?.currentBand,
        targetBand: s?.targetBand,
        gap: (s?.targetBand ?? 0) - (s?.currentBand ?? 0) || undefined,
        recentPerformance: s?.recentPerformance,
        trend: s?.trend ?? 'unknown',
        confidence: s?.confidence ?? 1,
        priorityScore: s?.priorityScore ?? 0,
        frequentWeaknesses: s?.frequentWeaknesses ?? [],
        recentStrengths: s?.recentStrengths ?? [],
        lastPracticedAt: s?.lastPracticedAt,
      }
    }

    const currentConstraints = this.determineConstraints(fullPreferences)

    const contextQuality = await this.evaluateContextQuality(scope)

    return {
      generatedAt: now,
      profile: fullProfile,
      exam: fullExam,
      roadmap: roadmap as RoadmapContext | undefined,
      progress: fullProgress,
      skillStates: fullSkillStates,
      mistakeSummary: fullMistakes,
      vocabularySummary: fullVocabulary,
      activitySummary: fullActivity,
      preferences: fullPreferences,
      currentConstraints,
      contextQuality,
    }
  }

  private determineConstraints(prefs: TutorPreferences): LearnerConstraint[] {
    const constraints: LearnerConstraint[] = []
    if (!prefs.proactiveEnabled) {
      constraints.push({ type: 'daily-limit-reached', details: 'Proactive tutor is disabled' })
    }
    return constraints
  }

  private async evaluateContextQuality(_scope: TutorContextScope): Promise<ContextQuality> {
    const items = await this.deps.registry.collectAll()
    const { missing } = selectContextForScope(items, _scope)

    const status: ContextQuality['status'] = missing.length === 0
      ? 'complete'
      : missing.length <= 2
        ? 'partial'
        : 'insufficient'

    return {
      status,
      missingSources: missing,
      staleSources: [],
      warnings: missing.map(s => `Source "${s}" is unavailable`),
    }
  }
}
