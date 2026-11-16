import type { ArcadeFighter, FightProjectile, FightSide, FightState } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

/** How long Blinky keeps its nozzle open after Shizuku calls it. */
const BLINKY_FRAMES = 30
/** Reach of the nozzle in front of Shizuku, in lane units. */
const BLINKY_RANGE = 14

/**
 * Blinky — Shizuku's conjured vacuum (Yorknew City).
 *
 * Blinky swallows any non-living matter Shizuku names, except Nen constructs and
 * anything she considers alive. A living opponent is therefore never drained:
 * the duel use is to swallow the real objects thrown at her (cards, bullets,
 * needles, stones) while the nozzle is open. Emitted or conjured aura passes.
 */
export const shizukuHatsu: FighterHatsu = {
  id: 'shizuku',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, blinkyFrames: BLINKY_FRAMES },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => swallow(swallow(state, 'player'), 'opponent'),
}

function swallow(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const frames = fighter.hatsuEffects.blinkyFrames
  if (frames <= 0) return state
  return {
    ...state,
    projectiles: state.projectiles.filter((projectile) => !swallowable(fighter, side, projectile)),
    [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, blinkyFrames: frames - 1 } },
  }
}

function swallowable(
  fighter: ArcadeFighter,
  side: FightSide,
  projectile: FightProjectile,
): boolean {
  return (
    projectile.owner !== side &&
    projectile.matter === 'object' &&
    Math.abs(projectile.x - fighter.x) <= BLINKY_RANGE
  )
}
