import { useState, useCallback, type FormEvent } from "react";
import type {
  PublicApiSourceName,
  PublicApiSearchResult,
  PublicApiPreview,
  PublicApiContentType,
  PublicApiSourceConfig,
} from "../types";
import type { ApiErrorInfo } from "../utils/errorHandling";
import { PUBLIC_API_SOURCES } from "../types";
import { importPublicApiContent } from "../api/import";
import { buildErrorMessage } from "../utils/errorHandling";
import { fetchWithCorsProxy } from "../utils/corsProxy";
import { STORAGE_KEYS } from "@ielts/config";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import { generateId } from "../../../utils";

// ── Helpers ──────────────────────────────────────────────────

const API_KEY_PREFIX = STORAGE_KEYS.localStorage.apiKeyPrefix;

function getStoredApiKey(source: PublicApiSourceName): string {
  try {
    return localStorage.getItem(API_KEY_PREFIX + source) ?? "";
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/components/PublicApiSearch.tsx error:', error);
    return "";
  }
}

function storeApiKey(source: PublicApiSourceName, key: string): void {
  try {
    if (key) {
      localStorage.setItem(API_KEY_PREFIX + source, key);
    } else {
      localStorage.removeItem(API_KEY_PREFIX + source);
    }
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/components/PublicApiSearch.tsx error:', error);
    // localStorage unavailable
  }
}

// ── API-specific search implementations ──────────────────────

interface SearchFn {
  (
    source: PublicApiSourceConfig,
    query: string,
    apiKey: string,
  ): Promise<PublicApiSearchResult[]>;
}

async function searchWikipedia(
  _source: PublicApiSourceConfig,
  query: string,
  _apiKey: string,
): Promise<PublicApiSearchResult[]> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "10");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();

  const pages = data?.query?.search ?? [];
  return pages.map((p: Record<string, unknown>) => ({
    id: "wiki-" + p.pageid,
    title: String(p.title ?? ""),
    snippet: String(p.snippet ?? "").replace(/<[^>]+>/g, ""),
    sourceName: "wikipedia" as PublicApiSourceName,
    sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(p.title ?? ""))}`,
    contentType: "article" as PublicApiContentType,
    licenseName: "CC BY-SA 3.0",
  }));
}

async function searchWiktionary(
  _source: PublicApiSourceConfig,
  query: string,
  _apiKey: string,
): Promise<PublicApiSearchResult[]> {
  const url = new URL("https://en.wiktionary.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "10");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wiktionary API error: ${res.status}`);
  const data = await res.json();

  const pages = data?.query?.search ?? [];
  return pages.map((p: Record<string, unknown>) => ({
    id: "wikt-" + p.pageid,
    title: String(p.title ?? ""),
    snippet: String(p.snippet ?? "").replace(/<[^>]+>/g, ""),
    sourceName: "wiktionary" as PublicApiSourceName,
    sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(String(p.title ?? ""))}`,
    contentType: "dictionary" as PublicApiContentType,
    licenseName: "CC BY-SA 3.0",
  }));
}

async function searchDatamuse(
  _source: PublicApiSourceConfig,
  query: string,
  _apiKey: string,
): Promise<PublicApiSearchResult[]> {
  const url = new URL("https://api.datamuse.com/words");
  url.searchParams.set("ml", query);
  url.searchParams.set("max", "10");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Datamuse API error: ${res.status}`);
  const data = await res.json();

  return data.map((w: Record<string, unknown>, i: number) => ({
    id: "dm-" + i + "-" + generateId().slice(0, 6),
    title: String(w.word ?? ""),
    snippet: [
      w.defs ? (w.defs as string[]).slice(0, 2).join("; ") : "",
      w.tags ? `Tags: ${(w.tags as string[]).slice(0, 4).join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" — "),
    sourceName: "datamuse" as PublicApiSourceName,
    sourceUrl: `https://www.datamuse.com/api/?ml=${encodeURIComponent(query)}`,
    contentType: "vocabulary-list" as PublicApiContentType,
    licenseName: "CC BY 4.0",
  }));
}

async function searchGutendex(
  _source: PublicApiSourceConfig,
  query: string,
  _apiKey: string,
): Promise<PublicApiSearchResult[]> {
  const url = new URL("https://gutendex.com/books");
  url.searchParams.set("search", query);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Gutendex API error: ${res.status}`);
  const data = await res.json();

  const books = data?.results ?? [];
  return books.map((b: Record<string, unknown>) => ({
    id: "gute-" + b.id,
    title: String(b.title ?? ""),
    snippet: [
      b.authors
        ? (b.authors as Array<{ name: string }>)
            .map((a: { name: string }) => a.name)
            .join(", ")
        : "",
      b.subjects ? (b.subjects as string[]).slice(0, 3).join(", ") : "",
    ]
      .filter(Boolean)
      .join(" — "),
    sourceName: "gutendex" as PublicApiSourceName,
    sourceUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
    contentType: "reading" as PublicApiContentType,
    licenseName: "Public Domain",
  }));
}

async function searchTatoeba(
  source: PublicApiSourceConfig,
  query: string,
  _apiKey: string,
): Promise<PublicApiSearchResult[]> {
  const url = new URL("https://tatoeba.org/en/api/v0/search");
  url.searchParams.set("query", query);
  url.searchParams.set("from", "eng");
  url.searchParams.set("to", "eng");
  url.searchParams.set("limit", "10");

  const res = await fetchWithCorsProxy(url.toString(), source);
  if (!res.ok) throw new Error(`Tatoeba API error: ${res.status}`);
  const data = await res.json();

  const results = data?.results ?? [];
  return results.map((r: Record<string, unknown>, i: number) => ({
    id: "tat-" + i + "-" + generateId().slice(0, 6),
    title: (r as { text?: string }).text?.slice(0, 80) ?? "Tatoeba sentence",
    snippet: (r as { text?: string }).text ?? "",
    sourceName: "tatoeba" as PublicApiSourceName,
    sourceUrl: `https://tatoeba.org/en/sentences/show/${r.id}`,
    contentType: "dictionary" as PublicApiContentType,
    licenseName: "CC BY 2.0 FR",
  }));
}

