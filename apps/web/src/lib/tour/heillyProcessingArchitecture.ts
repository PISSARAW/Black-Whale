import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { TourDetailTag } from './detailTag'
import type { Space, Structure } from './types'
import {
  CHROME,
  STEEL_BRUSHED,
  STEEL_DARK,
  TILE_BORDER,
  TILE_GROUT,
  TILE_WHITE,
} from './heillyHideoutDetailSurface'

export interface ProcessingContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
  structures: Structure[]
}

interface DoorPlacement {
  at: Point3
  rotY: number
  tag: TourDetailTag
}

const SPACE_ID = 'tier-2-heilly-secret-hideout-processing'
const PANEL_SOURCE =
  'Ch. 398, supplied processing-room panel — the tiled surfaces, industrial framing, doors, stains, service hose, lights and debris are visible in the room. Dimensions and exact spacing are reconstructed.'
const PANEL_SOURCE_FR =
  'Chap. 398, case fournie de la salle de traitement — les surfaces carrelées, l’ossature industrielle, les portes, les salissures, le flexible, les luminaires et les débris sont visibles dans la pièce. Les dimensions et espacements exacts sont reconstruits.'
const HIDDEN_SOURCE =
  'Ch. 398 establishes seven doors, but the wall behind the camera is not shown. This placement completes the published count without presenting its position as drawn.'
const HIDDEN_SOURCE_FR =
  'Le chap. 398 établit sept portes, mais le mur derrière la caméra n’est pas montré. Cette implantation complète le compte publié sans présenter sa position comme dessinée.'

const panelTag = (id: string, name: string, nameFr: string): TourDetailTag => ({
  id: `${SPACE_ID}-${id}`,
  spaceId: SPACE_ID,
  name,
  nameFr,
  provenance: 'panel',
  source: PANEL_SOURCE,
  sourceFr: PANEL_SOURCE_FR,
})

export const HEILLY_PROCESSING_DETAIL_TAGS: readonly TourDetailTag[] = [
  panelTag('tiled-floor', 'Stained tiled floor', 'Sol carrelé souillé'),
  panelTag('tiled-ceiling', 'Tiled ceiling', 'Plafond carrelé'),
  panelTag('far-tiled-wall', 'Far tiled wall', 'Mur carrelé du fond'),
  panelTag('camera-tiled-wall', 'Camera-side tiled wall', 'Mur carrelé côté caméra'),
  panelTag('west-tiled-wall', 'Left tiled wall', 'Mur carrelé gauche'),
  panelTag('east-tiled-wall', 'Right tiled wall', 'Mur carrelé droit'),
  panelTag('steel-frame', 'Industrial steel frame', 'Ossature industrielle en acier'),
  panelTag('far-door-01', 'Far door 1', 'Porte du fond 1'),
  panelTag('far-door-02', 'Far door 2', 'Porte du fond 2'),
  panelTag('far-door-03', 'Far door 3', 'Porte du fond 3'),
  panelTag('far-door-04', 'Far door 4', 'Porte du fond 4'),
  panelTag('west-door', 'Left-wall door', 'Porte du mur gauche'),
  panelTag('east-door', 'Right-wall door', 'Porte du mur droit'),
  {
    id: `${SPACE_ID}-camera-door`,
    spaceId: SPACE_ID,
    name: 'Seventh door behind the camera',
    nameFr: 'Septième porte derrière la caméra',
    provenance: 'inferred',
    source: HIDDEN_SOURCE,
    sourceFr: HIDDEN_SOURCE_FR,
  },
  panelTag('service-hose', 'Coiled service hose', 'Flexible de service enroulé'),
  panelTag('wall-lights', 'Small wall lights', 'Petits luminaires muraux'),
  panelTag('stains', 'Wall and door stains', 'Salissures des murs et des portes'),
  panelTag('debris', 'Broken fittings and drag marks', 'Raccords brisés et traces de traînée'),
  panelTag('floor-drain-01', 'Floor drain 1', 'Siphon de sol 1'),
  panelTag('floor-drain-02', 'Floor drain 2', 'Siphon de sol 2'),
]

const DETAIL_BY_SUFFIX = new Map(
  HEILLY_PROCESSING_DETAIL_TAGS.map((tag) => [tag.id.slice(SPACE_ID.length + 1), tag]),
)

function detail(suffix: string): TourDetailTag {
  const found = DETAIL_BY_SUFFIX.get(suffix)
  if (!found) throw new Error(`Unknown processing-room detail tag: ${suffix}`)
  return found
}

