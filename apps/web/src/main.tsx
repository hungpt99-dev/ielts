import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './app/App'
import './index.css'
import './styles/theme.css'

registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('pwa-update-available'))
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('pwa-offline-ready'))
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
