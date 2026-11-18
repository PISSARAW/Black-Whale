import type { Group, Mesh, BufferGeometry } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { buildMangaHead } from './mangaHead'
import { addMorenaMarks } from './mangaMorenaMarks'
import { mergeHumanDetails } from './humanDetailGeometry'

function addEars(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  for (const node of [...head.children])
    if (!node.name && Math.abs(node.position.x) > 0.15) head.remove(node)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      geometry(THREE, 'manga:morena-ear', () =>
        new THREE.SphereGeometry(1, 20, 14).scale(0.023, 0.044, 0.023),
      ),
      materials.skin,
    )
    ear.name = side > 0 ? 'morena-ear-left' : 'morena-ear-right'
    ear.position.set(side * 0.18, -0.027, 0.027)
    head.add(ear)
    const fold = new THREE.Mesh(
      geometry(THREE, 'manga:morena-ear-fold', () =>
        new THREE.TorusGeometry(0.013, 0.0014, 5, 20, Math.PI * 1.45).scale(0.75, 1.9, 1),
      ),
      glow(0xb89a92, 1),
    )
    fold.position.set(side * 0.183, -0.025, 0.05)
    head.add(fold)
  }
}

function addHairStrands(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const strands = new THREE.Mesh(
    geometry(THREE, 'manga:morena-hair-strands', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1])
        for (let i = 0; i < 6; i++) {
          const length = 0.34 + Math.floor(i / 2) * 0.11
          const shift = (i % 2) * 0.008
          const layer = Math.floor(i / 2)
          const points = [
            [side * (0.025 + layer * 0.024 + shift), 0.22 - layer * 0.012, 0.056],
            [side * (0.145 + layer * 0.019 + shift), 0.03, 0.167 - layer * 0.018],
            [side * (0.17 + layer * 0.036 + shift), -length + 0.13, 0.168],
            [side * (0.17 + layer * 0.036 + shift), -length + 0.01, 0.209],
            [side * (0.115 + layer * 0.028), -length + 0.025, 0.234],
          ]
          parts.push(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(
                points.map(([x, y, z]) => new THREE.Vector3((x * 0.159) / 0.155, y, z)),
              ),
              40,
              0.0007,
              4,
              false,
            ),
          )
        }
      return mergeHumanDetails(parts)
    }),
    glow(0x344864, 1),
  )
  strands.name = 'morena-hair-strands'
  head.add(strands)
}

function addNoseAndLids(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const details = new THREE.Mesh(
    geometry(THREE, 'manga:morena-nose-and-lids', () => {
      const paths = [
        [
          [-0.003, -0.01, 0.178],
          [-0.008, -0.041, 0.181],
          [-0.002, -0.06, 0.18],
        ],
        [
          [-0.023, -0.067, 0.178],
          [-0.015, -0.07, 0.181],
          [-0.009, -0.069, 0.18],
        ],
        [
          [0.01, -0.069, 0.18],
          [0.016, -0.071, 0.181],
          [0.022, -0.067, 0.178],
        ],
      ]
      for (const side of [-1, 1])
        paths.push([
          [side * 0.036, 0.04, 0.175],
          [side * 0.068, 0.044, 0.176],
          [side * 0.099, 0.035, 0.175],
        ])
      return mergeHumanDetails(
        paths.map(
          (points) =>
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
              20,
              0.001,
              4,
              false,
            ),
        ),
      )
    }),
    glow(0x9c7970, 1),
  )
  details.name = 'morena-nose-and-lid-contours'
  head.add(details)
}

/** Morena keeps the common face names and skull, with her native almond eyes and soft smile. */
export function buildMorenaHead(build: HumanHeadBuild): Group {
  const { THREE, geometry, materials, glow } = build
  const head = buildMangaHead(build)
  addEars(build, head)
  addHairStrands(build, head)
  addNoseAndLids(build, head)
  for (const side of [-1, 1]) {
    const eye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')!
    eye.scale.set(1.12, 0.87, 1)
    const iris = eye.getObjectByName('eye-pupil') as Mesh
    iris.material = glow(0x795137, 1)
    iris.scale.set(0.94, 1.12, 1)
    const pupil = new THREE.Mesh(
      geometry(THREE, 'manga:morena-brown-eye-centre', () => new THREE.CircleGeometry(0.007, 20)),
      materials.ink,
    )
    pupil.position.z = 0.0006
    iris.add(pupil)
    const brow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')!
    brow.position.y = 0.065
    brow.rotation.z = side * -0.09
  }
  const mouth = head.getObjectByName('face-mouth') as Mesh
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.049, 0.004, 0),
    new THREE.Vector3(-0.025, -0.001, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.025, -0.001, 0),
    new THREE.Vector3(0.049, 0.004, 0),
  ])
  mouth.geometry = geometry(
    THREE,
    'manga:morena-soft-smile',
    () => new THREE.TubeGeometry(curve, 32, 0.0013, 5, false),
  )
  mouth.userData.expressionCurve = true
  mouth.position.set(0, -0.108, 0.169)
  addMorenaMarks(build, head)
  return head
}
