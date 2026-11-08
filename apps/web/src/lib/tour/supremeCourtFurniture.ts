import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  COURT_BRASS,
  COURT_GOLD,
  COURT_LEATHER_DARK,
  COURT_LEATHER_GREEN,
  COURT_LIGHT_DIFFUSER,
  COURT_MAHOGANY,
  COURT_PAPER,
  COURT_WALNUT,
  SupremeCourtSurface,
} from './supremeCourtDetailSurface'

/** Supreme Magistrate Cleapatro's elevated bench (ch. 371, 376) */
export function dressMagistrateBench(surface: SupremeCourtSurface): void {
  const { width: w, depth: d } = surface

  // Monumental curved/stepped mahogany bench structure
  surface.box([w, 1.4, d], [0, 0.7, 0], COURT_MAHOGANY)
  surface.box([w * 0.98, 0.08, d * 0.98], [0, 1.44, 0], COURT_WALNUT)
  surface.box([w + 0.1, 0.08, d + 0.1], [0, 1.5, 0], COURT_GOLD)

  // Recessed carved front panels with gold molding
  for (let x = -w * 0.42; x <= w * 0.42; x += 1.4) {
    surface.box([1.1, 1.0, 0.04], [x, 0.75, d * 0.52], COURT_WALNUT)
    surface.box([1.0, 0.9, 0.02], [x, 0.75, d * 0.54], COURT_GOLD)
  }

  // Dark green leather desk blotter at center
  surface.box([w * 0.5, 0.02, d * 0.7], [0, 1.52, 0], COURT_LEATHER_GREEN)

  // Traditional judicial gavel (marteau de juge) and sounding block
  surface.cylinder({ radius: 0.12, height: 0.04 }, [0.6, 1.54, 0], COURT_MAHOGANY)
  surface.box([0.16, 0.08, 0.08], [0.6, 1.62, 0], COURT_WALNUT)
  surface.cylinder({ radius: 0.015, height: 0.28 }, [0.6, 1.58, -0.16], COURT_MAHOGANY)

  // Law codex books and open case files
  surface.box([0.35, 0.08, 0.26], [-1.0, 1.56, 0.1], COURT_LEATHER_DARK)
  surface.box([0.34, 0.07, 0.25], [-1.0, 1.63, 0.1], COURT_MAHOGANY)
  surface.box([0.4, 0.02, 0.28], [0, 1.54, 0], COURT_PAPER)

  // Brass banker's reading lamp with green shade
  surface.cylinder({ radius: 0.09, height: 0.02 }, [-1.8, 1.53, 0.2], COURT_BRASS)
  surface.cylinder({ radius: 0.015, height: 0.38 }, [-1.8, 1.72, 0.2], COURT_BRASS)
  surface.box([0.28, 0.1, 0.12], [-1.8, 1.92, 0.2], COURT_LEATHER_GREEN)
  surface.sphere([0.08, 0.06, 0.08], [-1.8, 1.9, 0.2], { colour: COURT_LIGHT_DIFFUSER, glow: true })

  // High-backed judicial throne chair behind bench
  surface.box([0.85, 0.12, 0.8], [0, 0.65, -d * 0.75], COURT_LEATHER_DARK)
  surface.box([0.85, 1.5, 0.14], [0, 1.45, -d * 0.75 - 0.35], COURT_LEATHER_DARK)
  surface.box([0.95, 1.6, 0.08], [0, 1.45, -d * 0.75 - 0.42], COURT_MAHOGANY)
  surface.box([0.45, 0.2, 0.08], [0, 2.3, -d * 0.75 - 0.42], COURT_GOLD)
}

/** Left and right clerk desks in front of magistrate's bench */
export function dressClerkDesk(surface: SupremeCourtSurface): void {
  const { width: w, depth: d } = surface

  // Solid mahogany desk structure
  surface.box([w, 0.75, d], [0, 0.375, 0], COURT_MAHOGANY)
  surface.box([w + 0.06, 0.05, d + 0.06], [0, 0.78, 0], COURT_WALNUT)

  // Modesty front panel
  surface.box([w * 0.94, 0.65, 0.04], [0, 0.35, d * 0.48], COURT_WALNUT)

  // Stenographer typewriter and paper stack
  surface.box([0.38, 0.15, 0.32], [0, 0.88, 0], COURT_LEATHER_DARK)
  surface.box([0.3, 0.04, 0.22], [w * 0.3, 0.82, 0.1], COURT_PAPER)

  // Official seal press and document in/out trays
  surface.cylinder({ radius: 0.06, height: 0.18 }, [-w * 0.3, 0.89, -0.1], COURT_BRASS)
  surface.box([0.28, 0.14, 0.34], [-w * 0.3, 0.87, 0.2], COURT_MAHOGANY)

  // Clerk office chairs
  for (const cx of [-w * 0.25, w * 0.25]) {
    surface.box([0.5, 0.08, 0.48], [cx, 0.48, -d * 0.65], COURT_LEATHER_DARK)
    surface.box([0.48, 0.45, 0.06], [cx, 0.74, -d * 0.65 - 0.22], COURT_LEATHER_DARK)
    surface.cylinder({ radius: 0.02, height: 0.46 }, [cx, 0.23, -d * 0.65], COURT_BRASS)
  }
}

