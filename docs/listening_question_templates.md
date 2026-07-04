# Listening Question Templates

> Extended question types and templates for listening exercises, designed to increase question count and variety per exercise.

---

## 1. Question Types Overview

The current `ListeningQuestionType` supports `multiple-choice` and `gap-fill`. The following new types are designed to be compatible with the existing `ListeningQuestion` interface, requiring only an extension of the type union.

**Proposed `ListeningQuestionType` additions:**

| Type | Description | New fields |
|------|-------------|------------|
| `true-false` | True / False / Not Given statements | `options?` (reused for the 3 choices) |
| `short-answer` | Short written response (1–3 words) | `acceptableAnswers?` on model, or reuse `blanks` |
| `multiple-answer` | Select N correct options from a list | `correctAnswer` as `number[]` |
| `sentence-completion` | Complete sentences from the recording (multiple gaps) | `blanks` (already supported) |
| `table-completion` | Fill cells in a structured table from the recording | `blanks`, `rows`, `columns` (new optional field) |

---

## 2. Type: True / False / Not Given

### Format

A statement is provided. The candidate selects **True** (the recording confirms it), **False** (the recording contradicts it), or **Not Given** (the recording does not address it).

### Data Structure (compatible with `ListeningQuestion`)

```typescript
{
  id: string
  type: 'true-false'
  question: string          // The statement to evaluate
  options: ['True', 'False', 'Not Given']
  correctAnswer: number     // Index into options: 0=True, 1=False, 2=Not Given
  explanation: string
}
```

### Example Questions

**Exercise: "University Orientation Talk" (Exercise e1)**

| # | Statement | Correct |
|---|-----------|---------|
| 1 | The autumn term includes a one-week break in November. | True (0) |
| 2 | Seminars are longer than lectures. | True (0) |
| 3 | First-year students have twenty contact hours per week. | False (1) |
| 4 | The student wellbeing centre charges a fee for counselling. | False (1) |
| 5 | The careers service only helps with internship applications. | Not Given (2) |
| 6 | The library is open 24 hours on weekends during exam periods. | Not Given (2) |

---

## 3. Type: Short Answer

### Format

A question is posed that requires a short written answer, typically 1–3 words or a number. The answer must be extracted verbatim (or acceptably paraphrased) from the recording.

### Data Structure (compatible with `ListeningQuestion`)

```typescript
{
  id: string
  type: 'short-answer'
  question: string          // The question (e.g., "What time does the direct flight depart?")
  correctAnswer: string     // The verbatim answer
  acceptableAnswers?: string[] // Alternative correct answers (extends model)
  explanation: string
}
```

> Note: For full compatibility with the current `ListeningQuestion` interface (without adding `acceptableAnswers`), use `blanks: [correctAnswer]` and consider the blank field as the answer container. The UI renderer would interpret `short-answer` similarly to `gap-fill` but with a single free-text input.

### Example Questions

**Exercise: "Travel Booking Conversation" (Exercise e3)**

| # | Question | Answer |
|---|----------|--------|
| 1 | What is the flight number of the direct flight? | BA two-oh-three |
| 2 | What seat number has the customer booked? | twelve A |
| 3 | From which terminal does the flight depart? | Terminal five |
| 4 | How much does business class cost? | one thousand two hundred |
| 5 | What time does the morning flight depart? | eight thirty |

**Exercise: "Climate Change Discussion" (Exercise e2)**

| # | Question | Answer |
|---|----------|--------|
| 1 | What is the primary cause of sea-level rise mentioned first? | thermal expansion |
| 2 | By what year could sea levels rise by 60-100 cm? | 2100 |
| 3 | What percentage of global electricity comes from solar and wind? | ten percent |
| 4 | What is the professor's department? | Environmental Science |
| 5 | What year have many countries targeted for net-zero emissions? | 2050 |

---

## 4. Type: Multiple Answer

### Format

A question is presented with a list of options. The candidate must select **all** correct answers (commonly 2 or 3 out of 5–7 options). This is distinct from `multiple-choice` where exactly one option is correct.

### Data Structure (compatible with `ListeningQuestion` — with `correctAnswer` as `string` using comma-separated indices)

```typescript
{
  id: string
  type: 'multiple-answer'
  question: string
  options: string[]         // All available choices
  correctAnswer: string     // Comma-separated indices of correct options, e.g., "1,3,4"
  explanation: string
}
```

> Note: `correctAnswer` currently accepts `string | number | string[]`. The value `"1,3,4"` (a string) is compatible. Alternatively, `correctAnswer` could be `number[]` — the model already supports `string[]`.

