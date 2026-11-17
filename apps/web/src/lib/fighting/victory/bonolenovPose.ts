import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { groundVictoryActor } from './actors'
import { visibleVictoryBounds } from './bodyBounds'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { ease } from './resources'

export const BONOLENOV_ARMOR = 72
export const BONOLENOV_FORM = 210
export const BONOLENOV_CHASE = 288
export const BONOLENOV_IMPACT = 396
export const BONOLENOV_TAPS = [132, 168] as const
function flee(context: VictoryContext) {
  const { victim, age } = context
  const run = ease((age - BONOLENOV_CHASE) / 100),
    stride = Math.sin((age - BONOLENOV_CHASE) * 0.34) * Math.min(1, run * 8)
  victim.root.position.x += run * 2.3
  victim.root.position.z += Math.sin(run * Math.PI) * 0.35
  victim.root.rotation.y = -1.15 + ease((age - 258) / 42) * (Math.PI / 2 + 1.15)
  victim.head.rotation.y = -ease((age - 306) / 24) * 0.5
  const cover = ease((age - 246) / 18) * (1 - ease((age - 288) / 24))
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    victim.root.getObjectByName(`hip-${side}`)!.rotation.x = stride * sign * 0.5
    victim.root.getObjectByName(`knee-${side}`)!.rotation.x = Math.max(0, -stride * sign) * 0.8
    victim.root.getObjectByName(`shoulder-${side}`)!.rotation.x = -stride * sign * 0.45
    if (cover > 0) {
      victim.root.updateWorldMatrix(true, true)
      const hand = victim.root.getObjectByName(`hand-${side}`)!
      reachCinematicHand(victim.root, {
        side,
        target: hand
          .getWorldPosition(new Vector3())
          .lerp(localToHead(victim, new Vector3(sign * 0.17, -0.03, 0.04)), cover),
        pole: localToHead(victim, new Vector3(sign * 0.4, -0.25, 0.2)),
      })
    }
  }
  groundVictoryActor(victim)
}
export function bonolenovVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const dance = 1 - ease((age - BONOLENOV_CHASE) / 18),
    beat = Math.sin(age * 0.16) * dance
  hero.root.position.x += ease((age - 72) / 42) * 0.35
  hero.root.rotation.y = 1.15 + ease((age - 114) / 96) * Math.PI * 2
  hero.head.rotation.x = ease((age - 516) / 24) * (1 - ease((age - 570) / 24)) * 0.22
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    hero.root.getObjectByName(`hip-${side}`)!.rotation.x = beat * sign * 0.3
    hero.root.getObjectByName(`knee-${side}`)!.rotation.x = (0.2 + beat * sign * 0.12) * dance
  }
  groundVictoryActor(hero)
  reachVictoryHand(context, {
    side: 'right',
    target: localToHead(hero, new Vector3(0.17, -0.38, 0.33)),
  })
  reachVictoryHand(context, {
    side: 'left',
    target: localToHead(hero, new Vector3(-0.25, -0.32 + beat * 0.08, 0.2)),
  })
  flee(context)
  victim.root.updateWorldMatrix(true, true)
  const torso = visibleVictoryBounds(victim.root.getObjectByName('torso') ?? victim.head)
  const contact = torso.getCenter(new Vector3())
  contact.x = torso.min.x
  const crush = ease((age - BONOLENOV_IMPACT) / 24)
  victim.root.scale.multiply(new Vector3(1 - crush * 0.8, 1 - crush * 0.94, 1 - crush * 0.65))
  groundVictoryActor(victim)
  victim.root.visible = age < 420
  return {
    contact,
    crush,
    start: hero.root.position.clone(),
    tap: BONOLENOV_TAPS.some((frame) => Math.abs(age - frame) < 0.5),
  }
}
export type BonolenovVictoryPose = ReturnType<typeof bonolenovVictoryPose>
