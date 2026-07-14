import { useState, useEffect, useCallback } from 'react'
import { getTodayEntries } from '../../storage/indexedDB'
import type { LearningEntry } from '../../types'
import { safeStorageGet } from '../../utils/safe-chrome'

export interface DailyProgress {
  wordsAdded: number
  notesAdded: number
  articlesSaved: number
  notesSaved: number
  reviewDue: number
  streak: number
}

export interface UserData {
  name: string
  email: string
  avatar: string
  isLoggedIn: boolean
}

export interface PopupDataState {
  progress: DailyProgress
  recentEntries: LearningEntry[]
  user: UserData | null
  darkMode: boolean
  loading: boolean
  error: string | null
}

export interface PopupDataActions {
  toggleDarkMode: () => void
  refreshProgress: () => void
  refreshRecent: () => void
}

export type PopupDataResult = PopupDataState & PopupDataActions

const DEFAULT_PROGRESS: DailyProgress = {
  wordsAdded: 0,
  notesAdded: 0,
  articlesSaved: 0,
  notesSaved: 0,
  reviewDue: 0,
  streak: 0,
}

async function loadProgress(): Promise<DailyProgress> {
  const result = await safeStorageGet<any>('dailyProgress')
  return (result && typeof result === 'object' ? result : DEFAULT_PROGRESS) as DailyProgress
}

async function loadRecentEntries(): Promise<LearningEntry[]> {
  try {
    const today = await getTodayEntries()
    return [...today]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
  } catch (error) {
    console.error('apps/extension/src/popup/hooks/usePopupData.ts error:', error);
    return []
  }
}

async function loadUserData(): Promise<UserData | null> {
  try {
    const result = await safeStorageGet<any>('ieltsUser')
    if (result.ieltsUser?.isLoggedIn) {
      return result.ieltsUser as UserData
    }
  } catch (error) {
    console.error('apps/extension/src/popup/hooks/usePopupData.ts error:', error);
    // Storage not available
  }
  return null
}

function getInitialDarkMode(): boolean {
  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const saved = localStorage.getItem('popup-dark-mode')
    return saved !== null ? saved === 'true' : prefersDark
  } catch (error) {
    console.error('apps/extension/src/popup/hooks/usePopupData.ts error:', error);
    return false
  }
}

function applyDarkMode(isDark: boolean) {
  try {
    document.documentElement.classList.toggle('dark', isDark)
  } catch (error) {
    console.error('apps/extension/src/popup/hooks/usePopupData.ts error:', error);
    // DOM not available
  }
}

export function usePopupData(): PopupDataResult {
  const [progress, setProgress] = useState<DailyProgress>(DEFAULT_PROGRESS)
  const [recentEntries, setRecentEntries] = useState<LearningEntry[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProgress = useCallback(() => {
    loadProgress()
      .then(setProgress)
      .catch(() => setProgress(DEFAULT_PROGRESS))
  }, [])

  const refreshRecent = useCallback(() => {
    loadRecentEntries()
      .then(setRecentEntries)
      .catch(() => setRecentEntries([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    let unregister: (() => void) | undefined

    const init = async () => {
      try {
        const [progressResult, recentResult, userResult] = await Promise.allSettled([
          loadProgress(),
          loadRecentEntries(),
          loadUserData(),
        ])

        if (cancelled) return

        if (progressResult.status === 'fulfilled') {
          setProgress(progressResult.value)
        }
        if (recentResult.status === 'fulfilled') {
          setRecentEntries(recentResult.value)
        }
        if (userResult.status === 'fulfilled') {
          setUser(userResult.value)
        }

        const failures = [progressResult, recentResult, userResult]
          .filter(r => r.status === 'rejected')
        if (failures.length > 0) {
          setError('Failed to load some data')
        }
      } catch (error) {
        console.error('apps/extension/src/popup/hooks/usePopupData.ts error:', error);
        if (!cancelled) setError('Failed to initialize popup data')
      } finally {
        if (!cancelled) {
          const isDark = getInitialDarkMode()
          setDarkMode(isDark)
          applyDarkMode(isDark)
          setLoading(false)
        }
      }
    }

    init()

    try {
      const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes.dailyProgress?.newValue) {
          setProgress(changes.dailyProgress.newValue as DailyProgress)
        }
        if (changes.ieltsUser?.newValue) {
          setUser(changes.ieltsUser.newValue as UserData)
        }
      }
      chrome.storage.onChanged.addListener(listener)
      unregister = () => {
        try { chrome.storage.onChanged.removeListener(listener) } catch (error) {
 console.error('apps/extension/src/popup/hooks/usePopupData.ts error:', error);
 /* ignore */ }
      }
    } catch (error) {
      console.error('apps/extension/src/popup/hooks/usePopupData.ts error:', error);
      // chrome.storage not available
    }

    return () => {
      cancelled = true
      unregister?.()
    }
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem('popup-dark-mode', String(next))
      } catch (error) {
 console.error('apps/extension/src/popup/hooks/usePopupData.ts error:', error);
 /* localStorage not available */ }
      applyDarkMode(next)
      return next
    })
  }, [])

  return {
    progress,
    recentEntries,
    user,
    darkMode,
    loading,
    error,
    toggleDarkMode,
    refreshProgress,
    refreshRecent,
  }
}
