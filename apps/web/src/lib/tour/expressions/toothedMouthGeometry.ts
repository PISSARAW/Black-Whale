import type { BufferGeometry, Mesh } from 'three'
import type { HumanFigureBuild } from '../humanFigure'
import type { ExpressionPose as FightFacePose } from './types'

const CACHE = new WeakMap<BufferGeometry, Map<string, BufferGeometry>>()
const TEETH = new WeakMap<Mesh, Mesh[]>()

function expressionGeometry(options: {
  THREE: HumanFigureBuild['THREE']
  source: BufferGeometry
  centre: { x: number; y: number }
  halfWidth: number
}) {
  const { THREE, source, centre, halfWidth } = options
  const key = `${centre.x}:${centre.y}:${halfWidth}`
  let variants = CACHE.get(source)
  if (!variants) {
    variants = new Map()
    CACHE.set(source, variants)
  }
  const cached = variants.get(key)
  if (cached) return cached
  const geometry = source.clone(),
    position = geometry.getAttribute('position')
  geometry.userData.sharedHuman = true
  geometry.morphTargetsRelative = true
  geometry.morphAttributes.position = [0, 1, 2].map((kind) => {
    const delta = new Float32Array(position.count * 3)
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i) - centre.x,
        y = position.getY(i) - centre.y
      const edge = Math.min(1, Math.abs(x) / halfWidth)
      const widen = [0.025, -0.1, 0.018][kind]
      const stretch = [0.12, -0.72, 0][kind]
      const curve =
        kind === 2 ? (edge * edge - 0.4) * 0.006 : (1 - edge * edge) * [-0.002, 0.008][kind]
      delta[i * 3] = x * widen
      delta[i * 3 + 1] = y * stretch + curve
    }
    return new THREE.Float32BufferAttribute(delta, 3)
  })
  geometry.computeBoundingSphere()
  variants.set(key, geometry)
  return geometry
}

/** One common deformation keeps the authored teeth inside the native grin. */
export function prepareToothedExpressionMouth(options: {
  THREE: HumanFigureBuild['THREE']
  mouth: Mesh
}) {
  const { THREE, mouth } = options
  mouth.geometry.computeBoundingBox()
  const box = mouth.geometry.boundingBox!,
    centre = box.getCenter(new THREE.Vector3())
  const halfWidth = Math.max(0.001, (box.max.x - box.min.x) / 2)
  const teeth = mouth.children.filter((node) => node.name === 'salesale-smile-teeth') as Mesh[]
  for (const mesh of [mouth, ...teeth]) {
    mesh.geometry = expressionGeometry({ THREE, source: mesh.geometry, centre, halfWidth })
    mesh.updateMorphTargets()
  }
  TEETH.set(mouth, teeth)
}

export function drawExpressionTeeth(mouth: Mesh | undefined, pose: FightFacePose) {
  if (!mouth) return
  const teeth = TEETH.get(mouth)
  if (!teeth) return
  for (const mesh of teeth) {
    const morphs = mesh.morphTargetInfluences!
    morphs[0] = pose.effort
    morphs[1] = pose.pain
    morphs[2] = pose.smile
  }
}

export function suspendExpressionTeeth(mouth: Mesh | undefined) {
  const teeth = mouth ? (TEETH.get(mouth) ?? []) : []
  const held = teeth.map((mesh) => mesh.morphTargetInfluences!.slice())
  for (const mesh of teeth) mesh.morphTargetInfluences!.fill(0)
  return () =>
    teeth.forEach((mesh, index) => {
      held[index].forEach((weight, i) => {
        mesh.morphTargetInfluences![i] = weight
      })
    })
}
