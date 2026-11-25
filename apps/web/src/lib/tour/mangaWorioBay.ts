import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addWorioBaySquareFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const oldBrow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    if (oldBrow) oldBrow.visible = false
    const brow = new THREE.Mesh(
      geometry(
        THREE,
        'manga:worio-prominent-brow',
        () => new THREE.BoxGeometry(0.085, 0.014, 0.006),
      ),
      materials.hairInk,
    )
    brow.name = 'worio-prominent-eyebrow'
    brow.position.set(side * 0.073, 0.071, 0.178)
    brow.rotation.z = side * 0.17
    head.add(brow)
  }

  const oldNose = head.getObjectByName('face-relief')
  if (oldNose) oldNose.visible = false
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:worio-large-nose', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.005, 0.105).rotateZ(-0.08).translate(-0.024, 0.003, 0),
        new THREE.PlaneGeometry(0.005, 0.105).rotateZ(0.08).translate(0.024, 0.003, 0),
        new THREE.TorusGeometry(0.033, 0.004, 6, 22, Math.PI).rotateZ(Math.PI),
        new THREE.CircleGeometry(0.005, 10).translate(-0.031, -0.012, 0),
        new THREE.CircleGeometry(0.005, 10).translate(0.031, -0.012, 0),
      ]),
    ),
    glow(0x705048, 0.88),
  )
  nose.name = 'worio-large-angular-nose'
  nose.position.set(0, -0.035, 0.184)
  head.add(nose)

  const jaw = new THREE.Mesh(
    geometry(THREE, 'manga:worio-square-jaw-contour', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.005, 0.105)
            .rotateZ(side * -0.08)
            .translate(side * 0.14, -0.105, 0.151),
        )
        parts.push(
          new THREE.PlaneGeometry(0.105, 0.005)
            .rotateZ(side * 0.06)
            .translate(side * 0.077, -0.164, 0.145),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x654b44, 0.76),
  )
  jaw.name = 'worio-large-square-jaw-lines'
  head.add(jaw)

  const crown = new THREE.Mesh(
    geometry(THREE, 'manga:worio-thick-hair-crown', () =>
      new THREE.SphereGeometry(0.18, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(
        1.08,
        0.72,
        0.94,
      ),
    ),
    materials.hairInk,
  )
  crown.name = 'worio-thick-side-parted-hair'
  crown.position.set(0.015, 0.145, -0.015)
  head.add(crown)

  const combLines = new THREE.Mesh(
    geometry(THREE, 'manga:worio-right-part-comb-lines', () => {
      const parts: BufferGeometry[] = []
      for (let line = -6; line <= 6; line++) {
        const startX = 0.066 + line * 0.018
        parts.push(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(startX, 0.14, 0.157),
              new THREE.Vector3(startX - 0.035, 0.185, 0.132),
              new THREE.Vector3(startX - 0.085, 0.216, 0.06),
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
    glow(0xa1846d, 0.78),
  )
  combLines.name = 'worio-neatly-combed-right-part'
  head.add(combLines)
}
