import { useEffect } from 'react'

interface SEOHeadProps {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  keywords?: string
  canonical?: string
}

const DEFAULT_KEYWORDS =
  'IELTS study plan, IELTS roadmap, IELTS daily learning, IELTS self-study, IELTS learning app, IELTS Journey, prepare IELTS, IELTS study guide'

export default function SEOHead({
  title,
  description,
  ogTitle,
  ogDescription,
  keywords,
  canonical,
}: SEOHeadProps) {
  useEffect(() => {
    const tags: { el: HTMLElement; cleanup: () => void }[] = []

    const setMeta = (name: string, content: string, property?: string) => {
      const attr = property ? 'property' : 'name'
      const selector = `meta[${attr}="${property || name}"]`
      let el = document.querySelector(selector) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, property || name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
      tags.push({
        el,
        cleanup: () => {
          const prev = document.querySelector(selector)
          if (prev) prev.remove()
        },
      })
    }

    document.title = title

    setMeta('description', description)
    setMeta('keywords', keywords || DEFAULT_KEYWORDS)
    setMeta('og:title', ogTitle || title, 'property')
    setMeta('og:description', ogDescription || description, 'property')
    setMeta('og:type', 'website', 'property')

    if (canonical) {
      const attr = 'rel'
      const selector = `link[rel="canonical"]`
      let el = document.querySelector(selector) as HTMLLinkElement | null
      if (!el) {
        el = document.createElement('link')
        el.setAttribute(attr, 'canonical')
        document.head.appendChild(el)
      }
      el.setAttribute('href', canonical)
    }

    return () => {
      for (const { cleanup } of tags) cleanup()
    }
  }, [title, description, ogTitle, ogDescription, keywords, canonical])

  return null
}
