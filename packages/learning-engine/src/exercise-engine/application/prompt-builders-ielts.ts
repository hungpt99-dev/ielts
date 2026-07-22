import { PASSAGE_WORD_LIMITS } from '../domain/ielts/reading-schemas'
import type { ReadingPassageProfile, ReadingQuestionPlan } from '../domain/ielts/ielts-types'

function resolvePassageLength(): { minWords: number; maxWords: number } {
  return PASSAGE_WORD_LIMITS
}

function buildDifficultyGuidance(targetBand: number): string {
  if (targetBand <= 5.5) {
    return `DIFFICULTY: Band 4.5–5.5
- Mostly direct retrieval; shorter sentences; light paraphrasing; few competing details.
- Vocabulary: common academic words; avoid rare or technical terms.
- Sentences: mostly simple and compound; avoid long subordinate clauses.`
  }
  if (targetBand <= 6.5) {
    return `DIFFICULTY: Band 5.5–6.5
- Moderate paraphrasing; some inference; plausible distractors; references across sentences; denser information.
- Vocabulary: frequent academic vocabulary; occasional less-common words defined by context.
- Sentences: mix of compound and complex; some sentences with 2+ clauses.
- Include subtle contrasts and qualified claims.`
  }
  // Band 6.5-7.5+
  return `DIFFICULTY: Band 6.5–7.5+
- Strong paraphrasing; cross-paragraph reasoning; subtle distinctions; complex reference tracking.
- Qualified claims; plausible competing interpretations.
- Vocabulary: less-common academic words and phrases where meaning is clear from context.
- Sentences: varied length and complexity; some sentences with 3+ clauses.
- Information is dense and interconnected across paragraphs.`
}

