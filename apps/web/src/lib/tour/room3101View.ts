import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { TourDetailTag } from './detailTag'
import type { Space, Structure } from './types'

export const ROOM_3101_LIVING = 'tier-3-residential-room-3101-living'
export const ROOM_3101_BATHROOM = 'tier-3-residential-room-3101-bathroom'
export const ROOM_3101_SPACES = new Set([ROOM_3101_LIVING, ROOM_3101_BATHROOM])

const STEEL = 0x555b5d
const DARK_STEEL = 0x292d2e
const CABINET = 0x6b655b
const FABRIC = 0x77746d
const SHEET = 0xc2beb2
const TILE = 0x8c908d
const GROUT = 0x555b59

function structureTag(structure: Structure): TourDetailTag {
  return {
    id: structure.id,
    spaceId: structure.spaceId,
    name: structure.name,
    nameFr: structure.nameFr,
    provenance: structure.provenance,
    source: structure.source,
    sourceFr: structure.sourceFr,
    reconstructionRole: structure.provenance === 'inferred' ? 'metric-estimate' : 'attested',
  }
}

function finishTag(space: Space, id: string, name: string, nameFr: string): TourDetailTag {
  return {
    id: `${space.id}-${id}`,
    spaceId: space.id,
    name,
    nameFr,
    provenance: 'inferred',
    source:
      'Material, colour and metric finish reconstructed for the walk; no source establishes it.',
    sourceFr:
      'Matériau, couleur et finition métrique reconstruits pour la visite ; aucune source ne les établit.',
    reconstructionRole: 'functional-reconstruction',
  }
}

function entranceTrapTag(space: Space): TourDetailTag {
  return {
    id: `${space.id}-entrance-trap`,
    spaceId: space.id,
    name: 'Room 3101 entrance trap',
    nameFr: "Piège de l'entrée de la chambre 3101",
    provenance: 'panel',
    source:
      'Ch. 394 — Tassi vanishes as he crosses the entrance into room 3101; the door boundary, not the bathroom threshold, is the transfer trap.',
    sourceFr:
      "Chap. 394 — Tassi disparaît en franchissant l'entrée de la chambre 3101 ; la limite de la porte, et non le seuil de la salle de bains, est le piège de transfert.",
    reconstructionRole: 'attested',
  }
}

function bathroomBypassTag(space: Space): TourDetailTag {
  return {
    id: `${space.id}-bathroom-bypass`,
    spaceId: space.id,
    name: 'Bathroom-side bypass',
    nameFr: 'Contournement par la salle de bains',
    provenance: 'panel',
    source:
      'Chs. 395 and 398 — the Troupe starts from the neighbouring bathroom and breaches the wall to approach room 3101 without crossing its trapped entrance.',
    sourceFr:
      'Chap. 395 et 398 — la Brigade part de la salle de bains voisine et perce le mur pour approcher la 3101 sans franchir son entrée piégée.',
    reconstructionRole: 'attested',
  }
}

function localPoint(structure: Structure, point: Point3): Point3 {
  const angle = (structure.rotation * Math.PI) / 180
  const [x, y, z] = point
  return [
    structure.at[0] + x * Math.cos(angle) + z * Math.sin(angle),
    structure.base + y,
    structure.at[1] - x * Math.sin(angle) + z * Math.cos(angle),
  ]
}

function boxOn(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
  size: Point3,
  at: Point3,
  colour: number,
): void {
  into.box(size, {
    at: localPoint(structure, [at[0], floor + at[1], at[2]]),
    rotation: [0, (structure.rotation * Math.PI) / 180, 0],
    colour,
    tag: structureTag(structure),
  })
}

