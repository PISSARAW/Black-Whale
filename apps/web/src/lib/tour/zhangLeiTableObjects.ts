import {
  ZhangLeiSurface,
  ZHANG_LEI_GOLD as GOLD,
  ZHANG_LEI_WOOD as WOOD,
  ZHANG_LEI_CANDLE as WAX,
  ZHANG_LEI_FLAME as FLAME,
} from './zhangLeiDetailSurface'

function candelabrum(surface: ZhangLeiSurface): void {
  surface.cylinder({ radius: 0.11, height: 0.035 }, [0, 0.02, 0], GOLD)
  surface.cylinder({ radius: 0.022, height: 0.4 }, [0, 0.23, 0], GOLD)
  for (const side of [-1, 1])
    surface.curve(
      [
        [0, 0.35, 0],
        [side * 0.17, 0.28, 0],
        [side * 0.22, 0.46, 0],
      ],
      0.013,
      GOLD,
    )
  for (const x of [-0.22, 0, 0.22]) {
    surface.cylinder({ radius: 0.045, height: 0.025 }, [x, 0.47, 0], GOLD)
    surface.cylinder({ radius: 0.018, height: 0.23 }, [x, 0.59, 0], WAX)
    surface.into.sphere([0.016, 0.04, 0.016], {
      at: surface.point([x, 0.745, 0]),
      colour: FLAME,
      glow: true,
    })
  }
}

function service(surface: ZhangLeiSurface): void {
  for (const z of [-0.19, 0.19]) {
    surface.cylinder({ radius: 0.075, height: 0.17 }, [-0.1, 0.09, z], 0xd0c8ab)
    surface.ring(0.075, [-0.1, 0.03, z], WOOD)
    surface.ring(0.075, [-0.1, 0.14, z], WOOD)
    surface.cylinder({ radius: 0.078, height: 0.025 }, [-0.1, 0.19, z], WOOD)
    surface.sphere([0.02, 0.025, 0.02], [-0.1, 0.22, z], GOLD)
    surface.cylinder({ radius: 0.08, height: 0.012 }, [0.18, 0.01, z], 0xc7c2ad)
    surface.cylinder({ radius: 0.045, height: 0.05 }, [0.18, 0.04, z], 0x62503d)
  }
}

function mantelClock(surface: ZhangLeiSurface): void {
  surface.box([surface.width, 0.07, surface.depth], [0, 0.04, 0], WOOD)
  surface.sphere([0.17, 0.22, 0.12], [0, 0.3, 0], GOLD)
  surface.sphere([0.115, 0.115, 0.015], [0, 0.3, surface.depth / 2 - 0.03], 0xd8d1b9)
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6
    surface.sphere(
      [0.006, 0.006, 0.008],
      [Math.sin(a) * 0.092, 0.3 + Math.cos(a) * 0.092, surface.depth / 2 - 0.008],
      WOOD,
    )
  }
  // Neutral hands; the source does not establish a reliable clock reading.
  surface.box([0.01, 0.065, 0.012], [0, 0.327, surface.depth / 2 - 0.005], WOOD)
  surface.box([0.065, 0.01, 0.012], [0.03, 0.3, surface.depth / 2 - 0.005], WOOD)
}

export function dressZhangLeiTableObjects(surface: ZhangLeiSurface): void {
  const id = surface.structure.id
  if (id.includes('candelabrum')) candelabrum(surface)
  if (id.endsWith('-service')) service(surface)
  if (id.endsWith('-mantel-clock')) mantelClock(surface)
}
