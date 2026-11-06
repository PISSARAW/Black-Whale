import { afterEach, describe, expect, it, vi } from 'vitest'
import { PerspectiveLoader } from './perspectiveLoader.svelte'
import type { PerspectiveProjection } from './perspective'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}
const projection = (id: string): PerspectiveProjection => ({
  visibleBodyIds: [id],
  knownFactCount: 1,
  beliefCount: 0,
})

afterEach(() => vi.unstubAllGlobals())

describe('observer request ownership', () => {
  it('does not let an aborted observer replace the current projection or clear its loading state', async () => {
    const first = deferred<PerspectiveProjection>()
    const second = deferred<PerspectiveProjection>()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => first.promise })
      .mockResolvedValueOnce({ ok: true, json: () => second.promise })
    vi.stubGlobal('fetch', fetcher)
    const loader = new PerspectiveLoader()
    const abort = loader.request({ observer: 'first', event: 'event', spoiler: undefined })
    await Promise.resolve()
    abort?.()
    loader.request({ observer: 'second', event: 'event', spoiler: undefined })
    first.resolve(projection('stale'))
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    expect(loader.loading).toBe(true)
    expect(loader.projection).toBeNull()
    second.resolve(projection('current'))
    await vi.waitFor(() => expect(loader.loading).toBe(false))
    expect(loader.projection?.visibleBodyIds).toEqual(['current'])
    expect(fetcher.mock.calls[0][0]).not.toContain('spoiler=')
  })

  it('reports failures and returns to the canonical perspective without another request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    const loader = new PerspectiveLoader()
    loader.request({ observer: 'reader', event: 'event', spoiler: 383 })
    await vi.waitFor(() => expect(loader.error).toBe(true))
    loader.request({ observer: 'canon', event: 'event', spoiler: undefined })
    expect(loader.projection).toBeNull()
    expect(loader.error).toBe(false)
    expect(loader.loading).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
