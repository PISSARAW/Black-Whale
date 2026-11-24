import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addTangZhaoLiPortraitFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const eye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    eye?.scale.set(1.18, 1.16, 1)
  }

  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:tang-zhao-li-thin-nose', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.0025, 0.082, 0.002).rotateZ(-0.04).translate(-0.004, -0.025, 0),
        new THREE.BoxGeometry(0.018, 0.0025, 0.002).rotateZ(-0.12).translate(0.005, -0.067, 0),
        new THREE.CircleGeometry(0.0035, 8).translate(0.014, -0.066, 0.002),
      ]),
    ),
    materials.ink,
  )
  nose.position.z = 0.186
  nose.name = 'tang-zhao-li-thin-nose'
  head.add(nose)

  const curlHighlights = new THREE.Mesh(
    geometry(THREE, 'manga:tang-zhao-li-curl-highlights', () => {
      const parts = []
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI
        parts.push(
          new THREE.TorusGeometry(0.022, 0.0015, 4, 14, Math.PI * 1.35)
            .rotateZ(angle - Math.PI * 0.2)
            .translate(-0.16 + i * 0.04, 0.145 + Math.sin(angle) * 0.085, 0.132),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0xffefbd, 0.9),
  )
  curlHighlights.name = 'tang-zhao-li-blonde-curl-highlights'
  head.add(curlHighlights)
}
