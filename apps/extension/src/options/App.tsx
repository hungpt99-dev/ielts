import { ToastProvider } from '../../../../packages/ui/src/components/Toast'
import SettingsPage from './SettingsPage'

function App() {
  return (
    <ToastProvider>
      <SettingsPage />
    </ToastProvider>
  )
}

export default App
