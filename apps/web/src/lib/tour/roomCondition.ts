import { polygonArea } from './geometry'
import { authoredFinishOf } from './roomAppearanceLocations'
import type { Finish } from './roomAppearanceTypes'
import { tierSignatureAt } from './tierSignature'
import type { Space, SpaceCategory, Tier } from './types'

/** What the state of one room contributes to every sensory channel. */
export interface RoomCondition {
  finish: Finish
  wear: number
  soil: number
  airLoad: number
  /** Sabine absorption coefficient, deliberately frequency-independent. */
  absorption: number
  /** Perceptual pressure, not a claim about a literal passenger count. */
  humanDensity: number
  ventilationStability: number
}

interface FinishBias {
  wear: number
  soil: number
  airLoad: number
  absorption: number
  occupancy: number
}

/**
 * An exhaustive interpretation of the existing finish vocabulary.
 *
 * Values are sensory parameters. They do not add upholstery, dirt or people to
 * the canonical reconstruction; they say how the finish already chosen by the
 * renderer absorbs a step and how strongly it reveals ordinary use.
 */
export const FINISH_CONDITION: Readonly<Record<Finish, FinishBias>> = {
  legacy: { wear: 0, soil: 0, airLoad: 0, absorption: 0.16, occupancy: 0 },
  'royal-salon': { wear: -0.2, soil: -0.22, airLoad: -0.12, absorption: 0.34, occupancy: -0.2 },
  'gilded-hall': { wear: -0.12, soil: -0.16, airLoad: -0.08, absorption: 0.28, occupancy: 0.05 },
  'royal-suite': { wear: -0.24, soil: -0.24, airLoad: -0.14, absorption: 0.42, occupancy: -0.18 },
  'royal-passage': { wear: -0.14, soil: -0.17, airLoad: -0.1, absorption: 0.25, occupancy: -0.08 },
  funerary: { wear: -0.04, soil: -0.02, airLoad: 0.12, absorption: 0.2, occupancy: -0.22 },
  evacuation: { wear: 0.08, soil: 0.04, airLoad: 0.04, absorption: 0.12, occupancy: -0.12 },
  court: { wear: -0.04, soil: -0.06, airLoad: -0.02, absorption: 0.3, occupancy: 0.02 },
  casino: { wear: -0.02, soil: 0.02, airLoad: 0.12, absorption: 0.36, occupancy: 0.22 },
  barracks: { wear: 0.12, soil: 0.08, airLoad: 0.06, absorption: 0.3, occupancy: 0.16 },
  secure: { wear: 0.04, soil: 0.02, airLoad: 0.02, absorption: 0.11, occupancy: -0.14 },
  government: { wear: -0.04, soil: -0.05, airLoad: -0.03, absorption: 0.24, occupancy: 0 },
  screening: { wear: -0.08, soil: -0.1, airLoad: -0.04, absorption: 0.4, occupancy: 0.12 },
  concealed: { wear: 0.16, soil: 0.18, airLoad: 0.2, absorption: 0.2, occupancy: 0.08 },
  protected: { wear: -0.06, soil: -0.08, airLoad: -0.04, absorption: 0.22, occupancy: -0.1 },
  bulkhead: { wear: 0.1, soil: 0.08, airLoad: 0.08, absorption: 0.1, occupancy: -0.08 },
  civic: { wear: 0.04, soil: 0.02, airLoad: 0.02, absorption: 0.22, occupancy: 0.08 },
  clinical: { wear: -0.1, soil: -0.14, airLoad: -0.1, absorption: 0.25, occupancy: 0.08 },
  police: { wear: 0.04, soil: 0, airLoad: 0, absorption: 0.18, occupancy: 0.08 },
  cineplex: { wear: 0, soil: 0.04, airLoad: 0.08, absorption: 0.48, occupancy: 0.18 },
  'mafia-office': { wear: 0.08, soil: 0.14, airLoad: 0.18, absorption: 0.32, occupancy: 0.08 },
  observation: { wear: -0.04, soil: -0.04, airLoad: -0.04, absorption: 0.24, occupancy: 0.04 },
  'first-class': { wear: -0.1, soil: -0.12, airLoad: -0.08, absorption: 0.36, occupancy: -0.04 },
  'standard-cabin': { wear: 0.06, soil: 0.04, airLoad: 0.04, absorption: 0.3, occupancy: 0.08 },
  dormitory: { wear: 0.18, soil: 0.16, airLoad: 0.18, absorption: 0.38, occupancy: 0.24 },
  'service-passage': { wear: 0.18, soil: 0.18, airLoad: 0.14, absorption: 0.1, occupancy: 0 },
  recycling: { wear: 0.26, soil: 0.3, airLoad: 0.28, absorption: 0.09, occupancy: 0.02 },
  briefing: { wear: 0, soil: -0.02, airLoad: -0.02, absorption: 0.32, occupancy: 0.08 },
  'ei-i-office': { wear: 0.08, soil: 0.1, airLoad: 0.1, absorption: 0.3, occupancy: 0.08 },
  'xi-yu-office': { wear: 0.06, soil: 0.08, airLoad: 0.08, absorption: 0.31, occupancy: 0.08 },
  'assembly-bay': { wear: 0.24, soil: 0.22, airLoad: 0.22, absorption: 0.08, occupancy: 0.18 },
  'mess-hall': { wear: 0.24, soil: 0.22, airLoad: 0.24, absorption: 0.34, occupancy: 0.34 },
  'cha-r-office': { wear: 0.1, soil: 0.12, airLoad: 0.12, absorption: 0.3, occupancy: 0.1 },
  hangar: { wear: 0.28, soil: 0.26, airLoad: 0.24, absorption: 0.07, occupancy: 0.04 },
  'hold-clinic': { wear: 0.12, soil: 0.06, airLoad: 0.08, absorption: 0.22, occupancy: 0.08 },
  'fifth-class': { wear: 0.24, soil: 0.22, airLoad: 0.24, absorption: 0.3, occupancy: 0.24 },
  warehouse: { wear: 0.28, soil: 0.3, airLoad: 0.26, absorption: 0.08, occupancy: 0.02 },
}

