import { Quaternion, Vector3 } from 'three'
import type { Object3D, PerspectiveCamera } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'

const ease = (v: number) => {
  const t = Math.max(0, Math.min(1, v))
  return t * t * (3 - 2 * t)
}

export function kurapikaVictoryCamera(
  camera: PerspectiveCamera,
  options: { hero: Object3D; victim: Object3D; age: number; state: FightState },
) {
  const { hero, victim, age, state } = options
  const head = hero.getObjectByName('kurapika-head')!
  const q = head.getWorldQuaternion(new Quaternion()),
    origin = head.getWorldPosition(new Vector3())
  const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
  let shot: string
  if (age < 45) {
    shot = 'scarlet-awakening'
    camera.position.copy(local(new Vector3(0, 0.02, 1.2 - ease(age / 45) * 0.1)))
    camera.up.set(0, 1, 0).applyQuaternion(q)
    camera.lookAt(local(new Vector3(0, -0.015, 0.07)))
  } else if (age < 75) {
    shot = 'middle-finger-and-claw'
    const hand = hero.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    camera.position.copy(hand).add(new Vector3(0.22, 0.16, 1.15))
    camera.up.set(0, 1, 0)
    camera.lookAt(hand.clone().add(new Vector3(0.1, -0.03, 0)))
  } else if (age < 155) {
    shot = 'chain-jail-tightens'
    const torso = victim.getObjectByName('torso')!
    const target = torso.getWorldPosition(new Vector3())
    const rotation = torso.getWorldQuaternion(new Quaternion())
    const t = ease((age - 75) / 80)
    camera.position
      .copy(target)
      .add(new Vector3(0.65 - t * 1.05, 0.12, 2.05).applyQuaternion(rotation))
    camera.up.set(0, 1, 0)
    camera.lookAt(target)
  } else if (age < 235) {
    shot = 'bound-final-strike'
    const x = (fightWorldX(state.player.x) + fightWorldX(state.opponent.x)) / 2
    camera.position.set(x + 0.8, 1.6, 4.5)
    camera.up.set(0, 1, 0)
    camera.lookAt(x, 1.0, 0)
    const kick = Math.exp(-Math.abs(age - 180) / 9) * 0.04
    camera.position.x += Math.sin(age * 1.8) * kick
  } else if (age < 360) {
    shot = 'slack-steel'
    const hand = hero.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    const target = hand.clone()
    target.y = 0.65
    camera.position.copy(hand).add(new Vector3(0.35, 0.08, 2.0))
    camera.up.set(0, 1, 0)
    camera.lookAt(target)
  } else {
    shot = 'scarlet-eyes'
    const t = ease((age - 360) / 240),
      distance = 1.02 - t * 0.36
    camera.position.copy(local(new Vector3(0.005, 0.018, distance)))
    camera.up.set(0, 1, 0).applyQuaternion(q)
    camera.lookAt(local(new Vector3(0.005, -0.01, 0.07)))
  }
  camera.updateMatrixWorld(true)
  return shot
}
