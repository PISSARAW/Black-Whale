import { Box3, CatmullRomCurve3, Mesh, MeshBasicMaterial, TubeGeometry, Vector3 } from 'three'
import type { Object3D, Scene } from 'three'

const fur = new MeshBasicMaterial({ color: 0x39303f })
const armFur = new MeshBasicMaterial({ color: 0x302735 })

function placeCentre(node: Object3D, target: Vector3) {
  node.updateWorldMatrix(true, true)
  const centre = new Box3().setFromObject(node).getCenter(new Vector3())
  const parent = node.parent!
  node.position.add(parent.worldToLocal(target.clone()).sub(parent.worldToLocal(centre)))
  node.updateWorldMatrix(true, true)
}

/** The retained native paws turn inward; their fingertips stay on the compressed body. */
export function gripWithPaws(scene: Scene, options: { body: Box3; x: number; approach: number }) {
  const cat = scene.getObjectByName('cats-name-feline')!
  const restores: Array<() => void> = []
  const contacts: Array<{ side: number; inner: number; bodyEdge: number }> = []
  for (const sign of [-1, 1]) {
    const hand = cat.getObjectByName(`hand-${sign}:combat-joint`)
    const arm = cat.getObjectByName(`arm-${sign}:combat-joint`)
    if (!hand || !arm) throw new Error(`Missing Cat’s Name paw: ${sign}`)
    const at = hand.position.clone(),
      rotation = hand.quaternion.clone(),
      visibility = arm.visible
    const materials: Array<{ mesh: Mesh; material: Mesh['material'] }> = []
    hand.traverse((node) => {
      if (!(node instanceof Mesh)) return
      materials.push({ mesh: node, material: node.material })
      node.material = fur
    })
    hand.rotation.z = (-sign * Math.PI) / 2
    hand.updateWorldMatrix(true, true)
    const size = new Box3().setFromObject(hand).getSize(new Vector3())
    const edge = sign < 0 ? options.body.min.x : options.body.max.x
    const offset = size.x / 2 - 0.035 + (1 - options.approach) * 0.5
    const centre = new Vector3(edge + sign * offset, 1.14, 0.91)
    placeCentre(hand, centre)
    const bounds = new Box3().setFromObject(hand)
    contacts.push({ side: sign, inner: sign < 0 ? bounds.max.x : bounds.min.x, bodyEdge: edge })
    arm.visible = false
    const shoulder = new Vector3(options.x + sign * 0.48, 1.86, -0.2)
    const elbow = new Vector3(options.x + sign * 0.92, 1.36, 0.26)
    const wrist = centre.clone().add(new Vector3(sign * size.x * 0.38, 0, -0.03))
    const bridge = new Mesh(
      new TubeGeometry(new CatmullRomCurve3([shoulder, elbow, wrist]), 20, 0.145, 10, false),
      armFur,
    )
    bridge.name = `cats-name-gripping-arm:${sign}`
    scene.add(bridge)
    restores.push(() => {
      materials.forEach(({ mesh, material }) => {
        mesh.material = material
      })
      hand.position.copy(at)
      hand.quaternion.copy(rotation)
      arm.visible = visibility
      scene.remove(bridge)
      bridge.geometry.dispose()
    })
  }
  return { contacts, restore: () => restores.reverse().forEach((restore) => restore()) }
}
