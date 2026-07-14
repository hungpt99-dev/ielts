import { useState, useEffect } from "react";
import { PUBLIC_API_SOURCES } from "../types";
import { useSettings } from "../../../context/SettingsContext";
import { testConnection } from "../../../services/ai/testConnection";
import { STORAGE_KEYS } from "@ielts/config";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import ToggleSwitch from "../../../components/ui/ToggleSwitch";

const API_KEY_PREFIX = STORAGE_KEYS.localStorage.apiKeyPrefix;

function encodeKey(key: string): string {
  try {
    return btoa(key);
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/components/ApiKeySettings.tsx error:', error);
    return key;
  }
}

function decodeKey(encoded: string): string {
  try {
    return atob(encoded);
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/components/ApiKeySettings.tsx error:', error);
    return encoded;
  }
}

function getStoredApiKey(source: string): string {
  try {
    const raw = localStorage.getItem(API_KEY_PREFIX + source);
    return raw ? decodeKey(raw) : "";
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/components/ApiKeySettings.tsx error:', error);
    return "";
  }
}

function storeApiKey(source: string, key: string): void {
  try {
    if (key) {
      localStorage.setItem(API_KEY_PREFIX + source, encodeKey(key));
    } else {
      localStorage.removeItem(API_KEY_PREFIX + source);
    }
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/components/ApiKeySettings.tsx error:', error);
    // localStorage unavailable
  }
}

interface ApiKeyState {
  key: string;
  visible: boolean;
  testing: boolean;
  testResult: { ok: boolean; message: string } | null;
  saved: boolean;
}

