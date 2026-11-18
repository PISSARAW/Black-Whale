import { PerspectiveCamera, Quaternion, Scene, Vector3, type Object3D } from 'three'

export type Portrait = 'face' | 'eyes' | 'front' | 'bust' | 'quarter'

/**
 * Telephoto framings outside the aura shell. `audience` turns the axis from the face's own
 * front toward the audience side of the stage, so the opponent never stands in the line.
 */
const FRAMING: Record<
  Portrait,
  { distance: number; aim: number; fov: number; audience: number }
> = {
  face: { distance: 2.6, aim: -0.06, fov: 15, audience: 0.4 },
  eyes: { distance: 2.2, aim: -0.04, fov: 9.5, audience: 0.45 },
  front: { distance: 3.3, aim: -0.3, fov: 34, audience: 0.1 },
  /** Facing the hero from the audience side, for blows landed in contact. */
  quarter: { distance: 3.8, aim: -0.12, fov: 34, audience: 0.6 },
  bust: { distance: 2.8, aim: 0.02, fov: 26, audience: 0.15 },
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
export function installPortraitCamera(hero: string, current: () => Portrait | null) {
  let restore: (() => void) | null = null
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    const mode = current()
    if (!mode || !(camera instanceof PerspectiveCamera)) return
    if (!scene.getObjectByName('fight-collision-boxes')) return
    const head = heroHead(scene, hero)
    if (!head) return
    restore?.()
    const saved = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
      up: camera.up.clone(),
      fov: camera.fov,
    }
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
    camera.position.copy(target).addScaledVector(axis, frame.distance)
    camera.up.set(0, 1, 0)
    camera.fov = frame.fov
    camera.updateProjectionMatrix()
    camera.lookAt(target)
    camera.updateMatrixWorld(true)
    audit = { ...audit, mode, head: head.name, origin: origin.toArray(), front: front.toArray() }
    restore = () => {
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
