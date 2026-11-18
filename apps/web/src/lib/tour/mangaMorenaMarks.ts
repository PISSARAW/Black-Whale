import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import type { Point3 } from './kurapikaGeometry'

function tube(build: HumanHeadBuild, points: readonly Point3[], radius: number) {
  const { THREE } = build
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    64,
    radius,
    5,
    false,
  )
}

function scarPoint(t: number, offset: number): Point3 {
  return [-0.022 + t * 0.096 + offset, 0.205 - t * 0.31, 0]
}

function addScars(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const source = head.getObjectByName('manga-face')!.children[1] as Mesh
  const face = new THREE.Mesh(source.geometry, source.material)
  const ray = new THREE.Raycaster()
  const pointOnSkin = (t: number, offset: number): Point3 => {
    const [x, y] = scarPoint(t, offset)
    ray.set(new THREE.Vector3(x, y, 1), new THREE.Vector3(0, 0, -1))
    return [x, y, (ray.intersectObject(face)[0]?.point.z ?? 0.17) + 0.0025]
  }
  for (const offset of [0, 0.021]) {
    const scar = new THREE.Mesh(
      geometry(THREE, `manga:morena-scar:${offset}`, () =>
        tube(
          build,
          Array.from({ length: 25 }, (_, i) => pointOnSkin(i / 24, offset)),
          0.0013,
        ),
      ),
      glow(0x976961, 1),
    )
    scar.name = 'morena-scar'
    head.add(scar)
  }
  const stitches = new THREE.Mesh(
    geometry(THREE, 'manga:morena-scar-punctures', () => {
      const parts: BufferGeometry[] = []
      for (const offset of [0, 0.021])
        for (let i = 1; i < 24; i++) {
          const [x, y, z] = pointOnSkin(i / 24, offset)
          parts.push(
            new THREE.SphereGeometry(0.0009, 5, 4)
              .scale(1, 1, 0.4)
              .translate(x - 0.003, y, z + 0.0008),
          )
          parts.push(
            new THREE.SphereGeometry(0.0009, 5, 4)
              .scale(1, 1, 0.4)
              .translate(x + 0.003, y - 0.001, z + 0.0008),
          )
        }
      return mergeHumanDetails(parts)
    }),
    glow(0x865e58, 1),
  )
  stitches.name = 'morena-scar-punctures'
  head.add(stitches)
}

function addThornCrown(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const crown = new THREE.Mesh(
    geometry(THREE, 'manga:morena-twisted-thorn-crown', () => {
      const parts: BufferGeometry[] = []
      for (const twist of [0, Math.PI]) {
        const points: Point3[] = Array.from({ length: 97 }, (_, i) => {
          const angle = (i / 96) * Math.PI * 2
          return [
            Math.sin(angle) * 0.174,
            0.126 + Math.sin(angle * 13 + twist) * 0.0026,
            Math.cos(angle) * 0.183,
          ]
        })
        parts.push(tube(build, points, 0.0023))
      }
      for (let i = 0; i < 42; i++) {
        const angle = (i / 42) * Math.PI * 2
        const point = new THREE.Vector3(Math.sin(angle) * 0.175, 0.126, Math.cos(angle) * 0.184)
        const direction = new THREE.Vector3(
          Math.sin(angle) * 0.55,
          i % 2 ? 1 : -1,
          Math.cos(angle) * 0.55,
        ).normalize()
        const thorn = new THREE.ConeGeometry(0.0028, 0.019, 5)
        thorn.applyQuaternion(
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction),
        )
        thorn.translate(...point.addScaledVector(direction, 0.007).toArray())
        parts.push(thorn)
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x39472b, 1),
  )
  crown.name = 'morena-thorn-crown'
  head.add(crown)
}

function addPiercings(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const piercings = new THREE.Group()
  piercings.name = 'morena-left-ear-piercings'
  const shape = geometry(THREE, 'manga:morena-small-hoop', () =>
    new THREE.TorusGeometry(0.006, 0.0012, 5, 14).rotateY(0.6),
  )
  for (let i = 0; i < 16; i++) {
    const angle = -0.45 + (i / 15) * 2.8
    const hoop = new THREE.Mesh(shape, glow(0xa5a8af, 1))
    hoop.name = 'morena-ear-hoop'
    hoop.position.set(
      0.183 + Math.cos(angle) * 0.022,
      0.007 - i * 0.0048,
      0.043 + Math.sin(angle) * 0.008,
    )
    hoop.rotation.z = -0.4 + i * 0.055
    piercings.add(hoop)
  }
  head.add(piercings)
}

export function addMorenaMarks(build: HumanHeadBuild, head: Group) {
  addScars(build, head)
  addThornCrown(build, head)
  addPiercings(build, head)
}
