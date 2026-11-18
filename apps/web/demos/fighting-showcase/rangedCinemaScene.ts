import { PerspectiveCamera, Quaternion, Scene, Vector3 } from 'three'
import type { Object3D } from 'three'
import { fitCinematicView } from '../../src/lib/fighting/cinematicTrack'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'
import type { FightState } from '../../src/lib/fighting/types'
import type { CinematicFrame } from './cinematicCamera'
import type { RangedCinemaShot } from './rangedCinemaTrack'
import { presentRangedAura } from './rangedAuraPresentation'

function actorOf(scene: Scene, side: string) {
  const actor = scene.children.find((n) => n.userData.fightSide === side)
  if (!actor) throw new Error(`Missing cinema actor: ${side}`)
  return actor
}
function aimDetail(camera: PerspectiveCamera, scene: Scene, shot: RangedCinemaShot) {
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
  } else if (shot.kind === 'floor') {
    const hand = actor.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    target.copy(hand).lerp(origin, 0.4)
    camera.position.copy(target).add(new Vector3(0.65, 0.28, 2.45))
    hidden.push(actorOf(scene, 'opponent'))
  } else if (shot.kind === 'punch') {
    target.set(fightWorldX(shot.targetX!), 0.62, 0.1)
    camera.position.copy(target).add(new Vector3(-0.55, 0.18, 2.5))
    hidden.push(actorOf(scene, 'player'))
  } else {
    const left = actor.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
    const right = actor.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    const hands = left.lerp(right, 0.5)
    target.lerp(hands, shot.kind === 'hands' ? 1 : 0.4)
    camera.position
      .copy(target)
      .addScaledVector(front, shot.kind === 'hands' ? 1.4 : 3.2)
      .add(new Vector3(0.32, 0.18, 0.3))
    hidden.push(actorOf(scene, 'player'))
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

/** One full-screen camera; native victory owns its complete ten-second ending. */
export function captureRangedCinema(
  read: () => {
    state: FightState
    shot: RangedCinemaShot
    wide: CinematicFrame
    fatality: boolean
  },
) {
  let restore: (() => void) | undefined
  let renders = 0
  let audit: Record<string, unknown> = {}
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || !scene.getObjectByName('fight-collision-boxes'))
      return
    const frame = read()
    if (frame.fatality) {
      audit = { kind: 'native-franklin-fatality', ...scene.userData.victory }
      const age = Number(scene.userData.victory?.elapsed) * 60
      if (age >= 350 && age < 420) {
        const position = camera.position.clone()
        camera.position.z *= 1.28
        camera.updateMatrixWorld(true)
        restore = () => {
          camera.position.copy(position)
          camera.updateMatrixWorld(true)
        }
      }
      return
    }
    restore?.()
    const position = camera.position.clone(),
      rotation = camera.quaternion.clone()
    const up = camera.up.clone(),
      fov = camera.fov,
      fog = scene.fog
    const aura = presentRangedAura(scene)
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
    const visibility = hidden.map((n) => n.visible)
    hidden.forEach((n) => (n.visible = false))
    restore = () => {
      aura()
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
