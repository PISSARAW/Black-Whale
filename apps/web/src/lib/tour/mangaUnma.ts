import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addMangaDress } from './mangaRobes'

export function addUnmaFaceAndHair(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  const forehead = new THREE.Mesh(
    geometry(THREE, 'manga:unma-swept-forehead', () => new THREE.PlaneGeometry(0.235, 0.075)),
    materials.skin,
  )
  forehead.position.set(0, 0.115, 0.184)
  forehead.name = 'unma-swept-forehead'
  head.add(forehead)
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:unma-wide-flat-nose', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.003, 0.07, 0.002).translate(-0.026, -0.025, 0),
        new THREE.BoxGeometry(0.003, 0.07, 0.002).translate(0.026, -0.025, 0),
        new THREE.BoxGeometry(0.052, 0.003, 0.002).translate(0, -0.06, 0),
        new THREE.CircleGeometry(0.004, 8).translate(-0.018, -0.057, 0.002),
        new THREE.CircleGeometry(0.004, 8).translate(0.018, -0.057, 0.002),
      ]),
    ),
    materials.ink,
  )
  nose.position.z = 0.184
  nose.name = 'unma-wide-flat-nose'
  head.add(nose)

  const lines = new THREE.Mesh(
    geometry(THREE, 'manga:unma-combed-back-lines', () => {
      const parts = []
      for (const side of [-1, 1])
        for (let i = 0; i < 6; i++) {
          const x = side * (0.012 + i * 0.021)
          parts.push(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(x, 0.15, 0.187),
                new THREE.Vector3(side * (0.055 + i * 0.018), 0.215, 0.16),
                new THREE.Vector3(side * (0.12 + i * 0.012), 0.17, -0.035),
                new THREE.Vector3(side * (0.155 + i * 0.008), 0.04, -0.095),
              ]),
              18,
              0.0015,
              4,
              false,
            ),
          )
        }
      return mergeHumanDetails(parts)
    }),
    glow(0x8f7b58, 0.9),
  )
  lines.name = 'unma-combed-back-hair-lines'
  head.add(lines)
}

export function addUnmaFrillyDress(build: HumanClothesBuild): void {
  addMangaDress(build)
  const { THREE, geometry, figure, materials, frame } = build
  const ruffles = new THREE.Mesh(
    geometry(THREE, 'manga:unma-neck-ruffles', () => {
      const parts = []
      for (let row = 0; row < 3; row++) {
        const count = 12 + row * 2
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2
          const radius = 0.095 + row * 0.045
          parts.push(
            new THREE.SphereGeometry(1, 9, 6)
              .scale(0.041 + row * 0.004, 0.026, 0.025)
              .rotateZ(angle)
              .translate(
                Math.cos(angle) * radius,
                1.45 * frame.neck - row * 0.058,
                Math.sin(angle) * radius * 0.72,
              ),
          )
        }
      }
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  ruffles.name = 'unma-layered-neck-ruffles'
  figure.add(ruffles)

  for (const side of [-1, 1]) {
    const cuff = new THREE.Mesh(
      geometry(THREE, 'manga:unma-frill-cuff', () =>
        new THREE.TorusGeometry(0.062, 0.012, 5, 18).scale(1.15, 1, 0.75),
      ),
      materials.shirt,
    )
    cuff.position.set(side * 0.34, 0.91, 0)
    cuff.rotation.x = Math.PI / 2
    cuff.name = 'unma-frill-cuff'
    figure.add(cuff)
  }
}
