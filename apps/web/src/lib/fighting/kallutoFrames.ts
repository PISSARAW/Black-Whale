import { attackPhase } from './frameData'
import { advancePaperScatters } from './kallutoScatterFrame'
import { paperCommand, paperCommandReady } from './kallutoPaper'
import { paperAbilityAvailable } from './kallutoAccess'
import { makePaperDoll } from './kallutoSurveillance'
import { launchKallutoPaper } from './kallutoFlight'
import { recordDolphinEffects } from './kurapikaDolphin'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { PaperCommand } from './kallutoPaperTypes'

export function advanceKallutoPaper(state: FightState): FightState {
  return stepPaper(stepPaper(advancePaperScatters(state), 'player'), 'opponent')
}
function stepPaper(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const attack = fighter.attack
  if (!attack) return state
  const command = attackPaperCommand(fighter)
  if (!command) return state
  if (!paperAbilityAvailable(fighter, command))
    return { ...state, [side]: { ...fighter, attack: null, bufferedAttack: null } }
  if (attack.projectileSpawned || attack.impacted || attackPhase(fighter) !== 'active') return state
  return emitPaper(state, side, command)
}
function attackPaperCommand(actor: ArcadeFighter): PaperCommand | null {
  if (actor.id === 'kalluto' && actor.attack?.kind === 'ranged') return 'plant'
  return actor.attack?.kind === 'special' ? paperCommand(actor) : null
}
function emitPaper(state: FightState, side: FightSide, command: PaperCommand): FightState {
  const fighter = state[side]
  if (!paperCommandReady(state, side, command)) return state
  if (command !== 'doll')
    return recordDolphinEffects(state, launchKallutoPaper(state, side, command), side)
  const receiver = makePaperDoll(state, side)
  const next = {
    ...state,
    [side]: {
      ...receiver,
      attack: { ...fighter.attack!, impacted: true },
    },
  }
  return recordDolphinEffects(state, next, side)
}
