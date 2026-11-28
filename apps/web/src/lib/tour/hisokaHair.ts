import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaLock, type HairLock } from './kurapikaGeometry'

type Three = HumanHeadBuild['THREE']

// Each lock has a path from root to tip and two editable cross-section radii.
// Chapter 420: the part runs diagonally, with feathered ends and a tapered nape.
const LOCKS: readonly HairLock[] = [
  {
    points: [
      [0.016, 0.212, 0.082],
      [-0.037, 0.178, 0.158],
      [-0.071, 0.096, 0.186],
      [-0.049, 0.017, 0.177],
    ],
    width: 0.027,
    depth: 0.014,
  },
  {
    points: [
      [-0.036, 0.204, 0.08],
      [-0.086, 0.158, 0.16],
      [-0.104, 0.087, 0.17],
      [-0.113, 0.026, 0.15],
    ],
    width: 0.029,
    depth: 0.015,
  },
  {
    points: [
      [0.043, 0.21, 0.079],
      [0.042, 0.174, 0.166],
      [0.015, 0.094, 0.194],
      [-0.016, 0.016, 0.184],
    ],
    width: 0.027,
    depth: 0.015,
  },
  {
    points: [
      [0.058, 0.206, 0.077],
      [0.079, 0.165, 0.162],
      [0.086, 0.102, 0.177],
      [0.062, 0.049, 0.173],
    ],
    width: 0.028,
    depth: 0.015,
  },
  {
    points: [
      [0.08, 0.19, 0.082],
      [0.12, 0.143, 0.145],
      [0.139, 0.077, 0.145],
      [0.142, 0.019, 0.126],
    ],
    width: 0.029,
    depth: 0.015,
  },
  {
    points: [
      [-0.075, 0.189, 0.081],
      [-0.122, 0.141, 0.131],
      [-0.143, 0.055, 0.123],
      [-0.132, 0.003, 0.116],
    ],
    width: 0.027,
    depth: 0.014,
  },
  {
    points: [
      [-0.094, 0.136, 0.084],
      [-0.155, 0.115, 0.047],
      [-0.169, 0.034, 0.017],
      [-0.148, -0.077, -0.007],
    ],
    width: 0.034,
    depth: 0.016,
  },
  {
    points: [
      [0.108, 0.142, 0.069],
      [0.159, 0.112, 0.047],
      [0.172, 0.032, 0.021],
      [0.15, -0.087, -0.006],
    ],
    width: 0.035,
    depth: 0.017,
  },
  {
    points: [
      [-0.105, 0.119, -0.069],
      [-0.125, 0.089, -0.124],
      [-0.114, 0.001, -0.151],
      [-0.09, -0.139, -0.106],
    ],
    width: 0.042,
    depth: 0.017,
  },
  {
    points: [
      [0.081, 0.139, -0.1],
      [0.11, 0.075, -0.136],
      [0.096, -0.017, -0.151],
      [0.065, -0.145, -0.105],
    ],
    width: 0.043,
    depth: 0.017,
  },
  {
    points: [
      [0.019, 0.194, 0.128],
      [-0.025, 0.153, 0.181],
      [-0.038, 0.091, 0.203],
      [-0.035, 0.031, 0.187],
    ],
    width: 0.01,
    depth: 0.006,
  },
  {
    points: [
      [0.078, 0.191, 0.108],
      [0.1, 0.144, 0.173],
      [0.112, 0.088, 0.172],
      [0.115, 0.044, 0.154],
    ],
    width: 0.011,
    depth: 0.006,
  },
  {
    points: [
      [-0.089, 0.177, 0.1],
      [-0.112, 0.143, 0.152],
      [-0.124, 0.085, 0.153],
      [-0.124, 0.026, 0.136],
    ],
    width: 0.009,
    depth: 0.006,
  },
  {
    points: [
      [0.009, 0.202, 0.1],
      [-0.017, 0.147, 0.185],
      [-0.054, 0.086, 0.195],
      [-0.062, 0.038, 0.183],
    ],
    width: 0.019,
    depth: 0.008,
  },
  {
    points: [
      [0.053, 0.189, 0.12],
      [0.057, 0.136, 0.183],
      [0.045, 0.07, 0.192],
      [0.027, 0.035, 0.176],
    ],
    width: 0.019,
    depth: 0.008,
  },
  {
    points: [
      [-0.053, 0.185, 0.111],
      [-0.075, 0.137, 0.176],
      [-0.085, 0.084, 0.186],
      [-0.095, 0.038, 0.162],
    ],
    width: 0.017,
    depth: 0.008,
  },
]

function templeLocks(side: number): HairLock[] {
  return [
    {
      points: [
        [side * 0.107, 0.16, 0.029],
        [side * 0.153, 0.12, -0.011],
        [side * 0.165, 0.036, -0.047],
        [side * 0.135, -0.119, -0.063],
      ],
      width: 0.029,
      depth: 0.011,
    },
    {
      points: [
        [side * 0.095, 0.158, -0.037],
        [side * 0.126, 0.105, -0.083],
        [side * 0.137, 0.011, -0.107],
        [side * 0.112, -0.124, -0.093],
      ],
      width: 0.028,
      depth: 0.013,
    },
  ]
}

