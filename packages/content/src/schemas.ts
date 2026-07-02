import { z } from 'zod'

export const contentTypeSchema = z.enum([
  'reading-passage',
  'writing-prompt',
  'speaking-question',
  'listening-transcript',
  'vocabulary-list',
  'grammar-note',
  'useful-phrase',
  'ielts-topic',
  'example-sentence',
])

export const importExportModeSchema = z.enum(['merge', 'replace'])

export const contentPackMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  version: z.number().min(1),
  contentType: contentTypeSchema,
  itemCount: z.number().default(0),
  tags: z.array(z.string()).default([]),
})

export const contentFilterSchema = z.object({
  query: z.string().optional(),
  contentType: z.union([contentTypeSchema, z.array(contentTypeSchema)]).optional(),
  skill: z.union([z.string(), z.array(z.string())]).optional(),
  topic: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: z.union([z.string(), z.array(z.string())]).optional(),
  tags: z.array(z.string()).optional(),
  isBuiltIn: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  packId: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
})

export const exportContentOptionsSchema = z.object({
  contentType: z.union([contentTypeSchema, z.array(contentTypeSchema)]).optional(),
  packIds: z.array(z.string()).optional(),
  includeUserEdits: z.boolean().default(true),
})

export const importContentOptionsSchema = z.object({
  mode: importExportModeSchema,
  validate: z.boolean().default(true),
  dedup: z.boolean().default(true),
})