async function searchOerCommons(
  source: PublicApiSourceConfig,
  query: string,
  _apiKey: string,
): Promise<PublicApiSearchResult[]> {
  const url = new URL("https://api.oercommons.org/v3/search");
  url.searchParams.set("search_term", query);
  url.searchParams.set("per_page", "10");

  const res = await fetchWithCorsProxy(url.toString(), source);
  if (!res.ok) throw new Error(`OER Commons API error: ${res.status}`);
  const data = await res.json();

  const results = data?.results ?? data?.items ?? [];
  return results.map((r: Record<string, unknown>, i: number) => ({
    id: "oer-" + i + "-" + generateId().slice(0, 6),
    title: String(r.title ?? r.name ?? "Untitled"),
    snippet: String(r.description ?? "").slice(0, 200),
    sourceName: "oer-commons" as PublicApiSourceName,
    sourceUrl: String(r.url ?? r.landing_page ?? ""),
    contentType: "reading" as PublicApiContentType,
    licenseName: String(r.license ?? "Various open licenses"),
  }));
}

async function searchYouTube(
  _source: PublicApiSourceConfig,
  query: string,
  apiKey: string,
): Promise<PublicApiSearchResult[]> {
  if (!apiKey) {
    throw new Error(
      "YouTube Data API requires an API key. Enter your key above to search YouTube.",
    );
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(
        "YouTube API key is invalid or quota exceeded. Check your key in Settings.",
      );
    }
    throw new Error(`YouTube API error: ${res.status}`);
  }
  const data = await res.json();

  const items = data?.items ?? [];
  return items.map((item: Record<string, unknown>) => {
    const snippet = item.snippet as Record<string, unknown> | undefined;
    const videoId =
      ((item.id as Record<string, unknown> | undefined)?.videoId as string) ??
      "";
    return {
      id: "yt-" + videoId,
      title: String(snippet?.title ?? "Untitled"),
      snippet: String(snippet?.description ?? "").slice(0, 200),
      sourceName: "youtube" as PublicApiSourceName,
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      contentType: "video" as PublicApiContentType,
      licenseName: "YouTube Terms of Service",
    };
  });
}

