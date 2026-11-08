import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

const MAHOGANY = 0x3a1f18
const BRONZE = 0x72604c
const GOLD = 0xd4af37
const DARK_STONE = 0x3d352c
const DUCT_METAL = 0x5a6268
const CARPET_RED = 0x7a1818
const LUMEN_WARM = 0xfef5e0

interface CorridorContext {
  into: BanquetDetailBuilder
  space: Space
  floor: number
  ceilingHeight: number
}

interface CorridorBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  midX: number
  midY: number
  isLongitudinal: boolean
}

function resolveBounds(space: Space): CorridorBounds {
  const xs = space.footprint.map(([x]) => x)
  const ys = space.footprint.map(([, y]) => y)
  const minX = Math.min(...xs),
    maxX = Math.max(...xs)
  const minY = Math.min(...ys),
    maxY = Math.max(...ys)
  const lenX = maxX - minX
  const lenY = maxY - minY
  return {
    minX,
    maxX,
    minY,
    maxY,
    midX: (minX + maxX) / 2,
    midY: (minY + maxY) / 2,
    isLongitudinal: lenX >= lenY,
  }
}

function corridorCarpet(into: BanquetDetailBuilder, floor: number, b: CorridorBounds): void {
  const widthX = b.maxX - b.minX
  const widthY = b.maxY - b.minY

  if (b.isLongitudinal) {
    const carpetWidth = Math.min(widthY * 0.7, 2.0)
    into.box([widthX, 0.015, carpetWidth], {
      at: [b.midX, floor + 0.008, b.midY],
      colour: CARPET_RED,
    })
    for (const dy of [-carpetWidth / 2, carpetWidth / 2]) {
      into.box([widthX, 0.018, 0.04], {
        at: [b.midX, floor + 0.01, b.midY + dy],
        colour: GOLD,
      })
    }
  } else {
    const carpetWidth = Math.min(widthX * 0.7, 2.0)
    into.box([carpetWidth, 0.015, widthY], {
      at: [b.midX, floor + 0.008, b.midY],
      colour: CARPET_RED,
    })
    for (const dx of [-carpetWidth / 2, carpetWidth / 2]) {
      into.box([0.04, 0.018, widthY], {
        at: [b.midX + dx, floor + 0.01, b.midY],
        colour: GOLD,
      })
    }
  }
}

function ceilingAndDucts(into: BanquetDetailBuilder, topY: number, b: CorridorBounds): void {
  const widthX = b.maxX - b.minX
  const widthY = b.maxY - b.minY

  // Overhead service ducts (Chapter 367–369 ventilation and service crawlways)
  if (b.isLongitudinal) {
    into.box([widthX, 0.18, 0.36], {
      at: [b.midX, topY - 0.22, b.midY - widthY * 0.32],
      colour: DUCT_METAL,
    })
    // Transverse ceiling beams
    const step = 6.0
    for (let x = b.minX + 3.0; x < b.maxX; x += step) {
      into.box([0.22, 0.14, widthY], {
        at: [x, topY - 0.07, b.midY],
        colour: DARK_STONE,
      })
      // Downlight sconce
      into.cylinder(
        { radius: 0.12, height: 0.04 },
        { at: [x, topY - 0.02, b.midY], colour: LUMEN_WARM, glow: true },
      )
    }
  } else {
    into.box([0.36, 0.18, widthY], {
      at: [b.midX - widthX * 0.32, topY - 0.22, b.midY],
      colour: DUCT_METAL,
    })
    const step = 6.0
    for (let y = b.minY + 3.0; y < b.maxY; y += step) {
      into.box([widthX, 0.14, 0.22], {
        at: [b.midX, topY - 0.07, y],
        colour: DARK_STONE,
      })
      into.cylinder(
        { radius: 0.12, height: 0.04 },
        { at: [b.midX, topY - 0.02, y], colour: LUMEN_WARM, glow: true },
      )
    }
  }
}

function wallPanellingAndSconces(
  into: BanquetDetailBuilder,
  floor: number,
  b: CorridorBounds,
): void {
  const widthX = b.maxX - b.minX
  const widthY = b.maxY - b.minY

  // Baseboard wainscoting mouldings along corridor boundaries
  if (b.isLongitudinal) {
    for (const dy of [-widthY / 2 + 0.05, widthY / 2 - 0.05]) {
      into.box([widthX, 0.45, 0.08], {
        at: [b.midX, floor + 0.225, b.midY + dy],
        colour: MAHOGANY,
      })
      into.box([widthX, 0.04, 0.1], {
        at: [b.midX, floor + 0.47, b.midY + dy],
        colour: BRONZE,
      })
    }
  } else {
    for (const dx of [-widthX / 2 + 0.05, widthX / 2 - 0.05]) {
      into.box([0.08, 0.45, widthY], {
        at: [b.midX + dx, floor + 0.225, b.midY],
        colour: MAHOGANY,
      })
      into.box([0.1, 0.04, widthY], {
        at: [b.midX + dx, floor + 0.47, b.midY],
        colour: BRONZE,
      })
    }
  }
}

export function dressCorridorArchitecture(context: CorridorContext): void {
  const { into, space, floor, ceilingHeight } = context
  const bounds = resolveBounds(space)
  corridorCarpet(into, floor, bounds)
  ceilingAndDucts(into, floor + ceilingHeight, bounds)
  wallPanellingAndSconces(into, floor, bounds)
}
