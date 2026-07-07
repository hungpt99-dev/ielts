import Dashboard from '../features/dashboard/Dashboard'
import { usePageViewEvent } from '../hooks/useLearningEvent'

function DashboardPage() {
  usePageViewEvent('dashboard_opened', 'dashboard', {
    eventType: 'dashboard_opened',
    activeTasks: 0,
  })

  return <Dashboard />
}

export default DashboardPage
