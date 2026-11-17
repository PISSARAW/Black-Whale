import { otherSide } from '../frameData'
import type { FightDeath } from '../fightDeaths'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import type { KameoSlot } from './types'

/**
 * A duel view in which `side`'s kameo stands in its leader's slot. Engine functions
 * run on the view unchanged; `mergeDuel` puts every body back in place afterwards.
 */
export interface DuelProjection {
  side: FightSide
  leader: ArcadeFighter
  slot: KameoSlot
  view: FightState
}

export function projectDuel(state: FightState, side: FightSide, slot: KameoSlot): DuelProjection {
  // The view never sees kameos or pending deaths: nested code stays a plain duel,
  // and a leader's pending death cannot mask the kameo's own.
  const view: FightState = { ...state, [side]: slot.fighter, kameos: undefined, deaths: undefined }
  return { side, leader: state[side], slot, view }
}

/**
 * The kameo returns to its slot and the leader to the duel. World changes made in the
 * view (opponent, hitstop, impact, score, rng) are kept. A kameo death eliminates the
 * kameo only: it is never recorded as its camp's death and never decides the round.
 */
export function mergeDuel(state: FightState, projection: DuelProjection, view: FightState) {
  const { side, leader, slot } = projection
  const deaths = mergedDeaths(state.deaths, view.deaths, side)
  const fighter = view[side]
  const eliminated = fighter.health <= 0 || killedIn(view.deaths, side)
  const merged: FightState = {
    ...view,
    [side]: leader,
    kameos: {
      ...state.kameos,
      [side]: { ...slot, fighter, phase: eliminated ? 'eliminated' : slot.phase },
    },
    deaths,
  }
  if (!deaths) delete merged.deaths
  return merged
}

function killedIn(deaths: readonly FightDeath[] | undefined, side: FightSide): boolean {
  return Boolean(deaths?.some((death) => death.victimSide === side))
}

function mergedDeaths(
  before: readonly FightDeath[] | undefined,
  during: readonly FightDeath[] | undefined,
  side: FightSide,
): FightDeath[] | undefined {
  // Only deaths of the opposing body are real camp deaths; the killer is the kameo's camp.
  const added = (during ?? []).filter((death) => death.victimSide === otherSide(side))
  const all = [...(before ?? []), ...added]
  return all.length ? all : undefined
}
