import './saveSelectedText'
import './selectionPanel'
import './aiExplain'
import './videoHelper'
import './miniTutor'
import './highlighter/savedKeywordHighlighter'
import './vocabularySaveHandler'
import { initBridgeClient } from './bridge-client'
import { initSyncListener, onDataSync } from '../services/syncManager'

initBridgeClient()
initSyncListener()

onDataSync((payload) => {
  try {
    chrome.runtime.sendMessage({ type: 'DATA_SYNC', payload }).catch(() => {})
  } catch {
    // background may not be available
  }
})

export {}
