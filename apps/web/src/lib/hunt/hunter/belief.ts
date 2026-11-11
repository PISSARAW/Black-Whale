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
  /** Competing explanations retained until evidence or a search rules them out. */
  hypotheses: BeliefHypothesis[]
}

export interface BeliefHypothesis {
  at: Vec2
  spaceId: string | null
  from: PerceptKind
  sharp: boolean
  age: number
  confidence: number
}

/** After this long with nothing, he goes back to patrolling. */
export const BELIEF_FADES_AFTER = 30
export const MAX_BELIEF_HYPOTHESES = 4

export function initialBelief(): HunterBelief {
  return {
    at: null,
    spaceId: null,
    from: null,
    sharp: false,
    age: 0,
    cleared: [],
    hypotheses: [],
  }
}

export function updateBelief(
  belief: HunterBelief,
  dt: number,
  percept: Percept | null,
): HunterBelief {
  const aged = hypothesesOf(belief).map((hypothesis) => ({
    ...hypothesis,
    age: hypothesis.age + dt,
  }))
  if (percept) {
    const hypothesis: BeliefHypothesis = {
      at: percept.at,
      spaceId: percept.spaceId,
      from: percept.kind,
      sharp: percept.sharp,
      age: 0,
      confidence: confidenceFor(percept),
    }
    const alternatives = aged.filter(
      (candidate) => candidate.spaceId !== hypothesis.spaceId || candidate.from !== hypothesis.from,
    )
    return selectPrimary([hypothesis, ...alternatives], [])
  }
  return selectPrimary(aged, belief.cleared)
}

export function beliefIsStale(belief: HunterBelief): boolean {
  return !belief.hypotheses.some((hypothesis) => hypothesis.age < BELIEF_FADES_AFTER)
}

/** He has been there and found nothing. It stops being somewhere to go back to. */
export function clearRoom(belief: HunterBelief, spaceId: string | null): HunterBelief {
  if (!spaceId || belief.cleared.includes(spaceId)) return belief
  return selectPrimary(
    hypothesesOf(belief).filter((hypothesis) => hypothesis.spaceId !== spaceId),
    [...belief.cleared, spaceId],
  )
}

/** Drops the belief entirely — used when it has gone stale. */
export function forget(belief: HunterBelief): HunterBelief {
  return selectPrimary(
    hypothesesOf(belief).filter((hypothesis) => hypothesis.age < BELIEF_FADES_AFTER),
    belief.cleared,
  )
}

function hypothesesOf(belief: HunterBelief): BeliefHypothesis[] {
  if (belief.hypotheses) return belief.hypotheses
  if (!belief.at || !belief.from) return []
  return [
    {
      at: belief.at,
      spaceId: belief.spaceId,
      from: belief.from,
      sharp: belief.sharp,
      age: belief.age,
      confidence: belief.sharp ? 1 : 0.55,
    },
  ]
}

function confidenceFor(percept: Percept): number {
  if (percept.kind === 'en') return percept.sharp ? 1 : 0.75
  if (percept.kind === 'entrave') return 0.85
  return percept.sharp ? 0.7 : 0.55
}

function selectPrimary(
  hypotheses: readonly BeliefHypothesis[],
  cleared: readonly string[],
): HunterBelief {
  const ranked = hypotheses
    .filter((hypothesis) => hypothesis.age < BELIEF_FADES_AFTER)
    .sort(
      (left, right) =>
        right.confidence -
        right.age / BELIEF_FADES_AFTER -
        (left.confidence - left.age / BELIEF_FADES_AFTER),
    )
    .slice(0, MAX_BELIEF_HYPOTHESES)
  const primary = ranked[0]
  return {
    at: primary?.at ?? null,
    spaceId: primary?.spaceId ?? null,
    from: primary?.from ?? null,
    sharp: primary?.sharp ?? false,
    age: primary?.age ?? 0,
    cleared: [...cleared],
    hypotheses: ranked,
  }
}
