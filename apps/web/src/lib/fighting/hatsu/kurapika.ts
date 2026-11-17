import { advanceDowsing } from '../dowsingAction'
import { implantJudgment } from '../judgmentAction'
import { forceZetsu } from '../nen'
import { activeHitbox, attackPhase, boxesOverlap } from '../frameData'
import { canonicalTechniqueAllowed } from '../techniqueContracts'
import {
  createKurapika,
  kurapikaEfficiency,
  kurapikaNenActive,
  STEAL_DRAIN_PER_SECOND,
  STEAL_TETHER_RANGE,
} from '../kurapika'
import { dolphinIsBusy, returnChainAbility, stealableChainMove } from '../kurapikaDolphin'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu, type HatsuImpactContext } from './contract'

export const kurapikaHatsu: FighterHatsu = {
  id: 'kurapika',
  onTrigger: unchangedTrigger,
  onImpact: chainImpact,
  onFrame: (state) => {
    let next = {
      ...state,
      player: tickForcedZetsu(state.player),
      opponent: tickForcedZetsu(state.opponent),
    }
    for (const side of ['player', 'opponent'] as const) {
      next = maintainJail(next, side)
      next = drainChain(next, side)
      next = healChain(next, side)
      next = interceptBullets(next, side)
      const held = next[side].kurapika?.held
      if (held?.used && !dolphinIsBusy(next, side, held)) next = returnChainAbility(next, side)
    }
    return advanceDowsing(next)
  },
}

function chainImpact({
  state,
  side,
  defenderSide,
  moveId,
  blocked,
}: HatsuImpactContext): FightState {
  if (blocked || !kurapikaNenActive(state[side])) return state
  const fighter = state[side]
  const target = state[defenderSide]
  if (moveId === 'kurapika:neutralSpecial') {
    if (!canonicalTechniqueAllowed(state, side, { id: moveId })) return state
    return {
      ...state,
      [defenderSide]: bind({ ...target, chainJail: { owner: side, x: target.x, y: target.y } }),
    }
  }
  if (canAttachSyringe(fighter, moveId))
    return { ...state, [defenderSide]: { ...target, drainingChain: { owner: side } } }
  if (moveId === 'kurapika:finisher' && fighter.kurapika?.emperorTime) return implantJudgment(state, side, defenderSide)
  return state
}

function bind(target: ArcadeFighter): ArcadeFighter {
  return {
    ...forceZetsu(target),
    x: target.chainJail!.x,
    y: target.chainJail!.y,
    velocityY: 0,
    blocking: false,
    attack: null,
    bufferedAttack: null,
    motion: undefined,
    hatsuEffects: {
      ...target.hatsuEffects,
      forcedZetsuFrames: Math.max(2, target.hatsuEffects.forcedZetsuFrames),
    },
  }
}

function maintainJail(state: FightState, side: FightSide): FightState {
  const target = state[side]
  if (!target.chainJail) return state
  if (!kurapikaNenActive(state[target.chainJail.owner]))
    return { ...state, [side]: { ...target, chainJail: undefined } }
  return { ...state, [side]: bind(target) }
}

function drainChain(state: FightState, side: FightSide): FightState {
  const target = state[side]
  const ownerSide = target.drainingChain?.owner
  if (!ownerSide) return state
  const owner = state[ownerSide]
  if (!drainConnectionValid(owner, target))
    return { ...state, [side]: { ...target, drainingChain: undefined } }
  const aura = Math.max(0, target.aura - STEAL_DRAIN_PER_SECOND / 60)
  if (aura > 0) return { ...state, [side]: { ...target, aura } }
  const moveId = stealableChainMove(target)
  const drained = { ...forceZetsu(target), aura: 0, auraExhausted: true, drainingChain: undefined }
  if (!moveId) return { ...state, [side]: drained }
  return {
    ...state,
    [side]: { ...drained, stolenChainAbility: { owner: ownerSide, moveId } },
    [ownerSide]: {
      ...owner,
      kurapika: {
        ...(owner.kurapika ?? createKurapika()),
        held: {
          victim: side,
          source: target.id,
          moveId,
          loaded: false,
          used: false,
          sustainedKeys: [],
        },
      },
    },
  }
}

function healChain(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (
    fighter.attack?.moveId !== 'kurapika:downSpecial' ||
    fighter.attack.impacted ||
    attackPhase(fighter) !== 'active' ||
    !kurapikaNenActive(fighter)
  )
    return state
  return {
    ...state,
    [side]: {
      ...fighter,
      health: Math.min(
        fighter.maxHealth,
        fighter.health + 30 * kurapikaEfficiency(fighter, 'enhancer'),
      ),
      attack: { ...fighter.attack, impacted: true },
    },
  }
}

/** Dowsing Chain catches physical bullets while its directed whip is active. */
function interceptBullets(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (fighter.attack?.moveId !== 'kurapika:forwardSpecial' || !kurapikaNenActive(fighter))
    return state
  const box = activeHitbox(fighter)
  if (!box) return state
  return {
    ...state,
    projectiles: state.projectiles.filter(
      (projectile) =>
        projectile.owner === side ||
        projectile.matter !== 'object' ||
        projectile.shape !== 'bullet' ||
        !boxesOverlap(box, {
          left: projectile.x - projectile.width,
          right: projectile.x + projectile.width,
          bottom: projectile.y - projectile.height,
          top: projectile.y + projectile.height,
        }),
    ),
  }
}

/** Other roster Hatsu still use the shared timed forced-Zetsu counter. */
function tickForcedZetsu(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.forcedZetsuFrames
  if (frames <= 0) return fighter
  return {
    ...forceZetsu(fighter),
    hatsuEffects: { ...fighter.hatsuEffects, forcedZetsuFrames: frames - 1 },
  }
}

function canAttachSyringe(fighter: ArcadeFighter, moveId?: string): boolean {
  return moveId === 'kurapika:backSpecial' && !fighter.kurapika?.held
}

function drainConnectionValid(owner: ArcadeFighter, target: ArcadeFighter): boolean {
  return (
    kurapikaNenActive(owner) &&
    owner.hitStun === 0 &&
    owner.knockdownFrames === 0 &&
    !owner.kurapika?.held &&
    Math.hypot(target.x - owner.x, target.y - owner.y) <= STEAL_TETHER_RANGE
  )
}
