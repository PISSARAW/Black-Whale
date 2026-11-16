import type { ArcadeFighter, FightState } from '../types'
import type { FighterHatsu, HatsuImpactContext, HatsuTriggerContext } from './contract'

/** Eight seconds for the cohort's shared will to gather behind the bow. */
export const COHORT_WILL_FRAMES = 480
/** How long the supporter occupies the target's body. */
const POSSESSION_FRAMES = 120
/** Halkenburg risks his own life at every shot (ch. 400–411). */
const SHOT_LIFE_COST = 8

/**
 * The Boy Who Shoots the Arrow: Grimmel the Dissonance — Halkenburg.
 *
 * Canon: the arrow does not wound, it pierces every defence and swaps the
 * target's soul with a fin bearer who shares Halkenburg's will, at a risk to his
 * life. A duel has no cohort on stage, so its will is abstracted as a gauge that
 * fills over eight seconds (gameplay abstraction). Until it is full, his
 * specials are ordinary strikes. Once nocked, the arrow lands even through a
 * guard and hands the body to a supporter: the target stops acting.
 */
export const halkenburgHatsu: FighterHatsu = {
  id: 'halkenburg',
  onTrigger: nock,
  onImpact: possess,
  onFrame: (state) => ({
    ...state,
    player: tick(state.player),
    opponent: tick(state.opponent),
  }),
}

function nock({ state, side }: HatsuTriggerContext): FightState {
  const archer = state[side]
  const ready = archer.hatsuEffects.cohortWillFrames >= COHORT_WILL_FRAMES
  return {
    ...state,
    [side]: {
      ...archer,
      health: ready ? Math.max(1, archer.health - SHOT_LIFE_COST) : archer.health,
      hatsuEffects: {
        ...archer.hatsuEffects,
        arrowNocked: ready ? 1 : 0,
        cohortWillFrames: ready ? 0 : archer.hatsuEffects.cohortWillFrames,
      },
    },
  }
}

/** The arrow pierces every defence, so a guarded hit still lands it. */
function possess({ state, side, defenderSide }: HatsuImpactContext): FightState {
  const archer = state[side]
  if (!archer.hatsuEffects.arrowNocked) return state
  const target = state[defenderSide]
  return {
    ...state,
    [side]: { ...archer, hatsuEffects: { ...archer.hatsuEffects, arrowNocked: 0 } },
    [defenderSide]: {
      ...target,
      hatsuEffects: { ...target.hatsuEffects, possessedFrames: POSSESSION_FRAMES },
    },
  }
}

function tick(fighter: ArcadeFighter): ArcadeFighter {
  const effects = fighter.hatsuEffects
  const gathers = fighter.id === 'halkenburg' && effects.hatsuStolen === 0
  const will = gathers ? Math.min(COHORT_WILL_FRAMES, effects.cohortWillFrames + 1) : 0
  const possessed = effects.possessedFrames
  if (will === effects.cohortWillFrames && possessed <= 0) return fighter
  return {
    ...fighter,
    hitStun: possessed > 0 ? Math.max(fighter.hitStun, 2) : fighter.hitStun,
    hatsuEffects: {
      ...effects,
      cohortWillFrames: will,
      possessedFrames: Math.max(0, possessed - 1),
    },
  }
}