function dressBunk(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [width, depth] = structure.size
  for (const x of [-width * 0.44, width * 0.44]) {
    for (const z of [-depth * 0.44, depth * 0.44]) {
      boxOn(into, structure, floor, [0.07, 2.15, 0.07], [x, 1.075, z], DARK_STEEL)
    }
  }
  for (const y of [0.38, 1.42]) {
    boxOn(into, structure, floor, [width, 0.12, depth], [0, y, 0], STEEL)
    boxOn(into, structure, floor, [width * 0.92, 0.15, depth * 0.9], [0, y + 0.13, 0], FABRIC)
    boxOn(
      into,
      structure,
      floor,
      [width * 0.68, 0.1, depth * 0.22],
      [0, y + 0.26, -depth * 0.31],
      SHEET,
    )
  }
  for (const y of [0.66, 1.7]) {
    boxOn(into, structure, floor, [width, 0.05, 0.05], [0, y, depth * 0.48], DARK_STEEL)
  }
}

function dressLadder(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [width, depth] = structure.size
  for (const x of [-width * 0.35, width * 0.35])
    boxOn(
      into,
      structure,
      floor,
      [0.045, structure.height, 0.045],
      [x, structure.height / 2, 0],
      STEEL,
    )
  for (let y = 0.25; y < structure.height; y += 0.28)
    boxOn(into, structure, floor, [width, 0.035, Math.max(0.04, depth * 0.2)], [0, y, 0], STEEL)
}

function dressOpenWardrobe(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [width, depth] = structure.size
  const height = structure.height
  boxOn(into, structure, floor, [0.06, height, depth], [-width / 2, height / 2, 0], CABINET)
  for (const y of [0.04, height - 0.04])
    boxOn(into, structure, floor, [width, 0.08, depth], [0, y, 0], CABINET)
  for (const z of [-depth / 2, depth / 2])
    boxOn(into, structure, floor, [width, height, 0.06], [0, height / 2, z], CABINET)
  boxOn(into, structure, floor, [0.05, 0.05, depth * 0.8], [0, height - 0.32, 0], STEEL)
  for (let index = -2; index <= 2; index++) {
    const colour = index % 2 ? 0x55514d : 0x777169
    boxOn(
      into,
      structure,
      floor,
      [width * 0.38, 0.72, depth * 0.11],
      [width * 0.08, height - 0.78, index * depth * 0.15],
      colour,
    )
  }
}

function dressDrawers(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [width, depth] = structure.size
  boxOn(
    into,
    structure,
    floor,
    [width, structure.height, depth],
    [0, structure.height / 2, 0],
    CABINET,
  )
  for (const y of [0.15, 0.44, 0.73]) {
    boxOn(into, structure, floor, [0.025, 0.24, depth * 0.9], [width * 0.51, y, 0], DARK_STEEL)
    boxOn(into, structure, floor, [0.04, 0.04, depth * 0.28], [width * 0.54, y, 0], STEEL)
  }
}

function dressShelves(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [width, depth] = structure.size
  boxOn(
    into,
    structure,
    floor,
    [0.06, structure.height, depth],
    [-width / 2, structure.height / 2, 0],
    CABINET,
  )
  for (const z of [-depth / 2, depth / 2])
    boxOn(
      into,
      structure,
      floor,
      [width, structure.height, 0.06],
      [0, structure.height / 2, z],
      CABINET,
    )
  for (const y of [0.05, 0.55, 1.05, 1.55, 2.05])
    boxOn(into, structure, floor, [width, 0.07, depth], [0, y, 0], CABINET)
}

function dressBasin(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const [width, depth] = structure.size
  const tag = structureTag(structure)
  const at = (point: Point3): Point3 =>
    localPoint(structure, [point[0], floor + point[1], point[2]])
  if (width > 1.2) {
    into.box([width, 0.18, depth], { at: at([0, 0.12, 0]), colour: TILE, tag })
    for (const z of [-depth * 0.44, depth * 0.44])
      into.box([width, 0.46, 0.09], { at: at([0, 0.32, z]), colour: TILE, tag })
    for (const x of [-width * 0.47, width * 0.47])
      into.box([0.09, 0.46, depth], { at: at([x, 0.32, 0]), colour: TILE, tag })
  } else {
    into.cylinder(
      { radius: width * 0.42, height: 0.16, sides: 16 },
      { at: at([0, 0.72, 0]), colour: TILE, tag },
    )
    into.cylinder(
      { radius: 0.09, height: 0.64, sides: 12 },
      { at: at([0, 0.32, 0]), colour: STEEL, tag },
    )
  }
}

