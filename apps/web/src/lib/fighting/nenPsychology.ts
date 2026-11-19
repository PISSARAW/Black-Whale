import { insideEn, perceivesAura } from './nenPerception'
import { gyoSight } from './nenCombat/sight'
import { nenMentalFatigueRatio } from './nenCognitiveLoad'
import { initialNenPsychology, nenPsychologyProfile } from './nenPsychologyProfiles'
import type { ArcadeFighter, FightImpact, FightSide, FightState, FighterId } from './types'

export const MAX_NEN_PSYCHOLOGY = 10_000
export const BASE_NEN_COMPOSURE = 7_000
export const BASE_NEN_RESOLVE = 5_000

export interface NenPsychologicalState {
  composure: number
  apprehension: number
  resolve: number
}

declare module './types' {
  interface ArcadeFighter {
    /** Optional only for replay snapshots created before aura psychology existed. */
    nenPsychology?: NenPsychologicalState
  }
}

export interface AuraPsychology {
  pressure: number
  stability: number
  intent: number
}

export type AuraPressureBand = 'silent' | 'low' | 'high' | 'overwhelming'
export interface PerceivedAuraPsychology {
  pressure: AuraPressureBand
  detail?: {
    stability: 'steady' | 'wavering'
    intent: 'guarded' | 'hostile'
  }
}

export function createNenPsychology(id?: FighterId): NenPsychologicalState {
  return id
    ? initialNenPsychology(id)
    : { composure: BASE_NEN_COMPOSURE, apprehension: 0, resolve: BASE_NEN_RESOLVE }
}

export function nenPsychologyOf(fighter: ArcadeFighter): NenPsychologicalState {
  return fighter.nenPsychology ?? createNenPsychology(fighter.id)
}

/** Internal emotion and visible aura are separate: this derives only the outward expression. */
export function auraPsychology(state: FightState, side: FightSide): AuraPsychology {
  const fighter = state[side]
  const psyche = nenPsychologyOf(fighter)
  const composure = psyche.composure / MAX_NEN_PSYCHOLOGY
  const apprehension = psyche.apprehension / MAX_NEN_PSYCHOLOGY
  const resolve = psyche.resolve / MAX_NEN_PSYCHOLOGY
  const fatigue = nenMentalFatigueRatio(fighter)
  const stability = clamp01(
    (composure * 0.55 + resolve * 0.25 + (1 - apprehension) * 0.2) * (1 - fatigue * 0.35),
  )
  const intent = clamp01(
    Number(Boolean(fighter.attack)) * 0.5 +
      Number(Boolean(fighter.attack?.hatsuSource)) * 0.25 +
      Number(fighter.nen.mode === 'ren') * 0.15 +
      Number(fighter.blocking) * 0.05,
  )
  const intensity = auraIntensity(fighter)
  const pressure = Math.round(100 * intensity * (0.55 + stability * 0.45) * (0.75 + resolve * 0.25))
  return { pressure, stability, intent }
}

/** The viewer gets a sensation first; Gyo or a real En contact is needed for interpretation. */
export function readAuraPsychology(
  state: FightState,
  subject: FightSide,
  viewer: FightSide,
): PerceivedAuraPsychology | null {
  const source = state[subject]
  const observer = state[viewer]
  if (!perceivesAura(observer, source)) return null
  const expression = auraPsychology(state, subject)
  const pressure = pressureBand(expression.pressure)
  if (pressure === 'silent') return { pressure }
  const detailed = gyoSight(observer) || insideEn(observer, source)
  return {
    pressure,
    ...(detailed && {
      detail: {
        stability: expression.stability >= 0.55 ? 'steady' : 'wavering',
        intent: expression.intent >= 0.55 ? 'hostile' : 'guarded',
      },
    }),
  }
}

export function nenApprehensionRatio(fighter: ArcadeFighter): number {
  return nenPsychologyOf(fighter).apprehension / MAX_NEN_PSYCHOLOGY
}

/** One authoritative frame of residue and event response; hitstop never reaches this function. */
export function advanceNenPsychology(before: FightState, after: FightState): FightState {
  if (after.forecastSimulation) return after
  let player = settlePsychology(after.player)
  let opponent = settlePsychology(after.opponent)
  const nextImpact = newImpact(before.impact, after.impact)
  if (nextImpact) {
    const result = reactToImpact({ player, opponent }, nextImpact)
    player = result.player
    opponent = result.opponent
  }
  player = reactToWitness(before.player, player)
  opponent = reactToWitness(before.opponent, opponent)
  if (player === after.player && opponent === after.opponent) return after
  return { ...after, player, opponent }
}

