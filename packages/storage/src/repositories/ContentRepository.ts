import { BaseRepository } from './BaseRepository'
import {
  ieltsTopicSchema,
  exampleSentenceSchema,
  readingPassageSchema,
  listeningTranscriptSchema,
  writingPromptSchema,
  speakingQuestionSchema,
  studyNoteSchema,
  customStudyPlanSchema,
  usefulPhraseSchema,
  aiContentSchema,
  publicApiContentSchema,
  passageEntrySchema,
} from '../schema'
import type { z } from 'zod'

export type IeltsTopic = z.infer<typeof ieltsTopicSchema>
export type ExampleSentence = z.infer<typeof exampleSentenceSchema>
export type ReadingPassage = z.infer<typeof readingPassageSchema>
export type ListeningTranscript = z.infer<typeof listeningTranscriptSchema>
export type WritingPrompt = z.infer<typeof writingPromptSchema>
export type SpeakingQuestion = z.infer<typeof speakingQuestionSchema>
export type StudyNote = z.infer<typeof studyNoteSchema>
export type CustomStudyPlan = z.infer<typeof customStudyPlanSchema>
export type UsefulPhrase = z.infer<typeof usefulPhraseSchema>
export type AiContent = z.infer<typeof aiContentSchema>
export type PublicApiContent = z.infer<typeof publicApiContentSchema>
export type PassageEntry = z.infer<typeof passageEntrySchema>

export class IeltsTopicRepository extends BaseRepository<IeltsTopic> {
  constructor() {
    super('ieltsTopics', ieltsTopicSchema)
  }

  async findBySkill(skill: IeltsTopic['skill']): Promise<IeltsTopic[]> {
    return this.queryByIndex('skill', skill)
  }
}

export class ExampleSentenceRepository extends BaseRepository<ExampleSentence> {
  constructor() {
    super('exampleSentences', exampleSentenceSchema)
  }

  async findByVocabularyId(vocabularyId: string): Promise<ExampleSentence[]> {
    return this.queryByIndex('vocabularyId', vocabularyId)
  }

  async findFavorites(): Promise<ExampleSentence[]> {
    const all = await this.findAll()
    return all.filter(e => e.isFavorite)
  }
}

export class ReadingPassageRepository extends BaseRepository<ReadingPassage> {
  constructor() {
    super('readingPassages', readingPassageSchema)
  }

  async findByTopic(topic: string): Promise<ReadingPassage[]> {
    return this.queryByIndex('topic', topic)
  }

  async findByDifficulty(difficulty: ReadingPassage['difficulty']): Promise<ReadingPassage[]> {
    return this.queryByIndex('difficulty', difficulty)
  }
}

export class ListeningTranscriptRepository extends BaseRepository<ListeningTranscript> {
  constructor() {
    super('listeningTranscripts', listeningTranscriptSchema)
  }

  async findByTopic(topic: string): Promise<ListeningTranscript[]> {
    return this.queryByIndex('topic', topic)
  }
}

export class WritingPromptRepository extends BaseRepository<WritingPrompt> {
  constructor() {
    super('writingPrompts', writingPromptSchema)
  }

  async findByTaskType(taskType: WritingPrompt['taskType']): Promise<WritingPrompt[]> {
    return this.queryByIndex('taskType', taskType)
  }
}

export class SpeakingQuestionRepository extends BaseRepository<SpeakingQuestion> {
  constructor() {
    super('speakingQuestions', speakingQuestionSchema)
  }

  async findByPart(part: SpeakingQuestion['part']): Promise<SpeakingQuestion[]> {
    return this.queryByIndex('part', part)
  }
}

export class StudyNoteRepository extends BaseRepository<StudyNote> {
  constructor() {
    super('studyNotes', studyNoteSchema)
  }
}

export class CustomStudyPlanRepository extends BaseRepository<CustomStudyPlan> {
  constructor() {
    super('customStudyPlans', customStudyPlanSchema)
  }

  async findActive(): Promise<CustomStudyPlan | undefined> {
    const results = await this.queryByIndex('isActive', 1 as never)
    return results[0]
  }
}

export class UsefulPhraseRepository extends BaseRepository<UsefulPhrase> {
  constructor() {
    super('usefulPhrases', usefulPhraseSchema)
  }
}

export class AiContentRepository extends BaseRepository<AiContent> {
  constructor() {
    super('aiContents', aiContentSchema)
  }
}

export class PublicApiContentRepository extends BaseRepository<PublicApiContent> {
  constructor() {
    super('publicApiContent', publicApiContentSchema)
  }
}

export class PassageEntryRepository extends BaseRepository<PassageEntry> {
  constructor() {
    super('passages', passageEntrySchema)
  }
}

import { contentMetaSchema, userContentEditSchema } from '../schema'

export type ContentMeta = z.infer<typeof contentMetaSchema>
export type UserContentEdit = z.infer<typeof userContentEditSchema>

export class ContentMetaRepository extends BaseRepository<ContentMeta> {
  constructor() {
    super('contentMeta', contentMetaSchema)
  }

  async findByPackId(packId: string): Promise<ContentMeta | undefined> {
    const results = await this.queryByIndex('packId', packId)
    return results[0]
  }

  async findSeededPacks(): Promise<ContentMeta[]> {
    return this.findAll()
  }

  async isPackSeeded(packId: string, version: number): Promise<boolean> {
    const meta = await this.findByPackId(packId)
    return meta !== undefined && meta.packVersion >= version
  }

  async markPackSeeded(packId: string, packName: string, version: number, count: number): Promise<ContentMeta> {
    const now = new Date().toISOString()
    const existing = await this.findByPackId(packId)
    if (existing) {
      const updated = {
        ...existing,
        packVersion: version,
        contentCount: count,
        updatedAt: now,
      }
      await this.update(existing.id, updated)
      return updated
    }
    return this.create({
      packId,
      packName,
      packVersion: version,
      contentCount: count,
      seededAt: now,
      updatedAt: now,
    })
  }
}

export class UserContentEditRepository extends BaseRepository<UserContentEdit> {
  constructor() {
    super('userContentEdits', userContentEditSchema)
  }

  async findByOriginalId(originalId: string): Promise<UserContentEdit | undefined> {
    const results = await this.queryByIndex('originalId', originalId)
    return results[0]
  }

  async findByContentType(contentType: string): Promise<UserContentEdit[]> {
    return this.queryByIndex('contentType', contentType)
  }

  async hasUserEdit(originalId: string): Promise<boolean> {
    const edit = await this.findByOriginalId(originalId)
    return edit !== undefined
  }

  async findUserEditsByTable(tableName: string): Promise<UserContentEdit[]> {
    return this.queryByIndex('tableName', tableName)
  }
}
