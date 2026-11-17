import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead } from './pose'
import { guardHand } from './personalGuardStaging'
import { stageLynch } from './lynchStaging'
import { lynchBeat, LYNCH_CONTACTS, LYNCH_TIMING } from './lynchTiming'
import { nativeVictoryFall } from './nativeFall'
import { ease } from './resources'

function coverMouth(context: VictoryContext) {
  const { victim, age } = context
  const collapse = ease((age - 246) / 24)
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1
    const mouth = localToHead(victim, new Vector3(sign * 0.08, -0.08, 0.18))
    const stomach = localToHead(victim, new Vector3(sign * 0.12, -0.6, 0.22))
    guardHand(victim, side, mouth.lerp(stomach, collapse))
  }
}
export function lynchPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const contact = stageLynch(context)
  const beat = lynchBeat(age)
  const recoil = Math.max(0, 1 - Math.abs(beat.delta - 5) / 14) * Number(age >= 132)
  victim.head.rotation.x = recoil * 0.2
  victim.head.rotation.z = -recoil * 0.11
  hero.head.rotation.x = 0.08 * ease((age - 480) / 30)
  coverMouth(context)
  const handErrors: number[] = []
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1
    const guard = localToHead(hero, new Vector3(sign * 0.16, -0.28, 0.22))
    const wind = ease((age - 366) / 12) * (1 - ease((age - 378) / 18))
    if (side === 'right') guard.z -= 0.15 * wind
    const target = guard.lerp(contact, side === beat.side ? beat.extension : 0)
    handErrors.push(guardHand(hero, side, target))
  }
  const hand = hero.root.getObjectByName(`hand-${beat.side}`)!.getWorldPosition(new Vector3())
  const fall =
    age >= LYNCH_TIMING.fall
      ? nativeVictoryFall(context, { start: LYNCH_TIMING.fall, velocityY: 20, velocityX: 9 })
      : undefined
  return {
    contact,
    hand,
    handErrors,
    beat,
    fall,
    replies: LYNCH_CONTACTS.slice(0, 6).filter((frame) => age >= frame).length,
    noSoulDamage: true,
  }
}
export type LynchPose = ReturnType<typeof lynchPose>
