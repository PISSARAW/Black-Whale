import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaLock } from './kurapikaGeometry'

/** Benjamin's temple tufts and stern facial folds come from the supplied manga close-ups. */
export function addBenjaminDetails(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness !== 'prince-benjamin') return
  const { THREE, geometry, materials, glow } = build
  const wings = new THREE.Mesh(
    geometry(THREE, 'manga:benjamin-temple-tufts', () => {
      const parts = []
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++)
          parts.push(
            kurapikaLock(THREE, {
              width: 0.021,
              depth: 0.013,
              points: [
                [side * 0.16, 0.08 - i * 0.035, -0.015],
                [side * 0.21, 0.1 - i * 0.035, -0.02],
                [side * 0.26, 0.08 - i * 0.035, -0.03],
                [side * 0.29, 0.14 - i * 0.035, -0.03],
              ],
            }),
          )
      return mergeHumanDetails(parts)
    }),
    materials.hairInk,
  )
  wings.name = 'benjamin-temple-tufts'
  head.add(wings)
  const creases = new THREE.Mesh(
    geometry(THREE, 'manga:benjamin-facial-folds', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.003, 0.061)
            .rotateZ(side * 0.16)
            .translate(side * 0.018, 0.086, 0.18),
        )
        parts.push(
          new THREE.PlaneGeometry(0.003, 0.09)
            .rotateZ(side * -0.13)
            .translate(side * 0.12, -0.09, 0.174),
        )
        parts.push(
          new THREE.PlaneGeometry(0.047, 0.003)
            .rotateZ(side * -0.35)
            .translate(side * 0.031, -0.102, 0.178),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x79604c, 0.65),
  )
  creases.name = 'benjamin-facial-folds'
  head.add(creases)
}
