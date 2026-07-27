import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import LandingApp from './app/LandingApp'
import './index.css'
import './styles/theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LandingApp />
    </BrowserRouter>
  </StrictMode>,
)
