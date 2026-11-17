import { Mesh, PerspectiveCamera, Scene } from 'three'
import type { Material, Object3D, ShaderMaterial } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import { applyCinematicFrame, type CinematicFrame } from './cinematicCamera'
import { stageFeitanFatality, solarEase } from './feitanFatalityPose'
import { feitanFatalityCamera } from './feitanFatalityCamera'
import { fatalityLighting } from './kurapikaFatalityLighting'
import { createFatalitySun, solarDissolve } from './feitanFatalitySun'
import { createChrolloSpectacleBlast } from './chrolloSpectacleBlast'

export function captureFeitanFatality(
  read: () => { state: FightState; age: number; camera: CinematicFrame },
) {
  const sun = createFatalitySun(),
    combustion = createChrolloSpectacleBlast(),
    materials = new WeakMap<Material, ShaderMaterial>()
  let renders = 0,
    restore: (() => void) | undefined
  let audit: Record<string, unknown> = {}
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || !scene.getObjectByName('fight-collision-boxes'))
      return
    restore?.()
    const frame = read(),
      up = camera.up.clone(),
      resetCamera = applyCinematicFrame(camera, frame.camera)
    const restores: Array<() => void> = []
    if (frame.age >= 0) {
      const pose = stageFeitanFatality(scene, frame.age)
      restores.push(pose.restore, fatalityLighting(scene, pose))
      for (const name of ['rising-sun:player', 'solar-heat:player']) {
        const native = scene.getObjectByName(name)
        if (!native) continue
        const visible = native.visible
        native.visible = false
        restores.push(() => {
          native.visible = visible
        })
      }
      if (frame.age >= 285)
        pose.victim.traverse((node: Object3D) => {
          if (!(node instanceof Mesh)) return
          const original = node.material
          const transform = (material: Material) => {
            const shader = materials.get(material) ?? solarDissolve(material)
            materials.set(material, shader)
            shader.uniforms.progress.value = solarEase((frame.age - 285) / 125)
            return shader
          }
          node.material = Array.isArray(original) ? original.map(transform) : transform(original)
          restores.push(() => {
            node.material = original
          })
        })
      sun.sync(pose.hero.position, frame.age)
      combustion.sync(frame.state, frame.age - 120)
      combustion.group.position.set(pose.victim.position.x, 1.1, 0.06)
      combustion.group.scale.set(0.5, 0.85, 0.5)
      combustion.group.visible = frame.age >= 300 && frame.age < 420
      scene.add(sun.root, combustion.group)
      combustion.group.updateMatrixWorld(true)
      sun.root.updateMatrixWorld(true)
      const shot = feitanFatalityCamera(camera, { ...pose, age: frame.age })
      audit = {
        age: frame.age,
        shot,
        armour: Boolean(frame.state.player.hatsuEffects.painPacker?.armour),
        nativeSun: Boolean(frame.state.player.hatsuEffects.painPacker?.sun),
        victimHealth: frame.state.opponent.health,
        winner: frame.state.winner,
        arenaDark: true,
      }
    }
    restore = () => {
      scene.remove(sun.root, combustion.group)
      restores.reverse().forEach((r) => r())
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
