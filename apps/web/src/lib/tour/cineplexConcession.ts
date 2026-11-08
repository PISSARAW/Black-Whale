import {
  CineplexSurface,
  CINE_WOOD,
  CINE_MARBLE,
  CINE_STEEL,
  CINE_GLASS,
  CINE_POPCORN_GLOW,
  CINE_POPCORN_RED,
  CINE_POPCORN_WHITE,
  CINE_POSTER_FRAME,
  CINE_NEON_AMBER,
  CINE_SCREEN_GLOW,
  CINE_VELVET,
} from './cineplexDetailSurface'

/** Concession main counter body and marble surface */
function dressCounterBase(surface: CineplexSurface): void {
  const halfW = surface.width / 2
  const halfD = surface.depth / 2
  // Recessed kickplate
  surface.box([surface.width - 0.2, 0.12, surface.depth - 0.2], [0, 0.06, 0], 0x151515)
  // Main counter body with dark wood paneling
  surface.box([surface.width, 0.95, surface.depth], [0, 0.58, 0], CINE_WOOD)
  // Polished marble countertop
  surface.box([surface.width + 0.1, 0.08, surface.depth + 0.1], [0, 1.1, 0], CINE_MARBLE)

  // End panel details and waste bins with push flaps
  for (const sign of [-1, 1]) {
    const z = sign * (halfD - 0.6)
    surface.box([0.7, 0.85, 0.8], [halfW - 0.5, 0.5, z], 0x222226)
    surface.box([0.02, 0.3, 0.4], [halfW + 0.01, 0.7, z], CINE_STEEL)
  }
}

/** Glass display showcase with warming shelves and hot snacks */
function dressCounterGlassShowcase(surface: CineplexSurface, zOffset: number): void {
  // Showcase metal base
  surface.box([0.9, 0.06, 2.2], [0, 1.17, zOffset], CINE_STEEL)
  // Glass cabinet
  surface.box([0.88, 0.6, 2.16], [0, 1.5, zOffset], CINE_GLASS)
  // Interior illuminated warming shelf
  surface.box([0.75, 0.02, 2.0], [0, 1.45, zOffset], CINE_POPCORN_GLOW)
  // Displayed snacks (nachos and pretzels)
  for (let i = -2; i <= 2; i++) {
    surface.box([0.3, 0.04, 0.25], [0, 1.48, zOffset + i * 0.35], 0x9e6a38)
  }
}

/** Commercial cinema popcorn machine with kettle and striped tubs */
function dressPopcornMachine(surface: CineplexSurface, zOffset: number): void {
  const machineX = 0
  const machineY = 1.14
  // Red metallic machine base and header
  surface.box([0.9, 0.12, 1.1], [machineX, machineY + 0.06, zOffset], CINE_POPCORN_RED)
  surface.box([0.92, 0.16, 1.12], [machineX, machineY + 0.95, zOffset], CINE_POPCORN_RED)
  // Glass chamber
  surface.box([0.86, 0.75, 1.06], [machineX, machineY + 0.5, zOffset], CINE_GLASS)
  // Suspended metal popping kettle
  surface.cylinder(
    { radius: 0.22, height: 0.18, sides: 12 },
    [machineX, machineY + 0.62, zOffset],
    CINE_STEEL,
  )
  // Popcorn mound in chamber
  surface.box([0.8, 0.22, 1.0], [machineX, machineY + 0.23, zOffset], CINE_POPCORN_GLOW)
  // Stacked striped popcorn tubs on machine roof
  for (const dz of [-0.3, 0, 0.3]) {
    surface.cylinder(
      { radius: 0.11, height: 0.25, bottom: 0.08, sides: 10 },
      [machineX, machineY + 1.15, zOffset + dz],
      CINE_POPCORN_WHITE,
    )
    surface.cylinder(
      { radius: 0.115, height: 0.06, bottom: 0.1, sides: 10 },
      [machineX, machineY + 1.2, zOffset + dz],
      CINE_POPCORN_RED,
    )
  }
}

