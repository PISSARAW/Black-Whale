import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { FurykovCounterPlan } from './furykovCounterPlan'
import type { furykovCounterPose } from './furykovCounterPose'
import { disposeVictoryObject, ease } from './resources'

export function createFurykovCounterEffects() {
  const root = new THREE.Group()
  root.name = 'furykov-bespoke-weapon-counter'
  const guardMaterial = new THREE.MeshBasicMaterial({
    color: 0xb5bfd5,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  })
  const guard = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), guardMaterial)
  root.add(guard)
  const threadMaterial = new THREE.MeshBasicMaterial({
    color: 0xc181ba,
    transparent: true,
    opacity: 0.8,
  })
  const threads = Array.from({ length: 3 }, () => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), threadMaterial)
    root.add(mesh)
    return mesh
  })
  const bullets = Array.from({ length: 5 }, () => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xdab88c }),
    )
    root.add(mesh)
    return mesh
  })
  const fragments = Array.from({ length: 12 }, (_, i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.026, 0.008),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x9b99af : 0xadc9d7 }),
    )
    root.add(mesh)
    return mesh
  })
  return {
    root,
    sync(
      context: VictoryContext,
      plan: FurykovCounterPlan,
      pose: ReturnType<typeof furykovCounterPose>,
    ) {
      const { age } = context
      guard.visible = plan.kind === 'pierce' && age >= 180 && age < 312
      guard.position.copy(pose.target)
      guard.position.x += context.victim.width * 0.35
      guard.scale.set(
        context.victim.width * 0.75,
        context.victim.height * 0.4,
        context.victim.width * 0.7,
      )
      guardMaterial.opacity = 0.2 * (1 - ease((age - 276) / 24))
      const hand = context.victim.root
        .getObjectByName('hand-right')!
        .getWorldPosition(new THREE.Vector3())
      const split = ease((age - 216) / 24)
      threads.forEach((mesh, i) => {
        mesh.visible = plan.kind === 'sever' && age >= 180 && age < 252
        const from = hand.clone().add(new THREE.Vector3(0, (i - 1) * 0.035, 0))
        const to = pose.weaponTip
          .clone()
          .add(new THREE.Vector3(0, -0.12, 0))
          .lerp(from, split * 0.85)
        const delta = to.clone().sub(from)
        mesh.position.copy(from).lerp(to, 0.5)
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize())
        mesh.scale.y = Math.max(0.001, delta.length())
      })
      threadMaterial.opacity = 0.8 * (1 - split)
      bullets.forEach((mesh, i) => {
        mesh.visible = plan.kind === 'intercept' && age >= 180 && age < 252
        const t = Math.max(0, Math.min(1, (age - 180 - i * 6) / 30))
        mesh.position.copy(hand).lerp(pose.weaponTip, Math.min(1, t * 1.5))
        mesh.position.y -= Math.max(0, t - 0.66) * 1.8
      })
      const impact = Math.max(
        ...[216, 276, 336, 414].map((at) => (age >= at && age < at + 18 ? at : -1)),
      )
      const p = impact < 0 ? 0 : (age - impact) / 18
      fragments.forEach((mesh, i) => {
        mesh.visible = impact >= 0
        mesh.position
          .copy(impact === 216 ? pose.weaponTip : pose.target)
          .add(
            new THREE.Vector3(
              Math.cos(i * 2.4) * p * 0.3,
              Math.sin(i * 2.4) * p * 0.28 - p * p * 0.2,
              p * ((i % 3) - 1) * 0.17,
            ),
          )
        mesh.scale.setScalar(Math.max(0.01, 1 - p))
      })
      context.add(root)
      return {
        tetherSevered: plan.kind === 'sever' && age >= 216,
        projectilesIntercepted: plan.kind === 'intercept' && age >= 216,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
