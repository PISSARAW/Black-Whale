import type * as Three from 'three'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { chandelier } from './banquetArchitecture'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { lampsOf, lamplightOf } from './light'
import { CASINO_SPACE } from './casinoLayout'
import type { Structure } from './types'

const STONE = 0xc9c5b5,
  PALE = 0xe1dac5,
  GOLD = 0xa48b58,
  INSET = 0x636761
interface Context {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
}

function ceiling(context: Context, floor: number): void {
  const { into, plan, THREE } = context
  const space = plan.spaces.find(({ id }) => id === CASINO_SPACE)!
  const light = lamplightOf(space, plan.tier)
  const y = floor + ceilingOf(space, plan.tier)
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  for (const [x, z] of lampsOf(space.footprint, light)) {
    const margin = Math.min(
      x - Math.min(...xs),
      Math.max(...xs) - x,
      z - Math.min(...zs),
      Math.max(...zs) - z,
    )
    const span = Math.min(light.spacing * 0.86, margin * 1.8)
    into.box([span - 0.1, 0.045, span - 0.1], { at: [x, y - 0.035, z], colour: STONE })
    for (const side of [-1, 1]) {
      into.box([span, 0.16, 0.12], { at: [x, y - 0.12, z + (side * span) / 2], colour: PALE })
      into.box([0.12, 0.16, span], { at: [x + (side * span) / 2, y - 0.12, z], colour: PALE })
      into.box([span - 0.45, 0.045, 0.045], {
        at: [x, y - 0.07, z + side * (span / 2 - 0.2)],
        colour: GOLD,
      })
      into.box([0.045, 0.045, span - 0.45], {
        at: [x + side * (span / 2 - 0.2), y - 0.07, z],
        colour: GOLD,
      })
    }
    if (margin >= 1) chandelier({ THREE, into, at: [x, y - 0.24, z] })
  }
}

function gallery(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [x, z] = structure.at,
    [width, length] = structure.size
  const inward = x < -49 ? 1 : -1,
    front = x + (inward * width) / 2,
    y = floor + structure.base
  into.box([width, 0.035, length], { at: [x, y - 0.018, z], colour: PALE })
  into.box([0.025, structure.height, length], {
    at: [front + inward * 0.014, y + structure.height / 2, z],
    colour: STONE,
  })
  for (const offset of [0.02, structure.height - 0.04]) {
    into.box([0.045, 0.055, length], { at: [front + inward * 0.025, y + offset, z], colour: GOLD })
  }
}

/** Stepped squares on the pale parapet behind the machines in ch. 420. */
function parapet(into: BanquetDetailBuilder, rail: Structure, floor: number): void {
  const inward = rail.at[0] < -49 ? 1 : -1
  const x = rail.at[0] + inward * (rail.size[0] / 2 + 0.012),
    y = floor + rail.base,
    length = rail.size[1]
  for (const height of [0.05, rail.height - 0.04]) {
    into.box([0.04, 0.045, length], { at: [x, y + height, rail.at[1]], colour: GOLD })
  }
  const bays = Math.floor(length / 2.3)
  for (let index = 0; index < bays; index++) {
    const z = rail.at[1] - length / 2 + ((index + 0.5) * length) / bays
    into.box([0.025, 0.24, 0.24], { at: [x, y + 0.52, z], colour: GOLD })
    for (const sign of [-1, 1]) {
      into.box([0.025, 0.035, 0.8], {
        at: [x, y + 0.52 + sign * 0.18, z + sign * 0.52],
        colour: INSET,
      })
      into.box([0.025, 0.36, 0.035], { at: [x, y + 0.52, z + sign * 0.91], colour: INSET })
      into.box([0.025, 0.14, 0.14], {
        at: [x, y + 0.52 - sign * 0.27, z + sign * 0.36],
        colour: GOLD,
      })
    }
  }
}

function shopfront(into: BanquetDetailBuilder, shop: Structure, floor: number): void {
  const inward = shop.at[0] < -49 ? 1 : -1
  const face = shop.at[0] + inward * (shop.size[0] / 2 + 0.015),
    base = floor + shop.base
  const bays = Math.max(1, Math.round(shop.size[1] / 3.25)),
    pitch = shop.size[1] / bays
  for (let index = 0; index < bays; index++) {
    const z = shop.at[1] - shop.size[1] / 2 + (index + 0.5) * pitch
    into.box([0.025, shop.height * 0.64, pitch - 0.2], {
      at: [face, base + shop.height * 0.49, z],
      colour: INSET,
    })
    into.box([0.04, 0.08, pitch - 0.1], {
      at: [face + inward * 0.02, base + shop.height * 0.85, z],
      colour: GOLD,
    })
    for (const sign of [-1, 1]) {
      into.box([0.07, shop.height - 0.08, 0.06], {
        at: [face, base + shop.height / 2, z + sign * (pitch / 2 - 0.06)],
        colour: PALE,
      })
    }
  }
}

function wallsAndColumns(context: Context, floor: number): void {
  const { into, plan } = context
  const space = plan.spaces.find(({ id }) => id === CASINO_SPACE)!,
    height = ceilingOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    for (const y of [0.15, 2.7, height - 0.4]) {
      into.box([run.length, 0.12, 0.1], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y }),
        rotation: [0, run.angle, 0],
        colour: PALE,
      })
    }
  }
  for (const [x, z] of plan.columns.get(CASINO_SPACE) ?? []) {
    into.cylinder(
      { radius: 0.405, height: height - 0.44, sides: 24 },
      { at: [x, floor + height / 2, z], colour: STONE },
    )
    for (const y of [0.1, 0.27, height - 0.28, height - 0.1]) {
      into.cylinder(
        { radius: 0.448, height: 0.12, sides: 24 },
        { at: [x, floor + y, z], colour: PALE },
      )
    }
  }
}

function carpet(context: Context, floor: number): void {
  const { into } = context
  for (const x of [-51.8, -46.2])
    into.box([0.04, 0.008, 51], { at: [x, floor + 0.005, 29.75], colour: GOLD })
  for (let z = 6.5; z < 55; z += 2.5) {
    for (const x of [-55, -52, -46, -43]) {
      for (const side of [-1, 1]) {
        into.ring(
          { radius: 0.32, tube: 0.008 },
          { at: [x + side * 0.22, floor + 0.012, z], rotation: [Math.PI / 2, 0, 0], colour: GOLD },
        )
      }
    }
  }
}

export function dressCasinoArchitecture(context: Context): void {
  const { plan, into } = context
  const floor = floorOf(
    plan.spaces.find(({ id }) => id === CASINO_SPACE)!,
    plan.tier,
  )
  ceiling(context, floor)
  wallsAndColumns(context, floor)
  carpet(context, floor)
  for (const structure of plan.structures.filter(({ spaceId }) => spaceId === CASINO_SPACE)) {
    if (structure.id.includes('-mezzanine-')) gallery(into, structure, floor)
    if (structure.id.includes('-balustrade-')) parapet(into, structure, floor)
    if (structure.id.includes('-shopfront-')) shopfront(into, structure, floor)
  }
}
