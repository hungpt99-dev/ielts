import { describe, it, expect } from 'vitest'
import { TranscriptParser } from '../TranscriptParser'

const validXml = `<transcript>
  <text start="0" dur="2.5">Hello world</text>
  <text start="2.5" dur="3.0">This is a test</text>
  <text start="5.5" dur="1.5">Goodbye</text>
</transcript>`

describe('TranscriptParser', () => {
  const parser = new TranscriptParser()

  it('parses valid XML into segments', () => {
    const segments = parser.parse(validXml, 'test-video')
    expect(segments).toHaveLength(3)

    expect(segments[0]).toEqual({
      text: 'Hello world',
      start: 0,
      end: 2.5,
      duration: 2.5,
    })

    expect(segments[1]).toEqual({
      text: 'This is a test',
      start: 2.5,
      end: 5.5,
      duration: 3.0,
    })

    expect(segments[2]).toEqual({
      text: 'Goodbye',
      start: 5.5,
      end: 7.0,
      duration: 1.5,
    })
  })

  it('decodes HTML entities', () => {
    const xml = '<transcript><text start="0" dur="1">He&amp;llo &lt;world&gt;</text></transcript>'
    const segments = parser.parse(xml, 'test')
    expect(segments[0].text).toBe('He&llo <world>')
  })

  it('decodes quotes and apostrophes', () => {
    const xml = '<transcript><text start="0" dur="1">&quot;hello&quot; it&#39;s</text></transcript>'
    const segments = parser.parse(xml, 'test')
    expect(segments[0].text).toBe(`"hello" it's`)
  })

  it('skips empty text elements', () => {
    const xml = '<transcript><text start="0" dur="1"></text><text start="1" dur="1">valid</text></transcript>'
    const segments = parser.parse(xml, 'test')
    expect(segments).toHaveLength(1)
    expect(segments[0].text).toBe('valid')
  })

  it('skips whitespace-only text elements', () => {
    const xml = '<transcript><text start="0" dur="1">   </text><text start="1" dur="1">valid</text></transcript>'
    const segments = parser.parse(xml, 'test')
    expect(segments).toHaveLength(1)
  })

  it('returns empty array for empty XML', () => {
    expect(parser.parse('', 'test')).toEqual([])
  })

  it('returns empty array for XML with no text elements', () => {
    expect(parser.parse('<transcript></transcript>', 'test')).toEqual([])
  })

  it('returns empty array for malformed XML', () => {
    expect(parser.parse('not xml at all', 'test')).toEqual([])
  })

  it('handles missing start/dur attributes', () => {
    const xml = '<transcript><text>no attributes</text></transcript>'
    const segments = parser.parse(xml, 'test')
    expect(segments).toHaveLength(1)
    expect(segments[0].start).toBe(0)
    expect(segments[0].duration).toBe(0)
  })
})
