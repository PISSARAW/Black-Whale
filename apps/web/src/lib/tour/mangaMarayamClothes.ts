import type { BufferGeometry, Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaChestSurface } from './mangaBody'
import { addMangaSuit } from './mangaTailoring'
import { mergeHumanDetails } from './humanDetailGeometry'

/** A double-breasted child's tuxedo, with an actual bow instead of an adult necktie. */
export function addMarayamTuxedo(build: HumanClothesBuild) {
  const { THREE, geometry, figure, frame, materials, profile } = build
  addMangaSuit(build)
  for (const name of ['manga-tie', 'manga-tie-knot', 'garment-seams'])
    figure.getObjectByName(name)?.removeFromParent()
  const bow = new THREE.Mesh(
    geometry(THREE, 'manga:marayam-bowtie', () => {
      const parts: BufferGeometry[] = [-1, 1].map((side) => {
        const wing = new THREE.Shape()
        wing.moveTo(side * 0.008, 0)
        wing.lineTo(side * 0.062, 0.024)
        wing.lineTo(side * 0.062, -0.024)
        wing.closePath()
        return new THREE.ExtrudeGeometry(wing, { depth: 0.018, bevelEnabled: false }).translate(
          0,
          0,
          -0.009,
        )
      })
      parts.push(new THREE.BoxGeometry(0.02, 0.027, 0.022).toNonIndexed())
      return mergeHumanDetails(parts)
    }),
    materials.dark,
  )
  bow.name = 'marayam-bowtie'
  const bowY = 1.43 * frame.neck
  bow.position.set(0, bowY, mangaChestSurface(profile, 0, bowY) + 0.025)
  figure.add(bow)
  const buttons = new THREE.Mesh(
    geometry(THREE, 'manga:marayam-tuxedo-buttons', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1])
        for (const y of [1.135, 0.99]) {
          const x = side * 0.086 * profile.shoulders * frame.width
          const py = y * frame.neck
          parts.push(
            new THREE.SphereGeometry(0.011, 10, 8)
              .scale(1, 1, 0.45)
              .translate(x, py - 1.12 * frame.neck, mangaChestSurface(profile, x, py) + 0.018),
          )
        }
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  buttons.name = 'marayam-double-breasted-buttons'
  buttons.position.y = 1.12 * frame.neck
  figure.add(buttons)
}

export function addMarayamShorts(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const skin = glow(profile.skin, 1),
    cloth = glow(profile.trousers, 1)
  const shorts = geometry(THREE, 'manga:marayam-short-leg', () =>
    new THREE.CylinderGeometry(0.122, 0.1, 0.31, 24).scale(1, 1, 0.88),
  )
  const hem = geometry(THREE, 'manga:marayam-shorts-hem', () =>
    new THREE.TorusGeometry(0.1, 0.0035, 5, 24).rotateX(Math.PI / 2).scale(1, 1, 0.88),
  )
  const sockShape = geometry(
    THREE,
    'manga:marayam-ankle-sock',
    () => new THREE.CylinderGeometry(0.039, 0.036, 0.055, 18),
  )
  for (let index = 0; index < 2; index++) {
    const thigh = limbs.legs[index].children[0],
      shin = limbs.knees[index].children[0]
    ;(thigh.children[1] as Mesh).material = skin
    ;(shin.children[1] as Mesh).material = skin
    thigh.scale.multiply(new THREE.Vector3(0.72, 1, 0.72))
    shin.scale.multiply(new THREE.Vector3(0.72, 1, 0.72))
    limbs.knees[index].children[1].scale.multiply(new THREE.Vector3(0.82, 1, 0.82))
    const short = new THREE.Mesh(shorts, cloth)
    short.name = 'marayam-shorts'
    short.position.y = -0.105
    limbs.legs[index].add(short)
    const edge = new THREE.Mesh(hem, glow(0x161a23, 1))
    edge.name = 'marayam-shorts-hem'
    edge.position.y = -0.26
    limbs.legs[index].add(edge)
    const sock = new THREE.Mesh(sockShape, glow(profile.shirt, 1))
    sock.name = 'marayam-ankle-sock'
    sock.position.y = -0.397
    limbs.knees[index].add(sock)
  }
}
