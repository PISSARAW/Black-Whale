import type { GumLink, GumLimb } from './bungeeTypes'
import type { FightState } from './types'

const LIMBS: Record<GumLimb, [string, string]> = {
  'hand-right': ['Main droite', 'Right hand'],
  'hand-left': ['Main gauche', 'Left hand'],
  'foot-right': ['Pied droit', 'Right foot'],
  'foot-left': ['Pied gauche', 'Left foot'],
}
export function gumLimbLabel(limb: GumLimb, language: 'fr' | 'en'): string {
  return LIMBS[limb][language === 'fr' ? 0 : 1]
}
export function gumLinkLabel(state: FightState, link: GumLink, language: 'fr' | 'en'): string {
  return `${gumLimbLabel(link.limb, language)} → ${gumTargetLabel(state, link, language)} · ${link.id}`
}
function gumTargetLabel(state: FightState, link: GumLink, language: 'fr' | 'en'): string {
  const index = language === 'fr' ? 0 : 1,
    target = link.target
  if (target.kind === 'fighter') return ['Adversaire', 'Opponent'][index]
  if (target.kind === 'surface')
    return {
      floor: ['Sol', 'Floor'],
      ceiling: ['Plafond / poutre', 'Ceiling / beam'],
    }[target.surface][index]
  if (target.kind === 'projectile') {
    const shot = state.projectiles.find((entry) => entry.id === target.id)
    return (shot?.shape === 'card' ? ['Carte', 'Card'] : ['Objet', 'Object'])[index]
  }
  return ['Objet du décor', 'Scenery object'][index]
}
