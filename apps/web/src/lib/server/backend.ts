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
    const message = await response.text();
    throw new Error(`Backend ${response.status}: ${message || path}`);
  }
  return response.json() as Promise<T>;
}
