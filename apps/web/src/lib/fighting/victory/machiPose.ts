import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { visibleVictoryBounds } from './bodyBounds'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { ease } from './resources'

export const MACHI_CAPTURE = 72
export const MACHI_CUT = 282
export const MACHI_STITCH = 306
export const MACHI_REJOIN = 378
export const MACHI_UNPICK = 420
export function machiVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const capture = ease((age - MACHI_CAPTURE) / 54)
  const puppet = Math.sin(ease((age - 126) / 78) * Math.PI)
  const approach = ease((age - 210) / 60)
  const retreat = ease((age - 450) / 60)
  hero.root.position.x += approach * (context.gap - 0.75 - victim.width * 0.2) - retreat * 0.45
  hero.root.rotation.y *= 1 - ease((age - 468) / 42)
  victim.root.rotation.y *= 1 - capture * 0.8
  victim.root.position.y += capture * 0.14
  victim.head.rotation.x = capture * (0.12 + puppet * 0.1)
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    const hand = victim.root.getObjectByName(`hand-${side}`)!
    victim.root.updateWorldMatrix(true, true)
    reachCinematicHand(victim.root, {
      side,
      target: hand
        .getWorldPosition(new Vector3())
        .lerp(
          localToHead(
            victim,
            new Vector3(sign * (0.33 + puppet * 0.1), -0.22 + puppet * sign * 0.12, 0.18),
          ),
          capture,
        ),
      pole: localToHead(victim, new Vector3(sign * 0.5, -0.4, 0.04)),
    })
    victim.root.getObjectByName(`hip-${side}`)!.rotation.z = sign * capture * 0.12
    victim.root.getObjectByName(`knee-${side}`)!.rotation.x = capture * 0.12
  }
  hero.root.updateWorldMatrix(true, true)
  const pinch = ease((age - 252) / 30),
    pull = ease((age - 408) / 12)
  reachVictoryHand(context, {
    side: 'right',
    target: localToHead(
      hero,
      new Vector3(0.17 + pull * 0.12, -0.32 + puppet * 0.06, 0.35 - pull * 0.13),
    ),
  })
  reachVictoryHand(context, {
    side: 'left',
    target: localToHead(hero, new Vector3(-0.16 + pinch * 0.15, -0.35, 0.33 - pull * 0.14)),
  })
  victim.root.updateWorldMatrix(true, true)
  const seam = visibleVictoryBounds(victim.root.getObjectByName('torso') ?? victim.head)
  const body = visibleVictoryBounds(victim.root),
    centre = body.getCenter(new Vector3())
  const grips = ['left', 'right'].map((side) =>
    hero.root.getObjectByName(`hand-${side}`)!.getWorldPosition(new Vector3()),
  )
  const joints = ['hand-left', 'hand-right', 'knee-left', 'knee-right'].map((name) =>
    victim.root.getObjectByName(name)!.getWorldPosition(new Vector3()),
  )
  const mark = centre.clone().setY(body.max.y - victim.height * 0.22)
  mark.z = body.max.z + 0.018
  return {
    body,
    centre,
    grips,
    joints,
    mark,
    capture,
    approach,
    pinch,
    pull,
    seamFront: seam.max.z + 0.012,
    seamWidth: (seam.max.x - seam.min.x) * 0.48,
  }
}
export type MachiVictoryPose = ReturnType<typeof machiVictoryPose>
