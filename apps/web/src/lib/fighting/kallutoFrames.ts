import { attackPhase } from './frameData'
import {
  paperAvailable,
  paperCommand,
  paperCommandReady,
  paperState,
  hasPlantedPaper,
} from './kallutoPaper'
import { launchKallutoPaper } from './kallutoFlight'
import { recordDolphinEffects } from './kurapikaDolphin'
import type { FightSide, FightState } from './types'

export function advanceKallutoPaper(state: FightState): FightState {
  return stepPaper(stepPaper(state, 'player'), 'opponent')
}
function reconcileDoll(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const memory = paperState(fighter)
  if (!memory.doll || (paperAvailable(fighter) && hasPlantedPaper(state, side))) return state
  return { ...state, [side]: { ...fighter, kallutoPaper: { ...memory, doll: undefined } } }
}
function stepPaper(state: FightState, side: FightSide): FightState {
  state = reconcileDoll(state, side)
  const fighter = state[side]
  const attack = fighter.attack
  if (!attack) return state
  const ranged = fighter.id === 'kalluto' && attack.kind === 'ranged'
  if (!ranged && (attack.kind !== 'special' || !paperCommand(fighter))) return state
  if (!paperAvailable(fighter))
    return { ...state, [side]: { ...fighter, attack: null, bufferedAttack: null } }
  if (attack.projectileSpawned || attack.impacted || attackPhase(fighter) !== 'active') return state
  return emitPaper(state, side, ranged)
}
function emitPaper(state: FightState, side: FightSide, ranged: boolean): FightState {
  const fighter = state[side]
  const command = ranged ? 'plant' : paperCommand(fighter)!
  if (!paperCommandReady(state, side, command)) return state
  if (command !== 'doll')
    return recordDolphinEffects(state, launchKallutoPaper(state, side, command), side)
  const target = side === 'player' ? 'opponent' : 'player'
  const next = {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, impacted: true },
      kallutoPaper: { ...paperState(fighter), doll: { target, createdAt: state.frame } },
    },
  }
  return recordDolphinEffects(state, next, side)
}