export function buildReadingPassagePrompt(
  _difficulty: string,
  questionCount: number,
  topic?: string,
  options?: {
    targetBand?: number
    passageProfile?: ReadingPassageProfile
    questionPlan?: ReadingQuestionPlan
  },
): { systemPrompt: string; userMessage: string } {
  const band = options?.targetBand ?? 5.5
  const { minWords, maxWords } = resolvePassageLength()
  const profile = options?.passageProfile
  const plan = options?.questionPlan

  const difficultyGuide = buildDifficultyGuidance(band)

  const profileGuidance = profile ? buildProfileGuidance(profile) : ''
  const planGuidance = plan ? buildPlanGuidance(plan) : ''

  return {
    systemPrompt: `You are an IELTS reading examiner and content creator. Generate IELTS-style Reading task groups for the supplied passage.

Target band: ${band}
Question count: ${questionCount}

${difficultyGuide}

${profileGuidance}
${planGuidance}

PASSAGE REQUIREMENTS:
- Write ${minWords}–${maxWords} words of natural academic or general-interest prose — NOT a textbook summary.
- Choose a clear central topic and develop it meaningfully across 4–6 paragraphs.
- Each paragraph MUST serve a DISTINCT rhetorical function. Use a VARIED mix:
  * background / context
  * cause-and-effect reasoning
  * comparison or contrast between ideas
  * evidence from research, studies, or data
  * a concrete example or case study
  * limitation, critique, or qualification
  * consequence or implication
  * a competing interpretation or alternative view
  * chronological development
- Include relationships between ideas: cause/effect, contrast, qualification, comparison, chronology, uncertainty, competing explanations.
- Avoid generic closing sentences like "This shows how important the topic is." End with substance.
- Avoid excessive repetition of the topic keyword — use synonyms, pronouns, and varied expressions.
- The content must be original. Do NOT copy published IELTS materials.

QUESTION QUALITY RULES:
- NO MORE THAN 40% of questions may be direct sentence-level retrieval.
- Use STRONG but FAIR paraphrasing: questions must NOT copy long phrases directly from the passage.
- Cover DIFFERENT sections of the passage — do NOT cluster all questions around one or two paragraphs.
- Do NOT test the same fact twice.
- Include inference, main idea, paragraph purpose, reference, comparison, or cross-paragraph reasoning when supported by the passage.
- Generate PLAUSIBLE distractors based on passage content (nearby-detail, partial-truth, wrong-paragraph, reversed-cause-effect, overgeneralization, misinterpreted-reference).
- Distinguish False from Not Given correctly — False MUST directly contradict the passage.
- Avoid repeated absolute-word traps (only, all, always, never, completely, eliminated) in False statements.
- Ensure question difficulty MATCHES the passage and target band.
- Provide structured evidence and explanations for EVERY question.
- Return ONLY valid JSON matching the provided schema.

QUESTION REQUIREMENTS:
- Generate ${questionCount} questions in coherent task groups (1–3 groups).
- Each task group must have one shared instruction and questions of the SAME type.
- Do NOT randomly alternate unrelated question types within a task group.
- Include a balanced mix of question SKILLS:
  * specific-detail (maximum ${Math.floor(questionCount * 0.4)} questions)
  * paraphrase (1–2 questions)
  * main-idea (1 question)
  * inference (1 question)
  * cause-effect or comparison (1 question)
  * paragraph-purpose or writer-purpose (1 question when passage has 4+ paragraphs)
  * reference or vocabulary-in-context (1 question when passage supports it)
- For Band 6.5+: include at least one cross-paragraph-synthesis question.

TASK-GROUP-SPECIFIC RULES:

TRUE / FALSE / NOT GIVEN (for groups of 3+):
- MUST include at least one True, one False, and one Genuine Not Given.
- True: the statement agrees with the passage information.
- False: the passage DIRECTLY CONTRADICTS the statement, not merely differs. Do NOT rely on obvious absolute words like "only", "all", "always", "never" — use SUBTLER contradictions based on paraphrased details and qualified claims.
- Not Given: the passage genuinely lacks information to decide. The statement must feel plausible but be unverifiable. The passage must NOT contain the information needed to determine truth or falsehood.
- Each statement MUST contain ONE testable claim. Do NOT put two independent claims joined by "and".
- For every TFNG question, include:
  * "answer": "true" | "false" | "not-given"
  * "supportingParagraphIds": list of paragraph IDs
  * "supportingText": relevant passage text (null for Not Given)
  * "missingInformation": what is missing (for Not Given only)
  * "explanation": clear justification
- Avoid predictable answer patterns (e.g. T-T-F-NG-T is fine but vary naturally).

MULTIPLE CHOICE (single answer):
- 4 options (A–D). One clearly correct; three plausible distractors of SIMILAR LENGTH and grammatical form.
- Distractors must originate from the passage:
  * nearby-detail: a correct fact from the wrong sentence
  * partial-truth: partially correct but missing a key qualification
  * wrong-paragraph: information from a different paragraph
  * reversed-cause-effect: swaps cause and effect
  * overgeneralization: takes a specific case and generalizes too far
  * misinterpreted-reference: misunderstands what a pronoun or reference points to
  * unsupported-inference: a reasonable-sounding claim not actually supported
- Do NOT include absurd options or answers based only on common knowledge.
- Include at least: one paragraph-purpose question, one inference question, and one specific-detail question.

SENTENCE COMPLETION / GAP FILL:
- Use "NO MORE THAN TWO WORDS AND/OR A NUMBER" (or as specified).
- The completed sentence must be grammatical.
- Answers must appear verbatim or closely in the passage.
- Use PARAPHRASED question wording — do NOT copy the surrounding sentence from the passage.
- Each sentence must have ONE gap (marked "______").
- Validate singular/plural and number forms match the passage.
- Do NOT use the same sentence location for multiple answers.

SHORT ANSWER:
- These are OPEN QUESTIONS ending with "?". Example: "What phrase is used to describe camels?"
- They are NOT gap-fill sentences. Do NOT use "______" markers.
- Use "NO MORE THAN THREE WORDS AND/OR A NUMBER".
- Answers must be phrases taken directly from the passage.

MATCHING HEADINGS:
- MUST include at least 3 target paragraphs with a shared heading bank.
- MUST have MORE headings than paragraphs (at least 1–2 extra plausible but unused headings).
- Headings must represent paragraph MAIN IDEAS, not isolated details.
- Each paragraph gets exactly one heading; no duplicate assignments.
- An isolated single heading question is NOT a valid Matching Headings task.

EVIDENCE:
- Every question MUST include evidence: { "paragraphId": "A", "supportingText": "relevant passage text" }
- For Not Given: supportingText may be null, but the explanation must specify what information is missing.
- Evidence must point to the correct paragraph.

EXPLANATIONS:
- Explain WHY the correct answer is correct, referencing the relevant paraphrase.
- For False: explicitly state what the passage says that contradicts the statement.
- For Not Given: identify what information is not provided.
- Avoid generic text like "This is correct according to the passage."

Return ONLY valid JSON in this exact structure:
{
  "title": "passage title",
  "passage": "full passage text (${minWords}–${maxWords} words)",
  "paragraphs": [
    { "id": "A", "content": "paragraph text", "index": 0 }
  ],
  "taskGroups": [
    {
      "id": "group-1",
      "type": "true-false-not-given",
      "startNumber": 1,
      "endNumber": 4,
      "instructions": ["Do the following statements agree with the information given in the reading passage?", "Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this."],
      "questions": [
        {
          "id": "q1",
          "number": 1,
          "type": "true-false-not-given",
          "statement": "The passage claims that X leads to Y.",
          "correctAnswer": "true",
          "skill": "paraphrase",
          "explanation": "Paragraph B states 'Y occurs as a direct result of X', which agrees with the statement.",
          "evidence": { "paragraphId": "B", "supportingText": "Y occurs as a direct result of X" }
        }
      ]
    }
  ]
}

For each question type also include "skill" field: one of "main-idea", "specific-detail", "paraphrase", "inference", "reference", "writer-purpose", "paragraph-purpose", "comparison", "cause-effect", "vocabulary-in-context", "reference-tracking", "cross-paragraph-synthesis", or "information-location".

Labels: Use "IELTS-style practice" or "IELTS-format practice" — never "official IELTS".`,

    userMessage: `Create an original IELTS-style reading passage about "${topic || 'a topic suitable for academic or general-interest reading'}" at Band ${band} difficulty.

- Passage: ${minWords}–${maxWords} words with 4–6 paragraphs serving distinct functions.
- Questions: ${questionCount} questions in coherent task groups (${questionCount <= 5 ? '1 group' : questionCount <= 8 ? '1–2 groups' : '2–3 groups'}).
- Use a mix of: true-false-not-given, multiple-choice-single, sentence-completion, and/or short-answer as appropriate.
- If using matching-headings, include at least 3 paragraphs and more headings than paragraphs.
- Include a genuine Not Given answer in any TFNG group of 3+.
- Use strong paraphrasing, varied vocabulary, and plausible distractors.
- Question difficulty MUST match the passage difficulty (Band ${band}).

Return only valid JSON matching the provided schema.`,
  }
}

