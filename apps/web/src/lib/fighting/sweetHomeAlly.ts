import { attackPhase, otherSide } from './frameData'
import { wakeHanzoBody } from './hanzoProjection'
import { updateEntity } from './preparationWorld'
import { sweetHomeObjects } from './sweetHomeArsenal'
import { sweetHomeAvailable } from './sweetHomeContacts'
import { sweetHomeRightOnAlly } from './sweetHomeHands'
import { scoreJudgedImpact } from './towerJudging'
import type { FightImpact, FightSide, FightState } from './types'

/**
 * Terebellum's manual circuit around an ally: the right hand on the on-stage kameo
 * receives its wound, the left hand must hold the exit. The exit is the one real
 * object chosen for the left hand; without it, the wound ends in the left hand.
 * Nothing is stored: both contacts are read at the impact frame only, and a broken
 * receptacle is never replaced by another object.
 */
export interface AllyWound {
  /** State before the opposing strike reached the kameo. */
  before: FightState
  /** The same frame after the kameo took the strike (bodies back in their slots). */
  after: FightState
  /** The camp of the struck kameo and of its Terebellum leader. */
  side: FightSide
}

export function guardAllyWound(options: AllyWound): FightState {
  const { before, after, side } = options
  const damage = allyWound(options)
  if (damage <= 0 || !circuitHeld(before, side)) return after
  const slot = before.kameos![side]!
  // The ally is protected: its body is exactly what it was before the strike.
  const guarded: FightState = { ...after, kameos: { ...after.kameos, [side]: slot } }
  const exit = leftReceptacle(before, side)
  return exit
    ? intoObject({ state: guarded, before, exit: { ...exit, owner: side, damage } })
    : intoLeftHand({ state: guarded, before, side, stun: struckStun(after, side) })
}

function allyWound({ before, after, side }: AllyWound): number {
  const impact = after.impact
  if (!impact || impact.avoided || impact.damage <= 0) return 0
  if (impact.attacker !== otherSide(side) || impact.sequence === before.impact?.sequence) return 0
  return kameoHealth(before, side) > kameoHealth(after, side) ? impact.damage : 0
}

function kameoHealth(state: FightState, side: FightSide): number {
  return state.kameos?.[side]?.fighter.health ?? 0
}

/** The left hand takes the stun the strike gave the ally, as a body-to-body transfer does. */
function struckStun(state: FightState, side: FightSide): number {
  const kameo = state.kameos![side]!.fighter
  return Math.max(kameo.hitStun, kameo.blockStun)
}

function circuitHeld(state: FightState, side: FightSide): boolean {
  const owner = state[side]
  return (
    sweetHomeAvailable(state, side) &&
    attackPhase(owner) === 'active' &&
    owner.attack?.hatsuSource === 'terebellum' &&
    sweetHomeRightOnAlly(state, side)
  )
}

/** Only the object explicitly placed under the left hand, still real, whole and in reach. */
function leftReceptacle(state: FightState, side: FightSide) {
  const chosen = state[side].sweetHomeObject
  return chosen ? sweetHomeObjects(state, side).find((entry) => entry.id === chosen) : undefined
}

interface Exit {
  id: string
  health: number
  owner: FightSide
  damage: number
}

function intoObject(options: { state: FightState; before: FightState; exit: Exit }): FightState {
  const { state, before, exit } = options
  const impact = state.impact!
  return {
    ...updateEntity(state, exit.id, { health: Math.max(0, exit.health - exit.damage) }),
    score: before.score,
    knockdowns: before.knockdowns,
    impact: {
      ...impact,
      damage: 0,
      points: 0,
      knockdown: false,
      objectTransfer: { objectId: exit.id, owner: exit.owner, damage: exit.damage, ally: true },
    },
  }
}

interface LeftHand {
  state: FightState
  before: FightState
  side: FightSide
  stun: number
}

function intoLeftHand(options: LeftHand): FightState {
  const { state, before, side, stun } = options
  const impact = state.impact!
  const owner = wakeHanzoBody(before[side])
  const credit = otherSide(side)
  const points = scoreJudgedImpact({
    formatId: before.formatId,
    blocked: false,
    critical: impact.critical,
    knockdown: false,
  })
  const transfer: NonNullable<FightImpact['transfer']> = {
    owner: side,
    from: side,
    to: side,
    backlash: true,
    ally: true,
  }
  return {
    ...state,
    [side]: {
      ...owner,
      health: Math.max(0, owner.health - impact.damage),
      hitStun: Math.max(owner.hitStun, stun),
      blockStun: 0,
      pose: 'hit',
      blocking: false,
      attack: null,
      bufferedAttack: null,
      comboHits: owner.comboHits + 1,
      comboDamage: owner.comboDamage + impact.damage,
    },
    score: { ...before.score, [credit]: before.score[credit] + points },
    knockdowns: before.knockdowns,
    impact: {
      ...impact,
      blocked: false,
      parried: false,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      comboHits: owner.comboHits + 1,
      points,
      zone: 'hands',
      position: { x: owner.x, y: owner.y + 7 },
      transfer,
    },
  }
}
