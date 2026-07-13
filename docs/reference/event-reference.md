# Event Reference

## SharedLearningEvent (`@ielts/shared`)

Cross-package event contract. Produced by one engine and consumed by others.

| Event Type | Producer | Consumer(s) | Payload Key Fields |
|---|---|---|---|
| `learning_session_created` | learning-engine | ai-tutor-engine, storage | `sessionId`, `skill` |
| `learning_session_started` | learning-engine | ai-tutor-engine, storage | `sessionId`, `skill` |
| `learning_session_paused` | learning-engine | ai-tutor-engine | `sessionId` |
| `learning_session_completed` | learning-engine | all | `sessionId`, `skill`, `score`, `accuracy` |
| `learning_session_abandoned` | learning-engine | ai-tutor-engine | `sessionId`, `skill` |
| `exercise_generated` | learning-engine | ai-tutor-engine | `sessionId`, `exerciseId`, `skill` |
| `exercise_completed` | learning-engine | ai-tutor-engine | `sessionId`, `exerciseId`, `skill`, `score` |
| `answer_evaluated` | learning-engine | ai-tutor-engine | `questionId`, `status`, `score` |
| `mistake_detected` | learning-engine | ai-tutor-engine, mistakes | `mistakeId`, `skill`, `category` |
| `mistake_repeated` | learning-engine | ai-tutor-engine, mistakes | `mistakeId`, `skill`, `category`, `recurrenceCount` |
| `vocabulary_saved` | web-app | ai-tutor-engine | `wordId`, `word` |
| `vocabulary_reviewed` | web-app | ai-tutor-engine | `wordId`, `word`, `correct` |
| `vocabulary_mastered` | vocabulary | ai-tutor-engine | `wordId`, `word` |
| `vocabulary_review_due` | vocabulary | ai-tutor-engine | `wordIds[]` |
| `skill_improved` | learning-engine | ai-tutor-engine | `skill`, `previousAccuracy`, `currentAccuracy` |
| `difficulty_changed` | learning-engine | ai-tutor-engine | `skill`, `previousDifficulty`, `newDifficulty` |
| `roadmap_task_fulfilled` | learning-engine | ai-tutor-engine | `roadmapTaskId`, `accuracy` |
| `task_started` | web-app | ai-tutor-engine | `taskId`, `skill` |
| `task_completed` | web-app | ai-tutor-engine | `taskId`, `skill`, `durationMinutes` |
| `task_missed` | web-app | ai-tutor-engine | `taskId`, `skill` |
| `task_rescheduled` | web-app | ai-tutor-engine | `taskId`, `oldDate`, `newDate` |
| `writing_reviewed` | ai-tutor-engine | ai-tutor-engine | `draftId`, `estimatedBand` |
| `speaking_session_completed` | ai-tutor-engine | ai-tutor-engine | `sessionId`, `estimatedBand` |
| `content_saved` | web-app | ai-tutor-engine | `contentId`, `contentType` |
| `roadmap_generated` | learning-engine | ai-tutor-engine | `totalWeeks`, `targetBand` |
| `roadmap_updated` | learning-engine | ai-tutor-engine | `changeType` |
| `progress_milestone` | learning-engine | ai-tutor-engine | `milestoneType`, `value` |
| `tutor_message_sent` | ai-tutor-engine | — | `sessionId`, `mode` |
| `tutor_recommendation_accepted` | ai-tutor-engine | — | `recommendationId` |
| `tutor_recommendation_dismissed` | ai-tutor-engine | — | `recommendationId` |
| `user_returned` | web-app | ai-tutor-engine | `inactiveDays` |

## LearningEvent (`@ielts/learning-engine`)

Engine-internal events. Not exposed outside the learning engine.

| Event Type | Payload |
|---|---|
| `learning_session_created` | `sessionId`, `skill`, `objectiveId`, `plannedDuration` |
| `learning_session_completed` | `sessionId`, `skill`, `actualDuration`, `score`, `accuracy` |
| `exercise_completed` | `sessionId`, `exerciseId`, `skill`, `score`, `maximumScore` |
| `mistake_detected` | `mistakeId`, `skill`, `category`, `recurrenceCount` |
| `skill_improved` | `skill`, `previousAccuracy`, `currentAccuracy` |
| `difficulty_changed` | `skill`, `previousDifficulty`, `newDifficulty`, `reason` |
| `roadmap_task_fulfilled` | `roadmapTaskId`, `sessionId`, `accuracy` |

## TutorEvent (`@ielts/ai-tutor-engine`)

Tutor-internal events.

| Event Type | Payload |
|---|---|
| `proactive_message_generated` | Full `ProactiveMessage` object |
| `proactive_message_shown` | `messageId` |
| `proactive_message_dismissed` | `messageId` |
| `proactive_message_clicked` | `messageId`, `actionType?` |
| `proactive_message_expired` | `messageId` |
| `proactive_intervention` | `interventions[]` with `{title, message, priority}` |
| `tutor_chat_started` | `sessionId`, `mode`, `source` |
| `tutor_chat_message_sent` | `sessionId`, `messageId` |
| `tutor_memory_updated` | `updatedFields[]` |
| `tutor_recommendation_made` | `recommendationType`, `title` |
| `tutor_settings_changed` | `changedFields[]` |
| `next_best_action_selected` | `actionType`, `skill?`, `reason` |
