import { witnessedHatsu } from './nenWitness'
import { canUseHatsu, transitionNen } from '@black-whale/nen-engine'
import { chrolloPageForMove } from './chrolloBook'
import { hatsuSealedByOn } from './onTechnique'
import { predatorNenLocked } from './predatorSeal'
import type { ArcadeFighter, FightSide, FightState } from './types'
import { moonlightBinds, rewardMoonlightParty, teamMoonlightSigners } from './moonlightParties'

export const MOONLIGHT_TRUCE_FRAMES = 300
export const MOONLIGHT_OFFER_FRAMES = 480
export const MOONLIGHT_SIGNING_RANGE = 12
export const MOONLIGHT_MOVE = 'longhi:neutralSpecial'

export interface MoonlightAgreement {
  signers?: Record<FightSide, import('./types').FighterId>
  sourceMoveId?: string
  issuer: FightSide
  recipient: FightSide
  /** Both signatures bind the same disclosed rules; these cannot change after acceptance. */
  terms: 'no-attacks'
  reward: 'one-use-of-moonlight-act'
  penalty: 'one-week-zetsu'
  remainingFrames: number
}

export interface MoonlightState {
  cooldownFrames?: number
  offer?: MoonlightAgreement
  active?: MoonlightAgreement
  outcome?: { kind: 'refused' | 'expired' | 'fulfilled' | 'breached'; side: FightSide }
}

const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')

export function moonlightNenAvailable(fighter: ArcadeFighter): boolean {
  return (
    fighter.aura > 0 &&
    !predatorNenLocked(fighter) &&
    !fighter.moonlightZetsu &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    canUseHatsu(fighter.nen) &&
    !hatsuSealedByOn(fighter)
  )
}

export function hasMoonlightAuthority(fighter: ArcadeFighter, moveId?: string): boolean {
  if (!moonlightNenAvailable(fighter)) return false
  if ((fighter.moonlightLoan ?? 0) > 0) return true
  if (fighter.id === 'longhi')
    return (
      fighter.hatsuEffects.hatsuStolen === 0 &&
      fighter.stolenChainAbility?.moveId !== MOONLIGHT_MOVE
    )
  return chrolloPageForMove(fighter, moveId) === 'longhi'
}

function canSign(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.y === 0 &&
    !fighter.hanzoProjection &&
    !fighter.attack &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    freelyActing(fighter)
  )
}

function freelyActing(fighter: ArcadeFighter): boolean {
  const effects = fighter.hatsuEffects
  return (
    effects.manipulatedFrames === 0 &&
    !fighter.needlePuppet &&
    effects.entrancedFrames === 0 &&
    effects.possessedFrames === 0 &&
    effects.momozeFrames === 0
  )
}

export function moonlightSigningAvailable(state: FightState): boolean {
  return (
    state.phase === 'fighting' &&
    canSign(state.player) &&
    canSign(state.opponent) &&
    Math.abs(state.player.x - state.opponent.x) <= MOONLIGHT_SIGNING_RANGE
  )
}

export function moonlightCanOffer(state: FightState, side: FightSide): boolean {
  return (
    !state.moonlight?.offer &&
    !state.moonlight?.active &&
    !state.moonlight?.cooldownFrames &&
    moonlightSigningAvailable(state) &&
    hasMoonlightAuthority(state[side])
  )
}

/** Offering is the issuer's voluntary signature; it never binds the recipient. */
export function offerMoonlightContract(options: {
  state: FightState
  side: FightSide
  moveId?: string
}): FightState {
  const { state, side, moveId } = options
  if (state.moonlight?.offer || state.moonlight?.active) return state
  if ((state.moonlight?.cooldownFrames ?? 0) > 0) return state
  if (!moonlightSigningAvailable(state) || !hasMoonlightAuthority(state[side], moveId)) return state
  const recipient = other(side)
  return {
    ...state,
    [recipient]: {
      ...state[recipient],
      hatsuEffects: {
        ...state[recipient].hatsuEffects,
        witnessedHatsu: witnessedHatsu(state, { side, source: 'longhi' }),
      },
    },
    moonlight: {
      offer: {
        signers: teamMoonlightSigners(state),
        issuer: side,
        recipient,
        sourceMoveId: moveId,
        terms: 'no-attacks',
        reward: 'one-use-of-moonlight-act',
        penalty: 'one-week-zetsu',
        remainingFrames: MOONLIGHT_OFFER_FRAMES,
      },
    },
  }
}

