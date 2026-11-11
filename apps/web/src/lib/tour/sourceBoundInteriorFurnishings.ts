import {
  reconstructionTag,
  structureTag,
  type SourceBoundRoomContext,
} from './sourceBoundInteriorContext'
import type { Structure } from './types'

const rotationOf = (structure: Structure): number => ((structure.rotation ?? 0) * Math.PI) / 180

function localPoint(structure: Structure, x: number, z: number): readonly [number, number] {
  const angle = rotationOf(structure)
  return [
    structure.at[0] + x * Math.cos(angle) + z * Math.sin(angle),
    structure.at[1] - x * Math.sin(angle) + z * Math.cos(angle),
  ]
}

function boxOn(
  context: SourceBoundRoomContext,
  structure: Structure,
  options: {
    size: readonly [number, number, number]
    y: number
    x?: number
    z?: number
    colour: number
  },
): void {
  const [x, z] = localPoint(structure, options.x ?? 0, options.z ?? 0)
  context.into.box(options.size, {
    at: [x, context.floor + structure.base + options.y, z],
    colour: options.colour,
    rotation: [0, rotationOf(structure), 0],
    tag: structureTag(structure),
  })
}

function dressBed(context: SourceBoundRoomContext, structure: Structure): void {
  const [width, depth] = structure.size
  boxOn(context, structure, { size: [width, 0.24, depth], y: 0.2, colour: context.style.wood })
  boxOn(context, structure, {
    size: [width * 0.92, 0.2, depth * 0.92],
    y: 0.41,
    colour: context.style.fabric,
  })
  boxOn(context, structure, {
    size: [width * 0.72, 0.12, depth * 0.2],
    y: 0.56,
    z: -depth * 0.3,
    colour: 0xc8c2b4,
  })
  boxOn(context, structure, {
    size: [width, Math.max(0.35, structure.height * 0.45), 0.12],
    y: Math.max(0.35, structure.height * 0.45) / 2,
    z: -depth * 0.46,
    colour: context.style.wood,
  })
}

function dressCabinet(context: SourceBoundRoomContext, structure: Structure): void {
  const [width, depth] = structure.size
  const height = Math.max(0.5, structure.height)
  boxOn(context, structure, {
    size: [width, height, depth],
    y: height / 2,
    colour: context.style.wood,
  })
  boxOn(context, structure, {
    size: [0.025, height * 0.84, depth + 0.015],
    y: height * 0.53,
    colour: context.style.metal,
  })
  for (const x of [-width * 0.18, width * 0.18]) {
    boxOn(context, structure, {
      size: [0.035, 0.18, 0.04],
      y: height * 0.52,
      x,
      z: -depth * 0.51,
      colour: context.style.accent,
    })
  }
}

function dressTable(context: SourceBoundRoomContext, structure: Structure): void {
  const [width, depth] = structure.size
  const height = Math.max(0.5, structure.height)
  boxOn(context, structure, {
    size: [width, 0.12, depth],
    y: height - 0.06,
    colour: context.style.wood,
  })
  for (const x of [-width * 0.38, width * 0.38]) {
    for (const z of [-depth * 0.34, depth * 0.34]) {
      boxOn(context, structure, {
        size: [0.1, height - 0.12, 0.1],
        y: (height - 0.12) / 2,
        x,
        z,
        colour: context.style.metal,
      })
    }
  }
}

function dressSeat(context: SourceBoundRoomContext, structure: Structure): void {
  const [width, depth] = structure.size
  const height = Math.max(0.65, structure.height)
  boxOn(context, structure, {
    size: [width, 0.14, depth],
    y: Math.min(0.48, height * 0.48),
    colour: context.style.fabric,
  })
  boxOn(context, structure, {
    size: [width, height * 0.52, 0.12],
    y: height * 0.7,
    z: depth * 0.42,
    colour: context.style.fabric,
  })
  for (const x of [-width * 0.36, width * 0.36]) {
    for (const z of [-depth * 0.32, depth * 0.32]) {
      boxOn(context, structure, {
        size: [0.07, 0.42, 0.07],
        y: 0.21,
        x,
        z,
        colour: context.style.metal,
      })
    }
  }
}

export function dressSourceBoundStructure(
  context: SourceBoundRoomContext,
  structure: Structure,
): void {
  if (structure.kind === 'bed') dressBed(context, structure)
  else if (structure.kind === 'cabinet') dressCabinet(context, structure)
  else if (structure.kind === 'table' || structure.kind === 'counter')
    dressTable(context, structure)
  else if (structure.kind === 'seat') dressSeat(context, structure)
  else {
    const height = Math.max(0.08, structure.height)
    boxOn(context, structure, {
      size: [structure.size[0], height, structure.size[1]],
      y: height / 2,
      colour: context.style.metal,
    })
  }
}

