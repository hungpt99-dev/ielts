declare module '@ielts/web-app/context/ThemeContext' {
  import type { FC, ReactNode } from 'react'
  export const ThemeProvider: FC<{ children: ReactNode }>
  export function useTheme(): { mode: string; accentColor: string }
}
declare module '@ielts/web-app/context/SettingsContext' {
  import type { FC, ReactNode } from 'react'
  export const SettingsProvider: FC<{ children: ReactNode }>
  export function useSettings(): { settings: Record<string, unknown>; updateSettings: (patch: Partial<Record<string, unknown>>) => void }
}
declare module '@ielts/web-app/components/Layout' {
  import type { FC } from 'react'
  const AppLayout: FC
  export default AppLayout
}
declare module '@ielts/web-app/pages/LandingPage' {
  import type { FC } from 'react'
  const LandingPage: FC
  export default LandingPage
}
declare module '@ielts/web-app/components/ui/Toast' {
  import type { FC, ReactNode } from 'react'
  export const ToastProvider: FC<{ children: ReactNode }>
}
declare module '@ielts/web-app/components/ui/ErrorBoundary' {
  import type { FC, ReactNode } from 'react'
  const ErrorBoundary: FC<{ children: ReactNode }>
  export default ErrorBoundary
}
declare module '@ielts/web-app/components/ui/OfflineIndicator' {
  import type { FC } from 'react'
  const OfflineIndicator: FC
  export default OfflineIndicator
}
declare module '@ielts/web-app/services/engineBootstrap' {
  import type { AITutorEngine } from '@ielts/ai-tutor-engine'
  import type { LearningEngine } from '@ielts/learning-engine'
  export function initializeAITutorEngine(): Promise<AITutorEngine | null>
  export function initializeLearningEngine(): Promise<LearningEngine | null>
  export function getAITutorEngine(): AITutorEngine | null
  export function getLearningEngine(): LearningEngine | null
}
declare module '@ielts/web-app/index.css' {}
declare module '@ielts/web-app/styles/theme.css' {}
