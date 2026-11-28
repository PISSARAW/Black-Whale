import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape, mangaChestSurface, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaSurfacePanel } from './kurapikaGeometry'
import { addMangaDress } from './mangaRobes'
import { addMangaSuit } from './mangaTailoring'

type Garment = (build: HumanClothesBuild) => void
type Point = readonly [number, number]
type Field = { suffix: string; panels: Point[][]; tone: 'shirt' | 'accent' | 'dark'; lift?: number }

function surfacePattern(build: HumanClothesBuild, { suffix, panels, tone, lift = 0.014 }: Field) {
  const { THREE, geometry, figure, profile, materials, frame } = build
  const name = `${profile.likeness}-${suffix}`
  const mesh = new THREE.Mesh(
    geometry(THREE, `manga:${name}`, () =>
      mergeHumanDetails(
        panels.map((panel) =>
          kurapikaSurfacePanel(THREE, {
            points: panel.map(([x, y]) => [x * profile.shoulders, y * frame.neck, 0]),
            depth: (x, y) => mangaChestSurface(profile, x, y) + lift,
          }).translate(0, -1.12 * frame.neck, 0),
        ),
      ),
    ),
    materials[tone],
  )
  mesh.name = name
  mesh.position.y = 1.12 * frame.neck
  figure.add(mesh)
}

function collar(
  build: HumanClothesBuild,
  {
    suffix,
    height,
    colour,
  }: { suffix: string; height: number; colour: 'cloth' | 'shirt' | 'dark' },
) {
  const { THREE, geometry, materials, profile, frame, figure } = build
  const radius = Math.max(0.056, mangaBodyShape(profile).chest * 0.34)
  const name = `${profile.likeness}-${suffix}`
  const piece = new THREE.Mesh(
    geometry(THREE, `manga:${name}`, () =>
      new THREE.CylinderGeometry(radius, radius * 1.17, height, 28, 1, true).scale(1, 1, 0.88),
    ),
    materials[colour],
  )
  piece.name = name
  piece.position.y = (1.46 + height * 0.24) * frame.neck
  figure.add(piece)
}

function roundNeck(build: HumanClothesBuild) {
  collar(build, { suffix: 'crew-neck', height: 0.034, colour: 'shirt' })
  mangaPanel(build, {
    name: 'crew-neck-opening',
    points: [
      [-0.062, 1.49],
      [0.062, 1.49],
      [0.047, 1.447],
      [0, 1.429],
      [-0.047, 1.447],
    ],
    material: build.materials.skin ?? build.materials.shirt,
    lift: 0.019,
  })
}

function zipper(build: HumanClothesBuild) {
  collar(build, { suffix: 'standing-collar', height: 0.086, colour: 'shirt' })
  mangaPanel(build, {
    name: `${build.profile.likeness}-zipper`,
    points: [
      [-0.006, 0.821],
      [0.006, 0.821],
      [0.005, 1.49],
      [-0.005, 1.49],
    ],
    material: build.materials.accent,
  })
  mangaPanel(build, {
    name: 'zipper-pull',
    points: [
      [-0.012, 1.419],
      [-0.006, 1.452],
      [0.008, 1.452],
      [0.011, 1.421],
    ],
    material: build.materials.dark,
    lift: 0.014,
  })
}

function pointedCollar(build: HumanClothesBuild) {
  surfacePattern(build, {
    suffix: 'pointed-collar',
    tone: 'shirt',
    lift: 0.02,
    panels: [-1, 1].map((side) => [
      [side * 0.052, 1.48],
      [side * 0.102, 1.409],
      [side * 0.049, 1.328],
      [side * 0.01, 1.45],
    ]),
  })
}

function openJacket(build: HumanClothesBuild) {
  const { materials, profile } = build
  mangaPanel(build, {
    name: `${profile.likeness}-open-front`,
    points: [
      [-0.059, 1.48],
      [0, 1.428],
      [0.059, 1.48],
      [0.083, 1.285],
      [0.044, 0.835],
      [-0.044, 0.835],
      [-0.083, 1.285],
    ],
    material: materials.dark,
  })
  surfacePattern(build, {
    suffix: 'open-lapels',
    tone: 'shirt',
    lift: 0.02,
    panels: [-1, 1].map((side) => [
      [side * 0.063, 1.489],
      [side * 0.139, 1.391],
      [side * 0.105, 1.315],
      [side * 0.125, 1.276],
      [side * 0.078, 1.137],
      [side * 0.041, 1.39],
    ]),
  })
}

