import type { BufferGeometry, Material, Object3D } from 'three'
import { buildKakinRobe } from './humanKakinRoyal'
import type { Attire } from './humanProfiles'
type Three = typeof import('three')
export interface Placed {
  key: string
  make: () => BufferGeometry
  material: Material
  at: [number, number, number]
  turn?: [number, number, number]
  scale?: [number, number, number]
  name?: string
}

export interface Hang {
  THREE: Three
  head: (shape: Placed) => Object3D
  body: (shape: Placed) => Object3D
  arms: (shape: Placed) => void
  hand: (shape: Placed) => Object3D
  paint: { ink: Material; skin: Material; accent: Material; cloth: Material; dark: Material }
}

export type Piece = (hang: Hang) => void

export const GARMENTS: Partial<Record<Attire, Piece>> = {
  changshan: ({ THREE, body, paint }) => {
    body({
      key: 'attire:changshan',
      make: () => new THREE.CylinderGeometry(0.23, 0.28, 1.13, 8),
      material: paint.cloth,
      at: [0, 0.615, 0],
      name: 'attire-changshan',
    })
    // The standing collar is the difference between this and a dressing gown.
    body({
      key: 'attire:mandarin-collar',
      make: () => new THREE.CylinderGeometry(0.13, 0.15, 0.13, 8, 1, true),
      material: paint.cloth,
      at: [0, 1.48, 0],
    })
    for (let i = 0; i < 4; i++) {
      body({
        key: 'attire:frog',
        make: () => new THREE.SphereGeometry(0.016, 5, 4),
        material: paint.accent,
        at: [0.08, 1.32 - i * 0.11, 0.19],
      })
    }
  },

  kimono: ({ THREE, body, paint }) => {
    body({
      key: 'attire:kimono',
      make: () => new THREE.CylinderGeometry(0.24, 0.34, 1.25, 7),
      material: paint.cloth,
      at: [0, 0.545, 0],
      name: 'attire-kimono',
    })
    // Crossed front, left over right, and the obi that holds it shut.
    for (const side of [-1, 1]) {
      body({
        key: 'attire:lapel-cross',
        make: () => new THREE.PlaneGeometry(0.12, 0.34),
        material: paint.dark,
        at: [side * 0.06, 1.22, 0.183],
        turn: [0, 0, side * 0.36],
      })
    }
    body({
      key: 'attire:obi',
      make: () => new THREE.CylinderGeometry(0.26, 0.26, 0.16, 8),
      material: paint.accent,
      at: [0, 1.0, 0],
      name: 'attire-obi',
    })
  },

  'kakin-robe': buildKakinRobe,
}
