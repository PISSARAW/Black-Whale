import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'
import { mangaFalseHisokaHair } from './mangaBonolenovDisguise'

function mangaLynchHair(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (const side of [-1, 1]) {
    for (let strand = 0; strand < 9; strand++) {
      const depth = 0.115 - strand * 0.027
      const points = Array.from({ length: 16 }, (_, i) => {
        const t = i / 15
        const wave = Math.sin(t * Math.PI * 6 + strand * 0.8)
        return [
          side * (0.098 + 0.09 * Math.sin(t * Math.PI * 0.82) + 0.029 * t * wave),
          0.196 - t * (0.74 + strand * 0.012),
          depth - 0.17 * t + wave * 0.022 * t,
        ] as const
      })
      kit.lock({ points, width: 0.029, depth: 0.018 })
    }
  }
  kit.lock({
    width: 0.047,
    depth: 0.019,
    points: [
      [-0.11, 0.19, 0.09],
      [-0.097, 0.14, 0.172],
      [-0.099, 0.013, 0.18],
      [-0.143, -0.103, 0.155],
    ],
  })
}

export function addLynchHeadband(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const band = new THREE.Mesh(
    geometry(THREE, 'manga:lynch-headband', () =>
      new THREE.CylinderGeometry(0.167, 0.174, 0.029, 36, 1, true).scale(1, 1, 0.96).rotateX(0.33),
    ),
    glow(0xab9f88, 1),
  )
  band.position.set(0, 0.143, 0.005)
  band.name = 'lynch-headband'
  head.add(band)
}

function mangaPhinksHair(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (let i = -8; i <= 8; i++) {
    const x = i * 0.019
    const crown = 0.257 - Math.abs(x) * 0.42
    kit.lock({
      width: 0.022,
      depth: 0.019,
      points: [
        [x, 0.117 + Math.abs(x) * 0.1, 0.131],
        [x * 1.04, crown, 0.1],
        [x * 0.99, crown + 0.011, -0.024],
        [x * 0.92, 0.171, -0.134],
      ],
    })
  }
}

function mangaVoconteHair(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (const side of [-1, 1])
    for (let i = 0; i < 8; i++) {
      const z = 0.13 - i * 0.034
      kit.lock({
        width: 0.025,
        depth: 0.017,
        points: [
          [side * 0.018, 0.226, z],
          [side * 0.128, 0.193, z],
          [side * 0.171, 0.115, z - 0.024],
          [side * 0.151, -0.009, z - 0.042],
        ],
      })
    }
}

function mangaBorksenHair(kit: MangaHairKit) {
  const { THREE } = kit
  kit.parts.push(mangaScalpGeometry(kit))
  kit.parts.push(
    new THREE.LatheGeometry(
      [
        [0.162, -0.232],
        [0.173, -0.155],
        [0.177, 0.018],
        [0.16, 0.143],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      32,
      0.9,
      Math.PI * 2 - 1.8,
    ).scale(1, 1, 0.94),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 7; i++) {
      const x = i * 0.022
      kit.lock({
        width: 0.022,
        depth: 0.015,
        points: [
          [side * x * 0.75, 0.223, 0.075],
          [side * (x + 0.027), 0.145, 0.166 - x * 0.18],
          [side * (x + 0.042), 0.037 - i * 0.008, 0.164 - x * 0.42],
          [side * (x + 0.065 + (i > 4 ? 0.026 : 0)), 0.024 - i * 0.041, 0.158 - x * 0.84],
        ],
      })
    }
}

function mangaNobunagaHair(kit: MangaHairKit) {
  const { THREE } = kit
  kit.parts.push(mangaScalpGeometry(kit))
  kit.parts.push(
    new THREE.CylinderGeometry(0.025, 0.039, 0.11, 16).rotateX(-0.23).translate(0, 0.261, -0.059),
  )
  for (let i = -8; i <= 8; i++) {
    const fan = i / 8
    kit.lock({
      width: 0.016,
      depth: 0.013,
      points: [
        [fan * 0.022, 0.308, -0.067],
        [fan * 0.058, 0.398 + (i % 3) * 0.009, -0.07],
        [fan * 0.119, 0.389 + Math.abs(fan) * 0.012, -0.075],
        [fan * 0.166, 0.335, -0.086 - Math.abs(fan) * 0.025],
      ],
    })
  }
}

export const BLACK_WHALE_HAIR: Partial<Record<string, (kit: MangaHairKit) => void>> = {
  'lynch-waves': mangaLynchHair,
  'false-hisoka-fringe': mangaFalseHisokaHair,
  'phinks-combed': mangaPhinksHair,
  'voconte-part': mangaVoconteHair,
  'borksen-flip': mangaBorksenHair,
  'nobunaga-topknot': mangaNobunagaHair,
}
