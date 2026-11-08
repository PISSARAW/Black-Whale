import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

const BRONZE = 0x72604c
const GOLD = 0xd4af37
const STEEL = 0x889098
const LUMEN_WARM = 0xfef5e0
const CARPET_RED = 0x7a1818

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

export function dressApartmentEntrance(context: ApproachContext): void {
  const { into, space, floor } = context
  const geom = resolveDoorGeometry(space)
  doorEntablatureAndPlaque(into, floor, geom)
  approachSecurityAndRunner(into, floor, geom)
}
