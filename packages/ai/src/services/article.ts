import { callAI } from '../client'
import type { ProviderConfig } from '../client/types'
import { buildArticleQuestionPrompt, ARTICLE_QUESTION_SYSTEM_PROMPT } from '../prompts'
import { articleQuestionSchema } from '../schemas'
import type { ArticleQuestionSet } from '../schemas'
import { AiGenerateResultCache, extractJSON } from '../utils'

const articleCache = new AiGenerateResultCache<ArticleQuestionSet>({ ttlMs: 30 * 60 * 1000 })

export { articleCache }

export async function generateArticleQuestions(
  articleContent: string,
  articleTitle: string,
  topic: string,
  questionCount: number,
  getConfig: () => ProviderConfig,
): Promise<{ data: ArticleQuestionSet | null; error: string | null }> {
  const cacheKey = AiGenerateResultCache.generateKey('article-questions', articleTitle, topic, String(questionCount))
  const cached = articleCache.get(cacheKey)
  if (cached) return { data: cached, error: null }

  const config = getConfig()

  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const userPrompt = buildArticleQuestionPrompt(
    articleContent,
    articleTitle,
    topic,
    questionCount,
  )

  try {
    const { content, error } = await callAI(ARTICLE_QUESTION_SYSTEM_PROMPT, userPrompt, getConfig, {
      maxTokens: 2000,
    })
    if (error) return { data: null, error }

    const json = extractJSON(content!)
    const parsed = JSON.parse(json)
    const result = articleQuestionSchema.safeParse(parsed)
    if (!result.success) {
      return { data: null, error: 'AI response had unexpected format. Try again.' }
    }

    articleCache.set(cacheKey, result.data)
    return { data: result.data, error: null }
  } catch (err: unknown) {
    console.error('packages/ai/src/services/article.ts error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return { data: null, error: 'Network error. Check your internet connection and API endpoint.' }
    }
    return { data: null, error: `AI request failed: ${message}` }
  }
}
