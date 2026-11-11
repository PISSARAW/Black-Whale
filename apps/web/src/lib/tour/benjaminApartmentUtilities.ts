import { BenjaminRoomSurface } from './benjaminRoomDetailSurface'

const CERAMIC = 0xd5d5c8,
  METAL = 0x91998e,
  WATER = 0x535f5a

function tap(surface: BenjaminRoomSurface, at: readonly [number, number, number]): void {
  const [x, y, z] = at
  surface.curve(
    [
      [x, y, z],
      [x, y + 0.18, z],
      [x, y + 0.23, z + 0.1],
      [x, y + 0.14, z + 0.13],
    ],
    0.012,
    METAL,
  )
}

function sink(
  surface: BenjaminRoomSurface,
  placement: { x: number; y: number; z: number; width: number; depth: number },
): void {
  const { x, y, z, width: w, depth: d } = placement
  surface.box([w, 0.025, d], [x, y, z], CERAMIC)
  surface.box([w - 0.08, 0.012, d - 0.08], [x, y + 0.017, z], WATER)
  surface.box([w - 0.14, 0.01, d - 0.14], [x, y + 0.025, z], 0x9fa89d)
  tap(surface, [x, y, z - d / 2 + 0.03])
}

function kitchen(surface: BenjaminRoomSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w - 0.04, h - 0.08, d - 0.04], [0, (h + 0.08) / 2, 0], 0x777769)
  surface.box([w - 0.08, 0.08, d - 0.08], [0, 0.04, 0], 0x3c413b)
  surface.box([w, 0.045, d], [0, h - 0.0225, 0], 0xb9b8a7)
  const count = Math.max(1, Math.round(w / 0.8)),
    pitch = (w - 0.08) / count
  for (let i = 0; i < count; i++) {
    const x = (i + 0.5) * pitch - (w - 0.08) / 2
    surface.box([pitch - 0.025, h - 0.18, 0.025], [x, h / 2 + 0.02, d / 2 - 0.01], 0xa3a28e)
    surface.box([0.12, 0.02, 0.025], [x, h - 0.13, d / 2 + 0.009], METAL)
  }
  // Sink and four burners are symbols on the programme-type; no extra appliances are asserted.
  if (!surface.structure.id.endsWith('-counter-08')) return
  sink(surface, { x: w * 0.18, y: h + 0.01, z: 0, width: 0.65, depth: d * 0.72 })
  surface.box([0.7, 0.018, d * 0.8], [-w * 0.3, h + 0.01, 0], 0x343b36)
  for (const x of [-0.17, 0.17]) {
    for (const z of [-0.14, 0.14]) {
      surface.into.ring(
        { radius: 0.095, tube: 0.008 },
        {
          at: surface.point([-w * 0.3 + x, h + 0.027, z]),
          rotation: [Math.PI / 2, surface.angle, 0],
          colour: METAL,
        },
      )
    }
  }
}

function toilet(surface: BenjaminRoomSurface): void {
  const w = surface.width,
    d = surface.depth
  surface.box([w * 0.34, 0.3, d * 0.42], [0, 0.15, 0.05], CERAMIC)
  surface.sphere([w * 0.43, 0.15, d * 0.4], [0, 0.34, 0.035], CERAMIC)
  surface.sphere([w * 0.31, 0.012, d * 0.28], [0, 0.474, 0.04], WATER)
  surface.box([w * 0.7, 0.37, d * 0.18], [0, 0.64, -d * 0.36], CERAMIC)
  surface.box([0.055, 0.018, 0.025], [0.1, 0.832, -d * 0.36], METAL)
}

function bath(surface: BenjaminRoomSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.12, d], [0, 0.15, 0], CERAMIC)
  for (const side of [-1, 1]) {
    surface.box([w, h - 0.12, 0.075], [0, (h + 0.12) / 2, side * (d / 2 - 0.0375)], CERAMIC)
    surface.box([0.075, h - 0.12, d], [side * (w / 2 - 0.0375), (h + 0.12) / 2, 0], CERAMIC)
  }
  surface.box([w - 0.17, 0.02, d - 0.17], [0, 0.22, 0], 0xb3c0b5)
  tap(surface, [-w * 0.32, h, -d * 0.38])
}

function washstand(surface: BenjaminRoomSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w - 0.04, h - 0.1, d - 0.04], [0, (h - 0.1) / 2, 0], 0x777769)
  surface.box([w, 0.05, d], [0, h - 0.025, 0], CERAMIC)
  sink(surface, { x: 0, y: h, z: 0, width: w - 0.06, depth: d - 0.04 })
}

export function dressBenjaminApartmentUtilities(surface: BenjaminRoomSurface): void {
  const { kind, id } = surface.structure
  if (kind === 'counter') kitchen(surface)
  if (kind !== 'basin') return
  if (id.includes('-wc-')) toilet(surface)
  else if (id.endsWith('-basin-13')) bath(surface)
  else washstand(surface)
}
