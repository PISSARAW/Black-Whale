import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaSurfacePanel, type Point3 } from './kurapikaGeometry'

function faceStroke(THREE: HumanHeadBuild['THREE'], points: readonly Point3[], radius = 0.0018) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    24,
    radius,
    6,
    false,
  )
}

export function addBodyguardFaces(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness === 'bill') addBillTiredFace(build, head)
  if (build.profile.likeness === 'basho') addBashoFace(build, head)
}

function addBillTiredFace(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:bill-tired-eye-folds', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++)
          parts.push(
            faceStroke(
              THREE,
              [
                [side * 0.028, -0.012 - i * 0.011, 0.174],
                [side * 0.065, -0.027 - i * 0.011, 0.171],
                [side * 0.103, -0.011 - i * 0.009, 0.151],
              ],
              0.0014,
            ),
          )
        parts.push(
          faceStroke(THREE, [
            [side * 0.012, 0.043, 0.179],
            [side * 0.022, 0.071, 0.176],
            [side * 0.01, 0.089, 0.173],
          ]),
        )
        parts.push(
          faceStroke(
            THREE,
            [
              [side * 0.014, 0.02, 0.179],
              [side * 0.022, -0.055, 0.179],
              [side * 0.009, -0.068, 0.177],
            ],
            0.0015,
          ),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x766352, 1),
  )
  folds.name = 'bill-tired-eye-folds'
  head.add(folds)
  head.getObjectByName('face-brow-left')!.rotation.z = -0.2
  head.getObjectByName('face-brow-right')!.rotation.z = 0.2
}

function bashoFront(x: number, y: number) {
  const sections = [
    [0.105, -0.22],
    [0.15, -0.135],
    [0.15312, -0.07],
    [0.174, 0.015],
    [0.17052, 0.095],
    [0.1392, 0.163],
    [0.087, 0.2],
    [0, 0.22],
  ]
  const next = Math.max(
    1,
    sections.findIndex(([, height]) => height >= y),
  )
  const [ra, ya] = sections[next - 1],
    [rb, yb] = sections[next]
  const radius = ra + ((rb - ra) * (y - ya)) / (yb - ya)
  return Math.min(0.171, Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) * 1.32) + 0.005
}

function bashoChops(THREE: HumanHeadBuild['THREE']) {
  const parts = []
  for (const side of [-1, 1])
    parts.push(
      kurapikaSurfacePanel(THREE, {
        points: [
          [0.155, 0.04],
          [0.175, -0.015],
          [0.164, -0.178],
          [0.118, -0.158],
          [0.128, -0.131],
          [0.099, -0.111],
          [0.028, -0.08],
          [0.006, -0.067],
          [0.04, -0.064],
          [0.091, -0.082],
          [0.122, -0.089],
          [0.119, -0.054],
          [0.135, -0.066],
          [0.14, -0.038],
          [0.151, -0.055],
          [0.153, 0.022],
        ].map(([x, y]) => [x * side, y, 0] as const),
        depth: bashoFront,
      }),
    )
  return mergeHumanDetails(parts)
}

function addBashoFace(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const chops = new THREE.Mesh(
    geometry(THREE, 'manga:basho-connected-mutton-chops', () => bashoChops(THREE)),
    glow(0x50341f, 1),
  )
  chops.name = 'basho-connected-mutton-chops'
  head.add(chops)
  const details = new THREE.Mesh(
    geometry(THREE, 'manga:basho-jaw-stubble', () => {
      const parts = []
      for (let i = -4; i <= 4; i++)
        for (let row = 0; row < 2; row++) {
          const x = i * 0.014,
            y = -0.184 - row * 0.016 + Math.abs(i) * 0.002
          parts.push(
            new THREE.BoxGeometry(0.0018, 0.005, 0.002).translate(x, y, bashoFront(x, y) + 0.002),
          )
        }
      for (const side of [-1, 1])
        parts.push(
          faceStroke(
            THREE,
            [
              [side * 0.015, 0.044, 0.18],
              [side * 0.024, -0.04, 0.18],
              [side * 0.011, -0.061, 0.179],
            ],
            0.002,
          ),
        )
      return mergeHumanDetails(parts)
    }),
    glow(0x624733, 1),
  )
  details.name = 'basho-jaw-stubble'
  head.add(details)
  const brows = new THREE.Mesh(
    geometry(THREE, 'manga:basho-heavy-brows', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          kurapikaSurfacePanel(THREE, {
            points: [
              [0.015, 0.055],
              [0.025, 0.084],
              [0.106, 0.12],
              [0.132, 0.104],
              [0.126, 0.078],
              [0.04, 0.044],
            ].map(([x, y]) => [side * x, y, 0] as const),
            depth: (x, y) => bashoFront(x, y) + 0.002,
          }),
        ),
      ),
    ),
    glow(0x50341f, 1),
  )
  brows.name = 'basho-heavy-brows'
  head.getObjectByName('face-brow-left')!.visible = false
  head.getObjectByName('face-brow-right')!.visible = false
  head.add(brows)
  const curl = new THREE.Mesh(
    geometry(THREE, 'manga:basho-pompadour-ridges', () => {
      const points: Point3[] = []
      for (let i = 0; i <= 60; i++) {
        const t = i / 60,
          angle = t * Math.PI * 3.1,
          radius = 0.082 * (1 - t * 0.85)
        points.push([
          Math.cos(angle) * radius,
          0.225 + Math.sin(angle) * radius * 0.85,
          0.087 + Math.sqrt(Math.max(0.001, 0.105 ** 2 - radius ** 2)) + 0.002,
        ])
      }
      return faceStroke(THREE, points, 0.0025)
    }),
    glow(0xaf7a48, 1),
  )
  curl.name = 'basho-pompadour-ridges'
  head.add(curl)
}
