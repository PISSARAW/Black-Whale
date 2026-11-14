import { ceilingLamps } from './geometry'
import type { Lamplight } from './light'
import type { Space } from './types'
import { cineplexFormatFor } from './cineplexFormats'

const HALL_SPACING = 3.6
const HALL_POWER = 2.15
const AUDITORIUM_SPACING = 4.4

function scaledGlow(glow: Lamplight['glow'], scale: number): Lamplight['glow'] {
  return [glow[0] * scale, glow[1] * scale, glow[2] * scale]
}

/** Bright public concourses and one shared controlled darkness across all auditoriums. */
export function cineplexLamplight(space: Space, ordinary: Lamplight): Lamplight {
  if (space.locationId !== 'tier-3-cineplex') return ordinary
  const format = cineplexFormatFor(space.id)
  if (!format) {
    const power = Math.max(ordinary.power, HALL_POWER)
    return {
      ...ordinary,
      spacing: HALL_SPACING,
      reach: HALL_SPACING * 1.18,
      positions: ceilingLamps(space.footprint, HALL_SPACING),
      power,
      glow: scaledGlow(ordinary.glow, power / ordinary.power),
      dead: 0,
      modelled: true,
    }
  }

  // The deck plan establishes eight equal screening-room envelopes and gives
  // none of them a different lighting class. A screen surface may glow in the
  // authored detail layer, but that must not silently relight the whole room.
  const power = 0.82
  return {
    ...ordinary,
    spacing: AUDITORIUM_SPACING,
    reach: AUDITORIUM_SPACING * 1.15,
    positions: ceilingLamps(space.footprint, AUDITORIUM_SPACING),
    power,
    glow: scaledGlow(ordinary.glow, power / ordinary.power),
    dead: 0,
  }
}
