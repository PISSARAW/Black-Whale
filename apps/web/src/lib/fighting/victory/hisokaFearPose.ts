import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead, reachVictoryHand } from './pose'
import { nativeVictoryFall } from './nativeFall'
import { hisokaVictimPanic, hisokaVictimRetreat, HISOKA_FEAR_DEATH } from './hisokaFearPanic'
import { ease } from './resources'
export { HISOKA_FEAR_DEATH } from './hisokaFearPanic'
export function hisokaFearPose(context: VictoryContext) {
  const { hero, age } = context
  hero.root.rotation.y *= 1 - ease((age - 72) / 66)
  hero.head.rotation.x = 0.06 + ease((age - 240) / 54) * 0.3
  hero.head.rotation.z = ease((age - 210) / 90) * -0.24
  const threat = ease((age - 36) / 60),
    retreat = hisokaVictimRetreat(context)
  for (const side of ['left', 'right'] as const)
    reachVictoryHand(context, {
      side,
      target: localToHead(hero, new Vector3(side === 'left' ? -0.23 : 0.23, -0.66, 0.09)),
    })
  if (age >= HISOKA_FEAR_DEATH) {
    neutralFearVictim(context)
    return {
      threat,
      ...retreat,
      panic: 1,
      gesture: 'dead',
      handErrors: [],
      fall: nativeVictoryFall(context, { start: HISOKA_FEAR_DEATH }),
    }
  }
  return { threat, ...retreat, ...hisokaVictimPanic(context), fall: undefined }
}
function neutralFearVictim(context: VictoryContext) {
  for (const side of ['left', 'right'])
    for (const joint of ['shoulder', 'elbow', 'hand', 'hip', 'knee'])
      context.victim.root.getObjectByName(`${joint}-${side}`)!.rotation.set(0, 0, 0)
}