/** Central speaker podium / witness lectern (ch. 376) */
export function dressSpeakerPodium(surface: SupremeCourtSurface): void {
  const { width: w, depth: d } = surface

  // Carved wooden podium structure
  surface.box([w, 1.1, d], [0, 0.55, 0], COURT_MAHOGANY)
  surface.box([w * 0.92, 0.9, 0.04], [0, 0.55, d * 0.51], COURT_WALNUT)

  // Slanted document reading shelf
  surface.box([w + 0.08, 0.05, d * 0.7], [0, 1.15, 0.1], COURT_WALNUT)
  surface.box([w * 0.8, 0.02, d * 0.5], [0, 1.18, 0.1], COURT_PAPER)

  // Flexible microphone on brass stem
  surface.cylinder({ radius: 0.01, height: 0.25 }, [0, 1.28, 0.2], COURT_BRASS)
  surface.sphere([0.025, 0.035, 0.025], [0, 1.4, 0.2], COURT_LEATHER_DARK)

  // Brass witness oath rail
  surface.box([w + 0.2, 0.04, 0.04], [0, 1.05, -d * 0.52], COURT_BRASS)
  surface.cylinder({ radius: 0.015, height: 1.0 }, [-w * 0.5, 0.5, -d * 0.52], COURT_BRASS)
  surface.cylinder({ radius: 0.015, height: 1.0 }, [w * 0.5, 0.5, -d * 0.52], COURT_BRASS)
}

/** Long counsel tables for prosecution and defence */
export function dressCounselTable(surface: SupremeCourtSurface): void {
  const { width: w, depth: d } = surface

  // Tabletop and turned legs
  surface.box([w, 0.08, d], [0, 0.76, 0], COURT_WALNUT)
  for (const lx of [-w * 0.45, w * 0.45]) {
    for (const lz of [-d * 0.4, d * 0.4]) {
      surface.cylinder({ radius: 0.04, height: 0.72 }, [lx, 0.36, lz], COURT_MAHOGANY)
    }
  }

  // Modesty front skirt panel
  surface.box([w * 0.92, 0.45, 0.03], [0, 0.5, d * 0.45], COURT_MAHOGANY)

  // Briefcases, dossiers and glass carafes
  for (let x = -w * 0.35; x <= w * 0.35; x += w * 0.35) {
    surface.box([0.45, 0.03, 0.35], [x, 0.81, 0.1], COURT_PAPER)
    surface.box([0.4, 0.08, 0.12], [x, 0.85, -0.2], COURT_LEATHER_DARK)
  }
  surface.cylinder({ radius: 0.05, height: 0.18 }, [0, 0.89, -0.15], COURT_LIGHT_DIFFUSER)

  // 4 high-back counsel chairs facing the bench
  for (let x = -w * 0.38; x <= w * 0.38; x += w * 0.25) {
    surface.box([0.48, 0.06, 0.46], [x, 0.48, -d * 0.75], COURT_LEATHER_DARK)
    surface.box([0.46, 0.55, 0.06], [x, 0.78, -d * 0.75 - 0.22], COURT_LEATHER_DARK)
    surface.cylinder({ radius: 0.02, height: 0.46 }, [x, 0.23, -d * 0.75], COURT_BRASS)
  }
}

/** 20.9m continuous tiered gallery benches along the side walls */
export function dressGalleryBenches(surface: SupremeCourtSurface): void {
  const { width: w, depth: d } = surface

  // Bench base and continuous seat plank
  surface.box([w, 0.08, d * 0.9], [0, 0.44, 0], COURT_MAHOGANY)
  // Dark leather padded cushion
  surface.box([w * 0.98, 0.08, d * 0.85], [0, 0.52, 0], COURT_LEATHER_DARK)
  // Continuous backrest
  surface.box([w * 0.98, 0.42, 0.08], [0, 0.78, -d * 0.38], COURT_LEATHER_DARK)
  surface.box([w, 0.06, 0.1], [0, 1.01, -d * 0.38], COURT_WALNUT)

  // Support posts and armrests spaced every 2.6m
  for (let x = -w * 0.46; x <= w * 0.46; x += 2.6) {
    surface.box([0.08, 0.4, d * 0.8], [x, 0.2, 0], COURT_MAHOGANY)
    surface.box([0.08, 0.25, d * 0.6], [x, 0.65, 0.1], COURT_MAHOGANY)
  }
}

/** Wooden court bar rail separating public spectator area from well of the court */
export function dressCourtBarRailing(into: BanquetDetailBuilder, floor: number): void {
  const barX = 94.0
  const railY = floor + 0.95

  // South railing segment (z: 28.0 to 36.5)
  into.box([0.08, 0.08, 8.5], { at: [barX, railY, 32.25], colour: COURT_WALNUT })
  into.box([0.08, 0.06, 8.5], { at: [barX, floor + 0.1, 32.25], colour: COURT_MAHOGANY })
  for (let z = 28.5; z <= 36.0; z += 0.75) {
    into.cylinder(
      { radius: 0.02, height: 0.8 },
      { at: [barX, floor + 0.52, z], colour: COURT_BRASS },
    )
  }

  // North railing segment (z: 40.5 to 49.0)
  into.box([0.08, 0.08, 8.5], { at: [barX, railY, 44.75], colour: COURT_WALNUT })
  into.box([0.08, 0.06, 8.5], { at: [barX, floor + 0.1, 44.75], colour: COURT_MAHOGANY })
  for (let z = 41.0; z <= 48.5; z += 0.75) {
    into.cylinder(
      { radius: 0.02, height: 0.8 },
      { at: [barX, floor + 0.52, z], colour: COURT_BRASS },
    )
  }

  // Heavy end gateposts in polished walnut
  for (const pz of [28.0, 36.5, 40.5, 49.0]) {
    into.box([0.18, 1.1, 0.18], { at: [barX, floor + 0.55, pz], colour: COURT_WALNUT })
    into.sphere([0.08, 0.08, 0.08], { at: [barX, floor + 1.15, pz], colour: COURT_GOLD })
  }
}
