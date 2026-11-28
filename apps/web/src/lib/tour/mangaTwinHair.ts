import type { MangaHairKit } from './mangaHair'
import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mangaLikeness } from './mangaLikeness'
import { mergeHumanDetails } from './humanDetailGeometry'

type Three = HumanHeadBuild['THREE']

function hairline(azimuth: number): number {
  const temple = Math.sin(azimuth) ** 4
  const back = Math.max(0, -Math.cos(azimuth))
  return (
    1.3 - 0.31 * Math.sin(azimuth * 2) * Math.max(0, Math.cos(azimuth)) + 0.28 * temple + back * 0.8
  )
}

function crownPoint(THREE: Three, azimuth: number, incline: number) {
  return new THREE.Vector3(
    0.183 * Math.sin(azimuth) * Math.sin(incline),
    0.035 + 0.221 * Math.cos(incline),
    0.197 * Math.cos(azimuth) * Math.sin(incline),
  )
}

function sweptCrown(THREE: Three, part: number) {
  const sections = 16
  const around = 48
  const points = []
  const uv = []
  const indices = []
  for (let column = 0; column <= around; column++) {
    const azimuth = (column / around - 0.5) * Math.PI * 2
    for (let row = 0; row <= sections; row++) {
      const fraction = row / sections
      const p = crownPoint(THREE, azimuth, Math.max(0.002, hairline(azimuth * part) * fraction))
      points.push(p.x, p.y, p.z)
      uv.push(column / around, fraction)
      if (column === around || row === sections) continue
      const a = column * (sections + 1) + row
      const b = a + 1
      const c = a + sections + 1
      indices.push(a, b, c, b, c + 1, c)
    }
  }
  const surface = new THREE.BufferGeometry()
  surface.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  surface.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  surface.setIndex(indices)
  surface.computeVertexNormals()
  return surface
}

function nape(THREE: Three, kacho: boolean) {
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(kacho ? 0.166 : 0.181, kacho ? -0.205 : -0.185),
      new THREE.Vector2(0.166, -0.13),
      new THREE.Vector2(0.181, -0.069),
      new THREE.Vector2(0.179, 0.048),
      new THREE.Vector2(0.154, 0.133),
    ],
    32,
    1.4,
    Math.PI * 2 - 2.8,
  ).scale(1, 1, 0.96)
}

export function mangaKachoHair(kit: MangaHairKit): void {
  const { THREE, parts, lock } = kit
  parts.push(sweptCrown(THREE, 1), nape(THREE, true))
  for (const side of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const t = i / 5
      const layer = Math.floor(i / 2) * 0.042
      lock({
        width: 0.047,
        depth: 0.02,
        segments: 18,
        points: [
          [side * (0.158 - t * 0.053), 0.05, -0.024 - t * 0.105],
          [side * (0.144 - t * 0.025), -0.11 - layer, -0.018 - t * 0.14],
          [side * (0.196 - t * 0.024), -0.177 - layer, -0.004 - t * 0.15],
          [side * (0.235 - t * 0.034), -0.13 - layer, 0.01 - t * 0.151],
        ],
      })
    }
}

export function mangaFugetsuHair(kit: MangaHairKit): void {
  const { THREE, parts, lock } = kit
  // Mirror the part and retain one compact, nearly continuous line at the chin.
  parts.push(sweptCrown(THREE, -1), nape(THREE, false))
  for (const side of [-1, 1]) {
    lock({
      width: 0.049,
      depth: 0.014,
      points: [
        [side * 0.154, 0.03, 0.02],
        [side * 0.152, -0.065, -0.02],
        [side * 0.159, -0.141, -0.004],
        [side * 0.19, -0.183, 0.02],
      ],
    })
  }
}

export function addTwinHairDetails(build: HumanHeadBuild, head: Group): void {
  const { THREE, glow, geometry, profile } = build
  const kacho = profile.likeness === 'prince-kacho'
  const strands = new THREE.Mesh(
    geometry(THREE, `manga:twins-hair-sweep:${kacho}`, () => {
      const part = kacho ? 1 : -1
      const strokes = Array.from({ length: 5 }, (_, i) => {
        const end = -1.05 + i * 0.236
        const mean = 0.11 + i * 0.077
        const points = Array.from({ length: 15 }, (_, step) => {
          const t = step / 14
          const azimuth = 0.73 * (1 - t) + end * t - 0.38 * Math.sin(t * Math.PI)
          const incline = 0.33 + mean + (hairline(end) - 0.075 - 0.33 - mean) * t
          const p = crownPoint(THREE, azimuth, incline)
          return p.set(p.x * part * 1.015, p.y + 0.003, p.z * 1.018)
        })
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, 0.0017, 5, false)
      })
      return mergeHumanDetails(strokes)
    }),
    glow(kacho ? 0xa98248 : 0x736576, 1),
  )
  strands.name = 'twins-swept-hair-lines'
  strands.scale.x = mangaLikeness(profile).cheek / 0.155
  head.add(strands)
  if (profile.royalCostume === 'twins-banquet') addHairFlower(build, head, kacho)
}

function addHairFlower(build: HumanHeadBuild, head: Group, kacho: boolean) {
  const { THREE, geometry, glow } = build
  const flower = new THREE.Mesh(
    geometry(THREE, 'manga:twins-banquet-flower', () =>
      mergeHumanDetails(
        Array.from({ length: 7 }, (_, i) => {
          const angle = (i / 7) * Math.PI * 2
          return new THREE.SphereGeometry(1, 10, 6)
            .scale(0.023, 0.012, 0.009)
            .rotateZ(angle)
            .translate(0.019 * Math.cos(angle), 0.019 * Math.sin(angle), 0)
        }),
      ),
    ),
    glow(0xdeb6b6, 1),
  )
  flower.name = 'twins-banquet-hair-flower'
  flower.position.set(kacho ? -0.14 : 0.14, 0.14, 0.095)
  flower.rotation.y = kacho ? -0.55 : 0.55
  const center = new THREE.Mesh(
    geometry(
      THREE,
      'manga:twins-banquet-flower-center',
      () => new THREE.SphereGeometry(0.011, 10, 6),
    ),
    glow(0xbe7c77, 1),
  )
  center.position.z = 0.009
  flower.add(center)
  head.add(flower)
}
