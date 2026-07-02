export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'UNKNOWN',
  ) {
    super(message)
    this.name = 'AIError'
  }
}

export class AIAuthError extends AIError {
  constructor(message = 'Invalid API key. Check your key in Settings.') {
    super(message, 'AUTH_ERROR')
    this.name = 'AIAuthError'
  }
}

export class AIRateLimitError extends AIError {
  constructor(message = 'Rate limit exceeded. Wait a moment and try again.') {
    super(message, 'RATE_LIMIT')
    this.name = 'AIRateLimitError'
  }
}

export class AINetworkError extends AIError {
  constructor(message = 'Network error. Check your internet connection and API endpoint.') {
    super(message, 'NETWORK_ERROR')
    this.name = 'AINetworkError'
  }
}

export class AIEmptyResponseError extends AIError {
  constructor(message = 'AI returned an empty response. Try again.') {
    super(message, 'EMPTY_RESPONSE')
    this.name = 'AIEmptyResponseError'
  }
}

export class AIConfigError extends AIError {
  constructor(message = 'API key not configured. Add your AI API key in Settings.') {
    super(message, 'CONFIG_ERROR')
    this.name = 'AIConfigError'
  }
}
