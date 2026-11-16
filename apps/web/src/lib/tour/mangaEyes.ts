import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mangaLikeness, type MangaEyes } from './mangaLikeness'
import { mergeHumanDetails } from './humanDetailGeometry'

type Three = HumanHeadBuild['THREE']
const HEIGHT: Record<MangaEyes, number> = {
  almond: 0.023,
  round: 0.033,
  narrow: 0.012,
  doll: 0.038,
  heavy: 0.016,
}

function outline(THREE: Three, eyes: MangaEyes) {
  const shape = new THREE.Shape()
  const h = HEIGHT[eyes]
  shape.moveTo(-0.036, -0.002)
  shape.bezierCurveTo(-0.026, h * 1.5, 0.025, h * 1.25, 0.036, 0.003)
  shape.bezierCurveTo(0.029, -h, -0.029, -h, -0.036, -0.002)
  return new THREE.ShapeGeometry(shape, 10)
}

function irisOf(build: HumanHeadBuild, type: MangaEyes): Mesh {
  const { THREE, geometry, materials, glow, profile } = build
  const size = HEIGHT[type] * 0.66
  const iris = new THREE.Mesh(
    geometry(THREE, `manga:iris:${type}`, () => new THREE.CircleGeometry(size, 24)),
    materials.ink,
  )
  iris.name = 'eye-pupil'
  iris.position.z = 0.002
  if (profile.likeness === 'illumi') return iris
  const shine = new THREE.Mesh(
    geometry(THREE, `manga:eye-shine:${type}`, () =>
      mergeHumanDetails([
        new THREE.CircleGeometry(size * 0.25, 10).translate(-size * 0.34, size * 0.4, 0.001),
        new THREE.CircleGeometry(size * 0.1, 8).translate(size * 0.4, -size * 0.35, 0.001),
      ]),
    ),
    glow(0xfffcf5, 1),
  )
  iris.add(shine)
  return iris
}

export function addMangaEyes(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, profile, glow } = build
  const look = mangaLikeness(profile)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      geometry(THREE, `manga:eye:${look.eyes}`, () => outline(THREE, look.eyes)),
      materials.ink,
    )
    eye.name = side < 0 ? 'face-eye-left' : 'face-eye-right'
    eye.position.set(side * 0.067, 0.012, 0.174)
    eye.rotation.z = ['hostile', 'severe'].includes(profile.expression)
      ? side * 0.13
      : side * -0.025
    const white = new THREE.Mesh(
      geometry(THREE, `manga:sclera:${look.eyes}`, () =>
        outline(THREE, look.eyes).scale(0.88, 0.77, 1),
      ),
      glow(0xfffcf5, 1),
    )
    white.name = 'eye-sclera'
    white.position.z = 0.001
    eye.add(white, irisOf(build, look.eyes))
    head.add(eye)
    const brow = new THREE.Mesh(
      geometry(THREE, 'manga:brow', () => new THREE.PlaneGeometry(0.067, 0.005)),
      materials.ink,
    )
    brow.name = side < 0 ? 'face-brow-left' : 'face-brow-right'
    brow.scale.y = look.brow
    brow.position.set(side * 0.067, 0.065, 0.173)
    const slopes = { anxious: -0.18, hostile: 0.25, severe: 0.18, neutral: 0, tired: 0.02 }
    brow.rotation.z = side * slopes[profile.expression]
    head.add(brow)
  }
}
