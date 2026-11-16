import { canUseHatsu } from '@black-whale/nen-engine'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { hatsuSealedByOn } from './onTechnique'
import { predatorNenLocked } from './predatorSeal'
import type { ArcadeFighter, FightSide } from './types'

export const BIOHAZARD_COST = 20
export const BIOHAZARD_TRANSFORM = 18
export const BIOHAZARD_LIFETIME = 300
export const BIOHAZARD_CAPTURE = 48
export const BIOHAZARD_GRACE = 90
export const BIOHAZARD_MOVE = 'hinrigh:neutralSpecial'
export type BiohazardPhase =
  'carried' | 'transforming' | 'flying' | 'bound' | 'returning' | 'dropped' | 'broken'
export interface BiohazardObject {
  id: number
  kind: 'handcuffs'
  phase: BiohazardPhase
  x: number
  y: number
  direction: -1 | 1
  frames: number
  life: number
  durability: number
}
export interface BiohazardInventory {
  objects: readonly BiohazardObject[]
}
export interface BiohazardRestraint {
  owner: FightSide
  objectId: number
  frames: number
  healthAtCapture: number
  x: number
}

declare module './types' {
  interface ArcadeFighter {
    biohazard?: BiohazardInventory
    biohazardRestraint?: BiohazardRestraint
    biohazardGraceFrames?: number
  }
}

/** Equipment is physical: stealing Biohazard never creates the original user's belongings. */
export function createBiohazardInventory(count = 2): BiohazardInventory {
  return {
    objects: Array.from({ length: count }, (_, id) => ({
      id,
      kind: 'handcuffs',
      phase: 'carried',
      x: 0,
      y: 0,
      direction: 1,
      frames: 0,
      life: 0,
      durability: 12,
    })),
  }
}

export function biohazardPreparing(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.biohazard?.objects.some((object) => object.phase === 'transforming'))
}

export function biohazardBodyFree(fighter: ArcadeFighter): boolean {
  return !fighter.biohazardRestraint && !biohazardPreparing(fighter)
}

export function biohazardAuthority(fighter: ArcadeFighter, moveId?: string): boolean {
  if (fighter.id === 'hinrigh') return !chainAbilitySealed(fighter, BIOHAZARD_MOVE)
  if (fighter.kurapika?.held?.used && fighter.kurapika.held.source === 'hinrigh') return true
  return (
    chrolloPageForMove(fighter, moveId) === 'hinrigh' || chrolloHasActivePage(fighter, 'hinrigh')
  )
}

export function biohazardNen(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.aura > 0 &&
    canUseHatsu(fighter.nen) &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    !fighter.moonlightZetsu &&
    !hatsuSealedByOn(fighter) &&
    !predatorNenLocked(fighter)
  )
}

export function biohazardCanLaunch(fighter: ArcadeFighter): boolean {
  return (
    biohazardNen(fighter) &&
    fighter.aura >= BIOHAZARD_COST &&
    biohazardBodyFree(fighter) &&
    Boolean(fighter.biohazard?.objects.some((o) => o.phase === 'carried'))
  )
}

export function biohazardRecallMove(moveId?: string): boolean {
  return moveId === 'hinrigh:downSpecial'
}
