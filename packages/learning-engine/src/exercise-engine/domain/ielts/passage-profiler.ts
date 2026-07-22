import type {
  ReadingPassageProfile,
  ParagraphFunction,
} from './ielts-types'

function wordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function sentenceCount(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
}

function averageSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) return 0
  return sentences.reduce((sum, s) => sum + wordCount(s), 0) / sentences.length
}

function uniqueWordRatio(text: string): number {
  const words = text.toLowerCase().replace(/[.,!?;:()"'\-]/g, ' ').split(/\s+/).filter(w => w.length > 2)
  const unique = new Set(words)
  return words.length > 0 ? unique.size / words.length : 0
}

function lexicalDensity(text: string): number {
  const contentWords = text.toLowerCase().replace(/[.,!?;:()"'\-]/g, ' ').split(/\s+/).filter(w => {
    return w.length > 3 && !COMMON_WORDS.has(w)
  })
  const totalWords = text.split(/\s+/).filter(w => w.length > 0).length
  return totalWords > 0 ? contentWords.length / totalWords : 0
}

const COMMON_WORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'for', 'it', 'was', 'on',
  'are', 'be', 'as', 'with', 'by', 'at', 'from', 'or', 'an', 'but', 'not',
  'this', 'they', 'have', 'has', 'been', 'which', 'their', 'can', 'had',
  'also', 'more', 'been', 'were', 'no', 'one', 'all', 'will', 'would', 'may',
  'there', 'its', 'who', 'when', 'use', 'out', 'into', 'some', 'other', 'than',
  'then', 'now', 'over', 'such', 'just', 'about', 'each', 'new', 'also', 'how',
  'if', 'up', 'so', 'what', 'these', 'do', 'said', 'him', 'her', 'his', 'them',
  'very', 'many', 'most', 'first', 'only', 'way', 'even', 'after', 'between',
  'like', 'long', 'just', 'our', 'still', 'well', 'much', 'through', 'where',
  'both', 'before', 'own', 'while', 'those', 'might', 'should', 'could',
  'too', 'however', 'did', 'get', 'made', 'know',
])

