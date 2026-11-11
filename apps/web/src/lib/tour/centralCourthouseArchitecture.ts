import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint, type BanquetWallRun } from './banquetWallLayout'
import { COURTHOUSE } from './centralCourthouseDetailSurface'
import type { Space } from './types'

interface Architecture {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Shallow finish only: the existing walls still own the room and its openings. */
function wallPanels(context: Architecture, run: BanquetWallRun): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  const height = ceilingOf(space, plan.tier)
  const friezeBottom = height - 0.63
  const place = (size: readonly [number, number, number], along: number, y: number) =>
    into.box(size, {
      at: wallPoint(run, { along, y: floor + y, inset: size[2] / 2 + 0.006 }),
      rotation: [0, run.angle, 0],
      colour: COURTHOUSE.trim,
    })

  into.box([run.length, height - 0.08, 0.018], {
    at: wallPoint(run, { along: run.length / 2, y: floor + height / 2, inset: 0.013 }),
    rotation: [0, run.angle, 0],
    colour: COURTHOUSE.wall,
  })
  for (const [y, thickness, depth] of [
    [0.09, 0.15, 0.08],
    [1.02, 0.055, 0.075],
    [friezeBottom, 0.06, 0.09],
    [height - 0.18, 0.09, 0.11],
  ]) {
    place([run.length, thickness, depth], run.length / 2, y)
  }

  const count = Math.max(1, Math.round(run.length / 0.72))
  const pitch = run.length / count
  for (let index = 0; index < count; index++) {
    const centre = (index + 0.5) * pitch
    into.box([pitch - 0.09, 0.72, 0.025], {
      at: wallPoint(run, { along: centre, y: floor + 0.58, inset: 0.029 }),
      rotation: [0, run.angle, 0],
      colour: COURTHOUSE.panel,
    })
    place([0.025, friezeBottom - 0.19, 0.045], index * pitch + 0.015, friezeBottom / 2)
  }
}

/** The visible patterned band is kept abstract; it supplies no invented insignia. */
function frieze(context: Architecture, run: BanquetWallRun): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)
  const height = ceilingOf(space, plan.tier)
  into.box([run.length, 0.36, 0.025], {
    at: wallPoint(run, { along: run.length / 2, y: floor + height - 0.4, inset: 0.025 }),
    rotation: [0, run.angle, 0],
    colour: COURTHOUSE.frieze,
  })
  const count = Math.max(1, Math.floor(run.length / 0.24))
  for (let index = 0; index < count; index++) {
    const centre = ((index + 0.5) * run.length) / count
    const points = [-1, 0, 1].map((step) =>
      wallPoint(run, {
        along: centre + step * 0.07,
        y: floor + height - 0.4 + (step === 0 ? 0.12 : -0.12),
        inset: 0.045,
      }),
    )
    into.curve(points, 0.009, { at: [0, 0, 0], colour: COURTHOUSE.trim })
  }
}

function floorAndCeiling(context: Architecture): void {
  const { into, plan, space } = context
  const xs = space.footprint.map(([x]) => x)
  const zs = space.footprint.map(([, z]) => z)
  const minX = Math.min(...xs),
    maxX = Math.max(...xs)
  const minZ = Math.min(...zs),
    maxZ = Math.max(...zs)
  const width = maxX - minX,
    depth = maxZ - minZ
  const cx = (minX + maxX) / 2,
    cz = (minZ + maxZ) / 2
  const floor = floorOf(space, plan.tier)
  const top = floor + ceilingOf(space, plan.tier)

  into.box([width - 0.04, 0.012, depth - 0.04], {
    at: [cx, floor + 0.009, cz],
    colour: COURTHOUSE.floor,
  })
  into.box([width - 0.04, 0.035, depth - 0.04], {
    at: [cx, top - 0.025, cz],
    colour: COURTHOUSE.ceiling,
  })

  for (let x = minX + 0.75; x < maxX - 0.05; x += 0.75) {
    into.box([0.013, 0.006, depth - 0.05], {
      at: [x, floor + 0.018, cz],
      colour: COURTHOUSE.joint,
    })
  }
  for (let z = minZ + 0.75; z < maxZ - 0.05; z += 0.75) {
    into.box([width - 0.05, 0.006, 0.013], {
      at: [cx, floor + 0.018, z],
      colour: COURTHOUSE.joint,
    })
  }
  for (let x = minX + 1.5; x < maxX - 0.05; x += 1.5) {
    into.box([0.09, 0.08, depth - 0.04], {
      at: [x, top - 0.085, cz],
      colour: COURTHOUSE.trim,
    })
  }
  for (let z = minZ + 1.25; z < maxZ - 0.05; z += 1.25) {
    into.box([width - 0.04, 0.08, 0.09], {
      at: [cx, top - 0.085, z],
      colour: COURTHOUSE.trim,
    })
  }
}

/** The narrow left-wall opening is visible, but its destination is not published. */
function sideRecess(context: Architecture): void {
  const { into, plan, space } = context
  const left = Math.min(...space.footprint.map(([x]) => x))
  const back = Math.min(...space.footprint.map(([, z]) => z))
  const floor = floorOf(space, plan.tier)
  const z = back + 2.1
  // A shallow, closed recess records the visible frame without adding an exit.
  into.box([0.025, 2.6, 1.0], {
    at: [left + 0.075, floor + 1.3, z],
    colour: COURTHOUSE.woodDark,
  })
  for (const side of [-1, 1]) {
    into.box([0.04, 2.68, 0.085], {
      at: [left + 0.1, floor + 1.34, z + side * 0.52],
      colour: COURTHOUSE.trim,
    })
  }
  into.box([0.04, 0.1, 1.13], {
    at: [left + 0.1, floor + 2.68, z],
    colour: COURTHOUSE.trim,
  })
}

export function dressCentralCourthouseArchitecture(context: Architecture): void {
  floorAndCeiling(context)
  for (const run of banquetWallRuns(context.plan, context.space)) {
    wallPanels(context, run)
    frieze(context, run)
  }
  sideRecess(context)
}
