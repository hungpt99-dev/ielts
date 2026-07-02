import type { PublicApiSourceConfig, CorsCapability } from "../types";
import { PUBLIC_API_SOURCES } from "../types";

// ── Error Type Detection ───────────────────────────────────────────

export interface ApiErrorInfo {
  type: "cors" | "rate-limit" | "auth" | "network" | "server" | "unknown";
  title: string;
  message: string;
  suggestions: ErrorSuggestion[];
}

export interface ErrorSuggestion {
  type:
    | "use-cors-proxy"
    | "switch-source"
    | "configure-api-key"
    | "check-api-key"
    | "retry-later"
    | "manual-import"
    | "check-connection"
    | "try-different-query";
  label: string;
  action?: () => void;
}

export function getCorsCapability(
  source: PublicApiSourceConfig,
): CorsCapability {
  return source.corsStatus;
}

export function isCorsError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }
  if (
    error instanceof TypeError &&
    error.message.includes("NetworkError when attempting to fetch resource")
  ) {
    return true;
  }
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.message.includes("aborted"))
  ) {
    return false;
  }
  return false;
}

export function isRateLimitError(error: unknown, status?: number): boolean {
  if (status === 429) return true;
  if (
    error instanceof Error &&
    /\b(rate|limit|too many|quota)\b|throttl/i.test(error.message)
  ) {
    return true;
  }
  return false;
}

export function isAuthError(error: unknown, status?: number): boolean {
  if (status === 401 || status === 403) return true;
  if (
    error instanceof Error &&
    /\b(api.?key|forbidden|invalid key|quota exceeded)\b|\bauth/i.test(
      error.message,
    )
  ) {
    return true;
  }
  return false;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  return false;
}

export function isServerError(_error: unknown, status?: number): boolean {
  if (status && status >= 500 && status < 600) return true;
  return false;
}

// ── Error Analysis ─────────────────────────────────────────────────

export function classifyError(
  error: unknown,
  status?: number,
): ApiErrorInfo["type"] {
  if (isCorsError(error)) return "cors";
  if (isRateLimitError(error, status)) return "rate-limit";
  if (isAuthError(error, status)) return "auth";
  if (isNetworkError(error)) return "network";
  if (isServerError(error, status)) return "server";
  return "unknown";
}

// ── Message Building ────────────────────────────────────────────────

export function buildErrorMessage(
  error: unknown,
  source: PublicApiSourceConfig,
): ApiErrorInfo {
  const status =
    error instanceof Response
      ? error.status
      : (error as { status?: number })?.status;

  const type = classifyError(error, status);

  const base: Pick<ApiErrorInfo, "type" | "title" | "message"> = (() => {
    switch (type) {
      case "cors":
        return {
          type: "cors",
          title: "CORS Restriction",
          message: corsErrorMessage(source),
        };
      case "rate-limit":
        return {
          type: "rate-limit",
          title: "Rate Limit Exceeded",
          message: rateLimitMessage(source),
        };
      case "auth":
        return {
          type: "auth",
          title: "API Key Issue",
          message: authErrorMessage(source, error),
        };
      case "network":
        return {
          type: "network",
          title: "Network Error",
          message:
            "Could not connect to the API. Check your internet connection and try again.",
        };
      case "server":
        return {
          type: "server",
          title: "Server Error",
          message: serverErrorMessage(status),
        };
      default:
        return {
          type: "unknown",
          title: "Search Error",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        };
    }
  })();

  return {
    ...base,
    suggestions: buildSuggestions(type, source),
  };
}

function corsErrorMessage(source: PublicApiSourceConfig): string {
  if (source.corsStatus === "no-cors") {
    return (
      `"${source.label}" does not support browser-based access due to CORS restrictions. ` +
      `This API is designed for server-side use only and cannot be called directly from the browser.`
    );
  }
  if (source.corsStatus === "cors-bypass") {
    return (
      `"${source.label}" requires a CORS proxy to be accessed from the browser. ` +
      `Configure a CORS proxy URL in Settings or use a different source.`
    );
  }
  return (
    `"${source.label}" returned a CORS error. This may be a temporary issue ` +
    `or the API may have changed its CORS policy.`
  );
}

function rateLimitMessage(source: PublicApiSourceConfig): string {
  let msg = `"${source.label}" rate limit has been exceeded. `;
  if (source.rateLimit) {
    msg += `This source allows approximately ${source.rateLimit}. `;
  }
  msg += "Wait a moment before trying again.";
  return msg;
}

