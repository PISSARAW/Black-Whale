import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import type { Point3 } from './kurapikaGeometry'
import { buildMangaHead } from './mangaHead'
import { luzurusSkullGeometry } from './mangaLuzurusGeometry'

function stroke(build: HumanHeadBuild, points: readonly Point3[], radius = 0.0018) {
  const { THREE } = build
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    24,
    radius,
    5,
    false,
  )
}

function pointedNose(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  const nose = head.getObjectByName('face-relief') as Mesh
  nose.geometry = geometry(THREE, 'manga:luzurus-long-pointed-nose', () => {
    const shape = new THREE.BufferGeometry()
    shape.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, 0.043, 0, -0.02, -0.034, 0, 0.02, -0.034, 0, 0, -0.027, 0.073],
        3,
      ),
    )
    shape.setIndex([0, 1, 3, 0, 3, 2, 1, 2, 3, 0, 2, 1])
    shape.computeVertexNormals()
    return shape
  })
  nose.material = materials.skin
  nose.position.set(0, -0.029, 0.174)
  const contour = new THREE.Mesh(
    geometry(THREE, 'manga:luzurus-nose-and-lids', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        parts.push(
          stroke(
            build,
            [
              [side * 0.012, -0.015, 0.185],
              [side * 0.023, -0.052, 0.185],
              [side * 0.014, -0.065, 0.184],
            ],
            0.0014,
          ),
        )
        parts.push(
          stroke(
            build,
            [
              [side * 0.04, -0.015, 0.175],
              [side * 0.069, -0.025, 0.175],
              [side * 0.105, -0.018, 0.173],
            ],
            0.0013,
          ),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x8d6b54, 1),
  )
  contour.name = 'luzurus-nose-and-lid-contours'
  head.add(contour)
}

function addStubble(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const source = head.getObjectByName('manga-face')!.children[1] as Mesh
  const face = new THREE.Mesh(source.geometry, source.material),
    ray = new THREE.Raycaster()
  const depth = (x: number, y: number) => {
    ray.set(new THREE.Vector3(x, y, 1), new THREE.Vector3(0, 0, -1))
    return (ray.intersectObject(face)[0]?.point.z ?? 0.17) + 0.002
  }
  const stubble = new THREE.Mesh(
    geometry(THREE, 'manga:luzurus-light-stubble', () => {
      const parts: BufferGeometry[] = []
      for (let i = -9; i <= 9; i++) {
        const x = i * 0.01,
          y = -0.204 + Math.abs(i) * 0.0045
        parts.push(
          new THREE.PlaneGeometry(0.0013, 0.008).rotateZ(i * -0.04).translate(x, y, depth(x, y)),
        )
      }
      for (let i = -5; i <= 5; i++)
        parts.push(
          new THREE.PlaneGeometry(0.0012, 0.005)
            .rotateZ(i * 0.08)
            .translate(i * 0.008, -0.087 + Math.abs(i) * 0.0007, 0.176),
        )
      return mergeHumanDetails(parts)
    }),
    glow(0x554538, 0.75),
  )
  stubble.name = 'luzurus-light-stubble'
  head.add(stubble)
}

export function addLuzurusFace(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness !== 'prince-luzurus') return
  const { THREE, geometry, materials } = build
  for (const side of [-1, 1]) {
    const eye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')!
    eye.scale.set(1.08, 1, 1)
    const brow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right') as Mesh
    brow.geometry = geometry(THREE, `manga:luzurus-arched-brow:${side}`, () =>
      stroke(
        build,
        [
          [side * -0.034, -0.003, 0],
          [side * -0.006, 0.008, 0.001],
          [side * 0.023, 0.004, 0],
          [side * 0.041, -0.006, -0.002],
        ],
        0.0027,
      ),
    )
    brow.scale.set(1, 1, 1)
    const tie = new THREE.Mesh(
      geometry(THREE, 'manga:luzurus-puff-tie', () =>
        new THREE.CylinderGeometry(0.024, 0.025, 0.052, 20).rotateZ(Math.PI / 2),
      ),
      build.glow(0xbfb6a0, 1),
    )
    tie.name = 'luzurus-puff-tie'
    tie.position.set(side * 0.205, 0.06, -0.012)
    head.add(tie)
  }
  const mouth = head.getObjectByName('face-mouth') as Mesh
  mouth.material = materials.ink
  mouth.position.y = -0.116
  pointedNose(build, head)
  addStubble(build, head)
}

export function buildLuzurusHead(build: HumanHeadBuild): Group {
  const { THREE, geometry } = build
  const head = buildMangaHead(build)
  const shape = geometry(THREE, 'manga:luzurus-rectangular-skull', () =>
    luzurusSkullGeometry(THREE),
  )
  for (const mesh of head.getObjectByName('manga-face')!.children) (mesh as Mesh).geometry = shape
  addLuzurusFace(build, head)
  return head
}
