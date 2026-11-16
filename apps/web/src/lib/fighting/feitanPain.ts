import { hatsuSealedByOn } from './onTechnique'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface RisingSun {
  x: number
  y: number
  radius: number
  damage: number
  age: number
  duration: number
  scored: readonly FightSide[]
}

export interface PainPackerState {
  /** Actual health lost in combat, not the current missing-HP percentage. */
  injuries: number
  packedDamage: number
  armour: boolean
  sun: RisingSun | null
}

export function createPainPacker(): PainPackerState {
  return { injuries: 0, packedDamage: 0, armour: false, sun: null }
}

export function feitanNenActive(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.nen.mode !== 'zetsu' &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    !hatsuSealedByOn(fighter) &&
    (fighter.id !== 'chrollo' || chrolloHasActivePage(fighter, 'feitan'))
  )
}

/** Skill Hunter must pay the same injury and armour conditions as Feitan. */
export function painPackerAction(
  fighter: ArcadeFighter,
  moveId?: string,
): 'pack' | 'ignite' | null {
  if (fighter.id === 'chrollo') {
    return copiedPainPackerAction(fighter, moveId)
  }
  if (fighter.id !== 'feitan') return null
  if (!moveId) return fighter.hatsuEffects.painPacker?.armour ? 'ignite' : 'pack'
  if (moveId === 'feitan:neutralSpecial') return 'pack'
  return moveId === 'feitan:finisher' ? 'ignite' : null
}

function copiedPainPackerAction(fighter: ArcadeFighter, moveId?: string): 'pack' | 'ignite' | null {
  if (chrolloPageForMove(fighter, moveId) !== 'feitan') return null
  return fighter.hatsuEffects.painPacker?.armour ? 'ignite' : 'pack'
}

export function feitanMoveAvailable(fighter: ArcadeFighter, moveId?: string): boolean {
  const action = painPackerAction(fighter, moveId)
  if (!action) return true
  const pain = fighter.hatsuEffects.painPacker
  if (!feitanNenActive(fighter) || !pain || pain.sun) return false
  return action === 'pack'
    ? pain.injuries > 0 && !pain.armour
    : pain.armour && pain.packedDamage > 0
}

/** These casts create armour / a world hazard; neither has a melee hitbox. */
export function feitanUtilityMove(fighter: ArcadeFighter): boolean {
  return (
    fighter.attack?.kind === 'special' && painPackerAction(fighter, fighter.attack.moveId) !== null
  )
}

/** Observe the complete frame so damage from strikes, other Hatsu and heat counts once. */
export function recordFightInjuries(before: FightState, after: FightState): FightState {
  return {
    ...after,
    player: recordInjury(before.player, after.player),
    opponent: recordInjury(before.opponent, after.opponent),
  }
}

function recordInjury(before: ArcadeFighter, after: ArcadeFighter): ArcadeFighter {
  if (after.id !== 'feitan' && after.id !== 'chrollo') return after
  const damage = Math.max(0, before.health - after.health)
  if (damage === 0) return after
  const pain = after.hatsuEffects.painPacker ?? createPainPacker()
  return {
    ...after,
    hatsuEffects: {
      ...after.hatsuEffects,
      painPacker: { ...pain, injuries: Math.min(100, pain.injuries + damage) },
    },
  }
}