const SEARCH_HANDLERS: Record<PublicApiSourceName, SearchFn> = {
  wiktionary: searchWiktionary,
  datamuse: searchDatamuse,
  tatoeba: searchTatoeba,
  "oer-commons": searchOerCommons,
  wikipedia: searchWikipedia,
  gutendex: searchGutendex,
  youtube: searchYouTube,
};

// ── Preview: fetch full content ─────────────────────────────

async function fetchPreview(
  result: PublicApiSearchResult,
): Promise<PublicApiPreview> {
  // For most sources, the search result snippet is sufficient as preview.
  // Wikipedia/Wiktionary can fetch full page content.
  let content = result.snippet;

  if (result.sourceName === "wikipedia" || result.sourceName === "wiktionary") {
    const apiUrl =
      result.sourceName === "wikipedia"
        ? "https://en.wikipedia.org/w/api.php"
        : "https://en.wiktionary.org/w/api.php";
    const title = result.title;

    const url = new URL(apiUrl);
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", title);
    url.searchParams.set("prop", "extracts");
    url.searchParams.set("exintro", "1");
    url.searchParams.set("explaintext", "1");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    try {
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        const pages = data?.query?.pages ?? {};
        const pageKey = Object.keys(pages)[0];
        if (pageKey && pageKey !== "-1") {
          content = pages[pageKey]?.extract ?? content;
        }
      }
    } catch (error) {
      console.error('apps/web/src/features/publicApiIntegration/components/PublicApiSearch.tsx error:', error);
      // fallback to snippet
    }
  }

  return {
    id: result.id,
    title: result.title,
    content,
    contentType: result.contentType,
    sourceName: result.sourceName,
    sourceUrl: result.sourceUrl,
    licenseName: result.licenseName,
    attribution: `Source: ${result.sourceName} (${result.licenseName})`,
  };
}

// ── Import handler (saves to IndexedDB) ──────────────────────

// ── Content type display helpers ────────────────────────────

const CONTENT_TYPE_INFO: Record<
  PublicApiContentType,
  { label: string; color: string }
> = {
  dictionary: { label: "Dictionary", color: "info" },
  "vocabulary-list": { label: "Vocabulary", color: "primary" },
  reading: { label: "Reading", color: "success" },
  listening: { label: "Listening", color: "warning" },
  article: { label: "Article", color: "info" },
  video: { label: "Video", color: "warning" },
  exercise: { label: "Exercise", color: "success" },
  "writing-prompt": { label: "Writing", color: "primary" },
  "speaking-topic": { label: "Speaking", color: "warning" },
  reference: { label: "Reference", color: "default" },
};

function getSourceBadgeVariant(
  source: PublicApiSourceName,
): "default" | "primary" | "success" | "warning" | "danger" | "info" {
  const map: Record<
    string,
    "default" | "primary" | "success" | "warning" | "danger" | "info"
  > = {
    wiktionary: "info",
    datamuse: "primary",
    tatoeba: "info",
    "oer-commons": "success",
    wikipedia: "info",
    gutendex: "success",
    youtube: "danger",
  };
  return map[source] ?? "default";
}

// ── Component ────────────────────────────────────────────────

