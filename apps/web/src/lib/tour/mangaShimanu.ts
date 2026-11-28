import type { Group } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanHeadBuild } from './humanHead'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addShimanuMaidDress(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, frame, materials, profile } = build
  const { waist } = mangaBodyShape(profile)
  const skirt = new THREE.Mesh(
    geometry(THREE, 'manga:shimanu-maid-skirt', () =>
      new THREE.CylinderGeometry(waist * 1.25, waist * 1.95, 1.08 * frame.neck, 30).scale(
        1,
        1,
        0.78,
      ),
    ),
    materials.cloth,
  )
  skirt.name = 'shimanu-maid-skirt'
  skirt.position.y = 0.46 * frame.neck
  figure.add(skirt)

  mangaPanel(build, {
    name: 'shimanu-white-apron',
    points: [
      [-0.115, 1.04],
      [-0.16, 0.35],
      [0, 0.24],
      [0.16, 0.35],
      [0.115, 1.04],
    ],
    material: materials.shirt,
    lift: 0.014,
  })
  mangaPanel(build, {
    name: 'shimanu-maid-bib',
    points: [
      [-0.085, 1.43],
      [-0.105, 1.05],
      [0.105, 1.05],
      [0.085, 1.43],
    ],
    material: materials.shirt,
    lift: 0.013,
  })
  const waistBand = new THREE.Mesh(
    geometry(THREE, 'manga:shimanu-apron-band', () =>
      new THREE.CylinderGeometry(waist * 1.13, waist * 1.16, 0.065, 26).scale(1, 1, 0.77),
    ),
    materials.shirt,
  )
  waistBand.name = 'shimanu-apron-band'
  waistBand.position.y = 1.02 * frame.neck
  figure.add(waistBand)

  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:shimanu-maid-collar',
      () => new THREE.CylinderGeometry(0.072, 0.083, 0.058, 22, 1, true),
    ),
    materials.shirt,
  )
  collar.name = 'shimanu-maid-collar'
  collar.position.y = 1.46 * frame.neck
  figure.add(collar)
}

export function addShimanuHeadDetails(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, glow } = build
  const tie = new THREE.Mesh(
    geometry(THREE, 'manga:shimanu-hair-tie', () =>
      new THREE.CylinderGeometry(0.084, 0.084, 0.055, 18).rotateX(Math.PI / 2),
    ),
    glow(0xd7cdbd, 1),
  )
  tie.name = 'shimanu-hair-tie'
  tie.position.set(0, 0.025, -0.19)
  head.add(tie)

  const combed = new THREE.Mesh(
    geometry(THREE, 'manga:shimanu-combed-hair-lines', () => {
      const lines = []
      for (let i = -4; i <= 4; i++)
        lines.push(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(i * 0.026, 0.125 + Math.abs(i) * -0.004, 0.168),
              new THREE.Vector3(i * 0.022, 0.165, 0.15),
              new THREE.Vector3(i * 0.014, 0.207, 0.095),
              new THREE.Vector3(i * 0.008, 0.225, 0.025),
            ]),
            10,
            0.0014,
            4,
            false,
          ),
        )
      return mergeHumanDetails(lines)
    }),
    glow(0x77737a, 0.82),
  )
  combed.name = 'shimanu-combed-hair-lines'
  head.add(combed)
}