### Example Questions

**Exercise: "Urban Planning Lecture" (Exercise e4)**

Which THREE essential services are mentioned as part of the 15-minute city model?

- [ ] Banks (0)
- [x] Grocery stores (1)
- [x] Healthcare facilities (2)
- [x] Schools (3)
- [ ] Restaurants (4)
- [ ] Gyms (5)
- [ ] Libraries (6)

> Correct: `1,2,3`

**Exercise: "Climate Change Discussion" (Exercise e2)**

Which TWO factors are mentioned as causes of sea-level rise?

- [x] Thermal expansion of seawater (0)
- [ ] Increased rainfall (1)
- [ ] Melting of glaciers and ice sheets (2)
- [ ] Underwater volcanic activity (3)
- [ ] Changes in ocean currents (4)

> Correct: `0,2`

**Exercise: "Job Interview Tips" (Exercise e5)**

Which THREE of the following tips does Helen mention?

- [x] Research the company thoroughly (0)
- [ ] Wear formal clothing (1)
- [x] Practice responses to common questions (2)
- [x] Prepare thoughtful questions to ask (3)
- [ ] Bring multiple copies of your CV (4)
- [ ] Arrive 30 minutes early (5)

> Correct: `0,2,3`

---

## 5. Type: Sentence Completion

### Format

A set of incomplete sentences paraphrasing the recording. The candidate fills each blank with words from the recording. This extends the existing `gap-fill` pattern but uses multiple blanks per question group, or a single question with multiple standalone blanks.

### Data Structure (fully compatible with existing model)

```typescript
{
  id: string
  type: 'gap-fill'          // Reuses existing type with extended question text
  question: string          // Contains multiple "________" placeholders
  correctAnswer: string     // Unused; blanks field is the source of truth
  blanks: string[]          // Array of correct words in order
  explanation: string
}
```

### Example Questions

**Exercise: "Climate Change Discussion" (Exercise e2)**

Complete the sentences below. Write **ONE WORD ONLY** for each answer.

> "Over the past century, global sea levels have risen by approximately 1. ________ centimetres. Scientists predict that by the year 2. ________ , sea levels could rise by a further sixty to one hundred centimetres. Extreme weather events have become more 3. ________ and 4. ________ ."

```
blanks: ['nineteen', '2100', 'frequent', 'intense']
```

**Exercise: "Urban Planning Lecture" (Exercise e4)**

Complete the summary below. Write **NO MORE THAN TWO WORDS** for each answer.

> "The 1. ________ city model proposes that residents can access essential services within a 2. ________ walk or bike ride. Barcelona's 3. ________ model is a key example, where groups of 4. ________ city blocks are transformed into pedestrian-friendly zones, resulting in a 5. ________ percent reduction in air pollution."

```
blanks: ['fifteen-minute', 'fifteen-minute', 'superblock', 'nine', 'twenty-five']
```

---

## 6. Type: Table Completion

### Format

A table with missing cells is displayed. The candidate fills each cell based on information from the recording. This is particularly well-suited to exercises with comparative or categorical data (e.g., comparing options, time schedules, prices).

### Data Structure (requires minor extension to `ListeningQuestion`)

```typescript
{
  id: string
  type: 'table-completion'
  question: string          // Instruction text
  tableHeaders: string[]    // Column headers (new optional field)
  tableRows: {              // New optional field
    label: string           // Row label
    blanks: string[]        // Missing cell answers (left-to-right)
  }[]
  correctAnswer: string     // Unused; answers are in tableRows
  blanks: string[]          // Flattened answers from all rows (for scoring)
  explanation: string
}
```

### Example Questions

**Exercise: "Travel Booking Conversation" (Exercise e3)**

Complete the table below. Write **NO MORE THAN TWO WORDS AND/OR A NUMBER** for each answer.

| Flight Option | Departure Time | Arrival Time | Price (economy) | Price (business) |
|---------------|----------------|--------------|-----------------|------------------|
| Via Singapore | 1. ________ | 6:00 PM | — | — |
| Direct | 11:15 PM | 2. ________ | 3. ________ | 4. ________ |

```
blanks: ['eight thirty', '9:00 AM', 'six hundred and eighty', 'one thousand two hundred']
```

**Exercise: "University Orientation Talk" (Exercise e1)**

Complete the table below. Write **NO MORE THAN ONE WORD AND/OR A NUMBER** for each answer.

| Term | Duration | Key Feature |
|------|----------|-------------|
| Autumn | September – December | 1. ________ week in 2. ________ |
| Spring | January – 3. ________ | — |
| Summer | April – June | — |

