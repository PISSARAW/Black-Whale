import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape, mangaChestSurface, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

function knotGeometry(build: HumanClothesBuild) {
  const { THREE } = build
  const loops = [
    [0, 0.023],
    [0, -0.023],
    [-0.023, 0],
    [0.023, 0],
    [0, 0],
  ]
  return mergeHumanDetails(
    loops.map(([x, y]) => new THREE.TorusGeometry(0.019, 0.0027, 5, 4).translate(x, y, 0)),
  )
}

function addCollar(build: HumanClothesBuild) {
  const { THREE, geometry, figure, frame, materials } = build
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:zhanglei-standing-collar',
      () => new THREE.CylinderGeometry(0.091, 0.106, 0.115, 32),
    ),
    materials.shirt,
  )
  collar.name = 'zhanglei-standing-collar'
  collar.position.y = 1.47 * frame.neck
  figure.add(collar)
  const rim = new THREE.Mesh(
    geometry(
      THREE,
      'manga:zhanglei-dark-collar-band',
      () => new THREE.CylinderGeometry(0.109, 0.15, 0.055, 32),
    ),
    materials.dark,
  )
  rim.name = 'zhanglei-dark-collar-band'
  rim.position.y = 1.41 * frame.neck
  figure.add(rim)
}

function addCoatHem(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, frame, profile } = build
  const { waist, depth, chest } = mangaBodyShape(profile)
  const hem = new THREE.Mesh(
    geometry(THREE, 'manga:zhanglei-short-changshan', () =>
      new THREE.LatheGeometry(
        [
          [0, 0.53],
          [waist * 1.19, 0.53],
          [waist * 1.15, 0.66],
          [waist * 1.04, 0.82],
          [waist, 0.96],
          [0, 0.96],
        ].map(([r, y]) => new THREE.Vector2(r, (y - 0.75) * frame.neck)),
        40,
      ).scale(1, 1, depth / chest),
    ),
    materials.cloth,
  )
  hem.name = 'attire-changshan'
  hem.position.y = 0.75 * frame.neck
  figure.add(hem)
  const trim = new THREE.Mesh(
    geometry(THREE, 'manga:zhanglei-tunic-hem-trim', () =>
      new THREE.TorusGeometry(waist * 1.19, 0.006, 5, 40)
        .rotateX(Math.PI / 2)
        .scale(1, 1, depth / chest),
    ),
    materials.dark,
  )
  trim.name = 'zhanglei-tunic-hem-trim'
  trim.position.y = 0.535 * frame.neck
  figure.add(trim)
}

function addEmbroidery(build: HumanClothesBuild) {
  const { THREE, geometry, figure, frame, materials, profile } = build
  const knot = geometry(THREE, 'manga:zhanglei-knot-embroidery', () => knotGeometry(build))
  for (const [height, size] of [
    [1.19, 1],
    [0.585, 0.85],
  ]) {
    const ornament = new THREE.Mesh(knot, materials.accent)
    ornament.name = 'zhanglei-knot-embroidery'
    ornament.scale.setScalar(size * 1.4)
    const y = height * frame.neck
    ornament.position.set(0, y, mangaChestSurface(profile, 0, y) + 0.039)
    figure.add(ornament)
  }
  const stitches = new THREE.Mesh(
    geometry(THREE, 'manga:zhanglei-collar-stitches', () =>
      mergeHumanDetails(
        Array.from({ length: 19 }, (_, index) => {
          const x = (index - 9) * 0.009
          const y = 1.405 * frame.neck - Math.abs(x) * 0.2
          return new THREE.BoxGeometry(0.0015, 0.025, 0.002).translate(
            x,
            y - 1.12 * frame.neck,
            mangaChestSurface(profile, x, y) + 0.026,
          )
        }),
      ),
    ),
    materials.accent,
  )
  stitches.name = 'zhanglei-collar-embroidery'
  stitches.position.y = 1.12 * frame.neck
  figure.add(stitches)
}

export function addZhangLeiTunic(build: HumanClothesBuild) {
  const { materials } = build
  addCollar(build)
  addCoatHem(build)
  mangaPanel(build, {
    name: 'zhanglei-dark-bib',
    material: materials.dark,
    lift: 0.023,
    points: [
      [-0.14, 1.455],
      [-0.17, 1.32],
      [-0.1, 1.05],
      [0, 0.78],
      [0.1, 1.05],
      [0.17, 1.32],
      [0.14, 1.455],
      [0, 1.365],
    ],
  })
  mangaPanel(build, {
    name: 'zhanglei-lower-bib',
    material: materials.dark,
    lift: 0.035,
    points: [
      [-0.065, 0.54],
      [0, 0.69],
      [0.065, 0.54],
    ],
  })
  addEmbroidery(build)
}