export function buildTrueFalseNotGivenPrompt(
  difficulty: string,
  count: number,
  passageContext: string,
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS reading task creator. Generate ${count} true-false-not-given questions based on the provided passage.

CRITICAL RULES:
- "true" = the statement agrees with information in the passage
- "false" = the statement directly CONTRADICTS information in the passage — use paraphrased details for subtle contradictions
- "not-given" = the passage provides insufficient information to determine; the statement must feel plausible but be unverifiable
- For ${count >= 4 ? `groups of ${count}: include at least one true, one false, AND one genuine not-given` : 'include a realistic mix'}
- DO NOT rely on absolute words (only, all, always, never) to create false statements — use subtler contradictions
- Each statement must contain ONE testable claim — do NOT join two independent claims with "and"
- Provide evidence paragraph ID and supporting text for each answer
- For not-given: supportingText may be null but explanation must specify missing information
- Include a "skill" field for each question

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q-N",
      "number": N,
      "type": "true-false-not-given",
      "statement": "clear single-claim statement",
      "correctAnswer": "true" | "false" | "not-given",
      "skill": "paraphrase" | "inference" | "specific-detail",
      "explanation": "detailed explanation with passage reference",
      "evidence": { "paragraphId": "A", "supportingText": "relevant text or null for NG" }
    }
  ]
}`,
    userMessage: `Based on this passage, generate ${count} true-false-not-given questions at ${difficulty} difficulty. ${count >= 4 ? 'Ensure at least one True, one False, and one genuine Not Given.' : ''}\n\n${passageContext.slice(0, 2500)}`,
  }
}

export function buildMultipleChoicePrompt(
  difficulty: string,
  count: number,
  passageContext: string,
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS reading task creator. Generate ${count} multiple-choice questions (single answer) based on the provided passage.

RULES:
- Each question has 4 options (A, B, C, D) of SIMILAR length and grammatical form
- Exactly one option is correct per question
- Distractors must be plausible and originate from the passage:
  * a nearby but incorrect detail
  * incomplete interpretation
  * reversed cause and effect
  * wrong paragraph's information
  * overgeneralisation
  * partially supported claim
  * confused example
- No absurd distractors or answers based only on common knowledge
- Include a mix: main-idea, specific-detail, inference, writer-purpose, vocabulary-in-context, cause-effect
- Provide an explanation for why the correct answer is right
- Include "skill" field for each question

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q-N",
      "number": N,
      "type": "multiple-choice-single",
      "question": "clear question text",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0,
      "skill": "main-idea" | "specific-detail" | "inference" | "writer-purpose" | "comparison" | "cause-effect" | "vocabulary-in-context",
      "explanation": "why this answer is correct, referencing the passage",
      "evidence": { "paragraphId": "A", "supportingText": "relevant text" }
    }
  ]
}`,
    userMessage: `Based on this passage, generate ${count} multiple-choice questions at ${difficulty} difficulty with varied skills:\n\n${passageContext.slice(0, 2500)}`,
  }
}

