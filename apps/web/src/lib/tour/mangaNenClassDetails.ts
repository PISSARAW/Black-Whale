import type { BufferGeometry, Group, Object3D } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanHeadBuild } from './humanHead'
import { kurapikaLock } from './kurapikaGeometry'
import { mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addMangaDress } from './mangaRobes'

export function addNenClassMaidRobe(build: HumanClothesBuild) {
  const { THREE, geometry, figure, frame, materials } = build
  addMangaDress(build, 0.16)
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:nen-class-maid-collar',
      () => new THREE.CylinderGeometry(0.089, 0.103, 0.075, 24, 1, true),
    ),
    materials.shirt,
  )
  collar.name = 'nen-class-maid-collar'
  collar.position.y = 1.475 * frame.neck
  figure.add(collar)
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `nen-class-maid-lapel-${side}`,
      points: [
        [side * 0.05, 1.472],
        [side * 0.119, 1.439],
        [side * 0.055, 1.338],
        [0, 1.298],
      ],
      material: materials.shirt,
      lift: 0.013,
    })
}

type DetailGeometry = (THREE: HumanHeadBuild['THREE']) => BufferGeometry

function detail(
  build: HumanHeadBuild,
  parent: Object3D,
  options: {
    name: string
    make: DetailGeometry
    color: number
  },
): void {
  const { THREE, geometry, glow } = build
  const mesh = new THREE.Mesh(
    geometry(THREE, `manga:${options.name}`, () => options.make(THREE)),
    glow(options.color, 1),
  )
  mesh.name = options.name
  parent.add(mesh)
}

function yuri(build: HumanHeadBuild, head: Group) {
  detail(build, head, {
    name: 'yuri-hair-clips',
    color: 0xe0d5be,
    make: (THREE) =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.SphereGeometry(1, 12, 8)
            .scale(0.019, 0.012, 0.007)
            .rotateZ(side * -0.26)
            .translate(side * 0.117, 0.122, 0.139),
        ),
      ),
  })
}

function shedule(build: HumanHeadBuild, head: Group) {
  detail(build, head, {
    name: 'shedule-freckles',
    color: 0x8d5e4c,
    make: (THREE) =>
      mergeHumanDetails(
        [-1, 1].flatMap((side) =>
          [0.037, 0.056, 0.074, 0.092, 0.112].map((x, i) =>
            new THREE.CircleGeometry(i % 2 ? 0.002 : 0.0027, 8).translate(
              x * side,
              -0.023 - (i % 3) * 0.006,
              0.175 - Math.max(0, x - 0.07) * 0.52,
            ),
          ),
        ),
      ),
  })
}

function belerainte(build: HumanHeadBuild, head: Group) {
  detail(build, head, {
    name: 'belerainte-low-beard',
    color: 0x30251f,
    make: (THREE) =>
      mergeHumanDetails(
        Array.from({ length: 11 }, (_, i) => {
          const x = (i - 5) * 0.01
          return kurapikaLock(THREE, {
            width: 0.014,
            depth: 0.008,
            points: [
              [x, -0.199, 0.119],
              [x * 0.95, -0.218, 0.112],
              [x * 0.82, -0.241, 0.097],
              [x * 0.6, -0.251 + Math.abs(x) * 0.24, 0.082],
            ],
          })
        }),
      ),
  })
  for (const side of ['left', 'right']) {
    const eye = head.getObjectByName(`face-eye-${side}`)!
    detail(build, eye, {
      name: `belerainte-lashes-${side}`,
      color: 0x292321,
      make: (THREE) =>
        mergeHumanDetails(
          [0.019, 0.026, 0.032].map((x, i) =>
            new THREE.PlaneGeometry(0.002, 0.012 - i * 0.001)
              .rotateZ((side === 'left' ? 1 : -1) * 0.57)
              .translate(side === 'left' ? -x : x, 0.024 - i * 0.004, 0.004),
          ),
        ),
    })
  }
}

function fullLips(build: HumanHeadBuild, head: Group) {
  const { likeness, skin } = build.profile
  const colour = new build.THREE.Color(skin).multiplyScalar(0.72).getHex()
  detail(build, head.getObjectByName('face-mouth')!, {
    name: `${likeness}-full-lips`,
    color: colour,
    make: (THREE) =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.SphereGeometry(1, 14, 8)
            .scale(0.045, 0.006, 0.004)
            .translate(0, side * 0.008, 0),
        ),
      ),
  })
}

function darkSides(build: HumanHeadBuild, head: Group) {
  const { likeness } = build.profile
  detail(build, head, {
    name: `${likeness}-dark-hair-sides`,
    color: 0x2e2726,
    make: (THREE) =>
      new THREE.LatheGeometry(
        [
          [0.147, 0.045],
          [0.163, 0.093],
          [0.149, 0.163],
          [0.107, 0.202],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        28,
        0.87,
        Math.PI * 2 - 1.74,
      ).scale(likeness === 'tenftory' ? 1.19 : 1.01, 1, 0.94),
  })
}

function tenftory(build: HumanHeadBuild, head: Group) {
  darkSides(build, head)
  fullLips(build, head)
  detail(build, head, {
    name: 'tenftory-jaw-beard',
    color: 0x38302c,
    make: (THREE) =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          kurapikaLock(THREE, {
            width: 0.011,
            depth: 0.008,
            points: [
              [side * 0.179, -0.041, 0.058],
              [side * 0.148, -0.133, 0.079],
              [side * 0.103, -0.185, 0.083],
              [0, -0.199, 0.081],
            ],
          }),
        ),
      ),
  })
}

function danjin(build: HumanHeadBuild, head: Group) {
  fullLips(build, head)
  detail(build, head, {
    name: 'danjin-curved-mutton-chops',
    color: 0x211e23,
    make: (THREE) =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          kurapikaLock(THREE, {
            width: 0.031,
            depth: 0.014,
            points: [
              [side * 0.171, 0.008, 0.044],
              [side * 0.14, -0.097, 0.108],
              [side * 0.101, -0.156, 0.148],
              [side * 0.053, -0.134, 0.166],
            ],
          }),
        ),
      ),
  })
}

function satobi(build: HumanHeadBuild, head: Group) {
  detail(build, head, {
    name: 'satobi-expression-lines',
    color: 0x94664e,
    make: (THREE) =>
      mergeHumanDetails(
        [-1, 1].flatMap((side) => [
          new THREE.PlaneGeometry(0.053, 0.0023)
            .rotateZ(side * 0.16)
            .translate(side * 0.047, 0.108, 0.173),
          new THREE.PlaneGeometry(0.0028, 0.049)
            .rotateZ(side * 0.24)
            .translate(side * 0.085, -0.082, 0.172),
        ]),
      ),
  })
}

export const NEN_CLASS_FACE_DETAILS: Record<string, (build: HumanHeadBuild, head: Group) => void> =
  {
    belerainte,
    danjin,
    satobi,
    shedule,
    slakka: darkSides,
    tenftory,
    yuri,
  }