/** Multi-tap soda fountain and cup dispenser */
function dressSodaFountain(surface: CineplexSurface, zOffset: number): void {
  // Main stainless steel soda dispenser body
  surface.box([0.7, 0.65, 1.2], [-0.1, 1.46, zOffset], CINE_STEEL)
  // Drip tray
  surface.box([0.3, 0.04, 1.1], [0.3, 1.16, zOffset], 0x333338)
  // Dispenser nozzles
  for (let i = -2; i <= 2; i++) {
    surface.box([0.1, 0.12, 0.08], [0.28, 1.42, zOffset + i * 0.2], 0x1a1a1a)
    surface.cylinder({ radius: 0.02, height: 0.06, sides: 8 }, [0.32, 1.34, zOffset + i * 0.2], CINE_STEEL)
  }
  // Stacked paper cups beside the machine
  surface.cylinder({ radius: 0.09, height: 0.45, bottom: 0.07, sides: 10 }, [0.2, 1.36, zOffset + 0.75], CINE_POPCORN_WHITE)
}

/** POS cash register terminal */
function dressPosRegister(surface: CineplexSurface, zOffset: number): void {
  // Terminal base
  surface.box([0.35, 0.08, 0.35], [0.1, 1.18, zOffset], 0x222225)
  // Angled touch screen facing attendant
  surface.box([0.32, 0.24, 0.04], [-0.05, 1.36, zOffset], CINE_SCREEN_GLOW)
  // Customer facing receipt / card terminal
  surface.box([0.15, 0.08, 0.2], [0.38, 1.18, zOffset], 0x111113)
}

/** Suspended overhead menu boards "FOOD & DRINKS" */
function dressConcessionMenuBoard(surface: CineplexSurface): void {
  const menuY = 3.6
  // Suspension metal rods
  for (const z of [-3, 0, 3]) {
    surface.cylinder({ radius: 0.03, height: 1.8, sides: 8 }, [0, menuY + 0.9, z], CINE_STEEL)
  }
  // Main black frame for backlit menu boards
  surface.box([0.1, 1.1, 7.5], [0, menuY, 0], CINE_POSTER_FRAME)
  // Backlit display panels
  for (let i = -2; i <= 2; i++) {
    const panelZ = i * 1.45
    surface.box([0.12, 0.95, 1.35], [0.01, menuY, panelZ], 0x0f1820)
    // Amber title header strip ("POPCORN", "DRINKS", "COMBOS")
    surface.box([0.14, 0.15, 1.25], [0.02, menuY + 0.35, panelZ], CINE_NEON_AMBER)
    // Content lines
    surface.box([0.13, 0.03, 1.1], [0.02, menuY + 0.05, panelZ], 0xd0d5dd)
    surface.box([0.13, 0.03, 1.0], [0.02, menuY - 0.15, panelZ], 0xd0d5dd)
    surface.box([0.13, 0.03, 0.9], [0.02, menuY - 0.32, panelZ], CINE_POPCORN_GLOW)
  }
}

/** Backwall commercial beverage cooler with illuminated drink shelves */
function dressBeverageCooler(surface: CineplexSurface, zOffset: number): void {
  const coolerX = -1.2
  // Black metal refrigeration cabinet
  surface.box([0.7, 2.1, 1.8], [coolerX, 1.05, zOffset], 0x18181c)
  // Glazed sliding doors
  surface.box([0.05, 1.9, 1.7], [coolerX + 0.35, 1.05, zOffset], CINE_GLASS)
  // Illuminated interior shelves with cold bottles
  for (let y = 0.4; y <= 1.8; y += 0.45) {
    surface.box([0.5, 0.02, 1.6], [coolerX, y, zOffset], CINE_SCREEN_GLOW)
    for (let dz = -0.6; dz <= 0.6; dz += 0.3) {
      surface.cylinder({ radius: 0.04, height: 0.22, sides: 8 }, [coolerX + 0.1, y + 0.11, zOffset + dz], CINE_NEON_AMBER)
    }
  }
}