const PARAGRAPH_FUNCTION_DETECTORS: Array<{
  func: ParagraphFunction
  patterns: RegExp[]
  minMatches?: number
}> = [
  {
    func: 'introduction',
    patterns: [
      /\bintroduc(?:e|es|ing|tion)\b/i,
      /\bpresents?\b/i,
      /\boverview\b/i,
      /\bexplor(?:e|es|ing|ation)\b/i,
    ],
  },
  {
    func: 'historical-background',
    patterns: [
      /\bhistor(?:y|ically|ical)\b/i,
      /\bin the past\b/i,
      /\borigin(?:s|ally|ated)\b/i,
      /\bemerged\b/i,
      /\btradition(?:ally|al)\b/i,
      /\b(?:19|20)\d{2}\b/i,
      /\bcentur(?:y|ies)\b/i,
      /\b(?:ancient|medieval)\b/i,
    ],
  },
  {
    func: 'cause',
    patterns: [
      /\bcause\b/i,
      /\bbecause\b/i,
      /\bdue to\b/i,
      /\bresults?\s+from\b/i,
      /\bleads? to\b/i,
      /\bfactor\b/i,
      /\bcontribut(?:es?|ing|ion)\b/i,
      /\bdriven by\b/i,
      /\battribute(?:s|d)? to\b/i,
    ],
  },
  {
    func: 'effect',
    patterns: [
      /\bconsequence\b/i,
      /\bas a result\b/i,
      /\btherefore\b/i,
      /\bimpact\b/i,
      /\beffect\b/i,
      /\bimplication\b/i,
      /\bhence\b/i,
      /\bthus\b/i,
      /\boutcome\b/i,
      /\bleading to\b/i,
    ],
  },
  {
    func: 'contrast',
    patterns: [
      /\bhowever\b/i,
      /\bwhereas\b/i,
      /\bwhile\b/i,
      /\bin contrast\b/i,
      /\bunlike\b/i,
      /\bdiffer(?:s|ent|ence)\b/i,
      /\bcompared to\b/i,
      /\bon the other hand\b/i,
      /\bconversely\b/i,
      /\bn(?:either|or)\b/i,
      /\balternatively\b/i,
    ],
  },
  {
    func: 'example',
    patterns: [
      /\bfor example\b/i,
      /\bfor instance\b/i,
      /\bsuch as\b/i,
      /\bto illustrate\b/i,
      /\bcase (?:study|in point)\b/i,
      /\bnotably\b/i,
      /\bincluding\b/i,
    ],
  },
  {
    func: 'evidence',
    patterns: [
      /\bstud(?:y|ies)\b/i,
      /\bresearch\b/i,
      /\bevidence\b/i,
      /\bdata\b/i,
      /\bfinding\b/i,
      /\bexperiment\b/i,
      /\bsurvey\b/i,
      /\baccording to\b/i,
      /\breport(?:s|ed|ing)\b/i,
      /\breveal(?:s|ed)\b/i,
      /\bdemonstrat(?:e|es|ed|ion)\b/i,
      /\bpublish(?:ed|es)\b/i,
      /\bjournal\b/i,
    ],
  },
  {
    func: 'qualification',
    patterns: [
      /\bwhile\b.*\balso\b/i,
      /\bto some extent\b/i,
      /\bpartially\b/i,
      /\bin some cases\b/i,
      /\bunder certain conditions\b/i,
      /\bnot necessarily\b/i,
      /\b(?:may|might|can) be\b/i,
    ],
  },
  {
    func: 'limitation',
    patterns: [
      /\bhowever\b/i,
      /\blimitation\b/i,
      /\bnevertheless\b/i,
      /\bdespite\b/i,
      /\balthough\b/i,
      /\bshortcoming\b/i,
      /\bdrawback\b/i,
      /\bcritic(?:ism|al|s)\b/i,
      /\bchallenge\b/i,
      /\bobstacle\b/i,
      /\bbarrier\b/i,
      /\bconstraint\b/i,
    ],
    minMatches: 2,
  },
  {
    func: 'case-study',
    patterns: [
      /\b(?:study|research|investigation)\b.*\b(?:found|revealed|showed|reported)\b/i,
      /\b(?:researchers|scientists)\b.*\b(?:examined|analyzed|studied|observed)\b/i,
      /\bparticipants?\b/i,
      /\bdata\s+collection\b/i,
      /\brespondents?\b/i,
      /\bclinical\s+trial\b/i,
    ],
    minMatches: 2,
  },
  {
    func: 'future-development',
    patterns: [
      /\bfuture\b/i,
      /\bpotential\b/i,
      /\bpromising\b/i,
      /\bexpected to\b/i,
      /\bis likely to\b/i,
      /\bprospects?\b/i,
      /\bemerging\b/i,
      /\btrend\b/i,
      /\bongoing\b/i,
      /\bdevelopment\b/i,
      /\badvance(?:ment|ments|ing)\b/i,
      /\binnovation\b/i,
    ],
    minMatches: 2,
  },
  {
    func: 'conclusion',
    patterns: [
      /\bconclusion\b/i,
      /\bsummary\b/i,
      /\bultimately\b/i,
      /\boverall\b/i,
      /\bin summary\b/i,
      /\bto sum\b/i,
      /\bin conclusion\b/i,
      /\bto conclude\b/i,
    ],
  },
]

function detectParagraphFunctions(
  paragraphId: string,
  content: string,
): ParagraphFunction[] {
  const detected: ParagraphFunction[] = []
  const lower = content.toLowerCase()

  for (const detector of PARAGRAPH_FUNCTION_DETECTORS) {
    const matchCount = detector.patterns.filter(p => p.test(lower)).length
    const threshold = detector.minMatches ?? 1
    if (matchCount >= threshold) {
      detected.push(detector.func)
    }
  }

  const forceDetect = detectStrongFunctionSignals(lower)
  for (const f of forceDetect) {
    if (!detected.includes(f)) {
      detected.push(f)
    }
  }

  if (detected.length === 0) {
    detected.push('introduction')
  }

  return detected
}

