import { floorOf } from './blueprint'
import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { ArchitectureOptions } from './justiceBureauArchitecture'
import {
  JUSTICE_GLASS,
  JUSTICE_OAK,
  JUSTICE_STEEL,
  JUSTICE_STONE,
  JUSTICE_WOOD,
} from './justiceBureauDetailSurface'

export const VISITATION_LAYOUT = {
  partition: { at: [9.8, 5.55], size: [14.6, 0.65] },
  visitorStools: [
    [7.8, 4.05],
    [12, 4.05],
  ],
  secureChair: [10, 7.25],
  clerkDesk: [5.8, 9.35],
  clerkChair: [5.8, 10.55],
  sideCabinet: [1.3, 8.55],
} as const

const FRAME = 0x4a5155
const SEAT = 0x343a3d

function dressRoundStool(
  into: BanquetDetailBuilder,
  floor: number,
  at: readonly [number, number],
): void {
  const [x, z] = at
  into.cylinder(
    { radius: 0.31, height: 0.12, sides: 20 },
    {
      at: [x, floor + 0.62, z],
      colour: SEAT,
    },
  )
  into.cylinder(
    { radius: 0.06, height: 0.48, sides: 12 },
    {
      at: [x, floor + 0.34, z],
      colour: JUSTICE_STEEL,
    },
  )
  into.cylinder(
    { radius: 0.28, height: 0.05, sides: 20 },
    {
      at: [x, floor + 0.025, z],
      colour: JUSTICE_STEEL,
    },
  )
}

function dressSwivelChair(
  into: BanquetDetailBuilder,
  floor: number,
  at: readonly [number, number],
): void {
  const [x, z] = at
  into.box([0.62, 0.12, 0.58], { at: [x, floor + 0.58, z], colour: SEAT })
  into.box([0.62, 0.72, 0.12], { at: [x, floor + 0.93, z + 0.24], colour: SEAT })
  into.cylinder(
    { radius: 0.055, height: 0.46, sides: 10 },
    {
      at: [x, floor + 0.31, z],
      colour: JUSTICE_STEEL,
    },
  )
  for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const dx = Math.cos(angle) * 0.27
    const dz = Math.sin(angle) * 0.27
    into.box([Math.abs(dx) + 0.08, 0.04, Math.abs(dz) + 0.08], {
      at: [x + dx / 2, floor + 0.08, z + dz / 2],
      colour: JUSTICE_STEEL,
    })
  }
}

function dressMainGlazing(into: BanquetDetailBuilder, floor: number): void {
  const z = VISITATION_LAYOUT.partition.at[1]
  const frameXs = [2.5, 7.35, 12.2, 17.1]
  into.box([14.6, 0.78, 0.58], { at: [9.8, floor + 0.39, z], colour: JUSTICE_STONE })
  into.box([14.75, 0.09, 0.76], { at: [9.8, floor + 0.825, z], colour: JUSTICE_OAK })

  for (let index = 0; index < frameXs.length - 1; index++) {
    const left = frameXs[index]
    const right = frameXs[index + 1]
    const centre = (left + right) / 2
    into.box([right - left - 0.16, 2.28, 0.035], {
      at: [centre, floor + 2.02, z],
      colour: JUSTICE_GLASS,
      glass: true,
    })
  }
  for (const x of frameXs) {
    into.box([0.09, 2.42, 0.11], { at: [x, floor + 2.03, z], colour: FRAME })
  }
  into.box([14.75, 0.1, 0.11], { at: [9.8, floor + 3.23, z], colour: FRAME })
}

function dressGlassReturn(into: BanquetDetailBuilder, floor: number, x: number): void {
  const centres = [6.98, 9.84]
  for (const z of centres) {
    into.box([0.035, 2.28, 2.72], {
      at: [x, floor + 2.02, z],
      colour: JUSTICE_GLASS,
      glass: true,
    })
  }
  for (const z of [5.55, 8.41, 11.27]) {
    into.box([0.11, 2.42, 0.09], { at: [x, floor + 2.03, z], colour: FRAME })
  }
  into.box([0.11, 0.1, 5.72], { at: [x, floor + 3.23, 8.41], colour: FRAME })
}

