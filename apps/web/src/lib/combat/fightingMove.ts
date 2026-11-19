import { moveForSlot } from '../fighting/movesets'
import type { FighterMove } from '../fighting/movesetTypes'
import type { FightNenZone } from '../fighting/types'
import { CHAIN_BUFFER, chainAccepts, comboHistory } from './moveChain'
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

/** Named specials whose canonical Arena rule already exists bypass the generic strike projection. */
export function fightingHatsuAction(
  action: FightingMoveAction,
): Extract<CombatAction, { type: 'HATSU' }> | null {
  if (action.fighterId !== 'hisoka' || action.slot !== 'neutralSpecial') return null
  const move = moveForSlot(action.fighterId, action.slot)
  return {
    type: 'HATSU',
    side: action.side,
    effect: 'bind',
    zone: 'arms',
    hatsuId: 'bungee-gum',
    cost: move?.auraCost,
  }
}

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
  const chained = chainAccepts(fighter, move, state.clock)
  if (!chained && (fighter.cooldown > 0 || fighter.intent))
    return buffer ? bufferMove(state, action) : state
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

function canPerform(state: CombatState, side: CombatSide, move: FighterMove): boolean {
  const fighter = state[side]
  if (fighter.condition !== 'ready' || fighter.ko || fighter.aura < move.auraCost) return false
  return finisherOpen(state, side, move)
}

function fightingIntent(options: {
  fighter: FighterState
  move: FighterMove
  targetAt: FightingMoveAction['targetAt']
  chained: boolean
}): AttackIntent {
  const { fighter, move, targetAt, chained } = options
  return {
    zone: arenaZone(move.tuning.targetZone),
    remaining: move.tuning.startup / 60,
    targetAt,
    technique: move.kind === 'special' ? 'hatsu' : 'strike',
    power: 0.45 + move.tuning.damage / 15,
    range: Math.min(8, Math.max(1.6, move.tuning.reach / 5)),
    recovery: (move.tuning.active + move.tuning.recovery) / 60,
    moveId: move.id,
    combo: comboHistory(fighter, move, chained),
  }
}

/** Releases the press kept while the previous move was running, once that move has landed. */
export function releaseBufferedMove(state: CombatState, side: CombatSide): CombatState {
  const buffered = state[side].buffered
  if (!buffered) return state
  const cleared = { ...state, [side]: { ...state[side], buffered: null } }
  if (buffered.until < state.clock) return cleared
  const { fighterId, slot, targetAt } = buffered
  return prepareFightingMove(
    cleared,
    { type: 'FIGHTING_MOVE', side, fighterId, slot, targetAt },
    { buffer: false },
  )
}

function bufferMove(state: CombatState, action: FightingMoveAction): CombatState {
  const { side, fighterId, slot, targetAt } = action
  const buffered = { fighterId, slot, targetAt, until: state.clock + CHAIN_BUFFER }
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
