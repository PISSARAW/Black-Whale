import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { addMangaKimono } from './mangaRobes'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addOitoFaceAndHair(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const oldEye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    oldEye?.removeFromParent()
    const eye = new THREE.Mesh(
      geometry(THREE, 'manga:oito-oval-eye', () =>
        new THREE.CircleGeometry(1, 22).scale(0.032, 0.021, 1),
      ),
      materials.ink,
    )
    eye.name = side < 0 ? 'face-eye-left' : 'face-eye-right'
    eye.userData.referenceFeature = 'oito-oval-eye'
    eye.position.set(side * 0.067, 0.013, 0.181)
    const sclera = new THREE.Mesh(
      geometry(THREE, 'manga:oito-eye-sclera', () =>
        new THREE.CircleGeometry(1, 22).scale(0.027, 0.016, 1),
      ),
      glow(0xfffcf5, 1),
    )
    sclera.name = 'eye-sclera'
    sclera.position.z = 0.001
    const iris = new THREE.Mesh(
      geometry(THREE, 'manga:oito-eye-iris', () =>
        new THREE.CircleGeometry(1, 22).scale(0.0095, 0.0125, 1),
      ),
      materials.ink,
    )
    iris.name = 'eye-pupil'
    iris.position.z = 0.002
    const shine = new THREE.Mesh(
      geometry(THREE, 'manga:oito-eye-shine', () => new THREE.CircleGeometry(0.0045, 10)),
      glow(0xfffcf5, 1),
    )
    shine.position.set(side * -0.003, 0.0045, 0.001)
    iris.add(shine)
    eye.add(sclera, iris)
    head.add(eye)
  }

  const waveLines = new THREE.Mesh(
    geometry(THREE, 'manga:oito-swept-wave-lines', () => {
      const lines = []
      for (let i = 0; i < 7; i++)
        lines.push(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(-0.105 + i * 0.026, 0.135, 0.158),
              new THREE.Vector3(-0.075 + i * 0.025, 0.19, 0.13),
              new THREE.Vector3(-0.02 + i * 0.022, 0.22, 0.045),
              new THREE.Vector3(0.055 + i * 0.017, 0.175, -0.08),
            ]),
            12,
            0.0017,
            4,
            false,
          ),
        )
      return mergeHumanDetails(lines)
    }),
    glow(0x55545b, 0.85),
  )
  waveLines.name = 'oito-swept-wave-lines'
  head.add(waveLines)

  const ponytail = new THREE.Mesh(
    geometry(
      THREE,
      'manga:oito-low-ponytail',
      () =>
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.055, -0.15),
            new THREE.Vector3(0.015, -0.04, -0.22),
            new THREE.Vector3(-0.015, -0.19, -0.24),
            new THREE.Vector3(0.025, -0.36, -0.17),
          ]),
          20,
          0.056,
          10,
          false,
        ),
    ),
    materials.hairInk,
  )
  ponytail.name = 'oito-low-ponytail'
  head.add(ponytail)
}

export function addOitoKimono(build: HumanClothesBuild): void {
  addMangaKimono(build)
  const { THREE, geometry, figure, materials } = build
  const motifs: BufferGeometry[] = []
  for (let row = 0; row < 5; row++)
    for (const side of [-1, 1]) {
      const x = side * (0.055 + (row % 2) * 0.055)
      const y = 0.34 + row * 0.19
      motifs.push(new THREE.CircleGeometry(0.012, 10).translate(x, y, 0.188))
      motifs.push(
        new THREE.CircleGeometry(0.008, 10)
          .scale(1.8, 0.65, 1)
          .rotateZ(side * 0.65)
          .translate(x + side * 0.018, y + 0.014, 0.189),
      )
    }
  const pattern = new THREE.Mesh(
    geometry(THREE, 'manga:oito-kimono-pattern', () => mergeHumanDetails(motifs)),
    materials.accent,
  )
  pattern.name = 'oito-kimono-pattern'
  figure.add(pattern)
}
