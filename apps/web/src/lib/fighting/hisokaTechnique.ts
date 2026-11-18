import { voluntaryNenAvailable } from './nenAccess'
import { gyoSight } from './nenPerception'
import { chrolloCopiedMove } from './chrolloBook'
import { selectedGumLink } from './bungeeNetwork'
import { gumLinkPoints } from './bungeeGeometry'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const BUNGEE_REST_DISTANCE = 8
export type HisokaTechnique = 'attach' | 'recall' | 'rebound' | 'texture' | 'finish'

/** Skill Hunter replays the attachment, never an unrelated Hisoka move. */
export function hisokaTechnique(fighter: ArcadeFighter, moveId?: string): HisokaTechnique | null {
  if (fighter.id === 'chrollo')
    return nativeHisokaTechnique(chrolloCopiedMove(fighter, moveId) ?? '')
  return fighter.id === 'hisoka' ? nativeHisokaTechnique(moveId) : null
}
function nativeHisokaTechnique(moveId?: string): HisokaTechnique | null {
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
  return voluntaryNenAvailable(fighter)
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
  if (state.gumNetwork) return networkTechniqueAllowed(state, side, technique)
  const gum = ownedBungee(state, side)
  if (!gum) return false
  if (technique === 'finish') return true
  return !gum.retracting && Math.abs(state[gum.target].x - fighter.x) > BUNGEE_REST_DISTANCE
}

function networkTechniqueAllowed(state: FightState, side: FightSide, technique: HisokaTechnique): boolean {
  const link = selectedGumLink(state, side)
  if (!link) return false
  if (technique === 'finish') return link.target.kind === 'fighter'
  if (technique === 'recall' && link.target.kind === 'surface') return false
  if (technique === 'rebound' && link.target.kind === 'projectile') return false
  const points = gumLinkPoints(state, link)
  return link.motion === 'idle' && Boolean(points && Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) > 3)
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

/** Gyo reveals a hidden tether; En locates the part crossing its field. */
export function bungeeVisible(state: FightState, observer: FightSide = 'player'): boolean {
  const gum = state.bungeeGum
  if (!gum) return false
  return gum.owner === observer || !gum.hidden || gyoSight(state[observer])
}
