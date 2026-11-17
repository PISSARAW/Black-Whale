import { Vector3 } from 'three'
import { humanAnimationRig } from '../../tour/humanAnimation'
import { lowestBodyHeight } from '../fightGroundContact'
import type { VictoryContext } from './types'
import { fitBillNativeContact } from './billNativeContact'
import { billComboTrack } from './billComboTrack'
import { BILL_IMPACT } from './billFinalePose'
import { drawNativeVictoryBody } from './nativeComboBody'

export function billNativeComboPose(context: VictoryContext) {
  const track = billComboTrack(context.state[context.frame.loser].id)
  const index = Math.min(track.last, Math.round((context.age * track.last) / BILL_IMPACT))
  const state = track.states[index],
    end = track.states[track.last - 1]
  const positions = {
    hero: context.hero.root.position.clone(),
    victim: context.victim.root.position.clone(),
  }
  context.hero.root.position.x += (state.player.x - end.player.x) * 0.12
  context.victim.root.position.x +=
    ((index === track.last ? end.opponent.x : state.opponent.x) - end.opponent.x) * 0.12
  context.hero.root.position.y = state.player.y * 0.12
  context.victim.root.position.y = state.opponent.y * 0.12
  const nativeContext = { ...context, age: state.frame }
  const heroPlan = drawNativeVictoryBody(nativeContext, context.hero, state.player)
  drawNativeVictoryBody(nativeContext, context.victim, state.opponent)
  const fitted = fitBillNativeContact(context, state.player)
  const hand = context.hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  return {
    ...fitted,
    nativeFloor: lowestBodyHeight(humanAnimationRig(context.victim.root.children[0])!),
    nativeMove: state.player.attack?.moveId ?? null,
    nativeAttackFrame: state.player.attack?.frame ?? null,
    nativeCombo: state.opponent.comboHits,
    nativeIndex: index,
    nativeHitstop: state.hitstop,
    nativePose: heroPlan.pose,
    nativeAnchors: positions,
    hand,
  }
}
