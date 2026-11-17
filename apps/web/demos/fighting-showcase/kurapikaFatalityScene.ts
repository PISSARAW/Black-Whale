import { Mesh, PerspectiveCamera, Scene } from 'three'
import type { Object3D } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import { applyCinematicFrame, type CinematicFrame } from './cinematicCamera'
import { createVictoryJail } from './kurapikaVictoryChains'
import { stageKurapikaFatality } from './kurapikaFatalityPose'
import { fatalityCamera } from './kurapikaFatalityCamera'
import { fatalityLighting } from './kurapikaFatalityLighting'
import { createFatalityDust } from './kurapikaFatalityDust'

export function captureKurapikaFatality(
  read: () => { state: FightState; age: number; camera: CinematicFrame },
) {
  const jail = createVictoryJail(),
    dust = createFatalityDust()
  let renders = 0,
    restore: (() => void) | undefined
  let audit: Record<string, unknown> = {}
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || !scene.getObjectByName('fight-collision-boxes'))
      return
    restore?.()
    const frame = read(),
      up = camera.up.clone()
    const resetCamera = applyCinematicFrame(camera, frame.camera)
    let pose: ReturnType<typeof stageKurapikaFatality> | undefined
    let light: (() => void) | undefined,
      native: Object3D | undefined,
      visible = true
    if (frame.age >= 0) {
      pose = stageKurapikaFatality(scene, frame.age)
      light = fatalityLighting(scene, pose)
      native = scene.getObjectByName('kurapika-chains:player')
      if (native) {
        visible = native.visible
        native.visible = false
      }
      const chains = jail.sync({ ...frame, ...pose, fatality: true })
      scene.add(jail.root)
      jail.root.updateMatrixWorld(true)
      dust.sync(pose.victim, frame.age)
      scene.add(dust.root)
      dust.root.updateMatrixWorld(true)
      const shot = fatalityCamera(camera, { ...pose, age: frame.age })
      const eyes = ['face-eye-left', 'face-eye-right'].map((name) => {
        const iris = pose!.head.getObjectByName(name)!.getObjectByName('eye-pupil') as Mesh
        return (iris.material as import('three').MeshBasicMaterial).color.getHexString()
      })
      audit = {
        age: frame.age,
        shot,
        lift: pose.lift,
        snap: pose.snap,
        fall: pose.fall,
        handError: pose.handError,
        irisColours: eyes,
        ...chains,
        arenaDark: true,
      }
    }
    restore = () => {
      scene.remove(jail.root, dust.root)
      light?.()
      if (native) native.visible = visible
      pose?.restore()
      camera.up.copy(up)
      resetCamera()
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