function settlePsychology(fighter: ArcadeFighter): ArcadeFighter {
  const current = nenPsychologyOf(fighter)
  const profile = nenPsychologyProfile(fighter.id)
  const next = {
    composure: approach(current.composure, profile.composure, profile.recovery.composure),
    apprehension: Math.max(0, current.apprehension - profile.recovery.apprehension),
    resolve: approach(current.resolve, profile.resolve, profile.recovery.resolve),
  }
  return samePsychology(current, next) ? fighter : { ...fighter, nenPsychology: next }
}

function reactToImpact(
  fighters: Pick<FightState, 'player' | 'opponent'>,
  impact: FightImpact,
): Pick<FightState, 'player' | 'opponent'> {
  const defenderSide: FightSide = impact.attacker === 'player' ? 'opponent' : 'player'
  if (impact.avoided || impact.parried) {
    const defenderProfile = nenPsychologyProfile(fighters[defenderSide].id)
    const attackerProfile = nenPsychologyProfile(fighters[impact.attacker].id)
    const defender = shiftPsychology(fighters[defenderSide], {
      resolve: scaled(impact.parried ? 180 : 100, defenderProfile.successResolve),
      composure: 60,
    })
    const attacker = shiftPsychology(fighters[impact.attacker], {
      apprehension: scaled(60, attackerProfile.impactApprehension),
    })
    return { ...fighters, [defenderSide]: defender, [impact.attacker]: attacker }
  }
  const defender = fighters[defenderSide]
  const defenderProfile = nenPsychologyProfile(defender.id)
  const attackerProfile = nenPsychologyProfile(fighters[impact.attacker].id)
  const damageShock = Math.round((impact.damage / Math.max(1, defender.maxHealth)) * 2_500)
  const openingShock = impact.counterHit || impact.punish ? 160 : 0
  const shock = Math.max(30, Math.min(700, damageShock + openingShock))
  const guarded = impact.blocked ? 0.35 : 1
  return {
    ...fighters,
    [defenderSide]: shiftPsychology(defender, {
      apprehension: scaled(shock * guarded, defenderProfile.impactApprehension),
      composure: -scaled(shock * guarded * 0.5, defenderProfile.impactComposureLoss),
    }),
    [impact.attacker]: shiftPsychology(fighters[impact.attacker], {
      resolve: scaled(
        impact.counterHit || impact.punish ? 180 : 70,
        attackerProfile.successResolve,
      ),
      composure: impact.counterHit ? 70 : 20,
    }),
  }
}

function reactToWitness(before: ArcadeFighter, after: ArcadeFighter): ArcadeFighter {
  const previous = before.hatsuEffects.witnessedAt
  const witnessed = after.hatsuEffects.witnessedAt
  if (witnessed === undefined || witnessed === previous) return after
  // A newly manifested Hatsu creates caution, never automatic panic or knowledge of its rules.
  const caution = nenPsychologyProfile(after.id).hatsuCaution
  return shiftPsychology(after, {
    apprehension: scaled(90, caution),
    composure: -scaled(30, caution),
  })
}

function shiftPsychology(
  fighter: ArcadeFighter,
  delta: Partial<NenPsychologicalState>,
): ArcadeFighter {
  const current = nenPsychologyOf(fighter)
  return {
    ...fighter,
    nenPsychology: {
      composure: bounded(current.composure + (delta.composure ?? 0)),
      apprehension: bounded(current.apprehension + (delta.apprehension ?? 0)),
      resolve: bounded(current.resolve + (delta.resolve ?? 0)),
    },
  }
}

function newImpact(before: FightImpact | null, after: FightImpact | null): FightImpact | null {
  return after && after.sequence !== before?.sequence ? after : null
}

function auraIntensity(fighter: ArcadeFighter): number {
  if (fighter.nen.mode === 'zetsu') return 0
  if (fighter.nen.on) return 1
  let intensity = fighter.nen.mode === 'ren' ? 0.65 : 0.25
  if (fighter.nen.en) intensity += 0.12
  if (fighter.nen.ken) intensity += 0.08
  if (fighter.attack?.hatsuSource) intensity += 0.18
  return clamp01(intensity)
}

function pressureBand(pressure: number): AuraPressureBand {
  if (pressure <= 0) return 'silent'
  if (pressure < 35) return 'low'
  if (pressure < 70) return 'high'
  return 'overwhelming'
}

function samePsychology(left: NenPsychologicalState, right: NenPsychologicalState): boolean {
  return (
    left.composure === right.composure &&
    left.apprehension === right.apprehension &&
    left.resolve === right.resolve
  )
}

function approach(value: number, target: number, step: number): number {
  return value < target ? Math.min(target, value + step) : Math.max(target, value - step)
}

function bounded(value: number): number {
  return Math.max(0, Math.min(MAX_NEN_PSYCHOLOGY, Math.round(value)))
}

function scaled(value: number, percent: number): number {
  return Math.round((value * percent) / 100)
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
