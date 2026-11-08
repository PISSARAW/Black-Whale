import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  POLICE_ALERT_GREEN,
  POLICE_ALERT_RED,
  POLICE_BRASS,
  POLICE_GLASS,
  POLICE_GRANITE,
  POLICE_GRANITE_DARK,
  POLICE_LEATHER,
  POLICE_METAL,
  POLICE_NAVY,
  POLICE_OAK,
  POLICE_PAPER,
  POLICE_SCREEN_FRAME,
  POLICE_SCREEN_GLOW,
  PoliceStationSurface,
} from './policeStationDetailSurface'

/** Front reception desk in the main atrium (ch. 378, 393) */
export function dressPoliceFrontDesk(surface: PoliceStationSurface): void {
  const { width: w, depth: d } = surface

  // Counter carcass in dark oak with granite top
  surface.box([w, 0.12, d], [0, 0.06, 0], POLICE_METAL)
  surface.box([w * 0.96, 0.95, d * 0.9], [0, 0.6, 0], POLICE_OAK)
  surface.box([w + 0.1, 0.08, d + 0.1], [0, 1.12, 0], POLICE_GRANITE)

  // Raised security glass partition with speaking opening
  surface.box([w * 0.85, 0.8, 0.04], [0, 1.56, -d * 0.15], POLICE_GLASS)
  surface.box([0.35, 0.18, 0.06], [0, 1.25, -d * 0.15], POLICE_METAL)

  // Computer terminals, keyboard and duty dispatch units
  for (const tx of [-w * 0.22, w * 0.22]) {
    surface.box([0.48, 0.36, 0.06], [tx, 1.4, d * 0.1], POLICE_SCREEN_FRAME)
    surface.box([0.44, 0.32, 0.02], [tx, 1.4, d * 0.08], POLICE_SCREEN_GLOW)
    surface.box([0.14, 0.18, 0.14], [tx, 1.25, d * 0.1], POLICE_METAL)
    surface.box([0.42, 0.03, 0.16], [tx, 1.18, d * 0.28], POLICE_METAL)
  }

  // Logbook, pen holder, stamp rack and desk lamp
  surface.box([0.38, 0.04, 0.28], [0, 1.18, d * 0.15], POLICE_PAPER)
  surface.cylinder({ radius: 0.03, height: 0.12 }, [0.26, 1.22, d * 0.15], POLICE_BRASS)
  surface.cylinder({ radius: 0.02, height: 0.35 }, [-w * 0.42, 1.34, d * 0.1], POLICE_BRASS)
  surface.box([0.22, 0.1, 0.14], [-w * 0.42, 1.54, d * 0.1], POLICE_NAVY)
}

/** Solid oak waiting benches with leather cushions and queue stanchions in the atrium */
export function dressPoliceAtriumBenchesAndStanchions(into: BanquetDetailBuilder, floor: number): void {
  // 4 waiting benches placed along colonnade walkways
  const benchPositions: [number, number, number][] = [
    [-5.4, -3.18, 0],
    [-5.4, -0.08, 0],
    [5.4, -4.25, 0],
    [5.4, -1.75, 0],
  ]

  for (const [bx, bz, angle] of benchPositions) {
    into.box([2.2, 0.08, 0.65], { at: [bx, floor + 0.44, bz], rotation: [0, angle, 0], colour: POLICE_OAK })
    for (const legX of [-0.95, 0.95]) {
      into.box([0.1, 0.4, 0.55], { at: [bx + legX, floor + 0.2, bz], rotation: [0, angle, 0], colour: POLICE_OAK })
      into.box([0.12, 0.05, 0.57], { at: [bx + legX, floor + 0.025, bz], rotation: [0, angle, 0], colour: POLICE_BRASS })
    }
    into.box([2.1, 0.1, 0.6], { at: [bx, floor + 0.52, bz], rotation: [0, angle, 0], colour: POLICE_LEATHER })
    into.box([2.1, 0.32, 0.08], { at: [bx, floor + 0.76, bz - 0.28], rotation: [0, angle, 0], colour: POLICE_LEATHER })
    into.box([0.06, 0.3, 0.04], { at: [bx - 0.7, floor + 0.65, bz - 0.28], rotation: [0, angle, 0], colour: POLICE_BRASS })
    into.box([0.06, 0.3, 0.04], { at: [bx + 0.7, floor + 0.65, bz - 0.28], rotation: [0, angle, 0], colour: POLICE_BRASS })
  }

  // Queue stanchions with brass posts and navy velvet ropes in front of the front desk
  const stanchionX = [5.2, 6.6, 8.0, 9.4]
  for (const sx of stanchionX) {
    into.cylinder({ radius: 0.14, height: 0.04 }, { at: [sx, floor + 0.02, -5.6], colour: POLICE_BRASS })
    into.cylinder({ radius: 0.025, height: 0.95 }, { at: [sx, floor + 0.5, -5.6], colour: POLICE_BRASS })
    into.sphere([0.045, 0.045, 0.045], { at: [sx, floor + 0.99, -5.6], colour: POLICE_BRASS })
  }
  for (let i = 0; i < stanchionX.length - 1; i++) {
    const midX = (stanchionX[i] + stanchionX[i + 1]) / 2
    into.box([1.36, 0.04, 0.04], { at: [midX, floor + 0.82, -5.6], colour: POLICE_NAVY })
  }

  // Information directory pedestal stand near atrium entrance avenue
  into.cylinder({ radius: 0.22, height: 0.06 }, { at: [2.6, floor + 0.03, 3.2], colour: POLICE_BRASS })
  into.cylinder({ radius: 0.04, height: 0.95 }, { at: [2.6, floor + 0.5, 3.2], colour: POLICE_BRASS })
  into.box([0.65, 0.45, 0.06], { at: [2.6, floor + 1.15, 3.2], rotation: [-0.4, 0, 0], colour: POLICE_NAVY })
  into.box([0.58, 0.38, 0.02], { at: [2.6, floor + 1.16, 3.19], rotation: [-0.4, 0, 0], colour: POLICE_PAPER })
}