/** Only the recipient's explicit response can supply the second signature. */
export function respondMoonlightContract(options: {
  state: FightState
  side: FightSide
  accept: boolean
}): FightState {
  const { state, side, accept } = options
  const offer = state.moonlight?.offer
  if (state.phase !== 'fighting' || !offer || offer.recipient !== side) return state
  if (!accept)
    return { ...state, moonlight: { cooldownFrames: 120, outcome: { kind: 'refused', side } } }
  if (
    !moonlightSigningAvailable(state) ||
    !hasMoonlightAuthority(state[offer.issuer], offer.sourceMoveId)
  )
    return state
  const issuer = state[offer.issuer]
  const loan = issuer.moonlightLoan ?? 0
  return {
    ...state,
    [offer.issuer]: { ...issuer, moonlightLoan: loan > 0 ? loan - 1 : loan },
    moonlight: { active: { ...offer, remainingFrames: MOONLIGHT_TRUCE_FRAMES } },
  }
}

/** The week-long penalty lasts through the match; basic movement and physical blows remain. */
export function moonlightZetsu(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...fighter,
    moonlightZetsu: true,
    nen: transitionNen(fighter.nen, { type: 'ZETSU' }).state,
    bufferedAttack: null,
    hatsuChargeFrames: 0,
    attack: fighter.attack ? { ...fighter.attack, auraCharged: false } : null,
  }
}

export function breachMoonlightContract(state: FightState, side: FightSide): FightState {
  if (!state.moonlight?.active) return state
  if (!moonlightBinds(state, side, state.moonlight.active)) return state
  return {
    ...state,
    [side]: moonlightZetsu(state[side]),
    moonlight: { outcome: { kind: 'breached', side } },
  }
}

export function advanceMoonlightContract(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  const offer = state.moonlight?.offer
  if (offer) return tickOffer(state, offer)
  const pact = state.moonlight?.active
  if (!pact) return tickCooldown(state)
  const remainingFrames = pact.remainingFrames - 1
  if (remainingFrames > 0) return { ...state, moonlight: { active: { ...pact, remainingFrames } } }
  return {
    ...rewardMoonlightParty(state, pact),
    moonlight: { outcome: { kind: 'fulfilled', side: pact.recipient } },
  }
}

function tickOffer(state: FightState, offer: MoonlightAgreement): FightState {
  const remainingFrames = offer.remainingFrames - 1
  if (remainingFrames > 0 && hasMoonlightAuthority(state[offer.issuer], offer.sourceMoveId))
    return { ...state, moonlight: { offer: { ...offer, remainingFrames } } }
  return {
    ...state,
    moonlight: { cooldownFrames: 120, outcome: { kind: 'expired', side: offer.recipient } },
  }
}

function tickCooldown(state: FightState): FightState {
  const cooldown = state.moonlight?.cooldownFrames ?? 0
  return cooldown > 0
    ? { ...state, moonlight: { ...state.moonlight, cooldownFrames: cooldown - 1 } }
    : state
}

/** AI consent is a separate, visible decision, never the default response of a human player. */
export function moonlightAiResponse(state: FightState): FightState {
  const offer = state.moonlight?.offer
  if (!offer) return moonlightAiLoanOffer(state)
  if (state.mode !== 'versus-ai' || offer?.recipient !== 'opponent') return state
  if (offer.remainingFrames > MOONLIGHT_OFFER_FRAMES - 30) return state
  if (!moonlightSigningAvailable(state)) return state
  const accepts = state.opponent.aura < 45 && state.projectiles.length === 0
  return respondMoonlightContract({ state, side: 'opponent', accept: accepts })
}

function moonlightAiLoanOffer(state: FightState): FightState {
  if (state.mode !== 'versus-ai' || (state.opponent.moonlightLoan ?? 0) < 1) return state
  return state.opponent.aura < 45 ? offerMoonlightContract({ state, side: 'opponent' }) : state
}

export function moonlightAiWaiting(state: FightState): boolean {
  return Boolean(state.moonlight?.active || state.moonlight?.offer?.issuer === 'opponent')
}

export function carryMoonlightRound(next: FightState, previous: FightState): FightState {
  const carry = (side: FightSide): ArcadeFighter => {
    const fighter = { ...next[side], moonlightLoan: previous[side].moonlightLoan }
    return previous[side].moonlightZetsu ? moonlightZetsu(fighter) : fighter
  }
  return {
    ...next,
    player: carry('player'),
    opponent: carry('opponent'),
    moonlight: previous.moonlight?.active ? { active: previous.moonlight.active } : undefined,
  }
}
