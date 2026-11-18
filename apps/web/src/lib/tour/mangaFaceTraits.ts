import { addBodyguardFaces } from './mangaBodyguardFaces'
import { addTubeppaFace } from './mangaTubeppaHead'
import { addMarayamFace } from './mangaMarayamHead'
import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addGelFace } from './mangaGel'
import { addHeillyReferenceFace } from './mangaHeillyFaces'
import { addPadailleFace } from './mangaPadaille'
import { addMelodySoftFeatures } from './mangaMelody'
import { addUnderworldFaceDetails } from './mangaUnderworldFaces'
import { addBenjaminDetails } from './mangaBenjamin'
import { addMangaFacialHair } from './mangaFacialHair'

export const MANGA_FACE_SIGNATURES = new Set([
  'lips-full',
  'face-paint-star-tear',
  'bandages-full',
  'beard-full',
  'moustache',
  'mutton-chops',
  'goatee',
])

function facePaint(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  const star = new THREE.Mesh(
    geometry(THREE, 'manga:hisoka-star', () => {
      const shape = new THREE.Shape()
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2
        const r = i % 2 ? 0.012 : 0.027
        if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
        else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      shape.closePath()
      return new THREE.ShapeGeometry(shape)
    }),
    materials.ink,
  )
  star.name = 'signature-star'
  star.position.set(-0.087, -0.046, 0.174)
  const tear = new THREE.Mesh(
    geometry(THREE, 'manga:hisoka-tear', () => {
      const shape = new THREE.Shape()
      shape.moveTo(0, 0.026)
      shape.bezierCurveTo(-0.003, 0.008, -0.021, -0.008, -0.012, -0.02)
      shape.bezierCurveTo(0, -0.035, 0.03, -0.015, 0, 0.026)
      return new THREE.ShapeGeometry(shape, 10)
    }),
    materials.ink,
  )
  tear.name = 'signature-tear'
  tear.position.set(0.087, -0.049, 0.174)
  head.add(star, tear)
}

function franklin(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  head.getObjectByName('manga-face')!.name = 'franklin-square-jaw'
  const creases = new THREE.Mesh(
    geometry(THREE, 'manga:franklin-face-creases', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.093, 0.0025).translate(0, 0.123, 0.173),
        new THREE.PlaneGeometry(0.075, 0.0025).translate(0, 0.145, 0.16),
        new THREE.PlaneGeometry(0.003, 0.07).rotateZ(0.17).translate(-0.12, -0.08, 0.174),
        new THREE.PlaneGeometry(0.003, 0.07).rotateZ(-0.17).translate(0.12, -0.08, 0.174),
      ]),
    ),
    glow(0x5a433b, 0.7),
  )
  creases.name = 'franklin-face-creases'
  head.add(creases)
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(
      geometry(THREE, 'manga:franklin-earlobe', () =>
        new THREE.SphereGeometry(1, 12, 8).scale(0.022, 0.08, 0.021),
      ),
      materials.skin,
    )
    lobe.name = 'franklin-long-earlobe'
    lobe.position.set(side * 0.186, -0.09, 0.004)
    const ring = new THREE.Mesh(
      geometry(THREE, 'manga:franklin-earring', () => new THREE.TorusGeometry(0.023, 0.005, 6, 18)),
      glow(0xb0a16c, 1),
    )
    ring.position.set(side * 0.186, -0.16, 0.013)
    head.add(lobe, ring)
  }
}

export function addMangaFaceTraits(build: HumanHeadBuild, head: Group): void {
  const id = build.profile.likeness ?? ''
  if (id === 'hisoka' && build.profile.hairStyle !== 'bob') facePaint(build, head)
  if (id === 'melody') addMelodySoftFeatures(build, head)
  if (id === 'franklin-bordeau') franklin(build, head)
  addMangaFacialHair(build, head)
  addBenjaminDetails(build, head)
  addUnderworldFaceDetails(build, head)
  addPadailleFace(build, head)
  addHeillyReferenceFace(build, head)
  addGelFace(build, head)
  addBodyguardFaces(build, head)
  if (id === 'prince-tubeppa') addTubeppaFace(build, head)
  if (id === 'prince-marayam') addMarayamFace(build, head)
  if (id === 'cheadle-yorkshire') {
    const nose = head.getObjectByName('face-relief') as Mesh
    nose.material = build.materials.ink
    nose.scale.set(1.6, 0.65, 0.6)
  }
}
