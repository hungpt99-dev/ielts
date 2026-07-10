import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { YouTubeLearningApp } from './App'
import './presentation/styles/variables.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <YouTubeLearningApp />
    </StrictMode>,
  )
}
