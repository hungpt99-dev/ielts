export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'StorageError'
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, public override cause?: unknown) {
    super(message, cause)
    this.name = 'ValidationError'
  }
}

export class MigrationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'MigrationError'
  }
}

export class BackupError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'BackupError'
  }
}

export class EntityNotFoundError extends StorageError {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" not found`)
    this.name = 'EntityNotFoundError'
  }
}

export class DuplicateEntityError extends StorageError {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" already exists`)
    this.name = 'DuplicateEntityError'
  }
}

export class DatabaseClosedError extends StorageError {
  constructor() {
    super('Database is closed. Call getDb() to open a connection first.')
    this.name = 'DatabaseClosedError'
  }
}
