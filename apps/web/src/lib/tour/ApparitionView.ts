import type * as Three from 'three'
import type { PortalRenderer } from './PortalRenderer'

export interface RenderedApparition {
  root: Three.Group
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
