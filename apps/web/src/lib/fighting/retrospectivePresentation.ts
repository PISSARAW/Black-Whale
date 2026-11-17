import type { FightProjectile, FightSide, FightState } from './types'

/** Render held physical objects without adding them back to the projectile simulation. */
export function arsenalProjectilePresentation(state: FightState): FightProjectile[] {
  const held: FightProjectile[] = []
  for (const side of ['player', 'opponent'] as const) {
    const fighter = state[side],
      shot = fighter.gumCatch?.projectile
    if (shot) held.push({ ...shot, x: fighter.x + fighter.facing * 2.5, y: fighter.y + 7 })
  }
  return [...state.projectiles, ...held]
}

export function phoneGuidance(state: FightState, side: FightSide, language: 'fr' | 'en'): string {
  const phone = state[side].chrolloHistorical?.phone
  if (!phone) return ''
  const suffix =
    language === 'fr' ? `${phone.calls} appel(s) utilisé(s).` : `${phone.calls} call(s) used.`
  const guidance = phone.guidance
  if (!guidance) return `${phone.number} · ${suffix}`
  if (guidance.kind === 'located') return `${locatedGuidance(guidance, language)} ${suffix}`
  if (guidance.kind === 'nearby')
    return language === 'fr'
      ? `Cible dans la zone, position trop éloignée pour être précisée. ${suffix}`
      : `Target in the area, too far away to pinpoint. ${suffix}`
  return language === 'fr'
    ? `Aucun profil correspondant ici. ${suffix}`
    : `No matching profile here. ${suffix}`
}

function locatedGuidance(point: { x?: number; y?: number }, language: 'fr' | 'en'): string {
  const x = point.x?.toFixed(1),
    y = point.y?.toFixed(1)
  return language === 'fr'
    ? `Cible repérée · x ${x}, hauteur ${y}.`
    : `Target located · x ${x}, height ${y}.`
}
