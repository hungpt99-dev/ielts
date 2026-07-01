# IndexedDB Schema & TypeScript Data Models

## Database: `ielts-journey`

Version management via `db.ts` upgrade callback.

---

## Schema Version History

| Version | Changes                        |
|---------|--------------------------------|
| 1       | Initial schema (all stores)    |

Future migrations add new stores or indexes in the `upgrade` callback.

---

## Object Stores

### 1. `settings` (keyVal pattern)

Single settings document stored under key `"app-settings"`.

| Field              | Type     | Default     | Note                  |
|--------------------|----------|-------------|-----------------------|
| targetBand         | number   | 7.0         | Target IELTS band     |
| currentBand        | number   | 5.5         | Current estimated     |
| examDate           | string   | ""          | ISO date or empty     |
| dailyStudyMinutes  | number   | 60          | Minutes per day       |
| weakSkills         | string[] | []          | e.g. ["Writing"]      |
| preferredTopics    | string[] | []          | e.g. ["Education"]    |
| studyReminder      | string   | "Time to study IELTS!" | Reminder text  |
| aiApiKey           | string   | ""          | Optional LLM key      |
| aiProvider         | string   | "openai"    | "openai" or "custom"  |
| aiEndpoint         | string   | ""          | Custom API endpoint   |
| aiModel            | string   | "gpt-4o-mini" | Model name           |
| darkMode           | boolean  | false       | Theme preference      |
| sampleDataLoaded   | boolean  | false       | Seed data flag        |

Stored in **localStorage** (not IndexedDB) for synchronous access.

---

### 2. `vocabulary`

| Field          | Type     | Indexes                |
|----------------|----------|------------------------|
| id             | string   | PK (auto-generated)    |
| word           | string   | unique, compound:topic |
| meaning        | string   |                        |
| meaningVi      | string   |                        |
| pronunciation  | string   |                        |
| partOfSpeech   | string   | index                  |
| topic          | string   | index                  |
| exampleSentence| string   |                        |
| collocations   | string[] |                        |
| synonyms       | string[] |                        |
| antonyms       | string[] |                        |
| wordFamily     | string[] |                        |
| personalNote   | string   |                        |
| difficulty     | 'easy'|'medium'|'hard' | index     |
| status         | 'new'|'learning'|'reviewing'|'mastered' | index |
| tags           | string[] |                        |
| createdAt      | string   | ISO date               |
| updatedAt      | string   | ISO date               |

**Indexes:** `word`, `topic`, `status`, `difficulty`, `partOfSpeech`, `by-topic` (compound).

---

### 3. `vocabularyReviews`

| Field            | Type     | Notes                          |
|------------------|----------|--------------------------------|
| id               | string   | PK                             |
| vocabularyId     | string   | FK → vocabulary.id (index)     |
| interval         | number   | Days until next review         |
| easeFactor       | number   | 2.5 default, SM-2 algorithm    |
| repetitions      | number   | Consecutive correct reps       |
| nextReviewDate   | string   | ISO date (index)               |
| lastReviewDate   | string   | ISO date                       |
| history          | Array<{date, rating}> | Review log           |

**Indexes:** `vocabularyId`, `nextReviewDate` (for daily queue), `lastReviewDate`.

---

### 4. `tasks`

| Field           | Type     | Notes                         |
|-----------------|----------|-------------------------------|
| id              | string   | PK                            |
| title           | string   |                               |
| description     | string   |                               |
| category        | TaskCategory | enum below               |
| date            | string   | ISO date (index)              |
| isDone          | boolean  | default false                 |
| isRecurring     | boolean  | default false                 |
| recurringDays   | number[] | 0=Sun,1=Mon... (if recurring) |
| notes           | string   |                               |
| timeMinutes     | number   | Estimated duration            |
| createdAt       | string   | ISO date                      |
| updatedAt       | string   | ISO date                      |
| completedAt     | string   | ISO date or null              |