export function buildSentenceCompletionPrompt(
  difficulty: string,
  count: number,
  passageContext: string,
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS reading task creator. Generate ${count} sentence completion questions based on the provided passage.

RULES:
- Each sentence has ONE gap (marked as "______" in the sentence)
- Answers must appear verbatim or with minor reformulation in the passage
- Use "NO MORE THAN TWO WORDS AND/OR A NUMBER" word limit as default
- Use PARAPHRASED wording — do NOT copy the whole surrounding sentence from the passage
- The completed sentence must be grammatical
- Provide acceptable alternative answers (singular/plural, number variations)
- Include paragraph evidence for each answer
- Include "skill" field for each question

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q-N",
      "number": N,
      "type": "sentence-completion",
      "sentence": "Paraphrased sentence with ______ as the gap.",
      "skill": "specific-detail" | "paraphrase",
      "wordLimit": { "maxWords": 2, "maxNumbers": 1, "instruction": "NO MORE THAN TWO WORDS AND/OR A NUMBER" },
      "gaps": [
        {
          "id": "gap-N-1",
          "correctAnswer": "exact phrase from passage",
          "acceptableAlternatives": ["acceptable variant"],
          "positionInSentence": 0
        }
      ],
      "explanation": "detailed explanation referencing paragraph and paraphrase",
      "evidence": { "paragraphId": "A", "supportingText": "relevant text" }
    }
  ]
}

