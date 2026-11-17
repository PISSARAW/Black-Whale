import { Mesh } from 'three'
import type { Material, Object3D } from 'three'
import { fightFigureVisible } from './fightFigureVisibility'
import type { FightSide, FightState } from './types'

/** Optional presentation marker for an absorbed or expelled actor; never changes combat state. */
export function createFighterTrackingSilhouettes() {
  const held = new Map<
    Object3D,
    Array<{ mesh: Mesh; material: Material | Material[]; ghosts: Material[] }>
  >()
  function restore(root: Object3D) {
    for (const entry of held.get(root) ?? []) {
      entry.mesh.material = entry.material
      entry.ghosts.forEach((material) => material.dispose())
    }
    held.delete(root)
  }
  return {
    sync(
      root: Object3D,
      { state, side, keep }: { state: FightState; side: FightSide; keep: boolean },
    ) {
      const present = fightFigureVisible(state, side)
      root.userData.fightSide = side
      root.visible = present || keep
      const marker = keep && !present
      if (!marker) {
        restore(root)
        return
      }
      if (held.has(root)) return
      const entries: Array<{ mesh: Mesh; material: Material | Material[]; ghosts: Material[] }> = []
      root.traverse((node) => {
        if (!(node instanceof Mesh)) return
        const original = node.material as Material | Material[]
        const ghosts = (Array.isArray(original) ? original : [original]).map((material) => {
          const clone = material.clone()
          clone.transparent = true
          clone.opacity = 0.38
          clone.depthWrite = false
          return clone
        })
        node.material = Array.isArray(original) ? ghosts : ghosts[0]
        entries.push({ mesh: node, material: original, ghosts })
      })
      held.set(root, entries)
    },
    dispose() {
      for (const root of held.keys()) restore(root)
    },
  }
}
