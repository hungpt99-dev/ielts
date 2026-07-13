import { useEffect } from 'react'
import PageContainer from '../../../components/layout/PageContainer'
import TeacherPageHeader from '../components/TeacherPageHeader'
import TeacherIntroCard from '../components/TeacherIntroCard'
import TodayTutorSessionCard from '../components/TodayTutorSessionCard'
import TeacherProgressReviewCard from '../components/TeacherProgressReviewCard'
import TeacherLedPracticeSection from '../components/TeacherLedPracticeSection'
import TeachersAdviceSection from '../components/TeachersAdviceSection'
import AskTutorCompactCard from '../components/AskTutorCompactCard'
import LearningProfileCard from '../components/LearningProfileCard'
import TutorFeedbackSummaryCard from '../components/TutorFeedbackSummaryCard'
import RecentTeacherActivityCard from '../components/RecentTeacherActivityCard'
import { useAITutorEnginePage } from '../hooks/useAITutorEnginePage'

export default function AITutorPage() {
  const state = useAITutorEnginePage()

  if (state.loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0">
          <PageContainer width="wide" className="pt-3 sm:pt-4">
            <TeacherPageHeader />
          </PageContainer>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Preparing your tutor session...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <PageContainer width="wide" className="pt-3 sm:pt-4">
          <TeacherPageHeader
            streak={state.profile.studyStreak}
            bandInfo={state.profile.targetBand || undefined}
            examCountdown={state.profile.examCountdown}
          />
        </PageContainer>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <PageContainer width="wide" className="pb-8">
          <div className="mt-5 flex flex-col gap-6 lg:flex-row">
            {/* Left Main Column */}
            <div className="min-w-0 flex-1 space-y-6 lg:w-[68%]">
              <TeacherIntroCard
                streak={state.profile.studyStreak}
                isNewUser={state.profile.studyStreak === 0 && state.profile.savedWords === 0}
              />
              <TodayTutorSessionCard
                session={state.session}
                onStartSession={state.onStartSession}
                onViewDetails={state.onViewDetails}
                streak={state.profile.studyStreak}
                todayUnfinished={state.progressReview.todayUnfinished}
              />
              <TeacherProgressReviewCard
  review={state.progressReview}
  onRefresh={state.onRefresh}
  refreshing={state.refreshing}
/>
              <TeacherLedPracticeSection
                isAiConfigured={state.isAiConfigured}
                onStartLesson={state.onStartLesson}
                onReviewMistakes={state.onReviewMistakes}
                onPracticeVocabulary={state.onPracticeVocabulary}
                onUpdateStudyPlan={state.onUpdateStudyPlan}
              />
              <TeachersAdviceSection
                items={state.adviceItems}
                onAction={state.onAdviceAction}
              />
              <AskTutorCompactCard
                isAiConfigured={state.isAiConfigured}
                onSend={state.onAskTutor}
                onConfigure={state.onConfigureAi}
              />
            </div>

            {/* Right Support Column */}
            <div className="flex flex-col gap-6 lg:w-[32%]">
              <LearningProfileCard
                profile={state.profile}
                onSetTargetBand={state.onSetTargetBand}
                onSetExamDate={state.onSetExamDate}
              />
              <TutorFeedbackSummaryCard
                feedback={state.feedbackSummary}
                progressReview={state.progressReview}
                onAction={state.onStartLesson}
              />
              <RecentTeacherActivityCard
                activities={state.recentActivities}
                onStartLesson={state.onStartLesson}
              />
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  )
}
