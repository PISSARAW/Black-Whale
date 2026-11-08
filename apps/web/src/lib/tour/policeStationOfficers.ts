import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import {
  POLICE_BRASS,
  POLICE_FLESH,
  POLICE_GOLD,
  POLICE_METAL,
  POLICE_NAVY,
  POLICE_OFFICER_BLUE,
  POLICE_PAPER,
} from './policeStationDetailSurface'

interface OfficerOptions {
  into: BanquetDetailBuilder
  at: Point3
  facing?: number
}

/** Standard Kakin central police officer in uniform and peaked cap */
function dressOfficerSilhouette(options: OfficerOptions): void {
  const {
    into,
    at: [x, y, z],
  } = options

  // Shoes and trousers
  into.box([0.16, 0.1, 0.22], { at: [x - 0.1, y + 0.05, z], colour: POLICE_METAL })
  into.box([0.16, 0.1, 0.22], { at: [x + 0.1, y + 0.05, z], colour: POLICE_METAL })
  into.box([0.15, 0.72, 0.16], { at: [x - 0.1, y + 0.44, z], colour: POLICE_OFFICER_BLUE })
  into.box([0.15, 0.72, 0.16], { at: [x + 0.1, y + 0.44, z], colour: POLICE_OFFICER_BLUE })

  // Torso, service belt and badge
  into.box([0.46, 0.65, 0.24], { at: [x, y + 1.1, z], colour: POLICE_OFFICER_BLUE })
  into.box([0.48, 0.08, 0.25], { at: [x, y + 0.82, z], colour: POLICE_METAL })
  into.box([0.1, 0.08, 0.26], { at: [x, y + 0.82, z], colour: POLICE_BRASS })
  into.box([0.08, 0.08, 0.02], { at: [x - 0.12, y + 1.25, z - 0.13], colour: POLICE_GOLD })

  // Shoulders, arms and head
  into.box([0.14, 0.62, 0.15], { at: [x - 0.28, y + 1.05, z], colour: POLICE_OFFICER_BLUE })
  into.box([0.14, 0.62, 0.15], { at: [x + 0.28, y + 1.05, z], colour: POLICE_OFFICER_BLUE })
  into.sphere([0.18, 0.22, 0.18], { at: [x, y + 1.55, z], colour: POLICE_FLESH })

  // Peaked cap with dark visor
  into.box([0.28, 0.12, 0.28], { at: [x, y + 1.7, z], colour: POLICE_NAVY })
  into.box([0.26, 0.03, 0.12], { at: [x, y + 1.66, z - 0.16], colour: POLICE_METAL })
  into.box([0.06, 0.06, 0.02], { at: [x, y + 1.72, z - 0.14], colour: POLICE_GOLD })
}

/**
 * Mizaistom Nana (Zodiac Ox / Crime Hunter, Tier 3 police supervisor).
 * Depicted in ch. 378 and 393: tall stature, distinctive cow-pattern coat and bowler hat.
 */
function dressMizaistom(into: BanquetDetailBuilder, floor: number): void {
  const x = 1.2
  const z = -3.8
  const y = floor

  // Formal shoes and dark trousers
  into.box([0.18, 0.11, 0.26], { at: [x - 0.14, y + 0.055, z], colour: POLICE_METAL })
  into.box([0.18, 0.11, 0.26], { at: [x + 0.14, y + 0.055, z], colour: POLICE_METAL })
  into.box([0.18, 0.78, 0.2], { at: [x - 0.14, y + 0.48, z], colour: POLICE_METAL })
  into.box([0.18, 0.78, 0.2], { at: [x + 0.14, y + 0.48, z], colour: POLICE_METAL })

  // Long executive coat with distinctive lapels
  into.box([0.56, 0.85, 0.28], { at: [x, y + 1.22, z], colour: 0x22262a })
  into.box([0.54, 0.55, 0.27], { at: [x, y + 0.85, z], colour: 0x22262a })
  into.box([0.18, 0.5, 0.02], { at: [x - 0.12, y + 1.2, z - 0.15], colour: 0xe8e4dc })
  into.box([0.18, 0.5, 0.02], { at: [x + 0.12, y + 1.2, z - 0.15], colour: 0xe8e4dc })

  // Broad shoulders, arms and case folder
  into.box([0.18, 0.72, 0.18], { at: [x - 0.35, y + 1.15, z], colour: 0x22262a })
  into.box([0.18, 0.72, 0.18], { at: [x + 0.35, y + 1.15, z], colour: 0x22262a })
  into.box([0.35, 0.26, 0.04], { at: [x + 0.25, y + 1.1, z - 0.16], colour: POLICE_PAPER })

  into.sphere([0.2, 0.24, 0.2], { at: [x, y + 1.74, z], colour: POLICE_FLESH })
  into.cylinder({ radius: 0.24, height: 0.03 }, { at: [x, y + 1.86, z], colour: POLICE_METAL })
  into.cylinder({ radius: 0.18, height: 0.18 }, { at: [x, y + 1.96, z], colour: POLICE_METAL })
  into.box([0.38, 0.03, 0.03], { at: [x, y + 1.88, z], colour: POLICE_GOLD })
}

/** Stations Mizaistom and duty officers across the precinct */
export function dressPoliceOfficers(into: BanquetDetailBuilder, floor: number): void {
  // Supervisor Mizaistom Nana in the central atrium
  dressMizaistom(into, floor)

  // Duty officer at front desk
  dressOfficerSilhouette({ into, at: [7.5, floor, -6.4] })

  // Sentry officer at main entrance
  dressOfficerSilhouette({ into, at: [-1.4, floor, 4.4] })

  // Guard officer beside colonnade
  dressOfficerSilhouette({ into, at: [-4.2, floor, -2.5] })

  // Gallery patrol officer on level 1 balcony
  dressOfficerSilhouette({ into, at: [-8.4, floor + 3.4, 0.5] })

  // Public safety section officer
  dressOfficerSilhouette({ into, at: [-5.5, floor, -13.8] })
}
