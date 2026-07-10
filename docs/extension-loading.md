# Loading the Extension in Chrome (Unpacked)

This guide explains how to load the IELTS Journey browser extension into Google Chrome for development and testing.

## Prerequisites

- Google Chrome (version 88+, required for Manifest V3)
- The extension must be built first (see [Build the Extension](#build-the-extension))

## Build the Extension

```bash
# From the monorepo root
pnpm build --filter extension

# Or from the extension directory
cd apps/extension
pnpm build
```

The build output goes to `apps/extension/dist/`.

### Production Build

For a production-ready build (minified):

```bash
pnpm build:production
```

Or to build and package:

```bash
pnpm package
```

This produces a `.zip` file in `apps/extension/` ready for Chrome Web Store upload.

## Load the Unpacked Extension

1. Open Chrome and navigate to `chrome://extensions`

2. Enable **Developer mode** using the toggle in the top-right corner

3. Click **Load unpacked**

4. Select the `apps/extension/dist` directory

5. The extension icon should appear in the Chrome toolbar

## Verify the Extension is Working

1. Click the extension icon in the toolbar to open the popup
2. Navigate to any webpage, select text, and right-click to see **Save to IELTS Journey** and **Explain with AI** context menu items
3. Open the extension settings by right-clicking the icon and selecting **Options**
4. Check that the content script is injected by looking for the floating toolbar when text is selected on a webpage

## Development Workflow

### Watch Mode

For active development, run Vite in watch mode:

```bash
pnpm dev
```

The Vite dev server will rebuild the popup and options pages on changes. For background and content scripts, you must rebuild separately:

```bash
pnpm build
```

### Reloading After Changes

1. After rebuilding, go to `chrome://extensions`
2. Click the refresh icon on the IELTS Journey extension card
3. Or use the keyboard shortcut: **Cmd+R** (Mac) / **Ctrl+R** (Windows/Linux) on `chrome://extensions` with the extension focused

> **Tip:** Use the extension's **Update** button on `chrome://extensions` rather than removing and re-adding it to preserve stored data.

### Inspecting Output

- **Popup:** Right-click the extension icon → **Inspect popup**
- **Background service worker:** On `chrome://extensions`, click **service worker** under the extension card
- **Content script:** Open any webpage's DevTools (**F12** / **Cmd+Opt+I**), check the console for messages prefixed with `[IELTS]`

## Debugging Common Issues

| Issue | Solution |
|---|---|
| Extension not appearing | Ensure `dist/` exists and contains `manifest.json`. Run `pnpm build` first. |
| Context menu items missing | After loading, click the extension icon once to initialize the service worker. |
| Content script not running | Check `chrome://extensions` → extension → **Inspect views: service worker** for errors. Ensure `host_permissions` includes the target site. |
| "This extension may have been corrupted" | Remove the extension from `chrome://extensions` and re-load it. |
| popup/options page blank | Open DevTools on the popup to check for JS errors. The page may fail to load if bundled assets are missing. |
| API calls failing | Open Settings (right-click icon → Options) and configure your AI provider with a valid API key. |

## Packaging for Chrome Web Store

To create a production build and package it as a `.zip` file:

```bash
pnpm package
```

The output file will be named `ielts-learning-journey-v0.1.0.zip` (version based on `manifest.json`).

To upload to the Chrome Web Store:

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **Add new item**
3. Upload the generated `.zip` file
4. Fill in the store listing details
5. Submit for review

> **Note:** The `content.js` bundle includes `esbuild` runtime code for compatibility. This is expected and will not affect Chrome Web Store review.

## Browser Compatibility Notes

- **Chrome 88+** — Full support (Manifest V3)
- **Edge 88+** — Load via `edge://extensions` with Developer mode. Same process as Chrome.
- **Brave** — Load via `brave://extensions` with Developer mode. Disable Shields for the extension ID if needed.
- **Firefox** — Not currently supported. Manifest V3 support differs. A separate Firefox build would be needed.
- **Safari** — Not supported. Would require `safari-web-extension-converter`.

## Known Limitations

- The extension uses IndexedDB for local storage. This is *not shared* directly between the extension and the website due to browser security (different origins). See the architecture docs for the sync bridge strategy.
- The content script operates in an **ISOLATED world** (per Manifest V3 best practices). It cannot access the page's JavaScript variables directly, but it can read the DOM.
- The `content.js` bundle includes all content script features in a single file. This keeps injection simple but means the bundle size is larger (~600KB). This is normal for a feature-rich extension.
- Background service worker may go idle after ~30 seconds of inactivity. Persistent connections (like IndexedDB) should re-establish on wake.
- Icons are generated as minimal 1x1 PNG placeholders. Replace them with proper icon assets before Chrome Web Store submission.