function dressLivingArchitecture(
  into: BanquetDetailBuilder,
  space: Space,
  floor: number,
  ceiling: number,
): void {
  const finish = finishTag(
    space,
    'finish',
    'Room 3101 reconstructed finish',
    'Finition reconstruite de la chambre 3101',
  )
  into.polygon(space.footprint, { at: [0, floor + 0.012, 0], colour: 0x4b4a46, tag: finish })
  into.polygon(
    space.footprint,
    { at: [0, floor + ceiling - 0.02, 0], colour: 0x77766f, tag: finish },
    'down',
  )
  for (let z = -4; z <= 4; z += 1) {
    into.box([8.8, 0.012, 0.025], { at: [-2.5, floor + 0.025, z], colour: 0x343637, tag: finish })
  }

  // The trap itself is invisible. Only the ordinary-looking entrance frame is modelled.
  const trap = entranceTrapTag(space)
  for (const z of [2.75, 4.25])
    into.box([0.08, 2.25, 0.09], { at: [-6.93, floor + 1.125, z], colour: DARK_STEEL, tag: trap })
  into.box([0.08, 0.1, 1.58], { at: [-6.93, floor + 2.25, 3.5], colour: DARK_STEEL, tag: trap })
  into.box([0.28, 0.018, 1.42], { at: [-6.82, floor + 0.02, 3.5], colour: 0x5d5b55, tag: trap })

  // The bathroom opening is explicitly ordinary; it must not read as the Nen trigger.
  const bypass = bathroomBypassTag(space)
  for (const z of [-0.85, 0.85])
    into.box([0.09, 2.2, 0.08], { at: [1.93, floor + 1.1, z], colour: DARK_STEEL, tag: bypass })
  into.box([0.09, 0.1, 1.78], { at: [1.93, floor + 2.2, 0], colour: DARK_STEEL, tag: bypass })
}

function dressBathroomArchitecture(
  into: BanquetDetailBuilder,
  space: Space,
  floor: number,
  ceiling: number,
): void {
  const finish = finishTag(space, 'tile', 'Bathroom tile', 'Carrelage de la salle de bains')
  into.polygon(space.footprint, { at: [0, floor + 0.012, 0], colour: TILE, tag: finish })
  into.polygon(
    space.footprint,
    { at: [0, floor + ceiling - 0.02, 0], colour: 0xa4a6a0, tag: finish },
    'down',
  )
  for (let x = 2.5; x < 7; x += 0.5)
    into.box([0.018, 0.012, 4.9], { at: [x, floor + 0.025, 0], colour: GROUT, tag: finish })
  for (let z = -2; z < 2.5; z += 0.5)
    into.box([4.9, 0.012, 0.018], { at: [4.5, floor + 0.025, z], colour: GROUT, tag: finish })
}

export function room3101SurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => ROOM_3101_SPACES.has(id))) return plan
  return {
    ...plan,
    structures: plan.structures.filter(({ spaceId }) => !ROOM_3101_SPACES.has(spaceId)),
  }
}

export function buildRoom3101Details(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !ROOM_3101_SPACES.has(spaceId)) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)
  if (spaceId === ROOM_3101_LIVING) dressLivingArchitecture(into, space, floor, ceiling)
  else dressBathroomArchitecture(into, space, floor, ceiling)

  for (const structure of plan.structures.filter(({ spaceId: owner }) => owner === spaceId)) {
    if (structure.id.endsWith('-bed')) dressBunk(into, structure, floor)
    else if (structure.id.endsWith('-bunk-ladder')) dressLadder(into, structure, floor)
    else if (structure.id.endsWith('-wardrobe')) dressOpenWardrobe(into, structure, floor)
    else if (structure.id.endsWith('-drawers')) dressDrawers(into, structure, floor)
    else if (structure.id.endsWith('-shelves')) dressShelves(into, structure, floor)
    else if (structure.kind === 'basin') dressBasin(into, structure, floor)
  }
  return into.finish(`room-3101-${spaceId}-details`)
}
