import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@ielts/config'
import { isOnboardingComplete } from '../../features/onboarding/onboardingService'
import { RequireOnboarding, RedirectIfOnboarded } from '../../features/onboarding/guards/OnboardingGuard'
import LandingPage from '../../pages/LandingPage'
import NotFoundPage from '../../pages/NotFoundPage'

vi.mock('../../features/onboarding/onboardingService', () => ({
  isOnboardingComplete: vi.fn(),
}))

vi.mock('../../pages/NotFoundPage', () => ({
  default: () => <div data-testid="not-found-page">404 - Page Not Found</div>,
}))

vi.mock('../../pages/LandingPage', () => ({
  default: () => <div data-testid="landing-page">IELTS Journey</div>,
}))

vi.mock('../../pages/OnboardingPage', () => ({
  default: () => <div data-testid="onboarding-page">Onboarding</div>,
}))

vi.mock('../../components/Layout', () => ({
  default: () => <div data-testid="app-layout">App Layout</div>,
}))

function TestRouter({ initialRoute }: { initialRoute: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path={ROUTES.landing}
          element={
            isOnboardingComplete()
              ? <Navigate to={ROUTES.dashboard} replace />
              : <LandingPage />
          }
        />
        <Route path="/landing" element={<Navigate to={ROUTES.landing} replace />} />
        <Route path={ROUTES.onboarding} element={
          <RedirectIfOnboarded>
            <div data-testid="onboarding-page">Onboarding</div>
          </RedirectIfOnboarded>
        } />
        <Route path="/tutor" element={<Navigate to={ROUTES.tutor} replace />} />
        <Route path="/roadmap" element={<Navigate to={ROUTES.roadmap} replace />} />
        <Route path="/reading" element={<Navigate to={ROUTES.reading} replace />} />
        <Route path="/listening" element={<Navigate to={ROUTES.listening} replace />} />
        <Route path="/*" element={
          <RequireOnboarding>
            <div data-testid="app-layout">App Layout</div>
          </RequireOnboarding>
        } />
      </Routes>
    </MemoryRouter>
  )
}

describe('ROUTES constants', () => {
  it('has expected application route paths', () => {
    expect(ROUTES.dashboard).toBe('/dashboard')
    expect(ROUTES.roadmap).toBe('/study-roadmap')
    expect(ROUTES.tutor).toBe('/ai-tutor')
    expect(ROUTES.vocabulary).toBe('/vocabulary')
    expect(ROUTES.reading).toBe('/practice/reading')
    expect(ROUTES.listening).toBe('/practice/listening')
    expect(ROUTES.settings).toBe('/settings')
  })

  it('has expected public route paths', () => {
    expect(ROUTES.landing).toBe('/')
    expect(ROUTES.onboarding).toBe('/onboarding')
    expect(ROUTES.privacy).toBe('/privacy')
    expect(ROUTES.info).toBe('/info')
  })
})

describe('Routing behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('New user opening /', () => {
    it('renders the landing page', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(false)
      render(<TestRouter initialRoute="/" />)
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })
  })

  describe('Returning user opening /', () => {
    it('redirects to dashboard', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
      render(<TestRouter initialRoute="/" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument()
    })
  })

  describe('Unonboarded user accessing app routes', () => {
    it('redirects to onboarding when accessing /*', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(false)
      render(<TestRouter initialRoute="/dashboard" />)
      expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
    })
  })

  describe('Onboarded user accessing app routes', () => {
    it('renders app layout for wildcard routes', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
      render(<TestRouter initialRoute="/dashboard" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('renders app layout for /vocabulary', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
      render(<TestRouter initialRoute="/vocabulary" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('renders app layout for /practice/reading', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
      render(<TestRouter initialRoute="/practice/reading" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })
  })

  describe('Onboarding route', () => {
    it('renders onboarding page when not onboarded', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(false)
      render(<TestRouter initialRoute="/onboarding" />)
      expect(screen.getByTestId('onboarding-page')).toBeInTheDocument()
    })

    it('redirects to dashboard when already onboarded', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
      render(<TestRouter initialRoute="/onboarding" />)
      expect(screen.queryByTestId('onboarding-page')).not.toBeInTheDocument()
    })
  })

  describe('Backward-compatible redirects', () => {
    beforeEach(() => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
    })

    it('redirects /landing to /', () => {
      render(<TestRouter initialRoute="/landing" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('redirects /tutor to /ai-tutor', () => {
      render(<TestRouter initialRoute="/tutor" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('redirects /roadmap to /study-roadmap', () => {
      render(<TestRouter initialRoute="/roadmap" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('redirects /reading to /practice/reading', () => {
      render(<TestRouter initialRoute="/reading" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('redirects /listening to /practice/listening', () => {
      render(<TestRouter initialRoute="/listening" />)
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })
  })

  describe('404 for unknown routes', () => {
    it('renders NotFoundPage for /nonexistent-path', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
      render(
        <MemoryRouter initialEntries={['/nonexistent-path']}>
          <Routes>
            <Route path="/*" element={<NotFoundPage />} />
          </Routes>
        </MemoryRouter>
      )
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    })
  })
})

describe('OnboardingGuard components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('RequireOnboarding', () => {
    it('renders children when onboarding is complete', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
      render(
        <MemoryRouter>
          <RequireOnboarding>
            <div data-testid="protected-content">Protected Content</div>
          </RequireOnboarding>
        </MemoryRouter>
      )
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('redirects to /onboarding when onboarding is not complete', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(false)
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <RequireOnboarding>
            <div data-testid="protected-content">Protected Content</div>
          </RequireOnboarding>
        </MemoryRouter>
      )
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('RedirectIfOnboarded', () => {
    it('renders children when onboarding is not complete', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(false)
      render(
        <MemoryRouter>
          <RedirectIfOnboarded>
            <div data-testid="onboarding-content">Onboarding Page</div>
          </RedirectIfOnboarded>
        </MemoryRouter>
      )
      expect(screen.getByTestId('onboarding-content')).toBeInTheDocument()
    })

    it('redirects to /dashboard when onboarding is complete', () => {
      vi.mocked(isOnboardingComplete).mockReturnValue(true)
      render(
        <MemoryRouter initialEntries={['/onboarding']}>
          <RedirectIfOnboarded>
            <div data-testid="onboarding-content">Onboarding Page</div>
          </RedirectIfOnboarded>
        </MemoryRouter>
      )
      expect(screen.queryByTestId('onboarding-content')).not.toBeInTheDocument()
    })
  })
})
