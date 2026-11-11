import type { Lamplight } from './light'
import type { Vec2 } from './types'

export const CAMILLA_SALON_LAMP: Vec2 = [-3.5, 1.4]
export const CAMILLA_LAMP_DROP = 0.62

/** Ch. 389: the modelled chandelier replaces the generic rectangular ceiling fittings. */
export function camillaLamplight(spaceId: string, ordinary: Lamplight): Lamplight {
  if (spaceId !== 'tier-1-royal-residential-sector-room-1002-living') return ordinary
  return {
    ...ordinary,
    positions: [CAMILLA_SALON_LAMP],
    drop: CAMILLA_LAMP_DROP,
    modelled: true,
    spacing: 12,
    reach: 12 * (ordinary.reach / ordinary.spacing),
  }
}
