export interface TopicCluster {
  id: string
  topic: string
  centralWords: string[]
  relatedWords: string[]
  depth: number
}

export function createTopicCluster(input: TopicCluster): TopicCluster {
  return { ...input }
}
