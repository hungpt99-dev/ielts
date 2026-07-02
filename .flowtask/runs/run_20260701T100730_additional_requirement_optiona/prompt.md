Additional requirement: Optional Public Content API Integration

Add optional public content API integration for the IELTS Learning Journey website and browser extension.

The app has no backend, so public API integration must be frontend-only and local-first.

Purpose:

* Help users retrieve useful English learning content.
* Let users import selected content into their local browser database.
* Turn imported content into IELTS vocabulary, notes, exercises, reading practice, listening practice, speaking prompts, and writing ideas.
* Do not depend on public APIs for the core app experience.

Supported public API/source types:

1. Dictionary and Vocabulary APIs
   Use public dictionary or word APIs to retrieve:

* Word meaning
* Synonyms
* Antonyms
* Related words
* Example sentences
* Word family
* Collocations if available

Possible sources:

* Wiktionary / Wikimedia API
* Datamuse API
* Tatoeba API or exports

2. Open Educational Resource APIs
   Use OER APIs to search open educational content.

Possible source:

* OER Commons API

For each imported item, store:

* source name
* source URL
* license
* attribution
* imported date
* content type

3. Open Article / Knowledge Sources
   Use open knowledge sources for reading material and IELTS topic background.

Possible sources:

* Wikipedia / Wikimedia API
* Project Gutenberg / Gutendex

Use these sources to help create:

* Reading materials
* Topic summaries
* Vocabulary lists
* Discussion questions
* Writing ideas

4. Video / Listening Sources
   For YouTube:

* Use YouTube Data API only for video metadata if needed.
* Do not assume transcript extraction always works.
* Allow user to paste transcript manually.
* User can save video URL, title, notes, and transcript.
* AI can turn transcript into listening exercises.

5. API Import Flow

The user flow should be:

User searches public API
→ App shows results
→ User previews content
→ App shows source and license
→ User chooses what to import
→ App saves selected content to IndexedDB
→ App classifies imported content by IELTS topic, skill, difficulty, and tags
→ User can generate exercises from the imported content

6. Local Storage

Imported API content must be stored locally in IndexedDB.

Each imported content item should include:

* id
* title
* content
* contentType
* sourceType: public-api
* sourceName
* sourceUrl
* licenseName
* attribution
* importedAt
* skill
* topic
* difficulty
* tags
* userNotes

7. Licensing and Attribution

The app must respect content licenses.

Requirements:

* Show source and license before import.
* Store attribution metadata.
* Display attribution when showing imported content.
* Do not import content if license is unclear.
* Do not copy copyrighted IELTS/Cambridge/British Council/IDP materials unless explicitly allowed.
* Prefer public domain, Creative Commons, and OER sources.

8. API Key and CORS Handling

Because there is no backend:

* Prefer APIs that do not require secret API keys.
* Do not expose private API keys in frontend code.
* If an API requires a user-owned key, allow the user to enter their own key locally.
* Handle CORS errors gracefully.
* Explain when a source cannot be used directly from browser because of CORS or API restrictions.

9. AI Integration

After content is imported, AI can:

* Classify IELTS topic
* Extract vocabulary
* Simplify content
* Generate reading questions
* Generate listening gap-fill from transcript
* Generate speaking discussion questions
* Generate writing prompts
* Generate grammar exercises
* Generate mistake review tasks

AI must use the user’s own API key and must only run after user action.

10. Important Product Rule

Public APIs are optional content sources.

The app should work from:

* Built-in original content
* User-created content
* User-collected web content
* AI-generated content
* Optional public API imports

Do not make the app depend completely on public APIs.
