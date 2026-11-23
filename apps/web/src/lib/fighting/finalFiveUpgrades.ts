import { isBeyond, isTheta } from './martialSpecialists'
import { FIREARM_RELOAD_FRAMES, firearmCapacity, REN_MALICE_RANGE } from './nenPillars'
import { senseDeprived } from './saiyuSenses'
import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

export const PADAILLE_HAMMER_KEN_DRAIN = 16
export const PADAILLE_DRILL_TEN_CHIP = 1.6
export const LONGHI_OFFER_FRAMES = 180 // 3 s window to sign
export const LONGHI_CONTRACT_FRAMES = 720 // 12 s active pact
export const LONGHI_REFUSE_AURA_GAIN = 15
export const LONGHI_REGEN_BONUS = 1.3
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

const isPadaille = (f: Pick<ArcadeFighter, 'id' | 'nenOwner'>) => (f.nenOwner ?? f.id) === 'padaille'

/** 1. Saiyu Mizaru: resets visual deduction to level 0 and blocks visual Gyo readout. */
export function saiyuSightBlocked(viewer: ArcadeFighter): boolean {
  return senseDeprived(viewer, 'sight')
}

/** 1. Saiyu Kikazaru: mutes audio cues (reloads, Cyclotron, Basho, Ken/Ten) and Melody's alerts. */
export function saiyuAudioCuesMuted(viewer: ArcadeFighter): boolean {
  return senseDeprived(viewer, 'hearing')
}

/** 2. Padaille Hammer (5S): drains heavy aura against Ken guard and eases wall-splat. */
export function padailleHammerKenDrain(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  blocked: boolean,
): number {
  if (!isPadaille(attacker) || !blocked || !defender.nen.ken) return 0
  return attacker.attack?.kind === 'special' && attacker.attack.variant === 'neutral'
    ? PADAILLE_HAMMER_KEN_DRAIN
    : 0
}

/** 2. Padaille Drill (6S): pierces Ten guard and counts double for Body Memory. */
export function padailleDrillPiercesTen(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  blocked: boolean,
): boolean {
  if (!isPadaille(attacker) || !blocked || defender.nen.ken || defender.nen.ko) return false
  return attacker.attack?.kind === 'special' && attacker.attack.variant === 'forward'
}

export function padailleDrillBodyMemoryStack(attacker: ArcadeFighter): number {
  if (!isPadaille(attacker)) return 1
  return attacker.attack?.kind === 'special' && attacker.attack.variant === 'forward' ? 2 : 1
}

/** 2. Padaille Axe (2S): clean hit opens a wound, forcing Contexte (plugWounds). */
export function padailleAxeOpensWound(
  attacker: ArcadeFighter,
  blocked: boolean,
  damage: number,
): boolean {
  if (!isPadaille(attacker) || blocked || damage <= 0) return false
  return attacker.attack?.kind === 'special' && attacker.attack.variant === 'down'
}

/** 3. Theta passive: hides stress on Living Portrait at perception 0 unless Gyo or Melody/Furykov reads her. */
export function thetaPortraitHidesStress(theta: ArcadeFighter, observer: ArcadeFighter): boolean {
  if (!isTheta(theta)) return false
  const observerId = observer.nenOwner ?? observer.id
  if (observerId === 'melody' || observerId === 'furykov') return false
  return !(observer.nen.gyo && !observer.gyoLow)
}

/** 3. Theta silent reload (Zetsu + Contexte): reloads without leaving Zetsu or emitting audio/visual cues. */
export function startThetaSilentReload(fighter: ArcadeFighter): ArcadeFighter {
  if (!isTheta(fighter) || fighter.nen.mode !== 'zetsu') return fighter
  const cap = firearmCapacity(fighter)
  if ((fighter.firearmAmmo ?? cap) >= cap || (fighter.firearmReloadFrames ?? 0) > 0) return fighter
  return { ...fighter, firearmReloadFrames: FIREARM_RELOAD_FRAMES, silentReload: true }
}

/** 4. Longhi 5S: proposes a 12s mutual +30% aura regen / no-Ken pact. */
export function proposeMoonlightContract(state: FightState, longhiSide: FightSide): FightState {
  const target: FightSide = longhiSide === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    moonlightOffer: {
      proposer: longhiSide,
      target,
      status: 'offered',
      remainingFrames: LONGHI_OFFER_FRAMES,
    },
  }
}

export function acceptMoonlightContract(state: FightState, targetSide: FightSide): FightState {
  const offer = state.moonlightOffer
  if (!offer || offer.status !== 'offered' || offer.target !== targetSide) return state
  return {
    ...state,
    moonlightOffer: { ...offer, status: 'active', remainingFrames: LONGHI_CONTRACT_FRAMES },
  }
}

export function declineMoonlightContract(state: FightState): FightState {
  const offer = state.moonlightOffer
  if (!offer || offer.status !== 'offered') return state
  const longhi = state[offer.proposer]
  return {
    ...state,
    moonlightOffer: undefined,
    [offer.proposer]: { ...longhi, aura: Math.min(100, longhi.aura + LONGHI_REFUSE_AURA_GAIN) },
  }
}

export function moonlightContractActive(state: FightState): boolean {
  return state.moonlightOffer?.status === 'active'
}

/** 5. Beyond Netero: Ren density saturates/blurs opponent Gyo and doubles Ren Malice range. */
export function beyondSaturatesGyo(beyond: ArcadeFighter): boolean {
  return isBeyond(beyond) && beyond.nen.mode === 'ren'
}

export function beyondRenMaliceRange(attacker: ArcadeFighter): number {
  return isBeyond(attacker) ? REN_MALICE_RANGE * 2 : REN_MALICE_RANGE
}

export function advanceFinalFiveUpgrades(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  if (state.phase !== 'fighting') return state
  let next = state
  const offer = next.moonlightOffer
  if (offer?.status === 'offered') {
    if (inputs[offer.target]?.context) return acceptMoonlightContract(next, offer.target)
    const rem = offer.remainingFrames - 1
    return rem > 0
      ? { ...next, moonlightOffer: { ...offer, remainingFrames: rem } }
      : declineMoonlightContract(next)
  }
  if (offer?.status === 'active') {
    for (const side of ['player', 'opponent'] as const) {
      if (next[side].nen.ken) {
        next = {
          ...next,
          moonlightOffer: undefined,
          [side]: {
            ...next[side],
            burstZetsuFrames: Math.max(next[side].burstZetsuFrames ?? 0, LONGHI_BREACH_ZETSU_FRAMES),
          },
        }
        return next
      }
    }
    const rem = offer.remainingFrames - 1
    next =
      rem > 0
        ? { ...next, moonlightOffer: { ...offer, remainingFrames: rem } }
        : { ...next, moonlightOffer: undefined }
  }
  return next
}
