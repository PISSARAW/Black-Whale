import { bonolenovHasSpear } from './bonolenovArmedProfile'
import { battleCanStart } from './battleCantabileAction'
import { battleCommand, battlePreparing, battleTechniqueAvailable } from './battleCantabileRules'
import { BATTLE_MOVES } from './battleCantabileTypes'
import type { FighterMove } from './movesetTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function bonolenovMoveAllowed(
  state: FightState,
  side: FightSide,
  move: FighterMove,
): boolean | null {
  const command = battleCommand(state[side], move.kind, move.id)
  return command ? battleCanStart(state, side, command) : null
}

export function bonolenovResources(fighter: ArcadeFighter, move: FighterMove): boolean | null {
  if (battlePreparing(fighter)) return false
  const command = battleCommand(fighter, move.kind, move.id)
  if (!command) return null
  if (command === BATTLE_MOVES.stop) return Boolean(fighter.battleCantabile)
  if (!battleTechniqueAvailable(fighter, command)) return false
  if (command === BATTLE_MOVES.spear)
    return bonolenovHasSpear(fighter) && fighter.aura >= move.auraCost
  return fighter.aura >= move.auraCost
}

export function battleUtilityAttack(fighter: ArcadeFighter): boolean {
  return fighter.attack?.hatsuSource === 'bonolenov' && fighter.attack.moveId !== BATTLE_MOVES.spear
}

export { tuneBonolenovMoveset } from './bonolenovMovesetTuning'
