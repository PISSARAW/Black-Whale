import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import {
  CHROME,
  CLINICAL_MINT,
  CLINICAL_WHITE,
  STEEL_DARK,
  STEEL_MEDICAL,
} from './hospitalDetailSurface'
import type { HospitalContext } from './hospitalClinicArchitecture'

function laboratoryWorkbench(into: BanquetDetailBuilder, at: Point3, length: number): void {
  const [x, floorY, z] = at
  const h = 0.92
  const depth = 1.1

  // Chemical-resistant dark epoxy worktop
  into.box([length, 0.06, depth], {
    at: [x, floorY + h - 0.03, z],
    colour: 0x1f2428,
  })
  // Lower pedestal cabinets in clean clinical white
  into.box([length - 0.1, h - 0.06, depth - 0.1], {
    at: [x, floorY + (h - 0.06) / 2, z],
    colour: CLINICAL_WHITE,
  })
  // Mint drawer accent trim
  into.box([length - 0.06, 0.06, depth + 0.02], {
    at: [x, floorY + h - 0.1, z],
    colour: CLINICAL_MINT,
  })
  // Center reagent shelf rack above the bench
  into.box([length - 0.4, 0.35, 0.28], {
    at: [x, floorY + h + 0.2, z - 0.2],
    colour: STEEL_MEDICAL,
  })
}

function compoundMicroscope(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at

  // Heavy horseshoe base
  into.box([0.16, 0.04, 0.2], { at: [x, floorY + 0.02, z], colour: STEEL_DARK })
  // Curved arm / pillar
  into.box([0.05, 0.32, 0.08], { at: [x, floorY + 0.18, z - 0.06], colour: CLINICAL_WHITE })
  // Specimen mechanical stage
  into.box([0.14, 0.02, 0.14], { at: [x, floorY + 0.16, z + 0.02], colour: 0x181c20 })
  // Rotating objective nosepiece turret
  into.cylinder({ radius: 0.035, height: 0.06, sides: 12 }, { at: [x, floorY + 0.22, z + 0.02], colour: CHROME })
  // Binocular inclined eyepieces
  into.cylinder(
    { radius: 0.015, height: 0.1, sides: 10 },
    { at: [x - 0.03, floorY + 0.34, z - 0.02], colour: STEEL_DARK, rotation: [-0.4, 0, 0] },
  )
  into.cylinder(
    { radius: 0.015, height: 0.1, sides: 10 },
    { at: [x + 0.03, floorY + 0.34, z - 0.02], colour: STEEL_DARK, rotation: [-0.4, 0, 0] },
  )
}

function centrifugeUnit(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at

  // Rounded compact centrifuge body
  into.cylinder(
    { radius: 0.22, height: 0.22, sides: 16 },
    { at: [x, floorY + 0.11, z], colour: 0x323a42 },
  )
  // Transparent dome lid
  into.sphere([0.2, 0.08, 0.2], { at: [x, floorY + 0.24, z], colour: 0x5a707a })
  // Control knob
  into.cylinder(
    { radius: 0.03, height: 0.02, sides: 12 },
    { at: [x, floorY + 0.16, z + 0.21], colour: CHROME, rotation: [Math.PI / 2, 0, 0] },
  )
}

function testTubeRack(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at

  // Acrylic rack frame
  into.box([0.34, 0.1, 0.12], { at: [x, floorY + 0.05, z], colour: 0x4a5860 })
  // 6 glass test tubes with colourful solution liquids
  const colours = [0x3182ce, 0x38a169, 0xd69e2e, 0x9f7aea, 0xe53e3e, 0x00b4d8]
  for (let i = 0; i < 6; i++) {
    const tx = x - 0.125 + i * 0.05
    into.cylinder(
      { radius: 0.012, height: 0.16, sides: 8 },
      { at: [tx, floorY + 0.1, z], colour: colours[i] },
    )
  }
}

function biologicalSafetyCabinet(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const w = 1.6
  const h = 2.2
  const d = 0.85

  // Enclosure frame
  into.box([w, h, d], {
    at: [x, floorY + h / 2, z],
    colour: STEEL_DARK,
  })
  // Internal lit working recess
  into.box([w - 0.14, 0.75, d - 0.1], {
    at: [x, floorY + 1.25, z + 0.02],
    colour: 0x1f272a,
  })
  // Glass sash viewing screen
  into.box([w - 0.14, 0.45, 0.02], {
    at: [x, floorY + 1.45, z + d / 2],
    colour: 0x6e9ea8,
  })
  // Upper HEPA exhaust filtration canopy
  into.box([w, 0.35, d + 0.06], {
    at: [x, floorY + h - 0.18, z],
    colour: CLINICAL_MINT,
  })
}

export function dressHospitalResearch(context: HospitalContext): void {
  const { into, floor } = context

  // 1. Two large laboratory workbenches
  laboratoryWorkbench(into, [-10.0, floor, 8.0], 12.0)
  laboratoryWorkbench(into, [8.0, floor, 8.0], 14.0)

  // 2. Optical microscopes on workbenches
  compoundMicroscope(into, [-13.0, floor + 0.92, 8.1])
  compoundMicroscope(into, [-8.0, floor + 0.92, 8.1])
  compoundMicroscope(into, [5.0, floor + 0.92, 8.1])
  compoundMicroscope(into, [11.0, floor + 0.92, 8.1])

  // 3. Centrifuges
  centrifugeUnit(into, [-5.5, floor + 0.92, 8.0])
  centrifugeUnit(into, [13.5, floor + 0.92, 8.0])

  // 4. Test tube racks
  testTubeRack(into, [-11.0, floor + 0.92, 8.2])
  testTubeRack(into, [7.5, floor + 0.92, 8.2])

  // 5. Biological containment safety cabinets
  biologicalSafetyCabinet(into, [-18.5, floor, 8.0])
  biologicalSafetyCabinet(into, [18.5, floor, 8.0])
}