IMPORTANT: These are gap-fill sentences, NOT short-answer questions. Do NOT end sentences with question marks.`,
    userMessage: `Based on this passage, generate ${count} sentence completion questions at ${difficulty} difficulty with paraphrased wording:\n\n${passageContext.slice(0, 2500)}`,
  }
}

export function buildMatchingHeadingsPrompt(
  difficulty: string,
  passageContext: string,
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS reading task creator. Generate a matching headings task based on the provided passage.

CRITICAL RULES — A VALID Matching Headings task MUST have:
- At least 3 target paragraphs
- MORE headings than paragraphs (at least 2 extra unused headings)
- A SHARED heading bank (all headings listed together)
- Unique assignments (each paragraph gets exactly one heading)
- Headings that represent MAIN IDEAS, not isolated details
- Plausible unused headings that could fit a paragraph's theme but miss the MAIN idea

An isolated single heading question is NOT valid Matching Headings.

Return ONLY valid JSON:
{
  "type": "matching-headings",
  "paragraphs": [
    { "id": "A", "content": "first paragraph text" },
    { "id": "B", "content": "second paragraph text" },
    { "id": "C", "content": "third paragraph text" }
  ],
  "headings": [
    { "id": "h1", "text": "heading i: concise main idea (5-12 words)" },
    { "id": "h2", "text": "heading ii" },
    { "id": "h3", "text": "heading iii" },
    { "id": "h4", "text": "heading iv (unused)" },
    { "id": "h5", "text": "heading v (unused)" }
  ],
  "correctMatches": { "A": "h1", "B": "h3", "C": "h2" },
  "explanation": "explanation of correct matches"
}`,
    userMessage: `Create a matching headings task for this passage at ${difficulty} difficulty with at least 3 paragraphs and more headings than paragraphs:\n\n${passageContext.slice(0, 2500)}`,
  }
}

// ============================================================
// LISTENING PROMPT BUILDERS (unchanged)
// ============================================================

export function buildListeningExercisePrompt(
  difficulty: string,
  questionCount: number,
  partType: 'social-conversation' | 'social-monologue' | 'educational-conversation' | 'academic-monologue',
  topic?: string,
): { systemPrompt: string; userMessage: string } {
  const partDescriptions: Record<string, string> = {
    'social-conversation': 'Part 1 style: conversation between two speakers in an everyday social context (e.g., booking accommodation, asking for information)',
    'social-monologue': 'Part 2 style: one speaker giving information in an everyday social context (e.g., guided tour, public announcement)',
    'educational-conversation': 'Part 3 style: conversation between 2-4 speakers in an educational/training context (e.g., students discussing a project, tutor and student)',
    'academic-monologue': 'Part 4 style: one speaker giving an academic-style lecture or presentation',
  }

  return {
    systemPrompt: `You are an IELTS listening task creator. Generate a complete IELTS listening exercise with a transcript and ${questionCount} questions at ${difficulty} difficulty.

TYPE: ${partDescriptions[partType] || 'General listening practice'}

CRITICAL RULES:
- Generate ORIGINAL content, not copied from any source
- The transcript must include ${partType.includes('conversation') ? '2 speakers with natural turn-taking, interruptions, and clarification' : 'one speaker with clear academic/topical progression'}
- Questions must follow the ORDER in which answers appear in the transcript
- Include realistic distractors: speaker corrections, changed times, rejected proposals, similar-sounding options
- DO NOT make the answer obvious by repeating the exact question phrase right before it
- Include dates, prices, names, locations, or numbers where contextually appropriate
- ALL answers must be directly supported by the transcript

Return ONLY valid JSON:
{
  "title": "exercise title",
  "transcript": [
    { "speakerId": "speaker1", "text": "...", "startTimeSeconds": 0, "endTimeSeconds": 5 }
  ],
  "speakers": [
    { "id": "speaker1", "name": "Speaker Name", "role": "speaker" }
  ],
  "durationSeconds": 300,
  "partType": "${partType}",
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "type": "multiple-choice-single",
      "question": "question text",
      "options": ["A", "B", "C"],
      "correctIndex": 0,
      "explanation": "explanation",
      "answerTimestamp": 15
    }
  ]
}

Labels: "IELTS-style listening practice" or "IELTS-format practice" - never "official IELTS"`,
    
    userMessage: `Create an IELTS listening ${partType.replace(/-/g, ' ')} exercise${topic ? ` about "${topic}"` : ''} at ${difficulty} difficulty with ${questionCount} questions.`,
  }
}

