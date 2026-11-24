import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addMangaDress } from './mangaRobes'

export function addDuazulGentleFaceAndWaves(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  const forehead = new THREE.Mesh(
    geometry(THREE, 'manga:duazul-swept-forehead', () => new THREE.PlaneGeometry(0.225, 0.085)),
    materials.skin,
  )
  forehead.position.set(0, 0.115, 0.184)
  forehead.name = 'duazul-swept-forehead'
  head.add(forehead)
  const mouth = head.getObjectByName('face-mouth') as Mesh
  mouth.geometry = geometry(
    THREE,
    'manga:duazul-gentle-mouth',
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.034, 0, 0),
          new THREE.Vector3(-0.016, -0.004, 0),
          new THREE.Vector3(0, -0.006, 0),
          new THREE.Vector3(0.016, -0.004, 0),
          new THREE.Vector3(0.034, 0, 0),
        ]),
        24,
        0.0013,
        5,
        false,
      ),
  )
  mouth.position.set(0, -0.1, 0.172)

  for (const side of [-1, 1]) {
    const brow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    if (brow) {
      brow.rotation.z = side * -0.08
      brow.position.y += 0.008
    }
  }

  const waves = new THREE.Mesh(
    geometry(THREE, 'manga:duazul-fair-waves', () => {
      const parts = []
      for (const side of [-1, 1]) {
        for (let layer = 0; layer < 3; layer++)
          parts.push(
            new THREE.SphereGeometry(1, 12, 8)
              .scale(0.075 + layer * 0.01, 0.052, 0.055)
              .rotateZ(side * (0.35 - layer * 0.12))
              .translate(side * (0.13 + layer * 0.025), 0.08 - layer * 0.065, 0.02),
          )
        for (let strand = 0; strand < 4; strand++)
          parts.push(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(side * (0.015 + strand * 0.025), 0.19, 0.15),
                new THREE.Vector3(side * (0.065 + strand * 0.025), 0.22, 0.11),
                new THREE.Vector3(side * (0.115 + strand * 0.02), 0.15, 0.06),
                new THREE.Vector3(side * (0.15 + strand * 0.012), 0.05, 0.045),
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
    materials.hairInk,
  )
  waves.name = 'duazul-fair-wavy-updo'
  head.add(waves)

  const highlights = new THREE.Mesh(
    geometry(THREE, 'manga:duazul-wave-highlights', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.TorusGeometry(0.065, 0.0015, 4, 18, Math.PI * 0.8)
            .rotateZ(side > 0 ? -0.5 : Math.PI + 0.5)
            .translate(side * 0.14, 0.06, 0.072),
        ),
      ),
    ),
    glow(0xf3e8cb, 0.82),
  )
  highlights.name = 'duazul-wave-highlights'
  head.add(highlights)
}

export function addDuazulFormalDress(build: HumanClothesBuild): void {
  addMangaDress(build)
  const { THREE, geometry, figure, materials, frame } = build
  const collar = new THREE.Mesh(
    geometry(THREE, 'manga:duazul-standing-collar', () =>
      new THREE.CylinderGeometry(0.09, 0.105, 0.13, 24, 1, true).scale(1, 1, 0.82),
    ),
    materials.shirt,
  )
  collar.position.y = 1.45 * frame.neck
  collar.name = 'duazul-standing-collar'
  figure.add(collar)

  const seam = new THREE.Mesh(
    geometry(THREE, 'manga:duazul-collar-seam', () => new THREE.BoxGeometry(0.006, 0.12, 0.006)),
    materials.accent,
  )
  seam.position.set(0, 1.45 * frame.neck, 0.085)
  seam.name = 'duazul-collar-seam'
  figure.add(seam)
}
