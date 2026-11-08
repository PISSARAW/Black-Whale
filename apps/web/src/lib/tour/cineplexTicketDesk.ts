import {
  CineplexSurface,
  dressStanchionLine,
  CINE_WOOD,
  CINE_MARBLE,
  CINE_STEEL,
  CINE_GLASS,
  CINE_POSTER_FRAME,
  CINE_NEON_BLUE,
  CINE_SCREEN_GLOW,
} from './cineplexDetailSurface'
import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'

/** Main ticket desk counter base and marble counter cap */
function dressTicketCounterBase(surface: CineplexSurface): void {
  // Recessed kickplate
  surface.box([surface.width - 0.2, 0.12, surface.depth - 0.2], [0, 0.06, 0], 0x151515)
  // Main counter body with polished wood
  surface.box([surface.width, 0.95, surface.depth], [0, 0.58, 0], CINE_WOOD)
  // Countertop marble slab
  surface.box([surface.width + 0.1, 0.08, surface.depth + 0.1], [0, 1.1, 0], CINE_MARBLE)
}

/** Glazed partition window with ticket pass slot and speaker grille */
function dressSingleTicketWindow(surface: CineplexSurface, zOffset: number): void {
  const windowY = 1.14
  // Vertical mullion posts
  for (const dz of [-0.95, 0.95]) {
    surface.box([0.08, 1.3, 0.08], [0, windowY + 0.65, zOffset + dz], CINE_STEEL)
  }
  // Top header bar
  surface.box([0.08, 0.08, 1.98], [0, windowY + 1.26, zOffset], CINE_STEEL)
  // Glass pane
  surface.box([0.02, 1.1, 1.8], [0, windowY + 0.68, zOffset], CINE_GLASS)
  // Ticket pass slot (counter level gap)
  surface.box([0.15, 0.04, 0.45], [0, windowY + 0.04, zOffset], 0x18181c)
  // Speaker intercom grille
  surface.cylinder(
    { radius: 0.06, height: 0.03, sides: 12 },
    [0, windowY + 0.6, zOffset],
    CINE_STEEL,
  )

  // Clerk monitor and keyboard inside
  surface.box([0.3, 0.22, 0.04], [0.35, windowY + 0.25, zOffset], CINE_SCREEN_GLOW)
  surface.box([0.22, 0.03, 0.35], [0.22, windowY + 0.06, zOffset], 0x222225)
}

/** Suspended timetable display screens "TICKETS / SHOWTIMES" */
function dressTicketTimetableScreens(surface: CineplexSurface): void {
  const screenY = 3.6
  // Support rods
  for (const z of [-3, 0, 3]) {
    surface.cylinder({ radius: 0.03, height: 1.8, sides: 8 }, [0, screenY + 0.9, z], CINE_STEEL)
  }
  // Main screen casing
  surface.box([0.1, 1.1, 7.5], [0, screenY, 0], CINE_POSTER_FRAME)

  // 4 electronic timetable screens (screens 1-2, 3-4, 5-6, 7-8)
  for (let i = -1.5; i <= 1.5; i += 1) {
    const screenZ = i * 1.8
    surface.box([0.12, 0.95, 1.65], [-0.01, screenY, screenZ], 0x0c1520)
    // Blue neon header strip ("TICKETS & SHOWTIMES")
    surface.box([0.14, 0.15, 1.55], [-0.02, screenY + 0.35, screenZ], CINE_NEON_BLUE)
    // Film title & time lines
    surface.box([0.13, 0.03, 1.4], [-0.02, screenY + 0.12, screenZ], 0xe0e6ed)
    surface.box([0.13, 0.03, 1.3], [-0.02, screenY - 0.05, screenZ], 0xe0e6ed)
    surface.box([0.13, 0.03, 1.2], [-0.02, screenY - 0.22, screenZ], CINE_SCREEN_GLOW)
    surface.box([0.13, 0.03, 1.1], [-0.02, screenY - 0.35, screenZ], CINE_SCREEN_GLOW)
  }
}

/** Queue guidance lanes with stanchions in front of ticket windows */
export function dressTicketQueues(into: BanquetDetailBuilder, floor: number): void {
  // 3 queuing corridors leading toward the ticket windows (windows around X = 23.2, queue extends west toward X = 18.5)
  const windowZs = [-2.5, 0, 2.5]
  for (const wz of windowZs) {
    const from: Point3 = [18.2, floor, wz - 0.8]
    const to: Point3 = [22.4, floor, wz - 0.8]
    dressStanchionLine({ into, from, to, count: 4 })
  }
  // Lateral lane barrier
  const endFrom: Point3 = [18.2, floor, -3.3]
  const endTo: Point3 = [18.2, floor, 3.3]
  dressStanchionLine({ into, from: endFrom, to: endTo, count: 5 })
}

/** Metallic brochure and movie schedule rack */
function dressBrochureStand(surface: CineplexSurface, zOffset: number): void {
  // Heavy floor base
  surface.box([0.45, 0.05, 0.4], [1.6, 0.03, zOffset], CINE_STEEL)
  // Upright support column
  surface.cylinder({ radius: 0.025, height: 1.1, sides: 8 }, [1.6, 0.58, zOffset], CINE_STEEL)
  // Slanted multi-tier magazine tray
  surface.box([0.4, 0.45, 0.12], [1.6, 1.15, zOffset], 0x222226)
  // Displayed printed pamphlets
  surface.box([0.34, 0.38, 0.04], [1.6, 1.18, zOffset + 0.03], CINE_SCREEN_GLOW)
}

/** Complete ticket desk with 3 glazed service booths, screens and queues */
export function dressTicketWindows(surface: CineplexSurface): void {
  dressTicketCounterBase(surface)
  // 3 active ticketing booths
  for (const z of [-2.5, 0, 2.5]) {
    dressSingleTicketWindow(surface, z)
  }
  dressBrochureStand(surface, -4.2)
  dressBrochureStand(surface, 4.2)
  dressTicketTimetableScreens(surface)
  dressTicketQueues(surface.into, surface.floor)
}
