import * as THREE from 'three'
import type { VictoryContext } from './types'
import { reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { ease } from './resources'

function closeEyes(context: VictoryContext, who: 'hero' | 'victim', amount: number) {
  for (const side of ['left', 'right']) {
    const eye = context[who].head.getObjectByName(`face-eye-${side}`)
    if (eye) {
      context.save(eye)
      eye.scale.y *= 1 - amount * 0.88
    }
  }
}
function performance(context: VictoryContext) {
  const { hero, age } = context
  const flute = hero.root.getObjectByName('signature-flute')
  if (!flute?.parent) throw new Error('Melody requires her native flute')
  context.save(flute)
  const raising = ease(age / 48)
  const q = hero.head
    .getWorldQuaternion(new THREE.Quaternion())
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2))
  const lips = (hero.head.getObjectByName('face-mouth') ?? hero.head).getWorldPosition(
    new THREE.Vector3(),
  )
  lips.add(
    new THREE.Vector3(0, 0, 0.016).applyQuaternion(
      hero.head.getWorldQuaternion(new THREE.Quaternion()),
    ),
  )
  const scale = 1.65
  flute.position.set(0, 0, 0)
  flute.quaternion.copy(
    flute.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q),
  )
  flute.scale.set(1, scale, 1)
  hero.root.updateWorldMatrix(true, true)
  const offset = flute
    .localToWorld(new THREE.Vector3(0, -0.135, 0))
    .sub(flute.getWorldPosition(new THREE.Vector3()))
  const centre = lips.clone().sub(offset)
  const carried = hero.head.localToWorld(new THREE.Vector3(0.12, -0.5, 0.13))
  flute.position.copy(flute.parent.worldToLocal(carried.lerp(centre, raising)))
  hero.root.updateWorldMatrix(true, true)
  const right = flute.localToWorld(new THREE.Vector3(0, -0.075, 0.02))
  const left = flute.localToWorld(new THREE.Vector3(0, 0.105, 0.02))
  const grips = [
    reachVictoryHand(context, { side: 'right', target: right }),
    reachVictoryHand(context, { side: 'left', target: left }),
  ]
  for (let i = 0; i < 6; i++) {
    const key = flute.getObjectByName(`signature-flute-key-${i}`)
    if (key) {
      context.save(key)
      key.position.z -= Math.max(0, Math.sin(age * 0.13 + i)) * 0.003
    }
  }
  closeEyes(context, 'hero', raising)
  return {
    lips,
    grips,
    fluteContact: flute.localToWorld(new THREE.Vector3(0, -0.135, 0)).distanceTo(lips),
  }
}
export function melodyVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const music = performance(context)
  const peace = ease((age - 144) / 90)
  if (peace > 0.5) {
    const held = victim.root.getObjectByName('chrollo-open-book')
    const stowed = victim.root.getObjectByName('chrollo-closed-book')
    if (held) {
      context.save(held)
      held.visible = false
    }
    if (stowed) {
      context.save(stowed)
      stowed.visible = true
    }
  }
  closeEyes(context, 'victim', peace)
  victim.head.rotation.x = peace * 0.08
  const offer = ease((age - 270) / 54)
  const flower = victim.head.localToWorld(new THREE.Vector3(-0.12, -0.3, 0.27))
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1
    const lowered = victim.head.localToWorld(new THREE.Vector3(sign * 0.22, -0.56, 0.09))
    const guarded = victim.head.localToWorld(new THREE.Vector3(sign * 0.2, -0.3, 0.24))
    const target = guarded.lerp(lowered, peace)
    if (side === 'left') target.lerp(flower, offer)
    reachCinematicHand(victim.root, {
      side,
      target,
      pole: victim.head.localToWorld(new THREE.Vector3(sign * 0.45, -0.42, 0.18)),
    })
  }
  const hand = victim.root.getObjectByName('hand-left')!.getWorldPosition(new THREE.Vector3())
  const heart = victim.head
    .getWorldPosition(new THREE.Vector3())
    .add(new THREE.Vector3(0, -victim.height * 0.23, 0))
  return { ...music, peace, hand, heart, offer, hero }
}
export type MelodyVictoryPose = ReturnType<typeof melodyVictoryPose>