/** Community safety desk and citizen consultation counters (ch. 349, 378) */
export function dressPoliceSafetyDesk(surface: PoliceStationSurface): void {
  const { width: w, depth: d } = surface

  // Continuous consultation counter
  surface.box([w, 0.1, d], [0, 0.05, 0], POLICE_METAL)
  surface.box([w * 0.98, 0.95, d * 0.92], [0, 0.58, 0], POLICE_OAK)
  surface.box([w + 0.08, 0.08, d + 0.08], [0, 1.11, 0], POLICE_GRANITE)

  // Acrylic desk dividers separating citizen consultation bays
  for (const bx of [-w * 0.28, w * 0.28]) {
    surface.box([0.03, 0.65, d * 0.95], [bx, 1.48, 0], POLICE_GLASS)
  }

  // Consultation bay equipment: computer terminals, document trays and phones
  for (const bx of [-w * 0.36, 0, w * 0.36]) {
    surface.box([0.42, 0.32, 0.05], [bx, 1.36, d * 0.18], POLICE_SCREEN_FRAME)
    surface.box([0.38, 0.28, 0.02], [bx, 1.36, d * 0.16], POLICE_SCREEN_GLOW)
    surface.box([0.3, 0.15, 0.22], [bx + 0.28, 1.23, d * 0.15], POLICE_METAL)
    surface.box([0.22, 0.08, 0.18], [bx - 0.28, 1.2, d * 0.15], POLICE_METAL)
  }

  // Citizen visitor chairs in front of the counter
  for (const cx of [-w * 0.36, 0, w * 0.36]) {
    surface.box([0.48, 0.08, 0.46], [cx, 0.46, -d * 0.8], POLICE_LEATHER)
    surface.box([0.48, 0.42, 0.06], [cx, 0.72, -d * 0.8 - 0.2], POLICE_LEATHER)
    surface.cylinder({ radius: 0.02, height: 0.44 }, [cx - 0.18, 0.22, -d * 0.8], POLICE_METAL)
    surface.cylinder({ radius: 0.02, height: 0.44 }, [cx + 0.18, 0.22, -d * 0.8], POLICE_METAL)
  }
}