function authErrorMessage(
  source: PublicApiSourceConfig,
  error: unknown,
): string {
  if (!source.requiresApiKey) {
    return (
      `"${source.label}" returned an authentication error unexpectedly. ` +
      "This may be a temporary issue on the API side."
    );
  }
  if (
    error instanceof Error &&
    /\bquota exceeded\b/i.test(error.message)
  ) {
    return (
      `Your API key for "${source.label}" has exceeded its quota. ` +
      "Check your usage dashboard or wait for the quota to reset."
    );
  }
  return (
    `The API key for "${source.label}" appears to be invalid or missing. ` +
    "Check your key in Settings and ensure it is correct."
  );
}

function serverErrorMessage(status?: number): string {
  return (
    `The API server returned an error (status ${status ?? "unknown"}). ` +
    "This is usually temporary — try again later."
  );
}

// ── Suggestions ────────────────────────────────────────────────────

export function buildSuggestions(
  type: ApiErrorInfo["type"],
  source: PublicApiSourceConfig,
): ErrorSuggestion[] {
  const suggestions: ErrorSuggestion[] = [];

  switch (type) {
    case "cors": {
      if (source.corsStatus !== "no-cors") {
        suggestions.push({
          type: "use-cors-proxy",
          label: "Configure a CORS proxy in Settings",
        });
      }
      const alternatives = PUBLIC_API_SOURCES.filter(
        (s) =>
          s.corsStatus === "direct" && s.name !== source.name,
      );
      for (const alt of alternatives) {
        suggestions.push({
          type: "switch-source",
          label: `Try ${alt.label} instead (works without proxy)`,
        });
      }
      suggestions.push({
        type: "manual-import",
        label: "Manually paste content instead",
      });
      break;
    }
    case "rate-limit":
      suggestions.push({
        type: "retry-later",
        label: "Wait and try again",
      });
      suggestions.push({
        type: "try-different-query",
        label: "Try a different search query",
      });
      if (source.requiresApiKey) {
        suggestions.push({
          type: "check-api-key",
          label: "Check your API key quota in the provider dashboard",
        });
      }
      break;
    case "auth":
      if (source.requiresApiKey) {
        suggestions.push({
          type: "configure-api-key",
          label: "Enter or update your API key in Settings",
        });
      }
      suggestions.push({
        type: "switch-source",
        label: `Try a source that does not require an API key`,
      });
      break;
    case "network":
      suggestions.push({
        type: "check-connection",
        label: "Check your internet connection",
      });
      suggestions.push({
        type: "retry-later",
        label: "Try again",
      });
      break;
    case "server":
      suggestions.push({
        type: "retry-later",
        label: "Try again later",
      });
      suggestions.push({
        type: "switch-source",
        label: "Try a different source",
      });
      break;
    default:
      suggestions.push({
        type: "try-different-query",
        label: "Try a different search query",
      });
  }

  return suggestions;
}

// ── Validate source usability from browser ─────────────────────────

export interface SourceUsability {
  usable: boolean;
  warnings: string[];
  errorInfo: ApiErrorInfo | null;
}

export function checkSourceUsability(
  source: PublicApiSourceConfig,
): SourceUsability {
  const warnings: string[] = [];
  let errorInfo: ApiErrorInfo | null = null;

  if (source.corsStatus === "no-cors") {
    errorInfo = {
      type: "cors",
      title: "CORS Restriction",
      message: corsErrorMessage(source),
      suggestions: buildSuggestions("cors", source),
    };
    warnings.push(
      `${source.label} cannot be used directly from the browser. Use a CORS proxy or server-side proxy.`,
    );
  } else if (source.corsStatus === "cors-bypass") {
    warnings.push(
      `${source.label} may need a CORS proxy. If requests fail, configure one in Settings.`,
    );
  }

  if (source.requiresApiKey) {
    warnings.push(
      `${source.label} requires an API key. Enter your key in the search panel or Settings.`,
    );
  }

  return {
    usable: source.corsStatus !== "no-cors",
    warnings,
    errorInfo,
  };
}

// ── High-level safe fetch wrapper ──────────────────────────────────

export interface SafeFetchResult<T> {
  data: T | null;
  error: ApiErrorInfo | null;
}

export async function safeApiFetch<T>(
  url: string,
  source: PublicApiSourceConfig,
  options?: RequestInit,
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const errorInfo = buildErrorMessage(
        { status: res.status, message: `HTTP ${res.status}` },
        source,
      );
      return { data: null, error: errorInfo };
    }

    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err) {
    const errorInfo = buildErrorMessage(err, source);
    return { data: null, error: errorInfo };
  }
}
