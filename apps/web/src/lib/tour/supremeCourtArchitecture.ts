import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import {
  COURT_BRASS,
  COURT_GOLD,
  COURT_LIGHT_DIFFUSER,
  COURT_MAHOGANY,
  COURT_WALNUT,
} from './supremeCourtDetailSurface'
import type { Space } from './types'

export interface CourtArchitectureOptions {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

interface CeilingOptions {
  into: BanquetDetailBuilder
  floor: number
  ceiling: number
}

/** Monumental coffered ceiling across the 42x28m hall */
function dressCourtCofferedCeiling(options: CeilingOptions): void {
  const { into, floor, ceiling } = options
  const topY = floor + ceiling - 0.25

  // Longitudinal primary coffer beams (spanning 41.6m from x = 80.5 to 122.5)
  for (const z of [29.5, 34.0, 38.5, 43.0, 47.5]) {
    into.box([41.6, 0.45, 0.6], { at: [101.5, topY, z], colour: COURT_WALNUT })
    into.box([41.6, 0.08, 0.72], { at: [101.5, topY - 0.22, z], colour: COURT_GOLD })
  }

  // Transverse primary coffer beams (spanning 27.6m from z = 24.5 to 52.5)
  for (const x of [86.5, 92.5, 98.5, 104.5, 110.5, 116.5]) {
    into.box([0.6, 0.45, 27.6], { at: [x, topY, 38.5], colour: COURT_WALNUT })
    into.box([0.72, 0.08, 27.6], { at: [x, topY - 0.22, 38.5], colour: COURT_GOLD })
  }

  // Perimeter dentil cornice running along all four walls at 8m
  const corniceY = floor + ceiling - 0.2
  into.box([41.8, 0.35, 0.35], { at: [101.5, corniceY, 24.7], colour: COURT_MAHOGANY })
  into.box([41.8, 0.35, 0.35], { at: [101.5, corniceY, 52.3], colour: COURT_MAHOGANY })
  into.box([0.35, 0.35, 27.8], { at: [80.7, corniceY, 38.5], colour: COURT_MAHOGANY })
  into.box([0.35, 0.35, 27.8], { at: [122.3, corniceY, 38.5], colour: COURT_MAHOGANY })
}

/** 6 Grand multi-tiered chandeliers suspended along courtroom bays */
function dressCourtChandeliers(options: CeilingOptions): void {
  const { into, floor, ceiling } = options
  const chandelierPositions: [number, number][] = [
    [91.5, 34.0],
    [103.0, 34.0],
    [114.5, 34.0],
    [91.5, 43.0],
    [103.0, 43.0],
    [114.5, 43.0],
  ]

  for (const [cx, cz] of chandelierPositions) {
    const chainTop = floor + ceiling - 0.25
    const fixtureY = floor + 5.5

    // Brass suspension chain
    into.cylinder(
      { radius: 0.02, height: chainTop - fixtureY },
      { at: [cx, (chainTop + fixtureY) / 2, cz], colour: COURT_BRASS },
    )

    // Central gilded chandelier ring and finial
    into.cylinder(
      { radius: 0.85, height: 0.12, sides: 16 },
      { at: [cx, fixtureY, cz], colour: COURT_GOLD },
    )
    into.cylinder(
      { radius: 0.55, height: 0.25, sides: 12 },
      { at: [cx, fixtureY + 0.18, cz], colour: COURT_GOLD },
    )
    into.sphere([0.16, 0.25, 0.16], { at: [cx, fixtureY - 0.15, cz], colour: COURT_GOLD })

    // 8 Candelabra arms with warm glowing diffusers
    for (let arm = 0; arm < 8; arm++) {
      const angle = (arm * Math.PI) / 4
      const armX = cx + Math.sin(angle) * 0.95
      const armZ = cz + Math.cos(angle) * 0.95

      into.cylinder(
        { radius: 0.02, height: 0.25 },
        { at: [armX, fixtureY + 0.1, armZ], colour: COURT_GOLD },
      )
      into.cylinder(
        { radius: 0.06, height: 0.08 },
        { at: [armX, fixtureY + 0.22, armZ], colour: COURT_BRASS },
      )
      into.sphere([0.08, 0.14, 0.08], {
        at: [armX, fixtureY + 0.32, armZ],
        colour: COURT_LIGHT_DIFFUSER,
        glow: true,
      })
    }
  }
}

/** Fluted classical pilasters, wainscoting and wall sconces along perimeter */
function dressCourtWallMoldings(into: BanquetDetailBuilder, floor: number): void {
  // Chair rail / dado molding along lateral walls at y = 1.2m
  into.box([41.6, 0.1, 0.12], { at: [101.5, floor + 1.2, 24.6], colour: COURT_MAHOGANY })
  into.box([41.6, 0.1, 0.12], { at: [101.5, floor + 1.2, 52.4], colour: COURT_MAHOGANY })

  // Fluted pilasters along south wall (z = 24.6)
  for (let x = 86.5; x <= 118.5; x += 6.0) {
    dressPilaster(into, [x, floor, 24.65], 0)
  }

  // Fluted pilasters along north wall (z = 52.4)
  for (let x = 86.5; x <= 118.5; x += 6.0) {
    dressPilaster(into, [x, floor, 52.35], Math.PI)
  }

  // Fluted pilasters on the east wall flanking the magistrate's dais
  for (const z of [29.5, 47.5]) {
    dressPilaster(into, [122.35, floor, z], -Math.PI / 2)
  }
}

/** Single fluted pilaster with base, shaft, capital and brass twin sconce */
function dressPilaster(
  into: BanquetDetailBuilder,
  [x, floor, z]: [number, number, number],
  _rotation: number,
): void {
  // Molded plinth base
  into.box([0.85, 0.4, 0.2], { at: [x, floor + 0.2, z], colour: COURT_WALNUT })
  // Fluted pilaster shaft (height 7.2m)
  into.box([0.7, 7.0, 0.12], { at: [x, floor + 3.9, z], colour: COURT_MAHOGANY })
  // Corinthian capital block
  into.box([0.88, 0.4, 0.22], { at: [x, floor + 7.6, z], colour: COURT_GOLD })

  // Twin-branch brass wall sconce at eye level
  into.box([0.16, 0.35, 0.05], { at: [x, floor + 3.2, z], colour: COURT_BRASS })
  for (const side of [-0.14, 0.14]) {
    into.cylinder(
      { radius: 0.015, height: 0.16 },
      { at: [x + side, floor + 3.3, z], colour: COURT_BRASS },
    )
    into.sphere([0.06, 0.09, 0.06], {
      at: [x + side, floor + 3.42, z],
      colour: COURT_LIGHT_DIFFUSER,
      glow: true,
    })
  }
}

/** Grand double entrance portal on west wall (x = 80.5) */
function dressEntrancePortal(into: BanquetDetailBuilder, floor: number): void {
  const doorX = 80.6
  const doorZ = 38.5

  // Monumental carved architrave framing
  into.box([0.25, 4.6, 4.4], { at: [doorX, floor + 2.3, doorZ], colour: COURT_WALNUT })
  // Sculpted triangular pediment atop the door
  into.box([0.3, 0.5, 4.6], { at: [doorX, floor + 4.75, doorZ], colour: COURT_GOLD })

  // Double mahogany doors with recessed panels
  into.box([0.12, 4.0, 1.8], {
    at: [doorX + 0.05, floor + 2.0, doorZ - 0.95],
    colour: COURT_MAHOGANY,
  })
  into.box([0.12, 4.0, 1.8], {
    at: [doorX + 0.05, floor + 2.0, doorZ + 0.95],
    colour: COURT_MAHOGANY,
  })

  // Brass door handles
  into.cylinder(
    { radius: 0.02, height: 0.4 },
    { at: [doorX + 0.12, floor + 1.8, doorZ - 0.12], colour: COURT_BRASS },
  )
  into.cylinder(
    { radius: 0.02, height: 0.4 },
    { at: [doorX + 0.12, floor + 1.8, doorZ + 0.12], colour: COURT_BRASS },
  )
}

/** Complete architecture of the monumental Supreme Court */
export function dressSupremeCourtArchitecture(options: CourtArchitectureOptions): void {
  const { into, plan, space } = options
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)

  dressCourtCofferedCeiling({ into, floor, ceiling })
  dressCourtChandeliers({ into, floor, ceiling })
  dressCourtWallMoldings(into, floor)
  dressEntrancePortal(into, floor)
}
