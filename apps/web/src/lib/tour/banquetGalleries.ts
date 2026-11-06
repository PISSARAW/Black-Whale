import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { galleryFront, galleryParapetStart } from './banquetWallLayout'
import { banquetRails, stairRailSides } from './banquetWalkLayout'
export { galleryParapetStart } from './banquetWallLayout'
import type { Structure } from './types'

const STONE = 0xc9c4b2
const EDGE = 0xe2dac4
const INSET = 0xa5a293
const SHADE = 0x6a6b62
interface GalleryContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  spaceId: string
}

function parapet(
  into: BanquetDetailBuilder,
  options: {
    x: number
    z: number
    length: number
    top: number
    inward: number
  },
): void {
  const { x, z, length, top, inward } = options
  into.box([0.17, 0.94, length], { at: [x, top + 0.47, z], colour: STONE })
  for (const [y, width, height] of [
    [0.06, 0.25, 0.1],
    [0.85, 0.22, 0.07],
    [0.99, 0.32, 0.08],
  ]) {
    into.box([width, height, length], { at: [x, top + y, z], colour: EDGE })
  }
  const count = Math.max(1, Math.round(length / 3))
  const pitch = length / count
  for (let index = 0; index < count; index++) {
    const centre = z - length / 2 + pitch * (index + 0.5)
    into.box([0.025, 0.55, pitch - 0.35], {
      at: [x + inward * 0.095, top + 0.46, centre],
      colour: INSET,
    })
    for (const sign of [-1, 1]) {
      into.box([0.045, 0.045, pitch - 0.35], {
        at: [x + inward * 0.12, top + 0.46 + sign * 0.275, centre],
        colour: EDGE,
      })
      into.box([0.045, 0.55, 0.045], {
        at: [x + inward * 0.12, top + 0.46, centre + (sign * (pitch - 0.35)) / 2],
        colour: EDGE,
      })
    }
    into.box([0.045, 0.12, 0.12], {
      at: [x + inward * 0.13, top + 0.16, centre - pitch / 2 + 0.08],
      colour: SHADE,
    })
  }
}

function gallery(context: GalleryContext, structure: Structure, floor: number): void {
  const { into, plan } = context
  const front = galleryFront(structure)
  const { x, z, depth, length, inward } = front
  const start = galleryParapetStart(structure, plan.structures)
  const end = z + length / 2
  parapet(into, { x, z: (start + end) / 2, length: end - start, top: floor + front.top, inward })
  into.box([depth, 0.035, length], {
    at: [structure.at[0], floor + front.top + 0.0175, z],
    colour: STONE,
  })
  into.box([0.25, structure.height + 0.04, length], {
    at: [x, floor + front.bottom + structure.height / 2, z],
    colour: EDGE,
  })
  const bays = Math.max(1, Math.round(length / 3.2))
  const span = length / bays
  // The deep rectangular soffit coffers are visible from the tables in ch. 358.
  for (let index = 0; index < bays; index++) {
    const centre = z - length / 2 + span * (index + 0.5)
    into.box([depth - 0.3, 0.025, span - 0.28], {
      at: [structure.at[0], floor + front.bottom - 0.014, centre],
      colour: INSET,
    })
    for (const sign of [-1, 1]) {
      into.box([depth - 0.25, 0.09, 0.09], {
        at: [structure.at[0], floor + front.bottom - 0.045, centre + sign * (span / 2 - 0.09)],
        colour: EDGE,
      })
      into.box([0.09, 0.09, span - 0.18], {
        at: [structure.at[0] + sign * (depth / 2 - 0.12), floor + front.bottom - 0.045, centre],
        colour: EDGE,
      })
    }
  }
}

