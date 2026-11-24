import {
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  SphereGeometry,
  CylinderGeometry,
  Vector3,
} from 'three'
import { disposeVictoryObject, ease } from './resources'
import type { VictoryContext } from './types'

function segment(
  group: Group,
  points: readonly [Vector3, Vector3],
  material: MeshStandardMaterial,
) {
  const [from, to] = points
  const direction = to.clone().sub(from)
  const mesh = new Mesh(new CylinderGeometry(0.0017, 0.0012, direction.length(), 5), material)
  mesh.position.copy(from).add(to).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize())
  group.add(mesh)
}
function insectModel() {
  const root = new Group(),
    legs: Group[] = []
  root.name = 'sayird-real-cockroach'
  const material = new MeshStandardMaterial({
    color: 0xb27a40,
    emissive: 0x321b08,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0.12,
  })
  const body = new Mesh(new SphereGeometry(1, 16, 10), material)
  body.scale.set(0.023, 0.011, 0.041)
  body.position.y = 0.014
  root.add(body)
  const head = new Mesh(new SphereGeometry(0.012, 10, 8), material)
  head.position.set(0, 0.016, 0.038)
  root.add(head)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const leg = new Group(),
        z = (i - 1) * 0.022
      segment(
        leg,
        [new Vector3(side * 0.015, 0.015, z), new Vector3(side * 0.04, 0.012, z - 0.012)],
        material,
      )
      segment(
        leg,
        [new Vector3(side * 0.04, 0.012, z - 0.012), new Vector3(side * 0.055, 0.002, z - 0.025)],
        material,
      )
      legs.push(leg)
      root.add(leg)
    }
    segment(
      root,
      [new Vector3(side * 0.006, 0.02, 0.04), new Vector3(side * 0.027, 0.026, 0.083)],
      material,
    )
  }
  return { root, legs }
}

export function createSayirdInsect() {
  const { root, legs } = insectModel(),
    aura = new Group()
  aura.name = 'sayird-little-eye-capture'
  const material = new MeshBasicMaterial({
    color: 0xa6e8a3,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  })
  const sphere = new Mesh(new SphereGeometry(0.047, 16, 12), material)
  aura.add(sphere)
  return {
    update(context: VictoryContext, palm: Vector3) {
      const travel = ease((context.age - 90) / 90)
      const start = new Vector3(context.hero.root.position.x + 0.55, 0.012, 0.36)
      const finish = new Vector3(context.victim.root.position.x + 1.6, 0.012, 1.05)
      root.position.copy(start).lerp(finish, travel)
      root.position.z += Math.sin(travel * Math.PI) * 0.35
      root.rotation.y = Math.atan2(finish.x - start.x, finish.z - start.z)
      legs.forEach((leg, index) => {
        leg.rotation.y =
          context.age > 90 && context.age < 180
            ? Math.sin(context.age * 0.65 + index * Math.PI) * 0.18
            : 0
      })
      const capture = ease((context.age - 24) / 42)
      aura.visible = context.age >= 24 && context.age < 90
      aura.position.copy(palm).lerp(root.position.clone().add(new Vector3(0, 0.026, 0)), capture)
      sphere.scale.setScalar(1 + Math.sin(capture * Math.PI) * 0.6)
      material.opacity = 0.2 * (1 - ease((context.age - 66) / 24))
      context.add(root)
      context.add(aura)
      return {
        position: root.position.clone(),
        captured: context.age >= 66,
        capture,
        hostExistsBeforeCapture: true,
      }
    },
    dispose() {
      disposeVictoryObject(root)
      disposeVictoryObject(aura)
    },
  }
}
