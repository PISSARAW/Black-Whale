import type { ArcadeFighter, FightSide, FightState, FighterId } from '../types'
import type { OutsideDuelAbility } from '../outsideDuelAbility'

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

/** An attributed death: the common verdict identifies a living killer before post-mortem Nen. */
export interface HatsuDeathContext {
  state: FightState
  victimSide: FightSide
  killerSide: FightSide
}

export interface FighterHatsu {
  id: FighterId
  onTrigger: (context: HatsuTriggerContext) => FightState
  onImpact: (context: HatsuImpactContext) => FightState
  onFrame: (state: FightState) => FightState
  sourceFor?: (fighter: ArcadeFighter, moveId?: string) => FighterId | null
  /** No confirmed personal Hatsu can act in this duel: the fighter plays on martial skill and basic Nen. */
  martialOnly?: true
  /** Still a real Hatsu for Steal Chain, despite lacking a target in this duel. */
  stealableOutsideDuel?: OutsideDuelAbility
  /** Conditional Nen that wakes only after an attributed death, never a nonlethal verdict. */
  onDeath?: (context: HatsuDeathContext) => FightState
}

export const unchangedTrigger = ({ state }: HatsuTriggerContext): FightState => state
export const unchangedImpact = ({ state }: HatsuImpactContext): FightState => state
export const unchangedFrame = (state: FightState): FightState => state

/**
 * A fighter whose personal Hatsu is unknown or lacks a suitable target or setup here.
 * Combat moves stay martial; stealableOutsideDuel may still declare the actual Hatsu.
 */
export function martialOnlyHatsu(id: FighterId): FighterHatsu {
  return {
    id,
    onTrigger: unchangedTrigger,
    onImpact: unchangedImpact,
    onFrame: unchangedFrame,
    martialOnly: true,
  }
}
