import * as THREE from 'three'
import { createVisitHatsuModel } from '../visitHatsuModel'
import type { VictoryContext } from './types'
import type { BiscuitVictoryPose } from './biscuitPose'
import { disposeVictoryObject, ease } from './resources'

/** Cookie treats Biscuit's hand only. Lotion has no offensive property. */
export function createBiscuitVictoryCookie() {
  const model = createVisitHatsuModel(THREE, {
    model: 'cookie-chan',
    anchor: 'floor',
    joints: [-1, 1].flatMap((side) => [
      `arm-${side}`,
      `massage-hand-${side}-palm`,
      ...Array.from({ length: 5 }, (_, i) => `massage-hand-${side}-finger-${i}`),
    ]),
  })
  const hands = [-1, 1].map((side) => {
    const hand = new THREE.Group()
    const palm = model.joints.get(`massage-hand-${side}-palm`)!
    model.root.updateWorldMatrix(true, true)
    hand.position.copy(model.body.worldToLocal(palm.getWorldPosition(new THREE.Vector3())))
    model.body.add(hand)
    const parts = [
      palm,
      ...Array.from({ length: 5 }, (_, i) => model.joints.get(`massage-hand-${side}-finger-${i}`)!),
    ]
    parts.forEach((part) => hand.attach(part))
    return hand
  })
  const root = new THREE.Group()
  root.name = 'biscuit-cookie-spa'
  root.add(model.root)
  const limbs = new THREE.Group()
  const skin = new THREE.MeshBasicMaterial({ color: 0xe7d3be })
  const arms = Array.from(
    { length: 4 },
    () => new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.033, 1, 12), skin),
  )
  limbs.add(...arms)
  root.add(limbs)
  const lotion = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe8db, transparent: true, opacity: 0.65 }),
  )
  root.add(lotion)
  const sparkles = Array.from(
    { length: 12 },
    () =>
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.012),
        new THREE.MeshBasicMaterial({ color: 0xffdba6 }),
      ),
  )
  root.add(...sparkles)
  const bottle = new THREE.Group()
  bottle.name = 'biscuit-lotion-bottle'
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.11, 16),
    new THREE.MeshBasicMaterial({ color: 0xe7bdd5 }),
  )
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.027, 12),
    new THREE.MeshBasicMaterial({ color: 0xdfca8e }),
  )
  cap.position.y = 0.066
  bottle.add(glass, cap)
  root.add(bottle)
  const segment = (mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3) => {
    mesh.position.copy(from).lerp(to, 0.5)
    mesh.scale.set(1, from.distanceTo(to), 1)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize())
  }
  return {
    root,
    sync(context: VictoryContext, pose: BiscuitVictoryPose) {
      const { hero, age } = context
      const active = age < 96 || age >= 420
      root.visible = active
      model.fit({ height: 1.6 })
      model.root.rotation.set(0, 0.65, 0)
      // Position the hands at the treatment site, then solve the arms back to the sleeves.
      model.root.position.set(hero.root.position.x - 0.55, 0, 0.02)
      model.root.updateWorldMatrix(true, true)
      const stroke = Math.sin(age * 0.4) * 0.018
      const errors: number[] = []
      for (const [i, side] of [-1, 1].entries()) {
        const old = model.joints.get(`arm-${side}`)
        if (old) old.visible = false
        const hand = hands[i]
        const site = pose.fist
          .clone()
          .add(new THREE.Vector3(side * 0.035, i ? 0.025 : -0.025, 0.015 + stroke))
        hand.position.copy(hand.parent!.worldToLocal(site.clone()))
        hand.updateWorldMatrix(true, true)
        errors.push(hand.getWorldPosition(new THREE.Vector3()).distanceTo(site))
        const shoulder = model.body.localToWorld(
          new THREE.Vector3(side * 0.235 * 0.95, 1.21 * 0.95, 0),
        )
        const elbow = shoulder
          .clone()
          .lerp(site, 0.5)
          .add(new THREE.Vector3(side * 0.12, -0.09, 0.12))
        segment(arms[i * 2], shoulder, elbow)
        segment(arms[i * 2 + 1], elbow, site)
      }
      bottle.position.copy(pose.fist).add(new THREE.Vector3(-0.12, -0.05, 0.06))
      bottle.rotation.z = -0.5
      lotion.position.copy(pose.fist)
      lotion.scale.set(0.07, 0.018 + Math.abs(stroke) * 0.3, 0.06)
      lotion.visible = active && age < 492
      sparkles.forEach((star, i) => {
        const t = (age * 0.025 + i / 12) % 1
        star.visible = active && age < 492
        star.position
          .copy(pose.fist)
          .add(
            new THREE.Vector3(
              Math.cos(i * 2.4) * t * 0.13,
              0.02 + t * 0.16,
              Math.sin(i * 2.4) * t * 0.08,
            ),
          )
        star.scale.setScalar(Math.sin(t * Math.PI))
        star.rotation.z = age * 0.08
      })
      // After polishing she steps back while Biscuit inspects the manicure.
      const retreat = ease((age - 486) / 36)
      if (retreat > 0) root.visible = age < 522
      return { active: root.visible, errors }
    },
    dispose() {
      model.dispose()
      disposeVictoryObject(limbs)
      model.root.removeFromParent()
      disposeVictoryObject(root)
    },
  }
}
