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
  const outerR = 2.05
  const innerR = 1.62
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

/** Long black-and-pale inlay lines that lead the eye toward the entrance facade. */
function dressAtriumPavingAvenues(into: BanquetDetailBuilder, floor: number): void {
  const avenueY = floor + 0.006

  into.box([4.2, 0.006, 14.0], { at: [0, avenueY, -2.5], colour: POLICE_TILES_LIGHT })
  into.box([0.22, 0.01, 5.0], { at: [-2.0, avenueY, 1.9], colour: POLICE_TILES_DARK })
  into.box([0.22, 0.01, 5.0], { at: [2.0, avenueY, 1.9], colour: POLICE_TILES_DARK })
  into.box([0.22, 0.01, 5.0], { at: [-2.0, avenueY, -6.9], colour: POLICE_TILES_DARK })
  into.box([0.22, 0.01, 5.0], { at: [2.0, avenueY, -6.9], colour: POLICE_TILES_DARK })

  // Broad dark edge strips frame the two side promenades in the source panel.
  for (const x of [-8.2, -6.2, 6.2, 8.2]) {
    into.box([0.18, 0.01, 14.0], { at: [x, avenueY, -2.5], colour: POLICE_TILES_DARK })
  }
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

/** Plain office floor with only the subtle perimeter strips visible in the panel. */
export function dressPoliceSafetyFloor(options: FloorOptions): void {
  const { into, floor } = options
  const tileY = floor + 0.006

  // Perimeter border for safety section
  into.box([10.6, 0.007, 0.4], { at: [-5.5, tileY, -15.8], colour: POLICE_GRANITE })
  into.box([10.6, 0.007, 0.4], { at: [-5.5, tileY, -10.2], colour: POLICE_GRANITE })

  into.box([0.4, 0.007, 5.6], { at: [-10.8, tileY, -13.0], colour: POLICE_GRANITE })
  into.box([0.4, 0.007, 5.6], { at: [-0.2, tileY, -13.0], colour: POLICE_GRANITE })
}