function detectStrongFunctionSignals(lower: string): ParagraphFunction[] {
  const results: ParagraphFunction[] = []

  if (/\bthis (?:has led|resulted|means|indicates|suggests|demonstrates)\b/i.test(lower)) {
    results.push('effect')
  }
  if (/\b(?:for example|for instance|such as)\b.*\b(?:study|research|survey|data)\b/i.test(lower)) {
    results.push('evidence')
  }
  if (/\bnevertheless\b|\bdespite these\b|\bthese (?:limitations?|challenges?|constraints?|obstacles?)\b/i.test(lower)) {
    results.push('limitation')
  }
  if (/\b(?:moreover|furthermore|additionally|in addition)\b.*\b(?:as a result|consequently|therefore)\b/i.test(lower)) {
    results.push('cause')
  }

  return results
}

function estimateSyntacticComplexity(passage: string): number {
  const sentences = passage.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) return 0

  let complexScore = 0
  for (const s of sentences) {
    const lower = s.toLowerCase()
    if (/\b(?:which|that|who|whom|whose|where|when)\b.*\b(?:was|were|is|are|has|have)\b/i.test(lower)) complexScore += 0.3
    if (/\b(?:although|though|even though|whereas|while)\b/i.test(lower)) complexScore += 0.3
    if (/\b(?:if|unless|provided that|as long as|in case)\b/i.test(lower)) complexScore += 0.2
    if (/\b(?:because|since|as|due to|owing to)\b/i.test(lower)) complexScore += 0.2
    if (lower.split(',').length > 2) complexScore += 0.2
    if (midWordCount(s) > 20) complexScore += 0.2
    if (/\bnot only.*\bbut also\b/i.test(lower)) complexScore += 0.3
    if (/\b(?:despite|in spite of|regardless of)\b/i.test(lower)) complexScore += 0.2
  }

  const avgScore = complexScore / sentences.length
  return Math.min(1, Math.max(0, avgScore * 0.8))
}

function midWordCount(sentence: string): number {
  return sentence.split(/\s+/).filter(w => w.length > 0).length
}

function estimateReferenceTrackingDemand(passage: string, paragraphs: Array<{ id: string; content: string }>): number {
  const lower = passage.toLowerCase()
  let refCount = 0

  const refPatterns = [
    /\bthis (?:approach|method|technique|strategy|process|phenomenon|trend|shift|change|transformation|development)\b/gi,
    /\bthese (?:findings?|results?|developments?|changes?|challenges?|issues?|factors?|programs?|initiatives?|efforts?)\b/gi,
    /\bsuch (?:an?\s+)?(?:initiatives?|programs?|opportunities?|policies?|measures?|approaches?|strategies?)\b/gi,
    /\bthe (?:former|latter|above|following|previous|same|corresponding)\b/gi,
    /\b(?:it|they|this|that|these|those)\b\s+(?:is|are|was|were|has|have|had|can|could|may|might|will|would|should)\b/gi,
    /\b(?:as\s+(?:mentioned|noted|stated|described|discussed|outlined|shown)|in\s+turn)\b/gi,
  ]

  for (const pattern of refPatterns) {
    const matches = lower.match(pattern)
    if (matches) refCount += matches.length
  }

  const density = refCount / Math.max(1, paragraphs.length)
  return Math.min(1, density * 0.25)
}

function estimateCrossParagraphConnections(
  paragraphs: Array<{ id: string; content: string }>,
): number {
  let connections = 0
  for (let i = 1; i < paragraphs.length; i++) {
    const lower = paragraphs[i].content.toLowerCase()
    if (/\b(?:furthermore|moreover|additionally|in addition|similarly|consequently|as a result|in contrast|however|nevertheless|on the other hand|by comparison|meanwhile|subsequently)\b/i.test(lower)) {
      connections++
    }
    if (/^(?:this|these|such|the)/i.test(lower.trim())) {
      connections++
    }
  }

  return Math.min(1, connections / Math.max(1, paragraphs.length - 1))
}

