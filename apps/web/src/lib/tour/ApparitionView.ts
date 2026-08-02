import type * as Three from 'three'
import type { PortalRenderer } from './PortalRenderer'

export interface RenderedApparition {
  root: Three.Group
  key: string
}

export interface ApparitionSync<TSeen, TRendered extends RenderedApparition> {
  idOf: (seen: TSeen) => string
  keyOf: (seen: TSeen) => string
  build: (seen: TSeen) => TRendered
  update: (rendered: TRendered, seen: TSeen) => void
  preserve: (rendered: TRendered) => unknown
  restore: (rendered: TRendered, preserved: unknown) => void
  leaving: (rendered: TRendered) => boolean
  sweep: (rendered: TRendered) => void
}

/** Owns the scene membership and GPU lifetime of rendered apparitions. */
export class ApparitionView<T extends RenderedApparition> {
  readonly items: Record<string, T | undefined> = {}

  constructor(
    private readonly scene: Three.Scene,
    private readonly portals: PortalRenderer,
  ) {}

  add(id: string, apparition: T): void {
    this.items[id] = apparition
    this.scene.add(apparition.root)
  }

  sync<TSeen>(wanted: readonly TSeen[], operations: ApparitionSync<TSeen, T>): void {
    const standing = new Set<string>()
    for (const seen of wanted) {
      const id = operations.idOf(seen)
      const key = operations.keyOf(seen)
      standing.add(id)
      let held = this.items[id]
      const preserved = held ? operations.preserve(held) : undefined
      if (held && held.key !== key) {
        this.drop(id)
        held = undefined
      }
      if (!held) {
        held = operations.build(seen)
        held.key = key
        operations.restore(held, preserved)
        this.add(id, held)
      }
      operations.update(held, seen)
    }
    for (const id of Object.keys(this.items)) {
      if (standing.has(id)) continue
      const held = this.items[id]
      if (held && operations.leaving(held)) {
        operations.sweep(held)
        this.detach(id)
      } else {
        this.drop(id)
      }
    }
  }

  animate(
    seconds: number,
    delta: number,
    animator: (held: T, seconds: number, delta: number) => void,
  ): void {
    for (const held of Object.values(this.items)) if (held) animator(held, seconds, delta)
  }

  detach(id: string): T | undefined {
    const held = this.items[id]
    if (!held) return undefined
    delete this.items[id]
    return held
  }

  drop(id: string): void {
    const held = this.detach(id)
    if (!held) return
    this.scene.remove(held.root)
    this.portals.drop(id)
    held.root.traverse((part) => {
      const mesh = part as Three.Mesh
      if (mesh.geometry && !mesh.geometry.userData.sharedHuman) mesh.geometry.dispose()
    })
  }

  dispose(): void {
    for (const id of Object.keys(this.items)) this.drop(id)
  }
}
