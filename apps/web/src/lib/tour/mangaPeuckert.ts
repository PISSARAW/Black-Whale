import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addPeuckertFaceAndHair(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const oldEye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    if (oldEye) oldEye.visible = false
    const eye = new THREE.Mesh(
      geometry(THREE, 'manga:peuckert-beady-eye', () => new THREE.CircleGeometry(0.008, 14)),
      materials.ink,
    )
    eye.name = 'peuckert-beady-eye'
    eye.position.set(side * 0.071, 0.012, 0.184)
    head.add(eye)
  }

  const oldNose = head.getObjectByName('face-relief')
  const oldMouth = head.getObjectByName('face-mouth')
  if (oldNose) oldNose.visible = false
  if (oldMouth) oldMouth.visible = false
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:peuckert-rumpole-nose', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.004, 0.073).rotateZ(-0.1).translate(-0.021, 0.004, 0),
        new THREE.PlaneGeometry(0.004, 0.073).rotateZ(0.1).translate(0.021, 0.004, 0),
        new THREE.TorusGeometry(0.027, 0.003, 6, 20, Math.PI).rotateZ(Math.PI),
        new THREE.CircleGeometry(0.004, 9).translate(-0.025, -0.01, 0),
        new THREE.CircleGeometry(0.004, 9).translate(0.025, -0.01, 0),
      ]),
    ),
    glow(0x76564b, 0.86),
  )
  nose.name = 'peuckert-rumpole-nose'
  nose.position.set(0, -0.036, 0.184)
  head.add(nose)

  const lips = new THREE.Mesh(
    geometry(THREE, 'manga:peuckert-thick-lips', () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.047, 0)
      shape.quadraticCurveTo(-0.022, 0.018, 0, 0.008)
      shape.quadraticCurveTo(0.022, 0.018, 0.047, 0)
      shape.quadraticCurveTo(0.023, -0.02, 0, -0.012)
      shape.quadraticCurveTo(-0.023, -0.02, -0.047, 0)
      return new THREE.ShapeGeometry(shape, 18)
    }),
    glow(0x875e56, 0.96),
  )
  lips.name = 'peuckert-thick-lips'
  lips.position.set(0, -0.11, 0.183)
  head.add(lips)

  const freckles = new THREE.Mesh(
    geometry(THREE, 'manga:peuckert-freckles', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1])
        for (let dot = 0; dot < 8; dot++) {
          const row = Math.floor(dot / 4)
          const column = dot % 4
          parts.push(
            new THREE.CircleGeometry(0.0025 + (dot % 2) * 0.0008, 8).translate(
              side * (0.035 + column * 0.022),
              -0.033 - row * 0.018 + (column % 2) * 0.004,
              0.185 - column * 0.003,
            ),
          )
        }
      return mergeHumanDetails(parts)
    }),
    glow(0x81584a, 0.92),
  )
  freckles.name = 'peuckert-nose-and-cheek-freckles'
  head.add(freckles)

  const combLines = new THREE.Mesh(
    geometry(THREE, 'manga:peuckert-left-part-comb-lines', () => {
      const parts: BufferGeometry[] = []
      for (let line = -5; line <= 5; line++) {
        const startX = -0.075 + line * 0.019
        parts.push(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(startX, 0.165, 0.151),
              new THREE.Vector3(startX + 0.035, 0.202, 0.105),
              new THREE.Vector3(startX + 0.078, 0.22, 0.035),
            ]),
            10,
            0.0015,
            4,
            false,
          ),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x8d8277, 0.76),
  )
  combLines.name = 'peuckert-neatly-combed-left-part'
  head.add(combLines)
}
