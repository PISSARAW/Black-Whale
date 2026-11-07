import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Structure } from './types'

const DARK_STONE = 0x1f1b18,
  COFFIN_BODY = 0x27211c,
  BRONZE = 0x453a2e,
  GOLD = 0xbda062,
  MOMOZE_AMBER = 0xf59e0b,
  MOMOZE_PALE = 0xfde68a,
  LUMEN_WHITE = 0xffffff

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
  const [width, length] = structure.size

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

function coffinTubAndFlanks(context: Context, rotY: number): void {
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

function coffinVaultedLidAndSpine(context: Context, rotY: number): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [, length] = structure.size
  const isMomoze = structure.id.endsWith('coffin-01')
  const tubHeight = 0.34
  const lidRadius = 0.34
  const lidLength = length * 0.92
  const lidY = floor + 0.08 + tubHeight

  // Barrel-vaulted arched lid
  into.cylinder(
    { radius: lidRadius, height: lidLength, sides: 16 },
    {
      at: [x, lidY, z],
      colour: isMomoze ? 0x362d25 : COFFIN_BODY,
      rotation: [Math.PI / 2, 0, rotY],
    },
  )

  // Manga ch. 371: prominent stepped axial spine running along apex from head to foot
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
}

function coffinHeadAndFoot(context: Context, rotY: number): void {
  const { into, structure, floor } = context
  const [width, length] = structure.size
  const isMomoze = structure.id.endsWith('coffin-01')

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
      colour: isMomoze ? MOMOZE_AMBER : BRONZE,
      glow: isMomoze,
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
    colour: GOLD,
    rotation: [0, rotY, 0],
  })
}

function momozeInterior(context: Context, rotY: number): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [width, length] = structure.size

  // Luminous Nen aura bed inside Momoze's transparent viewing capsule
  into.box([width * 0.52, 0.08, length * 0.68], {
    at: [x, floor + 0.26, z],
    colour: MOMOZE_AMBER,
    glow: true,
    rotation: [0, rotY, 0],
  })
  // Sleeping body / shroud silhouette
  into.box([width * 0.36, 0.12, length * 0.54], {
    at: [x, floor + 0.34, z],
    colour: MOMOZE_PALE,
    glow: true,
    rotation: [0, rotY, 0],
  })
  // Headrest pillow / face aura
  const [px, pz] = offsetPoint(context, rotY, [0, -length * 0.18])
  into.sphere([0.11, 0.07, 0.09], {
    at: [px, floor + 0.42, pz],
    colour: LUMEN_WHITE,
    glow: true,
  })
}

export function dressBurialCoffin(context: Context): void {
  const rotY = (context.structure.rotation * Math.PI) / 180
  coffinCradleFeet(context, rotY)
  coffinTubAndFlanks(context, rotY)
  coffinVaultedLidAndSpine(context, rotY)
  coffinHeadAndFoot(context, rotY)
  if (context.structure.id.endsWith('coffin-01')) {
    momozeInterior(context, rotY)
  }
}
