import { Box3, PerspectiveCamera, Quaternion, Scene, Vector3 } from 'three'
import type { Object3D } from 'three'
import { fitCinematicView } from '../../src/lib/fighting/cinematicTrack'
import type { FightState } from '../../src/lib/fighting/types'
import type { CinematicFrame } from './cinematicCamera'
import type { LastContactShot } from './lastContactTrack'
import { ensureLastContactRoom } from './lastContactRoomScene'
import { presentLastContactFace } from './lastContactFaceRig'
import type { LastContactFaces } from './lastContactEmotions'
import { presentRangedAura } from './rangedAuraPresentation'

function actorOf(scene: Scene, side: string) {
  const actor = scene.children.find((n) => n.userData.fightSide === side)
  if (!actor) throw new Error(`Missing cinema actor: ${side}`)
  return actor
}
function aimDetail(camera: PerspectiveCamera, scene: Scene, shot: LastContactShot) {
  const actor = actorOf(scene, shot.side)
  actor.updateWorldMatrix(true, true)
  const head = actor.getObjectByName('face-eye-left')!.parent!
  const origin = head.getWorldPosition(new Vector3())
  const rotation = head.getWorldQuaternion(new Quaternion())
  const front = new Vector3(0, 0, 1).applyQuaternion(rotation)
  const target = origin.clone()
  const hidden: Object3D[] = []
  camera.up.set(0, 1, 0)
  camera.fov = 34
  if (shot.kind === 'face') {
    target.add(new Vector3(0, -0.025, 0.08).applyQuaternion(rotation))
    const distance = 1.75 - Math.min(1, shot.age / 18) * 0.16
    camera.position.copy(origin).add(new Vector3(0.07, 0.03, distance).applyQuaternion(rotation))
    camera.up.set(0, 1, 0).applyQuaternion(rotation)
    hidden.push(actorOf(scene, shot.side === 'player' ? 'opponent' : 'player'))
  } else {
    const left = actor.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
    const right = actor.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    const book = actor.getObjectByName('chrollo-open-book')
    if (shot.kind === 'book' && book?.visible) new Box3().setFromObject(book).getCenter(target)
    else target.copy(shot.kind === 'book' ? left : right).lerp(origin, 0.2)
    camera.position
      .copy(target)
      .addScaledVector(front, 2.2)
      .add(new Vector3(0.28, 0.14, 0.25))
    hidden.push(actorOf(scene, shot.side === 'player' ? 'opponent' : 'player'))
  }
  camera.lookAt(target)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
  return {
    hidden,
    head: head.name,
    alignment: front.dot(camera.position.clone().sub(origin).normalize()),
  }
}

/** Full-screen native choreography, with protected wide shots through physical confirms. */
export function captureLastContact(
  read: () => {
    state: FightState
    shot: LastContactShot
    faces: LastContactFaces
    wide: CinematicFrame
  },
) {
  let restore: (() => void) | undefined
  let renders = 0
  let audit: Record<string, unknown> = {}
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || !scene.getObjectByName('fight-collision-boxes'))
      return
    const frame = read()
    ensureLastContactRoom(scene, frame.state)
    restore?.()
    const position = camera.position.clone(),
      rotation = camera.quaternion.clone()
    const up = camera.up.clone(),
      fov = camera.fov,
      fog = scene.fog
    const aura = presentRangedAura(scene)
    const copies = presentCopyFall(scene, frame.state)
    const faces = (['player', 'opponent'] as const).map((side) =>
      presentLastContactFace(actorOf(scene, side), frame.faces[side]),
    )
    let hidden: Object3D[] = []
    if (frame.shot.kind === 'wide') {
      const view = fitCinematicView(frame.wide, frame.state, camera.aspect)
      camera.position.set(view.x, view.y, view.z)
      camera.up.set(0, 1, 0)
      camera.lookAt(view.x, view.lookY, 0)
      camera.updateMatrixWorld(true)
      audit = { kind: 'wide', frame: frame.state.frame }
    } else {
      const detail = aimDetail(camera, scene, frame.shot)
      hidden = detail.hidden
      scene.fog = null
      audit = { ...frame.shot, head: detail.head, frontalAlignment: detail.alignment }
    }
    audit = {
      ...audit,
      expressions: { player: frame.faces.player.emotion, opponent: frame.faces.opponent.emotion },
    }
    const visibility = hidden.map((n) => n.visible)
    hidden.forEach((n) => (n.visible = false))
    restore = () => {
      aura()
      copies()
      faces.forEach((restore) => restore())
      hidden.forEach((n, i) => (n.visible = visibility[i]))
      scene.fog = fog
      camera.position.copy(position)
      camera.quaternion.copy(rotation)
      camera.up.copy(up)
      camera.fov = fov
      camera.updateProjectionMatrix()
      camera.updateMatrixWorld(true)
    }
  }
  Scene.prototype.onAfterRender = function (_renderer, scene) {
    if (!scene.getObjectByName('fight-collision-boxes')) return
    restore?.()
    restore = undefined
    renders++
  }
  return { ready: () => renders > 3, audit: () => audit }
}

function presentCopyFall(scene: Scene, state: FightState) {
  const restores: Array<() => void> = []
  for (const entity of state.battlefield?.entities ?? []) {
    if (!entity.copy || entity.health > 0) continue
    const root = scene.getObjectByName(`prepared:${entity.id}`)
    if (!root) continue
    const rotation = root.quaternion.clone(),
      position = root.position.clone()
    root.rotation.z = Math.PI / 2
    root.position.y = 0.08
    root.updateWorldMatrix(true, true)
    restores.push(() => {
      root.quaternion.copy(rotation)
      root.position.copy(position)
    })
  }
  return () => restores.forEach((restore) => restore())
}
