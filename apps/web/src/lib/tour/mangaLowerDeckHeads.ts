import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

type HeadDetail = (build: HumanHeadBuild, head: Group) => void
type FacePoint = readonly [number, number]

const HEADWEAR = {
  helmet: {
    width: 0.208,
    height: 0.159,
    depth: 0.207,
    tilt: 0,
    crownY: 0.105,
    brimWidth: 0.208,
    brimDepth: 1.04,
    brimY: 0.105,
    brimZ: 0.004,
    coversHair: true,
  },
  'peaked-cap': {
    width: 0.199,
    height: 0.068,
    depth: 0.183,
    tilt: 0,
    crownY: 0.179,
    brimWidth: 0.182,
    brimDepth: 1.19,
    brimY: 0.17,
    brimZ: 0.025,
    coversHair: true,
  },
  beret: {
    width: 0.199,
    height: 0.088,
    depth: 0.183,
    tilt: 0.1,
    crownY: 0.179,
    brimWidth: 0.182,
    brimDepth: 0.98,
    brimY: 0.17,
    brimZ: 0.004,
    coversHair: false,
  },
}

function militaryCap(build: HumanHeadBuild, head: Group, kind: keyof typeof HEADWEAR) {
  const { THREE, geometry, glow, profile } = build
  const shape = HEADWEAR[kind]
  const hair = head.getObjectByName('manga-layered-hair')
  if (hair && shape.coversHair) hair.visible = false
  const crown = new THREE.Mesh(
    geometry(THREE, `manga:lower-deck-${kind}`, () =>
      new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
        .scale(shape.width, shape.height, shape.depth)
        .rotateZ(shape.tilt),
    ),
    glow(shape.coversHair ? 0x353436 : profile.shirt, 1),
  )
  crown.name = `${profile.likeness}-${kind}`
  crown.position.set(0, shape.crownY, -0.009)
  const brim = new THREE.Mesh(
    geometry(THREE, `manga:lower-deck-${kind}-brim`, () =>
      new THREE.CylinderGeometry(shape.brimWidth, 0.173, 0.02, 32).scale(1, 1, shape.brimDepth),
    ),
    glow(shape.coversHair ? 0x242427 : profile.accent, 1),
  )
  brim.position.set(0, shape.brimY, shape.brimZ)
  head.add(crown, brim)
}

function foreheadBand(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow, profile } = build
  const band = new THREE.Mesh(
    geometry(THREE, 'manga:orarge-forehead-band', () =>
      new THREE.LatheGeometry(
        [
          [0.17, 0.1],
          [0.181, 0.117],
          [0.17, 0.158],
          [0.156, 0.168],
        ].map(([radius, y]) => new THREE.Vector2(radius, y)),
        32,
      ).scale(1, 1, 0.95),
    ),
    glow(profile.shirt, 1),
  )
  band.name = 'orarge-forehead-band'
  head.add(band)
}

function croppedCrest(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  const crest = new THREE.Mesh(
    geometry(THREE, 'manga:vic-cropped-crest', () =>
      new THREE.SphereGeometry(1, 16, 12)
        .scale(0.025, 0.048, 0.098)
        .rotateX(-0.24)
        .translate(0, 0.214, 0.007),
    ),
    materials.hairInk,
  )
  crest.name = 'vic-cropped-crest'
  head.add(crest)
}

function faceSurface(build: HumanHeadBuild, head: Group) {
  const { THREE } = build
  const skin = head.getObjectByName('manga-face')!.children[1] as Mesh
  head.updateMatrixWorld(true)
  const ray = new THREE.Raycaster()
  return ([x, y]: FacePoint) => {
    const origin = skin.localToWorld(new THREE.Vector3(x, y, 1))
    const target = skin.localToWorld(new THREE.Vector3(x, y, 0))
    ray.set(origin, target.sub(origin).normalize())
    const hit = ray.intersectObject(skin)[0]
    const z = hit ? skin.worldToLocal(hit.point).z : 0.164
    return new THREE.Vector3(x, y, z + 0.0026)
  }
}

function addFaceLines(
  build: HumanHeadBuild,
  head: Group,
  options: { suffix: string; colour: number; strokes: FacePoint[][]; radius: number },
) {
  const { THREE, geometry, glow, profile } = build
  const name = `${profile.likeness}-${options.suffix}`
  const marker = new THREE.Mesh(
    geometry(THREE, `manga:${name}`, () => {
      const onFace = faceSurface(build, head)
      return mergeHumanDetails(
        options.strokes.map(
          (points) =>
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(points.map(onFace)),
              10,
              options.radius,
              5,
              false,
            ),
        ),
      )
    }),
    glow(options.colour, 1),
  )
  marker.name = name
  head.add(marker)
}

