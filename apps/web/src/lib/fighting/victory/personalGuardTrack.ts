import { beginFight, createFight, performMove, tickFight } from '../engine'
import { combatRouteAction, combatRouteInput } from '../combatRouteFight'
import { canStartFighterAttack } from '../fighterAttacks'
import { moveForSlot } from '../movesets'
import { EMPTY_INPUT, type FighterId, type FightState, type MoveSlot } from '../types'

export type PersonalGuard = 'longhi' | 'furykov'
export const GUARD_ROUTES: Record<PersonalGuard, readonly MoveSlot[][]> = {
  longhi: [
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['standingLight', 'standingHeavy'],
  ],
  furykov: [
    ['standingLight', 'forwardLight', 'forwardSpecial'],
    ['lowLight', 'standingHeavy'],
  ],
}
export interface GuardTrack {
  states: FightState[]
  impacts: { index: number; slot: MoveSlot; comboHits: number }[]
  last: number
}
const cache = new Map<string, GuardTrack>()
export function personalGuardTrack(hero: PersonalGuard, target: FighterId): GuardTrack {
  const key = `${hero}:${target}`
  let track = cache.get(key)
  if (!track) {
    track = buildTrack(hero, target)
    cache.set(key, track)
  }
  return track
}
function buildTrack(hero: PersonalGuard, target: FighterId): GuardTrack {
  let state = beginFight(createFight(hero, target, { mode: 'versus-local', formatId: 'knockout' }))
  state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 50 } }
  const states = [state],
    impacts: GuardTrack['impacts'] = []
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
    if (!test()) throw new Error(`${hero}: native combo command did not resolve`)
  }
  for (const route of GUARD_ROUTES[hero]) {
    until(() =>
      [state.player, state.opponent].every(
        (f) => !f.attack && !f.hitStun && !f.knockdownFrames && !f.wakeupInvulnerableFrames,
      ),
    )
    for (let i = 0; i < 240 && state.opponent.x - state.player.x > 6; i++) step(true)
    for (const slot of route) {
      const move = moveForSlot(hero, slot)!
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
      if (state.impact?.blocked) throw new Error(`${hero}: cinematic route was blocked`)
      impacts.push({ index: states.length - 1, slot, comboHits: state.opponent.comboHits })
    }
  }
  return { states, impacts, last: states.length - 1 }
}
