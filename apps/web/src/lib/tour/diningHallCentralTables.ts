import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Structure } from './types'

/** Board counts and timber hues interpret the bare wooden top in chapter 377. */
export function centralVIPTableLayout(size: readonly [number, number]) {
  const plankCount = Math.max(6, Math.ceil(size[0] / 0.65))
  return { plankCount, plankWidth: size[0] / plankCount, topThickness: 0.09 }
}

/** The Spiders' broad shared wooden table has neither tablecloth nor banquet settings. */
export function dressCentralVIPPlatform(context: {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
}): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at,
    [w, d] = structure.size
  const base = floor + structure.base,
    top = base + structure.height
  const layout = centralVIPTableLayout(structure.size)
  const colours = [0x998564, 0xa38d69, 0x958162, 0xa08b6b]
  for (let index = 0; index < layout.plankCount; index++) {
    const cx = x - w / 2 + layout.plankWidth * (index + 0.5)
    into.box([layout.plankWidth - 0.008, layout.topThickness, d], {
      at: [cx, top - layout.topThickness / 2, z],
      colour: colours[index % colours.length],
    })
    for (const end of [-1, 1]) {
      // Recessed fixing heads stay below the walking and table surface.
      into.cylinder(
        { radius: 0.014, height: 0.003, sides: 6 },
        {
          at: [cx, top + 0.001, z + end * (d / 2 - 0.15)],
          colour: 0x544b40,
        },
      )
    }
  }
  const apronY = top - 0.16
  for (const sign of [-1, 1]) {
    into.box([0.1, 0.17, d - 0.2], {
      at: [x + sign * (w / 2 - 0.08), apronY, z],
      colour: 0x6b5c45,
    })
    into.box([w - 0.2, 0.17, 0.1], {
      at: [x, apronY, z + sign * (d / 2 - 0.08)],
      colour: 0x6b5c45,
    })
  }
  for (const sign of [-1, 1]) {
    tableTrestle(into, { x, z: z + sign * d * 0.32, base, top, width: w })
  }
  into.box([0.12, 0.12, d * 0.64], {
    at: [x, base + 0.2, z],
    colour: 0x62543f,
  })
}

function tableTrestle(
  into: BanquetDetailBuilder,
  frame: {
    x: number
    z: number
    base: number
    top: number
    width: number
  },
): void {
  const { x, z, base, top, width } = frame
  const height = Math.max(0.04, top - base - 0.09)
  into.box([width * 0.82, 0.12, 0.2], {
    at: [x, top - 0.15, z],
    colour: 0x736246,
  })
  for (const sign of [-1, 1]) {
    const at = x + sign * width * 0.33
    into.box([0.16, height, 0.18], {
      at: [at, base + height / 2, z],
      colour: 0x675942,
    })
    into.box([0.38, 0.04, 0.3], { at: [at, base + 0.02, z], colour: 0x46443d })
  }
}
