export type WordRelationshipType =
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'word-family'
  | 'topic'

export interface WordRelationship {
  sourceWord: string
  targetWord: string
  relationshipType: WordRelationshipType
}
