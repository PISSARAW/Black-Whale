import { canUseHatsu } from '@black-whale/nen-engine'
import type { ArcadeFighter } from './types'

export type NenAccessFailure = 'dead' | 'exhausted' | 'zetsu' | 'sealed' | 'stolen'
interface NenAccessOptions {
  allowVoluntaryZetsu?: boolean
  requireReserve?: boolean
  /** A stolen personal Hatsu does not remove basic Ten, Gyo, En or an independent loan. */
  requireHatsu?: boolean
}

/** Access to living, voluntary Nen. Post-mortem effects have their own contract. */
export function nenAccessFailure(
  fighter: ArcadeFighter,
  options: NenAccessOptions = {},
): NenAccessFailure | null {
  if (fighter.health <= 0) return 'dead'
  if (reserveUnavailable(fighter, options)) return 'exhausted'
  if (zetsuBlocks(fighter, options)) return 'zetsu'
  if (onSealed(fighter)) return 'sealed'
  return options.requireHatsu !== false && fighter.hatsuEffects.hatsuStolen > 0 ? 'stolen' : null
}

export function voluntaryNenAvailable(
  fighter: ArcadeFighter,
  options: NenAccessOptions = {},
): boolean {
  return nenAccessFailure(fighter, options) === null
}

function onSealed(fighter: ArcadeFighter): boolean {
  return fighter.nen.on || (fighter.on?.sealFrames ?? 0) > 0
}

function reserveUnavailable(fighter: ArcadeFighter, options: NenAccessOptions): boolean {
  return fighter.auraExhausted || (options.requireReserve === true && fighter.aura <= 0)
}

function zetsuBlocks(fighter: ArcadeFighter, options: NenAccessOptions): boolean {
  return forcedZetsu(fighter) || (!options.allowVoluntaryZetsu && !canUseHatsu(fighter.nen))
}

function forcedZetsu(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.chainJail ||
    fighter.moonlightZetsu ||
    fighter.hatsuEffects.forcedZetsuFrames > 0 ||
    (fighter.predator?.sealFrames ?? 0) > 0 ||
    (fighter.kurapika?.blackoutFrames ?? 0) > 0,
  )
}
