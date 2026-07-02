export class LearningEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LearningEngineError'
  }
}