export default function ApiKeySettings() {
  const { settings, updateSettings } = useSettings();

  const publicApiSources = PUBLIC_API_SOURCES.filter(
    (s) => s.requiresApiKey
  );
  const keySources = publicApiSources.map((s) => ({
    name: s.name,
    label: s.label,
    apiKeyLabel: s.apiKeyLabel ?? "API Key",
    apiKeyPlaceholder: s.apiKeyPlaceholder ?? "",
    docsUrl: s.docsUrl,
    defaultLicense: s.defaultLicense,
  }));

  const [states, setStates] = useState<Record<string, ApiKeyState>>({});
  const [aiKey, setAiKey] = useState(settings.aiApiKey);
  const [aiEnabled, setAiEnabled] = useState(settings.aiEnabled);
  const [aiProvider, setAiProvider] = useState(settings.aiProvider);
  const [aiBaseUrl, setAiBaseUrl] = useState(settings.aiBaseUrl || settings.aiEndpoint || '');
  const [aiModel, setAiModel] = useState(settings.aiModel);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [aiSaved, setAiSaved] = useState(false);

  useEffect(() => {
    const initial: Record<string, ApiKeyState> = {};
    for (const src of keySources) {
      initial[src.name] = {
        key: getStoredApiKey(src.name),
        visible: false,
        testing: false,
        testResult: null,
        saved: false,
      };
    }
    setStates(initial);
  }, []);

  useEffect(() => {
    setAiKey(settings.aiApiKey)
    setAiProvider(settings.aiProvider)
    setAiBaseUrl(settings.aiBaseUrl || settings.aiEndpoint || '')
    setAiModel(settings.aiModel)
    setAiEnabled(settings.aiEnabled)
  }, [settings.aiApiKey, settings.aiProvider, settings.aiBaseUrl, settings.aiEndpoint, settings.aiModel, settings.aiEnabled])

  function updateState(
    name: string,
    partial: Partial<ApiKeyState>
  ) {
    setStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...partial },
    }));
  }

  function handleSavePublicKey(name: string) {
    const s = states[name];
    if (!s) return;
    const err = validateApiKey(name, s.key);
    if (err) {
      updateState(name, { testResult: { ok: false, message: err } });
      return;
    }
    storeApiKey(name, s.key);
    updateState(name, { saved: true, testResult: null });
    setTimeout(() => updateState(name, { saved: false }), 2500);
  }

  function handleClearPublicKey(name: string) {
    storeApiKey(name, "");
    updateState(name, { key: "", testResult: null, saved: false });
  }

  async function handleTestPublicKey(name: string) {
    const s = states[name];
    if (!s) return;
    if (!s.key) {
      updateState(name, {
        testResult: { ok: false, message: "Enter an API key first." },
      });
      return;
    }
    updateState(name, { testing: true, testResult: null });
    const result = await testPublicApiConnection(name, s.key);
    updateState(name, { testing: false, testResult: result });
  }

  function handleAiSave() {
    updateSettings({
      aiApiKey: aiKey,
      aiProvider: aiProvider,
      aiBaseUrl: aiBaseUrl,
      aiEndpoint: aiBaseUrl,
      aiModel: aiModel,
      aiEnabled: aiEnabled,
    });
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2500);
  }

  function handleAiReset() {
    setAiKey("");
    setAiProvider("openai");
    setAiBaseUrl("");
    setAiModel("gpt-4o-mini");
    setAiEnabled(false);
    setAiTestResult(null);
    updateSettings({
      aiApiKey: "",
      aiProvider: "openai",
      aiBaseUrl: "",
      aiEndpoint: "",
      aiModel: "gpt-4o-mini",
      aiEnabled: false,
    });
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2500);
  }

  async function handleAiTest() {
    if (!aiKey) {
      setAiTestResult({
        ok: false,
        message: "Enter an API key first.",
      });
      return;
    }
    setAiTesting(true);
    setAiTestResult(null);
    const result = await testConnection({ apiKey: aiKey, baseUrl: aiBaseUrl || 'https://api.openai.com/v1', model: aiModel || 'gpt-4o-mini' });
    setAiTestResult({ ok: result.ok, message: result.message });
    setAiTesting(false);
  }

  return (
    <div className="space-y-6">
      {keySources.map((src) => {
        const s = states[src.name];
        if (!s) return null;
        return (
          <Card key={src.name}>
            <CardHeader>
              <CardTitle>{src.label} API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p
                className="text-xs"
                style={{ color: "var(--color-muted)" }}
              >
                Required for searching {src.label} content. Get your key
                from{" "}
                <a
                  href={src.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  {src.docsUrl}
                </a>
                . Content sourced via this API uses{" "}
                {src.defaultLicense}.
              </p>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id={`key-${src.name}`}
                    type={s.visible ? "text" : "password"}
                    label={src.apiKeyLabel}
                    value={s.key}
                    onChange={(e) => {
                      const val = (e.target as HTMLInputElement).value;
                      updateState(src.name, {
                        key: val,
                        testResult: null,
                      });
                    }}
                    placeholder={src.apiKeyPlaceholder}
                    autoComplete="off"
                    helperText={
                      s.key
                        ? `${s.key.slice(0, 6)}...${s.key.slice(-4)}`
                        : "No API key set"
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateState(src.name, { visible: !s.visible })
                  }
                  className="mt-6 shrink-0 self-start rounded-lg p-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  style={{ color: "var(--color-muted)" }}
                  aria-label={s.visible ? "Hide key" : "Show key"}
                >
                  {s.visible ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleSavePublicKey(src.name)}
                  disabled={!s.key}
                >
                  Save Key
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestPublicKey(src.name)}
                  loading={s.testing}
                  disabled={!s.key}
                >
                  Test Connection
                </Button>
                {s.key && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearPublicKey(src.name)}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {s.saved && (
                <p
                  className="text-xs"
                  style={{ color: "var(--color-primary)" }}
                >
                  Key saved.
                </p>
              )}

              {s.testResult && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    s.testResult.ok
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {s.testResult.ok ? (
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 shrink-0"
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
                  )}
                  {s.testResult.message}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>AI Service API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p
            className="text-xs"
            style={{ color: "var(--color-muted)" }}
          >
            Used for content classification, vocabulary extraction,
            question generation, and other AI features. Your key is
            stored locally and never sent to any server except your
            configured AI provider.
          </p>

          <ToggleSwitch
            enabled={aiEnabled}
            onChange={setAiEnabled}
            label="Enable AI Features"
            description="Turn on AI-powered study tools"
          />

          {aiEnabled && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="ai-api-key"
                    type="password"
                    label="API Key"
                    value={aiKey}
                    onChange={(e) => {
                      setAiKey((e.target as HTMLInputElement).value);
                      setAiTestResult(null);
                    }}
                    placeholder="sk-..."
                    autoComplete="off"
                    helperText={
                      aiKey
                        ? `${aiKey.slice(0, 8)}...${aiKey.slice(-4)}`
                        : "No API key set"
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAiTest}
                  loading={aiTesting}
                  disabled={!aiKey}
                >
                  Test Connection
                </Button>
                {aiTestResult && (
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                      aiTestResult.ok
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {aiTestResult.ok ? (
                      <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 shrink-0"
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
                    )}
                    {aiTestResult.message}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label
                  className="mb-1 block text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  AI Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => {
                    const val = e.target.value as "openai" | "custom";
                    setAiProvider(val);
                    if (val === "openai") {
                      setAiEndpoint("");
                      setAiModel("gpt-4o-mini");
                    }
                    setAiTestResult(null);
                  }}
                  className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="openai">OpenAI</option>
                  <option value="custom">
                    Custom (OpenAI-compatible)
                  </option>
                </select>
              </div>

              <Input
                id="ai-base-url"
                type="text"
                label="Base URL"
                value={aiBaseUrl}
                onChange={(e) => {
                  setAiBaseUrl(
                    (e.target as HTMLInputElement).value
                  );
                  setAiTestResult(null);
                }}
                placeholder="https://api.openai.com/v1"
              />
              <Input
                id="ai-model"
                type="text"
                label="Model"
                value={aiModel}
                onChange={(e) => {
                  setAiModel((e.target as HTMLInputElement).value);
                  setAiTestResult(null);
                }}
                placeholder="gpt-4o-mini"
              />
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <Button onClick={handleAiSave} disabled={!aiKey && aiEnabled}>
              Save AI Settings
            </Button>
            <Button variant="ghost" onClick={handleAiReset}>
              Reset AI Settings
            </Button>
          </div>

          {aiSaved && (
            <p
              className="text-xs"
              style={{ color: "var(--color-primary)" }}
            >
              AI settings saved.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function validateApiKey(source: string, key: string): string | null {
  if (!key) {
    return "API key is required.";
  }
  if (source === "youtube") {
    if (!key.startsWith("AIza")) {
      return 'YouTube Data API keys typically start with "AIza". Please check your key.';
    }
  }
  return null;
}

async function testPublicApiConnection(
  source: string,
  key: string
): Promise<{ ok: boolean; message: string }> {
  try {
    if (source === "youtube") {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${encodeURIComponent(key)}`;
      const res = await fetch(url);
      if (res.ok) {
        return { ok: true, message: "Connection successful." };
      }
      const data = await res.json().catch(() => ({}));
      const errMsg =
        data?.error?.message ?? `HTTP ${res.status}`;
      return { ok: false, message: errMsg };
    }
    return { ok: false, message: `No test available for ${source}.` };
  } catch (err) {
    console.error('apps/web/src/features/publicApiIntegration/components/ApiKeySettings.tsx error:', err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export { getStoredApiKey, storeApiKey, encodeKey, decodeKey };
