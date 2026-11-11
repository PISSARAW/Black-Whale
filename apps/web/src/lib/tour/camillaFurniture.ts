import {
  CamillaSurface,
  CAMILLA_GOLD as GOLD,
  CAMILLA_WOOD as WOOD,
  CAMILLA_VELVET as FABRIC,
  CAMILLA_SILK as LINEN,
  CAMILLA_PORCELAIN as PORCELAIN,
  CAMILLA_SILVER as SILVER,
} from './camillaDetailSurface'
import { dressCamillaArchedCabinet } from './camillaCabinet'

/** Front is -Z. All dimensions below are fractions of the current collision solid. */
function chair(surface: CamillaSurface): void {
  const height = surface.placement.structure.height
  const sofa = surface.placement.structure.id.endsWith('-seat-04')
  for (const x of [-0.38, 0.38]) {
    for (const z of [-0.34, 0.34]) {
      surface.curve(
        [
          [x, 0.42 / height, z],
          [x * 0.95, 0.2 / height, z],
          [x * 1.08, 0.05 / height, z],
        ],
        0.025,
        WOOD,
      )
    }
  }
  surface.box([0.87, 0.06 / height, 0.8], [0, 0.4 / height, 0], WOOD)
  surface.sphere([0.4, 0.07 / height, 0.35], [0, 0.47 / height, -0.01], FABRIC)
  surface.box([0.87, 0.43, 0.09], [0, 0.7, 0.36], WOOD)
  surface.sphere([0.38, 0.21, 0.075], [0, 0.71, 0.3], FABRIC)
  surface.curve(
    [
      [-0.44, 0.85, 0.36],
      [-0.36, 0.94, 0.36],
      [0, 0.965, 0.36],
      [0.36, 0.94, 0.36],
      [0.44, 0.85, 0.36],
    ],
    0.024,
    GOLD,
  )
  if (sofa) {
    for (const x of [-0.41, 0.41]) {
      surface.sphere([0.045, 0.07, 0.35], [x, 0.62, 0], FABRIC)
    }
  }
}

function legs(surface: CamillaSurface, top: number): void {
  for (const x of [-0.41, 0.41]) {
    for (const z of [-0.39, 0.39]) {
      surface.cylinder(
        { radius: 0.027, bottom: 0.018, height: top - 0.05 },
        [x, (top - 0.05) / 2, z],
        WOOD,
      )
    }
  }
}

function placeSetting(surface: CamillaSurface, end: number): void {
  const z = end * 0.31
  surface.roundCylinder({ radius: 0.17, height: 0.012 }, [0, 0.695, z], PORCELAIN)
  surface.roundCylinder({ radius: 0.14, height: 0.006 }, [0, 0.705, z], 0xb8a992)
  surface.box([0.014, 0.008, 0.16], [-0.21, 0.7, z], SILVER)
  surface.box([0.012, 0.008, 0.16], [0.21, 0.7, z], SILVER)
  surface.roundCylinder({ radius: 0.035, height: 0.006 }, [-0.24, 0.7, z + end * 0.14], SILVER)
  surface.roundCylinder({ radius: 0.006, height: 0.1 }, [-0.24, 0.74, z + end * 0.14], SILVER)
  surface.roundCylinder(
    { radius: 0.032, bottom: 0.014, height: 0.09 },
    [-0.24, 0.815, z + end * 0.14],
    0xc5c9be,
  )
  // Short candles in individual shallow saucers, visible beside the flowers in ch. 366.
  surface.roundCylinder({ radius: 0.075, height: 0.01 }, [0.25, 0.702, end * 0.07], SILVER)
  surface.roundCylinder({ radius: 0.045, height: 0.1 }, [0.25, 0.76, end * 0.07], LINEN)
  surface.sphere([0.012, 0.035, 0.012], [0.25, 0.84, end * 0.07], 0xe5c285)
}

