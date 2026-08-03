/**
 * The hunter, as something you can actually see.
 *
 * He was simulated from the start and drawn from nowhere: his position decided
 * sweeps, footsteps and contact, and the walk rendered an empty apartment. So
 * the one thing a hunt is about — turning a corner and finding him there — could
 * not happen.
 *
 * He is handed to `TourScene` as an ordinary apparition, which means the scene's
 * own depth test does the work: he is behind the bulkheads he is behind, and
 * visible down the line of a doorway. That is exactly the rule the hunt wants,
 * and it is the reconstruction's geometry enforcing it rather than anything
 * here. Nothing is added to the blueprint to make it true (I6) — a body is
 * placed in a room that already exists.
 *
 * Two things about him are legible from across a room, and both are things you
 * could see a man doing rather than things you would have to be told. What he is
 * doing — walking a round, standing to listen, going over a floor, stuck to the
 * spot by something you left there — is his colour. And whether his aura is up
 * at all is the sphere the scene draws around him, which is the tell the whole
 * of T4.4 turns on: a hunter whose Ten no longer holds does not look like one
 * whose Ten holds, and now he does not.
 *
 * What he *believes* is not here and must not be. Where he thinks the player is
 * would be a marker on a plan under another name, and not having one is the
 * whole of step 1.
 */
import type { Apparition } from '../tour/apparitions'
import type { HunterState } from './hunter/patrol'
import type { DuelState } from './duel/state'
import { createNenTechniqueState } from '@black-whale/nen-engine'
import { huntDuelNen } from '$lib/nen/tourAdapters'

/** A man's build, in the units the scene draws a combatant in. */
export const HUNTER_SIZE = 1

export type HunterLook = 'walking' | 'listening' | 'searching' | 'held'

/** Slate for a round being walked, rose for a search, violet for held. */
export const HUNTER_COLOURS: Record<HunterLook, number> = {
  walking: 0x94a3b8,
  listening: 0xcbd5e1,
  searching: 0xfb7185,
  held: 0xa78bfa,
}

/**
 * How the scene reads a combatant's `stage`: the aura mode in the low three,
 * and whether the body has gone down above them. Mirrored from `/arena`, which
 * established the encoding — one convention for both games rather than two.
 */
export const AURA_MODE = { ten: 0, ren: 1, zetsu: 2 } as const
export const FALLEN = 3

export interface Sighting {
  hunter: HunterState
  tierId: string
  /** Floor of the room he is standing in — his feet, not his middle. */
  floor: number
  /** The duel, when there is one: Ken is the one thing that changes his aura. */
  duel?: DuelState | null
}

/**
 * Being held reads before anything else, because it is the only one of the four
 * the player caused and the only one with a clock on it.
 */
export function lookOf(hunter: HunterState): HunterLook {
  if (hunter.held > 0) return 'held'
  if (hunter.mode === 'search') return 'searching'
  return hunter.mode === 'listen' ? 'listening' : 'walking'
}

/**
 * The aura he is visibly holding. Nothing at all once his reservoir is empty —
 * that is the Ten failing, and it is the single most valuable thing the player
 * can be told without being told anything. Ken, in a duel, is aura spread over
 * a whole body, which is what the wider sphere is for.
 */
export function stageOf(sighting: Sighting): number {
  if (sighting.hunter.pool.available <= 0) return AURA_MODE.zetsu
  return sighting.duel?.hunter.ken ? AURA_MODE.ren : AURA_MODE.ten
}

export function hunterFigure(sighting: Sighting): Apparition | null {
  const { hunter } = sighting
  if (!hunter.spaceId) return null

  const nen = sighting.duel
    ? huntDuelNen(sighting.duel.hunter)
    : createNenTechniqueState<'head' | 'torso' | 'hands' | 'feet'>()
  if (!sighting.duel) nen.mode = hunter.pool.available <= 0 ? 'zetsu' : 'ten'

  return {
    id: 'hunt:hunter',
    kind: 'combatant',
    spaceId: hunter.spaceId,
    tierId: sighting.tierId,
    at: hunter.position,
    y: sighting.floor,
    size: HUNTER_SIZE,
    colour: HUNTER_COLOURS[lookOf(hunter)],
    stage: stageOf(sighting),
    human: {
      role: 'hunter',
      identity: hunter.profileId,
      alert: hunter.mode === 'search',
      pose:
        hunter.held > 0
          ? 'held'
          : hunter.mode === 'listen'
            ? 'listen'
            : hunter.mode === 'search'
              ? 'search'
              : 'walk',
      aura: hunter.pool.available <= 0 ? 'zetsu' : sighting.duel?.hunter.ken ? 'ren' : 'ten',
      nen,
    },
    // Never Gyo-only: he is a body in a room, not a technique laid on one.
    hidden: false,
  }
}

/** What the scene is given. A list, because a later version has more than one. */
export function sightings(sighting: Sighting): Apparition[] {
  const figure = hunterFigure(sighting)
  return figure ? [figure] : []
}
