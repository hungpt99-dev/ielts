import { describe, it, expect } from 'vitest'
import {
  buildExplainPrompt,
  AI_EXPLAIN_LABELS,
  AI_EXPLAIN_PROMPTS,
} from '../prompts/explain'
import { buildVocabularyDetailsPrompt, buildVocabularyQuizPrompt } from '../prompts/vocabulary'
import { buildArticleQuestionPrompt } from '../prompts/article'
import {
  buildVocabularyFromTranscriptPrompt,
  buildSummaryFromTranscriptPrompt,
  buildListeningQuestionsPrompt,
  buildShadowingScriptsPrompt,
} from '../prompts/video'
import { buildDictionaryEntryPrompt } from '../prompts/dictionary'

describe('Explain prompt', () => {
  it('builds simple explain prompt', () => {
    const { systemPrompt, userPrompt } = buildExplainPrompt('simple', 'Hello world')
    expect(systemPrompt).toContain('IELTS tutor')
    expect(userPrompt).toContain('Hello world')
    expect(userPrompt).toContain('valid JSON')
  })

  it('builds translate explain prompt', () => {
    const { systemPrompt, userPrompt } = buildExplainPrompt('translate', 'text')
    expect(systemPrompt).toContain('Translate')
    expect(userPrompt).toContain('translation')
  })

  it('builds ielts vocab prompt', () => {
    const { systemPrompt } = buildExplainPrompt('ielts-vocab', 'text')
    expect(systemPrompt).toContain('vocabulary')
  })

  it('builds grammar explain prompt', () => {
    const { systemPrompt } = buildExplainPrompt('grammar', 'text')
    expect(systemPrompt).toContain('grammar')
  })

  it('builds rewrite prompt', () => {
    const { systemPrompt } = buildExplainPrompt('rewrite', 'text')
    expect(systemPrompt).toContain('writing tutor')
  })

  it('builds example sentences prompt', () => {
    const { systemPrompt } = buildExplainPrompt('example-sentences', 'text')
    expect(systemPrompt).toContain('teacher')
  })

  it('builds quiz prompt', () => {
    const { systemPrompt } = buildExplainPrompt('quiz', 'text')
    expect(systemPrompt).toContain('examiner')
  })

  it('includes JSON schema in user prompt', () => {
    const { userPrompt } = buildExplainPrompt('quiz', 'text')
    expect(userPrompt).toContain('"correctAnswer"')
  })

  it('uses the provided text in the prompt', () => {
    const { userPrompt } = buildExplainPrompt('simple', 'Custom text for testing')
    expect(userPrompt).toContain('Custom text for testing')
  })

  it('exports all AI explain labels', () => {
    expect(AI_EXPLAIN_LABELS.simple).toBe('Simple English')
    expect(AI_EXPLAIN_LABELS.translate).toBe('Translation')
    expect(AI_EXPLAIN_LABELS['ielts-vocab']).toBe('IELTS Vocabulary')
    expect(AI_EXPLAIN_LABELS.grammar).toBe('Grammar Explanation')
    expect(AI_EXPLAIN_LABELS.rewrite).toBe('Natural Rewrite')
    expect(AI_EXPLAIN_LABELS['example-sentences']).toBe('Example Sentences')
    expect(AI_EXPLAIN_LABELS.quiz).toBe('Quiz Questions')
  })

  it('exports all AI explain prompts', () => {
    expect(AI_EXPLAIN_PROMPTS.simple).toContain('simple English')
    expect(AI_EXPLAIN_PROMPTS.translate).toContain('Translate')
    expect(AI_EXPLAIN_PROMPTS.quiz).toContain('quiz')
  })
})

describe('Vocabulary prompts', () => {
  it('builds vocabulary details prompt', () => {
    const prompt = buildVocabularyDetailsPrompt('aberration')
    expect(prompt).toContain('aberration')
    expect(prompt).toContain('IELTS')
  })

  it('builds vocabulary quiz prompt', () => {
    const prompt = buildVocabularyQuizPrompt(['aberration', 'benevolent'])
    expect(prompt).toContain('aberration')
    expect(prompt).toContain('benevolent')
    expect(prompt).toContain('quiz')
  })
})

describe('Article question prompt', () => {
  it('builds article question prompt with article text', () => {
    const articleText = 'Climate change is a pressing global issue.'
    const prompt = buildArticleQuestionPrompt(articleText)
    expect(prompt).toContain(articleText)
    expect(prompt).toContain('question')
  })
})

describe('Video transcript prompts', () => {
  it('builds vocabulary from transcript prompt', () => {
    const transcript = 'The quick brown fox jumps over the lazy dog.'
    const prompt = buildVocabularyFromTranscriptPrompt(transcript)
    expect(prompt).toContain(transcript)
    expect(prompt).toContain('vocabulary')
  })

  it('builds summary from transcript prompt', () => {
    const transcript = 'Artificial intelligence is transforming industries.'
    const prompt = buildSummaryFromTranscriptPrompt(transcript)
    expect(prompt).toContain(transcript)
    expect(prompt).toContain('summary')
  })

  it('builds listening questions prompt', () => {
    const transcript = 'Lecture on marine biology.'
    const prompt = buildListeningQuestionsPrompt(transcript)
    expect(prompt).toContain(transcript)
    expect(prompt).toContain('question')
  })

  it('builds shadowing scripts prompt', () => {
    const transcript = 'Practice your pronunciation.'
    const prompt = buildShadowingScriptsPrompt(transcript)
    expect(prompt).toContain(transcript)
    expect(prompt).toContain('shadow')
  })
})

describe('Dictionary entry prompt', () => {
  it('builds dictionary entry prompt', () => {
    const prompt = buildDictionaryEntryPrompt('serendipity')
    expect(prompt).toContain('serendipity')
    expect(prompt).toContain('dictionary')
  })
})
