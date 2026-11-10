import {
  TserriednichRoomSurface,
  TSERRIEDNICH_CLOCK_FACE,
  TSERRIEDNICH_CLOCK_HAND,
  TSERRIEDNICH_COUNTER_STONE,
  TSERRIEDNICH_DARK_WOOD,
  TSERRIEDNICH_FRIDGE_STEEL,
  TSERRIEDNICH_FRIDGE_WHITE,
  TSERRIEDNICH_GLASS,
  TSERRIEDNICH_GOLD_TRIM,
  TSERRIEDNICH_PANEL_WOOD,
  TSERRIEDNICH_STONE,
  TSERRIEDNICH_URN,
  TSERRIEDNICH_WICKER,
} from './tserriednichRoomDetailSurface'

function sofa(surface: TserriednichRoomSurface): void {
  surface.box([surface.width * 0.92, 0.42, surface.depth * 0.85], [0, -0.21, 0], TSERRIEDNICH_DARK_WOOD)
  surface.box([surface.width * 0.92, 0.26, 0.18], [0, 0.08, surface.depth * 0.3], TSERRIEDNICH_DARK_WOOD)
  for (const sx of [-1, 1]) {
    surface.box([0.16, 0.5, surface.depth * 0.85], [sx * surface.width * 0.46, -0.04, 0], TSERRIEDNICH_DARK_WOOD)
  }
}

function coffeeTable(surface: TserriednichRoomSurface): void {
  surface.box([surface.width * 0.95, 0.04, surface.depth * 0.95], [0, 0, 0], TSERRIEDNICH_GOLD_TRIM)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      surface.box(
        [0.05, surface.structure.height - 0.04, 0.05],
        [sx * surface.width * 0.42, -(surface.structure.height - 0.04) / 2, sz * surface.depth * 0.42],
        TSERRIEDNICH_DARK_WOOD,
      )
    }
  }
}

/** The tall double-door cabinet against the salon wall: a carcass, two panelled
 * door leaves with brass pulls, a plinth base and a moulded cornice — not a
 * flat box, which read as a slab rather than a piece of furniture. Shared by
 * the sideboard and the wardrobe further along the same wall. */
function doubleDoorCabinet(surface: TserriednichRoomSurface): void {
  const h = surface.structure.height
  const front = surface.depth / 2

  surface.box([surface.width, h, surface.depth], [0, h / 2, 0], TSERRIEDNICH_DARK_WOOD)
  surface.box([surface.width * 0.96, 0.08, surface.depth * 0.92], [0, 0.04, 0], TSERRIEDNICH_DARK_WOOD)
  surface.box([surface.width * 1.04, 0.06, surface.depth * 1.08], [0, h + 0.03, 0], TSERRIEDNICH_GOLD_TRIM)

  for (const side of [-1, 1]) {
    const doorX = (side * surface.width) / 4
    surface.box([surface.width * 0.46, h * 0.86, 0.02], [doorX, h * 0.46, front + 0.01], TSERRIEDNICH_PANEL_WOOD)
    surface.box([surface.width * 0.36, h * 0.64, 0.025], [doorX, h * 0.46, front + 0.015], TSERRIEDNICH_DARK_WOOD)
    surface.sphere(
      [0.025, 0.025, 0.025],
      [doorX - side * surface.width * 0.17, h * 0.46, front + 0.03],
      TSERRIEDNICH_GOLD_TRIM,
    )
  }
}

