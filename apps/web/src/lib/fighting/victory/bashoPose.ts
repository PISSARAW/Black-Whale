import { Quaternion, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead } from './pose'
import { guardHand } from './personalGuardStaging'
import { poetHand } from './bashoHands'
import { stageBasho } from './bashoStaging'
import { bashoBeat, bashoWriting } from './bashoTrack'
import { nativeVictoryFall } from './nativeFall'
import { ease } from './resources'

export function bashoPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const contact = stageBasho(context),
    beat = bashoBeat(age),
    writing = bashoWriting(age)
  hero.head.rotation.x = 0.12 * (1 - ease((age - 144) / 24)) + 0.1 * ease((age - 486) / 24)
  hero.root.updateWorldMatrix(true, true)
  const pageQ = hero.head
    .getWorldQuaternion(new Quaternion())
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.8))
  const page = localToHead(hero, new Vector3(-0.02, -0.52, 0.4))
  const tip = page
    .clone()
    .add(new Vector3(writing.x, writing.y, 0.006 + writing.lift).applyQuaternion(pageQ))
  const penAxis = new Vector3(0, 0.12, 0.05).applyQuaternion(pageQ)
  const pageGrip = page.clone().add(new Vector3(-0.17, -0.02, 0).applyQuaternion(pageQ))
  const pocket = ease((age - 144) / 30) * (1 - ease((age - 486) / 24))
  const left = pageGrip.clone().lerp(localToHead(hero, new Vector3(-0.16, -0.5, 0.22)), pocket)
  const right = tip.clone().add(penAxis)
  right.lerp(localToHead(hero, new Vector3(0.16, -0.3, 0.24)), ease((age - 144) / 30))
  right.lerp(localToHead(hero, new Vector3(0.16, -0.55, 0.2)), ease((age - 420) / 66))
  right.lerp(contact, beat.extension)
  const handErrors = [poetHand(hero, 'left', left), poetHand(hero, 'right', right)]
  const hand = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const heldPage = hero.root
    .getObjectByName('hand-left')!
    .getWorldPosition(new Vector3())
    .add(new Vector3(0.17, 0.02, 0).applyQuaternion(pageQ))
  for (const side of ['left', 'right'] as const) {
    const s = victim.height / 2,
      sign = side === 'left' ? -1 : 1
    const panic = Number(age >= 216 && age < 420)
    guardHand(
      victim,
      side,
      localToHead(
        victim,
        new Vector3(sign * 0.18, -0.4 + Math.sin(age * 0.24) * 0.07 * panic, 0.25).multiplyScalar(
          s,
        ),
      ),
    )
  }
  const fall =
    age >= 420 ? nativeVictoryFall(context, { start: 420, velocityY: 0, velocityX: 2 }) : undefined
  return {
    page: heldPage,
    pageQ,
    pageGrip,
    tip,
    penAxis,
    hand,
    handErrors,
    contact,
    beat,
    writing,
    pocket,
    fall,
  }
}
export type BashoPose = ReturnType<typeof bashoPose>
