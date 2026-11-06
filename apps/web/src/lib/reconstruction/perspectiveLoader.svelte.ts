import type { PerspectiveProjection } from './perspective'

/** An observer change owns its request; an aborted response cannot replace it. */
export class PerspectiveLoader {
  projection = $state<PerspectiveProjection | null>(null)
  loading = $state(false)
  error = $state(false)

  request(options: { observer: string; event: string | null; spoiler: number | undefined }) {
    this.projection = null
    this.error = false
    this.loading = false
    if (options.observer === 'canon' || !options.event) return
    const controller = new AbortController()
    this.loading = true
    const query = new URLSearchParams({ observer: options.observer, event: options.event })
    if (options.spoiler !== undefined) query.set('spoiler', String(options.spoiler))
    void fetch(`/reconstruction/perspective?${query}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<PerspectiveProjection>
      })
      .then((projection) => {
        if (!controller.signal.aborted) this.projection = projection
      })
      .catch(() => {
        if (!controller.signal.aborted) this.error = true
      })
      .finally(() => {
        if (!controller.signal.aborted) this.loading = false
      })
    return () => controller.abort()
  }
}
