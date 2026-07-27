export function resolveExtensionAsset(path: string): string {
  return chrome.runtime.getURL(path)
}

export function getAppIconUrl(): string {
  return chrome.runtime.getURL('icons/icon-48.png')
}
