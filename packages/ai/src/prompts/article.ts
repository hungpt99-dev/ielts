import type { PromptVersion } from './types'

const ARTICLE_PROMPT_VERSION: PromptVersion = { version: 1, description: 'Initial article question prompts' }

export function buildArticleQuestionPrompt(
  articleContent: string,
  articleTitle: string,
  topic: string,
  questionCount: number,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = 'You are an IELTS exam question writer. Always respond with valid JSON only, no other text.'

  const userPrompt = `Generate ${questionCount} IELTS-style questions based on the following article.

Article Title: "${articleTitle}"
${topic ? `Topic: ${topic}\n` : ''}
Article Content:
${articleContent}

Create a mix of IELTS Reading question types. Each question must be realistic and match the style of real IELTS exams.

Respond with valid JSON in this exact format:
{
  "questions": [
    {
      "type": "multiple-choice" | "true-false" | "short-answer" | "gap-fill" | "matching",
      "question": "The question text",
      "passage": "Relevant passage from the article if needed (optional)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct answer",
      "explanation": "Explanation of why this is correct with reference to the article",
      "skill": "reading",
      "difficulty": "easy" | "medium" | "hard",
      "bandScore": "Estimated IELTS band score range, e.g. 5.0-6.0"
    }
  ]
}

Requirements:
- Questions must be based on the actual article content
- Mix of question types
- Realistic IELTS difficulty
- Include the relevant passage reference when applicable
- Clear explanations referencing the text`

  return { systemPrompt, userPrompt }
}

export function getVersionInfo(): PromptVersion {
  return ARTICLE_PROMPT_VERSION
}
