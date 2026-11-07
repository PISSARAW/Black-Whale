import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

const MAHOGANY = 0x3a1f18
const DOOR_PANEL = 0x2e1812
const BRONZE = 0x72604c
const GOLD = 0xd4af37
const STEEL = 0x889098
const LUMEN_WARM = 0xfef5e0
const CARPET_RED = 0x7a1818
const GUARD_COAT = 0x283830
const GUARD_CAP = 0x1e2824
const GUARD_SKIN = 0xd0b49f
const GUN_METAL = 0x2e3236

interface ApproachContext {
  into: BanquetDetailBuilder
  space: Space
  floor: number
}

interface DoorGeometry {
  doorX: number
  doorY: number
  sideSign: number
  isOdd: boolean
}

function resolveDoorGeometry(space: Space): DoorGeometry {
  const xs = space.footprint.map(([x]) => x)
  const ys = space.footprint.map(([, y]) => y)
  const minX = Math.min(...xs),
    maxX = Math.max(...xs)
  const minY = Math.min(...ys),
    maxY = Math.max(...ys)
  const doorX = (minX + maxX) / 2
  const isOdd = (minY + maxY) / 2 < 0
  const sideSign = isOdd ? 1 : -1
  const doorY = isOdd ? maxY : minY
  return { doorX, doorY, sideSign, isOdd }
}

function royalDoubleDoor(into: BanquetDetailBuilder, floor: number, geom: DoorGeometry): void {
  const { doorX, doorY, sideSign } = geom
  const doorZ = doorY + sideSign * 0.06

  // Double door body
  into.box([1.8, 2.6, 0.1], {
    at: [doorX, floor + 1.3, doorZ],
    colour: MAHOGANY,
  })

  // Moulded classical architrave frame
  into.box([2.04, 2.72, 0.14], {
    at: [doorX, floor + 1.36, doorZ],
    colour: BRONZE,
  })

  // Recessed panels on the two leaves
  for (const leafX of [doorX - 0.44, doorX + 0.44]) {
    for (const panelY of [floor + 0.65, floor + 1.85]) {
      into.box([0.62, 0.95, 0.12], {
        at: [leafX, panelY, doorZ],
        colour: DOOR_PANEL,
      })
      into.box([0.56, 0.89, 0.13], {
        at: [leafX, panelY, doorZ],
        colour: BRONZE,
      })
    }
  }

  // Brass handles at center
  for (const handleX of [doorX - 0.08, doorX + 0.08]) {
    into.box([0.03, 0.22, 0.06], {
      at: [handleX, floor + 1.15, doorZ + sideSign * 0.08],
      colour: GOLD,
    })
  }
}

function doorEntablatureAndPlaque(
  into: BanquetDetailBuilder,
  floor: number,
  geom: DoorGeometry,
): void {
  const { doorX, doorY, sideSign } = geom
  const doorZ = doorY + sideSign * 0.06

  // Classical pediment above door
  into.box([2.2, 0.24, 0.18], {
    at: [doorX, floor + 2.76, doorZ],
    colour: BRONZE,
  })

  // Gold prince numeral plaque
  into.box([0.65, 0.24, 0.05], {
    at: [doorX, floor + 3.02, doorZ + sideSign * 0.04],
    colour: GOLD,
  })
  into.box([0.59, 0.18, 0.06], {
    at: [doorX, floor + 3.02, doorZ + sideSign * 0.04],
    colour: 0x111111,
  })

  // Flanking ceremonial sconces
  for (const sconceX of [doorX - 1.25, doorX + 1.25]) {
    into.cylinder(
      { radius: 0.08, height: 0.16 },
      {
        at: [sconceX, floor + 2.1, doorZ + sideSign * 0.12],
        colour: LUMEN_WARM,
        glow: true,
      },
    )
    into.box([0.08, 0.22, 0.04], {
      at: [sconceX, floor + 2.05, doorZ + sideSign * 0.05],
      colour: BRONZE,
    })
  }
}

function approachSecurityAndRunner(
  into: BanquetDetailBuilder,
  floor: number,
  geom: DoorGeometry,
): void {
  const { doorX, doorY, sideSign } = geom
  const doorZ = doorY + sideSign * 0.06

  // Biometric access console and intercom on right wall
  const consoleX = doorX + (geom.isOdd ? 1.15 : -1.15)
  into.box([0.18, 0.32, 0.08], {
    at: [consoleX, floor + 1.35, doorZ + sideSign * 0.08],
    colour: STEEL,
  })
  into.box([0.12, 0.12, 0.09], {
    at: [consoleX, floor + 1.4, doorZ + sideSign * 0.08],
    colour: 0x28a745,
    glow: true,
  })

  // Red runner carpet along approach to corridor
  const runnerLength = 3.0
  const runnerCenterY = doorY - sideSign * (runnerLength / 2)
  into.box([1.4, 0.015, runnerLength], {
    at: [doorX, floor + 0.008, runnerCenterY],
    colour: CARPET_RED,
  })
  for (const bx of [doorX - 0.68, doorX + 0.68]) {
    into.box([0.04, 0.018, runnerLength], {
      at: [bx, floor + 0.01, runnerCenterY],
      colour: GOLD,
    })
  }
}

function approachBodyguard(into: BanquetDetailBuilder, floor: number, geom: DoorGeometry): void {
  const { doorX, doorY, sideSign } = geom
  const guardX = doorX - (geom.isOdd ? 1.45 : -1.45)
  const guardY = doorY - sideSign * 1.1

  // Guard legs, coat, head, cap and weapon
  into.box([0.22, 0.76, 0.32], {
    at: [guardX, floor + 0.38, guardY],
    colour: GUARD_COAT,
  })
  into.box([0.24, 0.62, 0.42], {
    at: [guardX, floor + 1.05, guardY],
    colour: GUARD_COAT,
  })
  into.box([0.26, 0.04, 0.46], {
    at: [guardX, floor + 1.34, guardY],
    colour: GOLD,
  })
  into.box([0.16, 0.18, 0.16], {
    at: [guardX, floor + 1.48, guardY],
    colour: GUARD_SKIN,
  })
  into.box([0.2, 0.09, 0.2], {
    at: [guardX, floor + 1.6, guardY],
    colour: GUARD_CAP,
  })
  into.box([0.05, 1.25, 0.04], {
    at: [guardX + 0.1, floor + 0.625, guardY + 0.22],
    colour: GUN_METAL,
  })
}

export function dressApartmentEntrance(context: ApproachContext): void {
  const { into, space, floor } = context
  const geom = resolveDoorGeometry(space)
  royalDoubleDoor(into, floor, geom)
  doorEntablatureAndPlaque(into, floor, geom)
  approachSecurityAndRunner(into, floor, geom)
  approachBodyguard(into, floor, geom)
}