function dressClerkStation(into: BanquetDetailBuilder, floor: number): void {
  const [x, z] = VISITATION_LAYOUT.clerkDesk
  into.box([2.5, 0.12, 1.1], { at: [x, floor + 0.76, z], colour: JUSTICE_OAK })
  for (const dx of [-1.05, 1.05]) {
    into.box([0.12, 0.7, 0.12], { at: [x + dx, floor + 0.35, z - 0.42], colour: JUSTICE_WOOD })
    into.box([0.12, 0.7, 0.12], { at: [x + dx, floor + 0.35, z + 0.42], colour: JUSTICE_WOOD })
  }
  into.box([0.62, 0.06, 0.42], { at: [x - 0.45, floor + 0.85, z], colour: 0xd6d1c4 })
  dressSwivelChair(into, floor, VISITATION_LAYOUT.clerkChair)
}

function dressSideCabinet(into: BanquetDetailBuilder, floor: number): void {
  const [x, z] = VISITATION_LAYOUT.sideCabinet
  into.box([0.55, 0.92, 5.0], { at: [x, floor + 0.46, z], colour: JUSTICE_STONE })
  for (const drawerZ of [6.65, 7.6, 8.55, 9.5, 10.45]) {
    into.box([0.025, 0.68, 0.78], { at: [x - 0.29, floor + 0.5, drawerZ], colour: JUSTICE_OAK })
    into.box([0.035, 0.05, 0.22], { at: [x - 0.32, floor + 0.52, drawerZ], colour: FRAME })
  }
}

function dressRearWall(into: BanquetDetailBuilder, floor: number): void {
  into.box([10.2, 0.1, 0.06], { at: [12.9, floor + 3.14, 12.13], colour: FRAME })
  into.box([10.2, 2.1, 0.025], {
    at: [12.9, floor + 2.05, 12.12],
    colour: 0xc9c5b9,
  })
  into.box([0.11, 2.25, 0.09], { at: [7.8, floor + 2.03, 12.1], colour: FRAME })
  into.box([0.11, 2.25, 0.09], { at: [18, floor + 2.03, 12.1], colour: FRAME })

  into.box([2.15, 2.9, 0.08], { at: [3.65, floor + 1.45, 12.08], colour: JUSTICE_STONE })
  into.box([1.92, 2.68, 0.04], { at: [3.65, floor + 1.34, 12.03], colour: 0x8e8d87 })
  into.cylinder(
    { radius: 0.055, height: 0.05, sides: 12 },
    {
      at: [4.42, floor + 1.25, 11.98],
      rotation: [Math.PI / 2, 0, 0],
      colour: FRAME,
    },
  )
}

function dressCeilingLights(into: BanquetDetailBuilder, floor: number): void {
  for (const x of [5.4, 10.5, 15.6]) {
    for (const z of [1.1, 10.6]) {
      const at: Point3 = [x, floor + 3.84, z]
      into.box([2.35, 0.05, 0.26], { at, colour: 0xf5f0d7, glow: true })
      into.box([2.5, 0.08, 0.38], { at: [x, floor + 3.88, z], colour: FRAME })
    }
  }
}

/** Ch. 400 visitation room: one open L-shaped glazed enclosure, not booth rows. */
export function dressVisitationArchitecture(options: ArchitectureOptions): void {
  const { into, space, plan } = options
  const floor = floorOf(space, plan.tier)
  dressMainGlazing(into, floor)
  dressGlassReturn(into, floor, 2.5)
  dressGlassReturn(into, floor, 17.1)
  for (const at of VISITATION_LAYOUT.visitorStools) dressRoundStool(into, floor, at)
  dressSwivelChair(into, floor, VISITATION_LAYOUT.secureChair)
  dressClerkStation(into, floor)
  dressSideCabinet(into, floor)
  dressRearWall(into, floor)
  dressCeilingLights(into, floor)
}
