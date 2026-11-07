import type { Point3 } from './banquetDetailBuilder'
import {
  QueenUnmaSurface,
  UNMA_FABRIC_PALE,
  UNMA_GOLD,
  UNMA_LIGHT_WOOD,
  UNMA_STONE,
  UNMA_VELVET,
  UNMA_WOOD,
  unmaTurnedPost,
} from './queenUnmaDetailSurface'

function royalArmchair(surface: QueenUnmaSurface): void {
  const { width: w, depth: d, structure } = surface
  const h = structure.height

  // Seat frame & cushion
  surface.box([w * 0.94, 0.12, d * 0.88], [0, 0.38, 0], UNMA_WOOD)
  surface.box([w * 0.96, 0.04, d * 0.9], [0, 0.42, 0], UNMA_GOLD)
  surface.box([w * 0.92, 0.03, d * 0.86], [0, 0.32, 0], UNMA_GOLD)
  surface.sphere([w * 0.44, 0.14, d * 0.42], [0, 0.48, 0.02], UNMA_VELVET)

  // Lumbar cushion in silk brocade
  surface.sphere([w * 0.32, 0.09, 0.1], [0, 0.54, -d * 0.18], 0xd4c090)
  surface.sphere([0.02, 0.02, 0.02], [0, 0.54, -d * 0.18 + 0.08], UNMA_VELVET)

  // Tall arched backrest with sculpted crest and winged ears
  armchairBackrest(surface, { w, d, h })

  // Scrolled armrests and cabriole legs
  armchairArmrestsAndLegs(surface, { w, d, h })
}

function armchairBackrest(
  surface: QueenUnmaSurface,
  dim: { w: number; d: number; h: number },
): void {
  const { w, d, h } = dim
  const backY = 0.42 + (h - 0.42) / 2
  const backZ = -d * 0.34
  const backH = h - 0.42

  surface.box([w * 0.88, backH, 0.12], [0, backY, backZ], UNMA_WOOD)
  surface.sphere([w * 0.38, backH * 0.44, 0.1], [0, backY, backZ + 0.05], UNMA_VELVET)

  // Winged side ears (fauteuil à oreilles royal)
  for (const side of [-1, 1]) {
    surface.box([0.08, backH * 0.65, 0.22], [side * w * 0.41, backY + 0.05, backZ + 0.1], UNMA_WOOD)
    surface.sphere([0.05, backH * 0.3, 0.1], [side * w * 0.39, backY + 0.05, backZ + 0.12], UNMA_VELVET)
  }

  // Sculpted top crest: shell rocaille & finial
  surface.sphere([w * 0.32, 0.16, 0.1], [0, h + 0.06, backZ], UNMA_WOOD)
  surface.sphere([w * 0.18, 0.11, 0.08], [0, h + 0.08, backZ + 0.04], UNMA_GOLD)
  surface.sphere([0.08, 0.1, 0.08], [0, h + 0.16, backZ], UNMA_GOLD)

  // Tufting buttons in diamond layout
  for (let row = 0; row < 3; row++) {
    for (let col = -1; col <= 1; col++) {
      surface.sphere(
        [0.022, 0.022, 0.022],
        [col * w * 0.22, backY - 0.2 + row * 0.22, backZ + 0.11],
        UNMA_GOLD,
      )
    }
  }
}

function armchairArmrestsAndLegs(
  surface: QueenUnmaSurface,
  dim: { w: number; d: number; h: number },
): void {
  const { w, d } = dim
  for (const side of [-1, 1]) {
    const x = side * w * 0.44
    // Armrest rail, acanthus scroll & velvet arm-pad
    surface.box([0.1, 0.26, d * 0.65], [x, 0.58, 0], UNMA_WOOD)
    surface.sphere([0.065, 0.07, d * 0.3], [x, 0.72, 0], UNMA_VELVET)
    surface.sphere([0.07, 0.07, 0.07], [x, 0.72, d * 0.32], UNMA_GOLD)
    surface.ring(0.045, [x, 0.62, d * 0.33], UNMA_GOLD)

    // 4 cabriole legs with gilded acanthus knees and feet
    for (const z of [-d * 0.35, d * 0.35]) {
      surface.cylinder({ radius: 0.045, height: 0.36 }, [x, 0.19, z], UNMA_WOOD)
      surface.sphere([0.055, 0.06, 0.055], [x, 0.32, z], UNMA_GOLD)
      surface.sphere([0.05, 0.05, 0.05], [x, 0.06, z], UNMA_GOLD)
    }
  }
}

