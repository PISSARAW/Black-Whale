import { PerspectiveCamera, Quaternion, Scene, Vector3, type Object3D } from 'three'
import { isTwoShot, otherHead, twoShotPlacement, type TwoShot } from './twoShotCamera'

type Close = 'face' | 'eyes' | 'front' | 'bust' | 'quarter' | 'tower'
export type Portrait = Close | TwoShot

/**
 * Telephoto framings outside the aura shell. `audience` turns the axis from the face's own
 * front toward the audience side of the stage, so the opponent never stands in the line.
 */
const FRAMING: Record<Close, { distance: number; aim: number; fov: number; audience: number }> =
  {
    face: { distance: 2.6, aim: -0.06, fov: 15, audience: 0.4 },
    eyes: { distance: 2.2, aim: -0.04, fov: 9.5, audience: 0.45 },
    front: { distance: 3.3, aim: -0.3, fov: 34, audience: 0.1 },
    /** Facing the hero from the audience side, for blows landed in contact. */
    quarter: { distance: 3.8, aim: -0.12, fov: 34, audience: 0.6 },
    bust: { distance: 2.8, aim: 0.02, fov: 26, audience: 0.15 },
    /** Facing the hero, wide and low enough to hold what towers behind him. */
    tower: { distance: 7.5, aim: 0.55, fov: 44, audience: 0.55 },
  }

let audit: Record<string, unknown> = {}
export const portraitAudit = () => audit

function heroHead(scene: Scene, hero: string): Object3D | undefined {
  let found: Object3D | undefined
  const heads: string[] = []
  scene.traverse((node) => {
    // Most rigs name the head `manga-head:<id>`; Kurapika's own rig uses `kurapika-head`.
    const own = node.name === `${hero}-head`
    if (!own && !node.name.startsWith('manga-head:')) return
    heads.push(node.name)
    if (!found && (own || node.name.includes(hero))) found = node
  })
  audit = { ...audit, heads }
  return found
}

/**
 * Before each main render, put the real 3D camera in front of the hero's face, using the
 * head's own front axis; the production camera is restored right after the render.
 */
export function installPortraitCamera(
  hero: string | (() => string),
  current: () => Portrait | null,
) {
  let restore: (() => void) | null = null
  /** The last placement: aura and post passes draw other scenes with the same lens. */
  let last: Placement | null = null
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    const mode = current()
    if (!mode) last = null
    if (!mode || !(camera instanceof PerspectiveCamera)) return
    const main = Boolean(scene.getObjectByName('fight-collision-boxes'))
    const head = main ? heroHead(scene, typeof hero === 'string' ? hero : hero()) : undefined
    if (main && !head) return
    if (!main && !last) return
    restore?.()
    const saved = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
      up: camera.up.clone(),
      fov: camera.fov,
    }
    const placed = !head
      ? last
      : isTwoShot(mode)
        ? twoShot(mode, head, otherHead(scene, head))
        : closeUp(mode, head)
    if (!placed) return
    if (head) last = placed
    const hidden = hideOffstage(scene, isTwoShot(mode))
    camera.position.copy(placed.position)
    camera.up.set(0, 1, 0)
    camera.fov = placed.fov
    camera.updateProjectionMatrix()
    camera.lookAt(placed.target)
    camera.updateMatrixWorld(true)
    audit = { ...audit, mode, head: head?.name ?? audit.head }
    restore = () => {
      for (const node of hidden) node.visible = true
      camera.position.copy(saved.position)
      camera.quaternion.copy(saved.quaternion)
      camera.up.copy(saved.up)
      camera.fov = saved.fov
      camera.updateProjectionMatrix()
      camera.updateMatrixWorld(true)
    }
  }
  Scene.prototype.onAfterRender = function () {
    restore?.()
    restore = null
  }
}

type Placement = { position: Vector3; target: Vector3; fov: number }

function twoShot(mode: TwoShot, head: Object3D, other: Object3D | undefined): Placement | null {
  return other ? twoShotPlacement(mode, head, other) : null
}

/** One face, along the head's own front axis turned toward the audience side. */
function closeUp(mode: Close, head: Object3D): Placement {
  const frame = FRAMING[mode]
  head.updateWorldMatrix(true, true)
  const origin = head.getWorldPosition(new Vector3())
  const rotation = head.getWorldQuaternion(new Quaternion())
  const front = new Vector3(0, 0, 1).applyQuaternion(rotation)
  front.y = 0
  front.normalize()
  const axis = front
    .clone()
    .multiplyScalar(1 - frame.audience)
    .add(new Vector3(0, 0, frame.audience))
    .normalize()
  // The eyes shot aims between the rig's own eyes, whatever the head's size or origin.
  const eyes = ['face-eye-left', 'face-eye-right']
    .map((name) => head.getObjectByName(name))
    .filter((node): node is Object3D => Boolean(node))
  const between =
    mode === 'eyes' && eyes.length === 2
      ? eyes[0]
          .getWorldPosition(new Vector3())
          .add(eyes[1].getWorldPosition(new Vector3()))
          .multiplyScalar(0.5)
      : null
  const target = between ?? origin.clone().add(new Vector3(0, frame.aim, 0))
  return { position: target.clone().addScaledVector(axis, frame.distance), target, fov: frame.fov }
}

/**
 * Rigs other features keep in the scene but outside the game camera's view (Secret Window's
 * listening silhouettes, On's dormant awakening figures) and, on wide angles, the aura skin.
 * A lens that circles the fighters must not reveal them.
 */
const OFFSTAGE = ['secret-window', 'on-awakening:']
function hideOffstage(scene: Scene, wide: boolean): Object3D[] {
  const hidden: Object3D[] = []
  const hide = (node: Object3D) => {
    node.visible = false
    hidden.push(node)
  }
  for (const node of scene.children)
    if (node.visible && OFFSTAGE.some((prefix) => node.name.startsWith(prefix))) hide(node)
  // The aura skin is drawn toward the game's own camera: seen from a wide angle it floats
  // beside the body. Close-ups keep it; two-shots film the bodies without it.
  if (wide) scene.traverse((node) => node.visible && node.name.startsWith('nen-skin-') && hide(node))
  return hidden
}
