import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  POLICE_ALERT_GREEN,
  POLICE_ALERT_RED,
  POLICE_BRASS,
  POLICE_GLASS,
  POLICE_GRANITE,
  POLICE_GRANITE_DARK,
  POLICE_LEATHER,
  POLICE_LIGHT_DIFFUSER,
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
export function dressPoliceAtriumBenchesAndStanchions(
  into: BanquetDetailBuilder,
  floor: number,
): void {
  // 4 waiting benches placed along colonnade walkways
  const benchPositions: [number, number, number][] = [
    [-5.4, -3.18, 0],
    [-5.4, -0.08, 0],
    [5.4, -4.25, 0],
    [5.4, -1.75, 0],
  ]

  for (const [bx, bz, angle] of benchPositions) {
    into.box([2.2, 0.08, 0.65], {
      at: [bx, floor + 0.44, bz],
      rotation: [0, angle, 0],
      colour: POLICE_OAK,
    })
    for (const legX of [-0.95, 0.95]) {
      into.box([0.1, 0.4, 0.55], {
        at: [bx + legX, floor + 0.2, bz],
        rotation: [0, angle, 0],
        colour: POLICE_OAK,
      })
      into.box([0.12, 0.05, 0.57], {
        at: [bx + legX, floor + 0.025, bz],
        rotation: [0, angle, 0],
        colour: POLICE_BRASS,
      })
    }
    into.box([2.1, 0.1, 0.6], {
      at: [bx, floor + 0.52, bz],
      rotation: [0, angle, 0],
      colour: POLICE_LEATHER,
    })
    into.box([2.1, 0.32, 0.08], {
      at: [bx, floor + 0.76, bz - 0.28],
      rotation: [0, angle, 0],
      colour: POLICE_LEATHER,
    })
    into.box([0.06, 0.3, 0.04], {
      at: [bx - 0.7, floor + 0.65, bz - 0.28],
      rotation: [0, angle, 0],
      colour: POLICE_BRASS,
    })
    into.box([0.06, 0.3, 0.04], {
      at: [bx + 0.7, floor + 0.65, bz - 0.28],
      rotation: [0, angle, 0],
      colour: POLICE_BRASS,
    })
  }

  // Queue stanchions with brass posts and navy velvet ropes in front of the front desk
  const stanchionX = [5.2, 6.6, 8.0, 9.4]
  for (const sx of stanchionX) {
    into.cylinder(
      { radius: 0.14, height: 0.04 },
      { at: [sx, floor + 0.02, -5.6], colour: POLICE_BRASS },
    )
    into.cylinder(
      { radius: 0.025, height: 0.95 },
      { at: [sx, floor + 0.5, -5.6], colour: POLICE_BRASS },
    )
    into.sphere([0.045, 0.045, 0.045], { at: [sx, floor + 0.99, -5.6], colour: POLICE_BRASS })
  }
  for (let i = 0; i < stanchionX.length - 1; i++) {
    const midX = (stanchionX[i] + stanchionX[i + 1]) / 2
    into.box([1.36, 0.04, 0.04], { at: [midX, floor + 0.82, -5.6], colour: POLICE_NAVY })
  }

  // Information directory pedestal stand near atrium entrance avenue
  into.cylinder(
    { radius: 0.22, height: 0.06 },
    { at: [2.6, floor + 0.03, 3.2], colour: POLICE_BRASS },
  )
  into.cylinder(
    { radius: 0.04, height: 0.95 },
    { at: [2.6, floor + 0.5, 3.2], colour: POLICE_BRASS },
  )
  into.box([0.65, 0.45, 0.06], {
    at: [2.6, floor + 1.15, 3.2],
    rotation: [-0.4, 0, 0],
    colour: POLICE_NAVY,
  })
  into.box([0.58, 0.38, 0.02], {
    at: [2.6, floor + 1.16, 3.19],
    rotation: [-0.4, 0, 0],
    colour: POLICE_PAPER,
  })
}

/** Plain interview table in the Community Safety Section panel. */
export function dressPoliceSafetyDesk(surface: PoliceStationSurface): void {
  const { width: w, depth: d } = surface

  surface.box([w, 0.12, d], [0, 0.78, 0], POLICE_OAK)
  for (const x of [-w * 0.43, w * 0.43]) {
    for (const z of [-d * 0.36, d * 0.36]) {
      surface.box([0.09, 0.76, 0.09], [x, 0.38, z], POLICE_METAL)
    }
  }

  surface.box([0.5, 0.035, 0.34], [-0.55, 0.86, 0.05], POLICE_PAPER)
  surface.box([0.34, 0.055, 0.24], [0.85, 0.87, 0.12], POLICE_GRANITE)
  surface.cylinder({ radius: 0.025, height: 0.18 }, [0.56, 0.96, 0.08], POLICE_BRASS)
}

