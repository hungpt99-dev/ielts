export interface SavedContentRepository {
  getUnusedContent(): Promise<Array<{ id: string; type: string; topic?: string }>>
}
