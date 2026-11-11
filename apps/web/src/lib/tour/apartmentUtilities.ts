import { ApartmentSurface } from './apartmentDetailSurface'

const CERAMIC = 0xd5d5c8,
  METAL = 0x91998e,
  WATER = 0x535f5a,
  CABINET = 0x777769,
  CABINET_FACE = 0xa3a28e,
  SHADOW = 0x3c413b

function tap(surface: ApartmentSurface, at: readonly [number, number, number]): void {
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
  surface: ApartmentSurface,
  placement: { x: number; y: number; z: number; width: number; depth: number },
): void {
  const { x, y, z, width: w, depth: d } = placement
  surface.box([w, 0.025, d], [x, y, z], CERAMIC)
  surface.box([w - 0.08, 0.012, d - 0.08], [x, y + 0.017, z], WATER)
  surface.box([w - 0.14, 0.01, d - 0.14], [x, y + 0.025, z], 0x9fa89d)
  tap(surface, [x, y, z - d / 2 + 0.03])
}

function kitchen(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w - 0.04, h - 0.08, d - 0.04], [0, (h + 0.08) / 2, 0], CABINET)
  surface.box([w - 0.08, 0.08, d - 0.08], [0, 0.04, 0], SHADOW)
  surface.box([w, 0.045, d], [0, h - 0.0225, 0], 0xb9b8a7)
  surface.box([w, 0.28, 0.035], [0, h + 0.12, -d / 2 + 0.018], 0xb5b3a2)
  const count = Math.max(1, Math.round(w / 0.8)),
    pitch = (w - 0.08) / count
  for (let i = 0; i < count; i++) {
    const x = (i + 0.5) * pitch - (w - 0.08) / 2
    surface.box([pitch - 0.025, h - 0.18, 0.025], [x, h / 2 + 0.02, d / 2 - 0.01], CABINET_FACE)
    surface.box([pitch - 0.14, h - 0.34, 0.015], [x, h / 2 + 0.01, d / 2 + 0.008], 0x8d8c7a)
    surface.box([0.16, 0.02, 0.025], [x, h - 0.13, d / 2 + 0.026], METAL)
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

function toilet(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth
  surface.box([w * 0.3, 0.28, d * 0.34], [0, 0.14, 0.02], CERAMIC)
  surface.sphere([w * 0.42, 0.16, d * 0.39], [0, 0.35, 0.08], CERAMIC)
  surface.flatRing({ radius: Math.min(w, d) * 0.27, tube: 0.035 }, [0, 0.49, 0.08], CERAMIC)
  surface.sphere([w * 0.27, 0.01, d * 0.24], [0, 0.47, 0.08], WATER)
  surface.box([w * 0.68, 0.38, d * 0.2], [0, 0.65, -d * 0.34], CERAMIC)
  surface.box([w * 0.72, 0.055, d * 0.22], [0, 0.86, -d * 0.34], CERAMIC)
  surface.box([0.065, 0.025, 0.035], [w * 0.2, 0.895, -d * 0.34], METAL)
  surface.cylinder({ radius: 0.025, height: 0.18 }, [0, 0.12, -d * 0.33], METAL)
}

function bath(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.12, d], [0, 0.15, 0], CERAMIC)
  for (const side of [-1, 1]) {
    surface.box([w, h - 0.12, 0.075], [0, (h + 0.12) / 2, side * (d / 2 - 0.0375)], CERAMIC)
    surface.box([0.075, h - 0.12, d], [side * (w / 2 - 0.0375), (h + 0.12) / 2, 0], CERAMIC)
  }
  surface.box([w - 0.17, 0.02, d - 0.17], [0, 0.22, 0], 0xb3c0b5)
  surface.box([w - 0.24, 0.04, d - 0.24], [0, 0.12, 0], 0xbcbeb4)
  surface.flatRing({ radius: 0.055, tube: 0.012 }, [w * 0.28, 0.235, d * 0.3], METAL)
  tap(surface, [-w * 0.32, h, -d * 0.38])
  surface.box([0.16, 0.035, 0.08], [-w * 0.18, h + 0.02, -d * 0.38], METAL)
}

function washstand(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w - 0.04, h - 0.1, d - 0.04], [0, (h - 0.1) / 2, 0], CABINET)
  for (const side of [-1, 1]) {
    surface.box([w * 0.43, h - 0.22, 0.025], [side * w * 0.23, h / 2, d / 2], CABINET_FACE)
    surface.sphere([0.022, 0.022, 0.022], [side * w * 0.08, h * 0.52, d / 2 + 0.025], METAL)
  }
  surface.box([w, 0.05, d], [0, h - 0.025, 0], CERAMIC)
  sink(surface, { x: 0, y: h, z: 0, width: w - 0.06, depth: d - 0.04 })
  surface.box([w * 0.72, 0.72, 0.025], [0, h + 0.48, -d / 2 + 0.015], METAL)
  surface.box([w * 0.64, 0.64, 0.012], [0, h + 0.48, -d / 2 + 0.035], 0xb9c4bf)
}

export function dressApartmentUtilities(surface: ApartmentSurface): void {
  const { kind, id } = surface.structure
  if (kind === 'counter') kitchen(surface)
  if (kind !== 'basin') return
  if (id.includes('-wc-')) toilet(surface)
  else if (id.endsWith('-basin-13')) bath(surface)
  else washstand(surface)
}
