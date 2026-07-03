import { useState, useEffect, useCallback } from 'react'
import type { DashboardData, WeeklyStudyDay } from '../models'
import { loadDashboardData } from '../features/dashboard/dashboardService'

export interface DashboardState {
  data: DashboardData | null
  weeklyChart: WeeklyStudyDay[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDashboard(): DashboardState {
  const [data, setData] = useState<DashboardData | null>(null)
  const [weeklyChart, setWeeklyChart] = useState<WeeklyStudyDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await loadDashboardData()
      setData(result.data)
      setWeeklyChart(result.weeklyChart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, weeklyChart, loading, error, refresh: load }
}
