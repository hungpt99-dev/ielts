interface AiConfig {
  apiKey: string
  baseUrl: string
  model: string
}

async function getConfig(): Promise<AiConfig> {
  const [syncResult, localResult] = await Promise.all([
    new Promise<any>((r) => chrome.storage.local.get(['extensionSettings'], r)),
    new Promise<any>((r) => chrome.storage.local.get(['aiApiKey'], r)),
  ])
  const settings = syncResult.extensionSettings || {}
  return {
    apiKey: localResult.aiApiKey || '',
    baseUrl: settings.aiBaseUrl || 'https://api.openai.com/v1',
    model: settings.aiModel || 'gpt-4o-mini',
  }
}

async function callAI(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string | null; error: string | null }> {
  const config = await getConfig()
  if (!config.apiKey) {
    return { content: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) return { content: null, error: 'Invalid API key' }
      if (response.status === 429) return { content: null, error: 'Rate limited. Try again.' }
      return { content: null, error: `API error (${response.status})` }
    }

    const json = await response.json()
    const content: string = json.choices?.[0]?.message?.content || ''
    if (!content) return { content: null, error: 'Empty AI response' }
    return { content, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return { content: null, error: 'Network error. Check your connection.' }
    }
    return { content: null, error: `Request failed: ${msg}` }
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

export interface VerbConjugation {
  base: string
  pastSimple: string
  pastParticiple: string
  presentParticiple: string
  thirdPersonSingular: string
}

export interface VocabEnrichResult {
  meaning: string
  translation: string
  partOfSpeech: string
  pronunciation: string
  exampleSentence: string
  synonyms: string[]
  antonyms: string[]
  collocations: string[]
  wordFamily: string[]
  verbConjugation?: VerbConjugation
}

export async function normalizeToLemma(word: string): Promise<string> {
  if (!word.trim()) return word
  const clean = word.trim().toLowerCase()
  const systemPrompt = 'You are a linguist. Respond with a single word only — the dictionary lemma form. No punctuation, no explanation.'
  const userPrompt = `What is the dictionary lemma (base form) of the word "${clean}"? For example: running → run, better → good, mice → mouse, cars → car, studied → study, biggest → big, quickly → quick. Respond with only the lemma word, nothing else.`

  const { content, error } = await callAI(systemPrompt, userPrompt)
  if (error || !content) return clean
  const lemma = content.trim().toLowerCase().replace(/[^a-z\-]/g, '')
  return lemma || clean
}

export async function enrichVocabulary(
  word: string,
  context?: string,
): Promise<{ data: VocabEnrichResult | null; error: string | null }> {
  const systemPrompt = 'You are an IELTS vocabulary expert. Respond with valid JSON only.'
  const userPrompt = `Generate detailed IELTS vocabulary for "${word}".
${context ? `Context: "${context}"\n` : ''}
Respond with JSON:
{
  "meaning": "English definition for IELTS",
  "translation": "translation in your language",
  "partOfSpeech": "noun/verb/adjective/adverb",
  "pronunciation": "IPA like /wɜːrd/",
  "exampleSentence": "IELTS-style example",
  "synonyms": ["word1", "word2", "word3"],
  "antonyms": ["word1", "word2"],
  "collocations": ["phrase — meaning"],
  "wordFamily": ["noun", "verb", "adjective"],
  "verbConjugation": {
    "base": "base form (omit if not a verb)",
    "pastSimple": "past tense form",
    "pastParticiple": "past participle form",
    "presentParticiple": "-ing form",
    "thirdPersonSingular": "-s form"
  }
}

IMPORTANT: Only include verbConjugation if the word is a verb. If not a verb, omit it entirely.`

  const { content, error } = await callAI(systemPrompt, userPrompt)
  if (error) return { data: null, error }
  const json = extractJson(content || '')
  if (!json) return { data: null, error: 'AI response was not valid JSON' }

  const rawVc = json.verbConjugation
  const verbConjugation = rawVc && typeof rawVc === 'object' && !Array.isArray(rawVc)
    ? {
        base: String((rawVc as Record<string, unknown>).base || ''),
        pastSimple: String((rawVc as Record<string, unknown>).pastSimple || ''),
        pastParticiple: String((rawVc as Record<string, unknown>).pastParticiple || ''),
        presentParticiple: String((rawVc as Record<string, unknown>).presentParticiple || ''),
        thirdPersonSingular: String((rawVc as Record<string, unknown>).thirdPersonSingular || ''),
      }
    : undefined

  return {
    data: {
      meaning: (json.meaning as string) || '',
      translation: (json.translation as string) || '',
      partOfSpeech: (json.partOfSpeech as string) || '',
      pronunciation: (json.pronunciation as string) || '',
      exampleSentence: (json.exampleSentence as string) || '',
      synonyms: Array.isArray(json.synonyms) ? json.synonyms as string[] : [],
      antonyms: Array.isArray(json.antonyms) ? json.antonyms as string[] : [],
      collocations: Array.isArray(json.collocations) ? json.collocations as string[] : [],
      wordFamily: Array.isArray(json.wordFamily) ? json.wordFamily as string[] : [],
      verbConjugation,
    },
    error: null,
  }
}

export interface ExplainResult {
  explanation: string
  examples: string[]
}

export async function explainText(text: string): Promise<{ data: ExplainResult | null; error: string | null }> {
  const systemPrompt = 'You are an IELTS tutor. Explain the text simply and clearly. Respond with valid JSON.'
  const userPrompt = `Explain this text for an IELTS learner:\n"${text}"\n\nRespond with JSON:\n{"explanation": "clear explanation", "examples": ["example1", "example2"]}`

  const { content, error } = await callAI(systemPrompt, userPrompt)
  if (error) return { data: null, error }
  const json = extractJson(content || '')
  if (!json) return { data: null, error: 'AI response was not valid JSON' }

  return {
    data: {
      explanation: (json.explanation as string) || '',
      examples: Array.isArray(json.examples) ? json.examples as string[] : [],
    },
    error: null,
  }
}

export interface IeltsVocabResult {
  bandLevel: string
  usage: string[]
  tips: string
}

export async function analyzeIeltsVocab(text: string): Promise<{ data: IeltsVocabResult | null; error: string | null }> {
  const systemPrompt = 'You are an IELTS examiner. Analyze vocabulary for IELTS band level. Respond with valid JSON.'
  const userPrompt = `Analyze this text for IELTS vocabulary level:\n"${text}"\n\nRespond with JSON:\n{"bandLevel": "7.0+", "usage": ["formal synonym", "collocation"], "tips": "how to use this in IELTS"}`

  const { content, error } = await callAI(systemPrompt, userPrompt)
  if (error) return { data: null, error }
  const json = extractJson(content || '')
  if (!json) return { data: null, error: 'AI response was not valid JSON' }

  return {
    data: {
      bandLevel: (json.bandLevel as string) || '',
      usage: Array.isArray(json.usage) ? json.usage as string[] : [],
      tips: (json.tips as string) || '',
    },
    error: null,
  }
}

export interface ExampleSentencesResult {
  sentences: string[]
}

export async function generateExamples(text: string): Promise<{ data: ExampleSentencesResult | null; error: string | null }> {
  const systemPrompt = 'You are an IELTS tutor. Generate example sentences for IELTS level. Respond with valid JSON.'
  const userPrompt = `Generate 3 IELTS-level example sentences using this text:\n"${text}"\n\nRespond with JSON:\n{"sentences": ["sentence1", "sentence2", "sentence3"]}`

  const { content, error } = await callAI(systemPrompt, userPrompt)
  if (error) return { data: null, error }
  const json = extractJson(content || '')
  if (!json) return { data: null, error: 'AI response was not valid JSON' }

  return {
    data: {
      sentences: Array.isArray(json.sentences) ? json.sentences as string[] : [],
    },
    error: null,
  }
}