const CATEGORY_OCCUPANCY: Readonly<Record<SpaceCategory, number>> = {
  room: 0,
  corridor: 0.04,
  quarters: 0.02,
  residential: 0.04,
  public: 0.12,
  military: 0.04,
  administrative: 0.02,
  medical: 0.04,
  mafia: 0.04,
  prison: -0.08,
  ceremonial: -0.08,
  evacuation: -0.12,
  infrastructure: -0.08,
  storage: -0.1,
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const mix = (base: number, bias: number) => clamp01(base + bias)

/** Finish already assigned to a space, with `legacy` as the explicit fallback. */
export function finishOf(space: Pick<Space, 'locationId'>): Finish {
  return (space.locationId && authoredFinishOf(space.locationId)) || 'legacy'
}

/**
 * Named bodies can raise a room's pressure, but never stand in for 200,000
 * invented silhouettes. The tier and finish provide the non-literal bed; the
 * canonical cast only adds local evidence to it.
 */
function namedDensity(space: Space, occupants: number): number {
  if (!(occupants > 0)) return 0
  const area = Math.max(1, polygonArea(space.footprint))
  return clamp01(occupants / Math.max(4, Math.sqrt(area) * 1.8))
}

/** The complete sensory condition of one room. */
export function roomConditionOf(options: {
  space: Space
  tier: Tier
  namedOccupants?: number
}): RoomCondition {
  const { space, tier, namedOccupants = 0 } = options
  const finish = finishOf(space)
  const bias = FINISH_CONDITION[finish]
  const deck = tierSignatureAt(tier.elevation)
  const localPeople = namedDensity(space, namedOccupants)

  return {
    finish,
    wear: mix(deck.wear, bias.wear),
    soil: mix(deck.soil, bias.soil),
    airLoad: mix(deck.airLoad, bias.airLoad),
    absorption: bias.absorption,
    humanDensity: clamp01(
      deck.humanDensity + bias.occupancy + CATEGORY_OCCUPANCY[space.category] + localPeople * 0.25,
    ),
    ventilationStability: clamp01(deck.ventilationStability - bias.airLoad * 0.45),
  }
}

/** Reuse a room's sensory bed until its named occupancy actually changes. */
export class RoomConditionCache {
  readonly #conditions = new Map<string, { occupants: number; condition: RoomCondition }>()

  get(space: Space, tier: Tier, occupants = 0): RoomCondition {
    const held = this.#conditions.get(space.id)
    if (held?.occupants === occupants) return held.condition
    const condition = roomConditionOf({ space, tier, namedOccupants: occupants })
    this.#conditions.set(space.id, { occupants, condition })
    return condition
  }
}
