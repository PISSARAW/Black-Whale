import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { VoconteVictoryPose } from './vocontePose'
import { createVoconteGantry } from './voconteGantry'
import { disposeVictoryObject, ease } from './resources'

function box(size: [number, number, number], colour: number) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshBasicMaterial({ color: colour }),
  )
}
function letter(id: 'A' | 'B') {
  const paths =
    id === 'A'
      ? [
          [-0.12, 0, 0, 0.32],
          [0, 0.32, 0.12, 0],
          [-0.07, 0.12, 0.07, 0.12],
        ]
      : [
          [-0.1, 0, -0.1, 0.32],
          [-0.1, 0.32, 0.09, 0.27],
          [0.09, 0.27, 0.09, 0.19],
          [0.09, 0.19, -0.1, 0.16],
          [-0.1, 0.16, 0.1, 0.12],
          [0.1, 0.12, 0.1, 0.02],
          [0.1, 0.02, -0.1, 0],
        ]
  const points = paths.flatMap(([x1, y1, x2, y2]) => [
    new THREE.Vector3(x1, y1, 0),
    new THREE.Vector3(x2, y2, 0),
  ])
  return new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xcbeee3 }),
  )
}
function frame(id: 'A' | 'B') {
  const root = new THREE.Group(),
    hinge = new THREE.Group()
  root.name = `voconte-victory-fixed-door-${id}`
  const jambs = [box([1, 1, 1], 0x89928f), box([1, 1, 1], 0x89928f)]
  const lintel = box([1, 1, 1], 0x89928f)
  const leaf = box([0.08, 1, 1], 0x405059)
  const strips = [box([0.015, 0.035, 1], 0x8e9999), box([0.015, 0.035, 1], 0x8e9999)]
  const handle = box([0.08, 0.035, 0.17], 0xc4b18a)
  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x061314,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
    }),
  )
  portal.rotation.y = Math.PI / 2
  const glow = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x7ec8b6, transparent: true, opacity: 0.75 }),
  )
  const label = letter(id)
  const stain = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 10),
    new THREE.MeshBasicMaterial({ color: 0x682d36 }),
  )
  stain.scale.set(0.007, 0.095, 0.11)
  hinge.add(leaf, handle, ...strips, stain)
  root.add(...jambs, lintel, hinge, portal, glow, label)
  return { root, hinge, jambs, lintel, leaf, strips, handle, portal, glow, label, stain }
}
function syncFrame(model: ReturnType<typeof frame>, pose: VoconteVictoryPose, id: 'A' | 'B') {
  const { layout } = pose,
    { width: w, height: h } = layout
  model.root.position.set(id === 'A' ? layout.a : layout.b, id === 'A' ? 0 : layout.elevation, 0)
  model.jambs.forEach((mesh, i) => {
    mesh.scale.set(0.14, h, 0.14)
    mesh.position.set(0, h / 2, ((i ? 1 : -1) * w) / 2)
  })
  model.lintel.scale.set(0.14, 0.14, w + 0.14)
  model.lintel.position.set(0, h, 0)
  model.hinge.position.z = -w / 2
  model.hinge.rotation.y = id === 'A' ? pose.angle : 1.45
  model.leaf.scale.set(1, h, w)
  model.leaf.position.set(0, h / 2, w / 2)
  model.handle.position.set(0.065, layout.handleY, w * 0.3)
  model.strips.forEach((strip, i) => {
    strip.scale.z = w * 0.94
    strip.position.set(0.047, h * (i ? 0.78 : 0.25), w / 2)
  })
  model.portal.position.y = h / 2
  model.portal.scale.set(w, h, 1)
  model.label.position.set(0, h + 0.12, w / 2 + 0.1)
  model.glow.geometry.dispose()
  model.glow.geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.08, 0, -w / 2),
    new THREE.Vector3(0.08, h, -w / 2),
    new THREE.Vector3(0.08, h, -w / 2),
    new THREE.Vector3(0.08, h, w / 2),
    new THREE.Vector3(0.08, h, w / 2),
    new THREE.Vector3(0.08, 0, w / 2),
  ])
}
export function createVoconteFrames() {
  const root = new THREE.Group(),
    a = frame('A'),
    b = frame('B'),
    gantry = createVoconteGantry()
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshBasicMaterial({ color: 0x54252b, transparent: true, opacity: 0.85 }),
  )
  pool.rotation.x = -Math.PI / 2
  root.add(a.root, b.root, pool, gantry.root)
  return {
    root,
    sync(context: VictoryContext, pose: VoconteVictoryPose) {
      syncFrame(a, pose, 'A')
      syncFrame(b, pose, 'B')
      gantry.sync(pose.layout)
      const warm = ['vip-casino', 'banquet-hall'].includes(context.state.environment.stageId)
      for (const model of [a, b]) {
        model.leaf.material.color.setHex(warm ? 0x694f42 : 0x405059)
        model.glow.visible = context.age >= 30 && context.age < 468
        model.portal.visible = context.age >= 30 && context.age < 468
        model.glow.material.opacity = 0.75 * ease((context.age - 30) / 18)
        model.stain.visible = false
      }
      pool.visible = Boolean(pose.fall?.landing)
      pool.position.copy(
        pose.fall?.landingPoint ?? new THREE.Vector3(context.victim.root.position.x, 0.016, 0),
      )
      pool.position.y = 0.016
      pool.scale.set(1, ease((context.age - (pose.landingFrame ?? 600)) / 24) * 0.6, 1)
      context.add(root)
      root.updateWorldMatrix(true, true)
      return {
        doorA: a.root.position.toArray(),
        doorB: b.root.position.toArray(),
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
