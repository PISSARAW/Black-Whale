import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  CLINICAL_MINT,
  CLINICAL_TEAL,
  CLINICAL_WHITE,
  STEEL_DARK,
  STEEL_MEDICAL,
} from './hospitalDetailSurface'
import type { HospitalContext } from './hospitalClinicArchitecture'

export function dressHospitalHallArchitecture(context: HospitalContext): void {
  const { into, floor, ceilingHeight } = context
  const minX = 4.25
  const maxX = 5.75
  const minZ = -11.75
  const maxZ = 4.75
  const depthZ = maxZ - minZ
  const centreX = (minX + maxX) / 2
  const centreZ = (minZ + maxZ) / 2

  // 1. Continuous protective hospital bumper rails / handrails along both walls
  into.cylinder(
    { radius: 0.025, height: depthZ - 0.4, sides: 12 },
    { at: [minX + 0.04, floor + 0.9, centreZ], colour: CLINICAL_TEAL, rotation: [Math.PI / 2, 0, 0] },
  )
  into.cylinder(
    { radius: 0.025, height: depthZ - 0.4, sides: 12 },
    { at: [maxX - 0.04, floor + 0.9, centreZ], colour: CLINICAL_TEAL, rotation: [Math.PI / 2, 0, 0] },
  )

  // 2. Suspended directional overhead department signboards
  const signs = [
    { z: -8.0, label: 'CLINIQUE' },
    { z: -2.0, label: 'CONSULTATION' },
    { z: 3.5, label: 'RECHERCHE' },
  ]
  for (const sign of signs) {
    into.box([1.1, 0.22, 0.03], {
      at: [centreX, floor + ceilingHeight - 0.5, sign.z],
      colour: 0x1f363a,
    })
    into.box([0.95, 0.04, 0.04], {
      at: [centreX, floor + ceilingHeight - 0.5, sign.z],
      colour: CLINICAL_MINT,
      glow: true,
    })
    // Support rods
    into.cylinder(
      { radius: 0.008, height: 0.4, sides: 8 },
      { at: [centreX - 0.4, floor + ceilingHeight - 0.2, sign.z], colour: STEEL_MEDICAL },
    )
    into.cylinder(
      { radius: 0.008, height: 0.4, sides: 8 },
      { at: [centreX + 0.4, floor + ceilingHeight - 0.2, sign.z], colour: STEEL_MEDICAL },
    )
  }

  // 3. Clinical door portals connecting to the departments
  for (const pz of [-9.0, -4.0, 1.0]) {
    into.box([0.08, 2.2, 1.1], {
      at: [minX + 0.02, floor + 1.1, pz],
      colour: STEEL_DARK,
    })
    into.box([0.08, 2.2, 1.1], {
      at: [maxX - 0.02, floor + 1.1, pz],
      colour: STEEL_DARK,
    })
  }

  // 4. Overhead clinical lighting troffers
  for (let lz = minZ + 2.0; lz <= maxZ - 1.0; lz += 4.0) {
    into.box([0.7, 0.04, 1.2], {
      at: [centreX, floor + ceilingHeight - 0.02, lz],
      colour: CLINICAL_WHITE,
      glow: true,
    })
  }
}
