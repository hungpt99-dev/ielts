import { useState, useEffect, type ReactNode } from 'react'
import { NavLink, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Headbar from './layout/Headbar'
import Dashboard from '../features/dashboard/Dashboard'
import OnboardingForm from '../features/onboarding/OnboardingForm'
import { isOnboardingComplete } from '../features/onboarding/onboardingService'
import StudyPlan from '../features/study-plan/StudyPlan'
import NotebookPage from '../pages/vocabulary/NotebookPage'
import VocabularyReview from '../pages/VocabularyReview'
import ReviewCenter from '../pages/ReviewCenter'
import ReadingPracticePage from '../pages/practice/ReadingPracticePage'
import ListeningPracticePage from '../pages/practice/ListeningPracticePage'
import WritingPracticePage from '../pages/practice/WritingPracticePage'
import SpeakingPracticePage from '../pages/practice/SpeakingPracticePage'
import GrammarExercisePage from '../pages/practice/GrammarExercisePage'
import MistakeNotebook from '../features/mistakes/MistakeNotebook'
import MockTests from '../pages/MockTests'
import Progress from '../pages/Progress'
import Settings from '../pages/Settings'
import DataManagement from '../pages/Settings/DataManagement'
import AIProviderSettingsPage from '../pages/Settings/AIProviderSettingsPage'
import ExtensionConnectionPage from '../pages/Settings/ExtensionConnectionPage'
import SearchPage from '../pages/Search'
import ImportExport from '../pages/ImportExport'
import TopicsProgress from '../pages/TopicsProgress'
import PublicApiImportPage from '../pages/PublicApiImportPage'
import PublicTabPage from '../components/PublicTabPage'
import FullStudyRoadmapPage from '../pages/roadmap/FullStudyRoadmapPage'
import ArtifactsPage from '../features/artifacts/ArtifactsPage'
import ChatIcon from './aiTutor/ChatIcon'
import { MobileBottomNavigation } from '@ielts/ui'
import type { MobileNavItem } from '@ielts/ui'
import TodayPlanPage from '../pages/TodayPlanPage'
import AITutorPage from '../pages/AITutorChat'
import { IconHome, IconTodayPlan, IconStudyPlan, IconAITutor, IconVocabulary, IconReading, IconListening, IconWriting, IconSpeaking, IconGrammar, IconMistakes, IconProgress, IconBack, IconMinimize, IconClose, IconSettings, IconChevronDown, IconFlame, IconSaved, IconInfo } from '@ielts/ui'
import PageContainer from './layout/PageContainer'

function RedirectWithHash({ to, hash }: { to: string; hash: string }) {
  return <Navigate to={`${to}#${hash}`} replace />
}



interface NavItemDefinition {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const mainNavItems: NavItemDefinition[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconHome size={20} />, end: true },
  { to: '/today-plan', label: "Today's Plan", icon: <IconTodayPlan size={20} />, end: false },
  { to: '/roadmap', label: 'Study Roadmap', icon: <IconStudyPlan size={20} />, end: false },
]

const tutorNavItem: NavItemDefinition = {
  to: '/tutor',
  label: 'AI Tutor',
  icon: <IconAITutor size={20} />,
  end: false,
}

const learningParentItems: NavItemDefinition[] = [
  { to: '/vocabulary', label: 'Vocabulary', icon: <IconVocabulary size={20} />, end: false },
  { to: '/artifacts', label: 'Saved Content', icon: <IconSaved size={20} />, end: false },
]

const practiceSubItems: NavItemDefinition[] = [
  { to: '/reading', label: 'Reading', icon: <IconReading size={20} /> },
  { to: '/listening', label: 'Listening', icon: <IconListening size={20} /> },
  { to: '/writing', label: 'Writing', icon: <IconWriting size={20} /> },
  { to: '/speaking', label: 'Speaking', icon: <IconSpeaking size={20} /> },
  { to: '/grammar', label: 'Grammar', icon: <IconGrammar size={20} /> },
  { to: '/mistakes', label: 'Mistakes', icon: <IconMistakes size={20} /> },
]

const progressSubItems: NavItemDefinition[] = [
  { to: '/progress', label: 'Progress', icon: <IconProgress size={20} /> },
  { to: '/mock-tests', label: 'Mock Tests', icon: <IconProgress size={20} /> },
  { to: '/topics', label: 'Topics', icon: <IconStudyPlan size={20} /> },
]

function NavLinkItem({
  to,
  label,
  icon,
  end,
  onClick,
}: {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 min-h-[44px] text-sm font-medium transition-colors ${
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
        }`
      }
      style={({ isActive }) =>
        ({
          backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
          borderRadius: 'var(--radius-lg)',
          transition: 'background-color var(--transition-fast), color var(--transition-fast)',
          fontFamily: 'var(--font-sans)',
          textDecoration: 'none',
        }) as React.CSSProperties
      }
    >
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      {label}
    </NavLink>
  )
}

function AccordionGroup({
  label,
  icon,
  expanded,
  onToggle,
  children,
}: {
  label: string
  icon: ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        style={{
          color: 'var(--color-text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
        }}
        aria-expanded={expanded}
      >
        <span className="shrink-0" aria-hidden="true">{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        <IconChevronDown
          size={16}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div style={{ paddingLeft: 'var(--spacing-lg)', marginTop: 'var(--spacing-3xs)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [practiceExpanded, setPracticeExpanded] = useState(false)
  const [progressExpanded, setProgressExpanded] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const practicePaths = ['/reading', '/listening', '/writing', '/speaking', '/grammar', '/mistakes']
    const progressPaths = ['/progress', '/mock-tests', '/topics']
    if (practicePaths.some((p) => location.pathname.startsWith(p))) {
      setPracticeExpanded(true)
    }
    if (progressPaths.some((p) => location.pathname.startsWith(p))) {
      setProgressExpanded(true)
    }
  }, [location.pathname])

  const mobileNavItems: MobileNavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <IconHome size={22} />,
      active: location.pathname === '/dashboard',
      onClick: () => { window.location.href = '/dashboard' },
    },
    {
      id: 'plan',
      label: 'Plan',
      icon: <IconTodayPlan size={22} />,
      active: location.pathname.startsWith('/today-plan') || location.pathname.startsWith('/plan') || location.pathname.startsWith('/roadmap'),
      onClick: () => { window.location.href = '/today-plan' },
    },
    {
      id: 'tutor',
      label: 'AI',
      icon: <IconAITutor size={22} />,
      active: location.pathname.startsWith('/tutor'),
      onClick: () => { window.location.href = '/tutor' },
    },
    {
      id: 'vocab',
      label: 'Vocab',
      icon: <IconVocabulary size={22} />,
      active: location.pathname.startsWith('/vocabulary') || location.pathname.startsWith('/review'),
      onClick: () => { window.location.href = '/vocabulary' },
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: <IconProgress size={22} />,
      active: location.pathname.startsWith('/progress') || location.pathname.startsWith('/mock-tests') || location.pathname.startsWith('/topics'),
      onClick: () => { window.location.href = '/progress' },
    },
  ]

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div
      className="flex h-[100dvh] overflow-hidden"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'var(--color-overlay)' }}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-[var(--color-surface)] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          borderColor: 'var(--color-border)',
        }}
        aria-label="Main navigation"
      >
        <div
          className="flex h-16 shrink-0 items-center justify-between border-b px-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1.125rem', fontFamily: 'var(--font-sans)' }}>
            IELTS Journey
          </span>
          <button
              onClick={closeSidebar}
              className="rounded-lg p-2 lg:hidden"
              style={{ color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
              aria-label="Close sidebar"
          >
            <IconClose size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: 'var(--spacing-xs) var(--spacing-sm)', fontFamily: 'var(--font-sans)' }}>
              Main
            </p>
            {mainNavItems.map((item) => (
              <NavLinkItem key={item.to} to={item.to} label={item.label} icon={item.icon} end={item.end} onClick={closeSidebar} />
            ))}
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: 'var(--spacing-xs) var(--spacing-sm)', marginBottom: 'var(--spacing-2xs)', fontFamily: 'var(--font-sans)' }}>
              AI Tutor
            </p>
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-3xs)',
                background: 'var(--color-tutor-accent-light)',
                margin: '0 calc(-1 * var(--spacing-3xs))',
              }}
            >
              <NavLink
                to={tutorNavItem.to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 min-h-[44px] text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[var(--color-tutor-accent)]'
                      : 'text-[var(--color-tutor-text)] hover:opacity-80'
                  }`
                }
                style={({ isActive }) =>
                  ({
                    backgroundColor: isActive ? 'var(--color-tutor-background)' : 'transparent',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                    fontFamily: 'var(--font-sans)',
                    textDecoration: 'none',
                  }) as React.CSSProperties
                }
              >
                <span className="shrink-0" aria-hidden="true">{tutorNavItem.icon}</span>
                {tutorNavItem.label}
              </NavLink>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: 'var(--spacing-xs) var(--spacing-sm)', marginBottom: 'var(--spacing-2xs)', fontFamily: 'var(--font-sans)' }}>
              Learning
            </p>
            {learningParentItems.map((item) => (
              <NavLinkItem key={item.to} to={item.to} label={item.label} icon={item.icon} end={item.end} onClick={closeSidebar} />
            ))}

            <AccordionGroup
              label="Practice"
              icon={<IconFlame size={20} />}
              expanded={practiceExpanded}
              onToggle={() => {
                setPracticeExpanded(!practiceExpanded)
                if (progressExpanded) setProgressExpanded(false)
              }}
            >
              {practiceSubItems.map((item) => (
                <NavLinkItem key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={closeSidebar} />
              ))}
            </AccordionGroup>

            <AccordionGroup
              label="Progress"
              icon={<IconProgress size={20} />}
              expanded={progressExpanded}
              onToggle={() => {
                setProgressExpanded(!progressExpanded)
                if (practiceExpanded) setPracticeExpanded(false)
              }}
            >
              {progressSubItems.map((item) => (
                <NavLinkItem key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={closeSidebar} />
              ))}
            </AccordionGroup>
          </div>
        </nav>

        <div
          className="shrink-0 border-t px-3 py-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <NavLink
            to="/info"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 min-h-[44px] text-sm font-medium transition-colors ${
                isActive
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
              }`
            }
            style={({ isActive }) =>
              ({
                backgroundColor: isActive ? 'var(--color-surface-alt)' : 'transparent',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'var(--font-sans)',
                textDecoration: 'none',
                marginBottom: '2px',
              }) as React.CSSProperties
            }
          >
            <IconInfo size={20} />
            About
          </NavLink>
          <NavLink
            to="/settings"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 min-h-[44px] text-sm font-medium transition-colors ${
                isActive
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
              }`
            }
            style={({ isActive }) =>
              ({
                backgroundColor: isActive ? 'var(--color-surface-alt)' : 'transparent',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'var(--font-sans)',
                textDecoration: 'none',
              }) as React.CSSProperties
            }
          >
            <IconSettings size={20} />
            Settings
          </NavLink>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Headbar onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Routes>
            <Route path="/tutor" element={<AITutorPage />} />
            <Route path="*" element={
              <PageContainer width="wide">
                <Routes>
                  <Route path="/onboarding" element={<OnboardingForm />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/plan" element={<StudyPlan />} />
                  <Route path="/today-plan" element={<TodayPlanPage />} />
                  <Route path="/roadmap" element={<FullStudyRoadmapPage />} />
                  <Route path="/vocabulary" element={<NotebookPage />} />
                  <Route path="/review" element={<VocabularyReview />} />
                  <Route path="/review-center" element={<ReviewCenter />} />
                  <Route path="/reading" element={<ReadingPracticePage />} />
                  <Route path="/listening" element={<ListeningPracticePage />} />
                  <Route path="/writing" element={<WritingPracticePage />} />
                  <Route path="/speaking" element={<SpeakingPracticePage />} />
                  <Route path="/grammar" element={<GrammarExercisePage />} />
                  <Route path="/mistakes" element={<MistakeNotebook />} />
                  <Route path="/mock-tests" element={<MockTests />} />
                  <Route path="/topics" element={<TopicsProgress />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/progress-review" element={<Navigate to="/progress" replace />} />
                  <Route path="/artifacts" element={<ArtifactsPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/public-api" element={<PublicApiImportPage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/ai" element={<AIProviderSettingsPage />} />
                  <Route path="/settings/data" element={<DataManagement />} />
                  <Route path="/settings/extension" element={<ExtensionConnectionPage />} />
                  <Route path="/import-export" element={<ImportExport />} />
                  <Route path="/info" element={<PublicTabPage />} />
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
              </PageContainer>
            } />
          </Routes>
          {location.pathname !== '/tutor' && (
            <ChatIcon />
          )}
        </main>

        <div className="lg:hidden">
          <MobileBottomNavigation items={mobileNavItems} />
        </div>
      </div>
    </div>
  )
}
