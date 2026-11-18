import { Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { reachLimb } from '../fightLimbReach'
import { fightRigOf } from '../fightRig'
import { signatureNenAvailable } from './selection'
import { throwSmooth } from './sample'
import { threadVisible } from '../fineControlAnchors'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** The one confirmed super impact is staged as an emitted uppercut, never a second projectile. */
export function createThrowRemoteGrip(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const fist = createVisitHatsuModel(THREE, { model: 'emitted-fist' })
  fist.fit({ height: 0.72 })
  fist.root.name = 'throw-signature:remote'
  const geometry = new THREE.RingGeometry(0.15, 0.22, 40)
  const material = new THREE.MeshBasicMaterial({
    color: 0xbcecff,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const rings = [0, 1].map(() => {
    const ring = new THREE.Mesh(geometry, material)
    ring.name = 'throw-signature:remote-surface'
    ring.rotation.x = -Math.PI / 2
    scene.add(ring)
    return ring
  })
  scene.add(fist.root)
  const hide = () => {
    fist.root.visible = false
    rings.forEach((ring) => {
      ring.visible = false
    })
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      if (frame.performance !== 'leorio-house-call') return
      const bodies = remoteBodies(options, frame)
      if (!bodies) return
      const t = frame.age / frame.duration
      const origin = bodies.actor.figure.getWorldPosition(new Vector3())
      origin.x += frame.facing * 0.25
      origin.y = 0.04
      touchFloor(bodies.actor, origin, t)
      if (
        !signatureNenAvailable(state, frame.attacker) ||
        !threadVisible(options, state, frame.attacker)
      )
        return
      const exit = bodies.victim.pelvis.getWorldPosition(new Vector3())
      const visible = t >= 0.18 && t < 0.62
      fist.root.visible = visible
      fist.root.position.copy(exit)
      fist.root.position.y = Math.max(0.05, exit.y - 0.75)
      fist.root.rotation.y = frame.facing * 0.4
      fist.fit({ height: 0.72 * (0.7 + throwSmooth((t - 0.18) / 0.18) * 0.3) })
      rings.forEach((ring, index) => {
        ring.visible = visible && options.comfort?.().flashes !== false
        ring.position.copy(index === 0 ? origin : new Vector3(exit.x, 0.04, exit.z))
        ring.scale.setScalar(0.8 + Math.sin(Math.PI * t) * 0.5)
      })
    },
    dispose() {
      fist.dispose()
      rings.forEach((ring) => ring.removeFromParent())
      geometry.dispose()
      material.dispose()
    },
  }
}

function remoteBodies(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const own = options.figureOf?.(frame.attacker),
    rival = options.figureOf?.(frame.victim)
  if (!own || !rival) return
  const actor = humanAnimationRig(own),
    victim = humanAnimationRig(rival)
  return actor && victim ? { actor, victim } : undefined
}
function touchFloor(
  actor: NonNullable<ReturnType<typeof remoteBodies>>['actor'],
  point: Vector3,
  t: number,
) {
  const weight = throwSmooth((t - 0.08) / 0.1) * (1 - throwSmooth((t - 0.3) / 0.16))
  const rig = fightRigOf(actor)
  reachLimb({ root: actor.arms[1], hinge: rig.elbows[1], end: rig.wrists[1] }, point, weight)
}