function stairRails(context: GalleryContext, steps: Structure[], floor: number): void {
  const { THREE, into } = context
  steps.sort((a, b) => a.height - b.height)
  const first = steps[0],
    last = steps.at(-1)!
  const width = Math.max(...first.size)
  const run = first.at[1] - last.at[1]
  const rise = last.height - first.height
  const angle = Math.atan2(rise, run)
  const tread = Math.min(...first.size)
  const cheek = new THREE.Shape()
  cheek.moveTo(0, 0)
  cheek.lineTo(run + tread, 0)
  cheek.lineTo(run + tread, last.height)
  cheek.lineTo(0, first.height)
  cheek.closePath()
  for (const { side, start, end } of stairRailSides(steps)) {
    into.add(new THREE.ExtrudeGeometry(cheek, { depth: 0.09, bevelEnabled: false }), {
      at: [first.at[0] + (side * width) / 2 - 0.045, floor, first.at[1] + tread / 2],
      rotation: [0, Math.PI / 2, 0],
      colour: STONE,
    })
    // On the gallery side the last 60 cm stay open for the landing turn.
    const length = start[1] - end[1]
    const centreZ = (start[1] + end[1]) / 2
    const baseY = floor + first.height + ((length / run) * rise) / 2
    for (const [offset, height, depth, colour] of [
      [0.39, 1.16, 0.16, STONE],
      [0.87, 0.08, 0.24, EDGE],
    ]) {
      into.box([depth, height, Math.hypot(length, (length / run) * rise)], {
        at: [first.at[0] + side * (width / 2 - 0.08), baseY + offset, centreZ],
        rotation: [angle, 0, 0],
        colour,
      })
    }
  }
  for (const step of steps) {
    into.box([width - 0.1, 0.018, tread], {
      at: [step.at[0], floor + step.height + 0.009, step.at[1]],
      colour: STONE,
    })
    into.box([width - 0.1, first.height, 0.018], {
      at: [step.at[0], floor + step.height - first.height / 2, step.at[1] + tread / 2 + 0.009],
      colour: STONE,
    })
    into.box([width - 0.2, 0.025, 0.055], {
      at: [
        step.at[0],
        floor + step.height + 0.0125,
        step.at[1] + Math.min(...step.size) / 2 - 0.04,
      ],
      colour: EDGE,
    })
  }
}

function landingsAndReturns(context: GalleryContext, structures: Structure[], floor: number): void {
  const { into } = context
  for (const landing of structures.filter(({ id }) => id.includes('-gallery-landing-'))) {
    into.box([Math.max(...landing.size), landing.height + 0.04, Math.min(...landing.size)], {
      at: [landing.at[0], floor + landing.base + landing.height / 2, landing.at[1]],
      colour: STONE,
    })
  }
  for (const rail of banquetRails(structures).filter(
    ({ kind }) => kind === 'return' || kind === 'landing',
  )) {
    const dx = rail.end[0] - rail.start[0],
      dz = rail.end[1] - rail.start[1]
    const length = Math.hypot(dx, dz)
    for (const [height, width, y] of [
      [0.94, 0.17, 0.47],
      [0.08, 0.32, 0.99],
    ]) {
      into.box([length, height, width], {
        at: [
          (rail.start[0] + rail.end[0]) / 2,
          floor + rail.base + y,
          (rail.start[1] + rail.end[1]) / 2,
        ],
        rotation: [0, -Math.atan2(dz, dx), 0],
        colour: EDGE,
      })
    }
  }
}

function hangingPanel(context: GalleryContext, floor: number): void {
  const panel = context.plan.structures.find(({ id }) => id === `${context.spaceId}-hanging-panel`)
  if (!panel) return
  const { into } = context
  const width = Math.max(...panel.size),
    height = panel.height
  const x = panel.at[0] + Math.min(...panel.size) / 2 + 0.04
  // A plain face preserves the unreadable sign without inventing royal heraldry.
  into.box([0.035, height - 0.15, width - 0.1], {
    at: [x, floor + panel.base + height / 2, panel.at[1]],
    colour: STONE,
  })
  for (const side of [-1, 1]) {
    into.box([0.09, 0.09, width], {
      at: [x, floor + panel.base + (height * (side + 1)) / 2, panel.at[1]],
      colour: EDGE,
    })
    into.box([0.09, height, 0.09], {
      at: [x, floor + panel.base + height / 2, panel.at[1] + (side * width) / 2],
      colour: EDGE,
    })
  }
}

export function dressBanquetGalleries(context: GalleryContext): void {
  const { plan, spaceId } = context
  const floor = floorOf(
    plan.spaces.find(({ id }) => id === spaceId)!,
    plan.tier,
  )
  const structures = plan.structures.filter((item) => item.spaceId === spaceId)
  landingsAndReturns(context, structures, floor)
  for (const structure of structures.filter(({ id }) => /-gallery-(forward|aft)-/.test(id))) {
    gallery(context, structure, floor)
  }
  for (const side of ['port', 'starboard']) {
    const steps = structures.filter(({ id }) => id.includes(`-gallery-stair-${side}-`))
    if (steps.length) stairRails(context, steps, floor)
  }
  hangingPanel(context, floor)
}
