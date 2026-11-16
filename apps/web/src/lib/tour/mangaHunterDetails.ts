import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addHunterHeadDetails(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness === 'biscuit-krueger' && build.profile.frame === 'child')
    biscuitRibbons(build, head)
  if (build.profile.likeness === 'hanzo') hanzoFace(build, head)
}

function biscuitRibbons(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow, profile } = build
  const ribbon = geometry(THREE, 'manga:biscuit-hair-ribbons', () => {
    const parts = []
    for (const side of [-1, 1])
      for (const lobe of [-1, 1]) {
        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        shape.bezierCurveTo(lobe * 0.065, 0.12, lobe * 0.085, 0.015, 0, 0)
        parts.push(new THREE.ShapeGeometry(shape, 16).translate(side * 0.163, 0.19, 0.035))
      }
    return mergeHumanDetails(parts)
  })
  const bows = new THREE.Mesh(ribbon, glow(profile.accent, 1))
  bows.name = 'biscuit-hair-ribbons'
  head.add(bows)
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
