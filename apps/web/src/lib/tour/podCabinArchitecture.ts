import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  BULKHEAD_LAMP_WARM,
  CHROME_BRIGHT,
  DECK_NON_SKID,
  DECK_SEAM_DARK,
  DECK_SEGMENT_STEEL,
  EMERGENCY_STRIP_RED,
  GRAB_RAIL_YELLOW,
  SHELL_RIBS_STEEL,
  SHELL_TITANIUM,
  STEEL_BRUSHED,
  STEEL_DARK,
  STEEL_GRAPHITE,
  TIE_DOWN_BRASS,
} from './podCabinDetailSurface'

export interface ArchitecturePlacement {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
}

function shellWallPanels(into: BanquetDetailBuilder, floor: number, height: number): void {
  const facets = 16
  const radius = 2.54
  const facetWidth = 2 * radius * Math.sin(Math.PI / facets)

  for (let i = 0; i < facets; i++) {
    const angle = (i * Math.PI * 2) / facets
    const px = Math.sin(angle) * radius
    const pz = Math.cos(angle) * radius

    // Insulated curved outer shell plate
    into.box([facetWidth + 0.02, height, 0.08], {
      at: [px, floor + height / 2, pz],
      colour: SHELL_TITANIUM,
      rotation: [0, angle, 0],
    })

    // Base kickplate along bottom edge
    into.box([facetWidth + 0.02, 0.12, 0.1], {
      at: [px, floor + 0.06, pz],
      colour: STEEL_DARK,
      rotation: [0, angle, 0],
    })
  }
}

function structuralRibs(into: BanquetDetailBuilder, floor: number, height: number): void {
  const ribsCount = 8
  const radius = 2.46

  for (let i = 0; i < ribsCount; i++) {
    const angle = (i * Math.PI * 2) / ribsCount
    const rx = Math.sin(angle) * radius
    const rz = Math.cos(angle) * radius

    // Vertical T-section structural rib standing off the hull
    into.box([0.08, height, 0.18], {
      at: [rx, floor + height / 2, rz],
      colour: SHELL_RIBS_STEEL,
      rotation: [0, angle, 0],
    })
    into.box([0.16, height, 0.04], {
      at: [rx, floor + height / 2, rz - Math.cos(angle) * 0.08],
      colour: STEEL_GRAPHITE,
      rotation: [0, angle, 0],
    })

    // Low-level emergency path indicator strip at base of each rib
    into.box([0.12, 0.04, 0.06], {
      at: [rx, floor + 0.16, rz - Math.cos(angle) * 0.1],
      colour: EMERGENCY_STRIP_RED,
      rotation: [0, angle, 0],
      glow: true,
    })
  }
}

function perimeterGrabRails(into: BanquetDetailBuilder, floor: number): void {
  const railRadius = 2.32
  const railY = floor + 1.05
  const segments = 16

  for (let i = 0; i < segments; i++) {
    const angle = (i * Math.PI * 2) / segments
    // Skip opening directly in front of the round hatch at negative Z
    if (i === 8 || i === 7) continue

    const nextAngle = ((i + 1) * Math.PI * 2) / segments
    const mx = (Math.sin(angle) + Math.sin(nextAngle)) * 0.5 * railRadius
    const mz = (Math.cos(angle) + Math.cos(nextAngle)) * 0.5 * railRadius
    const segLength = 2 * railRadius * Math.sin(Math.PI / segments)

    // Waist-height tubular yellow grab rail for passengers standing during launch
    into.box([segLength, 0.035, 0.035], {
      at: [mx, railY, mz],
      colour: GRAB_RAIL_YELLOW,
      rotation: [0, angle + Math.PI / segments, 0],
    })

    // Standoff mounting post connecting rail to hull
    const px = Math.sin(angle) * railRadius
    const pz = Math.cos(angle) * railRadius
    into.cylinder(
      { radius: 0.014, height: 0.18, sides: 8 },
      { at: [px, railY, pz], colour: STEEL_BRUSHED, rotation: [Math.PI / 2, 0, -angle] },
    )
  }
}

