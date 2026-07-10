# Troubleshooting Guide

> Common issues, their causes, and solutions for the IELTS Journey.

---

## 1. App Issues

### 1.1 App Won't Load / Blank Screen

| Possible Cause | Check | Solution |
|---------------|-------|----------|
| Build error | Browser console for errors | `pnpm build` to rebuild |
| Corrupted IndexedDB | `Application > IndexedDB` in DevTools | Clear site data and reload |
| JavaScript disabled | Browser settings | Enable JavaScript |
| Outdated browser | Check browser version | Update to latest browser |

**To clear IndexedDB:**
1. Open DevTools (F12)
2. Go to Application → IndexedDB
3. Right-click `ielts-journey` → Delete
4. Reload the page

### 1.2 PWA Not Installing

| Possible Cause | Solution |
|---------------|----------|
| Not HTTPS (required for PWA) | Use `https://` in production, `http://localhost` for dev |
| Already installed | Check installed apps |
| Browser doesn't support PWA | Use Chrome, Edge, or Firefox |

### 1.3 Data Lost After Browser Clear

If you clear browser data (cookies, cache):
- **IndexedDB** is deleted — this is expected
- **Recommended:** Export backup regularly via Settings → Data Management
- After data loss, the app will re-seed built-in content on next launch

---

## 2. Development Issues

### 2.1 `pnpm install` Fails

```bash
# Clear cache and retry
pnpm store prune
rm -rf node_modules
pnpm install

# Check Node.js version
node --version  # Requires >= 18
```

### 2.2 `pnpm dev` Fails

```bash
# Check port availability
lsof -i :5173  # Default Vite port

# Kill existing process
pnpm kill:dev

# Or use different port
pnpm dev:vite --port 5174
```

### 2.3 TypeScript Errors on Build

```bash
# Run type checker for details
pnpm typecheck

# Common fixes:
- Update imports after file moves
- Add missing type exports to barrel files
- Check Zod schema compatibility
- Verify package.json dependencies are installed
```

### 2.4 Build Hangs or Runs Out of Memory

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## 3. Extension Issues

### 3.1 Extension Won't Load

| Issue | Solution |
|-------|----------|
| Manifest version mismatch | Ensure manifest.json is valid MV3 |
| Build not run | Run `pnpm build:extension` first |
| Missing icons | Check `apps/extension/public/icons/` |
| Permission errors | Check manifest permissions |
| Service worker registration | Check console in `chrome://extensions/` |

### 3.2 Content Script Not Running

1. Open `chrome://extensions/`
2. Find "IELTS Journey"
3. Click "Inspect views: background page" to open service worker console
4. Check for content script injection errors
5. Ensure host permissions allow the current site

### 3.3 Right-Click Menu Not Showing

1. Check if extension has `contextMenus` permission
2. Right-click menu is registered in service worker on install
3. Reload the extension: `chrome://extensions/` → Reload button

### 3.4 Extension Popup Is Blank

1. Check popup console: right-click popup → Inspect
2. Ensure React build was successful
3. Check for JavaScript errors in the popup console

### 3.5 Bridge Not Connecting (Extension ↔ Website)

1. Ensure the website is open in a tab
2. Check that the URL matches `web_accessible_resources` patterns
3. Open both page console and extension background console for errors
4. The bridge uses `window.postMessage` — check for CSP violations

---

## 4. AI Issues

### 4.1 AI Features Not Working

| Symptom | Check | Solution |
|---------|-------|----------|
| "Configure AI in settings" banner | Settings → AI Configuration | Add API key and select model |
| "API key invalid" error | API key in settings | Re-enter correct key |
| "Network error" | Internet connection | Check connection |
| "API endpoint error" | Base URL in settings | Verify endpoint is correct |
| "Rate limited" | API usage limits | Wait or upgrade plan |
| Timeout | Model or network speed | Try a smaller/faster model |

### 4.2 AI Returns Garbage / Invalid JSON

- Some models may return malformed responses
- The app attempts to parse and extracts JSON via regex
- If parsing fails, try a different model (e.g., `gpt-4o-mini` instead of `gpt-3.5-turbo`)
- Check the AI prompt in DevTools network tab for reference

