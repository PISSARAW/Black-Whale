import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Space, Structure } from './types'
import {
  BED_BLANKET,
  BED_FRAME,
  BED_SHEET,
  CART_RED,
  CHROME,
  CLINICAL_MINT,
  CLINICAL_TEAL,
  CLINICAL_WHITE,
  FLUID_CLEAR,
  MONITOR_ECG_GREEN,
  MONITOR_FRAME,
  STEEL_DARK,
  STEEL_MEDICAL,
} from './hospitalDetailSurface'

export interface HospitalContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
  structures: Structure[]
}

function hospitalBed(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size

  // Tubular bed frame
  into.box([w, 0.08, d], {
    at: [x, floor + 0.32, z],
    colour: BED_FRAME,
  })
  // Headboard and footboard
  into.box([0.08, 0.65, d], {
    at: [x - w / 2 + 0.04, floor + 0.45, z],
    colour: BED_FRAME,
  })
  into.box([0.08, 0.45, d], {
    at: [x + w / 2 - 0.04, floor + 0.35, z],
    colour: BED_FRAME,
  })
  // Four wheeled caster legs
  for (const dx of [-w / 2 + 0.12, w / 2 - 0.12]) {
    for (const dz of [-d / 2 + 0.1, d / 2 - 0.1]) {
      into.cylinder(
        { radius: 0.035, height: 0.28, sides: 10 },
        { at: [x + dx, floor + 0.14, z + dz], colour: STEEL_MEDICAL },
      )
    }
  }

  // Clinical mattress and white fitted sheet
  into.box([w - 0.16, 0.18, d - 0.08], {
    at: [x + 0.02, floor + 0.45, z],
    colour: BED_SHEET,
  })
  // Raised patient pillow
  into.box([0.45, 0.12, d - 0.2], {
    at: [x - w / 2 + 0.32, floor + 0.58, z],
    colour: CLINICAL_WHITE,
  })
  // Teal folded hospital blanket on the foot
  into.box([0.75, 0.04, d - 0.06], {
    at: [x + w / 2 - 0.45, floor + 0.56, z],
    colour: BED_BLANKET,
  })

  // IV drip stand beside the bed
  const ivX = x - w / 2 + 0.15
  const ivZ = z + d / 2 + 0.25
  into.cylinder({ radius: 0.016, height: 1.85, sides: 10 }, { at: [ivX, floor + 0.925, ivZ], colour: CHROME })
  into.cylinder({ radius: 0.22, height: 0.04, sides: 12 }, { at: [ivX, floor + 0.05, ivZ], colour: CHROME })
  // Dual top hooks
  into.box([0.22, 0.02, 0.04], { at: [ivX, floor + 1.84, ivZ], colour: CHROME })
  // Saline infusion bag
  into.box([0.1, 0.2, 0.04], { at: [ivX - 0.06, floor + 1.7, ivZ], colour: FLUID_CLEAR })
  // Hanging IV drip tubing
  into.curve(
    [
      [ivX - 0.06, floor + 1.6, ivZ],
      [ivX - 0.04, floor + 1.1, ivZ - 0.08],
      [x, floor + 0.55, z + d / 2],
    ],
    0.008,
    { at: [0, 0, 0], colour: CHROME },
  )

  // Bedside vital signs ECG monitor on articulated arm
  const monX = x - w / 2 + 0.05
  const monZ = z - d / 2 - 0.22
  into.cylinder({ radius: 0.02, height: 1.35, sides: 10 }, { at: [monX, floor + 0.675, monZ], colour: CHROME })
  // Monitor casing
  into.box([0.38, 0.28, 0.14], { at: [monX, floor + 1.45, monZ], colour: MONITOR_FRAME })
  // ECG display screen
  into.box([0.34, 0.24, 0.02], { at: [monX, floor + 1.45, monZ + 0.08], colour: 0x14181a })
  // Green ECG waveform bar
  into.box([0.3, 0.02, 0.03], { at: [monX, floor + 1.45, monZ + 0.085], colour: MONITOR_ECG_GREEN, glow: true })
}

function curtainTracks(into: BanquetDetailBuilder, floor: number): void {
  // Ceiling tracks for privacy curtains separating the bays
  for (const z of [-8.0, -5.0, -2.0, 1.0]) {
    into.box([4.2, 0.03, 0.03], {
      at: [-18.6, floor + 3.8, z],
      colour: STEEL_MEDICAL,
    })
    // Hanging curtain fabric drawn between beds
    into.box([3.8, 2.5, 0.04], {
      at: [-18.6, floor + 2.5, z],
      colour: CLINICAL_TEAL,
    })
  }
}