function sideTable(surface: QueenUnmaSurface): void {
  const { width: w, structure } = surface
  const r = (w * 0.88) / 2
  const topY = structure.height

  // Circular molded tabletop with gold edge
  surface.cylinder({ radius: r, height: 0.045, sides: 20 }, [0, topY, 0], UNMA_WOOD)
  surface.ring(r, [0, topY + 0.02, 0], UNMA_GOLD)
  surface.cylinder({ radius: r * 0.82, height: 0.01, sides: 20 }, [0, topY + 0.025, 0], 0x5a3e2c)

  // Turned central baluster & tripod base
  surface.cylinder({ radius: 0.055, height: topY - 0.15 }, [0, (topY - 0.1) / 2 + 0.05, 0], UNMA_WOOD)
  surface.sphere([0.08, 0.08, 0.08], [0, topY * 0.35, 0], UNMA_GOLD)
  surface.cylinder({ radius: r * 0.65, height: 0.06, sides: 16 }, [0, 0.04, 0], UNMA_WOOD)

  // Distinct tabletop items for port and starboard sides
  if (structure.id.includes('port')) {
    tableTeaService(surface, topY)
  } else {
    tableDecanter(surface, topY)
  }
}

function tableTeaService(surface: QueenUnmaSurface, topY: number): void {
  // Silver teapot with spout, lid and finial
  surface.sphere([0.055, 0.06, 0.055], [0, topY + 0.07, 0], 0xd0d5db)
  surface.cylinder({ radius: 0.022, height: 0.025 }, [0, topY + 0.13, 0], UNMA_GOLD)
  surface.sphere([0.012, 0.012, 0.012], [0, topY + 0.15, 0], UNMA_GOLD)
  surface.cylinder({ radius: 0.012, height: 0.07 }, [0.06, topY + 0.08, 0], 0xd0d5db)
  // Porcelain teacup & saucer
  surface.cylinder({ radius: 0.048, height: 0.01 }, [-0.1, topY + 0.03, 0.05], UNMA_STONE)
  surface.cylinder({ radius: 0.032, height: 0.035 }, [-0.1, topY + 0.05, 0.05], 0xf7f5ee)
}

function tableDecanter(surface: QueenUnmaSurface, topY: number): void {
  // Crystal decanter with golden stopper
  surface.cylinder({ radius: 0.048, height: 0.12 }, [0, topY + 0.08, 0], 0x8a9da6)
  surface.cylinder({ radius: 0.018, height: 0.08 }, [0, topY + 0.16, 0], 0x8a9da6)
  surface.sphere([0.025, 0.035, 0.025], [0, topY + 0.22, 0], UNMA_GOLD)
  // Glowing amber sherry inside
  surface.sphere([0.038, 0.05, 0.038], [0, topY + 0.06, 0], 0xdba842)
  // Stemmed cordial glass
  surface.cylinder({ radius: 0.018, height: 0.05 }, [0.09, topY + 0.06, 0.04], 0xcfe2e8)
  surface.cylinder({ radius: 0.005, height: 0.04 }, [0.09, topY + 0.035, 0.04], UNMA_GOLD)
}

function coffeeTable(surface: QueenUnmaSurface): void {
  const { width: w, depth: d, structure } = surface
  const topY = structure.height

  // Molded rectangular top with gold edge banding
  surface.box([w, 0.045, d], [0, topY, 0], UNMA_WOOD)
  surface.box([w * 0.92, 0.015, d * 0.92], [0, topY + 0.025, 0], 0x4f3627)
  surface.box([w + 0.02, 0.02, d + 0.02], [0, topY - 0.02, 0], UNMA_GOLD)
  surface.box([w * 0.85, 0.012, d * 0.85], [0, topY + 0.027, 0], 0x3d271c)

  // Apron and 4 carved cabriole legs
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const legX = sx * (w / 2 - 0.09)
      const legZ = sz * (d / 2 - 0.09)
      surface.cylinder({ radius: 0.04, height: topY - 0.04 }, [legX, topY / 2 - 0.02, legZ], UNMA_WOOD)
      surface.sphere([0.048, 0.048, 0.048], [legX, 0.06, legZ], UNMA_GOLD)
      surface.sphere([0.05, 0.05, 0.05], [legX, topY - 0.08, legZ], UNMA_GOLD)
    }
  }

  // Cross-stretcher at base with sculpted central vase finial
  surface.box([w * 0.78, 0.025, 0.04], [0, 0.1, 0], UNMA_WOOD)
  surface.box([0.04, 0.025, d * 0.78], [0, 0.1, 0], UNMA_WOOD)
  surface.sphere([0.045, 0.06, 0.045], [0, 0.14, 0], UNMA_GOLD)

  // Tabletop ornamentation: royal casket, vase and book
  coffeeTableAccessories(surface, topY)
}

