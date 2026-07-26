import { Navigate } from 'react-router-dom'
import { ROUTES } from '@ielts/config'
import { isOnboardingComplete } from '../onboardingService'

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  if (!isOnboardingComplete()) {
    return <Navigate to={ROUTES.onboarding} replace />
  }
  return <>{children}</>
}

export function RedirectIfOnboarded({ children }: { children: React.ReactNode }) {
  if (isOnboardingComplete()) {
    return <Navigate to={ROUTES.dashboard} replace />
  }
  return <>{children}</>
}
