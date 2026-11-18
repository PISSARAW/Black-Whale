import * as T from 'three'
import type { VictoryContext } from './types'
import type { RihanPose } from './rihanPose'
import type { RihanPlan } from './rihanPlan'
import { RIHAN_TIMING } from './rihanPlan'
import { ease, disposeVictoryObject } from './resources'

/** Two fictional counter-designs for this film, distinct from the attested smoke-eater. */
export function createRihanCreature() {
  const root = new T.Group(),
    body = new T.Group(),
    mouth = new T.Group()
  root.name = 'rihan-tailored-predator'
  const hide = new T.MeshBasicMaterial({ color: 0xb5a191 }),
    dark = new T.MeshBasicMaterial({ color: 0x29242a }),
    ivory = new T.MeshBasicMaterial({ color: 0xe8d8bc })
  const shell = new T.Mesh(new T.SphereGeometry(1, 24, 16), hide)
  shell.scale.set(0.42, 0.35, 0.5)
  shell.position.z = -0.23
  for (let i = 0; i < 5; i++) {
    const rib = new T.Mesh(new T.TorusGeometry(0.32, 0.025, 7, 24), ivory)
    rib.position.z = -0.54 + i * 0.13
    rib.scale.set(1.22, 0.95, 1)
    body.add(rib)
  }
  const cavity = new T.Mesh(new T.SphereGeometry(1, 24, 16), dark)
  cavity.scale.set(0.36, 0.36, 0.13)
  mouth.position.z = 0.27
  mouth.add(cavity)
  const petals: T.Group[] = []
  for (let i = 0; i < 4; i++) {
    const pivot = new T.Group(),
      angle = (i * Math.PI) / 2
    pivot.rotation.z = angle
    const plate = new T.Mesh(new T.SphereGeometry(1, 16, 10), hide)
    plate.position.set(0, 0.28, 0.07)
    plate.scale.set(0.24, 0.36, 0.11)
    pivot.add(plate)
    for (let tooth = 0; tooth < 7; tooth++) {
      const fang = new T.Mesh(new T.ConeGeometry(0.025, 0.15, 7), ivory)
      fang.position.set((tooth - 3) * 0.055, 0.24, 0.19)
      fang.rotation.x = Math.PI / 2
      pivot.add(fang)
    }
    mouth.add(pivot)
    petals.push(pivot)
  }
  body.add(shell, mouth)
  const legs = Array.from(
    { length: 8 },
    () => new T.Mesh(new T.CylinderGeometry(0.028, 0.048, 1, 8), hide),
  )
  const claws = Array.from(
    { length: 4 },
    () => new T.Mesh(new T.ConeGeometry(0.045, 0.19, 8), dark),
  )
  root.add(body, ...legs, ...claws)
  const bone = (mesh: T.Mesh, a: T.Vector3, b: T.Vector3) => {
    mesh.position.copy(a).lerp(b, 0.5)
    mesh.scale.y = a.distanceTo(b)
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  }
  return {
    sync(
      context: VictoryContext,
      options: { pose: RihanPose; prey: { maw: T.Vector3 }; plan: RihanPlan },
    ) {
      const { pose, prey, plan } = options
      const { age } = context
      const born = ease((age - RIHAN_TIMING.birth) / 66)
      const gone = 1 - ease((age - RIHAN_TIMING.consumed) / 24)
      const growth = born * gone
      root.visible = plan.prey !== null && age >= RIHAN_TIMING.birth && age < RIHAN_TIMING.dismissed
      const origin = prey.maw.clone().add(new T.Vector3(-0.27, 0, 0))
      body.position.copy(pose.palm).lerp(origin, born)
      body.rotation.set(0, Math.PI / 2, 0)
      body.scale.setScalar(Math.max(0.001, growth))
      const open = ease((age - 114) / 42) * (1 - ease((age - 282) / 60))
      petals.forEach((petal, i) => {
        petal.rotation.x = -open * (plan.kind === 'vacuum' ? 0.9 : 0.55)
        petal.rotation.z = (i * Math.PI) / 2
      })
      body.updateWorldMatrix(true, true)
      for (let i = 0; i < 4; i++) {
        const sx = i % 2 ? 1 : -1,
          sz = i < 2 ? -1 : 1
        const start = body.localToWorld(new T.Vector3(sx * 0.25, -0.12, sz * 0.15))
        const anchoredX = origin.x - (plan.kind === 'vacuum' ? 0.44 * ease((age - 240) / 42) : 0)
        const anchor = new T.Vector3(anchoredX + sx * 0.44, 0.025, origin.z + sz * 0.44)
        anchor.lerp(body.position, 1 - growth)
        const elbow = start
          .clone()
          .lerp(anchor, 0.5)
          .add(new T.Vector3(sx * 0.16, 0.1, sz * 0.15))
        bone(legs[i * 2], start, elbow)
        bone(legs[i * 2 + 1], elbow, anchor)
        claws[i].position.copy(anchor)
        claws[i].position.y += 0.095 * growth
        claws[i].rotation.z = Math.PI
        claws[i].scale.setScalar(growth)
      }
      context.add(root)
      return {
        beastVisible: root.visible,
        body: body.position.clone(),
        maw: body.localToWorld(new T.Vector3(0, 0, 0.27)),
        counterDesign: plan.kind,
        assumedCanonicalAnatomy: false,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
