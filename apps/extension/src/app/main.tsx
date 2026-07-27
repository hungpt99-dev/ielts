import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import ExtensionApp from './ExtensionApp'
import '@ielts/web-app/index.css'
import '@ielts/web-app/styles/theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ExtensionApp />
    </HashRouter>
  </StrictMode>,
)