### 4.3 Test Connection Fails

1. Check API key format (should start with `sk-` for OpenAI)
2. Verify base URL:
   - OpenAI: `https://api.openai.com/v1`
   - Custom: your provider's endpoint
3. Check if the model name is correct
4. Test the key independently (e.g., `curl` command)

### 4.4 AI Response Validation Errors

If you see "AI returned unexpected format":
- The AI response didn't match the expected Zod schema
- This is handled gracefully — no crash
- Try a different model or prompt the AI again
- This may happen with non-OpenAI providers that return different formats

---

## 5. Storage Issues

### 5.1 IndexedDB Quota Exceeded

**Signs:**
- Write operations fail silently
- Data not persisting
- Browser console errors about quota

**Solutions:**
1. Export backup via Settings → Data Management
2. Clear old data (review completed mistakes, old sessions)
3. Clear IndexedDB and re-import the backup
4. Browser storage limits vary:
   - Chrome: ~60% of available disk
   - Firefox: ~50% of available disk
   - Safari: ~500MB (varies)

### 5.2 Data Corruption

If data becomes corrupted:
1. App attempts to isolate corrupted records
2. Valid data continues to work
3. Export remaining valid data
4. Clear IndexedDB
5. Re-import backup

### 5.3 Migration Fails

If upgrading from an old version:
1. Check `packages/storage/src/migrations.ts` for version history
2. Delete IndexedDB manually in DevTools
3. Reload — app will start fresh with seeding

---

## 6. Build & Deployment Issues

### 6.1 `pnpm build` TypeScript Errors

```bash
# Show detailed errors
pnpm typecheck 2>&1 | head -50

# Fix common issues:
- Import path changes after refactoring
- Missing exports in package barrels
- Type mismatches after schema changes
```

### 6.2 Extension Build Fails

```bash
# Check extension-specific build
cd apps/extension
pnpm build

# Verify manifest.json is valid JSON
# Verify all referenced files exist
```

### 6.3 Deployment Shows Blank Page

1. Check browser console for errors
2. Ensure `index.html` is in the build output root
3. For SPA routing: ensure server redirects all routes to `index.html`
4. Check that all asset paths are correct (not absolute when they should be relative)

---

## 7. Performance Issues

### 7.1 Slow Page Load

| Cause | Solution |
|-------|----------|
| Large IndexedDB | Archive old data via export/import |
| Too many DOM nodes | Reduce list sizes, use pagination |
| Heavy re-renders | Check React DevTools for unnecessary renders |
| AI response blocking | AI calls are async — ensure UI doesn't block |

### 7.2 Slow Vocabulary Display

- Paginate large lists (built into repository queries)
- Use search/filter rather than loading all items
- Check for missing indexes on query fields

---

## 8. Common Error Messages

| Error Message | Meaning | Action |
|--------------|---------|--------|
| `StorageError: Entity not found` | Record doesn't exist | Refresh data, it may have been deleted |
| `ValidationError: Invalid input` | Zod schema validation failed | Check form input, fix the field |
| `MigrationError: Version mismatch` | DB version doesn't match code | Reload page to trigger migration |
| `DuplicateEntityError` | Record with same ID exists | Use merge mode for imports |
| `DatabaseClosedError` | IndexedDB connection closed | Reload the page |
| `AIError: API_ERROR` | AI endpoint returned an error | Check API key and endpoint |
| `AIError: AUTH_ERROR` | Authentication failed | Re-enter API key |
| `ExtensionError` | Extension operation failed | Reload extension |

---

## 9. Getting Help

If you cannot resolve an issue:

1. **Check existing issues:** [GitHub Issues](https://github.com/<your-username>/ielts-journey/issues)
2. **Open a new issue** with:
   - Browser and version
   - App version
   - Steps to reproduce
   - Error message (from console)
   - Screenshots if applicable
3. **For extension issues:** Include extension version and `chrome://extensions/` screenshots

---

## 10. Debug Mode

To enable verbose logging:

```typescript
// In browser console
localStorage.setItem('debug', 'ielts:*')

// Or set specific modules
localStorage.setItem('debug', 'ielts:storage,ielts:ai')
```

This enables `console.debug` logging from the tagged modules.
