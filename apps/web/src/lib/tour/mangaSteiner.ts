import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addSteinerHazelEyesAndHair(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, glow } = build
  head.traverse((node) => {
    if (node.name === 'eye-pupil') (node as Mesh).material = glow(0x8a6a3d, 1)
  })

  const part = new THREE.Mesh(
    geometry(
      THREE,
      'manga:steiner-side-part-line',
      () =>
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.082, 0.145, 0.154),
            new THREE.Vector3(-0.064, 0.193, 0.12),
            new THREE.Vector3(-0.045, 0.225, 0.06),
          ]),
          12,
          0.0023,
          5,
          false,
        ),
    ),
    glow(0x725b45, 0.92),
  )
  part.name = 'steiner-clean-side-part'
  head.add(part)

  const combLines = new THREE.Mesh(
    geometry(THREE, 'manga:steiner-combed-light-brown-hair', () => {
      const parts: BufferGeometry[] = []
      for (let line = -5; line <= 6; line++) {
        const startX = -0.06 + line * 0.019
        parts.push(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(startX, 0.145, 0.158),
              new THREE.Vector3(startX + 0.025, 0.186, 0.132),
              new THREE.Vector3(startX + 0.061, 0.217, 0.068),
            ]),
            10,
            0.0014,
            4,
            false,
          ),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0xb28b62, 0.82),
  )
  combLines.name = 'steiner-light-brown-combed-hair-lines'
  head.add(combLines)
}
