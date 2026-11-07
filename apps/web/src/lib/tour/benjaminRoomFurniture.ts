import {
  BenjaminRoomSurface,
  BENJAMIN_BRONZE,
  BENJAMIN_DARK_WOOD,
  BENJAMIN_GOLD_TRIM,
  BENJAMIN_STONE,
} from './benjaminRoomDetailSurface'

function telephoneConsole(surface: BenjaminRoomSurface): void {
  // Console desk beneath the telephone unit
  surface.box([0.7, 0.05, 0.65], [0, -0.03, 0], BENJAMIN_DARK_WOOD)
  surface.box([0.74, 0.025, 0.69], [0, -0.06, 0], BENJAMIN_BRONZE)

  // 4 Legs
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * 0.28
      const z = sz * 0.25
      surface.box([0.06, 1.0, 0.06], [x, -0.57, z], BENJAMIN_DARK_WOOD)
      surface.cylinder({ radius: 0.045, height: 0.08 }, [x, -1.11, z], BENJAMIN_BRONZE)
    }
  }

  // Tactical folders and communications logbook on desk
  surface.box([0.28, 0.035, 0.22], [0.18, 0.02, 0.05], 0x4a3c28)
  surface.box([0.26, 0.025, 0.2], [0.19, 0.05, 0.06], 0x2e352c)
}

function telephoneUnit(surface: BenjaminRoomSurface): void {
  const h = surface.structure.height

  // Main chassis (angled military transmission telephone box)
  surface.box([0.38, 0.16, 0.34], [-0.1, 0.08, -0.04], BENJAMIN_BRONZE)
  surface.box([0.34, 0.06, 0.26], [-0.1, 0.17, -0.03], 0x242825)

  // Dial / push-button plate
  surface.cylinder({ radius: 0.065, height: 0.025, sides: 16 }, [-0.1, 0.2, 0.02], BENJAMIN_STONE)
  surface.sphere([0.025, 0.015, 0.025], [-0.1, 0.22, 0.02], BENJAMIN_GOLD_TRIM)

  // Selector switches and indicator lamps (status of lines to 14 princes)
  for (let i = 0; i < 4; i++) {
    const lx = -0.22 + i * 0.08
    surface.sphere([0.012, 0.012, 0.012], [lx, 0.21, -0.1], { colour: 0xe05530, glow: true })
    surface.box([0.012, 0.025, 0.012], [lx, 0.22, -0.06], BENJAMIN_GOLD_TRIM)
  }

  // Cradle prongs
  for (const cx of [-0.22, 0.02]) {
    surface.box([0.025, 0.06, 0.025], [cx, 0.22, -0.08], BENJAMIN_GOLD_TRIM)
  }

  // Handset resting on cradle
  surface.box([0.28, 0.035, 0.04], [-0.1, 0.26, -0.08], 0x1f2220)
  surface.cylinder({ radius: 0.04, height: 0.05 }, [-0.22, 0.26, -0.08], BENJAMIN_BRONZE)
  surface.cylinder({ radius: 0.04, height: 0.05 }, [0.02, 0.26, -0.08], BENJAMIN_BRONZE)

  // Coiled cable from handset to chassis
  surface.curve(
    [
      [-0.18, 0.24, -0.06],
      [-0.24, 0.12, 0.06],
      [-0.14, 0.08, 0.12],
      [-0.04, 0.1, 0.06],
    ],
    0.012,
    0x151816,
  )

  // Wall cable connection box
  surface.box([0.16, 0.22, 0.06], [-0.1, h * 0.7, -surface.depth / 2 - 0.03], BENJAMIN_BRONZE)
}

export function dressBenjaminRoomFurniture(surface: BenjaminRoomSurface): void {
  if (surface.structure.kind === 'telephone') {
    telephoneConsole(surface)
    telephoneUnit(surface)
  }
}
