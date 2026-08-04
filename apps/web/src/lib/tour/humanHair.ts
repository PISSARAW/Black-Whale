import type { BufferGeometry, Group, Material, Mesh } from 'three'
import type { HairStyle } from './humanProfiles'

type Three = typeof import('three')
type Geometry = (THREE: Three, key: string, make: () => BufferGeometry) => BufferGeometry
type Outlined = (shape: {
  THREE: Three
  geometry: BufferGeometry
  material: Material
  ink: Material
  scale?: number
}) => Group

/**
 * The hair — ADR-005 §4-P2, and the first thing the reader recognises.
 *
 * It goes before the face and before the costume, because that is the order a
 * Togashi drawing is read in: Kurapika is a blond bob, Nobunaga is a topknot,
 * Biscuit is a pair of ringlets, and every one of those is legible at a
 * distance where the eyes are two dark strokes. §2.2 puts the gabarit first and
 * the hair immediately after, and the phases follow that order rather than the
 * order the pieces were easiest to build in.
 *
 * Eighteen styles, all procedural: cones, lathes, cylinders and torus sections
 * over the shared skull. No asset, no texture, no per-person geometry — every
 * shape here goes through the same `geometry()` cache the rest of the figure
 * uses, so a corridor of eighteen different heads still costs eighteen shared
 * buffers rather than eighteen new ones.
 */
export interface HumanHairBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  /** The head group to hang everything on, and the two inks it is drawn in. */
  head: { group: Group; hairInk: Material; ink: Material }
  style: HairStyle
}

/** What the skull-hugging shell does, per style. */
interface Cap {
  /** Vertical scale: a brush cut is flat, a mane stands off the skull. */
  height: number
  /** How far up the shell sits. */
  y: number
  /** Absent for the two styles that have no cap at all. */
  none?: boolean
}

const CAPS: Record<HairStyle, Cap> = {
  short: { height: 1.08, y: 0.015 },
  military: { height: 0.86, y: 0.035 },
  swept: { height: 1.08, y: 0.015 },
  long: { height: 1.08, y: 0.015 },
  ponytail: { height: 1.08, y: 0.015 },
  spiked: { height: 1.08, y: 0.015 },
  shaved: { height: 1, y: 0, none: true },
  bob: { height: 1.08, y: 0.015 },
  'slicked-back': { height: 0.92, y: 0.03 },
  pompadour: { height: 1.02, y: 0.02 },
  drills: { height: 1.08, y: 0.015 },
  chonmage: { height: 0.9, y: 0.03 },
  hime: { height: 1.1, y: 0.012 },
  curly: { height: 1.2, y: 0.02 },
  afro: { height: 1.34, y: 0.03 },
  wild: { height: 1.16, y: 0.02 },
  // A ring of hair round a bare crown: the cap would be the thing it is not.
  'bald-crown': { height: 1, y: 0, none: true },
  bun: { height: 1.02, y: 0.015 },
}

/** Where a shape goes and how it is turned, so the styles read as one list. */
interface Placed {
  key: string
  make: () => BufferGeometry
  at: [number, number, number]
  turn?: [number, number, number]
  scale?: [number, number, number]
}

type Place = (shape: Placed) => Mesh

/** One style's own additions, over a cap that is already there. */
type Style = (build: { THREE: Three; place: Place }) => void

