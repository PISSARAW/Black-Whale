import type { BufferGeometry, Group, Material, Object3D } from 'three'
import type { Attire, Signature } from './humanProfiles'

type Three = typeof import('three')
type Geometry = (THREE: Three, key: string, make: () => BufferGeometry) => BufferGeometry

/**
 * Annexe B — the pieces that finish a recognition the silhouette started.
 *
 * §2.2 puts these last on purpose: at a distance the gabarit, the hair and the
 * palette have already done the work, and a diadem or a pair of round glasses
 * is what closes it at conversational range. Which is also why the list is
 * closed. A signature that anybody could add is a signature that means nothing
 * — the whole value of "Camilla is the one with the tiara" is that nobody else
 * aboard may wear one.
 *
 * Twenty-one pieces and two garments, all procedural, all through the shared
 * geometry cache, none of them a texture: Chrollo's cross and Hisoka's star are
 * flat meshes exactly as the eyes have always been (§3).
 *
 * Kept out of `humanCostume.ts` — ADR-005 §4-P3 — because that file is at four
 * hundred and sixty-eight lines and holds two complete costumes; twenty-one
 * more pieces would put it past the five hundred ADR-002 allows, and would mix
 * "what this person wears" with "what this person is".
 */
export interface HumanSignatureBuild {
  THREE: Three
  geometry: Geometry
  /** Where a piece can hang: the head, the trunk, and the right hand. */
  parts: { figure: Group; head: Group; arms: readonly Object3D[]; rightHand: Object3D }
  materials: { ink: Material; skin: Material; accent: Material; cloth: Material; dark: Material }
  worn: { signatures: readonly Signature[]; attire: Attire }
}

/** A piece placed on one of the three mounts, in that mount's own space. */
interface Placed {
  key: string
  make: () => BufferGeometry
  material: Material
  at: [number, number, number]
  turn?: [number, number, number]
  scale?: [number, number, number]
  name?: string
}

interface Hang {
  THREE: Three
  head: (shape: Placed) => void
  body: (shape: Placed) => void
  arms: (shape: Placed) => void
  hand: (shape: Placed) => void
  paint: { ink: Material; skin: Material; accent: Material; cloth: Material; dark: Material }
}

type Piece = (hang: Hang) => void

