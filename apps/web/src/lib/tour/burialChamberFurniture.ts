import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Structure } from './types'

const DARK_STONE = 0x2e2722,
  COFFIN_BODY = 0xd2cbc0,
  COFFIN_LID = 0xe4ded2,
  BRONZE = 0x76634c,
  GOLD = 0xd4af37,
  MOMOZE_AMBER = 0xf59e0b,
  LUMEN_WARM = 0xfbf3de

interface Context {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
}

function offsetPoint(
  context: Context,
  rotY: number,
  offset: readonly [number, number],
): [number, number] {
  const [x, z] = context.structure.at
  const [lx, lz] = offset
  return [
    x + lx * Math.cos(rotY) + lz * Math.sin(rotY),
    z - lx * Math.sin(rotY) + lz * Math.cos(rotY),
  ]
}

function coffinCradleFeet(context: Context, rotY: number): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [width, length] = structure.size

  // Luminous aura floor pad under each pod, casting upward floor light
  into.box([width * 0.94, 0.005, length * 0.96], {
    at: [x, floor + 0.006, z],
    colour: LUMEN_WARM,
    glow: true,
    rotation: [0, rotY, 0],
  })

  // Manga ch. 371: curved cradle feet / rocker skids elevating the pod
  for (const sign of [-0.28, 0.28]) {
    const [fx, fz] = offsetPoint(context, rotY, [0, length * sign])
    // Ground transverse pad
    into.box([width * 0.9, 0.04, 0.16], {
      at: [fx, floor + 0.022, fz],
      colour: DARK_STONE,
      rotation: [0, rotY, 0],
    })
    // Left and right riser brackets
    for (const side of [-1, 1]) {
      const [bx, bz] = offsetPoint(context, rotY, [side * width * 0.42, length * sign])
      into.box([0.08, 0.08, 0.16], {
        at: [bx, floor + 0.062, bz],
        colour: BRONZE,
        rotation: [0, rotY, 0],
      })
    }
  }
}

function isCoffinClosed(id: string): boolean {
  const match = id.match(/coffin-(\d+)$/)
  const num = match ? parseInt(match[1], 10) : 0
  return num === 8 || num === 10 || num === 12
}

function coffinTubAndFlanks(context: Context, rotY: number, isClosed: boolean): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [width, length] = structure.size
  const tubHeight = 0.34

  // Main coffin tub (elevated 0.08 m by cradle feet)
  into.box([width * 0.88, tubHeight, length * 0.94], {
    at: [x, floor + 0.08 + tubHeight / 2, z],
    colour: COFFIN_BODY,
    rotation: [0, rotY, 0],
  })

  // Perimeter rim molding
  into.box([width * 0.94, 0.04, length * 0.98], {
    at: [x, floor + 0.08 + tubHeight, z],
    colour: BRONZE,
    rotation: [0, rotY, 0],
  })

  if (!isClosed) {
    // Empty inner cavity visible inside the open awaiting coffin
    into.box([width * 0.72, 0.22, length * 0.82], {
      at: [x, floor + 0.08 + tubHeight * 0.65, z],
      colour: 0x161210,
      rotation: [0, rotY, 0],
    })
  }

  // Kakin ceremonial wave relief carvings along both flanks
  for (const side of [-1, 1]) {
    for (const lzFrac of [-0.25, 0, 0.25]) {
      const [wx, wz] = offsetPoint(context, rotY, [side * width * 0.45, length * lzFrac])
      into.box([0.025, 0.08, 0.26], {
        at: [wx, floor + 0.22, wz],
        colour: GOLD,
        rotation: [0, rotY, 0],
      })
      into.cylinder(
        { radius: 0.025, height: 0.03, sides: 8 },
        { at: [wx, floor + 0.22, wz], colour: BRONZE, rotation: [0, 0, Math.PI / 2] },
      )
    }
  }
}

function coffinVaultedLidAndSpine(context: Context, rotY: number, isClosed: boolean): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [width, length] = structure.size
  const tubHeight = 0.34
  const lidRadius = 0.34
  const lidLength = length * 0.92
  const lidY = floor + 0.08 + tubHeight

  if (isClosed) {
    // Sealed closed vaulted lid
    into.cylinder(
      { radius: lidRadius, height: lidLength, sides: 16 },
      {
        at: [x, lidY, z],
        colour: COFFIN_LID,
        rotation: [Math.PI / 2, 0, rotY],
      },
    )

    // Prominent stepped axial spine running along apex from head to foot
    into.box([0.18, 0.04, lidLength * 0.96], {
      at: [x, lidY + lidRadius + 0.02, z],
      colour: BRONZE,
      rotation: [0, rotY, 0],
    })
    into.box([0.09, 0.03, lidLength * 0.92], {
      at: [x, lidY + lidRadius + 0.05, z],
      colour: GOLD,
      rotation: [0, rotY, 0],
    })
  } else {
    // Open lid tilted back on hinges (living prince's coffin awaiting occupant)
    const [lx, lz] = offsetPoint(context, rotY, [width * 0.38, 0])
    into.cylinder(
      { radius: lidRadius, height: lidLength, sides: 16 },
      {
        at: [lx, lidY + 0.32, lz],
        colour: 0xc8c0b4,
        rotation: [Math.PI / 2, 0, rotY + 0.55],
      },
    )
    const [sx, sz] = offsetPoint(context, rotY, [width * 0.38 + 0.05, 0])
    into.box([0.14, 0.03, lidLength * 0.94], {
      at: [sx, lidY + 0.32 + lidRadius * 0.85, sz],
      colour: BRONZE,
      rotation: [0, rotY, 0],
    })
  }
}

function coffinHeadAndFoot(context: Context, rotY: number, isClosed: boolean): void {
  const { into, structure, floor } = context
  const [width, length] = structure.size

  // Inward head portal (lz = -length * 0.47) where ritual cable docks
  const [hx, hz] = offsetPoint(context, rotY, [0, -length * 0.47])
  into.cylinder(
    { radius: 0.14, height: 0.08, sides: 16 },
    { at: [hx, floor + 0.22, hz], colour: BRONZE, rotation: [Math.PI / 2, 0, rotY] },
  )
  into.ring(
    { radius: 0.12, tube: 0.015 },
    {
      at: [hx, floor + 0.22, hz],
      colour: isClosed ? MOMOZE_AMBER : BRONZE,
      glow: isClosed,
      rotation: [Math.PI / 2, 0, rotY],
    },
  )

  // Outward foot bulkhead with gold prince numeral plaque
  const [fx, fz] = offsetPoint(context, rotY, [0, length * 0.47])
  into.box([width * 0.84, 0.48, 0.04], {
    at: [fx, floor + 0.28, fz],
    colour: DARK_STONE,
    rotation: [0, rotY, 0],
  })
  into.box([0.24, 0.14, 0.02], {
    at: [fx, floor + 0.32, fz],
    colour: isClosed ? GOLD : BRONZE,
    rotation: [0, rotY, 0],
  })
}

export function dressBurialCoffin(context: Context): void {
  const rotY = (context.structure.rotation * Math.PI) / 180
  const isClosed = isCoffinClosed(context.structure.id)

  coffinCradleFeet(context, rotY)
  coffinTubAndFlanks(context, rotY, isClosed)
  coffinVaultedLidAndSpine(context, rotY, isClosed)
  coffinHeadAndFoot(context, rotY, isClosed)
}
