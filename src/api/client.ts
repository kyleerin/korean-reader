function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? '';
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return payload as T;
}
