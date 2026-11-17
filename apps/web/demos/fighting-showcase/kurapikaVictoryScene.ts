import { Mesh, PerspectiveCamera, Quaternion, Scene, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import { applyCinematicFrame, type CinematicFrame } from './cinematicCamera'
import { reachCinematicHand } from './cinematicArmReach'
import { createVictoryJail } from './kurapikaVictoryChains'
import { kurapikaVictoryCamera } from './kurapikaVictoryCamera'

function poseKurapika(scene: Scene, options: { age: number; state: FightState }) {
  const { age } = options
  const head = scene.getObjectByName('kurapika-head')!
  const victimHead = scene.getObjectByName('manga-head:chrollo-lucilfer')!
  const hero = scene.children.find((node) => node.getObjectByName(head.name) === head)!
  const victim = scene.children.find(
    (node) => node.getObjectByName(victimHead.name) === victimHead,
  )!
  const restores: Array<() => void> = []
  const save = (node: Object3D) => {
    const p = node.position.clone(),
      q = node.quaternion.clone(),
      scale = node.scale.clone(),
      v = node.visible
    restores.push(() => {
      node.position.copy(p)
      node.quaternion.copy(q)
      node.scale.copy(scale)
      node.visible = v
    })
  }
  if (age >= 75 && age < 155) {
    save(hero)
    hero.visible = false
  }
  if (age < 75 || age >= 360) {
    save(victim)
    victim.visible = false
  }
  let handError = 0
  if (age >= 235) {
    const chest = hero.getObjectByName('fight-chest')!
    for (const node of [
      head,
      chest,
      chest.parent!,
      hero.getObjectByName('shoulder-right')!,
      hero.getObjectByName('elbow-right')!,
      hero.getObjectByName('hand-right')!,
    ])
      save(node)
    chest.rotation.set(0, 0, 0)
    chest.position.set(0, 0, 0)
    chest.parent!.rotation.set(0, 0, 0)
    head.rotation.set(0, 0, 0)
    hero.updateWorldMatrix(true, true)
    const q = head.getWorldQuaternion(new Quaternion()),
      origin = head.getWorldPosition(new Vector3())
    const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
    handError = reachCinematicHand(hero, {
      side: 'right',
      target: local(new Vector3(0.24, -0.58, 0.28)),
      pole: local(new Vector3(0.46, -0.58, 0.1)),
    })
  }
  if (age < 45 || age >= 360)
    hero.traverse((node) => {
      if (node.name.startsWith('nen-')) {
        save(node)
        node.visible = false
      }
    })
  const irisColours = ['face-eye-left', 'face-eye-right'].map((name) => {
    const iris = head.getObjectByName(name)!.getObjectByName('eye-pupil') as Mesh
    const material = iris.material as import('three').MeshBasicMaterial
    return material.color.getHexString()
  })
  return {
    hero,
    victim,
    head,
    audit: {
      handError,
      irisColours,
      emperorTime: Boolean(options.state.player.kurapika?.emperorTime),
      headNeutral: age >= 235,
    },
    restore: () => {
      restores.reverse().forEach((restore) => restore())
      hero.updateWorldMatrix(true, true)
    },
  }
}

export function captureKurapikaVictory(
  read: () => { state: FightState; age: number; camera: CinematicFrame },
) {
  const jail = createVictoryJail()
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
    let pose: ReturnType<typeof poseKurapika> | undefined
    let nativeChain: Object3D | undefined,
      nativeVisible = true
    if (frame.age >= 0) {
      pose = poseKurapika(scene, frame)
      const shot = kurapikaVictoryCamera(camera, { ...frame, ...pose })
      if (frame.age >= 90) {
        nativeChain = scene.getObjectByName('kurapika-chains:player')
        if (nativeChain) {
          nativeVisible = nativeChain.visible
          nativeChain.visible = false
        }
      }
      const chains = jail.sync({ ...frame, ...pose })
      scene.add(jail.root)
      jail.root.updateMatrixWorld(true)
      const front = new Vector3(0, 0, 1).applyQuaternion(
        pose.head.getWorldQuaternion(new Quaternion()),
      )
      const facing = front.dot(
        camera.position.clone().sub(pose.head.getWorldPosition(new Vector3())).normalize(),
      )
      audit = { age: frame.age, shot, ...pose.audit, ...chains, frontalAlignment: facing }
    }
    restore = () => {
      scene.remove(jail.root)
      if (nativeChain) nativeChain.visible = nativeVisible
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