export default function PublicApiSearch() {
  const [selectedSource, setSelectedSource] = useState<PublicApiSourceConfig>(
    PUBLIC_API_SOURCES[0],
  );
  const [query, setQuery] = useState("");
  const [apiKey, setApiKey] = useState(() =>
    getStoredApiKey(PUBLIC_API_SOURCES[0].name),
  );
  const [results, setResults] = useState<PublicApiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [searched, setSearched] = useState(false);
  const [previewItem, setPreviewItem] = useState<PublicApiPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<Record<string, boolean>>({});

  const sourceConfig =
    PUBLIC_API_SOURCES.find((s) => s.name === selectedSource.name) ??
    selectedSource;

  function handleSourceChange(name: PublicApiSourceName) {
    const config =
      PUBLIC_API_SOURCES.find((s) => s.name === name) ?? PUBLIC_API_SOURCES[0];
    setSelectedSource(config);
    setApiKey(getStoredApiKey(name));
    setResults([]);
    setError(null);
    setSearched(false);
    setImportResult({});
  }

  const handleSearch = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      setResults([]);
      setSearched(true);
      setImportResult({});

      const handler = SEARCH_HANDLERS[sourceConfig.name];
      if (!handler) {
        setError({
          type: "unknown",
          title: "Unavailable Source",
          message: `No search implementation for "${sourceConfig.label}".`,
          suggestions: [],
        });
        setLoading(false);
        return;
      }

      try {
        const data = await handler(sourceConfig, query.trim(), apiKey);
        setResults(data);
      } catch (err) {
        console.error('apps/web/src/features/publicApiIntegration/components/PublicApiSearch.tsx error:', err);
        setError(buildErrorMessage(err, sourceConfig));
      } finally {
        setLoading(false);
      }
    },
    [query, sourceConfig, apiKey],
  );

  async function handlePreview(result: PublicApiSearchResult) {
    setPreviewLoading(true);
    setPreviewItem(null);
    try {
      const preview = await fetchPreview(result);
      setPreviewItem(preview);
    } catch (err) {
      console.error('apps/web/src/features/publicApiIntegration/components/PublicApiSearch.tsx error:', err);
      setError({
        type: "unknown",
        title: "Preview Error",
        message: "Failed to load preview. The source may be temporarily unavailable.",
        suggestions: [
          { type: "retry-later", label: "Try again" },
        ],
      });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleImport(preview: PublicApiPreview) {
    setImporting(preview.id);
    const result = await importPublicApiContent(preview);
    setImportResult((prev) => ({ ...prev, [preview.id]: result.success }));
    if (!result.success) {
      setError({
        type: "unknown",
        title: "Import Error",
        message: result.error ?? "Import failed",
        suggestions: [
          { type: "retry-later", label: "Try again" },
        ],
      });
    }
    setImporting(null);
  }

  const canSearch =
    query.trim().length > 0 &&
    (!sourceConfig.requiresApiKey || apiKey.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Public Content Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source selector */}
          <div>
            <label
              htmlFor="api-source"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Content Source
            </label>
            <select
              id="api-source"
              value={sourceConfig.name}
              onChange={(e) =>
                handleSourceChange(e.target.value as PublicApiSourceName)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {PUBLIC_API_SOURCES.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.label} — {s.description.slice(0, 60)}
                </option>
              ))}
            </select>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Category: {sourceConfig.category}</span>
              <span aria-hidden="true">·</span>
              <span>
                CORS:{" "}
                {sourceConfig.corsStatus === "direct"
                  ? "✅ Works in browser"
                  : "⚠️ May need proxy"}
              </span>
              {sourceConfig.rateLimit && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Rate: {sourceConfig.rateLimit}</span>
                </>
              )}
            </div>
          </div>

          {/* API key input (shown only for sources that require it) */}
          {sourceConfig.requiresApiKey && (
            <div>
              <label
                htmlFor="api-key-input"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {sourceConfig.apiKeyLabel ?? "API Key"}
              </label>
              <input
                id="api-key-input"
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  storeApiKey(sourceConfig.name, e.target.value);
                }}
                placeholder={
                  sourceConfig.apiKeyPlaceholder ?? "Enter your API key"
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              />
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                This source requires an API key. Your key is stored locally and
                never sent to our servers.
              </p>
            </div>
          )}

          {/* Search input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${sourceConfig.label}...`}
              aria-label="Search query"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
            <Button type="submit" disabled={!canSearch} loading={loading}>
              Search
            </Button>
          </form>

          {/* Source info */}
          <details className="text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
              About this source
            </summary>
            <p className="mt-1">{sourceConfig.description}</p>
            <p className="mt-0.5">
              Default license: {sourceConfig.defaultLicense} —{" "}
              <a
                href={sourceConfig.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
              >
                API docs
              </a>
            </p>
          </details>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {error.title}
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error.message}
              </p>
              {error.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {error.suggestions.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600"
                    >
                      {s.label}
                    </span>
                  ))}
                  {PUBLIC_API_SOURCES.filter(
                    (s) =>
                      s.corsStatus === "direct" && s.name !== sourceConfig.name,
                  ).map((s) => (
                    <button
                      key={s.name}
                      onClick={() => handleSourceChange(s.name)}
                      className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-blue-600 shadow-sm ring-1 ring-slate-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-600 dark:hover:bg-slate-700"
                    >
                      Try {s.label} instead
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="shrink-0 rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800/50"
              aria-label="Dismiss error"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div
            role="status"
            className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No results found
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try a different search query or source. Results depend on the
              source's available content.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results list */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Results ({results.length})
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Source: {sourceConfig.label} — {sourceConfig.defaultLicense}
            </span>
          </div>

          <ul
            className="divide-y divide-slate-100 dark:divide-slate-800"
            role="list"
          >
            {results.map((result) => (
              <li key={result.id}>
                <Card padding={false}>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={getSourceBadgeVariant(result.sourceName)}
                          >
                            {result.sourceName}
                          </Badge>
                          <Badge
                            variant={
                              (CONTENT_TYPE_INFO[result.contentType]
                                ?.color as never) ?? "default"
                            }
                          >
                            {CONTENT_TYPE_INFO[result.contentType]?.label ??
                              result.contentType}
                          </Badge>
                          <Badge variant="default">{result.licenseName}</Badge>
                        </div>

                        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {result.title}
                        </h3>

                        {result.snippet && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                            {result.snippet}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <a
                            href={result.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                          >
                            View original
                          </a>
                          {result.licenseName && (
                            <span
                              className="text-xs text-slate-400"
                              title="License"
                            >
                              {result.licenseName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(result)}
                          disabled={previewLoading}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            const preview = await fetchPreview(result);
                            await handleImport(preview);
                          }}
                          loading={importing === result.id}
                          disabled={importResult[result.id] === true}
                        >
                          {importResult[result.id] ? "Imported" : "Import"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview modal */}
      <Modal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title ?? "Preview"}
        size="lg"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={getSourceBadgeVariant(previewItem.sourceName)}>
                {previewItem.sourceName}
              </Badge>
              <Badge
                variant={
                  (CONTENT_TYPE_INFO[previewItem.contentType]
                    ?.color as never) ?? "default"
                }
              >
                {CONTENT_TYPE_INFO[previewItem.contentType]?.label ??
                  previewItem.contentType}
              </Badge>
              <Badge variant="default">{previewItem.licenseName}</Badge>
            </div>

            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {previewItem.content || "No content available."}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <p>
                <strong>Source:</strong> {previewItem.sourceName}
              </p>
              <p>
                <strong>URL:</strong>{" "}
                <a
                  href={previewItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  {previewItem.sourceUrl}
                </a>
              </p>
              <p>
                <strong>License:</strong> {previewItem.licenseName}
              </p>
              <p>
                <strong>Attribution:</strong> {previewItem.attribution}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewItem(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={importing === previewItem.id}
                disabled={importResult[previewItem.id] === true}
                onClick={() => handleImport(previewItem)}
              >
                {importResult[previewItem.id] ? "Imported ✓" : "Import Content"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
