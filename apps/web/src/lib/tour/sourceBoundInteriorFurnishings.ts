import { structureTag, type SourceBoundRoomContext } from './sourceBoundInteriorContext'
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
  if (structure.sides) {
    context.into.cylinder(
      { radius: Math.min(width, depth) / 2, height, sides: structure.sides },
      {
        at: [structure.at[0], context.floor + structure.base + height / 2, structure.at[1]],
        colour: context.style.metal,
        tag: structureTag(structure),
      },
    )
    return
  }
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
