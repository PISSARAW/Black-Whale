import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaPanel } from './kurapikaGeometry'

export function addUnderworldFaceDetails(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, profile, glow } = build
  if (
    !['rihan', 'hinrigh-biganduffno', 'zakuro-custard', 'terebellum'].includes(
      profile.likeness ?? '',
    )
  )
    return
  const features = new THREE.Mesh(
    geometry(THREE, `manga:underworld-face:${profile.likeness}`, () => {
      const parts = []
      if (profile.likeness !== 'zakuro-custard') {
        for (const side of [-1, 1]) {
          parts.push(
            new THREE.PlaneGeometry(0.002, 0.074)
              .rotateZ(side * 0.06)
              .translate(side * 0.013, -0.025, 0.183),
          )
          parts.push(
            new THREE.PlaneGeometry(0.025, 0.002)
              .rotateZ(side * 0.3)
              .translate(side * 0.011, -0.065, 0.184),
          )
        }
      }
      if (profile.likeness === 'terebellum') {
        parts.push(
          kurapikaPanel(THREE, [
            [-0.034, -0.17, 0.17],
            [0, -0.31, 0.17],
            [0.034, -0.17, 0.17],
          ]),
        )
        for (let i = -5; i <= 5; i++)
          parts.push(
            new THREE.PlaneGeometry(0.0015, 0.016)
              .rotateZ(i * 0.08)
              .translate(i * 0.017, -0.16 + Math.abs(i) * 0.006, 0.15),
          )
      }
      if (profile.likeness === 'zakuro-custard')
        parts.push(
          new THREE.TorusGeometry(0.018, 0.002, 6, 24)
            .scale(1.5, 0.45, 1)
            .translate(0, -0.11, 0.14),
        )
      parts.forEach((part) => part.deleteAttribute('uv'))
      return mergeHumanDetails(parts)
    }),
    glow(0x4b4039, 0.85),
  )
  features.name = 'manga-underworld-face-details'
  head.add(features)
}
