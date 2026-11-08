import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  COURT_BRASS,
  COURT_GOLD,
  COURT_MAHOGANY,
  COURT_SEAL_BLUE,
  COURT_WALNUT,
} from './supremeCourtDetailSurface'

export interface SealOptions {
  into: BanquetDetailBuilder
  floor: number
}

/**
 * High-detail 3D relief of the Supreme Court Seal (ch. 371).
 * Features a 16-sided faceted disc, lapis-lazuli field, gold laurel wreath and the scales of justice.
 */
export function dressSupremeCourtSeal(options: SealOptions): void {
  const { into, floor } = options
  const sealX = 122.3
  const sealZ = 38.5
  const sealY = floor + 4.8 // Center of seal on east wall above Cleapatro's bench

  // Backing wall wood panelling frame
  into.box([0.1, 4.2, 4.2], { at: [sealX - 0.05, sealY, sealZ], colour: COURT_WALNUT })
  into.box([0.12, 4.4, 0.16], { at: [sealX - 0.04, sealY, sealZ - 2.1], colour: COURT_MAHOGANY })
  into.box([0.12, 4.4, 0.16], { at: [sealX - 0.04, sealY, sealZ + 2.1], colour: COURT_MAHOGANY })
  into.box([0.12, 0.16, 4.4], { at: [sealX - 0.04, sealY + 2.1, sealZ], colour: COURT_MAHOGANY })
  into.box([0.12, 0.16, 4.4], { at: [sealX - 0.04, sealY - 2.1, sealZ], colour: COURT_MAHOGANY })

  // 16-sided outer relief ring in polished gold (radius 1.5m)
  into.cylinder(
    { radius: 1.5, bottom: 1.5, height: 0.12, sides: 16 },
    { at: [sealX, sealY, sealZ], rotation: [0, 0, Math.PI / 2], colour: COURT_GOLD },
  )

  // Inner beveled rim in brass (radius 1.35m)
  into.cylinder(
    { radius: 1.35, bottom: 1.35, height: 0.14, sides: 16 },
    { at: [sealX + 0.01, sealY, sealZ], rotation: [0, 0, Math.PI / 2], colour: COURT_BRASS },
  )

  // Recessed enamel field in deep lapis-lazuli blue
  into.cylinder(
    { radius: 1.25, bottom: 1.25, height: 0.16, sides: 32 },
    { at: [sealX + 0.02, sealY, sealZ], rotation: [0, 0, Math.PI / 2], colour: COURT_SEAL_BLUE },
  )

  // Gilded laurel wreath along inner circumference (12 paired leaf clusters)
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6
    const ly = sealY + Math.sin(angle) * 1.05
    const lz = sealZ + Math.cos(angle) * 1.05
    into.box([0.04, 0.16, 0.08], {
      at: [sealX + 0.1, ly, lz],
      rotation: [angle, 0, 0],
      colour: COURT_GOLD,
    })
  }

  // Central Scales of Justice (Balance de la justice)
  // Vertical column post
  into.cylinder(
    { radius: 0.03, height: 1.3 },
    { at: [sealX + 0.11, sealY, sealZ], colour: COURT_GOLD },
  )
  into.sphere([0.07, 0.07, 0.07], { at: [sealX + 0.12, sealY + 0.68, sealZ], colour: COURT_GOLD })

  // Horizontal balancing beam
  into.box([0.04, 0.04, 1.2], { at: [sealX + 0.11, sealY + 0.48, sealZ], colour: COURT_GOLD })

  // Left & right suspension strings and weighing pans
  for (const side of [-0.5, 0.5]) {
    const panZ = sealZ + side
    // Twin diagonal strings
    into.cylinder(
      { radius: 0.008, height: 0.42 },
      { at: [sealX + 0.11, sealY + 0.28, panZ], colour: COURT_BRASS },
    )
    // Shallow weighing pan
    into.cylinder(
      { radius: 0.18, height: 0.03, sides: 12 },
      { at: [sealX + 0.12, sealY + 0.06, panZ], colour: COURT_GOLD },
    )
  }

  // Royal Sunburst Crest at top of seal
  into.sphere([0.08, 0.1, 0.08], { at: [sealX + 0.12, sealY + 1.25, sealZ], colour: COURT_GOLD })
  for (let ray = -3; ray <= 3; ray++) {
    const rAngle = (ray * Math.PI) / 16
    into.box([0.03, 0.18, 0.02], {
      at: [sealX + 0.12, sealY + 1.38 + Math.cos(rAngle) * 0.08, sealZ + Math.sin(rAngle) * 0.25],
      rotation: [rAngle, 0, 0],
      colour: COURT_GOLD,
    })
  }
}
