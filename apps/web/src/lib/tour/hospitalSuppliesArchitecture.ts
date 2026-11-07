import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'
import {
  CART_RED,
  CHROME,
  CLINICAL_WHITE,
  OXYGEN_GREEN,
  STEEL_DARK,
  STEEL_MEDICAL,
} from './hospitalDetailSurface'
import type { HospitalContext } from './hospitalClinicArchitecture'

function industrialSupplyShelving(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Upright steel posts
  const posts = 6
  for (let p = 0; p < posts; p++) {
    const postX = x - w / 2 + (p / (posts - 1)) * w
    into.box([0.06, h, d], {
      at: [postX, floor + h / 2, z],
      colour: STEEL_DARK,
    })
  }

  // 5 tiers of heavy shelving
  const tiers = 5
  for (let t = 0; t < tiers; t++) {
    const shelfY = floor + 0.15 + t * (h / tiers)
    into.box([w, 0.04, d], {
      at: [x, shelfY, z],
      colour: STEEL_MEDICAL,
    })

    // Boxes, cartons and supply containers along the shelf
    const items = 10
    for (let i = 0; i < items; i++) {
      const itemX = x - w / 2 + 0.5 + i * (w / items)
      // Alternating medicine box sizes
      const boxW = i % 3 === 0 ? 0.6 : 0.45
      const boxH = i % 2 === 0 ? 0.32 : 0.24
      into.box([boxW, boxH, d * 0.75], {
        at: [itemX, shelfY + boxH / 2 + 0.02, z],
        colour: i % 2 === 0 ? CLINICAL_WHITE : 0xced6dc,
      })
    }
  }
}

function oxygenCylinderBank(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const count = 6

  // Wall support rail
  into.box([count * 0.42, 0.06, 0.06], {
    at: [x + (count * 0.42) / 2 - 0.2, floorY + 1.1, z - 0.12],
    colour: STEEL_DARK,
  })

  // Green pressurized gas cylinders
  for (let i = 0; i < count; i++) {
    const cylX = x + i * 0.42
    // Cylinder body
    into.cylinder(
      { radius: 0.12, height: 1.35, sides: 16 },
      { at: [cylX, floorY + 0.68, z], colour: OXYGEN_GREEN },
    )
    // Dome top
    into.sphere([0.12, 0.1, 0.12], { at: [cylX, floorY + 1.35, z], colour: OXYGEN_GREEN })
    // Brass top valve and twin pressure gauges
    into.box([0.06, 0.14, 0.06], { at: [cylX, floorY + 1.48, z], colour: 0xc8a462 })
    into.cylinder(
      { radius: 0.035, height: 0.02, sides: 12 },
      { at: [cylX + 0.05, floorY + 1.48, z + 0.04], colour: CHROME, rotation: [Math.PI / 2, 0, 0] },
    )
  }
}

function lockedPoisonCabinet(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const h = 1.95
  const w = 1.2
  const d = 0.55

  // Heavy steel cabinet body
  into.box([w, h, d], {
    at: [x, floorY + h / 2, z],
    colour: 0x3b444c,
  })
  // Lockable doors
  into.box([w - 0.08, h - 0.1, 0.03], {
    at: [x, floorY + h / 2, z + d / 2 + 0.01],
    colour: 0x47515a,
  })
  // Red warning diamond placard
  into.box([0.22, 0.22, 0.01], {
    at: [x, floorY + 1.35, z + d / 2 + 0.03],
    rotation: [0, 0, Math.PI / 4],
    colour: CART_RED,
  })
  // Chrome security handle and keyhole clasp
  into.box([0.04, 0.16, 0.04], {
    at: [x + 0.08, floorY + 0.95, z + d / 2 + 0.03],
    colour: CHROME,
  })
}

function palletStack(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at

  // Wooden transport pallet
  into.box([1.2, 0.14, 1.0], {
    at: [x, floorY + 0.07, z],
    colour: 0x6e5842,
  })
  // Stacked medical supply crates wrapped for transport
  into.box([1.1, 0.85, 0.9], {
    at: [x, floorY + 0.58, z],
    colour: 0xdde4ea,
  })
}

export function dressHospitalSupplies(context: HospitalContext): void {
  const { into, floor, structures } = context

  // 1. Long industrial supply shelving units
  const shelves = structures.filter((s) => s.id.includes('shelving'))
  for (const shelf of shelves) {
    industrialSupplyShelving(into, shelf, floor)
  }

  // 2. Medical oxygen cylinder bank along the wall
  oxygenCylinderBank(into, [7.5, floor, -4.8])

  // 3. Locked hazardous poison cabinet for Gel's pharmacopeia
  lockedPoisonCabinet(into, [19.8, floor, -8.0])

  // 4. Staged supply transport pallets
  palletStack(into, [7.5, floor, -10.5])
  palletStack(into, [19.2, floor, -10.5])
}
