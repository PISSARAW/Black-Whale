import { halkenburgMode } from '../halkenburgSoulTypes'
import { voluntaryNenAvailable } from '../nenAccess'
import { chainAbilitySealed } from '../kurapika'
import { chrolloHasActivePage } from '../chrolloBook'
import { liveEntity, readyCohort, updateEntity } from '../preparationWorld'
import { COHORT_WILL_FRAMES } from '../preparationTuning'
import { replaceHalkenburgBody } from '../halkenburgTransfer'
import { launchHalkenburgArrow, resolveHalkenburgArrow } from '../halkenburgArrow'
import type { ProjectileHit } from '../projectiles'
import type { ArcadeFighter, FightState } from '../types'
import type { FighterHatsu, HatsuImpactContext, HatsuTriggerContext } from './contract'

/** Eight seconds for the cohort's shared will to gather behind the bow. */
export { COHORT_WILL_FRAMES } from '../preparationTuning'
const POSSESSION_FRAMES = 120
/** Health price is duel tuning; canonical risk comes from the transfer itself. */
const SHOT_LIFE_COST = 8

/**
 * The marked, consenting cohort remains mandatory. The requested roster variant
 * replaces Halkenburg's own playable body, instead of stunning the duel opponent.
 */
export const halkenburgHatsu: FighterHatsu = {
  id: 'halkenburg',
  onTrigger: nock,
  onImpact: (context) =>
    halkenburgMode(context.state, context.side) === 'souls' ? context.state : possess(context),
  onFrame: (state) => {
    const launched = launchHalkenburgArrow(launchHalkenburgArrow(state, 'player'), 'opponent')
    return { ...launched, player: tick(launched, 'player'), opponent: tick(launched, 'opponent') }
  },
}

function nock({ state, side }: HatsuTriggerContext): FightState {
  const archer = state[side]
  const supporters = readyCohort(state, side)
  const ready = supporters.length > 0 && archer.hatsuEffects.cohortWillFrames >= COHORT_WILL_FRAMES
  const rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0
  const participants = supporters.map((entry) => entry.id)
  if (archer.id === 'halkenburg' && !archer.nenOwner) participants.push(`self:${side}`)
  const participant = ready ? participants[rng % participants.length] : undefined
  return {
    ...state,
    rng: ready ? rng : state.rng,
    [side]: {
      ...archer,
      halkenburgSupporter: participant,
      health:
        ready && halkenburgMode(state, side) === 'roster'
          ? Math.max(1, archer.health - SHOT_LIFE_COST)
          : archer.health,
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
  const supporter = state.battlefield?.entities.find(
    (entry) => entry.id === archer.halkenburgSupporter,
  )
  const self = archer.halkenburgSupporter === `self:${side}`
  if (
    !archer.hatsuEffects.arrowNocked ||
    (!self && (!supporter || !liveEntity(supporter) || !supporter.consenting))
  )
    return state
  const target = state[defenderSide]
  const occupied = supporter ? updateEntity(state, supporter.id, { sleepingFrames: 999999 }) : state
  const struck = {
    ...occupied,
    [side]: { ...archer, hatsuEffects: { ...archer.hatsuEffects, arrowNocked: 0 } },
  }
  if (archer.id === 'halkenburg' && !archer.nenOwner) return replaceHalkenburgBody(struck, side)
  return {
    ...struck,
    [defenderSide]: {
      ...target,
      hatsuEffects: { ...target.hatsuEffects, possessedFrames: POSSESSION_FRAMES },
    },
  }
}

function tick(state: FightState, side: 'player' | 'opponent'): ArcadeFighter {
  const fighter = state[side]
  const effects = fighter.hatsuEffects
  const gathers =
    ownsBow(fighter) &&
    voluntaryNenAvailable(fighter, { requireReserve: true }) &&
    !chainAbilitySealed(fighter, 'halkenburg:neutralSpecial') &&
    readyCohort(state, side).length > 0
  const will = gathers ? Math.min(COHORT_WILL_FRAMES, effects.cohortWillFrames + 1) : 0
  const possessed = effects.possessedFrames
  const protection = groupProtection(fighter, gathers)
  if (tickUnchanged(fighter, { will, possessed, protection })) return fighter
  return {
    ...fighter,
    halkenburgGroupProtection: protection,
    hitStun: possessed > 0 ? Math.max(fighter.hitStun, 2) : fighter.hitStun,
    hatsuEffects: {
      ...effects,
      cohortWillFrames: will,
      possessedFrames: Math.max(0, possessed - 1),
    },
  }
}

function groupProtection(fighter: ArcadeFighter, gathers: boolean): boolean {
  return (
    gathers &&
    Boolean(fighter.hatsuEffects.arrowNocked) &&
    fighter.attack?.hatsuSource === 'halkenburg'
  )
}
function tickUnchanged(
  fighter: ArcadeFighter,
  next: { will: number; possessed: number; protection: boolean },
): boolean {
  return (
    next.will === fighter.hatsuEffects.cohortWillFrames &&
    next.possessed <= 0 &&
    fighter.halkenburgGroupProtection === next.protection
  )
}
export function settleHalkenburgArrow(state: FightState, hit: ProjectileHit): FightState {
  return resolveHalkenburgArrow(state, hit, (current, side, defenderSide) =>
    possess({
      state: current,
      side,
      defenderSide,
      source: 'halkenburg',
      blocked: false,
      concealed: false,
    }),
  )
}

function ownsBow(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'halkenburg') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'halkenburg')
  return fighter.kurapika?.held?.loaded === true && fighter.kurapika.held.source === 'halkenburg'
}
