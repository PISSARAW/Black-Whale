import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'
import { STEEL_BRUSHED, STEEL_DARK } from './heillyHideoutDetailSurface'

export interface CorridorContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
}

export function dressHeillyCorridorArchitecture(context: CorridorContext): void {
  const { into, floor, ceilingHeight } = context
  const halfH = ceilingHeight / 2

  // Bulkhead archways connecting to the main hideout rooms
  const portalsX = [-13.14, -13.0, 0.5, 12.0]
  for (const px of portalsX) {
    // Portal frame
    into.box([0.18, ceilingHeight - 0.4, 0.18], {
      at: [px - 1.2, floor + halfH - 0.2, -0.38],
      colour: STEEL_DARK,
    })
    into.box([0.18, ceilingHeight - 0.4, 0.18], {
      at: [px + 1.2, floor + halfH - 0.2, -0.38],
      colour: STEEL_DARK,
    })
    into.box([2.58, 0.22, 0.22], {
      at: [px, floor + ceilingHeight - 0.3, -0.38],
      colour: STEEL_DARK,
    })
  }

  // Overhead industrial conduit running the length of the bunker corridor
  into.cylinder(
    { radius: 0.05, height: 32, sides: 12 },
    { at: [-1.6, floor + ceilingHeight - 0.25, -3.5], colour: STEEL_BRUSHED, rotation: [0, 0, Math.PI / 2] },
  )

  // Caged ceiling bulkhead lamps
  for (let lx = -15; lx <= 13; lx += 7) {
    into.box([0.28, 0.1, 0.28], {
      at: [lx, floor + ceilingHeight - 0.1, -3.5],
      colour: STEEL_DARK,
    })
    into.sphere([0.08, 0.05, 0.08], {
      at: [lx, floor + ceilingHeight - 0.16, -3.5],
      colour: 0xffe8b0,
      glow: true,
    })
  }
}
