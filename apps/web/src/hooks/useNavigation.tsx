import { useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'
import {
  IconHome,
  IconTodayPlan,
  IconStudyPlan,
  IconAITutor,
  IconVocabulary,
  IconReading,
  IconListening,
  IconWriting,
  IconSpeaking,
  IconGrammar,
  IconMistakes,
  IconProgress,
  IconSettings,
} from '@ielts/ui'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const mainNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconHome size={20} />, end: true },
  { to: '/today-plan', label: "Today's Plan", icon: <IconTodayPlan size={20} /> },
  { to: '/roadmap', label: 'Study Roadmap', icon: <IconStudyPlan size={20} /> },
]

export const tutorNavItem: NavItem = {
  to: '/tutor',
  label: 'AI Tutor',
  icon: <IconAITutor size={20} />,
}

export const learningNavItems: NavItem[] = [
  { to: '/vocabulary', label: 'Vocabulary', icon: <IconVocabulary size={20} /> },
]

export const practiceNavItems: NavItem[] = [
  { to: '/reading', label: 'Reading', icon: <IconReading size={20} /> },
  { to: '/listening', label: 'Listening', icon: <IconListening size={20} /> },
  { to: '/writing', label: 'Writing', icon: <IconWriting size={20} /> },
  { to: '/speaking', label: 'Speaking', icon: <IconSpeaking size={20} /> },
  { to: '/grammar', label: 'Grammar', icon: <IconGrammar size={20} /> },
  { to: '/mistakes', label: 'Mistakes', icon: <IconMistakes size={20} /> },
]

export const progressNavItems: NavItem[] = [
  { to: '/progress', label: 'Progress', icon: <IconProgress size={20} /> },
  { to: '/mock-tests', label: 'Mock Tests', icon: <IconProgress size={20} /> },
  { to: '/topics', label: 'Topics', icon: <IconStudyPlan size={20} /> },
]

export function useActiveRoute(): string {
  const location = useLocation()
  return location.pathname
}

export function isActiveRoute(path: string, currentPath: string): boolean {
  if (path === '/dashboard') {
    return currentPath === '/dashboard'
  }
  return currentPath.startsWith(path)
}

export function useSidebarAutoOpen(accordionKey: string, paths: string[]): boolean {
  const location = useLocation()
  return paths.some((p) => location.pathname.startsWith(p))
}
