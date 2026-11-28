import type { Group, Material } from 'three'
import type { SilentMajorityBuild } from './silentMajorityCostume'
import { place, voluteGeometry, type Kit, type Three } from './silentMajorityParts'

type BackMaterials = Pick<SilentMajorityBuild, 'accent' | 'brass' | 'ink' | 'sash'>
type Point = [x: number, y: number, depth: number]

interface Stroke {
  key: string
  points: readonly Point[]
  material: Material
  thickness: number
}

function drawStroke(kit: Kit, back: Group, { key, points, material, thickness }: Stroke) {
  const { THREE } = kit
  return place(kit, back, {
    key: `silent:back:${key}`,
    make: () => {
      const curve = new THREE.CatmullRomCurve3(
        points.map((point) => new THREE.Vector3(...point)),
        false,
        'catmullrom',
        0.16,
      )
      return new THREE.TubeGeometry(curve, points.length * 6, thickness, 5)
    },
    material,
    at: [0, 0, 0],
  })
}

/** Rear collar, paired crests, piping and tied obi from the opening of ch. 370. */
export function addSilentMajorityBack(build: SilentMajorityBuild): void {
  const { THREE, geometry, figure } = build
  const kit: Kit = { THREE, geometry }
  const back = new THREE.Group()
  back.name = 'silent-costume-back'
  back.rotation.y = Math.PI
  figure.add(back)
  addRearCollar(kit, back, build)
  addShoulderCrests(kit, back, build)
  addPiping(kit, back, build)
  addObiBack(kit, back, build)
}

function addRearCollar(kit: Kit, back: Group, { accent, ink }: BackMaterials): void {
  const { THREE } = kit
  place(kit, back, {
    key: 'silent:back:collar',
    make: () => {
      const collar = new THREE.Shape()
      collar.moveTo(-0.106, 1.471)
      collar.quadraticCurveTo(-0.084, 1.507, -0.069, 1.536)
      collar.quadraticCurveTo(0, 1.563, 0.069, 1.536)
      collar.quadraticCurveTo(0.084, 1.507, 0.106, 1.471)
      collar.quadraticCurveTo(0, 1.5, -0.106, 1.471)
      const geometry = new THREE.ShapeGeometry(collar)
      const vertices = geometry.getAttribute('position')
      for (let index = 0; index < vertices.count; index += 1)
        vertices.setZ(index, 0.147 - Math.abs(vertices.getX(index)) * 0.25)
      return geometry
    },
    material: accent,
    at: [0, 0.015, 0],
  }).name = 'silent-rear-collar'
  drawStroke(kit, back, {
    key: 'collar-edge',
    points: [
      [-0.069, 1.551, 0.132],
      [0, 1.565, 0.15],
      [0.069, 1.551, 0.132],
    ],
    material: ink,
    thickness: 0.0032,
  })
}

function addShoulderCrests(kit: Kit, back: Group, materials: BackMaterials): void {
  const { THREE } = kit
  for (const side of [-1, 1]) {
    const crest = new THREE.Group()
    crest.name = side < 0 ? 'silent-back-crest-left' : 'silent-back-crest-right'
    crest.position.set(side * 0.081, 1.409, 0.202)
    crest.rotation.z = side * -0.18
    crest.scale.x = side
    back.add(crest)
    addCrestMedallion(kit, crest, materials)
    for (const turn of [-1, 1]) {
      place(kit, crest, {
        key: 'silent:back:crest-hook',
        make: () => voluteGeometry(THREE, { radius: 0.023, turns: 0.68, thickness: 0.0038 }),
        material: materials.accent,
        at: [turn * 0.024, turn * 0.02, 0],
        turn: (turn * Math.PI) / 2,
      })
    }
  }
}

function addCrestMedallion(kit: Kit, crest: Group, { accent, brass, ink }: BackMaterials): void {
  const { THREE } = kit
  place(kit, crest, {
    key: 'silent:back:crest-ring',
    make: () => new THREE.RingGeometry(0.01, 0.026, 20),
    material: accent,
    at: [0, 0, 0.003],
  })
  place(kit, crest, {
    key: 'silent:back:crest-eye',
    make: () => new THREE.CircleGeometry(0.008, 12),
    material: ink,
    at: [0, 0, 0.003],
  })
  for (const side of [-1, 1]) {
    place(kit, crest, {
      key: 'silent:back:crest-stud',
      make: () => new THREE.CircleGeometry(0.008, 12),
      material: brass,
      at: [side * 0.016, -side * 0.019, 0.006],
    })
  }
}

