import './saveSelectedText'
import './selectionPanel'
import './aiExplain'
import './videoHelper'
import './miniTutor'
import './highlighter/savedKeywordHighlighter'
import './vocabularySaveHandler'
import { initYouTubeLearning, cleanup as cleanupYTL } from '../youtube-learning/youtube-learning-content'

const hostname = window.location.hostname
if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
  initYouTubeLearning()
}

window.addEventListener('beforeunload', () => {
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    cleanupYTL()
  }
})

chrome.runtime.onMessage.addListener((message, _sender) => {
  if (!message || typeof message !== 'object') return false
  const msg = message as Record<string, unknown>
  if (msg.type === 'TOGGLE_YOUTUBE_LEARNING') {
    import('../youtube-learning/youtube-learning-content').then(mod => {
      mod.handleLearningModeToggle(msg.payload === true)
    })
    return true
  }
  if (msg.type === 'TOGGLE_FOCUS_MODE') {
    import('../youtube-learning/infrastructure/youtube/FocusMode').then(mod => {
      new mod.FocusMode().toggle()
    })
    return true
  }
  if (msg.type === 'SET_AUTO_OPEN') {
    import('../youtube-learning/youtube-learning-content').then(mod => {
      mod.setAutoOpen(msg.payload === true)
    })
    return true
  }
  return false
})

export {}
