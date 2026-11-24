import { moveForSlot } from '../fighting/movesets'
import type { FighterMove } from '../fighting/movesetTypes'
import type { FightNenZone } from '../fighting/types'
import { CHAIN_BUFFER, LANE_METRE, chainAccepts, comboHistory } from './moveChain'
import { usesClashNen } from './clashNen'
import { reactEnvironment } from './environment'
import { fightingHatsuAction } from './fightingHatsu'
import { isBlinkyUtilityMove, resolveFightingBlinky } from './fightingBlinky'
import { isSkillHunterMove, resolveFightingSkillHunter } from './fightingSkillHunter'
import { castHatsu, prepareHatsu } from './hatsuCast'
import {
  otherSide,
  type AttackIntent,
  type BodyZone,
  type CombatAction,
  type CombatSide,
  type CombatState,
  type FighterState,
} from './types'

type FightingMoveAction = Extract<CombatAction, { type: 'FIGHTING_MOVE' }>

/**
 * Projects authored Fighting frame data onto the attacker's local 3D combat axis.
 * Arena keeps ownership of locomotion and walls; Fighting supplies the move identity,
 * startup, reach, recovery, aura cost, relative strength and cancel routes. A move
 * pressed while the previous one is still running is buffered, like in Clash.
 */
export function prepareFightingMove(
  state: CombatState,
  action: FightingMoveAction,
  { buffer = true }: { buffer?: boolean } = {},
): CombatState {
  const fighter = state[action.side]
  const move = moveForSlot(action.fighterId, action.slot)
  if (!move || !canPerform(state, action.side, move)) return state
  if (state.hitstop > 0) return buffer ? bufferFightingMove(state, action) : state
  const chained = chainAccepts(fighter, move, state.clock)
  if (moveIsBusy(fighter, chained)) return buffer ? bufferFightingMove(state, action) : state
  return {
    ...state,
    [action.side]: {
      ...fighter,
      aura: fighter.aura - move.auraCost,
      intent: fightingIntent({ fighter, move, targetAt: action.targetAt, chained }),
      movement: [0, 0],
      cooldown: chained ? 0 : fighter.cooldown,
      chain: null,
      buffered: null,
    },
  }
}

function moveIsBusy(fighter: FighterState, chained: boolean): boolean {
  return !chained && Boolean(fighter.cooldown > 0 || fighter.intent)
}

function canPerform(state: CombatState, side: CombatSide, move: FighterMove): boolean {
  const fighter = state[side]
  if (fighter.condition !== 'ready' || fighter.aura < move.auraCost) return false
  const airMove = move.slot === 'airLight' || move.slot === 'airHeavy'
  if (airMove !== fighter.height > 0) return false
  // Under Clash rules a held Ko waits for this very move.
  if (fighter.ko && !usesClashNen(state)) return false
  return finisherOpen(state, side, move)
}

function fightingIntent(options: {
  fighter: FighterState
  move: FighterMove
  targetAt: FightingMoveAction['targetAt']
  chained: boolean
}): AttackIntent {
  const { fighter, move, targetAt, chained } = options
  const duration = Math.max(1, move.tuning.startup) / 60
  return {
    zone: arenaZone(move.tuning.targetZone),
    remaining: duration,
    targetAt,
    technique: move.kind === 'special' ? 'hatsu' : 'strike',
    power: 0.45 + move.tuning.damage / 15,
    range: Math.min(8, Math.max(1.6, move.tuning.reach / 5)),
    recovery: (move.tuning.active + move.tuning.recovery) / 60,
    hitstop: move.tuning.hitstop / 60,
    moveId: move.id,
    combo: comboHistory(fighter, move, chained),
    scored: chained ? (fighter.chain?.points ?? 0) : 0,
    drive: {
      total: move.tuning.lunge * LANE_METRE,
      applied: 0,
      duration,
      direction: directionTo(fighter.position, targetAt),
    },
  }
}

function directionTo(
  from: FighterState['position'],
  to: FighterState['position'],
): [number, number] {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const length = Math.hypot(dx, dz)
  return length === 0 ? [0, 0] : [dx / length, dz / length]
}

/** Releases the press kept while the previous move was running, once that move has landed. */
export function releaseBufferedMove(state: CombatState, side: CombatSide): CombatState {
  if (state.hitstop > 0) return state
  const buffered = state[side].buffered
  if (!buffered) return state
  const cleared = { ...state, [side]: { ...state[side], buffered: null } }
  if (buffered.until < state.clock) return cleared
  const { fighterId, slot, targetAt, targetObject } = buffered
  const action: FightingMoveAction = {
    type: 'FIGHTING_MOVE',
    side,
    fighterId,
    slot,
    targetAt,
    targetObject,
  }
  if (isBlinkyUtilityMove(action)) return resolveFightingBlinky(cleared, action)
  if (isSkillHunterMove(action)) return resolveFightingSkillHunter(cleared, action)
  const hatsu = fightingHatsuAction(cleared, action)
  if (!hatsu) return prepareFightingMove(cleared, action, { buffer: false })
  if (hatsu.type === 'PREPARE_HATSU') return prepareHatsu(cleared, hatsu.side, hatsu.hatsuId)
  const cast = castHatsu(cleared, hatsu)
  return cast === cleared ? cleared : reactEnvironment(cast, hatsu)
}

export function bufferFightingMove(state: CombatState, action: FightingMoveAction): CombatState {
  const { side, fighterId, slot, targetAt, targetObject } = action
  const buffered = { fighterId, slot, targetAt, targetObject, until: state.clock + CHAIN_BUFFER }
  return { ...state, [side]: { ...state[side], buffered } }
}

/** Arena's finisher rule: a combo ender, only against a body that is staggered or down. */
function finisherOpen(state: CombatState, side: CombatSide, move: FighterMove): boolean {
  if (move.category !== 'finisher') return true
  const rival = state[otherSide(side)].condition
  return rival === 'staggered' || rival === 'down'
}

function arenaZone(zone: FightNenZone): BodyZone {
  if (zone === 'hands') return 'arms'
  if (zone === 'feet') return 'legs'
  return zone
}