const PIECES: Record<Signature, Piece> = {
  'glasses-round': ({ THREE, head, paint }) => {
    for (const side of [-1, 1]) {
      head({
        key: 'sig:lens-round',
        make: () => new THREE.TorusGeometry(0.042, 0.008, 4, 10),
        material: paint.ink,
        at: [side * 0.062, 0.018, 0.188],
      })
    }
    head({
      key: 'sig:bridge',
      make: () => new THREE.BoxGeometry(0.045, 0.008, 0.008),
      material: paint.ink,
      at: [0, 0.018, 0.19],
    })
  },

  'glasses-thin': ({ THREE, head, paint }) => {
    for (const side of [-1, 1]) {
      head({
        key: 'sig:lens-thin',
        make: () => new THREE.PlaneGeometry(0.07, 0.026),
        material: paint.ink,
        at: [side * 0.064, 0.02, 0.187],
      })
      head({
        key: 'sig:temple',
        make: () => new THREE.BoxGeometry(0.008, 0.006, 0.13),
        material: paint.ink,
        at: [side * 0.14, 0.02, 0.12],
      })
    }
  },

  tiara: ({ THREE, head, paint }) => {
    head({
      key: 'sig:tiara-arc',
      make: () => new THREE.TorusGeometry(0.15, 0.014, 4, 12, Math.PI),
      material: paint.accent,
      at: [0, 0.13, 0.02],
      turn: [0.35, 0, 0],
      name: 'signature-tiara',
    })
    for (const side of [-1, 0, 1]) {
      head({
        key: 'sig:tiara-point',
        make: () => new THREE.ConeGeometry(0.02, 0.06, 4),
        material: paint.accent,
        at: [side * 0.075, 0.19 - Math.abs(side) * 0.02, 0.06],
      })
    }
  },

  crown: ({ THREE, head, paint }) => {
    head({
      key: 'sig:crown-band',
      make: () => new THREE.CylinderGeometry(0.185, 0.185, 0.09, 10, 1, true),
      material: paint.accent,
      at: [0, 0.16, 0],
      name: 'signature-crown',
    })
    for (let i = 0; i < 6; i++) {
      const turn = (i / 6) * Math.PI * 2
      head({
        key: 'sig:crown-point',
        make: () => new THREE.ConeGeometry(0.028, 0.075, 4),
        material: paint.accent,
        at: [Math.cos(turn) * 0.16, 0.235, Math.sin(turn) * 0.16],
      })
    }
  },

  'beard-full': ({ THREE, head, paint }) => {
    head({
      key: 'sig:beard',
      make: () => new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      material: paint.ink,
      at: [0, -0.06, 0.03],
      scale: [1.05, 1.5, 1.05],
      name: 'signature-beard',
    })
  },

  moustache: ({ THREE, head, paint }) => {
    for (const side of [-1, 1]) {
      head({
        key: 'sig:moustache',
        make: () => new THREE.TorusGeometry(0.035, 0.011, 4, 8, Math.PI / 2),
        material: paint.ink,
        at: [side * 0.03, -0.05, 0.175],
        turn: [0, 0, side < 0 ? Math.PI / 2 : 0],
      })
    }
  },

  'mutton-chops': ({ THREE, head, paint }) => {
    for (const side of [-1, 1]) {
      head({
        key: 'sig:chop',
        make: () => new THREE.BoxGeometry(0.045, 0.16, 0.13),
        material: paint.ink,
        at: [side * 0.155, -0.06, 0.05],
        turn: [0, 0, side * 0.12],
      })
    }
  },

  goatee: ({ THREE, head, paint }) => {
    head({
      key: 'sig:goatee',
      make: () => new THREE.ConeGeometry(0.038, 0.09, 5),
      material: paint.ink,
      at: [0, -0.16, 0.13],
      turn: [Math.PI + 0.4, 0, 0],
    })
  },

  // Flat meshes, exactly as the eyes are. ADR-005 §3: no textures, ever.
  'forehead-cross': ({ THREE, head, paint }) => {
    head({
      key: 'sig:cross-stem',
      make: () => new THREE.PlaneGeometry(0.016, 0.075),
      material: paint.ink,
      at: [0, 0.1, 0.183],
      name: 'signature-forehead-cross',
    })
    head({
      key: 'sig:cross-arm',
      make: () => new THREE.PlaneGeometry(0.05, 0.014),
      material: paint.ink,
      at: [0, 0.085, 0.184],
    })
  },

  'face-paint-star-tear': ({ THREE, head, paint }) => {
    head({
      key: 'sig:star',
      make: () => new THREE.CircleGeometry(0.03, 5),
      material: paint.accent,
      at: [-0.075, -0.02, 0.176],
      name: 'signature-star',
    })
    head({
      key: 'sig:tear',
      make: () => new THREE.CircleGeometry(0.026, 3),
      material: paint.accent,
      at: [0.075, -0.03, 0.176],
      turn: [0, 0, Math.PI],
      name: 'signature-tear',
    })
  },

  earrings: ({ THREE, head, paint }) => {
    for (const side of [-1, 1]) {
      head({
        key: 'sig:earring',
        make: () => new THREE.SphereGeometry(0.018, 5, 4),
        material: paint.accent,
        at: [side * 0.19, -0.055, 0],
      })
    }
  },

  /**
   * The chain, at the right hand, and only while he is casting.
   *
   * Built here and left hidden: materialising it is what a cast does, so the
   * geometry has to exist on the rig for the scene to be able to show it, and
   * showing it by default would put a conjured chain in the hand of a man
   * standing in a corridor doing nothing.
   */
  'chain-right-hand': ({ THREE, hand, paint }) => {
    for (let i = 0; i < 5; i++) {
      hand({
        key: 'sig:chain-link',
        make: () => new THREE.TorusGeometry(0.022, 0.006, 4, 8),
        material: paint.accent,
        at: [0, -0.05 - i * 0.042, 0],
        turn: [0, i % 2 === 0 ? 0 : Math.PI / 2, 0],
        name: `signature-chain-${i}`,
      })
    }
  },

  'fur-collar': ({ THREE, body, paint }) => {
    body({
      key: 'sig:fur',
      make: () => new THREE.TorusGeometry(0.19, 0.065, 5, 12),
      material: paint.ink,
      at: [0, 1.44, 0],
      turn: [Math.PI / 2, 0, 0],
      name: 'signature-fur-collar',
    })
  },

  katana: ({ THREE, body, paint }) => {
    body({
      key: 'sig:scabbard',
      make: () => new THREE.CylinderGeometry(0.022, 0.016, 0.86, 6),
      material: paint.dark,
      at: [-0.24, 0.86, -0.06],
      turn: [0.2, 0, -0.28],
      name: 'signature-katana',
    })
    body({
      key: 'sig:tsuba',
      make: () => new THREE.CylinderGeometry(0.05, 0.05, 0.012, 8),
      material: paint.accent,
      at: [-0.17, 1.24, -0.02],
      turn: [1.37, 0, -0.28],
    })
  },

  umbrella: ({ THREE, hand, paint }) => {
    hand({
      key: 'sig:umbrella-cane',
      make: () => new THREE.CylinderGeometry(0.012, 0.012, 0.62, 5),
      material: paint.dark,
      at: [0, -0.32, 0.02],
      name: 'signature-umbrella',
    })
    hand({
      key: 'sig:umbrella-dome',
      make: () => new THREE.ConeGeometry(0.075, 0.2, 8),
      material: paint.cloth,
      at: [0, -0.05, 0.02],
    })
  },

  fan: ({ THREE, hand, paint }) => {
    hand({
      key: 'sig:fan',
      make: () => new THREE.CircleGeometry(0.12, 8, Math.PI, Math.PI * 0.7),
      material: paint.accent,
      at: [0, -0.06, 0.04],
      turn: [0, 0.5, 0.4],
      name: 'signature-fan',
    })
  },

  flute: ({ THREE, body, paint }) => {
    body({
      key: 'sig:flute',
      make: () => new THREE.CylinderGeometry(0.014, 0.014, 0.3, 6),
      material: paint.dark,
      at: [0.19, 0.84, 0.1],
      turn: [0, 0, 1.35],
      name: 'signature-flute',
    })
  },

  /** Rings down the limbs and the trunk: the whole of what Bonolenov shows. */
  'bandages-full': ({ THREE, body, paint }) => {
    for (let i = 0; i < 7; i++) {
      body({
        key: 'sig:bandage',
        make: () => new THREE.TorusGeometry(0.2, 0.016, 4, 10),
        material: paint.skin,
        at: [0, 0.86 + i * 0.1, 0],
        turn: [Math.PI / 2, 0, i * 0.12],
        name: i === 0 ? 'signature-bandages' : undefined,
      })
    }
  },

  stitches: ({ THREE, head, paint }) => {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        head({
          key: 'sig:stitch',
          make: () => new THREE.PlaneGeometry(0.008, 0.026),
          material: paint.ink,
          at: [side * (0.075 + i * 0.022), -0.085, 0.177],
          turn: [0, 0, side * 0.35],
          name: i === 0 && side < 0 ? 'signature-stitches' : undefined,
        })
      }
    }
  },

  'lips-full': ({ THREE, head, paint }) => {
    head({
      key: 'sig:lips',
      make: () => new THREE.SphereGeometry(0.055, 7, 5),
      material: paint.skin,
      at: [0, -0.088, 0.163],
      scale: [1.25, 0.85, 0.55],
      name: 'signature-lips',
    })
  },

  frills: ({ THREE, body, paint }) => {
    for (let i = 0; i < 4; i++) {
      body({
        key: 'sig:frill',
        make: () => new THREE.TorusGeometry(0.24 + i * 0.03, 0.035, 4, 14),
        material: paint.accent,
        at: [0, 1.34 - i * 0.19, 0],
        turn: [Math.PI / 2, 0, 0],
        name: i === 0 ? 'signature-frills' : undefined,
      })
    }
  },

  'tattooed-arms': ({ THREE, arms, paint }) => {
    for (let band = 0; band < 4; band++) {
      arms({
        key: 'sig:arm-tattoo-band',
        make: () => new THREE.TorusGeometry(0.066, 0.008, 4, 12),
        material: paint.ink,
        at: [0, -0.07 - band * 0.04, 0],
        turn: [Math.PI / 2, 0, 0],
        name: band === 0 ? 'signature-tattooed-arms' : undefined,
      })
    }
  },
}