function addDottedFace(
  build: HumanHeadBuild,
  head: Group,
  {
    name,
    points,
    colour,
    radius,
  }: { name: string; points: FacePoint[]; colour: number; radius: number },
) {
  const { THREE, geometry, glow } = build
  const spots = new THREE.Mesh(
    geometry(THREE, `manga:${name}`, () => {
      const onFace = faceSurface(build, head)
      return mergeHumanDetails(
        points.map((point, index) => {
          const at = onFace(point)
          const size = radius * (1 - (index % 3) * 0.12)
          return new THREE.SphereGeometry(size, 8, 6).scale(1, 1, 0.45).translate(at.x, at.y, at.z)
        }),
      )
    }),
    glow(colour, 1),
  )
  spots.name = name
  head.add(spots)
}

function gateaumeWrinkles(build: HumanHeadBuild, head: Group) {
  addFaceLines(build, head, {
    suffix: 'wrinkles',
    colour: 0x785d4f,
    radius: 0.0018,
    strokes: [
      [
        [-0.093, 0.117],
        [-0.025, 0.135],
        [0.037, 0.133],
        [0.099, 0.113],
      ],
      [
        [-0.097, 0.094],
        [-0.038, 0.11],
        [0.037, 0.112],
        [0.089, 0.093],
      ],
      ...[-1, 1].flatMap((side): FacePoint[][] => [
        [
          [side * 0.035, -0.022],
          [side * 0.069, -0.033],
          [side * 0.097, -0.026],
        ],
        [
          [side * 0.03, -0.066],
          [side * 0.062, -0.094],
          [side * 0.071, -0.131],
        ],
      ]),
    ],
  })
}

function gipperHairline(build: HumanHeadBuild, head: Group) {
  addFaceLines(build, head, {
    suffix: 'shaved-hairline',
    colour: 0x685245,
    radius: 0.009,
    strokes: [
      [
        [-0.132, 0.126],
        [-0.096, 0.175],
        [-0.058, 0.15],
        [0, 0.123],
        [0.051, 0.154],
        [0.103, 0.177],
        [0.137, 0.126],
      ],
    ],
  })
}

function mishaMark(build: HumanHeadBuild, head: Group) {
  addDottedFace(build, head, {
    name: 'misha-hao-forehead-mark',
    points: [[0.012, 0.085]],
    colour: 0x443329,
    radius: 0.013,
  })
  addFaceLines(build, head, {
    suffix: 'eye-rings',
    colour: 0x81756d,
    radius: 0.0029,
    strokes: [-1, 1].map((side): FacePoint[] => [
      [side * 0.039, -0.015],
      [side * 0.057, -0.036],
      [side * 0.083, -0.032],
      [side * 0.101, -0.011],
    ]),
  })
}

function tsudonkeFreckles(build: HumanHeadBuild, head: Group) {
  addDottedFace(build, head, {
    name: 'tsudonke-freckles',
    colour: 0x785844,
    radius: 0.0032,
    points: [-1, 1].flatMap((side) =>
      Array.from({ length: 8 }, (_, i) => [
        side * (0.045 + (i % 4) * 0.015),
        -0.024 - Math.floor(i / 4) * 0.016 - (i % 3) * 0.003,
      ]),
    ),
  })
}

function tevelaresStubble(build: HumanHeadBuild, head: Group) {
  addDottedFace(build, head, {
    name: 'tevelares-stubble',
    colour: 0x765b4a,
    radius: 0.0022,
    points: [-1, 1].flatMap((side) =>
      Array.from({ length: 19 }, (_, i) => {
        const row = Math.floor(i / 7)
        return [side * (0.025 + (i % 7) * 0.012), -0.166 + row * 0.017 + (i % 7) * 0.0039]
      }),
    ),
  })
}

const LOWER_DECK_HEADS: Partial<Record<string, HeadDetail>> = {
  maizan: (build, head) => militaryCap(build, head, 'helmet'),
  connelly: (build, head) => militaryCap(build, head, 'peaked-cap'),
  otocin: (build, head) => militaryCap(build, head, 'beret'),
  momolly: (build, head) => militaryCap(build, head, 'beret'),
  orarge: foreheadBand,
  vic: croppedCrest,
  gateaume: gateaumeWrinkles,
  gipper: gipperHairline,
  'misha-hao': mishaMark,
  tsudonke: tsudonkeFreckles,
  tevelares: tevelaresStubble,
}

export function addLowerDeckHeadDetails(build: HumanHeadBuild, head: Group) {
  LOWER_DECK_HEADS[build.profile.likeness ?? '']?.(build, head)
}
