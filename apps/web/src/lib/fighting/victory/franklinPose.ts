import { keepHumanJoint } from '$lib/tour/humanJointLimits'
import { Matrix4, Quaternion, Vector3 } from 'three'
import type { VictoryContext, GunPose } from './types'
import { reachVictoryHand, turnVictoryHero, victimTorso, fallVictoryVictim } from './pose'
import { positionFranklinFingers } from './fingers'
import { ease } from './resources'

export function franklinVictoryPose(context: VictoryContext): GunPose {
  const { hero, victim, age } = context
  turnVictoryHero(context, 370)
  const target = victimTorso(context)
  const settle = ease((age - 370) / 50),
    raise = ease((age - 72) / 65)
  const hands: import('three').Object3D[] = [],
    muzzles: Vector3[] = [],
    directions: Vector3[] = []
  for (const side of ['left', 'right'] as const) {
    const shoulder = hero.root.getObjectByName(`shoulder-${side}`)!.getWorldPosition(new Vector3())
    const forward = new Vector3(0, 0, 1).applyQuaternion(hero.root.quaternion)
    const reach = (0.28 + raise * 0.24) * (1 - settle) + settle * 0.15
    const handTarget = shoulder.clone().addScaledVector(forward, reach)
    handTarget.y -= (0.34 - raise * 0.2) * (1 - settle) + settle * 0.6
    reachVictoryHand(context, {
      side,
      target: handTarget,
      pole: shoulder.clone().add(new Vector3(-0.05, -0.4, side === 'left' ? 0.45 : -0.45)),
    })
    const hand = hero.root.getObjectByName(`hand-${side}`)!
    const direction = target.clone().sub(hand.getWorldPosition(new Vector3())).normalize()
    const row = new Vector3(0, 1, 0).cross(direction).normalize(),
      y = direction.clone().negate(),
      z = row.clone().cross(y).normalize()
    const world = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(row, y, z))
    hand.quaternion.copy(hand.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(world))
  keepHumanJoint(hand, 'wrist')
    hand.updateWorldMatrix(true, true)
    hands.push(hand)
    const fingers = positionFranklinFingers({
      hand,
      side,
      target,
      opening: ease(age / 65) * (1 - settle),
      save: context.save,
    })
    muzzles.push(...fingers.muzzles)
    directions.push(...fingers.directions)
  }
  if (age >= 156 && age < 350) {
    victim.root.rotation.z = -0.075 - Math.sin(age * 1.7) * 0.025
    victim.head.rotation.x = 0.12 + Math.sin(age * 1.3) * 0.04
  }
  fallVictoryVictim(context, { start: 350, duration: 35 })
  if (age >= 420) victim.root.visible = false
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  return { hero: hero.root, victim: victim.root, hands, muzzles, directions, target }
}
