export interface MigrationRecord {
  version: string
  appliedAt: string
  description: string
  success: boolean
}

export interface Migration {
  version: string
  description: string
  up(): Promise<void>
  down?(): Promise<void>
}

export class MigrationRunner {
  private migrations: Migration[] = []
  private applied: MigrationRecord[] = []

  register(migration: Migration): void {
    this.migrations.push(migration)
  }

  getPending(): Migration[] {
    const appliedVersions = new Set(this.applied.map(r => r.version))
    return this.migrations
      .filter(m => !appliedVersions.has(m.version))
      .sort((a, b) => a.version.localeCompare(b.version))
  }

  async runPending(): Promise<MigrationRecord[]> {
    const results: MigrationRecord[] = []
    for (const migration of this.getPending()) {
      try {
        await migration.up()
        const record: MigrationRecord = {
          version: migration.version,
          appliedAt: new Date().toISOString(),
          description: migration.description,
          success: true,
        }
        results.push(record)
        this.applied.push(record)
      } catch (err) {
        const record: MigrationRecord = {
          version: migration.version,
          appliedAt: new Date().toISOString(),
          description: migration.description,
          success: false,
        }
        results.push(record)
        throw err
      }
    }
    return results
  }
}