function addPiping(kit: Kit, back: Group, { accent, ink }: BackMaterials): void {
  const skirtDepth = (y: number) => 0.207 - (y - 0.49) * 0.074
  place(kit, back, {
    key: 'silent:back:skirt-inset',
    make: () => insetGeometry(kit.THREE, skirtDepth),
    material: ink,
    at: [0, 0, 0],
  })
  drawStroke(kit, back, {
    key: 'upper-center',
    points: [
      [0, 1.478, 0.204],
      [0, 1.395, 0.204],
      [0, 1.345, 0.204],
    ],
    material: accent,
    thickness: 0.0055,
  })
  drawStroke(kit, back, {
    key: 'lower-center',
    points: [1.092, 0.987, 0.792].map((y): Point => [0, y, skirtDepth(y) + 0.004]),
    material: accent,
    thickness: 0.0055,
  })
  for (const side of [-1, 1]) {
    drawStroke(kit, back, {
      key: `upper-branch:${side}`,
      points: [
        [0, 1.348, 0.204],
        [side * 0.022, 1.32, 0.204],
        [side * 0.093, 1.294, 0.202],
      ],
      material: accent,
      thickness: 0.0055,
    })
    drawStroke(kit, back, {
      key: `skirt-branch:${side}`,
      points: [
        [0, 0.792],
        [side * 0.039, 0.744],
        [side * 0.097, 0.674],
        [side * 0.107, 0.502],
      ].map(([x, y]): Point => [x, y, skirtDepth(y) + 0.004]),
      material: accent,
      thickness: 0.0055,
    })
  }
}

function insetGeometry(THREE: Three, depth: (y: number) => number) {
  const inset = new THREE.Shape()
  inset.moveTo(0, 0.792)
  inset.lineTo(0.097, 0.674)
  inset.lineTo(0.107, 0.49)
  inset.lineTo(-0.107, 0.49)
  inset.lineTo(-0.097, 0.674)
  inset.closePath()
  const shape = new THREE.ShapeGeometry(inset)
  const vertices = shape.getAttribute('position')
  for (let index = 0; index < vertices.count; index += 1)
    vertices.setZ(index, depth(vertices.getY(index)))
  return shape
}

function addObiBack(kit: Kit, back: Group, materials: BackMaterials): void {
  const { THREE } = kit
  const { accent, sash, ink } = materials
  addObiEmbroidery(kit, back, materials)
  const knot = new THREE.Group()
  knot.name = 'silent-obi-bow'
  knot.position.set(0, 1.07, 0.222)
  back.add(knot)
  place(kit, knot, {
    key: 'silent:back:bow-wrapped-band',
    make: () => new THREE.CircleGeometry(0.5, 24),
    material: accent,
    at: [0, 0.05, 0.005],
    scale: [0.318, 0.055],
  })
  place(kit, knot, {
    key: 'silent:back:bow-center',
    make: () => new THREE.CircleGeometry(0.5, 16),
    material: sash,
    at: [0, 0.007, 0.013],
    scale: [0.045, 0.057],
  })
  for (const side of [-1, 1]) {
    place(kit, knot, {
      key: 'silent:back:bow-loop',
      make: () => new THREE.RingGeometry(0.29, 0.5, 24),
      material: accent,
      at: [side * 0.055, -0.007, 0.009],
      scale: [0.074, 0.11],
      turn: side * 0.55,
    })
    place(kit, knot, {
      key: 'silent:back:bow-tail',
      make: () => new THREE.PlaneGeometry(0.021, 0.154),
      material: accent,
      at: [side * 0.082, -0.106, -0.003],
      turn: side * 0.26,
    })
    drawStroke(kit, knot, {
      key: `bow-tail-fold:${side}`,
      points: [
        [side * 0.063, -0.035, 0.002],
        [side * 0.08, -0.104, 0.002],
        [side * 0.097, -0.165, 0.002],
      ],
      material: ink,
      thickness: 0.0016,
    })
  }
}

function addObiEmbroidery(kit: Kit, back: Group, { accent }: BackMaterials): void {
  const { THREE } = kit
  for (let index = 0; index < 3; index += 1) {
    const x = 0.072 + index * 0.016
    const y = 1.285 - index * 0.009
    drawStroke(kit, back, {
      key: `obi-arc:${index}`,
      points: [
        [-x, y, 0.216],
        [-x * 0.56, y - 0.025, 0.216],
        [0, y - 0.034, 0.216],
        [x * 0.56, y - 0.025, 0.216],
        [x, y, 0.216],
      ],
      material: accent,
      thickness: 0.0042,
    })
  }
  for (const side of [-1, 1]) {
    place(kit, back, {
      key: 'silent:back:obi-curl',
      make: () => voluteGeometry(THREE, { radius: 0.047, turns: 0.85, thickness: 0.006 }),
      material: accent,
      at: [side * 0.059, 1.186, 0.215],
      scale: [side * 1.15, 0.53],
    })
  }
}