function tiledShell(context: ProcessingContext): void {
  const { into, floor, ceilingHeight } = context
  const minX = -18.4
  const maxX = -7.88
  const minZ = -11.9
  const maxZ = -6.65
  const widthX = maxX - minX
  const depthZ = maxZ - minZ
  const wallHeight = ceilingHeight - 0.08

  // The panel is tiled from floor to ceiling, not merely wainscoted.
  into.box([widthX, wallHeight, 0.05], {
    at: [(minX + maxX) / 2, floor + wallHeight / 2, maxZ - 0.03],
    colour: TILE_WHITE,
    tag: detail('far-tiled-wall'),
  })
  into.box([widthX, wallHeight, 0.05], {
    at: [(minX + maxX) / 2, floor + wallHeight / 2, minZ + 0.03],
    colour: TILE_WHITE,
    tag: detail('camera-tiled-wall'),
  })
  into.box([0.05, wallHeight, depthZ], {
    at: [minX + 0.03, floor + wallHeight / 2, (minZ + maxZ) / 2],
    colour: TILE_WHITE,
    tag: detail('west-tiled-wall'),
  })
  into.box([0.05, wallHeight, depthZ], {
    at: [maxX - 0.03, floor + wallHeight / 2, (minZ + maxZ) / 2],
    colour: TILE_WHITE,
    tag: detail('east-tiled-wall'),
  })
  into.box([widthX - 0.08, 0.05, depthZ - 0.08], {
    at: [(minX + maxX) / 2, floor + ceilingHeight - 0.04, (minZ + maxZ) / 2],
    colour: TILE_BORDER,
    tag: detail('tiled-ceiling'),
  })

  // Square floor tiles and dense wall grout reproduce the panel's clinical grid.
  into.box([widthX - 0.12, 0.018, depthZ - 0.12], {
    at: [(minX + maxX) / 2, floor + 0.009, (minZ + maxZ) / 2],
    colour: TILE_BORDER,
    tag: detail('tiled-floor'),
  })
  for (let x = minX + 0.5; x < maxX; x += 0.5) {
    into.box([0.018, 0.012, depthZ - 0.12], {
      at: [x, floor + 0.02, (minZ + maxZ) / 2],
      colour: TILE_GROUT,
      tag: detail('tiled-floor'),
    })
    into.box([0.02, wallHeight, 0.012], {
      at: [x, floor + wallHeight / 2, maxZ - 0.065],
      colour: TILE_GROUT,
      tag: detail('far-tiled-wall'),
    })
    into.box([0.02, wallHeight, 0.012], {
      at: [x, floor + wallHeight / 2, minZ + 0.065],
      colour: TILE_GROUT,
      tag: detail('camera-tiled-wall'),
    })
  }
  for (let z = minZ + 0.5; z < maxZ; z += 0.5) {
    into.box([widthX - 0.12, 0.012, 0.018], {
      at: [(minX + maxX) / 2, floor + 0.02, z],
      colour: TILE_GROUT,
      tag: detail('tiled-floor'),
    })
    into.box([0.012, wallHeight, 0.02], {
      at: [minX + 0.065, floor + wallHeight / 2, z],
      colour: TILE_GROUT,
      tag: detail('west-tiled-wall'),
    })
    into.box([0.012, wallHeight, 0.02], {
      at: [maxX - 0.065, floor + wallHeight / 2, z],
      colour: TILE_GROUT,
      tag: detail('east-tiled-wall'),
    })
  }
  for (let y = 0.5; y < wallHeight; y += 0.5) {
    into.box([widthX, 0.018, 0.012], {
      at: [(minX + maxX) / 2, floor + y, maxZ - 0.065],
      colour: TILE_GROUT,
      tag: detail('far-tiled-wall'),
    })
    into.box([widthX, 0.018, 0.012], {
      at: [(minX + maxX) / 2, floor + y, minZ + 0.065],
      colour: TILE_GROUT,
      tag: detail('camera-tiled-wall'),
    })
    into.box([0.012, 0.018, depthZ], {
      at: [minX + 0.065, floor + y, (minZ + maxZ) / 2],
      colour: TILE_GROUT,
      tag: detail('west-tiled-wall'),
    })
    into.box([0.012, 0.018, depthZ], {
      at: [maxX - 0.065, floor + y, (minZ + maxZ) / 2],
      colour: TILE_GROUT,
      tag: detail('east-tiled-wall'),
    })
  }
}

