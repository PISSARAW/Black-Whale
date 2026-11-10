import {
  TserriednichRoomSurface,
  TSERRIEDNICH_CLOCK_FACE,
  TSERRIEDNICH_CLOCK_HAND,
  TSERRIEDNICH_COUNTER_STONE,
  TSERRIEDNICH_DARK_WOOD,
  TSERRIEDNICH_FRIDGE_STEEL,
  TSERRIEDNICH_FRIDGE_WHITE,
  TSERRIEDNICH_GOLD_TRIM,
  TSERRIEDNICH_PANEL_WOOD,
  TSERRIEDNICH_STONE,
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

/** The sideboard built into the salon wall, left of the mantel. */
function sideboard(surface: TserriednichRoomSurface): void {
  const h = surface.structure.height
  surface.box([surface.width, h, surface.depth], [0, h / 2, 0], TSERRIEDNICH_PANEL_WOOD)
  surface.box([surface.width * 0.92, h * 0.3, surface.depth * 0.5], [0, h * 0.78, 0], TSERRIEDNICH_DARK_WOOD)
  surface.box([surface.width * 0.98, 0.03, surface.depth * 0.6], [0, h + 0.02, 0], TSERRIEDNICH_GOLD_TRIM)
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

export function dressTserriednichLivingFurniture(surface: TserriednichRoomSurface): void {
  if (surface.structure.id.endsWith('-mantel-clock')) {
    mantelClock(surface)
    return
  }
  if (surface.structure.kind === 'seat') sofa(surface)
  else if (surface.structure.kind === 'table') coffeeTable(surface)
  else if (surface.structure.kind === 'cabinet') sideboard(surface)
}

export function dressTserriednichKitchenFurniture(surface: TserriednichRoomSurface): void {
  if (surface.structure.id.endsWith('-counter-08')) counterWithFridge(surface)
  else if (surface.structure.id.endsWith('-counter-09')) kitchenIsland(surface)
}
