import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { MangaHairKit } from './mangaHair'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaSurfacePanel } from './kurapikaGeometry'
import { mangaLikeness } from './mangaLikeness'
import { mangaScalpGeometry } from './mangaScalp'

export function mangaQuorolleHair(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  parts.push(
    new THREE.SphereGeometry(1, 28, 16).scale(0.175, 0.128, 0.148).translate(0, 0.115, -0.022),
  )
  for (const side of [-1, 1]) quorolleWaves(kit, side)
}

function quorolleWaves(kit: MangaHairKit, side: number) {
  for (let index = 0; index < 7; index++) {
    const t = index / 6
    kit.lock({
      width: 0.034,
      depth: 0.017,
      points: [
        [side * (0.019 + t * 0.029), 0.23 - t * 0.095, 0.038 + t * 0.115],
        [side * (0.044 + t * 0.051), 0.175 - t * 0.081, 0.151 + t * 0.016],
        [side * (0.121 + t * 0.035), 0.157 - t * 0.096, 0.179 - t * 0.018],
        [side * (0.19 + t * 0.015), 0.181 - t * 0.13, 0.098 - t * 0.067],
      ],
    })
    kit.lock({
      width: 0.032,
      depth: 0.02,
      points: [
        [side * 0.111, 0.207, 0.103 - t * 0.208],
        [side * 0.176, 0.132, 0.102 - t * 0.23],
        [side * 0.194, 0.046, 0.06 - t * 0.21],
        [side * (0.166 + t * 0.013), -0.052 + t * 0.027, 0.018 - t * 0.137],
      ],
    })
  }
}

export function mangaTevelaresHair(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(
    new THREE.SphereGeometry(1, 28, 16).scale(0.166, 0.088, 0.167).translate(0, 0.143, -0.06),
    new THREE.SphereGeometry(1, 24, 14).scale(0.156, 0.114, 0.112).translate(0, 0.004, -0.115),
  )
  for (let index = -7; index <= 7; index++) {
    const x = index * 0.022
    kit.lock({
      width: 0.018,
      depth: 0.011,
      points: [
        [x * 0.88, 0.179 - Math.abs(x) * 0.29, 0.114 - Math.abs(x) * 0.26],
        [x, 0.238 - Math.abs(x) * 0.28, 0.048],
        [x * 1.08, 0.209 - Math.abs(x) * 0.45, -0.112],
        [x * 0.76, 0.066 - Math.abs(x) * 0.38, -0.211],
      ],
    })
  }
  for (const side of [-1, 1]) tevelaresNape(kit, side)
}

function tevelaresNape(kit: MangaHairKit, side: number) {
  for (let index = 0; index < 6; index++) {
    kit.lock({
      width: 0.027,
      depth: 0.014,
      points: [
        [side * 0.141, 0.148 - index * 0.014, 0.037],
        [side * 0.178, 0.102 - index * 0.016, -0.043],
        [side * (0.179 - index * 0.003), 0.039 - index * 0.015, -0.127],
        [side * 0.113, -0.026 - index * 0.012, -0.178],
      ],
    })
  }
}

type FacePoint = readonly [number, number, number]

function faceDepth(build: HumanHeadBuild, x: number, y: number) {
  const { cheek, jaw, chin } = mangaLikeness(build.profile)
  const sections = [
    [-chin, jaw * 0.35],
    [-0.135, jaw],
    [-0.07, cheek * 0.88],
    [0.015, cheek],
    [0.095, cheek * 0.98],
    [0.163, cheek * 0.8],
    [0.2, cheek * 0.5],
  ]
  const upper = sections.findIndex(([height]) => height >= y)
  const [a, ra] = sections[Math.max(0, upper - 1)]
  const [b, rb] = sections[Math.max(1, upper)]
  const radius = ra + ((rb - ra) * (y - a)) / (b - a)
  return Math.min(0.171, Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) * 1.32) + 0.0024
}

