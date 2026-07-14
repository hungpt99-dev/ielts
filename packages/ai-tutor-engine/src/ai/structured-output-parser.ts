export interface StructuredOutputParser<TSchema> {
  parse(raw: string): Promise<{ success: true; data: TSchema } | { success: false; error: string }>
}

export class JsonSchemaParser<TSchema> implements StructuredOutputParser<TSchema> {
  async parse(raw: string): Promise<{ success: true; data: TSchema } | { success: false; error: string }> {
    try {
      const data = JSON.parse(raw) as TSchema
      return { success: true, data }
    } catch (e) {
      console.error('packages/ai-tutor-engine/src/ai/structured-output-parser.ts error:', e);
      const repaired = await this.tryRepair(raw)
      if (repaired) return { success: true, data: repaired as TSchema }
      return { success: false, error: `Failed to parse AI output: ${e instanceof Error ? e.message : 'Unknown error'}` }
    }
  }

  private async tryRepair(raw: string): Promise<unknown | null> {
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (error) {
        console.error('packages/ai-tutor-engine/src/ai/structured-output-parser.ts error:', error);
        return null
      }
    }
    return null
  }
}
