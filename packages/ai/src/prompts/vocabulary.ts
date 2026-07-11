import type { PromptVersion } from './types'

function translationTarget(lang: string): string {
  return lang.trim() || 'your native language'
}

const VOCAB_PROMPT_VERSION: PromptVersion = { version: 1, description: 'Initial vocabulary prompts' }

export function buildVocabularyDetailsPrompt(
  word: string,
  sourceSentence: string,
  topic: string,
  nativeLanguage = '',
): { systemPrompt: string; userPrompt: string } {
  const lang = translationTarget(nativeLanguage)
  const systemPrompt = 'You are an IELTS vocabulary expert assistant. Always respond with valid JSON only, no other text.'

  const userPrompt = `Generate detailed IELTS vocabulary information for the word "${word}".

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
  "wordFamily": ["related word forms like noun form, verb form"]
}`

  return { systemPrompt, userPrompt }
}

export function buildVocabularyQuizPrompt(
  word: string,
  meaning: string,
  exampleSentence: string,
  synonyms: string[],
  collocations: string[],
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = 'You are an IELTS vocabulary quiz creator. Always respond with valid JSON only.'

  const userPrompt = `Create 3 quiz questions for the IELTS vocabulary word "${word}".
Meaning: ${meaning}
Example: ${exampleSentence}
Synonyms: ${synonyms.join(', ')}
Collocations: ${collocations.join(', ')}

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

  return { systemPrompt, userPrompt }
}

export function getVersionInfo(): PromptVersion {
  return VOCAB_PROMPT_VERSION
}
