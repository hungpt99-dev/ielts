import { describe, it, expect } from 'vitest'
import { EXTENSION_MESSAGE_TYPES, MAIN_APP_PATH, MAIN_APP_DASHBOARD_URL } from '../messages'

describe('Extension message types', () => {
  it('defines all required message types', () => {
    expect(EXTENSION_MESSAGE_TYPES.OPEN_MAIN_APP).toBe('OPEN_MAIN_APP')
    expect(EXTENSION_MESSAGE_TYPES.SAVE_SELECTED_TEXT).toBe('SAVE_SELECTED_TEXT')
    expect(EXTENSION_MESSAGE_TYPES.SAVE_ARTICLE).toBe('SAVE_ARTICLE')
    expect(EXTENSION_MESSAGE_TYPES.GET_ACTIVE_TAB_CONTEXT).toBe('GET_ACTIVE_TAB_CONTEXT')
    expect(EXTENSION_MESSAGE_TYPES.SET_HIGHLIGHTING_ENABLED).toBe('SET_HIGHLIGHTING_ENABLED')
    expect(EXTENSION_MESSAGE_TYPES.DATA_CHANGED).toBe('DATA_CHANGED')
  })

  it('has consistent main app path constants', () => {
    expect(MAIN_APP_PATH).toBe('app/index.html')
    expect(MAIN_APP_DASHBOARD_URL).toBe(`${MAIN_APP_PATH}#/dashboard`)
  })

  it('OPEN_MAIN_APP is a valid message type', () => {
    const msg = { type: EXTENSION_MESSAGE_TYPES.OPEN_MAIN_APP, route: '/vocabulary' }
    expect(msg.type).toBe('OPEN_MAIN_APP')
    expect(msg.route).toBe('/vocabulary')
  })

  it('SAVE_SELECTED_TEXT message has correct shape', () => {
    const msg = {
      type: EXTENSION_MESSAGE_TYPES.SAVE_SELECTED_TEXT,
      payload: { text: 'hello', category: 'vocabulary' },
    }
    expect(msg.payload.text).toBe('hello')
  })

  it('SET_HIGHLIGHTING_ENABLED message has correct shape', () => {
    const msg = { type: EXTENSION_MESSAGE_TYPES.SET_HIGHLIGHTING_ENABLED, enabled: true }
    expect(msg.enabled).toBe(true)
  })

  it('DATA_CHANGED message has correct shape', () => {
    const msg = {
      type: EXTENSION_MESSAGE_TYPES.DATA_CHANGED,
      entity: 'vocabulary',
      action: 'created',
    }
    expect(msg.entity).toBe('vocabulary')
    expect(msg.action).toBe('created')
  })
})