function dressSafetyChair(
  into: BanquetDetailBuilder,
  floor: number,
  at: [number, number],
  heading = 0,
): void {
  const [x, z] = at
  const backZ = z + Math.cos(heading) * 0.3
  const backX = x + Math.sin(heading) * 0.3

  into.box([0.72, 0.1, 0.68], {
    at: [x, floor + 0.56, z],
    rotation: [0, heading, 0],
    colour: POLICE_LEATHER,
  })
  into.box([0.7, 0.72, 0.12], {
    at: [backX, floor + 1.02, backZ],
    rotation: [0, heading, 0],
    colour: POLICE_LEATHER,
  })
  into.cylinder({ radius: 0.07, height: 0.48 }, { at: [x, floor + 0.28, z], colour: POLICE_METAL })
  for (let spoke = 0; spoke < 5; spoke++) {
    const angle = heading + (spoke * Math.PI * 2) / 5
    into.box([0.5, 0.045, 0.045], {
      at: [x + Math.sin(angle) * 0.2, floor + 0.055, z + Math.cos(angle) * 0.2],
      rotation: [0, angle, 0],
      colour: POLICE_METAL,
    })
    into.sphere([0.055, 0.055, 0.055], {
      at: [x + Math.sin(angle) * 0.43, floor + 0.04, z + Math.cos(angle) * 0.43],
      colour: POLICE_METAL,
    })
  }
}

/** Compact office fittings copied from the Community Safety Section panel. */
export function dressPoliceSafetyOffice(
  into: BanquetDetailBuilder,
  floor: number,
  ceiling: number,
): void {
  for (const x of [-8.2, -5.5, -2.8]) {
    into.box([1.4, 0.05, 0.65], {
      at: [x, floor + ceiling - 0.04, -13.0],
      colour: POLICE_LIGHT_DIFFUSER,
    })
  }
  for (const x of [-7.0, -4.0]) {
    into.cylinder(
      { radius: 0.1, height: 0.04, sides: 16 },
      { at: [x, floor + ceiling - 0.03, -11.5], colour: POLICE_LIGHT_DIFFUSER },
    )
  }

  for (const x of [-8.6, -7.3, -3.7, -2.4]) {
    into.box([1.1, 1.0, 0.55], { at: [x, floor + 0.5, -15.62], colour: POLICE_GRANITE })
    into.box([0.08, 0.03, 0.04], { at: [x, floor + 0.55, -15.31], colour: POLICE_METAL })
  }

  into.cylinder(
    { radius: 0.22, height: 0.06, sides: 24 },
    {
      at: [-4.0, floor + 2.15, -15.9],
      rotation: [Math.PI / 2, 0, 0],
      colour: POLICE_PAPER,
    },
  )
  into.box([0.025, 0.15, 0.03], { at: [-4.0, floor + 2.2, -15.86], colour: POLICE_METAL })
  into.box([0.12, 0.025, 0.03], { at: [-3.95, floor + 2.15, -15.86], colour: POLICE_METAL })

  dressSafetyChair(into, floor, [-5.5, -12.15], Math.PI)
  dressSafetyChair(into, floor, [-5.5, -15.0], 0)
  dressSafetyChair(into, floor, [-2.3, -13.35], -0.35)

  into.cylinder(
    { radius: 0.28, bottom: 0.38, height: 0.52, sides: 12 },
    { at: [-9.25, floor + 0.26, -10.65], colour: POLICE_OAK },
  )
  into.cylinder(
    { radius: 0.045, height: 1.45 },
    { at: [-9.25, floor + 1.05, -10.65], colour: POLICE_OAK },
  )
  for (const [dx, dy, dz] of [
    [-0.2, 1.35, 0],
    [0.2, 1.55, 0.05],
    [-0.1, 1.75, -0.05],
    [0.18, 1.9, 0],
  ] as const) {
    into.sphere([0.28, 0.42, 0.18], {
      at: [-9.25 + dx, floor + dy, -10.65 + dz],
      colour: POLICE_ALERT_GREEN,
    })
  }
}

/** Complete security checkpoint in the entrance vestibule */
export function dressPoliceEntranceSecurity(into: BanquetDetailBuilder, floor: number): void {
  const archZ = 6.8

  // Metal detector archway with overhead multizone detection display
  into.box([0.18, 2.3, 0.7], { at: [-0.65, floor + 1.15, archZ], colour: POLICE_METAL })
  into.box([0.18, 2.3, 0.7], { at: [0.65, floor + 1.15, archZ], colour: POLICE_METAL })
  into.box([1.48, 0.22, 0.7], { at: [0, floor + 2.35, archZ], colour: POLICE_METAL })
  into.box([0.4, 0.08, 0.04], { at: [0, floor + 2.35, archZ - 0.36], colour: POLICE_NAVY })
  into.box([0.04, 0.04, 0.02], {
    at: [-0.55, floor + 2.35, archZ - 0.36],
    colour: POLICE_ALERT_GREEN,
    glow: true,
  })
  into.box([0.04, 0.04, 0.02], {
    at: [0.55, floor + 2.35, archZ - 0.36],
    colour: POLICE_ALERT_RED,
    glow: true,
  })

  // Security turnstiles with access barrier flaps
  for (const tx of [-1.8, 1.8]) {
    into.box([0.35, 0.98, 0.85], { at: [tx, floor + 0.49, archZ], colour: POLICE_METAL })
    into.cylinder(
      { radius: 0.02, height: 0.55 },
      { at: [tx, floor + 0.85, archZ], colour: POLICE_BRASS },
    )
    into.box([0.08, 0.02, 0.12], {
      at: [tx, floor + 0.99, archZ - 0.2],
      colour: POLICE_SCREEN_GLOW,
      glow: true,
    })
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