function estimateConceptualDensity(passage: string): number {
  const lower = passage.toLowerCase()
  const abstractTerms = [
    /\bconcept\b/gi, /\btheory\b/gi, /\bprinciple\b/gi, /\bparadigm\b/gi,
    /\bmechanism\b/gi, /\bphenomenon\b/gi, /\bcorrelation\b/gi,
    /\bcausation\b/gi, /\bimplication\b/gi, /\bhypothesis\b/gi,
    /\bempirical\b/gi, /\btheoretical\b/gi, /\bframework\b/gi,
    /\bperspective\b/gi, /\bapproach\b/gi, /\bstrategy\b/gi,
    /\bfundamental\b/gi, /\bsignificant\b/gi, /\bunderlying\b/gi,
    /\bparadigm\b/gi, /\bmethodology\b/gi,
  ]

  let count = 0
  for (const pattern of abstractTerms) {
    const matches = lower.match(pattern)
    if (matches) count += matches.length
  }

  const wc = wordCount(passage)
  return Math.min(1, count / (wc / 15))
}

function estimateDiscourseComplexity(
  passage: string,
  paragraphFunctions: Array<{ paragraphId: string; functions: ParagraphFunction[] }>,
): number {
  const lower = passage.toLowerCase()
  const discourseMarkers = [
    /\bhowever\b/gi, /\btherefore\b/gi, /\bconsequently\b/gi,
    /\bfurthermore\b/gi, /\bmoreover\b/gi, /\bnevertheless\b/gi,
    /\bnonetheless\b/gi, /\bwhereas\b/gi, /\bmeanwhile\b/gi,
    /\bsubsequently\b/gi, /\baccordingly\b/gi, /\bconversely\b/gi,
    /\bin contrast\b/gi, /\bon the contrary\b/gi,
    /\bnotwithstanding\b/gi, /\balternatively\b/gi,
  ]

  let markerCount = 0
  for (const pattern of discourseMarkers) {
    const matches = lower.match(pattern)
    if (matches) markerCount += matches.length
  }

  const distinctFunctions = new Set<ParagraphFunction>()
  for (const pf of paragraphFunctions) {
    for (const f of pf.functions) {
      distinctFunctions.add(f)
    }
  }

  const funcVariety = distinctFunctions.size
  const markerScore = Math.min(1, markerCount / (paragraphFunctions.length * 0.8))
  const funcScore = Math.min(1, funcVariety / 8)

  return (markerScore * 0.4) + (funcScore * 0.6)
}

function estimateBandRange(profile: {
  lexicalComplexity: number
  syntacticComplexity: number
  informationDensity: number
  conceptualDensity: number
  discourseComplexity: number
  referenceTrackingDemand: number
  crossParagraphConnections: number
  wordCount: number
  paragraphCount: number
}): { minimum: number; maximum: number } {
  const {
    lexicalComplexity,
    syntacticComplexity,
    informationDensity,
    conceptualDensity,
    discourseComplexity,
    referenceTrackingDemand,
    crossParagraphConnections,
  } = profile

  const composite =
    (lexicalComplexity * 0.20) +
    (syntacticComplexity * 0.20) +
    (informationDensity * 0.15) +
    (conceptualDensity * 0.15) +
    (discourseComplexity * 0.15) +
    (referenceTrackingDemand * 0.10) +
    (crossParagraphConnections * 0.05)

  let bandMid: number
  if (composite < 0.08) bandMid = 3.5
  else if (composite < 0.14) bandMid = 4.0
  else if (composite < 0.20) bandMid = 4.5
  else if (composite < 0.28) bandMid = 5.0
  else if (composite < 0.36) bandMid = 5.5
  else if (composite < 0.44) bandMid = 6.0
  else if (composite < 0.52) bandMid = 6.5
  else if (composite < 0.60) bandMid = 7.0
  else if (composite < 0.70) bandMid = 7.5
  else bandMid = 8.0

  if (profile.wordCount > 200 && bandMid < 4.5) bandMid = 4.5
  if (profile.wordCount > 300 && bandMid < 5.0) bandMid = 5.0
  if (profile.wordCount > 400 && bandMid < 5.5) bandMid = 5.5
  if (profile.wordCount > 600 && bandMid < 6.0) bandMid = 6.0
  if (profile.wordCount > 800 && bandMid < 6.5) bandMid = 6.5
  if (profile.wordCount < 100) bandMid = Math.min(bandMid, 4.0)
  if (profile.wordCount < 150) bandMid = Math.min(bandMid, 4.5)

  return {
    minimum: Math.max(3.5, bandMid - 0.5),
    maximum: Math.min(9.0, bandMid + 0.5),
  }
}

