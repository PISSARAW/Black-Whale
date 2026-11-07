import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'
import {
  CHAIR_FABRIC,
  CHROME,
  CLINICAL_TEAL,
  CLINICAL_WHITE,
  DESK_WOOD,
  MONITOR_FRAME,
  STEEL_DARK,
  STEEL_MEDICAL,
  XRAY_BLUE_GLOW,
  XRAY_FRAME,
} from './hospitalDetailSurface'
import type { HospitalContext } from './hospitalClinicArchitecture'

function doctorConsultationDesk(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const [x, z] = structure.at
  const [w, d] = structure.size
  const h = structure.height

  // Main wooden / laminate consultation desk
  into.box([w, 0.06, d], {
    at: [x, floor + h - 0.03, z],
    colour: DESK_WOOD,
  })
  // Drawer pedestals
  into.box([0.7, h - 0.06, d - 0.1], {
    at: [x - w / 2 + 0.45, floor + (h - 0.06) / 2, z],
    colour: 0x2c3538,
  })
  into.box([0.7, h - 0.06, d - 0.1], {
    at: [x + w / 2 - 0.45, floor + (h - 0.06) / 2, z],
    colour: 0x2c3538,
  })

  // Desktop computer terminal
  into.box([0.48, 0.34, 0.06], {
    at: [x - 0.6, floor + h + 0.22, z - 0.1],
    colour: MONITOR_FRAME,
  })
  into.box([0.44, 0.3, 0.02], {
    at: [x - 0.6, floor + h + 0.22, z - 0.07],
    colour: 0x22383c,
    glow: true,
  })
  // Stethoscope lying on the desk
  into.ring(
    { radius: 0.08, tube: 0.008 },
    { at: [x + 0.5, floor + h + 0.015, z], colour: STEEL_DARK },
  )
  into.cylinder(
    { radius: 0.025, height: 0.012, sides: 12 },
    { at: [x + 0.6, floor + h + 0.015, z + 0.05], colour: CHROME },
  )
  // Prescription notepad & pen holder
  into.box([0.18, 0.02, 0.24], {
    at: [x + 0.2, floor + h + 0.015, z - 0.15],
    colour: CLINICAL_WHITE,
  })
  into.cylinder(
    { radius: 0.04, height: 0.1, sides: 12 },
    { at: [x + 0.8, floor + h + 0.05, z - 0.2], colour: STEEL_MEDICAL },
  )

  // Doctor's executive chair
  into.box([0.54, 0.08, 0.52], { at: [x - 0.3, floor + 0.48, z + 0.55], colour: CHAIR_FABRIC })
  into.box([0.5, 0.5, 0.08], { at: [x - 0.3, floor + 0.75, z + 0.8], colour: CHAIR_FABRIC })
  into.cylinder({ radius: 0.25, height: 0.44, sides: 10 }, { at: [x - 0.3, floor + 0.22, z + 0.55], colour: STEEL_DARK })

  // Patient consultation chairs facing the desk
  for (const cx of [x - 0.5, x + 0.5]) {
    into.box([0.46, 0.06, 0.44], { at: [cx, floor + 0.46, z - 0.7], colour: CHAIR_FABRIC })
    into.box([0.44, 0.4, 0.06], { at: [cx, floor + 0.68, z - 0.9], colour: CHAIR_FABRIC })
    for (const dx of [-0.2, 0.2]) {
      for (const dz of [-0.18, 0.18]) {
        into.cylinder(
          { radius: 0.016, height: 0.44, sides: 10 },
          { at: [cx + dx, floor + 0.22, z - 0.7 + dz], colour: STEEL_MEDICAL },
        )
      }
    }
  }
}

