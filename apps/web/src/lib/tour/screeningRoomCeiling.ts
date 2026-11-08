import {
  SCREENING_BRASS,
  SCREENING_DARK_STEEL,
  SCREENING_GLASS,
  SCREENING_GOLD_LEAF,
  SCREENING_WARM_GLOW,
  SCREENING_WOOD_MAHOGANY,
  SCREENING_WOOD_TRIM,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'

export interface CeilingContext {
  surface: ScreeningRoomSurface
  floor: number
  ceilingHeight: number
}

function grandChandelier(surface: ScreeningRoomSurface, at: [number, number, number]): void {
  const [x, y, z] = at

  // Ceiling medallion / canopy
  surface.cylinder({ radius: 0.8, height: 0.12, sides: 16 }, [x, y - 0.06, z], {
    colour: SCREENING_GOLD_LEAF,
  })

  // Heavy brass suspension chain rod
  surface.cylinder({ radius: 0.03, height: 1.8, sides: 8 }, [x, y - 1.0, z], {
    colour: SCREENING_BRASS,
  })

  // Tier 1 upper ring & lights
  surface.ring({ radius: 1.2, tube: 0.05 }, [x, y - 1.9, z], SCREENING_BRASS)
  const tier1Count = 8
  for (let i = 0; i < tier1Count; i++) {
    const angle = (i * 2 * Math.PI) / tier1Count
    const lx = x + Math.cos(angle) * 1.2
    const lz = z + Math.sin(angle) * 1.2
    surface.cylinder({ radius: 0.03, height: 0.16, sides: 8 }, [lx, y - 1.82, lz], {
      colour: SCREENING_BRASS,
    })
    surface.glowingSphere([0.05, 0.06, 0.05], [lx, y - 1.72, lz], SCREENING_WARM_GLOW)
  }

  // Tier 2 middle ring & lights
  surface.ring({ radius: 2.1, tube: 0.06 }, [x, y - 2.5, z], SCREENING_BRASS)
  const tier2Count = 14
  for (let i = 0; i < tier2Count; i++) {
    const angle = (i * 2 * Math.PI) / tier2Count
    const lx = x + Math.cos(angle) * 2.1
    const lz = z + Math.sin(angle) * 2.1
    surface.cylinder({ radius: 0.035, height: 0.2, sides: 8 }, [lx, y - 2.4, lz], {
      colour: SCREENING_BRASS,
    })
    surface.glowingSphere([0.06, 0.07, 0.06], [lx, y - 2.28, lz], SCREENING_WARM_GLOW)
  }

  // Tier 3 lower grand ring & crystal drops
  surface.ring({ radius: 2.8, tube: 0.07 }, [x, y - 3.2, z], SCREENING_GOLD_LEAF)
  const tier3Count = 18
  for (let i = 0; i < tier3Count; i++) {
    const angle = (i * 2 * Math.PI) / tier3Count
    const lx = x + Math.cos(angle) * 2.8
    const lz = z + Math.sin(angle) * 2.8
    surface.cylinder({ radius: 0.04, height: 0.22, sides: 8 }, [lx, y - 3.08, lz], {
      colour: SCREENING_BRASS,
    })
    surface.glowingSphere([0.07, 0.08, 0.07], [lx, y - 2.95, lz], SCREENING_WARM_GLOW)
    // Crystal teardrop pendant
    surface.cylinder({ radius: 0.02, height: 0.25, sides: 6 }, [lx, y - 3.35, lz], {
      colour: SCREENING_GLASS,
    })
  }

  // Central pendant finial
  surface.sphere([0.18, 0.25, 0.18], [x, y - 3.6, z], SCREENING_GOLD_LEAF)
}

function cofferedCeilingGrid(context: CeilingContext): void {
  const { surface, floor, ceilingHeight } = context
  const topY = floor + ceilingHeight
  const xMin = -87.5
  const xMax = 0
  const zMin = 7.0
  const zMax = 52.5
  const totalLen = xMax - xMin // 87.5
  const totalWidth = zMax - zMin // 45.5

  // Longitudinal primary beams along X
  const zBeams = [14.0, 21.0, 29.75, 38.5, 45.5]
  for (const z of zBeams) {
    surface.box(
      [totalLen, 0.55, 0.45],
      [xMin + totalLen / 2, topY - 0.275, z],
      SCREENING_WOOD_MAHOGANY,
    )
    surface.box([totalLen, 0.08, 0.49], [xMin + totalLen / 2, topY - 0.55, z], SCREENING_GOLD_LEAF)
  }

  // Transverse cross beams along Z
  const xStep = 7.2
  for (let x = xMin + 5; x < xMax; x += xStep) {
    surface.box(
      [0.45, 0.5, totalWidth],
      [x, topY - 0.25, zMin + totalWidth / 2],
      SCREENING_WOOD_MAHOGANY,
    )
    surface.box(
      [0.49, 0.08, totalWidth],
      [x, topY - 0.5, zMin + totalWidth / 2],
      SCREENING_GOLD_LEAF,
    )
  }

  // Recessed coffer acoustic panels & downlights
  for (let x = xMin + 8.6; x < xMax - 4; x += xStep) {
    for (const z of [17.5, 25.3, 34.1, 42.0]) {
      // Coffer recessed inset panel
      surface.box([xStep - 0.7, 0.06, 6.2], [x, topY - 0.05, z], SCREENING_WOOD_TRIM)
      // Downlight in coffer center
      surface.glowingSphere([0.06, 0.04, 0.06], [x, topY - 0.09, z], SCREENING_WARM_GLOW)
      // Linear air diffuser grille
      surface.box([xStep - 2.5, 0.04, 0.18], [x, topY - 0.07, z + 2.2], SCREENING_DARK_STEEL)
    }
  }
}

/** Complete monumental coffered ceiling and grand chandeliers of the Screening Room. */
export function dressScreeningRoomCeiling(context: CeilingContext): void {
  const { surface, floor, ceilingHeight } = context
  const topY = floor + ceilingHeight

  // 1. Monumental coffered ceiling structural grid with moldings & downlights
  cofferedCeilingGrid(context)

  // 2. Grand tiered crystal & brass chandeliers suspended along central axis
  const chandelierXs = [-60, -48, -36, -24, -12]
  for (const cx of chandelierXs) {
    grandChandelier(surface, [cx, topY, 29.75])
  }
}
