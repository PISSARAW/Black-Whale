import { ApartmentSurface } from './apartmentDetailSurface'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { princeBedPalette, princeNumberOf } from './princeBedroomBed'
import { appearanceOf } from './roomAppearance'
import type { Space, Structure } from './types'

interface BedroomContext {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

const isBedroom = (space: Space): boolean => /room-10(0[1-9]|1[0-4])-bedroom$/.test(space.id)

function bedRug(surface: ApartmentSurface, maxWidth: number): void {
  const palette = princeBedPalette(surface.structure.id)
  if (!palette) return
  const w = Math.min(surface.width + 1.25, maxWidth),
    d = surface.depth + 0.95
  surface.box([w, 0.018, d], [0, 0.012, 0.12], palette.accent)
  surface.box([w - 0.16, 0.019, d - 0.16], [0, 0.023, 0.12], palette.textile)
  surface.box([w - 0.34, 0.02, d - 0.34], [0, 0.034, 0.12], 0x85755f)
}

function footBench(surface: ApartmentSurface): void {
  const palette = princeBedPalette(surface.structure.id)
  if (!palette) return
  const width = Math.min(2.3, surface.width * 0.82)
  const z = surface.depth / 2 + 0.48
  surface.box([width, 0.13, 0.48], [0, 0.43, z], palette.textile)
  surface.box([width - 0.12, 0.055, 0.39], [0, 0.51, z], palette.accent)
  for (const x of [-width / 2 + 0.1, width / 2 - 0.1]) {
    for (const dz of [-0.14, 0.14]) {
      surface.box([0.065, 0.38, 0.065], [x, 0.2, z + dz], palette.wood)
    }
  }
}

function bedsideLamp(surface: ApartmentSurface, bedroomId: string): void {
  const palette = princeBedPalette(`${bedroomId}-bed-01`)
  if (!palette) return
  const h = surface.structure.height
  surface.cylinder({ radius: 0.13, height: 0.035 }, [0, h + 0.025, 0], palette.accent)
  surface.box([0.025, 0.31, 0.025], [0, h + 0.19, 0], palette.accent)
  surface.cylinder(
    { radius: 0.16, bottom: 0.25, height: 0.25, sides: 16 },
    [0, h + 0.42, 0],
    0xd8cfb8,
  )
  surface.sphere([0.05, 0.05, 0.05], [0, h + 0.58, 0], palette.accent)
}

function chandelier(context: BedroomContext): void {
  const { into, plan, space } = context
  const appearance = appearanceOf(space, plan.tier)
  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const x = (Math.min(...xs) + Math.max(...xs)) / 2
  const z = (Math.min(...zs) + Math.max(...zs)) / 2
  const ceiling = floorOf(space, plan.tier) + ceilingOf(space, plan.tier)
  into.cylinder(
    { radius: 0.025, height: 0.48 },
    { at: [x, ceiling - 0.28, z], colour: appearance.accent },
  )
  into.ring(
    { radius: 0.42, tube: 0.025 },
    { at: [x, ceiling - 0.58, z], rotation: [Math.PI / 2, 0, 0], colour: appearance.accent },
  )
  for (const [dx, dz] of [
    [0.36, 0],
    [-0.36, 0],
    [0, 0.36],
    [0, -0.36],
  ]) {
    into.curve(
      [
        [x, ceiling - 0.5, z],
        [x + dx * 0.55, ceiling - 0.68, z + dz * 0.55],
        [x + dx, ceiling - 0.61, z + dz],
      ],
      0.018,
      { at: [0, 0, 0], colour: appearance.accent },
    )
    into.sphere([0.08, 0.12, 0.08], {
      at: [x + dx, ceiling - 0.76, z + dz],
      colour: 0xd8d2bf,
    })
  }
  into.sphere([0.11, 0.18, 0.11], { at: [x, ceiling - 0.84, z], colour: 0xd8d2bf })
}

function find(structures: readonly Structure[], suffix: string): Structure | undefined {
  return structures.find((structure) => structure.id.endsWith(suffix))
}

/** Interpretive royal dressing around the plan-supported bed and cabinets. */
export function dressPrinceBedroomDecor(context: BedroomContext): void {
  if (!isBedroom(context.space)) return
  const structures = context.plan.structures.filter((item) => item.spaceId === context.space.id)
  const bed = find(structures, '-bedroom-bed-01')
  if (!bed || princeNumberOf(bed.id) === null) return
  const floor = floorOf(context.space, context.plan.tier)
  const bedSurface = new ApartmentSurface(context.into, bed, floor)
  const xs = context.space.footprint.map(([x]) => x)
  const maxRugWidth = Math.max(
    bedSurface.width,
    Math.min(bed.at[0] - Math.min(...xs), Math.max(...xs) - bed.at[0]) * 2 - 0.08,
  )
  bedRug(bedSurface, maxRugWidth)
  footBench(bedSurface)
  const cabinet = find(structures, '-bedroom-cabinet-02')
  if (cabinet) {
    bedsideLamp(new ApartmentSurface(context.into, cabinet, floor), context.space.id)
  }
  chandelier(context)
}
