import {
  AdditiveBlending,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from 'three'
import type { VictoryContext } from './types'
import { LEORIO_CEILING, LEORIO_HITS, LEORIO_LAUNCH } from './leorioPose'
import { disposeVictoryObject } from './resources'

export function createLeorioImpacts() {
  const root = new Group(),
    frames = [...LEORIO_HITS, LEORIO_LAUNCH, LEORIO_CEILING]
  const impacts = frames.map(() => {
    const material = new MeshBasicMaterial({
      color: 0xc0eeff,
      transparent: true,
      opacity: 0.8,
      side: DoubleSide,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    const ring = new Mesh(new RingGeometry(0.9, 1, 64), material)
    const flash = new Mesh(new SphereGeometry(0.2, 16, 10), material.clone())
    root.add(ring, flash)
    return { ring, flash }
  })
  root.name = 'leorio-impact-ripples'
  return {
    root,
    sync(context: VictoryContext, pose: { origin: Vector3; height: number }) {
      impacts.forEach(({ ring, flash }, i) => {
        const since = context.age - frames[i],
          final = i >= LEORIO_HITS.length
        const roof = i === frames.length - 1
        const life = final ? 26 : 14
        const y = roof
          ? pose.height - 0.03
          : context.victim.height * (final ? 0.9 : i % 2 === 0 ? 0.64 : 0.78)
        const position = pose.origin.clone().add(new Vector3(0, y, 0.18))
        ring.visible = since >= 0 && since < life
        ring.position.copy(position)
        ring.scale.setScalar(0.05 + Math.max(0, since) * (final ? 0.09 : 0.035))
        ring.material.opacity = Math.max(0, 0.85 * (1 - since / life))
        ring.rotation.x = roof ? Math.PI / 2 : 0
        flash.visible = since >= 0 && since < 4
        flash.position.copy(position)
        flash.scale.setScalar(Math.max(0, 1 - since / 4) * (final ? 1.7 : 1))
      })
    },
    dispose() {
      disposeVictoryObject(root)
    },
  }
}
