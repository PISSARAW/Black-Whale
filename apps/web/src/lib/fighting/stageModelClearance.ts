import type * as Three from 'three'
import type { FightLane } from './stageLane'

interface ModelClearanceOptions {
  THREE: typeof Three
  details: Three.Object3D
  floor: number
  halfWidth?: number
  frontCut?: number
}

interface Face {
  triangle: Three.Triangle
  bounds: Three.Box3
}

/** Above floor trim, up to the head of Biscuit's natural body. */
const BODY_BOTTOM = 0.15
const BODY_TOP = 2.7
const HALF_LENGTH = 6.4
const HALF_WIDTH = 1

function modelTriangles(options: ModelClearanceOptions): Three.Triangle[] {
  const { THREE, details, floor } = options
  const triangles: Three.Triangle[] = []
  details.updateMatrixWorld(true)
  details.traverse((object) => {
    const mesh = object as Three.Mesh
    if (!mesh.isMesh) return
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry
    const position = geometry.getAttribute('position')
    for (let index = 0; index < position.count; index += 3) {
      const vertices = [0, 1, 2].map((offset) =>
        new THREE.Vector3()
          .fromBufferAttribute(position, index + offset)
          .applyMatrix4(mesh.matrixWorld),
      )
      const heights = vertices.map((vertex) => vertex.y - floor)
      if (Math.max(...heights) < BODY_BOTTOM || Math.min(...heights) > BODY_TOP) continue
      triangles.push(new THREE.Triangle(vertices[0], vertices[1], vertices[2]))
    }
    if (geometry !== mesh.geometry) geometry.dispose()
  })
  return triangles
}

/** Project once per direction; candidate lanes then only translate their test prism. */
function projectedFaces(options: {
  THREE: typeof Three
  triangles: Three.Triangle[]
  direction: FightLane['direction']
}): Face[] {
  const {
    THREE,
    triangles,
    direction: [dx, dz],
  } = options
  return triangles.map((source) => {
    const triangle = source.clone()
    for (const vertex of [triangle.a, triangle.b, triangle.c]) {
      const { x, z } = vertex
      vertex.x = x * dx + z * dz
      vertex.z = -x * dz + z * dx
    }
    return {
      triangle,
      bounds: new THREE.Box3().setFromPoints([triangle.a, triangle.b, triangle.c]),
    }
  })
}

/** Tests real tour meshes, including rails and mouldings absent from blueprint solids. */
export function modelLaneClearance(options: ModelClearanceOptions): (lane: FightLane) => boolean {
  const { THREE, floor, halfWidth = HALF_WIDTH, frontCut = 1 } = options
  // Only retained triangles can obscure a fighter; the foreground has been cut away.
  if (frontCut <= -halfWidth) return () => true
  const triangles = modelTriangles(options)
  const directions = new Map<string, Face[]>()
  const volume = new THREE.Box3()
  return (lane) => {
    const [dx, dz] = lane.direction
    const key = `${dx}:${dz}`
    let faces = directions.get(key)
    if (!faces) {
      faces = projectedFaces({ THREE, triangles, direction: lane.direction })
      directions.set(key, faces)
    }
    const [cx, cz] = lane.centre
    const x = cx * dx + cz * dz
    const z = -cx * dz + cz * dx
    volume.min.set(x - HALF_LENGTH, floor + BODY_BOTTOM, z - halfWidth)
    volume.max.set(x + HALF_LENGTH, floor + BODY_TOP, z + Math.min(halfWidth, frontCut))
    return !faces.some(
      ({ bounds, triangle }) => volume.intersectsBox(bounds) && volume.intersectsTriangle(triangle),
    )
  }
}