/** The ribbed circular hull shell with insulated titanium wall, rib hoops and grab rails. */
export function dressRibbedShell(placement: ArchitecturePlacement): void {
  const { into, floor, ceilingHeight } = placement

  shellWallPanels(into, floor, ceilingHeight)
  structuralRibs(into, floor, ceilingHeight)
  perimeterGrabRails(into, floor)

  // Intermediate circumferential stiffener belt rings
  for (const ringY of [floor + 0.8, floor + 1.7]) {
    into.cylinder(
      { radius: 2.48, height: 0.05, sides: 16 },
      { at: [0, ringY, 0], colour: STEEL_GRAPHITE },
    )
  }
}

/** Bare segmented circular deck plating with 16 radial sectors and non-skid pads. */
export function dressRadialDeck(options: { into: BanquetDetailBuilder; floor: number }): void {
  const { into, floor } = options

  // Main circular steel deck base
  into.cylinder(
    { radius: 2.52, height: 0.04, sides: 24 },
    { at: [0, floor + 0.02, 0], colour: DECK_SEGMENT_STEEL },
  )

  // 16 radial seam welds dividing the deck into wedges around the central post base
  const sectors = 16
  for (let s = 0; s < sectors; s++) {
    const angle = (s * Math.PI * 2) / sectors
    const midR = 1.7
    const sx = Math.sin(angle) * midR
    const sz = Math.cos(angle) * midR

    into.box([0.03, 0.042, 1.35], {
      at: [sx, floor + 0.022, sz],
      colour: DECK_SEAM_DARK,
      rotation: [0, angle, 0],
    })

    // Non-skid safety tread plate centered on alternating sectors
    const treadAngle = angle + Math.PI / sectors
    const tx = Math.sin(treadAngle) * 1.8
    const tz = Math.cos(treadAngle) * 1.8
    into.box([0.45, 0.044, 0.65], {
      at: [tx, floor + 0.024, tz],
      colour: DECK_NON_SKID,
      rotation: [0, treadAngle, 0],
    })

    // Recessed brass tie-down eyelet rings
    if (s % 2 === 0) {
      const ringX = Math.sin(treadAngle) * 2.15
      const ringZ = Math.cos(treadAngle) * 2.15
      into.cylinder(
        { radius: 0.045, height: 0.015, sides: 10 },
        { at: [ringX, floor + 0.026, ringZ], colour: TIE_DOWN_BRASS },
      )
    }
  }
}

/** Domed technical ceiling cap with central convergence ring and explosion-proof lamp. */
export function dressDomeCeiling(placement: ArchitecturePlacement): void {
  const { into, floor, ceilingHeight } = placement
  const topY = floor + ceilingHeight

  // Central circular structural collar where the 8 rib hoops converge around the post
  into.cylinder(
    { radius: 0.62, height: 0.08, sides: 16 },
    { at: [0, topY - 0.04, 0], colour: STEEL_GRAPHITE },
  )
  into.cylinder(
    { radius: 0.48, height: 0.12, sides: 12 },
    { at: [0, topY - 0.06, 0], colour: STEEL_DARK },
  )

  // Explosion-proof central dome lamp fixture
  into.cylinder(
    { radius: 0.18, height: 0.08, sides: 12 },
    { at: [0, topY - 0.1, 0], colour: CHROME_BRIGHT },
  )
  into.sphere([0.12, 0.09, 0.12], {
    at: [0, topY - 0.14, 0],
    colour: BULKHEAD_LAMP_WARM,
    glow: true,
  })

  // Protective steel wire cage guards
  into.box([0.28, 0.12, 0.02], { at: [0, topY - 0.14, 0], colour: STEEL_DARK })
  into.box([0.02, 0.12, 0.28], { at: [0, topY - 0.14, 0], colour: STEEL_DARK })

  // Four ceiling ventilation exhaust grilles
  for (const vAngle of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const vx = Math.sin(vAngle) * 1.5
    const vz = Math.cos(vAngle) * 1.5
    into.cylinder(
      { radius: 0.14, height: 0.03, sides: 12 },
      { at: [vx, topY - 0.02, vz], colour: STEEL_GRAPHITE },
    )
  }
}
