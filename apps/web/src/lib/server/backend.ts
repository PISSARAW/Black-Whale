const API_BASE = process.env['API_URL'] ?? process.env['VITE_API_URL'] ?? 'http://localhost:3001';

export async function backendRequest<T>(fetcher: typeof fetch, path: string, init?: RequestInit): Promise<T> {
  const response = await fetcher(`${API_BASE}/v1${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers
    }
  });
  if (!response.ok) {
    // The backend body can carry stack traces, SQL text or validation echoes.
    // It is logged for operators but never propagated into a page the public
    // can read — callers surface `error.message` straight to the user.
    const detail = await response.text().catch(() => '');
    console.error(`[backend] ${response.status} ${path}${detail ? ` — ${detail}` : ''}`);
    throw new Error(`Backend request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}
