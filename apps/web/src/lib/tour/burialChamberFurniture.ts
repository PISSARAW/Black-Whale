import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Structure } from './types'

const DARK_STONE = 0x1f1b18,
  COFFIN_BODY = 0x2d2722,
  BRONZE = 0x4f4438,
  GOLD = 0xbda062,
  MOMOZE_AMBER = 0xf59e0b

interface Context {
  into: BanquetDetailBuilder
  structure: Structure
  floor: number
}

function coffinPlinthAndBody(context: Context, rotY: number): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [width, length] = structure.size
  const height = structure.height

  // Base plinth
  into.box([width * 1.04, 0.1, length * 1.02], {
    at: [x, floor + 0.05, z],
    colour: DARK_STONE,
    rotation: [0, rotY, 0],
  })

  // Lower coffin tub
  const tubHeight = height * 0.46
  into.box([width * 0.94, tubHeight, length * 0.96], {
    at: [x, floor + 0.1 + tubHeight / 2, z],
    colour: COFFIN_BODY,
    rotation: [0, rotY, 0],
  })
}

function coffinLidAndOrnament(context: Context, rotY: number): void {
  const { into, structure, floor } = context
  const [x, z] = structure.at
  const [width, length] = structure.size
  const height = structure.height
  const isMomoze = structure.id.endsWith('coffin-01')

  // Arched curved lid (cylindrical half-vault)
  const lidRadius = width * 0.46
  const lidY = floor + height * 0.62
  into.cylinder(
    { radius: lidRadius, height: length * 0.94, sides: 14 },
    {
      at: [x, lidY, z],
      colour: isMomoze ? 0x362c25 : COFFIN_BODY,
      rotation: [Math.PI / 2, 0, rotY],
    },
  )

  // Side decorative bronze moldings along flanks
  const sideOffset = width * 0.47
  for (const sign of [-1, 1]) {
    const ox = x + Math.cos(rotY) * (sign * sideOffset)
    const oz = z - Math.sin(rotY) * (sign * sideOffset)
    into.box([0.03, 0.06, length * 0.9], {
      at: [ox, floor + height * 0.52, oz],
      colour: BRONZE,
      rotation: [0, rotY, 0],
    })
  }

  // End plaque facing outward
  const outD = (length * 0.96) / 2
  const px = x + Math.sin(rotY) * outD
  const pz = z + Math.cos(rotY) * outD
  into.box([0.22, 0.14, 0.02], {
    at: [px, floor + height * 0.45, pz],
    colour: GOLD,
    rotation: [0, rotY, 0],
  })

  // Head socket facing inward
  const inD = -outD
  const sx = x + Math.sin(rotY) * inD
  const sz = z + Math.cos(rotY) * inD
  into.cylinder(
    { radius: 0.12, height: 0.08, sides: 12 },
    {
      at: [sx, floor + 0.22, sz],
      colour: isMomoze ? MOMOZE_AMBER : BRONZE,
      glow: isMomoze,
      rotation: [Math.PI / 2, 0, rotY],
    },
  )
}

export function dressBurialCoffin(context: Context): void {
  const rotY = (context.structure.rotation * Math.PI) / 180
  coffinPlinthAndBody(context, rotY)
  coffinLidAndOrnament(context, rotY)
}