/** Filing archives, bulletin notice board and citizen amenities in safety section */
export function dressPoliceSafetyArchives(into: BanquetDetailBuilder, floor: number): void {
  // Bank of metal filing cabinets along the back wall
  for (let fx = -8.2; fx <= -2.8; fx += 1.35) {
    into.box([1.1, 1.85, 0.65], { at: [fx, floor + 0.925, -15.6], colour: POLICE_METAL })
    for (let drawer = 0; drawer < 4; drawer++) {
      const dy = floor + 0.25 + drawer * 0.42
      into.box([0.98, 0.36, 0.04], { at: [fx, dy, -15.26], colour: POLICE_SCREEN_FRAME })
      into.box([0.16, 0.03, 0.04], { at: [fx, dy, -15.22], colour: POLICE_BRASS })
      into.box([0.08, 0.05, 0.02], { at: [fx, dy + 0.1, -15.23], colour: POLICE_PAPER })
    }
  }

  // Official notice board with pinned bulletins and wanted posters
  into.box([3.2, 1.4, 0.06], { at: [-5.5, floor + 2.7, -15.85], colour: POLICE_OAK })
  into.box([3.08, 1.28, 0.02], { at: [-5.5, floor + 2.7, -15.81], colour: 0xb5996e })
  for (let px = -6.6; px <= -4.4; px += 0.55) {
    into.box([0.38, 0.48, 0.01], { at: [px, floor + 2.7, -15.79], colour: POLICE_PAPER })
    into.sphere([0.015, 0.015, 0.015], { at: [px, floor + 2.92, -15.78], colour: POLICE_ALERT_RED })
  }

  // Water cooler dispenser for citizen consultation area
  into.box([0.38, 0.85, 0.38], { at: [-0.6, floor + 0.425, -10.8], colour: POLICE_PAPER })
  into.cylinder({ radius: 0.15, height: 0.38 }, { at: [-0.6, floor + 1.04, -10.8], colour: POLICE_GLASS })
}

/** Complete security checkpoint in the entrance vestibule */
export function dressPoliceEntranceSecurity(into: BanquetDetailBuilder, floor: number): void {
  const archZ = 6.8

  // Metal detector archway with overhead multizone detection display
  into.box([0.18, 2.3, 0.7], { at: [-0.65, floor + 1.15, archZ], colour: POLICE_METAL })
  into.box([0.18, 2.3, 0.7], { at: [0.65, floor + 1.15, archZ], colour: POLICE_METAL })
  into.box([1.48, 0.22, 0.7], { at: [0, floor + 2.35, archZ], colour: POLICE_METAL })
  into.box([0.4, 0.08, 0.04], { at: [0, floor + 2.35, archZ - 0.36], colour: POLICE_NAVY })
  into.box([0.04, 0.04, 0.02], { at: [-0.55, floor + 2.35, archZ - 0.36], colour: POLICE_ALERT_GREEN, glow: true })
  into.box([0.04, 0.04, 0.02], { at: [0.55, floor + 2.35, archZ - 0.36], colour: POLICE_ALERT_RED, glow: true })

  // Security turnstiles with access barrier flaps
  for (const tx of [-1.8, 1.8]) {
    into.box([0.35, 0.98, 0.85], { at: [tx, floor + 0.49, archZ], colour: POLICE_METAL })
    into.cylinder({ radius: 0.02, height: 0.55 }, { at: [tx, floor + 0.85, archZ], colour: POLICE_BRASS })
    into.box([0.08, 0.02, 0.12], { at: [tx, floor + 0.99, archZ - 0.2], colour: POLICE_SCREEN_GLOW, glow: true })
  }

  // Baggage X-ray scanner unit: tunnel housing, lead curtains, conveyor table
  const scanX = 3.1
  into.box([1.2, 1.35, 1.1], { at: [scanX, floor + 1.25, archZ], colour: POLICE_METAL })
  into.box([0.7, 0.75, 1.14], { at: [scanX, floor + 1.2, archZ], colour: POLICE_SCREEN_FRAME })
  into.box([0.66, 0.7, 0.02], { at: [scanX, floor + 1.2, archZ - 0.56], colour: POLICE_LEATHER })
  into.box([0.66, 0.7, 0.02], { at: [scanX, floor + 1.2, archZ + 0.56], colour: POLICE_LEATHER })

  // Conveyor belt and stainless steel roller tables
  into.box([0.8, 0.72, 2.8], { at: [scanX, floor + 0.36, archZ], colour: POLICE_METAL })
  into.box([0.75, 0.06, 2.76], { at: [scanX, floor + 0.75, archZ], colour: POLICE_GRANITE_DARK })

  // Sentry guard check-in podium on the west side
  into.box([0.85, 1.15, 0.6], { at: [-3.2, floor + 0.575, archZ], colour: POLICE_OAK })
  into.box([0.9, 0.05, 0.65], { at: [-3.2, floor + 1.175, archZ], colour: POLICE_GRANITE })
  into.box([0.35, 0.03, 0.28], { at: [-3.2, floor + 1.21, archZ], colour: POLICE_PAPER })
}
