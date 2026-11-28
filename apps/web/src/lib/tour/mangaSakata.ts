import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addSakataFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const oldEye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    const oldBrow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    if (oldEye) oldEye.visible = false
    if (oldBrow) oldBrow.visible = false

    const eye = new THREE.Group()
    eye.name = 'sakata-square-eye'
    eye.position.set(side * 0.067, 0.008, 0.181)
    const outline = new THREE.Mesh(
      geometry(
        THREE,
        'manga:sakata-square-eye-outline',
        () => new THREE.PlaneGeometry(0.069, 0.041),
      ),
      materials.ink,
    )
    const white = new THREE.Mesh(
      geometry(THREE, 'manga:sakata-square-eye-white', () => new THREE.PlaneGeometry(0.059, 0.031)),
      glow(0xfffcf5, 1),
    )
    white.position.z = 0.001
    const pupil = new THREE.Mesh(
      geometry(THREE, 'manga:sakata-square-eye-pupil', () => new THREE.CircleGeometry(0.009, 16)),
      materials.ink,
    )
    pupil.position.set(0, -0.004, 0.002)
    eye.add(outline, white, pupil)
    head.add(eye)

    const brow = new THREE.Mesh(
      geometry(THREE, 'manga:sakata-short-thick-brow', () => new THREE.PlaneGeometry(0.044, 0.016)),
      materials.ink,
    )
    brow.name = 'sakata-short-thick-brow'
    brow.position.set(side * 0.066, 0.071, 0.181)
    brow.rotation.z = side * -0.08
    head.add(brow)
  }

  const oldNose = head.getObjectByName('face-relief')
  if (oldNose) oldNose.visible = false
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:sakata-mashed-nose', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.004, 0.037).translate(-0.018, -0.004, 0),
        new THREE.PlaneGeometry(0.004, 0.037).translate(0.018, -0.004, 0),
        new THREE.PlaneGeometry(0.04, 0.004).translate(0, -0.021, 0),
      ]),
    ),
    materials.ink,
  )
  nose.name = 'sakata-mashed-nose'
  nose.position.set(0, -0.039, 0.181)
  head.add(nose)
}