export function profileReadingPassage(
  passageText: string,
  paragraphs: Array<{ id: string; content: string }>,
): ReadingPassageProfile {
  const wc = wordCount(passageText)
  const pc = paragraphs.length
  const lc = lexicalDensity(passageText)
  const ur = uniqueWordRatio(passageText)
  const sc = estimateSyntacticComplexity(passageText)
  const infoDensity = Math.min(1, wc / (pc * 150))
  const concDensity = estimateConceptualDensity(passageText)
  const refDemand = estimateReferenceTrackingDemand(passageText, paragraphs)
  const crossConn = estimateCrossParagraphConnections(paragraphs)
  const paraFuncs = paragraphs.map(p => ({
    paragraphId: p.id,
    functions: detectParagraphFunctions(p.id, p.content),
  }))
  const discComplexity = estimateDiscourseComplexity(passageText, paraFuncs)

  const lexicalComplexity = (lc * 0.6) + (ur * 0.4)

  const bandRange = estimateBandRange({
    lexicalComplexity,
    syntacticComplexity: sc,
    informationDensity: infoDensity,
    conceptualDensity: concDensity,
    discourseComplexity: discComplexity,
    referenceTrackingDemand: refDemand,
    crossParagraphConnections: crossConn,
    wordCount: wc,
    paragraphCount: pc,
  })

  return {
    wordCount: wc,
    paragraphCount: pc,
    estimatedBandRange: bandRange,
    lexicalComplexity,
    syntacticComplexity: sc,
    informationDensity: infoDensity,
    conceptualDensity: concDensity,
    discourseComplexity: discComplexity,
    referenceTrackingDemand: refDemand,
    crossParagraphConnections: crossConn,
    paragraphFunctions: paraFuncs,
  }
}

export function estimateParagraphCountForProfile(
  profile: ReadingPassageProfile,
): number {
  return profile.paragraphCount
}

export function estimateQuestionDifficulty(
  question: {
    skill?: string
    statement?: string
    question?: string
    sentence?: string
  },
  passageText: string,
): { estimatedBand: number; isDirectRetrieval: boolean } {
  const skill = question.skill || 'specific-detail'
  const text = (question.question || question.statement || question.sentence || '').toLowerCase()
  const passage = passageText.toLowerCase()

  const qWords = text.split(/\s+/).filter(w => w.length > 2)
  const matchedWords = qWords.filter(w => passage.includes(w))
  const matchRatio = qWords.length > 0 ? matchedWords.length / qWords.length : 0

  const directRetrieval = matchRatio > 0.7 || skill === 'specific-detail'

  let band: number
  switch (skill) {
    case 'cross-paragraph-synthesis': band = 7.0; break
    case 'inference': band = 6.5; break
    case 'writer-purpose': band = 6.5; break
    case 'comparison': band = 6.0; break
    case 'cause-effect': band = 6.0; break
    case 'reference-tracking': band = 6.5; break
    case 'reference': band = 6.0; break
    case 'paragraph-purpose': band = 6.5; break
    case 'vocabulary-in-context': band = 6.0; break
    case 'main-idea': band = 5.5; break
    case 'paraphrase': band = 5.5; break
    case 'information-location': band = 5.0; break
    case 'specific-detail': band = 4.5; break
    default: band = 5.0; break
  }

  if (matchRatio > 0.8) band = Math.max(4.0, band - 0.5)
  if (matchRatio < 0.4) band = Math.min(8.0, band + 0.5)

  return { estimatedBand: band, isDirectRetrieval: directRetrieval || skill === 'specific-detail' || skill === 'information-location' }
}
