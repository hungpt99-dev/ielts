Additional requirement: User Data Collection and Local Browser Database

The website must allow users to manually collect, input, manage, import, and export their own learning data. All user data must be saved locally in the browser database. Do not use any backend.

User can add and manage data such as:

* IELTS topics
* Vocabulary words
* Example sentences
* Grammar notes
* Reading passages
* Listening transcripts
* Writing prompts
* Speaking questions
* Mistakes
* Study notes
* Daily learning tasks
* Custom study plans
* Useful phrases
* AI-generated content
* Personal progress records

Each feature page should allow the user to:

* Add new data
* Edit existing data
* Delete data
* Search data
* Filter data
* Tag data by topic, skill, difficulty, or status
* Mark data as favorite, difficult, learned, or needs review

Local database requirements:

* Use IndexedDB as the main browser database.
* Use Dexie.js or another clean IndexedDB wrapper.
* Use localStorage only for small settings.
* Data must persist after page refresh and browser restart.
* Design clean database tables/models.
* Add database versioning and migration support.
* Validate imported data before saving.
* Prevent app crash from corrupted local data.
* Show clear error messages when import/export fails.

Import/export requirements:

* Export all user data as a JSON backup file.
* Import data from a JSON backup file.
* Allow partial import by feature if possible.
* Support merge mode and replace mode:

  * Merge mode keeps existing data and adds imported data.
  * Replace mode clears existing data and restores imported data.
* Show confirmation before replacing data.
* Show import summary: added, updated, skipped, failed.
* Add reset all data option with confirmation.
* Make the backup format versioned for future compatibility.

UX requirements:

* Provide a Data Management page in Settings.
* Add buttons for Export Backup, Import Backup, Reset Data.
* Add friendly empty states encouraging users to add their own learning material.
* Make forms simple, fast, and mobile-friendly.
* Add autosave where useful, especially for writing drafts and notes.
* Add toast notifications after save, update, delete, import, and export actions.

Important:

* No backend.
* No cloud sync.
* No account system.
* All learning data belongs to the user and stays in their browser unless they export it manually.
