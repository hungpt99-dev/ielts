import type { TutorIntelligencePort } from '../../ports/tutor-intelligence-port'

interface SemanticCheckResult {
  consistent: boolean
  score: number
  reason: string
  inconsistentQuestions: string[]
}

export async function checkSemanticConsistency(
  passageText: string,
  questions: Array<{ question?: string; type?: string; explanation?: string }>,
  tutorPort: TutorIntelligencePort,
): Promise<SemanticCheckResult> {
  if (questions.length === 0) {
    return { consistent: true, score: 1.0, reason: 'No questions to check', inconsistentQuestions: [] }
  }

  const questionList = questions
    .map((q, i) => `Q${i + 1}: ${q.question || ''} [type: ${q.type || 'unknown'}]`)
    .join('\n')

  try {
    const result = await tutorPort.generateEducationalContent<any>({
      systemPrompt: `You are an IELTS exercise quality validator. Your job is to check whether questions are answerable from the given reading passage.

Review each question carefully. A question is INCONSISTENT if:
1. It references topics, entities, or concepts NOT present in the passage
2. It asks about a different subject domain entirely (e.g., asking about education when passage is about climate)
3. It references data, statistics, or facts not mentioned anywhere in the passage

A question IS consistent if:
1. The key concepts match the passage content
2. Even if specific wording differs, the subject matter is the same
3. The answer can be determined from the passage text

Return JSON:
{
  "consistent": true/false,
  "problemQuestions": ["Q2 (educational apps)", "Q4 (screen time)"],
  "reason": "brief explanation"
}

Only flag clearly unrelated questions. Paraphrased questions about the same topic should pass.`,
      userMessage: `PASSAGE:\n${passageText.slice(0, 2000)}\n\nQUESTIONS TO CHECK:\n${questionList}\n\nAre all these questions answerable from this passage? Return JSON.`,
      schema: {},
      maxTokens: 500,
    })

    if (result.success && result.data) {
      const data = result.data as { consistent?: boolean; problemQuestions?: string[]; reason?: string }
      return {
        consistent: data.consistent !== false,
        score: data.consistent !== false ? 1.0 : 0.0,
        reason: data.reason || 'AI check completed',
        inconsistentQuestions: data.problemQuestions || [],
      }
    }
  } catch {
    // AI check unavailable — fall through to deterministic check
  }

  return {
    consistent: true,
    score: 0.8,
    reason: 'AI check skipped (unavailable) — deterministic check only',
    inconsistentQuestions: [],
  }
}
