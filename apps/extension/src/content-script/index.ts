import './saveSelectedText'
import './selectionPanel'
import './aiExplain'
import './videoHelper'
import './miniTutor'
import './highlighter/savedKeywordHighlighter'
import './vocabularySaveHandler'
import { initBridgeClient } from './bridge-client'
import { handleSyncMessage } from './sync/sync-handler'

initBridgeClient()
window.addEventListener('message', handleSyncMessage)

export {}
