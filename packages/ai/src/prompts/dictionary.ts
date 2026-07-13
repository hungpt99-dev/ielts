import type { PromptVersion } from './types'

function translationTarget(lang: string): string {
  return lang.trim() || 'your native language'
}

const DICTIONARY_PROMPT_VERSION: PromptVersion = { version: 1, description: 'Initial dictionary prompts' }

export const DICTIONARY_ENTRY_SYSTEM_PROMPT = 'You are an IELTS dictionary assistant. Respond with valid JSON only, no other text.'

export function buildDictionaryEntryPrompt(
  selectedWord: string,
  contextSentence = '',
  nativeLanguage = '',
): string {
  const lang = translationTarget(nativeLanguage)
  return `Look up the word "${selectedWord}"${
    contextSentence ? ` from the sentence: "${contextSentence}"` : ''
  } and return detailed dictionary information.

Respond with valid JSON in this exact format:
{
  "word": "${selectedWord}",
  "meaning": "Clear English definition suitable for IELTS learners",
  "translation": "translation in ${lang}",
  "pronunciation": "IPA pronunciation like /ˈeksəmpl/",
  "partOfSpeech": "e.g. noun, verb, adjective, adverb",
  "exampleSentence": "An IELTS-style example sentence using the word",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "collocations": ["collocation1", "collocation2"],
  "ieltsTopic": "Most relevant IELTS topic: education, environment, technology, health, travel, culture, economy, society, science, work, or general",
  "verbConjugation": {
    "base": "base form (omit if not a verb)",
    "pastSimple": "past simple form",
    "pastParticiple": "past participle form",
    "presentParticiple": "present participle (-ing) form",
    "thirdPersonSingular": "third person singular (-s) form"
  }
}

IMPORTANT: Only include verbConjugation if the word is a verb. If not a verb, omit verbConjugation entirely.`
}

export function getVersionInfo(): PromptVersion {
  return DICTIONARY_PROMPT_VERSION
}