function coffeeTableAccessories(surface: QueenUnmaSurface, topY: number): void {
  // Gilded royal casket / jewelry box
  surface.box([0.28, 0.11, 0.18], [-0.35, topY + 0.08, 0], UNMA_WOOD)
  surface.box([0.3, 0.02, 0.2], [-0.35, topY + 0.14, 0], UNMA_GOLD)
  surface.sphere([0.015, 0.02, 0.015], [-0.35, topY + 0.11, 0.095], UNMA_GOLD)

  // Sculpted porcelain flower vase
  surface.cylinder({ radius: 0.06, height: 0.16 }, [0.35, topY + 0.1, 0], 0xf0ece2)
  surface.sphere([0.075, 0.08, 0.075], [0.35, topY + 0.14, 0], 0xf0ece2)
  surface.cylinder({ radius: 0.035, height: 0.04 }, [0.35, topY + 0.19, 0], UNMA_GOLD)
  // Small glowing rose bud
  surface.sphere([0.03, 0.03, 0.03], [0.35, topY + 0.22, 0], 0xb8324a)

  // Open salon leather journal
  surface.box([0.24, 0.02, 0.32], [0, topY + 0.04, 0], 0x5c3222)
  surface.box([0.22, 0.025, 0.3], [0, topY + 0.045, 0], 0xfdfaf2)
}

function nurseryCot(surface: QueenUnmaSurface): void {
  const { width: w, depth: d, structure } = surface
  const postH = structure.height

  // 4 corner turned posts with round finials
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      unmaTurnedPost(surface, {
        at: [sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06)],
        height: postH,
        radius: 0.038,
      })
    }
  }

  // Headboard and footboard (cintrés en bois plein avec découpe moulurée)
  for (const sz of [-1, 1]) {
    const z = sz * (d / 2 - 0.06)
    surface.box([w * 0.85, 0.35, 0.035], [0, postH * 0.55, z], UNMA_LIGHT_WOOD)
    surface.sphere([w * 0.42, 0.12, 0.025], [0, postH * 0.74, z], UNMA_LIGHT_WOOD)
    surface.sphere([0.045, 0.045, 0.045], [0, postH * 0.84, z], UNMA_GOLD)
    surface.box([w * 0.35, 0.02, 0.04], [0, postH * 0.62, z], UNMA_GOLD)
  }

  // Slat sides: regular spindles
  nurseryCotSlats(surface, { w, d, postH })

  // Rocker runners (patins de bascule) at base
  for (const sz of [-1, 1]) {
    surface.curve(
      [
        [-w * 0.52, 0.08, sz * (d / 2 - 0.06)],
        [0, 0.038, sz * (d / 2 - 0.06)],
        [w * 0.52, 0.08, sz * (d / 2 - 0.06)],
      ],
      0.025,
      UNMA_WOOD,
    )
  }

  // Soft cream mattress, baby blanket & pillow with lace border
  surface.box([w * 0.82, 0.14, d * 0.82], [0, 0.28, 0], UNMA_FABRIC_PALE)
  surface.box([w * 0.78, 0.06, d * 0.55], [0, 0.36, d * 0.14], 0xc7c1b4)
  surface.box([w * 0.74, 0.02, 0.08], [0, 0.39, -d * 0.12], UNMA_GOLD)
  surface.sphere([w * 0.32, 0.06, 0.15], [0, 0.36, -d * 0.26], UNMA_FABRIC_PALE)
}

function nurseryCotSlats(
  surface: QueenUnmaSurface,
  dim: { w: number; d: number; postH: number },
): void {
  const { w, d, postH } = dim
  const slatCount = 7
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.06)
    surface.box([0.03, 0.03, d * 0.82], [x, postH * 0.7, 0], UNMA_LIGHT_WOOD)
    surface.box([0.03, 0.03, d * 0.82], [x, 0.25, 0], UNMA_LIGHT_WOOD)
    for (let i = 0; i < slatCount; i++) {
      const z = -d * 0.36 + (i * d * 0.72) / (slatCount - 1)
      surface.cylinder({ radius: 0.012, height: postH * 0.44 }, [x, postH * 0.47, z], UNMA_LIGHT_WOOD)
    }
  }
}

