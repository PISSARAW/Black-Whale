import type { Mesh } from 'three'
import type { FightRig } from './fightRig'
import type { ArcadeFighter } from './types'

/** A bent ankle changes the boot's lowest vertex even when its origin is planted. */
export function plantHanzoSoles(rig: FightRig, fighter: ArcadeFighter): void {
  if (fighter.id !== 'hanzo' || fighter.hanzoProjection || fighter.y > 0) return
  const parent = rig.human.figure.parent
  if (!parent) return
  let lowest = Infinity
  for (const ankle of rig.ankles)
    ankle.traverse((node) => {
      const mesh = node as Mesh
      if (!mesh.isMesh) return
      mesh.updateWorldMatrix(true, false)
      const vertices = mesh.geometry.getAttribute('position'),
        matrix = mesh.matrixWorld.elements
      for (let i = 0; i < vertices.count; i++)
        lowest = Math.min(
          lowest,
          matrix[1] * vertices.getX(i) +
            matrix[5] * vertices.getY(i) +
            matrix[9] * vertices.getZ(i) +
            matrix[13],
        )
    })
  if (!Number.isFinite(lowest)) return
  const ground = parent.getWorldPosition(rig.probe).y
  const scale = parent.getWorldScale(rig.probe).y
  rig.human.figure.position.y += (ground + 0.004 - lowest) / scale
}
