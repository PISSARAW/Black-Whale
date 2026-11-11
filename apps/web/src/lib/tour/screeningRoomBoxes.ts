import type { Structure } from './types'
import {
  SCREENING_STONE,
  SCREENING_RECESS,
  SCREENING_GOLD_LEAF,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'
import { screeningScroll } from './screeningRoomOrnaments'

interface BoxesContext {
  surface: ScreeningRoomSurface
  floor: number
  structures: Structure[]
}

function balustrade(context: BoxesContext, rail: Structure): void {
  const { surface, floor } = context,
    [x, z] = rail.at,
    [length, depth] = rail.size,
    y = floor + rail.base
  for (const h of [0.04, rail.height - 0.06])
    surface.box([length, 0.08, depth], [x, y + h, z], SCREENING_STONE)
  const count = Math.floor((length - 0.3) / 0.6),
    pitch = (length - 0.3) / count
  for (let i = 0; i <= count; i++) {
    const bx = x - length / 2 + 0.15 + i * pitch
    for (const [radius, bottom, h, cy] of [
      [0.045, 0.065, 0.18, 0.17],
      [0.06, 0.035, 0.3, 0.41],
      [0.035, 0.06, 0.18, 0.65],
    ]) {
      surface.cylinder({ radius, bottom, height: h, sides: 8 }, [bx, y + cy, z], {
        colour: SCREENING_STONE,
      })
    }
  }
}

function lowerLoges(context: BoxesContext, gallery: Structure): void {
  const { surface, floor } = context,
    [x, z] = gallery.at,
    length = gallery.size[0]
  const inward = z < 29.75 ? 1 : -1,
    face = z + (inward * gallery.size[1]) / 2,
    bays = Math.max(1, Math.round(length / 5.2)),
    pitch = length / bays
  const top = gallery.base,
    bottom = 0.65
  for (let i = 0; i < bays; i++) {
    const bx = x - length / 2 + (i + 0.5) * pitch
    // Dark framed upper openings sit behind the turned balusters, as in the panel.
    const upper = floor + gallery.base + gallery.height
    surface.box([pitch - 0.45, 4.65, 0.035], [bx, upper + 2.4, z], SCREENING_RECESS)
    for (const sign of [-1, 1]) {
      surface.box(
        [0.2, 4.65, 0.2],
        [bx + sign * (pitch / 2 - 0.1), upper + 2.4, face],
        SCREENING_STONE,
      )
      surface.box(
        [0.3, 0.16, 0.27],
        [bx + sign * (pitch / 2 - 0.1), upper + 4.65, face],
        SCREENING_GOLD_LEAF,
      )
    }
    surface.box([pitch, 0.15, 0.2], [bx, upper + 4.72, face], SCREENING_STONE)

    surface.box(
      [pitch - 0.45, top - bottom, 0.035],
      [bx, floor + (top + bottom) / 2, z],
      SCREENING_RECESS,
    )
    surface.box([pitch - 0.42, 0.72, 0.12], [bx, floor + bottom + 0.36, face], SCREENING_STONE)
    for (const h of [bottom + 0.06, bottom + 0.66])
      surface.box(
        [pitch - 0.6, 0.045, 0.06],
        [bx, floor + h, face + inward * 0.09],
        SCREENING_GOLD_LEAF,
      )
    surface.into.ring(
      { radius: 0.12, tube: 0.018 },
      { at: [bx, floor + bottom + 0.36, face + inward * 0.1], colour: SCREENING_GOLD_LEAF },
    )
    for (const sign of [-1, 1]) {
      surface.box(
        [0.17, top - 0.08, 0.22],
        [bx + sign * (pitch / 2 - 0.1), floor + top / 2, face],
        SCREENING_STONE,
      )
      screeningScroll(surface, [bx + sign * 0.45, floor + bottom + 0.36, face + inward * 0.09], {
        scale: 0.35,
        side: sign,
        front: false,
      })
    }
    surface.box([pitch, 0.18, 0.35], [bx, floor + top - 0.14, face], SCREENING_STONE)
  }
}

export function dressScreeningRoomBoxes(context: BoxesContext): void {
  for (const s of context.structures) {
    if (s.id.includes('-boxes-')) {
      context.surface.box(
        [s.size[0], s.height, s.size[1]],
        [s.at[0], context.floor + s.base + s.height / 2, s.at[1]],
        SCREENING_STONE,
      )
      lowerLoges(context, s)
    }
    if (s.id.includes('-balustrade-')) balustrade(context, s)
  }
}
