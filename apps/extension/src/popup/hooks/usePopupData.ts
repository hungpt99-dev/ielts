import { useState, useEffect, useCallback } from 'react'
import { getTodayEntries } from '../../storage/indexedDB'
import type { LearningEntry } from '../../types'
import { safeStorageGet } from '../../utils/safe-chrome'

export interface DailyProgress {
  wordsAdded: number
  notesAdded: number
  articlesSaved: number
  reviewDue: number
  streak: number
}

export interface PopupDataState {
  progress: DailyProgress
  recentEntries: LearningEntry[]
  darkMode: boolean
  loading: boolean
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
  reviewDue: 0,
  streak: 0,
}

async function loadProgress(): Promise<DailyProgress> {
  const result = await safeStorageGet<any>('dailyProgress')
  return result.dailyProgress || DEFAULT_PROGRESS
}

async function loadRecentEntries(): Promise<LearningEntry[]> {
  try {
    const today = await getTodayEntries()
    return [...today]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
  } catch {
    return []
  }
}

function getInitialDarkMode(): boolean {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const saved = localStorage.getItem('popup-dark-mode')
  return saved !== null ? saved === 'true' : prefersDark
}

function applyDarkMode(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

export function usePopupData(): PopupDataResult {
  const [progress, setProgress] = useState<DailyProgress>(DEFAULT_PROGRESS)
  const [recentEntries, setRecentEntries] = useState<LearningEntry[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshProgress = useCallback(() => {
    loadProgress().then(setProgress)
  }, [])

  const refreshRecent = useCallback(() => {
    loadRecentEntries().then(setRecentEntries)
  }, [])

  useEffect(() => {
    const init = async () => {
      await Promise.all([refreshProgress(), refreshRecent()])
      const isDark = getInitialDarkMode()
      setDarkMode(isDark)
      applyDarkMode(isDark)
      setLoading(false)
    }

    init()

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      try {
        if (changes.dailyProgress?.newValue) {
          setProgress(changes.dailyProgress.newValue as DailyProgress)
        }
      } catch { /* ignore */ }
    }

    try {
      chrome.storage.onChanged.addListener(listener)
    } catch { /* ignore */ }
    return () => {
      try { chrome.storage.onChanged.removeListener(listener) } catch { /* ignore */ }
    }
  }, [refreshProgress, refreshRecent])

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev
      localStorage.setItem('popup-dark-mode', String(next))
      applyDarkMode(next)
      return next
    })
  }, [])

  return {
    progress,
    recentEntries,
    darkMode,
    loading,
    toggleDarkMode,
    refreshProgress,
    refreshRecent,
  }
}
