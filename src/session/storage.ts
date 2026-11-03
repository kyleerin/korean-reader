const STORAGE_KEY = 'korean-reader:reading-session';

export function getReadingSession(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}

export function saveReadingSession(sourceText: string): void {
  const trimmed = sourceText.trim();
  if (!trimmed) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, trimmed);
}

export function clearReadingSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasReadingSession(): boolean {
  return getReadingSession() !== null;
}
