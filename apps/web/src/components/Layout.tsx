import { useState } from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import Headbar from './layout/Headbar'
import Dashboard from '../features/dashboard/Dashboard'
import OnboardingForm from '../features/onboarding/OnboardingForm'
import { isOnboardingComplete } from '../features/onboarding/onboardingService'
import StudyPlan from '../features/study-plan/StudyPlan'
import Vocabulary from '../pages/Vocabulary'
import VocabularyReview from '../pages/VocabularyReview'
import ReviewCenter from '../pages/ReviewCenter'
import ReadingPractice from '../features/reading/ReadingPractice'
import ListeningPractice from '../features/listening/ListeningPractice'
import WritingPractice from '../features/writing/WritingPractice'
import SpeakingPractice from '../features/speaking/SpeakingPractice'
import GrammarNotes from '../pages/GrammarNotes'
import MistakeNotebook from '../features/mistakes/MistakeNotebook'
import MockTests from '../pages/MockTests'
import Progress from '../pages/Progress'
import Settings from '../pages/Settings'
import DataManagement from '../pages/Settings/DataManagement'
import SearchPage from '../pages/Search'
import ImportExport from '../pages/ImportExport'
import TopicsProgress from '../pages/TopicsProgress'
import PublicApiImportPage from '../pages/PublicApiImportPage'
import PublicTabPage from '../components/PublicTabPage'
import RoadmapPage from '../features/roadmap/RoadmapPage'
import StudyContentPage from '../features/content/StudyContentPage'
import ArtifactsPage from '../features/artifacts/ArtifactsPage'
import FloatingTutorButton from './aiTutor/FloatingTutorButton'
import ChatIcon from './aiTutor/ChatIcon'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/plan', label: 'Study Plan', icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z' },
  { to: '/vocabulary', label: 'Vocabulary', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { to: '/review', label: 'Review', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { to: '/reading', label: 'Reading', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { to: '/listening', label: 'Listening', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
  { to: '/writing', label: 'Writing', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { to: '/speaking', label: 'Speaking', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { to: '/grammar', label: 'Grammar', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { to: '/mistakes', label: 'Mistakes', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { to: '/mock-tests', label: 'Mock Tests', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/topics', label: 'Topics', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/progress', label: 'Progress', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/artifacts', label: 'Artifacts', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/search', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { to: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { to: '/import-export', label: 'Backup', icon: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' },
  { to: '/public-api', label: 'Public API', icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M10 12h4M12 8v8' },
  { to: '/info', label: 'Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

function RedirectWithHash({ to, hash }: { to: string; hash: string }) {
  return <Navigate to={`${to}#${hash}`} replace />
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div
      className="flex min-h-[100dvh] overflow-hidden"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="flex h-16 items-center justify-between border-b px-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1.125rem' }}>
            IELTS Journey
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 lg:hidden"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
              }) as React.CSSProperties}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Headbar onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/onboarding" element={<OnboardingForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plan" element={<StudyPlan />} />
            <Route path="/roadmap" element={<Navigate to="/plan" replace />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
            <Route path="/review" element={<VocabularyReview />} />
            <Route path="/review-center" element={<ReviewCenter />} />
            <Route path="/reading" element={<ReadingPractice />} />
            <Route path="/listening" element={<ListeningPractice />} />
            <Route path="/writing" element={<WritingPractice />} />
            <Route path="/speaking" element={<SpeakingPractice />} />
            <Route path="/grammar" element={<GrammarNotes />} />
            <Route path="/mistakes" element={<MistakeNotebook />} />
            <Route path="/mock-tests" element={<MockTests />} />
            <Route path="/topics" element={<TopicsProgress />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/artifacts" element={<ArtifactsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/public-api" element={<PublicApiImportPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/data" element={<DataManagement />} />
            <Route path="/import-export" element={<ImportExport />} />
            <Route path="/info" element={<PublicTabPage />} />
            <Route path="/study/:taskId" element={<StudyContentPage />} />
            <Route path="/website-info" element={<RedirectWithHash to="/info" hash="about-website" />} />
            <Route path="/about-me" element={<RedirectWithHash to="/info" hash="about-me" />} />
            <Route path="/recruit" element={<RedirectWithHash to="/info" hash="recruit" />} />
            <Route path="/donate" element={<RedirectWithHash to="/info" hash="donate" />} />
            <Route path="/feedback" element={<RedirectWithHash to="/info" hash="feedback" />} />
            <Route path="*" element={
              isOnboardingComplete()
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/onboarding" replace />
            } />
          </Routes>
            <FloatingTutorButton />
            <ChatIcon />
        </main>

        <nav
          className="flex shrink-0 items-center justify-around border-t px-2 py-2 lg:hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
          aria-label="Mobile navigation"
        >
          {[
            { to: '/dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { to: '/plan', label: 'Plan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { to: '/vocabulary', label: 'Vocab', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { to: '/review', label: 'Review', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
            { to: '/progress', label: 'Progress', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)]'
                }`
              }
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
