import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addKeeneyFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  const ageLines = new THREE.Mesh(
    geometry(THREE, 'manga:keeney-age-lines', () => {
      const parts = []
      for (let i = 0; i < 3; i++)
        parts.push(
          new THREE.PlaneGeometry(0.085 - i * 0.012, 0.0022)
            .rotateZ(i % 2 ? 0.05 : -0.04)
            .translate(0, 0.125 + i * 0.024, 0.176 - i * 0.003),
        )
      for (const side of [-1, 1])
        for (let i = 0; i < 2; i++)
          parts.push(
            new THREE.PlaneGeometry(0.049 - i * 0.006, 0.0023)
              .rotateZ(side * (0.08 + i * 0.04))
              .translate(side * 0.066, -0.002 - i * 0.018, 0.18),
          )
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.058, 0.0032)
            .rotateZ(side * 0.14)
            .translate(side * 0.067, 0.024, 0.181),
        )
        parts.push(
          new THREE.PlaneGeometry(0.055, 0.003)
            .rotateZ(side * -0.1)
            .translate(side * 0.067, -0.014, 0.181),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x765d50, 0.8),
  )
  ageLines.name = 'keeney-age-lines'
  head.add(ageLines)

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      geometry(THREE, 'manga:keeney-protruding-ear', () =>
        new THREE.SphereGeometry(1, 12, 9).scale(0.044, 0.064, 0.022),
      ),
      materials.skin,
    )
    ear.name = 'keeney-protruding-ear'
    ear.position.set(side * 0.205, -0.026, 0.008)
    ear.rotation.z = side * -0.18
    head.add(ear)
  }

  const moustache = new THREE.Mesh(
    geometry(THREE, 'manga:keeney-pencil-moustache', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.048, 0.005).rotateZ(-0.06).translate(-0.025, 0, 0),
        new THREE.PlaneGeometry(0.048, 0.005).rotateZ(0.06).translate(0.025, 0, 0),
      ]),
    ),
    materials.hairInk,
  )
  moustache.name = 'keeney-pencil-moustache'
  moustache.position.set(0, -0.082, 0.181)
  head.add(moustache)
}