function industrialFrame(context: ProcessingContext): void {
  const { into, floor, ceilingHeight } = context
  const minX = -18.4
  const maxX = -7.88
  const minZ = -11.9
  const maxZ = -6.65
  const beamY = floor + ceilingHeight - 0.18

  for (const x of [minX + 0.16, -15.75, -13.14, -10.5, maxX - 0.16]) {
    into.box([0.18, 0.28, maxZ - minZ], {
      at: [x, beamY, (minZ + maxZ) / 2],
      colour: STEEL_DARK,
      tag: detail('steel-frame'),
    })
  }
  for (const z of [minZ + 0.12, maxZ - 0.12]) {
    into.box([maxX - minX, 0.3, 0.2], {
      at: [(minX + maxX) / 2, beamY, z],
      colour: STEEL_DARK,
      tag: detail('steel-frame'),
    })
    for (const x of [minX + 0.16, -13.14, maxX - 0.16]) {
      into.box([0.22, ceilingHeight, 0.22], {
        at: [x, floor + ceilingHeight / 2, z],
        colour: STEEL_DARK,
        tag: detail('steel-frame'),
      })
    }
  }
}

function singleDoor(into: BanquetDetailBuilder, door: DoorPlacement): void {
  const [x, y, z] = door.at
  const rot = [0, door.rotY, 0] as Point3
  const doorWidth = 1.05
  const doorHeight = 2.25

  // Heavy steel door frame
  into.box([doorWidth + 0.14, doorHeight + 0.08, 0.14], {
    at: [x, y + (doorHeight + 0.08) / 2, z],
    rotation: rot,
    colour: STEEL_DARK,
    tag: door.tag,
  })
  // Pale, vertically brushed service door from the panel.
  into.box([doorWidth, doorHeight, 0.06], {
    at: [x, y + doorHeight / 2, z],
    rotation: rot,
    colour: 0xa9aaa6,
    tag: door.tag,
  })
  for (const offset of [-0.32, 0, 0.32]) {
    const alongX = Math.cos(door.rotY) * offset
    const alongZ = -Math.sin(door.rotY) * offset
    into.box([0.018, doorHeight - 0.12, 0.015], {
      at: [x + alongX, y + doorHeight / 2, z + alongZ - 0.04],
      rotation: rot,
      colour: 0x7f817f,
      tag: door.tag,
    })
  }
  // Chrome handle and latch
  const handleX = x + Math.cos(door.rotY) * 0.38
  const handleZ = z - Math.sin(door.rotY) * 0.38
  into.box([0.04, 0.14, 0.1], {
    at: [handleX, y + 1.02, handleZ],
    rotation: rot,
    colour: CHROME,
    tag: door.tag,
  })
  // Small numbered latch plate beside each frame.
  into.box([0.12, 0.2, 0.08], {
    at: [handleX + Math.cos(door.rotY) * 0.18, y + 1.05, handleZ - Math.sin(door.rotY) * 0.18],
    rotation: rot,
    colour: STEEL_BRUSHED,
    tag: door.tag,
  })
}

function sevenDoors(context: ProcessingContext): void {
  const { into, floor } = context
  const northZ = -6.65 - 0.06
  const westX = -18.4 + 0.06
  const eastX = -7.88 - 0.06
  const nearZ = -11.9 + 0.06

  // Four doors are visible across the far wall in the chapter 398 panel.
  const northDoors = [
    [-16.75, 'far-door-01'],
    [-14.55, 'far-door-02'],
    [-11.7, 'far-door-03'],
    [-9.5, 'far-door-04'],
  ] as const
  for (const [doorX, tag] of northDoors) {
    singleDoor(into, { at: [doorX, floor, northZ], rotY: 0, tag: detail(tag) })
  }
  // One service door on each side wall; the seventh portal route is behind the camera.
  singleDoor(into, {
    at: [westX, floor, -9.75],
    rotY: Math.PI / 2,
    tag: detail('west-door'),
  })
  singleDoor(into, {
    at: [eastX, floor, -8.9],
    rotY: Math.PI / 2,
    tag: detail('east-door'),
  })
  singleDoor(into, { at: [-16.1, floor, nearZ], rotY: 0, tag: detail('camera-door') })
}

function coiledWallHose(into: BanquetDetailBuilder, floor: number): void {
  const wallX = -7.98
  const centerZ = -9.8

  into.box([0.12, 0.16, 0.32], {
    at: [wallX, floor + 1.82, centerZ],
    colour: STEEL_BRUSHED,
    tag: detail('service-hose'),
  })
  for (const offset of [-0.13, 0, 0.13]) {
    into.curve(
      [
        [wallX - 0.08, floor + 1.75, centerZ - 0.3 + offset],
        [wallX - 0.1, floor + 1.35, centerZ - 0.42 + offset],
        [wallX - 0.1, floor + 0.95, centerZ + offset],
        [wallX - 0.1, floor + 1.35, centerZ + 0.42 + offset],
        [wallX - 0.08, floor + 1.75, centerZ + 0.3 + offset],
      ],
      0.018,
      { at: [0, 0, 0], colour: CHROME, tag: detail('service-hose') },
    )
  }
  into.curve(
    [
      [wallX - 0.08, floor + 1.78, centerZ + 0.34],
      [wallX - 0.14, floor + 1.42, centerZ + 0.5],
      [wallX - 0.18, floor + 1.12, centerZ + 0.62],
    ],
    0.018,
    { at: [0, 0, 0], colour: CHROME, tag: detail('service-hose') },
  )
}

