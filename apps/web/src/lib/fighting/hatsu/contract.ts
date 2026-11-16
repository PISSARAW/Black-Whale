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

/** A direct hit has just killed `victimSide`; the attacker on `killerSide` landed it. */
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
  /** The canon Hatsu cannot act in a duel: the fighter plays on martial skill and basic Nen. */
  martialOnly?: true
  /** Still a real Hatsu for Steal Chain, despite lacking a target in this duel. */
  stealableOutsideDuel?: OutsideDuelAbility
  /** Conditional Nen that wakes only when its owner is killed by a direct hit. */
  onDeath?: (context: HatsuDeathContext) => FightState
}

export const unchangedTrigger = ({ state }: HatsuTriggerContext): FightState => state
export const unchangedImpact = ({ state }: HatsuImpactContext): FightState => state
export const unchangedFrame = (state: FightState): FightState => state

/**
 * A fighter whose only canon Hatsu needs a preparation no duel allows (days of
 * co-presence, a courier flock, a post-mortem sacrifice, a surveillance familiar).
 * Inventing a combat effect for it would contradict the manga, so none is applied.
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