function faceMark(build: HumanHeadBuild, points: readonly FacePoint[]) {
  return kurapikaSurfacePanel(build.THREE, {
    points,
    depth: (x, y) => faceDepth(build, x, y),
  })
}

export function addQuorolleEyes(_build: HumanHeadBuild, head: Group) {
  for (const side of ['left', 'right']) {
    const eye = head.getObjectByName(`face-eye-${side}`)!
    eye.scale.set(0.69, 0.84, 1)
    eye.getObjectByName('eye-pupil')!.scale.set(1.54, 1.23, 1)
    head.getObjectByName(`face-brow-${side}`)!.scale.x = 0.77
  }
}

export function addTevelaresFace(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  for (const side of ['left', 'right']) head.getObjectByName(`face-eye-${side}`)!.scale.y = 0.74
  const scars = new THREE.Mesh(
    geometry(THREE, 'manga:tevelares-forehead-scars', () => foreheadScars(build)),
    glow(0x76524c, 1),
  )
  scars.name = 'tevelares-forehead-scars'
  head.add(scars)
  const creases = new THREE.Mesh(
    geometry(THREE, 'manga:tevelares-eye-and-cheek-lines', () => gauntLines(build)),
    glow(0x8b7166, 1),
  )
  creases.name = 'tevelares-eye-and-cheek-lines'
  head.add(creases)
  const beard = new THREE.Mesh(
    geometry(THREE, 'manga:tevelares-stubble', () => stubble(build)),
    glow(0x5c4d44, 1),
  )
  beard.name = 'tevelares-stubble'
  const moustache = new THREE.Mesh(
    geometry(THREE, 'manga:tevelares-moustache', () => upperLip(build)),
    beard.material,
  )
  moustache.name = 'tevelares-moustache'
  head.add(beard, moustache)
}

function foreheadScars(build: HumanHeadBuild) {
  return mergeHumanDetails(
    [-0.055, -0.028, 0, 0.027, 0.056].map((x, i) => {
      const top = 0.159 - (i % 3) * 0.005
      const bottom = 0.088 + (i % 2) * 0.008
      return faceMark(build, [
        [x - 0.0045, top - 0.011, 0],
        [x + 0.0005, top, 0],
        [x + 0.0036, bottom + 0.018, 0],
        [x - 0.0046, bottom, 0],
      ])
    }),
  )
}

function gauntLines(build: HumanHeadBuild) {
  return mergeHumanDetails(
    [-1, 1].flatMap((side) => [
      faceMark(build, [
        [side * 0.032, -0.022, 0],
        [side * 0.058, -0.034, 0],
        [side * 0.087, -0.026, 0],
        [side * 0.064, -0.039, 0],
        [side * 0.04, -0.032, 0],
      ]),
      faceMark(build, [
        [side * 0.113, -0.052, 0],
        [side * 0.091, -0.123, 0],
        [side * 0.093, -0.092, 0],
      ]),
    ]),
  )
}

function stubble(build: HumanHeadBuild) {
  const { THREE } = build
  const dots = Array.from({ length: 48 }, (_, i) => {
    const side = i % 2 ? 1 : -1
    const column = Math.floor(i / 2) % 8
    const row = Math.floor(i / 16)
    const x = side * (0.008 + column * 0.013 + row * 0.002)
    const y = -0.213 + column * 0.011 + row * 0.012
    return new THREE.PlaneGeometry(0.0022, 0.004 + (i % 3) * 0.001)
      .rotateZ(side * (0.16 + (i % 3) * 0.14))
      .translate(x, y, faceDepth(build, x, y))
  })
  return mergeHumanDetails(dots)
}

function upperLip(build: HumanHeadBuild) {
  const moustache = [-1, 1].map((side) =>
    faceMark(build, [
      [side * 0.003, -0.088, 0],
      [side * 0.024, -0.082, 0],
      [side * 0.048, -0.093, 0],
      [side * 0.054, -0.102, 0],
      [side * 0.02, -0.093, 0],
    ]),
  )
  return mergeHumanDetails(moustache)
}