const STYLES: Partial<Record<HairStyle, Style>> = {
  spiked: ({ THREE, place }) => {
    for (let i = -2; i <= 2; i++) {
      place({
        key: 'hair:spike',
        make: () => new THREE.ConeGeometry(0.045, 0.18, 4),
        at: [i * 0.065, 0.2 + Math.abs(i) * -0.015, -0.01],
        turn: [0, 0, i * -0.13],
      })
    }
  },

  long: ({ THREE, place }) => {
    place({
      key: 'hair:fall',
      make: () => new THREE.CylinderGeometry(0.12, 0.09, 0.48, 6),
      at: [0, -0.16, -0.13],
    })
  },

  ponytail: ({ THREE, place }) => {
    place({
      key: 'hair:fall',
      make: () => new THREE.CylinderGeometry(0.12, 0.09, 0.48, 6),
      at: [0, -0.16, -0.13],
    })
    place({
      key: 'hair:tail',
      make: () => new THREE.ConeGeometry(0.075, 0.42, 6),
      at: [0, -0.18, -0.25],
      turn: [-0.35, 0, 0],
    })
  },

  swept: ({ THREE, place }) => {
    place({
      key: 'hair:fringe',
      make: () => new THREE.ConeGeometry(0.075, 0.3, 4),
      at: [-0.09, 0.08, 0.14],
      turn: [0, 0, -0.55],
    })
  },

  bob: ({ THREE, place }) => {
    for (const side of [-1, 1]) {
      place({
        key: 'hair:bob-side',
        make: () => new THREE.BoxGeometry(0.13, 0.38, 0.18),
        at: [side * 0.145, -0.04, -0.005],
        turn: [0, 0, side * -0.08],
      })
    }
  },

  /**
   * Swept flat to the back of the skull, with two or three strands escaping.
   *
   * The escaping strands are the style rather than a flourish: a perfectly
   * smooth helmet is Illumi, and Tserriednich, Chrollo and Hisoka all wear the
   * same shape with the front broken. Without them the three collapse into one
   * silhouette.
   */
  'slicked-back': ({ THREE, place }) => {
    place({
      key: 'hair:slick',
      make: () => new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, 0, 1),
      at: [0, 0.03, -0.05],
      scale: [0.96, 0.8, 1.12],
    })
    for (const side of [-1, 0.4]) {
      place({
        key: 'hair:strand',
        make: () => new THREE.ConeGeometry(0.022, 0.16, 3),
        at: [side * 0.05, 0.15, 0.15],
        turn: [0.5, 0, side * 0.3],
      })
    }
  },

  pompadour: ({ THREE, place }) => {
    place({
      key: 'hair:pomp',
      make: () => new THREE.SphereGeometry(0.13, 8, 5),
      at: [0, 0.19, 0.07],
      scale: [1.1, 0.9, 0.85],
    })
  },

  /** Two ringlets, each a stack of shrinking spheres: Biscuit's whole read. */
  drills: ({ THREE, place }) => {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        place({
          key: 'hair:ringlet',
          make: () => new THREE.SphereGeometry(0.08, 7, 5),
          at: [side * (0.19 + i * 0.012), -0.02 - i * 0.13, -0.02],
          scale: [1 - i * 0.13, 1 - i * 0.13, 1 - i * 0.13],
        })
      }
    }
  },

  /** The topknot: a shaved pate, a band, and the queue folded forward. */
  chonmage: ({ THREE, place }) => {
    place({
      key: 'hair:knot-band',
      make: () => new THREE.CylinderGeometry(0.05, 0.05, 0.06, 6),
      at: [0, 0.2, -0.06],
    })
    place({
      key: 'hair:knot',
      make: () => new THREE.CylinderGeometry(0.035, 0.045, 0.2, 6),
      at: [0, 0.24, 0.01],
      turn: [-0.9, 0, 0],
    })
  },

  /** Straight fringe, straight fall, blunt side-locks: the hime cut. */
  hime: ({ THREE, place }) => {
    place({
      key: 'hair:fringe-flat',
      make: () => new THREE.BoxGeometry(0.3, 0.09, 0.1),
      at: [0, 0.12, 0.16],
    })
    place({
      key: 'hair:fall',
      make: () => new THREE.CylinderGeometry(0.12, 0.09, 0.48, 6),
      at: [0, -0.16, -0.13],
    })
    for (const side of [-1, 1]) {
      place({
        key: 'hair:sidelock',
        make: () => new THREE.BoxGeometry(0.07, 0.34, 0.1),
        at: [side * 0.17, -0.06, 0.08],
      })
    }
  },

  curly: ({ THREE, place }) => {
    for (let i = 0; i < 7; i++) {
      const turn = (i / 7) * Math.PI * 2
      place({
        key: 'hair:curl',
        make: () => new THREE.SphereGeometry(0.085, 6, 5),
        at: [Math.cos(turn) * 0.16, 0.09 + Math.sin(turn * 2) * 0.04, Math.sin(turn) * 0.15],
      })
    }
  },

  afro: ({ THREE, place }) => {
    place({
      key: 'hair:afro',
      make: () => new THREE.SphereGeometry(0.28, 9, 7),
      at: [0, 0.06, -0.01],
    })
  },

  wild: ({ THREE, place }) => {
    for (let i = 0; i < 9; i++) {
      const turn = (i / 9) * Math.PI * 2
      place({
        key: 'hair:tuft',
        make: () => new THREE.ConeGeometry(0.05, 0.26, 3),
        at: [Math.cos(turn) * 0.15, 0.1, Math.sin(turn) * 0.14],
        turn: [Math.sin(turn) * 0.7, 0, Math.cos(turn) * -0.7],
      })
    }
  },

  /** Bare on top, a band round the sides: Vergei, Balsamilco, Brocco Li. */
  'bald-crown': ({ THREE, place }) => {
    place({
      key: 'hair:crown-ring',
      make: () => new THREE.CylinderGeometry(0.196, 0.2, 0.11, 10, 1, true),
      at: [0, -0.02, 0],
    })
  },

  bun: ({ THREE, place }) => {
    place({
      key: 'hair:bun',
      make: () => new THREE.SphereGeometry(0.095, 7, 6),
      at: [0, 0.12, -0.19],
      scale: [1, 0.9, 0.9],
    })
  },
}

export function addHumanHair({ THREE, geometry, outlined, head, style }: HumanHairBuild): void {
  const { group, hairInk, ink } = head
  const cap = CAPS[style]

  if (!cap.none) {
    const shell = outlined({
      THREE,
      geometry: geometry(
        THREE,
        'hair',
        () => new THREE.SphereGeometry(0.196, 9, 5, 0, Math.PI * 2, 0, 1.18),
      ),
      material: hairInk,
      ink,
      scale: 1.025,
    })
    shell.scale.set(0.94, cap.height, 0.98)
    shell.position.y = cap.y
    group.add(shell)
  }

  const place: Place = ({ key, make, at, turn, scale }) => {
    const mesh = new THREE.Mesh(geometry(THREE, key, make), hairInk)
    mesh.position.set(...at)
    if (turn) mesh.rotation.set(...turn)
    if (scale) mesh.scale.set(...scale)
    group.add(mesh)
    return mesh
  }

  STYLES[style]?.({ THREE, place })
}