**Indexes:** `date`, `category`, `isDone`, `date-category` (compound).

**TaskCategory enum:**
```typescript
type TaskCategory =
  | 'Vocabulary' | 'Reading' | 'Listening'
  | 'Writing Task 1' | 'Writing Task 2'
  | 'Speaking Part 1' | 'Speaking Part 2' | 'Speaking Part 3'
  | 'Grammar' | 'Mock Test'
```

---

### 5. `readingSessions`

| Field            | Type     | Notes                          |
|------------------|----------|--------------------------------|
| id               | string   | PK                             |
| title            | string   |                                |
| topic            | string   | index                          |
| sourceUrl        | string   |                                |
| passageText      | string   |                                |
| questionType     | string   | index                          |
| totalQuestions   | number   |                                |
| correctAnswers   | number   |                                |
| accuracy         | number   | computed: correct/total        |
| timeSpentMinutes | number   |                                |
| newVocabulary    | string[] | word IDs or text               |
| summary          | string   |                                |
| mistakes         | string   |                                |
| notes            | string   |                                |
| createdAt        | string   | ISO date                       |

**Indexes:** `topic`, `questionType`, `createdAt`.

---

### 6. `listeningSessions`

| Field                | Type     | Notes                     |
|----------------------|----------|---------------------------|
| id                   | string   | PK                        |
| title                | string   |                           |
| sourceUrl            | string   |                           |
| topic                | string   | index                     |
| durationMinutes      | number   |                           |
| section              | number   | 1-4                       |
| score                | number   | out of 40                 |
| transcriptNotes      | string   |                           |
| newVocabulary        | string[] |                           |
| difficultSentences   | string   |                           |
| mistakes             | string   |                           |
| shadowingNotes       | string   |                           |
| selfRating           | number   | 1-5                       |
| createdAt            | string   | ISO date                  |

**Indexes:** `topic`, `createdAt`.

---

### 7. `writingSessions`

| Field               | Type     | Notes                          |
|---------------------|----------|--------------------------------|
| id                  | string   | PK                             |
| taskType            | 'task1'|'task2' | index            |
| question            | string   |                                |
| essay               | string   |                                |
| topic               | string   | index                          |
| wordCount           | number   |                                |
| timeSpentMinutes    | number   |                                |
| estimatedBand       | number   |                                |
| feedback            | string   |                                |
| grammarMistakes     | string   |                                |
| vocabularyMistakes  | string   |                                |
| coherenceNotes      | string   |                                |
| improvedSentences   | string   |                                |
| betterVersion       | string   | Improved essay version         |
| personalReflection  | string   |                                |
| createdAt           | string   | ISO date                       |

**Indexes:** `taskType`, `topic`, `createdAt`.

---

### 8. `speakingSessions`

| Field               | Type     | Notes                 |
|---------------------|----------|-----------------------|
| id                  | string   | PK                    |
| part                | 1|2|3    | index                 |
| question            | string   |                       |
| answerNotes         | string   |                       |
| topic               | string   | index                 |
| durationSeconds     | number   |                       |
| selfRating          | number   | 1-5                   |
| fluencyNotes        | string   |                       |
| vocabularyNotes     | string   |                       |
| grammarMistakes     | string   |                       |
| pronunciationNotes  | string   |                       |
| betterExpressions   | string   |                       |
| improvedAnswer      | string   |                       |
| createdAt           | string   | ISO date              |

**Indexes:** `part`, `topic`, `createdAt`.

---

### 9. `grammarNotes`

| Field             | Type     | Notes                 |
|-------------------|----------|-----------------------|
| id                | string   | PK                    |
| topic             | string   | index                 |
| explanation       | string   |                       |
| exampleSentences  | string[] |                       |
| commonMistakes    | string[] |                       |
| correctedExamples | string[] |                       |
| personalNote      | string   |                       |
| relatedSkill      | string   | index                 |
| status            | 'weak'|'reviewing'|'mastered' | index |
| createdAt         | string   | ISO date              |
| updatedAt         | string   | ISO date              |