```
blanks: ['reading', 'November', 'March']
```

---

## 7. Template Combinations per Exercise

To generate longer exercises, combine types across a single transcript. Below is a recommended template for each existing exercise:

### Exercise e1: University Orientation Talk (15 questions)

| # | Type | Topic |
|---|------|-------|
| 1–4 | gap-fill | Existing questions (reading week, seminars, assessment, library) |
| 5–7 | true-false | Academic calendar statements |
| 8–9 | short-answer | Support services (wellbeing centre, careers service) |
| 10–12 | sentence-completion | Assessment method details (3–4 blanks) |
| 13–15 | multiple-answer | Which services are mentioned? |

### Exercise e2: Climate Change Discussion (15 questions)

| # | Type | Topic |
|---|------|-------|
| 1–2 | gap-fill | Existing questions (sea levels, hurricanes) |
| 3 | multiple-choice | Existing question (species at risk) |
| 4 | gap-fill | Existing question (renewable energy) |
| 5–7 | true-false | Statements about sea-level, hurricanes, biodiversity |
| 8–10 | short-answer | Causes, predictions, targets |
| 11–12 | multiple-answer | Which consequences are discussed? Causes of sea-level rise? |
| 13–15 | sentence-completion | Summary paragraph with 4–5 blanks |

### Exercise e3: Travel Booking Conversation (15 questions)

| # | Type | Topic |
|---|------|-------|
| 1–2 | gap-fill | Existing questions (arrival date, departure time) |
| 3 | gap-fill | Existing question (ticket price) |
| 4 | multiple-choice | Existing question (terminal) |
| 5 | gap-fill | Existing question (arrival time before departure) |
| 6–8 | true-false | Flight details, meals, seat selection |
| 9–10 | short-answer | Flight number, seat number |
| 11–13 | table-completion | Flight options table (3 rows × 4 columns) |
| 14–15 | multiple-answer | Which services are included with the ticket? |

### Exercise e4: Urban Planning Lecture (15 questions)

| # | Type | Topic |
|---|------|-------|
| 1 | multiple-choice | Existing question (15-minute city) |
| 2–3 | gap-fill | Existing questions (air pollution, city blocks) |
| 4–6 | true-false | Superblock model statements |
| 7–9 | short-answer | Specific facts about Barcelona, green infrastructure |
| 10–11 | multiple-answer | Which features are part of green infrastructure? |
| 12–15 | sentence-completion | Summary paragraph with ~6 blanks |

### Exercise e5: Job Interview Tips (15 questions)

| # | Type | Topic |
|---|------|-------|
| 1 | gap-fill | Existing question (present-past-future framework) |
| 2 | multiple-choice | Existing question (non-verbal communication %) |
| 3 | gap-fill | Existing question (thank-you email timing) |
| 4–6 | true-false | Interview tips statements |
| 7–9 | short-answer | Key details (firm handshake, eye contact, etc.) |
| 10–12 | multiple-answer | Which tips does Helen mention? |
| 13–15 | sentence-completion | Tips summary paragraph |

---

## 8. Model Extension Plan

To fully support all new types, the `ListeningQuestion` interface requires:

```typescript
// apps/web/src/models/index.ts

export type ListeningQuestionType =
  | 'multiple-choice'
  | 'gap-fill'
  | 'true-false'
  | 'short-answer'
  | 'multiple-answer'
  | 'table-completion'

export interface TableRow {
  label: string
  blanks: string[]
}

export interface ListeningQuestion {
  id: string
  type: ListeningQuestionType
  question: string
  options?: string[]
  correctAnswer: string | number | string[]
  acceptableAnswers?: string[]   // NEW — for short-answer alternatives
  tableHeaders?: string[]        // NEW — for table-completion
  tableRows?: TableRow[]         // NEW — for table-completion
  explanation: string
  blanks?: string[]
}
```

The `TableRow` type supports multiple answer cells per row; `blanks` on the question can mirror the flattened answers for scoring engines that read from a single array.

---

## 9. Scoring Rules

| Type | Scoring logic |
|------|---------------|
| `true-false` | Exact match on option index (same as multiple-choice) |
| `short-answer` | Case-insensitive exact match against `correctAnswer`. If `acceptableAnswers` is present, matches any entry. |
| `multiple-answer` | Each correct selection earns partial credit: `correctSelections / totalCorrect`. No penalty for missed selections. |
| `sentence-completion` | Each blank scored independently; partial credit for correct blanks. |
| `table-completion` | Each cell scored independently; partial credit for correct cells. |