/** Condiment and napkin station island */
function dressCondimentStation(surface: CineplexSurface, zOffset: number): void {
  // Wood cabinet body
  surface.box([0.75, 0.95, 1.2], [1.8, 0.48, zOffset], CINE_WOOD)
  surface.box([0.8, 0.06, 1.25], [1.8, 0.98, zOffset], CINE_MARBLE)
  // Napkin dispensers
  surface.box([0.18, 0.16, 0.22], [1.8, 1.09, zOffset - 0.35], CINE_STEEL)
  // Straw container
  surface.cylinder({ radius: 0.06, height: 0.2, sides: 10 }, [1.8, 1.11, zOffset], CINE_STEEL)
  // Sauce pumps (butter / seasonings)
  surface.cylinder({ radius: 0.07, height: 0.22, sides: 10 }, [1.8, 1.12, zOffset + 0.35], CINE_STEEL)
}

/** Complete concession counter with popcorn, soda, coolers, condiments and registers */
export function dressConcessionCounter(surface: CineplexSurface): void {
  dressCounterBase(surface)
  dressPopcornMachine(surface, -1.8)
  dressCounterGlassShowcase(surface, 1.2)
  dressSodaFountain(surface, 3.4)
  dressBeverageCooler(surface, -2.5)
  dressBeverageCooler(surface, 2.5)
  dressCondimentStation(surface, 0)
  dressPosRegister(surface, -3.8)
  dressPosRegister(surface, -0.3)
  dressConcessionMenuBoard(surface)
}

/** Popcorn tub and soda left on Hisoka's seating table (Ch. 393) */
function dressHisokaSnacks(surface: CineplexSurface): void {
  const snackY = 0.58
  const snackX = 0.35
  const snackZ = 0.25
  // Large striped popcorn bucket
  surface.cylinder(
    { radius: 0.14, height: 0.24, bottom: 0.1, sides: 12 },
    [snackX, snackY + 0.12, snackZ],
    CINE_POPCORN_WHITE,
  )
  surface.cylinder(
    { radius: 0.142, height: 0.06, bottom: 0.12, sides: 12 },
    [snackX, snackY + 0.16, snackZ],
    CINE_POPCORN_RED,
  )
  // Popcorn overflowing top
  surface.sphere([0.12, 0.08, 0.12], [snackX, snackY + 0.24, snackZ], CINE_POPCORN_GLOW)

  // Soda drink cup with lid and straw
  surface.cylinder(
    { radius: 0.07, height: 0.2, bottom: 0.05, sides: 10 },
    [snackX - 0.25, snackY + 0.1, snackZ + 0.15],
    0x203550,
  )
  surface.cylinder(
    { radius: 0.072, height: 0.02, sides: 10 },
    [snackX - 0.25, snackY + 0.21, snackZ + 0.15],
    0xeeeeee,
  )
  // Straw
  surface.cylinder(
    { radius: 0.008, height: 0.12, sides: 6 },
    [snackX - 0.25, snackY + 0.27, snackZ + 0.15],
    CINE_POPCORN_RED,
  )
}

/** Central circular/multi-sided cushioned seating island (Ch. 393) */
export function dressSeatingIsland(surface: CineplexSurface): void {
  const radius = surface.width / 2
  // Wooden plinth base
  surface.cylinder({ radius, height: 0.1, sides: 16 }, [0, 0.05, 0], CINE_WOOD)
  // Padded leather banquette seat
  surface.cylinder({ radius: radius - 0.05, height: 0.38, sides: 16 }, [0, 0.29, 0], CINE_VELVET)
  // Center backrest / architectural planter column
  surface.cylinder({ radius: radius * 0.45, height: 0.95, sides: 16 }, [0, 0.48, 0], CINE_WOOD)
  surface.cylinder({ radius: radius * 0.48, height: 0.08, sides: 16 }, [0, 0.98, 0], CINE_MARBLE)

  // Low round drinks/snack table in the island where Hisoka sits
  surface.cylinder({ radius: 0.42, height: 0.55, sides: 12 }, [0.35, 0.28, 0.25], CINE_WOOD)
  surface.cylinder({ radius: 0.45, height: 0.04, sides: 12 }, [0.35, 0.57, 0.25], CINE_MARBLE)
  dressHisokaSnacks(surface)
}
