import { humanAnimationRig } from '../../tour/humanAnimation'
import { lowestBodyHeight } from '../fightGroundContact'
import { drawNativeVictoryBody } from './nativeComboBody'
import { fitBillNativeContact } from './billNativeContact'
import { personalGuardTrack, type PersonalGuard } from './personalGuardTrack'
import { nativeVictoryFall } from './nativeFall'
import { ease } from './resources'
import type { VictoryContext } from './types'

export const GUARD_COMBAT_START = 228
export const GUARD_LAST_HIT = 414
export const GUARD_FALL = 415
export const GUARD_PORTRAIT = 510

export function personalGuardCombat(context: VictoryContext, hero: PersonalGuard) {
  const track = personalGuardTrack(hero, context.state[context.frame.loser].id)
  const progress = Math.max(
    0,
    Math.min(1, (context.age - GUARD_COMBAT_START) / (GUARD_LAST_HIT - GUARD_COMBAT_START)),
  )
  const index = Math.round(progress * track.last)
  const state = track.states[index],
    end = track.states[track.last]
  context.hero.root.position.x += (state.player.x - end.player.x) * 0.12
  context.victim.root.position.x += (state.opponent.x - end.opponent.x) * 0.12
  context.hero.root.position.y = state.player.y * 0.12
  context.victim.root.position.y = state.opponent.y * 0.12
  const native = { ...context, age: state.frame }
  const plan = drawNativeVictoryBody(native, context.hero, state.player)
  if (context.age < GUARD_FALL) drawNativeVictoryBody(native, context.victim, state.opponent)
  const contact = fitBillNativeContact(context, state.player)
  const settle = ease((context.age - 444) / 60)
  context.hero.root.rotation.y *= 1 - settle
  for (const side of ['left', 'right'])
    for (const joint of ['shoulder', 'elbow', 'hand']) {
      const node = context.hero.root.getObjectByName(`${joint}-${side}`)!
      node.rotation.set(
        node.rotation.x * (1 - settle),
        node.rotation.y * (1 - settle),
        node.rotation.z * (1 - settle),
      )
    }
  const fall =
    context.age >= GUARD_FALL ? nativeVictoryFall(context, { start: GUARD_FALL }) : undefined
  return {
    index,
    nativeMove: state.player.attack?.moveId,
    nativePose: plan.pose,
    hits: track.impacts.filter((hit) => hit.index <= index).length,
    nativeFloor: lowestBodyHeight(humanAnimationRig(context.victim.root.children[0])!),
    ...contact,
    fall,
  }
}
