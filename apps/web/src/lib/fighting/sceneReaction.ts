import { fightMove } from './fightMoves'
import {
  impactReaction,
  isThrowTech,
  knockdownMotion,
  throwTechMotion,
  wakeupMotion,
} from './reactionMotion'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function fightSceneReaction(options: {
  fighter: ArcadeFighter
  state: FightState
  progress: number
  side: FightSide
}) {
  const { fighter, state, progress, side } = options
  let motion = fightMove(fighter, progress)
  if (fighter.pose === 'hit' && state.impact?.attacker !== side)
    motion = impactReaction(state.impact?.zone ?? 'torso', progress)
  if (fighter.pose === 'down') motion = knockdownMotion(progress)
  if (fighter.pose === 'wakeup') motion = wakeupMotion(progress)
  if (isThrowTech(state)) motion = throwTechMotion(side)
  return motion
}
