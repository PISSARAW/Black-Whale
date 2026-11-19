import { attackPhase } from './frameData'
import { seesCombatBody } from './fightCounterplay'
import type { ArcadeFighter, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    recoveryWatch?: { move: string; attackFrame: number; frames: number }
  }
}
/** Both seats must actually observe a recovery; actor ticks stop during hitstop. */
export function withRecoveryObservations(state: FightState): FightState {
  return {
    ...state,
    player: observe(state.player, state.opponent),
    opponent: observe(state.opponent, state.player),
  }
}
function observe(fighter: ArcadeFighter, target: ArcadeFighter): ArcadeFighter {
  const attack = target.attack
  if (!attack || attackPhase(target) !== 'recovery' || !seesCombatBody(fighter))
    return fighter.recoveryWatch ? { ...fighter, recoveryWatch: undefined } : fighter
  const previous = fighter.recoveryWatch
  const continuing =
    previous &&
    previous.move === (attack.moveId ?? attack.kind) &&
    previous.attackFrame <= attack.frame
  return {
    ...fighter,
    recoveryWatch: {
      move: attack.moveId ?? attack.kind,
      attackFrame: attack.frame,
      frames: continuing ? previous.frames + 1 : 1,
    },
  }
}
