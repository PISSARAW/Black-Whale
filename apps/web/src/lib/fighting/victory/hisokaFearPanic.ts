import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead } from './pose'
import { reachCinematicHand } from './arm'
import { groundVictoryActor } from './actors'
import { borrowFearFacePart } from './hisokaFearFace'
import { ease } from './resources'

export const HISOKA_FEAR_DEATH = 390
export const hisokaPanicAmount = (age: number) => ease((age - 228) / 120)
export function hisokaVictimRetreat(context: VictoryContext) {
  const { age, victim } = context
  const retreat = 0.13 * ease((age - 228) / 24) + 0.2 * ease((age - 270) / 26)
  const tremor = hisokaPanicAmount(age) * (1 - ease((age - 384) / 6))
  victim.root.position.x += retreat + Math.sin(age * 1.14) * tremor * 0.014
  victim.root.position.z += Math.sin(age * 0.63) * tremor * 0.018
  return { retreat, tremor }
}
function panicLegs(context: VictoryContext, panic: number) {
  for (const [side, start] of [
    ['left', 228],
    ['right', 270],
  ] as const) {
    const step = Math.sin(Math.PI * Math.max(0, Math.min(1, (context.age - start) / 26)))
    const hip = context.victim.root.getObjectByName(`hip-${side}`)!,
      knee = context.victim.root.getObjectByName(`knee-${side}`)!
    hip.rotation.x = -panic * 0.12 + step * 0.4
    knee.rotation.x = panic * 0.24 + step * 0.72
    knee.children[1].rotation.x = -hip.rotation.x - knee.rotation.x
  }
  groundVictoryActor(context.victim)
}
function panicHands(context: VictoryContext, panic: number) {
  const { victim, age } = context,
    scale = Math.min(1, victim.height / 1.7)
  const local = (point: Vector3) => localToHead(victim, point.multiplyScalar(scale))
  const cover = ease((age - 240) / 30),
    choke = ease((age - 312) / 30),
    clutch = ease((age - 354) / 24)
  return (['left', 'right'] as const).map((side) => {
    const sign = side === 'left' ? -1 : 1
    const target = local(new Vector3(sign * 0.19, -0.28, 0.26))
    const shield = local(new Vector3(sign * 0.15, side === 'left' ? -0.06 : -0.16, 0.29))
    const throat = local(
      new Vector3(side === 'left' ? -0.08 : 0.07, side === 'left' ? -0.36 : -0.21, 0.25),
    )
    const heart = local(new Vector3(side === 'left' ? -0.07 : 0.1, -0.38, 0.23))
    target.lerp(shield, cover).lerp(throat, choke).lerp(heart, clutch)
    target.x += Math.sin(age * 1.27 + sign) * panic * 0.009
    target.y += Math.sin(age * 0.94 - sign) * panic * 0.007
    return reachCinematicHand(victim.root, {
      side,
      target,
      pole: local(new Vector3(sign * 0.42, -0.34, 0.24)),
    })
  })
}
function panicEyes(context: VictoryContext, panic: number) {
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    const eye = context.victim.head.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    borrowFearFacePart(context, eye)
    eye.scale.y *= 1 + panic * 1.25
    const pupil = eye.getObjectByName('eye-pupil')
    if (pupil) {
      borrowFearFacePart(context, pupil)
      pupil.scale.setScalar(1 - panic * 0.86)
      pupil.position.x += Math.sin(context.age * 0.78 + sign) * panic * 0.003
    }
    const brow = context.victim.head.getObjectByName(`face-brow-${side}`)
    if (brow) {
      borrowFearFacePart(context, brow)
      brow.position.y += panic * 0.016
      brow.rotation.z = -sign * panic * 0.31
    }
  }
}
export function hisokaVictimPanic(context: VictoryContext) {
  const { victim, age } = context,
    panic = hisokaPanicAmount(age)
  victim.root.rotation.y *= 1 - ease((age - 312) / 24)
  const chest = victim.root.getObjectByName('fight-chest')
  if (chest) chest.rotation.x = -panic * 0.14 + Math.sin(age * 0.71) * panic * 0.018
  victim.head.rotation.x = -panic * 0.24 + Math.sin(age * 0.89) * panic * 0.055
  victim.head.rotation.y = Math.sin(age * 0.37) * panic * 0.1
  victim.head.rotation.z = Math.sin(age * 1.12) * panic * 0.085
  panicLegs(context, panic)
  panicEyes(context, panic)
  const handErrors = panicHands(context, panic)
  return {
    panic,
    handErrors,
    gesture: age < 270 ? 'shield' : age < 342 ? 'recoil' : age < 366 ? 'throat' : 'heart',
  }
}
