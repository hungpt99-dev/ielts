import type { LearningSourceContent } from '../domain/entities/learning-activity'
import { normalizeContent, type ContentValidationResult } from './content-normalizer'

export type ContentSourceType = 'article' | 'selected-text' | 'youtube-transcript' | 'note' | 'saved-content' | 'manual-text'

export interface ContentAdapter {
  readonly sourceType: ContentSourceType
  supports(content: LearningSourceContent): boolean
  normalize(raw: Partial<LearningSourceContent>): ContentValidationResult
  extractKeyPoints(content: LearningSourceContent): string[]
  estimateDifficulty(content: LearningSourceContent): number
}

export class ArticleContentAdapter implements ContentAdapter {
  readonly sourceType: ContentSourceType = 'article'

  supports(content: LearningSourceContent): boolean {
    return content.type === 'article'
  }

  normalize(raw: Partial<LearningSourceContent>): ContentValidationResult {
    return normalizeContent(raw)
  }

  extractKeyPoints(content: LearningSourceContent): string[] {
    const sentences = content.text.split(/[.!?]+/).filter(s => s.trim().length > 20)
    return sentences.slice(0, 5).map(s => s.trim())
  }

  estimateDifficulty(_content: LearningSourceContent): number {
    return 5
  }
}

export class YouTubeTranscriptAdapter implements ContentAdapter {
  readonly sourceType: ContentSourceType = 'youtube-transcript'

  supports(content: LearningSourceContent): boolean {
    return content.type === 'youtube-transcript'
  }

  normalize(raw: Partial<LearningSourceContent>): ContentValidationResult {
    return normalizeContent(raw)
  }

  extractKeyPoints(content: LearningSourceContent): string[] {
    const lines = content.text.split('\n').filter(l => l.trim().length > 10)
    return lines.slice(0, 5).map(l => l.trim())
  }

  estimateDifficulty(_content: LearningSourceContent): number {
    return 6
  }
}

export class SavedVocabularyAdapter implements ContentAdapter {
  readonly sourceType: ContentSourceType = 'saved-content'

  supports(content: LearningSourceContent): boolean {
    return content.type === 'saved-content' || content.type === 'note'
  }

  normalize(raw: Partial<LearningSourceContent>): ContentValidationResult {
    return normalizeContent(raw)
  }

  extractKeyPoints(content: LearningSourceContent): string[] {
    const words = content.text.split(/[\s,]+/).filter(w => w.length > 3)
    return words.slice(0, 10)
  }

  estimateDifficulty(_content: LearningSourceContent): number {
    return 4
  }
}

export class ContentSourceRegistry {
  private adapters = new Map<ContentSourceType, ContentAdapter>()

  constructor() {
    this.register(new ArticleContentAdapter())
    this.register(new YouTubeTranscriptAdapter())
    this.register(new SavedVocabularyAdapter())
  }

  register(adapter: ContentAdapter): void {
    this.adapters.set(adapter.sourceType, adapter)
  }

  getAdapter(content: LearningSourceContent): ContentAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.supports(content)) return adapter
    }
    return undefined
  }

  getRegisteredTypes(): ContentSourceType[] {
    return Array.from(this.adapters.keys())
  }
}
