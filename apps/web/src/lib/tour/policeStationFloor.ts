import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  POLICE_BRASS,
  POLICE_GRANITE,
  POLICE_GRANITE_DARK,
  POLICE_METAL,
  POLICE_TILES_DARK,
  POLICE_TILES_LIGHT,
} from './policeStationDetailSurface'

interface FloorOptions {
  into: BanquetDetailBuilder
  floor: number
}

/** Concentric octagonal paving border framing the central fountain */
function dressFountainPavingRing(into: BanquetDetailBuilder, floor: number): void {
  const cx = 0
  const cz = -2.5
  const outerR = 3.1
  const innerR = 2.45
  const ringY = floor + 0.008

  // 8 segments forming an octagonal border band
  for (let index = 0; index < 8; index++) {
    const angle = (index * Math.PI) / 4 + Math.PI / 8
    const midR = (innerR + outerR) / 2
    const segX = cx + Math.sin(angle) * midR
    const segZ = cz + Math.cos(angle) * midR
    const segLen = outerR * Math.tan(Math.PI / 8) * 1.85

    into.box([segLen, 0.008, outerR - innerR], {
      at: [segX, ringY, segZ],
      rotation: [0, -angle, 0],
      colour: POLICE_TILES_DARK,
    })

    // Brass corner studs at each octagon vertex
    const cornerAngle = (index * Math.PI) / 4
    const vX = cx + Math.sin(cornerAngle) * outerR
    const vZ = cz + Math.cos(cornerAngle) * outerR
    into.box([0.14, 0.012, 0.14], {
      at: [vX, ringY + 0.002, vZ],
      rotation: [0, -cornerAngle, 0],
      colour: POLICE_BRASS,
    })
  }

  // Outer drainage gutter slit
  into.cylinder(
    { radius: outerR + 0.18, bottom: outerR + 0.18, height: 0.006, sides: 16 },
    { at: [cx, ringY, cz], colour: POLICE_GRANITE_DARK },
  )
}

/** Central processional avenue and colonnade stylobate paving bands */
function dressAtriumPavingAvenues(into: BanquetDetailBuilder, floor: number): void {
  const avenueY = floor + 0.006

  // Central promenade running north-south through the atrium
  for (let z = -9.2; z <= 4.2; z += 1.8) {
    if (z > -4.5 && z < -0.5) continue // Clear space around fountain
    const isDark = Math.round(z * 10) % 4 === 0
    into.box([4.4, 0.006, 1.6], {
      at: [0, avenueY, z],
      colour: isDark ? POLICE_TILES_DARK : POLICE_TILES_LIGHT,
    })
  }

  // Flanking colonnade walkway bands connecting pillar bases
  into.box([2.4, 0.008, 13.5], { at: [-5.4, avenueY, -3.1], colour: POLICE_TILES_DARK })
  into.box([2.4, 0.008, 11.5], { at: [5.4, avenueY, -1.75], colour: POLICE_TILES_DARK })

  // Brass demarcation line in front of front desk
  into.box([5.2, 0.01, 0.06], { at: [7.5, floor + 0.009, -5.6], colour: POLICE_BRASS })
  into.box([0.06, 0.01, 1.2], { at: [4.9, floor + 0.009, -6.2], colour: POLICE_BRASS })
  into.box([0.06, 0.01, 1.2], { at: [10.1, floor + 0.009, -6.2], colour: POLICE_BRASS })
}

/** Perimeter border frame around the 22x15m atrium floor */
function dressAtriumPerimeterBorders(into: BanquetDetailBuilder, floor: number): void {
  const borderY = floor + 0.005
  // North & south perimeter border strips
  into.box([21.6, 0.007, 0.5], { at: [0, borderY, -9.75], colour: POLICE_GRANITE_DARK })
  into.box([21.6, 0.007, 0.5], { at: [0, borderY, 4.75], colour: POLICE_GRANITE_DARK })
  // East & west border strips
  into.box([0.5, 0.007, 14.5], { at: [-10.75, borderY, -2.5], colour: POLICE_GRANITE_DARK })
  into.box([0.5, 0.007, 14.5], { at: [10.75, borderY, -2.5], colour: POLICE_GRANITE_DARK })
}

/** Grand geometric paving across the main atrium */
export function dressPoliceAtriumFloor(options: FloorOptions): void {
  const { into, floor } = options
  dressAtriumPerimeterBorders(into, floor)
  dressFountainPavingRing(into, floor)
  dressAtriumPavingAvenues(into, floor)
}

/** Entrance vestibule floor with heavy-duty entryway matting and brass thresholds */
export function dressPoliceEntranceFloor(options: FloorOptions): void {
  const { into, floor } = options
  const matY = floor + 0.006

  // Ribbed recessed entry walk-off mat
  into.box([6.2, 0.008, 2.6], { at: [0, matY, 7.0], colour: POLICE_TILES_DARK })
  // Metal safety border around mat
  into.box([6.4, 0.01, 0.08], { at: [0, matY + 0.002, 5.65], colour: POLICE_METAL })
  into.box([6.4, 0.01, 0.08], { at: [0, matY + 0.002, 8.35], colour: POLICE_METAL })
  into.box([0.08, 0.01, 2.78], { at: [-3.15, matY + 0.002, 7.0], colour: POLICE_METAL })
  into.box([0.08, 0.01, 2.78], { at: [3.15, matY + 0.002, 7.0], colour: POLICE_METAL })

  // Brass transition threshold between entrance and atrium at z = 5.0
  into.box([9.8, 0.012, 0.12], { at: [0, floor + 0.008, 5.0], colour: POLICE_BRASS })
}

/** Safety section floor with granite grid and consultation demarcation */
export function dressPoliceSafetyFloor(options: FloorOptions): void {
  const { into, floor } = options
  const tileY = floor + 0.006

  // Perimeter border for safety section
  into.box([10.6, 0.007, 0.4], { at: [-5.5, tileY, -15.8], colour: POLICE_GRANITE })
  into.box([10.6, 0.007, 0.4], { at: [-5.5, tileY, -10.2], colour: POLICE_GRANITE })

  // Inlaid waiting demarcation line in front of safety counter
  into.box([6.4, 0.01, 0.06], { at: [-5.5, floor + 0.009, -13.6], colour: POLICE_BRASS })

  // Brass threshold at entry threshold z = -10.0
  into.box([7.8, 0.012, 0.1], { at: [-5.5, floor + 0.008, -10.0], colour: POLICE_BRASS })
}
