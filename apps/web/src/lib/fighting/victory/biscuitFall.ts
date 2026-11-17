import type { ArcadeFighter } from '../types'
import type { VictoryContext } from './types'
import { BISCUIT_IMPACT } from './biscuitForms'
import { nativeVictoryFall, victoryFallTrajectory } from './nativeFall'

export const BISCUIT_LANDING = BISCUIT_IMPACT + 27
export const biscuitFallTrajectory = (source: ArcadeFighter) =>
  victoryFallTrajectory(source, { velocityY: 38, velocityX: 45 })
export const biscuitVictoryFall = (context: VictoryContext) =>
  nativeVictoryFall(context, { start: BISCUIT_IMPACT, velocityY: 38, velocityX: 45 })