function dining(surface: CamillaSurface): void {
  legs(surface, 0.65)
  surface.box([0.97, 0.04, 0.97], [0, 0.66, 0], WOOD)
  surface.box([0.98, 0.014, 0.98], [0, 0.687, 0], LINEN)
  // A folded hanging hem, entirely inside the declared table envelope.
  for (const x of [-0.48, 0.48]) {
    for (let fold = 0; fold < 18; fold++) {
      surface.box([0.025, 0.4, 0.052], [x, 0.48, (fold - 8.5) * 0.053], fold % 2 ? LINEN : 0xc9c3b6)
    }
  }
  for (const z of [-0.48, 0.48]) surface.box([0.96, 0.39, 0.016], [0, 0.48, z], LINEN)
  placeSetting(surface, -1)
  placeSetting(surface, 1)
  surface.roundCylinder({ radius: 0.24, height: 0.018 }, [0, 0.71, 0], PORCELAIN)
  for (let petal = 0; petal < 9; petal++) {
    const a = (petal * Math.PI * 2) / 9
    const x = Math.cos(a) * 0.1,
      z = Math.sin(a) * 0.07
    bouquetRose(surface, {
      x,
      y: 0.8 + (petal % 3) * 0.025,
      z,
      shade: petal % 2 ? 0xd4c1b6 : 0xe1d5c1,
    })
    surface.sphere([0.04, 0.01, 0.025], [Math.cos(a) * 0.15, 0.755, Math.sin(a) * 0.11], 0x64715c)
  }
}

function bouquetRose(
  surface: CamillaSurface,
  flower: { x: number; y: number; z: number; shade: number },
): void {
  for (let petal = 0; petal < 5; petal++) {
    const angle = (petal * Math.PI * 2) / 5
    surface.sphere(
      [0.035, 0.035, 0.025],
      [flower.x + Math.cos(angle) * 0.025, flower.y, flower.z + Math.sin(angle) * 0.02],
      flower.shade,
    )
  }
  surface.sphere([0.025, 0.03, 0.02], [flower.x, flower.y + 0.025, flower.z], 0xd5b7a2)
}

function laptopDesk(surface: CamillaSurface): void {
  legs(surface, 0.64)
  surface.box([0.96, 0.04, 0.95], [0, 0.66, 0], WOOD)
  surface.box([0.43, 0.015, 0.3], [-0.1, 0.69, 0.01], 0x979d99)
  for (let row = 0; row < 4; row++) {
    surface.box([0.33, 0.003, 0.008], [-0.1, 0.7, -0.04 + row * 0.04], 0x343b3a)
  }
  surface.box([0.43, 0.26, 0.018], [-0.1, 0.83, -0.14], 0x6c7672)
  surface.box([0.37, 0.2, 0.008], [-0.1, 0.83, -0.125], 0x283d3c)
  surface.box([0.19, 0.022, 0.25], [0.29, 0.7, 0.07], LINEN)
  surface.box([0.008, 0.007, 0.15], [0.29, 0.715, 0.07], 0x414139)
}

function cabinet(surface: CamillaSurface): void {
  surface.box([0.96, 0.88, 0.91], [0, 0.46, 0], WOOD)
  surface.box([0.99, 0.05, 0.96], [0, 0.94, 0], 0xaaa490)
  for (const x of [-0.24, 0.24]) {
    surface.box([0.42, 0.64, 0.025], [x, 0.48, -0.47], 0xbfb5a0)
    surface.sphere([0.025, 0.025, 0.02], [x, 0.51, -0.47], GOLD)
  }
}

function sideTable(surface: CamillaSurface): void {
  legs(surface, 0.87)
  surface.box([0.98, 0.08, 0.96], [0, 0.93, 0], WOOD)
}

export function dressCamillaFurniture(surface: CamillaSurface): void {
  const { structure: s } = surface.placement
  if (s.kind === 'seat') chair(surface)
  else if (s.id.endsWith('-arched-cabinet')) dressCamillaArchedCabinet(surface)
  else if (s.kind === 'cabinet') cabinet(surface)
  else if (s.id.endsWith('-dining-table-07')) dining(surface)
  else if (s.id.endsWith('-living-guard-desk')) laptopDesk(surface)
  else if (s.kind === 'table') sideTable(surface)
}