/** The glass-fronted cabinet near the servants' door: a lit case with two visible shelves. */
function displayCabinet(surface: TserriednichRoomSurface): void {
  const h = surface.structure.height
  const front = surface.depth / 2

  surface.box([surface.width, h, surface.depth], [0, h / 2, 0], TSERRIEDNICH_DARK_WOOD)
  surface.box([surface.width * 0.96, 0.06, surface.depth * 0.9], [0, 0.03, 0], TSERRIEDNICH_DARK_WOOD)
  surface.box([surface.width * 1.04, 0.05, surface.depth * 1.08], [0, h + 0.025, 0], TSERRIEDNICH_GOLD_TRIM)

  surface.box([surface.width * 0.84, h * 0.82, 0.015], [0, h * 0.46, front + 0.005], TSERRIEDNICH_GLASS)
  surface.box([surface.width * 0.86, 0.03, 0.02], [0, h * 0.87, front + 0.01], TSERRIEDNICH_GOLD_TRIM)
  surface.box([surface.width * 0.86, 0.03, 0.02], [0, h * 0.06, front + 0.01], TSERRIEDNICH_GOLD_TRIM)
  for (const ratio of [0.3, 0.62]) {
    surface.box([surface.width * 0.76, 0.02, surface.depth * 0.7], [0, h * ratio, 0], TSERRIEDNICH_PANEL_WOOD)
  }
}

/** The open shelving south of the mantel: three shelves with a few small pieces on them. */
function sideShelf(surface: TserriednichRoomSurface): void {
  const h = surface.structure.height
  const front = surface.depth / 2

  surface.box([0.04, h, surface.depth], [-surface.width / 2 + 0.02, h / 2, 0], TSERRIEDNICH_PANEL_WOOD)
  surface.box([0.04, h, surface.depth], [surface.width / 2 - 0.02, h / 2, 0], TSERRIEDNICH_PANEL_WOOD)
  surface.box([surface.width, h, 0.03], [0, h / 2, -front + 0.015], TSERRIEDNICH_PANEL_WOOD)
  for (const ratio of [0, 0.5, 1]) {
    surface.box([surface.width, 0.03, surface.depth], [0, h * ratio, 0], TSERRIEDNICH_DARK_WOOD)
  }
  surface.box([0.12, 0.12, 0.1], [surface.width * 0.2, h * 0.58, front * 0.3], TSERRIEDNICH_GOLD_TRIM)
  surface.box([0.1, 0.18, 0.1], [-surface.width * 0.15, h * 0.09, front * 0.2], TSERRIEDNICH_STONE)
}

/** A woven accent chair, close enough to the sofa to read as part of the same grouping. */
function accentChair(surface: TserriednichRoomSurface): void {
  const w = surface.width
  const d = surface.depth

  surface.box([w * 0.8, 0.08, d * 0.8], [0, 0.38, 0], TSERRIEDNICH_WICKER)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      surface.cylinder({ radius: 0.025, height: 0.36 }, [sx * w * 0.35, 0.18, sz * d * 0.35], TSERRIEDNICH_DARK_WOOD)
    }
  }
  for (let i = 0; i < 4; i++) {
    surface.box([w * 0.75, 0.04, 0.03], [0, 0.46 + i * 0.09, d * 0.38], TSERRIEDNICH_WICKER)
  }
  for (const sx of [-1, 1]) {
    surface.box([0.05, 0.18, d * 0.7], [sx * w * 0.42, 0.5, 0], TSERRIEDNICH_WICKER)
  }
}

/** The urn on its plinth near the entrance, glimpsed behind Tserriednich and the butler. */
function urnPedestal(surface: TserriednichRoomSurface): void {
  const h = surface.structure.height
  surface.cylinder({ radius: 0.18, height: h * 0.82, sides: 16 }, [0, h * 0.41, 0], TSERRIEDNICH_STONE)
  surface.box([0.42, 0.05, 0.42], [0, 0.025, 0], TSERRIEDNICH_STONE)
  surface.box([0.34, 0.04, 0.34], [0, h * 0.84, 0], TSERRIEDNICH_GOLD_TRIM)
  surface.sphere([0.16, 0.22, 0.16], [0, h * 1.05, 0], TSERRIEDNICH_URN)
  surface.cylinder({ radius: 0.07, height: 0.1, sides: 12 }, [0, h * 1.22, 0], TSERRIEDNICH_URN)
}

