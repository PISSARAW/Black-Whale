import { Box3, Quaternion, Vector3 } from 'three'
import type { Object3D, PerspectiveCamera, Scene } from 'three'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import type { CameraAnchor, CameraDetail, CameraPart } from './cinematicTypes'
import type { FightSide, FightState } from './types'

export function cameraNodeVisible(node: Object3D): boolean {
  for (let n: Object3D | null = node; n; n = n.parent) if (!n.visible) return false
  return true
}
interface FocusOptions {
  scene: Scene
  figureOf: (side: FightSide) => Object3D
}
interface Resolved {
  box: Box3
  head?: Object3D
}
const PART_SIZE: Record<CameraPart, [number, number]> = {
  head: [0.56, 0.63],
  hands: [0.8, 0.7],
  'left-hand': [0.5, 0.55],
  'right-hand': [0.5, 0.55],
  feet: [0.9, 0.65],
  chest: [1.05, 1.15],
  body: [1.5, 2.4],
}
function boxAt(position: Vector3, size: [number, number]): Box3 {
  return new Box3().setFromCenterAndSize(position, new Vector3(size[0], size[1], 0.2))
}
function headOf(actor: Object3D): Object3D | undefined {
  const named = actor.getObjectByName('kurapika-head')
  if (named) return named
  let head: Object3D | undefined
  actor.traverse((n) => {
    if (n.name.startsWith('manga-head:')) head = n
  })
  return head
}
function unionBones(actor: Object3D, box: Box3, names: string[]) {
  for (const name of names) {
    const bone = actor.getObjectByName(name)
    if (bone) box.union(boxAt(bone.getWorldPosition(new Vector3()), [0.45, 0.55]))
  }
}
const BONE_NAMES: Record<CameraPart, string> = {
  chest: 'fight-chest',
  'left-hand': 'hand-left',
  'right-hand': 'hand-right',
  hands: 'hand-right',
  feet: 'knee-right',
  head: 'fight-chest',
  body: '',
}
const PART_LIFT: Record<CameraPart, number> = {
  body: 1.2,
  chest: 1.05,
  head: 1.75,
  hands: 0,
  'left-hand': 0,
  'right-hand': 0,
  feet: 0,
}
function rigFocus(actor: Object3D, part: CameraPart): Resolved | null {
  if (!cameraNodeVisible(actor)) return null
  actor.updateWorldMatrix(true, true)
  const head = headOf(actor)
  if (part === 'head' && head)
    return { box: boxAt(head.getWorldPosition(new Vector3()), PART_SIZE.head), head }
  const bone = actor.getObjectByName(BONE_NAMES[part]) ?? actor
  const at = bone.localToWorld(new Vector3(0, PART_LIFT[part], 0))
  const box = boxAt(at, PART_SIZE[part])
  if (part === 'hands') unionBones(actor, box, ['hand-left'])
  if (part === 'body') bodyBones(actor, box, head)
  return { box }
}
function bodyBones(actor: Object3D, box: Box3, head?: Object3D) {
  if (head) box.union(boxAt(head.getWorldPosition(new Vector3()), PART_SIZE.head))
  unionBones(actor, box, ['hand-left', 'hand-right', 'knee-left', 'knee-right'])
}
function namedAnchor(anchor: Extract<CameraAnchor, { type: 'node' }>, options: FocusOptions) {
  const root = anchor.actor ? options.figureOf(anchor.actor) : options.scene
  return (
    root.getObjectByName(anchor.name) ?? root.getObjectByName(anchor.name.replace(/:player$/, ''))
  )
}
function nodeFocus(
  anchor: Extract<CameraAnchor, { type: 'node' }>,
  options: FocusOptions,
  state: FightState,
): Resolved | null {
  const object = namedAnchor(anchor, options)
  if (!object || !cameraNodeVisible(object))
    return anchor.fallback ? resolveCameraAnchor(anchor.fallback, options, state) : null
  object.updateWorldMatrix(true, true)
  const box = new Box3().setFromObject(object)
  // Named props may contain a transient empty mesh; do not let it invalidate the camera.
  if (box.isEmpty() || !Number.isFinite(box.max.length()))
    return {
      box: boxAt(object.getWorldPosition(new Vector3()), [anchor.size ?? 0.6, anchor.size ?? 0.6]),
    }
  return { box: box.expandByScalar(0.06) }
}
function entityFocus(
  anchor: Extract<CameraAnchor, { type: 'entity' }>,
  options: FocusOptions,
  state: FightState,
): Resolved | null {
  const e = state.battlefield?.entities.find((e) => e.id === anchor.id) ?? anchor
  const object = options.scene.getObjectByName(`prepared:${anchor.id}`)
  if (object && cameraNodeVisible(object))
    return nodeFocus({ type: 'node', name: object.name }, options, state)
  return { box: boxAt(new Vector3(fightWorldX(e.x), fightWorldY(e.y) + 0.4, 0.2), [0.95, 0.95]) }
}
function projectileFocus(
  anchor: Extract<CameraAnchor, { type: 'projectile' }>,
  options: FocusOptions,
  state: FightState,
): Resolved | null {
  const p = state.projectiles.find((p) => p.id === anchor.id) ?? anchor
  const name = `fight-projectile:${anchor.id}`
  const object = options.scene.getObjectByName(name)
  if (object && cameraNodeVisible(object)) return nodeFocus({ type: 'node', name }, options, state)
  return { box: boxAt(new Vector3(fightWorldX(p.x), fightWorldY(p.y), 0.2), [0.65, 0.65]) }
}
export function resolveCameraAnchor(
  anchor: CameraAnchor,
  options: FocusOptions,
  state: FightState,
): Resolved | null {
  switch (anchor.type) {
    case 'rig':
      return rigFocus(options.figureOf(anchor.side), anchor.part)
    case 'node':
      return nodeFocus(anchor, options, state)
    case 'entity':
      return entityFocus(anchor, options, state)
    case 'projectile':
      return projectileFocus(anchor, options, state)
    case 'point':
      return {
        box: boxAt(new Vector3(fightWorldX(anchor.x), fightWorldY(anchor.y), 0.2), [
          anchor.size ?? 0.5,
          anchor.size ?? 0.5,
        ]),
      }
  }
}
/** Fit the entire subject (or both contacts of a transfer) into the responsive detail viewport. */
export function aimCinematicFocus(
  options: FocusOptions & { camera: PerspectiveCamera; state: FightState; detail: CameraDetail },
): boolean {
  const { camera, state, detail } = options
  const anchors = detail.anchors ?? [{ type: 'rig', side: detail.side, part: 'body' } as const]
  const resolved = anchors
    .map((a) => resolveCameraAnchor(a, options, state))
    .filter((r): r is Resolved => Boolean(r))
  if (!resolved.length) return false
  const box = resolved.reduce((box, r) => box.union(r.box), new Box3())
  const centre = box.getCenter(new Vector3())
  const size = box.getSize(new Vector3())
  const tangent = Math.tan((camera.fov * Math.PI) / 360)
  const distance =
    Math.max(0.8, size.y / (2 * tangent * 0.78), size.x / (2 * tangent * camera.aspect * 0.85)) +
    size.z / 2
  const head = resolved.find((r) => r.head)?.head
  const rotation =
    head && detail.frontal ? head.getWorldQuaternion(new Quaternion()) : new Quaternion()
  const rise = Math.tan(((detail.elevation ?? 0) * Math.PI) / 180) * distance
  const offset = new Vector3(0, 0.035 + rise, distance).applyQuaternion(rotation)
  camera.position.copy(centre).add(offset)
  camera.lookAt(centre)
  camera.far = Math.max(100, distance + 20)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
  return true
}