function scalpPoint(THREE: Three, azimuth: number, t: number) {
  const front = Math.sin(azimuth)
  // Lift the cap around the ears and let the back continue into the neck.
  const earOpening = 0.23 * Math.max(0, 1 - Math.abs(front) / 0.46) ** 2
  const polar = t * (1.77 - 0.45 * front - earOpening)
  const back = Math.max(0, -front)
  const depth = front > 0 ? 0.202 : 0.18 - 0.013 * back * t ** 2
  return new THREE.Vector3(
    -(0.174 - 0.009 * back * t ** 2) * Math.cos(azimuth) * Math.sin(polar),
    0.029 + 0.196 * Math.cos(polar),
    depth * front * Math.sin(polar),
  )
}

function scalp(THREE: Three) {
  const width = 48
  const height = 18
  const cap = new THREE.SphereGeometry(1, width, height)
  const uv = cap.getAttribute('uv')
  const position = cap.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const azimuth = uv.getX(i) * Math.PI * 2
    const point = scalpPoint(THREE, azimuth, 1 - uv.getY(i))
    position.setXYZ(i, point.x, point.y, point.z)
  }
  // The original sphere ends at a pole. Fill the last row of quads after
  // opening that pole into the hairline around the temples and nape.
  const indices = Array.from(cap.index!.array)
  const stride = width + 1
  for (let i = 0; i < width; i++) {
    const lower = height * stride + i
    indices.push(lower - stride, lower, lower + 1)
  }
  cap.setIndex(indices)
  cap.computeVertexNormals()
  return cap
}

/** Fine fitted bands continue the big locks across the crown and behind the ears. */
function scalpStrands(THREE: Three): BufferGeometry[] {
  return Array.from({ length: 24 }, (_, index) => {
    const at = (index / 24) * Math.PI * 2
    const seed = ((index * 17) % 11) / 11
    const start = 0.17 + seed * 0.18
    const end = Math.sin(at) > 0.5 ? 0.8 + seed * 0.08 : 0.95 + seed * 0.07
    const points = [0, 0.24, 0.52, 0.77, 1].map((t) => {
      const azimuth = at + (0.17 + seed * 0.09) * (1 - t) ** 2
      const point = scalpPoint(THREE, azimuth, start + (end - start) * t)
      point.x *= 1.008 + Math.sin(t * Math.PI) * 0.024
      point.z *= 1.008 + Math.sin(t * Math.PI) * 0.019
      point.y += Math.sin(t * Math.PI) * 0.004
      return point
    })
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 13, 0.0014 + seed * 0.0011, 4)
  })
}

function withSway(THREE: Three, geometry: BufferGeometry, amount: number) {
  const uv = geometry.getAttribute('uv')
  const delta = new Float32Array(uv.count * 3)
  for (let i = 0; i < uv.count; i++) {
    const tip = uv.getY(i) ** 2 * amount
    delta[i * 3] = 0.012 * tip
    delta[i * 3 + 2] = 0.005 * tip
  }
  geometry.morphAttributes.position = [new THREE.BufferAttribute(delta, 3)]
  geometry.morphTargetsRelative = true
  return geometry
}

function hairGeometry(THREE: Three) {
  const geometry = mergeHumanDetails([
    withSway(THREE, scalp(THREE), 0),
    ...scalpStrands(THREE).map((strand) => withSway(THREE, strand, 0)),
    ...[...LOCKS, ...templeLocks(-1), ...templeLocks(1)].map((lock) =>
      withSway(
        THREE,
        kurapikaLock(THREE, {
          ...lock,
          width: lock.width * (lock.width > 0.035 ? 0.84 : 0.8),
          depth: lock.depth * 0.78,
          segments: 18,
          sides: 10,
        }),
        1,
      ),
    ),
  ])
  geometry.morphTargetsRelative = true
  const normals = geometry.getAttribute('normal')
  const position = geometry.getAttribute('position')
  const colours = new Float32Array(normals.count * 3)
  for (let i = 0; i < normals.count; i++) {
    const light = normals.getY(i) * 0.55 + normals.getZ(i) * 0.66 - normals.getX(i) * 0.38
    const fill = THREE.MathUtils.smoothstep(light, -0.32, 0.58)
    const gloss = THREE.MathUtils.smoothstep(light, 0.56, 0.88)
    const edge = THREE.MathUtils.smoothstep(position.getY(i), -0.115, 0.13)
    const shade = 0.65 + fill * 0.32 + gloss * 0.2 + edge * 0.09
    colours.set([shade * (1 + gloss * 0.1), shade * (0.89 + gloss * 0.11), shade], i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
  geometry.userData.authoredHeadTones = true
  return geometry
}

export function addHisokaHair(build: HumanHeadBuild, head: Group): void {
  const { THREE, profile, geometry, outlined, materials } = build
  if (profile.hairStyle === 'shaved') return
  const hair = outlined({
    THREE,
    geometry: geometry(THREE, 'hisoka:swept-fringe', () => hairGeometry(THREE)),
    material: materials.hairInk,
    ink: materials.ink,
    scale: 1.008,
  })
  hair.name = 'manga-layered-hair'
  head.add(hair)
}