/** The clock on the mantel from chs. 384-387, with a pendulum case beneath it. */
function mantelClock(surface: TserriednichRoomSurface): void {
  const h = surface.structure.height
  surface.box([surface.width, h * 0.55, surface.depth], [0, h * 0.28, 0], TSERRIEDNICH_PANEL_WOOD)
  surface.box([surface.width * 1.02, 0.04, surface.depth * 1.1], [0, h * 0.56, 0], TSERRIEDNICH_GOLD_TRIM)

  surface.box([0.34, 0.5, 0.16], [0, h * 0.85, surface.depth * 0.15], TSERRIEDNICH_DARK_WOOD)
  surface.cylinder({ radius: 0.15, height: 0.04, sides: 20 }, [0, h * 1.02, surface.depth * 0.26], TSERRIEDNICH_CLOCK_FACE)
  surface.box([0.02, 0.1, 0.012], [0, h * 1.04, surface.depth * 0.29], TSERRIEDNICH_CLOCK_HAND)
  surface.box([0.02, 0.06, 0.012], [0.05, h * 1.0, surface.depth * 0.29], TSERRIEDNICH_CLOCK_HAND)
}

function fridge(surface: TserriednichRoomSurface): void {
  const h = Math.max(surface.structure.height, 1.1)
  surface.box([0.75, h, 0.68], [0, h / 2, 0], TSERRIEDNICH_FRIDGE_WHITE)
  surface.box([0.75, h * 0.015, 0.68], [0, h * 0.62, 0], TSERRIEDNICH_FRIDGE_STEEL)
  surface.box([0.035, h * 0.58, 0.02], [0.32, h * 0.66, 0.35], TSERRIEDNICH_FRIDGE_STEEL)
  surface.box([0.035, h * 0.36, 0.02], [0.32, h * 0.2, 0.35], TSERRIEDNICH_FRIDGE_STEEL)
}

/** The counter housing the fridge keeps a matching worktop to either side of it. */
function counterWithFridge(surface: TserriednichRoomSurface): void {
  surface.box([surface.width - 0.85, 0.06, surface.depth], [surface.width * 0.22, 0, 0], TSERRIEDNICH_COUNTER_STONE)
  surface.box(
    [surface.width - 0.85, surface.structure.height - 0.06, surface.depth],
    [surface.width * 0.22, -(surface.structure.height - 0.06) / 2, 0],
    TSERRIEDNICH_PANEL_WOOD,
  )
  fridge(surface)
}

function kitchenIsland(surface: TserriednichRoomSurface): void {
  surface.box([surface.width, surface.structure.height, surface.depth], [0, -surface.structure.height / 2, 0], TSERRIEDNICH_PANEL_WOOD)
  surface.box([surface.width + 0.04, 0.05, surface.depth + 0.04], [0, 0, 0], TSERRIEDNICH_STONE)
}

const DRESSERS_BY_ID: readonly [string, (surface: TserriednichRoomSurface) => void][] = [
  ['-mantel-clock', mantelClock],
  ['-display-cabinet', displayCabinet],
  ['-wardrobe', doubleDoorCabinet],
  ['-side-shelf', sideShelf],
  ['-accent-chair', accentChair],
  ['-urn-pedestal', urnPedestal],
]

export function dressTserriednichLivingFurniture(surface: TserriednichRoomSurface): void {
  const byId = DRESSERS_BY_ID.find(([suffix]) => surface.structure.id.endsWith(suffix))
  if (byId) {
    byId[1](surface)
    return
  }
  if (surface.structure.kind === 'seat') sofa(surface)
  else if (surface.structure.kind === 'table') coffeeTable(surface)
  else if (surface.structure.kind === 'cabinet') doubleDoorCabinet(surface)
}

export function dressTserriednichKitchenFurniture(surface: TserriednichRoomSurface): void {
  if (surface.structure.id.endsWith('-counter-08')) counterWithFridge(surface)
  else if (surface.structure.id.endsWith('-counter-09')) kitchenIsland(surface)
}
