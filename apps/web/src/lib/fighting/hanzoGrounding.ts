import type { Mesh } from 'three'
import type { FightRig } from './fightRig'
import type { ArcadeFighter } from './types'

/** A bent ankle changes the boot's lowest vertex even when its origin is planted. */
export function plantHanzoSoles(rig: FightRig, fighter: ArcadeFighter): void {
  if (fighter.id !== 'hanzo' || fighter.hanzoProjection || fighter.y > 0) return
  const parent = rig.human.figure.parent
  if (!parent) return
  let lowest = Infinity
  for (const ankle of rig.ankles) {
    ankle.updateWorldMatrix(true, false)
    ankle.updateMatrixWorld(true)
    ankle.traverse((node) => {
      const mesh = node as Mesh
      if (!mesh.isMesh) return
      const vertices = mesh.geometry.getAttribute('position')
      for (let i = 0; i < vertices.count; i++) {
        mesh.getVertexPosition(i, rig.probe).applyMatrix4(mesh.matrixWorld)
        lowest = Math.min(lowest, rig.probe.y)
      }
    })
  }
  if (!Number.isFinite(lowest)) return
  const ground = parent.getWorldPosition(rig.probe).y
  const scale = parent.getWorldScale(rig.probe).y
  rig.human.figure.position.y += (ground + 0.004 - lowest) / scale
}