// ============================================================
// WRITING PROMPT BUILDERS (unchanged)
// ============================================================

export function buildWritingTask1AcademicPrompt(
  difficulty: string,
  chartType: string,
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS writing task creator. Generate an Academic Writing Task 1 exercise with ${chartType} data at ${difficulty} difficulty.

Return ONLY valid JSON:
{
  "title": "chart title",
  "taskType": "${chartType}",
  "instructions": ["Summarise the information by selecting and reporting the main features, and make comparisons where relevant."],
  "wordLimit": { "min": 150 },
  "recommendedMinutes": 20,
  "visualData": {
    "type": "${getVisualDataType(chartType)}",
    "title": "chart title",
    "units": "percentage" or "number" or null,
    "categories": ["Category 1", "Category 2", "Category 3"],
    "series": [
      { "name": "Series 1", "values": [25, 40, 35] }
    ]
  },
  "expectedKeyFeatures": [
    "overall trend or most noticeable feature",
    "specific comparison between two categories",
    "anomaly or unusual data point"
  ]
}${getVisualDataType(chartType) === 'process' ? ',\n  "visualData": {\n    "type": "process",\n    "title": "process title",\n    "processStages": [\n      { "id": "s1", "name": "Stage name", "description": "description", "nextStageId": "s2" }\n    ]\n  }' : getVisualDataType(chartType) === 'map' ? ',\n  "visualData": {\n    "type": "map",\n    "title": "map title",\n    "mapStates": [\n      { "id": "before", "label": "Before", "period": "1990", "features": [{"description": "feature", "location": "north"}] }\n    ]\n  }' : ''}`,
    
    userMessage: `Create an IELTS Academic Writing Task 1 (${chartType}) at ${difficulty} difficulty with internally consistent data and clear trends.`,
  }
}

export function buildWritingTask1GeneralPrompt(
  difficulty: string,
  letterType: 'formal' | 'semi-formal' | 'informal',
): { systemPrompt: string; userMessage: string } {
  const registerDescriptions = {
    'formal': 'formal letter (e.g., to a manager, company, or official)',
    'semi-formal': 'semi-formal letter (e.g., to a colleague, landlord, or acquaintance)',
    'informal': 'informal letter (e.g., to a friend or family member)',
  }

  return {
    systemPrompt: `You are an IELTS writing task creator. Generate a General Training Writing Task 1 with a ${registerDescriptions[letterType]}.

Return ONLY valid JSON:
{
  "title": "letter task title",
  "taskType": "general-task-1-${letterType}-letter",
  "situation": "clear description of the situation",
  "recipient": "who the letter is to",
  "requiredPoints": [
    "first required bullet point",
    "second required bullet point",
    "third required bullet point"
  ],
  "instructions": ["Write at least 150 words.", "You do NOT need to write any addresses."],
  "wordLimit": { "min": 150 },
  "recommendedMinutes": 20
}

Include exactly THREE required points the learner must address.`,
    
    userMessage: `Create an IELTS General Training Writing Task 1 (${registerDescriptions[letterType]}) at ${difficulty} difficulty.`,
  }
}

export function buildWritingTask2Prompt(
  difficulty: string,
  essayType: string,
  topic?: string,
): { systemPrompt: string; userMessage: string } {
  const essayTypeInstructions: Record<string, string> = {
    'opinion': 'Clearly ask for the learner\'s opinion on a debatable statement. Use phrasing like "To what extent do you agree or disagree?"',
    'discussion': 'Present two contrasting views on an issue. Ask the learner to discuss both views AND give their own opinion.',
    'advantages-disadvantages': 'Present a situation or trend. Ask the learner to discuss the advantages and disadvantages.',
    'problem-solution': 'Describe a problem. Ask the learner to discuss causes/problems AND propose solutions.',
    'two-part-question': 'Ask TWO separate but related questions that the learner must both address.',
    'positive-negative-development': 'Describe a trend or development. Ask whether it is a positive or negative development.',
  }

  return {
    systemPrompt: `You are an IELTS writing task creator. Generate a Writing Task 2 (${essayType}) essay question at ${difficulty} difficulty.

ESSAY TYPE INSTRUCTION: ${essayTypeInstructions[essayType] || 'Standard essay'}

Return ONLY valid JSON:
{
  "title": "essay title",
  "taskType": "task-2-${essayType}",
  "prompt": "the full essay question/prompt",
  "instructions": ["Give reasons for your answer and include any relevant examples from your own knowledge or experience.", "Write at least 250 words."],
  "wordLimit": { "min": 250 },
  "recommendedMinutes": 40,
  "expectedDimensions": ["dimension the learner should address", "another dimension"],
  "sampleOutline": "A very brief outline of what a good answer might cover - for validation only, DO NOT show to learner"
}

The prompt must CLEARLY ask for the specific essay type. Do NOT use vague wording that could apply to multiple types.`,
    
    userMessage: `Create an IELTS Writing Task 2 (${essayType}) essay question${topic ? ` about "${topic}"` : ''} at ${difficulty} difficulty.`,
  }
}

function getVisualDataType(chartType: string): string {
  if (chartType.includes('line-graph')) return 'line-chart'
  if (chartType.includes('bar-chart')) return 'bar-chart'
  if (chartType.includes('pie-chart')) return 'pie-chart'
  if (chartType.includes('table')) return 'table'
  if (chartType.includes('mixed')) return 'mixed-chart'
  if (chartType.includes('process')) return 'process'
  if (chartType.includes('map')) return 'map'
  return 'bar-chart'
}

function buildProfileGuidance(profile: ReadingPassageProfile): string {
  const funcs = profile.paragraphFunctions
    .map(pf => `  Paragraph ${pf.paragraphId}: ${pf.functions.join(', ')}`)
    .join('\n')

  return `PASSAGE ANALYSIS:
- Word count: ${profile.wordCount} (${profile.paragraphCount} paragraphs)
- Estimated difficulty: Band ${profile.estimatedBandRange.minimum.toFixed(1)}–${profile.estimatedBandRange.maximum.toFixed(1)}
- Lexical complexity: ${(profile.lexicalComplexity * 100).toFixed(0)}%
- Syntactic complexity: ${(profile.syntacticComplexity * 100).toFixed(0)}%
- Reference tracking demand: ${(profile.referenceTrackingDemand * 100).toFixed(0)}%
- Cross-paragraph connections: ${(profile.crossParagraphConnections * 100).toFixed(0)}%
Paragraph functions detected:
${funcs}

Use this analysis to generate questions that MATCH the passage difficulty.`
}

function buildPlanGuidance(plan: ReadingQuestionPlan): string {
  const taskGroupLines = plan.taskGroups.map(g =>
    `  ${g.type}: ${g.questionCount} questions (skills: ${g.skills.join(', ')})`
  ).join('\n')

  return `QUESTION PLAN:
- Total questions: ${plan.totalQuestions} across ${plan.taskGroups.length} task group(s)
- Required skills: ${plan.requiredSkills.join(', ')}
- Maximum direct retrieval ratio: ${Math.round(plan.maximumDirectRetrievalRatio * 100)}%
Task groups:
${taskGroupLines}

Follow this plan EXACTLY. Do NOT generate only direct-retrieval questions.`
}

export function buildFullPassageSimulationPrompt(
  questionCount: number,
  topic?: string,
  options?: {
    targetBand?: number
    passageProfile?: ReadingPassageProfile
    questionPlan?: ReadingQuestionPlan
  },
): { systemPrompt: string; userMessage: string } {
  const band = options?.targetBand ?? 5.5
  const profile = options?.passageProfile
  const plan = options?.questionPlan

  const difficultyGuide = buildDifficultyGuidance(band)
  const profileGuidance = profile ? buildProfileGuidance(profile) : ''
  const planGuidance = plan ? buildPlanGuidance(plan) : ''

  return {
    systemPrompt: `Generate one IELTS Reading Full Passage Simulation.

PASSAGE: 700–950 words, 4–6 paragraphs with distinct functions (contrast, cause-effect, evidence, examples, qualification, competing views). Original academic/general-interest prose. No textbook summaries, generic closings, or repeated keywords.

QUESTIONS: Exactly ${questionCount} questions across 2–3 coherent task groups. Each group uses ONE question type with shared instructions. Distribute across passage paragraphs. Max ${Math.floor(questionCount * 0.4)} direct-retrieval. Include: inference, paraphrase, paragraph-purpose, main-idea, cause-effect/comparison, reference-tracking.

RULES:
- Strong paraphrasing — no passage copy-paste.
- Plausible distractors from passage content.
- TFNG: at least one True, False, Genuine Not Given per group of 4+. Not Given = genuinely missing info. One claim per statement. No absolute-word traps.
- MC: use "correctIndex" (0-3). 4 options of similar length, one correct, three passage-based distractors.
- Completion: one gap "______" per sentence, answers verbatim in passage, paraphrased prompt.
- Matching: more items than targets, extra unused options.
- Every question: { paragraphId, supportingText, skill, explanation }. Null supportingText for Not Given.

OUTPUT JSON:
{
  "title": "...",
  "passage": "...",
  "paragraphs": [{"id":"A","content":"...","index":0}],
  "taskGroups": [
    {
      "id":"group-1", "type":"true-false-not-given", "startNumber":1, "endNumber":4,
      "instructions":["Do the following statements agree...","TRUE if...","FALSE if...","NOT GIVEN if..."],
      "questions": [{
        "id":"q1","number":1,"type":"true-false-not-given",
        "statement":"...","correctAnswer":"true",
        "skill":"paraphrase","explanation":"...",
        "evidence":{"paragraphId":"B","supportingText":"..."}
      }]
    },
    {
      "id":"group-2", "type":"multiple-choice-single", "startNumber":5, "endNumber":8,
      "instructions":["Choose the correct letter, A, B, C or D."],
      "questions": [{
        "id":"q5","number":5,"type":"multiple-choice-single",
        "question":"...","options":["A","B","C","D"],
        "correctIndex":0,
        "skill":"inference","explanation":"...",
        "evidence":{"paragraphId":"A","supportingText":"..."}
      }]
    }
  ]
}

Task types: true-false-not-given, yes-no-not-given, multiple-choice-single, sentence-completion, short-answer, matching-headings, matching-information, matching-features, matching-sentence-endings, summary-completion, note-completion, table-completion, flow-chart-completion.

Skills: main-idea, specific-detail, paraphrase, inference, reference, writer-purpose, paragraph-purpose, comparison, cause-effect, vocabulary-in-context, reference-tracking, cross-paragraph-synthesis, information-location.

${difficultyGuide}
${profileGuidance}
${planGuidance}
Return ONLY valid JSON.`,

    userMessage: `Full Passage Simulation: "${topic || 'a topic suitable for academic reading'}" at Band ${band}.

Write 700–950 words. Generate exactly ${questionCount} questions in 2–3 task groups. Strong paraphrasing, plausible distractors, genuine Not Given. Return JSON only.`,
  }
}
