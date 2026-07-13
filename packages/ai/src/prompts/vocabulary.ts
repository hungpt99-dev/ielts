import type { PromptVersion } from './types'

function translationTarget(lang: string): string {
  return lang.trim() || 'your native language'
}

const VOCAB_PROMPT_VERSION: PromptVersion = { version: 1, description: 'Initial vocabulary prompts' }

export const VOCABULARY_DETAILS_SYSTEM_PROMPT = 'You are an IELTS vocabulary expert assistant. Always respond with valid JSON only, no other text.'

export function buildVocabularyDetailsPrompt(
  word: string,
  sourceSentence = '',
  topic = '',
  nativeLanguage = '',
): string {
  const lang = translationTarget(nativeLanguage)
  return `Generate detailed IELTS vocabulary information for the word "${word}".

${sourceSentence ? `The word was found in this sentence: "${sourceSentence}"\n` : ''}
${topic ? `Topic: ${topic}\n` : ''}

Respond with valid JSON in this exact format:
{
  "meaning": "Clear English definition suitable for IELTS",
  "translation": "translation in ${lang}",
  "partOfSpeech": "e.g. noun, verb, adjective, adverb",
  "pronunciation": "IPA pronunciation /ˈeksəmpl/",
  "exampleSentence": "An IELTS-style example sentence using the word",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "antonyms": ["antonym1", "antonym2"],
  "collocations": ["collocation1 with example", "collocation2 with example"],
  "wordFamily": ["related word forms like noun form, verb form"],
  "verbConjugation": {
    "base": "base form of verb (omit if not a verb)",
    "pastSimple": "past simple form",
    "pastParticiple": "past participle form",
    "presentParticiple": "present participle (-ing) form",
    "thirdPersonSingular": "third person singular (-s) form"
  }
}

IMPORTANT: Only include verbConjugation if the word is a verb. If the word is not a verb, omit verbConjugation entirely or set it to null.`
}

export const VOCABULARY_QUIZ_SYSTEM_PROMPT = 'You are an IELTS vocabulary quiz creator. Always respond with valid JSON only.'

export function buildVocabularyQuizPrompt(
  words: string | string[],
  meaning = '',
  exampleSentence = '',
  synonyms: string[] = [],
  collocations: string[] = [],
): string {
  const wordList = Array.isArray(words) ? words : [words]
  const wordLabel = wordList.join(', ')
  return `Create 3 quiz questions for the IELTS vocabulary word${wordList.length > 1 ? 's' : ''} "${wordLabel}".
${meaning ? `Meaning: ${meaning}\n` : ''}${exampleSentence ? `Example: ${exampleSentence}\n` : ''}${synonyms.length ? `Synonyms: ${synonyms.join(', ')}\n` : ''}${collocations.length ? `Collocations: ${collocations.join(', ')}\n` : ''}
Respond with valid JSON:
{
  "questions": [
    {
      "type": "meaning" | "gap-fill" | "synonym" | "collocation",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Correct answer text",
      "explanation": "Why this is correct"
    }
  ]
}`
}

export function getVersionInfo(): PromptVersion {
  return VOCAB_PROMPT_VERSION
}
