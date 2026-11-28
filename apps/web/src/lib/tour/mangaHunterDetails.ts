import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addHunterHeadDetails(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness === 'biscuit-krueger' && build.profile.frame === 'child')
    biscuitLacedBun(build, head)
  if (build.profile.likeness === 'hanzo') hanzoFace(build, head)
}

function biscuitLacedBun(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow, profile } = build
  const lacing = geometry(THREE, 'manga:biscuit-laced-bun', () => {
    const parts = []
    for (let band = -2; band <= 2; band++)
      parts.push(
        new THREE.TorusGeometry(0.09, 0.006, 6, 24)
          .scale(1.2, 0.78, 1)
          .rotateY(band * 0.32)
          .translate(0, 0.22, -0.31),
      )
    return mergeHumanDetails(parts)
  })
  const bun = new THREE.Mesh(lacing, glow(profile.accent, 1))
  bun.name = 'biscuit-laced-bun'
  head.add(bun)
}

function hanzoFace(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const marks = new THREE.Mesh(
    geometry(THREE, 'manga:hanzo-face-folds', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.002, 0.047)
            .rotateZ(side * 0.2)
            .translate(side * 0.019, 0.07, 0.18),
        )
        parts.push(
          new THREE.PlaneGeometry(0.035, 0.002)
            .rotateZ(side * 0.15)
            .translate(side * 0.065, -0.016, 0.18),
        )
        parts.push(
          new THREE.PlaneGeometry(0.002, 0.056)
            .rotateZ(side * 0.15)
            .translate(side * 0.012, -0.04, 0.183),
        )
        parts.push(
          new THREE.PlaneGeometry(0.03, 0.003)
            .rotateZ(side * 0.1)
            .translate(side * 0.013, -0.105, 0.15),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x584538, 0.75),
  )
  marks.name = 'hanzo-face-folds'
  head.add(marks)
}
