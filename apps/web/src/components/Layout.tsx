import { useState, useEffect, type ReactNode, lazy, Suspense } from 'react'
import { Link, NavLink, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Headbar from './layout/Headbar'
import { isOnboardingComplete } from '../features/onboarding/onboardingService'
import ChatIcon from './aiTutor/ChatIcon'
import { MobileBottomNavigation } from '@ielts/ui'
import type { MobileNavItem } from '@ielts/ui'
import PageContainer from './layout/PageContainer'
import SafeAreaContainer from './layout/SafeAreaContainer'
import LoadingSpinner from './ui/LoadingSpinner'
import NotFoundPage from '../pages/NotFoundPage'
import PrivacyPage from '../pages/PrivacyPage'
import { openAITutorChat } from '../features/ai-tutor/utils/openChat'

const Dashboard = lazy(() => import('../features/dashboard/Dashboard'))
const StudyPlan = lazy(() => import('../features/study-plan/StudyPlan'))
const NotebookPage = lazy(() => import('../pages/vocabulary/NotebookPage'))
const VocabularyReview = lazy(() => import('../pages/VocabularyReview'))
const ReviewCenter = lazy(() => import('../pages/ReviewCenter'))
const ReadingPracticePage = lazy(() => import('../pages/practice/ReadingPracticePage'))
const ListeningPracticePage = lazy(() => import('../pages/practice/ListeningPracticePage'))
const WritingPracticePage = lazy(() => import('../pages/practice/WritingPracticePage'))
const SpeakingPracticePage = lazy(() => import('../pages/practice/SpeakingPracticePage'))
const GrammarExercisePage = lazy(() => import('../pages/practice/GrammarExercisePage'))
const MistakeNotebook = lazy(() => import('../features/mistakes/MistakeNotebook'))
const MockTests = lazy(() => import('../pages/MockTests'))
const Progress = lazy(() => import('../pages/Progress'))
const Settings = lazy(() => import('../pages/Settings'))
const DataManagement = lazy(() => import('../pages/Settings/DataManagement'))
const AIProviderSettingsPage = lazy(() => import('../pages/Settings/AIProviderSettingsPage'))
const ExtensionConnectionPage = lazy(() => import('../pages/Settings/ExtensionConnectionPage'))
const SearchPage = lazy(() => import('../pages/Search'))
const ImportExport = lazy(() => import('../pages/ImportExport'))
const TopicsProgress = lazy(() => import('../pages/TopicsProgress'))
const PublicApiImportPage = lazy(() => import('../pages/PublicApiImportPage'))
const FullStudyRoadmapPage = lazy(() => import('../pages/roadmap/FullStudyRoadmapPage'))
const ArtifactsPage = lazy(() => import('../features/artifacts/ArtifactsPage'))
const PublicTabPage = lazy(() => import('../components/PublicTabPage'))
const TodayPlanPage = lazy(() => import('../pages/TodayPlanPage'))
const AITutorPage = lazy(() => import('../features/ai-tutor/pages/AITutorPage'))
const BooksPage = lazy(() => import('../pages/BooksPage'))
import { IconHome, IconTodayPlan, IconStudyPlan, IconAITutor, IconVocabulary, IconReading, IconListening, IconWriting, IconSpeaking, IconGrammar, IconMistakes, IconProgress, IconBack, IconMinimize, IconClose, IconSettings, IconChevronDown, IconFlame, IconSaved, IconInfo, IconBookText } from '@ielts/ui'

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
  { to: '/books', label: 'Books', icon: <IconBookText size={20} />, end: false },
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
  const navigate = useNavigate()

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
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'plan',
      label: 'Plan',
      icon: <IconTodayPlan size={22} />,
      active: location.pathname.startsWith('/today-plan') || location.pathname.startsWith('/plan') || location.pathname.startsWith('/roadmap'),
      onClick: () => navigate('/today-plan'),
    },
    {
      id: 'tutor',
      label: 'AI',
      icon: <IconAITutor size={22} />,
      active: location.pathname.startsWith('/tutor'),
      onClick: () => navigate('/tutor'),
    },
    {
      id: 'vocab',
      label: 'Vocab',
      icon: <IconVocabulary size={22} />,
      active: location.pathname.startsWith('/vocabulary') || location.pathname.startsWith('/review'),
      onClick: () => navigate('/vocabulary'),
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: <IconProgress size={22} />,
      active: location.pathname.startsWith('/progress') || location.pathname.startsWith('/mock-tests') || location.pathname.startsWith('/topics'),
      onClick: () => navigate('/progress'),
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
          <Link to="/landing" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <img src="/icon.png" alt="" className="h-7 w-7 rounded-lg" loading="lazy" decoding="async" />
            <span style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1.125rem', fontFamily: 'var(--font-sans)' }}>
              IELTS Journey
            </span>
          </Link>
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

      <div className="flex min-w-0 flex-1 flex-col">
        <Headbar onMenuToggle={() => setSidebarOpen(true)} />

        <SafeAreaContainer left right className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <main className="flex-1 min-w-0 w-full overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Routes>
              <Route path="/tutor" element={
                <Suspense fallback={<LoadingSpinner fullPage message="Loading AI Tutor..." />}>
                  <AITutorPage />
                </Suspense>
              } />
              <Route path="*" element={
                <PageContainer width="wide">
                  <Suspense fallback={<LoadingSpinner fullPage />}>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/plan" element={<StudyPlan />} />
                      <Route path="/today-plan" element={<TodayPlanPage />} />
                      <Route path="/roadmap" element={<FullStudyRoadmapPage />} />
                      <Route path="/vocabulary" element={<NotebookPage />} />
                      <Route path="/review" element={<VocabularyReview />} />
                      <Route path="/review/Notebook" element={<Navigate to="/review" replace />} />
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
                      <Route path="/books" element={<BooksPage />} />
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
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </PageContainer>
              } />
            </Routes>
            <ChatIcon hideButton={location.pathname === '/tutor'} />
          </main>
        </SafeAreaContainer>

        <div className={`lg:hidden ${sidebarOpen ? 'hidden' : ''}`}>
          <MobileBottomNavigation items={mobileNavItems} />
        </div>
      </div>
    </div>
  )
}