function cotMobile(surface: QueenUnmaSurface): void {
  const { width: w, structure } = surface
  const h = structure.height

  // Central ceiling suspension cord
  surface.cylinder({ radius: 0.008, height: h * 0.7 }, [0, h * 0.65, 0], UNMA_GOLD)
  surface.sphere([0.04, 0.04, 0.04], [0, h * 0.38, 0], UNMA_GOLD)

  // Two crossed balance bars at different angles
  const barLen = w * 0.46
  surface.box([barLen, 0.014, 0.014], [0, h * 0.34, 0], UNMA_GOLD)
  surface.box([0.014, 0.014, barLen], [0, h * 0.28, 0], UNMA_GOLD)

  // Luminous dangling pendants (stars and moon glowing softly in the nursery!)
  const pendants: [Point3, number, string, boolean][] = [
    [[-barLen * 0.44, h * 0.12, 0], 0xffe885, 'star', true],
    [[barLen * 0.44, h * 0.08, 0], 0xfff6cf, 'moon', true],
    [[0, h * 0.1, -barLen * 0.44], 0xbca164, 'sphere', false],
    [[0, h * 0.06, barLen * 0.44], 0xffca7a, 'star', true],
  ]

  for (const [pos, col, kind, isGlowing] of pendants) {
    const [px, py, pz] = pos
    surface.cylinder({ radius: 0.004, height: h * 0.2 }, [px, py + h * 0.1, pz], UNMA_GOLD)
    if (kind === 'star') {
      surface.into.sphere([0.045, 0.045, 0.015], { at: surface.point(pos), colour: col, glow: isGlowing })
      surface.box([0.07, 0.015, 0.015], pos, col)
      surface.box([0.015, 0.07, 0.015], pos, col)
    } else if (kind === 'moon') {
      surface.into.ring({ radius: 0.04, tube: 0.01 }, { at: surface.point(pos), colour: col, glow: isGlowing })
    } else {
      surface.sphere([0.04, 0.04, 0.04], pos, col)
    }
  }
}

function queenBed(surface: QueenUnmaSurface): void {
  const { width: w, depth: d, structure } = surface
  const h = structure.height

  // Bed frame, mattress & royal velvet coverlet
  surface.box([w, 0.25, d], [0, 0.2, 0], UNMA_WOOD)
  surface.box([w * 0.94, 0.2, d * 0.92], [0, 0.38, 0], UNMA_FABRIC_PALE)
  surface.box([w * 0.96, 0.08, d * 0.65], [0, 0.46, d * 0.14], UNMA_VELVET)
  surface.box([w * 0.98, 0.02, 0.2], [0, 0.48, d * 0.38], UNMA_GOLD)

  // Carved tufted headboard with pediment
  const headZ = -d / 2 + 0.08
  surface.box([w * 1.02, h * 1.8, 0.1], [0, h * 0.9, headZ], UNMA_WOOD)
  surface.sphere([w * 0.44, h * 0.72, 0.08], [0, h * 0.92, headZ + 0.06], UNMA_VELVET)
  surface.box([w * 1.04, 0.06, 0.12], [0, h * 1.82, headZ], UNMA_GOLD)
  surface.sphere([w * 0.25, 0.12, 0.08], [0, h * 1.9, headZ], UNMA_GOLD)

  // 4 Royal pillows & round bolster with gold tassels
  for (const side of [-1, 1]) {
    surface.sphere([w * 0.2, 0.08, 0.18], [side * w * 0.24, 0.52, headZ + 0.32], UNMA_FABRIC_PALE)
    surface.sphere([w * 0.17, 0.07, 0.15], [side * w * 0.24, 0.6, headZ + 0.36], 0xd8c8a2)
  }
  // Royal bolster pillow lying horizontally across the bed
  surface.into.cylinder(
    { radius: 0.06, height: w * 0.75, sides: 12 },
    {
      at: surface.point([0, 0.53, headZ + 0.58]),
      rotation: [0, surface.angle, Math.PI / 2],
      colour: UNMA_VELVET,
    },
  )
  for (const side of [-1, 1]) {
    surface.sphere([0.035, 0.05, 0.05], [side * w * 0.38, 0.53, headZ + 0.58], UNMA_GOLD)
  }
}

export function dressQueenUnmaFurniture(surface: QueenUnmaSurface): void {
  const { id } = surface.structure
  if (id.includes('armchair')) royalArmchair(surface)
  else if (id.includes('side-table')) sideTable(surface)
  else if (id.includes('coffee-table')) coffeeTable(surface)
  else if (id.includes('crib')) nurseryCot(surface)
  else if (id.includes('mobile')) cotMobile(surface)
  else if (id.includes('bed')) queenBed(surface)
}