function nursesStation(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Main counter base
  into.box([w, h - 0.1, d], {
    at: [x, floor + (h - 0.1) / 2, z],
    colour: CLINICAL_WHITE,
  })
  // Mint decorative accent band
  into.box([w + 0.02, 0.1, d + 0.02], {
    at: [x, floor + h - 0.2, z],
    colour: CLINICAL_MINT,
  })
  // Elevated transaction ledge
  into.box([w + 0.06, 0.05, 0.35], {
    at: [x, floor + h, z + d / 2 - 0.17],
    colour: STEEL_MEDICAL,
  })
  // Inner desk surface
  into.box([w - 0.1, 0.04, d - 0.25], {
    at: [x, floor + 0.75, z - 0.1],
    colour: 0xd8e0e4,
  })

  // Desktop terminals & chart organizers
  for (const dx of [-0.9, 0.9]) {
    // Computer screen
    into.box([0.45, 0.32, 0.05], { at: [x + dx, floor + 0.98, z - 0.1], colour: MONITOR_FRAME })
    into.box([0.41, 0.28, 0.02], { at: [x + dx, floor + 0.98, z - 0.07], colour: 0x223538, glow: true })
    into.cylinder({ radius: 0.02, height: 0.16, sides: 10 }, { at: [x + dx, floor + 0.83, z - 0.1], colour: STEEL_DARK })
    into.box([0.16, 0.02, 0.14], { at: [x + dx, floor + 0.76, z - 0.1], colour: STEEL_DARK })
  }
  // Medical chart binder rack
  into.box([0.65, 0.22, 0.25], { at: [x, floor + 0.86, z - 0.1], colour: 0x4a5d62 })
}

function emergencyCrashCart(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const h = 1.05

  // Red cart frame
  into.box([0.72, h, 0.52], {
    at: [x, floorY + h / 2, z],
    colour: CART_RED,
  })
  // Stainless top work surface
  into.box([0.76, 0.04, 0.56], {
    at: [x, floorY + h + 0.02, z],
    colour: STEEL_MEDICAL,
  })
  // Drawers with handles
  for (let i = 0; i < 4; i++) {
    const drawY = floorY + 0.2 + i * 0.22
    into.box([0.64, 0.18, 0.02], { at: [x, drawY, z + 0.27], colour: 0xe0e6eb })
    into.box([0.18, 0.03, 0.03], { at: [x, drawY, z + 0.29], colour: CHROME })
  }
  // Defibrillator unit on top
  into.box([0.34, 0.2, 0.26], {
    at: [x - 0.14, floorY + h + 0.14, z],
    colour: 0x252e34,
  })
  into.box([0.18, 0.12, 0.02], {
    at: [x - 0.14, floorY + h + 0.15, z + 0.14],
    colour: MONITOR_ECG_GREEN,
    glow: true,
  })
  // Four caster wheels
  for (const dx of [-0.3, 0.3]) {
    for (const dz of [-0.22, 0.22]) {
      into.cylinder({ radius: 0.04, height: 0.08, sides: 10 }, { at: [x + dx, floorY + 0.04, z + dz], colour: STEEL_DARK })
    }
  }
}

export function dressHospitalClinic(context: HospitalContext): void {
  const { into, floor, structures } = context

  // 1. Patient ward beds
  const beds = structures.filter((s) => s.id.includes('ward-bed'))
  for (const bed of beds) {
    hospitalBed(into, bed, floor)
  }

  // 2. Extra ward beds to furnish the wide clinic floor
  const extraBedY = [-9.5, -6.5, -3.5, -0.5]
  for (const ez of extraBedY) {
    hospitalBed(
      into,
      {
        id: `extra-clinic-bed-${ez}`,
        spaceId: 'tier-3-central-hospital-clinic',
        kind: 'bed',
        name: 'Clinic Bed',
        nameFr: 'Lit de clinique',
        at: [-13.5, ez],
        size: [2.1, 1],
        rotation: 0,
        base: 0,
        height: 0.6,
        sides: null,
        provenance: 'plan',
        source: 'Central Hospital plan',
        sourceFr: "Plan de l'hôpital central",
      },
      floor,
    )
  }

  // 3. Privacy curtains
  curtainTracks(into, floor)

  // 4. Nurses' station
  const station = structures.find((s) => s.id.includes('nurses-station'))
  if (station) {
    nursesStation(into, station, floor)
  }

  // 5. Emergency crash carts
  emergencyCrashCart(into, [0.5, floor, -4.5])
  emergencyCrashCart(into, [-7.5, floor, 1.5])
}
