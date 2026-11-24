import { isTheta } from './martialSpecialists'
import { FIREARM_RELOAD_FRAMES, firearmCapacity, REN_MALICE_RANGE } from './nenPillars'
import { senseDeprived } from './saiyuSenses'
import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

export const PADAILLE_HAMMER_KEN_DRAIN = 0
export const PADAILLE_DRILL_TEN_CHIP = 1
export const LONGHI_OFFER_FRAMES = 180 // 3 s window to sign
export const LONGHI_CONTRACT_FRAMES = 720 // 12 s active pact
export const LONGHI_REFUSE_AURA_GAIN = 0
export const LONGHI_REGEN_BONUS = 1
export const LONGHI_BREACH_ZETSU_FRAMES = 180

export interface MoonlightOfferState {
  proposer: FightSide
  target: FightSide
  status: 'offered' | 'active'
  remainingFrames: number
}

declare module './types' {
  interface ArcadeFighter {
    silentReload?: boolean
  }
  interface FightInput {
    acceptContract?: boolean
  }
  interface FightState {
    moonlightOffer?: MoonlightOfferState
  }
}

/** 1. Saiyu Mizaru: resets visual deduction to level 0 and blocks visual Gyo readout. */
export function saiyuSightBlocked(viewer: ArcadeFighter): boolean {
  return senseDeprived(viewer, 'sight')
}

/** 1. Saiyu Kikazaru: mutes audio cues (reloads, Cyclotron, Basho, Ken/Ten) and Melody's alerts. */
export function saiyuAudioCuesMuted(viewer: ArcadeFighter): boolean {
  return senseDeprived(viewer, 'hearing')
}

/** Padaille's hammer makes an ordinary physical contact; it has no special Ken drain. */
export function padailleHammerKenDrain(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  blocked: boolean,
): number {
  void attacker
  void defender
  void blocked
  return 0
}

/** Padaille's drill does not automatically pierce guard. */
export function padailleDrillPiercesTen(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  blocked: boolean,
): boolean {
  void attacker
  void defender
  void blocked
  return false
}

export function padailleDrillBodyMemoryStack(attacker: ArcadeFighter): number {
  void attacker
  return 1
}

/** Padaille's axe does not guarantee an extra wound state. */
export function padailleAxeOpensWound(
  attacker: ArcadeFighter,
  blocked: boolean,
  damage: number,
): boolean {
  void attacker
  void blocked
  void damage
  return false
}

/** Theta has no revealed Hatsu or passive that conceals stress. */
export function thetaPortraitHidesStress(theta: ArcadeFighter, observer: ArcadeFighter): boolean {
  void theta
  void observer
  return false
}

/** 3. Theta silent reload (Zetsu + Contexte): reloads without leaving Zetsu or emitting audio/visual cues. */
export function startThetaSilentReload(fighter: ArcadeFighter): ArcadeFighter {
  if (!isTheta(fighter) || fighter.nen.mode !== 'zetsu') return fighter
  const cap = firearmCapacity(fighter)
  if ((fighter.firearmAmmo ?? cap) >= cap || (fighter.firearmReloadFrames ?? 0) > 0) return fighter
  return { ...fighter, firearmReloadFrames: FIREARM_RELOAD_FRAMES, silentReload: true }
}

/** Legacy entry point; Moonlight Act is handled by the signed-contract system. */
export function proposeMoonlightContract(state: FightState, longhiSide: FightSide): FightState {
  void longhiSide
  return state
}

export function acceptMoonlightContract(state: FightState, targetSide: FightSide): FightState {
  void targetSide
  return state
}

export function declineMoonlightContract(state: FightState): FightState {
  return state.moonlightOffer ? { ...state, moonlightOffer: undefined } : state
}

export function moonlightContractActive(state: FightState): boolean {
  return state.moonlightOffer?.status === 'active'
}

/** Beyond's duel Ren has no revealed Gyo-saturation property. */
export function beyondSaturatesGyo(beyond: ArcadeFighter): boolean {
  void beyond
  return false
}

export function beyondRenMaliceRange(attacker: ArcadeFighter): number {
  void attacker
  return REN_MALICE_RANGE
}

export function advanceFinalFiveUpgrades(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  void inputs
  return state.moonlightOffer ? { ...state, moonlightOffer: undefined } : state
}
