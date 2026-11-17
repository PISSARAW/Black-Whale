import {
  AdditiveBlending,
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from 'three'
import { buildEmittedFist } from '../../tour/emittedFistModel'
import type { VictoryContext } from './types'
import { LEORIO_HITS, LEORIO_LAUNCH } from './leorioPose'
import { disposeVictoryObject, ease } from './resources'
import * as THREE from 'three'

function punchVisual(index: number) {
  const root = new Group(),
    material = new MeshBasicMaterial({ color: 0xbcecff, vertexColors: true })
  const fist = buildEmittedFist(THREE, material)
  fist.name = `leorio-emitted-fist-${index}`
  for (let i = 0; i < 4; i++) {
    const knuckle = new Mesh(new SphereGeometry(0.14, 10, 8), material)
    knuckle.position.set(-0.35 + i * 0.23, 1.5, 0.2)
    fist.add(knuckle)
  }
  fist.traverse((part) => {
    if (!(part instanceof Mesh)) return
    const normals = part.geometry.getAttribute('normal')
    const colors = new Float32Array(normals.count * 3)
    for (let i = 0; i < normals.count; i++) {
      const light =
        0.55 +
        Math.max(0, normals.getX(i) * -0.3 + normals.getY(i) * 0.7 + normals.getZ(i) * 0.4) * 0.45
      colors.fill(light, i * 3, i * 3 + 3)
    }
    part.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  })
  const ring = new Mesh(
    new RingGeometry(0.24, 0.3, 40),
    new MeshBasicMaterial({
      color: 0x8bddff,
      transparent: true,
      opacity: 0.7,
      side: DoubleSide,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  ring.rotation.x = -Math.PI / 2
  const trace = new Mesh(
    new BoxGeometry(1, 0.012, 0.035),
    new MeshBasicMaterial({
      color: 0x8bddff,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  root.add(fist, ring, trace)
  return { root, fist, ring, trace }
}
export function createLeorioPunches() {
  const root = new Group(),
    frames = [...LEORIO_HITS, LEORIO_LAUNCH]
  const punches = frames.map((_, i) => punchVisual(i))
  punches.forEach((part) => root.add(part.root))
  root.name = 'leorio-remote-barrage'
  return {
    root,
    sync(context: VictoryContext, pose: { floor: Vector3; origin: Vector3 }) {
      punches.forEach(({ root, fist, ring, trace }, i) => {
        const since = context.age - frames[i],
          final = i === frames.length - 1
        root.visible = since >= -18 && since < 20
        const scale = final ? 0.62 : 0.38
        const rise = ease((since + 6) / 6) * (1 - ease((since - 7) / 12))
        const y = context.victim.height * (final ? 0.9 : i % 2 === 0 ? 0.64 : 0.78)
        const x = pose.origin.x + (i % 2 === 0 ? -0.07 : 0.07)
        fist.position.set(x, -1.6 * scale + y * rise, 0.17)
        fist.scale.setScalar(scale)
        fist.visible = since >= -6
        ring.position.set(x, 0.025, 0.1)
        ring.scale.setScalar((final ? 2 : 1) * (0.6 + rise * 0.8))
        ring.material.opacity = 0.7 * (1 - ease((since - 6) / 14))
        trace.position.set((pose.floor.x + x) / 2, 0.025, 0.1)
        trace.scale.x = Math.abs(x - pose.floor.x) * ease((since + 18) / 12)
        trace.visible = since < -3
      })
    },
    dispose() {
      disposeVictoryObject(root)
    },
  }
}
