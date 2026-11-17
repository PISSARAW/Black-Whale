import { recipientHears } from '../fightSpeechRecipient'
import type { FightState, FightSide } from '../types'
import { enProfile } from './profiles'
import { enContains, activeEnRadius } from './access'
import { enPresences } from './contacts'
const sides = ['player', 'opponent'] as const
function clear(state: FightState, side: FightSide): FightState {
  return { ...state, [side]: { ...state[side], nen: { ...state[side].nen, en: null } } }
}
export function interruptEnForSpeech(state: FightState, speaker: FightSide): FightState {
  let next = state
  for (const side of sides) {
    if (
      activeEnRadius(next[side]) &&
      enProfile(next[side]).unstable &&
      recipientHears(next, speaker, { seat: side })
    )
      next = clear(next, side)
  }
  return next
}
export function interruptUnstableEn(before: FightState, after: FightState): FightState {
  let next = after
  for (const side of sides) {
    if (!activeEnRadius(next[side]) || !enProfile(next[side]).unstable) continue
    if (moved(before[side], after[side]) || movingContact(before, after, side))
      next = clear(next, side)
  }
  return next
}
function moved(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) > 0.000001
}
function movingContact(before: FightState, after: FightState, side: FightSide): boolean {
  const previous = new Map(enPresences(before, side).map((point) => [point.key, point]))
  return enPresences(after, side).some((point) => {
    const old = previous.get(point.key)
    if (!enContains(after[side], point) && (!old || !enContains(after[side], old))) return false
    return !old || moved(old, point)
  })
}
