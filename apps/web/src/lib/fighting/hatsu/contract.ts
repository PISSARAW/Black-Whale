import type { ArcadeFighter, FightSide, FightState, FighterId } from '../types'

export interface HatsuTriggerContext {
  state: FightState
  side: FightSide
  source: FighterId
}

export interface HatsuImpactContext extends HatsuTriggerContext {
  defenderSide: FightSide
  moveId?: string
  blocked: boolean
  concealed: boolean
}

export interface FighterHatsu {
  id: FighterId
  onTrigger: (context: HatsuTriggerContext) => FightState
  onImpact: (context: HatsuImpactContext) => FightState
  onFrame: (state: FightState) => FightState
  sourceFor?: (fighter: ArcadeFighter) => FighterId
}

export const unchangedTrigger = ({ state }: HatsuTriggerContext): FightState => state
export const unchangedImpact = ({ state }: HatsuImpactContext): FightState => state
export const unchangedFrame = (state: FightState): FightState => state
