import { nenDefenceFactor, type NenTechniqueState } from '@black-whale/nen-engine'
import type { FightNenZone } from '../fighting/types'
import { ryuDistribution } from './ryu'
import type { BodyZone, CombatSide, CombatState, FighterState } from './types'

/**
 * Clash's Nen economy and exchange factors, read from Arena's fighter state.
 *
 * Arena duels opt in through `CombatState.nenRules`. The defence is the shared
 * `nenDefenceFactor` of `@black-whale/nen-engine`, the same function Clash
 * calls; the attack factor and the aura flow copy the numbers of
 * `fighting/nen.ts`, because Clash computes them on its own fighter type.
 * Nen category efficiency is taken as full: Arena fighters have no category.
 */

/** Clash's Ko engagement cost (`fighting/nen.ts`). */
export const CLASH_KO_COST = 20
/** How long an engaged Ko waits for the next move before the aura flows back. */
export const CLASH_KO_HOLD = 2.5
/** Clash's defensive Ko: the committed zone outguards Ken; every other zone has nothing. */
const KO_ZONE_DEFENCE = 1.2

/** Aura per second, from `baseAuraFlow`, `advancedAuraDrain` and body Gyo in Clash. */
const FLOW = { zetsu: 10, ken: -8, ren: -4, gyoAtRest: 0, ten: 1.4 }
const DRAIN = { gyo: 2.4, in: 3, en: 9, shu: 4 }

export const usesClashNen = (state: CombatState) => state.nenRules === 'clash'

export function clashZone(zone: BodyZone): FightNenZone {
  if (zone === 'arms') return 'hands'
  if (zone === 'legs') return 'feet'
  return zone
}

export function arenaZone(zone: FightNenZone): BodyZone {
  if (zone === 'hands') return 'arms'
  if (zone === 'feet') return 'legs'
  return zone
}

/**
 * Arena's Ryu is a permanent split: the attack share sits in the striking
 * limbs, the reserve in the guarded zone and, thinly, everywhere else.
 */
function clashRyu(fighter: FighterState): Partial<Record<FightNenZone, number>> {
  const { attack, defence } = ryuDistribution(fighter)
  return {
    head: defence.head,
    torso: defence.torso,
    hands: attack / 2 + defence.arms,
    feet: attack / 2 + defence.legs,
  }
}

export function clashNenState(fighter: FighterState): NenTechniqueState<FightNenZone> {
  return {
    mode: fighter.ken && fighter.mode !== 'zetsu' ? 'ren' : fighter.mode,
    in: fighter.in,
    gyo: fighter.gyo,
    en: fighter.en ? { radius: fighter.en } : null,
    ken: fighter.ken,
    on: false,
    ko: fighter.ko ? clashZone(fighter.ko.zone) : null,
    ryu: clashRyu(fighter),
    shu: fighter.shuObjectId ? [fighter.shuObjectId] : [],
  }
}

/** Clash `nenAttackFactor`: Zetsu and a Ko held elsewhere leave a purely physical blow. */
export function clashAttackFactor(fighter: FighterState, auraZone: FightNenZone): number {
  const nen = clashNenState(fighter)
  if (nen.mode === 'zetsu') return 0.7
  if (nen.ko && nen.ko !== auraZone) return 0.7
  let factor = nen.mode === 'ren' ? 1.22 : 1
  factor += Number(nen.ryu[auraZone] ?? 0) * 0.48
  if (nen.ko) factor += 0.82
  return factor * (fighter.empowered > 0 ? 1.3 : 1)
}

/** Clash `nenDamageFactor`: how much of a blow to `zone` the defender's aura lets through. */
export function clashDamageFactor(fighter: FighterState, zone: FightNenZone): number {
  const nen = clashNenState(fighter)
  const regional = nen.ko ? (nen.ko === zone ? KO_ZONE_DEFENCE : 0) : nenDefenceFactor(nen, zone)
  const spread = nen.en ? 0.45 : 1
  const eyeFocus = nen.gyo && (nen.ken || nen.ko) ? 0.62 : 1
  let factor = 1 + (0.35 - regional * spread * eyeFocus) * 0.7
  if (nen.mode === 'zetsu') factor *= 1.45
  if (nen.ko && nen.ko !== zone) factor *= 1.55
  return factor
}

/** True when a Ko engaged on the striking limb makes the blow a critical aura strike. */
export function criticalAuraStrike(fighter: FighterState, auraZone: FightNenZone): boolean {
  return Boolean(fighter.ko && clashZone(fighter.ko.zone) === auraZone)
}

/** Clash's aura flow: Ten breathes back, Ren and Ken spend, Zetsu recovers fastest. */
export function clashAuraFlow(fighter: FighterState): number {
  const base = baseFlow(fighter)
  const drains =
    Number(fighter.gyo) * DRAIN.gyo +
    Number(fighter.in) * DRAIN.in +
    Number(fighter.en !== null) * DRAIN.en +
    Number(fighter.shuObjectId !== null) * DRAIN.shu
  return fighter.mode === 'zetsu' ? base : base - drains
}

function baseFlow(fighter: FighterState): number {
  if (fighter.mode === 'zetsu') return FLOW.zetsu
  if (fighter.ken) return FLOW.ken
  if (fighter.mode === 'ren') return FLOW.ren
  return fighter.gyo ? FLOW.gyoAtRest : FLOW.ten
}

/**
 * Clash's Ko: the aura is engaged on one zone for the next move, not thrown as
 * a blow of its own. It powers that move if the zone is its striking limb, and
 * leaves every other zone bare until the move lands or the hold runs out.
 */
export function engageClashKo(state: CombatState, side: CombatSide, zone: BodyZone): CombatState {
  const fighter = state[side]
  const refused =
    fighter.aura < CLASH_KO_COST ||
    fighter.mode === 'zetsu' ||
    fighter.ken ||
    fighter.ko ||
    fighter.condition !== 'ready'
  if (refused) return state
  const engaged = {
    ...fighter,
    aura: fighter.aura - CLASH_KO_COST,
    ko: { zone, remaining: CLASH_KO_HOLD },
  }
  return { ...state, [side]: engaged }
}

/** An engaged Ko that no move used flows back into Ten. */
export function expireClashKo(state: CombatState): CombatState {
  let current = state
  for (const side of ['player', 'opponent'] as const) {
    const ko = current[side].ko
    if (ko && ko.remaining <= 0) current = { ...current, [side]: { ...current[side], ko: null } }
  }
  return current
}

/** The move that carried the Ko has landed: the aura is spent. */
export function spentKo(state: CombatState, side: CombatSide): CombatState {
  if (!usesClashNen(state) || !state[side].ko) return state
  return { ...state, [side]: { ...state[side], ko: null } }
}