function floorDrain(into: BanquetDetailBuilder, at: Point3, tag: TourDetailTag): void {
  const [x, floorY, z] = at
  const y = floorY + 0.005

  // Stainless outer ring flush with floor
  into.ring(
    { radius: 0.28, tube: 0.02 },
    { at: [x, y, z], rotation: [Math.PI / 2, 0, 0], colour: STEEL_BRUSHED, tag },
  )
  // Recessed dark well
  into.cylinder(
    { radius: 0.26, height: 0.02, sides: 16 },
    { at: [x, y - 0.01, z], colour: 0x14181c, tag },
  )
  // Drain cross grating
  into.box([0.5, 0.006, 0.03], { at: [x, y, z], colour: STEEL_DARK, tag })
  into.box([0.03, 0.006, 0.5], { at: [x, y, z], colour: STEEL_DARK, tag })
}

function stainsAndDebris(into: BanquetDetailBuilder, floor: number): void {
  const stain = 0x514343
  const farZ = -6.73

  // Long drips on the first far-wall door and scattered impact marks.
  into.curve(
    [
      [-16.75, floor + 1.75, farZ - 0.04],
      [-16.65, floor + 1.45, farZ - 0.04],
      [-16.83, floor + 1.12, farZ - 0.04],
      [-16.72, floor + 0.65, farZ - 0.04],
    ],
    0.045,
    { at: [0, 0, 0], colour: stain, tag: detail('stains') },
  )
  for (const [x, y] of [
    [-16.1, 1.35],
    [-12.65, 1.7],
    [-11.95, 0.9],
    [-9.0, 1.45],
  ] as const) {
    into.sphere([0.08, 0.16, 0.025], {
      at: [x, floor + y, farZ - 0.04],
      colour: stain,
      tag: detail('stains'),
    })
  }

  // Broken fittings and drag marks collect along the right wall.
  for (const [x, z, angle] of [
    [-8.25, -10.75, 0.35],
    [-8.45, -10.45, -0.55],
    [-8.2, -10.1, 0.8],
    [-8.55, -9.95, -0.2],
  ] as const) {
    into.box([0.45, 0.05, 0.08], {
      at: [x, floor + 0.035, z],
      rotation: [0, angle, 0],
      colour: STEEL_DARK,
      tag: detail('debris'),
    })
  }
  into.curve(
    [
      [-8.1, floor + 0.04, -10.9],
      [-8.35, floor + 0.05, -10.6],
      [-8.18, floor + 0.04, -10.3],
      [-8.5, floor + 0.04, -10.0],
    ],
    0.022,
    { at: [0, 0, 0], colour: STEEL_DARK, tag: detail('debris') },
  )
}

function wallLights(into: BanquetDetailBuilder, floor: number): void {
  for (const [x, z, rotY] of [
    [-18.28, -10.2, Math.PI / 2],
    [-18.28, -7.35, Math.PI / 2],
    [-8.0, -10.7, Math.PI / 2],
    [-8.0, -7.25, Math.PI / 2],
  ] as const) {
    into.box([0.14, 0.38, 0.12], {
      at: [x, floor + 2.85, z],
      rotation: [0, rotY, 0],
      colour: TILE_WHITE,
      tag: detail('wall-lights'),
    })
    into.box([0.16, 0.42, 0.05], {
      at: [x, floor + 2.85, z],
      rotation: [0, rotY, 0],
      colour: STEEL_DARK,
      tag: detail('wall-lights'),
    })
  }
}

export function dressHeillyProcessingArchitecture(context: ProcessingContext): void {
  const { into, floor, structures } = context
  tiledShell(context)
  industrialFrame(context)
  sevenDoors(context)
  coiledWallHose(into, floor)
  wallLights(into, floor)
  stainsAndDebris(into, floor)

  // Floor drains
  const drains = structures.filter((s) => s.id.includes('floor-drain'))
  if (drains.length > 0) {
    for (const [index, drain] of drains.entries()) {
      floorDrain(
        into,
        [drain.at[0], floor, drain.at[1]],
        detail(`floor-drain-${String(index + 1).padStart(2, '0')}`),
      )
    }
  } else {
    floorDrain(into, [-13.6, floor, -9.2], detail('floor-drain-01'))
    floorDrain(into, [-11.8, floor, -9.2], detail('floor-drain-02'))
  }
}
