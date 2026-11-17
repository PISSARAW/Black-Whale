import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { KurapikaJudgmentPose } from './kurapikaJudgmentPose'
import { JUDGMENT_IMPLANT, JUDGMENT_BREACH } from './kurapikaJudgmentPose'
import { disposeVictoryObject, ease } from './resources'

/** A small cutaway lens exposes only the implanted heart seal, never a torso binding. */
export function createJudgmentHeart() {
  const root = new THREE.Group()
  root.name = 'kurapika-judgment-heart-cutaway'
  const heart = new THREE.Group()
  const heartMaterial = new THREE.MeshBasicMaterial({ color: 0x862638 })
  for (const [x, y, z, rx, ry, rz] of [
    [-0.035, -0.025, 0.015, 0.13, 0.2, 0.08],
    [0.085, -0.02, 0.03, 0.1, 0.17, 0.08],
    [-0.1, 0.115, 0.025, 0.09, 0.085, 0.07],
    [0.095, 0.12, 0, 0.085, 0.09, 0.06],
  ]) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), heartMaterial)
    lobe.position.set(x, y, z)
    lobe.scale.set(rx, ry, rz)
    lobe.rotation.z = -0.25
    heart.add(lobe)
  }
  const vessel = (points: number[][], radius: number, color: number) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
    heart.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, radius, 8, false),
        new THREE.MeshBasicMaterial({ color }),
      ),
    )
  }
  vessel(
    [
      [0, 0.08, 0.02],
      [-0.015, 0.23, 0.015],
      [0.065, 0.26, 0.01],
      [0.13, 0.18, 0],
    ],
    0.03,
    0xa4494e,
  )
  vessel(
    [
      [-0.1, 0.1, 0.01],
      [-0.15, 0.21, 0],
      [-0.14, 0.28, 0],
    ],
    0.024,
    0x49354f,
  )
  vessel(
    [
      [0.02, 0.13, 0.1],
      [-0.025, -0.01, 0.1],
      [0.03, -0.15, 0.09],
    ],
    0.007,
    0x472131,
  )
  vessel(
    [
      [-0.025, -0.01, 0.1],
      [-0.09, -0.045, 0.09],
      [-0.12, -0.09, 0.07],
    ],
    0.006,
    0x472131,
  )
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 64),
    new THREE.MeshBasicMaterial({
      color: 0x090e1a,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide,
    }),
  )
  lens.position.z = -0.012
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.007, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xbd9a6c }),
  )
  const links = Array.from({ length: 22 }, (_, i) => {
    const link = new THREE.Mesh(
      new THREE.TorusGeometry(0.026, 0.007, 5, 10),
      new THREE.MeshBasicMaterial({ color: 0xa9b5c5 }),
    )
    const a = (i / 22) * Math.PI * 2
    link.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.13, 0.025)
    link.rotation.y = i % 2 ? 0.75 : 0
    root.add(link)
    return link
  })
  const stake = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.26, 4),
    new THREE.MeshBasicMaterial({ color: 0xd8dce4 }),
  )
  stake.rotation.z = -Math.PI / 2
  stake.position.z = 0.04
  root.add(lens, rim, heart, stake)
  for (const [i, layer] of [lens, heart, ...links, stake, rim].entries()) {
    layer.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.renderOrder = 1000 + i
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      materials.forEach((material) => {
        material.depthTest = false
        material.depthWrite = false
        material.transparent = true
      })
    })
  }
  return {
    root,
    sync(context: VictoryContext, pose: KurapikaJudgmentPose) {
      const { age } = context
      root.visible = age >= JUDGMENT_IMPLANT && age < JUDGMENT_BREACH + 18
      root.position.copy(pose.heart)
      root.quaternion.copy(context.camera.quaternion)
      root.scale.setScalar(Math.max(0.45, Math.min(0.8, context.victim.height * 0.42)))
      const breach = ease((age - JUDGMENT_BREACH) / 12)
      const pulse = age < JUDGMENT_BREACH ? 1 + Math.sin(age * 0.22) * 0.055 : 1 - breach * 0.2
      heart.scale.setScalar(pulse)
      heartMaterial.color.setHex(age < JUDGMENT_BREACH ? 0x992a39 : 0x462b34)
      links.forEach((link, i) => {
        const a = (i / links.length) * Math.PI * 2
        link.position.set(
          Math.cos(a) * (0.2 - breach * 0.045),
          Math.sin(a) * (0.13 - breach * 0.025),
          0.025,
        )
      })
      stake.position.x = -0.27 + breach * 0.23
      return { seal: root.visible, breached: age >= JUDGMENT_BREACH }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
