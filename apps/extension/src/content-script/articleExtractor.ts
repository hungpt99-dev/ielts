const UNWANTED_TAGS = new Set([
  'nav', 'footer', 'header', 'aside', 'script', 'style',
  'noscript', 'iframe', 'svg', 'form', 'button', 'input',
  'select', 'textarea', 'canvas', 'video', 'audio',
])

const UNWANTED_CLASSES = [
  /sidebar/i, /comment/i, /advert/i, /social/i, /share/i,
  /related/i, /recommend/i, /footer/i, /nav/i, /menu/i,
  /cookie/i, /popup/i, /modal/i, /overlay/i,
]

function isHidden(el: Element): boolean {
  const style = window.getComputedStyle(el)
  return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0'
}

function isUnwanted(el: Element): boolean {
  if (UNWANTED_TAGS.has(el.tagName.toLowerCase())) return true
  const className = el.className?.toLowerCase() || ''
  const id = el.id?.toLowerCase() || ''
  for (const pattern of UNWANTED_CLASSES) {
    if (pattern.test(className) || pattern.test(id)) return true
  }
  return false
}

function getTextContent(el: Element): string {
  return Array.from(el.childNodes)
    .map(node => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim() || ''
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        if (isUnwanted(element) || isHidden(element)) return ''
        if (element.tagName === 'BR') return '\n'
        if (element.tagName === 'P' || element.tagName === 'DIV') {
          return '\n' + getTextContent(element) + '\n'
        }
        if (element.tagName === 'LI') return '\n• ' + getTextContent(element)
        if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
          return '\n\n' + getTextContent(element) + '\n'
        }
        if (element.tagName === 'IMG') {
          const alt = (element as HTMLImageElement).alt?.trim()
          return alt ? ` [Image: ${alt}] ` : ''
        }
        if (element.tagName === 'A') {
          const text = getTextContent(element)
          return text || ''
        }
        return getTextContent(element)
      }
      return ''
    })
    .filter(Boolean)
    .join('')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]+$/gm, '')
    .trim()
}

function findArticleContainer(): Element | null {
  const article = document.querySelector('article')
  if (article && getTextContent(article).length > 100) return article

  const main = document.querySelector('main, [role="main"], #content, .content, .post, .article')
  if (main && getTextContent(main).length > 100) return main

  const candidates: Array<{ el: Element; score: number }> = []
  const bodies = document.querySelectorAll('body *:not(script):not(style)')

  for (const el of bodies) {
    if (isHidden(el) || isUnwanted(el)) continue
    const tag = el.tagName.toLowerCase()
    if (['p', 'div', 'section', 'article'].includes(tag)) {
      const text = getTextContent(el)
      const textLen = text.length
      if (textLen > 80) {
        const linkDensity = (el.querySelectorAll('a').length || 1) / Math.max(textLen / 100, 1)
        const commaCount = (text.match(/,/g) || []).length
        const periodCount = (text.match(/\./g) || []).length
        const score = textLen + (commaCount * 20) + (periodCount * 30) - (linkDensity * 50)
        candidates.push({ el, score })
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.el || document.body
}

function extractMetadata(): { author: string; date: string; description: string } {
  const getMeta = (name: string): string => {
    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
    return (el as HTMLMetaElement)?.content?.trim() || ''
  }

  return {
    author: getMeta('author') || getMeta('article:author') || getMeta('og:author') || '',
    date: getMeta('date') || getMeta('article:published_time') || getMeta('og:published_time') || '',
    description: getMeta('description') || getMeta('og:description') || getMeta('twitter:description') || '',
  }
}

export interface ExtractResult {
  title: string
  url: string
  content: string
  excerpt: string
  author: string
  date: string
  description: string
  wordCount: number
}

export function extractArticle(): ExtractResult {
  const container = findArticleContainer()
  const content = container ? getTextContent(container) : ''
  const excerpt = content.slice(0, 300).replace(/\n+/g, ' ').trim()
  const metadata = extractMetadata()

  const ogTitle = (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content
  const h1 = document.querySelector('h1')?.textContent?.trim()

  const title = ogTitle || h1 || document.title
    .replace(/ - .*$/, '')
    .replace(/ \| .*$/, '')
    .replace(/ — .*$/, '')
    .trim()

  return {
    title: title || document.title,
    url: window.location.href,
    content,
    excerpt: `${excerpt}${content.length > 300 ? '...' : ''}`,
    author: metadata.author,
    date: metadata.date,
    description: metadata.description,
    wordCount: content.split(/\s+/).filter(Boolean).length,
  }
}