function hanalPlaid(build: HumanClothesBuild) {
  const panels: Point[][] = []
  for (let column = -6; column <= 6; column++) {
    const x = column * 0.021
    const top = 1.44 - Math.abs(column) * 0.017
    panels.push([
      [x, 0.83],
      [x + 0.003, 0.83],
      [x + 0.003, top],
      [x, top],
    ])
  }
  for (let row = 0; row < 15; row++) {
    const y = 0.84 + row * 0.039
    const width = Math.min(0.152, 0.117 + row * 0.004)
    panels.push([
      [-width, y],
      [width, y],
      [width, y + 0.003],
      [-width, y + 0.003],
    ])
  }
  surfacePattern(build, { suffix: 'plaid-shirt', tone: 'shirt', panels })
  pointedCollar(build)
}

function connellySuit(build: HumanClothesBuild) {
  addMangaSuit(build)
  surfacePattern(build, {
    suffix: 'pinstriped-jacket',
    tone: 'accent',
    lift: 0.015,
    panels: [-1, 1].flatMap((side) =>
      Array.from({ length: 5 }, (_, stripe): Point[] => {
        const x = 0.041 + stripe * 0.025
        const top = Math.min(1.32, 1.005 + stripe * 0.081)
        return [
          [side * x, 0.827],
          [side * (x + 0.0025), 0.827],
          [side * (x + 0.0025), top],
          [side * x, top],
        ]
      }),
    ),
  })
  surfacePattern(build, {
    suffix: 'patterned-tie',
    tone: 'shirt',
    lift: 0.023,
    panels: Array.from({ length: 5 }, (_, i) => {
      const y = 1.25 + i * 0.027
      return [
        [-0.007, y],
        [0, y + 0.006],
        [0.007, y],
        [0, y - 0.006],
      ]
    }),
  })
}

function orargeVest(build: HumanClothesBuild) {
  surfacePattern(build, {
    suffix: 'vest-front',
    tone: 'shirt',
    lift: 0.016,
    panels: [-1, 1].map((side) => [
      [side * 0.073, 1.44],
      [side * 0.163, 1.347],
      [side * 0.144, 1.201],
      [side * 0.117, 0.822],
      [side * 0.014, 0.822],
      [side * 0.035, 1.25],
    ]),
  })
  surfacePattern(build, {
    suffix: 'argyle-diamonds',
    tone: 'dark',
    lift: 0.021,
    panels: [-1, 1].flatMap((side) =>
      Array.from({ length: 5 }, (_, i): Point[] => {
        const x = side * (i % 2 ? 0.104 : 0.074)
        const y = 0.93 + i * 0.081
        return [
          [x - 0.027, y],
          [x, y + 0.038],
          [x + 0.027, y],
          [x, y - 0.038],
        ]
      }),
    ),
  })
}

function montblancApron(build: HumanClothesBuild) {
  addMangaDress(build, 0.24)
  const { THREE, materials, geometry, figure, profile } = build
  const { waist } = mangaBodyShape(profile)
  const front = new THREE.Mesh(
    geometry(THREE, 'manga:montblanc-toto-apron-skirt', () =>
      new THREE.LatheGeometry(
        [
          [waist * 1.9, 0.25],
          [waist * 1.65, 0.56],
          [waist * 1.14, 0.98],
        ].map(([radius, height]) => new THREE.Vector2(radius, height)),
        20,
        -0.92,
        1.84,
      ).scale(1, 1, 1.11),
    ),
    materials.shirt,
  )
  front.name = 'montblanc-toto-apron-skirt'
  figure.add(front)
  mangaPanel(build, {
    name: 'montblanc-toto-apron-bib',
    points: [
      [-0.103, 1.388],
      [0.103, 1.388],
      [0.098, 1.19],
      [0.108, 0.93],
      [-0.108, 0.93],
      [-0.098, 1.19],
    ],
    material: materials.shirt,
    lift: 0.019,
  })
}

