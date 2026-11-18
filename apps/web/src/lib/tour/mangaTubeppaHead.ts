import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { MangaHairKit } from './mangaHair'
import { mergeHumanDetails } from './humanDetailGeometry'
import type { Point3 } from './kurapikaGeometry'

function bowlCap(kit: MangaHairKit) {
  const { THREE } = kit
  const cap = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2)
  const positions = cap.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i)
    const radial = Math.max(0.0001, Math.hypot(x, z))
    const front = Math.max(0, z / radial)
    const edge = -0.035 + front ** 2 * (0.16 + (0.06 * x) / radial)
    const latitude = Math.acos(Math.min(1, positions.getY(i))) / (Math.PI / 2)
    const angle = latitude * Math.acos((edge - 0.04) / 0.23)
    positions.setXYZ(
      i,
      (x / radial) * Math.sin(angle) * 0.215,
      0.04 + Math.cos(angle) * 0.23,
      (z / radial) * Math.sin(angle) * 0.208,
    )
  }
  cap.computeVertexNormals()
  return cap
}

/** Broad, sharp-ended bowl with a swept part, leaving the eyes and ears exposed. */
export function mangaTubeppaBowl(kit: MangaHairKit) {
  kit.parts.push(bowlCap(kit))
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const z = 0.07 - i * 0.047
      kit.lock({
        width: 0.018,
        depth: 0.009,
        points: [
          [side * 0.15, 0.2, z],
          [side * 0.205, 0.12, z],
          [side * 0.214, 0.025, z],
          [side * 0.183, -0.05, z],
        ],
      })
    }
  // The short front locks break the edge without hanging over the spectacles.
  for (let i = 0; i < 5; i++)
    kit.lock({
      width: 0.022,
      depth: 0.009,
      points: [
        [0.024 - i * 0.016, 0.245, 0.06],
        [-0.016 - i * 0.024, 0.203, 0.164],
        [-0.035 - i * 0.029, 0.115, 0.184],
        [-0.021 - i * 0.03, 0.085 - i * 0.01, 0.187 - i * 0.004],
      ],
    })
}

function stroke(build: HumanHeadBuild, points: readonly Point3[], radius: number) {
  const { THREE } = build
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    24,
    radius,
    6,
    false,
  )
}

function glassesGeometry(build: HumanHeadBuild): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (const side of [-1, 1]) {
    const rim: Point3[] = [
      [0.023, 0.033, 0.198],
      [0.106, 0.033, 0.198],
      [0.119, 0.019, 0.195],
      [0.112, -0.018, 0.195],
      [0.029, -0.018, 0.198],
      [0.019, -0.003, 0.198],
      [0.023, 0.033, 0.198],
    ]
    parts.push(
      stroke(
        build,
        rim.map(([x, y, z]) => [side * x, y, z]),
        0.0026,
      ),
    )
    parts.push(
      stroke(
        build,
        [
          [side * 0.116, 0.023, 0.196],
          [side * 0.157, 0.027, 0.125],
          [side * 0.173, 0.012, 0.01],
        ],
        0.0025,
      ),
    )
  }
  parts.push(
    stroke(
      build,
      [
        [-0.019, 0.017, 0.198],
        [0, 0.023, 0.205],
        [0.019, 0.017, 0.198],
      ],
      0.0025,
    ),
  )
  return mergeHumanDetails(parts)
}

function longNose(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  const nose = head.getObjectByName('face-relief') as Mesh
  nose.geometry = geometry(THREE, 'manga:tubeppa-long-nose', () => {
    const shape = new THREE.BufferGeometry()
    shape.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          -0.009, 0.028, 0.173, 0.009, 0.028, 0.173, -0.014, -0.072, 0.176, 0.014, -0.072, 0.176, 0,
          -0.059, 0.219, 0, 0.024, 0.184,
        ],
        3,
      ),
    )
    shape.setIndex([0, 2, 4, 0, 4, 5, 5, 4, 3, 5, 3, 1, 2, 3, 4])
    shape.computeVertexNormals()
    return shape
  })
  nose.position.set(0, 0, 0)
  nose.material = materials.skin
}

export function addTubeppaFace(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  longNose(build, head)
  const glasses = new THREE.Mesh(
    geometry(THREE, 'manga:tubeppa-open-spectacles', () => glassesGeometry(build)),
    materials.ink,
  )
  glasses.name = 'signature:glasses-thin'
  head.add(glasses)
  const earrings = new THREE.Mesh(
    geometry(THREE, 'manga:tubeppa-earrings', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.SphereGeometry(0.011, 10, 8)
            .scale(0.8, 1, 0.7)
            .translate(side * 0.172, -0.055, 0.016),
        ),
      ),
    ),
    glow(build.profile.accent, 1),
  )
  earrings.name = 'signature:earrings'
  head.add(earrings)
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:tubeppa-angular-face', () =>
      mergeHumanDetails([
        stroke(
          build,
          [
            [-0.01, 0.018, 0.185],
            [-0.012, -0.035, 0.204],
            [-0.009, -0.066, 0.201],
          ],
          0.0013,
        ),
        stroke(
          build,
          [
            [-0.027, -0.135, 0.171],
            [0, -0.139, 0.174],
            [0.029, -0.135, 0.171],
          ],
          0.0011,
        ),
        ...[-1, 1].map((side) =>
          stroke(
            build,
            [
              [side * 0.047, -0.102, 0.174],
              [side * 0.056, -0.114, 0.171],
            ],
            0.0012,
          ),
        ),
      ]),
    ),
    glow(0x856650, 1),
  )
  folds.name = 'tubeppa-angular-face'
  head.add(folds)
}
