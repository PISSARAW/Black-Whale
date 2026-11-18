import { settleVoiceAutopilot } from './blackVoiceAutopilot'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { physicalBodyAt } from './fightBodyIdentity'
import { voluntaryNenAvailable } from './nenAccess'
import {
  armVoiceAntenna,
  setVoiceGear,
  voiceAntennaReady,
  voiceGear,
  voiceHandConflict,
  voicePhoneReady,
} from './blackVoiceGear'
import {
  hasVoiceControl,
  changeVoiceTarget,
  targetAlreadyControlled,
  voiceTarget,
  voiceTargets,
  type VoiceTarget,
} from './blackVoiceTargets'
import type { BlackVoiceControl, BlackVoiceOrder } from './blackVoiceTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { HatsuImpactContext } from './hatsu/contract'

export function blackVoiceMoveAllowed(
  state: FightState,
  side: FightSide,
  moveId?: string,
): boolean {
  if (chrolloPageForMove(state[side], moveId) !== 'black-voice') return true
  const prepared = armVoiceAntenna(state, side)
  return voiceAntennaReady(prepared, side) && !voiceHandConflict(prepared, side)
}
export function prepareBlackVoice(state: FightState, side: FightSide, moveId?: string): FightState {
  return chrolloPageForMove(state[side], moveId) === 'black-voice'
    ? armVoiceAntenna(state, side)
    : state
}
export function plantBlackVoice({ state, side, defenderSide }: HatsuImpactContext): FightState {
  return side === defenderSide ? state : completeVoiceImplant(state, side, defenderSide)
}

/** A pin must actually pierce a living human. A projection, corpse or duplicate is not one. */
export function implantVoiceTarget(
  state: FightState,
  side: FightSide,
  targetId: string,
): FightState {
  const target = voiceTarget(state, targetId)
  if (
    !target ||
    target.body?.blocking ||
    Math.hypot(target.x - state[side].x, target.y - state[side].y) > 8
  )
    return state
  if (ownVoiceBody(state, side, target)) return state
  return completeVoiceImplant(state, side, targetId)
}
export function implantVoiceSelf(state: FightState, side: FightSide): FightState {
  return completeVoiceImplant(state, side, side)
}
function ownVoiceBody(state: FightState, side: FightSide, target: VoiceTarget): boolean {
  return target.side === side && target.member === (state.teamMatch?.seats[side].active ?? 0)
}
function completeVoiceImplant(state: FightState, side: FightSide, targetId: string): FightState {
  if (
    !chrolloHasActivePage(state[side], 'black-voice') ||
    !voiceAntennaReady(state, side) ||
    voiceHandConflict(state, side)
  )
    return state
  const target = voiceTarget(state, targetId)
  if (!target || !plantableTarget(target)) return state
  const gear = voiceGear(state, side),
    antenna = gear.armed!
  const control: BlackVoiceControl = {
    owner: side,
    ownerMember: state.teamMatch?.seats[side].active ?? 0,
    antenna: { ...antenna, hand: undefined },
    order: 'stay',
    active: false,
  }
  return changeVoiceTarget(setVoiceGear(state, side, { ...gear, armed: undefined }), target, {
    blackVoiceControl: control,
  })
}
function plantableTarget(target: VoiceTarget): boolean {
  return livingHuman(target) && !target.control && !targetAlreadyControlled(target)
}

function livingHuman(target: ReturnType<typeof voiceTarget> & {}): boolean {
  if (target.health <= 0) return false
  if (target.body) return !target.body.hanzoProjection
  return Boolean(
    target.entity &&
    !target.entity.copy &&
    ['supporter', 'morena', 'person'].includes(target.entity.kind),
  )
}

export function issueVoiceOrder(
  state: FightState,
  side: FightSide,
  command: { targetId: string; order: BlackVoiceOrder },
): FightState {
  const { targetId, order } = command
  const target = voiceTarget(state, targetId),
    control = target?.control
  if (!target || !control || !voiceOrderReady(state, side, control) || target.health <= 0)
    return state
  if (ownVoiceBody(state, side, target)) return state
  if (sameVoiceOrder(control, order)) return state
  if (!control.active && targetAlreadyControlled(target)) return state
  return activateVoiceSubject(state, target, order)
}
function activateVoiceSubject(
  state: FightState,
  target: VoiceTarget,
  order: BlackVoiceOrder,
): FightState {
  const controlledBody = target.body
    ? {
        attack: null,
        bufferedAttack: null,
        blocking: false,
        hatsuEffects: { ...target.body.hatsuEffects, manipulatedFrames: 1 },
      }
    : {}
  return changeVoiceTarget(state, target, {
    ...controlledBody,
    blackVoiceControl: { ...target.control!, active: true, order },
  })
}

function voiceOrderReady(state: FightState, side: FightSide, control: BlackVoiceControl): boolean {
  return (
    control.owner === side &&
    control.ownerMember === (state.teamMatch?.seats[side].active ?? 0) &&
    chrolloHasActivePage(state[side], 'black-voice') &&
    voicePhoneReady(state, side, control.antenna.pairId)
  )
}
export function voiceSourceActive(state: FightState, control: BlackVoiceControl): boolean {
  const owner = physicalBodyAt(state, control.owner, control.ownerMember)
  if (!owner || owner.health <= 0) return false
  // Hidden enemy pages are unknown, not a confirmed loss of Black Voice.
  return owner.chrolloBook?.pagesPrivate
    ? voluntaryNenAvailable(owner)
    : chrolloHasActivePage(owner, 'black-voice')
}
export function releaseBlackVoicePage(state: FightState, side: FightSide): FightState {
  if (!hasVoiceControl(state)) return state
  let next = state
  for (const target of voiceTargets(next)) {
    const control = target.control
    if (control?.owner !== side || !control.active) continue
    if (target.health > 0 && voiceSourceActive(next, control)) continue
    next = changeVoiceTarget(next, target, {
      blackVoiceControl: { ...control, active: false },
      ...(target.body
        ? { hatsuEffects: { ...target.body.hatsuEffects, manipulatedFrames: 0 } }
        : {}),
    })
  }
  return next
}
export function voiceAutonomy(fighter: ArcadeFighter): boolean {
  return !fighter.blackVoiceControl?.active
}

export function reconcileBlackVoice(state: FightState): FightState {
  state = settleVoiceAutopilot(state)
  if (!hasVoiceControl(state)) return state
  return releaseBlackVoicePage(releaseBlackVoicePage(state, 'player'), 'opponent')
}

function sameVoiceOrder(control: BlackVoiceControl, order: BlackVoiceOrder): boolean {
  return control.active && control.order === order
}
