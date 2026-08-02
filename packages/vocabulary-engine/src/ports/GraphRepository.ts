import type {
  Antonym,
  Collocation,
  Synonym,
  TopicCluster,
  WordConnection,
  WordFamilyMember,
} from '../domain/value-objects'

export interface PathFindingResult {
  wordIds: string[]
  connections: WordConnection[]
  totalWeight: number
}

export interface GraphRepository {
  saveConnection(connection: WordConnection): Promise<void>
  saveConnections(connections: WordConnection[]): Promise<void>
  deleteConnection(fromWordId: string, toWordId: string, relationship: string): Promise<void>
  getConnections(wordId: string, relationship?: string): Promise<WordConnection[]>

  getCollocations(wordId: string): Promise<Collocation[]>
  getSynonyms(wordId: string): Promise<Synonym[]>
  getAntonyms(wordId: string): Promise<Antonym[]>
  getWordFamily(wordId: string): Promise<WordFamilyMember[]>

  findPath(fromWordId: string, toWordId: string): Promise<PathFindingResult>
  getTopicClusters(topic?: string): Promise<TopicCluster[]>
}