**Indexes:** `topic`, `status`, `relatedSkill`.

---

### 10. `mistakes`

| Field       | Type     | Notes                          |
|-------------|----------|--------------------------------|
| id          | string   | PK                             |
| mistake     | string   |                                |
| correction  | string   |                                |
| explanation | string   |                                |
| source      | string   | Where the mistake came from    |
| date        | string   | ISO date                       |
| skill       | MistakeSkill | index                     |
| status      | 'new'|'reviewed'|'resolved' | index |
| repetitionCount | number | How often this mistake repeated |
| createdAt   | string   | ISO date                       |
| updatedAt   | string   | ISO date                       |

**MistakeSkill:**
```typescript
type MistakeSkill = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking'
```

**Indexes:** `skill`, `status`.

---

### 11. `mockTests`

| Field                   | Type     | Notes                     |
|-------------------------|----------|---------------------------|
| id                      | string   | PK                        |
| date                    | string   | ISO date                  |
| listeningScore          | number   | Band 0-9                  |
| readingScore            | number   | Band 0-9                  |
| writingBand             | number   | Band 0-9                  |
| speakingBand            | number   | Band 0-9                  |
| overallBand             | number   | Computed average          |
| notes                   | string   |                           |
| weakAreas               | string[] |                           |
| improvementPlan         | string   |                           |
| createdAt               | string   | ISO date                  |

**Indexes:** `date` (descending for timeline).

---

### 12. `topicsProgress`

Per-topic aggregated data (updated on writes to other stores).

| Field              | Type     | Notes                          |
|--------------------|----------|--------------------------------|
| id                 | string   | PK (topic name)                |
| topic              | string   | Unique                          |
| vocabularyCount    | number   |                                 |
| readingCount       | number   |                                 |
| listeningCount     | number   |                                 |
| writingCount       | number   |                                 |
| speakingCount      | number   |                                 |
| weakPoints         | string[] |                                 |
| updatedAt          | string   | ISO date                        |

**Indexes:** `topic`.

---

### 13. `passages` (Vocabulary in Context)

User-created passages for contextual vocabulary learning.

| Field              | Type     | Notes                  |
|--------------------|----------|------------------------|
| id                 | string   | PK                     |
| title              | string   |                        |
| content            | string   | Passage text           |
| highlightedWords   | string[] | word IDs or text       |
| source             | string   | 'user-created'|'pasted' |
| createdAt          | string   | ISO date               |
| updatedAt          | string   | ISO date               |

**Indexes:** `source`.

---

## Relationships

```
vocabulary ──1:1──→ vocabularyReviews
vocabulary ──M:N──→ passages (via highlightedWords)
vocabulary ──M:N──→ readingSessions (via newVocabulary)
vocabulary ──M:N──→ listeningSessions (via newVocabulary)

tasks ── standalone, no FK relationships

All journal entries (reading, listening, writing, speaking)
are standalone documents with optional string[] references
to vocabulary IDs.

topicsProgress ── aggregated view, refreshed on writes
```

---

## SM-2 Spaced Repetition Algorithm

Used for `vocabularyReviews`:

```
After rating:
  Again (0) → interval=1, easeFactor=max(1.3, ef-0.2), reps=0
  Hard  (1) → interval=1, easeFactor=max(1.3, ef-0.15), reps+=1
  Good  (2) → interval=next(reps), easeFactor unchanged, reps+=1
  Easy  (3) → interval=next(reps)*1.3, easeFactor=ef+0.15, reps+=1

Next interval:
  reps==1 → 1 day
  reps==2 → 6 days
  reps≥3  → round(interval * easeFactor)

Next review = today + interval days
```

---

## TypeScript Model Definitions

See `src/models/index.ts` for full TypeScript interfaces.
