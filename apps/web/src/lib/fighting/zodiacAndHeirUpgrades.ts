import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

export const ERIGERON_SURGE_FRAMES = 360
export const ERIGERON_CATALYST_FRAMES = 360
export const ERIGERON_KAMEO_FACTOR = 1
export const ERIGERON_BODY_MEMORY_DRAIN = 3
export const LYNCH_CONFESSION_FRAMES = 360
export const MIZAISTOM_YELLOW_FRAMES = 180
export const MIZAISTOM_RED_STASIS_FRAMES = 90
export const GEL_VENOM_FRAMES = 300
export const GEL_VENOM_TRANSFER_PENALTY = 0
export const GEL_CONSTRICTION_DRAIN = 0

export interface CrossGameCardState {
  issuer: FightSide
  target: FightSide
  phase: 'yellow' | 'red'
  remainingFrames: number
}

declare module './types' {
  interface ArcadeFighter {
    erigeronSurgeFrames?: number
    erigeronCatalystFrames?: number
    soulConfessionFrames?: number
    gelVenomFrames?: number
    crossGameStasis?: boolean
  }
  interface FightState {
    crossGameCard?: CrossGameCardState
  }
}

/** Erigeron requires a suitable living growth target; it is not a self-buff. */
export function activateErigeronSurge(fighter: ArcadeFighter): ArcadeFighter {
  return fighter
}

/** Erigeron does not catalyse poison, burns, or Body Memory. */
export function applyErigeronCatalyst(target: ArcadeFighter): ArcadeFighter {
  return target
}

/**
 * Body and Soul's canonical answer is recorded by lynchInterrogation.
 * It does not dispel disguises, reveal hidden Nen or expose an opponent's arsenal.
 */
export function applyBodyAndSoulTruth(state: FightState, attackerSide: FightSide): FightState {
  void attackerSide
  return state
}

/** Body and Soul answers the spoken question; it never predicts the target's next input. */
export function lynchConfessionIntent(state: FightState, lynchSide: FightSide): string | null {
  void state
  void lynchSide
  return null
}

/** Legacy entry point; canonical warning and breach handling lives in crossGameAction. */
export function issueCrossGameYellow(state: FightState, side: FightSide): FightState {
  void side
  return state
}

function stepCrossGameCard(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  const card = state.crossGameCard
  if (!card) return state
  void inputs
  return {
    ...state,
    crossGameCard: undefined,
    [card.target]: { ...state[card.target], crossGameStasis: undefined },
  }
}

/** Gel's revealed arm transformation has no confirmed venom. */
export function applyGelVenom(target: ArcadeFighter): ArcadeFighter {
  return target
}

/** Gel's revealed arm transformation has no confirmed aura drain. */
export function applyGelConstriction(state: FightState, gelSide: FightSide): FightState {
  void gelSide
  return state
}

export function advanceZodiacAndHeirUpgrades(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  if (state.phase !== 'fighting') return state
  const next = stepCrossGameCard(state, inputs)
  const player = clearLegacyUpgradeEffects(next.player)
  const opponent = clearLegacyUpgradeEffects(next.opponent)
  if (player === next.player && opponent === next.opponent) return next
  return { ...next, player, opponent }
}

function clearLegacyUpgradeEffects(fighter: ArcadeFighter): ArcadeFighter {
  const legacy = [
    fighter.erigeronSurgeFrames,
    fighter.erigeronCatalystFrames,
    fighter.soulConfessionFrames,
    fighter.gelVenomFrames,
  ].some(Boolean)
  if (!legacy) return fighter
  return {
    ...fighter,
    erigeronSurgeFrames: undefined,
    erigeronCatalystFrames: undefined,
    soulConfessionFrames: undefined,
    gelVenomFrames: undefined,
  }
}
