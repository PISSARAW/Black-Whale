import type * as Three from 'three'
import { type Ship } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { MELODY_CONCERT } from './melodyConcert'
import { standingSurface } from './standingSurface'

/** Temporary daisies interpret the flower-filled listening space, not physical furniture. */
export function buildConcertFlowers(THREE: typeof Three, ship: Ship): Three.Group {
  const room = ship.spaces.get(MELODY_CONCERT.performer.spaceId)!
  const plan = ship.plans.get(room.tierId)!
  const into = new BanquetDetailBuilder(THREE)
  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < 13; column++) {
      const x = -5.8 + column * 0.8 + Math.sin(row * 3 + column) * 0.12
      const z = 22.7 + row * 0.6 + Math.cos(row + column * 2) * 0.1
      if (Math.hypot(x + 1, z - MELODY_CONCERT.performer.at[1]) < 0.65) continue
      flower({
        THREE,
        into,
        at: [x, standingSurface(plan, [x, z], room), z],
        seed: row * 13 + column,
      })
    }
  }
  const root = into.finish()
  root.name = 'concert-flower-field'
  return root
}

function flower(options: {
  THREE: typeof Three
  into: BanquetDetailBuilder
  at: readonly [number, number, number]
  seed: number
}): void {
  const {
    THREE,
    into,
    at: [x, floor, z],
    seed,
  } = options
  const height = 0.19 + (seed % 4) * 0.045
  into.cylinder(
    { radius: 0.008, height, sides: 4, open: true },
    {
      at: [x, floor + height / 2, z],
      colour: 0x63855b,
    },
  )
  for (let petal = 0; petal < 8; petal++) {
    const angle = (petal * Math.PI) / 4 + seed * 0.4
    const geometry = new THREE.CircleGeometry(0.045, 7).scale(1, 2.3, 1)
    geometry.rotateX(-Math.PI / 2).rotateY(angle)
    into.add(geometry, {
      at: [x + Math.sin(angle) * 0.075, floor + height, z + Math.cos(angle) * 0.075],
      colour: seed % 5 === 0 ? 0xe2d0a1 : 0xf3eedc,
    })
  }
  into.sphere([0.043, 0.022, 0.043], { at: [x, floor + height + 0.012, z], colour: 0xc8a04d })
}
