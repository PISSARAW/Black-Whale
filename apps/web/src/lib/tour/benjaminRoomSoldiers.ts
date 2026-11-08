import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import {
  BENJAMIN_BRONZE,
  BENJAMIN_GOLD_TRIM,
  BENJAMIN_LEATHER_DARK,
  BENJAMIN_SKIN,
  BENJAMIN_UNIFORM_GREEN,
  BENJAMIN_UNIFORM_GREY,
} from './benjaminRoomDetailSurface'

interface SoldierPlacement {
  into: BanquetDetailBuilder
  at: Point3
  rotationY: number
}

function soldierLegs(into: BanquetDetailBuilder, at: Point3, rotationY: number): void {
  const [x, y, z] = at
  // Boots (heels joined at attention)
  into.box([0.18, 0.12, 0.24], {
    at: [x, y + 0.06, z],
    rotation: [0, rotationY, 0],
    colour: BENJAMIN_LEATHER_DARK,
  })
  // Legs in formal trousers
  for (const sx of [-0.05, 0.05]) {
    into.box([0.09, 0.76, 0.11], {
      at: [x + sx * Math.cos(rotationY), y + 0.5, z - sx * Math.sin(rotationY)],
      rotation: [0, rotationY, 0],
      colour: BENJAMIN_UNIFORM_GREY,
    })
  }
}

function soldierTorso(into: BanquetDetailBuilder, at: Point3, rotationY: number): void {
  const [x, y, z] = at
  // Tunic lower skirt
  into.box([0.32, 0.22, 0.18], {
    at: [x, y + 0.95, z],
    rotation: [0, rotationY, 0],
    colour: BENJAMIN_UNIFORM_GREEN,
  })
  // Belt with bronze buckle
  into.box([0.33, 0.06, 0.19], {
    at: [x, y + 1.08, z],
    rotation: [0, rotationY, 0],
    colour: BENJAMIN_LEATHER_DARK,
  })
  into.box([0.08, 0.07, 0.2], {
    at: [x, y + 1.08, z],
    rotation: [0, rotationY, 0],
    colour: BENJAMIN_BRONZE,
  })
  // Main chest & back (straight posture)
  into.box([0.36, 0.42, 0.2], {
    at: [x, y + 1.3, z],
    rotation: [0, rotationY, 0],
    colour: BENJAMIN_UNIFORM_GREEN,
  })

  // Double-breasted buttons
  for (let b = 0; b < 3; b++) {
    const by = y + 1.18 + b * 0.08
    for (const bx of [-0.05, 0.05]) {
      into.sphere([0.012, 0.012, 0.012], {
        at: [x + bx * Math.cos(rotationY), by, z - bx * Math.sin(rotationY)],
        colour: BENJAMIN_GOLD_TRIM,
      })
    }
  }

  // Epaulettes
  for (const side of [-1, 1]) {
    into.box([0.1, 0.03, 0.14], {
      at: [x + side * 0.2 * Math.cos(rotationY), y + 1.51, z - side * 0.2 * Math.sin(rotationY)],
      rotation: [0, rotationY, 0],
      colour: BENJAMIN_GOLD_TRIM,
    })
  }
}

function soldierArmsAndHead(into: BanquetDetailBuilder, at: Point3, rotationY: number): void {
  const [x, y, z] = at
  // Arms rigid at sides along trouser seam
  for (const side of [-1, 1]) {
    const ax = x + side * 0.21 * Math.cos(rotationY)
    const az = z - side * 0.21 * Math.sin(rotationY)
    into.box([0.07, 0.58, 0.09], {
      at: [ax, y + 1.22, az],
      rotation: [0, rotationY, 0],
      colour: BENJAMIN_UNIFORM_GREEN,
    })
    // Hands/gloves
    into.box([0.06, 0.1, 0.08], {
      at: [ax, y + 0.88, az],
      rotation: [0, rotationY, 0],
      colour: BENJAMIN_SKIN,
    })
  }

  // Neck and head
  into.cylinder({ radius: 0.05, height: 0.08 }, { at: [x, y + 1.55, z], colour: BENJAMIN_SKIN })
  into.sphere([0.09, 0.11, 0.1], { at: [x, y + 1.66, z], colour: BENJAMIN_SKIN })

  // Officer service cap (peaked visor cap)
  into.cylinder(
    { radius: 0.11, bottom: 0.095, height: 0.09 },
    { at: [x, y + 1.76, z], colour: BENJAMIN_UNIFORM_GREEN },
  )
  into.box([0.16, 0.02, 0.08], {
    at: [x - 0.06 * Math.sin(rotationY), y + 1.73, z - 0.06 * Math.cos(rotationY)],
    rotation: [0.15, rotationY, 0],
    colour: BENJAMIN_LEATHER_DARK,
  })
  // Gold badge on cap
  into.sphere([0.015, 0.02, 0.015], {
    at: [x - 0.1 * Math.sin(rotationY), y + 1.78, z - 0.1 * Math.cos(rotationY)],
    colour: BENJAMIN_GOLD_TRIM,
  })
}

function soldierAtAttention(placement: SoldierPlacement): void {
  const { into, at, rotationY } = placement
  soldierLegs(into, at, rotationY)
  soldierTorso(into, at, rotationY)
  soldierArmsAndHead(into, at, rotationY)
}

/** Two disciplined ranks of private guards standing at attention facing the prince. */
export function dressBenjaminRoomSoldiers(into: BanquetDetailBuilder, floor: number): void {
  // Soldiers face towards -X (where Prince Benjamin stands, heading = Math.PI / 2)
  const facingBenjamin = Math.PI / 2

  // Rank 1 (front line)
  const frontXs = [-4.6, -3.7, -2.8, -1.9, -1.0]
  for (const x of frontXs) {
    soldierAtAttention({ into, at: [x, floor, 0.8], rotationY: facingBenjamin })
  }

  // Rank 2 (rear line)
  const rearXs = [-4.6, -3.7, -2.8, -1.9, -1.0]
  for (const x of rearXs) {
    soldierAtAttention({ into, at: [x, floor, 2.2], rotationY: facingBenjamin })
  }
}
