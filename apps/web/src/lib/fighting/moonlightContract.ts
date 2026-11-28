import { judgmentForbidsContact, resolveJudgmentCommunication } from './judgmentCommunication'
import {
  advanceMoonlightPenalty,
  carryMoonlightPenalty,
  MOONLIGHT_PENALTY_FRAMES,
} from './moonlightPenalty'
import { illumiBodyFree } from './illumiState'
import { witnessedHatsuState } from './nenWitness'
import { transitionNen } from '@black-whale/nen-engine'
import { voluntaryNenAvailable } from './nenAccess'
import { chrolloPageForMove } from './chrolloBook'
import type { ArcadeFighter, FightSide, FightState } from './types'
import { moonlightBinds, rewardMoonlightParty, teamMoonlightSigners } from './moonlightParties'
import {
  agreementClause,
  moonlightClause,
  type MoonlightClauseId,
  type MoonlightPenalty,
  type MoonlightReward,
  type MoonlightTerms,
} from './moonlightClauses'

export const MOONLIGHT_TRUCE_FRAMES = moonlightClause('truce').durationFrames
export const MOONLIGHT_OFFER_FRAMES = 480
export const MOONLIGHT_SIGNING_RANGE = 12
export const MOONLIGHT_MOVE = 'longhi:neutralSpecial'

export interface MoonlightAgreement {
  signers?: Record<FightSide, import('./types').FighterId>
  sourceMoveId?: string
  issuer: FightSide
  recipient: FightSide
  /** Which predefined contract was offered; absent on agreements from before the catalogue. */
  clause?: MoonlightClauseId
  /** Both signatures bind the same disclosed rules; these cannot change after acceptance. */
  terms: MoonlightTerms
  reward: MoonlightReward
  penalty: MoonlightPenalty
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
  return voluntaryNenAvailable(fighter, { requireReserve: true, requireHatsu: false })
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
    illumiBodyFree(fighter) &&
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
  clause?: MoonlightClauseId
}): FightState {
  const { state, side, moveId } = options
  const clause = moonlightClause(options.clause)
  if (state.moonlight?.offer || state.moonlight?.active) return state
  if ((state.moonlight?.cooldownFrames ?? 0) > 0) return state
  if (!moonlightSigningAvailable(state) || !hasMoonlightAuthority(state[side], moveId)) return state
  const recipient = other(side)
  const offered: FightState = {
    ...state,
    [recipient]: {
      ...state[recipient],
      hatsuEffects: {
        ...state[recipient].hatsuEffects,
        ...witnessedHatsuState(state, { side, source: 'longhi' }),
      },
    },
    moonlight: {
      offer: {
        signers: teamMoonlightSigners(state),
        issuer: side,
        recipient,
        sourceMoveId: moveId,
        clause: clause.id,
        terms: clause.terms,
        reward: clause.reward,
        penalty: clause.penalty,
        remainingFrames: MOONLIGHT_OFFER_FRAMES,
      },
    },
  }
  return resolveJudgmentCommunication(offered, side, state[recipient].id)
}

/** Only the recipient's explicit response can supply the second signature. */
function canSignMoonlightOffer(
  state: FightState,
  offer: NonNullable<NonNullable<FightState['moonlight']>['offer']>,
): boolean {
  return (
    moonlightSigningAvailable(state) &&
    hasMoonlightAuthority(state[offer.issuer], offer.sourceMoveId)
  )
}

export function respondMoonlightContract(options: {
  state: FightState
  side: FightSide
  accept: boolean
}): FightState {
  const { state, side, accept } = options
  const offer = state.moonlight?.offer
  if (state.phase !== 'fighting' || !offer || offer.recipient !== side) return state
  if (!accept)
    return resolveJudgmentCommunication(
      { ...state, moonlight: { cooldownFrames: 120, outcome: { kind: 'refused', side } } },
      side,
      state[offer.issuer].id,
    )
  if (!canSignMoonlightOffer(state, offer)) return state
  const issuer = state[offer.issuer]
  const recipient = state[offer.recipient]
  const loan = issuer.moonlightLoan ?? 0
  const clause = agreementClause(offer)
  const surge = clause.immediateAura ?? 0
  const signed: FightState = {
    ...state,
    [offer.issuer]: {
      ...issuer,
      aura: Math.min(100, issuer.aura + surge),
      moonlightLoan: loan > 0 ? loan - 1 : loan,
    },
    [offer.recipient]: {
      ...recipient,
      aura: Math.min(100, recipient.aura + surge),
    },
    moonlight: { active: { ...offer, remainingFrames: clause.durationFrames } },
  }
  return resolveJudgmentCommunication(signed, side, state[offer.issuer].id)
}

/** Basic movement and physical blows remain during the actual week-long Nen sanction. */
export function moonlightZetsu(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...fighter,
    moonlightZetsu: true,
    moonlightPenaltyFrames: fighter.moonlightPenaltyFrames ?? MOONLIGHT_PENALTY_FRAMES,
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

function moonlightKenBreach(
  state: FightState,
  pact: NonNullable<NonNullable<FightState['moonlight']>['active']>,
): FightSide | undefined {
  if (pact.terms !== 'no-ken') return
  return (['player', 'opponent'] as const).find(
    (side) => state[side].nen.ken && moonlightBinds(state, side, pact),
  )
}

export function advanceMoonlightContract(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  state = advanceMoonlightPenalty(state)
  const offer = state.moonlight?.offer
  if (offer) return tickOffer(state, offer)
  const pact = state.moonlight?.active
  if (!pact) return tickCooldown(state)
  const breach = moonlightKenBreach(state, pact)
  if (breach) return breachMoonlightContract(state, breach)
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
  if (judgmentForbidsContact(state.opponent, state[offer.issuer].id)) return state
  if (state.mode !== 'versus-ai' || offer.recipient !== 'opponent') return state
  if (offer.remainingFrames > MOONLIGHT_OFFER_FRAMES - 30) return state
  if (!moonlightSigningAvailable(state)) return state
  const accepts = state.opponent.aura < 45 && state.projectiles.length === 0
  return respondMoonlightContract({ state, side: 'opponent', accept: accepts })
}

function moonlightAiLoanOffer(state: FightState): FightState {
  if (state.mode !== 'versus-ai' || (state.opponent.moonlightLoan ?? 0) < 1) return state
  if (judgmentForbidsContact(state.opponent, state.player.id)) return state
  return state.opponent.aura < 45 ? offerMoonlightContract({ state, side: 'opponent' }) : state
}

/** A full truce freezes the AI; a bare-hands pact lets it keep fighting with plain strikes. */
export function moonlightAiWaiting(state: FightState): boolean {
  if (state.moonlight?.offer?.issuer === 'opponent') return true
  return state.moonlight?.active?.terms === 'no-attacks'
}

export function carryMoonlightRound(next: FightState, previous: FightState): FightState {
  const carry = (side: FightSide): ArcadeFighter => {
    const fighter = { ...next[side], moonlightLoan: previous[side].moonlightLoan }
    return previous[side].moonlightZetsu
      ? carryMoonlightPenalty(moonlightZetsu(fighter), previous[side])
      : fighter
  }
  return {
    ...next,
    player: carry('player'),
    opponent: carry('opponent'),
    moonlight: previous.moonlight?.active ? { active: previous.moonlight.active } : undefined,
  }
}
