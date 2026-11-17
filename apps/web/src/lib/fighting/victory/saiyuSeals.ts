import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { SaiyuVictoryPose } from './saiyuPose'
import { SAIYU_CONTACTS } from './saiyuPose'
import { disposeVictoryObject, ease } from './resources'

function glyph(kind: number, color: number) {
  const root = new THREE.Group()
  const material = new THREE.LineBasicMaterial({ color })
  const line = (points: number[][]) =>
    root.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
        ),
        material,
      ),
    )
  if (kind === 0) {
    line(
      Array.from({ length: 33 }, (_, i) => {
        const a = (i * Math.PI) / 16
        return [Math.cos(a) * 0.14, Math.sin(a) * 0.075]
      }),
    )
    line([
      [0, -0.04],
      [0, 0.04],
    ])
  } else if (kind === 1) {
    line(
      Array.from({ length: 25 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 1.7) / 24
        return [Math.cos(a) * 0.1, Math.sin(a) * 0.14]
      }),
    )
    line([
      [0.02, 0.05],
      [-0.035, 0.06],
      [-0.04, -0.03],
      [0.01, -0.045],
      [0, -0.1],
    ])
  } else {
    line([
      [-0.13, 0],
      [-0.06, 0.025],
      [0, 0.008],
      [0.06, 0.025],
      [0.13, 0],
      [0.06, -0.04],
      [-0.06, -0.04],
      [-0.13, 0],
    ])
  }
  line([
    [-0.14, -0.14],
    [0.14, 0.14],
  ])
  root.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.008, 6, 48),
      new THREE.MeshBasicMaterial({ color }),
    ),
  )
  return root
}
/** Functional Nen signs; the manga has not supplied a creature model in this project's archive. */
export function createSaiyuVictorySeals() {
  const root = new THREE.Group()
  root.name = 'saiyu-three-sense-manifestations'
  const seals = [0xe5bb68, 0x82b8bb, 0xc9b1d9].map((color, i) => glyph(i, color))
  const trails = seals.map(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xe5d7b4, transparent: true, opacity: 0.5 }),
      ),
  )
  root.add(...seals, ...trails)
  return {
    root,
    sync(context: VictoryContext, pose: SaiyuVictoryPose) {
      const contacts: number[] = []
      seals.forEach((seal, i) => {
        const hit = SAIYU_CONTACTS[i],
          age = context.age
        const start = context.hero.head
          .getWorldPosition(new THREE.Vector3())
          .add(new THREE.Vector3((i - 1) * 0.55, 0.4 + Math.sin(i * 2) * 0.1, -0.22))
        const flight = ease((age - hit + 24) / 24)
        const fade = 1 - ease((age - hit - 4) / 8)
        seal.visible = age >= 42 && age < hit + 12
        seal.position.copy(start).lerp(pose.targets[i], flight)
        seal.position.y += Math.sin(flight * Math.PI) * 0.4
        seal.quaternion.copy(context.camera.quaternion)
        seal.scale.setScalar(ease((age - 42 - i * 6) / 18) * fade)
        const trail = trails[i]
        trail.visible = age >= hit - 24 && age < hit + 8 && context.comfort.flashes
        trail.geometry.setFromPoints([start, seal.position])
        contacts.push(seal.position.distanceTo(pose.targets[i]))
      })
      return contacts
    },
    dispose: () => disposeVictoryObject(root),
  }
}
