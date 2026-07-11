import type { PromptVersion } from './types'

function translationTarget(lang: string): string {
  return lang.trim() || 'your native language'
}

const VIDEO_PROMPT_VERSION: PromptVersion = { version: 1, description: 'Initial video/transcript prompts' }

export function buildVocabularyFromTranscriptPrompt(
  transcript: string,
  videoTitle: string,
  nativeLanguage = '',
): { systemPrompt: string; userPrompt: string } {
  const lang = translationTarget(nativeLanguage)
  const systemPrompt = 'You are an IELTS vocabulary expert. Extract useful vocabulary from video transcripts for IELTS learners. Respond with valid JSON only.'

  const userPrompt = `Extract IELTS-level vocabulary from the following video transcript.

Video Title: "${videoTitle}"

Transcript:
${transcript}

Extract 5-10 useful vocabulary words that an IELTS learner should learn. Focus on academic and topic-specific words.

Respond with valid JSON in this exact format:
{
  "words": [
    {
      "word": "the vocabulary word",
      "meaning": "clear English definition",
      "partOfSpeech": "e.g. noun, verb, adjective",
      "example": "example sentence from the transcript or IELTS-style",
      "synonyms": ["synonym1", "synonym2"],
      "collocations": ["collocation1", "collocation2"],
      "context": "the original sentence from the transcript"
    }
  ]
}`

  return { systemPrompt, userPrompt }
}

export function buildSummaryFromTranscriptPrompt(
  transcript: string,
  videoTitle: string,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = 'You are an IELTS tutor. Summarize video transcripts and extract key learning points. Respond with valid JSON only.'

  const userPrompt = `Summarize the following video transcript for IELTS learning purposes.

Video Title: "${videoTitle}"

Transcript:
${transcript}

Respond with valid JSON in this exact format:
{
  "summary": "A concise summary of the video content in 3-5 sentences suitable for IELTS listening practice",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "ieltsTopics": ["relevant IELTS topic like education, environment, technology"]
}`

  return { systemPrompt, userPrompt }
}

export function buildListeningQuestionsPrompt(
  transcript: string,
  videoTitle: string,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = 'You are an IELTS listening exam question writer. Create realistic listening comprehension questions. Respond with valid JSON only.'

  const userPrompt = `Create 3-5 IELTS listening comprehension questions based on the following video transcript.

Video Title: "${videoTitle}"

Transcript:
${transcript}

Create a mix of question types (multiple-choice, short-answer, gap-fill, true-false). Questions should test understanding of specific details and main ideas.

Respond with valid JSON in this exact format:
{
  "questions": [
    {
      "type": "multiple-choice" | "short-answer" | "gap-fill" | "true-false",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct answer",
      "explanation": "Explanation with reference to the transcript",
      "bandScore": "Estimated IELTS band range, e.g. 5.0-6.0"
    }
  ]
}

Requirements:
- Questions must be answerable from the transcript content
- Include at least one gap-fill or short-answer question
- Options are only needed for multiple-choice questions
- Provide clear explanations`

  return { systemPrompt, userPrompt }
}

export function buildShadowingScriptsPrompt(
  transcript: string,
  nativeLanguage = '',
): { systemPrompt: string; userPrompt: string } {
  const lang = translationTarget(nativeLanguage)
  const systemPrompt = 'You are an IELTS speaking coach. Create shadowing practice scripts from video transcripts. Respond with valid JSON only.'

  const userPrompt = `Create shadowing practice sentences from the following transcript. Select 5-8 sentences that are useful for IELTS speaking practice.

Transcript:
${transcript}

Choose sentences that:
- Contain useful IELTS vocabulary and expressions
- Have clear pronunciation patterns
- Are natural and conversational
- Vary in length and structure

Respond with valid JSON in this exact format:
{
  "scripts": [
    {
      "sentence": "The original sentence for shadowing practice",
      "translation": "translation in ${lang}",
      "focusWords": ["word1", "word2"],
      "notes": "Pronunciation or intonation notes"
    }
  ]
}`

  return { systemPrompt, userPrompt }
}

export function getVersionInfo(): PromptVersion {
  return VIDEO_PROMPT_VERSION
}
