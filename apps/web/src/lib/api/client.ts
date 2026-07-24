/**
 * Typed API client for the Black Whale backend.
 * Used by SvelteKit load functions and components.
 */

const API_BASE = typeof window !== 'undefined'
  ? (import.meta.env.VITE_API_URL ?? 'http://localhost:3001')
  : (process.env['API_URL'] ?? 'http://localhost:3001')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/v1${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  worldState: (params: { eventId?: string; chapterId?: string; spoilerLimit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request(`/world-state?${qs}`)
  },

  characters: {
    list: () => request('/characters'),
    get: (slug: string) => request(`/characters/${slug}`),
  },

  perspectives: {
    get: (characterId: string, eventId: string, spoilerLimit?: number) =>
      request(`/perspectives/${characterId}?eventId=${eventId}${spoilerLimit ? `&spoilerLimit=${spoilerLimit}` : ''}`),
    compare: (left: string, right: string, eventId: string) =>
      request(`/perspectives/compare?left=${left}&right=${right}&eventId=${eventId}`),
  },

  map: {
    state: (eventId: string) => request(`/map?eventId=${eventId}`),
    entityPresence: (entityId: string, eventId: string) =>
      request(`/map/entities/${entityId}/presence?eventId=${eventId}`),
  },

  nen: {
    abilities: () => request('/nen/abilities'),
    validate: (abilityId: string, body: unknown) =>
      request(`/nen/abilities/${abilityId}/validate`, { method: 'POST', body: JSON.stringify(body) }),
  },

  simulations: {
    create: (body: unknown) => request('/simulations', { method: 'POST', body: JSON.stringify(body) }),
    get: (branchId: string) => request(`/simulations/${branchId}`),
  },
}
