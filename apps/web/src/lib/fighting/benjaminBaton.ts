import { voluntaryNenAvailable } from './nenAccess'
import type { ArcadeFighter, FightProjectile, FightSide } from './types'

export type BenjaminInheritance = 'air-blow' | 'secret-window' | 'culdcept'

export interface BenjaminBatonState {
  inherited: readonly BenjaminInheritance[]
  markedTarget: FightSide | null
  card: FightProjectile | null
}

export interface BenjaminSoldier {
  ability: BenjaminInheritance
  deceased: boolean
  loyal: boolean
  academyGraduate: boolean
  privateArmy: boolean
}

/** Fixed duel snapshot after Vincent, Musse and Shikaku's deaths (ch. 373, 389). */
const FALLEN_SOLDIERS: readonly BenjaminSoldier[] = [
  { ability: 'air-blow', deceased: true, loyal: true, academyGraduate: true, privateArmy: true },
  {
    ability: 'secret-window',
    deceased: true,
    loyal: true,
    academyGraduate: true,
    privateArmy: true,
  },
  { ability: 'culdcept', deceased: true, loyal: true, academyGraduate: true, privateArmy: true },
]

export function createBenjaminBaton(
  soldiers: readonly BenjaminSoldier[] = FALLEN_SOLDIERS,
): BenjaminBatonState {
  return {
    inherited: [...new Set(soldiers.filter(eligibleSoldier).map((soldier) => soldier.ability))],
    markedTarget: null,
    card: null,
  }
}

function eligibleSoldier(soldier: BenjaminSoldier): boolean {
  return soldier.deceased && soldier.loyal && soldier.academyGraduate && soldier.privateArmy
}

export function benjaminNenActive(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter)
}

const INHERITED_MOVES: Readonly<Record<string, BenjaminInheritance>> = {
  'benjamin:neutralSpecial': 'air-blow',
  'benjamin:forwardSpecial': 'secret-window',
  'benjamin:downSpecial': 'culdcept',
  'benjamin:finisher': 'culdcept',
}

export function benjaminMoveAvailable(fighter: ArcadeFighter, moveId?: string): boolean {
  if (fighter.id !== 'benjamin') return true
  const required = INHERITED_MOVES[moveId ?? 'benjamin:neutralSpecial']
  if (!required) return true
  const baton = fighter.hatsuEffects.baton
  if (!baton?.inherited.includes(required) || !benjaminNenActive(fighter)) return false
  return moveId !== 'benjamin:finisher' || baton.card !== null
}

/** Utility moves have no strike, damage, stun, score, or invisible finisher hitbox. */
export function benjaminUtilityMove(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'benjamin' &&
    ['benjamin:forwardSpecial', 'benjamin:downSpecial', 'benjamin:finisher'].includes(
      fighter.attack?.moveId ?? '',
    )
  )
}
