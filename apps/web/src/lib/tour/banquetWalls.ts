import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import { banquetWallRuns, wallBays, wallPoint, type BanquetWallRun } from './banquetWallLayout'

const STONE = 0xcac5b5
const RECESS = 0xa39f91
const MOULDING = 0xe0d7bd
const GRILLE = 0x494b49

interface WallSurface {
  into: BanquetDetailBuilder
  run: BanquetWallRun
  floor: number
}
interface Panel {
  along: number
  bottom: number
  height: number
  width: number
}

function wallBox(
  wall: WallSurface,
  size: Point3,
  options: {
    along: number
    y: number
    colour: number
    inset?: number
  },
): void {
  wall.into.box(size, {
    at: wallPoint(wall.run, {
      along: options.along,
      y: wall.floor + options.y,
      inset: options.inset,
    }),
    rotation: [0, wall.run.angle, 0],
    colour: options.colour,
  })
}

function frame(wall: WallSurface, panel: Panel, inset = 0.15): void {
  const { along, bottom, height, width } = panel
  for (const side of [-1, 1]) {
    wallBox(wall, [width, 0.075, 0.075], {
      along,
      y: bottom + ((side + 1) * height) / 2,
      inset,
      colour: MOULDING,
    })
    wallBox(wall, [0.075, height, 0.075], {
      along: along + (side * width) / 2,
      y: bottom + height / 2,
      inset,
      colour: MOULDING,
    })
  }
}

function veinSegment(into: BanquetDetailBuilder, from: Point3, to: Point3): void {
  const dx = to[0] - from[0],
    dy = to[1] - from[1],
    dz = to[2] - from[2]
  into.cylinder(
    { radius: 0.009, height: Math.hypot(dx, dy, dz), sides: 3, open: true },
    {
      at: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2],
      rotation: [Math.atan2(Math.hypot(dx, dz), dy), Math.atan2(dx, dz), 0],
      colour: RECESS,
    },
  )
}

function veins(wall: WallSurface, panel: Panel): void {
  const points = [
    [0.13, 0.12],
    [-0.03, 0.36],
    [0.06, 0.54],
    [-0.12, 0.86],
    [0.22, 0.68],
    [0.18, 0.82],
  ].map(([x, y]) =>
    wallPoint(wall.run, {
      along: panel.along + x * panel.width,
      y: wall.floor + panel.bottom + y * panel.height,
      inset: 0.15,
    }),
  )
  for (const [from, to] of [
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
    [4, 5],
  ]) {
    veinSegment(wall.into, points[from], points[to])
  }
}

/** Opaque inset decoration: the chapter does not establish exterior windows here. */
function upperBay(wall: WallSurface, panel: Panel, grille: boolean): void {
  const { along, bottom, height, width } = panel
  wallBox(wall, [width, height, 0.07], {
    along,
    y: bottom + height / 2,
    inset: 0.1,
    colour: grille ? GRILLE : STONE,
  })
  frame(wall, panel)
  frame(wall, { along, bottom: bottom + 0.16, height: height - 0.32, width: width - 0.32 }, 0.17)
  if (grille) {
    for (const fraction of [-0.3, -0.1, 0.1, 0.3]) {
      wallBox(wall, [0.035, height - 0.32, 0.04], {
        along: along + width * fraction,
        y: bottom + height / 2,
        inset: 0.19,
        colour: MOULDING,
      })
    }
    for (const fraction of [0.25, 0.65]) {
      wallBox(wall, [width - 0.32, 0.045, 0.045], {
        along,
        y: bottom + height * fraction,
        inset: 0.2,
        colour: MOULDING,
      })
    }
    return
  }
  // A restrained branching vein recalls the pale patterned panels of ch. 359.
  veins(wall, panel)
}

function wallRun(wall: WallSurface, height: number): void {
  const { length } = wall.run
  for (const [y, thickness, depth] of [
    [0.12, 0.22, 0.18],
    [2.75, 0.09, 0.13],
    [height - 0.64, 0.11, 0.2],
    [height - 0.38, 0.18, 0.26],
  ]) {
    wallBox(wall, [length, thickness, depth], { along: length / 2, y, colour: MOULDING })
  }
  for (const bay of wallBays(wall.run)) {
    frame(wall, { ...bay, bottom: 0.48, height: 1.95 })
    upperBay(
      wall,
      { ...bay, width: bay.width * 0.66, bottom: 4.67, height: height - 5.48 },
      bay.index % 3 === 1,
    )
    wallBox(wall, [0.17, height - 4.72, 0.18], {
      along: bay.along - bay.width / 2 - 0.14,
      y: 4.48 + (height - 4.72) / 2,
      colour: STONE,
    })
  }
}

export function dressBanquetWalls(options: {
  into: BanquetDetailBuilder
  plan: TierPlan
  spaceId: string
}): void {
  const { into, plan, spaceId } = options
  const space = plan.spaces.find(({ id }) => id === spaceId)!
  const floor = floorOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    wallRun({ into, run, floor }, ceilingOf(space, plan.tier))
  }
}
