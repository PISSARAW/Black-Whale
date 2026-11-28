import { Box3, CatmullRomCurve3, Mesh, TubeGeometry, Vector3 } from 'three'
import type { Group, MeshBasicMaterial, Object3D } from 'three'
import type { VisitHatsuModel } from '../visitHatsuModel'
import { visibleVictoryBounds } from './bodyBounds'

function placeCentre(node: Object3D, target: Vector3) {
  const centre = visibleVictoryBounds(node).getCenter(new Vector3()),
    parent = node.parent!
  node.position.add(parent.worldToLocal(target.clone()).sub(parent.worldToLocal(centre)))
  node.updateWorldMatrix(true, true)
}
export function createCamillaPawGrip(model: VisitHatsuModel, root: Group, fur: MeshBasicMaterial) {
  const paws = [-1, 1].map((sign) => {
    const hand = model.joints.get(`hand-${sign}`)!,
      arm = model.joints.get(`arm-${sign}`)!
    const position = hand.position.clone(),
      rotation = hand.quaternion.clone()
    const bridge = new Mesh(
      new TubeGeometry(new CatmullRomCurve3([new Vector3(), new Vector3(0, 1, 0)]), 20, 0.145, 10),
      fur,
    )
    bridge.name = `camilla-gripping-arm:${sign}`
    root.add(bridge)
    return { sign, hand, arm, position, rotation, bridge }
  })
  return {
    sync(options: { body: Box3; x: number; approach: number; ratio: number; active: boolean }) {
      const { body, x, approach, ratio, active } = options
      return paws.map(({ sign, hand, arm, position, rotation, bridge }) => {
        hand.position.copy(position)
        hand.quaternion.copy(rotation)
        arm.visible = !active
        bridge.visible = active
        if (!active) return { side: sign, error: 0 }
        hand.rotation.z = (-sign * Math.PI) / 2
        hand.updateWorldMatrix(true, true)
        const size = visibleVictoryBounds(hand).getSize(new Vector3())
        const edge = sign < 0 ? body.min.x : body.max.x
        const offset = size.x / 2 - 0.035 * ratio + (1 - approach) * 0.5 * ratio
        const centre = body.getCenter(new Vector3())
        centre.x = edge + sign * offset
        centre.z += size.z * 0.3
        placeCentre(hand, centre)
        const bounds = visibleVictoryBounds(hand)
        const shoulder = new Vector3(x + sign * 0.48 * ratio, 1.86 * ratio, -0.29 * ratio)
        const elbow = new Vector3(x + sign * 0.92 * ratio, centre.y - 0.15 * ratio, 0.23 * ratio)
        const wrist = centre.clone().add(new Vector3(sign * size.x * 0.38, 0, -0.03 * ratio))
        bridge.geometry.dispose()
        bridge.geometry = new TubeGeometry(
          new CatmullRomCurve3([shoulder, elbow, wrist]),
          20,
          0.145 * ratio,
          10,
        )
        return { side: sign, error: Math.abs((sign < 0 ? bounds.max.x : bounds.min.x) - edge) }
      })
    },
    dispose() {
      paws.forEach(({ bridge }) => {
        bridge.removeFromParent()
        bridge.geometry.dispose()
      })
    },
  }
}
