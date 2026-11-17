import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { physicalBodyAt } from './fightBodyIdentity'
import { seesCombatBody } from './fightCounterplay'
import { fightFormat } from './formats'
import { mapPhysicalBodies } from './physicalBodyMap'
import { targetAlreadyControlled, voiceTarget } from './blackVoiceTargets'
import { voiceGearBodyReady, voicePhoneReady } from './blackVoiceGear'
import { FIGHT_FPS } from './fightClock'
import type { BlackVoiceControl } from './blackVoiceTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface VoiceAutopilot {
  target: FightSide
  targetMember: number
  startedAt: number
  lastSeen: { x: number; y: number }
}
declare module './types' {
  interface ArcadeFighter {
    blackVoiceAutopilot?: VoiceAutopilot
    blackVoiceAftermath?: { remainingFrames: number; memory: 'none' }
  }
}

/** Ch. 227 gives days of severe soreness, not a short cooldown. Two days is a scenario minimum. */
export const AUTOPILOT_RECOVERY = 2 * 24 * 60 * 60 * FIGHT_FPS
/** Output multipliers and aura budget are duel tuning; never Shalnark's measured manga strength. */
export const AUTOPILOT_COST = 25
export const AUTOPILOT_FRAME_COST = 0.1

export function activateVoiceAutopilot(state: FightState, side: FightSide): FightState {
  if (!selfModeReady(state, side)) return state
  const target = side === 'player' ? 'opponent' : 'player',
    enemy = state[target]
  if (!visibleSelfEnemy(state[side], enemy) || extraVisibleEnemy(state, side)) return state
  const actor = state[side]
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - AUTOPILOT_COST,
      blackVoiceScreen: undefined,
      blackVoiceControl: { ...actor.blackVoiceControl!, active: true, order: 'attack' },
      blackVoiceAutopilot: {
        target,
        targetMember: state.teamMatch?.seats[target].active ?? 0,
        startedAt: state.frame,
        lastSeen: { x: enemy.x, y: enemy.y },
      },
      attack: null,
      bufferedAttack: null,
      blocking: false,
      hatsuEffects: { ...actor.hatsuEffects, manipulatedFrames: 1 },
    },
  }
}
function selfModeReady(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    control = actor.blackVoiceControl
  if (!control || control.active || !voiceGearBodyReady(state, side) || !selfModeResources(actor))
    return false
  if (fightFormat(state.formatId).victory === 'points') return false
  const self = voiceTarget(state, side)!
  return (
    selfPinOwned(state, side, control) &&
    !targetAlreadyControlled(self) &&
    voicePhoneReady(state, side, control.antenna.pairId)
  )
}
function selfModeResources(actor: ArcadeFighter): boolean {
  return (
    !actor.blackVoiceAftermath &&
    actor.aura >= AUTOPILOT_COST &&
    chrolloHasActivePage(actor, 'black-voice')
  )
}

/** This executable mission is a duel against one bodily opponent, not an invented arbitrary AI wish. */
function extraVisibleEnemy(state: FightState, side: FightSide): boolean {
  const other = side === 'player' ? 'opponent' : 'player'
  return Boolean(
    state.battlefield?.entities.some(
      (entry) =>
        entry.owner === other &&
        entry.present &&
        entry.health > 0 &&
        ['supporter', 'morena'].includes(entry.kind) &&
        Math.abs(entry.x - state[side].x) <= 60 &&
        (entry.x - state[side].x) * state[side].facing >= 0,
    ),
  )
}
export function visibleSelfEnemy(actor: ArcadeFighter, enemy: ArcadeFighter): boolean {
  return (
    enemy.health > 0 &&
    seesCombatBody(actor) &&
    !enemy.clothCapture &&
    !enemy.hanzoProjection &&
    Math.hypot(enemy.x - actor.x, enemy.y - actor.y) <= 60 &&
    (enemy.x - actor.x) * actor.facing >= 0
  )
}

/** Mission completion or involuntary loss of its medium ends the mode; no voluntary cancel exists. */
export function settleVoiceAutopilot(state: FightState): FightState {
  return mapPhysicalBodies(state, (actor) => {
    const mode = actor.blackVoiceAutopilot
    if (!mode) return actor
    const enemy = physicalBodyAt(state, mode.target, mode.targetMember)
    const running =
      actor.blackVoiceControl?.active &&
      actor.health > 0 &&
      selfPageMaintained(actor) &&
      enemy &&
      enemy.health > 0
    if (running) return actor
    return {
      ...actor,
      blackVoiceAutopilot: undefined,
      blackVoiceAftermath: { remainingFrames: AUTOPILOT_RECOVERY, memory: 'none' },
      blackVoiceScreen: undefined,
      blackVoiceControl: actor.blackVoiceControl
        ? { ...actor.blackVoiceControl, active: false }
        : undefined,
      hatsuEffects: { ...actor.hatsuEffects, manipulatedFrames: 0 },
      attack: null,
      bufferedAttack: null,
    }
  })
}
export function advanceVoiceRecovery(state: FightState): FightState {
  return mapPhysicalBodies(state, (actor) => {
    const recovery = actor.blackVoiceAftermath
    if (!recovery) return actor
    const remainingFrames = Math.max(0, recovery.remainingFrames - 1)
    return {
      ...actor,
      blackVoiceAftermath: remainingFrames ? { ...recovery, remainingFrames } : undefined,
    }
  })
}
export function voiceOutputFactor(actor: ArcadeFighter): number {
  if (actor.blackVoiceAutopilot) return 1.75
  return actor.blackVoiceAftermath ? 0.65 : 1
}
export function voiceSpeedFactor(actor: ArcadeFighter): number {
  if (actor.blackVoiceAutopilot) return 2
  return actor.blackVoiceAftermath ? 0.6 : 1
}

export function voiceSelfMissionAvailable(state: FightState, side: FightSide): boolean {
  const enemy = side === 'player' ? 'opponent' : 'player'
  return (
    fightFormat(state.formatId).victory !== 'points' &&
    visibleSelfEnemy(state[side], state[enemy]) &&
    !extraVisibleEnemy(state, side)
  )
}

function selfPinOwned(state: FightState, side: FightSide, control: BlackVoiceControl): boolean {
  return (
    control.owner === side && control.ownerMember === (state.teamMatch?.seats[side].active ?? 0)
  )
}

/** A referee's timer or a round button is not a way to cancel a still-unfinished Nen mission. */
export function carryVoiceAutopilot(body: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  const recovering = { ...body, blackVoiceAftermath: previous.blackVoiceAftermath }
  if (!previous.blackVoiceAutopilot) return recovering
  return {
    ...recovering,
    blackVoiceAutopilot: previous.blackVoiceAutopilot,
    blackVoiceControl: previous.blackVoiceControl,
    chrolloBook: previous.chrolloBook,
    aura: previous.aura,
    auraExhausted: previous.auraExhausted,
  }
}

function selfPageMaintained(actor: ArcadeFighter): boolean {
  return actor.chrolloBook?.pagesPrivate
    ? voluntaryNenAvailable(actor)
    : chrolloHasActivePage(actor, 'black-voice')
}