/**
 * The two garments no role aboard could produce.
 *
 * `wardrobe.ts` maps a catalogue role to one of six costumes, and none of the
 * six is a Chinese tunic or a kimono — so Zhang Lei came out in a western suit
 * and Nobunaga in combat fatigues, silently, which is what §2.5's priority
 * exists to stop. They are drawn here rather than in `humanCostume.ts` for the
 * same reason the pieces are: that file is full.
 */
const GARMENTS: Partial<Record<Attire, Piece>> = {
  changshan: ({ THREE, body, paint }) => {
    body({
      key: 'attire:changshan',
      make: () => new THREE.CylinderGeometry(0.23, 0.28, 0.92, 8),
      material: paint.cloth,
      at: [0, 0.72, 0],
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
      make: () => new THREE.CylinderGeometry(0.24, 0.34, 0.98, 7),
      material: paint.cloth,
      at: [0, 0.68, 0],
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
}

export function addHumanSignatures({
  THREE,
  geometry,
  parts,
  materials,
  worn,
}: HumanSignatureBuild): void {
  const mount =
    (target: Object3D) =>
    ({ key, make, material, at, turn, scale, name }: Placed) => {
      const mesh = new THREE.Mesh(geometry(THREE, key, make), material)
      mesh.position.set(...at)
      if (turn) mesh.rotation.set(...turn)
      if (scale) mesh.scale.set(...scale)
      if (name) mesh.name = name
      // The one piece that is conjured rather than worn. It exists on the rig
      // so a cast has something to reveal, and it is off until one happens:
      // a chain in the hand of a man standing in a corridor doing nothing
      // would be the walk asserting a technique nobody used.
      if (name?.startsWith('signature-chain')) mesh.visible = false
      target.add(mesh)
    }

  const hang: Hang = {
    THREE,
    head: mount(parts.head),
    body: mount(parts.figure),
    arms: (shape) => parts.arms.forEach((arm) => mount(arm)(shape)),
    hand: mount(parts.rightHand),
    paint: materials,
  }

  GARMENTS[worn.attire]?.(hang)
  for (const piece of worn.signatures) PIECES[piece](hang)
}
