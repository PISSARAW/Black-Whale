import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  POLICE_BRASS,
  POLICE_GLASS,
  POLICE_GRANITE,
  POLICE_METAL,
  POLICE_NAVY,
  POLICE_OAK,
  POLICE_PAPER,
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

  // Computer terminal, keyboard and duty dispatch unit
  surface.box([0.5, 0.38, 0.08], [w * 0.25, 1.4, d * 0.1], POLICE_METAL)
  surface.box([0.15, 0.2, 0.15], [w * 0.25, 1.26, d * 0.1], POLICE_METAL)
  surface.box([0.45, 0.03, 0.18], [w * 0.25, 1.18, d * 0.28], POLICE_METAL)

  // Logbook, pen holder and desk lamp
  surface.box([0.38, 0.04, 0.28], [-w * 0.25, 1.18, d * 0.15], POLICE_PAPER)
  surface.cylinder({ radius: 0.03, height: 0.12 }, [-w * 0.25 + 0.26, 1.22, d * 0.15], POLICE_BRASS)
  surface.cylinder({ radius: 0.02, height: 0.35 }, [-w * 0.38, 1.34, d * 0.1], POLICE_BRASS)
  surface.box([0.22, 0.1, 0.14], [-w * 0.38, 1.54, d * 0.1], POLICE_NAVY)

  // Queue stanchions in front of the counter
  for (let x = -w * 0.4; x <= w * 0.4; x += 1.4) {
    surface.cylinder({ radius: 0.12, height: 0.03 }, [x, 0.015, -d * 0.8], POLICE_BRASS)
    surface.cylinder({ radius: 0.025, height: 0.95 }, [x, 0.5, -d * 0.8], POLICE_BRASS)
  }
}

/** Community safety desk and citizen consultation counters (ch. 349, 378) */
export function dressPoliceSafetyDesk(surface: PoliceStationSurface): void {
  const { width: w, depth: d } = surface

  // Continuous consultation counter
  surface.box([w, 0.1, d], [0, 0.05, 0], POLICE_METAL)
  surface.box([w * 0.98, 0.95, d * 0.92], [0, 0.58, 0], POLICE_OAK)
  surface.box([w + 0.08, 0.08, d + 0.08], [0, 1.11, 0], POLICE_GRANITE)

  // Acrylic desk dividers separating citizen bays
  for (let x = -w * 0.28; x <= w * 0.28; x += w * 0.28) {
    surface.box([0.03, 0.65, d * 0.95], [x, 1.48, 0], POLICE_GLASS)
  }

  // Document trays, information racks and official forms
  for (let x = -w * 0.38; x <= w * 0.38; x += w * 0.38) {
    surface.box([0.3, 0.15, 0.22], [x + 0.15, 1.23, d * 0.15], POLICE_METAL)
    surface.box([0.28, 0.12, 0.08], [x - 0.15, 1.22, -d * 0.2], POLICE_PAPER)
  }

  // Filing cabinets and bulletin board behind safety desk
  surface.box([w * 0.9, 2.1, 0.55], [0, 1.05, d * 1.6], POLICE_METAL)
  surface.box([w * 0.85, 1.4, 0.06], [0, 2.8, d * 1.8], POLICE_OAK)
  surface.box([w * 0.8, 1.3, 0.02], [0, 2.8, d * 1.76], POLICE_PAPER)
}

/** Security checkpoint portals and turnstiles in the entrance vestibule */
export function dressPoliceEntranceSecurity(into: BanquetDetailBuilder, floor: number): void {
  // Metal detector archway at entrance (x = 0, y in entrance vestibule z = 6.8)
  const archZ = 6.8
  into.box([0.18, 2.3, 0.7], { at: [-0.65, floor + 1.15, archZ], colour: POLICE_METAL })
  into.box([0.18, 2.3, 0.7], { at: [0.65, floor + 1.15, archZ], colour: POLICE_METAL })
  into.box([1.48, 0.22, 0.7], { at: [0, floor + 2.35, archZ], colour: POLICE_METAL })
  into.box([0.4, 0.08, 0.04], { at: [0, floor + 2.35, archZ - 0.36], colour: POLICE_NAVY })

  for (const tx of [-1.8, 1.8]) {
    into.box([0.35, 0.98, 0.85], { at: [tx, floor + 0.49, archZ], colour: POLICE_METAL })
    into.cylinder({ radius: 0.02, height: 0.55 }, { at: [tx, floor + 0.85, archZ], colour: POLICE_BRASS })
  }

  // Baggage inspection table
  into.box([1.4, 0.85, 0.75], { at: [2.8, floor + 0.425, archZ], colour: POLICE_METAL })
  into.box([1.45, 0.06, 0.8], { at: [2.8, floor + 0.88, archZ], colour: POLICE_GRANITE })
}
