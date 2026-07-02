import { callAI } from '../client'
import type { ProviderConfig } from '../client/types'
import { buildArticleQuestionPrompt } from '../prompts'
import { articleQuestionSchema } from '../schemas'
import type { ArticleQuestionSet } from '../schemas'
import { extractJSON } from '../utils'

export async function generateArticleQuestions(
  articleContent: string,
  articleTitle: string,
  topic: string,
  questionCount: number,
  getConfig: () => ProviderConfig,
): Promise<{ data: ArticleQuestionSet | null; error: string | null }> {
  const config = getConfig()

  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const { systemPrompt, userPrompt } = buildArticleQuestionPrompt(
    articleContent,
    articleTitle,
    topic,
    questionCount,
  )

  try {
    const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
      maxTokens: 2000,
    })
    if (error) return { data: null, error }

    const json = extractJSON(content!)
    const parsed = JSON.parse(json)
    const result = articleQuestionSchema.safeParse(parsed)
    if (!result.success) {
      return { data: null, error: 'AI response had unexpected format. Try again.' }
    }

    return { data: result.data, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return { data: null, error: 'Network error. Check your internet connection and API endpoint.' }
    }
    return { data: null, error: `AI request failed: ${message}` }
  }
}