function examinationCouch(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const w = 1.95
  const d = 0.75
  const h = 0.72

  // Frame and legs
  into.box([w, 0.08, d], {
    at: [x, floorY + h - 0.12, z],
    colour: STEEL_DARK,
  })
  for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) {
    for (const dz of [-d / 2 + 0.08, d / 2 - 0.08]) {
      into.cylinder(
        { radius: 0.03, height: h - 0.12, sides: 10 },
        { at: [x + dx, floorY + (h - 0.12) / 2, z + dz], colour: STEEL_MEDICAL },
      )
    }
  }

  // Padded examination surface
  into.box([w - 0.04, 0.12, d - 0.04], {
    at: [x, floorY + h - 0.02, z],
    colour: 0x2b3b3d,
  })
  // Elevated headrest wedge
  into.box([0.5, 0.18, d - 0.08], {
    at: [x - w / 2 + 0.28, floorY + h + 0.06, z],
    colour: 0x2b3b3d,
  })
  // Paper roll runner dispenser at head
  into.cylinder(
    { radius: 0.05, height: d - 0.1, sides: 12 },
    { at: [x - w / 2 - 0.06, floorY + h + 0.04, z], colour: CLINICAL_WHITE, rotation: [Math.PI / 2, 0, 0] },
  )
  into.box([w * 0.8, 0.01, d - 0.14], {
    at: [x + 0.1, floorY + h + 0.05, z],
    colour: CLINICAL_WHITE,
  })

  // Rolling round doctor stool
  into.cylinder({ radius: 0.2, height: 0.08, sides: 16 }, { at: [x, floorY + 0.5, z - 0.65], colour: 0x222e30 })
  into.cylinder({ radius: 0.03, height: 0.46, sides: 10 }, { at: [x, floorY + 0.23, z - 0.65], colour: CHROME })
}

function wallNegatoscope(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const y = floorY + 1.85

  // Negatoscope black housing frame
  into.box([1.1, 0.75, 0.08], {
    at: [x, y, z],
    colour: XRAY_FRAME,
  })
  // Illuminated X-ray view screen with cyan-blue backlight
  into.box([1.0, 0.65, 0.02], {
    at: [x, y, z + 0.045],
    colour: XRAY_BLUE_GLOW,
    glow: true,
  })
  // Radiograph rib cage / lungs silhouette film clips
  into.box([0.42, 0.55, 0.01], {
    at: [x - 0.24, y, z + 0.058],
    colour: 0x16242c,
  })
  into.box([0.42, 0.55, 0.01], {
    at: [x + 0.24, y, z + 0.058],
    colour: 0x16242c,
  })
  // Mounting retention clips on top
  into.box([0.96, 0.03, 0.02], { at: [x, y + 0.34, z + 0.06], colour: STEEL_MEDICAL })
}

function snellenEyeChart(into: BanquetDetailBuilder, at: Point3): void {
  const [x, floorY, z] = at
  const y = floorY + 1.75

  // White chart board
  into.box([0.45, 0.8, 0.02], {
    at: [x, y, z],
    colour: CLINICAL_WHITE,
  })
  // Black lettering bars representing optometrist lines
  for (let l = 0; l < 6; l++) {
    const lineY = y + 0.3 - l * 0.1
    const lineW = 0.32 - l * 0.04
    into.box([lineW, 0.03, 0.01], {
      at: [x, lineY, z + 0.015],
      colour: STEEL_DARK,
    })
  }
}

export function dressHospitalStaff(context: HospitalContext): void {
  const { into, floor, structures } = context

  // 1. Doctor's consultation desk
  const desk = structures.find((s) => s.id.includes('staff-desk'))
  if (desk) {
    doctorConsultationDesk(into, desk, floor)
  }

  // 2. Patient examination tables
  examinationCouch(into, [9.0, floor, -1.0])
  examinationCouch(into, [17.5, floor, -1.0])

  // 3. Wall negatoscope (X-ray viewbox)
  wallNegatoscope(into, [13.0, floor, 3.2])

  // 4. Snellen eye chart
  snellenEyeChart(into, [6.0, floor, 1.5])
}
