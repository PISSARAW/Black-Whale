import { moveForSlot } from '../fighting/movesets'
import type { FightNenZone } from '../fighting/types'
import type { BodyZone, CombatAction, CombatState } from './types'

type FightingMoveAction = Extract<CombatAction, { type: 'FIGHTING_MOVE' }>

/**
 * Projects authored Fighting frame data onto the attacker's local 3D combat axis.
 * Arena keeps ownership of locomotion and walls; Fighting supplies the move identity,
 * startup, reach, recovery, aura cost and relative strength.
 */
export function prepareFightingMove(state: CombatState, action: FightingMoveAction): CombatState {
  const fighter = state[action.side]
  const move = moveForSlot(action.fighterId, action.slot)
  if (
    !move ||
    fighter.condition !== 'ready' ||
    fighter.cooldown > 0 ||
    fighter.ko ||
    fighter.intent ||
    fighter.aura < move.auraCost
  )
    return state

  const intent = {
    zone: arenaZone(move.tuning.targetZone),
    remaining: move.tuning.startup / 60,
    targetAt: action.targetAt,
    technique: move.kind === 'special' ? ('hatsu' as const) : ('strike' as const),
    power: 0.45 + move.tuning.damage / 15,
    range: Math.min(8, Math.max(1.6, move.tuning.reach / 5)),
    recovery: (move.tuning.active + move.tuning.recovery) / 60,
  }
  return {
    ...state,
    [action.side]: {
      ...fighter,
      aura: fighter.aura - move.auraCost,
      intent,
      movement: [0, 0],
    },
  }
}

function arenaZone(zone: FightNenZone): BodyZone {
  if (zone === 'hands') return 'arms'
  if (zone === 'feet') return 'legs'
  return zone
}