interface ProgrammeLayout {
  width: number
  depth: number
  left: number
  right: number
  back: number
}

const programmeLayout = ({ bounds }: SourceBoundRoomContext): ProgrammeLayout => {
  const width = Math.max(1, Math.min(2.1, bounds.width * 0.24))
  const depth = Math.max(1.6, Math.min(2.5, bounds.depth * 0.32))
  return {
    width,
    depth,
    left: bounds.minX + width * 0.65,
    right: bounds.maxX - width * 0.65,
    back: bounds.minZ + depth * 0.62,
  }
}

function programmeTag(context: SourceBoundRoomContext) {
  return reconstructionTag(context, {
    id: `${context.style.programme}-programme`,
    name: `${context.style.programme} programme furniture`,
    nameFr: `Mobilier fonctionnel : ${context.style.programme}`,
    layer: 'furniture',
  })
}

function dressDormProgramme(context: SourceBoundRoomContext): void {
  const { into, floor, style } = context
  const { width, depth, left, right, back } = programmeLayout(context)
  const tag = programmeTag(context)
  for (const x of [left, right]) {
    for (const y of [0.35, 1.25]) {
      into.box([width, 0.16, depth], { at: [x, floor + y, back], colour: style.metal, tag })
      into.box([width * 0.9, 0.14, depth * 0.9], {
        at: [x, floor + y + 0.15, back],
        colour: style.fabric,
        tag,
      })
    }
    for (const side of [-1, 1]) {
      into.box([0.08, 1.75, 0.08], {
        at: [x + side * width * 0.42, floor + 0.88, back + depth * 0.42],
        colour: style.metal,
        tag,
      })
    }
  }
}

function dressOfficeProgramme(context: SourceBoundRoomContext): void {
  const { into, bounds, floor, style } = context
  const { width, left, right } = programmeLayout(context)
  const tag = programmeTag(context)
  into.box([Math.min(3.2, bounds.width * 0.5), 0.12, Math.min(1.5, bounds.depth * 0.3)], {
    at: [bounds.centreX, floor + 0.78, bounds.centreZ],
    colour: style.wood,
    tag,
  })
  into.box([Math.min(3, bounds.width * 0.45), 0.66, 0.12], {
    at: [bounds.centreX, floor + 0.39, bounds.centreZ + Math.min(0.55, bounds.depth * 0.12)],
    colour: style.wood,
    tag,
  })
  for (const x of [left, right]) {
    into.box([width * 0.8, 1.7, 0.45], {
      at: [x, floor + 0.85, bounds.maxZ - 0.3],
      colour: style.metal,
      tag,
    })
  }
}

function dressRecyclingProgramme(context: SourceBoundRoomContext): void {
  const { into, bounds, floor, style } = context
  const { width, left, right } = programmeLayout(context)
  const tag = programmeTag(context)
  for (const x of [left, bounds.centreX, right]) {
    into.cylinder(
      { radius: Math.min(0.8, width * 0.4), height: 2.4, sides: 20 },
      { at: [x, floor + 1.2, bounds.centreZ], colour: style.metal, tag },
    )
    into.cylinder(
      { radius: 0.08, height: Math.max(1.4, bounds.depth * 0.65) },
      {
        at: [x, floor + 2.65, bounds.centreZ],
        colour: style.accent,
        rotation: [Math.PI / 2, 0, 0],
        tag,
      },
    )
  }
}

function dressClinicProgramme(context: SourceBoundRoomContext): void {
  const { into, bounds, floor, style } = context
  const { width, depth, left, right, back } = programmeLayout(context)
  const tag = programmeTag(context)
  for (const x of [left, right]) {
    into.box([width, 0.7, depth], { at: [x, floor + 0.42, back], colour: style.metal, tag })
    into.box([width * 0.92, 0.12, depth * 0.92], {
      at: [x, floor + 0.82, back],
      colour: style.fabric,
      tag,
    })
  }
  into.box([Math.min(2.4, bounds.width * 0.3), 1.8, 0.5], {
    at: [bounds.centreX, floor + 0.9, bounds.maxZ - 0.35],
    colour: style.wood,
    tag,
  })
}

const programmeDressers = {
  dorm: dressDormProgramme,
  office: dressOfficeProgramme,
  recycling: dressRecyclingProgramme,
  clinic: dressClinicProgramme,
} as const

export function dressInferredProgramme(context: SourceBoundRoomContext): void {
  const programme = context.style.programme
  if (programme) programmeDressers[programme](context)
}
