# Extension Troubleshooting

## Context Invalidation

- **Symptom**: "Extension context invalidated" errors in console.
- **Cause**: Extension updated or reloaded while a content script was running.
- **Fix**: Reload the extension from `chrome://extensions`. The `safe-chrome.ts` wrappers catch these errors, but the content script may need to be re-injected.

## Content Script Not Loading

- **Symptom**: Extension icon does nothing on certain pages.
- **Check**: `chrome://extensions` > IELTS Journey > "Inspect views: Service Worker" console for errors.
- **Check host permissions**: The extension's `manifest.json` must include the target host pattern (e.g., `*://*.youtube.com/*`).

## Sync Not Working

- **Symptom**: Extension data not appearing in web app, or vice versa.
- **Requirement**: A web app tab must be open for the extension to communicate via `chrome.runtime.connect` or shared `localStorage`/`IndexedDB`.
- **Check**: Open `https://ielts-journey.example.com` in a separate tab, then trigger sync from the extension.

## YouTube Panel Not Loading

- **Symptom**: No YouTube learning panel on `youtube.com` watch pages.
- **Check host permissions**: `manifest.json` must include `*://*.youtube.com/*`.
- **Check content script registration**: Look for the content script in the page's "Inspect" > Sources > Content scripts.
- **Check for conflicts**: Other YouTube extensions may block the content script. Try in Incognito.

## API Calls Failing

- **Symptom**: AI features not working in extension popup.
- **Check**: Open extension options page and verify the API key is set.
- **Check**: `chrome.storage.sync` or `chrome.storage.local` for the stored API key.
- **Extension-specific**: The extension's `aiEnrichmentService.ts` has its own AI wrapper — check for differences from `@ielts/ai`'s `callAI`.
