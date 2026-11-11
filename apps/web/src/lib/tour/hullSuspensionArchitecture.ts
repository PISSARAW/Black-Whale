import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

const STEEL = 0x727a7d
const DARK_STEEL = 0x343a3d
const EDGE_STEEL = 0x9aa1a0
const SPRING_STEEL = 0xc4c7c1
const WALKWAY = 0x596164
const PI = Math.PI

interface MachineryContext {
  into: BanquetDetailBuilder
  structures: readonly Structure[]
  floor: number
}

interface SpringContext {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
}

function barrelRibs({ into, structure, floor }: SpringContext, centreY: number): void {
  const [x, z] = structure.at
  for (let index = 0; index < 12; index++) {
    const angle = (index / 12) * PI * 2
    const radius = 1.58
    into.box([0.13, 4.15, 0.22], {
      at: [x + Math.cos(angle) * radius, floor + centreY, z + Math.sin(angle) * radius],
      rotation: [0, -angle, 0],
      colour: EDGE_STEEL,
    })
  }
}

function collar(into: BanquetDetailBuilder, at: Point3, radius: number): void {
  into.ring({ radius, tube: 0.14 }, { at, rotation: [PI / 2, 0, 0], colour: DARK_STEEL })
}

function helicalCoil({ into, structure, floor }: SpringContext): void {
  const points: Point3[] = []
  const turns = 5.5
  const samples = 72
  for (let index = 0; index <= samples; index++) {
    const progress = index / samples
    const angle = progress * turns * PI * 2
    points.push([Math.cos(angle) * 1.25, 5.35 + progress * 7.3, Math.sin(angle) * 1.25])
  }
  into.curve(points, 0.19, {
    at: [structure.at[0], floor, structure.at[1]],
    colour: SPRING_STEEL,
  })
}

function tieRods({ into, structure, floor }: SpringContext): void {
  const [x, z] = structure.at
  for (const [dx, dz] of [
    [-1.48, 0],
    [1.48, 0],
    [0, -1.48],
    [0, 1.48],
  ] as const) {
    into.cylinder(
      { radius: 0.09, height: 8 },
      { at: [x + dx, floor + 9, z + dz], colour: DARK_STEEL },
    )
  }
}

function suspensionUnit(context: SpringContext): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at

  into.cylinder(
    { radius: 1.77, height: 0.55, sides: 24 },
    {
      at: [x, floor + 0.275, z],
      colour: DARK_STEEL,
    },
  )
  into.cylinder(
    { radius: 1.5, height: 4.65, sides: 24 },
    {
      at: [x, floor + 2.8, z],
      colour: STEEL,
    },
  )
  into.cylinder(
    { radius: 1.5, height: 4.65, sides: 24 },
    {
      at: [x, floor + 15.2, z],
      colour: STEEL,
    },
  )
  into.cylinder(
    { radius: 1.77, height: 0.55, sides: 24 },
    {
      at: [x, floor + 17.725, z],
      colour: DARK_STEEL,
    },
  )
  into.cylinder(
    { radius: 0.3, height: 17, sides: 16 },
    {
      at: [x, floor + 9, z],
      colour: EDGE_STEEL,
    },
  )

  barrelRibs(context, 2.8)
  barrelRibs(context, 15.2)
  helicalCoil(context)
  tieRods(context)
  for (const y of [0.65, 5.05, 5.45, 12.55, 12.95, 17.35]) {
    collar(into, [x, floor + y, z], y === 0.65 || y === 17.35 ? 1.62 : 1.52)
  }

  into.profile(
    [
      [0.58, 0],
      [1.1, 0.42],
      [1.32, 0.72],
      [1.32, 1.05],
      [0.58, 1.3],
    ],
    { at: [x, floor + 17.9, z], colour: DARK_STEEL },
  )
}

function serviceGangway(into: BanquetDetailBuilder, floor: number): void {
  const deckY = floor + 6.05
  into.box([40, 0.22, 1.4], { at: [0, deckY, -1.15], colour: WALKWAY })
  into.box([40, 0.18, 0.12], { at: [0, deckY - 0.18, -1.82], colour: DARK_STEEL })
  into.box([40, 0.18, 0.12], { at: [0, deckY - 0.18, -0.48], colour: DARK_STEEL })
  for (const z of [-1.82, -0.48]) {
    into.cylinder(
      { radius: 0.055, height: 39.6, sides: 8 },
      { at: [0, deckY + 1.15, z], rotation: [0, 0, PI / 2], colour: EDGE_STEEL },
    )
    for (let x = -19.5; x <= 19.5; x += 3.9) {
      into.cylinder(
        { radius: 0.055, height: 1.15, sides: 8 },
        { at: [x, deckY + 0.58, z], colour: EDGE_STEEL },
      )
    }
  }
}

function hullRibs(into: BanquetDetailBuilder, floor: number): void {
  for (let x = -19; x <= 19; x += 2) {
    into.box([0.16, 20.5, 0.18], { at: [x, floor + 10.25, -9.78], colour: DARK_STEEL })
  }
  for (const y of [3.5, 9.5, 15.5, 20.5]) {
    into.box([39, 0.22, 0.24], { at: [0, floor + y, -9.68], colour: EDGE_STEEL })
  }
}

function overheadLinks(
  into: BanquetDetailBuilder,
  structures: readonly Structure[],
  floor: number,
): void {
  for (let index = 0; index < structures.length - 1; index++) {
    const from = structures[index].at
    const to = structures[index + 1].at
    into.curve(
      [
        [from[0], floor + 19.1, from[1]],
        [(from[0] + to[0]) / 2, floor + 18.4, from[1]],
        [to[0], floor + 19.1, to[1]],
      ],
      0.075,
      { at: [0, 0, 0], colour: DARK_STEEL },
    )
  }
}

/** The complete sprung mounting bay drawn in chapter 406. */
export function dressHullSuspension({ into, structures, floor }: MachineryContext): void {
  hullRibs(into, floor)
  serviceGangway(into, floor)
  for (const structure of structures) suspensionUnit({ into, structure, floor })
  overheadLinks(into, structures, floor)
}
