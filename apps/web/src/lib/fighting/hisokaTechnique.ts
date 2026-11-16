import { canUseHatsu } from '@black-whale/nen-engine'
import { hatsuSealedByOn } from './onTechnique'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const BUNGEE_REST_DISTANCE = 8
export type HisokaTechnique = 'attach' | 'recall' | 'rebound' | 'texture' | 'finish'

/** Skill Hunter replays the attachment, never an unrelated Hisoka move. */
export function hisokaTechnique(fighter: ArcadeFighter, moveId?: string): HisokaTechnique | null {
  if (fighter.id === 'chrollo')
    return fighter.hatsuEffects.stolenHatsu === 'hisoka' && moveId === 'chrollo:neutralSpecial' ? 'attach' : null
  if (fighter.id !== 'hisoka') return null
  switch (moveId) {
    case undefined:
    case 'hisoka:neutralSpecial':
      return 'attach'
    case 'hisoka:forwardSpecial':
      return 'recall'
    case 'hisoka:backSpecial':
      return 'rebound'
    case 'hisoka:downSpecial':
      return 'texture'
    case 'hisoka:finisher':
      return 'finish'
    default:
      return null
  }
}

export function hisokaNenActive(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    canUseHatsu(fighter.nen) &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    !hatsuSealedByOn(fighter)
  )
}

/** Checked both on input (including buffered input) and at the end of startup. */
export function hisokaTechniqueAllowed(
  state: FightState,
  side: FightSide,
  moveId?: string,
): boolean {
  const fighter = state[side]
  const technique = hisokaTechnique(fighter, moveId)
  if (!technique) return true
  if (!hisokaNenActive(fighter)) return false
  // The duel uses the flat front of his existing shirt as its cloth support.
  if (technique === 'texture') return fighter.y === 0 && !fighter.textureSurprise
  if (technique === 'attach') return true
  const gum = ownedBungee(state, side)
  if (!gum) return false
  if (technique === 'finish') return true
  return !gum.retracting && Math.abs(state[gum.target].x - fighter.x) > BUNGEE_REST_DISTANCE
}

function ownedBungee(state: FightState, side: FightSide) {
  const gum = state.bungeeGum
  return gum && gum.owner === side && gum.target !== side && state[gum.target].health > 0
    ? gum
    : null
}

export function hisokaUtilityMove(fighter: ArcadeFighter): boolean {
  if (fighter.attack?.kind !== 'special') return false
  const technique = hisokaTechnique(fighter, fighter.attack.moveId)
  return technique === 'recall' || technique === 'rebound' || technique === 'texture'
}

/** In hides the line from the opposing observer until they use Gyo. */
export function bungeeVisible(state: FightState, observer: FightSide = 'player'): boolean {
  const gum = state.bungeeGum
  return Boolean(gum && (gum.owner === observer || !gum.hidden || state[observer].nen.gyo))
}
