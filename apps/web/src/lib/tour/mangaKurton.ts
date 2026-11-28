import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addKurtonAngularFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials } = build
  const spikes = new THREE.Mesh(
    geometry(THREE, 'manga:kurton-short-spikes', () => {
      const parts = []
      for (let i = -4; i <= 4; i++)
        parts.push(
          new THREE.ConeGeometry(0.024, 0.09 + (4 - Math.abs(i)) * 0.009, 4)
            .rotateZ(i * -0.075)
            .translate(i * 0.033, 0.225 - Math.abs(i) * 0.004, -0.005),
        )
      return mergeHumanDetails(parts)
    }),
    materials.hairInk,
  )
  spikes.name = 'kurton-short-spiky-hair'
  head.add(spikes)
  for (const side of [-1, 1]) {
    const brow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    if (brow) brow.visible = false
  }
  const features = new THREE.Mesh(
    geometry(THREE, 'manga:kurton-angular-features', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.BoxGeometry(0.074, 0.009, 0.004)
            .rotateZ(side * -0.19)
            .translate(side * 0.065, 0.079, 0.178),
        )
        parts.push(
          new THREE.BoxGeometry(0.036, 0.008, 0.004)
            .rotateZ(side * 0.48)
            .translate(side * 0.112, 0.09, 0.165),
        )
      }
      parts.push(
        new THREE.BoxGeometry(0.003, 0.095, 0.003).rotateZ(0.08).translate(-0.009, -0.015, 0.184),
      )
      parts.push(
        new THREE.BoxGeometry(0.028, 0.003, 0.003).rotateZ(-0.15).translate(0.003, -0.066, 0.185),
      )
      return mergeHumanDetails(parts)
    }),
    materials.ink,
  )
  features.name = 'kurton-thick-brows-and-long-nose'
  head.add(features)
}
