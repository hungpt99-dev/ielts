import { createElement, type ComponentType } from 'react'
import { renderToString } from 'react-dom/server'

const cache = new Map<string, string>()

export function iconToHtml(Icon: ComponentType<{ size?: number }>, size = 16): string {
  const key = `${Icon.displayName || Icon.name || 'icon'}-${size}`
  const cached = cache.get(key)
  if (cached) return cached
  const html = renderToString(createElement(Icon, { size }))
  cache.set(key, html)
  return html
}
