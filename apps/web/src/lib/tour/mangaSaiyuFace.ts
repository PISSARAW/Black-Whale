import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { saiyuCurve } from './mangaSaiyuOrnaments'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addSaiyuFace(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow, materials } = build
  head.getObjectByName('face-mouth')!.visible = false
  const shape = geometry(THREE, 'manga:saiyu-gritted-mouth', () => {
    const path = new THREE.Shape()
    path.moveTo(-0.043, -0.016)
    path.quadraticCurveTo(0, 0.038, 0.043, -0.016)
    path.quadraticCurveTo(0, 0.004, -0.043, -0.016)
    return new THREE.ShapeGeometry(path, 20)
  })
  const mouth = new THREE.Mesh(shape, materials.ink)
  mouth.name = 'saiyu-gritted-mouth'
  mouth.position.set(0, -0.112, 0.15)
  const teeth = new THREE.Mesh(shape, glow(0xe5e4d9, 1))
  teeth.scale.set(0.83, 0.7, 1)
  teeth.position.z = 0.001
  const divisions = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-teeth-divisions', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.047, 0.0012, 0.001).translate(0, 0.001, 0.003),
        ...[-1, 0, 1].map((side) =>
          new THREE.BoxGeometry(0.001, side === 0 ? 0.009 : 0.006, 0.001).translate(
            side * 0.016,
            0.002,
            0.003,
          ),
        ),
      ]),
    ),
    materials.ink,
  )
  mouth.add(teeth, divisions)
  head.add(mouth)
  const face = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-nose-and-brows', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          saiyuCurve(
            THREE,
            [
              [side * 0.012, 0.034, 0.176],
              [side * 0.015, -0.04, 0.18],
              [side * 0.028, -0.057, 0.184],
              [side * 0.016, -0.075, 0.18],
            ],
            0.0024,
          ),
        )
        parts.push(
          saiyuCurve(
            THREE,
            [
              [side * 0.027, 0.06, 0.178],
              [side * 0.062, 0.095, 0.175],
              [side * 0.105, 0.067, 0.163],
            ],
            0.0035,
          ),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x71634d, 1),
  )
  face.name = 'saiyu-nose-and-brows'
  head.getObjectByName('face-brow-left')!.visible = false
  head.getObjectByName('face-brow-right')!.visible = false
  head.add(face)
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-nose-tip', () =>
      new THREE.SphereGeometry(1, 16, 10).scale(0.021, 0.012, 0.012),
    ),
    materials.skin,
  )
  nose.position.set(0, -0.06, 0.183)
  head.add(nose)
}