function souffleDress(build: HumanClothesBuild) {
  addMangaDress(build, 0.36)
  pointedCollar(build)
  surfacePattern(build, {
    suffix: 'vest-border',
    tone: 'accent',
    panels: [-1, 1].map((side) => [
      [side * 0.065, 1.426],
      [side * 0.078, 1.402],
      [side * 0.024, 1.193],
      [side * 0.008, 1.173],
    ]),
  })
}

function notreDrape(build: HumanClothesBuild) {
  surfacePattern(build, {
    suffix: 'draped-cowl',
    tone: 'shirt',
    panels: [
      [
        [-0.083, 1.473],
        [0.09, 1.475],
        [0.125, 1.363],
        [0.075, 1.262],
        [0.013, 1.236],
        [-0.082, 1.296],
        [-0.128, 1.397],
      ],
    ],
  })
  surfacePattern(build, {
    suffix: 'cowl-folds',
    tone: 'accent',
    lift: 0.019,
    panels: Array.from({ length: 3 }, (_, i) => {
      const y = 1.29 + i * 0.041
      return [
        [-0.076, y + 0.047],
        [0.021, y],
        [0.084, y + 0.032],
        [0.019, y + 0.009],
      ]
    }),
  })
  collar(build, { suffix: 'cowl-neck', height: 0.09, colour: 'shirt' })
}

function militaryJacket(build: HumanClothesBuild) {
  zipper(build)
  surfacePattern(build, {
    suffix: 'uniform-seams',
    tone: 'accent',
    panels: [-1, 1].flatMap((side): Point[][] => [
      [
        [side * 0.052, 1.46],
        [side * 0.177, 1.375],
        [side * 0.165, 1.36],
        [side * 0.05, 1.435],
      ],
      [
        [side * 0.049, 1.216],
        [side * 0.144, 1.233],
        [side * 0.14, 1.211],
        [side * 0.049, 1.198],
      ],
    ]),
  })
}

function tsudonkeVNeck(build: HumanClothesBuild) {
  surfacePattern(build, {
    suffix: 'v-neck-and-yoke',
    tone: 'dark',
    panels: [
      [
        [-0.078, 1.48],
        [0.078, 1.48],
        [0.081, 1.377],
        [0, 1.143],
        [-0.081, 1.377],
      ],
      ...[-1, 1].map((side): Point[] => [
        [side * 0.087, 1.46],
        [side * 0.16, 1.418],
        [side * 0.184, 1.346],
        [side * 0.121, 1.358],
      ]),
    ],
  })
  surfacePattern(build, {
    suffix: 'v-neck-double-trim',
    tone: 'shirt',
    lift: 0.02,
    panels: [1.415, 1.383].map((y) => [
      [-0.066, y],
      [0, y - 0.125],
      [0.066, y],
      [0, y - 0.103],
    ]),
  })
}

function matvereZip(build: HumanClothesBuild) {
  zipper(build)
  surfacePattern(build, {
    suffix: 'jacket-flecks',
    tone: 'accent',
    panels: Array.from({ length: 24 }, (_, i) => {
      const x = (i % 2 ? -1 : 1) * (0.035 + (i % 5) * 0.019)
      const y = 0.88 + Math.floor(i / 4) * 0.082 + (i % 4) * 0.009
      return [
        [x, y],
        [x + 0.007, y + 0.004],
        [x + 0.003, y + 0.011],
      ]
    }),
  })
}

export const LOWER_DECK_CLOTHES: Partial<Record<string, Garment>> = {
  tevelares: openJacket,
  quorolle: openJacket,
  daemon: roundNeck,
  gelato: zipper,
  perigord: pointedCollar,
  bille: roundNeck,
  matvere: matvereZip,
  connelly: connellySuit,
  gateaume: pointedCollar,
  orarge: orargeVest,
  'montblanc-toto': montblancApron,
  'chiffon-toto': pointedCollar,
  sodom: openJacket,
  souffle: souffleDress,
  notre: notreDrape,
  otocin: militaryJacket,
  momolly: militaryJacket,
  gipper: militaryJacket,
  maizan: militaryJacket,
  'misha-hao': (build) =>
    collar(build, { suffix: 'dark-sleeve-neckline', height: 0.053, colour: 'dark' }),
  tsudonke: tsudonkeVNeck,
  'sun-bin': openJacket,
  vic: (build) => collar(build, { suffix: 'dark-jacket-collar', height: 0.073, colour: 'dark' }),
  hanal: hanalPlaid,
  tassi: zipper,
}
