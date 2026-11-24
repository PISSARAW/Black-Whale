import { drawNativeVictoryBody } from './nativeComboBody'
import { fitBillNativeContact } from './billNativeContact'
import { nativeVictoryFall } from './nativeFall'
import { sayirdTrack, sayirdTrackIndex, SAYIRD_FALL } from './sayirdTrack'
import { ease } from './resources'
import type { VictoryContext } from './types'

export function sayirdCombat(context: VictoryContext) {
  const track = sayirdTrack(context.state[context.frame.loser].id)
  const index = sayirdTrackIndex(context.age, track)
  const state = track.states[index],
    end = track.states[track.states.length - 1]
  context.hero.root.position.x += (state.player.x - end.player.x) * 0.12
  context.victim.root.position.x += (state.opponent.x - end.opponent.x) * 0.12
  context.hero.root.position.y = state.player.y * 0.12
  context.victim.root.position.y = state.opponent.y * 0.12
  const native = { ...context, age: state.frame }
  drawNativeVictoryBody(native, context.hero, state.player)
  if (context.age < SAYIRD_FALL) drawNativeVictoryBody(native, context.victim, state.opponent)
  const contact = fitBillNativeContact(context, state.player)
  const settle = ease((context.age - 438) / 72)
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
    context.age >= SAYIRD_FALL ? nativeVictoryFall(context, { start: SAYIRD_FALL }) : undefined
  return {
    nativeMove: state.player.attack?.moveId,
    hits: track.impacts.filter((hit) => hit.index <= index).length,
    fall,
    ...contact,
  }
}
