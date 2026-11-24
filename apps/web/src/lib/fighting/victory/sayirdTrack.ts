import { beginFight, createFight, performMove, tickFight } from '../engine'
import { combatRouteAction, combatRouteInput } from '../combatRouteFight'
import { canStartFighterAttack } from '../fighterAttacks'
import { moveForSlot } from '../movesets'
import { EMPTY_INPUT, type FighterId, type FightState, type MoveSlot } from '../types'

export const SAYIRD_ROUTES: readonly (readonly MoveSlot[])[] = [
  ['standingLight', 'forwardLight', 'standingHeavy'],
  ['lowLight', 'forwardLight', 'standingHeavy'],
]
export const SAYIRD_HITS = [252, 280, 310, 348, 380, 414] as const
export const SAYIRD_COMBAT = 228
export const SAYIRD_FALL = 415
export const SAYIRD_PORTRAIT = 510
interface SayirdTrack {
  states: FightState[]
  impacts: { index: number; slot: MoveSlot; comboHits: number }[]
}
const cache = new Map<FighterId, SayirdTrack>()

export function sayirdTrack(target: FighterId): SayirdTrack {
  let track = cache.get(target)
  if (!track) {
    track = buildTrack(target)
    cache.set(target, track)
  }
  return track
}

function buildTrack(target: FighterId): SayirdTrack {
  let state = beginFight(
    createFight('sayird', target, { mode: 'versus-local', formatId: 'knockout' }),
  )
  state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 50 } }
  const states = [state],
    impacts: SayirdTrack['impacts'] = []
  const step = (walk = false) => {
    state = tickFight(
      state,
      { ...EMPTY_INPUT, right: walk },
      { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT },
    )
    states.push(state)
  }
  const until = (test: () => boolean) => {
    for (let i = 0; i < 360 && !test(); i++) step()
    if (!test()) throw new Error('Sayird: native cinematic combo did not resolve')
  }
  for (const route of SAYIRD_ROUTES) {
    until(() =>
      [state.player, state.opponent].every(
        (f) => !f.attack && !f.hitStun && !f.knockdownFrames && !f.wakeupInvulnerableFrames,
      ),
    )
    for (let i = 0; i < 240 && state.opponent.x - state.player.x > 6; i++) step(true)
    for (const slot of route) {
      const move = moveForSlot('sayird', slot)!
      until(() => !state.hitstop && canStartFighterAttack(state.player, move.kind, move.id))
      state = performMove({
        state,
        side: 'player',
        action: combatRouteAction(slot),
        input: combatRouteInput(slot, state.player.facing),
      })
      states[states.length - 1] = state
      const sequence = state.impact?.sequence
      until(() => state.impact?.sequence !== sequence && state.impact?.attacker === 'player')
      if (state.impact?.blocked) throw new Error('Sayird: cinematic hit was blocked')
      impacts.push({ index: states.length - 1, slot, comboHits: state.opponent.comboHits })
    }
  }
  return { states, impacts }
}

export function sayirdTrackIndex(age: number, track: SayirdTrack) {
  const segment = SAYIRD_HITS.findIndex((frame) => age <= frame)
  if (segment < 0) return track.states.length - 1
  const before = segment === 0 ? SAYIRD_COMBAT : SAYIRD_HITS[segment - 1]
  const from = segment === 0 ? 0 : track.impacts[segment - 1].index
  const to = track.impacts[segment].index
  const progress = Math.max(0, Math.min(1, (age - before) / (SAYIRD_HITS[segment] - before)))
  return Math.round(from + (to - from) * progress)
}
