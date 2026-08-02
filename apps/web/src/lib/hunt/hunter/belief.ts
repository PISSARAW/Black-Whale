/**
 * What the hunter thinks — invariant I5, made structural rather than promised.
 *
 * Nothing in this file, and nothing in `patrol.ts`, ever takes the player's
 * position as an argument. The only way a position gets in is as a `Percept`,
 * and percepts are minted by the loop out of a sweep that actually found
 * something or a footstep that was actually loud enough to carry. An omniscient
 * hunter is unbeatable and, worse, boring; the way to not write one is to make
 * the truth unavailable at this layer instead of asking the code to ignore it.
 *
 * A belief is one point, one room, and how old it is. It does not decay into a
 * probability cloud — a cloud would be more accurate and would give the hunter
 * behaviour no player could read. He goes where he last had a reason to go, he
 * clears rooms off a list as he sweeps them, and after half a minute of nothing
 * he stops believing anything at all.
 */
import type { Vec2 } from '../../tour/types'

export type PerceptKind = 'en' | 'sound' | 'entrave'

export interface Percept {
  kind: PerceptKind
  at: Vec2
  spaceId: string | null
  /** How sharp the reading is. An En sweep is exact; a footstep is a direction. */
  sharp: boolean
}

export interface HunterBelief {
  at: Vec2 | null
  spaceId: string | null
  from: PerceptKind | null
  sharp: boolean
  /** Seconds since the belief was last refreshed by a percept. */
  age: number
  /** Rooms searched since the last percept — he does not walk them twice. */
  cleared: string[]
}

/** After this long with nothing, he goes back to patrolling. */
export const BELIEF_FADES_AFTER = 30

export function initialBelief(): HunterBelief {
  return { at: null, spaceId: null, from: null, sharp: false, age: 0, cleared: [] }
}

export function updateBelief(belief: HunterBelief, dt: number, percept: Percept | null): HunterBelief {
  if (percept) {
    return {
      at: percept.at,
      spaceId: percept.spaceId,
      from: percept.kind,
      sharp: percept.sharp,
      age: 0,
      cleared: [],
    }
  }
  if (!belief.at) return belief
  return { ...belief, age: belief.age + dt }
}

export function beliefIsStale(belief: HunterBelief): boolean {
  return !belief.at || belief.age >= BELIEF_FADES_AFTER
}

/** He has been there and found nothing. It stops being somewhere to go back to. */
export function clearRoom(belief: HunterBelief, spaceId: string | null): HunterBelief {
  if (!spaceId || belief.cleared.includes(spaceId)) return belief
  return { ...belief, cleared: [...belief.cleared, spaceId], at: null, spaceId: null }
}

/** Drops the belief entirely — used when it has gone stale. */
export function forget(belief: HunterBelief): HunterBelief {
  return { ...initialBelief(), cleared: belief.cleared }
}
