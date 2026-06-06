const STORAGE_KEY = 'korean-reader:deepl-api-key';

export function getDeepLApiKey(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value?.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function setDeepLApiKey(apiKey: string): void {
  localStorage.setItem(STORAGE_KEY, apiKey.trim());
}

export function clearDeepLApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasDeepLApiKey(): boolean {
  return getDeepLApiKey() !== null;
}
