import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mangaLikeness } from './mangaLikeness'
import { addMangaEyes } from './mangaEyes'
import { addMangaHair } from './mangaHair'
import { addMangaBandagedHead } from './mangaBandages'
import { addMangaHood } from './mangaHood'
import { addMangaHeadwear } from './mangaHeadwear'
import { addMangaFaceTraits } from './mangaFaceTraits'
import { kurapikaPanel } from './kurapikaGeometry'

export function buildMangaHead(build: HumanHeadBuild): Group {
  const { THREE, geometry, outlined, materials, profile } = build
  const faceProfile = profile.faceLike
    ? { ...profile, likeness: profile.faceLike, faceFeatures: undefined }
    : profile
  const look = mangaLikeness(faceProfile)
  const head = new THREE.Group()
  head.name = `manga-head:${profile.likeness}`
  head.position.y = mangaLikeness(profile).headY
  const face = outlined({
    THREE,
    geometry: geometry(
      THREE,
      `manga:face:${look.cheek}:${look.jaw}:${look.chin}:${profile.face}:${profile.likeness === 'hanzo'}:${profile.likeness === 'melody'}`,
      () => {
        const points = [
          [0, -look.chin],
          [look.jaw * (profile.face === 'square' ? 0.7 : 0.35), -look.chin],
          [look.jaw, -0.135],
          [look.cheek * 0.88, -0.07],
          [look.cheek, 0.015],
          [look.cheek * 0.98, 0.095],
          [look.cheek * 0.8, 0.163],
          [look.cheek * 0.5, 0.2],
          [0, 0.22],
        ]
        if (profile.likeness === 'hanzo')
          points.splice(
            5,
            4,
            [look.cheek * 0.98, 0.12],
            [look.cheek * 0.9, 0.21],
            [look.cheek * 0.58, 0.275],
            [0, 0.295],
          )
        if (profile.likeness === 'melody')
          points.splice(
            5,
            4,
            [look.cheek, 0.105],
            [look.cheek * 0.86, 0.225],
            [look.cheek * 0.53, 0.3],
            [0, 0.325],
          )
        const made = new THREE.LatheGeometry(
          points.map(([x, y]) => new THREE.Vector2(x, y)),
          28,
        )
        const positions = made.getAttribute('position')
        for (let i = 0; i < positions.count; i++) {
          const z = positions.getZ(i)
          positions.setZ(i, z > 0 ? Math.min(0.171, z * 1.32) : z * 0.93)
        }
        made.computeVertexNormals()
        return made
      },
    ),
    material: materials.skin,
    ink: materials.ink,
    scale: 1.022,
  })
  ;(face.children[1] as Mesh).material = materials.skin
  face.name = 'manga-face'
  head.add(face)
  addMangaEyes(build, head)
  const nose = new THREE.Mesh(
    geometry(THREE, `manga:nose:${look.nose}`, () =>
      new THREE.ConeGeometry(0.012 * look.nose, 0.032 * look.nose, 5).rotateX(Math.PI / 2),
    ),
    materials.skin,
  )
  nose.name = 'face-relief'
  nose.position.set(0, -0.048, 0.17)
  head.add(nose)
  const mouth = new THREE.Mesh(
    geometry(THREE, `manga:mouth:${look.mouth}`, () =>
      kurapikaPanel(THREE, [
        [-look.mouth / 2, 0, 0],
        [0, -0.002, 0],
        [look.mouth / 2, 0, 0],
        [0, -0.004, 0],
      ]),
    ),
    materials.ink,
  )
  mouth.name = 'face-mouth'
  const mouthRadius = look.jaw + (look.cheek * 0.88 - look.jaw) * 0.4
  mouth.position.set(0, -0.109, Math.min(0.171, mouthRadius * 1.32) + 0.003)
  head.add(mouth)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      geometry(THREE, 'manga:ear', () =>
        new THREE.SphereGeometry(1, 10, 8).scale(0.024, 0.039, 0.017),
      ),
      materials.skin,
    )
    ear.position.set(side * (look.cheek + 0.006), -0.025, 0)
    head.add(ear)
  }
  if (profile.likeness === 'prince-tserriednich' && build.seen.human?.unmasked) {
    addMangaHair(
      {
        ...build,
        profile: { ...profile, hairStyle: 'long' },
        materials: { ...materials, hairInk: build.glow(0xb6a47d, 1) },
      },
      head,
    )
  } else if (profile.likeness === 'prince-tserriednich') addMangaHood(build, head)
  else addMangaHair(build, head)
  addMangaFaceTraits({ ...build, profile: faceProfile }, head)
  addMangaHeadwear(build, head)
  if (profile.likeness === 'bonolenov-ndongo') addMangaBandagedHead(build, head)
  return head
}
