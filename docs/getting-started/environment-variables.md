# Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env` and configure the following:

| Variable | Required | Default | Description |
|---|---|---|---|
| `CAPACITOR_APP_ID` | No | `com.ieltsjourney.app` | Bundle identifier for native apps |
| `CAPACITOR_APP_NAME` | No | `IELTS Journey` | Display name for native apps |

AI provider configuration (API keys, base URL, model) is set directly within the application UI at **Settings > AI Provider** and stored in `localStorage`. No environment variables are needed for AI — the user owns their own key.
