import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { crouchToVictoryTarget, reachVictoryHand } from './pose'
import { groundVictoryActor } from './actors'
import { ease } from './resources'

export const HALKENBURG_RELEASE = 300
export const HALKENBURG_IMPACT = 324
export function halkenburgVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const charge = ease((age - 90) / 168),
    lower = ease((age - 370) / 60)
  crouchToVictoryTarget(context, charge * (1 - lower))
  hero.root.rotation.y *= 1 - ease((age - 450) / 30)
  const target = victim.root.position.clone().add(new Vector3(0, victim.height * 0.68, 0.03))
  const shoulder = hero.root.getObjectByName('shoulder-left')!.getWorldPosition(new Vector3())
  const desired = shoulder.clone().addScaledVector(target.clone().sub(shoulder).normalize(), 0.52)
  const rest = shoulder.clone().add(new Vector3(0, -0.58, 0.015))
  reachVictoryHand(context, {
    side: 'left',
    target: rest.lerp(desired, ease((age - 66) / 50) * (1 - lower)),
  })
  const grip = hero.root.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
  const direction = target.clone().sub(grip).normalize()
  const draw = grip.clone().addScaledVector(direction, -0.16 - charge * 0.42)
  const release = ease((age - HALKENBURG_RELEASE) / 12)
  draw.add(new Vector3(-release * 0.09, release * 0.04, release * 0.08))
  const rightRest = hero.root
    .getObjectByName('shoulder-right')!
    .getWorldPosition(new Vector3())
    .add(new Vector3(0, -0.58, 0.015))
  reachVictoryHand(context, {
    side: 'right',
    target: rightRest.lerp(draw, ease((age - 78) / 60) * (1 - lower)),
  })
  const nock = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const origin = victim.root.position.clone()
  const kneel = ease((age - HALKENBURG_IMPACT - 8) / 52)
  for (const side of ['left', 'right']) {
    victim.root.getObjectByName(`hip-${side}`)!.rotation.x = -kneel * 1.08
    victim.root.getObjectByName(`knee-${side}`)!.rotation.x = kneel * 1.9
  }
  victim.head.rotation.x = kneel * 0.38
  groundVictoryActor(victim)
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  return { charge, lower, grip, nock, direction, target, origin, kneel }
}
